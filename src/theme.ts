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
    hex: '#232816',
    rgb: '35 40 22',
  },

  /** Primary card surface */
  surface: {
    hex: '#090b07',
    rgb: '9 11 7',
  },

  /** Inset surface / input backgrounds */
  surface2: {
    hex: '#181c10',
    rgb: '24 28 16',
  },

  /** Elevated / hover surface */
  surface3: {
    hex: '#30361c',
    rgb: '48 54 28',
  },

  /** Primary text */
  label: {
    hex: '#f8fae7',
    rgb: '248 250 231',
  },

  /** Secondary text */
  secondary: {
    hex: '#c0c799',
    rgb: '192 199 153',
  },

  /** Muted / tertiary text */
  tertiary: {
    hex: '#848d5e',
    rgb: '132 141 94',
  },

  /** Borders / dividers */
  separator: {
    hex: '#474e2b',
    rgb: '71 78 43',
  },

  /** Subtle accent-tinted backgrounds */
  accentSoft: {
    hex: '#3f4b16',
    rgb: '63 75 22',
  },

  /** Accent glow / highlight */
  accentGlow: {
    hex: '#f0ffa0',
    rgb: '240 255 160',
  },

  /** Danger / expense red */
  danger: {
    hex: '#d3776f',
    rgb: '211 119 111',
  },

  /** Danger-tinted subtle background */
  dangerSoft: {
    hex: '#3c221f',
    rgb: '60 34 31',
  },

  /** Success-tinted subtle background */
  successSoft: {
    hex: '#3f4b16',
    rgb: '63 75 22',
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
