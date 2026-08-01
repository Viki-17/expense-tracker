const STORAGE_KEY = 'kk-theme';

function applyInitialTheme() {
  const root = document.documentElement;
  root.classList.add('dark');
  root.style.colorScheme = 'dark';
  localStorage.setItem(STORAGE_KEY, 'dark');
}

try {
  applyInitialTheme();
} catch {
  /* noop */
}
