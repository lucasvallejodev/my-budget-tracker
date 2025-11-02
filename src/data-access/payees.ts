import { prisma } from '@/prisma';
import { CreatePayeeWithUserSchemaType } from '@/schema/payees';

export async function createPayee(data: CreatePayeeWithUserSchemaType) {
  const { name, userId } = data;

  return await prisma.payee.create({
    data: {
      name,
      userId,
    },
  });
}
