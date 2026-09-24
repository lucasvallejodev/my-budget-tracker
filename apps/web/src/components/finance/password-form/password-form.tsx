'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { changePassword } from '@/api/mutations';
import { Button, Form, FormStack, TextField } from '@/components/ui';
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from '@coinkeeper/shared/schema/auth';

import { QueryKeys } from '../use-finance-data';

const EmptyPasswords: ChangePasswordFormValues = {
  confirmPassword: '',
  currentPassword: '',
  newPassword: '',
};

export function PasswordForm() {
  const queryClient = useQueryClient();

  const form = useForm<ChangePasswordFormValues>({
    defaultValues: EmptyPasswords,
    resolver: zodResolver(changePasswordFormSchema),
  });

  const save = useMutation({
    mutationFn: ({ confirmPassword, ...values }: ChangePasswordFormValues) =>
      changePassword(values),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      form.reset(EmptyPasswords);
      toast.success('Password changed. Other devices were signed out.');
      await queryClient.invalidateQueries({ queryKey: QueryKeys.sessions });
    },
  });

  return (
    <Form {...form}>
      <FormStack onSubmit={form.handleSubmit(values => save.mutate(values))}>
        <TextField
          control={form.control}
          name="currentPassword"
          label="Current password"
          type="password"
          autoComplete="current-password"
          description=""
        />
        <TextField
          control={form.control}
          name="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          description="At least 12 characters."
        />
        <TextField
          control={form.control}
          name="confirmPassword"
          label="Repeat the new password"
          type="password"
          autoComplete="new-password"
          description=""
        />
        <Button type="submit" disabled={save.isPending}>
          Change password
        </Button>
      </FormStack>
    </Form>
  );
}
