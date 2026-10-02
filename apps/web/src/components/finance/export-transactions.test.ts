import { describe, expect, it } from 'vitest';

import { transactionsToCsv } from './export-transactions';
import { SampleTransactions } from './sample-data';

describe('transactionsToCsv', () => {
  it('writes a header and one quoted line per transaction', () => {
    const lines = transactionsToCsv(SampleTransactions.slice(0, 2)).split('\r\n');

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(
      '"Date","Description","Payee","Category","Group","Account","Amount","Currency","Kind","Status","Memo","ID"'
    );
  });

  it('neutralizes spreadsheet formulas', () => {
    const [row] = SampleTransactions;
    const csv = transactionsToCsv([{ ...row, memo: '=SUM(A1)' }]);

    expect(csv).toContain(`"'=SUM(A1)"`);
  });

  it('keeps negative amounts numeric', () => {
    const [row] = SampleTransactions;

    const csv = transactionsToCsv([
      {
        ...row,
        amountMinor: -1250,
        currency: 'EUR',
      },
    ]);

    expect(csv).toContain('"-12.50","EUR"');
  });

  it('writes one line per split line with the line category and amount', () => {
    const [row] = SampleTransactions;

    const csv = transactionsToCsv([
      {
        ...row,
        amountMinor: -3000,
        currency: 'EUR',
        memo: 'Supermarket',
        splits: [
          {
            amountMinor: -2000,
            categoryIcon: null,
            categoryId: 'food',
            categoryName: 'Groceries',
            groupColor: null,
            id: 'line-1',
            memo: '',
          },
          {
            amountMinor: -1000,
            categoryIcon: null,
            categoryId: 'home',
            categoryName: 'Household',
            groupColor: null,
            id: 'line-2',
            memo: 'Bulbs',
          },
        ],
      },
    ]);

    const lines = csv.split('\r\n');

    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('"Groceries"');
    expect(lines[1]).toContain('"-20.00","EUR"');
    expect(lines[1]).toContain('"Supermarket"');
    expect(lines[2]).toContain('"Household"');
    expect(lines[2]).toContain('"Bulbs"');
  });
});
