// Theme source of truth: src/theme.ts
//
// Generates the app's SVG brand assets into /public:
//   - favicon.svg          (browser tab icon)
//   - icon.svg              (PWA / launcher icon)
//   - icon-foreground.svg   (Android adaptive icon foreground)
//   - splash.svg            (Android launch screen)

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, '../public');

const C = {
  accent: '#e3f675',
  accentGlow: '#f0ffa0',
  canvas: '#232816',
  surface: '#090b07',
  surface2: '#181c10',
  separator: '#474e2b',
  gold: '#e8d49a',
  label: '#f8fae7',
  bgDark: '#050805',
};

const defs = (suffix = '') => `<defs>
    <linearGradient id="bg${suffix}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.canvas}"/>
      <stop offset="100%" stop-color="${C.bgDark}"/>
    </linearGradient>
    <linearGradient id="plate${suffix}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#30361c"/>
      <stop offset="100%" stop-color="${C.surface2}"/>
    </linearGradient>
    <radialGradient id="glow${suffix}" cx="50%" cy="35%" r="60%">
      <stop offset="0%" stop-color="${C.accent}" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="${C.accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="softGlow${suffix}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="7" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>`;

// A deliberately simple rupee mark that remains recognizable at launcher size.
const rupeePaths = (stroke = C.accentGlow, strokeWidth = 20) => `<g fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M-92 -74 H90"/>
    <path d="M-92 -22 H55"/>
    <path d="M-18 -74 C30 -74 57 -55 57 -22 C57 11 30 31 -18 31 H-35"/>
    <path d="M-35 31 L66 126"/>
  </g>`;

const logoMark = ({ cx, cy, scale = 1, foreground = false }) => `<g transform="translate(${cx} ${cy}) scale(${scale})">
    <rect x="-154" y="-164" width="308" height="328" rx="82"
      fill="url(#plate${foreground ? 'Fg' : 'Icon'})"
      stroke="${C.accent}" stroke-width="7" stroke-opacity="0.62"/>
    <circle cx="0" cy="-20" r="128" fill="${C.accent}" opacity="0.08"/>
    <g filter="url(#softGlow${foreground ? 'Fg' : 'Icon'})">
      ${rupeePaths()}
    </g>
    <path d="M-78 126 H78" stroke="${C.gold}" stroke-width="10" stroke-linecap="round" opacity="0.9"/>
    <circle cx="-101" cy="126" r="6" fill="${C.accent}"/>
    <circle cx="101" cy="126" r="6" fill="${C.accent}"/>
  </g>`;

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="16" fill="${C.bgDark}"/>
  <circle cx="32" cy="29" r="27" fill="${C.accent}" opacity="0.12"/>
  <rect x="14" y="10" width="36" height="44" rx="11" fill="${C.surface2}" stroke="${C.accent}" stroke-width="2.5" stroke-opacity="0.72"/>
  <g transform="translate(32 29) scale(0.115)">
    ${rupeePaths(C.accentGlow, 22)}
  </g>
  <path d="M23 48 H41" stroke="${C.gold}" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

const icon = `<!-- Theme source of truth: src/theme.ts -->
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
  ${defs('Icon')}
  <rect width="512" height="512" rx="128" fill="url(#bgIcon)"/>
  <rect width="512" height="512" rx="128" fill="url(#glowIcon)"/>
  ${logoMark({ cx: 256, cy: 256 })}
</svg>`;

// Keep the foreground transparent so Android can apply its adaptive mask cleanly.
const iconForeground = `<!-- Theme source of truth: src/theme.ts -->
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
  ${defs('Fg')}
  ${logoMark({ cx: 256, cy: 256, scale: 0.62, foreground: true })}
</svg>`;

const splash = `<!-- Theme source of truth: src/theme.ts -->
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920" fill="none">
  ${defs('Splash')}
  <rect width="1080" height="1920" fill="url(#bgSplash)"/>
  <rect width="1080" height="1920" fill="url(#glowSplash)"/>
  ${logoMark({ cx: 540, cy: 820, scale: 1.55 })}
  <g text-anchor="middle">
    <text x="540" y="1190" font-family="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="78" letter-spacing="1">
      <tspan fill="${C.accentGlow}">Kai</tspan><tspan fill="${C.gold}">Kanakku</tspan>
    </text>
    <text x="540" y="1250" font-family="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="28" fill="${C.accent}" opacity="0.62" letter-spacing="6">PERSONAL EXPENSE TRACKER</text>
  </g>
</svg>`;

const files = {
  'favicon.svg': favicon,
  'icon.svg': icon,
  'icon-foreground.svg': iconForeground,
  'splash.svg': splash,
};

for (const [name, content] of Object.entries(files)) {
  writeFileSync(resolve(PUBLIC, name), `${content.trim()}\n`);
  console.log(`Generated public/${name}`);
}
