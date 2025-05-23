"use client"

import { ReactNode, useState } from "react"
import { TransactionType } from "./types";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createTransactionSchema, createTransactionSchemaType } from "@/schema/transaction";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form"
import CategoryPicker from "./category-picker";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTransaction } from "../_actions/transactions";
import { toast } from "sonner";
import { dateToUTCDate } from "@/lib/date-helpers";

type CreateTransactionModalProps = {
  trigger: ReactNode;
  type: TransactionType;
}

function CreateTransactionModal({ trigger, type }: CreateTransactionModalProps) {
  const [open, setOpen] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);

  const form = useForm<createTransactionSchemaType>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      date: new Date(),
      type,
    },
  });

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      toast.success("Transaction created successfully!", {
        id: "create-transaction",
      });
      form.reset();

      queryClient.invalidateQueries({
        queryKey: ["overview"], // TODO: create this query on the dashboard
      });

      setOpen(false);
    },
    onError: () => {
      toast.error("Error creating transaction", {
        id: "create-transaction",
      });
    }
  })

  const onSubmit = (values: createTransactionSchemaType) => {
    toast.loading("Creating transaction...", {
      id: "create-transaction",
    });
    mutate({
      ...values,
      date: dateToUTCDate(values.date),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>
          Create a new {type === "income" ? "income" : "expense"} transaction
        </DialogTitle>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount*</FormLabel>
                  <FormControl>
                    <Input
                      defaultValue={0}
                      type="number"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The amount of money you want to add or remove from your account.
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      defaultValue=""
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A short description of the transaction.
                  </FormDescription>
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between gap-2 flex-col md:flex-row">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <CategoryPicker
                        type={type}
                        onChange={(category) => {
                          field.onChange(category)
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Select a category for the transaction.
                    </FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction date</FormLabel>
                    <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {
                              field.value ? format(field.value, "PPP") : "Select a date"
                            }
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setOpenCalendar(false);
                          }}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select a category for the transaction.
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                form.reset()
              }}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isPending ? <Loader2 className="animate-sping" /> : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTransactionModal