import { getUserOrRedirect } from '@/lib/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';

export async function GET(request: Request) {
  const user = await getUserOrRedirect();

  // const { searchParams } = new URL(request.url);
  // const paramType = searchParams.get('type');

  // const validator = z.enum(['INCOME', 'EXPENSE']).nullable();
  // const queryParams = validator.safeParse(paramType);

  // if (!queryParams.success) {
  //   return Response.json(queryParams.error, {
  //     status: 400,
  //   });
  // }

  // const type = queryParams.data;
  const transactions = await prisma.transaction.findMany({
    select: {
      id: true,
      amount: true,
      date: true,
      type: true,
      description: true,
      // payee: true,
      payeeId: true,
      // account: true,
      accountId: true,
      categoryId: true,
      categoryGroupId: true,
    },
    where: {
      userId: user.id,
      // type: type || undefined,
    },
    orderBy: {
      date: 'desc',
    },
    take: 20,
  });

  return Response.json(transactions, {
    status: 200,
  });
}
