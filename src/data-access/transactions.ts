import { getRepository } from '@/db/queries';
import { createTransactionWithUserSchemaType } from '@/schema/transaction';
export async function createTransaction(data: createTransactionWithUserSchemaType) {
  return getRepository().createTransaction(data);
}
