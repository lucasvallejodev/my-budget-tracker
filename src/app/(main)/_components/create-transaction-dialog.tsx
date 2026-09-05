'use client';
import s from '@/components/forms.module.scss';

import { ReactNode, useState } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/primitives/dialog';
import { createTransactionSchema, createTransactionSchemaType } from '@/schema/transaction';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/primitives/form';
import { Input } from '@/components/primitives/input';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/primitives/button';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/primitives/popover';
import { Calendar } from '@/components/primitives/calendar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dateToUTCDate } from '@/lib/date-helpers';
import CategoryPicker from '@/components/category-picker';
import AccountPicker from './account-picker';
import PayeePicker from './payee-picker';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/select';
import { createTransactionAction } from '../actions';

type CreateTransactionDialogProps = {
  trigger: ReactNode;
};

function CreateTransactionDialog({ trigger }: CreateTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);

  const form = useForm<
    z.input<typeof createTransactionSchema>,
    unknown,
    createTransactionSchemaType
  >({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      date: new Date(),
      type: 'EXPENSE',
      accountId: '',
      categoryId: '',
      categoryGroupId: '',
      payeeId: '',
      description: '',
    },
  });

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createTransactionAction,
    onSuccess: async () => {
      toast.success('Transaction created successfully!', {
        id: 'create-transaction',
      });
      form.reset();

      await queryClient.invalidateQueries({
        queryKey: ['transactions'],
      });

      setOpen(false);
    },
    onError: () => {
      toast.error('Error creating transaction', {
        id: 'create-transaction',
      });
    },
  });

  const onSubmit = (values: createTransactionSchemaType) => {
    toast.loading('Creating transaction...', {
      id: 'create-transaction',
    });
    mutate({
      ...values,
      date: dateToUTCDate(values.date),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogTitle>Create a new transaction</DialogTitle>
        <Form {...form}>
          <form className={s.form} onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select
                    {...field}
                    onValueChange={(value: createTransactionSchemaType['type']) =>
                      form.setValue('type', value)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className={s.full}>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Transaction Types</SelectLabel>
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                        <SelectItem value="INCOME">Income</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormDescription>The type of the transaction.</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <FormControl>
                    <AccountPicker
                      value={field.value}
                      invalid={!!form.formState.errors.accountId}
                      onChange={account => {
                        field.onChange(account);
                      }}
                    />
                  </FormControl>
                  <FormDescription>Select an account for the transaction.</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      step="0.01"
                      min="0.01"
                      type="number"
                      placeholder="0.00"
                      {...field}
                      value={Number(field.value) || 0}
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
              name="payeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payee</FormLabel>
                  <FormControl>
                    <PayeePicker
                      value={field.value}
                      onChange={payee => {
                        field.onChange(payee);
                      }}
                    />
                  </FormControl>
                  <FormDescription>Select a payee for the transaction.</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <CategoryPicker
                      value={field.value}
                      onChange={values => {
                        field.onChange(values.categoryId);
                        form.setValue('categoryGroupId', values.categoryGroupId);
                      }}
                      invalid={
                        !!form.formState.errors.categoryId ||
                        !!form.formState.errors.categoryGroupId
                      }
                    />
                  </FormControl>
                  <FormDescription>Select a category for the transaction.</FormDescription>
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
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>A short description of the transaction.</FormDescription>
                </FormItem>
              )}
            />
            <div className={s.row}>
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction date</FormLabel>
                    <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button type="button" variant="outline" className={s.dateButton}>
                            {field.value ? format(field.value as Date, 'PPP') : 'Select a date'}
                            <CalendarIcon className={s.pickerIcon} />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className={s.datePopover}>
                        <Calendar
                          mode="single"
                          selected={field.value as Date}
                          onSelect={date => {
                            field.onChange(date);
                            setOpenCalendar(false);
                          }}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Choose when this transaction occurred.</FormDescription>
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
                form.reset();
              }}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isPending} onClick={form.handleSubmit(onSubmit)}>
            {isPending ? <Loader2 className={s.spinner} /> : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateTransactionDialog;
