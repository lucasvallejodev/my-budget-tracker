import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

const REDIRECT_PATH = '/sign-in';

export async function withAuth(redirectPath = REDIRECT_PATH) {
  const user = await currentUser();

  if (!user) {
    redirect(redirectPath);
  }

  return { user };
}
