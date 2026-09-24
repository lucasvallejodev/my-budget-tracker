import { z } from 'zod';

import { errorResponseSchema } from '@coinkeeper/shared/schema/common';

export const noContent = z.undefined().describe('No content');

export const withErrors = <Success extends Record<number, z.ZodType>>(success: Success) => ({
  ...success,
  '4xx': errorResponseSchema,
  '5xx': errorResponseSchema,
});
