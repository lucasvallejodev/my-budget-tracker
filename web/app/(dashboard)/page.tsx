import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import CreateTransactionModal from './_components/CreateTransactionModal';

async function Dashboard() {
  const user  = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const userSettings = await prisma.userSettings.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!userSettings) {
    redirect("/wizard");
  }

  return (
    <div className="h-full bg-background">
      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-6 py-8">
          <h1 className="text-3xl font-bold">Hello, {user.firstName}! 👋</h1>
          <div className="flex items-center gap-4">
            <CreateTransactionModal
              trigger={
                <Button className="border-1 border-emerald-500 bg-emerald-900 text-white hover:bg-emerald-700 hover:text-white">
                  New income
                </Button>
              }
              type="income"
            />
            <CreateTransactionModal
              trigger={
                <Button className="border-1 border-orange-500 bg-orange-900 text-white hover:bg-orange-700 hover:text-white">
                  New Expense
                </Button>
              }
              type="expense"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard