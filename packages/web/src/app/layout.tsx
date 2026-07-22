import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Quick Rider GH — Admin Dashboard',
  description: 'Manage your Quick Rider GH platform',
  icons: { icon: '/favicon.ico' },
  manifest: '/manifest.json',
  themeColor: '#166534',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#166534" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }` }} />
      </body>
    </html>
  );
}
