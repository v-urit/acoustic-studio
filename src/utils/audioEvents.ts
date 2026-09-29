// Custom Event System for Global Acoustic Activity Synchronization

export interface AudioStateDetail {
  isPlaying: boolean;
  intensity?: number;
  currentTime?: number;
  source?: string;
}

export const emitAudioState = (detail: AudioStateDetail) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('augen-audio-state', { detail }));
  }
};

export const subscribeAudioState = (callback: (detail: AudioStateDetail) => void) => {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<AudioStateDetail>;
    callback(customEvent.detail);
  };

  window.addEventListener('augen-audio-state', handler);
  return () => {
    window.removeEventListener('augen-audio-state', handler);
  };
};
