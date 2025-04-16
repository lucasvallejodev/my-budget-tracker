import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import RootProvider from "@/components/providers/RootProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Budget Tracker",
  description: "Track your budget with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RootProvider>
      <ClerkProvider>
        <html
          lang="en"
          className="dark"
          style={{
            colorScheme: "dark",
          }}
        >
          <body className={`${geistSans.variable} ${geistMono.variable}`}>
            <Toaster richColors position="bottom-right" />
            {children}
          </body>
        </html>
      </ClerkProvider>
    </RootProvider>
  );
}
