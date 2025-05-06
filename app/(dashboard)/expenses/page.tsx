import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import CreateTransactionModal from "../_components/create-transaction-modal";
import { ReceiptText } from "lucide-react";
import { TransactionTable } from "@/components/transaction-table";
import { getStartAndEndOfMonth } from "@/lib/date-helpers";

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

  const { startDate, endDate } = getStartAndEndOfMonth();

  const transactions = await prisma.transaction.findMany({
    select: {
      id: true,
      amount: true,
      date: true,
      type: true,
      description: true,
      category: true,
      categoryIcon: true,
    },
    where: {
      userId: user.id,
      type: "expense",
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: "desc",
    },
    take: 20,
  });

  return (
    <div className="h-full p-5 flex gap-5 flex-col">
      <div className="flex gap-4 flex-col p-5 border rounded-sm bg-gray-50">
        <h2 className="text-xl">Manage your money</h2>
        <div className="flex gap-2 flex-col md:flex-row">
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
      <div className="flex gap-4 flex-col p-5 border rounded-sm">
        <h2 className="text-xl">Recent expense transactions</h2>
        <TransactionTable transactions={transactions}  />
      </div>
    </div>
  )
}

export default Dashboard