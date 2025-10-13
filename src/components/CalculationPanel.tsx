'use client';

import React from 'react';
import {
  Paper,
  Stack,
  Box,
  Text,
  Group,
  Divider,
} from '@mantine/core';
import { useLocale } from '@/contexts/LocaleContext';
import { formatLocalizedNumber } from '@/lib/locale-config';

interface CalculationPanelProps {
  gesamtbetragNetto?: string | number;
  speisen?: string | number;
  getraenke?: string | number;
  gesamtbetragMwst?: string | number;
  gesamtbetrag?: string | number;
  kreditkartenBetrag?: string | number;
  trinkgeld?: string | number;
  trinkgeldMwst?: string | number;
  istAuslaendischeRechnung?: boolean;
}

export function CalculationPanel({
  gesamtbetragNetto,
  speisen,
  getraenke,
  gesamtbetragMwst,
  gesamtbetrag,
  kreditkartenBetrag,
  trinkgeld,
  trinkgeldMwst,
  istAuslaendischeRechnung = false,
}: CalculationPanelProps) {
  // Get locale for formatting
  const { locale } = useLocale();

  const formatAmount = (value: string | number | undefined): string => {
    if (!value || value === '' || value === '0' || value === '0.00') {
      // Return zero in locale format (e.g., "0,00" for German, "0.00" for English)
      return formatLocalizedNumber(0, locale);
    }
    const numValue = Number(value);
    return formatLocalizedNumber(numValue, locale);
  };

  return (
    <Paper p="md" withBorder radius="md" style={{ backgroundColor: '#ffffff', borderColor: '#dee2e6' }}>
      <Stack gap="md">
        <Box>
          <Text size="sm" fw={700} c="grape" mb="xs" tt="uppercase">
            🧮 Live Berechnung
          </Text>
          <Text size="xs" c="dimmed">
            Echtzeit-Übersicht Ihrer Eingaben
          </Text>
        </Box>

        {/* Gesamtbetrag Calculation */}
        {!istAuslaendischeRechnung && (
          <Paper p="md" radius="md" style={{ backgroundColor: '#f1f3f5', border: '2px solid #dee2e6' }}>
            <Stack gap="sm">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.5px' }}>
                Gesamtbetrag Berechnung
              </Text>

              <Box style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                <Group gap="xs" align="center" justify="space-between">
                  <Text size="sm" fw={500}>Netto:</Text>
                  <Text fw={700} c="teal" size="lg">
                    {formatAmount(gesamtbetragNetto)} €
                  </Text>
                </Group>

                <Group gap="xs" align="center" justify="space-between" mt="xs">
                  <Text size="sm" c="dimmed">+ MwSt. 7%:</Text>
                  <Text fw={600} c="orange" size="md">
                    {formatAmount(speisen)} €
                  </Text>
                </Group>

                <Group gap="xs" align="center" justify="space-between" mt={4}>
                  <Text size="sm" c="dimmed">+ MwSt. 19%:</Text>
                  <Text fw={600} c="orange" size="md">
                    {formatAmount(getraenke)} €
                  </Text>
                </Group>

                <Divider my="sm" color="gray" />

                <Group gap="xs" align="center" justify="space-between" p="xs" style={{ backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
                  <Text size="md" fw={700} c="blue">= Gesamtbetrag:</Text>
                  <Text fw={900} c="blue" size="xl">
                    {formatAmount(gesamtbetrag)} €
                  </Text>
                </Group>
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Divider between sections */}
        {!istAuslaendischeRechnung && kreditkartenBetrag && (
          <Divider />
        )}

        {/* Trinkgeld Calculation */}
        {kreditkartenBetrag && (
          <Box>
            <Text size="sm" fw={600} c="dimmed" mb="xs">Trinkgeld Berechnung:</Text>
            <Box style={{ fontFamily: 'monospace', fontSize: '14px' }}>
              <Group gap="xs" align="center">
                <Text>Bezahlt</Text>
                <Text c="dimmed">-</Text>
                <Text>Rechnung</Text>
                <Text c="dimmed">=</Text>
                <Text fw={700}>Trinkgeld</Text>
              </Group>

              <Group gap="xs" align="center" mt="xs">
                <Text fw={600} c="blue" size="lg">
                  {formatAmount(kreditkartenBetrag)} €
                </Text>
                <Text c="dimmed">-</Text>
                <Text fw={600} c="blue" size="lg">
                  {formatAmount(gesamtbetrag)} €
                </Text>
                <Text c="dimmed">=</Text>
                <Text fw={700} c="green" size="xl">
                  {formatAmount(trinkgeld)} €
                </Text>
              </Group>
            </Box>

            {!istAuslaendischeRechnung && trinkgeld && Number(trinkgeld) > 0 && (
              <Box mt="sm" pt="sm" style={{ borderTop: '1px solid #dee2e6' }}>
                <Text size="xs" c="dimmed" mb={4}>MwSt. auf Trinkgeld (19%):</Text>
                <Group gap="xs" align="center" style={{ fontFamily: 'monospace' }}>
                  <Text size="sm">
                    {formatAmount(trinkgeld)} €
                  </Text>
                  <Text c="dimmed" size="sm">×</Text>
                  <Text size="sm">{locale.numberFormat.decimalSeparator === ',' ? '0,19' : '0.19'}</Text>
                  <Text c="dimmed" size="sm">=</Text>
                  <Text fw={600} c="orange" size="sm">
                    {formatAmount(trinkgeldMwst)} €
                  </Text>
                </Group>
              </Box>
            )}
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
