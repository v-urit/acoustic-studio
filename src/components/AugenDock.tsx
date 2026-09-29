import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AudioWaveform,
  Mic,
  Sparkles,
  UserCheck,
  FolderArchive,
  ChevronUp,
  Volume2,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface AugenDockProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  historyCount: number;
  isAudioPlaying?: boolean;
}

export const AugenDock: React.FC<AugenDockProps> = ({
  activeTab,
  setActiveTab,
  historyCount,
  isAudioPlaying = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const tabs: {
    id: ActiveTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'tts',
      label: 'Text to Speech',
      shortLabel: 'TTS',
      icon: <AudioWaveform className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'stt',
      label: 'Speech to Text',
      shortLabel: 'STT',
      icon: <Mic className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'bilateral',
      label: 'Voice Lab',
      shortLabel: 'Lab',
      icon: <Sparkles className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'voices',
      label: 'Personas',
      shortLabel: 'Voices',
      icon: <UserCheck className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'library',
      label: 'Library',
      shortLabel: 'Library',
      icon: <FolderArchive className="w-4 h-4 shrink-0" />,
    },
  ];

  return (
    <nav
      aria-label="Augen Studio Navigation"
      className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[96%] sm:w-auto max-w-lg pointer-events-auto select-none safe-area-pb"
    >
      <motion.div
        layout
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="relative bg-[#151619]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl rounded-2xl p-1 sm:p-1.5 flex flex-col items-center overflow-hidden"
        style={{
          boxShadow: isAudioPlaying
            ? '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 113, 227, 0.3)'
            : '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 255, 255, 0.03)',
        }}
      >
        {/* Optional Expanding System Info Tray */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full px-3 sm:px-4 pt-2 pb-2.5 border-b border-white/[0.08] flex items-center justify-between text-[10px] sm:text-[11px] font-mono-numeric gap-3 text-neutral-400"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3] animate-pulse" />
                <span className="text-white font-medium">A¹ ACOUSTIC CORE</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden xs:inline">GEMINI 3.8</span>
                <span className="text-white/20 hidden xs:inline">/</span>
                <span className="text-[#0071E3]">24.0 kHz PCM</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Navigation Bar (Ultra-responsive on all screen sizes) */}
        <div className="w-full flex items-center justify-between sm:justify-start gap-1">
          {/* Monogram Brand Pill & Expander (Desktop toggle) */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title="Toggle System Info Tray"
            className="hidden sm:flex items-center gap-1 px-2.5 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-all"
          >
            <div className="w-5 h-5 rounded-md bg-[#0071E3]/20 border border-[#0071E3]/40 flex items-center justify-center text-[#0071E3]">
              <span className="text-[10px] font-mono font-bold">A¹</span>
            </div>
            <ChevronUp
              className={`w-3 h-3 text-neutral-400 transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className="hidden sm:block w-[1px] h-5 bg-white/[0.08] mx-0.5" />

          {/* Navigation Tab Buttons: Perfect Mobile & Desktop Scaling */}
          <div className="w-full sm:w-auto grid grid-cols-5 sm:flex sm:items-center gap-0.5 sm:gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-3.5 rounded-xl transition-all group min-h-[46px] sm:min-h-[38px] ${
                    isActive
                      ? 'text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Glowing Active Pill with Apple / Augen Blue */}
                  {isActive && (
                    <motion.div
                      layoutId="augen-active-dock-pill"
                      className="absolute inset-0 bg-[#0071E3] rounded-xl shadow-lg shadow-[#0071E3]/35"
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    />
                  )}

                  <span className="relative z-10">{tab.icon}</span>

                  {/* Desktop Label */}
                  <span className="relative z-10 hidden sm:inline text-xs font-medium">
                    {tab.label}
                  </span>

                  {/* Mobile Label */}
                  <span className="relative z-10 sm:hidden text-[9px] font-medium leading-none tracking-tight">
                    {tab.shortLabel}
                  </span>

                  {/* Library Badge */}
                  {tab.id === 'library' && historyCount > 0 && (
                    <span
                      className={`relative z-10 font-mono-numeric text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-white/25 text-white font-bold'
                          : 'bg-white/10 text-neutral-300'
                      }`}
                    >
                      {historyCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Playing Audio Ripple Dot */}
          {isAudioPlaying && (
            <div
              className="flex items-center gap-1 px-1.5 text-[#0071E3] animate-pulse shrink-0"
              title="Acoustic carrier currently outputting audio"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </motion.div>
    </nav>
  );
};
