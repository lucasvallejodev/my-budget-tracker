import { z } from 'zod';

import { FieldLengths } from '../constants/field-lengths';
import { deletedQuerySchema } from './common';
import { TransactionDirectionValues } from './enums';

export const MAX_TEMPLATES_PER_USER = 50;

export const TemplateKindValues = ['standard', 'transfer'] as const;

export type TemplateKind = (typeof TemplateKindValues)[number];

export const TemplateUnavailableReasonValues = [
  'account_archived',
  'category_archived',
  'transfer_account_archived',
] as const;

export type TemplateUnavailableReason = (typeof TemplateUnavailableReasonValues)[number];

const optionalId = z.string().optional();

export const templateFormSchema = z.object({
  accountId: optionalId,
  amount: z.string().trim().max(FieldLengths.amountInput).optional(),
  categoryId: optionalId,
  direction: z.enum(TransactionDirectionValues),
  kind: z.enum(TemplateKindValues),
  memo: z.string().max(FieldLengths.memo).optional(),
  name: z.string().trim().min(1, 'Name is required').max(FieldLengths.templateName),
  payeeId: optionalId,
  transferAccountId: optionalId,
});

export type TemplateFormValues = z.infer<typeof templateFormSchema>;

export const templateRowSchema = z.object({
  accountId: z.string().nullable(),
  amountMinor: z.number().int().nullable(),
  categoryId: z.string().nullable(),
  currency: z.string().nullable(),
  deletedAt: z.string().nullable(),
  direction: z.enum(TransactionDirectionValues),
  id: z.string(),
  kind: z.enum(TemplateKindValues),
  lastUsedAt: z.string().nullable(),
  memo: z.string(),
  name: z.string(),
  payeeId: z.string().nullable(),
  sortOrder: z.number().int(),
  transferAccountId: z.string().nullable(),
  unavailableReason: z.enum(TemplateUnavailableReasonValues).nullable(),
});

export type TemplateRow = z.infer<typeof templateRowSchema>;

export const templateListQuerySchema = deletedQuerySchema;
