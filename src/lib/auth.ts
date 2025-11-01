import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const getUserOrRedirect = async (redirectPath = '/sign-in') => {
  const user = await currentUser();

  if (!user) {
    redirect(redirectPath);
  }

  return user;
};
