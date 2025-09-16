"use server"

import { prisma } from "@/lib/prisma";
import { createTransactionSchema, createTransactionSchemaType } from "@/schema/transaction";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function deleteTransaction(transactionId: string) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }
  const transaction = await prisma.transaction.findUnique({
    where: {
      id: transactionId,
    },
  });
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  if (transaction.userId !== user.id) {
    throw new Error("You are not allowed to delete this transaction");
  }
  await prisma.$transaction([
    prisma.transaction.delete({
      where: {
        id: transactionId,
      },
    }),
    // Update the user's monthly transactions history
    prisma.monthlyTransactionsHistory.update({
      where: {
        userId_day_month_year: {
          userId: user.id,
          day: transaction.date.getUTCDate(),
          month: transaction.date.getUTCMonth(),
          year: transaction.date.getUTCFullYear(),
        }
      },
      data: {
        expense: {
          decrement: transaction.type === "expense" ? transaction.amount : 0,
        },
        income: {
          decrement: transaction.type === "income" ? transaction.amount : 0,
        },
      },
    }),
    // Update the user's yearly transactions history
    prisma.yearlyTransactionsHistory.update({
      where: {
        userId_month_year: {
          userId: user.id,
          month: transaction.date.getUTCMonth(),
          year: transaction.date.getUTCFullYear(),
        }
      },
      data: {
        expense: {
          decrement: transaction.type === "expense" ? transaction.amount : 0,
        },
        income: {
          decrement: transaction.type === "income" ? transaction.amount : 0,
        },
      },
    }),
  ]);

export async function createTransaction(transaction: createTransactionSchemaType) {
  const parsedData = createTransactionSchema.safeParse(transaction);

  if (!parsedData.success) {
    throw new Error(parsedData.error.message);
  }

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { amount, date, type, category, description } = parsedData.data;

  const categoryResult = await prisma.category.findFirst({
    where: {
      name: category,
      userId: user.id,
    },
  });

  if (!categoryResult) {
    throw new Error("Category not found");
  }

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        amount,
        date,
        type,
        category: categoryResult.name,
        categoryIcon: categoryResult.icon,
        description: description || "",
        userId: user.id,
      },
    }),
    // Update the user's monthly transactions history
    prisma.monthlyTransactionsHistory.upsert({
      where: {
        userId_day_month_year: {
          userId: user.id,
          day: date.getUTCDate(),
          month: date.getUTCMonth(),
          year: date.getUTCFullYear(),
        }
      },
      create: {
        userId: user.id,
        day: date.getUTCDate(),
        month: date.getUTCMonth(),
        year: date.getUTCFullYear(),
        expense: type === "expense" ? amount : 0,
        income: type === "income" ? amount : 0,
      },
      update: {
        expense: {
          increment: type === "expense" ? amount : 0,
        },
        income: {
          increment: type === "income" ? amount : 0,
        },
      },
    }),
    // Update the user's yearly transactions history
    prisma.yearlyTransactionsHistory.upsert({
      where: {
        userId_month_year: {
          userId: user.id,
          month: date.getUTCMonth(),
          year: date.getUTCFullYear(),
        }
      },
      create: {
        userId: user.id,
        month: date.getUTCMonth(),
        year: date.getUTCFullYear(),
        expense: type === "expense" ? amount : 0,
        income: type === "income" ? amount : 0,
      },
      update: {
        expense: {
          increment: type === "expense" ? amount : 0,
        },
        income: {
          increment: type === "income" ? amount : 0,
        },
      },
    }),
  ]);
}