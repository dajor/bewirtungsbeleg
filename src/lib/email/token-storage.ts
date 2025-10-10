/**
 * Token storage service using Upstash Redis
 * Stores and retrieves email tokens with TTL (Time To Live)
 * Falls back to file-based storage for development
 */

import { redis, isRedisConfigured } from '@/lib/redis';
import type { EmailToken } from './utils';
import { getTokenExpiryMinutes } from './utils';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

// File-based storage path (persists across server restarts)
const STORAGE_DIR = path.join(tmpdir(), 'bewir-tokens');
const STORAGE_FILE = path.join(STORAGE_DIR, 'tokens.json');

// In-memory cache for file-based storage
let fileStoreCache: Map<string, { data: string; expiresAt: number }> | null = null;

// Initialize file-based storage
async function initFileStore() {
  if (fileStoreCache) return fileStoreCache;

  try {
    // Ensure directory exists
    await fs.mkdir(STORAGE_DIR, { recursive: true });

    // Load existing tokens from file
    try {
      const content = await fs.readFile(STORAGE_FILE, 'utf-8');
      const data = JSON.parse(content);
      fileStoreCache = new Map(Object.entries(data));
      console.log('[Token Storage] Loaded', fileStoreCache.size, 'tokens from file');
    } catch {
      // File doesn't exist or is invalid, start fresh
      fileStoreCache = new Map();
      console.log('[Token Storage] Starting with empty file-based storage');
    }

    // Clean expired tokens on load
    const now = Date.now();
    for (const [key, value] of fileStoreCache.entries()) {
      if (value.expiresAt < now) {
        fileStoreCache.delete(key);
      }
    }

    return fileStoreCache;
  } catch (error) {
    console.error('[Token Storage] Failed to initialize file store:', error);
    fileStoreCache = new Map();
    return fileStoreCache;
  }
}

// Save file store to disk
async function saveFileStore() {
  if (!fileStoreCache) return;

  try {
    const data = Object.fromEntries(fileStoreCache.entries());
    await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('[Token Storage] Failed to save file store:', error);
  }
}

// Cleanup expired items periodically
if (typeof setInterval !== 'undefined') {
  setInterval(async () => {
    if (!fileStoreCache) return;

    const now = Date.now();
    let changed = false;

    for (const [key, value] of fileStoreCache.entries()) {
      if (value.expiresAt < now) {
        fileStoreCache.delete(key);
        changed = true;
      }
    }

    if (changed) {
      await saveFileStore();
    }
  }, 60000); // Clean every minute
}

/**
 * Store email token in Redis with TTL
 * @param token - The token string
 * @param data - Email token data
 * @returns true if successful
 */
export async function storeEmailToken(
  token: string,
  data: EmailToken
): Promise<boolean> {
  try {
    const key = `email_token:${token}`;
    const expiryMinutes = getTokenExpiryMinutes(data.type);
    const expirySeconds = expiryMinutes * 60;

    if (isRedisConfigured()) {
      // Calculate remaining TTL from token's createdAt
      const tokenAge = Date.now() - data.createdAt;
      const remainingTTL = Math.max(0, expirySeconds - Math.floor(tokenAge / 1000));

      // Don't store if already expired
      if (remainingTTL <= 0) {
        return false;
      }

      // Store with remaining EX (seconds) for TTL
      await redis.set(key, JSON.stringify(data), { ex: remainingTTL });
    } else {
      // Fallback to file-based storage (persists across restarts)
      console.warn('[Token Storage] Using file-based storage (Redis not configured)');

      // Calculate expiry from token's createdAt, not now
      const expiresAt = data.createdAt + expirySeconds * 1000;

      // Don't store if already expired
      if (expiresAt <= Date.now()) {
        return false;
      }

      const store = await initFileStore();
      store.set(key, { data: JSON.stringify(data), expiresAt });
      await saveFileStore();
    }

    return true;
  } catch (error) {
    console.error('Failed to store email token:', error);
    return false;
  }
}

/**
 * Retrieve email token from Redis
 * @param token - The token string
 * @returns Email token data or null if not found/expired
 */
export async function getEmailToken(token: string): Promise<EmailToken | null> {
  try {
    const key = `email_token:${token}`;
    let data: string | null = null;

    if (isRedisConfigured()) {
      const redisData = await redis.get(key);
      data = typeof redisData === 'string' ? redisData : JSON.stringify(redisData);
    } else {
      // Fallback to file-based storage
      const store = await initFileStore();
      const stored = store.get(key);
      if (stored && stored.expiresAt > Date.now()) {
        data = stored.data;
      } else if (stored) {
        store.delete(key); // Clean expired
        await saveFileStore();
      }
    }

    if (!data) {
      return null;
    }

    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    console.error('Failed to get email token:', error);
    return null;
  }
}

/**
 * Delete email token from Redis (for single-use tokens)
 * @param token - The token string
 * @returns true if deleted
 */
export async function deleteEmailToken(token: string): Promise<boolean> {
  try {
    const key = `email_token:${token}`;

    if (isRedisConfigured()) {
      const result = await redis.del(key);
      return result > 0;
    } else {
      // Fallback to file-based storage
      const store = await initFileStore();
      const deleted = store.delete(key);
      if (deleted) {
        await saveFileStore();
      }
      return deleted;
    }
  } catch (error) {
    console.error('Failed to delete email token:', error);
    return false;
  }
}

/**
 * Verify and consume email token (get + delete in one operation)
 * @param token - The token string
 * @returns Email token data or null if not found/expired
 */
export async function verifyAndConsumeToken(token: string): Promise<EmailToken | null> {
  try {
    const tokenData = await getEmailToken(token);

    if (!tokenData) {
      return null;
    }

    // Delete the token to ensure single-use
    await deleteEmailToken(token);

    return tokenData;
  } catch (error) {
    console.error('Failed to verify and consume token:', error);
    return null;
  }
}

/**
 * Store token by email (for looking up tokens by email address)
 * Useful for resending verification emails
 * @param email - User's email address
 * @param token - The token string
 * @param type - Token type
 * @returns true if successful
 */
export async function storeTokenByEmail(
  email: string,
  token: string,
  type: EmailToken['type']
): Promise<boolean> {
  try {
    const key = `email_token_by_email:${type}:${email.toLowerCase()}`;
    const expiryMinutes = getTokenExpiryMinutes(type);
    const expirySeconds = expiryMinutes * 60;

    if (isRedisConfigured()) {
      await redis.set(key, token, { ex: expirySeconds });
    } else {
      // Fallback to file-based storage
      const store = await initFileStore();
      const expiresAt = Date.now() + expirySeconds * 1000;
      store.set(key, { data: token, expiresAt });
      await saveFileStore();
    }

    return true;
  } catch (error) {
    console.error('Failed to store token by email:', error);
    return false;
  }
}

/**
 * Get token by email address
 * @param email - User's email address
 * @param type - Token type
 * @returns Token string or null
 */
export async function getTokenByEmail(
  email: string,
  type: EmailToken['type']
): Promise<string | null> {
  try {
    const key = `email_token_by_email:${type}:${email.toLowerCase()}`;

    if (isRedisConfigured()) {
      const token = await redis.get(key);
      return token as string | null;
    } else {
      // Fallback to file-based storage
      const store = await initFileStore();
      const stored = store.get(key);
      if (stored && stored.expiresAt > Date.now()) {
        return stored.data;
      } else if (stored) {
        store.delete(key); // Clean expired
        await saveFileStore();
      }
      return null;
    }
  } catch (error) {
    console.error('Failed to get token by email:', error);
    return null;
  }
}

/**
 * Delete token by email
 * @param email - User's email address
 * @param type - Token type
 * @returns true if deleted
 */
export async function deleteTokenByEmail(
  email: string,
  type: EmailToken['type']
): Promise<boolean> {
  try {
    const key = `email_token_by_email:${type}:${email.toLowerCase()}`;

    if (isRedisConfigured()) {
      const result = await redis.del(key);
      return result > 0;
    } else {
      // Fallback to file-based storage
      const store = await initFileStore();
      const deleted = store.delete(key);
      if (deleted) {
        await saveFileStore();
      }
      return deleted;
    }
  } catch (error) {
    console.error('Failed to delete token by email:', error);
    return false;
  }
}

/**
 * Clear all stored tokens (for testing)
 */
export async function clearMemoryStore(): Promise<void> {
  if (fileStoreCache) {
    fileStoreCache.clear();
    await saveFileStore();
  }
}
