import { describe, expect, it } from 'vitest';

import type { TemplateRow } from '@coinkeeper/shared/schema/templates';

import { asksForAmount, chipOrder, templatePreset } from './template-preset';

const Base: TemplateRow = {
  accountId: 'checking',
  amountMinor: -250,
  categoryId: 'coffee',
  currency: 'EUR',
  deletedAt: null,
  direction: 'expense',
  id: 'coffee-template',
  kind: 'standard',
  lastUsedAt: null,
  memo: '',
  name: 'Coffee',
  payeeId: 'cafe',
  sortOrder: 2,
  transferAccountId: null,
  unavailableReason: null,
};

describe('chipOrder', () => {
  it('puts the most recently used templates first, then follows the manual order', () => {
    const rent = {
      ...Base,
      id: 'rent',
      name: 'Rent',
      sortOrder: 0,
    };

    const bus = {
      ...Base,
      id: 'bus',
      lastUsedAt: '2026-09-01T08:00:00Z',
      name: 'Bus',
      sortOrder: 3,
    };

    const lunch = {
      ...Base,
      id: 'lunch',
      lastUsedAt: '2026-09-02T08:00:00Z',
      name: 'Lunch',
    };

    expect(chipOrder([rent, Base, bus, lunch]).map(template => template.name)).toEqual([
      'Lunch',
      'Bus',
      'Rent',
      'Coffee',
    ]);
  });
});

describe('templatePreset', () => {
  it('fills a standard form with the magnitude in the account currency', () => {
    expect(templatePreset(Base)).toMatchObject({
      accountId: 'checking',
      amount: '2.50',
      categoryId: 'coffee',
      mode: 'expense',
      payeeId: 'cafe',
      templateId: 'coffee-template',
    });
  });

  it('fills a transfer form from the two accounts', () => {
    const transfer = {
      ...Base,
      amountMinor: 20000,
      categoryId: null,
      kind: 'transfer' as const,
      payeeId: null,
      transferAccountId: 'savings',
    };

    expect(templatePreset(transfer)).toMatchObject({
      amountFrom: '200.00',
      fromAccountId: 'checking',
      mode: 'transfer',
      toAccountId: 'savings',
    });
  });

  it('leaves the amount empty when the template asks each time', () => {
    const groceries = { ...Base, amountMinor: null };

    expect(templatePreset(groceries)).toMatchObject({ amount: '' });
    expect(asksForAmount(groceries)).toBe(true);
    expect(asksForAmount(Base)).toBe(false);
  });
});
