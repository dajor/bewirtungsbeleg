'use client';

import { AppShell } from '@mantine/core';
import { Header } from './Header';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell header={{ height: 60 }} padding={0}>
      <Header />
      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
