"use client"

import { ReactNode, useState } from "react"
import { TransactionType } from "./types";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { DialogTitle, DialogTrigger } from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { createTransactionSchema, createTransactionSchemaType } from "@/schema/transaction";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form"
import CategoryPicker from "./CategoryPicker";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DatePicker } from "@/components/DatePicker";

type CreateTransactionModalProps = {
  trigger: ReactNode;
  type: TransactionType;
}

function CreateTransactionModal({ trigger, type }: CreateTransactionModalProps) {
  const [openCalendar, setOpenCalendar] = useState(false);
  const form = useForm<createTransactionSchemaType>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      date: new Date(),
      type,
    },
  });
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Create a new {" "} <span className={cn(type === "income" ? "text-emerald-500" : "text-orange-500")}>
              {type === "income" ? "income" : "expense"}
            </span> transaction
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4">
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
            <div className="flex items-center justify-between gap-2">
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
                            className={cn("w-[200px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
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
      </DialogContent>
    </Dialog>
  )
}

export default CreateTransactionModal