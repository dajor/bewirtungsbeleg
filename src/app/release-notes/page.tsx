'use client';

import { Container, Title, Text, Paper, Stack, Button, Loader, Center } from '@mantine/core';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ReleaseNotes() {
  const [releaseNotes, setReleaseNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadReleaseNotes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/release-notes.txt');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        if (!text.trim()) {
          throw new Error('Release Notes sind leer');
        }
        setReleaseNotes(text);
      } catch (error) {
        console.error('Fehler beim Laden der Release Notes:', error);
        setError('Release Notes konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };

    loadReleaseNotes();
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

        {loading ? (
          <Center>
            <Loader size="xl" />
          </Center>
        ) : error ? (
          <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Text c="red" ta="center">{error}</Text>
          </Paper>
        ) : (
          <Paper shadow="sm" p="xl" radius="md" withBorder>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {releaseNotes}
            </pre>
          </Paper>
        )}
      </Stack>
    </Container>
  );
} 