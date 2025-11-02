import { getUserOrRedirect } from '@/lib/auth';
import { prisma } from '@/prisma';

export async function GET() {
  const user = await getUserOrRedirect();

  const payees = await prisma.payee.findMany({
    select: {
      id: true,
      name: true,
      categoryId: true,
    },
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return Response.json(payees, {
    status: 200,
  });
}
