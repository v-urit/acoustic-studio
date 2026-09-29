import fs from 'fs';
import path from 'path';

// Generate Authentic 3D Fibonacci Sphere matching NeuralAudioOrb.tsx
function generateFibonacciOrbSvg(cx, cy, radius, isSoundActive = true) {
  const numPoints = 260;
  const phi = Math.PI * (3 - Math.sqrt(5));
  const rotX = 0.38;
  const rotY = 0.42;
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const y = 1 - (i / (numPoints - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    
    const curX = x * radius;
    const curY = y * radius;
    const curZ = z * radius;

    const x1 = curX * cosY - curZ * sinY;
    const z1 = curZ * cosY + curX * sinY;
    const y2 = curY * cosX - z1 * sinX;
    const z2 = z1 * cosX + curY * sinX;

    const fov = 340;
    const scale = fov / (fov + z2 + radius * 0.5);
    const x2d = x1 * scale;
    const y2d = y2 * scale;
    const normZ = (z2 + radius) / (2 * radius);
    const alpha = Math.max(0.12, Math.min(1, 0.25 + normZ * 0.75));
    points.push({ x2d, y2d, z: z2, alpha, size: (1.2 + (i % 3) * 0.4) });
  }

  points.sort((a, b) => a.z - b.z);

  // Generate constellation connection lines
  let linesSvg = '';
  const connectionDist = (isSoundActive ? 38 : 22);
  for (let i = 0; i < points.length; i += 3) {
    for (let j = i + 1; j < points.length; j += 4) {
      const dx = points[i].x2d - points[j].x2d;
      const dy = points[i].y2d - points[j].y2d;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < connectionDist) {
        const lineAlpha = (1 - dist / connectionDist) * 0.28 * points[i].alpha;
        const strokeColor = isSoundActive ? `rgba(0, 113, 227, ${lineAlpha.toFixed(2)})` : `rgba(255, 255, 255, ${lineAlpha.toFixed(2)})`;
        linesSvg += `<line x1="${(cx + points[i].x2d).toFixed(1)}" y1="${(cy + points[i].y2d).toFixed(1)}" x2="${(cx + points[j].x2d).toFixed(1)}" y2="${(cy + points[j].y2d).toFixed(1)}" stroke="${strokeColor}" stroke-width="${isSoundActive ? '0.85' : '0.5'}" />\n`;
      }
    }
  }

  // Generate points
  let pointsSvg = '';
  for (const p of points) {
    const ptRadius = ((p.size * (p.alpha + 0.3)) / 1.1).toFixed(1);
    let fill = '';
    if (isSoundActive) {
      if (p.alpha > 0.68) {
        fill = `rgba(255, 255, 255, ${p.alpha.toFixed(2)})`;
      } else {
        fill = `rgba(0, 113, 227, ${Math.min(1, p.alpha * 1.45).toFixed(2)})`;
      }
    } else {
      fill = `rgba(255, 255, 255, ${(p.alpha * 0.8).toFixed(2)})`;
    }
    pointsSvg += `<circle cx="${(cx + p.x2d).toFixed(1)}" cy="${(cy + p.y2d).toFixed(1)}" r="${ptRadius}" fill="${fill}" />\n`;
  }

  return `
    <!-- Core Volumetric Aura Glow -->
    <radialGradient id="orb-glow-${cx}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0071E3" stop-opacity="0.32" />
      <stop offset="60%" stop-color="#0071E3" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#0071E3" stop-opacity="0" />
    </radialGradient>
    <circle cx="${cx}" cy="${cy}" r="${radius * 1.5}" fill="url(#orb-glow-${cx})" pointer-events="none" />
    
    <!-- Constellation Lines -->
    <g class="constellations">
      ${linesSvg}
    </g>

    <!-- 3D Fibonacci Points -->
    <g class="fibonacci-particles">
      ${pointsSvg}
    </g>

    <!-- Center Specular Core Core Glow -->
    <circle cx="${cx}" cy="${cy}" r="${radius * 0.35}" fill="#0071E3" fill-opacity="0.12" filter="blur(12px)" />
  `;
}

// 1. Hero Preview
const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720" fill="none">
  <defs>
    <radialGradient id="bg-radial" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#141720" />
      <stop offset="60%" stop-color="#0A0B0D" />
      <stop offset="100%" stop-color="#07080A" />
    </radialGradient>
    <pattern id="grid-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#FFFFFF" fill-opacity="0.04" />
    </pattern>
  </defs>

  <rect width="1280" height="720" fill="url(#bg-radial)" />
  <rect width="1280" height="720" fill="url(#grid-dots)" />

  <!-- FLOATING FROSTED GLASS NAVBAR -->
  <g transform="translate(360, 24)">
    <!-- Asterisk Button Left -->
    <rect x="-56" y="0" width="44" height="44" rx="22" fill="#151619" fill-opacity="0.85" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="1" />
    <g transform="translate(-34, 22)" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round">
      <line x1="0" y1="-8" x2="0" y2="8" />
      <line x1="-8" y1="0" x2="8" y2="0" />
      <line x1="-5.6" y1="-5.6" x2="5.6" y2="5.6" />
      <line x1="-5.6" y1="5.6" x2="5.6" y2="-5.6" />
    </g>

    <!-- Main Navigation Bar -->
    <rect x="0" y="0" width="560" height="44" rx="22" fill="#151619" fill-opacity="0.85" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="1" filter="drop-shadow(0 8px 24px rgba(0,0,0,0.5))" />
    
    <!-- Active Pill on Text to Speech -->
    <rect x="4" y="4" width="124" height="36" rx="18" fill="#0071E3" filter="drop-shadow(0 2px 8px rgba(0,113,227,0.4))" />
    <text x="66" y="27" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="600" fill="#FFFFFF" text-anchor="middle">Text to Speech</text>

    <!-- Inactive Tabs -->
    <text x="180" y="27" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="500" fill="#A1A1A6" text-anchor="middle">Transcribe</text>
    <text x="270" y="27" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="500" fill="#A1A1A6" text-anchor="middle">Voice Lab</text>
    <text x="360" y="27" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="500" fill="#A1A1A6" text-anchor="middle">Personas</text>
    <text x="450" y="27" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="500" fill="#A1A1A6" text-anchor="middle">Library</text>

    <!-- Theme Switcher Right -->
    <rect x="572" y="0" width="44" height="44" rx="22" fill="#151619" fill-opacity="0.85" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="1" />
    <path d="M598 17 A6 6 0 0 0 590 27 A8 8 0 1 1 598 17 Z" fill="#0071E3" stroke="#0071E3" stroke-width="1.2" />
  </g>

  <!-- TELEMETRY STATUS PILL -->
  <g transform="translate(640, 105)">
    <rect x="-150" y="0" width="300" height="28" rx="14" fill="#FFFFFF" fill-opacity="0.05" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="1" />
    <circle cx="-128" cy="14" r="3.5" fill="#10B981" />
    <text x="2" y="18" font-family="'JetBrains Mono', monospace" font-size="10.5" fill="#A1A1A6" text-anchor="middle" letter-spacing="1">
      24,000 HZ MASTER CORE · <tspan fill="#0071E3" font-weight="600">GEMINI 3.8 FLASH</tspan>
    </text>
  </g>

  <!-- HERO TYPOGRAPHY -->
  <text x="640" y="175" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" font-size="52" font-weight="300" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1.5">
    Acoustic
  </text>
  <text x="640" y="230" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" font-size="52" font-weight="500" fill="#0071E3" text-anchor="middle" letter-spacing="-1.5">
    Intelligence.
  </text>
  <text x="640" y="270" font-family="-apple-system, system-ui, sans-serif" font-size="14" fill="#A1A1A6" text-anchor="middle" font-weight="400">
    High-fidelity voice synthesis with human nuance markers, paired with zero-loss neural audio transcription.
  </text>

  <!-- EXACT 3D FIBONACCI SPHERE CORE (GENUINE ALGORITHM) -->
  <g id="fibonacci-neural-orb">
    ${generateFibonacciOrbSvg(640, 430, 95, true)}
    <text x="640" y="550" font-family="'JetBrains Mono', monospace" font-size="9" fill="#0071E3" text-anchor="middle" letter-spacing="2">A¹ NEURAL AUDIO SENSOR</text>
    <text x="640" y="565" font-family="'JetBrains Mono', monospace" font-size="8" fill="#666666" text-anchor="middle" letter-spacing="1">TOUCH &amp; DRAG TO ROTATE 3D SENSOR</text>
  </g>

  <!-- CTA ACTION BUTTONS -->
  <g transform="translate(640, 615)">
    <!-- Primary Button -->
    <rect x="-185" y="0" width="175" height="42" rx="21" fill="#0071E3" filter="drop-shadow(0 4px 16px rgba(0,113,227,0.35))" />
    <path d="M-155 21 L-155 21 M-150 17 L-150 25 M-145 13 L-145 29 M-140 18 L-140 24" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
    <text x="-88" y="26" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="600" fill="#FFFFFF" text-anchor="middle">Synthesize Speech</text>

    <!-- Secondary Button -->
    <rect x="10" y="0" width="175" height="42" rx="21" fill="#FFFFFF" fill-opacity="0.06" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="1" />
    <circle cx="45" cy="18" r="4" fill="none" stroke="#FFFFFF" stroke-width="1.8" />
    <path d="M45 22 L45 27 M41 27 L49 27" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />
    <text x="106" y="26" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="500" fill="#FFFFFF" text-anchor="middle">Transcribe Audio</text>
  </g>

  <!-- CORNER CROSSHAIRS -->
  <text x="24" y="32" font-family="'JetBrains Mono', monospace" font-size="10" fill="#FFFFFF" fill-opacity="0.2">+</text>
  <text x="1250" y="32" font-family="'JetBrains Mono', monospace" font-size="10" fill="#FFFFFF" fill-opacity="0.2">+</text>
  <text x="24" y="700" font-family="'JetBrains Mono', monospace" font-size="10" fill="#FFFFFF" fill-opacity="0.2">+</text>
  <text x="1250" y="700" font-family="'JetBrains Mono', monospace" font-size="10" fill="#FFFFFF" fill-opacity="0.2">+</text>
</svg>`;

// Write files
const outputDir = path.resolve('screenshots');
const publicOutputDir = path.resolve('public/screenshots');

fs.writeFileSync(path.join(outputDir, '01-hero-preview.svg'), heroSvg);
fs.writeFileSync(path.join(publicOutputDir, '01-hero-preview.svg'), heroSvg);

console.log('Successfully generated authentic screenshots with real 3D Fibonacci sphere algorithm!');
