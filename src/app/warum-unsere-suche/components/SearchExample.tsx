'use client';

import { Card, Stack, Text, Badge, SimpleGrid, Box, Tabs, Alert } from '@mantine/core';
import { IconSearch, IconCheck, IconX, IconInfoCircle } from '@tabler/icons-react';
import { useState } from 'react';

interface SearchResult {
  query: string;
  fulltextFinds: boolean;
  fulltextReason: string;
  trigramFinds: boolean;
  trigramReason: string;
  semanticFinds: boolean;
  semanticReason: string;
  document: string;
}

const searchExamples: SearchResult[] = [
  {
    query: 'Restaurant',
    fulltextFinds: true,
    fulltextReason: 'Findet ganzes Wort "Restaurant"',
    trigramFinds: true,
    trigramReason: 'Findet auch Teile wie "Restaurantbeleg", "Restaurant-Rechnung"',
    semanticFinds: true,
    semanticReason: 'Versteht auch "Gaststätte", "Gasthof", "Ristorante"',
    document: 'Restaurant Adler - Rechnung vom 15.03.2024',
  },
  {
    query: 'rest',
    fulltextFinds: false,
    fulltextReason: 'Sucht nach ganzem Wort "rest", findet nicht "Restaurant"',
    trigramFinds: true,
    trigramReason: 'Findet Wortteil "rest" in "Restaurant", "Restau­rant­beleg"',
    semanticFinds: false,
    semanticReason: 'Zu kurz für semantische Analyse',
    document: 'Restaurant Maritim - Geschäftsessen',
  },
  {
    query: 'Adl',
    fulltextFinds: false,
    fulltextReason: 'Kein ganzes Wort "Adl" vorhanden',
    trigramFinds: true,
    trigramReason: 'Findet Teiltreffer "Adl" in "Adler"',
    semanticFinds: false,
    semanticReason: 'Zu kurz für semantische Bedeutungssuche',
    document: 'Gasthof Adler - Übernachtung',
  },
  {
    query: 'Geschäftsessen',
    fulltextFinds: true,
    fulltextReason: 'Findet exaktes Wort "Geschäftsessen"',
    trigramFinds: true,
    trigramReason: 'Findet auch "Geschäfts-Essen" oder Varianten',
    semanticFinds: true,
    semanticReason: 'Versteht auch "Business Lunch", "Kundenmeeting mit Verpflegung"',
    document: 'Meeting Hotel - Business Catering',
  },
  {
    query: 'Rchnung (Tippfehler)',
    fulltextFinds: true,
    fulltextReason: 'Fuzzy-Matching erkennt "Rechnung" trotz Tippfehler',
    trigramFinds: true,
    trigramReason: 'Trigramme ähnlich genug für Treffer bei "Rechnung"',
    semanticFinds: false,
    semanticReason: 'Braucht korrekte Schreibweise für KI-Analyse',
    document: 'Hotel ABC - Rechnung',
  },
  {
    query: 'stbeleg',
    fulltextFinds: false,
    fulltextReason: 'Kein ganzes Wort "stbeleg" vorhanden',
    trigramFinds: true,
    trigramReason: 'Findet quer durch Wortgrenzen in "Gasthaus-Beleg"',
    semanticFinds: false,
    semanticReason: 'Kein bekanntes Wort für Bedeutungsanalyse',
    document: 'Gasthaus Zur Sonne - Beleg',
  },
  {
    query: 'Übernachtung',
    fulltextFinds: true,
    fulltextReason: 'Findet ganzes Wort "Übernachtung"',
    trigramFinds: true,
    trigramReason: 'Findet auch "Übernachtungen", "Übernachtungs­kosten"',
    semanticFinds: true,
    semanticReason: 'Versteht auch "Hotel", "Pension", "Zimmer­buchung"',
    document: 'Pension Bergblick - Zimmer + Frühstück',
  },
  {
    query: 'Restaurant März 2024',
    fulltextFinds: true,
    fulltextReason: 'Kombiniert Text "Restaurant" mit Zeitfilter März 2024',
    trigramFinds: true,
    trigramReason: 'Findet auch "Restaurantbeleg" und filtert nach Monat',
    semanticFinds: true,
    semanticReason: 'Versteht Zeitangaben und findet auch "Q1 2024"',
    document: 'Restaurant Krone - 18.03.2024',
  },
  {
    query: 'Tank letzte Woche',
    fulltextFinds: true,
    fulltextReason: 'Sucht "Tank" mit relativem Zeitfilter (letzte 7 Tage)',
    trigramFinds: true,
    trigramReason: 'Findet "Tankstelle", "Tanken" im Zeitraum',
    semanticFinds: true,
    semanticReason: 'Versteht "letzte Woche", "letzter Monat", "dieses Jahr"',
    document: 'Shell Tankstelle - 08.10.2025',
  },
];

export default function SearchExample() {
  const [activeTab, setActiveTab] = useState<string | null>('0');

  return (
    <Stack gap="md">
      <Alert icon={<IconInfoCircle size={16} />} color="blue">
        Sehen Sie anhand echter Beispiele, wie alle drei Suchtechnologien zusammenarbeiten
      </Alert>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          {searchExamples.map((example, index) => (
            <Tabs.Tab key={index} value={index.toString()} leftSection={<IconSearch size={14} />}>
              {example.query}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {searchExamples.map((example, index) => (
          <Tabs.Panel key={index} value={index.toString()} pt="md">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="lg">
                {/* Document Info */}
                <Box>
                  <Text size="sm" c="dimmed" mb="xs">
                    Gefundenes Dokument:
                  </Text>
                  <Text fw={600} size="lg">
                    {example.document}
                  </Text>
                </Box>

                {/* Search Results */}
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                  {/* Fulltext Search */}
                  <Card padding="md" radius="sm" withBorder bg={example.fulltextFinds ? 'blue.0' : 'gray.1'}>
                    <Stack gap="sm">
                      <Box style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Text fw={700} size="md">
                          Volltext
                        </Text>
                        {example.fulltextFinds ? (
                          <Badge color="blue" leftSection={<IconCheck size={12} />}>
                            ✓
                          </Badge>
                        ) : (
                          <Badge color="gray" leftSection={<IconX size={12} />}>
                            ✗
                          </Badge>
                        )}
                      </Box>
                      <Text size="sm">{example.fulltextReason}</Text>
                    </Stack>
                  </Card>

                  {/* Trigram Search */}
                  <Card padding="md" radius="sm" withBorder bg={example.trigramFinds ? 'green.0' : 'gray.1'}>
                    <Stack gap="sm">
                      <Box style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Text fw={700} size="md">
                          Trigram
                        </Text>
                        {example.trigramFinds ? (
                          <Badge color="green" leftSection={<IconCheck size={12} />}>
                            ✓
                          </Badge>
                        ) : (
                          <Badge color="gray" leftSection={<IconX size={12} />}>
                            ✗
                          </Badge>
                        )}
                      </Box>
                      <Text size="sm">{example.trigramReason}</Text>
                    </Stack>
                  </Card>

                  {/* Semantic Search */}
                  <Card padding="md" radius="sm" withBorder bg={example.semanticFinds ? 'violet.0' : 'gray.1'}>
                    <Stack gap="sm">
                      <Box style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Text fw={700} size="md">
                          Semantisch
                        </Text>
                        {example.semanticFinds ? (
                          <Badge color="violet" leftSection={<IconCheck size={12} />}>
                            ✓
                          </Badge>
                        ) : (
                          <Badge color="gray" leftSection={<IconX size={12} />}>
                            ✗
                          </Badge>
                        )}
                      </Box>
                      <Text size="sm">{example.semanticReason}</Text>
                    </Stack>
                  </Card>
                </SimpleGrid>

                {/* Combined Result */}
                <Alert color="teal" icon={<IconCheck size={16} />}>
                  <Text fw={600} size="sm">
                    ✓ Ergebnis: Dokument wird gefunden!
                  </Text>
                  <Text size="sm">
                    Mindestens eine der drei Technologien findet das Dokument – so stellen wir sicher,
                    dass Sie immer finden was Sie suchen!
                  </Text>
                </Alert>
              </Stack>
            </Card>
          </Tabs.Panel>
        ))}
      </Tabs>
    </Stack>
  );
}
