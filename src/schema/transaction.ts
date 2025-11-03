import { z } from 'zod';

export const createTransactionSchema = z.object({
  amount: z.coerce.number().positive(),
  date: z.coerce.date(),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().min(1, 'Category is required'),
  categoryGroupId: z.string().min(1, 'Category group is required'),
  payeeId: z.string().max(50).optional(),
  accountId: z.string().min(1, 'Account is required'),
  description: z.string().optional(),
});

export const createPayeeWithUserSchema = createTransactionSchema.extend({
  userId: z.string().uuid(),
});

export type createTransactionSchemaType = z.infer<typeof createTransactionSchema>;
export type createTransactionWithUserSchemaType = z.infer<typeof createPayeeWithUserSchema>;
