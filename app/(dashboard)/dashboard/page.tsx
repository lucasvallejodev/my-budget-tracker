import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import CreateTransactionModal from '../_components/create-transaction-modal';
import { BanknoteArrowUp, ReceiptText } from 'lucide-react';

async function Dashboard() {
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
    redirect('/wizard');
  }

  return (
    <div className="h-full p-5 flex gap-5 flex-col">
      <h2 className="font-bold text-2xl">Hi, {user?.fullName}</h2>
      <h3 className="text-gray-500">
        Here&apos;s what happenning with your money. Lets Manage your expenses!
      </h3>
      <div className="flex gap-4 flex-col p-5 border rounded-sm bg-gray-50">
        <h2 className="text-xl">Manage your money</h2>
        <div className="flex gap-2 flex-col md:flex-row">
          <CreateTransactionModal
            trigger={
              <Button className="border border-gray-200 bg-white" variant="ghost">
                <BanknoteArrowUp />
                New income
              </Button>
            }
            type="income"
          />
          <CreateTransactionModal
            trigger={
              <Button className="border border-gray-200 bg-white" variant="ghost">
                <ReceiptText />
                New Expense
              </Button>
            }
            type="expense"
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
