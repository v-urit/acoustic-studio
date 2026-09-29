import React, { useState } from 'react';
import { Play, Pause, Check, Volume2, Sparkles, Filter } from 'lucide-react';
import { VoicePersona } from '../types';

export const CURATED_VOICES: VoicePersona[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    tone: 'Warm, conversational, authentic',
    description:
      'Warm and soothing female tone with natural breath rhythms. Ideal for personal stories, narrations, and thoughtful podcasts.',
    accent: 'American (Contemporary)',
    bestFor: 'Audiobooks, Personal Narration, Storytelling',
    sampleText: 'There was something unforgettable about that quiet dawn in the mountains.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Male',
    tone: 'Deep, resonant, commanding',
    description:
      'Baritone acoustic presence with measured cadence. Designed for authoritative documentaries, cinematic voiceovers, and historical accounts.',
    accent: 'American (Deep Classic)',
    bestFor: 'Documentaries, Cinematic Trailers, Executive Voice',
    sampleText: 'Beneath the calm expanse of the Pacific lies a realm of perpetual darkness.',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Male',
    tone: 'Crisp, energetic, articulate',
    description:
      'Dynamic, upbeat speaker with clear diction. Perfect for tech explainers, startup launch videos, and lively commercial spots.',
    accent: 'American (Neutral Modern)',
    bestFor: 'Tech Keynotes, Commercials, Product Demos',
    sampleText: 'Welcome back! Today we are breaking down the biggest leap in acoustic synthesis.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Female',
    tone: 'Gentle, breathy, mindful',
    description:
      'Soft and tranquil tone with close-microphone intimacy. Engineered for meditation guides, sleep stories, and mindful breathing exercises.',
    accent: 'American (Soft Breathy)',
    bestFor: 'Meditation, Sleep Stories, Wellness Audio',
    sampleText: 'Allow your shoulders to soften. Notice the gentle cadence of your natural breath.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male',
    tone: 'Intense, dramatic, textured',
    description:
      'Rich cinematic voice with subtle gravel and dramatic weight. Tailored for fantasy narratives, game characters, and high-impact trailers.',
    accent: 'Mid-Atlantic (Theatrical)',
    bestFor: 'Gaming Trailers, Dramatic Dialogue, Epic Storytelling',
    sampleText: 'They warned us not to venture past the perimeter. Some frontiers are not meant to stay hidden.',
  },
];

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  compact?: boolean;
  onPreviewSample?: (voice: VoicePersona) => void;
  previewingVoiceId?: string | null;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoiceId,
  onSelectVoice,
  compact = false,
  onPreviewSample,
  previewingVoiceId,
}) => {
  const [filter, setFilter] = useState<'all' | 'Female' | 'Male'>('all');

  const filteredVoices =
    filter === 'all' ? CURATED_VOICES : CURATED_VOICES.filter((v) => v.gender === filter);

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono-numeric uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium">
            Active Voice Persona
          </label>
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono-numeric text-neutral-500 dark:text-neutral-400">
            <span>5 NEURAL VOICES</span>
            <span aria-hidden="true" className="text-black/10 dark:text-white/20">·</span>
            <span className="text-[#0071E3]">24kHz</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {CURATED_VOICES.map((voice, idx) => {
            const isSelected = selectedVoiceId === voice.id;
            const isPreviewing = previewingVoiceId === voice.id;
            const isLastOdd = idx === 4;

            return (
              <button
                key={voice.id}
                type="button"
                onClick={() => onSelectVoice(voice.id)}
                className={`relative p-2.5 sm:p-3 rounded-xl text-left transition-all border group ${
                  isLastOdd ? 'col-span-2 sm:col-span-1' : ''
                } ${
                  isSelected
                    ? 'bg-white dark:bg-[#151619] border-[#0071E3] shadow-md shadow-[#0071E3]/15 ring-1 ring-[#0071E3]'
                    : 'bg-neutral-50/80 dark:bg-[#151619]/60 hover:bg-white dark:hover:bg-[#151619] border-black/[0.06] dark:border-white/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white flex items-center gap-1">
                    {voice.name}
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3]" />
                    )}
                  </span>

                  {onPreviewSample && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewSample(voice);
                      }}
                      className={`p-1 rounded-md transition-colors ${
                        isPreviewing
                          ? 'bg-[#0071E3] text-white'
                          : 'text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                      }`}
                      title={`Preview ${voice.name}'s voice`}
                    >
                      {isPreviewing ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </span>
                  )}
                </div>

                <div className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  {voice.tone}
                </div>
                <div className="text-[9px] sm:text-[10px] font-mono-numeric text-neutral-400 dark:text-neutral-500 mt-0.5">
                  {voice.gender.toUpperCase()} · {voice.accent.split(' ')[0].toUpperCase()}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-numeric text-[#0071E3] mb-1">
            <span>[ ACOUSTIC CORE ARCHITECTURE ]</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Neural Voice Personas
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
            Each persona is calibrated for specific human cadences, resonance depths, and organic micro-pauses.
          </p>
        </div>

        {/* Filter Pill */}
        <div className="flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-[#151619] border border-black/[0.06] dark:border-white/[0.08] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-[#0071E3] text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            All (5)
          </button>
          <button
            onClick={() => setFilter('Female')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'Female'
                ? 'bg-[#0071E3] text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Female
          </button>
          <button
            onClick={() => setFilter('Male')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'Male'
                ? 'bg-[#0071E3] text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Male
          </button>
        </div>
      </div>

      {/* Full Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoiceId === voice.id;
          const isPreviewing = previewingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              className={`relative bg-white dark:bg-[#151619] border rounded-2xl p-5 sm:p-6 transition-all shadow-xl flex flex-col justify-between space-y-4 group ${
                isSelected
                  ? 'border-[#0071E3] ring-1 ring-[#0071E3] shadow-lg shadow-[#0071E3]/15'
                  : 'border-black/[0.08] dark:border-white/[0.08] hover:border-black/[0.16] dark:hover:border-white/[0.16]'
              }`}
            >
              <span className="corner-crosshair corner-crosshair-tl">+</span>
              <span className="corner-crosshair corner-crosshair-tr">+</span>
              <span className="corner-crosshair corner-crosshair-bl">+</span>
              <span className="corner-crosshair corner-crosshair-br">+</span>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                      <span>{voice.name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-mono-numeric font-normal text-[#0071E3] bg-[#0071E3]/15 px-2 py-0.5 rounded-full border border-[#0071E3]/30">
                          ACTIVE
                        </span>
                      )}
                    </h3>
                    <div className="text-xs text-[#0071E3] font-medium mt-0.5">
                      {voice.tone}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono-numeric px-2 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400">
                    {voice.gender.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {voice.description}
                </p>

                <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06] space-y-1 text-xs">
                  <div className="text-[11px] text-neutral-400 font-mono-numeric uppercase">
                    Best Applied To:
                  </div>
                  <div className="text-neutral-700 dark:text-neutral-300 font-medium">{voice.bestFor}</div>
                </div>
              </div>

              {/* Sample & Actions */}
              <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between gap-3">
                {onPreviewSample && (
                  <button
                    type="button"
                    onClick={() => onPreviewSample(voice)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      isPreviewing
                        ? 'bg-[#0071E3] border-[#0071E3] text-white'
                        : 'border-black/[0.08] dark:border-white/[0.08] text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    {isPreviewing ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Playing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 ml-0.5" />
                        <span>Preview Voice</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSelectVoice(voice.id)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-neutral-200 dark:bg-white/10 text-neutral-800 dark:text-white cursor-default'
                      : 'bg-[#0071E3] hover:bg-[#007BF5] text-white shadow-md shadow-[#0071E3]/20'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Use Persona'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
