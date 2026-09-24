import { renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { useHydrated } from './hydration';

function Probe() {
  return useHydrated() ? 'client' : 'server';
}

describe('useHydrated', () => {
  it('is false on the server and true in a client render', () => {
    expect(renderToString(<Probe />)).toBe('server');
    expect(renderHook(() => useHydrated()).result.current).toBe(true);
  });
});
