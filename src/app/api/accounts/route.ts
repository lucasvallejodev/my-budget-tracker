import { getUserOrRedirect } from '@/lib/auth';
import { getRepository } from '@/db/queries';
export async function GET() {
  const user = await getUserOrRedirect();
  return Response.json(await getRepository().listAccounts(user.id));
}
