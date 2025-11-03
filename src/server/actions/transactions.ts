'use server';

import { prisma } from '@/prisma';
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
        userId_month_year: {
          userId: user.id,
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
  ]);
}
