'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import s from '@/components/shell/shell.module.scss';

export default function UserProfile() {
  const { user } = useUser();

  return (
    <div className={s.profile}>
      <UserButton />
      <div>
        <strong>{user?.fullName || 'Your account'}</strong>
        <p>{user?.primaryEmailAddress?.emailAddress}</p>
      </div>
    </div>
  );
}
