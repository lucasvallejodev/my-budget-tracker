'use server';

import { prisma } from '@/prisma';
import { createTransactionSchema, createTransactionSchemaType } from '@/schema/transaction';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function deleteTransaction(transactionId: string) {
  const user = await currentUser();
  if (!user) {
    redirect('/sign-in');
  }

  const transaction = await prisma.transaction.findUnique({
    where: {
      id: transactionId,
      isDeleted: false, // Only find non-deleted transactions
    },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.userId !== user.id) {
    throw new Error('You are not allowed to delete this transaction');
  }

  await prisma.$transaction([
    // Soft delete the transaction
    prisma.transaction.update({
      where: {
        id: transactionId,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    }),
    // Update the user's monthly history
    prisma.monthlyHistory.update({
      where: {
        userId_day_month_year: {
          userId: user.id,
          day: transaction.date.getUTCDate(),
          month: transaction.date.getUTCMonth() + 1, // Prisma uses 0-indexed, our schema uses 1-12
          year: transaction.date.getUTCFullYear(),
        },
      },
      data: {
        expense: {
          decrement: transaction.type === 'EXPENSE' ? transaction.amount : 0,
        },
        income: {
          decrement: transaction.type === 'INCOME' ? transaction.amount : 0,
        },
      },
    }),
    // Update the user's yearly history
    prisma.yearlyHistory.update({
      where: {
        userId_month_year: {
          userId: user.id,
          month: transaction.date.getUTCMonth() + 1,
          year: transaction.date.getUTCFullYear(),
        },
      },
      data: {
        expense: {
          decrement: transaction.type === 'EXPENSE' ? transaction.amount : 0,
        },
        income: {
          decrement: transaction.type === 'INCOME' ? transaction.amount : 0,
        },
      },
    }),
  ]);
}

export async function createTransaction(transaction: createTransactionSchemaType) {
  const parsedData = createTransactionSchema.safeParse(transaction);

  if (!parsedData.success) {
    throw new Error(parsedData.error.message);
  }

  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  const { amount, date, type, categoryId, accountId, description } = parsedData.data;

  // Verify account exists and belongs to user
  const accountResult = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId: user.id,
      isDeleted: false,
    },
  });

  if (!accountResult) {
    throw new Error('Account not found');
  }

  const month = date.getUTCMonth() + 1; // Convert to 1-12
  const year = date.getUTCFullYear();
  const day = date.getUTCDate();

  await prisma.$transaction([
    // Create the transaction
    prisma.transaction.create({
      data: {
        amount,
        date,
        type,
        categoryId: categoryId,
        accountId: accountResult.id,
        description: description || '',
        userId: user.id,
      },
    }),
    // Update the user's monthly history
    prisma.monthlyHistory.upsert({
      where: {
        userId_day_month_year: {
          userId: user.id,
          day,
          month,
          year,
        },
      },
      create: {
        userId: user.id,
        day,
        month,
        year,
        expense: type === 'EXPENSE' ? amount : 0,
        income: type === 'INCOME' ? amount : 0,
      },
      update: {
        expense: {
          increment: type === 'EXPENSE' ? amount : 0,
        },
        income: {
          increment: type === 'INCOME' ? amount : 0,
        },
      },
    }),
    // Update the user's yearly history
    prisma.yearlyHistory.upsert({
      where: {
        userId_month_year: {
          userId: user.id,
          month,
          year,
        },
      },
      create: {
        userId: user.id,
        month,
        year,
        expense: type === 'EXPENSE' ? amount : 0,
        income: type === 'INCOME' ? amount : 0,
      },
      update: {
        expense: {
          increment: type === 'EXPENSE' ? amount : 0,
        },
        income: {
          increment: type === 'INCOME' ? amount : 0,
        },
      },
    }),
  ]);
}
