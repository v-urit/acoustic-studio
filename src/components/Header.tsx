import React from 'react';
import { Volume2, Activity } from 'lucide-react';

interface HeaderProps {
  isAudioPlaying?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isAudioPlaying = false }) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#0F1012]/80 backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left: Minimal Augen Hardware Wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white">
            <span className="font-mono text-[11px] font-bold text-[#0071E3] tracking-tighter">A¹</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-[0.18em] text-white uppercase font-mono">
              Augen
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono-numeric px-1.5 py-0.5 rounded bg-white/[0.04] text-neutral-400 border border-white/[0.06]">
              ACOUSTIC
            </span>
          </div>
        </div>

        {/* Right: Live Acoustic Engine Telemetry */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] font-mono-numeric px-2.5 py-1 rounded-md bg-[#151619] border border-white/[0.08] text-neutral-300">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                isAudioPlaying ? 'bg-[#0071E3] animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span className="text-white font-medium">
              {isAudioPlaying ? 'CARRIER ACTIVE' : 'SYSTEM READY'}
            </span>
            <span className="text-white/20 hidden sm:inline">|</span>
            <span className="text-neutral-400 hidden sm:inline">24,000 HZ</span>
          </div>
        </div>
      </div>
    </header>
  );
};
