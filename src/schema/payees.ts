import { z } from 'zod';

export const payeeFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  defaultCategoryId: z.string().optional(),
});
export type PayeeFormValues = z.infer<typeof payeeFormSchema>;

export const updatePayeeSchema = payeeFormSchema.partial().extend({ id: z.string().min(1) });
