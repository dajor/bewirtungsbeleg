'use client';

import { Tooltip, ActionIcon, rem } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

interface InfoTooltipProps {
  label: string;
  multiline?: boolean;
  width?: number;
}

export function InfoTooltip({ label, multiline = true, width = 300 }: InfoTooltipProps) {
  return (
    <Tooltip
      label={label}
      multiline={multiline}
      w={width}
      withArrow
      transitionProps={{ duration: 200 }}
      position="right"
    >
      <ActionIcon variant="subtle" color="gray" size="sm" radius="xl">
        <IconInfoCircle size={rem(16)} />
      </ActionIcon>
    </Tooltip>
  );
}
