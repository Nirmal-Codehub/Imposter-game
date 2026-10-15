import React, { useState } from 'react';
import {
  Copy,
  Check,
  Users,
  Play,
  Crown,
  CheckCircle2,
  Circle,
  UserX,
  Shuffle,
  Settings,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Skull,
  Radio,
  Target
} from 'lucide-react';
import { PlayerClientState, RoomSettings } from '../types/game.ts';
import { getRandomQuestionPair } from '../lib/questionPacks.ts';
import { CrewmateIcon } from './CrewmateIcon.tsx';

interface Props {
  gameState: PlayerClientState;
  onToggleReady: () => void;
  onStartRound: () => void;
  onUpdateSettings: (settings: Partial<RoomSettings>) => void;
  onSetQuestions: (commonQuestion: string, imposterQuestion: string) => void;
  onSelectImposter: (imposterPlayerIds: string[]) => void;
  onKickPlayer: (playerId: string) => void;
}

export const LobbyScreen: React.FC<Props> = ({
  gameState,
  onToggleReady,
  onStartRound,
  onUpdateSettings,
  onSetQuestions,
  onSelectImposter,
  onKickPlayer
}) => {
  const { room, me, isHost } = gameState;
  const [copied, setCopied] = useState(false);
  const [showSettingsAccordion, setShowSettingsAccordion] = useState(false);

  // Draft questions state for host
  const [commonQ, setCommonQ] = useState(gameState.hostCommonQuestionDraft || 'Who is most likely to quit their job?');
  const [imposterQ, setImposterQ] = useState(gameState.hostImposterQuestionDraft || 'Who is most likely to get employee of the month?');
  const [questionsDirty, setQuestionsDirty] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}?code=${room.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRandomize = () => {
    const pair = getRandomQuestionPair();
    setCommonQ(pair.commonQuestion);
    setImposterQ(pair.imposterQuestion);
    onSetQuestions(pair.commonQuestion, pair.imposterQuestion);
    setQuestionsDirty(false);
  };

  const handleSaveQuestions = (e: React.FormEvent) => {
    e.preventDefault();
    onSetQuestions(commonQ.trim(), imposterQ.trim());
    setQuestionsDirty(false);
  };

  const selectedImposters = new Set(gameState.hostSelectedImposterIds || []);

  const handleToggleImposterSelect = (targetPlayerId: string) => {
    if (!isHost) return;
    const next = new Set(selectedImposters);
    if (next.has(targetPlayerId)) {
      next.delete(targetPlayerId);
    } else {
      if (next.size >= room.settings.imposterCount) {
        next.clear();
      }
      next.add(targetPlayerId);
    }
    onSelectImposter(Array.from(next));
  };

  const minPlayersMet = room.players.length >= 3;
  const hasSelectedImposter = room.settings.autoAssignImposter || selectedImposters.size > 0;
  const questionsFilled = commonQ.trim().length > 3 && imposterQ.trim().length > 3;
  const canStart = minPlayersMet && hasSelectedImposter && questionsFilled;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 space-stars">
      {/* Dropship Room Header */}
      <div className="rounded-3xl bg-[#090b12] border-2 border-red-950 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                {room.roomName || 'THE SKELD'}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-400 font-mono uppercase">Round {room.roundNumber}</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black text-white flex items-center gap-3 uppercase tracking-wider">
              <span>DROPSHIP LOBBY</span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black border border-red-900/60 text-red-400 text-xs font-mono font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>{room.players.length} CREWMATES</span>
              </div>
            </h1>
          </div>

          {/* Room Code */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-black p-2.5 rounded-2xl border border-red-950">
            <div className="px-4 py-1.5 text-center">
              <span className="text-[9px] uppercase font-mono font-black tracking-widest text-zinc-500 block">ROOM CODE</span>
              <span className="font-mono text-2xl font-black tracking-widest text-red-400">{room.roomCode}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'COPIED!' : 'SHARE LINK'}</span>
            </button>
          </div>
        </div>

        {!minPlayersMet && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center gap-2 font-mono uppercase">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>MINIMUM 3 CREWMATES REQUIRED TO LAUNCH ({room.players.length}/3)</span>
          </div>
        )}
      </div>

      {/* Host Directives Configuration */}
      {isHost && (
        <div className="rounded-3xl bg-[#090b12] border border-red-950 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h2 className="font-heading text-base font-black text-white uppercase tracking-wider">
                HOST MISSION DIRECTIVES
              </h2>
            </div>
            <button
              onClick={handleRandomize}
              className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-white bg-black hover:bg-zinc-900 px-3 py-1.5 rounded-xl border border-red-900 transition-colors uppercase font-bold"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>SHUFFLE</span>
            </button>
          </div>

          <form onSubmit={handleSaveQuestions} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-black border border-zinc-800">
                <label className="block text-[11px] font-black text-cyan-400 mb-1.5 uppercase tracking-wider">
                  Crew Directive (Given to normal crew)
                </label>
                <textarea
                  rows={2}
                  value={commonQ}
                  onChange={(e) => {
                    setCommonQ(e.target.value);
                    setQuestionsDirty(true);
                  }}
                  className="w-full bg-[#07080f] border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white resize-none outline-none font-medium"
                  placeholder="e.g. Who is most likely to quit their job?"
                />
              </div>

              <div className="p-4 rounded-2xl bg-black border border-red-950">
                <label className="block text-[11px] font-black text-red-500 mb-1.5 uppercase tracking-wider">
                  Imposter Directive (Secret Imposter Only)
                </label>
                <textarea
                  rows={2}
                  value={imposterQ}
                  onChange={(e) => {
                    setImposterQ(e.target.value);
                    setQuestionsDirty(true);
                  }}
                  className="w-full bg-[#07080f] border border-red-900/60 focus:border-red-500 rounded-xl p-3 text-xs text-white resize-none outline-none font-medium"
                  placeholder="e.g. Who is most likely to get employee of the month?"
                />
              </div>
            </div>

            {questionsDirty && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-md"
                >
                  SAVE DIRECTIVES
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Crewmates Grid */}
      <div className="rounded-3xl bg-[#090b12] border border-zinc-900 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-500" />
            <h2 className="font-heading text-base font-black text-white uppercase tracking-wider">
              CREW MANIFEST
            </h2>
          </div>
          {isHost && (
            <div className="text-xs font-mono">
              {room.settings.autoAssignImposter ? (
                <span className="text-zinc-400">RANDOM IMPOSTER ASSIGNMENT ACTIVE</span>
              ) : (
                <span className="text-red-400 font-bold uppercase">
                  TAP CREWMATE TO DESIGNATE AS IMPOSTER ({selectedImposters.size}/{room.settings.imposterCount})
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {room.players.map((p) => {
            const isMe = p.id === me.id;
            const isSelectedImposter = selectedImposters.has(p.id);

            return (
              <div
                key={p.id}
                onClick={() => isHost && !room.settings.autoAssignImposter && handleToggleImposterSelect(p.id)}
                className={`relative p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isSelectedImposter
                    ? 'bg-red-950/40 border-red-500 ring-2 ring-red-500 shadow-xl glow-red'
                    : isMe
                    ? 'bg-zinc-900/60 border-zinc-700'
                    : 'bg-black/60 border-zinc-900 hover:border-zinc-800'
                } ${isHost && !room.settings.autoAssignImposter ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-black border border-zinc-800 flex items-center justify-center shrink-0">
                    <CrewmateIcon colorId={p.avatar} size={36} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-white text-sm truncate uppercase tracking-wide">{p.name}</span>
                      {isMe && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          YOU
                        </span>
                      )}
                      {p.isHost && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-0.5">
                          HOST
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px]">
                      <span className={p.isReady ? 'text-emerald-400' : 'text-zinc-500'}>
                        {p.isReady ? '✓ READY' : 'STANDBY'}
                      </span>
                      {isSelectedImposter && isHost && (
                        <span className="font-bold px-1.5 py-0.2 rounded bg-red-900 text-white border border-red-600">
                          IMPOSTER
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Host kick button */}
                {isHost && !p.isHost && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Eject ${p.name} from the dropship?`)) {
                        onKickPlayer(p.id);
                      }
                    }}
                    title={`Kick ${p.name}`}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Settings Accordion */}
      {isHost && (
        <div className="rounded-2xl bg-[#090b12] border border-zinc-900 overflow-hidden">
          <button
            onClick={() => setShowSettingsAccordion(!showSettingsAccordion)}
            className="w-full flex items-center justify-between p-4 text-xs font-black text-zinc-400 uppercase tracking-widest hover:bg-zinc-900/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-red-500" />
              <span>GAME RULES &amp; PARAMETERS</span>
            </div>
            {showSettingsAccordion ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showSettingsAccordion && (
            <div className="p-4 pt-0 space-y-4 border-t border-zinc-900 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold uppercase text-[10px]">MEETING TIME</label>
                  <select
                    value={room.settings.discussionSeconds}
                    onChange={(e) => onUpdateSettings({ discussionSeconds: Number(e.target.value) })}
                    className="w-full bg-black text-white rounded-xl p-2.5 border border-zinc-800 outline-none font-bold"
                  >
                    <option value={60}>60 Seconds</option>
                    <option value={90}>90 Seconds</option>
                    <option value={120}>120 Seconds</option>
                    <option value={180}>180 Seconds</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold uppercase text-[10px]">VOTING TIME</label>
                  <select
                    value={room.settings.votingSeconds}
                    onChange={(e) => onUpdateSettings({ votingSeconds: Number(e.target.value) })}
                    className="w-full bg-black text-white rounded-xl p-2.5 border border-zinc-800 outline-none font-bold"
                  >
                    <option value={30}>30 Seconds</option>
                    <option value={45}>45 Seconds</option>
                    <option value={60}>60 Seconds</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={room.settings.allowHostToPlay}
                    onChange={(e) => onUpdateSettings({ allowHostToPlay: e.target.checked })}
                    className="rounded bg-black border-red-900 text-red-600 focus:ring-0"
                  />
                  <span>Host plays as active crewmate</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={room.settings.autoAssignImposter}
                    onChange={(e) => onUpdateSettings({ autoAssignImposter: e.target.checked })}
                    className="rounded bg-black border-red-900 text-red-600 focus:ring-0"
                  />
                  <span>Auto-assign imposter randomly</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Start / Ready Bar */}
      <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-[#090b12]/95 backdrop-blur-md border-2 border-red-900/60 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs font-mono text-zinc-400 text-center sm:text-left uppercase">
          {isHost ? (
            !minPlayersMet ? (
              <span className="text-red-400">WAITING FOR MINIMUM 3 CREWMATES...</span>
            ) : !hasSelectedImposter ? (
              <span className="text-amber-400">DESIGNATE THE IMPOSTER OR TOGGLE RANDOM</span>
            ) : (
              <span className="text-emerald-400">ALL SYSTEMS READY TO LAUNCH</span>
            )
          ) : (
            <span>STAND BY FOR HOST TO INITIATE MISSION</span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isHost && (
            <button
              onClick={onToggleReady}
              className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                me.isReady
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              {me.isReady ? '✓ READY' : 'READY UP'}
            </button>
          )}

          {isHost && (
            <button
              onClick={onStartRound}
              disabled={!canStart}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-red-950/80 transition-all cursor-pointer border border-red-500/50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>INITIATE MISSION</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
