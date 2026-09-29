import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Wand2,
  Play,
  RotateCcw,
  Sliders,
  AudioWaveform,
  Volume2,
  Check,
  AlertCircle,
  Copy,
  ChevronDown,
} from 'lucide-react';
import { VoicePersona, GeneratedAudio, PresetScript } from '../types';
import { VoiceSelector } from './VoiceSelector';
import { WaveformPlayer } from './WaveformPlayer';
import { base64ToAudioUrl } from '../utils/audioUtils';

const PRESET_SCRIPTS: PresetScript[] = [
  {
    id: 'story',
    title: 'Conversational Storytelling',
    category: 'Narration',
    voiceId: 'Kore',
    style: 'Warm, engaging storyteller with natural pauses',
    text: 'There was something unforgettable about that quiet dawn in the mountains. <breath> The fog lingered just above the pine trees, and for the first time in months, everything slowed down.',
  },
  {
    id: 'documentary',
    title: 'Deep Acoustic Documentary',
    category: 'Broadcast',
    voiceId: 'Charon',
    style: 'Deep, resonant, measured cadence with gravitas',
    text: 'Beneath the calm expanse of the Pacific lies the Mariana Trench. A realm of extreme pressure, where life flourishes in complete and perpetual darkness.',
  },
  {
    id: 'podcast',
    title: 'Energetic Tech Podcast',
    category: 'Podcast',
    voiceId: 'Puck',
    style: 'Crisp, upbeat, enthusiastic host',
    text: 'Welcome back to the studio! <breath> Today we are breaking down the biggest leap in acoustic synthesis. |yeah| It is fast, intuitive, and sounds undeniably human.',
  },
  {
    id: 'meditation',
    title: 'Calm Mindfulness Guide',
    category: 'Wellness',
    voiceId: 'Zephyr',
    style: 'Gentle, breathy, soft, soothing pace',
    text: 'Allow your shoulders to soften. <breath> Notice the gentle cadence of your natural breath. There is nowhere else you need to be right now.',
  },
  {
    id: 'cinema',
    title: 'Cinematic Game Trailer',
    category: 'Dramatic',
    voiceId: 'Fenrir',
    style: 'Intense, cinematic, powerful, dramatic buildup',
    text: 'They warned us not to venture past the perimeter. <sigh> But some frontiers are not meant to stay hidden in the shadows.',
  },
];

const STYLE_PRESETS = [
  'Warm & conversational with subtle breaths',
  'Authoritative news anchor with crisp clarity',
  'Intimate whisper with close-mic presence',
  'Energetic keynote presenter',
  'Relaxed audiobook reader',
];

interface TtsStudioProps {
  onAudioGenerated: (audio: GeneratedAudio) => void;
  onPreviewVoice: (voice: VoicePersona) => void;
  previewingVoiceId?: string | null;
  initialText?: string | null;
}

export const TtsStudio: React.FC<TtsStudioProps> = ({
  onAudioGenerated,
  onPreviewVoice,
  previewingVoiceId,
  initialText,
}) => {
  const [text, setText] = useState<string>(initialText || PRESET_SCRIPTS[0].text);
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [stylePrompt, setStylePrompt] = useState<string>(PRESET_SCRIPTS[0].style);
  const [modelType, setModelType] = useState<'expressive' | 'standard'>('expressive');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<GeneratedAudio | null>(null);
  const [showStylePresets, setShowStylePresets] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Character and word stats
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.max(1, Math.round((wordCount / 140) * 60));

  // Insert natural tags at cursor position
  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => prev + ` ${tag} `);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = `${before} ${tag} ${after}`;
    setText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2);
    }, 50);
  };

  const handleEnhanceScript = async () => {
    if (!text.trim()) return;
    setIsEnhancing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetTone: stylePrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to enhance script');
      }

      if (data.enhancedText) {
        setText(data.enhancedText);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Could not enhance script');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSynthesize = async () => {
    if (!text.trim()) {
      setErrorMessage('Please enter text to synthesize.');
      return;
    }

    setIsSynthesizing(true);
    setErrorMessage(null);

    try {
      const startTime = performance.now();
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName: selectedVoice,
          style: stylePrompt,
          modelType,
        }),
      });

      const data = await res.json();
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      if (!res.ok) {
        throw new Error(data.error || 'Audio synthesis failed');
      }

      const generated: GeneratedAudio = {
        id: 'aud_' + Date.now(),
        text,
        voiceName: selectedVoice,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
        createdAt: Date.now(),
        durationSeconds: estimatedSeconds,
        modelUsed: data.modelUsed || 'Gemini 3.8 Flash TTS',
      };

      setCurrentAudio(generated);
      onAudioGenerated(generated);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Synthesis request failed. Check server connection.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const loadPreset = (preset: PresetScript) => {
    setText(preset.text);
    setSelectedVoice(preset.voiceId);
    setStylePrompt(preset.style);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header (Fully responsive on mobile, tablet, and desktop) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-numeric text-[#0071E3] mb-1">
            <span>[ S² NEURAL SYNTHESIZER ]</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Text to Speech</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            24kHz high-fidelity acoustic voice generation with natural micro-pauses and expressive nuances.
          </p>
        </div>

        {/* Script Selection Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full py-1">
          {PRESET_SCRIPTS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-black/[0.04] dark:bg-[#151619] hover:bg-black/[0.08] dark:hover:bg-[#1C1E23] text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white border border-black/[0.06] dark:border-white/[0.08] transition-all whitespace-nowrap shrink-0"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Script Composition & Nuance Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Script Input Card */}
          <div className="relative bg-white dark:bg-[#151619] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl transition-all">
            {/* Corner Crosshairs */}
            <span className="corner-crosshair corner-crosshair-tl">+</span>
            <span className="corner-crosshair corner-crosshair-tr">+</span>
            <span className="corner-crosshair corner-crosshair-bl">+</span>
            <span className="corner-crosshair corner-crosshair-br">+</span>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <label
                htmlFor="tts-script-input"
                className="text-xs font-mono-numeric uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium"
              >
                Speech Script Content
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleEnhanceScript}
                  disabled={isEnhancing || !text.trim()}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#0071E3]/10 hover:bg-[#0071E3]/20 text-[#0071E3] border border-[#0071E3]/30 transition-all disabled:opacity-50"
                  title="Direct AI to insert human micro-pauses, breath markers, and conversational inflections"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                  <span>{isEnhancing ? 'Directing...' : 'Enhance Nuance'}</span>
                </button>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              id="tts-script-input"
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Enter your script here... Use natural pauses and human nuance tags like <breath> or <sigh>."
              className="w-full bg-neutral-50 dark:bg-[#0F1012] border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-4 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] transition-all resize-y leading-relaxed font-sans"
            />

            {/* Natural Human Emotion Tags Toolbar */}
            <div className="mt-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono-numeric text-neutral-400 mr-1">
                  TAGS:
                </span>
                {[
                  { label: '<breath>', tag: '<breath>' },
                  { label: '<sigh>', tag: '<sigh>' },
                  { label: '<laugh>', tag: '<laugh>' },
                  { label: '|mhm|', tag: '|mhm|' },
                  { label: '|whisper|', tag: '|whisper|' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => insertTag(item.tag)}
                    className="px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] border border-black/[0.06] dark:border-white/[0.08] text-[11px] font-mono-numeric text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Character & Timing Metrics */}
              <div className="flex items-center gap-3 text-xs font-mono-numeric text-neutral-500 dark:text-neutral-400">
                <span>{charCount} chars</span>
                <span aria-hidden="true" className="text-black/10 dark:text-white/20">·</span>
                <span>{wordCount} words</span>
                <span aria-hidden="true" className="text-black/10 dark:text-white/20">·</span>
                <span className="text-[#0071E3]">~{estimatedSeconds}s</span>
              </div>
            </div>
          </div>

          {/* Voice Persona Selection (Compact Grid) */}
          <div className="relative bg-white dark:bg-[#151619] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5 shadow-xl">
            <span className="corner-crosshair corner-crosshair-tl">+</span>
            <span className="corner-crosshair corner-crosshair-tr">+</span>
            <span className="corner-crosshair corner-crosshair-bl">+</span>
            <span className="corner-crosshair corner-crosshair-br">+</span>

            <VoiceSelector
              selectedVoiceId={selectedVoice}
              onSelectVoice={(vId) => setSelectedVoice(vId)}
              compact={true}
              onPreviewSample={onPreviewVoice}
              previewingVoiceId={previewingVoiceId}
            />
          </div>
        </div>

        {/* Right Column: Direction, Synthesis & Master Output (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Style & Delivery Direction Card */}
          <div className="relative bg-white dark:bg-[#151619] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
            <span className="corner-crosshair corner-crosshair-tl">+</span>
            <span className="corner-crosshair corner-crosshair-tr">+</span>
            <span className="corner-crosshair corner-crosshair-bl">+</span>
            <span className="corner-crosshair corner-crosshair-br">+</span>

            <div className="flex items-center justify-between">
              <label className="text-xs font-mono-numeric uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium">
                Vocal Direction & Style
              </label>

              {/* Style Presets Dropdown Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowStylePresets(!showStylePresets)}
                  className="flex items-center gap-1 text-xs text-[#0071E3] hover:text-[#007BF5] transition-colors"
                >
                  <span>Quick Presets</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {showStylePresets && (
                  <div className="absolute right-0 top-6 z-30 w-64 bg-white dark:bg-[#1B1D22] border border-black/[0.1] dark:border-white/[0.12] rounded-2xl shadow-2xl p-1.5 space-y-1">
                    {STYLE_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setStylePrompt(p);
                          setShowStylePresets(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors truncate"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <input
              type="text"
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
              placeholder="e.g. Warm, conversational tone with authentic pauses"
              className="w-full bg-neutral-50 dark:bg-[#0F1012] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#0071E3] transition-all font-sans"
            />

            {/* Model Engine Selector */}
            <div>
              <label className="text-[11px] font-mono-numeric uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-2">
                Acoustic Neural Engine
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModelType('expressive')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    modelType === 'expressive'
                      ? 'bg-neutral-50 dark:bg-[#0F1012] border-[#0071E3] ring-1 ring-[#0071E3]'
                      : 'bg-neutral-50/60 dark:bg-[#0F1012]/60 border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white">Expressive Core</span>
                    <span className="text-[9px] font-mono-numeric px-1.5 py-0.5 rounded bg-[#0071E3]/15 text-[#0071E3] font-semibold">
                      NATURAL
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
                    Gemini 3.8 Flash with full human emotion & breath synthesis.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setModelType('standard')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    modelType === 'standard'
                      ? 'bg-neutral-50 dark:bg-[#0F1012] border-[#0071E3] ring-1 ring-[#0071E3]'
                      : 'bg-neutral-50/60 dark:bg-[#0F1012]/60 border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white">Speed Core</span>
                    <span className="text-[9px] font-mono-numeric px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400">
                      FAST
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
                    Gemini 3.8 Flash Lite for ultra-low latency generation.
                  </p>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-600 dark:text-red-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing || !text.trim()}
              className="w-full py-3.5 px-6 rounded-xl bg-[#0071E3] hover:bg-[#007BF5] text-white text-sm font-semibold transition-all shadow-xl shadow-[#0071E3]/25 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isSynthesizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing 24kHz Master Audio...</span>
                </>
              ) : (
                <>
                  <AudioWaveform className="w-4 h-4" />
                  <span>Synthesize with {selectedVoice}</span>
                </>
              )}
            </button>
          </div>

          {/* Current Master Audio Player */}
          {currentAudio && (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1.5 px-1 font-mono-numeric">
                <span className="text-[#0071E3] font-medium">[ MASTER AUDIO OUTPUT ]</span>
                <span>24kHz 16-BIT WAV</span>
              </div>
              <WaveformPlayer
                audioUrl={base64ToAudioUrl(currentAudio.audioBase64, currentAudio.mimeType)}
                title={currentAudio.text.slice(0, 50) + (currentAudio.text.length > 50 ? '...' : '')}
                voiceName={currentAudio.voiceName}
                modelUsed={currentAudio.modelUsed}
                autoPlay={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
