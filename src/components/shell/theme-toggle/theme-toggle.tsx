'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui';
import {
  applyTheme,
  DarkSchemeQuery,
  storedTheme,
  ThemeChangeEvent,
  ThemeStorageKey,
} from '@/lib/appearance';

const SystemTheme = 'system';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const update = () => setDark(document.documentElement.dataset.theme === 'dark');

    applyTheme(storedTheme());
    update();
    window.addEventListener(ThemeChangeEvent, update);
    const media = window.matchMedia(DarkSchemeQuery);

    const system = () => {
      if (localStorage.getItem(ThemeStorageKey) === SystemTheme) applyTheme(SystemTheme);
    };

    media.addEventListener('change', system);

    return () => {
      window.removeEventListener(ThemeChangeEvent, update);
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
