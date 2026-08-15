/** @type {import('tailwindcss').Config} */
// Theme source of truth: src/theme.ts — update that file first, then mirror changes here.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          2: 'rgb(var(--surface-2) / <alpha-value>)',
          3: 'rgb(var(--surface-3) / <alpha-value>)',
        },
        label: 'rgb(var(--label) / <alpha-value>)',
        secondary: 'rgb(var(--secondary) / <alpha-value>)',
        tertiary: 'rgb(var(--tertiary) / <alpha-value>)',
        separator: 'rgb(var(--separator) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
          glow: 'rgb(var(--accent-glow) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
          soft: 'rgb(var(--danger-soft) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          soft: 'rgb(var(--success-soft) / <alpha-value>)',
        },
        warning: 'rgb(var(--warning) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        lime: { DEFAULT: '#e3f675', 50: '#f0fff0', 100: '#d9ffd6', 200: '#b3ffae', 300: '#99ff91', 400: '#e3f675', 500: '#6be060', 600: '#55c24b', 700: '#3a8532', 800: '#1f471b', 900: '#122a10', 950: '#0a1908' },
        mint: { DEFAULT: '#e3f675', 50: '#f0fff0', 100: '#d9ffd6', 200: '#b3ffae', 300: '#99ff91', 400: '#e3f675', 500: '#6be060', 600: '#55c24b', 700: '#3a8532', 800: '#1f471b', 900: '#122a10', 950: '#0a1908' },
        cyan: { 400: '#e3f675', 500: '#6be060' },
        primary: { 50: '#f0fff0', 100: '#d9ffd6', 200: '#b3ffae', 300: '#99ff91', 400: '#e3f675', 500: '#6be060', 600: '#55c24b', 700: '#3a8532', 800: '#1f471b', 900: '#122a10', 950: '#0a1908' },
        expense: { 400: '#df8278', 500: '#cf7169', 600: '#b85b54' },
        income: { 400: '#a3ff9a', 500: '#83f774', 600: '#6be060' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      transitionTimingFunction: {
        ios: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      boxShadow: {
        card: 'var(--shadow)',
      },
      backgroundImage: {
        'kk-gradient': 'linear-gradient(135deg, #303720 0%, #151b0e 100%)',
        'kk-glow': 'radial-gradient(ellipse at 50% -10%, rgba(227, 246, 117, 0.16) 0%, transparent 62%)',
      },
    },
  },
  plugins: [],
};
