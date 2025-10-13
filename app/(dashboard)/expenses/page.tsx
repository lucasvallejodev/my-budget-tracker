import { currentUser } from "@clerk/nextjs/server";
import TransactionsPage from "../_components/transaction-page";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

async function Expenses() {
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
    <div className="h-full p-5 flex gap-5 flex-col">
      <TransactionsPage type="expense" />
    </div>
  )
}

export default Expenses