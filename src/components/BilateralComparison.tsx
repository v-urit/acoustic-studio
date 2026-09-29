import React, { useState } from 'react';
import {
  Mic,
  ArrowRight,
  AudioWaveform,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  Check,
  ArrowDown,
} from 'lucide-react';
import { VoicePersona, GeneratedAudio } from '../types';
import { CURATED_VOICES } from './VoiceSelector';
import { WaveformPlayer } from './WaveformPlayer';
import { base64ToAudioUrl } from '../utils/audioUtils';

interface BilateralComparisonProps {
  onAudioGenerated: (audio: GeneratedAudio) => void;
}

export const BilateralComparison: React.FC<BilateralComparisonProps> = ({
  onAudioGenerated,
}) => {
  const [sourceText, setSourceText] = useState<string>(
    'The future of voice technology is not synthetic. It is deeply nuanced, responsive, and completely natural.'
  );
  const [targetVoice, setTargetVoice] = useState<string>('Charon');
  const [targetStyle, setTargetStyle] = useState<string>(
    'Commanding documentary authority with measured cadence'
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);

  const DEMO_CASES = [
    {
      title: 'Conversational to Documentary Gravitas',
      sourceText:
        'We found this incredible species deep in the rainforest canopy. It only emerges when the thunderstorm rolls in.',
      suggestedVoice: 'Charon',
      suggestedStyle: 'Deep, cinematic documentary narrator with heavy bass resonance',
    },
    {
      title: 'Casual Chat to Crisp Tech Keynote',
      sourceText:
        'Alright everyone, check this out. We rebuilt the acoustic pipeline from the ground up, and latency is down by sixty percent.',
      suggestedVoice: 'Puck',
      suggestedStyle: 'Upbeat, articulate Silicon Valley product presenter',
    },
    {
      title: 'Everyday Thought to Soothing Meditation',
      sourceText:
        'Remember that you do not have to have everything figured out right now. Just breathe and be present in this moment.',
      suggestedVoice: 'Zephyr',
      suggestedStyle: 'Soft, tranquil, meditative whisper with gentle breath pauses',
    },
  ];

  const handleSelectCase = (index: number) => {
    setSelectedPresetIndex(index);
    const demo = DEMO_CASES[index];
    setSourceText(demo.sourceText);
    setTargetVoice(demo.suggestedVoice);
    setTargetStyle(demo.suggestedStyle);
  };

  const handleSynthesize = async () => {
    if (!sourceText.trim()) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          voiceName: targetVoice,
          style: targetStyle,
          modelType: 'expressive',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate audio');

      const generated: GeneratedAudio = {
        id: 'bilateral_' + Date.now(),
        text: sourceText,
        voiceName: targetVoice,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
        createdAt: Date.now(),
        durationSeconds: 6,
        modelUsed: 'Gemini 3.8 Bilateral Synthesis',
      };

      setGeneratedAudio(generated);
      onAudioGenerated(generated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-numeric text-[#0071E3] mb-1">
            <span>[ BILATERAL NEURAL TRANSFER LAB ]</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Bilateral Voice Laboratory
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
            Input speech or transcripts and observe dynamic acoustic re-synthesis across different human emotional registers.
          </p>
        </div>

        {/* Case Studies Selector */}
        <div className="flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-[#151619] border border-black/[0.06] dark:border-white/[0.08] rounded-xl self-start sm:self-auto overflow-x-auto no-scrollbar max-w-full">
          {DEMO_CASES.map((demo, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectCase(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                selectedPresetIndex === idx
                  ? 'bg-[#0071E3] text-white shadow-md shadow-[#0071E3]/20'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Case 0{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dual Transformation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Step 1: Input Script / Acoustic Source (5 Cols) */}
        <div className="lg:col-span-5 relative bg-white dark:bg-[#151619] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4">
          <span className="corner-crosshair corner-crosshair-tl">+</span>
          <span className="corner-crosshair corner-crosshair-tr">+</span>
          <span className="corner-crosshair corner-crosshair-bl">+</span>
          <span className="corner-crosshair corner-crosshair-br">+</span>

          <div>
            <div className="flex items-center justify-between mb-3 text-xs font-mono-numeric">
              <span className="text-[#0071E3] font-medium">[ 01 · INPUT SIGNAL ]</span>
              <span className="text-neutral-400 dark:text-neutral-500">RAW SCRIPT</span>
            </div>

            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              rows={5}
              className="w-full bg-neutral-50 dark:bg-[#0F1012] border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-3.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#0071E3] transition-all resize-none font-sans"
              placeholder="Enter speech script to transmute..."
            />
          </div>

          <div className="space-y-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div>
              <label className="text-[11px] font-mono-numeric uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1.5">
                Target Persona
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {CURATED_VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setTargetVoice(v.id)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      targetVoice === v.id
                        ? 'bg-[#0071E3] border-[#0071E3] text-white shadow-md shadow-[#0071E3]/20'
                        : 'bg-neutral-50 dark:bg-[#0F1012] border-black/[0.06] dark:border-white/[0.06] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs">{v.name}</div>
                    <div className="text-[9px] uppercase font-mono-numeric opacity-80">
                      {v.gender[0]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono-numeric uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1.5">
                Vocal Direction &amp; Timbre
              </label>
              <input
                type="text"
                value={targetStyle}
                onChange={(e) => setTargetStyle(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-[#0F1012] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#0071E3] transition-all font-sans"
              />
            </div>

            <button
              onClick={handleSynthesize}
              disabled={isProcessing || !sourceText.trim()}
              className="w-full py-3 rounded-xl bg-[#0071E3] hover:bg-[#007BF5] text-white text-xs font-semibold shadow-lg shadow-[#0071E3]/25 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Target Audio...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Transmute to {targetVoice}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Transformation Bridge Arrow (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center py-4 lg:py-0">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-[#151619] border border-[#0071E3]/40 flex items-center justify-center text-[#0071E3] shadow-lg shadow-[#0071E3]/15">
            <ArrowRight className="hidden lg:block w-4 h-4" />
            <ArrowDown className="lg:hidden w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono-numeric uppercase text-neutral-400 dark:text-neutral-500 tracking-widest text-center mt-2">
            ACOUSTIC
            <br />
            TRANSFER
          </span>
        </div>

        {/* Step 2: Transmuted Acoustic Output (5 Cols) */}
        <div className="lg:col-span-5 relative bg-white dark:bg-[#151619] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4">
          <span className="corner-crosshair corner-crosshair-tl">+</span>
          <span className="corner-crosshair corner-crosshair-tr">+</span>
          <span className="corner-crosshair corner-crosshair-bl">+</span>
          <span className="corner-crosshair corner-crosshair-br">+</span>

          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3 text-xs font-mono-numeric">
              <span className="text-[#0071E3] font-medium">[ 02 · TRANSMUTED ACOUSTIC MASTER ]</span>
              <span className="text-neutral-400 dark:text-neutral-500">24kHz WAV</span>
            </div>

            {generatedAudio ? (
              <div className="space-y-4 my-auto">
                <div className="p-3 bg-neutral-50 dark:bg-[#0F1012] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-xs text-neutral-600 dark:text-neutral-300">
                  <div className="font-mono-numeric text-[10px] text-[#0071E3] uppercase mb-1">
                    [ ACTIVE METRICS ]
                  </div>
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span>Persona: <strong className="text-neutral-900 dark:text-white">{generatedAudio.voiceName}</strong></span>
                    <span>Sample Rate: <strong className="text-neutral-900 dark:text-white font-mono-numeric">24,000 Hz</strong></span>
                  </div>
                </div>

                <WaveformPlayer
                  audioUrl={base64ToAudioUrl(generatedAudio.audioBase64, generatedAudio.mimeType)}
                  title={`Transmuted into ${generatedAudio.voiceName}`}
                  voiceName={generatedAudio.voiceName}
                  modelUsed={generatedAudio.modelUsed}
                  autoPlay={true}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#0071E3]">
                  <AudioWaveform className="w-6 h-6" />
                </div>
                <div className="max-w-xs">
                  <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Ready for Synthesis
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Click "Transmute" to generate the new acoustic persona with human timbre.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
