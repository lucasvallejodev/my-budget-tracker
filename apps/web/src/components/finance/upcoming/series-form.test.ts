import { describe, expect, it } from 'vitest';

import { frequencyOptions, frequencyValue, parseFrequency } from './series-form';

describe('series form', () => {
  it('round-trips a frequency value', () => {
    expect(parseFrequency(frequencyValue('weekly', 2))).toEqual({ cadence: 'weekly', interval: 2 });
  });

  it('offers the common rhythms and keeps an unusual current one', () => {
    expect(frequencyOptions().map(option => option.label)).toEqual([
      'Weekly',
      'Every 2 weeks',
      'Monthly',
      'Every 2 months',
      'Every 3 months',
      'Every 6 months',
      'Yearly',
    ]);
    expect(frequencyOptions({ cadence: 'weekly', interval: 4 }).at(-1)).toEqual({
      label: 'Every 4 weeks',
      value: 'weekly:4',
    });
  });
});
