/**
 * Middleware to ensure user has an OpenSearch index
 *
 * This should be called:
 * 1. On user login (via NextAuth JWT callback)
 * 2. Before first document upload
 * 3. Before searching documents
 */

import { ensureUserIndex } from '@/lib/opensearch';

// In-memory cache to avoid repeated checks within the same session
// Key: user_id, Value: timestamp of last check
const userIndexCheckCache = new Map<string, number>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Ensure user has an OpenSearch index
 * Uses caching to avoid repeated API calls
 *
 * @param userId - The user's unique identifier
 * @returns Promise<boolean> - true if index exists or was created, false otherwise
 */
export async function ensureUserIndexMiddleware(userId: string): Promise<boolean> {
  if (!userId) {
    console.warn('[UserIndexMiddleware] No user ID provided');
    return false;
  }

  // Check cache first
  const lastCheck = userIndexCheckCache.get(userId);
  if (lastCheck && Date.now() - lastCheck < CACHE_DURATION_MS) {
    // Recently checked, assume index exists
    return true;
  }

  try {
    console.log(`[UserIndexMiddleware] Ensuring OpenSearch index for user: ${userId}`);
    const success = await ensureUserIndex(userId);

    if (success) {
      // Update cache
      userIndexCheckCache.set(userId, Date.now());
    }

    return success;
  } catch (error) {
    console.error(`[UserIndexMiddleware] Error ensuring index for user ${userId}:`, error);
    return false;
  }
}

/**
 * Clear cache entry for a specific user
 * Useful when you want to force a fresh check
 */
export function clearUserIndexCache(userId: string): void {
  userIndexCheckCache.delete(userId);
}

/**
 * Clear all cache entries
 * Useful for testing or manual cache invalidation
 */
export function clearAllUserIndexCache(): void {
  userIndexCheckCache.clear();
}
