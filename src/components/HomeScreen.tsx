import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Users,
  Play,
  PlusCircle,
  LogIn,
  Shuffle,
  Clock,
  CheckCircle2,
  Lock,
  Skull,
  Radio,
  Eye,
  Vote,
  Target
} from 'lucide-react';
import { getRandomQuestionPair } from '../lib/questionPacks.ts';
import { RoomSettings } from '../types/game.ts';
import { CREWMATE_COLORS, CrewmateIcon } from './CrewmateIcon.tsx';

interface Props {
  onCreateRoom: (
    hostName: string,
    roomName: string,
    avatar: string,
    settings: Partial<RoomSettings>,
    commonQuestion: string,
    imposterQuestion: string
  ) => void;
  onJoinRoom: (roomCode: string, playerName: string, avatar: string) => void;
  initialCode?: string;
}

export const HomeScreen: React.FC<Props> = ({ onCreateRoom, onJoinRoom, initialCode = '' }) => {
  const [modalMode, setModalMode] = useState<'NONE' | 'CREATE' | 'JOIN'>('NONE');

  // Form states
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('THE SKELD');
  const [roomCode, setRoomCode] = useState(initialCode);
  const [selectedColor, setSelectedColor] = useState('red');

  // Create form settings
  const [commonQuestion, setCommonQuestion] = useState('');
  const [imposterQuestion, setImposterQuestion] = useState('');
  const [imposterCount, setImposterCount] = useState(1);
  const [discussionSeconds, setDiscussionSeconds] = useState(120);
  const [votingSeconds, setVotingSeconds] = useState(60);
  const [allowHostToPlay, setAllowHostToPlay] = useState(true);
  const [autoAssignImposter, setAutoAssignImposter] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setRoomCode(initialCode.toUpperCase());
      setModalMode('JOIN');
    }
  }, [initialCode]);

  const handleRandomizeQuestions = () => {
    const pair = getRandomQuestionPair();
    setCommonQuestion(pair.commonQuestion);
    setImposterQuestion(pair.imposterQuestion);
  };

  const handleOpenCreateModal = () => {
    if (!commonQuestion || !imposterQuestion) {
      handleRandomizeQuestions();
    }
    setModalMode('CREATE');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!commonQuestion.trim() || !imposterQuestion.trim()) return;

    onCreateRoom(
      name.trim(),
      roomName.trim() || 'THE SKELD',
      selectedColor,
      {
        imposterCount,
        discussionSeconds,
        votingSeconds,
        timersEnabled: true,
        allowHostToPlay,
        autoAssignImposter
      },
      commonQuestion.trim(),
      imposterQuestion.trim()
    );
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) return;
    onJoinRoom(roomCode.trim().toUpperCase(), name.trim(), selectedColor);
  };

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-stars">
      {/* Red ambient alarms */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Hero */}
      <section className="relative z-10 text-center pt-8 pb-10 sm:pt-14 max-w-3xl mx-auto">
        {/* Animated Crewmate */}
        <div className="flex justify-center mb-5">
          <div className="relative p-3 rounded-3xl bg-black/60 border border-red-900/60 shadow-2xl glow-red">
            <CrewmateIcon colorId="red" size={80} />
            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-red-600 text-black font-black text-[10px] tracking-widest uppercase">
              SUSPECT
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/80 border border-red-700/60 text-red-400 text-xs font-bold mb-4 uppercase tracking-widest">
          <Skull className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span>SOCIAL DEDUCTION SURVIVAL</span>
        </div>

        <h1 className="font-heading font-black text-6xl sm:text-8xl tracking-tight text-white mb-2">
          <span className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
            IMPOSTER
          </span>
        </h1>

        <p className="text-base sm:text-xl font-bold text-zinc-300 mb-8 max-w-lg mx-auto tracking-wide uppercase">
          There is an imposter among us.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-base uppercase tracking-wider shadow-xl shadow-red-950/80 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-red-500/50"
          >
            <PlusCircle className="w-5 h-5 text-red-200" />
            <span>HOST GAME</span>
          </button>

          <button
            onClick={() => setModalMode('JOIN')}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-black/90 hover:bg-zinc-900 border-2 border-red-600 hover:border-red-500 text-red-400 hover:text-white font-black text-base uppercase tracking-wider shadow-xl shadow-black/80 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <LogIn className="w-5 h-5 text-red-400" />
            <span>JOIN GAME</span>
          </button>
        </div>

        <p className="text-xs text-zinc-500 mt-4 font-mono uppercase tracking-wider">
          Works on all phones, tablets &amp; browsers • No accounts required
        </p>
      </section>

      {/* Rules / Game Mission Cards */}
      <section className="relative z-10 max-w-4xl mx-auto w-full mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-black/80 border border-red-950 hover:border-red-700/60 transition-colors shadow-lg">
            <div className="flex items-center gap-2 mb-2 text-red-500">
              <Eye className="w-5 h-5" />
              <span className="font-heading font-black text-xs uppercase tracking-wider text-white">1. SECRET CLUES</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Crewmates receive Directive A. The hidden Imposter receives a contrasting Directive B.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/80 border border-red-950 hover:border-red-700/60 transition-colors shadow-lg">
            <div className="flex items-center gap-2 mb-2 text-red-500">
              <Target className="w-5 h-5" />
              <span className="font-heading font-black text-xs uppercase tracking-wider text-white">2. NAME A SUSPECT</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every player privately enters one crewmate&apos;s name as their answer. No one knows which directive you got.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/80 border border-red-950 hover:border-red-700/60 transition-colors shadow-lg">
            <div className="flex items-center gap-2 mb-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-heading font-black text-xs uppercase tracking-wider text-white">3. EMERGENCY MEETING</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              All answers and both directives reveal at once. Cross-examine everyone to spot suspicious answers.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/80 border border-red-950 hover:border-red-700/60 transition-colors shadow-lg">
            <div className="flex items-center gap-2 mb-2 text-red-500">
              <Vote className="w-5 h-5" />
              <span className="font-heading font-black text-xs uppercase tracking-wider text-white">4. EJECTION VOTE</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Vote to eject the Imposter. Catch them for victory points, or watch them deceive the crew and escape!
            </p>
          </div>
        </div>
      </section>

      {/* CREATE GAME MODAL */}
      {modalMode === 'CREATE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 rounded-3xl bg-[#090b12] border-2 border-red-600 shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-red-950 mb-5">
              <div className="flex items-center gap-2.5">
                <Skull className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="font-heading text-xl font-black text-white uppercase tracking-wider">HOST DROPSHIP</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">Configure room directives &amp; imposters</p>
                </div>
              </div>
              <button
                onClick={() => setModalMode('NONE')}
                className="text-zinc-500 hover:text-white p-2 rounded-xl text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Host Name & Color Picker */}
              <div>
                <label className="block text-[11px] font-black text-zinc-300 uppercase tracking-wider mb-1.5">
                  CREWMATE CALLSIGN *
                </label>
                <div className="flex gap-2">
                  <div className="w-12 h-12 rounded-xl bg-black border border-red-900/60 flex items-center justify-center shrink-0">
                    <CrewmateIcon colorId={selectedColor} size={36} />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={18}
                    placeholder="Enter callsign (e.g. Red, Ghost)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-black border border-red-900/60 focus:border-red-500 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 outline-none font-bold text-sm"
                  />
                </div>

                {/* Color Chooser */}
                <div className="grid grid-cols-6 gap-1.5 mt-2.5">
                  {CREWMATE_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setSelectedColor(c.id)}
                      className={`h-9 rounded-xl flex items-center justify-center transition-all ${
                        selectedColor === c.id ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.body }}
                      title={c.name}
                    >
                      <CrewmateIcon colorId={c.id} size={24} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Directives */}
              <div className="p-4 rounded-2xl bg-black border border-red-950 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-red-400 uppercase tracking-wider">
                    ROUND 1 DIRECTIVES
                  </span>
                  <button
                    type="button"
                    onClick={handleRandomizeQuestions}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-white bg-red-950/80 px-2.5 py-1 rounded-lg border border-red-800 transition-colors"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>SHUFFLE</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 uppercase font-bold">
                    Crew Directive (Given to normal crew)
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={commonQuestion}
                    onChange={(e) => setCommonQuestion(e.target.value)}
                    className="w-full bg-[#07080f] border border-zinc-800 focus:border-red-500 rounded-xl p-2.5 text-xs text-white resize-none outline-none"
                    placeholder="e.g. Who is most likely to quit their job?"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-red-400 mb-1 uppercase font-bold">
                    Imposter Directive (Given ONLY to the secret imposter)
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={imposterQuestion}
                    onChange={(e) => setImposterQuestion(e.target.value)}
                    className="w-full bg-[#07080f] border border-red-900/60 focus:border-red-500 rounded-xl p-2.5 text-xs text-white resize-none outline-none"
                    placeholder="e.g. Who is most likely to get employee of the month?"
                  />
                </div>
              </div>

              {/* Emergency Meeting Time */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black border border-zinc-900">
                  <label className="block text-zinc-400 mb-1 font-bold uppercase text-[10px]">MEETING TIMER</label>
                  <select
                    value={discussionSeconds}
                    onChange={(e) => setDiscussionSeconds(Number(e.target.value))}
                    className="w-full bg-[#090b12] text-white rounded-lg p-2 border border-zinc-800 outline-none font-bold"
                  >
                    <option value={60}>60 Seconds</option>
                    <option value={90}>90 Seconds</option>
                    <option value={120}>120 Seconds</option>
                    <option value={180}>180 Seconds</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-black border border-zinc-900">
                  <label className="block text-zinc-400 mb-1 font-bold uppercase text-[10px]">IMPOSTERS</label>
                  <select
                    value={imposterCount}
                    onChange={(e) => setImposterCount(Number(e.target.value))}
                    className="w-full bg-[#090b12] text-white rounded-lg p-2 border border-zinc-800 outline-none font-bold"
                  >
                    <option value={1}>1 Imposter</option>
                    <option value={2}>2 Imposters</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-1.5 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={allowHostToPlay}
                    onChange={(e) => setAllowHostToPlay(e.target.checked)}
                    className="rounded bg-black border-red-900 text-red-600 focus:ring-0"
                  />
                  <span>Host plays as active crewmate</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={autoAssignImposter}
                    onChange={(e) => setAutoAssignImposter(e.target.checked)}
                    className="rounded bg-black border-red-900 text-red-600 focus:ring-0"
                  />
                  <span>Randomly pick imposter (host does not select)</span>
                </label>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalMode('NONE')}
                  className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold text-xs uppercase"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-950/80 cursor-pointer"
                >
                  LAUNCH ROOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN GAME MODAL */}
      {modalMode === 'JOIN' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#090b12] border-2 border-red-600 shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-red-950 mb-5">
              <div className="flex items-center gap-2.5">
                <LogIn className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="font-heading text-xl font-black text-white uppercase tracking-wider">BOARD SHIP</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">Enter room access code</p>
                </div>
              </div>
              <button
                onClick={() => setModalMode('NONE')}
                className="text-zinc-500 hover:text-white p-2 rounded-xl text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-zinc-300 uppercase tracking-wider mb-1.5">
                  ROOM CODE *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="CODE"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-black border-2 border-red-800 focus:border-red-500 rounded-xl px-4 py-3 text-red-400 font-mono text-center tracking-widest text-2xl font-black uppercase outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-zinc-300 uppercase tracking-wider mb-1.5">
                  CREWMATE CALLSIGN *
                </label>
                <div className="flex gap-2">
                  <div className="w-12 h-12 rounded-xl bg-black border border-red-900/60 flex items-center justify-center shrink-0">
                    <CrewmateIcon colorId={selectedColor} size={36} />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={18}
                    placeholder="Enter callsign"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-black border border-red-900/60 focus:border-red-500 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 outline-none font-bold text-sm"
                  />
                </div>

                <div className="grid grid-cols-6 gap-1.5 mt-2.5">
                  {CREWMATE_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setSelectedColor(c.id)}
                      className={`h-9 rounded-xl flex items-center justify-center transition-all ${
                        selectedColor === c.id ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.body }}
                      title={c.name}
                    >
                      <CrewmateIcon colorId={c.id} size={24} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalMode('NONE')}
                  className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold text-xs uppercase"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || roomCode.length < 4}
                  className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-950/80 cursor-pointer"
                >
                  ENTER SHIP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clean game footer */}
      <footer className="text-center py-4 text-[11px] font-mono text-zinc-600 uppercase tracking-widest border-t border-red-950/40">
        IMPOSTER PROTOCOL • ACTIVE SATELLITE MULTIPLAYER
      </footer>
    </div>
  );
};
