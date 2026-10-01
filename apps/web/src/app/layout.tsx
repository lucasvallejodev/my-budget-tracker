import './globals.scss';

import type { Metadata } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import { Toaster } from 'sonner';

import RootProvider from '@/providers/root-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
});

export const metadata: Metadata = {
  description: 'Track your budget with ease',
  title: 'CoinKeeper',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body>
        <RootProvider>
          <Toaster richColors position="bottom-right" />
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
