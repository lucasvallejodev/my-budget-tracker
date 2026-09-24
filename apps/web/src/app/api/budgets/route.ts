import { handle, param } from '@/server/http';
import { toIsoMonth } from '@coinkeeper/shared/lib/date-helpers';

export const GET = handle(({ request, services, userId }) =>
  services.budgets.list(userId, param(request, 'month') ?? toIsoMonth(new Date()))
);
