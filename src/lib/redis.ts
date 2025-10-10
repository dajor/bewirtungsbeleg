/**
 * Redis client for Upstash
 * Used for token storage and other caching needs
 */

import { Redis } from '@upstash/redis';
import { env } from './env';

// Create Redis client if credentials are provided
export const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null as any; // Fallback for development without Redis

// Helper to check if Redis is configured
export const isRedisConfigured = (): boolean => {
  return !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
};
