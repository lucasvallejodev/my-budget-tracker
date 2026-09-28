import { z } from 'zod';

export const livenessSchema = z.object({ status: z.literal('ok') });

export type Liveness = z.infer<typeof livenessSchema>;

export const readinessSchema = z.object({ database: z.literal('ok'), status: z.literal('ok') });

export type Readiness = z.infer<typeof readinessSchema>;
