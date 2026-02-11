import type { Metadata, Viewport } from 'next';
import { Space_Grotesk } from 'next/font/google';
import '../styles/globals.css';
import { ThemeProvider } from '@/lib/providers/ThemeProvider';
import { SidebarProvider } from '@/lib/contexts/SidebarContext';

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: 'DoubleCheck - Film Production Management',
  description: 'Modern film production management platform',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DoubleCheck',
  },
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
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

