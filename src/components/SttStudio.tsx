import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Upload,
  FileAudio,
  Play,
  Pause,
  Copy,
  Check,
  Download,
  ArrowRight,
  Sparkles,
  AlertCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { TranscriptionRecord } from '../types';
import {
  blobToBase64,
  formatTime,
  downloadFile,
  generateSrt,
} from '../utils/audioUtils';
import { emitAudioState } from '../utils/audioEvents';

interface SttStudioProps {
  onTranscriptionCreated: (record: TranscriptionRecord) => void;
  onSendToTts: (text: string) => void;
}

export const SttStudio: React.FC<SttStudioProps> = ({
  onTranscriptionCreated,
  onSendToTts,
}) => {
  const [inputMode, setInputMode] = useState<'mic' | 'upload'>('mic');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [stats, setStats] = useState<{ wordCount: number; charCount: number }>({
    wordCount: 0,
    charCount: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [promptOption, setPromptOption] = useState<string>('verbatim');

  // MediaRecorder & Web Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up media streams and timers on unmount
  useEffect(() => {
    return () => {
      stopMicrophoneStream();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  const stopMicrophoneStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start Live Audio Level Meter
  const startLevelMeter = (stream: MediaStream) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);
        if (normalized > 5) {
          emitAudioState({ isPlaying: true, intensity: normalized / 100, source: 'microphone' });
        }
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn('Audio metering unavailable:', e);
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      startLevelMeter(stream);

      // Choose supported mimeType
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const localUrl = URL.createObjectURL(audioBlob);
        setPreviewAudioUrl(localUrl);

        // Process audio for transcription
        await processAudioTranscription(audioBlob, mimeType);
      };

      recorder.start(250); // Slice every 250ms
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setErrorMessage(
        err.message || 'Microphone access is required to record speech. Check browser permissions.'
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      emitAudioState({ isPlaying: false, intensity: 0, source: 'microphone-stop' });
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      stopMicrophoneStream();
      setAudioLevel(0);
    }
  };

  const handleFileChange = async (file: File) => {
    if (!file) return;
    setUploadedFile(file);
    setErrorMessage(null);
    const localUrl = URL.createObjectURL(file);
    setPreviewAudioUrl(localUrl);

    await processAudioTranscription(file, file.type || 'audio/wav');
  };

  const processAudioTranscription = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      const base64Audio = await blobToBase64(blob);

      let customPrompt =
        'Transcribe the speech verbatim with natural capitalization, accurate punctuation, and paragraph breaks.';
      if (promptOption === 'clean') {
        customPrompt =
          'Transcribe the speech cleanly for executive reading. Filter out vocal hesitations (ums, uhs) while keeping the exact semantic meaning intact.';
      }

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType: mimeType || 'audio/webm',
          prompt: customPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transcription service error');
      }

      const resultText = data.text || '';
      setTranscript(resultText);

      const words = resultText.trim() ? resultText.trim().split(/\s+/).length : 0;
      const chars = resultText.length;
      setStats({ wordCount: words, charCount: chars });

      // Save transcription record
      const record: TranscriptionRecord = {
        id: 'stt_' + Date.now(),
        transcript: resultText,
        text: resultText,
        durationSeconds: recordingSeconds || 5,
        wordCount: words,
        charCount: chars,
        createdAt: Date.now(),
        confidenceScore: 0.98,
        sourceType: inputMode === 'mic' ? 'microphone' : 'file',
      };

      onTranscriptionCreated(record);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to transcribe audio. Please retry.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportTxt = () => {
    downloadFile(transcript, `augen_transcript_${Date.now()}.txt`, 'text/plain');
  };

  const handleExportSrt = () => {
    const srtContent = generateSrt(transcript, recordingSeconds || 10);
    downloadFile(srtContent, `augen_subtitles_${Date.now()}.srt`, 'text/plain');
  };

  const handleExportJson = () => {
    const payload = JSON.stringify(
      {
        transcript,
        stats,
        recordedAt: new Date().toISOString(),
        engine: 'Gemini 3.5 Transcribe',
      },
      null,
      2
    );
    downloadFile(payload, `augen_transcript_${Date.now()}.json`, 'application/json');
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-numeric text-[#0071E3] mb-1">
            <span>[ S¹ ACOUSTIC RECEPTOR ]</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Neural Speech to Text</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Zero-loss acoustic transcription with contextual punctuation and clean paragraphing.
          </p>
        </div>

        {/* Input Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-[#151619] border border-black/[0.06] dark:border-white/[0.08] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => {
              if (!isRecording) setInputMode('mic');
            }}
            disabled={isRecording}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              inputMode === 'mic'
                ? 'bg-[#0071E3] text-white shadow-md shadow-[#0071E3]/20'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Live Mic</span>
          </button>
          <button
            onClick={() => {
              if (!isRecording) setInputMode('upload');
            }}
            disabled={isRecording}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              inputMode === 'upload'
                ? 'bg-[#0071E3] text-white shadow-md shadow-[#0071E3]/20'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Main Studio Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Audio Capture Area (5 cols) */}
        <div className="lg:col-span-5 relative bg-white dark:bg-[#151619] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-6">
          <span className="corner-crosshair corner-crosshair-tl">+</span>
          <span className="corner-crosshair corner-crosshair-tr">+</span>
          <span className="corner-crosshair corner-crosshair-bl">+</span>
          <span className="corner-crosshair corner-crosshair-br">+</span>

          {inputMode === 'mic' ? (
            /* Microphone Studio Mode */
            <div className="space-y-6 flex-1 flex flex-col justify-center items-center text-center py-6">
              <div className="relative">
                {isRecording && (
                  <div
                    className="absolute -inset-4 rounded-full bg-[#0071E3]/25 animate-ping pointer-events-none"
                    style={{ animationDuration: '2s' }}
                  />
                )}

                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/30'
                      : 'bg-[#0071E3] hover:bg-[#007BF5] text-white shadow-[#0071E3]/30 active:scale-95'
                  }`}
                  title={isRecording ? 'Click to Stop & Transcribe' : 'Click to Start Recording'}
                >
                  {isRecording ? (
                    <MicOff className="w-7 h-7 fill-current" />
                  ) : (
                    <Mic className="w-7 h-7" />
                  )}
                </button>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {isRecording
                    ? 'Capturing Audio Signal...'
                    : isTranscribing
                    ? 'Decoding Neural Layers...'
                    : 'Tap to Record Voice'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
                  {isRecording
                    ? 'Speak clearly. When finished, tap the button to transcribe.'
                    : 'Instant microphone capture with noise cancellation and live level metering.'}
                </p>
              </div>

              {/* Time Elapsed & Live Sound Level */}
              {isRecording && (
                <div className="w-full space-y-2 max-w-xs">
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-mono-numeric">
                    <span className="flex items-center gap-1.5 text-red-500">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      REC
                    </span>
                    <span className="text-neutral-900 dark:text-white font-medium">
                      {formatTime(recordingSeconds)}
                    </span>
                  </div>

                  {/* Audio Level Bar */}
                  <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0071E3] transition-all duration-75 rounded-full"
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* File Upload Mode */
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-black/15 dark:border-white/15 hover:border-[#0071E3]/50 rounded-xl p-8 text-center cursor-pointer transition-colors bg-neutral-50 dark:bg-[#0F1012] hover:bg-neutral-100 dark:hover:bg-[#0F1012]/80 flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#0071E3]">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-900 dark:text-white">
                    Drop audio file here, or{' '}
                    <span className="text-[#0071E3] underline underline-offset-2">
                      browse
                    </span>
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                    MP3, WAV, WebM, M4A, OGG up to 25MB
                  </p>
                </div>
              </div>

              {uploadedFile && (
                <div className="p-3 bg-neutral-50 dark:bg-[#0F1012] border border-black/[0.08] dark:border-white/[0.08] rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileAudio className="w-4 h-4 text-[#0071E3] shrink-0" />
                    <span className="text-neutral-900 dark:text-white truncate">{uploadedFile.name}</span>
                  </div>
                  <span className="text-neutral-500 dark:text-neutral-400 font-mono-numeric shrink-0 ml-2">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Audio Preview Player if recorded/uploaded */}
          {previewAudioUrl && !isRecording && (
            <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] space-y-2">
              <span className="text-[11px] font-mono-numeric text-neutral-500 dark:text-neutral-400 block uppercase">
                Source Audio Playback:
              </span>
              <audio src={previewAudioUrl} controls className="w-full h-9 rounded-lg" />
            </div>
          )}

          {/* Prompt formatting options */}
          <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] space-y-2">
            <span className="text-[11px] font-mono-numeric uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block font-medium">
              Output Formatting Mode:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPromptOption('verbatim')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  promptOption === 'verbatim'
                    ? 'bg-neutral-50 dark:bg-[#0F1012] border-[#0071E3] ring-1 ring-[#0071E3] text-neutral-900 dark:text-white'
                    : 'bg-neutral-50/60 dark:bg-[#0F1012]/60 border-black/[0.06] dark:border-white/[0.06] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <div className="font-medium text-[11px]">Verbatim Precision</div>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500">Full punctuation & nuance</div>
              </button>

              <button
                type="button"
                onClick={() => setPromptOption('clean')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  promptOption === 'clean'
                    ? 'bg-neutral-50 dark:bg-[#0F1012] border-[#0071E3] ring-1 ring-[#0071E3] text-neutral-900 dark:text-white'
                    : 'bg-neutral-50/60 dark:bg-[#0F1012]/60 border-black/[0.06] dark:border-white/[0.06] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <div className="font-medium text-[11px]">Clean Executive</div>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500">Filter vocal hesitations</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Transcription Output & Actions (7 cols) */}
        <div className="lg:col-span-7 relative bg-white dark:bg-[#151619] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4">
          <span className="corner-crosshair corner-crosshair-tl">+</span>
          <span className="corner-crosshair corner-crosshair-tr">+</span>
          <span className="corner-crosshair corner-crosshair-bl">+</span>
          <span className="corner-crosshair corner-crosshair-br">+</span>

          <div className="space-y-3 flex-1 flex flex-col">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between text-xs pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0071E3]" />
                <span className="font-mono-numeric uppercase tracking-wider text-xs text-neutral-700 dark:text-neutral-200">
                  TRANSCRIPTION BUFFER
                </span>
              </div>

              {transcript && (
                <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400 font-mono-numeric text-xs">
                  <span>{stats.wordCount} words</span>
                  <span aria-hidden="true" className="text-black/10 dark:text-white/20">·</span>
                  <span>{stats.charCount} chars</span>
                </div>
              )}
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* Transcript Text Box */}
            <div className="flex-1 min-h-[220px] rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-neutral-50 dark:bg-[#0F1012] p-4 relative flex flex-col">
              {isTranscribing ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-12">
                  <div className="w-6 h-6 border-2 border-[#0071E3] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-mono-numeric text-neutral-600 dark:text-neutral-300">
                    Neural Transcriber processing audio acoustic layers...
                  </p>
                </div>
              ) : transcript ? (
                <p className="text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed whitespace-pre-wrap select-text font-normal font-sans">
                  {transcript}
                </p>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-400 dark:text-neutral-500 text-xs space-y-2 py-12">
                  <Mic className="w-8 h-8 opacity-30" />
                  <p>Your transcription will appear here once audio is captured.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Bar */}
          {transcript && (
            <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Export Formats */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  className="px-3 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white text-xs flex items-center gap-1.5 transition-colors shrink-0"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#0071E3]" />
                      <span className="text-[#0071E3]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-[#0F1012] p-0.5 rounded-lg border border-black/[0.06] dark:border-white/[0.06] shrink-0">
                  <button
                    type="button"
                    onClick={handleExportTxt}
                    className="px-2 py-1 text-[11px] font-mono-numeric text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                    title="Export plain text (.txt)"
                  >
                    .TXT
                  </button>
                  <button
                    type="button"
                    onClick={handleExportSrt}
                    className="px-2 py-1 text-[11px] font-mono-numeric text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                    title="Export subtitles (.srt)"
                  >
                    .SRT
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="px-2 py-1 text-[11px] font-mono-numeric text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                    title="Export structured JSON (.json)"
                  >
                    .JSON
                  </button>
                </div>
              </div>

              {/* Bilateral Bridge: Send to Text-to-Speech! */}
              <button
                type="button"
                onClick={() => onSendToTts(transcript)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#0071E3] hover:bg-[#007BF5] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#0071E3]/20 transition-all active:scale-95 cursor-pointer shrink-0"
                title="Send this transcribed text to Text-to-Speech studio to synthesize with a neural voice"
              >
                <span>Synthesize with AI Voice</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
