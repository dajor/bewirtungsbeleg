import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import './globals.css';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { theme } from './theme';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DocBits Bewirtungsbeleg App',
  description: 'Erstellen Sie einfach und schnell Bewirtungsbelege',
  icons: {
    icon: [
      { url: '/LOGO.svg', type: 'image/svg+xml' },
      { url: '/LOGO-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/LOGO-512.png', type: 'image/png', sizes: '512x512' }
    ],
    apple: [
      { url: '/LOGO-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/LOGO-512.png', type: 'image/png', sizes: '512x512' }
    ],
    shortcut: [
      { url: '/LOGO-192.png', type: 'image/png' }
    ]
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <ColorSchemeScript />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/LOGO.svg" />
        <link rel="icon" type="image/png" sizes="192x192" href="/LOGO-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/LOGO-512.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/LOGO-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/LOGO-512.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <MantineProvider theme={theme}>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
