import { prisma } from '@/prisma';
import { CreateAccountWithUserSchemaType } from '@/schema/accounts';

export async function createAccount(data: CreateAccountWithUserSchemaType) {
  const { name, type, userId, institution, accountNumber, color, icon, notes } = data;

  return await prisma.account.create({
    data: {
      name,
      type,
      userId,
      institution,
      accountNumber,
      color,
      icon,
      notes,
    },
  });
}
