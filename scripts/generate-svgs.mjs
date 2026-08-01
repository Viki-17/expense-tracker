// Theme source of truth: src/theme.ts
//
// Programmatically generates the app's SVG brand assets into /public:
//   - favicon.svg          (browser tab icon, 32x32)
//   - icon.svg              (PWA / maskable app icon, 512x512)
//   - icon-foreground.svg   (Android adaptive icon foreground layer, 512x512)
//   - splash.svg            (Android launch / splash screen, portrait)
//
// Usage:  npm run generate-svgs

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, '../public');

// --- Palette (mirrors src/theme.ts) ---------------------------------------
const C = {
  accent: '#e3f675',
  accentGlow: '#f0ffa0',
  bagTop: '#3a4a30',
  bagBottom: '#1f2a18',
  bagEdge: '#2f3d26',
  stitching: '#4a5a40',
  ropeLight: '#e8d49a',
  ropeDark: '#c4a35a',
  handTop: '#ffffff',
  handBottom: '#b8c4b0',
  cuff: '#2a3a24',
  cuffInner: '#1f2a18',
  shine: '#ffffff',
  canvas: '#0a0f0a',
  bgDark: '#050805',
  label: '#f5fff2',
  tertiary: '#6a7a60',
  gold: '#e8d49a',
};

// --- Reusable <defs> (gradients + filters) --------------------------------
const defs = (s = '') => `
  <defs>
    <linearGradient id="bg${s}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.canvas}"/>
      <stop offset="100%" stop-color="${C.bgDark}"/>
    </linearGradient>
    <radialGradient id="glow${s}" cx="50%" cy="35%" r="55%">
      <stop offset="0%" stop-color="${C.accent}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${C.accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bag${s}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.bagTop}"/>
      <stop offset="100%" stop-color="${C.bagBottom}"/>
    </linearGradient>
    <linearGradient id="hand${s}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.handTop}"/>
      <stop offset="100%" stop-color="${C.handBottom}"/>
    </linearGradient>
    <linearGradient id="rope${s}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.ropeDark}"/>
      <stop offset="50%" stop-color="${C.ropeLight}"/>
      <stop offset="100%" stop-color="${C.ropeDark}"/>
    </linearGradient>
    <filter id="rupeeGlow${s}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <radialGradient id="markGlow${s}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${C.accent}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${C.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

// --- Vector Rupee mark (no font glyphs, so it renders identically everywhere) -
// Drawn in a 100x100 box centered at (0,0). Use scale + translate to place it.
const rupeeMark = () => `
  <!-- Top bar -->
  <rect x="-32" y="-40" width="64" height="12" rx="2"/>
  <!-- Middle bar -->
  <rect x="-32" y="-14" width="44" height="10" rx="2"/>
  <!-- Diagonal stroke with the curved tail as one continuous filled path -->
  <path d="M -32,-40 L -20,-40 L 26,40 Q 34,40 42,48 Q 48,55 48,64 L 48,76 L 34,76 Q 28,64 18,48 L -32,-10 Z"/>`;

// --- The logo mark (money bag held in a hand, with a glowing vector rupee) -
// Drawn in a 512x512 design space. Optical center is (256, 255).
const logoMark = ({ cx, cy, scale, glow = true, id = '', rupeeScale = 0.95 }) => {
  const t = `translate(${cx} ${cy}) scale(${scale}) translate(-256 -255)`;
  return `
  <g transform="${t}">
    ${glow ? `<circle cx="256" cy="200" r="130" fill="url(#markGlow${id})"/>` : ''}
    <!-- Hand holding the bag -->
    <g transform="translate(256 358)">
      <rect x="-84" y="28" width="168" height="44" rx="11" fill="${C.cuff}"/>
      <rect x="-78" y="33" width="156" height="32" rx="8" fill="${C.cuffInner}"/>
      <path d="M-88 32 C-88 8, -65 -10, -42 -10 L42 -10 C65 -10, 88 8, 88 32 C88 48, 75 58, 56 58 L-56 58 C-75 58, -88 48, -88 32 Z" fill="url(#hand${id})"/>
      <ellipse cx="-45" cy="-4" rx="20" ry="12" fill="url(#hand${id})"/>
      <ellipse cx="-3" cy="-8" rx="24" ry="14" fill="url(#hand${id})"/>
      <ellipse cx="40" cy="-4" rx="20" ry="12" fill="url(#hand${id})"/>
    </g>
    <!-- Money bag -->
    <g transform="translate(256 215)">
      <path d="M-70 82 C-90 62, -100 2, -80 -46 C-70 -76, -52 -92, -37 -107 L37 -107 C52 -92, 70 -76, 80 -46 C100 2, 90 62, 70 82 C52 106, -52 106, -70 82 Z" fill="url(#bag${id})"/>
      <path d="M-38 -105 C-31 -122, 31 -122, 38 -105 C44 -92, 27 -85, 0 -85 C-27 -85, -44 -92, -38 -105 Z" fill="${C.bagEdge}"/>
      <path d="M-40 -102 C-46 -112, 46 -112, 40 -102 C48 -95, 56 -85, 51 -75 C32 -65, -32 -65, -51 -75 C-56 -85, -48 -95, -40 -102 Z" fill="${C.bagTop}"/>
      <ellipse cx="0" cy="-95" rx="46" ry="14" stroke="url(#rope${id})" stroke-width="8" fill="none"/>
      <circle cx="50" cy="-95" r="9" fill="${C.ropeLight}"/>
      <path d="M50 -95 Q68 -75 62 -48" stroke="url(#rope${id})" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path d="M50 -95 Q78 -78 74 -52" stroke="url(#rope${id})" stroke-width="6" stroke-linecap="round" fill="none"/>
      <circle cx="62" cy="-48" r="5" fill="${C.ropeLight}"/>
      <circle cx="74" cy="-52" r="5" fill="${C.ropeLight}"/>
      <path d="M-56 -24 L-56 40" stroke="${C.stitching}" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 6"/>
      <path d="M56 -24 L56 40" stroke="${C.stitching}" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 6"/>
      <!-- Glowing vector rupee -->
      <g transform="translate(0 12) scale(${rupeeScale})" fill="${C.accentGlow}" filter="url(#rupeeGlow${id})">
        ${rupeeMark()}
      </g>
      <ellipse cx="-30" cy="-40" rx="19" ry="27" fill="${C.shine}" opacity="0.12"/>
    </g>
  </g>`;
};

// --- 1. favicon.svg -------------------------------------------------------
// 64×64 viewBox gives the small icon enough coordinate resolution so the bag
// outline, rope, and vector rupee stay readable at 16×16 and 32×32.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="${C.bgDark}"/>
  <circle cx="32" cy="30" r="24" fill="${C.accent}" opacity="0.12"/>
  <!-- Bag silhouette with lime stroke -->
  <path d="M22,24 C22,18 26,14 32,14 C38,14 42,18 42,24 C42,27 46,31 48,36 C50,42 46,48 32,48 C18,48 14,42 16,36 C18,31 22,27 22,24 Z" fill="${C.bagBottom}" stroke="${C.accent}" stroke-width="2.5"/>
  <!-- Cinched neck -->
  <path d="M24,15 C28,17 36,17 40,15 Z" fill="${C.bagEdge}"/>
  <!-- Gold rope -->
  <path d="M22,25 C27,27 37,27 42,25" stroke="${C.ropeLight}" stroke-width="3" stroke-linecap="round" fill="none"/>
  <!-- Lime vector rupee -->
  <g transform="translate(32 28) scale(0.23)" fill="${C.accentGlow}">
    ${rupeeMark()}
  </g>
  <!-- Supporting hand base -->
  <path d="M14,52 C22,50 42,50 50,52" stroke="${C.handTop}" stroke-width="4" stroke-linecap="round" fill="none"/>
</svg>`;

// --- 2. icon.svg (full app icon) ------------------------------------------
const ICON_BODY = `${defs('Icon')}
  <rect width="512" height="512" rx="128" fill="url(#bgIcon)"/>
  <rect width="512" height="512" rx="128" fill="url(#glowIcon)"/>
  ${logoMark({ cx: 256, cy: 256, scale: 1.0, rupeeScale: 0.95, id: 'Icon' })}`;

const icon = `<!-- Theme source of truth: src/theme.ts -->
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">${ICON_BODY}
</svg>`;

// --- 3. icon-foreground.svg (Android adaptive foreground) ---------------
const iconForeground = `<!-- Theme source of truth: src/theme.ts -->
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">${defs('Fg')}
  ${logoMark({ cx: 256, cy: 256, scale: 0.62, glow: false, rupeeScale: 0.95, id: 'Fg' })}
</svg>`;

// --- 4. splash.svg (Android launch screen) --------------------------------
const splash = `<!-- Theme source of truth: src/theme.ts -->
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920" fill="none">${defs('Splash')}
  <rect width="1080" height="1920" fill="url(#bgSplash)"/>
  <rect width="1080" height="1920" fill="url(#glowSplash)"/>
  ${logoMark({ cx: 540, cy: 820, scale: 2.1, rupeeScale: 0.95, id: 'Splash' })}
  <g text-anchor="middle">
    <text x="540" y="1180" font-family="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="78" letter-spacing="1">
      <tspan fill="${C.accentGlow}">Kai</tspan><tspan fill="${C.gold}">Kanakku</tspan>
    </text>
    <text x="540" y="1240" font-family="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="28" fill="${C.tertiary}" letter-spacing="6">PERSONAL EXPENSE TRACKER</text>
  </g>
</svg>`;

// --- Write everything ------------------------------------------------------
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