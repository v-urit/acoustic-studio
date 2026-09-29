/**
 * Audio processing utilities for Augen Voice
 */

// Convert Base64 audio string into a playable Object URL
export function base64ToAudioUrl(base64: string, mimeType = 'audio/wav'): string {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

// Convert File or Blob to Base64
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Format seconds into MM:SS or MM:SS.SS
export function formatTime(seconds: number, includeDecimals = false): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const formattedMins = mins.toString().padStart(2, '0');
  const formattedSecs = secs.toString().padStart(2, '0');

  if (includeDecimals) {
    const centis = Math.floor((seconds % 1) * 100);
    return `${formattedMins}:${formattedSecs}.${centis.toString().padStart(2, '0')}`;
  }

  return `${formattedMins}:${formattedSecs}`;
}

// Download file utility
export function downloadFile(content: Blob | string, fileName: string, mimeType = 'text/plain') {
  let blob: Blob;
  if (typeof content === 'string') {
    blob = new Blob([content], { type: mimeType });
  } else {
    blob = content;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Generate simple SRT subtitle format from transcript text
export function generateSrt(text: string, durationEstimateSeconds = 10): string {
  const sentences = text.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [text];
  const count = sentences.length;
  const timePerSentence = durationEstimateSeconds / Math.max(count, 1);

  return sentences
    .map((sentence, idx) => {
      const startSec = idx * timePerSentence;
      const endSec = (idx + 1) * timePerSentence;

      const formatSrtTime = (sec: number) => {
        const h = Math.floor(sec / 3600).toString().padStart(2, '0');
        const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(sec % 60).toString().padStart(2, '0');
        const ms = Math.floor((sec % 1) * 1000).toString().padStart(3, '0');
        return `${h}:${m}:${s},${ms}`;
      };

      return `${idx + 1}\n${formatSrtTime(startSec)} --> ${formatSrtTime(endSec)}\n${sentence.trim()}\n`;
    })
    .join('\n');
}

// Extract normalized waveform peaks from AudioBuffer
export async function extractWaveformPeaks(
  audioBlob: Blob,
  targetBarCount = 64
): Promise<number[]> {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    const channelData = decoded.getChannelData(0);
    const blockSize = Math.floor(channelData.length / targetBarCount);
    const peaks: number[] = [];

    for (let i = 0; i < targetBarCount; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[i * blockSize + j] || 0);
      }
      const avg = sum / blockSize;
      peaks.push(Math.min(1, Math.max(0.12, avg * 3.5)));
    }
    audioCtx.close();
    return peaks;
  } catch {
    // Deterministic pseudo-peaks fallback if audio decoding fails
    return Array.from({ length: targetBarCount }, (_, i) => {
      return 0.2 + 0.6 * Math.abs(Math.sin((i / targetBarCount) * Math.PI * 3));
    });
  }
}
