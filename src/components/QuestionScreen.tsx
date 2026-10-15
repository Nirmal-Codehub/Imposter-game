import React, { useState } from 'react';
import {
  Lock,
  Send,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Crown,
  AlertTriangle,
  Radio,
  Target
} from 'lucide-react';
import { PlayerClientState } from '../types/game.ts';
import { CrewmateIcon } from './CrewmateIcon.tsx';

interface Props {
  gameState: PlayerClientState;
  onSubmitAnswer: (targetPlayerName: string) => void;
  onForceReveal: () => void;
}

export const QuestionScreen: React.FC<Props> = ({
  gameState,
  onSubmitAnswer,
  onForceReveal
}) => {
  const { room, me, isHost, privateAssignedQuestion, mySubmittedAnswer } = gameState;
  const [selectedName, setSelectedName] = useState('');
  const [customName, setCustomName] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [showConfirmForceReveal, setShowConfirmForceReveal] = useState(false);

  const eligiblePlayers = room.players;
  const filteredPlayers = eligiblePlayers.filter(p =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const hasSubmitted = !!mySubmittedAnswer;
  const allSubmitted = room.submittedAnswerCount >= room.totalEligibleAnswers;

  const handleSelectName = (name: string) => {
    setSelectedName(name);
    setCustomName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAnswer = selectedName || customName.trim();
    if (!finalAnswer) return;
    onSubmitAnswer(finalAnswer);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 space-stars">
      {/* Top Secret Directive Card */}
      <div className="relative rounded-3xl bg-[#090b12] border-2 border-red-950 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black border border-red-900/60 text-red-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>CONFIDENTIAL DIRECTIVE</span>
          </div>

          <div className="text-xs font-mono text-zinc-500 uppercase">
            ROUND {room.roundNumber}
          </div>
        </div>

        {/* Question Display */}
        <div className="py-4">
          <h2 className="font-heading text-2xl sm:text-3xl font-black text-white leading-tight">
            &ldquo;{privateAssignedQuestion || 'DIRECTIVE DECRYPTING...'}&rdquo;
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-red-400 font-mono flex items-center gap-1.5 uppercase font-bold">
            <Target className="w-4 h-4 text-red-500" />
            TASK: ANSWER WITH ONE CREWMATE&apos;S NAME
          </p>
        </div>

        {/* Answer Locked vs Form */}
        {hasSubmitted ? (
          <div className="mt-6 p-5 rounded-2xl bg-black border border-emerald-600/50 text-emerald-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-white">ANSWER LOCKED</h3>
                <p className="text-xs text-emerald-400 font-mono mt-0.5">
                  You submitted: <span className="font-bold underline text-white">{mySubmittedAnswer}</span>
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              STAND BY • WAITING FOR REMAINING CREW TO COMPLETE DIRECTIVES...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-[11px] font-black text-zinc-300 uppercase tracking-wider mb-2">
                SELECT A CREWMATE:
              </label>

              {eligiblePlayers.length > 5 && (
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-zinc-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search crewmate..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full bg-black border border-zinc-800 focus:border-red-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredPlayers.map((p) => {
                  const isSelected = selectedName === p.name;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectName(p.name)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-red-950 border-red-500 text-white shadow-lg glow-red scale-[1.02]'
                          : 'bg-black border-zinc-900 hover:border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <CrewmateIcon colorId={p.avatar} size={28} />
                      <span className="font-bold text-xs truncate uppercase">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-1">Or write in name:</span>
              <input
                type="text"
                placeholder="Type name"
                value={customName}
                onChange={(e) => {
                  setCustomName(e.target.value);
                  setSelectedName('');
                }}
                className="w-full bg-black border border-zinc-800 focus:border-red-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!selectedName && !customName.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-red-950/80 flex items-center justify-center gap-2 transition-all cursor-pointer border border-red-500/50"
            >
              <Send className="w-4 h-4" />
              <span>LOCK IN ANSWER</span>
            </button>
          </form>
        )}
      </div>

      {/* Progress Status Bar */}
      <div className="rounded-3xl bg-[#090b12] border border-zinc-900 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider">
              CREW DIRECTIVES COMPLETED
            </h3>
          </div>
          <span className="font-mono text-sm font-black text-red-400">
            {room.submittedAnswerCount} / {room.totalEligibleAnswers}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-black rounded-full overflow-hidden border border-zinc-900 mb-4">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
            style={{
              width: `${(room.submittedAnswerCount / Math.max(1, room.totalEligibleAnswers)) * 100}%`
            }}
          />
        </div>

        {/* Crew Status Badges */}
        <div className="flex flex-wrap gap-2">
          {room.players.map((p) => {
            const hasDone = room.hasSubmittedAnswerList.includes(p.id);
            return (
              <div
                key={p.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono uppercase border ${
                  hasDone
                    ? 'bg-black border-emerald-900 text-emerald-400'
                    : 'bg-black border-zinc-900 text-zinc-600'
                }`}
              >
                <CrewmateIcon colorId={p.avatar} size={18} />
                <span className="truncate max-w-[100px]">{p.name}</span>
                {hasDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Host Control */}
        {isHost && (
          <div className="mt-6 pt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-mono text-zinc-500 text-center sm:text-left uppercase">
              {allSubmitted ? (
                <span className="text-emerald-400 font-bold">ALL ANSWERS SUBMITTED • READY FOR REVEAL</span>
              ) : (
                <span>WAITING FOR CREW TO SUBMIT ANSWERS</span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!allSubmitted && (
                <button
                  type="button"
                  onClick={() => setShowConfirmForceReveal(true)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold uppercase transition-colors"
                >
                  FORCE REVEAL
                </button>
              )}

              <button
                type="button"
                onClick={onForceReveal}
                disabled={!allSubmitted}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-950/80 transition-all cursor-pointer border border-red-500/50"
              >
                <Crown className="w-4 h-4" />
                <span>REVEAL CLUES</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showConfirmForceReveal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#090b12] border-2 border-red-600 p-6 shadow-2xl text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h4 className="font-heading text-lg font-black text-white uppercase mb-2">FORCE REVEAL ANSWERS?</h4>
            <p className="text-xs text-zinc-400 mb-6 font-mono">
              Not all players have answered ({room.submittedAnswerCount}/{room.totalEligibleAnswers}).
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmForceReveal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-bold uppercase"
              >
                WAIT
              </button>
              <button
                onClick={() => {
                  setShowConfirmForceReveal(false);
                  onForceReveal();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-black uppercase"
              >
                REVEAL NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
