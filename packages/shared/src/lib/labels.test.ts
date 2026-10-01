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
    expect(paletteColorName('#9a7442')).toBe('Amber');
    expect(paletteColorName('#6B7585')).toBe('Slate light');
    expect(paletteColorName('#123456')).toBe('#123456');
  });
});
