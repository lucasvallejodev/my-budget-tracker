'use server';

import { createAccount } from '@/data-access/accounts';
import { createPayee } from '@/data-access/payees';
import { getUserOrRedirect } from '@/lib/auth';
import { createAccountSchema, CreateAccountSchemaType } from '@/schema/accounts';
import { createPayeeSchema, CreatePayeeSchemaType } from '@/schema/payees';

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
