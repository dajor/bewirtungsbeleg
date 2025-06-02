// Mock env module first
jest.mock('./server-only', () => ({
  env: {
    UPSTASH_REDIS_REST_URL: '',
    UPSTASH_REDIS_REST_TOKEN: '',
  },
}));

// Mock Upstash modules
jest.mock('@upstash/ratelimit');
jest.mock('@upstash/redis');

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => {
      const response = {
        status: init?.status || 200,
        headers: new Map(Object.entries(init?.headers || {})),
      };
      return response;
    }),
  },
}));

// Import after mocking
import { checkRateLimit, getIdentifier } from './rate-limit';
import { Ratelimit } from '@upstash/ratelimit';
import { NextResponse } from 'next/server';

describe('Rate Limiting', () => {
  describe('checkRateLimit', () => {
    it('should return null if rate limiter is not configured', async () => {
      const result = await checkRateLimit(null, 'test-id');
      expect(result).toBeNull();
    });

    it('should return null if rate limit is not exceeded', async () => {
      const mockLimiter = {
        limit: jest.fn().mockResolvedValue({
          success: true,
          limit: 10,
          reset: Date.now() + 60000,
          remaining: 9,
        }),
      } as unknown as Ratelimit;

      const result = await checkRateLimit(mockLimiter, 'test-id');
      expect(result).toBeNull();
      expect(mockLimiter.limit).toHaveBeenCalledWith('test-id');
    });

    it('should return 429 response if rate limit is exceeded', async () => {
      const resetTime = Date.now() + 60000;
      const mockLimiter = {
        limit: jest.fn().mockResolvedValue({
          success: false,
          limit: 10,
          reset: resetTime,
          remaining: 0,
        }),
      } as unknown as Ratelimit;

      const result = await checkRateLimit(mockLimiter, 'test-id');
      expect(result).not.toBeNull();
      expect(result?.status).toBe(429);
      
      const headers = result?.headers;
      expect(headers?.get('X-RateLimit-Limit')).toBe('10');
      expect(headers?.get('X-RateLimit-Remaining')).toBe('0');
      expect(headers?.get('X-RateLimit-Reset')).toBe(resetTime.toString());
    });
  });

  describe('getIdentifier', () => {
    it('should return user identifier if userId is provided', () => {
      const request = new Request('http://localhost');
      const identifier = getIdentifier(request, 'user123');
      expect(identifier).toBe('user:user123');
    });

    it('should return IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });
      const identifier = getIdentifier(request);
      expect(identifier).toBe('ip:192.168.1.1');
    });

    it('should return IP from x-real-ip header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      });
      const identifier = getIdentifier(request);
      expect(identifier).toBe('ip:192.168.1.2');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.2',
        },
      });
      const identifier = getIdentifier(request);
      expect(identifier).toBe('ip:192.168.1.1');
    });

    it('should return anonymous if no IP headers are present', () => {
      const request = new Request('http://localhost');
      const identifier = getIdentifier(request);
      expect(identifier).toBe('ip:anonymous');
    });
  });
});