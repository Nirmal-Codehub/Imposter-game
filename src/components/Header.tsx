import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, LogOut, Radio, AlertOctagon } from 'lucide-react';
import { sound } from '../lib/audio.ts';

interface Props {
  roomCode?: string;
  phase?: string;
  roundNumber?: number;
  isHost?: boolean;
  connected: boolean;
  onLeave: () => void;
}

export const Header: React.FC<Props> = ({
  roomCode,
  phase,
  roundNumber,
  isHost,
  connected,
  onLeave
}) => {
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  const handleCopy = () => {
    if (!roomCode) return;
    const shareUrl = `${window.location.origin}?code=${roomCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const getPhaseLabel = (p?: string) => {
    switch (p) {
      case 'LOBBY': return 'DROPSHIP';
      case 'ANSWERING': return 'TASKS / SECRET CLUES';
      case 'REVEAL': return 'CLUES REVEALED';
      case 'DISCUSSION': return 'EMERGENCY MEETING';
      case 'TIEBREAKER_DISCUSSION': return 'TIEBREAKER MEETING';
      case 'VOTING': return 'VOTING PROTOCOL';
      case 'TIEBREAKER_VOTING': return 'FINAL REVOTE';
      case 'RESULTS': return 'EJECTION REPORT';
      case 'LEADERBOARD': return 'MISSION LOG';
      default: return '';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#07080f]/95 backdrop-blur-md border-b border-red-950/60 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-b from-red-600 to-black border border-red-500/60 shadow-lg shadow-red-950/60">
            <AlertOctagon className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-xl tracking-wider text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]">
                IMPOSTER
              </span>
              {phase && (
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded bg-red-950/90 text-red-400 border border-red-800/60">
                  {getPhaseLabel(phase)} {roundNumber ? `• R${roundNumber}` : ''}
                </span>
              )}
            </div>
            <p className="hidden md:block text-[10px] text-zinc-500 tracking-wider uppercase font-semibold">
              There is an imposter among us
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {roomCode && (
            <div className="flex items-center gap-1.5 bg-black/90 border border-red-900/60 rounded-xl px-3 py-1 text-xs">
              <span className="text-zinc-500 hidden xs:inline uppercase text-[10px] font-bold">CODE:</span>
              <span className="font-mono font-black tracking-widest text-red-400">{roomCode}</span>
              <button
                onClick={handleCopy}
                title="Copy Invite Link"
                className="ml-1 p-1 text-zinc-400 hover:text-white hover:bg-red-950/50 rounded transition-colors"
                aria-label="Copy Invite Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Connection Indicator */}
          <div
            title={connected ? 'Live Satellite Link' : 'Signal Lost'}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-xl bg-black border border-zinc-800"
          >
            <Radio className={`w-3.5 h-3.5 ${connected ? 'text-red-500 animate-pulse' : 'text-zinc-600'}`} />
            <span className="hidden sm:inline text-zinc-400 text-[10px] font-bold uppercase">
              {connected ? 'ONLINE' : 'RECONNECTING'}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="p-2 rounded-xl bg-black border border-zinc-800 text-zinc-400 hover:text-white hover:border-red-600/50 transition-colors"
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-zinc-600" /> : <Volume2 className="w-4 h-4 text-red-400" />}
          </button>

          {/* Leave Button */}
          {roomCode && (
            <button
              onClick={() => {
                if (window.confirm('Abandon dropship and leave game?')) {
                  onLeave();
                }
              }}
              title="Leave Room"
              className="p-2 rounded-xl bg-red-950/40 border border-red-900/60 text-red-400 hover:bg-red-900/60 hover:text-white transition-colors"
              aria-label="Leave Room"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
