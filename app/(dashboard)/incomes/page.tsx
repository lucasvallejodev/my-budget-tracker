import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import TransactionsPage from '../_components/transaction-page';

async function Incomes() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  const userSettings = await prisma.userSettings.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!userSettings) {
    redirect('/settings');
  }

  return (
    <div className="h-full p-5 flex gap-5 flex-col">
      <TransactionsPage type="income" />
    </div>
  );
}

export default Incomes;
