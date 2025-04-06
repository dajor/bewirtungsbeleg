'use client';

import { Container, Title, Text, Paper, Stack, Button, Loader, Center, Image, Group, Avatar, Timeline } from '@mantine/core';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IconGitCommit } from '@tabler/icons-react';

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
        const response = await fetch('/release-notes.txt');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        if (!text.trim()) {
          throw new Error('Release Notes sind leer');
        }

        // Parse die Release Notes
        const notes: ReleaseNote[] = [];
        const versions = text.split('# Version ').filter(Boolean);
        
        versions.forEach(version => {
          const lines = version.split('\n').filter(Boolean);
          const versionNumber = lines[0].trim();
          const dateMatch = lines.find(line => line.startsWith('Datum:'))?.match(/Datum: (.*)/);
          const buildMatch = lines.find(line => line.includes('Build:'))?.match(/- Build: (.*)/);
          const commitMatch = lines.find(line => line.includes('Commit:'))?.match(/- Commit: (.*)/);
          
          const changes = lines
            .filter(line => 
              line.startsWith('-') && 
              !line.includes('Build:') && 
              !line.includes('Commit:') &&
              !line.includes('Technische Details')
            )
            .map(line => line.substring(2).trim());
          
          if (versionNumber && dateMatch) {
            notes.push({
              version: versionNumber,
              date: dateMatch[1],
              changes,
              build: buildMatch?.[1] || '',
              commit: commitMatch?.[1] || ''
            });
          }
        });

        setReleaseNotes(notes);
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
        <Stack align="center" mb="xl">
          <Image
            src="/docbits.svg"
            alt="DocBits Logo"
            width={100}
            height={25}
            fit="contain"
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
          <Timeline active={-1} bulletSize={32} lineWidth={2}>
            {releaseNotes.map((note, index) => (
              <Timeline.Item
                key={index}
                bullet={
                  <Avatar 
                    src="https://github.com/dajor.png" 
                    alt="Daniel Jordan"
                    size={32}
                    radius="xl"
                  />
                }
                title={
                  <Group gap="xs">
                    <Title order={2} size="h4">Version {note.version}</Title>
                    <Text size="sm" c="dimmed">({note.date})</Text>
                  </Group>
                }
              >
                <Stack gap="xs" mt="xs">
                  {note.changes.map((change, i) => (
                    <Group key={i} gap="xs" align="flex-start">
                      <IconGitCommit size={16} style={{ marginTop: 4 }} />
                      <Text size="sm">{change}</Text>
                    </Group>
                  ))}
                  
                  <Group gap="lg" mt="sm">
                    <Text size="xs" c="dimmed">Build: {note.build}</Text>
                    <Text size="xs" c="dimmed">Commit: {note.commit}</Text>
                  </Group>
                </Stack>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Stack>
    </Container>
  );
} 