import { describe, expect, it } from 'vitest';

import { cadenceLabel, occurrencePreset } from './recurring-labels';

describe('recurring labels', () => {
  it('names cadences in words', () => {
    expect(cadenceLabel('monthly', 1)).toBe('Monthly');
    expect(cadenceLabel('weekly', 2)).toBe('Every 2 weeks');
    expect(cadenceLabel('monthly', 3)).toBe('Every 3 months');
  });

  it('prefills a transaction for an occurrence and links it to the series', () => {
    expect(
      occurrencePreset({
        accountId: 'checking',
        amountMinor: -1299,
        categoryId: null,
        currency: 'EUR',
        dueOn: '2026-10-15',
        kind: 'subscription',
        name: 'Streaming',
        paidAmountMinor: null,
        payeeId: 'stream',
        seriesId: 'series-1',
        status: 'due',
        transactionId: null,
      })
    ).toEqual({
      accountId: 'checking',
      amount: '12.99',
      categoryId: '',
      date: '2026-10-15',
      memo: 'Streaming',
      mode: 'expense',
      payeeId: 'stream',
      recurring: { dueOn: '2026-10-15', seriesId: 'series-1' },
    });
  });
});
