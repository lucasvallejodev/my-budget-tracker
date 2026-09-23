import './auth-screen.scss';

import { ReactNode } from 'react';

import { Logo } from '../logo';

export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <main className="auth-screen">
      <Logo />
      {children}
    </main>
  );
}
