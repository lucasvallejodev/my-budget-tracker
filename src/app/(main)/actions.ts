'use server';

import { createAccount } from '@/data-access/accounts';
import { getUserOrRedirect } from '@/lib/auth';
import { createAccountSchema, CreateAccountSchemaType } from '@/schema/accounts';

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
