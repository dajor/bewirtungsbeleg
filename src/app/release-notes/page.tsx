'use client';

import { Container, Title, Text, Paper, Stack, Button, Loader, Center, Image, Group, Avatar, Divider } from '@mantine/core';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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
        const sections = text.split('---\n\n');
        
        sections.forEach(section => {
          if (!section.trim()) return;
          
          const versionMatch = section.match(/# Version (.*)/);
          const dateMatch = section.match(/Datum: (.*)/);
          const buildMatch = section.match(/- Build: (.*)/);
          const commitMatch = section.match(/- Commit: (.*)/);
          
          if (versionMatch && dateMatch) {
            const changes = section
              .split('\n')
              .filter(line => line.startsWith('- ') && !line.includes('Build:') && !line.includes('Commit:'))
              .map(line => line.substring(2));
            
            notes.push({
              version: versionMatch[1],
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
            width={200}
            height={50}
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
          <Stack gap="xl">
            {releaseNotes.map((note, index) => (
              <Paper key={index} shadow="sm" p="xl" radius="md" withBorder>
                <Group align="flex-start" mb="md">
                  <Avatar 
                    src="https://github.com/dajor.png" 
                    alt="Daniel Jordan" 
                    size="lg"
                    radius="xl"
                  />
                  <Stack gap={0}>
                    <Title order={2} size="h3">Version {note.version}</Title>
                    <Text c="dimmed" size="sm">{note.date}</Text>
                  </Stack>
                </Group>
                
                <Stack gap="xs" mb="md">
                  {note.changes.map((change, i) => (
                    <Group key={i} gap="xs">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#228be6' }} />
                      <Text>{change}</Text>
                    </Group>
                  ))}
                </Stack>

                <Divider my="md" />

                <Group gap="xs">
                  <Text size="sm" c="dimmed">Build:</Text>
                  <Text size="sm">{note.build}</Text>
                  <Text size="sm" c="dimmed">Commit:</Text>
                  <Text size="sm">{note.commit}</Text>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
} 