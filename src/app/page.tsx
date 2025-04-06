'use client';

import { Button, Container, Title, Text, Stack, Grid, Paper, rem, Group, ThemeIcon, Image } from '@mantine/core';
import { IconReceipt, IconClock, IconDeviceMobile, IconCheck } from '@tabler/icons-react';
import Link from 'next/link';

export default function Home() {
  return (
    <Container size="lg" py="xl">
      {/* Logo */}
      <Stack align="center" mb={rem(48)}>
        <Image
          src="/docbits.svg"
          alt="DocBits Logo"
          width={200}
          height={50}
          fit="contain"
          style={{ maxWidth: '200px', height: '50px' }}
        />
      </Stack>

      {/* Hero Section */}
      <Stack gap={rem(32)} align="center" ta="center" mb={rem(64)}>
        <Title order={1} size={rem(48)} lh={1.2}>
          Bewirtungsbelege einfach erstellen
        </Title>
        <Text size="xl" c="dimmed" maw={rem(600)}>
          Erstellen Sie professionelle Bewirtungsbelege in wenigen Minuten. 
          Mit KI-gestützter Texterkennung und automatischer Datenextraktion.
        </Text>
        <Stack gap="md" align="center" ta="center">
          <Button 
            component={Link} 
            href="/bewirtungsbeleg" 
            size="lg" 
            radius="xl"
          >
            Jetzt Bewirtungsbeleg erstellen
          </Button>
          <Button
            component={Link}
            href="/release-notes.html"
            size="lg"
            radius="xl"
            variant="light"
            color="gray"
          >
            Release Notes anzeigen
          </Button>
        </Stack>
      </Stack>

      {/* Features Grid */}
      <Grid gutter="xl" mb={rem(64)}>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="sm" p="xl" radius="md" withBorder h="100%">
            <Stack gap="md" align="center" ta="center">
              <ThemeIcon size={rem(48)} radius="md" variant="light" color="blue">
                <IconReceipt size={rem(32)} />
              </ThemeIcon>
              <Title order={3}>Automatische Texterkennung</Title>
              <Text c="dimmed">
                Laden Sie einfach ein Foto Ihres Belegs hoch. Unsere KI extrahiert automatisch alle relevanten Daten.
              </Text>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="sm" p="xl" radius="md" withBorder h="100%">
            <Stack gap="md" align="center" ta="center">
              <ThemeIcon size={rem(48)} radius="md" variant="light" color="blue">
                <IconClock size={rem(32)} />
              </ThemeIcon>
              <Title order={3}>Zeitsparend</Title>
              <Text c="dimmed">
                Erstellen Sie Bewirtungsbelege in wenigen Minuten statt Stunden. 
                Keine manuelle Dateneingabe mehr nötig.
              </Text>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="sm" p="xl" radius="md" withBorder h="100%">
            <Stack gap="md" align="center" ta="center">
              <ThemeIcon size={rem(48)} radius="md" variant="light" color="blue">
                <IconDeviceMobile size={rem(32)} />
              </ThemeIcon>
              <Title order={3}>Mobile First</Title>
              <Text c="dimmed">
                Optimiert für mobile Geräte. Erstellen Sie Bewirtungsbelege direkt von Ihrem Smartphone aus.
              </Text>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Benefits Section */}
      <Paper shadow="sm" p="xl" radius="md" withBorder mb={rem(64)}>
        <Title order={2} ta="center" mb="xl">
          Warum ist ein Bewirtungsbeleg wichtig?
        </Title>
        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              <Group gap="sm">
                <ThemeIcon size={rem(24)} radius="md" variant="light" color="green">
                  <IconCheck size={rem(16)} />
                </ThemeIcon>
                <Text>Steuerliche Absetzbarkeit von Bewirtungskosten</Text>
              </Group>
              <Group gap="sm">
                <ThemeIcon size={rem(24)} radius="md" variant="light" color="green">
                  <IconCheck size={rem(16)} />
                </ThemeIcon>
                <Text>Nachweis der Geschäftsbeziehung</Text>
              </Group>
              <Group gap="sm">
                <ThemeIcon size={rem(24)} radius="md" variant="light" color="green">
                  <IconCheck size={rem(16)} />
                </ThemeIcon>
                <Text>Einhaltung der steuerlichen Vorschriften</Text>
              </Group>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              <Group gap="sm">
                <ThemeIcon size={rem(24)} radius="md" variant="light" color="green">
                  <IconCheck size={rem(16)} />
                </ThemeIcon>
                <Text>Professionelle Dokumentation</Text>
              </Group>
              <Group gap="sm">
                <ThemeIcon size={rem(24)} radius="md" variant="light" color="green">
                  <IconCheck size={rem(16)} />
                </ThemeIcon>
                <Text>Vereinfachte Buchhaltung</Text>
              </Group>
              <Group gap="sm">
                <ThemeIcon size={rem(24)} radius="md" variant="light" color="green">
                  <IconCheck size={rem(16)} />
                </ThemeIcon>
                <Text>Transparente Kostenaufstellung</Text>
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* CTA Section */}
      <Stack gap="md" align="center" ta="center">
        <Title order={2}>Bereit, Ihre Bewirtungsbelege zu digitalisieren?</Title>
        <Text size="lg" c="dimmed" maw={rem(600)}>
          Erstellen Sie jetzt Ihren ersten Bewirtungsbeleg und sparen Sie wertvolle Zeit.
        </Text>
        <Button 
          component={Link} 
          href="/bewirtungsbeleg" 
          size="lg" 
          radius="xl"
        >
          Bewirtungsbeleg erstellen
        </Button>
      </Stack>
    </Container>
  );
} 