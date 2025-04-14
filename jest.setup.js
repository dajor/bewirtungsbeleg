import '@testing-library/jest-dom';

// Web API Mocks
class MockHeaders {
  constructor(init = {}) {
    this.headers = new Map();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value);
      });
    }
  }

  get(name) {
    return this.headers.get(name.toLowerCase()) || null;
  }

  set(name, value) {
    this.headers.set(name.toLowerCase(), value);
  }

  entries() {
    return this.headers.entries();
  }
}

class MockRequest {
  constructor(url, options = {}) {
    this._url = url;
    this._method = options.method || 'GET';
    this._headers = new MockHeaders(options.headers);
    this._body = options.body;
  }

  get url() {
    return this._url;
  }

  get method() {
    return this._method;
  }

  get headers() {
    return this._headers;
  }

  get body() {
    return this._body;
  }

  async json() {
    if (typeof this._body === 'string') {
      return JSON.parse(this._body);
    }
    return this._body;
  }
}

class MockResponse {
  constructor(body, init = {}) {
    this._body = body;
    this._status = init.status || 200;
    this._headers = new MockHeaders(init.headers);
  }

  get status() {
    return this._status;
  }

  get headers() {
    return this._headers;
  }

  async arrayBuffer() {
    return this._body;
  }

  static json(body, init = {}) {
    return new MockResponse(JSON.stringify(body), init);
  }

  async json() {
    return JSON.parse(this._body);
  }
}

// Mock NextResponse
const NextResponse = {
  json: (body, init = {}) => {
    return new MockResponse(JSON.stringify(body), init);
  }
};

global.Request = MockRequest;
global.Headers = MockHeaders;
global.Response = MockResponse;
global.NextResponse = NextResponse;

// TextEncoder/TextDecoder Mocks
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock für process.cwd()
process.cwd = () => '/Users/daniel/dev/bewir';

// Mock für fs.existsSync und readFileSync
const mockPdfBuffer = Buffer.from('mock-pdf-template');
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockImplementation((path) => {
    if (path.endsWith('.pdf')) {
      return mockPdfBuffer;
    }
    return Buffer.from('test');
  }),
}));

// Mock für path.join
jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/')),
}));

// Mock für pdf-lib
jest.mock('pdf-lib', () => {
  const mockForm = {
    getTextField: jest.fn().mockReturnValue({
      setText: jest.fn(),
    }),
    flatten: jest.fn(),
  };

  const mockPdfDoc = {
    getPages: jest.fn().mockReturnValue([{
      getHeight: jest.fn().mockReturnValue(100),
      getWidth: jest.fn().mockReturnValue(100),
      drawText: jest.fn(),
      drawImage: jest.fn(),
    }]),
    addPage: jest.fn(),
    save: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-output')),
    getForm: jest.fn().mockReturnValue(mockForm),
  };

  return {
    PDFDocument: {
      load: jest.fn().mockResolvedValue(mockPdfDoc),
    },
    rgb: jest.fn().mockReturnValue({ r: 0, g: 0, b: 0 }),
  };
}); 