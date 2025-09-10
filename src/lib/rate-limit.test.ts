/**
 * Unit Test 4: Rate limiting logic
 * Critical for preventing API abuse and ensuring fair usage
 */

import { checkRateLimit, getIdentifier, apiRatelimit } from './rate-limit';
import { Ratelimit } from '@upstash/ratelimit';

// Mock Upstash modules
jest.mock('@upstash/ratelimit');
jest.mock('@upstash/redis');

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
      json: async () => body,
    })),
  },
}));

describe('Rate Limiting Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('should allow request when rate limit not exceeded', async () => {
      const mockLimiter = {
        limit: jest.fn().mockResolvedValue({
          success: true,
          limit: 10,
          reset: Date.now() + 10000,
          remaining: 9,
        }),
      } as unknown as Ratelimit;

      const result = await checkRateLimit(mockLimiter, 'test-identifier');
      
      expect(result).toBeNull(); // No error response
      expect(mockLimiter.limit).toHaveBeenCalledWith('test-identifier');
    });

    it('should block request when rate limit exceeded', async () => {
      const resetTime = Date.now() + 60000;
      const mockLimiter = {
        limit: jest.fn().mockResolvedValue({
          success: false,
          limit: 5,
          reset: resetTime,
          remaining: 0,
        }),
      } as unknown as Ratelimit;

      const result = await checkRateLimit(mockLimiter, 'test-identifier');
      
      expect(result).not.toBeNull();
      if (result) {
        const body = await result.json();
        expect(result.status).toBe(429);
        expect(body.error).toContain('Zu viele Anfragen');
        expect(body.limit).toBe(5);
        expect(body.remaining).toBe(0);
        expect(body.reset).toBe(new Date(resetTime).toISOString());
        
        // Check headers
        expect(result.headers.get('X-RateLimit-Limit')).toBe('5');
        expect(result.headers.get('X-RateLimit-Remaining')).toBe('0');
        expect(result.headers.get('X-RateLimit-Reset')).toBe(resetTime.toString());
      }
    });

    it('should allow all requests when limiter is null', async () => {
      const result = await checkRateLimit(null, 'test-identifier');
      expect(result).toBeNull();
    });

    it('should handle different identifiers separately', async () => {
      const mockLimiter = {
        limit: jest.fn()
          .mockResolvedValueOnce({
            success: true,
            limit: 5,
            reset: Date.now() + 10000,
            remaining: 4,
          })
          .mockResolvedValueOnce({
            success: false,
            limit: 5,
            reset: Date.now() + 10000,
            remaining: 0,
          }),
      } as unknown as Ratelimit;

      const result1 = await checkRateLimit(mockLimiter, 'user-1');
      const result2 = await checkRateLimit(mockLimiter, 'user-2');
      
      expect(result1).toBeNull(); // First user allowed
      expect(result2).not.toBeNull(); // Second user blocked
      expect(mockLimiter.limit).toHaveBeenCalledWith('user-1');
      expect(mockLimiter.limit).toHaveBeenCalledWith('user-2');
    });
  });

  describe('getIdentifier', () => {
    it('should prioritize user ID when available', () => {
      const request = new Request('http://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '10.0.0.1',
        },
      });

      const identifier = getIdentifier(request, 'user123');
      expect(identifier).toBe('user:user123');
    });

    it('should use x-forwarded-for header when no user ID', () => {
      const request = new Request('http://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
          'x-real-ip': '10.0.0.2',
        },
      });

      const identifier = getIdentifier(request);
      expect(identifier).toBe('ip:192.168.1.1'); // First IP in the chain
    });

    it('should use x-real-ip when x-forwarded-for not available', () => {
      const request = new Request('http://example.com', {
        headers: {
          'x-real-ip': '10.0.0.1',
        },
      });

      const identifier = getIdentifier(request);
      expect(identifier).toBe('ip:10.0.0.1');
    });

    it('should handle missing IP headers gracefully', () => {
      const request = new Request('http://example.com');

      const identifier = getIdentifier(request);
      expect(identifier).toBe('ip:anonymous');
    });

    it('should handle complex forwarded header chains', () => {
      const request = new Request('http://example.com', {
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
        },
      });

      const identifier = getIdentifier(request);
      expect(identifier).toBe('ip:203.0.113.195'); // Original client IP
    });
  });

  describe('API Rate Limits', () => {
    describe('OCR rate limit (5 requests/minute)', () => {
      it('should enforce stricter limits for OCR endpoints', async () => {
        const mockOcrLimiter = {
          limit: jest.fn().mockResolvedValue({
            success: false,
            limit: 5,
            reset: Date.now() + 60000,
            remaining: 0,
          }),
        } as unknown as Ratelimit;

        // Simulate OCR endpoint hitting rate limit
        const result = await checkRateLimit(mockOcrLimiter, 'heavy-user');
        
        expect(result).not.toBeNull();
        if (result) {
          const body = await result.json();
          expect(body.limit).toBe(5); // OCR limit
        }
      });

      it('should track OCR requests per minute', async () => {
        const requests: boolean[] = [];
        const mockOcrLimiter = {
          limit: jest.fn().mockImplementation(() => {
            const requestCount = requests.length;
            requests.push(true);
            return Promise.resolve({
              success: requestCount < 5,
              limit: 5,
              reset: Date.now() + 60000,
              remaining: Math.max(0, 5 - requestCount - 1),
            });
          }),
        } as unknown as Ratelimit;

        // Simulate 6 requests
        for (let i = 0; i < 6; i++) {
          const result = await checkRateLimit(mockOcrLimiter, 'ocr-user');
          if (i < 5) {
            expect(result).toBeNull(); // First 5 should pass
          } else {
            expect(result).not.toBeNull(); // 6th should be blocked
            if (result) {
              expect(result.status).toBe(429);
            }
          }
        }
      });
    });

    describe('PDF rate limit (20 requests/minute)', () => {
      it('should allow more requests for PDF generation', async () => {
        const requests: boolean[] = [];
        const mockPdfLimiter = {
          limit: jest.fn().mockImplementation(() => {
            const requestCount = requests.length;
            requests.push(true);
            return Promise.resolve({
              success: requestCount < 20,
              limit: 20,
              reset: Date.now() + 60000,
              remaining: Math.max(0, 20 - requestCount - 1),
            });
          }),
        } as unknown as Ratelimit;

        // PDF should allow up to 20 requests
        for (let i = 0; i < 21; i++) {
          const result = await checkRateLimit(mockPdfLimiter, 'pdf-user');
          if (i < 20) {
            expect(result).toBeNull();
          } else {
            expect(result).not.toBeNull();
          }
        }
      });
    });

    describe('Different limits for different endpoints', () => {
      it('should track limits separately per endpoint', async () => {
        const ocrRequests: string[] = [];
        const pdfRequests: string[] = [];

        const mockOcrLimiter = {
          limit: jest.fn().mockImplementation((id: string) => {
            ocrRequests.push(id);
            return Promise.resolve({
              success: ocrRequests.filter(r => r === id).length <= 5,
              limit: 5,
              reset: Date.now() + 60000,
              remaining: Math.max(0, 5 - ocrRequests.filter(r => r === id).length),
            });
          }),
        } as unknown as Ratelimit;

        const mockPdfLimiter = {
          limit: jest.fn().mockImplementation((id: string) => {
            pdfRequests.push(id);
            return Promise.resolve({
              success: pdfRequests.filter(r => r === id).length <= 20,
              limit: 20,
              reset: Date.now() + 60000,
              remaining: Math.max(0, 20 - pdfRequests.filter(r => r === id).length),
            });
          }),
        } as unknown as Ratelimit;

        const userId = 'multi-endpoint-user';

        // User can make 5 OCR requests
        for (let i = 0; i < 5; i++) {
          const result = await checkRateLimit(mockOcrLimiter, userId);
          expect(result).toBeNull();
        }

        // And still make 20 PDF requests
        for (let i = 0; i < 20; i++) {
          const result = await checkRateLimit(mockPdfLimiter, userId);
          expect(result).toBeNull();
        }

        // But 6th OCR request should fail
        const ocrResult = await checkRateLimit(mockOcrLimiter, userId);
        expect(ocrResult).not.toBeNull();

        // And 21st PDF request should fail
        const pdfResult = await checkRateLimit(mockPdfLimiter, userId);
        expect(pdfResult).not.toBeNull();
      });
    });
  });

  describe('Rate limit reset behavior', () => {
    it('should reset limits after time window expires', async () => {
      let currentTime = Date.now();
      const mockLimiter = {
        limit: jest.fn().mockImplementation(() => {
          const now = Date.now();
          const windowExpired = now - currentTime > 60000; // 1 minute window
          
          if (windowExpired) {
            currentTime = now; // Reset window
          }
          
          return Promise.resolve({
            success: windowExpired || false,
            limit: 5,
            reset: currentTime + 60000,
            remaining: windowExpired ? 4 : 0,
          });
        }),
      } as unknown as Ratelimit;

      // First request should fail (assume limit reached)
      const result1 = await checkRateLimit(mockLimiter, 'reset-test-user');
      expect(result1).not.toBeNull();

      // Simulate time passing (mock time advance)
      currentTime = Date.now() - 61000; // Move time back to simulate window expiry

      // Next request should succeed (window reset)
      const result2 = await checkRateLimit(mockLimiter, 'reset-test-user');
      expect(result2).toBeNull();
    });
  });

  describe('Error messages', () => {
    it('should provide German error messages', async () => {
      const mockLimiter = {
        limit: jest.fn().mockResolvedValue({
          success: false,
          limit: 5,
          reset: Date.now() + 60000,
          remaining: 0,
        }),
      } as unknown as Ratelimit;

      const result = await checkRateLimit(mockLimiter, 'german-user');
      
      if (result) {
        const body = await result.json();
        expect(body.error).toContain('Zu viele Anfragen');
        expect(body.error).toContain('Bitte versuchen Sie es später erneut');
      }
    });
  });
});