'use client';

import { Group, Text } from '@mantine/core';
import { InfoTooltip } from './InfoTooltip';

interface LabelWithTooltipProps {
  label: string;
  tooltip: string;
  required?: boolean;
}

export function LabelWithTooltip({ label, tooltip, required }: LabelWithTooltipProps) {
  return (
    <Group gap="xs">
      <Text size="sm" fw={500}>
        {label}
        {required && <span style={{ color: 'var(--mantine-color-red-6)' }}> *</span>}
      </Text>
      <InfoTooltip label={tooltip} />
    </Group>
  );
}
