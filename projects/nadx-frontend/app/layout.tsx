import { LayoutProvider } from '@/components/layout';
import { Analytics } from '@vercel/analytics/next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import './globals.css';
import WalletProvider from '@/components/WalletProvider';

export const metadata: Metadata = {
  title: 'NADX - Prediction Platform',
  description: 'Advanced prediction platform for cryptocurrency markets',
  generator: 'v0.app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <WalletProvider>
          <LayoutProvider>{children}</LayoutProvider>
        </WalletProvider>
        <Analytics />
      </body>
    </html>
  );
}
