import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getServices } from '../services';

/**
 * Resolves the signed-in Clerk user, makes sure their settings and default categories exist,
 * and returns the user id together with the service layer.
 */
export async function requireUser() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const services = getServices();
  await services.bootstrap(userId);
  return { userId, services };
}
