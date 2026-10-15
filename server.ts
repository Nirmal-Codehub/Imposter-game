import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import {
  GamePhase,
  Player,
  PlayerScore,
  AnswerItem,
  VoteItem,
  RoomSettings,
  PublicGameState,
  PlayerClientState,
  ClientMessage,
  ServerMessage
} from './src/types/game.ts';
import { getRandomQuestionPair } from './src/lib/questionPacks.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';

// Internal Server-Authoritative State
interface InternalPlayer extends Player {
  sessionToken: string;
  ws?: WebSocket;
}

interface InternalRoom {
  roomCode: string;
  roomName: string;
  phase: GamePhase;
  roundNumber: number;
  settings: RoomSettings;
  hostPlayerId: string;
  hostToken: string;
  players: Map<string, InternalPlayer>;
  
  // Question configuration
  commonQuestion: string;
  imposterQuestion: string;
  imposterPlayerIds: Set<string>;
  
  // Private assigned questions (playerId -> question)
  playerQuestions: Map<string, string>;

  // Submissions for current round
  submittedAnswers: Map<string, string>; // playerId -> answerText
  submittedVotes: Map<string, string>; // playerId -> votedForPlayerId

  // Tiebreaker tracking
  tiedPlayerIds: string[];
  isTiebreakerRound: boolean;

  // Discussion Timer
  timerRemaining: number;
  timerInterval: NodeJS.Timeout | null;
  timerIsRunning: boolean;

  // Results
  revealedVotes: VoteItem[];
  eliminatedPlayerId: string | null;
  eliminatedPlayerName: string | null;
  imposterCaught: boolean;
  wasTieUnresolved: boolean;
  roundScores: PlayerScore[];
  cumulativeScores: Map<string, { totalScore: number; correctVotes: number }>;
  
  lastActivity: number;
}

const rooms = new Map<string, InternalRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateToken(): string {
  return crypto.randomUUID();
}

// Default settings
const DEFAULT_SETTINGS: RoomSettings = {
  imposterCount: 1,
  discussionSeconds: 120,
  votingSeconds: 60,
  timersEnabled: true,
  allowHostToPlay: true,
  autoAssignImposter: false
};

// Periodic cleanup of inactive rooms (older than 2 hours)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActivity > 2 * 60 * 60 * 1000) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      rooms.delete(code);
    }
  }
}, 15 * 60 * 1000);

// Stop and reset timer
function stopTimer(room: InternalRoom) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
  room.timerIsRunning = false;
}

// Broadcast state to all connected players in a room
function broadcastRoomState(room: InternalRoom, notification?: { message: string; variant?: 'info' | 'success' | 'warning' | 'error' }) {
  room.lastActivity = Date.now();

  for (const player of room.players.values()) {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      const clientPayload = buildPlayerClientState(room, player.id);
      const msg: ServerMessage = {
        type: 'STATE_UPDATE',
        payload: clientPayload
      };
      player.ws.send(JSON.stringify(msg));

      if (notification) {
        const notifMsg: ServerMessage = {
          type: 'NOTIFICATION',
          message: notification.message,
          variant: notification.variant
        };
        player.ws.send(JSON.stringify(notifMsg));
      }
    }
  }
}

// Build sanitized client state. NEVER leak other players' questions, roles, or unrevealed answers!
function buildPlayerClientState(room: InternalRoom, requestingPlayerId: string): PlayerClientState {
  const me = room.players.get(requestingPlayerId);
  const isHost = room.hostPlayerId === requestingPlayerId;

  const playerList: Player[] = Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    isHost: p.isHost,
    isReady: p.isReady,
    isConnected: p.isConnected,
    joinedAt: p.joinedAt
  }));

  const eligibleAnswerPlayers = Array.from(room.players.values()).filter(p => room.settings.allowHostToPlay || !p.isHost);
  const eligibleVotePlayers = eligibleAnswerPlayers;

  const publicState: PublicGameState = {
    roomCode: room.roomCode,
    roomName: room.roomName,
    phase: room.phase,
    roundNumber: room.roundNumber,
    settings: { ...room.settings },
    hostPlayerId: room.hostPlayerId,
    players: playerList,
    submittedAnswerCount: room.submittedAnswers.size,
    totalEligibleAnswers: eligibleAnswerPlayers.length,
    hasSubmittedAnswerList: Array.from(room.submittedAnswers.keys()),
    timerRemainingSeconds: room.timerRemaining,
    timerIsRunning: room.timerIsRunning,
    submittedVoteCount: room.submittedVotes.size,
    totalEligibleVotes: eligibleVotePlayers.length,
    hasSubmittedVoteList: Array.from(room.submittedVotes.keys()),
    tiedPlayerIds: room.tiedPlayerIds.length > 0 ? room.tiedPlayerIds : undefined
  };

  // Revealed answers and questions (available during REVEAL, DISCUSSION, VOTING, RESULTS, LEADERBOARD)
  const isAnswersRevealedPhase = ['REVEAL', 'DISCUSSION', 'VOTING', 'TIEBREAKER_DISCUSSION', 'TIEBREAKER_VOTING', 'RESULTS', 'LEADERBOARD'].includes(room.phase);
  if (isAnswersRevealedPhase) {
    publicState.revealedAnswers = Array.from(room.submittedAnswers.entries()).map(([pId, answerText]) => {
      const pl = room.players.get(pId);
      return {
        playerId: pId,
        playerName: pl ? pl.name : 'Unknown',
        targetPlayerName: answerText
      };
    });
    publicState.revealedCommonQuestion = room.commonQuestion;
    publicState.revealedImposterQuestion = room.imposterQuestion;
  }

  // Revealed votes, roles, and scores (available in RESULTS and LEADERBOARD)
  const isResultsPhase = ['RESULTS', 'LEADERBOARD'].includes(room.phase);
  if (isResultsPhase) {
    publicState.revealedVotes = room.revealedVotes;
    publicState.eliminatedPlayerId = room.eliminatedPlayerId;
    publicState.eliminatedPlayerName = room.eliminatedPlayerName;
    publicState.actualImposterIds = Array.from(room.imposterPlayerIds);
    publicState.imposterCaught = room.imposterCaught;
    publicState.wasTieUnresolved = room.wasTieUnresolved;
    publicState.roundScores = room.roundScores;

    // Cumulative leaderboard
    publicState.cumulativeLeaderboard = Array.from(room.players.values()).map(p => {
      const cum = room.cumulativeScores.get(p.id) || { totalScore: 0, correctVotes: 0 };
      const roundScoreObj = room.roundScores.find(rs => rs.playerId === p.id);
      return {
        playerId: p.id,
        playerName: p.name,
        roundScore: roundScoreObj ? roundScoreObj.roundScore : 0,
        totalScore: cum.totalScore,
        correctVotes: cum.correctVotes,
        scoreReasons: roundScoreObj ? roundScoreObj.scoreReasons : []
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }

  const clientState: PlayerClientState = {
    room: publicState,
    me: me ? {
      id: me.id,
      name: me.name,
      avatar: me.avatar,
      isHost: me.isHost,
      isReady: me.isReady,
      isConnected: me.isConnected,
      joinedAt: me.joinedAt
    } : {
      id: requestingPlayerId,
      name: 'Spectator',
      avatar: '👀',
      isHost: false,
      isReady: false,
      isConnected: false,
      joinedAt: Date.now()
    },
    isHost
  };

  // Private data for this specific player during ANSWERING:
  if (room.phase === 'ANSWERING') {
    clientState.privateAssignedQuestion = room.playerQuestions.get(requestingPlayerId);
    clientState.mySubmittedAnswer = room.submittedAnswers.get(requestingPlayerId);
  }

  // Private data for this specific player during VOTING:
  if (room.phase === 'VOTING' || room.phase === 'TIEBREAKER_VOTING') {
    clientState.mySubmittedVoteId = room.submittedVotes.get(requestingPlayerId);
  }

  // Private host panel view:
  if (isHost) {
    clientState.hostSelectedImposterIds = Array.from(room.imposterPlayerIds);
    clientState.hostCommonQuestionDraft = room.commonQuestion;
    clientState.hostImposterQuestionDraft = room.imposterQuestion;
  }

  return clientState;
}

// Calculate scores authoritatively
function calculateScores(room: InternalRoom) {
  const isCaught = room.imposterCaught;
  const eliminatedId = room.eliminatedPlayerId;
  const actualImposters = room.imposterPlayerIds;

  const roundScores: PlayerScore[] = [];

  for (const player of room.players.values()) {
    let delta = 0;
    const reasons: string[] = [];
    const isImposter = actualImposters.has(player.id);
    const voteTargetId = room.submittedVotes.get(player.id);
    let votedCorrectly = false;

    if (!isImposter) {
      if (voteTargetId) {
        if (actualImposters.has(voteTargetId)) {
          delta += 2;
          votedCorrectly = true;
          reasons.push('Voted for the Imposter (+2)');
        } else {
          delta -= 1;
          reasons.push('Voted for an innocent player (-1)');
        }
      } else {
        reasons.push('Did not submit a vote (0)');
      }

      // Team success bonus: +1 point if imposter was caught and this player voted correctly
      if (isCaught && votedCorrectly) {
        delta += 1;
        reasons.push('Team Victory Bonus: Imposter caught (+1)');
      }

      // Penalty if this innocent player got eliminated
      if (player.id === eliminatedId) {
        delta -= 2;
        reasons.push('Falsely accused and eliminated (-2)');
      }
    } else {
      // Imposter scoring
      if (!isCaught && eliminatedId !== player.id) {
        delta += 3;
        reasons.push('Imposter deceived the group & survived (+3)');
      } else {
        reasons.push('Imposter was caught by the group (0)');
      }
    }

    const currentCum = room.cumulativeScores.get(player.id) || { totalScore: 0, correctVotes: 0 };
    const newTotal = currentCum.totalScore + delta;
    const newCorrectVotes = currentCum.correctVotes + (votedCorrectly ? 1 : 0);

    room.cumulativeScores.set(player.id, {
      totalScore: newTotal,
      correctVotes: newCorrectVotes
    });

    roundScores.push({
      playerId: player.id,
      playerName: player.name,
      roundScore: delta,
      totalScore: newTotal,
      correctVotes: newCorrectVotes,
      scoreReasons: reasons
    });
  }

  room.roundScores = roundScores;
}

// Resolve votes and handle ties or elimination
function processVoteResults(room: InternalRoom) {
  stopTimer(room);

  // Build revealed votes list
  const revealedVotes: VoteItem[] = [];
  const voteTallies: Record<string, number> = {};

  for (const [voterId, targetId] of room.submittedVotes.entries()) {
    const voter = room.players.get(voterId);
    const target = room.players.get(targetId);
    if (voter && target) {
      revealedVotes.push({
        voterId,
        voterName: voter.name,
        votedForId: targetId,
        votedForName: target.name
      });
      voteTallies[targetId] = (voteTallies[targetId] || 0) + 1;
    }
  }

  room.revealedVotes = revealedVotes;

  // Determine highest vote count
  let maxVotes = -1;
  for (const count of Object.values(voteTallies)) {
    if (count > maxVotes) maxVotes = count;
  }

  const topVotedPlayerIds = Object.keys(voteTallies).filter(id => voteTallies[id] === maxVotes);

  // If no one received votes
  if (maxVotes <= 0 || topVotedPlayerIds.length === 0) {
    room.eliminatedPlayerId = null;
    room.eliminatedPlayerName = 'Nobody';
    room.imposterCaught = false;
    room.wasTieUnresolved = false;
    room.phase = 'RESULTS';
    calculateScores(room);
    broadcastRoomState(room, { message: 'Voting ended with no votes cast.', variant: 'warning' });
    return;
  }

  // TIE HANDLING
  if (topVotedPlayerIds.length > 1) {
    if (room.isTiebreakerRound) {
      // Tie in revote -> imposter escapes! Round ends
      room.eliminatedPlayerId = null;
      room.eliminatedPlayerName = 'Nobody (Tie Unresolved)';
      room.imposterCaught = false;
      room.wasTieUnresolved = true;
      room.phase = 'RESULTS';
      calculateScores(room);
      broadcastRoomState(room, {
        message: 'The revote ended in another tie! The imposter escapes unpunished!',
        variant: 'warning'
      });
      return;
    } else {
      // First tie: Enter TIEBREAKER_DISCUSSION
      room.tiedPlayerIds = topVotedPlayerIds;
      room.isTiebreakerRound = true;
      room.submittedVotes.clear(); // Clear for revote
      room.phase = 'TIEBREAKER_DISCUSSION';
      room.timerRemaining = 45; // 45 seconds to discuss between tied players
      room.timerIsRunning = true;

      const tiedNames = topVotedPlayerIds.map(id => room.players.get(id)?.name || 'Player').join(' and ');

      broadcastRoomState(room, {
        message: `Tie vote between ${tiedNames}! 45-second emergency discussion before revote.`,
        variant: 'info'
      });

      startDiscussionTimer(room, () => {
        // Move to tiebreaker voting when discussion ends
        room.phase = 'TIEBREAKER_VOTING';
        room.timerRemaining = room.settings.votingSeconds || 45;
        room.timerIsRunning = true;
        broadcastRoomState(room, {
          message: 'Tiebreaker revote started! Vote between the tied suspects.',
          variant: 'info'
        });
      });
      return;
    }
  }

  // Single player with highest votes
  const eliminatedId = topVotedPlayerIds[0];
  const eliminatedPlayer = room.players.get(eliminatedId);
  room.eliminatedPlayerId = eliminatedId;
  room.eliminatedPlayerName = eliminatedPlayer ? eliminatedPlayer.name : 'Unknown';

  const isImposter = room.imposterPlayerIds.has(eliminatedId);
  room.imposterCaught = isImposter;
  room.wasTieUnresolved = false;
  room.phase = 'RESULTS';

  calculateScores(room);

  broadcastRoomState(room, {
    message: isImposter
      ? `🎉 IMPOSTER CAUGHT! ${room.eliminatedPlayerName} was the imposter!`
      : `😱 INNOCENT ELIMINATED! ${room.eliminatedPlayerName} was NOT the imposter!`,
    variant: isImposter ? 'success' : 'error'
  });
}

function startDiscussionTimer(room: InternalRoom, onComplete?: () => void) {
  stopTimer(room);
  room.timerIsRunning = true;

  room.timerInterval = setInterval(() => {
    room.timerRemaining -= 1;
    if (room.timerRemaining <= 0) {
      stopTimer(room);
      if (onComplete) {
        onComplete();
      } else {
        broadcastRoomState(room, { message: 'Discussion time is up!', variant: 'info' });
      }
    }
  }, 1000);
}

// -------------------------------------------------------------
// EXPRESS APP & ROUTES
// -------------------------------------------------------------
const app = express();
app.use(express.json());

// API health endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', activeRooms: rooms.size, timestamp: Date.now() });
});

// Check if room exists
app.get('/api/rooms/:code', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({
    roomCode: room.roomCode,
    roomName: room.roomName,
    playerCount: room.players.size,
    phase: room.phase
  });
});

// Setup HTTP & WebSocket server
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  let boundPlayerId: string | null = null;
  let boundRoomCode: string | null = null;

  const sendError = (message: string) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ERROR', message }));
    }
  };

  ws.on('message', (rawData) => {
    try {
      const data: ClientMessage = JSON.parse(rawData.toString());

      switch (data.type) {
        case 'CREATE_ROOM': {
          let code = generateRoomCode();
          while (rooms.has(code)) {
            code = generateRoomCode();
          }

          const hostPlayerId = crypto.randomUUID();
          const hostToken = generateToken();
          const sessionToken = generateToken();

          const randomPreset = getRandomQuestionPair();

          const room: InternalRoom = {
            roomCode: code,
            roomName: (data.roomName || 'Party Game').trim(),
            phase: 'LOBBY',
            roundNumber: 1,
            settings: {
              ...DEFAULT_SETTINGS,
              ...(data.settings || {})
            },
            hostPlayerId,
            hostToken,
            players: new Map(),
            commonQuestion: data.commonQuestion || randomPreset.commonQuestion,
            imposterQuestion: data.imposterQuestion || randomPreset.imposterQuestion,
            imposterPlayerIds: new Set(),
            playerQuestions: new Map(),
            submittedAnswers: new Map(),
            submittedVotes: new Map(),
            tiedPlayerIds: [],
            isTiebreakerRound: false,
            timerRemaining: data.settings?.discussionSeconds || DEFAULT_SETTINGS.discussionSeconds,
            timerInterval: null,
            timerIsRunning: false,
            revealedVotes: [],
            eliminatedPlayerId: null,
            eliminatedPlayerName: null,
            imposterCaught: false,
            wasTieUnresolved: false,
            roundScores: [],
            cumulativeScores: new Map(),
            lastActivity: Date.now()
          };

          const hostPlayer: InternalPlayer = {
            id: hostPlayerId,
            name: (data.hostName || 'Host').trim(),
            avatar: data.avatar || 'red',
            isHost: true,
            isReady: true,
            isConnected: true,
            joinedAt: Date.now(),
            sessionToken,
            ws
          };

          room.players.set(hostPlayerId, hostPlayer);
          room.cumulativeScores.set(hostPlayerId, { totalScore: 0, correctVotes: 0 });
          rooms.set(code, room);

          boundPlayerId = hostPlayerId;
          boundRoomCode = code;

          const initMsg: ServerMessage = {
            type: 'INIT_STATE',
            payload: buildPlayerClientState(room, hostPlayerId),
            sessionToken
          };
          ws.send(JSON.stringify(initMsg));
          break;
        }

        case 'JOIN_ROOM': {
          const code = (data.roomCode || '').toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            sendError(`Room ${code} not found. Please check the code.`);
            return;
          }

          if (room.players.size >= 16) {
            sendError('Room is full (maximum 16 players).');
            return;
          }

          // Check for existing player reconnecting by sessionToken
          let player: InternalPlayer | undefined;
          if (data.sessionToken) {
            player = Array.from(room.players.values()).find(p => p.sessionToken === data.sessionToken);
          }

          const cleanName = (data.playerName || '').trim();
          if (!player && !cleanName) {
            sendError('Please enter your display name.');
            return;
          }

          // Check if name is already taken by an active connected player
          if (!player) {
            const nameConflict = Array.from(room.players.values()).some(
              p => p.name.toLowerCase() === cleanName.toLowerCase() && p.isConnected
            );
            if (nameConflict) {
              sendError(`The name "${cleanName}" is already taken in this room.`);
              return;
            }

            const newPlayerId = crypto.randomUUID();
            const sessionToken = generateToken();
            const avatars = ['red', 'cyan', 'lime', 'orange', 'yellow', 'purple', 'pink', 'blue', 'white', 'black', 'maroon', 'teal'];
            const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

            player = {
              id: newPlayerId,
              name: cleanName,
              avatar: data.avatar || randomAvatar,
              isHost: false,
              isReady: false,
              isConnected: true,
              joinedAt: Date.now(),
              sessionToken,
              ws
            };

            room.players.set(newPlayerId, player);
            if (!room.cumulativeScores.has(newPlayerId)) {
              room.cumulativeScores.set(newPlayerId, { totalScore: 0, correctVotes: 0 });
            }
          } else {
            // Reconnecting existing player
            player.isConnected = true;
            player.ws = ws;
            if (cleanName) player.name = cleanName;
            if (data.avatar) player.avatar = data.avatar;
          }

          boundPlayerId = player.id;
          boundRoomCode = code;

          const initMsg: ServerMessage = {
            type: 'INIT_STATE',
            payload: buildPlayerClientState(room, player.id),
            sessionToken: player.sessionToken
          };
          ws.send(JSON.stringify(initMsg));

          broadcastRoomState(room, {
            message: `${player.name} joined the room!`,
            variant: 'info'
          });
          break;
        }

        case 'RECONNECT': {
          const code = (data.roomCode || '').toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            sendError('Room session expired or does not exist.');
            return;
          }

          const player = room.players.get(data.playerId);
          if (!player || player.sessionToken !== data.sessionToken) {
            sendError('Session recovery failed. Please join with your name.');
            return;
          }

          player.isConnected = true;
          player.ws = ws;
          boundPlayerId = player.id;
          boundRoomCode = code;

          const initMsg: ServerMessage = {
            type: 'INIT_STATE',
            payload: buildPlayerClientState(room, player.id),
            sessionToken: player.sessionToken
          };
          ws.send(JSON.stringify(initMsg));

          broadcastRoomState(room);
          break;
        }

        case 'TOGGLE_READY': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.phase !== 'LOBBY') return;
          const player = room.players.get(boundPlayerId);
          if (player) {
            player.isReady = !player.isReady;
            broadcastRoomState(room);
          }
          break;
        }

        case 'HOST_UPDATE_SETTINGS': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.hostPlayerId !== boundPlayerId) {
            sendError('Only the host can modify game settings.');
            return;
          }

          room.settings = {
            ...room.settings,
            ...data.settings
          };
          broadcastRoomState(room, { message: 'Game settings updated.', variant: 'info' });
          break;
        }

        case 'HOST_SET_QUESTIONS': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.hostPlayerId !== boundPlayerId) {
            sendError('Only the host can change questions.');
            return;
          }
          room.commonQuestion = (data.commonQuestion || '').trim();
          room.imposterQuestion = (data.imposterQuestion || '').trim();
          broadcastRoomState(room, { message: 'Questions updated by host.', variant: 'info' });
          break;
        }

        case 'HOST_SELECT_IMPOSTER': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.hostPlayerId !== boundPlayerId) {
            sendError('Only the host can select the imposter.');
            return;
          }
          room.imposterPlayerIds = new Set(data.imposterPlayerIds);
          broadcastRoomState(room);
          break;
        }

        case 'HOST_KICK_PLAYER': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.hostPlayerId !== boundPlayerId) return;

          const targetPlayer = room.players.get(data.playerId);
          if (targetPlayer && !targetPlayer.isHost) {
            if (targetPlayer.ws && targetPlayer.ws.readyState === WebSocket.OPEN) {
              targetPlayer.ws.send(JSON.stringify({ type: 'ERROR', message: 'You have been removed from the room by the host.' }));
              targetPlayer.ws.close();
            }
            room.players.delete(data.playerId);
            room.imposterPlayerIds.delete(data.playerId);
            broadcastRoomState(room, { message: `${targetPlayer.name} was removed from the lobby.`, variant: 'warning' });
          }
          break;
        }

        case 'HOST_START_ROUND': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.hostPlayerId !== boundPlayerId) {
            sendError('Only the host can start the round.');
            return;
          }

          if (room.players.size < 3) {
            sendError('At least 3 players are required to start the game.');
            return;
          }

          if (!room.commonQuestion || !room.imposterQuestion) {
            sendError('Please fill in both the Common Question and Imposter Question.');
            return;
          }

          // Role selection: auto assign or fallback if not selected
          const eligibleCandidates = Array.from(room.players.values()).filter(p => room.settings.allowHostToPlay || !p.isHost);
          if (eligibleCandidates.length === 0) {
            sendError('Not enough eligible players.');
            return;
          }

          if (room.settings.autoAssignImposter || room.imposterPlayerIds.size === 0) {
            // Randomly pick
            const shuffled = [...eligibleCandidates].sort(() => Math.random() - 0.5);
            const count = Math.min(room.settings.imposterCount || 1, eligibleCandidates.length - 1);
            room.imposterPlayerIds = new Set(shuffled.slice(0, count).map(p => p.id));
          }

          // Clear submissions from previous round
          room.submittedAnswers.clear();
          room.submittedVotes.clear();
          room.tiedPlayerIds = [];
          room.isTiebreakerRound = false;
          room.revealedVotes = [];
          room.eliminatedPlayerId = null;
          room.eliminatedPlayerName = null;
          room.imposterCaught = false;
          room.wasTieUnresolved = false;
          room.roundScores = [];

          // Assign secret private questions to each player
          room.playerQuestions.clear();
          for (const player of room.players.values()) {
            if (room.imposterPlayerIds.has(player.id)) {
              room.playerQuestions.set(player.id, room.imposterQuestion);
            } else {
              room.playerQuestions.set(player.id, room.commonQuestion);
            }
          }

          room.phase = 'ANSWERING';
          broadcastRoomState(room, { message: 'Round started! Answer your secret question.', variant: 'success' });
          break;
        }

        case 'SUBMIT_ANSWER': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.phase !== 'ANSWERING') {
            sendError('Answers are not currently being accepted.');
            return;
          }

          const answer = (data.targetPlayerName || '').trim();
          if (!answer) {
            sendError('Answer cannot be empty.');
            return;
          }

          room.submittedAnswers.set(boundPlayerId, answer);

          const eligibleCount = Array.from(room.players.values()).filter(p => room.settings.allowHostToPlay || !p.isHost).length;
          const allSubmitted = room.submittedAnswers.size >= eligibleCount;

          broadcastRoomState(room, {
            message: `${room.players.get(boundPlayerId)?.name} submitted an answer (${room.submittedAnswers.size}/${eligibleCount})`,
            variant: 'info'
          });

          // If all submitted, host reveal button is enabled
          break;
        }

        case 'HOST_FORCE_REVEAL_ANSWERS': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.hostPlayerId !== boundPlayerId) {
            sendError('Only the host can reveal answers.');
            return;
          }
          if (room.phase !== 'ANSWERING') return;

          room.phase = 'REVEAL';
          broadcastRoomState(room, { message: 'All answers revealed! Review the answers.', variant: 'success' });
          break;
        }

        case 'HOST_START_DISCUSSION': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.hostPlayerId !== boundPlayerId) return;

          room.phase = 'DISCUSSION';
          room.timerRemaining = room.settings.discussionSeconds || DEFAULT_SETTINGS.discussionSeconds;
          room.timerIsRunning = true;

          startDiscussionTimer(room, () => {
            broadcastRoomState(room, { message: 'Discussion time has ended! Ready for voting.', variant: 'info' });
          });

          broadcastRoomState(room, { message: 'Discussion started! Discuss who the imposter is.', variant: 'info' });
          break;
        }

        case 'HOST_TOGGLE_TIMER': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.hostPlayerId !== boundPlayerId) return;

          if (data.run) {
            startDiscussionTimer(room);
          } else {
            stopTimer(room);
          }
          broadcastRoomState(room);
          break;
        }

        case 'HOST_SET_TIMER_SECONDS': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.hostPlayerId !== boundPlayerId) return;

          room.timerRemaining = Math.max(0, data.seconds);
          broadcastRoomState(room);
          break;
        }

        case 'HOST_MOVE_TO_VOTING': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.hostPlayerId !== boundPlayerId) return;

          stopTimer(room);
          room.submittedVotes.clear();
          room.phase = 'VOTING';
          room.timerRemaining = room.settings.votingSeconds || DEFAULT_SETTINGS.votingSeconds;
          room.timerIsRunning = true;

          broadcastRoomState(room, { message: 'Voting is open! Cast your vote for the imposter.', variant: 'info' });

          startDiscussionTimer(room, () => {
            // Auto finish voting when timer runs out
            processVoteResults(room);
          });
          break;
        }

        case 'SUBMIT_VOTE': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || (room.phase !== 'VOTING' && room.phase !== 'TIEBREAKER_VOTING')) {
            sendError('Voting is currently closed.');
            return;
          }

          const targetId = data.votedForPlayerId;
          if (targetId === boundPlayerId) {
            sendError('Self-voting is not allowed.');
            return;
          }

          // If in tiebreaker voting, target must be one of the tied players
          if (room.phase === 'TIEBREAKER_VOTING' && room.tiedPlayerIds.length > 0) {
            if (!room.tiedPlayerIds.includes(targetId)) {
              sendError('In a tiebreaker, you can only vote for one of the tied players.');
              return;
            }
          }

          room.submittedVotes.set(boundPlayerId, targetId);

          const eligibleCount = Array.from(room.players.values()).filter(p => room.settings.allowHostToPlay || !p.isHost).length;
          const allVoted = room.submittedVotes.size >= eligibleCount;

          broadcastRoomState(room, {
            message: `${room.players.get(boundPlayerId)?.name} cast their vote (${room.submittedVotes.size}/${eligibleCount})`,
            variant: 'info'
          });

          if (allVoted) {
            // Automatically process results when all players have voted
            setTimeout(() => {
              processVoteResults(room);
            }, 800);
          }
          break;
        }

        case 'HOST_FORCE_END_VOTING': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.hostPlayerId !== boundPlayerId) return;
          if (room.phase !== 'VOTING' && room.phase !== 'TIEBREAKER_VOTING') return;

          processVoteResults(room);
          break;
        }

        case 'HOST_NEXT_ROUND': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.hostPlayerId !== boundPlayerId) return;

          stopTimer(room);
          room.roundNumber += 1;
          room.phase = 'LOBBY';

          // Set questions if provided, otherwise pick fresh preset
          if (data.commonQuestion && data.imposterQuestion) {
            room.commonQuestion = data.commonQuestion;
            room.imposterQuestion = data.imposterQuestion;
          } else {
            const freshPreset = getRandomQuestionPair();
            room.commonQuestion = freshPreset.commonQuestion;
            room.imposterQuestion = freshPreset.imposterQuestion;
          }

          // Clear imposter selection for next round so host can select a new one or auto-assign
          room.imposterPlayerIds.clear();
          room.playerQuestions.clear();
          room.submittedAnswers.clear();
          room.submittedVotes.clear();
          room.tiedPlayerIds = [];
          room.isTiebreakerRound = false;

          broadcastRoomState(room, {
            message: `Round ${room.roundNumber} prepared! Host can pick questions and select the imposter.`,
            variant: 'success'
          });
          break;
        }

        case 'HOST_END_GAME': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.hostPlayerId !== boundPlayerId) return;

          room.phase = 'LEADERBOARD';
          stopTimer(room);
          broadcastRoomState(room, { message: 'Game concluded! Final scores displayed.', variant: 'info' });
          break;
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
      sendError('Invalid message format received by server.');
    }
  });

  ws.on('close', () => {
    if (boundRoomCode && boundPlayerId) {
      const room = rooms.get(boundRoomCode);
      if (room) {
        const player = room.players.get(boundPlayerId);
        if (player) {
          player.isConnected = false;
          broadcastRoomState(room, {
            message: `${player.name} disconnected.`,
            variant: 'warning'
          });
        }
      }
    }
  });
});

// Dev vs Prod Vite middleware
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 IMPOSTER Server running at http://0.0.0.0:${PORT} in ${isProd ? 'production' : 'development'} mode`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
