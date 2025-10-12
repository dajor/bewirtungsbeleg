'use client';

import { Paper, Stack, Text, Timeline, ThemeIcon, Group } from '@mantine/core';
import { IconUpload, IconScan, IconBrain, IconFileCheck } from '@tabler/icons-react';

export default function ProcessFlow() {
  return (
    <Paper shadow="sm" p="xl" radius="md" withBorder>
      <Timeline active={3} bulletSize={40} lineWidth={2}>
        <Timeline.Item
          bullet={
            <ThemeIcon size={40} radius="xl" color="blue">
              <IconUpload size={20} />
            </ThemeIcon>
          }
          title={<Text fw={600} size="lg">1. Beleg hochladen</Text>}
        >
          <Text c="dimmed" size="sm" mt="xs">
            Sie laden einfach ein Foto oder Scan Ihres Belegs hoch.
            Egal ob Restaurant-Rechnung, Taxi-Quittung oder Hotel-Beleg.
          </Text>
        </Timeline.Item>

        <Timeline.Item
          bullet={
            <ThemeIcon size={40} radius="xl" color="green">
              <IconScan size={20} />
            </ThemeIcon>
          }
          title={<Text fw={600} size="lg">2. OCR erkennt Text</Text>}
        >
          <Text c="dimmed" size="sm" mt="xs">
            Unsere KI-gestützte Texterkennung (OCR) liest alle sichtbaren Informationen aus:
            Zahlen, Datum, Restaurantname, Adresse und mehr.
          </Text>
        </Timeline.Item>

        <Timeline.Item
          bullet={
            <ThemeIcon size={40} radius="xl" color="violet">
              <IconBrain size={20} />
            </ThemeIcon>
          }
          title={<Text fw={600} size="lg">3. IDP extrahiert genau was Sie brauchen</Text>}
        >
          <Text c="dimmed" size="sm" mt="xs">
            Hier kommt der wichtige Unterschied: Die Intelligent Document Processing (IDP) Technologie
            versteht, welche Informationen für einen Bewirtungsbeleg relevant sind und extrahiert
            gezielt nur diese Daten – richtig formatiert und validiert.
          </Text>
        </Timeline.Item>

        <Timeline.Item
          bullet={
            <ThemeIcon size={40} radius="xl" color="teal">
              <IconFileCheck size={20} />
            </ThemeIcon>
          }
          title={<Text fw={600} size="lg">4. Fertiges Dokument</Text>}
        >
          <Text c="dimmed" size="sm" mt="xs">
            Sie erhalten einen vollständigen, steuerkonformen Bewirtungsbeleg mit allen
            erforderlichen Angaben – bereit zum Download als PDF.
          </Text>
        </Timeline.Item>
      </Timeline>
    </Paper>
  );
}
