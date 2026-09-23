import { describe, expect, it } from 'vitest';

import { cn } from './styles';

describe('cn', () => {
  it('joins truthy class names', () => {
    const isDanger = (tone: string) => tone === 'danger';

    expect(cn('badge', isDanger('danger') && 'badge--danger')).toBe('badge badge--danger');
    expect(cn('badge', isDanger('success') && 'badge--danger')).toBe('badge');
  });

  it('adds object keys whose condition is true', () => {
    expect(cn('badge', { 'badge--danger': false })).toBe('badge');
    expect(cn('badge', { 'badge--danger': true })).toBe('badge badge--danger');
  });
});
