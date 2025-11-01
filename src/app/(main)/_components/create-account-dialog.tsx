'use client';

import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Loader2, PlusSquareIcon } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createAccountSchema, CreateAccountSchemaType } from '@/schema/accounts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createAccountAction } from '../actions';
import { AccountResponseType } from '../_types/accounts';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { accountTypes } from '@/constants/account';

type CreateAccountDialogProps = {
  onSuccessCallback?: (account: AccountResponseType) => void;
};

function CreateAccountDialog({ onSuccessCallback }: CreateAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateAccountSchemaType>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      type: 'CHECKING',
    },
  });

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createAccountAction,
    onSuccess: async (data: any) => {
      toast.success(`Account ${data.name} created successfully`, {
        id: 'create-account',
      });

      await queryClient.invalidateQueries({
        queryKey: ['accounts'],
      });

      form.reset();
      onSuccessCallback?.(data);
      setOpen(false);
    },
    onError: error => {
      console.error(error);
      toast.error('Error creating account', {
        id: 'create-account',
      });
    },
  });

  const onSubmit = useCallback(
    (values: CreateAccountSchemaType) => {
      toast.loading('Creating account...', {
        id: 'create-account',
      });
      mutate(values);
    },
    [mutate]
  );

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
      <DialogContent>
        <DialogTitle>Create new Account</DialogTitle>
        <DialogDescription>
          Accounts are used to manage your finances. You can create a new account for your
          transactions.
        </DialogDescription>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <FormControl>
                    <Select
                      {...field}
                      onValueChange={(value: CreateAccountSchemaType['type']) =>
                        form.setValue('type', value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Account Types</SelectLabel>
                          {accountTypes.map(accountType => (
                            <SelectItem key={accountType.value} value={accountType.value}>
                              {accountType.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>The type of the account.</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input defaultValue={''} type="text" placeholder="Account name" {...field} />
                  </FormControl>
                  <FormDescription>The name of the account.</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input defaultValue={''} type="text" placeholder="Account number" {...field} />
                  </FormControl>
                  <FormDescription>The account number could be the last 4 digits.</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <FormControl>
                    <Input
                      defaultValue={''}
                      type="text"
                      placeholder="Institution name"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>The name of the institution.</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input defaultValue={''} type="text" placeholder="Account notes" {...field} />
                  </FormControl>
                  <FormDescription>
                    Any information you want to remember about this account.
                  </FormDescription>
                </FormItem>
              )}
            />
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
            {isPending ? <Loader2 className="animate-sping" /> : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateAccountDialog;
