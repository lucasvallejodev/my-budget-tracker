import { describe, expect, it } from 'vitest';

import { detectSeries, type HistoryRow } from './detection';

const TODAY = '2026-09-20';

const row = (payeeName: string, date: string, amountMinor: number): HistoryRow => ({
  accountId: 'checking',
  amountMinor,
  categoryId: null,
  currency: 'EUR',
  date,
  payeeId: payeeName.toLowerCase(),
  payeeName,
});

const monthly = (payee: string, amounts: number[]) =>
  amounts.map((amount, index) => row(payee, `2026-0${index + 4}-08`, amount));

const weekly = (payee: string, amounts: number[]) =>
  amounts.map((amount, index) => {
    const date = new Date(Date.UTC(2026, 6, 3 + index * 7)).toISOString().slice(0, 10);

    return row(payee, date, amount);
  });

describe('detectSeries', () => {
  it('suggests fixed subscriptions and monthly bills whose amount varies', () => {
    const found = detectSeries(
      [
        ...monthly('StreamCo', [-999, -999, -999, -999, -999, -999]),
        ...monthly('Energy', [-4000, -6500, -8000, -5200, -4500, -7000]),
      ],
      TODAY
    );

    expect(found.map(item => [item.payeeName, item.kind, item.cadence])).toEqual([
      ['Energy', 'bill', 'monthly'],
      ['StreamCo', 'subscription', 'monthly'],
    ]);
  });

  it('keeps a weekly payment only when its amount is steady', () => {
    const found = detectSeries(
      [
        ...weekly(
          'Cleaner',
          [-4500, -4500, -4500, -4500, -4500, -4500, -4500, -4500, -4500, -4500, -4500]
        ),
        ...weekly(
          'Corner Café',
          [-250, -420, -310, -450, -280, -390, -260, -440, -300, -350, -400]
        ),
      ],
      TODAY
    );

    expect(found.map(item => item.payeeName)).toEqual(['Cleaner']);
  });

  it('ignores irregular purchases and payments that stopped', () => {
    const irregular = [
      row('Books', '2026-05-02', -1200),
      row('Books', '2026-05-30', -3500),
      row('Books', '2026-08-15', -2000),
      row('Books', '2026-09-01', -1800),
    ];

    const stopped = monthly('OldGym', [-3500, -3500, -3500]);

    expect(detectSeries([...irregular, ...stopped], TODAY)).toEqual([]);
  });
});
