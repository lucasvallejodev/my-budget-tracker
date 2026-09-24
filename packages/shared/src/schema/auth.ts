import { z } from 'zod';

import { FieldLengths } from '../constants/field-lengths';

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(FieldLengths.email)
  .pipe(z.email('Enter a valid email address'));

const newPasswordSchema = z
  .string()
  .min(FieldLengths.passwordMin, `Use at least ${FieldLengths.passwordMin} characters`)
  .max(FieldLengths.passwordMax, `Use at most ${FieldLengths.passwordMax} characters`);

const personNameSchema = z.string().trim().max(FieldLengths.personName);

export const signUpSchema = z.object({
  email: emailSchema,
  name: personNameSchema.optional(),
  password: newPasswordSchema,
});

export type SignUpValues = z.input<typeof signUpSchema>;

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password').max(FieldLengths.passwordMax),
});

export type SignInValues = z.input<typeof signInSchema>;

export const updateProfileSchema = z.object({
  email: emailSchema.optional(),
  name: personNameSchema.nullable().optional(),
});

export type UpdateProfileValues = z.input<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password').max(FieldLengths.passwordMax),
  newPassword: newPasswordSchema,
});

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const userSchema = z.object({
  createdAt: z.string(),
  email: z.string(),
  id: z.string(),
  name: z.string().nullable(),
});

export type User = z.infer<typeof userSchema>;

export const sessionSchema = z.object({
  createdAt: z.string(),
  current: z.boolean(),
  expiresAt: z.string(),
  id: z.string(),
  ipAddress: z.string().nullable(),
  lastUsedAt: z.string(),
  userAgent: z.string().nullable(),
});

export type Session = z.infer<typeof sessionSchema>;

const PasswordsDifferMessage = 'The passwords do not match';

export const signUpFormSchema = signUpSchema
  .extend({ confirmPassword: z.string() })
  .refine(values => values.password === values.confirmPassword, {
    message: PasswordsDifferMessage,
    path: ['confirmPassword'],
  });

export type SignUpFormValues = z.input<typeof signUpFormSchema>;

export const changePasswordFormSchema = changePasswordSchema
  .extend({ confirmPassword: z.string() })
  .refine(values => values.newPassword === values.confirmPassword, {
    message: PasswordsDifferMessage,
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.input<typeof changePasswordFormSchema>;
