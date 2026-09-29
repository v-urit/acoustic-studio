import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Check,
  Repeat,
  FastForward,
  Rewind,
} from 'lucide-react';
import { formatTime, downloadFile } from '../utils/audioUtils';
import { emitAudioState } from '../utils/audioEvents';

interface WaveformPlayerProps {
  audioUrl: string;
  title?: string;
  voiceName?: string;
  modelUsed?: string;
  onEnded?: () => void;
  autoPlay?: boolean;
}

export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  audioUrl,
  title = 'Synthesized Audio',
  voiceName = 'Kore',
  modelUsed = 'Gemini 3.8 Voice',
  onEnded,
  autoPlay = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);

  // Generate deterministic realistic waveform bar heights
  const [peaks] = useState<number[]>(() => {
    return Array.from({ length: 64 }, (_, i) => {
      const x = i / 64;
      const envelope = Math.sin(x * Math.PI);
      const ripple = 0.35 * Math.sin(x * 24) + 0.25 * Math.cos(x * 12);
      const value = Math.max(0.14, Math.min(1.0, envelope * 0.7 + ripple * 0.3 + 0.18));
      return Math.round(value * 100) / 100;
    });
  });

  // Handle autoPlay and src changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      if (autoPlay) {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            emitAudioState({ isPlaying: true, intensity: 0.85, source: 'waveform-autoplay' });
          })
          .catch(() => {
            setIsPlaying(false);
            emitAudioState({ isPlaying: false, intensity: 0 });
          });
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    }

    return () => {
      emitAudioState({ isPlaying: false, intensity: 0 });
    };
  }, [audioUrl, autoPlay]);

  // Render canvas with responsive scaling
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight || 56;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const barCount = peaks.length;
    const barSpacing = Math.max(1.5, Math.min(2.5, width / 200));
    const totalSpacing = (barCount - 1) * barSpacing;
    const barWidth = Math.max(1.8, (width - totalSpacing) / barCount);

    const progress = duration > 0 ? currentTime / duration : 0;
    const activeIndex = Math.floor(progress * barCount);

    peaks.forEach((peak, i) => {
      const x = i * (barWidth + barSpacing);
      const barHeight = Math.max(4, peak * (height - 8));
      const y = (height - barHeight) / 2;

      ctx.beginPath();
      const radius = Math.min(barWidth / 2, 2);
      ctx.roundRect(x, y, barWidth, barHeight, radius);

      const isDark = document.documentElement.classList.contains('dark');
      if (i <= activeIndex) {
        ctx.fillStyle = i === activeIndex ? (isDark ? '#ffffff' : '#111111') : '#0071e3';
      } else {
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.12)';
      }
      ctx.fill();
    });
  }, [peaks, currentTime, duration]);

  useEffect(() => {
    renderCanvas();
    window.addEventListener('resize', renderCanvas);
    return () => {
      window.removeEventListener('resize', renderCanvas);
    };
  }, [renderCanvas]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      emitAudioState({ isPlaying: false, intensity: 0, source: 'waveform-pause' });
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          emitAudioState({ isPlaying: true, intensity: 0.85, source: 'waveform-play' });
        })
        .catch(console.error);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !audioRef.current || duration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);

    emitAudioState({
      isPlaying: true,
      intensity: 0.95,
      currentTime: newTime,
      source: 'waveform-seek',
    });

    if (audioRef.current.paused) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    const target = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = target;
    setCurrentTime(target);

    emitAudioState({
      isPlaying: !audioRef.current.paused,
      intensity: 0.85,
      currentTime: target,
      source: 'waveform-skip',
    });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 0.85];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  return (
    <div className="relative bg-white dark:bg-[#151619] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl transition-all">
      {/* Precision corner crosshairs */}
      <span className="corner-crosshair corner-crosshair-tl">+</span>
      <span className="corner-crosshair corner-crosshair-tr">+</span>
      <span className="corner-crosshair corner-crosshair-bl">+</span>
      <span className="corner-crosshair corner-crosshair-br">+</span>

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
        loop={isLooping}
        onPlay={() => {
          setIsPlaying(true);
          emitAudioState({ isPlaying: true, intensity: 0.85, source: 'audio-onplay' });
        }}
        onPause={() => {
          setIsPlaying(false);
          emitAudioState({ isPlaying: false, intensity: 0, source: 'audio-onpause' });
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            const time = audioRef.current.currentTime;
            setCurrentTime(time);
            if (!audioRef.current.paused) {
              const pulse = 0.5 + 0.4 * Math.sin(time * 6);
              emitAudioState({
                isPlaying: true,
                intensity: pulse,
                currentTime: time,
                source: 'audio-timeupdate',
              });
            }
          }
        }}
        onEnded={() => {
          if (isLooping) {
            emitAudioState({ isPlaying: true, intensity: 1.0, source: 'audio-loop-restart' });
          } else {
            setIsPlaying(false);
            emitAudioState({ isPlaying: false, intensity: 0, source: 'audio-ended' });
            if (onEnded) onEnded();
          }
        }}
      />

      {/* Top Header Row with Specs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="min-w-0">
          <h4 className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-white truncate max-w-md">{title}</h4>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-mono-numeric">
            <span className="text-[#0071E3] font-medium">Persona: {voiceName}</span>
            <span aria-hidden="true" className="text-black/10 dark:text-white/20">·</span>
            <span className="truncate">{modelUsed}</span>
            <span aria-hidden="true" className="text-black/10 dark:text-white/20">·</span>
            <span className="text-neutral-500 dark:text-neutral-400">24kHz WAV</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {/* Speed Toggle */}
          <button
            onClick={cycleSpeed}
            title="Change Playback Speed"
            className="px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-xs font-mono-numeric text-neutral-700 dark:text-neutral-300 transition-colors border border-black/[0.06] dark:border-white/[0.06]"
          >
            {playbackRate}x
          </button>

          {/* Loop / Repeat Toggle */}
          <button
            onClick={() => {
              const nextLoop = !isLooping;
              setIsLooping(nextLoop);
              if (nextLoop && isPlaying) {
                emitAudioState({ isPlaying: true, intensity: 0.9, source: 'loop-toggle-on' });
              }
            }}
            title={isLooping ? 'Loop is Active' : 'Toggle Continuous Loop'}
            className={`p-1.5 rounded-lg border transition-all ${
              isLooping
                ? 'bg-[#0071E3] border-[#0071E3] text-white shadow-md shadow-[#0071E3]/30'
                : 'bg-black/[0.04] dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.06] text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Download Button */}
          <button
            onClick={() => downloadFile(audioUrl, `augen_${voiceName.toLowerCase()}_master.wav`)}
            title="Download Master 24kHz WAV"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0071E3] hover:bg-[#007BF5] text-xs font-medium text-white transition-all shadow-md shadow-[#0071E3]/20 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">WAV</span>
          </button>
        </div>
      </div>

      {/* Waveform Canvas & Time Indicators */}
      <div className="space-y-2 py-1">
        <div className="relative group cursor-pointer bg-neutral-100 dark:bg-[#0F1012] border border-black/[0.06] dark:border-white/[0.06] rounded-xl p-2.5 sm:p-3">
          <canvas
            ref={canvasRef}
            onClick={handleSeek}
            className="w-full h-12 sm:h-14 block"
            title="Click or drag anywhere on waveform to seek and animate"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono-numeric text-neutral-500 dark:text-neutral-400 px-1">
          <span>{formatTime(currentTime)}</span>
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {duration > 0 ? `${peaks.length} BARS · 24kHz` : '24.0 kHz MASTER'}
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Primary Transport Controls (Responsive flex wrap) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Skip Back 5s */}
          <button
            onClick={() => handleSkip(-5)}
            className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors"
            title="Rewind 5s"
          >
            <Rewind className="w-4 h-4" />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-black/10 dark:shadow-white/10"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Skip Ahead 5s */}
          <button
            onClick={() => handleSkip(5)}
            className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors"
            title="Forward 5s"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Volume & Audio Output Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 sm:w-24 h-1 bg-black/15 dark:bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
