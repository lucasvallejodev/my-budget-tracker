import { z } from 'zod';
import { ICON_NAMES } from '@/components/icons/registry';

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Choose a colour');

export const categoryGroupFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50),
  kind: z.enum(['income', 'expense']),
  color: hexColor,
});
export type CategoryGroupFormValues = z.infer<typeof categoryGroupFormSchema>;

export const categoryFormSchema = z.object({
  groupId: z.string().min(1, 'Choose a group'),
  name: z.string().trim().min(1, 'Name is required').max(50),
  icon: z.enum(ICON_NAMES),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
