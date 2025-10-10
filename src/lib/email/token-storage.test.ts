/**
 * Tests for token storage service
 * Tests both Redis mode and in-memory fallback mode
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  storeEmailToken,
  getEmailToken,
  deleteEmailToken,
  verifyAndConsumeToken,
  storeTokenByEmail,
  getTokenByEmail,
  deleteTokenByEmail,
  clearMemoryStore,
} from './token-storage';
import type { EmailToken } from './utils';

// Mock Redis
vi.mock('@/lib/redis', () => {
  const mockRedis = {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
  };

  return {
    redis: mockRedis,
    isRedisConfigured: vi.fn().mockReturnValue(false), // Default to in-memory mode
  };
});

describe('Token Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearMemoryStore();
  });

  describe('In-Memory Storage Mode', () => {
    beforeEach(async () => {
      const { isRedisConfigured } = await import('@/lib/redis');
      vi.mocked(isRedisConfigured).mockReturnValue(false);
    });

    describe('storeEmailToken', () => {
      it('should store token in memory', async () => {
        const token = 'test-token-123';
        const tokenData: EmailToken = {
          email: 'user@example.com',
          type: 'magic_link',
          token,
          createdAt: Date.now(),
        };

        const result = await storeEmailToken(token, tokenData);

        expect(result).toBe(true);
      });

      it('should store verification token with correct expiry', async () => {
        const token = 'verify-token-456';
        const tokenData: EmailToken = {
          email: 'user@example.com',
          type: 'email_verify',
          token,
          createdAt: Date.now(),
        };

        const result = await storeEmailToken(token, tokenData);

        expect(result).toBe(true);
      });

      it('should store password reset token', async () => {
        const token = 'reset-token-789';
        const tokenData: EmailToken = {
          email: 'user@example.com',
          type: 'password_reset',
          token,
          createdAt: Date.now(),
        };

        const result = await storeEmailToken(token, tokenData);

        expect(result).toBe(true);
      });
    });

    describe('getEmailToken', () => {
      it('should retrieve stored token', async () => {
        const token = 'test-token-retrieve';
        const createdAt = Date.now();
        const tokenData: EmailToken = {
          email: 'user@example.com',
          type: 'magic_link',
          token,
          createdAt,
        };

        await storeEmailToken(token, tokenData);
        const retrieved = await getEmailToken(token);

        expect(retrieved).toMatchObject({
          email: 'user@example.com',
          type: 'magic_link',
          token,
          createdAt,
        });
      });

      it('should return null for non-existent token', async () => {
        const retrieved = await getEmailToken('non-existent-token');

        expect(retrieved).toBeNull();
      });

      it('should reject expired tokens on store', async () => {
        const token = 'expired-token';
        // Create token with createdAt 11 minutes ago (magic_link expires after 10 min)
        const createdAt = Date.now() - (11 * 60 * 1000);
        const tokenData: EmailToken = {
          email: 'user@example.com',
          type: 'magic_link',
          token,
          createdAt,
        };

        // Storing an already expired token should fail
        const stored = await storeEmailToken(token, tokenData);

        expect(stored).toBe(false);

        // Verify it wasn't stored
        const retrieved = await getEmailToken(token);
        expect(retrieved).toBeNull();
      });
    });

    describe('deleteEmailToken', () => {
      it('should delete stored token', async () => {
        const token = 'test-token-delete';
        const tokenData: EmailToken = {
          email: 'user@example.com',
          type: 'magic_link',
          token,
          createdAt: Date.now(),
        };

        await storeEmailToken(token, tokenData);
        const deleted = await deleteEmailToken(token);

        expect(deleted).toBe(true);

        // Verify it's gone
        const retrieved = await getEmailToken(token);
        expect(retrieved).toBeNull();
      });

      it('should return false when deleting non-existent token', async () => {
        const deleted = await deleteEmailToken('non-existent');

        expect(deleted).toBe(false);
      });
    });

    describe('verifyAndConsumeToken', () => {
      it('should retrieve and delete token in one operation', async () => {
        const token = 'consume-token';
        const createdAt = Date.now();
        const tokenData: EmailToken = {
          email: 'user@example.com',
          type: 'magic_link',
          token,
          createdAt,
        };

        await storeEmailToken(token, tokenData);
        const consumed = await verifyAndConsumeToken(token);

        expect(consumed).toMatchObject({
          email: 'user@example.com',
          type: 'magic_link',
          token,
          createdAt,
        });

        // Verify it's been deleted
        const retrieved = await getEmailToken(token);
        expect(retrieved).toBeNull();
      });

      it('should return null for non-existent token', async () => {
        const consumed = await verifyAndConsumeToken('non-existent');

        expect(consumed).toBeNull();
      });
    });

    describe('storeTokenByEmail', () => {
      it('should store token indexed by email', async () => {
        const email = 'user@example.com';
        const token = 'email-indexed-token';

        const result = await storeTokenByEmail(email, token, 'magic_link');

        expect(result).toBe(true);
      });

      it('should normalize email to lowercase', async () => {
        const email = 'USER@EXAMPLE.COM';
        const token = 'email-token-2';

        await storeTokenByEmail(email, token, 'verification');

        // Should retrieve with lowercase
        const retrieved = await getTokenByEmail('user@example.com', 'verification');
        expect(retrieved).toBe(token);
      });
    });

    describe('getTokenByEmail', () => {
      it('should retrieve token by email', async () => {
        const email = 'user@example.com';
        const token = 'retrieve-by-email';

        await storeTokenByEmail(email, token, 'magic_link');
        const retrieved = await getTokenByEmail(email, 'magic_link');

        expect(retrieved).toBe(token);
      });

      it('should return null for non-existent email', async () => {
        const retrieved = await getTokenByEmail('nonexistent@example.com', 'magic_link');

        expect(retrieved).toBeNull();
      });

      it('should return null for wrong token type', async () => {
        const email = 'user@example.com';
        const token = 'type-specific-token';

        await storeTokenByEmail(email, token, 'magic_link');
        const retrieved = await getTokenByEmail(email, 'verification');

        expect(retrieved).toBeNull();
      });
    });

    describe('deleteTokenByEmail', () => {
      it('should delete token by email', async () => {
        const email = 'user@example.com';
        const token = 'delete-by-email';

        await storeTokenByEmail(email, token, 'magic_link');
        const deleted = await deleteTokenByEmail(email, 'magic_link');

        expect(deleted).toBe(true);

        // Verify deletion
        const retrieved = await getTokenByEmail(email, 'magic_link');
        expect(retrieved).toBeNull();
      });

      it('should return false for non-existent email', async () => {
        const deleted = await deleteTokenByEmail('nonexistent@example.com', 'magic_link');

        expect(deleted).toBe(false);
      });
    });

    describe('clearMemoryStore', () => {
      it('should clear all tokens from memory', async () => {
        const token1 = 'token-1';
        const token2 = 'token-2';
        const tokenData1: EmailToken = {
          email: 'user1@example.com',
          type: 'magic_link',
          token: token1,
          createdAt: Date.now(),
        };
        const tokenData2: EmailToken = {
          email: 'user2@example.com',
          type: 'email_verify',
          token: token2,
          createdAt: Date.now(),
        };

        await storeEmailToken(token1, tokenData1);
        await storeEmailToken(token2, tokenData2);

        clearMemoryStore();

        const retrieved1 = await getEmailToken(token1);
        const retrieved2 = await getEmailToken(token2);

        expect(retrieved1).toBeNull();
        expect(retrieved2).toBeNull();
      });
    });
  });

  describe('Redis Storage Mode', () => {
    beforeEach(async () => {
      const { isRedisConfigured, redis } = await import('@/lib/redis');
      vi.mocked(isRedisConfigured).mockReturnValue(true);

      // Reset mock implementations
      vi.mocked(redis.set).mockResolvedValue('OK');
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(redis.del).mockResolvedValue(1);
    });

    describe('storeEmailToken', () => {
      it('should store token in Redis with correct key and TTL', async () => {
        const { redis } = await import('@/lib/redis');
        const token = 'redis-token-123';
        const tokenData: EmailToken = {
          email: 'user@example.com',
          type: 'magic_link',
          token,
          createdAt: Date.now(),
        };

        await storeEmailToken(token, tokenData);

        expect(redis.set).toHaveBeenCalledWith(
          'email_token:redis-token-123',
          JSON.stringify(tokenData),
          { ex: 600 } // 10 minutes = 600 seconds
        );
      });

      it('should store verification token with 24h TTL', async () => {
        const { redis } = await import('@/lib/redis');
        const token = 'verify-redis-token';
        const tokenData: EmailToken = {
          email: 'user@example.com',
          type: 'email_verify',
          token,
          createdAt: Date.now(),
        };

        await storeEmailToken(token, tokenData);

        expect(redis.set).toHaveBeenCalledWith(
          'email_token:verify-redis-token',
          JSON.stringify(tokenData),
          { ex: 86400 } // 24 hours = 1440 minutes = 86400 seconds
        );
      });
    });

    describe('getEmailToken', () => {
      it('should retrieve token from Redis', async () => {
        const { redis } = await import('@/lib/redis');
        const token = 'redis-retrieve-token';
        const createdAt = Date.now();
        const tokenData: EmailToken = {
          email: 'user@example.com',
          type: 'magic_link',
          token,
          createdAt,
        };

        vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify(tokenData));

        const retrieved = await getEmailToken(token);

        expect(redis.get).toHaveBeenCalledWith('email_token:redis-retrieve-token');
        expect(retrieved).toMatchObject({
          email: 'user@example.com',
          type: 'magic_link',
          token,
          createdAt,
        });
      });

      it('should return null when Redis returns null', async () => {
        const { redis } = await import('@/lib/redis');
        vi.mocked(redis.get).mockResolvedValueOnce(null);

        const retrieved = await getEmailToken('non-existent');

        expect(retrieved).toBeNull();
      });
    });

    describe('deleteEmailToken', () => {
      it('should delete token from Redis', async () => {
        const { redis } = await import('@/lib/redis');
        vi.mocked(redis.del).mockResolvedValueOnce(1);

        const deleted = await deleteEmailToken('redis-delete-token');

        expect(redis.del).toHaveBeenCalledWith('email_token:redis-delete-token');
        expect(deleted).toBe(true);
      });

      it('should return false when Redis del returns 0', async () => {
        const { redis } = await import('@/lib/redis');
        vi.mocked(redis.del).mockResolvedValueOnce(0);

        const deleted = await deleteEmailToken('non-existent');

        expect(deleted).toBe(false);
      });
    });

    describe('storeTokenByEmail', () => {
      it('should store token by email in Redis', async () => {
        const { redis } = await import('@/lib/redis');
        const email = 'user@example.com';
        const token = 'email-indexed-redis-token';

        await storeTokenByEmail(email, token, 'magic_link');

        expect(redis.set).toHaveBeenCalledWith(
          'email_token_by_email:magic_link:user@example.com',
          token,
          { ex: 600 }
        );
      });
    });

    describe('getTokenByEmail', () => {
      it('should retrieve token by email from Redis', async () => {
        const { redis } = await import('@/lib/redis');
        const email = 'user@example.com';
        const token = 'retrieved-redis-token';

        vi.mocked(redis.get).mockResolvedValueOnce(token);

        const retrieved = await getTokenByEmail(email, 'magic_link');

        expect(redis.get).toHaveBeenCalledWith('email_token_by_email:magic_link:user@example.com');
        expect(retrieved).toBe(token);
      });
    });

    describe('deleteTokenByEmail', () => {
      it('should delete token by email from Redis', async () => {
        const { redis } = await import('@/lib/redis');
        vi.mocked(redis.del).mockResolvedValueOnce(1);

        const deleted = await deleteTokenByEmail('user@example.com', 'magic_link');

        expect(redis.del).toHaveBeenCalledWith('email_token_by_email:magic_link:user@example.com');
        expect(deleted).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const { isRedisConfigured } = await import('@/lib/redis');
      vi.mocked(isRedisConfigured).mockReturnValue(true);
    });

    it('should handle Redis set errors gracefully', async () => {
      const { redis } = await import('@/lib/redis');
      vi.mocked(redis.set).mockRejectedValueOnce(new Error('Redis connection failed'));

      const token = 'error-token';
      const tokenData: EmailToken = {
        email: 'user@example.com',
        type: 'magic_link',
        token,
        createdAt: Date.now(),
      };

      const result = await storeEmailToken(token, tokenData);

      expect(result).toBe(false);
    });

    it('should handle Redis get errors gracefully', async () => {
      const { redis } = await import('@/lib/redis');
      vi.mocked(redis.get).mockRejectedValueOnce(new Error('Redis timeout'));

      const retrieved = await getEmailToken('error-token');

      expect(retrieved).toBeNull();
    });

    it('should handle Redis del errors gracefully', async () => {
      const { redis } = await import('@/lib/redis');
      vi.mocked(redis.del).mockRejectedValueOnce(new Error('Redis error'));

      const deleted = await deleteEmailToken('error-token');

      expect(deleted).toBe(false);
    });
  });
});
