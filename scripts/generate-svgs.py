#!/usr/bin/env python3
"""Generate KaiKanakku SVG brand assets with app theme colors."""

import os

# App theme colors (matches src/theme.ts from generate-svgs.mjs)
BG_DARK = '#050805'
BG_CANVAS = '#0a0f0a'
BAG_TOP = '#3a4a30'
BAG_BOTTOM = '#1f2a18'
BAG_EDGE = '#2f3d26'
STITCHING = '#4a5a40'
ROPE_LIGHT = '#e8d49a'
ROPE_DARK = '#c4a35a'
HAND_TOP = '#ffffff'
HAND_BOTTOM = '#b8c4b0'
CUFF = '#2a3a24'
CUFF_INNER = '#1f2a18'
SHINE = '#ffffff'
ACCENT = '#e3f675'
ACCENT_GLOW = '#f0ffa0'
GOLD = '#e8d49a'
TERTIARY = '#6a7a60'

PUBLIC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')

def defs_block(suffix=''):
    return f'''  <defs>
    <linearGradient id="bg{suffix}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{BG_CANVAS}"/>
      <stop offset="100%" stop-color="{BG_DARK}"/>
    </linearGradient>
    <radialGradient id="glow{suffix}" cx="50%" cy="35%" r="55%">
      <stop offset="0%" stop-color="{ACCENT}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="{ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bag{suffix}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{BAG_TOP}"/>
      <stop offset="100%" stop-color="{BAG_BOTTOM}"/>
    </linearGradient>
    <linearGradient id="hand{suffix}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{HAND_TOP}"/>
      <stop offset="100%" stop-color="{HAND_BOTTOM}"/>
    </linearGradient>
    <linearGradient id="rope{suffix}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="{ROPE_DARK}"/>
      <stop offset="50%" stop-color="{ROPE_LIGHT}"/>
      <stop offset="100%" stop-color="{ROPE_DARK}"/>
    </linearGradient>
    <filter id="rupeeGlow{suffix}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <radialGradient id="markGlow{suffix}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="{ACCENT}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="{ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>'''


def rupee_mark():
    return '''  <!-- Top bar -->
  <rect x="-32" y="-40" width="64" height="12" rx="2"/>
  <!-- Middle bar -->
  <rect x="-32" y="-14" width="44" height="10" rx="2"/>
  <!-- Diagonal stroke with the curved tail as one continuous filled path -->
  <path d="M -32,-40 L -20,-40 L 26,40 Q 34,40 42,48 Q 48,55 48,64 L 48,76 L 34,76 Q 28,64 18,48 L -32,-10 Z"/>'''


def logo_mark(cx, cy, scale, glow=True, suffix='', rupee_scale=0.95):
    t = f'translate({cx} {cy}) scale({scale}) translate(-256 -255)'
    glow_circle = f'    <circle cx="256" cy="200" r="130" fill="url(#markGlow{suffix})"/>' if glow else ''
    return f'''  <g transform="{t}">
{glow_circle}    <!-- Hand holding the bag -->
    <g transform="translate(256 358)">
      <rect x="-84" y="28" width="168" height="44" rx="11" fill="{CUFF}"/>
      <rect x="-78" y="33" width="156" height="32" rx="8" fill="{CUFF_INNER}"/>
      <path d="M-88 32 C-88 8, -65 -10, -42 -10 L42 -10 C65 -10, 88 8, 88 32 C88 48, 75 58, 56 58 L-56 58 C-75 58, -88 48, -88 32 Z" fill="url(#hand{suffix})"/>
      <ellipse cx="-45" cy="-4" rx="20" ry="12" fill="url(#hand{suffix})"/>
      <ellipse cx="-3" cy="-8" rx="24" ry="14" fill="url(#hand{suffix})"/>
      <ellipse cx="40" cy="-4" rx="20" ry="12" fill="url(#hand{suffix})"/>
    </g>
    <!-- Money bag -->
    <g transform="translate(256 215)">
      <path d="M-70 82 C-90 62, -100 2, -80 -46 C-70 -76, -52 -92, -37 -107 L37 -107 C52 -92, 70 -76, 80 -46 C100 2, 90 62, 70 82 C52 106, -52 106, -70 82 Z" fill="url(#bag{suffix})"/>
      <path d="M-38 -105 C-31 -122, 31 -122, 38 -105 C44 -92, 27 -85, 0 -85 C-27 -85, -44 -92, -38 -105 Z" fill="{BAG_EDGE}"/>
      <path d="M-40 -102 C-46 -112, 46 -112, 40 -102 C48 -95, 56 -85, 51 -75 C32 -65, -32 -65, -51 -75 C-56 -85, -48 -95, -40 -102 Z" fill="{BAG_TOP}"/>
      <ellipse cx="0" cy="-95" rx="46" ry="14" stroke="url(#rope{suffix})" stroke-width="8" fill="none"/>
      <circle cx="50" cy="-95" r="9" fill="{ROPE_LIGHT}"/>
      <path d="M50 -95 Q68 -75 62 -48" stroke="url(#rope{suffix})" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path d="M50 -95 Q78 -78 74 -52" stroke="url(#rope{suffix})" stroke-width="6" stroke-linecap="round" fill="none"/>
      <circle cx="62" cy="-48" r="5" fill="{ROPE_LIGHT}"/>
      <circle cx="74" cy="-52" r="5" fill="{ROPE_LIGHT}"/>
      <path d="M-56 -24 L-56 40" stroke="{STITCHING}" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 6"/>
      <path d="M56 -24 L56 40" stroke="{STITCHING}" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 6"/>
      <!-- Glowing vector rupee -->
      <g transform="translate(0 12) scale({rupee_scale})" fill="{ACCENT_GLOW}" filter="url(#rupeeGlow{suffix})">
{rupee_mark()}
      </g>
      <ellipse cx="-30" cy="-40" rx="19" ry="27" fill="{SHINE}" opacity="0.12"/>
    </g>
  </g>'''


# --- 1. favicon.svg (64x64) ---
favicon = f'''<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="{BG_DARK}"/>
  <circle cx="32" cy="30" r="24" fill="{ACCENT}" opacity="0.12"/>
  <path d="M22,24 C22,18 26,14 32,14 C38,14 42,18 42,24 C42,27 46,31 48,36 C50,42 46,48 32,48 C18,48 14,42 16,36 C18,31 22,27 22,24 Z" fill="{BAG_BOTTOM}" stroke="{ACCENT}" stroke-width="2.5"/>
  <path d="M24,15 C28,17 36,17 40,15 Z" fill="{BAG_EDGE}"/>
  <path d="M22,25 C27,27 37,27 42,25" stroke="{ROPE_LIGHT}" stroke-width="3" stroke-linecap="round" fill="none"/>
  <g transform="translate(32 28) scale(0.23)" fill="{ACCENT_GLOW}">
{rupee_mark()}
  </g>
  <path d="M14,52 C22,50 42,50 50,52" stroke="{HAND_TOP}" stroke-width="4" stroke-linecap="round" fill="none"/>
</svg>'''

# --- 2. icon.svg (512x512) ---
icon_body = f'''{defs_block('Icon')}
  <rect width="512" height="512" rx="128" fill="url(#bgIcon)"/>
  <rect width="512" height="512" rx="128" fill="url(#glowIcon)"/>
{logo_mark(256, 256, 1.0, True, 'Icon', 0.95)}'''

icon = f'''<!-- Theme source of truth: scripts/generate-svgs.py -->
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
{icon_body}
</svg>'''

# --- 3. icon-192.svg (192x192 viewBox, same content as icon) ---
icon_192 = f'''<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 512 512" fill="none">
{icon_body}
</svg>'''

# --- 4. icon-512.svg (same as icon) ---
icon_512 = icon

# --- 5. icon-foreground.svg (transparent, no bg, for Android adaptive) ---
icon_fg = f'''<!-- Theme source of truth: scripts/generate-svgs.py -->
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
{defs_block('Fg')}
{logo_mark(256, 256, 0.62, False, 'Fg', 0.95)}
</svg>'''

# --- 6. splash.svg (1080x1920) ---
splash_body = f'''{defs_block('Splash')}
  <rect width="1080" height="1920" fill="url(#bgSplash)"/>
  <rect width="1080" height="1920" fill="url(#glowSplash)"/>
{logo_mark(540, 820, 2.1, True, 'Splash', 0.95)}
  <g text-anchor="middle">
    <text x="540" y="1180" font-family="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="78" letter-spacing="1">
      <tspan fill="{ACCENT_GLOW}">Kai</tspan><tspan fill="{GOLD}">Kanakku</tspan>
    </text>
    <text x="540" y="1240" font-family="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="28" fill="{TERTIARY}" letter-spacing="6">PERSONAL EXPENSE TRACKER</text>
  </g>'''

splash = f'''<!-- Theme source of truth: scripts/generate-svgs.py -->
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920" fill="none">
{splash_body}
</svg>'''


# --- Write all files ---
files = {
    'favicon.svg': favicon,
    'icon.svg': icon,
    'icon-192.svg': icon_192,
    'icon-512.svg': icon_512,
    'icon-foreground.svg': icon_fg,
    'splash.svg': splash,
}

for name, content in files.items():
    path = os.path.join(PUBLIC, name)
    with open(path, 'w') as f:
        f.write(content.strip() + '\n')
    print(f'Generated public/{name}')

print('\nAll SVGs regenerated with app theme colors!')
