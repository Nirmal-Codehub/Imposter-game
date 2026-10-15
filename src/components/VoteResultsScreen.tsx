import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  ShieldAlert,
  ShieldCheck,
  Vote,
  Award,
  Crown,
  Play,
  Users,
  CheckCircle2,
  XCircle,
  Skull
} from 'lucide-react';
import { PlayerClientState } from '../types/game.ts';
import { CrewmateIcon } from './CrewmateIcon.tsx';

interface Props {
  gameState: PlayerClientState;
  onNextRound: (commonQuestion?: string, imposterQuestion?: string) => void;
  onEndGame: () => void;
}

export const VoteResultsScreen: React.FC<Props> = ({
  gameState,
  onNextRound,
  onEndGame
}) => {
  const { room, me, isHost } = gameState;
  const [activeTab, setActiveTab] = useState<'VERDICT' | 'SCORING' | 'LEADERBOARD'>('VERDICT');

  const isCaught = room.imposterCaught;
  const actualImposterIds = room.actualImposterIds || [];
  const imposterPlayers = room.players.filter(p => actualImposterIds.includes(p.id));
  const imposterNames = imposterPlayers.map(p => p.name).join(', ') || 'Unknown';

  const roundScores = room.roundScores || [];
  const leaderboard = room.cumulativeLeaderboard || [];
  const revealedVotes = room.revealedVotes || [];
  const revealedAnswers = room.revealedAnswers || [];

  const eliminatedPlayer = room.players.find(p => p.id === room.eliminatedPlayerId);

  useEffect(() => {
    if (isCaught) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  }, [isCaught]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 space-stars">
      {/* Iconic Among Us Ejection Screen Banner */}
      <div className={`rounded-3xl border-2 p-6 sm:p-10 shadow-2xl text-center relative overflow-hidden ${
        isCaught
          ? 'bg-gradient-to-b from-[#090b12] to-emerald-950/40 border-emerald-600 shadow-emerald-950/60'
          : 'bg-gradient-to-b from-[#090b12] to-red-950/50 border-red-600 shadow-red-950/80 glow-red'
      }`}>
        <div className="flex justify-center mb-4">
          <CrewmateIcon
            colorId={eliminatedPlayer?.avatar || (isCaught ? imposterPlayers[0]?.avatar : 'red')}
            size={70}
            isDead={!isCaught}
          />
        </div>

        <div className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-mono font-black uppercase tracking-widest mb-3 ${
          isCaught
            ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
            : 'bg-red-950 border border-red-600 text-red-400'
        }`}>
          {isCaught ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <Skull className="w-4 h-4 text-red-500 animate-pulse" />}
          <span>{isCaught ? 'IMPOSTER EJECTED' : 'DEFEAT • IMPOSTER ESCAPED'}</span>
        </div>

        {/* Among Us Classic Ejection Text */}
        <h1 className="font-heading text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
          {room.wasTieUnresolved ? (
            <span>NOBODY WAS EJECTED. (TIE)</span>
          ) : isCaught ? (
            <span>
              <span className="text-emerald-400 underline">{eliminatedPlayer?.name}</span> WAS AN IMPOSTER.
            </span>
          ) : eliminatedPlayer ? (
            <span>
              <span className="text-red-500 underline">{eliminatedPlayer?.name}</span> WAS NOT AN IMPOSTER.
            </span>
          ) : (
            <span>THE IMPOSTER ESCAPED.</span>
          )}
        </h1>

        <p className="text-zinc-400 font-mono text-xs sm:text-sm mt-3 uppercase font-bold">
          {isCaught ? (
            <span className="text-emerald-400">0 Imposters remain. The crew has secured the ship!</span>
          ) : (
            <span className="text-red-400">The actual imposter was {imposterNames}.</span>
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-black border border-zinc-900 p-1">
        <button
          onClick={() => setActiveTab('VERDICT')}
          className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'VERDICT' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>VOTES &amp; CLUES</span>
        </button>

        <button
          onClick={() => setActiveTab('SCORING')}
          className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'SCORING' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>SCORE AUDIT</span>
        </button>

        <button
          onClick={() => setActiveTab('LEADERBOARD')}
          className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'LEADERBOARD' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>LEADERBOARD</span>
        </button>
      </div>

      {/* TAB 1: VERDICT */}
      {activeTab === 'VERDICT' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#090b12] border border-cyan-900/60 shadow-lg">
              <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 block mb-1">
                CREW DIRECTIVE:
              </span>
              <p className="text-sm font-bold text-white">&ldquo;{room.revealedCommonQuestion}&rdquo;</p>
              <span className="text-[10px] font-mono text-zinc-500 mt-2 block uppercase">
                Assigned to: {room.players.filter(p => !actualImposterIds.includes(p.id)).map(p => p.name).join(', ')}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#090b12] border border-red-900/60 shadow-lg">
              <span className="text-[10px] font-mono font-bold uppercase text-red-500 block mb-1">
                IMPOSTER DIRECTIVE:
              </span>
              <p className="text-sm font-bold text-white">&ldquo;{room.revealedImposterQuestion}&rdquo;</p>
              <span className="text-[10px] font-mono text-zinc-500 mt-2 block uppercase">
                Assigned to: <strong className="text-red-400">{imposterNames}</strong>
              </span>
            </div>
          </div>

          {/* Submitted Answers */}
          <div className="rounded-3xl bg-[#090b12] border border-zinc-900 p-6 shadow-xl">
            <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              <span>SUBMITTED ANSWERS</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {revealedAnswers.map((item) => {
                const isThisPlayerImposter = actualImposterIds.includes(item.playerId);
                const pl = room.players.find(p => p.id === item.playerId);
                return (
                  <div
                    key={item.playerId}
                    className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      isThisPlayerImposter
                        ? 'bg-red-950/40 border-red-600'
                        : 'bg-black border-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CrewmateIcon colorId={pl?.avatar} size={28} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white uppercase">{item.playerName}</span>
                          {isThisPlayerImposter && (
                            <span className="text-[9px] font-black px-1 rounded bg-red-600 text-black uppercase">
                              IMPOSTER
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">Answered:</span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-red-400 uppercase">{item.targetPlayerName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Who Voted For Whom */}
          <div className="rounded-3xl bg-[#090b12] border border-zinc-900 p-6 shadow-xl">
            <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Vote className="w-4 h-4 text-red-500" />
              <span>BALLOT LOG (WHO VOTED FOR WHOM)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {revealedVotes.map((v, i) => {
                const votedCorrectly = actualImposterIds.includes(v.votedForId);
                const voter = room.players.find(p => p.id === v.voterId);
                const target = room.players.find(p => p.id === v.votedForId);

                return (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-black border border-zinc-900 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CrewmateIcon colorId={voter?.avatar} size={24} />
                      <span className="font-black text-white uppercase truncate">{v.voterName}</span>
                      <span className="text-zinc-600 font-mono">→</span>
                      <CrewmateIcon colorId={target?.avatar} size={24} />
                      <span className="font-black text-zinc-300 uppercase truncate">{v.votedForName}</span>
                    </div>
                    {votedCorrectly ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold text-[10px] border border-emerald-800 shrink-0">
                        CORRECT
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-mono font-bold text-[10px] border border-red-900 shrink-0">
                        INNOCENT
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCORING AUDIT */}
      {activeTab === 'SCORING' && (
        <div className="rounded-3xl bg-[#090b12] border border-zinc-900 p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div>
              <h3 className="font-heading text-sm font-black text-white uppercase tracking-wider">ROUND SCORE AUDIT</h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase">Points awarded or deducted this mission</p>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 bg-black px-2.5 py-1 rounded-lg border border-zinc-900">
              +2 Correct • -1 Innocent • +3 Imposter Escape • -2 Falsely Ejected • +1 Team Bonus
            </div>
          </div>

          <div className="space-y-2.5">
            {roundScores.map((scoreItem) => {
              const playerObj = room.players.find(p => p.id === scoreItem.playerId);
              const isImposter = actualImposterIds.includes(scoreItem.playerId);
              const isPositive = scoreItem.roundScore > 0;
              const isZero = scoreItem.roundScore === 0;

              return (
                <div
                  key={scoreItem.playerId}
                  className="p-3.5 rounded-2xl bg-black border border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <CrewmateIcon colorId={playerObj?.avatar} size={36} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm uppercase">{scoreItem.playerName}</span>
                        {isImposter && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-600 text-black">
                            IMPOSTER
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {scoreItem.scoreReasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#090b12] text-zinc-400 border border-zinc-800"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-mono text-xl font-black ${
                      isPositive ? 'text-emerald-400' : isZero ? 'text-zinc-500' : 'text-red-500'
                    }`}>
                      {scoreItem.roundScore > 0 ? `+${scoreItem.roundScore}` : scoreItem.roundScore} PTS
                    </span>
                    <span className="text-[10px] font-mono text-zinc-600 uppercase block">Total: {scoreItem.totalScore}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LEADERBOARD */}
      {activeTab === 'LEADERBOARD' && (
        <div className="rounded-3xl bg-[#090b12] border border-zinc-900 p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div>
              <h3 className="font-heading text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>OVERALL MISSION STANDINGS</span>
              </h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase">Cumulative points across all dropship rounds</p>
            </div>
            <span className="text-xs font-mono text-red-400 bg-black px-2.5 py-1 rounded-lg border border-red-950">
              ROUND {room.roundNumber}
            </span>
          </div>

          <div className="space-y-2">
            {leaderboard.map((playerScore, idx) => {
              const isFirst = idx === 0;
              const isMe = playerScore.playerId === me.id;
              const playerObj = room.players.find(p => p.id === playerScore.playerId);

              return (
                <div
                  key={playerScore.playerId}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isFirst
                      ? 'bg-gradient-to-r from-red-950/40 via-black to-red-950/40 border-red-500/80 shadow-lg glow-red'
                      : isMe
                      ? 'bg-zinc-900/50 border-zinc-700'
                      : 'bg-black border-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl font-heading font-black text-xs flex items-center justify-center shrink-0 ${
                      isFirst ? 'bg-red-600 text-white' : 'bg-[#090b12] text-zinc-500 border border-zinc-800'
                    }`}>
                      {isFirst ? <Crown className="w-4 h-4 text-amber-300" /> : `#${idx + 1}`}
                    </div>
                    <CrewmateIcon colorId={playerObj?.avatar} size={36} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-white text-sm uppercase truncate">{playerScore.playerName}</span>
                        {isMe && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                            YOU
                          </span>
                        )}
                        {isFirst && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-900 text-red-200 border border-red-600">
                            TOP CREWMATE
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {playerScore.correctVotes} correct imposter identifications
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-heading font-black text-2xl text-red-400 block">
                      {playerScore.totalScore}
                    </span>
                    <span className="text-[9px] uppercase font-mono font-bold text-zinc-600">POINTS</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Host Controls */}
      {isHost ? (
        <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-[#090b12]/95 backdrop-blur-md border-2 border-red-900/60 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-mono text-zinc-500 text-center sm:text-left uppercase">
            Cumulative scores are preserved for subsequent rounds.
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onEndGame}
              className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-black uppercase transition-colors"
            >
              END GAME
            </button>
            <button
              onClick={() => onNextRound()}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-red-950/80 transition-all cursor-pointer border border-red-500/50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>NEXT MISSION (ROUND {room.roundNumber + 1})</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#090b12] border border-zinc-900 text-center">
          <p className="text-xs font-mono text-zinc-500 uppercase">
            STAND BY FOR HOST TO INITIATE NEXT ROUND...
          </p>
        </div>
      )}
    </div>
  );
};
