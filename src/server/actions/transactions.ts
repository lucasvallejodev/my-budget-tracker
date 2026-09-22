'use server';
import { getRepository } from '@/db/queries';
import { getUserOrRedirect } from '@/lib/auth';
export async function deleteTransaction(transactionId: string) {
  const user = await getUserOrRedirect();
  await getRepository().deleteTransaction(user.id, transactionId);
}
