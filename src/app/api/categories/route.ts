import { handle, param } from '@/server/http';
export const GET = handle(({ userId, services, request }) =>
  services.categories.tree(userId, { includeArchived: param(request, 'includeArchived') === '1' })
);
