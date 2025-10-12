'use client';

import { Table, Paper, Text, ThemeIcon, Group } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';

export default function ComparisonTable() {
  const data = [
    {
      feature: 'Erkennt Text auf dem Beleg',
      ocr: true,
      idp: true,
    },
    {
      feature: 'Versteht Dokumentenstruktur',
      ocr: false,
      idp: true,
    },
    {
      feature: 'Extrahiert nur relevante Daten',
      ocr: false,
      idp: true,
    },
    {
      feature: 'Validiert Datenformate',
      ocr: false,
      idp: true,
    },
    {
      feature: 'Versteht Zusammenhänge',
      ocr: false,
      idp: true,
    },
    {
      feature: 'Erkennt Pflichtfelder',
      ocr: false,
      idp: true,
    },
  ];

  const rows = data.map((row) => (
    <Table.Tr key={row.feature}>
      <Table.Td>
        <Text fw={500}>{row.feature}</Text>
      </Table.Td>
      <Table.Td>
        <Group justify="center">
          {row.ocr ? (
            <ThemeIcon color="green" size="sm" radius="xl">
              <IconCheck size={14} />
            </ThemeIcon>
          ) : (
            <ThemeIcon color="gray" size="sm" radius="xl" variant="light">
              <IconX size={14} />
            </ThemeIcon>
          )}
        </Group>
      </Table.Td>
      <Table.Td>
        <Group justify="center">
          {row.idp ? (
            <ThemeIcon color="green" size="sm" radius="xl">
              <IconCheck size={14} />
            </ThemeIcon>
          ) : (
            <ThemeIcon color="gray" size="sm" radius="xl" variant="light">
              <IconX size={14} />
            </ThemeIcon>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper shadow="sm" radius="md" withBorder>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Funktion</Table.Th>
            <Table.Th ta="center">
              <Text fw={600}>Nur OCR</Text>
              <Text size="xs" c="dimmed">Texterkennung</Text>
            </Table.Th>
            <Table.Th ta="center">
              <Text fw={600}>IDP</Text>
              <Text size="xs" c="dimmed">Intelligente Verarbeitung</Text>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
}
