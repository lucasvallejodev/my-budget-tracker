import { describe, expect, it } from 'vitest';

import { isEmoji } from './patterns';

describe('isEmoji', () => {
  it('accepts a single pictograph, with or without a variation selector', () => {
    expect(isEmoji('🍕')).toBe(true);
    expect(isEmoji('☕')).toBe(true);
    expect(isEmoji('❤️')).toBe(true);
  });

  it('accepts skin tones and zero-width-joiner sequences', () => {
    expect(isEmoji('👍🏽')).toBe(true);
    expect(isEmoji('👩🏽‍💻')).toBe(true);
    expect(isEmoji('👨‍👩‍👧‍👦')).toBe(true);
    expect(isEmoji('🏳️‍🌈')).toBe(true);
    expect(isEmoji('❤️‍🔥')).toBe(true);
  });

  it('accepts country and subdivision flags', () => {
    expect(isEmoji('🇪🇸')).toBe(true);
    expect(isEmoji('🏴󠁧󠁢󠁳󠁣󠁴󠁿')).toBe(true);
  });

  it('rejects text, digits, several emoji and surrounding whitespace', () => {
    expect(isEmoji('')).toBe(false);
    expect(isEmoji('a')).toBe(false);
    expect(isEmoji('1')).toBe(false);
    expect(isEmoji('#')).toBe(false);
    expect(isEmoji('ShoppingCart')).toBe(false);
    expect(isEmoji('🍕🍔')).toBe(false);
    expect(isEmoji(' 🍕')).toBe(false);
    expect(isEmoji('🍕 ')).toBe(false);
    expect(isEmoji(String.fromCodePoint(0x200d))).toBe(false);
  });
});
