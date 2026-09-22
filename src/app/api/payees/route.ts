import { handle } from '@/server/http';
export const GET = handle(({ userId, services }) => services.payees.list(userId));
