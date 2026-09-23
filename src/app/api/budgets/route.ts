import { toIsoMonth } from '@/lib/date-helpers';
import { handle, param } from '@/server/http';

export const GET = handle(({ request, services, userId }) =>
  services.budgets.list(userId, param(request, 'month') ?? toIsoMonth(new Date()))
);
