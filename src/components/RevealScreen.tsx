import React from 'react';
import {
  Users,
  MessageSquare,
  Eye,
  AlertTriangle,
  Skull
} from 'lucide-react';
import { PlayerClientState } from '../types/game.ts';
import { CrewmateIcon } from './CrewmateIcon.tsx';

interface Props {
  gameState: PlayerClientState;
  onStartDiscussion: () => void;
  onMoveToVoting: () => void;
}

export const RevealScreen: React.FC<Props> = ({
  gameState,
  onStartDiscussion,
  onMoveToVoting
}) => {
  const { room, isHost } = gameState;
  const answers = room.revealedAnswers || [];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 space-stars">
      {/* Header Banner */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-950/80 border border-red-700/60 text-red-400 text-xs font-black uppercase tracking-widest mb-3">
          <Eye className="w-4 h-4 text-red-500 animate-pulse" />
          <span>EVIDENCE UNCOVERED</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
          WHO IS ACTING SUSPICIOUS?
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm mt-2 max-w-lg mx-auto font-mono uppercase">
          One of these directives went to the Imposter. Look at the names submitted. Who doesn&apos;t fit?
        </p>
      </div>

      {/* Two Directives Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-[#090b12] border-2 border-cyan-900/60 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 font-mono">
              DIRECTIVE A (CREW)
            </span>
          </div>
          <p className="text-base sm:text-lg font-black text-white leading-snug">
            &ldquo;{room.revealedCommonQuestion}&rdquo;
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#090b12] border-2 border-red-900/60 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-red-500 flex items-center gap-1.5 font-mono">
              DIRECTIVE B (IMPOSTER)
            </span>
          </div>
          <p className="text-base sm:text-lg font-black text-white leading-snug">
            &ldquo;{room.revealedImposterQuestion}&rdquo;
          </p>
        </div>
      </div>

      {/* Submitted Answers Grid */}
      <div className="rounded-3xl bg-[#090b12] border border-zinc-900 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-red-500" />
            <span>CREWMATE ANSWERS LOGGED</span>
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            {answers.length} RESPONSES
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {answers.map((item, idx) => {
            const playerObj = room.players.find(p => p.id === item.playerId);
            return (
              <div
                key={item.playerId}
                className="p-3.5 rounded-2xl bg-black border border-zinc-900 flex items-center justify-between gap-3 shadow-md hover:border-red-900/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#090b12] border border-zinc-800 flex items-center justify-center shrink-0">
                    <CrewmateIcon colorId={playerObj?.avatar} size={30} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-zinc-500 block truncate uppercase font-mono">
                      {item.playerName} answered:
                    </span>
                    <span className="text-sm font-black text-red-400 truncate block uppercase tracking-wide">
                      {item.targetPlayerName}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Controls */}
      {isHost && (
        <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-[#090b12]/95 backdrop-blur-md border-2 border-red-900/60 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-zinc-400 text-center sm:text-left uppercase">
            <span>SOUND EMERGENCY MEETING TO BEGIN INTERROGATION</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onMoveToVoting}
              className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-black uppercase tracking-wider transition-colors"
            >
              SKIP TO VOTE
            </button>
            <button
              onClick={onStartDiscussion}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-950/80 transition-all cursor-pointer border border-red-500/50"
            >
              <AlertTriangle className="w-4 h-4 fill-current" />
              <span>EMERGENCY MEETING ({room.settings.discussionSeconds || 120}s)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
