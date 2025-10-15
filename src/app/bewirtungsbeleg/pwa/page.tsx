'use client';

import { useEffect } from 'react';
import { Container, Stack, Title } from '@mantine/core';
import { isMobile } from 'react-device-detect';
import { useRouter } from 'next/navigation';

export default function BewirtungsbelegPWAPage() {
  const router = useRouter();

  // Redirect all users - mobile to scanner, desktop to main form
  useEffect(() => {
    if (isMobile) {
      // Redirect mobile users to the dedicated scanner page
      router.push('/scanner');
    } else {
      // Redirect desktop users to the main form
      router.push('/bewirtungsbeleg');
    }
  }, [router]);

  // Show loading state while redirecting
  return (
    <Container size="lg" py="xl">
      <Stack align="center">
        <Title order={2} align="center" mb="xl">
          Weiterleitung...
        </Title>
        <Title order={4} align="center" mb="xl">
          Sie werden zur entsprechenden Seite weitergeleitet.
        </Title>
        {/* Force rebuild to clear cached build artifacts - round 2 */}
      </Stack>
    </Container>
  );
}
