import React, { useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  ArrowRight,
  Plus,
  Minus,
  AlertTriangle,
  Radio,
  Users
} from 'lucide-react';
import { PlayerClientState } from '../types/game.ts';
import { sound } from '../lib/audio.ts';
import { CrewmateIcon } from './CrewmateIcon.tsx';

interface Props {
  gameState: PlayerClientState;
  onToggleTimer: (run: boolean) => void;
  onSetTimerSeconds: (seconds: number) => void;
  onMoveToVoting: () => void;
}

export const DiscussionScreen: React.FC<Props> = ({
  gameState,
  onToggleTimer,
  onSetTimerSeconds,
  onMoveToVoting
}) => {
  const { room, isHost } = gameState;
  const answers = room.revealedAnswers || [];
  const remaining = room.timerRemainingSeconds;
  const isRunning = room.timerIsRunning;
  const isTiebreaker = room.phase === 'TIEBREAKER_DISCUSSION';

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  useEffect(() => {
    if (isRunning && remaining <= 5 && remaining > 0) {
      sound.playTick();
    }
  }, [remaining, isRunning]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 space-stars">
      {/* Emergency Meeting Siren Banner */}
      <div className="rounded-3xl bg-[#090b12] border-2 border-red-600 p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden emergency-alarm">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950 border border-red-500 text-red-400 text-xs font-black uppercase tracking-widest mb-4">
          <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" />
          <span>{isTiebreaker ? 'TIEBREAKER ALARM' : 'EMERGENCY MEETING IN SESSION'}</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-5xl font-black text-white uppercase tracking-tight mb-2">
          {isTiebreaker ? 'SUSPECT TIEBREAKER DEBATE' : 'DISCUSS & CROSS-EXAMINE'}
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm font-mono uppercase max-w-md mx-auto mb-6">
          Find out who gave an answer that doesn&apos;t make sense for Directive A!
        </p>

        {/* Circular / Giant Countdown */}
        <div className="flex flex-col items-center justify-center my-6">
          <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 border-red-500 bg-black flex flex-col items-center justify-center glow-red">
            <span className="font-heading font-black text-5xl sm:text-6xl tracking-tight text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">
              {remaining > 0 ? timeFormatted : '0:00'}
            </span>
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-500 mt-1">
              {remaining === 0 ? 'TIME EXPIRED' : isRunning ? 'COUNTDOWN' : 'PAUSED'}
            </span>
          </div>

          {/* Host Controls */}
          {isHost && (
            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => onSetTimerSeconds(Math.max(0, remaining - 15))}
                title="-15s"
                className="p-2.5 rounded-xl bg-black border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                onClick={() => onToggleTimer(!isRunning)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                  isRunning
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-lg glow-red'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? 'PAUSE' : 'RESUME'}</span>
              </button>

              <button
                onClick={() => onSetTimerSeconds(remaining + 30)}
                title="+30s"
                className="p-2.5 rounded-xl bg-black border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Clues Recap */}
      <div className="rounded-3xl bg-[#090b12] border border-zinc-900 p-6 shadow-xl space-y-4">
        <h2 className="font-heading text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Radio className="w-4 h-4 text-red-500" />
          <span>ACTIVE DIRECTIVES &amp; LOGGED ANSWERS</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-black border border-cyan-950">
            <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-1">DIRECTIVE A:</span>
            <p className="text-sm font-bold text-white">&ldquo;{room.revealedCommonQuestion}&rdquo;</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-black border border-red-950">
            <span className="text-[10px] uppercase font-mono font-bold text-red-400 block mb-1">DIRECTIVE B:</span>
            <p className="text-sm font-bold text-white">&ldquo;{room.revealedImposterQuestion}&rdquo;</p>
          </div>
        </div>

        {/* Answer Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
          {answers.map((item) => {
            const playerObj = room.players.find(p => p.id === item.playerId);
            return (
              <div key={item.playerId} className="p-2.5 rounded-xl bg-black border border-zinc-900 flex items-center gap-2">
                <CrewmateIcon colorId={playerObj?.avatar} size={24} />
                <div className="min-w-0">
                  <span className="text-[10px] text-zinc-500 block truncate uppercase font-mono">{item.playerName}:</span>
                  <span className="text-xs font-bold text-red-400 block truncate uppercase">{item.targetPlayerName}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Advance */}
      {isHost && (
        <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-[#090b12]/95 backdrop-blur-md border-2 border-red-900/60 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-mono text-zinc-400 text-center sm:text-left uppercase">
            CONCLUDE DEBATE TO INITIATE EJECTION VOTING PROTOCOL
          </span>
          <button
            onClick={onMoveToVoting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-red-950/80 transition-all cursor-pointer border border-red-500/50"
          >
            <span>PROCEED TO VOTE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
