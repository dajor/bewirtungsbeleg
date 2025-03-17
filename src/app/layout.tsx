import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import './globals.css';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { theme } from './theme';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bewirtungsbeleg App',
  description: 'Erstellen Sie einfach und schnell Bewirtungsbelege',
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
      </head>
      <body className={inter.className}>
        <MantineProvider theme={theme}>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
