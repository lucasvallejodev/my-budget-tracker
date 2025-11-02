import { z } from 'zod';

export const createTransactionSchema = z.object({
  amount: z.coerce.number().positive(),
  date: z.coerce.date(),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().min(1, 'Category is required'),
  payeeId: z.string().max(50).optional(),
  accountId: z.string().min(1, 'Account is required'),
  description: z.string().optional(),
});

export type createTransactionSchemaType = z.infer<typeof createTransactionSchema>;
