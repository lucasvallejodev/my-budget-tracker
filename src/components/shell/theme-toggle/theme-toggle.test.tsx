import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeToggle } from './theme-toggle';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('ThemeToggle', () => {
  it('switches to the dark theme and back', () => {
    vi.stubGlobal('matchMedia', () => ({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
    }));
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole('button', { name: 'Use dark theme' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    fireEvent.click(screen.getByRole('button', { name: 'Use light theme' }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
