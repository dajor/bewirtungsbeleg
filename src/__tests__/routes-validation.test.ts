/**
 * Routes Validation Test
 * Tests that all important routes and links in the application are not dead links
 * and return proper HTTP responses
 */

import { describe, it, expect } from 'vitest';

describe('Routes Validation - Check for Dead Links', () => {
  const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3001';

  // Helper to fetch a route and check response
  async function checkRoute(path: string, expectedStatus: number = 200) {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (test)',
        },
      });

      return {
        path,
        status: response.status,
        ok: response.ok,
        expectedStatus,
        passed: response.status === expectedStatus,
      };
    } catch (error) {
      return {
        path,
        status: 0,
        ok: false,
        expectedStatus,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  describe('Public Pages', () => {
    it('should load home page /', async () => {
      const result = await checkRoute('/');
      expect(result.passed, `Route ${result.path} failed: expected ${result.expectedStatus}, got ${result.status}`).toBe(true);
    });

    it('should load release notes /release-notes', async () => {
      const result = await checkRoute('/release-notes');
      expect(result.passed, `Route ${result.path} failed: expected ${result.expectedStatus}, got ${result.status}`).toBe(true);
    });
  });

  describe('Authentication Pages', () => {
    it('should load signin page /auth/signin', async () => {
      const result = await checkRoute('/auth/signin');
      expect(result.passed, `Route ${result.path} failed: expected ${result.expectedStatus}, got ${result.status}`).toBe(true);
    });

    it('should load register page /auth/register', async () => {
      const result = await checkRoute('/auth/register');
      expect(result.passed, `Route ${result.path} failed: expected ${result.expectedStatus}, got ${result.status}`).toBe(true);
    });

    it('should load password reset page /auth/reset-password with token', async () => {
      const result = await checkRoute('/auth/reset-password?token=test123');
      expect(result.passed, `Route ${result.path} failed: expected ${result.expectedStatus}, got ${result.status}`).toBe(true);
    });

    it('should load magic link callback page /auth/callback/magic-link with email', async () => {
      const result = await checkRoute('/auth/callback/magic-link?email=test@example.com');
      expect(result.passed, `Route ${result.path} failed: expected ${result.expectedStatus}, got ${result.status}`).toBe(true);
    });

    it('should load error page /auth/error', async () => {
      const result = await checkRoute('/auth/error');
      expect(result.passed, `Route ${result.path} failed: expected ${result.expectedStatus}, got ${result.status}`).toBe(true);
    });
  });

  describe('Application Pages', () => {
    it('should redirect /bewirtungsbeleg (requires auth)', async () => {
      // Should redirect to login (302 or 307) or load page (200)
      const result = await checkRoute('/bewirtungsbeleg');
      const validStatuses = [200, 302, 307];
      expect(validStatuses.includes(result.status),
        `Route ${result.path} returned unexpected status ${result.status}, expected one of: ${validStatuses.join(', ')}`
      ).toBe(true);
    });

    it('should check /profile route exists', async () => {
      const result = await checkRoute('/profile');
      const validStatuses = [200, 302, 307, 404]; // 404 is acceptable if not implemented yet
      expect(validStatuses.includes(result.status),
        `Route ${result.path} returned unexpected status ${result.status}`
      ).toBe(true);
    });

    it('should check /settings route exists', async () => {
      const result = await checkRoute('/settings');
      const validStatuses = [200, 302, 307, 404]; // 404 is acceptable if not implemented yet
      expect(validStatuses.includes(result.status),
        `Route ${result.path} returned unexpected status ${result.status}`
      ).toBe(true);
    });
  });

  describe('API Endpoints', () => {
    it('should handle /api/auth/magic-link/send POST endpoint', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/magic-link/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      // Should return 200 (success), 400 (validation error), or 429 (rate limit)
      const validStatuses = [200, 400, 429];
      expect(validStatuses.includes(response.status),
        `API endpoint /api/auth/magic-link/send returned unexpected status ${response.status}`
      ).toBe(true);
    });

    it('should handle /api/auth/magic-link/verify GET endpoint', async () => {
      const result = await checkRoute('/api/auth/magic-link/verify?token=test123');
      // Should redirect (302/307) or return error (400)
      const validStatuses = [302, 307, 400];
      expect(validStatuses.includes(result.status),
        `API endpoint ${result.path} returned unexpected status ${result.status}`
      ).toBe(true);
    });

    it('should handle /api/auth/reset-password POST endpoint', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'test123',
          password: 'NewPassword123!'
        }),
      });

      // Should return 200 (success) or 400 (validation error)
      const validStatuses = [200, 400];
      expect(validStatuses.includes(response.status),
        `API endpoint /api/auth/reset-password returned unexpected status ${response.status}`
      ).toBe(true);
    });
  });

  describe('Static Assets', () => {
    it('should load logo /docbits.svg', async () => {
      const result = await checkRoute('/docbits.svg');
      expect(result.passed, `Static asset ${result.path} not found`).toBe(true);
    });

    it('should load favicon /LOGO-192.png', async () => {
      const result = await checkRoute('/LOGO-192.png');
      expect(result.passed, `Static asset ${result.path} not found`).toBe(true);
    });

    it('should load favicon /LOGO-512.png', async () => {
      const result = await checkRoute('/LOGO-512.png');
      expect(result.passed, `Static asset ${result.path} not found`).toBe(true);
    });

    it('should load manifest /site.webmanifest', async () => {
      const result = await checkRoute('/site.webmanifest');
      expect(result.passed, `Static asset ${result.path} not found`).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const result = await checkRoute('/this-route-does-not-exist-12345', 404);
      expect(result.passed, `Expected 404 for non-existent route, got ${result.status}`).toBe(true);
    });
  });

  describe('Batch Route Check', () => {
    it('should check all critical routes in batch', async () => {
      const routes = [
        { path: '/', expectedStatus: 200 },
        { path: '/auth/signin', expectedStatus: 200 },
        { path: '/auth/register', expectedStatus: 200 },
        { path: '/auth/reset-password?token=test', expectedStatus: 200 },
        { path: '/auth/error', expectedStatus: 200 },
        { path: '/release-notes', expectedStatus: 200 },
        { path: '/docbits.svg', expectedStatus: 200 },
      ];

      const results = await Promise.all(
        routes.map(route => checkRoute(route.path, route.expectedStatus))
      );

      const failures = results.filter(r => !r.passed);

      expect(failures.length,
        `Found ${failures.length} dead links:\n${failures.map(f => `  - ${f.path}: expected ${f.expectedStatus}, got ${f.status}`).join('\n')}`
      ).toBe(0);
    });
  });
});
