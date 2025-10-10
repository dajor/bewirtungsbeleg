import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Set up environment variables before any imports
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.MAILERSEND_API_KEY = 'test-mailersend-key';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

// Mock canvas module before it's required by jsdom
vi.mock('canvas', async () => {
  return {
    createCanvas: vi.fn(() => ({
      getContext: vi.fn(() => ({
        drawImage: vi.fn(),
        fillRect: vi.fn(),
        clearRect: vi.fn(),
      })),
      toBuffer: vi.fn(),
      toDataURL: vi.fn(),
    })),
    loadImage: vi.fn(),
    Image: vi.fn(),
  };
});

// Global test setup
if (typeof window !== 'undefined') {
  (global as any).ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  (global as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

// Suppress console warnings in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  warn: vi.fn(),
  error: vi.fn(),
} as any;

// Mock rate-limit globally to avoid Redis requirement
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(null),
  getIdentifier: vi.fn().mockReturnValue('test-user'),
  apiRatelimit: {
    general: {},
    ocr: {},
    pdf: {},
  },
}));
