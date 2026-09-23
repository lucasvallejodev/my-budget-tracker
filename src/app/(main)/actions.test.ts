import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ServiceError } from '@/server/db';

const services = {
  accounts: {
    create: vi.fn(async (_userId: string, input: unknown) => ({ id: 'a1', ...(input as object) })),
    owned: vi.fn(async () => ({ currency: 'EUR', id: 'a1' })),
  },
  budgets: {
    remove: vi.fn(async () => {}),
    upsert: vi.fn(async () => ({ id: 'b1' })),
  },
  fx: {
    upsert: vi.fn(async () => ({})),
  },
  ledger: {
    createStandard: vi.fn(async () => ({ id: 't1' })),
  },
  rules: {
    create: vi.fn(async () => ({ id: 'r1' })),
  },
};

vi.mock('@/server/auth/require-user', () => ({
  requireUser: vi.fn(async () => ({ services, userId: 'u1' })),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const actions = await import('./actions');
const { revalidatePath } = await import('next/cache');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('server actions', () => {
  it('parses the account form, converts the opening balance and refreshes', async () => {
    await actions.createAccountAction({
      currency: 'EUR',
      name: '  Main checking ',
      openingBalance: '1.250,50',
      type: 'checking',
    });
    expect(services.accounts.create).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        currency: 'EUR',
        name: 'Main checking',
        openingBalanceMinor: 125050,
        type: 'checking',
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('rejects invalid input with a plain Error carrying the schema message', async () => {
    const attempt = actions.createAccountAction({
      currency: 'EUR',
      name: '',
      type: 'checking',
    });

    await expect(attempt).rejects.toThrow('Name is required');
    await expect(attempt).rejects.not.toBeInstanceOf(ServiceError);
    expect(services.accounts.create).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('signs standard transactions by direction and refuses a zero amount', async () => {
    const form = {
      accountId: 'a1',
      amount: '12.30',
      categoryId: '',
      date: '2026-09-01',
      direction: 'expense' as const,
      excluded: false,
      memo: '',
      payeeId: '',
      status: 'cleared' as const,
    };

    await actions.createTransactionAction(form);
    expect(services.accounts.owned).toHaveBeenCalledWith('u1', 'a1');
    expect(services.ledger.createStandard).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        accountId: 'a1',
        amountMinor: -1230,
        categoryId: null,
        payeeId: null,
      })
    );
    await expect(actions.createTransactionAction({ ...form, amount: '0' })).rejects.toThrow(
      'Amount must not be zero'
    );
  });

  it('validates budgets and exchange rates before calling the services', async () => {
    await expect(
      actions.upsertBudgetAction({
        amount: '10',
        categoryId: 'c1',
        currency: 'EUR',
        month: '2026/09',
      })
    ).rejects.toThrow('Month must be YYYY-MM');
    await actions.upsertBudgetAction({
      amount: '-40',
      categoryId: 'c1',
      currency: 'EUR',
      month: '2026-09',
    });
    expect(services.budgets.upsert).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        amountMinor: 4000,
        categoryId: 'c1',
        month: '2026-09',
      })
    );
    await expect(
      actions.upsertExchangeRateAction({
        base: 'USD',
        date: '2026-09-01',
        quote: 'EUR',
        rate: 'abc',
      })
    ).rejects.toThrow('The rate must be a positive number');
    await actions.upsertExchangeRateAction({
      base: 'USD',
      date: '2026-09-01',
      quote: 'EUR',
      rate: '0,92',
    });
    expect(services.fx.upsert).toHaveBeenCalledWith('u1', expect.objectContaining({ rate: 0.92 }));
  });

  it('creates rules without refreshing and deletes budgets with a refresh', async () => {
    await expect(actions.createRuleAction({ categoryId: 'c1', pattern: '  ' })).rejects.toThrow(
      'Pattern is required'
    );
    await actions.createRuleAction({ categoryId: 'c1', pattern: ' MERCADONA ' });
    expect(services.rules.create).toHaveBeenCalledWith('u1', {
      categoryId: 'c1',
      pattern: 'MERCADONA',
    });
    expect(revalidatePath).not.toHaveBeenCalled();
    await actions.deleteBudgetAction('b1');
    expect(services.budgets.remove).toHaveBeenCalledWith('u1', 'b1');
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
});
