import './globals.scss';

import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import { Toaster } from 'sonner';

import RootProvider from '@/providers/root-provider';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  description: 'Track your budget with ease',
  title: 'CoinKeeper',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable}`}>
        <ClerkProvider>
          <RootProvider>
            <Toaster richColors position="bottom-right" />
            {children}
          </RootProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
