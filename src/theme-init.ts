const STORAGE_KEY = 'et-theme';

function applyInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY) as 'light' | 'dark' | null;
  const theme =
    stored === 'light' || stored === 'dark'
      ? stored
      : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  root.style.colorScheme = theme;
}

try {
  applyInitialTheme();
} catch {
  /* noop */
}