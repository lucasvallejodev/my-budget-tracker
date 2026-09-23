'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ComponentProps, useState } from 'react';
import { useForm } from 'react-hook-form';

import { AccountSummary, useCurrencies, useSettings } from '@/components/finance';
import {
  CreateNewTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFormFooter,
  DialogTitle,
  DialogTrigger,
  Form,
  FormStack,
  saveLabel,
} from '@/components/ui';
import { accountFormSchema, AccountFormValues } from '@/schema/accounts';

import { accountDefaults, AccountFormFields, saveAccount } from './account-fields';
import { useEntityMutation } from './use-entity-mutation';

type CreateAccountDialogProps = {
  account?: AccountSummary;
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>['onCloseAutoFocus'];
  onOpenChange?: (open: boolean) => void;
  onSuccessCallback?: (account: { id: string; name: string }) => void;
  open?: boolean;
  trigger?: React.ReactNode;
};

function CreateAccountDialog({
  account,
  onCloseAutoFocus,
  onOpenChange,
  onSuccessCallback,
  open: controlledOpen,
  trigger,
}: CreateAccountDialogProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;

  const setOpen = (value: boolean) => {
    setLocalOpen(value);
    onOpenChange?.(value);
  };

  const { data: currencies } = useCurrencies();
  const { data: settings } = useSettings();

  const form = useForm<AccountFormValues>({
    defaultValues: accountDefaults(account, settings?.primaryCurrency ?? 'EUR'),
    resolver: zodResolver(accountFormSchema),
    values: account && accountDefaults(account, account.currency),
  });

  const { isPending, mutate } = useEntityMutation({
    errorMessage: 'Error saving account',
    mutationFn: (values: AccountFormValues) => saveAccount(account, values),
    onSuccess: data => {
      form.reset();
      onSuccessCallback?.(data);
      setOpen(false);
    },
    successMessage: data => `Account ${data.name} saved`,
  });

  const submit = form.handleSubmit(values => mutate(values));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && <Trigger trigger={trigger} onClick={() => setOpen(true)} />}
      <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <DialogTitle>{account ? 'Edit account' : 'Create new account'}</DialogTitle>
        <DialogDescription>
          Each account has one currency. Credit cards and loans are liabilities: money you owe.
        </DialogDescription>
        <Form {...form}>
          <FormStack onSubmit={submit}>
            <AccountFormFields
              control={form.control}
              account={account}
              currencies={currencies ?? []}
            />
          </FormStack>
        </Form>
        <DialogFormFooter
          isPending={isPending}
          submitLabel={saveLabel(!!account)}
          onCancel={() => form.reset()}
          onSubmit={submit}
        />
      </DialogContent>
    </Dialog>
  );
}

function Trigger({ onClick, trigger }: { onClick: () => void; trigger?: React.ReactNode }) {
  if (trigger) return <DialogTrigger asChild>{trigger}</DialogTrigger>;

  return <CreateNewTrigger onClick={onClick} />;
}

export default CreateAccountDialog;
