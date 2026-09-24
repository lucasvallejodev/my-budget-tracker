'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { updateProfile } from '@/api/mutations';
import { Button, Form, FormStack, TextField } from '@/components/ui';
import { updateProfileSchema, type UpdateProfileValues } from '@coinkeeper/shared/schema/auth';

import { QueryKeys, type User } from '../use-finance-data';

export function ProfileForm({ user }: { user: User }) {
  const queryClient = useQueryClient();

  const form = useForm<UpdateProfileValues>({
    defaultValues: { email: user.email, name: user.name ?? '' },
    resolver: zodResolver(updateProfileSchema),
  });

  const save = useMutation({
    mutationFn: updateProfile,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: updated => {
      queryClient.setQueryData(QueryKeys.me, updated);
      form.reset({ email: updated.email, name: updated.name ?? '' });
      toast.success('Profile saved');
    },
  });

  return (
    <Form {...form}>
      <FormStack onSubmit={form.handleSubmit(values => save.mutate(values))}>
        <TextField
          control={form.control}
          name="name"
          label="Name"
          autoComplete="name"
          description="Shown in the account menu."
        />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          description="You sign in with this address."
        />
        <Button type="submit" disabled={save.isPending || !form.formState.isDirty}>
          Save profile
        </Button>
      </FormStack>
    </Form>
  );
}
