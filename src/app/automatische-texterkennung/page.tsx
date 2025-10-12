'use client';

import { Container, Title, Text, Stack, SimpleGrid, Center, Paper, List, ThemeIcon } from '@mantine/core';
import { IconScan, IconBrain, IconCpu, IconRocket, IconCheck } from '@tabler/icons-react';
import FeatureCard from './components/FeatureCard';
import ProcessFlow from './components/ProcessFlow';
import ComparisonTable from './components/ComparisonTable';

export default function AutomatischeTexterkennungPage() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Hero Section */}
        <Center>
          <Stack align="center" gap="md" maw={700}>
            <IconScan size={64} stroke={1.5} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Title order={1} ta="center" size="h1">
              Automatische Texterkennung
            </Title>
            <Text size="lg" ta="center" c="dimmed">
              Mehr als nur OCR: Intelligente Dokumentenverarbeitung, die versteht was Sie brauchen
            </Text>
          </Stack>
        </Center>

        {/* Main Explanation */}
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <Stack gap="md">
            <Title order={2} ta="center">
              Der Unterschied zwischen OCR und IDP
            </Title>
            <Text ta="center" c="dimmed" size="lg">
              OCR ist nur der erste Schritt – IDP macht Ihre Daten wirklich nutzbar
            </Text>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mt="md">
              <Stack gap="sm">
                <Title order={3} size="h4" c="blue">
                  <IconScan size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  Was ist OCR?
                </Title>
                <Text>
                  <strong>Optical Character Recognition (OCR)</strong> ist wie ein Scanner, der Text liest.
                  Es erkennt alle Buchstaben und Zahlen auf Ihrem Beleg und wandelt sie in digitalen Text um.
                </Text>
                <Text c="dimmed" size="sm">
                  <strong>Beispiel:</strong> OCR sieht "Restaurant Zur Linde", "28.12.2024", "€ 45,80" –
                  aber weiß nicht, welche Information was bedeutet.
                </Text>
              </Stack>

              <Stack gap="sm">
                <Title order={3} size="h4" c="violet">
                  <IconBrain size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  Was ist IDP?
                </Title>
                <Text>
                  <strong>Intelligent Document Processing (IDP)</strong> geht viel weiter.
                  Es versteht die Struktur des Dokuments und extrahiert gezielt genau die Informationen,
                  die Sie benötigen – richtig formatiert und validiert.
                </Text>
                <Text c="dimmed" size="sm">
                  <strong>Beispiel:</strong> IDP weiß: "Restaurant Zur Linde" ist der Bewirtungsort,
                  "28.12.2024" ist das Datum, "€ 45,80" ist der Gesamtbetrag – und füllt automatisch
                  die richtigen Felder aus.
                </Text>
              </Stack>
            </SimpleGrid>
          </Stack>
        </Paper>

        {/* Process Flow */}
        <Stack gap="md" mt="xl">
          <Title order={2} ta="center">
            So funktioniert es
          </Title>
          <Text ta="center" c="dimmed" maw={700} mx="auto">
            Von Ihrem Foto zum fertigen Bewirtungsbeleg in 4 Schritten
          </Text>
          <ProcessFlow />
        </Stack>

        {/* Feature Cards */}
        <Stack gap="md" mt="xl">
          <Title order={2} ta="center">
            Die Vorteile unserer intelligenten Texterkennung
          </Title>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            <FeatureCard
              icon={<IconRocket size={40} />}
              title="Zeitsparend"
              subtitle="Automatisch"
              description="Keine manuelle Dateneingabe mehr nötig. Einfach Beleg hochladen und fertig."
              benefits={[
                'Sekunden statt Minuten',
                'Keine Tippfehler',
                'Automatische Formatierung',
                'Sofort einsatzbereit'
              ]}
              color="blue"
            />
            <FeatureCard
              icon={<IconBrain size={40} />}
              title="Intelligent"
              subtitle="KI-gestützt"
              description="Versteht die Struktur und extrahiert genau die richtigen Informationen."
              benefits={[
                'Erkennt Dokumententyp',
                'Findet Pflichtfelder',
                'Validiert Datenformate',
                'Lernt kontinuierlich'
              ]}
              color="violet"
            />
            <FeatureCard
              icon={<IconCpu size={40} />}
              title="Präzise"
              subtitle="Hohe Genauigkeit"
              description="Modernste KI-Technologie für beste Erkennungsraten."
              benefits={[
                'Auch bei schlechter Qualität',
                'Mehrsprachig',
                'Erkennt Handschrift',
                'Fehlertoleranz'
              ]}
              color="green"
            />
          </SimpleGrid>
        </Stack>

        {/* Comparison Table */}
        <Stack gap="md" mt="xl">
          <Title order={2} ta="center">
            Warum IDP besser ist als nur OCR
          </Title>
          <Text ta="center" c="dimmed" maw={700} mx="auto">
            Sehen Sie selbst, was den Unterschied ausmacht
          </Text>
          <ComparisonTable />
        </Stack>

        {/* Real World Example */}
        <Paper shadow="sm" p="xl" radius="md" withBorder mt="xl">
          <Stack gap="md">
            <Title order={2} ta="center">
              Ein praktisches Beispiel
            </Title>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
              <Stack gap="sm">
                <Title order={3} size="h4" c="dimmed">
                  ❌ Nur mit OCR
                </Title>
                <Text size="sm" c="dimmed">
                  OCR liefert Ihnen einen langen Text mit allen erkannten Informationen:
                </Text>
                <Paper p="md" bg="gray.0" radius="sm">
                  <Text size="xs" ff="monospace" c="dimmed">
                    "Restaurant Zur Linde Hauptstraße 123 80331 München
                    Rechnung Nr. 12345 Datum: 28.12.2024 Kellner: Max Mustermann
                    2x Schnitzel € 24,00 1x Salat € 8,50 2x Bier € 13,30
                    Summe Netto € 38,50 MwSt 19% € 7,30 Gesamt € 45,80..."
                  </Text>
                </Paper>
                <Text size="sm" c="dimmed">
                  → Sie müssen manuell die richtigen Daten heraussuchen und in die Felder eintragen.
                </Text>
              </Stack>

              <Stack gap="sm">
                <Title order={3} size="h4" c="green">
                  ✓ Mit IDP
                </Title>
                <Text size="sm" c="dimmed">
                  IDP versteht den Beleg und füllt automatisch alle Felder korrekt aus:
                </Text>
                <List
                  spacing="xs"
                  size="sm"
                  icon={
                    <ThemeIcon color="green" size={20} radius="xl">
                      <IconCheck size={12} />
                    </ThemeIcon>
                  }
                >
                  <List.Item>
                    <strong>Bewirtungsort:</strong> Restaurant Zur Linde
                  </List.Item>
                  <List.Item>
                    <strong>Datum:</strong> 28.12.2024
                  </List.Item>
                  <List.Item>
                    <strong>Gesamtbetrag:</strong> 45,80 €
                  </List.Item>
                  <List.Item>
                    <strong>MwSt (19%):</strong> 7,30 €
                  </List.Item>
                  <List.Item>
                    <strong>Nettobetrag:</strong> 38,50 €
                  </List.Item>
                  <List.Item>
                    <strong>Anzahl Personen:</strong> 3 (automatisch berechnet)
                  </List.Item>
                </List>
                <Text size="sm" c="green" fw={500}>
                  → Alles ist sofort korrekt ausgefüllt und bereit zur Verwendung!
                </Text>
              </Stack>
            </SimpleGrid>
          </Stack>
        </Paper>

        {/* Bottom CTA */}
        <Paper shadow="sm" p="xl" radius="md" withBorder bg="blue.0" mt="xl">
          <Stack gap="md" align="center" ta="center">
            <Title order={2}>
              Probieren Sie es selbst aus!
            </Title>
            <Text size="lg" maw={600}>
              Laden Sie einfach einen Beleg hoch und erleben Sie,
              wie unsere intelligente Texterkennung Ihnen die Arbeit abnimmt.
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
