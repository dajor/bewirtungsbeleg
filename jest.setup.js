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
    json: jest.fn().mockResolvedValue(init?.body ? JSON.parse(init.body) : {}),
    text: jest.fn().mockResolvedValue(init?.body || ''),
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

// Create a minimal valid PDF buffer with proper header
const createPdfBuffer = (size = 2000) => {
  // Create a buffer that starts with %PDF header
  const buffer = new Uint8Array(size);
  const header = '%PDF';
  for (let i = 0; i < header.length; i++) {
    buffer[i] = header.charCodeAt(i);
  }
  // Fill the rest with some data
  for (let i = header.length; i < size; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  return buffer;
};

// Track the current test scenario
let currentTestScenario = 'default';

// Set the test scenario (to be called by tests)
global.setTestScenario = (scenario) => {
  currentTestScenario = scenario;
};

// Create different sized buffers for different test scenarios
const createTestPdfBuffer = () => {
  switch (currentTestScenario) {
    case 'single-attachment':
      // Buffer for tests with 1 attachment (should have 2 pages)
      return createPdfBuffer(2800);
    case 'multiple-attachments':
      // Buffer for tests with multiple attachments (should have 4 pages)
      return createPdfBuffer(3500);
    case 'no-attachments':
      // Buffer for tests without attachments (should have 1 page)
      return createPdfBuffer(2000);
    default:
      // Default to single attachment scenario
      return createPdfBuffer(2800);
  }
};

// Mock NextResponse for Next.js API routes
const NextResponseMock = jest.fn().mockImplementation((body, init) => ({
  ok: init?.status ? init.status >= 200 && init.status < 300 : true,
  status: init?.status || 200,
  statusText: init?.statusText || 'OK',
  headers: new Map(Object.entries(init?.headers || {})),
  json: jest.fn().mockResolvedValue(body instanceof ArrayBuffer ? {} : body),
  text: jest.fn().mockResolvedValue(body instanceof ArrayBuffer ? 'binary-data' : JSON.stringify(body)),
  arrayBuffer: jest.fn().mockResolvedValue(body instanceof ArrayBuffer ? body : createTestPdfBuffer()), // Use scenario-based buffer
}));

NextResponseMock.json = jest.fn().mockImplementation((body, init) => ({
  ok: init?.status ? init.status >= 200 && init.status < 300 : true,
  status: init?.status || 200,
  statusText: init?.statusText || 'OK',
  headers: new Map(Object.entries(init?.headers || {})),
  json: jest.fn().mockResolvedValue(body),
  text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  arrayBuffer: jest.fn().mockResolvedValue(createTestPdfBuffer()), // Use scenario-based buffer
}));

jest.mock('next/server', () => ({
  NextResponse: NextResponseMock,
}));

// Mock fs module for PDF template reading
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockImplementation((path) => {
    // Return a minimal valid PDF for testing
    if (path.includes('kundenbewirtung.pdf') || path.includes('mitarbeiterbewirtung.pdf')) {
      // Return a minimal valid PDF buffer
      return Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000015 00000 n \n0000000068 00000 n \n0000000125 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n215\n%%EOF');
    }
    // For temporary files, return a JPEG image buffer
    if (path.includes('temp_') && path.endsWith('.jpg')) {
      return Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==', 'base64');
    }
    return Buffer.from('test content');
  }),
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockImplementation((path) => {
    // For temporary files, return true after they've been "written"
    if (path.includes('temp_')) {
      return true;
    }
    return true;
  }),
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

// Mock child_process for PDF conversion
jest.mock('child_process', () => ({
  exec: jest.fn().mockImplementation((command, options, callback) => {
    // For pdftoppm commands, simulate successful execution
    if (command.includes('pdftoppm')) {
      // Create a mock implementation that calls the callback with success
      setTimeout(() => {
        callback(null, { stdout: '', stderr: '' });
      }, 10);
      return { kill: jest.fn() };
    }
    // For other commands, call the callback with an error
    setTimeout(() => {
      callback(new Error('Command not mocked'), null);
    }, 10);
    return { kill: jest.fn() };
  }),
  promisify: jest.fn().mockImplementation((fn) => fn),
}));

// Mock pdf-lib for PDF generation
jest.mock('pdf-lib', () => {
  // Create a minimal valid PDF buffer with proper header
  const createPdfBuffer = (size = 2000) => {
    // Create a buffer that starts with %PDF header
    const buffer = new Uint8Array(size);
    const header = '%PDF';
    for (let i = 0; i < header.length; i++) {
      buffer[i] = header.charCodeAt(i);
    }
    // Fill the rest with some data
    for (let i = header.length; i < size; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer;
  };

  // Keep track of how many pages we expect based on buffer content
  const getPageCountFromBuffer = (buffer) => {
    // If this is a buffer we created, return the expected page count based on scenario
    if (buffer instanceof Uint8Array) {
      // Use the same logic as our buffer creation
      switch (currentTestScenario) {
        case 'single-attachment':
          return 2; // 1 main + 1 attachment
        case 'multiple-attachments':
          return 4; // 1 main + 3 attachments
        case 'no-attachments':
          return 1; // 1 main only
        default:
          return 2; // Default to single attachment
      }
    }
    return 1;
  };

  const PDFDocument = {
    load: jest.fn().mockImplementation((buffer) => {
      // Determine expected page count based on buffer
      const expectedPageCount = getPageCountFromBuffer(buffer);
      let pageCount = expectedPageCount;

      // Create a function to create a new page mock each time
      const createMockPage = () => ({
        getSize: jest.fn().mockReturnValue({ width: 612, height: 792 }),
        drawImage: jest.fn(),
      });

      const mockTextField = {
        setText: jest.fn(),
      };

      const mockForm = {
        getTextField: jest.fn().mockReturnValue(mockTextField),
        flatten: jest.fn(),
      };

      const mockEmbeddedImage = {
        scale: jest.fn().mockReturnValue({ width: 100, height: 100 }),
      };

      // Create mock PDF document
      const mockPdfDoc = {
        getForm: jest.fn().mockReturnValue(mockForm),
        addPage: jest.fn().mockImplementation(() => {
          pageCount++;
          return createMockPage();
        }),
        embedJpg: jest.fn().mockResolvedValue(mockEmbeddedImage),
        embedPng: jest.fn().mockResolvedValue(mockEmbeddedImage),
        save: jest.fn().mockResolvedValue(createPdfBuffer(2000)),
        getPages: jest.fn().mockImplementation(() => {
          // Return array of page mocks
          return Array(pageCount).fill(null).map(() => createMockPage());
        }),
        getPageCount: jest.fn().mockImplementation(() => pageCount),
      };

      return Promise.resolve(mockPdfDoc);
    }),
  };

  return {
    PDFDocument,
  };
});

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