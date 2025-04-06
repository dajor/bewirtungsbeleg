'use client';

import { Container, Title, Text, Paper, Stack, Button } from '@mantine/core';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ReleaseNotes() {
  const [releaseNotes, setReleaseNotes] = useState<string>('');

  useEffect(() => {
    fetch('/release-notes.txt')
      .then(response => response.text())
      .then(text => setReleaseNotes(text))
      .catch(error => console.error('Fehler beim Laden der Release Notes:', error));
  }, []);

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Title order={1}>Release Notes</Title>
        
        <Button
          component={Link}
          href="/"
          variant="light"
          color="gray"
          w="fit-content"
        >
          Zurück zur Startseite
        </Button>

        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
            {releaseNotes || 'Lade Release Notes...'}
          </pre>
        </Paper>
      </Stack>
    </Container>
  );
} 