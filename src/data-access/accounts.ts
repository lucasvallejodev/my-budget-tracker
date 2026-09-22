import { getRepository } from '@/db/queries';
import { CreateAccountWithUserSchemaType } from '@/schema/accounts';
export async function createAccount(data: CreateAccountWithUserSchemaType) {
  return getRepository().createAccount(data);
}
