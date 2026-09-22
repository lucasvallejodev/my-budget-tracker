import { handle, param } from '@/server/http';
export const GET = handle(({ userId, services, request }) =>
  services.budgets.list(userId, param(request, 'month') ?? new Date().toISOString().slice(0, 7))
);
