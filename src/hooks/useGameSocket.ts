import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayerClientState,
  ClientMessage,
  ServerMessage,
  RoomSettings
} from '../types/game.ts';
import { sound } from '../lib/audio.ts';

const SESSION_STORAGE_KEY = 'imposter_session';

interface StoredSession {
  roomCode: string;
  playerId: string;
  sessionToken: string;
}

export function useGameSocket() {
  const [gameState, setGameState] = useState<PlayerClientState | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; variant?: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notifTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const showNotification = useCallback((message: string, variant: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    setNotification({ message, variant });
    notifTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 4500);
  }, []);

  // Send typed message
  const sendMessage = useCallback((msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('Socket not connected, unable to send:', msg.type);
    }
  }, []);

  // Connect to WS
  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setErrorMessage(null);

      // Check if we have a stored session to restore
      try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) {
          const session: StoredSession = JSON.parse(raw);
          if (session.roomCode && session.playerId && session.sessionToken) {
            ws.send(JSON.stringify({
              type: 'RECONNECT',
              roomCode: session.roomCode,
              playerId: session.playerId,
              sessionToken: session.sessionToken
            }));
          }
        }
      } catch (e) {
        console.error('Failed to parse stored session:', e);
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);

        switch (msg.type) {
          case 'INIT_STATE': {
            setGameState(msg.payload);
            setErrorMessage(null);
            // Save session
            const session: StoredSession = {
              roomCode: msg.payload.room.roomCode,
              playerId: msg.payload.me.id,
              sessionToken: msg.sessionToken
            };
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
            sound.playJoin();
            break;
          }

          case 'STATE_UPDATE': {
            setGameState(prev => {
              // Sound effects on interesting state changes
              if (prev && prev.room.phase !== msg.payload.room.phase) {
                if (msg.payload.room.phase === 'REVEAL') {
                  sound.playReveal();
                } else if (msg.payload.room.phase === 'RESULTS') {
                  if (msg.payload.room.imposterCaught) {
                    sound.playCatchSuccess();
                  } else {
                    sound.playEscapeDanger();
                  }
                }
              }
              return msg.payload;
            });
            break;
          }

          case 'NOTIFICATION': {
            showNotification(msg.message, msg.variant || 'info');
            break;
          }

          case 'ERROR': {
            setErrorMessage(msg.message);
            showNotification(msg.message, 'error');
            break;
          }
        }
      } catch (err) {
        console.error('Error handling WS event:', err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Auto-reconnect after 2.5 seconds if closed unexpectedly
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 2500);
    };

    ws.onerror = (err) => {
      console.error('WebSocket encountered an error:', err);
      setConnected(false);
    };
  }, [showNotification]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  // Actions
  const createRoom = useCallback((hostName: string, roomName?: string, avatar?: string, settings?: Partial<RoomSettings>, commonQuestion?: string, imposterQuestion?: string) => {
    sendMessage({
      type: 'CREATE_ROOM',
      hostName,
      roomName,
      avatar,
      settings,
      commonQuestion,
      imposterQuestion
    });
  }, [sendMessage]);

  const joinRoom = useCallback((roomCode: string, playerName: string, avatar?: string) => {
    sendMessage({
      type: 'JOIN_ROOM',
      roomCode,
      playerName,
      avatar
    });
  }, [sendMessage]);

  const toggleReady = useCallback(() => {
    sendMessage({ type: 'TOGGLE_READY' });
  }, [sendMessage]);

  const updateSettings = useCallback((settings: Partial<RoomSettings>) => {
    sendMessage({ type: 'HOST_UPDATE_SETTINGS', settings });
  }, [sendMessage]);

  const setQuestions = useCallback((commonQuestion: string, imposterQuestion: string) => {
    sendMessage({ type: 'HOST_SET_QUESTIONS', commonQuestion, imposterQuestion });
  }, [sendMessage]);

  const selectImposter = useCallback((imposterPlayerIds: string[]) => {
    sendMessage({ type: 'HOST_SELECT_IMPOSTER', imposterPlayerIds });
  }, [sendMessage]);

  const kickPlayer = useCallback((playerId: string) => {
    sendMessage({ type: 'HOST_KICK_PLAYER', playerId });
  }, [sendMessage]);

  const startRound = useCallback(() => {
    sendMessage({ type: 'HOST_START_ROUND' });
  }, [sendMessage]);

  const submitAnswer = useCallback((targetPlayerName: string) => {
    sound.playSubmit();
    sendMessage({ type: 'SUBMIT_ANSWER', targetPlayerName });
  }, [sendMessage]);

  const forceRevealAnswers = useCallback(() => {
    sendMessage({ type: 'HOST_FORCE_REVEAL_ANSWERS' });
  }, [sendMessage]);

  const startDiscussion = useCallback(() => {
    sendMessage({ type: 'HOST_START_DISCUSSION' });
  }, [sendMessage]);

  const toggleTimer = useCallback((run: boolean) => {
    sendMessage({ type: 'HOST_TOGGLE_TIMER', run });
  }, [sendMessage]);

  const setTimerSeconds = useCallback((seconds: number) => {
    sendMessage({ type: 'HOST_SET_TIMER_SECONDS', seconds });
  }, [sendMessage]);

  const moveToVoting = useCallback(() => {
    sendMessage({ type: 'HOST_MOVE_TO_VOTING' });
  }, [sendMessage]);

  const submitVote = useCallback((votedForPlayerId: string) => {
    sound.playSubmit();
    sendMessage({ type: 'SUBMIT_VOTE', votedForPlayerId });
  }, [sendMessage]);

  const forceEndVoting = useCallback(() => {
    sendMessage({ type: 'HOST_FORCE_END_VOTING' });
  }, [sendMessage]);

  const nextRound = useCallback((commonQuestion?: string, imposterQuestion?: string) => {
    sendMessage({ type: 'HOST_NEXT_ROUND', commonQuestion, imposterQuestion });
  }, [sendMessage]);

  const endGame = useCallback(() => {
    sendMessage({ type: 'HOST_END_GAME' });
  }, [sendMessage]);

  const leaveRoom = useCallback(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setGameState(null);
    setErrorMessage(null);
    // Reconnect as fresh socket
    if (socketRef.current) {
      socketRef.current.close();
    }
  }, []);

  return {
    gameState,
    connected,
    notification,
    errorMessage,
    clearNotification,
    createRoom,
    joinRoom,
    toggleReady,
    updateSettings,
    setQuestions,
    selectImposter,
    kickPlayer,
    startRound,
    submitAnswer,
    forceRevealAnswers,
    startDiscussion,
    toggleTimer,
    setTimerSeconds,
    moveToVoting,
    submitVote,
    forceEndVoting,
    nextRound,
    endGame,
    leaveRoom
  };
}
