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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createPayeeAction } from '../actions';
import { PayeeResponseType } from '../_types/payees';
import { createPayeeSchema, CreatePayeeSchemaType } from '@/schema/payees';

type CreatePayeeDialogProps = {
  onSuccessCallback?: (payee: PayeeResponseType) => void;
};

function CreatePayeeDialog({ onSuccessCallback }: CreatePayeeDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<CreatePayeeSchemaType>({
    resolver: zodResolver(createPayeeSchema),
  });

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createPayeeAction,
    onSuccess: async (data: any) => {
      toast.success(`Payee ${data.name} created successfully`, {
        id: 'create-payee',
      });

      await queryClient.invalidateQueries({
        queryKey: ['payees'],
      });

      form.reset();
      onSuccessCallback?.(data);
      setOpen(false);
    },
    onError: error => {
      console.error(error);
      toast.error('Error creating payee', {
        id: 'create-payee',
      });
    },
  });

  const onSubmit = useCallback(
    (values: CreatePayeeSchemaType) => {
      toast.loading('Creating payee...', {
        id: 'create-payee',
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
        <DialogTitle>Create new Payee</DialogTitle>
        <DialogDescription>
          Payee are used to manage your finances. You can create a new account for your
          transactions.
        </DialogDescription>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input defaultValue={''} type="text" placeholder="Payee name" {...field} />
                  </FormControl>
                  <FormDescription>The name of the payee.</FormDescription>
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

export default CreatePayeeDialog;
