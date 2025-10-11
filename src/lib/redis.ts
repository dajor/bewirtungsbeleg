/**
 * Redis client (supports both Upstash and standard Redis/Valkey)
 * Used for token storage and other caching needs
 */

import Redis from 'ioredis';
import { env } from './env';

// Get Redis URL from environment
const getRedisUrl = (): string | null => {
  // Try REDIS_URL first (standard Redis/Valkey)
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  // Fall back to Upstash (if configured)
  if (env.UPSTASH_REDIS_REST_URL) {
    return env.UPSTASH_REDIS_REST_URL;
  }

  return null;
};

// Create Redis client
const redisUrl = getRedisUrl();
export const redis = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      enableReadyCheck: true,
      connectTimeout: 10000,
    })
  : null as any; // Fallback for development without Redis

// Log connection status
if (redis) {
  redis.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  redis.on('error', (error) => {
    console.error('[Redis] Connection error:', error.message);
  });
}

// Helper to check if Redis is configured
export const isRedisConfigured = (): boolean => {
  return !!redisUrl;
};
