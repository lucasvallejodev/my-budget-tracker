"use client"

import { useState } from "react";
import { TransactionType } from "./types"
import { createCategorySchema, createCategorySchemaType } from "@/schema/categories";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { PlusSquareIcon } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

type CreateCategoryModalProps = {
  type: TransactionType
}

function CreateCategoryModal({ type }: CreateCategoryModalProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<createCategorySchemaType>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      type,
    },
  })
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex border-separate items-center justify-start rounded-none border-b px-3 py-3 text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          <PlusSquareIcon className="mr-2 h-4 w-4" />
          Create new
        </Button>
      </DialogTrigger>
    </Dialog>
  )
}

export default CreateCategoryModal