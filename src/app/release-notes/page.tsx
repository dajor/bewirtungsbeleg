'use client';

import { Container, Title, Text, Paper, Stack, Button, Loader, Center, Image, Group, Avatar } from '@mantine/core';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IconGitCommit } from '@tabler/icons-react';
import { Chrono } from 'react-chrono';

interface ReleaseNote {
  version: string;
  date: string;
  changes: string[];
  build: string;
  commit: string;
}

export default function ReleaseNotes() {
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadReleaseNotes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/release-notes.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data.versions || !Array.isArray(data.versions)) {
          throw new Error('Ungültiges Format der Release Notes');
        }

        setReleaseNotes(data.versions);
      } catch (error) {
        console.error('Fehler beim Laden der Release Notes:', error);
        setError('Release Notes konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };

    loadReleaseNotes();
  }, []);

  const items = releaseNotes.map(note => ({
    title: `Version ${note.version}`,
    cardTitle: `Version ${note.version}`,
    cardSubtitle: note.date,
    cardDetailedText: (
      <Stack gap="xs">
        {note.changes.map((change, i) => (
          <Group key={i} gap="xs" align="flex-start">
            <IconGitCommit size={16} />
            <Text>{change}</Text>
          </Group>
        ))}
        <Text size="sm" c="dimmed" mt="xs">
          Build: {note.build} | Commit: {note.commit.substring(0, 7)}
        </Text>
      </Stack>
    ),
    icon: (
      <Avatar 
        src="https://github.com/dajor.png" 
        alt="Daniel Jordan"
        size={32}
        radius="xl"
      />
    )
  }));

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Stack align="center" mb="xl">
          <Image
            src="/docbits.svg"
            alt="DocBits Logo"
            width={200}
            height={50}
            fit="contain"
            style={{ maxWidth: '200px', height: '50px' }}
          />
          <Title order={1}>Release Notes</Title>
        </Stack>
        
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
          <div style={{ width: '100%', height: '500px' }}>
            <Chrono
              items={items}
              mode="VERTICAL_ALTERNATING"
              theme={{
                primary: '#4486AA',
                secondary: '#f8fafc',
                cardBgColor: '#ffffff',
                cardForeColor: '#1a1a1a',
                titleColor: '#4486AA',
                titleColorActive: '#2B5C78',
              }}
              cardHeight={200}
              slideShow
              slideItemDuration={3000}
              enableOutline
              hideControls={false}
              useReadMore={false}
            />
          </div>
        )}
      </Stack>
    </Container>
  );
}