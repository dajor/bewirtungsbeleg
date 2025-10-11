/**
 * Integration tests for token-storage module with Redis
 * Tests the actual Redis client calls to ensure compatibility with ioredis
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { storeEmailToken, storeTokenByEmail, getEmailToken } from '../token-storage';
import type { EmailToken } from '../utils';

// Mock the redis module - use factory function
vi.mock('@/lib/redis', () => {
  return {
    redis: {
      setex: vi.fn(),
      get: vi.fn(),
      del: vi.fn(),
    },
    isRedisConfigured: () => true,
  };
});

describe('token-storage with Redis (ioredis client)', () => {
  let mockSetex: any;
  let mockGet: any;
  let mockDel: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get references to mocked functions
    const { redis } = await import('@/lib/redis');
    mockSetex = redis.setex as any;
    mockGet = redis.get as any;
    mockDel = redis.del as any;

    mockSetex.mockResolvedValue('OK');
    mockGet.mockResolvedValue(null);
    mockDel.mockResolvedValue(1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * ISSUE: Fixed Redis API compatibility issue
   *
   * PROBLEM: Code was using Upstash Redis syntax: redis.set(key, value, { ex: ttl })
   *          But ioredis uses different syntax: redis.setex(key, ttl, value)
   *
   * This caused runtime error in production when using standard Redis/Valkey
   */
  describe('storeEmailToken() - ioredis compatibility', () => {
    it('should use ioredis setex() with correct parameter order', async () => {
      // GIVEN: Valid password reset token
      const token = 'test-token-123';
      const tokenData: EmailToken = {
        email: 'user@example.com',
        type: 'password_reset',
        token,
        createdAt: Date.now(),
      };

      // WHEN: Storing token in Redis
      const result = await storeEmailToken(token, tokenData);

      // THEN: Should call setex with correct ioredis parameter order
      expect(result).toBe(true);
      expect(mockSetex).toHaveBeenCalledWith(
        `email_token:${token}`,
        expect.any(Number), // TTL in seconds
        expect.stringContaining('"email":"user@example.com"') // JSON.stringify(tokenData)
      );

      // THEN: Verify parameter order: key, ttl, value
      const [key, ttl, value] = mockSetex.mock.calls[0];
      expect(key).toBe(`email_token:${token}`);
      expect(typeof ttl).toBe('number');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(30 * 60); // Max 30 minutes (password_reset default)
      expect(JSON.parse(value)).toMatchObject({
        email: 'user@example.com',
        type: 'password_reset',
      });
    });

    it('should calculate correct TTL from token createdAt', async () => {
      // GIVEN: Token created 5 minutes ago
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const token = 'test-token-456';
      const tokenData: EmailToken = {
        email: 'user@example.com',
        type: 'password_reset',
        token,
        createdAt: fiveMinutesAgo,
      };

      // WHEN: Storing token
      await storeEmailToken(token, tokenData);

      // THEN: TTL should be 25 minutes (30 - 5)
      const [, ttl] = mockSetex.mock.calls[0];
      const expectedTTL = 25 * 60; // 25 minutes in seconds
      expect(ttl).toBeGreaterThanOrEqual(expectedTTL - 5); // Allow 5 second margin
      expect(ttl).toBeLessThanOrEqual(expectedTTL + 5);
    });

    it('should not store expired tokens', async () => {
      // GIVEN: Token created 35 minutes ago (expired, max is 30)
      const thirtyFiveMinutesAgo = Date.now() - 35 * 60 * 1000;
      const token = 'expired-token';
      const tokenData: EmailToken = {
        email: 'user@example.com',
        type: 'password_reset',
        token,
        createdAt: thirtyFiveMinutesAgo,
      };

      // WHEN: Attempting to store expired token
      const result = await storeEmailToken(token, tokenData);

      // THEN: Should return false and not call setex
      expect(result).toBe(false);
      expect(mockSetex).not.toHaveBeenCalled();
    });
  });

  describe('storeTokenByEmail() - ioredis compatibility', () => {
    it('should use ioredis setex() for email→token mapping', async () => {
      // GIVEN: Email and token for password reset
      const email = 'test@example.com';
      const token = 'token-xyz';

      // WHEN: Storing token by email
      const result = await storeTokenByEmail(email, token, 'password_reset');

      // THEN: Should call setex with correct parameter order
      expect(result).toBe(true);
      expect(mockSetex).toHaveBeenCalledWith(
        'email_token_by_email:password_reset:test@example.com',
        30 * 60, // 30 minutes in seconds
        token
      );
    });

    it('should lowercase email for consistent storage', async () => {
      // GIVEN: Email with uppercase letters
      const email = 'USER@EXAMPLE.COM';
      const token = 'token-abc';

      // WHEN: Storing token
      await storeTokenByEmail(email, token, 'password_reset');

      // THEN: Key should use lowercase email
      const [key] = mockSetex.mock.calls[0];
      expect(key).toBe('email_token_by_email:password_reset:user@example.com');
    });
  });

  describe('getEmailToken() - ioredis compatibility', () => {
    it('should retrieve and parse token data from Redis', async () => {
      // GIVEN: Token data stored in Redis
      const token = 'stored-token';
      const storedData: EmailToken = {
        email: 'user@example.com',
        type: 'password_reset',
        token,
        createdAt: Date.now(),
      };
      mockGet.mockResolvedValueOnce(JSON.stringify(storedData));

      // WHEN: Retrieving token
      const result = await getEmailToken(token);

      // THEN: Should return parsed token data
      expect(result).toMatchObject({
        email: 'user@example.com',
        type: 'password_reset',
      });
      expect(mockGet).toHaveBeenCalledWith(`email_token:${token}`);
    });

    it('should return null for non-existent token', async () => {
      // GIVEN: Token not in Redis
      mockGet.mockResolvedValueOnce(null);

      // WHEN: Retrieving non-existent token
      const result = await getEmailToken('non-existent-token');

      // THEN: Should return null
      expect(result).toBeNull();
    });
  });

  describe('Error handling with Redis failures', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // GIVEN: Redis setex throws connection error
      mockSetex.mockRejectedValueOnce(new Error('Redis connection failed'));

      const token = 'test-token';
      const tokenData: EmailToken = {
        email: 'user@example.com',
        type: 'password_reset',
        token,
        createdAt: Date.now(),
      };

      // WHEN: Attempting to store token
      const result = await storeEmailToken(token, tokenData);

      // THEN: Should return false instead of throwing
      expect(result).toBe(false);
    });

    it('should handle Redis get errors gracefully', async () => {
      // GIVEN: Redis get throws error
      mockGet.mockRejectedValueOnce(new Error('Redis read error'));

      // WHEN: Attempting to retrieve token
      const result = await getEmailToken('test-token');

      // THEN: Should return null instead of throwing
      expect(result).toBeNull();
    });
  });
});
