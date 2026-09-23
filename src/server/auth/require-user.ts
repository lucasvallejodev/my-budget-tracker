import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { getServices } from '../services';

export const requireUser = async () => {
  const { userId } = await auth();

  if (!userId) redirect('/sign-in');
  const services = getServices();

  await services.bootstrap(userId);

  return { services, userId };
};
