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

// Mock matchMedia for Mantine hooks
const mockMatchMedia = (matches: boolean = false) => ({
  matches,
  media: '',
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

// Apply matchMedia mock
if (typeof window !== 'undefined') {
  window.matchMedia = window.matchMedia || jest.fn().mockImplementation(() => mockMatchMedia());
  (globalThis as any).matchMedia = window.matchMedia;
}

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MantineProvider>
      <ModalsProvider>
        {ui}
      </ModalsProvider>
    </MantineProvider>
  );
} 