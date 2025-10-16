import React from 'react';
import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { LocaleProvider } from './contexts/LocaleContext';

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
  addListener: typeof vi !== 'undefined' ? vi.fn() : jest.fn(),
  removeListener: typeof vi !== 'undefined' ? vi.fn() : jest.fn(),
  addEventListener: typeof vi !== 'undefined' ? vi.fn() : jest.fn(),
  removeEventListener: typeof vi !== 'undefined' ? vi.fn() : jest.fn(),
  dispatchEvent: typeof vi !== 'undefined' ? vi.fn() : jest.fn(),
});

// Apply matchMedia mock
if (typeof window !== 'undefined') {
  const mockFn = typeof vi !== 'undefined' ? vi.fn() : jest.fn();
  window.matchMedia = window.matchMedia || mockFn.mockImplementation(() => mockMatchMedia());
  (globalThis as any).matchMedia = window.matchMedia;
}

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MantineProvider>
      <LocaleProvider>
        <ModalsProvider>
          {ui}
        </ModalsProvider>
      </LocaleProvider>
    </MantineProvider>
  );
} 