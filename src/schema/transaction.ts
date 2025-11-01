import { z } from 'zod';

export const createTransactionSchema = z.object({
  amount: z.coerce.number().positive(),
  date: z.coerce.date(),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().min(1, 'Category is required'),
  accountId: z.string().min(1, 'Account is required'),
  description: z.string().optional(),
});

export type createTransactionSchemaType = z.infer<typeof createTransactionSchema>;
