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

  it('neutralises spreadsheet formulas', () => {
    const [row] = SampleTransactions;
    const csv = transactionsToCsv([{ ...row, memo: '=SUM(A1)' }]);

    expect(csv).toContain(`"'=SUM(A1)"`);
  });
});
