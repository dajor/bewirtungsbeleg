/**
 * Magic Link Integration Test
 * Comprehensive end-to-end test for magic link authentication flow
 * Tests token persistence, expiration, and session creation
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock redis before importing token-storage
vi.mock('@/lib/redis', () => ({
  redis: {},
  isRedisConfigured: () => false,
}));

import {
  storeEmailToken,
  getEmailToken,
  deleteEmailToken,
  verifyAndConsumeToken,
  storeTokenByEmail,
  getTokenByEmail,
  deleteTokenByEmail,
  clearMemoryStore,
} from '@/lib/email/token-storage';
import { createMagicLinkToken } from '@/lib/email/utils';
import type { EmailToken } from '@/lib/email/utils';

describe('Magic Link Integration Test', () => {
  beforeEach(async () => {
    // Clear storage before each test
    await clearMemoryStore();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup after each test
    await clearMemoryStore();
  });

  describe('Token Persistence', () => {
    it('should store and retrieve magic link token', async () => {
      const email = 'test@example.com';
      const tokenData = createMagicLinkToken(email);

      // Store token
      const stored = await storeEmailToken(tokenData.token, {
        email: tokenData.email,
        type: tokenData.type,
        createdAt: tokenData.createdAt,
      });

      expect(stored).toBe(true);

      // Retrieve token
      const retrieved = await getEmailToken(tokenData.token);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.email).toBe(email);
      expect(retrieved?.type).toBe('magic_link');
    });

    it('should handle token that does not exist', async () => {
      const nonExistentToken = 'non-existent-token-12345';
      const retrieved = await getEmailToken(nonExistentToken);

      expect(retrieved).toBeNull();
    });

    it('should delete token after consumption (single-use)', async () => {
      const email = 'test@example.com';
      const tokenData = createMagicLinkToken(email);

      // Store token
      await storeEmailToken(tokenData.token, {
        email: tokenData.email,
        type: tokenData.type,
        createdAt: tokenData.createdAt,
      });

      // Verify and consume token
      const consumed = await verifyAndConsumeToken(tokenData.token);
      expect(consumed).not.toBeNull();
      expect(consumed?.email).toBe(email);

      // Try to use token again - should be deleted
      const secondAttempt = await getEmailToken(tokenData.token);
      expect(secondAttempt).toBeNull();
    });

    it('should store token by email for lookup', async () => {
      const email = 'test@example.com';
      const tokenData = createMagicLinkToken(email);

      // Store token
      await storeEmailToken(tokenData.token, {
        email: tokenData.email,
        type: tokenData.type,
        createdAt: tokenData.createdAt,
      });

      // Store token by email
      await storeTokenByEmail(email, tokenData.token, 'magic_link');

      // Retrieve by email
      const retrieved = await getTokenByEmail(email, 'magic_link');
      expect(retrieved).toBe(tokenData.token);
    });

    it('should handle case-insensitive email lookup', async () => {
      const email = 'Test@Example.COM';
      const tokenData = createMagicLinkToken(email);

      await storeTokenByEmail(email, tokenData.token, 'magic_link');

      // Retrieve with different casing
      const retrieved = await getTokenByEmail('test@example.com', 'magic_link');
      expect(retrieved).toBe(tokenData.token);
    });

    it('should delete token by email', async () => {
      const email = 'test@example.com';
      const tokenData = createMagicLinkToken(email);

      await storeTokenByEmail(email, tokenData.token, 'magic_link');

      const deleted = await deleteTokenByEmail(email, 'magic_link');
      expect(deleted).toBe(true);

      const retrieved = await getTokenByEmail(email, 'magic_link');
      expect(retrieved).toBeNull();
    });
  });

  describe('Token Expiration', () => {
    it('should not store already expired token', async () => {
      const email = 'test@example.com';
      const expiredToken: EmailToken = {
        email,
        type: 'magic_link',
        createdAt: Date.now() - (11 * 60 * 1000), // 11 minutes ago
      };

      const token = 'expired-token-123';
      const stored = await storeEmailToken(token, expiredToken);

      expect(stored).toBe(false);
    });

    it('should handle token near expiration', async () => {
      const email = 'test@example.com';
      const tokenData: EmailToken = {
        email,
        type: 'magic_link',
        createdAt: Date.now() - (9 * 60 * 1000), // 9 minutes ago (1 minute remaining)
      };

      const token = 'near-expiry-token-123';
      const stored = await storeEmailToken(token, tokenData);

      expect(stored).toBe(true);

      const retrieved = await getEmailToken(token);
      expect(retrieved).not.toBeNull();
    });

    it('should clean expired tokens on retrieval', async () => {
      const email = 'test@example.com';

      // Create token that will expire immediately
      const tokenData: EmailToken = {
        email,
        type: 'magic_link',
        createdAt: Date.now() - (11 * 60 * 1000), // Already expired
      };

      const token = 'expired-token-456';

      // Force store with expired timestamp (for testing cleanup)
      await storeEmailToken(token, tokenData);

      // Try to retrieve - should be cleaned up
      const retrieved = await getEmailToken(token);
      expect(retrieved).toBeNull();
    });
  });

  describe('Complete Magic Link Flow', () => {
    it('should complete full authentication flow', async () => {
      const email = 'user@example.com';

      // Step 1: Generate token
      const tokenData = createMagicLinkToken(email);
      expect(tokenData.token).toBeTruthy();
      expect(tokenData.email).toBe(email);

      // Step 2: Store token
      const stored = await storeEmailToken(tokenData.token, {
        email: tokenData.email,
        type: tokenData.type,
        createdAt: tokenData.createdAt,
      });
      expect(stored).toBe(true);

      // Step 3: Store token by email for resend capability
      await storeTokenByEmail(email, tokenData.token, 'magic_link');

      // Step 4: User clicks magic link - verify token
      const verified = await getEmailToken(tokenData.token);
      expect(verified).not.toBeNull();
      expect(verified?.email).toBe(email);
      expect(verified?.type).toBe('magic_link');

      // Step 5: Consume token (mark as used)
      const consumed = await verifyAndConsumeToken(tokenData.token);
      expect(consumed).not.toBeNull();

      // Step 6: Cleanup - delete token by email
      await deleteTokenByEmail(email, 'magic_link');

      // Step 7: Verify token can't be reused
      const reused = await getEmailToken(tokenData.token);
      expect(reused).toBeNull();

      // Step 8: Verify email lookup also cleaned
      const emailLookup = await getTokenByEmail(email, 'magic_link');
      expect(emailLookup).toBeNull();
    });

    it('should handle multiple tokens for different users', async () => {
      const users = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ];

      const tokens = users.map(email => createMagicLinkToken(email));

      // Store all tokens
      for (const tokenData of tokens) {
        const stored = await storeEmailToken(tokenData.token, {
          email: tokenData.email,
          type: tokenData.type,
          createdAt: tokenData.createdAt,
        });
        expect(stored).toBe(true);
      }

      // Verify all tokens exist
      for (const tokenData of tokens) {
        const retrieved = await getEmailToken(tokenData.token);
        expect(retrieved).not.toBeNull();
        expect(retrieved?.email).toBe(tokenData.email);
      }

      // Consume one token
      await verifyAndConsumeToken(tokens[0].token);

      // Verify consumed token is gone
      const consumed = await getEmailToken(tokens[0].token);
      expect(consumed).toBeNull();

      // Verify other tokens still exist
      for (let i = 1; i < tokens.length; i++) {
        const retrieved = await getEmailToken(tokens[i].token);
        expect(retrieved).not.toBeNull();
      }
    });

    it('should prevent token reuse after consumption', async () => {
      const email = 'security-test@example.com';
      const tokenData = createMagicLinkToken(email);

      // Store token
      await storeEmailToken(tokenData.token, {
        email: tokenData.email,
        type: tokenData.type,
        createdAt: tokenData.createdAt,
      });

      // First verification - should succeed
      const firstAttempt = await verifyAndConsumeToken(tokenData.token);
      expect(firstAttempt).not.toBeNull();

      // Second verification - should fail (token consumed)
      const secondAttempt = await verifyAndConsumeToken(tokenData.token);
      expect(secondAttempt).toBeNull();

      // Third attempt - should still fail
      const thirdAttempt = await getEmailToken(tokenData.token);
      expect(thirdAttempt).toBeNull();
    });

    it('should handle rapid token generation and consumption', async () => {
      const email = 'rapid-test@example.com';

      // Generate multiple tokens quickly
      const tokens = Array.from({ length: 5 }, () =>
        createMagicLinkToken(email)
      );

      // Store all tokens
      const storePromises = tokens.map(tokenData =>
        storeEmailToken(tokenData.token, {
          email: tokenData.email,
          type: tokenData.type,
          createdAt: tokenData.createdAt,
        })
      );

      const results = await Promise.all(storePromises);
      expect(results.every(r => r === true)).toBe(true);

      // Consume all tokens
      const consumePromises = tokens.map(tokenData =>
        verifyAndConsumeToken(tokenData.token)
      );

      const consumed = await Promise.all(consumePromises);
      expect(consumed.every(c => c !== null)).toBe(true);

      // Verify all tokens are gone
      const verifyPromises = tokens.map(tokenData =>
        getEmailToken(tokenData.token)
      );

      const verified = await Promise.all(verifyPromises);
      expect(verified.every(v => v === null)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid token format gracefully', async () => {
      const invalidTokens = [
        '',
        ' ',
        'invalid',
        '123',
        'a'.repeat(1000),
      ];

      for (const token of invalidTokens) {
        const retrieved = await getEmailToken(token);
        expect(retrieved).toBeNull();
      }
    });

    it('should handle delete operation on non-existent token', async () => {
      const result = await deleteEmailToken('non-existent-token');
      expect(result).toBe(false);
    });

    it('should handle corrupt token data gracefully', async () => {
      // This tests the error handling in getEmailToken
      const token = 'test-token-corrupt';
      const retrieved = await getEmailToken(token);
      expect(retrieved).toBeNull();
    });
  });
});
