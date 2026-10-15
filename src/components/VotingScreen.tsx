import React, { useState } from 'react';
import {
  Vote,
  Users,
  CheckCircle2,
  Lock,
  Clock,
  AlertTriangle,
  Skull,
  Target
} from 'lucide-react';
import { PlayerClientState } from '../types/game.ts';
import { CrewmateIcon } from './CrewmateIcon.tsx';

interface Props {
  gameState: PlayerClientState;
  onSubmitVote: (votedForPlayerId: string) => void;
  onForceEndVoting: () => void;
}

export const VotingScreen: React.FC<Props> = ({
  gameState,
  onSubmitVote,
  onForceEndVoting
}) => {
  const { room, me, isHost, mySubmittedVoteId } = gameState;
  const isTiebreaker = room.phase === 'TIEBREAKER_VOTING';
  const tiedIds = room.tiedPlayerIds || [];

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showForceEndModal, setShowForceEndModal] = useState(false);

  const hasVoted = !!mySubmittedVoteId;
  const allVoted = room.submittedVoteCount >= room.totalEligibleVotes;

  const candidates = room.players.filter(p => {
    if (isTiebreaker && tiedIds.length > 0) {
      return tiedIds.includes(p.id);
    }
    return true;
  });

  const handleCandidateClick = (targetId: string) => {
    if (hasVoted) return;
    if (targetId === me.id) {
      alert('You cannot vote for yourself!');
      return;
    }
    setSelectedTargetId(targetId);
  };

  const handleConfirmVote = () => {
    if (!selectedTargetId) return;
    onSubmitVote(selectedTargetId);
    setShowConfirmModal(false);
  };

  const selectedCandidateObj = room.players.find(p => p.id === selectedTargetId);
  const votedCandidateObj = room.players.find(p => p.id === mySubmittedVoteId);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 space-stars">
      {/* Header */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-950/80 border border-red-700/60 text-red-400 text-xs font-black uppercase tracking-widest mb-3">
          <Vote className="w-4 h-4 text-red-500 animate-pulse" />
          <span>{isTiebreaker ? 'TIEBREAKER REVOTE' : 'SECRET EJECTION BALLOT'}</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
          WHO IS THE IMPOSTER?
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm mt-2 max-w-md mx-auto font-mono uppercase">
          {isTiebreaker
            ? 'FINAL DECISIVE REVOTE BETWEEN THE TIED SUSPECTS.'
            : 'CAST YOUR VOTE TO EJECT THE SUSPECT FROM THE SHIP.'}
        </p>
      </div>

      {/* Already Voted Card */}
      {hasVoted ? (
        <div className="rounded-3xl bg-[#090b12] border-2 border-emerald-600/60 p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-black border border-emerald-500/60 flex items-center justify-center text-emerald-400 mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-heading text-2xl font-black text-white uppercase tracking-wider mb-2">VOTE ENCRYPTED</h2>
          <p className="text-xs text-zinc-300 font-mono">
            You voted to eject: <span className="font-black text-emerald-400 uppercase underline">{votedCandidateObj?.name || 'CREWMATE'}</span>
          </p>
          <p className="text-[11px] text-zinc-500 font-mono uppercase mt-2">
            STAND BY • BALLOTS WILL BE REVEALED SIMULTANEOUSLY
          </p>
        </div>
      ) : (
        /* Candidates Grid */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase px-1">
            <span>SELECT A SUSPECT:</span>
            <span>SELF-VOTING PROHIBITED</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {candidates.map((p) => {
              const isMe = p.id === me.id;
              const isSelected = selectedTargetId === p.id;
              const answerObj = room.revealedAnswers?.find(a => a.playerId === p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => !isMe && handleCandidateClick(p.id)}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isMe
                      ? 'bg-black/40 border-zinc-900 opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-red-950/80 border-red-500 shadow-xl glow-red scale-[1.02] cursor-pointer'
                      : 'bg-[#090b12] border-zinc-900 hover:border-red-900/60 hover:bg-black cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-black border border-zinc-800 flex items-center justify-center shrink-0">
                      <CrewmateIcon colorId={p.avatar} size={36} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm truncate uppercase">{p.name}</span>
                        {isMe && (
                          <span className="text-[9px] font-bold text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded uppercase">
                            (YOU)
                          </span>
                        )}
                      </div>
                      {answerObj && (
                        <span className="text-xs text-zinc-400 block truncate mt-0.5 font-mono">
                          Answered: <strong className="text-red-400 font-bold uppercase">{answerObj.targetPlayerName}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {!isMe && (
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'border-red-500 bg-red-600 text-white' : 'border-zinc-800'
                    }`}>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!selectedTargetId}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-red-950/80 flex items-center justify-center gap-2 transition-all cursor-pointer border border-red-500/50"
            >
              <Vote className="w-5 h-5" />
              <span>CONFIRM VOTE TO EJECT {selectedCandidateObj?.name || 'SUSPECT'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="rounded-3xl bg-[#090b12] border border-zinc-900 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-red-500" />
            <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider">
              BALLOTS CAST
            </h3>
          </div>
          <span className="font-mono text-sm font-black text-red-400">
            {room.submittedVoteCount} / {room.totalEligibleVotes}
          </span>
        </div>

        <div className="w-full h-2.5 bg-black rounded-full overflow-hidden border border-zinc-900 mb-4">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
            style={{
              width: `${(room.submittedVoteCount / Math.max(1, room.totalEligibleVotes)) * 100}%`
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {room.players.map((p) => {
            const hasVotedThis = room.hasSubmittedVoteList.includes(p.id);
            return (
              <div
                key={p.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono uppercase border ${
                  hasVotedThis
                    ? 'bg-black border-emerald-900 text-emerald-400'
                    : 'bg-black border-zinc-900 text-zinc-600'
                }`}
              >
                <CrewmateIcon colorId={p.avatar} size={18} />
                <span className="truncate max-w-[100px]">{p.name}</span>
                {hasVotedThis ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {isHost && (
          <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-500 uppercase">
              Host Override: Force conclude vote if a player is unresponsive.
            </span>
            <button
              onClick={() => setShowForceEndModal(true)}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-black uppercase transition-colors"
            >
              FORCE REVEAL
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedCandidateObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-[#090b12] border-2 border-red-600 p-6 shadow-2xl text-center">
            <div className="w-20 h-20 rounded-2xl bg-black border border-red-900 flex items-center justify-center mx-auto mb-4">
              <CrewmateIcon colorId={selectedCandidateObj.avatar} size={50} />
            </div>
            <h4 className="font-heading text-xl font-black text-white uppercase mb-1">
              EJECT {selectedCandidateObj.name}?
            </h4>
            <p className="text-xs text-zinc-400 mb-6 font-mono uppercase">
              You are voting to eject this crewmate as the secret Imposter. This ballot is final.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-bold uppercase"
              >
                ABORT
              </button>
              <button
                onClick={handleConfirmVote}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase shadow-lg shadow-red-950/80 cursor-pointer"
              >
                CONFIRM VOTE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force End Confirmation Modal */}
      {showForceEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl bg-[#090b12] border-2 border-red-600 p-6 shadow-2xl text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h4 className="font-heading text-lg font-black text-white uppercase mb-2">END VOTING PROTOCOL?</h4>
            <p className="text-xs text-zinc-400 mb-6 font-mono">
              Only {room.submittedVoteCount} of {room.totalEligibleVotes} crewmates have voted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForceEndModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-bold uppercase"
              >
                WAIT
              </button>
              <button
                onClick={() => {
                  setShowForceEndModal(false);
                  onForceEndVoting();
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
