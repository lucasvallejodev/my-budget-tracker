'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { FinanceKeys } from '@/components/finance';

type EntityMutationOptions<TVariables, TData> = {
  errorMessage?: string;
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData) => void | Promise<void>;
  successMessage: string | ((data: TData) => string);
};

function useInvalidateFinance() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all(FinanceKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
}

export function useEntityMutation<TVariables, TData>({
  errorMessage,
  mutationFn,
  onSuccess,
  successMessage,
}: EntityMutationOptions<TVariables, TData>) {
  const invalidate = useInvalidateFinance();

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
