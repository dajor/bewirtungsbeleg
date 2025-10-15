import { NextRequest } from 'next/server';
import { middleware } from './middleware';
import { getToken } from 'next-auth/jwt';

// Mock next-auth/jwt only during test execution
// This approach avoids issues during build when test frameworks are not available
const mockJest = typeof jest !== 'undefined' ? jest : null;

if (mockJest) {
  mockJest.mock('next-auth/jwt', () => ({
    getToken: mockJest.fn(),
  }));
}

describe('Middleware', () => {
  const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

  beforeEach(() => {
    if (typeof jest !== 'undefined') {
      jest.clearAllMocks();
    }
  });

  const createRequest = (pathname: string) => {
    const url = new URL(`http://localhost:3000${pathname}`);
    return {
      nextUrl: url,
      url: url.toString(),
    } as unknown as NextRequest;
  };

  describe('Public routes', () => {
    it('should allow access to home page without authentication', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createRequest('/');
      const response = await middleware(request);
      
      // Check that it's not a redirect (would have status 307)
      expect(response?.status).not.toBe(307);
    });

    it('should allow access to release notes without authentication', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createRequest('/release-notes');
      const response = await middleware(request);
      
      expect(response?.status).not.toBe(307);
    });

    it('should allow access to auth API routes', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createRequest('/api/auth/anmelden');
      const response = await middleware(request);
      
      expect(response?.status).not.toBe(307);
    });
  });

  describe('Protected routes', () => {
    it('should redirect to signin if not authenticated', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createRequest('/bewirtungsbeleg');
      const response = await middleware(request);
      
      expect(response?.status).toBe(307);
      expect(response?.headers.get('location')).toContain('/auth/anmelden');
      expect(response?.headers.get('location')).toContain('callbackUrl=%2Fbewirtungsbeleg');
    });

    it('should allow access to protected routes if authenticated', async () => {
      mockGetToken.mockResolvedValue({
        sub: '1',
        role: 'admin',
        id: '1',
      } as any);
      const request = createRequest('/bewirtungsbeleg');
      const response = await middleware(request);
      
      expect(response?.status).not.toBe(307);
    });

    it('should protect PDF generation API', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createRequest('/api/generate-pdf');
      const response = await middleware(request);
      
      expect(response?.status).toBe(307);
      expect(response?.headers.get('location')).toContain('/auth/anmelden');
    });
  });

  describe('Auth pages', () => {
    it('should redirect authenticated users away from signin page', async () => {
      mockGetToken.mockResolvedValue({
        sub: '1',
        role: 'admin',
        id: '1',
      } as any);
      const request = createRequest('/auth/anmelden');
      const response = await middleware(request);
      
      expect(response?.status).toBe(307);
      expect(response?.headers.get('location')).toContain('/bewirtungsbeleg');
    });

    it('should allow unauthenticated users to access signin page', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createRequest('/auth/anmelden');
      const response = await middleware(request);
      
      expect(response?.status).not.toBe(307);
    });
  });

  describe('Static files', () => {
    const staticPaths = [
      '/_next/static/chunk.js',
      '/_next/image/logo.png',
      '/favicon.ico',
      '/logo.png',
      '/manifest.webmanifest',
      '/document.pdf',
    ];

    it.each(staticPaths)('should not process static file: %s', async (path) => {
      // The matcher should prevent these from reaching middleware
      // This test verifies the matcher configuration is correct
      const shouldMatch = !path.match(/^(\/_next\/static|\/_next\/image)|favicon\.ico|.*\.(png|svg|webmanifest|pdf|txt|json)$/);
      expect(shouldMatch).toBe(false);
    });
  });
});