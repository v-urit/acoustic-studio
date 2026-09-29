import React, { useState } from 'react';
import {
  Clock,
  AudioWaveform,
  FileText,
  Trash2,
  Download,
  Play,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { GeneratedAudio, TranscriptionRecord } from '../types';
import { base64ToAudioUrl, downloadFile, formatTime } from '../utils/audioUtils';

interface HistoryDrawerProps {
  audioHistory: GeneratedAudio[];
  transcriptionHistory: TranscriptionRecord[];
  onPlayAudio: (audio: GeneratedAudio) => void;
  onSendToTts: (text: string) => void;
  onDeleteAudio: (id: string) => void;
  onDeleteTranscription: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  audioHistory,
  transcriptionHistory,
  onPlayAudio,
  onSendToTts,
  onDeleteAudio,
  onDeleteTranscription,
  onClearAll,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'audio' | 'transcription'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasItems = audioHistory.length > 0 || transcriptionHistory.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-numeric text-[#0071E3] mb-1">
            <span>[ LOCAL ACOUSTIC REPOSITORY ]</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Sound Archive &amp; Transcripts</span>
            <span className="text-[11px] font-mono-numeric text-[#0071E3] bg-[#0071E3]/15 border border-[#0071E3]/30 px-2 py-0.5 rounded-full">
              {audioHistory.length + transcriptionHistory.length} items
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Your recent voice generations and audio transcripts cached locally in browser storage.
          </p>
        </div>

        {/* Filter Controls & Clear All */}
        <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-[#151619] border border-black/[0.06] dark:border-white/[0.08] rounded-xl overflow-x-auto max-w-full shrink">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-[#0071E3] text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('audio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeFilter === 'audio'
                  ? 'bg-[#0071E3] text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Audio ({audioHistory.length})
            </button>
            <button
              onClick={() => setActiveFilter('transcription')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeFilter === 'transcription'
                  ? 'bg-[#0071E3] text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Transcripts ({transcriptionHistory.length})
            </button>
          </div>

          {hasItems && (
            <button
              onClick={onClearAll}
              className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
              title="Clear entire archive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!hasItems ? (
        <div className="text-center py-20 bg-white dark:bg-[#151619] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl space-y-3 shadow-sm">
          <Clock className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mx-auto" />
          <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-300">Archive is empty</h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Generate audio speech or transcribe a voice recording to populate your acoustic repository.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Audio History Items */}
          {(activeFilter === 'all' || activeFilter === 'audio') &&
            audioHistory.map((item) => (
              <div
                key={item.id}
                className="relative bg-white dark:bg-[#151619] border border-black/[0.08] dark:border-white/[0.08] hover:border-black/[0.16] dark:hover:border-white/[0.16] rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-sm"
              >
                <span className="corner-crosshair corner-crosshair-tl">+</span>
                <span className="corner-crosshair corner-crosshair-tr">+</span>
                <span className="corner-crosshair corner-crosshair-bl">+</span>
                <span className="corner-crosshair corner-crosshair-br">+</span>

                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => onPlayAudio(item)}
                    className="w-10 h-10 rounded-xl bg-[#0071E3] hover:bg-[#007BF5] text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md shadow-[#0071E3]/20"
                    title="Play Audio"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-2">
                      {item.text}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-mono-numeric">
                      <span className="text-[#0071E3] font-semibold">
                        Persona: {item.voiceName}
                      </span>
                      <span aria-hidden="true" className="text-black/10 dark:text-white/20">·</span>
                      <span>24kHz WAV</span>
                      <span aria-hidden="true" className="text-black/10 dark:text-white/20">·</span>
                      <span className="text-neutral-400 dark:text-neutral-500">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleCopy(item.id, item.text)}
                    className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                    title="Copy text"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-[#0071E3]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() =>
                      downloadFile(
                        base64ToAudioUrl(item.audioBase64, item.mimeType),
                        `augen_${item.voiceName.toLowerCase()}_${item.id}.wav`
                      )
                    }
                    className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                    title="Download WAV"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteAudio(item.id)}
                    className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

          {/* Transcription History Items */}
          {(activeFilter === 'all' || activeFilter === 'transcription') &&
            transcriptionHistory.map((item) => (
              <div
                key={item.id}
                className="relative bg-white dark:bg-[#151619] border border-black/[0.08] dark:border-white/[0.08] hover:border-black/[0.16] dark:hover:border-white/[0.16] rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-sm"
              >
                <span className="corner-crosshair corner-crosshair-tl">+</span>
                <span className="corner-crosshair corner-crosshair-tr">+</span>
                <span className="corner-crosshair corner-crosshair-bl">+</span>
                <span className="corner-crosshair corner-crosshair-br">+</span>

                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-neutral-700 dark:text-white flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-[#0071E3]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-2">
                      {item.transcript || item.text}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-mono-numeric">
                      <span className="text-neutral-800 dark:text-white font-medium">
                        {item.wordCount} words
                      </span>
                      <span aria-hidden="true" className="text-black/10 dark:text-white/20">·</span>
                      <span>STT Transcript</span>
                      <span aria-hidden="true" className="text-black/10 dark:text-white/20">·</span>
                      <span className="text-neutral-400 dark:text-neutral-500">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleCopy(item.id, item.transcript || item.text || '')}
                    className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                    title="Copy text"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-[#0071E3]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => onSendToTts(item.transcript || item.text || '')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0071E3] hover:bg-[#007BF5] text-white text-xs font-semibold shadow-md shadow-[#0071E3]/20 transition-all active:scale-95"
                    title="Send to Text-to-Speech"
                  >
                    <span>Synthesize</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>

                  <button
                    onClick={() => onDeleteTranscription(item.id)}
                    className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
