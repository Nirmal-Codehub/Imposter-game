export type GamePhase =
  | 'LOBBY'
  | 'ANSWERING'
  | 'REVEAL'
  | 'DISCUSSION'
  | 'VOTING'
  | 'TIEBREAKER_DISCUSSION'
  | 'TIEBREAKER_VOTING'
  | 'RESULTS'
  | 'LEADERBOARD';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  joinedAt: number;
}

export interface PlayerScore {
  playerId: string;
  playerName: string;
  roundScore: number;
  totalScore: number;
  correctVotes: number;
  scoreReasons: string[];
}

export interface AnswerItem {
  playerId: string;
  playerName: string;
  targetPlayerName: string; // The person's name they submitted
}

export interface VoteItem {
  voterId: string;
  voterName: string;
  votedForId: string;
  votedForName: string;
}

export interface QuestionPair {
  commonQuestion: string;
  imposterQuestion: string;
  category?: string;
}

export interface RoomSettings {
  imposterCount: number; // default 1
  discussionSeconds: number; // default 120
  votingSeconds: number; // default 60
  timersEnabled: boolean;
  allowHostToPlay: boolean;
  autoAssignImposter: boolean;
}

export interface PublicGameState {
  roomCode: string;
  roomName: string;
  phase: GamePhase;
  roundNumber: number;
  settings: RoomSettings;
  hostPlayerId: string;
  players: Player[];
  
  // Answering phase progress
  submittedAnswerCount: number;
  totalEligibleAnswers: number;
  hasSubmittedAnswerList: string[]; // List of playerIds who submitted (not their answers)

  // Revealed after ANSWERING (in REVEAL, DISCUSSION, VOTING, RESULTS)
  revealedAnswers?: AnswerItem[];
  revealedCommonQuestion?: string;
  revealedImposterQuestion?: string;

  // Discussion timer state
  timerRemainingSeconds: number;
  timerIsRunning: boolean;

  // Voting phase progress
  submittedVoteCount: number;
  totalEligibleVotes: number;
  hasSubmittedVoteList: string[]; // List of playerIds who voted

  // Tiebreaker state
  tiedPlayerIds?: string[];

  // Revealed after VOTING (in RESULTS & LEADERBOARD)
  revealedVotes?: VoteItem[];
  eliminatedPlayerId?: string | null;
  eliminatedPlayerName?: string | null;
  actualImposterIds?: string[];
  imposterCaught?: boolean;
  wasTieUnresolved?: boolean;
  roundScores?: PlayerScore[];
  cumulativeLeaderboard?: PlayerScore[];
}

// Client's private view from the server
export interface PlayerClientState {
  room: PublicGameState;
  me: Player;
  isHost: boolean;
  
  // Private data only this player should see
  privateAssignedQuestion?: string; // shown during ANSWERING
  mySubmittedAnswer?: string; // what this player answered
  mySubmittedVoteId?: string; // who this player voted for
  
  // Host private controls
  hostSelectedImposterIds?: string[]; // Host sees assigned imposter(s)
  hostCommonQuestionDraft?: string;
  hostImposterQuestionDraft?: string;
}

// Client to Server Actions
export type ClientMessage =
  | { type: 'JOIN_ROOM'; roomCode: string; playerName: string; avatar?: string; sessionToken?: string }
  | { type: 'RECONNECT'; roomCode: string; playerId: string; sessionToken: string }
  | { type: 'CREATE_ROOM'; hostName: string; roomName?: string; avatar?: string; settings?: Partial<RoomSettings>; commonQuestion?: string; imposterQuestion?: string }
  | { type: 'HOST_UPDATE_SETTINGS'; settings: Partial<RoomSettings> }
  | { type: 'HOST_SET_QUESTIONS'; commonQuestion: string; imposterQuestion: string }
  | { type: 'HOST_SELECT_IMPOSTER'; imposterPlayerIds: string[] }
  | { type: 'HOST_KICK_PLAYER'; playerId: string }
  | { type: 'TOGGLE_READY' }
  | { type: 'HOST_START_ROUND' }
  | { type: 'SUBMIT_ANSWER'; targetPlayerName: string }
  | { type: 'HOST_FORCE_REVEAL_ANSWERS' }
  | { type: 'HOST_START_DISCUSSION' }
  | { type: 'HOST_TOGGLE_TIMER'; run: boolean }
  | { type: 'HOST_SET_TIMER_SECONDS'; seconds: number }
  | { type: 'HOST_MOVE_TO_VOTING' }
  | { type: 'SUBMIT_VOTE'; votedForPlayerId: string }
  | { type: 'HOST_FORCE_END_VOTING' }
  | { type: 'HOST_NEXT_ROUND'; commonQuestion?: string; imposterQuestion?: string }
  | { type: 'HOST_END_GAME' };

// Server to Client Messages
export type ServerMessage =
  | { type: 'INIT_STATE'; payload: PlayerClientState; sessionToken: string }
  | { type: 'STATE_UPDATE'; payload: PlayerClientState }
  | { type: 'NOTIFICATION'; message: string; variant?: 'info' | 'success' | 'warning' | 'error' }
  | { type: 'TIMER_TICK'; remainingSeconds: number; isRunning: boolean }
  | { type: 'ERROR'; message: string };
