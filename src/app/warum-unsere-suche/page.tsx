'use client';

import { Container, Title, Text, Stack, SimpleGrid, Center } from '@mantine/core';
import { IconSearch, IconBrain, IconZoomCheck, IconLetterCase } from '@tabler/icons-react';
import SearchFeatureCard from './components/SearchFeatureCard';
import SearchExample from './components/SearchExample';
import ComparisonTable from './components/ComparisonTable';

export default function WarumUnsereSuchePage() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Hero Section */}
        <Center>
          <Stack align="center" gap="md" maw={700}>
            <IconSearch size={64} stroke={1.5} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Title order={1} ta="center" size="h1">
              Warum unsere Suche anders ist
            </Title>
            <Text size="lg" ta="center" c="dimmed">
              Drei intelligente Suchtechnologien arbeiten zusammen, damit Sie immer finden was Sie suchen
            </Text>
          </Stack>
        </Center>

        {/* Feature Cards */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          <SearchFeatureCard
            icon={<IconZoomCheck size={40} />}
            title="Volltext-Suche"
            subtitle="Bereits aktiv"
            description="Findet Dokumente durch intelligente Wort-Analyse mit deutscher Sprachoptimierung"
            benefits={[
              'Erkennt Wortformen (Rechnung/Rechnungen)',
              'Toleriert Tippfehler',
              'Stoppt bei Wortgrenzen',
              'Optimiert für deutsche Sprache'
            ]}
            color="blue"
          />
          <SearchFeatureCard
            icon={<IconLetterCase size={40} />}
            title="Trigram-Suche"
            subtitle="Bereits aktiv"
            description="Findet Dokumente auch bei Teil-Übereinstimmungen innerhalb von Wörtern"
            benefits={[
              'Findet Wortteile ("rest" findet "Restaurant")',
              'Ideal für Teil-Namen',
              'Funktioniert auch bei Zusammensetzungen',
              'Keine Wortgrenzen nötig'
            ]}
            color="green"
          />
          <SearchFeatureCard
            icon={<IconBrain size={40} />}
            title="Semantische Suche"
            subtitle="Bald verfügbar"
            description="Versteht die Bedeutung Ihrer Suchanfrage und findet ähnliche Inhalte durch KI"
            benefits={[
              'Versteht Zusammenhänge',
              'Findet ähnliche Begriffe',
              'KI-gestützte Bedeutungssuche',
              'Noch präzisere Ergebnisse'
            ]}
            color="violet"
            comingSoon
          />
        </SimpleGrid>

        {/* Why all three? */}
        <Stack gap="md" mt="xl">
          <Title order={2} ta="center">
            Warum drei verschiedene Suchtechnologien?
          </Title>
          <Text ta="center" c="dimmed" maw={800} mx="auto" size="lg">
            Jede Technologie hat ihre Stärken. Zusammen decken sie jeden Suchfall ab und stellen sicher,
            dass Sie immer finden was Sie suchen – egal wie Sie danach suchen!
          </Text>
        </Stack>

        {/* What's the difference? */}
        <Stack gap="md" mt="xl">
          <Title order={2} ta="center">
            Was ist der Unterschied?
          </Title>
          <Text ta="center" c="dimmed" maw={700} mx="auto">
            Alle drei Suchtechnologien ergänzen sich perfekt für die beste Sucherfahrung
          </Text>
          <ComparisonTable />
        </Stack>

        {/* Interactive Examples */}
        <Stack gap="md" mt="xl">
          <Title order={2} ta="center">
            Sehen Sie den Unterschied
          </Title>
          <Text ta="center" c="dimmed" maw={700} mx="auto">
            Praktische Beispiele aus dem Geschäftsalltag
          </Text>
          <SearchExample />
        </Stack>
      </Stack>
    </Container>
  );
}
