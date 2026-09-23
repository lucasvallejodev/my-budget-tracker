'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useRefreshFinance } from './use-finance-data';

type EntityMutationOptions<TVariables, TData> = {
  errorMessage?: string;
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData) => void | Promise<void>;
  successMessage: string | ((data: TData) => string);
};

export function useEntityMutation<TVariables, TData>({
  errorMessage,
  mutationFn,
  onSuccess,
  successMessage,
}: EntityMutationOptions<TVariables, TData>) {
  const invalidate = useRefreshFinance();

  return useMutation({
    mutationFn,
    onError: (error: Error) => toast.error(error.message || errorMessage || 'Something went wrong'),
    onSuccess: async (data: TData) => {
      toast.success(typeof successMessage === 'function' ? successMessage(data) : successMessage);
      await invalidate();
      await onSuccess?.(data);
    },
  });
}
