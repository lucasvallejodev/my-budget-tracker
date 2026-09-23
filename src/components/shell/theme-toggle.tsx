'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../primitives/button';

export function applyTheme(theme: string) {
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  localStorage.setItem('coinkeeper-theme', theme);
  window.dispatchEvent(new Event('coinkeeper-theme'));
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const update = () => setDark(document.documentElement.dataset.theme === 'dark');

    applyTheme(localStorage.getItem('coinkeeper-theme') || 'light');
    update();
    window.addEventListener('coinkeeper-theme', update);
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const system = () => {
      if (localStorage.getItem('coinkeeper-theme') === 'system') applyTheme('system');
    };

    media.addEventListener('change', system);

    return () => {
      window.removeEventListener('coinkeeper-theme', update);
      media.removeEventListener('change', system);
    };
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dark ? 'Use light theme' : 'Use dark theme'}
      onClick={() => applyTheme(dark ? 'light' : 'dark')}
    >
      {dark ? <Moon /> : <Sun />}
    </Button>
  );
}
