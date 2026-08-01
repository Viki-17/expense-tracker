/**
 * KaiKanakku — Central Theme Configuration
 *
 * All theme colors are defined here. To change the theme, update the values
 * in this file, then update the matching CSS variables in `src/index.css`.
 *
 * Colors are stored as:
 *  - `hex`   → used in app code (category defaults, settings)
 *  - `rgb`   → used in CSS variable definitions (`--accent: 227 246 117`)
 */

export const theme = {
  /** Neon lime accent — used for primary buttons, active states, links */
  accent: {
    hex: '#e3f675',
    rgb: '227 246 117',
  },

  /** Income / success green */
  income: {
    hex: '#83f774',
    rgb: '131 247 116',
  },

  /** Page background */
  canvas: {
    hex: '#0a0f0a',
    rgb: '10 15 10',
  },

  /** Primary card surface */
  surface: {
    hex: '#121a12',
    rgb: '18 26 18',
  },

  /** Inset surface / input backgrounds */
  surface2: {
    hex: '#1a241a',
    rgb: '26 36 26',
  },

  /** Elevated / hover surface */
  surface3: {
    hex: '#243024',
    rgb: '36 48 36',
  },

  /** Primary text */
  label: {
    hex: '#f5fff2',
    rgb: '245 255 242',
  },

  /** Secondary text */
  secondary: {
    hex: '#9ab093',
    rgb: '154 176 147',
  },

  /** Muted / tertiary text */
  tertiary: {
    hex: '#6a7a60',
    rgb: '106 122 96',
  },

  /** Borders / dividers */
  separator: {
    hex: '#243024',
    rgb: '36 48 36',
  },

  /** Subtle accent-tinted backgrounds */
  accentSoft: {
    hex: '#1a3a16',
    rgb: '26 58 22',
  },

  /** Accent glow / highlight */
  accentGlow: {
    hex: '#f0ffa0',
    rgb: '240 255 160',
  },

  /** Danger / expense red */
  danger: {
    hex: '#ff6b6b',
    rgb: '255 107 107',
  },

  /** Danger-tinted subtle background */
  dangerSoft: {
    hex: '#502323',
    rgb: '80 35 35',
  },

  /** Success-tinted subtle background */
  successSoft: {
    hex: '#1a3a16',
    rgb: '26 58 22',
  },

  /** Warning yellow */
  warning: {
    hex: '#facc15',
    rgb: '250 204 21',
  },

  /** Focus ring */
  ring: {
    hex: '#e3f675',
    rgb: '227 246 117',
  },

  /** Dark text placed on accent / success / warning backgrounds */
  textOnAccent: '#0a0a00',

  /** Default category color when adding a new custom category */
  defaultCategoryColor: '#e3f675',
} as const;

export type Theme = typeof theme;
