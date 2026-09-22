'use client';
import s from '@/components/forms.module.scss';

import { ComponentProps, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/primitives/button';
import { Loader2, PlusSquareIcon } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/primitives/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/primitives/form';
import { Input } from '@/components/primitives/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createPayeeAction, updatePayeeAction } from '../actions';
import { payeeFormSchema, PayeeFormValues } from '@/schema/payees';
import CategoryPicker from '@/components/category-picker';
import { PayeeRow, queryKeys } from '@/components/finance/use-finance-data';

type CreatePayeeDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>['onCloseAutoFocus'];
  onSuccessCallback?: (payee: { id: string; name: string }) => void;
  payee?: PayeeRow;
};

function CreatePayeeDialog({
  onSuccessCallback,
  open: controlledOpen,
  onOpenChange,
  onCloseAutoFocus,
  payee,
}: CreatePayeeDialogProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const setOpen = (value: boolean) => {
    setLocalOpen(value);
    onOpenChange?.(value);
  };
  const form = useForm<PayeeFormValues>({
    resolver: zodResolver(payeeFormSchema),
    defaultValues: { name: payee?.name ?? '', defaultCategoryId: payee?.defaultCategoryId ?? '' },
  });
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (values: PayeeFormValues) =>
      payee ? updatePayeeAction({ id: payee.id, ...values }) : createPayeeAction(values),
    onSuccess: async data => {
      toast.success(`Payee ${data.name} saved`);
      await queryClient.invalidateQueries({ queryKey: queryKeys.payees });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      form.reset();
      onSuccessCallback?.(data);
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message || 'Error saving payee'),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && !payee && (
        <DialogTrigger asChild>
          <Button variant="ghost" className={s.create} onClick={() => setOpen(true)}>
            <PlusSquareIcon className={s.smallIcon} />
            Create new
          </Button>
        </DialogTrigger>
      )}
      <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <DialogTitle>{payee ? 'Edit payee' : 'Create new payee'}</DialogTitle>
        <DialogDescription>
          Payees are the people and businesses you pay or receive money from.
        </DialogDescription>
        <Form {...form}>
          <form className={s.form} onSubmit={form.handleSubmit(values => mutate(values))}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Payee name" {...field} />
                  </FormControl>
                  <FormDescription>The name of the payee.</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usual category</FormLabel>
                  <FormControl>
                    <CategoryPicker
                      value={field.value || undefined}
                      onChange={id => field.onChange(id ?? '')}
                    />
                  </FormControl>
                  <FormDescription>Pre-filled on new transactions for this payee.</FormDescription>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={() => form.reset()}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={isPending}
            onClick={form.handleSubmit(values => mutate(values))}
          >
            {isPending ? <Loader2 className={s.spinner} /> : payee ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreatePayeeDialog;
