// @vitest-environment node
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import { createRepository } from './repository';
import { databaseUrl } from './connection';
import { readSchemaSignature } from '../../scripts/schema-signature.mjs';

const client = new PGlite();
const db = drizzle(client, { schema });
const repository = createRepository(db);
const owner = 'user_owner';
let accountId: string;
const input = () => ({
  userId: owner,
  accountId,
  amount: 25.5,
  type: 'EXPENSE' as const,
  date: new Date('2026-01-31T23:59:59.000Z'),
  categoryId: 'groceries',
  categoryGroupId: 'food',
  payeeId: '',
});
beforeAll(async () => {
  await migrate(db, { migrationsFolder: './drizzle' });
}, 30000);
afterAll(async () => {
  await client.close();
});
beforeEach(async () => {
  await client.exec(
    'TRUNCATE "Transaction", "Account", "Payee", "MonthlyHistory", "MonthlyCategoryGroupHistory" CASCADE'
  );
  accountId = (
    await repository.createAccount({ userId: owner, name: 'Checking', type: 'CHECKING' })
  ).id;
});
describe('Drizzle PostgreSQL migration', () => {
  it('can inspect the initial schema and detect drift before baselining', async () => {
    const expected = await readSchemaSignature(client);
    expect(expected[0]).toHaveLength(52);
    expect(expected[3]).toHaveLength(8);
    await client.exec('ALTER TABLE "Account" ADD COLUMN "unexpected" text');
    try {
      expect(await readSchemaSignature(client)).not.toEqual(expected);
    } finally {
      await client.exec('ALTER TABLE "Account" DROP COLUMN "unexpected"');
    }
  });
  it('generates IDs/timestamps, preserves defaults and account ownership', async () => {
    const account = await repository.findAccount(owner, accountId);
    expect(account?.balance).toBe(0);
    expect(account?.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(account?.createdAt).toBeInstanceOf(Date);
    expect(account?.updatedAt).toBeInstanceOf(Date);
    expect(await repository.findAccount('someone_else', accountId)).toBeUndefined();
    expect(await repository.listAccounts('someone_else')).toEqual([]);
  });
  it('atomically adds income and expense to account and both monthly histories', async () => {
    await repository.createTransaction(input());
    await repository.createTransaction({ ...input(), type: 'INCOME', amount: 100 });
    expect((await repository.findAccount(owner, accountId))?.balance).toBe(74.5);
    expect(await db.select().from(schema.monthlyHistory)).toMatchObject([
      { month: 1, year: 2026, income: 100, expense: 25.5 },
    ]);
    expect(await db.select().from(schema.monthlyCategoryGroupHistory)).toMatchObject([
      { categoryGroupId: 'food', income: 100, expense: 25.5 },
    ]);
    expect((await repository.listTransactions(owner))[0].payeeId).toBeNull();
    expect(await repository.listTransactions('someone_else')).toEqual([]);
  });
  it('rejects foreign or deleted accounts and payees without writing', async () => {
    const payee = await repository.createPayee({ userId: 'someone_else', name: 'Private' });
    await expect(repository.createTransaction({ ...input(), payeeId: payee.id })).rejects.toThrow(
      'Payee not found'
    );
    await expect(
      repository.createTransaction({ ...input(), userId: 'someone_else' })
    ).rejects.toThrow('Account not found');
    await db
      .update(schema.accounts)
      .set({ isDeleted: true })
      .where(eq(schema.accounts.id, accountId));
    await expect(repository.createTransaction(input())).rejects.toThrow('Account not found');
    expect(await repository.listTransactions(owner)).toEqual([]);
    expect(await db.select().from(schema.monthlyHistory)).toEqual([]);
  });
  it('rolls back earlier writes when a later database operation fails', async () => {
    await client.exec(
      'ALTER TABLE "MonthlyCategoryGroupHistory" ADD CONSTRAINT test_failure CHECK (expense < 1)'
    );
    try {
      await expect(repository.createTransaction(input())).rejects.toThrow();
      expect(await repository.listTransactions(owner)).toEqual([]);
      expect((await repository.findAccount(owner, accountId))?.balance).toBe(0);
      expect(await db.select().from(schema.monthlyHistory)).toEqual([]);
    } finally {
      await client.exec('ALTER TABLE "MonthlyCategoryGroupHistory" DROP CONSTRAINT test_failure');
    }
  });
  it('reverses balances and both histories exactly once on deletion', async () => {
    const transaction = await repository.createTransaction(input());
    await expect(repository.deleteTransaction('someone_else', transaction.id)).rejects.toThrow(
      'Transaction not found'
    );
    await repository.deleteTransaction(owner, transaction.id);
    await expect(repository.deleteTransaction(owner, transaction.id)).rejects.toThrow(
      'Transaction not found'
    );
    expect((await repository.findAccount(owner, accountId))?.balance).toBe(0);
    expect(await db.select().from(schema.monthlyHistory)).toMatchObject([{ expense: 0 }]);
    expect(await db.select().from(schema.monthlyCategoryGroupHistory)).toMatchObject([
      { expense: 0 },
    ]);
    expect(await repository.listTransactions(owner)).toEqual([]);
    expect(await db.select().from(schema.transactions)).toMatchObject([
      { isDeleted: true, deletedAt: expect.any(Date) },
    ]);
  });
  it('rolls back deletion if legacy aggregate history is missing', async () => {
    const transaction = await repository.createTransaction(input());
    await db.delete(schema.monthlyCategoryGroupHistory);
    await expect(repository.deleteTransaction(owner, transaction.id)).rejects.toThrow(
      'Category history is missing'
    );
    expect(await repository.listTransactions(owner)).toHaveLength(1);
    expect((await repository.findAccount(owner, accountId))?.balance).toBe(-25.5);
  });
  it('enforces payee uniqueness per owner and soft-deleted read filters', async () => {
    const payee = await repository.createPayee({ userId: owner, name: 'Shop' });
    await expect(repository.createPayee({ userId: owner, name: 'Shop' })).rejects.toThrow();
    await repository.createPayee({ userId: 'someone_else', name: 'Shop' });
    await db.update(schema.payees).set({ isDeleted: true }).where(eq(schema.payees.id, payee.id));
    expect(await repository.listPayees(owner)).toEqual([]);
    expect(await repository.listPayees('someone_else')).toHaveLength(1);
  });
  it('does not partially delete a paired transfer', async () => {
    const transaction = await repository.createTransaction(input());
    await db
      .update(schema.transactions)
      .set({ isTransfer: true })
      .where(eq(schema.transactions.id, transaction.id));
    await expect(repository.deleteTransaction(owner, transaction.id)).rejects.toThrow(
      'Paired transfers'
    );
    expect(await repository.listTransactions(owner)).toHaveLength(1);
  });
  it('rejects proxy URLs without exposing credentials', () => {
    expect(() => databaseUrl('prisma+postgres://example.test/?api_key=secret')).toThrow(
      'direct connection'
    );
    expect(() => databaseUrl('postgres://accelerate.prisma-data.net/?api_key=secret')).toThrow(
      'Accelerate API endpoint'
    );
    expect(databaseUrl('postgresql://user:password@localhost:5432/budget')).toContain(
      'postgresql://'
    );
  });
});
