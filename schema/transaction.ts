import { date, z } from "zod";

export const createTransactionSchema = z.object({
  amount: z.coerce.number().positive().multipleOf(0.01),
  description: z.string().optional(),
  date: z.coerce.date(),
  category: z.string(),
  type: z.enum(["income", "expense"]),
});

export type createTransactionSchemaType = z.infer<typeof createTransactionSchema>;