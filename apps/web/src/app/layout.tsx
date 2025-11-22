import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import '../styles/globals.css';
import { TRPCProvider } from '@/lib/trpc/Provider';
import { ThemeProvider } from '@/lib/providers/ThemeProvider';

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'DoubleCheck - Film Production Management',
  description: 'Modern film production management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.className}>
        <ThemeProvider>
          <TRPCProvider>{children}</TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

