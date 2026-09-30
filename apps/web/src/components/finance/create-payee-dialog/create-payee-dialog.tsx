'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ComponentProps, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { createPayee, updatePayee } from '@/api/mutations';
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
import { payeeFormSchema, PayeeFormValues } from '@coinkeeper/shared/schema/payees';

import { CategoryPicker } from '../category-picker';
import { useEntityMutation } from '../use-entity-mutation';
import { PayeeRow } from '../use-finance-data';
import { PayeeAppearance } from './payee-appearance';

type CreatePayeeDialogProps = {
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>['onCloseAutoFocus'];
  onOpenChange?: (open: boolean) => void;
  onSuccessCallback?: (payee: { id: string; name: string }) => void;
  open?: boolean;
  payee?: PayeeRow;
};

const payeeDefaults = (payee?: PayeeRow): PayeeFormValues => ({
  color: payee?.color ?? null,
  defaultCategoryId: payee?.defaultCategoryId ?? '',
  icon: payee?.icon ?? null,
  name: payee?.name ?? '',
});

function usePayeeForm(payee: PayeeRow | undefined, onSaved: (payee: PayeeRow) => void) {
  const form = useForm<PayeeFormValues>({
    defaultValues: payeeDefaults(payee),
    resolver: zodResolver(payeeFormSchema),
  });

  const { isPending, mutate } = useEntityMutation({
    errorMessage: 'Error saving payee',
    mutationFn: (values: PayeeFormValues) =>
      payee ? updatePayee(payee.id, values) : createPayee(values),
    onSuccess: data => {
      form.reset();
      onSaved(data);
    },
    successMessage: data => `Payee ${data.name} saved`,
  });

  const [name, icon, color] = useWatch({ control: form.control, name: ['name', 'icon', 'color'] });

  return {
    color,
    form,
    icon,
    isPending,
    name,
    submit: form.handleSubmit(values => mutate(values)),
  };
}

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

  const { color, form, icon, isPending, name, submit } = usePayeeForm(payee, data => {
    onSuccessCallback?.(data);
    setOpen(false);
  });

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
            <PayeeAppearance
              name={name}
              icon={icon}
              color={color}
              onChange={({ color, icon }) => {
                form.setValue('color', color, { shouldDirty: true });
                form.setValue('icon', icon, { shouldDirty: true });
              }}
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
