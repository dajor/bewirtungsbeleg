import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { env } from './env';

// Create Redis client if credentials are provided
const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Create rate limiter if Redis is available
export const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  : null;

// Rate limiter for API routes with different limits
export const apiRatelimit = {
  // OCR endpoints - more expensive, lower limit
  ocr: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
        analytics: true,
        prefix: 'ocr',
      })
    : null,

  // PDF generation - moderate limit
  pdf: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute
        analytics: true,
        prefix: 'pdf',
      })
    : null,

  // Email endpoints - prevent abuse
  email: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 m'), // 3 requests per minute
        analytics: true,
        prefix: 'email',
      })
    : null,

  // General API - standard limit
  general: ratelimit,
};

/**
 * Check rate limit for a given identifier
 * @param limiter - The rate limiter to use
 * @param identifier - Unique identifier (e.g., IP, user ID)
 * @returns NextResponse with 429 status if rate limited, null otherwise
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<NextResponse | null> {
  if (!limiter) {
    // Rate limiting not configured, allow all requests
    return null;
  }

  const { success, limit, reset, remaining } = await limiter.limit(identifier);

  if (!success) {
    return NextResponse.json(
      { 
        error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
        limit,
        remaining,
        reset: new Date(reset).toISOString(),
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Get identifier from request (IP or user ID)
 */
export function getIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || real || 'anonymous';
  
  return `ip:${ip}`;
}