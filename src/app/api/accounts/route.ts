import { getUserOrRedirect } from '@/lib/auth';
import { prisma } from '@/prisma';

export async function GET() {
  const user = await getUserOrRedirect();

  const accounts = await prisma.account.findMany({
    select: {
      id: true,
      type: true,
      name: true,
      icon: true,
      color: true,
      balance: true,
      institution: true,
      accountNumber: true,
    },
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return Response.json(accounts, {
    status: 200,
  });
}
