import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AudioWaveform,
  Mic,
  Sparkles,
  UserCheck,
  FolderArchive,
} from 'lucide-react';
import { ActiveTab, GeneratedAudio, TranscriptionRecord, VoicePersona } from './types';
import { AugenNavbar } from './components/AugenNavbar';
import { StudioHero } from './components/StudioHero';
import { TtsStudio } from './components/TtsStudio';
import { SttStudio } from './components/SttStudio';
import { VoiceSelector } from './components/VoiceSelector';
import { BilateralComparison } from './components/BilateralComparison';
import { HistoryDrawer } from './components/HistoryDrawer';
import { WaveformPlayer } from './components/WaveformPlayer';
import { base64ToAudioUrl } from './utils/audioUtils';
import { subscribeAudioState, emitAudioState } from './utils/audioEvents';
import { useTheme } from './utils/theme';

const STORAGE_KEY_AUDIO = 'augen_audio_history_v1';
const STORAGE_KEY_STT = 'augen_stt_history_v1';

export default function App() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<ActiveTab>('tts');
  const [audioHistory, setAudioHistory] = useState<GeneratedAudio[]>([]);
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionRecord[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('Kore');
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [previewAudioElement, setPreviewAudioElement] = useState<HTMLAudioElement | null>(null);
  const [activeFloatingAudio, setActiveFloatingAudio] = useState<GeneratedAudio | null>(null);
  const [ttsInputSeed, setTtsInputSeed] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  // Load persistent history on mount
  useEffect(() => {
    try {
      const savedAudio = localStorage.getItem(STORAGE_KEY_AUDIO);
      if (savedAudio) {
        setAudioHistory(JSON.parse(savedAudio));
      }
      const savedStt = localStorage.getItem(STORAGE_KEY_STT);
      if (savedStt) {
        setTranscriptionHistory(JSON.parse(savedStt));
      }
    } catch (e) {
      console.warn('Failed to parse history from localStorage:', e);
    }
  }, []);

  // Universal acoustic state subscription
  useEffect(() => {
    const unsubscribe = subscribeAudioState((detail) => {
      setIsAudioPlaying(detail.isPlaying);
    });
    return unsubscribe;
  }, []);

  // Save history updates
  const saveAudioHistory = (items: GeneratedAudio[]) => {
    setAudioHistory(items);
    try {
      localStorage.setItem(STORAGE_KEY_AUDIO, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  };

  const saveTranscriptionHistory = (items: TranscriptionRecord[]) => {
    setTranscriptionHistory(items);
    try {
      localStorage.setItem(STORAGE_KEY_STT, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  };

  const handleAudioGenerated = (audio: GeneratedAudio) => {
    const updated = [audio, ...audioHistory].slice(0, 50);
    saveAudioHistory(updated);
    showToast(`Synthesized master audio with ${audio.voiceName}`);
  };

  const handleTranscriptionCreated = (record: TranscriptionRecord) => {
    const updated = [record, ...transcriptionHistory].slice(0, 50);
    saveTranscriptionHistory(updated);
    showToast(`Transcribed ${record.wordCount} words`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Preview voice sample dynamically with full event synchronization
  const handlePreviewVoice = async (voice: VoicePersona) => {
    if (previewingVoiceId === voice.id) {
      if (previewAudioElement) {
        previewAudioElement.pause();
      }
      setPreviewingVoiceId(null);
      setIsAudioPlaying(false);
      emitAudioState({ isPlaying: false, intensity: 0, source: 'voice-preview-stop' });
      return;
    }

    if (previewAudioElement) {
      previewAudioElement.pause();
    }

    setPreviewingVoiceId(voice.id);
    setIsAudioPlaying(true);
    emitAudioState({ isPlaying: true, intensity: 0.85, source: 'voice-preview-start' });

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voice.sampleText,
          voiceName: voice.id,
          style: 'Natural conversational greeting',
          modelType: 'expressive',
        }),
      });

      const data = await res.json();
      if (data.audioBase64) {
        const url = base64ToAudioUrl(data.audioBase64, data.mimeType || 'audio/wav');
        const audio = new Audio(url);
        setPreviewAudioElement(audio);

        audio.onplay = () => {
          setIsAudioPlaying(true);
          emitAudioState({ isPlaying: true, intensity: 0.85, source: 'voice-preview-play' });
        };
        audio.ontimeupdate = () => {
          emitAudioState({
            isPlaying: true,
            intensity: 0.65 + 0.3 * Math.sin(audio.currentTime * 7),
            currentTime: audio.currentTime,
            source: 'voice-preview-timeupdate',
          });
        };
        audio.onpause = () => {
          setIsAudioPlaying(false);
          emitAudioState({ isPlaying: false, intensity: 0, source: 'voice-preview-pause' });
        };
        audio.onended = () => {
          setPreviewingVoiceId(null);
          setIsAudioPlaying(false);
          emitAudioState({ isPlaying: false, intensity: 0, source: 'voice-preview-ended' });
        };

        audio.play().catch((err) => {
          console.error(err);
          setPreviewingVoiceId(null);
          setIsAudioPlaying(false);
          emitAudioState({ isPlaying: false, intensity: 0 });
        });
      }
    } catch (e) {
      console.error('Failed to preview voice sample:', e);
      setPreviewingVoiceId(null);
      setIsAudioPlaying(false);
      emitAudioState({ isPlaying: false, intensity: 0 });
    }
  };

  const handleSendToTts = (text: string) => {
    setTtsInputSeed(text);
    setActiveTab('tts');
    showToast('Loaded transcript into TTS studio');

    const studioEl = document.getElementById('studio-workspace');
    if (studioEl) {
      studioEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear your local audio library?')) {
      saveAudioHistory([]);
      saveTranscriptionHistory([]);
      showToast('Library cleared');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] dark:bg-[#0F1012] text-neutral-900 dark:text-white flex flex-col selection:bg-[#0071E3]/25 selection:text-neutral-900 dark:selection:text-white augen-grid-pattern relative transition-colors duration-300">
      {/* Subtle Top Ambient Radiance */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-[#0071E3]/10 dark:from-[#0071E3]/15 via-[#0071E3]/3 dark:via-[#0071E3]/5 to-transparent pointer-events-none blur-3xl -z-10" />

      {/* Floating Frosted-Glass Pill Navbar (Exact Screenshots 1-5 Style with Light/Dark/System Theme Switcher) */}
      <AugenNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={setTheme}
        historyCount={audioHistory.length + transcriptionHistory.length}
        isAudioPlaying={isAudioPlaying}
      />

      {/* Studio Hero Section with 3D Neural Audio Sensor (Authentic UI, no fake hardware marketing copy) */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <StudioHero
          onSelectTab={(tab) => {
            setActiveTab(tab);
          }}
          isAudioPlaying={isAudioPlaying}
        />

        {/* ----------------- INTERACTIVE STUDIO WORKSPACE ----------------- */}
        <section id="studio-workspace" className="pt-6 pb-32">
          {/* Studio Section Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono-numeric text-[#0071E3]">
                <span>[ A¹ ACOUSTIC INTERACTION LAB ]</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                Studio Workspace
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Explore voice synthesis, continuous transcription, two-way transformation, and curated neural personas.
              </p>
            </div>

            {/* Quick Workspace Switcher (Responsive: Icons only on mobile/tablet, full label on md+) */}
            <div className="flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-[#151619] border border-black/[0.06] dark:border-white/[0.08] rounded-xl self-start sm:self-auto overflow-x-auto no-scrollbar max-w-full">
              {[
                { id: 'tts' as ActiveTab, label: 'Text to Speech', icon: <AudioWaveform className="w-3.5 h-3.5 shrink-0" /> },
                { id: 'stt' as ActiveTab, label: 'Transcribe', icon: <Mic className="w-3.5 h-3.5 shrink-0" /> },
                { id: 'bilateral' as ActiveTab, label: 'Voice Lab', icon: <Sparkles className="w-3.5 h-3.5 shrink-0" /> },
                { id: 'voices' as ActiveTab, label: 'Personas', icon: <UserCheck className="w-3.5 h-3.5 shrink-0" /> },
                { id: 'library' as ActiveTab, label: `Library (${audioHistory.length + transcriptionHistory.length})`, icon: <FolderArchive className="w-3.5 h-3.5 shrink-0" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                  aria-label={tab.label}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-[#0071E3] text-white shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Floating Active Player if triggered from Library */}
          {activeFloatingAudio && (
            <div className="mb-8 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1.5 px-1 font-mono-numeric">
                <span className="text-[#0071E3] font-medium">[ ACTIVE PLAYBACK FROM LIBRARY ]</span>
                <button
                  onClick={() => {
                    setActiveFloatingAudio(null);
                    setIsAudioPlaying(false);
                    emitAudioState({ isPlaying: false, intensity: 0 });
                  }}
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  Close Player
                </button>
              </div>
              <WaveformPlayer
                audioUrl={base64ToAudioUrl(activeFloatingAudio.audioBase64, activeFloatingAudio.mimeType)}
                title={activeFloatingAudio.text.slice(0, 48) + '...'}
                voiceName={activeFloatingAudio.voiceName}
                modelUsed={activeFloatingAudio.modelUsed}
                autoPlay={true}
                onEnded={() => {
                  setIsAudioPlaying(false);
                  emitAudioState({ isPlaying: false, intensity: 0 });
                }}
              />
            </div>
          )}

          {/* Tab 1: Text-to-Speech Studio */}
          {activeTab === 'tts' && (
            <TtsStudio
              onAudioGenerated={handleAudioGenerated}
              onPreviewVoice={handlePreviewVoice}
              previewingVoiceId={previewingVoiceId}
              initialText={ttsInputSeed}
            />
          )}

          {/* Tab 2: Speech-to-Text Studio */}
          {activeTab === 'stt' && (
            <SttStudio
              onTranscriptionCreated={handleTranscriptionCreated}
              onSendToTts={handleSendToTts}
            />
          )}

          {/* Tab 3: Two-Way Bilateral Voice Lab */}
          {activeTab === 'bilateral' && (
            <BilateralComparison onAudioGenerated={handleAudioGenerated} />
          )}

          {/* Tab 4: Voice Persona Explorer */}
          {activeTab === 'voices' && (
            <VoiceSelector
              selectedVoiceId={selectedVoiceId}
              onSelectVoice={(vId) => {
                setSelectedVoiceId(vId);
                setActiveTab('tts');
                showToast(`Selected ${vId} as active persona`);
              }}
              compact={false}
              onPreviewSample={handlePreviewVoice}
              previewingVoiceId={previewingVoiceId}
            />
          )}

          {/* Tab 5: History & Acoustic Library */}
          {activeTab === 'library' && (
            <HistoryDrawer
              audioHistory={audioHistory}
              transcriptionHistory={transcriptionHistory}
              onPlayAudio={(item) => {
                setActiveFloatingAudio(item);
                setIsAudioPlaying(true);
              }}
              onSendToTts={handleSendToTts}
              onDeleteAudio={(id) => {
                const updated = audioHistory.filter((a) => a.id !== id);
                saveAudioHistory(updated);
              }}
              onDeleteTranscription={(id) => {
                const updated = transcriptionHistory.filter((t) => t.id !== id);
                saveTranscriptionHistory(updated);
              }}
              onClearAll={handleClearAllHistory}
            />
          )}
        </section>
      </main>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-8 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-[#151619] border border-[#0071E3]/40 text-neutral-900 dark:text-white text-xs font-medium shadow-2xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#0071E3] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Minimalist Studio Footer */}
      <footer className="w-full border-t border-black/[0.06] dark:border-white/[0.08] bg-neutral-100/60 dark:bg-[#0A0B0D] py-8 text-neutral-500 dark:text-neutral-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              Augen Voice
            </span>
            <span aria-hidden="true" className="text-black/10 dark:text-white/20">·</span>
            <span>Acoustic Neural Intelligence</span>
            <span aria-hidden="true" className="text-black/10 dark:text-white/20">·</span>
            <span className="font-mono-numeric text-[#0071E3]">24kHz Hi-Fi PCM</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-400 dark:text-neutral-500 font-mono-numeric">
            <span>GEMINI 3.8 FLASH</span>
            <span aria-hidden="true" className="text-black/10 dark:text-white/20">·</span>
            <span>STUDIO ACOUSTICS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
