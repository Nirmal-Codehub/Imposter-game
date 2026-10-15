/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGameSocket } from './hooks/useGameSocket.ts';
import { Header } from './components/Header.tsx';
import { NotificationToast } from './components/NotificationToast.tsx';
import { HomeScreen } from './components/HomeScreen.tsx';
import { LobbyScreen } from './components/LobbyScreen.tsx';
import { QuestionScreen } from './components/QuestionScreen.tsx';
import { RevealScreen } from './components/RevealScreen.tsx';
import { DiscussionScreen } from './components/DiscussionScreen.tsx';
import { VotingScreen } from './components/VotingScreen.tsx';
import { VoteResultsScreen } from './components/VoteResultsScreen.tsx';

export default function App() {
  const {
    gameState,
    connected,
    notification,
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
  } = useGameSocket();

  const [initialCode, setInitialCode] = useState<string>('');

  // Extract ?code= from URL if player joins via share link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        setInitialCode(code.toUpperCase());
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#05060a] text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Toast Notifications */}
      <NotificationToast notification={notification} onClose={clearNotification} />

      {/* Top Navbar */}
      <Header
        roomCode={gameState?.room.roomCode}
        phase={gameState?.room.phase}
        roundNumber={gameState?.room.roundNumber}
        isHost={gameState?.isHost}
        connected={connected}
        onLeave={leaveRoom}
      />

      {/* Main Game Router */}
      <main className="flex-1 pb-12">
        {!gameState ? (
          <HomeScreen
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            initialCode={initialCode}
          />
        ) : (
          <>
            {gameState.room.phase === 'LOBBY' && (
              <LobbyScreen
                gameState={gameState}
                onToggleReady={toggleReady}
                onStartRound={startRound}
                onUpdateSettings={updateSettings}
                onSetQuestions={setQuestions}
                onSelectImposter={selectImposter}
                onKickPlayer={kickPlayer}
              />
            )}

            {gameState.room.phase === 'ANSWERING' && (
              <QuestionScreen
                gameState={gameState}
                onSubmitAnswer={submitAnswer}
                onForceReveal={forceRevealAnswers}
              />
            )}

            {gameState.room.phase === 'REVEAL' && (
              <RevealScreen
                gameState={gameState}
                onStartDiscussion={startDiscussion}
                onMoveToVoting={moveToVoting}
              />
            )}

            {(gameState.room.phase === 'DISCUSSION' || gameState.room.phase === 'TIEBREAKER_DISCUSSION') && (
              <DiscussionScreen
                gameState={gameState}
                onToggleTimer={toggleTimer}
                onSetTimerSeconds={setTimerSeconds}
                onMoveToVoting={moveToVoting}
              />
            )}

            {(gameState.room.phase === 'VOTING' || gameState.room.phase === 'TIEBREAKER_VOTING') && (
              <VotingScreen
                gameState={gameState}
                onSubmitVote={submitVote}
                onForceEndVoting={forceEndVoting}
              />
            )}

            {(gameState.room.phase === 'RESULTS' || gameState.room.phase === 'LEADERBOARD') && (
              <VoteResultsScreen
                gameState={gameState}
                onNextRound={nextRound}
                onEndGame={endGame}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
