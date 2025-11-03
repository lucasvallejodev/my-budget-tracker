'use server';

import { createAccount } from '@/data-access/accounts';
import { createPayee } from '@/data-access/payees';
import { createTransaction } from '@/data-access/transactions';
import { getUserOrRedirect } from '@/lib/auth';
import { createAccountSchema, CreateAccountSchemaType } from '@/schema/accounts';
import { createPayeeSchema, CreatePayeeSchemaType } from '@/schema/payees';
import { createTransactionSchema, createTransactionSchemaType } from '@/schema/transaction';

export async function createAccountAction(form: CreateAccountSchemaType) {
  const user = await getUserOrRedirect();
  const parsedData = createAccountSchema.safeParse(form);

  if (!parsedData.success) {
    throw new Error('Bad request');
  }

  const data = {
    ...parsedData.data,
    userId: user.id,
  };

  return await createAccount(data);
}

export async function createPayeeAction(form: CreatePayeeSchemaType) {
  const user = await getUserOrRedirect();
  const parsedData = createPayeeSchema.safeParse(form);

  if (!parsedData.success) {
    throw new Error('Bad request');
  }

  const data = {
    ...parsedData.data,
    userId: user.id,
  };

  return await createPayee(data);
}

export async function createTransactionAction(form: createTransactionSchemaType) {
  const user = await getUserOrRedirect();
  const parsedData = createTransactionSchema.safeParse(form);

  if (!parsedData.success) {
    throw new Error('Bad request');
  }

  const data = {
    ...parsedData.data,
    userId: user.id,
  };

  return await createTransaction(data);
}
