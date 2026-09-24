import { z } from 'zod';

import { MAX_PAGE_SIZE } from '../constants/pagination';
import { Patterns } from '../lib/patterns';

export const idParamsSchema = z.object({ id: z.uuid() });

export type IdParams = z.infer<typeof idParamsSchema>;

export const isoDateSchema = z.string().regex(Patterns.isoDate, 'Use YYYY-MM-DD');

export const isoMonthSchema = z.string().regex(Patterns.isoMonth, 'Use YYYY-MM');

export const orderSchema = z.object({ ids: z.array(z.uuid()).min(1) });

export type OrderValues = z.infer<typeof orderSchema>;

export const includeArchivedQuerySchema = z.object({
  includeArchived: z.stringbool().optional(),
});

export const deletedQuerySchema = z.object({ deleted: z.stringbool().optional() });

export const pageSizeSchema = z.coerce.number().int().min(1).max(MAX_PAGE_SIZE);

export const listOf = <Item extends z.ZodType>(item: Item) => z.object({ items: z.array(item) });

export const pageOf = <Item extends z.ZodType>(item: Item) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() });

export type ListResponse<Item> = { items: Item[] };

export type PageResponse<Item> = {
  items: Item[];
  nextCursor: string | null;
};

export const ErrorCodeValues = [
  'CONFLICT',
  'EMAIL_TAKEN',
  'FORBIDDEN',
  'INTERNAL',
  'INVALID_CREDENTIALS',
  'INVALID_REQUEST',
  'NOT_FOUND',
  'ORIGIN_NOT_ALLOWED',
  'RATE_LIMITED',
  'RULE_VIOLATION',
  'UNAUTHENTICATED',
] as const;

export type ErrorCode = (typeof ErrorCodeValues)[number];

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.enum(ErrorCodeValues),
    fields: z.record(z.string(), z.string()).optional(),
    message: z.string(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
