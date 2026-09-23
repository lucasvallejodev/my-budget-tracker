import { currentUser, type User } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const getUserOrRedirect = async (redirectPath = '/sign-in'): Promise<User> => {
  const user = await currentUser();

  if (!user) redirect(redirectPath);

  return user;
};
