import './globals.scss';

import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { Toaster } from 'sonner';

import RootProvider from '@/providers/root-provider';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  description: 'Track your budget with ease',
  title: 'CoinKeeper',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>
        <RootProvider>
          <Toaster richColors position="bottom-right" />
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
