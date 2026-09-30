import { describe, expect, it } from 'vitest';

import { dayLabel } from '../transaction-labels';
import type { TransactionRow } from '../use-finance-data';
import { collapseTransfers, groupByDay } from './transaction-groups';

const row = (overrides: Partial<TransactionRow>): TransactionRow =>
  ({
    accountName: 'Everyday account',
    amountMinor: -1000,
    currency: 'EUR',
    date: '2026-09-28',
    id: 'row',
    kind: 'standard',
    transferId: null,
    ...overrides,
  }) as TransactionRow;

describe('transaction groups', () => {
  it('shows a transfer once when both legs are listed, keeping the outgoing leg', () => {
    const outgoing = row({
      amountMinor: -5000,
      id: 'out',
      kind: 'transfer',
      transferId: 't1',
    });

    const incoming = row({
      amountMinor: 5000,
      id: 'in',
      kind: 'transfer',
      transferId: 't1',
    });

    const single = row({
      amountMinor: 700,
      id: 'other',
      kind: 'transfer',
      transferId: 't2',
    });

    const listed = collapseTransfers([incoming, outgoing, single]);

    expect(listed.map(transaction => transaction.id)).toEqual(['out', 'other']);
    expect(listed[0].pairedWith?.id).toBe('in');
    expect(listed[1].pairedWith).toBeUndefined();
  });

  it('groups by day with per-currency totals that leave transfers out', () => {
    const days = groupByDay([
      row({ amountMinor: -1000, id: 'a' }),
      row({ amountMinor: -500, id: 'b' }),
      row({
        amountMinor: -9000,
        id: 'c',
        kind: 'transfer',
      }),
      row({
        amountMinor: -200,
        currency: 'USD',
        id: 'd',
      }),
      row({ date: '2026-09-27', id: 'e' }),
    ]);

    expect(days).toHaveLength(2);
    expect(days[0].totals).toEqual([
      { amountMinor: -1500, currency: 'EUR' },
      { amountMinor: -200, currency: 'USD' },
    ]);
  });

  it('labels days and adds the year outside the current one', () => {
    expect(dayLabel('2026-09-28', '2026')).toBe('Mon 28 Sep');
    expect(dayLabel('2025-12-31', '2026')).toBe('Wed 31 Dec 2025');
  });
});
