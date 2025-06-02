import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Mock environment variables BEFORE any imports
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.NEXTAUTH_SECRET = 'test-secret-key';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Add global polyfills for Next.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch for Node environment
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock Request/Response for Next.js
if (!global.Request) {
  global.Request = jest.fn().mockImplementation((url, init) => ({
    url,
    method: init?.method || 'GET',
    headers: new Map(Object.entries(init?.headers || {})),
    json: jest.fn(),
    text: jest.fn(),
    formData: jest.fn(),
  }));
}

if (!global.Response) {
  global.Response = jest.fn().mockImplementation((body, init) => ({
    ok: init?.status ? init.status >= 200 && init.status < 300 : true,
    status: init?.status || 200,
    statusText: init?.statusText || 'OK',
    headers: new Map(Object.entries(init?.headers || {})),
    json: jest.fn().mockResolvedValue(body ? JSON.parse(body) : {}),
    text: jest.fn().mockResolvedValue(body || ''),
  }));
}

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;

// Mock window.matchMedia only if window is defined (jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  
  // Also set it on globalThis for Mantine hooks
  globalThis.matchMedia = window.matchMedia;
}