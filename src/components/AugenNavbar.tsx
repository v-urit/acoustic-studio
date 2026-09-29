import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AudioWaveform,
  Mic,
  Sparkles,
  UserCheck,
  FolderArchive,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { ThemeMode } from '../utils/theme';

interface AugenNavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  historyCount: number;
  isAudioPlaying?: boolean;
}

export const AugenNavbar: React.FC<AugenNavbarProps> = ({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  historyCount,
  isAudioPlaying = false,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'tts',
      label: 'Text to Speech',
      icon: <AudioWaveform className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" />,
    },
    {
      id: 'stt',
      label: 'Transcribe',
      icon: <Mic className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" />,
    },
    {
      id: 'bilateral',
      label: 'Voice Lab',
      icon: <Sparkles className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" />,
    },
    {
      id: 'voices',
      label: 'Personas',
      icon: <UserCheck className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" />,
    },
    {
      id: 'library',
      label: 'Library',
      icon: <FolderArchive className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" />,
    },
  ];

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fixed top-2.5 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[98vw] select-none px-2">
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {/* Left: Frosted Icon Pill (Asterisk ✳ button in frosted glass) */}
        <button
          onClick={handleScrollToTop}
          title="Scroll to Top / Neural Core"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl backdrop-blur-2xl bg-white/75 dark:bg-[#151619]/80 border border-black/[0.08] dark:border-white/[0.12] shadow-lg shadow-black/[0.04] dark:shadow-black/30 flex items-center justify-center text-neutral-800 dark:text-neutral-200 hover:text-[#0071E3] dark:hover:text-[#0071E3] transition-all active:scale-95 shrink-0"
        >
          {/* Custom Augen 8-Point Asterisk Icon */}
          <svg
            className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-500 hover:rotate-90"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" />
          </svg>
        </button>

        {/* Center: Frosted Glass Pill Bar (Icon-only on mobile & tablet for 100% responsiveness) */}
        <nav
          aria-label="Studio Navigation"
          className="backdrop-blur-2xl bg-white/75 dark:bg-[#151619]/80 border border-black/[0.08] dark:border-white/[0.12] rounded-xl sm:rounded-2xl lg:rounded-full p-1 shadow-lg shadow-black/[0.04] dark:shadow-black/30 flex items-center justify-center gap-1 sm:gap-1.5"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  const studioEl = document.getElementById('studio-workspace');
                  if (studioEl) {
                    const top = studioEl.getBoundingClientRect().top + window.scrollY - 80;
                    window.scrollTo({ top, behavior: 'smooth' });
                  }
                }}
                title={item.label}
                aria-label={item.label}
                className={`relative flex items-center justify-center transition-all shrink-0 min-h-[34px] sm:min-h-[36px] ${
                  /* On mobile & tablet: icon-only square/pill. On desktop (lg): icon + text */
                  'w-9 h-9 sm:w-9.5 sm:h-9.5 lg:w-auto lg:h-auto lg:px-3.5 lg:py-1.5 rounded-lg sm:rounded-xl lg:rounded-full text-xs font-medium'
                } ${
                  isActive
                    ? 'text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {/* Active indicator pill (Augen / Apple Blue) */}
                {isActive && (
                  <motion.div
                    layoutId="augen-nav-pill-active"
                    className="absolute inset-0 bg-[#0071E3] rounded-lg sm:rounded-xl lg:rounded-full shadow-md shadow-[#0071E3]/25"
                    transition={{ type: 'spring', damping: 26, stiffness: 350 }}
                  />
                )}

                <span className="relative z-10 flex items-center justify-center">
                  {item.icon}
                </span>

                {/* Text is hidden on mobile & tablet, visible ONLY on desktop (lg:) */}
                <span className="relative z-10 hidden lg:inline ml-2 text-[13px] tracking-tight whitespace-nowrap">
                  {item.label}
                </span>

                {/* Library badge counter */}
                {item.id === 'library' && historyCount > 0 && (
                  <span
                    className={`relative z-10 text-[9px] font-mono-numeric px-1 rounded-full ${
                      /* Badge positioning: small indicator on icon mode, badge on desktop */
                      'absolute -top-1 -right-1 lg:static lg:ml-1.5 lg:px-1.5'
                    } ${
                      isActive
                        ? 'bg-white text-[#0071E3] font-bold shadow-sm'
                        : 'bg-[#0071E3] text-white font-medium shadow-sm'
                    }`}
                  >
                    {historyCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Theme Switcher Pill (Light / Dark / System Mode) */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            title={`Current theme: ${theme}. Click to switch theme.`}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl backdrop-blur-2xl bg-white/75 dark:bg-[#151619]/80 border border-black/[0.08] dark:border-white/[0.12] shadow-lg shadow-black/[0.04] dark:shadow-black/30 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-[#0071E3] dark:hover:text-[#0071E3] transition-all active:scale-95"
          >
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : theme === 'dark' ? (
              <Moon className="w-4 h-4 text-[#0071E3]" />
            ) : (
              <Laptop className="w-4 h-4 text-neutral-500 dark:text-neutral-300" />
            )}

            {/* Audio pulse badge if sound is playing */}
            {isAudioPlaying && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#0071E3] animate-ping" />
            )}
          </button>

          {/* Theme Dropdown Menu */}
          <AnimatePresence>
            {showThemeMenu && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 sm:top-12 mt-1 w-36 rounded-2xl backdrop-blur-2xl bg-white/95 dark:bg-[#1B1D22]/95 border border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-1.5 space-y-1 z-50 text-xs"
              >
                <button
                  onClick={() => {
                    setTheme('light');
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                    theme === 'light'
                      ? 'bg-[#0071E3] text-white font-medium'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </button>

                <button
                  onClick={() => {
                    setTheme('dark');
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                    theme === 'dark'
                      ? 'bg-[#0071E3] text-white font-medium'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-[#0071E3]" />
                  <span>Dark</span>
                </button>

                <button
                  onClick={() => {
                    setTheme('system');
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                    theme === 'system'
                      ? 'bg-[#0071E3] text-white font-medium'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>System (Auto)</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
