import React, { useEffect, useRef, useState } from 'react';
import { subscribeAudioState } from '../utils/audioEvents';

interface NeuralAudioOrbProps {
  size?: number; // width/height in px
  label?: string;
  sublabel?: string;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  size: number;
  speed: number;
  phase: number;
}

export const NeuralAudioOrb: React.FC<NeuralAudioOrbProps> = ({
  size = 250,
  label = 'A¹ NEURAL AUDIO CORE',
  sublabel = 'DRAG TO ROTATE 3D SENSOR',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const rotRef = useRef({ x: 0.35, y: 0.45 });

  // Real-time audio reactive states
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const currentIntensityRef = useRef(0.1);
  const targetIntensityRef = useRef(0.1);

  // Subscribe to universal audio state (play, pause, seek, loop, mic)
  useEffect(() => {
    const unsubscribe = subscribeAudioState((detail) => {
      setIsPlayingAudio(detail.isPlaying);
      if (detail.isPlaying) {
        targetIntensityRef.current = Math.max(0.65, detail.intensity || 0.8);
      } else {
        targetIntensityRef.current = 0.08;
      }
    });

    const handleGlobalPlay = () => {
      setIsPlayingAudio(true);
      targetIntensityRef.current = 0.85;
    };
    const handleGlobalPause = () => {
      setTimeout(() => {
        const audios = Array.from(document.querySelectorAll('audio'));
        const anyActive = audios.some((a) => !a.paused && !a.ended);
        if (!anyActive) {
          setIsPlayingAudio(false);
          targetIntensityRef.current = 0.08;
        }
      }, 50);
    };
    const handleGlobalTimeUpdate = () => {
      setIsPlayingAudio(true);
      targetIntensityRef.current = 0.6 + 0.35 * Math.sin(Date.now() / 150);
    };
    const handleGlobalSeeked = () => {
      setIsPlayingAudio(true);
      targetIntensityRef.current = 1.0;
    };

    window.addEventListener('play', handleGlobalPlay, true);
    window.addEventListener('pause', handleGlobalPause, true);
    window.addEventListener('ended', handleGlobalPause, true);
    window.addEventListener('timeupdate', handleGlobalTimeUpdate, true);
    window.addEventListener('seeked', handleGlobalSeeked, true);

    return () => {
      unsubscribe();
      window.removeEventListener('play', handleGlobalPlay, true);
      window.removeEventListener('pause', handleGlobalPause, true);
      window.removeEventListener('ended', handleGlobalPause, true);
      window.removeEventListener('timeupdate', handleGlobalTimeUpdate, true);
      window.removeEventListener('seeked', handleGlobalSeeked, true);
    };
  }, []);

  // 3D Fibonacci Sphere Render Engine with automatic resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const setupResolution = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth || size;
      const displayHeight = canvas.clientHeight || size;
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    setupResolution();
    window.addEventListener('resize', setupResolution);

    const radius = size * 0.36;
    const numPoints = 260;
    const points: Point3D[] = [];

    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      points.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        baseX: x * radius,
        baseY: y * radius,
        baseZ: z * radius,
        size: Math.random() * 1.6 + 1.2,
        speed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.02;
      const curWidth = canvas.clientWidth || size;
      const curHeight = canvas.clientHeight || size;
      ctx.clearRect(0, 0, curWidth, curHeight);

      currentIntensityRef.current += (targetIntensityRef.current - currentIntensityRef.current) * 0.12;
      const activeIntensity = currentIntensityRef.current;
      const isSoundActive = activeIntensity > 0.25;

      if (!isDraggingRef.current) {
        rotRef.current.y += isSoundActive ? 0.01 : 0.0035;
        rotRef.current.x += isSoundActive ? 0.004 : 0.0015;
      }

      const cosX = Math.cos(rotRef.current.x);
      const sinX = Math.sin(rotRef.current.x);
      const cosY = Math.cos(rotRef.current.y);
      const sinY = Math.sin(rotRef.current.y);

      const projectedPoints: { x2d: number; y2d: number; z: number; point: Point3D; alpha: number }[] = [];

      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        const displacement =
          Math.sin(time * 3 + p.phase) * (activeIntensity * 20) +
          (isSoundActive ? Math.sin(time * 8 + p.baseY * 0.06) * (activeIntensity * 10) : 0);

        const currentRadiusRatio = 1 + displacement / radius;
        const curX = p.baseX * currentRadiusRatio;
        const curY = p.baseY * currentRadiusRatio;
        const curZ = p.baseZ * currentRadiusRatio;

        const x1 = curX * cosY - curZ * sinY;
        const z1 = curZ * cosY + curX * sinY;

        const y2 = curY * cosX - z1 * sinX;
        const z2 = z1 * cosX + curY * sinX;

        const fov = 340;
        const scale = fov / (fov + z2 + radius * 0.5);
        const x2d = curWidth / 2 + x1 * scale * (curWidth / size);
        const y2d = curHeight / 2 + y2 * scale * (curHeight / size);

        const normZ = (z2 + radius) / (2 * radius);
        const alpha = Math.max(0.12, Math.min(1, 0.25 + normZ * 0.75));

        projectedPoints.push({ x2d, y2d, z: z2, point: p, alpha });
      }

      projectedPoints.sort((a, b) => a.z - b.z);

      ctx.lineWidth = isSoundActive ? 0.75 : 0.45;
      const connectionDist = (isSoundActive ? 42 : 25) * (curWidth / size);

      for (let i = 0; i < projectedPoints.length; i += 3) {
        for (let j = i + 1; j < projectedPoints.length; j += 4) {
          const dx = projectedPoints[i].x2d - projectedPoints[j].x2d;
          const dy = projectedPoints[i].y2d - projectedPoints[j].y2d;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const lineAlpha = (1 - dist / connectionDist) * 0.2 * projectedPoints[i].alpha;
            ctx.strokeStyle = isSoundActive
              ? `rgba(0, 113, 227, ${lineAlpha * 2})`
              : `rgba(255, 255, 255, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(projectedPoints[i].x2d, projectedPoints[i].y2d);
            ctx.lineTo(projectedPoints[j].x2d, projectedPoints[j].y2d);
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < projectedPoints.length; i++) {
        const { x2d, y2d, alpha } = projectedPoints[i];

        ctx.beginPath();
        const ptRadius = (projectedPoints[i].point.size * (alpha + 0.3)) / 1.1;
        ctx.arc(x2d, y2d, Math.max(0.8, ptRadius), 0, Math.PI * 2);

        if (isSoundActive) {
          if (alpha > 0.65) {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          } else {
            ctx.fillStyle = `rgba(0, 113, 227, ${Math.min(1, alpha * 1.4)})`;
          }
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.75})`;
        }
        ctx.fill();
      }

      const grad = ctx.createRadialGradient(
        curWidth / 2,
        curHeight / 2,
        0,
        curWidth / 2,
        curHeight / 2,
        radius * 0.95 * (curWidth / size)
      );
      if (isSoundActive) {
        grad.addColorStop(0, `rgba(0, 113, 227, ${activeIntensity * 0.28})`);
        grad.addColorStop(0.5, `rgba(0, 113, 227, ${activeIntensity * 0.08})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(curWidth / 2, curHeight / 2, radius * (curWidth / size), 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', setupResolution);
    };
  }, [size]);

  // Touch & Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    rotRef.current.y += dx * 0.008;
    rotRef.current.x -= dy * 0.008;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none w-full max-w-full"
      onMouseLeave={() => {
        isDraggingRef.current = false;
      }}
    >
      <div
        className={`absolute inset-0 rounded-full blur-3xl transition-opacity duration-500 pointer-events-none ${
          isPlayingAudio ? 'bg-[#0071E3]/25 opacity-100 scale-110' : 'bg-white/[0.02] opacity-20'
        }`}
      />

      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: `${size}px`, aspectRatio: '1/1' }}
        className="cursor-grab active:cursor-grabbing relative z-10 touch-none block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={(e) => {
          if (e.touches[0]) {
            isDraggingRef.current = true;
            lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
        }}
        onTouchMove={(e) => {
          if (!isDraggingRef.current || !e.touches[0]) return;
          const dx = e.touches[0].clientX - lastMousePosRef.current.x;
          const dy = e.touches[0].clientY - lastMousePosRef.current.y;
          rotRef.current.y += dx * 0.008;
          rotRef.current.x -= dy * 0.008;
          lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={() => {
          isDraggingRef.current = false;
        }}
      />

      <div className="text-center mt-1 z-20 space-y-0.5 px-2">
        <div className="flex items-center justify-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${
              isPlayingAudio ? 'bg-[#0071E3] scale-125 animate-ping' : 'bg-neutral-500'
            }`}
          />
          <span className="text-[10px] sm:text-[11px] font-mono-numeric tracking-[0.15em] uppercase text-neutral-300 font-medium truncate">
            {isPlayingAudio ? 'ACOUSTIC CARRIER ACTIVE' : label}
          </span>
        </div>
        <p className="text-[9px] sm:text-[10px] font-mono-numeric text-neutral-500 tracking-wider">
          {isPlayingAudio ? '24,000 HZ · RESONANCE' : sublabel}
        </p>
      </div>
    </div>
  );
};
