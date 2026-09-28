import { describe, expect, it } from 'vitest';

import { safeNextPath } from './navigation';

describe('safeNextPath', () => {
  it('keeps same-origin paths with their query and hash', () => {
    expect(safeNextPath('/budgets?month=2026-09')).toBe('/budgets?month=2026-09');
    expect(safeNextPath('/transactions#recent')).toBe('/transactions#recent');
    expect(safeNextPath('/')).toBe('/');
  });

  it.each([
    '//evil.example',
    '/\\evil.example',
    '/\\/evil.example',
    '\\\\evil.example',
    'https://evil.example',
    'javascript:alert(1)',
    'budgets',
    '',
  ])('falls back to the home path for %s', next => {
    expect(safeNextPath(next)).toBe('/');
  });

  it('falls back to the home path when next is missing', () => {
    expect(safeNextPath(undefined)).toBe('/');
  });

  it('normalizes dot segments instead of leaving the app', () => {
    expect(safeNextPath('/../../evil.example')).toBe('/evil.example');
  });
});
