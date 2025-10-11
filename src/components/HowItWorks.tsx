'use client';

import { Timeline, Text, Title, Container, rem, Paper, ThemeIcon } from '@mantine/core';
import { IconUpload, IconRobot, IconEdit, IconDownload } from '@tabler/icons-react';

export function HowItWorks() {
  return (
    <Container size="lg" py={rem(64)}>
      <Title order={2} ta="center" mb={rem(48)}>
        So funktioniert's - in 4 einfachen Schritten
      </Title>

      <Timeline active={4} bulletSize={40} lineWidth={2}>
        <Timeline.Item
          bullet={
            <ThemeIcon size={40} radius="xl" color="blue">
              <IconUpload size={20} />
            </ThemeIcon>
          }
          title={<Text fw={600} size="lg">1. Beleg hochladen</Text>}
        >
          <Text c="dimmed" size="sm" mt="xs">
            Laden Sie ein Foto oder PDF Ihrer Rechnung hoch. Sie können auch mehrere
            Belege gleichzeitig hochladen (z.B. Rechnung + Kreditkartenbeleg).
          </Text>
          <Paper withBorder p="sm" mt="sm" bg="gray.0">
            <Text size="xs" c="dimmed">
              <strong>Tipp:</strong> Fotografieren Sie die Rechnung direkt nach dem Essen
              mit Ihrem Smartphone. Die App funktioniert auch mobil!
            </Text>
          </Paper>
        </Timeline.Item>

        <Timeline.Item
          bullet={
            <ThemeIcon size={40} radius="xl" color="blue">
              <IconRobot size={20} />
            </ThemeIcon>
          }
          title={<Text fw={600} size="lg">2. KI extrahiert Daten</Text>}
        >
          <Text c="dimmed" size="sm" mt="xs">
            Unsere KI erkennt automatisch Restaurant-Namen, Datum, Beträge und weitere
            wichtige Informationen. Das spart Ihnen wertvolle Zeit beim Ausfüllen.
          </Text>
          <Paper withBorder p="sm" mt="sm" bg="gray.0">
            <Text size="xs" c="dimmed">
              <strong>Funktioniert mit:</strong> Handschriftlichen Belegen, gedruckten
              Rechnungen, Kassenbelegen und Kreditkartenabrechnungen
            </Text>
          </Paper>
        </Timeline.Item>

        <Timeline.Item
          bullet={
            <ThemeIcon size={40} radius="xl" color="blue">
              <IconEdit size={20} />
            </ThemeIcon>
          }
          title={<Text fw={600} size="lg">3. Daten prüfen & ergänzen</Text>}
        >
          <Text c="dimmed" size="sm" mt="xs">
            Prüfen Sie die automatisch ausgefüllten Felder und ergänzen Sie die
            geschäftlichen Details wie Anlass und Teilnehmer. Alle Pflichtfelder
            sind klar gekennzeichnet.
          </Text>
          <Paper withBorder p="sm" mt="sm" bg="gray.0">
            <Text size="xs" c="dimmed">
              <strong>Wichtig:</strong> Für steuerliche Absetzbarkeit müssen Sie den
              geschäftlichen Anlass und alle Teilnehmer angeben.
            </Text>
          </Paper>
        </Timeline.Item>

        <Timeline.Item
          bullet={
            <ThemeIcon size={40} radius="xl" color="blue">
              <IconDownload size={20} />
            </ThemeIcon>
          }
          title={<Text fw={600} size="lg">4. PDF herunterladen oder speichern</Text>}
        >
          <Text c="dimmed" size="sm" mt="xs">
            Erstellen Sie mit einem Klick ein rechtssicheres PDF mit allen notwendigen
            Angaben. Optional können Sie den Beleg auch direkt im GoBD-Tresor speichern.
          </Text>
          <Paper withBorder p="sm" mt="sm" bg="gray.0">
            <Text size="xs" c="dimmed">
              <strong>Besonderheit:</strong> Das PDF enthält den Originalbeleg als Anhang
              und erfüllt alle Anforderungen des Finanzamts.
            </Text>
          </Paper>
        </Timeline.Item>
      </Timeline>
    </Container>
  );
}
