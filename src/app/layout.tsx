import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import RootProvider from '@/components/providers/RootProvider';
import { Toaster } from 'sonner';

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CoinKeeper',
  description: 'Track your budget with ease',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
