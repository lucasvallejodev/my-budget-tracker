// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { IconNames } from '@/constants/icon-names';
import * as schema from '@/db/schema';

import { DefaultTaxonomy } from './categories/default-taxonomy';
import { Db } from './db';
import { createServices } from './services';

const client = new PGlite();
const pglite = drizzle(client, { schema });
const db = pglite as unknown as Db;
const services = createServices(db);
const owner = 'user_owner';
const other = 'user_other';

async function categoryByName(userId: string, name: string) {
  const tree = await services.categories.tree(userId);

  for (const group of tree) {
    const category = group.categories.find(candidate => candidate.name === name);

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

    expect(tree).toHaveLength(DefaultTaxonomy.length);
    expect(tree.flatMap(group => group.categories)).toHaveLength(
      DefaultTaxonomy.flatMap(group => group.categories).length
    );

    for (const category of tree.flatMap(group => group.categories)) {
      expect(IconNames).toContain(category.icon);
    }

    expect(tree[0]).toMatchObject({
      isSystem: true,
      kind: 'income',
      name: 'Income',
    });
    const again = await services.bootstrap(owner);

    expect(again.seeded).toBe(false);
    expect(await services.categories.tree(owner)).toHaveLength(DefaultTaxonomy.length);
    expect((await services.getSettings(other))?.primaryCurrency).toBe('USD');
  });

  it('archives a category by moving or by flagging its transactions for review', async () => {
    const account = await services.accounts.create(owner, {
      currency: 'EUR',
      name: 'Checking',
      type: 'checking',
    });

    const groceries = await categoryByName(owner, 'Groceries');
    const coffee = await categoryByName(owner, 'Coffee');

    const tx = await services.ledger.createStandard(owner, {
      accountId: account.id,
      amountMinor: -1200,
      categoryId: coffee.id,
      date: '2026-09-03',
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
      color: '#D97706',
      kind: 'expense',
      name: 'Kids',
    });

    expect(group.sortOrder).toBe(DefaultTaxonomy.length);

    const category = await services.categories.createCategory(owner, {
      groupId: group.id,
      icon: 'Gift',
      name: 'Toys',
    });

    const second = await services.categories.createCategory(owner, {
      groupId: group.id,
      icon: 'GraduationCap',
      name: 'School',
    });

    await services.categories.reorderCategories(owner, group.id, [second.id, category.id]);
    await services.categories.updateGroup(owner, group.id, { color: '#0891B2', name: 'Children' });
    await services.categories.updateCategory(owner, category.id, {
      icon: 'Gamepad2',
      name: 'Toys & games',
    });
    const tree = await services.categories.tree(owner);
    const children = tree.find(candidate => candidate.id === group.id)!;

    expect(children).toMatchObject({ color: '#0891B2', name: 'Children' });
    expect(children.categories.map(category => category.name)).toEqual(['School', 'Toys & games']);
    const ids = tree.map(group => group.id);

    await services.categories.reorderGroups(owner, [
      group.id,
      ...ids.filter(id => id !== group.id),
    ]);
    expect((await services.categories.tree(owner))[0].id).toBe(group.id);
    await services.categories.archiveCategory(owner, second.id);
    expect(
      (await services.categories.tree(owner)).find(candidate => candidate.id === group.id)!
        .categories
    ).toHaveLength(1);
    await services.categories.restoreCategory(owner, second.id);
    expect(
      (await services.categories.tree(owner)).find(candidate => candidate.id === group.id)!
        .categories
    ).toHaveLength(2);
    const income = tree.find(group => group.isSystem)!;

    await expect(
      services.categories.updateGroup(owner, income.id, { kind: 'expense' })
    ).rejects.toThrow(/income group/);
    await expect(
      services.categories.createCategory(other, {
        groupId: group.id,
        icon: 'Gift',
        name: 'x',
      })
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
      currency: 'EUR',
      name: 'Checking',
      openingBalanceMinor: 150000,
      openingDate: '2026-01-01',
      type: 'checking',
    });

    const salary = await categoryByName(owner, 'Salary');

    await services.ledger.createStandard(owner, {
      accountId: account.id,
      amountMinor: 250000,
      categoryId: salary.id,
      date: '2026-09-01',
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
      currency: 'EUR',
      name: 'Checking',
      type: 'checking',
    });

    const foreignCategory = await categoryByName(other, 'Groceries');

    await expect(
      services.ledger.createStandard(owner, {
        accountId: account.id,
        amountMinor: -100,
        categoryId: foreignCategory.id,
        date: '2026-09-02',
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
      services.accounts.create(owner, {
        currency: 'XXX',
        name: 'X',
        type: 'cash',
      })
    ).rejects.toThrow('Unknown currency');
    expect(await services.ledger.list(owner)).toEqual([]);
  });

  it('locks the currency once an account has transactions', async () => {
    const account = await services.accounts.create(owner, {
      currency: 'EUR',
      name: 'Wallet',
      type: 'cash',
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
      currency: 'EUR',
      name: 'Checking',
      openingBalanceMinor: 150000,
      openingDate: '2026-08-01',
      type: 'checking',
    });

    const visa = await services.accounts.create(owner, {
      currency: 'EUR',
      name: 'Visa',
      type: 'credit_card',
    });

    const groceries = await categoryByName(owner, 'Groceries');
    const restaurants = await categoryByName(owner, 'Restaurants & bars');

    await services.ledger.createStandard(owner, {
      accountId: visa.id,
      amountMinor: -6000,
      categoryId: groceries.id,
      date: '2026-09-03',
    });
    await services.ledger.createStandard(owner, {
      accountId: visa.id,
      amountMinor: -4500,
      categoryId: restaurants.id,
      date: '2026-09-10',
    });

    const { legs, transferId } = await services.ledger.createTransfer(owner, {
      amountFromMinor: 10500,
      date: '2026-09-25',
      fromAccountId: checking.id,
      memo: 'Card payment',
      toAccountId: visa.id,
    });

    expect(legs.map(leg => Number(leg.amountMinor)).sort((left, right) => left - right)).toEqual([
      -10500, 10500,
    ]);
    expect(legs.every(leg => leg.categoryId === null && leg.kind === 'transfer')).toBe(true);
    const accounts = await services.accounts.list(owner);

    expect(accounts.find(account => account.id === checking.id)?.balanceMinor).toBe(139500);
    expect(accounts.find(account => account.id === visa.id)?.balanceMinor).toBe(0);
    const [totals] = await services.reports.monthlyTotals(owner, '2026-09');

    expect(totals).toEqual({
      currency: 'EUR',
      incomeMinor: 0,
      spendingMinor: 10500,
    });
    const breakdown = await services.reports.breakdownByGroup(owner, '2026-09');

    expect(breakdown).toHaveLength(1);
    expect(breakdown[0]).toMatchObject({ groupName: 'Food & Dining', spentMinor: 10500 });
    const [netWorth] = await services.reports.netWorth(owner);

    expect(netWorth).toEqual({
      assetsMinor: 139500,
      currency: 'EUR',
      liabilitiesMinor: 0,
      netMinor: 139500,
    });
    const rows = await services.ledger.list(owner, { kind: 'transfer' });

    expect(
      rows
        .map(row => row.counterpartAccountName ?? '')
        .sort((left, right) => left.localeCompare(right))
    ).toEqual(['Checking', 'Visa']);
    await services.ledger.updateTransfer(owner, transferId, {
      amountFromMinor: 10000,
      memo: 'Partial',
    });
    const updated = await services.ledger.list(owner, { kind: 'transfer' });

    expect(updated.map(row => row.amountMinor).sort((left, right) => left - right)).toEqual([
      -10000, 10000,
    ]);
    expect(updated.every(row => row.memo === 'Partial')).toBe(true);
    await expect(
      services.ledger.updateStandard(owner, updated[0].id, { memo: 'x' })
    ).rejects.toThrow(/transfer editor/);
    await services.ledger.remove(owner, updated[0].id);
    expect(await services.ledger.list(owner, { kind: 'transfer' })).toEqual([]);
    expect((await services.accounts.get(owner, visa.id)).balanceMinor).toBe(-10500);
  });

  it('keeps both legs of a cross-currency transfer in their own currency', async () => {
    const eur = await services.accounts.create(owner, {
      currency: 'EUR',
      name: 'EUR',
      openingBalanceMinor: 200000,
      type: 'checking',
    });

    const usd = await services.accounts.create(owner, {
      currency: 'USD',
      name: 'USD',
      type: 'savings',
    });

    await expect(
      services.ledger.createTransfer(owner, {
        amountFromMinor: 100000,
        date: '2026-09-05',
        fromAccountId: eur.id,
        toAccountId: usd.id,
      })
    ).rejects.toThrow(/amount received in USD/);
    await services.ledger.createTransfer(owner, {
      amountFromMinor: 100000,
      amountToMinor: 108500,
      date: '2026-09-05',
      fromAccountId: eur.id,
      toAccountId: usd.id,
    });
    const netWorth = await services.reports.netWorth(owner);

    expect(netWorth).toEqual([
      {
        assetsMinor: 100000,
        currency: 'EUR',
        liabilitiesMinor: 0,
        netMinor: 100000,
      },
      {
        assetsMinor: 108500,
        currency: 'USD',
        liabilitiesMinor: 0,
        netMinor: 108500,
      },
    ]);
    expect(await services.reports.monthlyTotals(owner, '2026-09')).toEqual([]);
  });

  it('reports income and spending per currency and treats refunds as negative spending', async () => {
    const eur = await services.accounts.create(owner, {
      currency: 'EUR',
      name: 'EUR',
      type: 'checking',
    });

    const usd = await services.accounts.create(owner, {
      currency: 'USD',
      name: 'USD',
      type: 'checking',
    });

    const investing = await services.accounts.create(owner, {
      currency: 'EUR',
      name: 'Broker',
      type: 'investment',
    });

    const salary = await categoryByName(owner, 'Salary');
    const groceries = await categoryByName(owner, 'Groceries');

    await services.ledger.createStandard(owner, {
      accountId: eur.id,
      amountMinor: 300000,
      categoryId: salary.id,
      date: '2026-09-01',
    });
    await services.ledger.createStandard(owner, {
      accountId: eur.id,
      amountMinor: -6000,
      categoryId: groceries.id,
      date: '2026-09-02',
    });
    await services.ledger.createStandard(owner, {
      accountId: eur.id,
      amountMinor: 1200,
      categoryId: groceries.id,
      date: '2026-09-03',
    });
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
      {
        currency: 'EUR',
        incomeMinor: 300000,
        spendingMinor: 4800,
      },
      {
        currency: 'USD',
        incomeMinor: 0,
        spendingMinor: 2000,
      },
    ]);
    const breakdown = await services.reports.breakdownByGroup(owner, '2026-09');

    expect(breakdown.find(bucket => bucket.currency === 'USD')).toMatchObject({
      groupName: 'Uncategorized',
      spentMinor: 2000,
    });
    const flow = await services.reports.cashFlow(owner, '2026-10', 3);

    expect(
      flow.map(period => `${period.month}:${period.currency}:${period.spendingMinor}`)
    ).toEqual(['2026-09:EUR:4800', '2026-09:USD:2000', '2026-10:USD:100']);
  });

  it('learns a payee default category from recent transactions', async () => {
    const account = await services.accounts.create(owner, {
      currency: 'EUR',
      name: 'Checking',
      type: 'checking',
    });

    const payee = await services.payees.create(owner, { name: 'Mercadona' });
    const groceries = await categoryByName(owner, 'Groceries');
    const coffee = await categoryByName(owner, 'Coffee');

    await services.ledger.createStandard(owner, {
      accountId: account.id,
      amountMinor: -100,
      categoryId: groceries.id,
      date: '2026-09-01',
      payeeId: payee.id,
    });
    expect((await services.payees.list(owner))[0].defaultCategoryId).toBe(groceries.id);
    await services.ledger.createStandard(owner, {
      accountId: account.id,
      amountMinor: -100,
      categoryId: coffee.id,
      date: '2026-09-02',
      payeeId: payee.id,
    });
    expect((await services.payees.list(owner))[0].defaultCategoryId).toBe(groceries.id);
    await services.ledger.createStandard(owner, {
      accountId: account.id,
      amountMinor: -100,
      categoryId: coffee.id,
      date: '2026-09-03',
      payeeId: payee.id,
    });
    expect((await services.payees.list(owner))[0].defaultCategoryId).toBe(coffee.id);
    await expect(services.payees.create(owner, { name: 'Mercadona' })).rejects.toThrow();
  });

  it('rolls back a transfer when the second leg fails', async () => {
    const checking = await services.accounts.create(owner, {
      currency: 'EUR',
      name: 'Checking',
      type: 'checking',
    });

    const [foreign] = await db
      .insert(schema.accounts)
      .values({
        classification: 'asset',
        currency: 'EUR',
        name: 'Theirs',
        type: 'checking',
        userId: other,
      })
      .returning();

    await expect(
      services.ledger.createTransfer(owner, {
        amountFromMinor: 100,
        date: '2026-09-01',
        fromAccountId: checking.id,
        toAccountId: foreign.id,
      })
    ).rejects.toThrow('Account not found');
    expect(
      await db.select().from(schema.transactions).where(eq(schema.transactions.userId, owner))
    ).toEqual([]);
  });

  it('stores manual exchange rates and converts totals with the rate in force', async () => {
    await services.fx.upsert(owner, {
      base: 'EUR',
      date: '2026-09-01',
      quote: 'USD',
      rate: 1.1,
    });
    await services.fx.upsert(owner, {
      base: 'EUR',
      date: '2026-09-15',
      quote: 'USD',
      rate: 1.2,
    });
    await services.fx.upsert(owner, {
      base: 'EUR',
      date: '2026-09-15',
      quote: 'USD',
      rate: 1.25,
    });
    expect(await services.fx.list(owner)).toHaveLength(2);
    expect((await services.fx.getRate(owner, 'EUR', 'USD', '2026-09-10'))?.rate).toBe(1.1);
    expect((await services.fx.getRate(owner, 'EUR', 'USD', '2026-09-20'))?.rate).toBe(1.25);
    expect(await services.fx.getRate(owner, 'EUR', 'USD', '2026-08-01')).toBeNull();
    const inverse = await services.fx.getRate(owner, 'USD', 'EUR', '2026-09-20');

    expect(inverse?.rate).toBeCloseTo(0.8);
    expect(inverse?.source).toContain('inverse');
    expect(await services.fx.getRate(other, 'EUR', 'USD', '2026-09-20')).toBeNull();
    expect(
      await services.fx.convert(owner, {
        amountMinor: 100000,
        date: '2026-09-20',
        from: 'USD',
        to: 'EUR',
      })
    ).toMatchObject({
      amountMinor: 80000,
      currency: 'EUR',
    });
    expect(
      await services.fx.convert(owner, {
        amountMinor: 500,
        date: '2026-09-20',
        from: 'GBP',
        to: 'EUR',
      })
    ).toEqual({
      amountMinor: 500,
      currency: 'GBP',
      rate: null,
    });
    await expect(
      services.fx.upsert(owner, {
        base: 'EUR',
        date: '2026-09-01',
        quote: 'EUR',
        rate: 1,
      })
    ).rejects.toThrow(/different/);

    const eur = await services.accounts.create(owner, {
      currency: 'EUR',
      name: 'EUR',
      openingBalanceMinor: 100000,
      type: 'checking',
    });

    const usd = await services.accounts.create(owner, {
      currency: 'USD',
      name: 'USD',
      openingBalanceMinor: 125000,
      type: 'checking',
    });

    const gbp = await services.accounts.create(owner, {
      currency: 'GBP',
      name: 'GBP',
      openingBalanceMinor: 1,
      type: 'checking',
    });

    await services.ledger.createStandard(owner, {
      accountId: eur.id,
      amountMinor: -1000,
      date: '2026-09-20',
    });
    await services.ledger.createStandard(owner, {
      accountId: usd.id,
      amountMinor: -2500,
      date: '2026-09-20',
    });
    await services.ledger.createStandard(owner, {
      accountId: gbp.id,
      amountMinor: -100,
      date: '2026-09-20',
    });

    const converted = await services.reports.convertedTotals(
      owner,
      'EUR',
      {
        netWorth: await services.reports.netWorth(owner),
        totals: await services.reports.monthlyTotals(owner, '2026-09'),
      },
      '2026-09-20'
    );

    expect(converted.missing).toEqual(['GBP']);
    expect(converted.netWorthMinor).toBe(99000 + 98000);
    expect(converted.spendingMinor).toBe(1000 + 2000);
    expect(converted.rates).toEqual([
      {
        currency: 'USD',
        date: '2026-09-15',
        rate: 0.8,
        source: 'manual (inverse)',
      },
    ]);
    await services.fx.remove(owner, {
      base: 'EUR',
      date: '2026-09-15',
      quote: 'USD',
    });
    expect((await services.fx.getRate(owner, 'EUR', 'USD', '2026-09-20'))?.rate).toBe(1.1);
  });

  it('imports a CSV once: dedupes, matches manual entries, applies rules and suggests transfers', async () => {
    const checking = await services.accounts.create(owner, {
      currency: 'EUR',
      name: 'Checking',
      type: 'checking',
    });

    const savings = await services.accounts.create(owner, {
      currency: 'EUR',
      name: 'Savings',
      type: 'savings',
    });

    const groceries = await categoryByName(owner, 'Groceries');
    const coffee = await categoryByName(owner, 'Coffee');

    await services.rules.create(owner, { categoryId: groceries.id, pattern: 'mercadona' });

    const payee = await services.payees.create(owner, {
      defaultCategoryId: coffee.id,
      name: 'Starbucks',
    });

    const manual = await services.ledger.createStandard(owner, {
      accountId: checking.id,
      amountMinor: -4500,
      categoryId: coffee.id,
      date: '2026-09-09',
      memo: 'Coffee beans',
      payeeId: payee.id,
    });

    await services.ledger.createStandard(owner, {
      accountId: savings.id,
      amountMinor: 20000,
      date: '2026-09-12',
    });

    const csv = [
      'Fecha;Concepto;Importe',
      '01/09/2026;MERCADONA SUPERMERCADO;-62,30',
      '10/09/2026;Starbucks;-45,00',
      '11/09/2026;TRASPASO A AHORRO;-200,00',
      '11/09/2026;TRASPASO A AHORRO;-200,00',
      '12/09/2026;;0',
      '13/09/2026;Unknown shop;-10,00',
    ].join('\n');

    const mapping = {
      amount: 'Importe',
      date: 'Fecha',
      dateFormat: 'DD/MM/YYYY' as const,
      payee: 'Concepto',
    };

    const preview = await services.imports.preview(owner, {
      accountId: checking.id,
      csv,
      mapping,
    });

    expect(preview.counts).toEqual({
      duplicate: 0,
      invalid: 1,
      matched: 1,
      new: 4,
    });
    expect(preview.rows[0]).toMatchObject({
      amountMinor: -6230,
      date: '2026-09-01',
      suggestedBy: 'rule',
      suggestedCategoryId: groceries.id,
    });
    expect(preview.rows[1]).toMatchObject({
      matchedTransactionId: manual.id,
      status: 'matched',
      suggestedBy: 'payee',
      suggestedCategoryId: coffee.id,
    });
    expect(preview.rows[2].importId).not.toBe(preview.rows[3].importId);
    expect(preview.rows[4].status).toBe('invalid');

    const result = await services.imports.commit(owner, preview);

    expect(result).toMatchObject({ inserted: 4, matched: 1 });
    const rows = await services.ledger.list(owner, { accountId: checking.id });

    expect(rows).toHaveLength(5);
    const merc = rows.find(row => row.originalPayee === 'MERCADONA SUPERMERCADO')!;

    expect(merc).toMatchObject({
      categoryId: groceries.id,
      needsReview: true,
      payeeName: 'MERCADONA SUPERMERCADO',
      status: 'pending',
    });
    expect(rows.find(row => row.id === manual.id)?.importId).toBe(preview.rows[1].importId);
    expect(await services.ledger.needsReviewCount(owner)).toBe(5);

    const again = await services.imports.preview(owner, {
      accountId: checking.id,
      csv,
      mapping,
    });

    expect(again.counts).toEqual({
      duplicate: 5,
      invalid: 1,
      matched: 0,
      new: 0,
    });
    expect((await services.imports.commit(owner, again)).inserted).toBe(0);

    const suggestions = await services.imports.transferSuggestions(owner, result.insertedIds);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      amountMinor: 20000,
      inAccount: 'Savings',
      outAccount: 'Checking',
    });
    await services.ledger.linkAsTransfer(owner, suggestions[0].outId, suggestions[0].inId);
    const legs = await services.ledger.list(owner, { kind: 'transfer' });

    expect(legs).toHaveLength(2);
    expect(
      legs.every(leg => leg.transferId === legs[0].transferId && leg.categoryId === null)
    ).toBe(true);
    expect(await services.imports.transferSuggestions(owner)).toEqual([]);

    await services.rules.create(owner, { categoryId: coffee.id, pattern: 'unknown' });
    expect(await services.rules.applyToUncategorized(owner)).toBe(1);
    expect(await services.rules.list(owner)).toHaveLength(2);
    await expect(
      services.rules.create(other, { categoryId: coffee.id, pattern: 'x' })
    ).rejects.toThrow('not found');
    await expect(
      services.imports.preview(owner, {
        accountId: checking.id,
        csv,
        mapping: { date: 'Nope' },
      })
    ).rejects.toThrow(/date column/);
  });

  it('keeps monthly budgets per category and currency and compares them with the ledger', async () => {
    const eur = await services.accounts.create(owner, {
      currency: 'EUR',
      name: 'EUR',
      type: 'checking',
    });

    const usd = await services.accounts.create(owner, {
      currency: 'USD',
      name: 'USD',
      type: 'checking',
    });

    const groceries = await categoryByName(owner, 'Groceries');
    const coffee = await categoryByName(owner, 'Coffee');

    await services.budgets.upsert(owner, {
      amountMinor: 30000,
      categoryId: groceries.id,
      currency: 'EUR',
      month: '2026-08',
    });
    await services.budgets.upsert(owner, {
      amountMinor: 25000,
      categoryId: groceries.id,
      currency: 'EUR',
      month: '2026-09',
    });
    await services.budgets.upsert(owner, {
      amountMinor: 26000,
      categoryId: groceries.id,
      currency: 'EUR',
      month: '2026-09',
    });
    await services.budgets.upsert(owner, {
      amountMinor: 10000,
      categoryId: groceries.id,
      currency: 'USD',
      month: '2026-09',
    });
    await services.ledger.createStandard(owner, {
      accountId: eur.id,
      amountMinor: -6000,
      categoryId: groceries.id,
      date: '2026-09-03',
    });
    await services.ledger.createStandard(owner, {
      accountId: eur.id,
      amountMinor: 1000,
      categoryId: groceries.id,
      date: '2026-09-04',
    });
    await services.ledger.createStandard(owner, {
      accountId: usd.id,
      amountMinor: -12000,
      categoryId: groceries.id,
      date: '2026-09-05',
    });
    await services.ledger.createStandard(owner, {
      accountId: eur.id,
      amountMinor: -900,
      categoryId: coffee.id,
      date: '2026-09-05',
    });
    const september = await services.budgets.list(owner, '2026-09');

    expect(september).toHaveLength(2);
    expect(september.find(bucket => bucket.currency === 'EUR')).toMatchObject({
      amountMinor: 26000,
      categoryName: 'Groceries',
      spentMinor: 5000,
    });
    expect(september.find(bucket => bucket.currency === 'USD')).toMatchObject({
      amountMinor: 10000,
      spentMinor: 12000,
    });
    expect(await services.budgets.list(owner, '2026-10')).toEqual([]);
    expect(await services.budgets.copyFromPreviousMonth(owner, '2026-10')).toBe(2);
    expect(await services.budgets.copyFromPreviousMonth(owner, '2026-10')).toBe(0);
    const october = await services.budgets.list(owner, '2026-10');

    expect(october.map(bucket => bucket.spentMinor)).toEqual([0, 0]);
    await services.budgets.remove(owner, october[0].id);
    expect(await services.budgets.list(owner, '2026-10')).toHaveLength(1);
    await expect(services.budgets.remove(other, october[1].id)).rejects.toThrow('not found');
    await expect(
      services.budgets.upsert(owner, {
        amountMinor: 0,
        categoryId: groceries.id,
        currency: 'EUR',
        month: '2026-09',
      })
    ).rejects.toThrow(/positive/);
    await expect(
      services.budgets.upsert(other, {
        amountMinor: 100,
        categoryId: groceries.id,
        currency: 'EUR',
        month: '2026-09',
      })
    ).rejects.toThrow('not found');
  });
});
