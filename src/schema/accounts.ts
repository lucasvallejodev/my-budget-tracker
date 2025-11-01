import { z } from 'zod';

export const createAccountSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'CASH', 'INVESTMENT', 'OTHER']),
  institution: z.string().max(50).optional(),
  accountNumber: z.string().max(20).optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
});

export const createAccountWithUserSchema = createAccountSchema.extend({
  userId: z.string().uuid(),
});

export type CreateAccountSchemaType = z.infer<typeof createAccountSchema>;
export type CreateAccountWithUserSchemaType = z.infer<typeof createAccountWithUserSchema>;
