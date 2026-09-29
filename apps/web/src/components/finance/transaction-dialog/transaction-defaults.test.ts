// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RememberedFields, rememberValue } from '@/lib/form-memory';

import type { TransactionRow } from '../use-finance-data';
import {
  duplicatePreset,
  knownAccountId,
  rememberedStandardPreset,
  rememberedTransferPreset,
} from './transaction-defaults';

vi.useFakeTimers({ now: new Date(2026, 8, 29, 12), toFake: ['Date'] });

afterEach(() => localStorage.clear());

const expense = {
  accountId: 'acc-card',
  amountMinor: -1250,
  categoryId: 'cat-food',
  currency: 'EUR',
  date: '2026-09-02',
  excluded: false,
  kind: 'standard',
  memo: 'Lunch',
  payeeId: 'payee-cafe',
  status: 'pending',
} as TransactionRow;

const transferOut = {
  accountId: 'acc-everyday',
  amountMinor: -50000,
  counterpartAccountId: 'acc-savings',
  currency: 'EUR',
  date: '2026-09-01',
  kind: 'transfer',
  memo: 'Monthly savings',
  status: 'reconciled',
} as TransactionRow;

describe('transaction defaults', () => {
  it('duplicates an expense as a new cleared transaction dated today', () => {
    expect(duplicatePreset(expense)).toEqual({
      accountId: 'acc-card',
      amount: '12.50',
      categoryId: 'cat-food',
      date: '2026-09-29',
      direction: 'expense',
      excluded: false,
      memo: 'Lunch',
      mode: 'expense',
      payeeId: 'payee-cafe',
      status: 'cleared',
    });
  });

  it('duplicates a transfer with both accounts', () => {
    expect(duplicatePreset(transferOut)).toMatchObject({
      amountFrom: '500.00',
      date: '2026-09-29',
      fromAccountId: 'acc-everyday',
      mode: 'transfer',
      status: 'cleared',
      toAccountId: 'acc-savings',
    });
  });

  it('keeps only remembered accounts that still exist', () => {
    const accounts = [{ id: 'acc-card' }, { id: 'acc-savings' }];

    rememberValue(RememberedFields.standardAccount, 'acc-card');
    rememberValue(RememberedFields.transferFrom, 'acc-closed');
    rememberValue(RememberedFields.transferTo, 'acc-savings');

    expect(knownAccountId('acc-closed', accounts)).toBe('');
    expect(rememberedStandardPreset(accounts)).toEqual({ accountId: 'acc-card' });
    expect(rememberedTransferPreset(accounts)).toEqual({
      fromAccountId: '',
      toAccountId: 'acc-savings',
    });
    expect(rememberedStandardPreset()).toEqual({ accountId: '' });
  });
});
