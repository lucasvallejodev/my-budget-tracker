import { getRepository } from '@/db/queries';
import { CreatePayeeWithUserSchemaType } from '@/schema/payees';
export async function createPayee(data: CreatePayeeWithUserSchemaType) {
  return getRepository().createPayee(data);
}
