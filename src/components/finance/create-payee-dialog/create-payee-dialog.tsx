'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ComponentProps, useState } from 'react';
import { useForm } from 'react-hook-form';

import { createPayeeAction, updatePayeeAction } from '@/app/(main)/actions';
import {
  CreateNewTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFormFooter,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormStack,
  saveLabel,
  TextField,
} from '@/components/ui';
import { payeeFormSchema, PayeeFormValues } from '@/schema/payees';

import { CategoryPicker } from '../category-picker';
import { useEntityMutation } from '../use-entity-mutation';
import { PayeeRow } from '../use-finance-data';

type CreatePayeeDialogProps = {
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>['onCloseAutoFocus'];
  onOpenChange?: (open: boolean) => void;
  onSuccessCallback?: (payee: { id: string; name: string }) => void;
  open?: boolean;
  payee?: PayeeRow;
};

export function CreatePayeeDialog({
  onCloseAutoFocus,
  onOpenChange,
  onSuccessCallback,
  open: controlledOpen,
  payee,
}: CreatePayeeDialogProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;

  const setOpen = (value: boolean) => {
    setLocalOpen(value);
    onOpenChange?.(value);
  };

  const form = useForm<PayeeFormValues>({
    defaultValues: { defaultCategoryId: payee?.defaultCategoryId ?? '', name: payee?.name ?? '' },
    resolver: zodResolver(payeeFormSchema),
  });

  const { isPending, mutate } = useEntityMutation({
    errorMessage: 'Error saving payee',
    mutationFn: (values: PayeeFormValues) =>
      payee ? updatePayeeAction({ id: payee.id, ...values }) : createPayeeAction(values),
    onSuccess: data => {
      form.reset();
      onSuccessCallback?.(data);
      setOpen(false);
    },
    successMessage: data => `Payee ${data.name} saved`,
  });

  const submit = form.handleSubmit(values => mutate(values));
  const showTrigger = controlledOpen === undefined && !payee;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && <CreateNewTrigger onClick={() => setOpen(true)} />}
      <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <DialogTitle>{payee ? 'Edit payee' : 'Create new payee'}</DialogTitle>
        <DialogDescription>
          Payees are the people and businesses you pay or receive money from.
        </DialogDescription>
        <Form {...form}>
          <FormStack onSubmit={submit}>
            <TextField
              control={form.control}
              name="name"
              label="Name"
              placeholder="Payee name"
              description="The name of the payee."
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
          </FormStack>
        </Form>
        <DialogFormFooter
          isPending={isPending}
          submitLabel={saveLabel(!!payee)}
          onCancel={() => form.reset()}
          onSubmit={submit}
        />
      </DialogContent>
    </Dialog>
  );
}
