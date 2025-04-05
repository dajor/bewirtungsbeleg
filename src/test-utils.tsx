import React from 'react';
import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MantineProvider>
      <ModalsProvider>
        {ui}
      </ModalsProvider>
    </MantineProvider>
  );
} 