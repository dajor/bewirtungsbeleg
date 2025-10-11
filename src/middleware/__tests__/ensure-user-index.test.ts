/**
 * Unit tests for ensure-user-index middleware
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ensureUserIndexMiddleware,
  clearUserIndexCache,
  clearAllUserIndexCache,
} from '../ensure-user-index';

// Mock opensearch module
vi.mock('@/lib/opensearch', () => ({
  ensureUserIndex: vi.fn(),
}));

describe('ensure-user-index.ts - User Index Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllUserIndexCache();
  });

  describe('ensureUserIndexMiddleware()', () => {
    it('should ensure user index exists', async () => {
      const { ensureUserIndex } = await import('@/lib/opensearch');
      (ensureUserIndex as any).mockResolvedValue(true);

      const success = await ensureUserIndexMiddleware('user-1');

      expect(success).toBe(true);
      expect(ensureUserIndex).toHaveBeenCalledWith('user-1');
    });

    it('should return false when no user ID provided', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const success = await ensureUserIndexMiddleware('');

      expect(success).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No user ID provided')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should use cache for repeated calls within duration', async () => {
      const { ensureUserIndex } = await import('@/lib/opensearch');
      (ensureUserIndex as any).mockResolvedValue(true);

      // First call
      await ensureUserIndexMiddleware('user-1');
      // Second call (should use cache)
      await ensureUserIndexMiddleware('user-1');

      // Should only call ensureUserIndex once
      expect(ensureUserIndex).toHaveBeenCalledTimes(1);
    });

    it('should skip API call if recently checked', async () => {
      const { ensureUserIndex } = await import('@/lib/opensearch');
      (ensureUserIndex as any).mockResolvedValue(true);

      // First call - should hit API
      await ensureUserIndexMiddleware('user-1');

      // Clear mock to verify second call doesn't happen
      (ensureUserIndex as any).mockClear();

      // Second call immediately - should use cache
      const success = await ensureUserIndexMiddleware('user-1');

      expect(success).toBe(true);
      expect(ensureUserIndex).not.toHaveBeenCalled();
    });

    it('should update cache after successful check', async () => {
      const { ensureUserIndex } = await import('@/lib/opensearch');
      (ensureUserIndex as any).mockResolvedValue(true);

      await ensureUserIndexMiddleware('user-1');

      // Clear mock
      (ensureUserIndex as any).mockClear();

      // Immediate second call should use cache
      await ensureUserIndexMiddleware('user-1');

      expect(ensureUserIndex).not.toHaveBeenCalled();
    });

    it('should not cache failed checks', async () => {
      const { ensureUserIndex } = await import('@/lib/opensearch');
      (ensureUserIndex as any).mockResolvedValue(false);

      // First call fails
      const success1 = await ensureUserIndexMiddleware('user-1');
      expect(success1).toBe(false);

      // Second call should try again
      const success2 = await ensureUserIndexMiddleware('user-1');

      expect(ensureUserIndex).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent requests gracefully', async () => {
      const { ensureUserIndex } = await import('@/lib/opensearch');
      (ensureUserIndex as any).mockResolvedValue(true);

      // Simulate concurrent requests
      const promises = [
        ensureUserIndexMiddleware('user-1'),
        ensureUserIndexMiddleware('user-1'),
        ensureUserIndexMiddleware('user-1'),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      expect(results.every((r) => r === true)).toBe(true);

      // Should have called API at least once (may be more due to race condition)
      expect(ensureUserIndex).toHaveBeenCalled();
    });

    it('should log index creation events', async () => {
      const { ensureUserIndex } = await import('@/lib/opensearch');
      (ensureUserIndex as any).mockResolvedValue(true);

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await ensureUserIndexMiddleware('user-1');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Ensuring OpenSearch index for user: user-1')
      );

      consoleLogSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      const { ensureUserIndex } = await import('@/lib/opensearch');
      (ensureUserIndex as any).mockRejectedValue(new Error('OpenSearch error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const success = await ensureUserIndexMiddleware('user-1');

      expect(success).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearUserIndexCache()', () => {
    it('should clear cache for specific user', async () => {
      const { ensureUserIndex } = await import('@/lib/opensearch');
      (ensureUserIndex as any).mockResolvedValue(true);

      // Set cache
      await ensureUserIndexMiddleware('user-1');
      (ensureUserIndex as any).mockClear();

      // Clear cache
      clearUserIndexCache('user-1');

      // Next call should hit API again
      await ensureUserIndexMiddleware('user-1');

      expect(ensureUserIndex).toHaveBeenCalled();
    });

    it('should only clear specified user cache', async () => {
      const { ensureUserIndex } = await import('@/lib/opensearch');
      (ensureUserIndex as any).mockResolvedValue(true);

      // Set cache for two users
      await ensureUserIndexMiddleware('user-1');
      await ensureUserIndexMiddleware('user-2');
      (ensureUserIndex as any).mockClear();

      // Clear only user-1
      clearUserIndexCache('user-1');

      // user-1 should hit API, user-2 should use cache
      await ensureUserIndexMiddleware('user-1');
      await ensureUserIndexMiddleware('user-2');

      expect(ensureUserIndex).toHaveBeenCalledTimes(1);
      expect(ensureUserIndex).toHaveBeenCalledWith('user-1');
    });
  });

  describe('clearAllUserIndexCache()', () => {
    it('should clear all cache entries', async () => {
      const { ensureUserIndex } = await import('@/lib/opensearch');
      (ensureUserIndex as any).mockResolvedValue(true);

      // Set cache for multiple users
      await ensureUserIndexMiddleware('user-1');
      await ensureUserIndexMiddleware('user-2');
      await ensureUserIndexMiddleware('user-3');
      (ensureUserIndex as any).mockClear();

      // Clear all
      clearAllUserIndexCache();

      // All should hit API again
      await ensureUserIndexMiddleware('user-1');
      await ensureUserIndexMiddleware('user-2');
      await ensureUserIndexMiddleware('user-3');

      expect(ensureUserIndex).toHaveBeenCalledTimes(3);
    });
  });

  describe('Cache Duration', () => {
    it('should re-check after cache expires', async () => {
      const { ensureUserIndex } = await import('@/lib/opensearch');
      (ensureUserIndex as any).mockResolvedValue(true);

      // First call
      await ensureUserIndexMiddleware('user-1');
      (ensureUserIndex as any).mockClear();

      // Mock time passing (5 minutes + 1ms)
      const realDateNow = Date.now.bind(global.Date);
      const dateNowStub = vi.fn(() => realDateNow() + 5 * 60 * 1000 + 1);
      global.Date.now = dateNowStub;

      // Should hit API again after cache expires
      await ensureUserIndexMiddleware('user-1');

      expect(ensureUserIndex).toHaveBeenCalled();

      // Restore Date.now
      global.Date.now = realDateNow;
    });

    it('should use cache within duration', async () => {
      const { ensureUserIndex } = await import('@/lib/opensearch');
      (ensureUserIndex as any).mockResolvedValue(true);

      // First call
      await ensureUserIndexMiddleware('user-1');
      (ensureUserIndex as any).mockClear();

      // Mock time passing (4 minutes - within cache duration)
      const realDateNow = Date.now.bind(global.Date);
      const dateNowStub = vi.fn(() => realDateNow() + 4 * 60 * 1000);
      global.Date.now = dateNowStub;

      // Should still use cache
      await ensureUserIndexMiddleware('user-1');

      expect(ensureUserIndex).not.toHaveBeenCalled();

      // Restore Date.now
      global.Date.now = realDateNow;
    });
  });

  describe('BDD Scenario: First document upload for new user', () => {
    it('Given new user without existing index, When uploading first receipt, Then system should create index automatically', async () => {
      const { ensureUserIndex } = await import('@/lib/opensearch');
      (ensureUserIndex as any).mockResolvedValue(true);

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Given new user
      const userId = 'new-user-123';

      // When uploading (middleware called)
      const success = await ensureUserIndexMiddleware(userId);

      // Then
      expect(success).toBe(true);
      expect(ensureUserIndex).toHaveBeenCalledWith(userId);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Ensuring OpenSearch index')
      );

      consoleLogSpy.mockRestore();
    });

    it('Given existing user with index, When uploading, Then should reuse cached result', async () => {
      const { ensureUserIndex } = await import('@/lib/opensearch');
      (ensureUserIndex as any).mockResolvedValue(true);

      // Given existing user (first call creates/checks index)
      await ensureUserIndexMiddleware('existing-user');
      (ensureUserIndex as any).mockClear();

      // When uploading again immediately
      const success = await ensureUserIndexMiddleware('existing-user');

      // Then should use cache, not hit API
      expect(success).toBe(true);
      expect(ensureUserIndex).not.toHaveBeenCalled();
    });
  });
});
