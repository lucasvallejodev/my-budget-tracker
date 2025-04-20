"use server"

import { prisma } from "@/lib/prisma";
import { userSettingsSchema } from "@/schema/userSettings";
import { Currency } from "@/types/currency";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function updateUserCurrency(currency: Currency) {
  const parsedBody = userSettingsSchema.safeParse({ currency: currency.value });

  if (!parsedBody.success) {
    throw parsedBody.error;
  }

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const userSettings = await prisma.userSettings.update({
    where: {
      userId: user.id,
    },
    data: {
      currency: parsedBody.data.currency,
    },
  });
  
  return userSettings;
}