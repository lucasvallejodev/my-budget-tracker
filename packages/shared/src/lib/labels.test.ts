import { describe, expect, it } from 'vitest';

import { humanizeIdentifier, paletteColorName } from './labels';

describe('humanizeIdentifier', () => {
  it('splits camel case and trailing digits into sentence-case words', () => {
    expect(humanizeIdentifier('ShoppingCart')).toBe('Shopping cart');
    expect(humanizeIdentifier('slateLight')).toBe('Slate light');
    expect(humanizeIdentifier('Building2')).toBe('Building 2');
    expect(humanizeIdentifier('Car')).toBe('Car');
    expect(humanizeIdentifier('')).toBe('');
  });
});

describe('paletteColorName', () => {
  it('names palette colours and leaves custom ones as hex', () => {
    expect(paletteColorName('#d97706')).toBe('Amber');
    expect(paletteColorName('#64748B')).toBe('Slate light');
    expect(paletteColorName('#123456')).toBe('#123456');
  });
});
