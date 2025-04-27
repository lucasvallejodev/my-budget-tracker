import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import CreateTransactionModal from "../_components/create-transaction-modal";
import { BanknoteArrowUp } from "lucide-react";

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
    <div className="h-full p-8">
      <div className="flex gap-4 flex-col mt-4 p-7 border rounded-sm bg-gray-50">
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
        </div>
      </div>
    </div>
  )
}

export default Dashboard