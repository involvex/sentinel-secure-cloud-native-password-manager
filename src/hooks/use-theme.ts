import React from 'react';
export function useTheme() {
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      console.warn('Theme preference storage inaccessible', e);
      return false;
    }
  });
  React.useEffect(() => {
    try {
      const root = window.document.documentElement;
      if (isDark) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (e) {
      console.error('Failed to update theme preference', e);
    }
  }, [isDark]);
  const toggleTheme = React.useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);
  return { isDark, toggleTheme };
}