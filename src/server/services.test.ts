// @vitest-environment node
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { createServices } from './services';
import { Db } from './db';
import { DEFAULT_TAXONOMY } from './categories/default-taxonomy';
import { ICON_NAMES } from '@/components/icons/registry';

const client = new PGlite();
const pglite = drizzle(client, { schema });
const db = pglite as unknown as Db;
const services = createServices(db);
const owner = 'user_owner';
const other = 'user_other';

async function categoryByName(userId: string, name: string) {
  const tree = await services.categories.tree(userId);
  for (const group of tree) {
    const category = group.categories.find(c => c.name === name);
    if (category) return { ...category, group };
  }
  throw new Error(`Category ${name} not seeded`);
}

beforeAll(async () => {
  await migrate(pglite, { migrationsFolder: './drizzle' });
}, 30000);
afterAll(async () => {
  await client.close();
});
beforeEach(async () => {
  await client.exec(
    'TRUNCATE transactions, budgets, rules, payees, categories, category_groups, accounts, exchange_rates, user_settings CASCADE'
  );
  await services.bootstrap(owner);
  await services.bootstrap(other, 'USD');
});

describe('bootstrap and categories', () => {
  it('seeds the default taxonomy once per user with valid icons', async () => {
    const tree = await services.categories.tree(owner);
    expect(tree).toHaveLength(DEFAULT_TAXONOMY.length);
    expect(tree.flatMap(g => g.categories)).toHaveLength(
      DEFAULT_TAXONOMY.flatMap(g => g.categories).length
    );
    for (const category of tree.flatMap(g => g.categories))
      expect(ICON_NAMES).toContain(category.icon);
    expect(tree[0]).toMatchObject({ name: 'Income', kind: 'income', isSystem: true });
    const again = await services.bootstrap(owner);
    expect(again.seeded).toBe(false);
    expect(await services.categories.tree(owner)).toHaveLength(DEFAULT_TAXONOMY.length);
    expect((await services.getSettings(other))?.primaryCurrency).toBe('USD');
  });

  it('archives a category by moving or by flagging its transactions for review', async () => {
    const account = await services.accounts.create(owner, {
      name: 'Checking',
      type: 'checking',
      currency: 'EUR',
    });
    const groceries = await categoryByName(owner, 'Groceries');
    const coffee = await categoryByName(owner, 'Coffee');
    const tx = await services.ledger.createStandard(owner, {
      accountId: account.id,
      amountMinor: -1200,
      date: '2026-09-03',
      categoryId: coffee.id,
    });
    await services.categories.archiveCategory(owner, coffee.id, groceries.id);
    expect((await services.ledger.get(owner, tx.id)).categoryId).toBe(groceries.id);
    await services.categories.archiveCategory(owner, groceries.id);
    const reopened = await services.ledger.get(owner, tx.id);
    expect(reopened.categoryId).toBeNull();
    expect(reopened.needsReview).toBe(true);
    expect(await services.ledger.needsReviewCount(owner)).toBe(1);
    await expect(services.categories.archiveGroup(owner, coffee.group.id)).rejects.toThrow(
      /Move or archive/
    );
    await expect(
      services.categories.archiveGroup(owner, (await services.categories.tree(owner))[0].id)
    ).rejects.toThrow(/System/);
  });

  it('creates, updates, reorders and restores groups and categories', async () => {
    const group = await services.categories.createGroup(owner, {
      name: 'Kids',
      kind: 'expense',
      color: '#D97706',
    });
    expect(group.sortOrder).toBe(DEFAULT_TAXONOMY.length);
    const category = await services.categories.createCategory(owner, {
      groupId: group.id,
      name: 'Toys',
      icon: 'Gift',
    });
    const second = await services.categories.createCategory(owner, {
      groupId: group.id,
      name: 'School',
      icon: 'GraduationCap',
    });
    await services.categories.reorderCategories(owner, group.id, [second.id, category.id]);
    await services.categories.updateGroup(owner, group.id, { name: 'Children', color: '#0891B2' });
    await services.categories.updateCategory(owner, category.id, {
      name: 'Toys & games',
      icon: 'Gamepad2',
    });
    const tree = await services.categories.tree(owner);
    const children = tree.find(g => g.id === group.id)!;
    expect(children).toMatchObject({ name: 'Children', color: '#0891B2' });
    expect(children.categories.map(c => c.name)).toEqual(['School', 'Toys & games']);
    const ids = tree.map(g => g.id);
    await services.categories.reorderGroups(owner, [
      group.id,
      ...ids.filter(id => id !== group.id),
    ]);
    expect((await services.categories.tree(owner))[0].id).toBe(group.id);
    await services.categories.archiveCategory(owner, second.id);
    expect(
      (await services.categories.tree(owner)).find(g => g.id === group.id)!.categories
    ).toHaveLength(1);
    await services.categories.restoreCategory(owner, second.id);
    expect(
      (await services.categories.tree(owner)).find(g => g.id === group.id)!.categories
    ).toHaveLength(2);
    const income = tree.find(g => g.isSystem)!;
    await expect(
      services.categories.updateGroup(owner, income.id, { kind: 'expense' })
    ).rejects.toThrow(/income group/);
    await expect(
      services.categories.createCategory(other, { groupId: group.id, name: 'x', icon: 'Gift' })
    ).rejects.toThrow('not found');
  });

  it('scopes categories to their owner', async () => {
    const groceries = await categoryByName(owner, 'Groceries');
    await expect(
      services.categories.updateCategory(other, groceries.id, { name: 'x' })
    ).rejects.toThrow('not found');
  });
});

describe('accounts and ledger', () => {
  it('derives balances from the ledger, including the opening balance', async () => {
    const account = await services.accounts.create(owner, {
      name: 'Checking',
      type: 'checking',
      currency: 'EUR',
      openingBalanceMinor: 150000,
      openingDate: '2026-01-01',
    });
    const salary = await categoryByName(owner, 'Salary');
    await services.ledger.createStandard(owner, {
      accountId: account.id,
      amountMinor: 250000,
      date: '2026-09-01',
      categoryId: salary.id,
    });
    const spend = await services.ledger.createStandard(owner, {
      accountId: account.id,
      amountMinor: -2550,
      date: '2026-09-02',
    });
    const [summary] = await services.accounts.list(owner);
    expect(summary.balanceMinor).toBe(150000 + 250000 - 2550);
    expect(summary.transactionCount).toBe(3);
    expect(spend.needsReview).toBe(true);
    await services.ledger.updateStandard(owner, spend.id, { amountMinor: -3000 });
    await services.ledger.remove(owner, spend.id);
    expect((await services.accounts.get(owner, account.id)).balanceMinor).toBe(400000);
    expect(await services.ledger.list(owner)).toHaveLength(2);
    await expect(services.ledger.remove(owner, spend.id)).rejects.toThrow('not found');
    expect(await services.accounts.list(other)).toEqual([]);
  });

  it('rejects foreign accounts, categories and payees and unknown currencies', async () => {
    const account = await services.accounts.create(owner, {
      name: 'Checking',
      type: 'checking',
      currency: 'EUR',
    });
    const foreignCategory = await categoryByName(other, 'Groceries');
    await expect(
      services.ledger.createStandard(owner, {
        accountId: account.id,
        amountMinor: -100,
        date: '2026-09-02',
        categoryId: foreignCategory.id,
      })
    ).rejects.toThrow('Category not found');
    await expect(
      services.ledger.createStandard(other, {
        accountId: account.id,
        amountMinor: -100,
        date: '2026-09-02',
      })
    ).rejects.toThrow('Account not found');
    await expect(
      services.accounts.create(owner, { name: 'X', type: 'cash', currency: 'XXX' })
    ).rejects.toThrow('Unknown currency');
    expect(await services.ledger.list(owner)).toEqual([]);
  });

  it('locks the currency once an account has transactions', async () => {
    const account = await services.accounts.create(owner, {
      name: 'Wallet',
      type: 'cash',
      currency: 'EUR',
    });
    await services.accounts.update(owner, account.id, { currency: 'USD' });
    expect((await services.accounts.get(owner, account.id)).currency).toBe('USD');
    await services.ledger.createStandard(owner, {
      accountId: account.id,
      amountMinor: -100,
      date: '2026-09-02',
    });
    await expect(services.accounts.update(owner, account.id, { currency: 'EUR' })).rejects.toThrow(
      /cannot change/
    );
    await expect(services.accounts.remove(owner, account.id)).rejects.toThrow(/Archive/);
    await services.accounts.archive(owner, account.id);
    await expect(
      services.ledger.createStandard(owner, {
        accountId: account.id,
        amountMinor: -100,
        date: '2026-09-02',
      })
    ).rejects.toThrow('archived');
  });

  it('records a credit-card payment as a paired transfer that never counts as spending', async () => {
    const checking = await services.accounts.create(owner, {
      name: 'Checking',
      type: 'checking',
      currency: 'EUR',
      openingBalanceMinor: 150000,
      openingDate: '2026-08-01',
    });
    const visa = await services.accounts.create(owner, {
      name: 'Visa',
      type: 'credit_card',
      currency: 'EUR',
    });
    const groceries = await categoryByName(owner, 'Groceries');
    const restaurants = await categoryByName(owner, 'Restaurants & bars');
    await services.ledger.createStandard(owner, {
      accountId: visa.id,
      amountMinor: -6000,
      date: '2026-09-03',
      categoryId: groceries.id,
    });
    await services.ledger.createStandard(owner, {
      accountId: visa.id,
      amountMinor: -4500,
      date: '2026-09-10',
      categoryId: restaurants.id,
    });
    const { legs, transferId } = await services.ledger.createTransfer(owner, {
      fromAccountId: checking.id,
      toAccountId: visa.id,
      amountFromMinor: 10500,
      date: '2026-09-25',
      memo: 'Card payment',
    });
    expect(legs.map(l => Number(l.amountMinor)).sort()).toEqual([-10500, 10500]);
    expect(legs.every(l => l.categoryId === null && l.kind === 'transfer')).toBe(true);
    const accounts = await services.accounts.list(owner);
    expect(accounts.find(a => a.id === checking.id)?.balanceMinor).toBe(139500);
    expect(accounts.find(a => a.id === visa.id)?.balanceMinor).toBe(0);
    const [totals] = await services.reports.monthlyTotals(owner, '2026-09');
    expect(totals).toEqual({ currency: 'EUR', incomeMinor: 0, spendingMinor: 10500 });
    const breakdown = await services.reports.breakdownByGroup(owner, '2026-09');
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0]).toMatchObject({ groupName: 'Food & Dining', spentMinor: 10500 });
    const [netWorth] = await services.reports.netWorth(owner);
    expect(netWorth).toEqual({
      currency: 'EUR',
      assetsMinor: 139500,
      liabilitiesMinor: 0,
      netMinor: 139500,
    });
    const rows = await services.ledger.list(owner, { kind: 'transfer' });
    expect(rows.map(r => r.counterpartAccountName).sort()).toEqual(['Checking', 'Visa']);
    // editing and deleting act on both legs
    await services.ledger.updateTransfer(owner, transferId, {
      amountFromMinor: 10000,
      memo: 'Partial',
    });
    const updated = await services.ledger.list(owner, { kind: 'transfer' });
    expect(updated.map(r => r.amountMinor).sort((a, b) => a - b)).toEqual([-10000, 10000]);
    expect(updated.every(r => r.memo === 'Partial')).toBe(true);
    await expect(
      services.ledger.updateStandard(owner, updated[0].id, { memo: 'x' })
    ).rejects.toThrow(/transfer editor/);
    await services.ledger.remove(owner, updated[0].id);
    expect(await services.ledger.list(owner, { kind: 'transfer' })).toEqual([]);
    expect((await services.accounts.get(owner, visa.id)).balanceMinor).toBe(-10500);
  });

  it('keeps both legs of a cross-currency transfer in their own currency', async () => {
    const eur = await services.accounts.create(owner, {
      name: 'EUR',
      type: 'checking',
      currency: 'EUR',
      openingBalanceMinor: 200000,
    });
    const usd = await services.accounts.create(owner, {
      name: 'USD',
      type: 'savings',
      currency: 'USD',
    });
    await expect(
      services.ledger.createTransfer(owner, {
        fromAccountId: eur.id,
        toAccountId: usd.id,
        amountFromMinor: 100000,
        date: '2026-09-05',
      })
    ).rejects.toThrow(/amount received in USD/);
    await services.ledger.createTransfer(owner, {
      fromAccountId: eur.id,
      toAccountId: usd.id,
      amountFromMinor: 100000,
      amountToMinor: 108500,
      date: '2026-09-05',
    });
    const netWorth = await services.reports.netWorth(owner);
    expect(netWorth).toEqual([
      { currency: 'EUR', assetsMinor: 100000, liabilitiesMinor: 0, netMinor: 100000 },
      { currency: 'USD', assetsMinor: 108500, liabilitiesMinor: 0, netMinor: 108500 },
    ]);
    expect(await services.reports.monthlyTotals(owner, '2026-09')).toEqual([]);
  });

  it('reports income and spending per currency and treats refunds as negative spending', async () => {
    const eur = await services.accounts.create(owner, {
      name: 'EUR',
      type: 'checking',
      currency: 'EUR',
    });
    const usd = await services.accounts.create(owner, {
      name: 'USD',
      type: 'checking',
      currency: 'USD',
    });
    const investing = await services.accounts.create(owner, {
      name: 'Broker',
      type: 'investment',
      currency: 'EUR',
    });
    const salary = await categoryByName(owner, 'Salary');
    const groceries = await categoryByName(owner, 'Groceries');
    await services.ledger.createStandard(owner, {
      accountId: eur.id,
      amountMinor: 300000,
      date: '2026-09-01',
      categoryId: salary.id,
    });
    await services.ledger.createStandard(owner, {
      accountId: eur.id,
      amountMinor: -6000,
      date: '2026-09-02',
      categoryId: groceries.id,
    });
    await services.ledger.createStandard(owner, {
      accountId: eur.id,
      amountMinor: 1200,
      date: '2026-09-03',
      categoryId: groceries.id,
    }); // refund
    await services.ledger.createStandard(owner, {
      accountId: eur.id,
      amountMinor: -500,
      date: '2026-09-04',
      excluded: true,
    });
    await services.ledger.createStandard(owner, {
      accountId: investing.id,
      amountMinor: -99900,
      date: '2026-09-04',
    });
    await services.ledger.createStandard(owner, {
      accountId: usd.id,
      amountMinor: -2000,
      date: '2026-09-04',
    });
    await services.ledger.createStandard(owner, {
      accountId: usd.id,
      amountMinor: -100,
      date: '2026-10-01',
    });
    expect(await services.reports.monthlyTotals(owner, '2026-09')).toEqual([
      { currency: 'EUR', incomeMinor: 300000, spendingMinor: 4800 },
      { currency: 'USD', incomeMinor: 0, spendingMinor: 2000 },
    ]);
    const breakdown = await services.reports.breakdownByGroup(owner, '2026-09');
    expect(breakdown.find(b => b.currency === 'USD')).toMatchObject({
      groupName: 'Uncategorized',
      spentMinor: 2000,
    });
    const flow = await services.reports.cashFlow(owner, '2026-10', 3);
    expect(flow.map(p => `${p.month}:${p.currency}:${p.spendingMinor}`)).toEqual([
      '2026-09:EUR:4800',
      '2026-09:USD:2000',
      '2026-10:USD:100',
    ]);
  });

  it('learns a payee default category from recent transactions', async () => {
    const account = await services.accounts.create(owner, {
      name: 'Checking',
      type: 'checking',
      currency: 'EUR',
    });
    const payee = await services.payees.create(owner, { name: 'Mercadona' });
    const groceries = await categoryByName(owner, 'Groceries');
    const coffee = await categoryByName(owner, 'Coffee');
    await services.ledger.createStandard(owner, {
      accountId: account.id,
      amountMinor: -100,
      date: '2026-09-01',
      payeeId: payee.id,
      categoryId: groceries.id,
    });
    expect((await services.payees.list(owner))[0].defaultCategoryId).toBe(groceries.id);
    await services.ledger.createStandard(owner, {
      accountId: account.id,
      amountMinor: -100,
      date: '2026-09-02',
      payeeId: payee.id,
      categoryId: coffee.id,
    });
    expect((await services.payees.list(owner))[0].defaultCategoryId).toBe(groceries.id);
    await services.ledger.createStandard(owner, {
      accountId: account.id,
      amountMinor: -100,
      date: '2026-09-03',
      payeeId: payee.id,
      categoryId: coffee.id,
    });
    expect((await services.payees.list(owner))[0].defaultCategoryId).toBe(coffee.id);
    await expect(services.payees.create(owner, { name: 'Mercadona' })).rejects.toThrow();
  });

  it('rolls back a transfer when the second leg fails', async () => {
    const checking = await services.accounts.create(owner, {
      name: 'Checking',
      type: 'checking',
      currency: 'EUR',
    });
    const [foreign] = await db
      .insert(schema.accounts)
      .values({
        userId: other,
        name: 'Theirs',
        type: 'checking',
        classification: 'asset',
        currency: 'EUR',
      })
      .returning();
    await expect(
      services.ledger.createTransfer(owner, {
        fromAccountId: checking.id,
        toAccountId: foreign.id,
        amountFromMinor: 100,
        date: '2026-09-01',
      })
    ).rejects.toThrow('Account not found');
    expect(
      await db.select().from(schema.transactions).where(eq(schema.transactions.userId, owner))
    ).toEqual([]);
  });
});
