import { z } from 'zod';

export const createPayeeSchema = z.object({
  name: z.string().min(1).max(50),
  categoryId: z.string().max(50).optional(),
});

export const createPayeeWithUserSchema = createPayeeSchema.extend({
  userId: z.string().uuid(),
});

export type CreatePayeeSchemaType = z.infer<typeof createPayeeSchema>;
export type CreatePayeeWithUserSchemaType = z.infer<typeof createPayeeWithUserSchema>;
