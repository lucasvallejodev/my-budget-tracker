import { describe, expect, it } from 'vitest';

import { splitRemainder } from './split-remainder';

describe('splitRemainder', () => {
  it('returns what is left to assign in minor units', () => {
    expect(splitRemainder('30', ['20', '5'], 'EUR')).toBe(500);
    expect(splitRemainder('30,00', ['20', '10'], 'EUR')).toBe(0);
    expect(splitRemainder('1500', ['1200'], 'JPY')).toBe(300);
  });

  it('treats empty lines as zero and reports over-assignment as negative', () => {
    expect(splitRemainder('10', ['', '12'], 'EUR')).toBe(-200);
  });

  it('gives up on text that is not an amount', () => {
    expect(splitRemainder('ten', ['5'], 'EUR')).toBeNull();
    expect(splitRemainder('10', ['5', 'abc'], 'EUR')).toBeNull();
  });
});
