"use server"

import { prisma } from "@/lib/prisma";
import { createCategorySchema, CreateCategorySchemaType } from "@/schema/categories"
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function createCategory(form: CreateCategorySchemaType) {
  const parsedData = createCategorySchema.safeParse(form);

  if (!parsedData.success) {
    throw new Error("Bad request");
  }

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { name, icon, type } = parsedData.data;

  return await prisma.category.create({
    data: {
      name,
      icon,
      type,
      userId: user.id,
    },
  });
}