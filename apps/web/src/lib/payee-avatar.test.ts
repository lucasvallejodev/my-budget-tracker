import { describe, expect, it } from 'vitest';

import { brandFor, brandForeground, initialsOf, monogramTint, payeeKey } from './payee-avatar';

describe('payee avatar helpers', () => {
  it('normalizes payee names', () => {
    expect(payeeKey('Uber *Eats')).toBe('ubereats');
    expect(payeeKey('  ')).toBe('');
  });

  it('matches bundled brands by prefix, longest brand first', () => {
    expect(brandFor('Spotify AB')?.title).toBe('Spotify');
    expect(brandFor('NETFLIX.COM')?.title).toBe('Netflix');
    expect(brandFor('Uber Eats')?.title).toBe('Uber Eats');
    expect(brandFor('Corner Café')).toBeUndefined();
    expect(brandFor('***')).toBeUndefined();
  });

  it('builds two-letter monograms', () => {
    expect(initialsOf('Corner Café')).toBe('CC');
    expect(initialsOf('greenleaf')).toBe('GR');
    expect(initialsOf('Oak Wood Lettings')).toBe('OW');
    expect(initialsOf('SQ *FARMERS STALL')).toBe('SF');
    expect(initialsOf('')).toBe('?');
  });

  it('gives the same payee the same tint from the theme', () => {
    expect(monogramTint('Corner Café')).toBe(monogramTint('CORNER CAFÉ!'));
    expect(monogramTint('Corner Café')).toMatch(/^var\(--color-avatar-[1-8]\)$/);
    expect(monogramTint('')).toBe('var(--color-avatar-1)');
  });

  it('keeps glyphs readable on dark and light brand colours', () => {
    expect(brandForeground('E50914')).toBe('var(--color-on-brand)');
    expect(brandForeground('FFE01B')).toBe('var(--color-text)');
  });
});
