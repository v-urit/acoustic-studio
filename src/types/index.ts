export interface VoicePersona {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  tone: string;
  description: string;
  accent: string;
  bestFor: string;
  sampleText: string;
}

export interface GeneratedAudio {
  id: string;
  text: string;
  voiceName: string;
  audioBase64: string;
  mimeType: string;
  createdAt: number;
  duration?: number;
  durationSeconds?: number;
  modelUsed: string;
  styleApplied?: string;
}

export interface TranscriptionRecord {
  id: string;
  transcript: string;
  text?: string;
  audioBase64?: string;
  mimeType?: string;
  wordCount: number;
  charCount?: number;
  createdAt: number;
  durationSeconds?: number;
  sourceType?: 'microphone' | 'file';
  fileName?: string;
  confidenceScore?: number;
}

export type ActiveTab = 'tts' | 'stt' | 'bilateral' | 'voices' | 'library';

export interface PresetScript {
  id: string;
  title: string;
  category: string;
  voiceId: string;
  style: string;
  text: string;
}
