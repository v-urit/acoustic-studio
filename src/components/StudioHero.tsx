import React from 'react';
import { motion } from 'motion/react';
import { AudioWaveform, Mic, Sparkles, ArrowRight } from 'lucide-react';
import { NeuralAudioOrb } from './NeuralAudioOrb';
import { ActiveTab } from '../types';

interface StudioHeroProps {
  onSelectTab: (tab: ActiveTab) => void;
  isAudioPlaying?: boolean;
}

export const StudioHero: React.FC<StudioHeroProps> = ({
  onSelectTab,
  isAudioPlaying = false,
}) => {
  const handleJumpToTab = (tab: ActiveTab) => {
    onSelectTab(tab);
    const studioEl = document.getElementById('studio-workspace');
    if (studioEl) {
      studioEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-24 sm:pt-28 pb-12 sm:pb-16 flex flex-col items-center text-center relative select-none">
      {/* Top Status Pill */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.1] rounded-full px-3.5 py-1 flex items-center gap-2 text-xs font-mono-numeric text-neutral-600 dark:text-neutral-400 mb-6"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isAudioPlaying ? 'bg-[#0071E3] animate-ping' : 'bg-emerald-500'
          }`}
        />
        <span>24,000 HZ MASTER CORE</span>
        <span className="text-black/15 dark:text-white/20">/</span>
        <span className="text-[#0071E3] font-medium">GEMINI 3.8 FLASH</span>
      </motion.div>

      {/* Main Title (Clean, elegant Studio 28K typography) */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-neutral-900 dark:text-white leading-[1.08] max-w-4xl"
      >
        Acoustic
        <br />
        <span className="text-[#0071E3] font-normal">Intelligence.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-4 max-w-xl leading-relaxed"
      >
        High-fidelity voice synthesis with human nuance markers, paired with zero-loss neural audio transcription.
      </motion.p>

      {/* Central 3D Interactive Audio Visualizer (Rotatable, pulses on sound/repeat/seek) */}
      <div className="relative my-8 sm:my-10 flex items-center justify-center">
        {/* Soft background glow */}
        <div
          className={`absolute w-[260px] sm:w-[380px] h-[260px] sm:h-[380px] rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isAudioPlaying
              ? 'bg-[#0071E3]/25 scale-110'
              : 'bg-black/[0.02] dark:bg-[#0071E3]/8 scale-95'
          }`}
        />

        <div className="relative z-10">
          <NeuralAudioOrb
            size={240}
            label="A¹ NEURAL AUDIO SENSOR"
            sublabel="TOUCH &amp; DRAG TO ROTATE 3D SENSOR"
          />
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-center gap-2.5 pt-2 text-xs sm:text-sm"
      >
        <button
          onClick={() => handleJumpToTab('tts')}
          className="px-4 sm:px-5 py-2 rounded-full bg-[#0071E3] hover:bg-[#007BF5] text-white font-medium shadow-lg shadow-[#0071E3]/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <AudioWaveform className="w-3.5 h-3.5" />
          <span>Synthesize Speech</span>
        </button>

        <button
          onClick={() => handleJumpToTab('stt')}
          className="px-4 sm:px-5 py-2 rounded-full border border-black/[0.1] dark:border-white/[0.15] hover:border-[#0071E3] text-neutral-800 dark:text-neutral-200 hover:text-[#0071E3] backdrop-blur-xl bg-white/50 dark:bg-white/[0.04] font-medium flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Record &amp; Transcribe</span>
        </button>

        <button
          onClick={() => handleJumpToTab('bilateral')}
          className="px-4 sm:px-5 py-2 rounded-full border border-black/[0.1] dark:border-white/[0.15] hover:border-[#0071E3] text-neutral-800 dark:text-neutral-200 hover:text-[#0071E3] backdrop-blur-xl bg-white/50 dark:bg-white/[0.04] font-medium flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Voice Lab</span>
        </button>
      </motion.div>
    </section>
  );
};
