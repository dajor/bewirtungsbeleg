import { Table, Card, Text, Badge, Box, Stack, Alert } from '@mantine/core';
import { IconCheck, IconX, IconSparkles } from '@tabler/icons-react';

interface ComparisonRow {
  feature: string;
  description: string;
  fulltext: boolean;
  trigram: boolean;
  semantic: boolean;
  example: string;
}

const comparisonData: ComparisonRow[] = [
  {
    feature: 'Exakte Wortsuche',
    description: 'Findet das genaue Wort im Dokument',
    fulltext: true,
    trigram: true,
    semantic: true,
    example: 'Suche: "Rechnung" → Findet: "Rechnung"',
  },
  {
    feature: 'Wortformen erkennen',
    description: 'Erkennt Singular, Plural, Konjugationen',
    fulltext: true,
    trigram: false,
    semantic: true,
    example: 'Suche: "Rechnung" → Findet: "Rechnungen"',
  },
  {
    feature: 'Tippfehler-Toleranz',
    description: 'Korrigiert kleine Schreibfehler automatisch',
    fulltext: true,
    trigram: true,
    semantic: false,
    example: 'Suche: "Rchnung" → Findet: "Rechnung"',
  },
  {
    feature: 'Wortteile finden',
    description: 'Findet Teile innerhalb von Wörtern',
    fulltext: false,
    trigram: true,
    semantic: false,
    example: 'Suche: "rest" → Findet: "Restaurant"',
  },
  {
    feature: 'Teil-Namen suchen',
    description: 'Findet Namen auch ohne vollständige Eingabe',
    fulltext: false,
    trigram: true,
    semantic: false,
    example: 'Suche: "Adl" → Findet: "Adler Gasthaus"',
  },
  {
    feature: 'Zusammengesetzte Wörter',
    description: 'Findet Wörter in Komposita',
    fulltext: true,
    trigram: true,
    semantic: false,
    example: 'Suche: "Restaurant" → Findet: "Restaurantbeleg"',
  },
  {
    feature: 'Synonyme verstehen',
    description: 'Erkennt bedeutungsähnliche Wörter',
    fulltext: false,
    trigram: false,
    semantic: true,
    example: 'Suche: "Geschäftsessen" → Findet: "Business Lunch"',
  },
  {
    feature: 'Kontext verstehen',
    description: 'Versteht die Bedeutung hinter der Suche',
    fulltext: false,
    trigram: false,
    semantic: true,
    example: 'Suche: "Kundenmeeting" → Findet: "Geschäftsbesprechung"',
  },
  {
    feature: 'Ähnliche Konzepte',
    description: 'Findet thematisch verwandte Dokumente',
    fulltext: false,
    trigram: false,
    semantic: true,
    example: 'Suche: "Hotel" → Findet: "Pension", "Übernachtung"',
  },
  {
    feature: 'Wortgrenzen ignorieren',
    description: 'Sucht quer durch Wortgrenzen',
    fulltext: false,
    trigram: true,
    semantic: false,
    example: 'Suche: "stbeleg" → Findet: "Gasthaus-Beleg"',
  },
];

function CheckIcon({ value }: { value: boolean }) {
  return value ? (
    <Box c="green" style={{ display: 'flex', justifyContent: 'center' }}>
      <IconCheck size={20} />
    </Box>
  ) : (
    <Box c="gray.5" style={{ display: 'flex', justifyContent: 'center' }}>
      <IconX size={20} />
    </Box>
  );
}

export default function ComparisonTable() {
  return (
    <Stack gap="md">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: '25%' }}>Funktion</Table.Th>
              <Table.Th style={{ width: '20%' }}>Beschreibung</Table.Th>
              <Table.Th style={{ width: '8%', textAlign: 'center' }}>
                <Badge color="blue" variant="light" size="lg">
                  Volltext
                </Badge>
              </Table.Th>
              <Table.Th style={{ width: '8%', textAlign: 'center' }}>
                <Badge color="green" variant="light" size="lg">
                  Trigram
                </Badge>
              </Table.Th>
              <Table.Th style={{ width: '8%', textAlign: 'center' }}>
                <Badge color="violet" variant="light" size="lg">
                  Semantisch
                </Badge>
              </Table.Th>
              <Table.Th style={{ width: '31%' }}>Beispiel</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {comparisonData.map((row, index) => (
              <Table.Tr key={index}>
                <Table.Td>
                  <Text fw={600} size="sm">
                    {row.feature}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {row.description}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <CheckIcon value={row.fulltext} />
                </Table.Td>
                <Table.Td>
                  <CheckIcon value={row.trigram} />
                </Table.Td>
                <Table.Td>
                  <CheckIcon value={row.semantic} />
                </Table.Td>
                <Table.Td>
                  <Text size="xs" fs="italic" c="dimmed">
                    {row.example}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Summary Alert */}
      <Alert
        icon={<IconSparkles size={24} />}
        title="Das Beste aus drei Welten"
        color="teal"
        variant="light"
      >
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Egal wie Sie suchen – wir finden Ihre Dokumente immer!
          </Text>
          <Text size="sm">
            Durch die intelligente Kombination von <strong>Volltext-Suche</strong>, <strong>Trigram-Suche</strong> und
            <strong> semantischer Suche</strong> (bald verfügbar) stellen wir sicher, dass Sie immer die gewünschten
            Dokumente finden – egal ob Sie nach ganzen Wörtern, Wortteilen, mit Tippfehlern oder nach Bedeutung suchen.
          </Text>
          <Box mt="xs">
            <Stack gap="xs">
              <Text size="sm" c="dimmed" fs="italic">
                💡 <strong>Volltext-Suche:</strong> Präzise und schnell für ganze Wörter
              </Text>
              <Text size="sm" c="dimmed" fs="italic">
                💡 <strong>Trigram-Suche:</strong> Findet auch Wortteile und Teil-Namen
              </Text>
              <Text size="sm" c="dimmed" fs="italic">
                💡 <strong>Semantische Suche:</strong> Versteht Zusammenhänge und Bedeutungen
              </Text>
              <Text size="sm" c="dimmed" fw={600} mt="xs">
                → Zusammen decken sie jeden Suchfall ab!
              </Text>
            </Stack>
          </Box>
        </Stack>
      </Alert>
    </Stack>
  );
}
