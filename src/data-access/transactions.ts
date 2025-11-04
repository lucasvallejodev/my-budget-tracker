import { prisma } from '@/prisma';
import { createTransactionWithUserSchemaType } from '@/schema/transaction';

export async function createTransaction(data: createTransactionWithUserSchemaType) {
  const {
    amount,
    date,
    type,
    categoryId,
    payeeId,
    categoryGroupId,
    accountId,
    description,
    userId,
  } = data;

  const accountResult = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId,
      isDeleted: false,
    },
  });

  if (!accountResult) {
    throw new Error('Account not found');
  }

  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();

  const isExpense = type === 'EXPENSE';

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        amount,
        date,
        type,
        categoryId,
        categoryGroupId,
        accountId: accountResult.id,
        description: description || '',
        payeeId,
        userId,
      },
    }),
    prisma.account.update({
      where: {
        id: accountId,
      },
      data: {
        balance: {
          increment: !isExpense ? amount : amount * -1,
        },
      },
    }),
    prisma.monthlyHistory.upsert({
      where: {
        userId_month_year: {
          userId,
          month,
          year,
        },
      },
      create: {
        userId,
        month,
        year,
        expense: isExpense ? amount : 0,
        income: !isExpense ? amount : 0,
      },
      update: {
        expense: {
          increment: isExpense ? amount : 0,
        },
        income: {
          increment: !isExpense ? amount : 0,
        },
      },
    }),
    prisma.monthlyCategoryGroupHistory.upsert({
      where: {
        userId_categoryGroupId_month_year: {
          userId,
          categoryGroupId,
          month,
          year,
        },
      },
      create: {
        userId,
        month,
        year,
        categoryGroupId,
        expense: isExpense ? amount : 0,
        income: !isExpense ? amount : 0,
      },
      update: {
        expense: {
          increment: isExpense ? amount : 0,
        },
        income: {
          increment: !isExpense ? amount : 0,
        },
      },
    }),
  ]);
}
