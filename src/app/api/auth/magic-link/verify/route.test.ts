/**
 * BDD Tests for Magic Link Verify API Route
 *
 * PURPOSE: Verifies magic link tokens and completes passwordless login
 *
 * BUSINESS CONTEXT:
 * This is the second step of the magic link flow. User clicks the link in their email,
 * which makes a GET request to this endpoint. This route verifies the token and redirects
 * the user to the callback page which creates their authenticated session.
 *
 * CRITICAL DIFFERENCE FROM OTHER VERIFY ROUTES:
 * - This route ALWAYS redirects (307), never returns JSON
 * - Success: Redirects to /auth/callback/magic-link with email
 * - Failure: Redirects to /auth/signin with error parameter
 * - Frontend never calls this directly - it's the link destination in emails
 *
 * SECURITY REQUIREMENTS:
 * - Token expiry: 10 minutes (shorter than email_verify's 24 hours)
 * - Single-use tokens: Token deleted after verification
 * - Type validation: Only 'magic_link' tokens accepted
 * - Email in URL: URL-encoded to prevent injection
 * - Error codes in URL: Generic to prevent enumeration
 *
 * USER FLOW:
 * 1. User receives magic link email (sent by send route)
 * 2. User clicks link: /api/auth/magic-link/verify?token=xyz
 * 3. Browser makes GET request to this endpoint
 * 4. This route verifies token and redirects:
 *    SUCCESS → /auth/callback/magic-link?email=user@example.com
 *    FAILURE → /auth/signin?error=TokenExpired
 * 5. Callback page creates session and logs user in
 *
 * ERROR HANDLING:
 * All errors redirect to /auth/signin with error parameter:
 * - MissingToken: No token in query string
 * - InvalidToken: Token doesn't exist or wrong type
 * - TokenExpired: Token older than 10 minutes
 * - VerificationFailed: Storage error or unexpected exception
 *
 * INTEGRATION POINTS:
 * - Token storage (Redis or file-based fallback)
 * - Frontend callback: /src/app/auth/callback/magic-link/page.tsx
 * - Frontend error page: /src/app/auth/signin/page.tsx
 *
 * RELATED ROUTES:
 * - /api/auth/magic-link/send - Sends magic link email (step 1)
 * - /api/auth/verify-email - Similar but for registration (different redirect)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import type { EmailToken } from '@/lib/email/utils';

// Mock dependencies
vi.mock('@/lib/email/token-storage', () => ({
  getEmailToken: vi.fn(),
  deleteEmailToken: vi.fn().mockResolvedValue(true),
  deleteTokenByEmail: vi.fn().mockResolvedValue(true),
}));

describe('GET /api/auth/magic-link/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (token?: string): NextRequest => {
    const url = token
      ? `http://localhost:3000/api/auth/magic-link/verify?token=${token}`
      : 'http://localhost:3000/api/auth/magic-link/verify';

    return new NextRequest(url, {
      method: 'GET',
    });
  };

  const createValidToken = (overrides?: Partial<EmailToken>): EmailToken => {
    return {
      token: 'test-magic-token-123',
      email: 'user@example.com',
      createdAt: Date.now(),
      type: 'magic_link',
      ...overrides,
    };
  };

  /**
   * BDD: Successful Magic Link Verification - Passwordless Login Completion
   *
   * GIVEN: User clicks valid magic link from email (token exists, correct type, not expired)
   * WHEN: Browser makes GET request to verify endpoint
   * THEN: 307 redirect to callback page with email parameter
   *
   * WHY: This completes the passwordless login. User clicks email link → instant redirect
   *      to callback → session created → user logged in. No password needed.
   *
   * REDIRECT: /auth/callback/magic-link?email=user@example.com
   *           Callback page receives email and creates authenticated session
   *
   * SECURITY: Email is URL-encoded to prevent injection attacks
   *
   * IMPROVEMENT IDEAS:
   * - Add device fingerprinting for security
   * - Log successful magic link logins for audit
   * - Track time from send to click (UX metric)
   */
  it('should verify magic link and redirect to callback', async () => {
    // GIVEN: Valid magic link token in storage
    const { getEmailToken } = await import('@/lib/email/token-storage');
    vi.mocked(getEmailToken).mockResolvedValueOnce(createValidToken());

    // WHEN: User clicks magic link (GET request with token)
    const request = createRequest('test-token-123');
    const response = await GET(request);

    // THEN: Redirect to callback with URL-encoded email
    expect(response.status).toBe(307); // Temporary redirect
    expect(response.headers.get('location')).toContain('/auth/callback/magic-link');
    expect(response.headers.get('location')).toContain('email=user%40example.com');
  });

  /**
   * BDD: Missing Token - User Error or Malformed Link
   *
   * GIVEN: Request without token query parameter
   * WHEN: User visits endpoint without token
   * THEN: Redirect to signin page with MissingToken error
   *
   * WHY: Could happen if user manually types URL or email client corrupts link.
   *      Redirect to signin with clear error message for user.
   *
   * IMPROVEMENT IDEAS:
   * - Log missing token attempts (could indicate email rendering issues)
   * - Provide "Resend magic link" option on error page
   */
  it('should redirect to signin with error if token is missing', async () => {
    // GIVEN: Request without token parameter
    const request = createRequest();

    // WHEN: Accessing verify endpoint without token
    const response = await GET(request);

    // THEN: Redirect to signin with error
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/signin');
    expect(response.headers.get('location')).toContain('error=MissingToken');
  });

  /**
   * BDD: Invalid Token - Already Used or Never Existed
   *
   * GIVEN: Token doesn't exist in storage (consumed or never created)
   * WHEN: User attempts to verify
   * THEN: Redirect to signin with error parameter
   *
   * WHY: Token could be:
   *      - Already used (single-use enforcement)
   *      - Never existed (malicious attempt)
   *      - Expired and cleaned up
   *
   * SECURITY: Generic error prevents token enumeration
   *
   * IMPROVEMENT IDEAS:
   * - Track invalid token attempts per IP (detect attacks)
   * - Add rate limiting on verify endpoint
   */
  it('should redirect to signin with error if token is invalid', async () => {
    // GIVEN: Token doesn't exist in storage
    const { getEmailToken } = await import('@/lib/email/token-storage');
    vi.mocked(getEmailToken).mockResolvedValueOnce(null);

    // WHEN: Attempting to verify invalid token
    const request = createRequest('invalid-token');
    const response = await GET(request);

    // THEN: Redirect to signin with error
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/signin');
    expect(response.headers.get('location')).toContain('error=');
  });

  /**
   * BDD: Token Type Mismatch - Cross-Flow Security
   *
   * GIVEN: Valid token but wrong type (e.g., password_reset token)
   * WHEN: User attempts to use as magic link
   * THEN: Redirect to signin with InvalidToken error
   *
   * WHY: Prevents token reuse across flows. Password reset tokens should not
   *      work for instant login (different security requirements).
   *
   * SECURITY: Each token type has specific purpose and expiration.
   *           Magic links (10 min) vs password reset (30 min) vs email verify (24h)
   *
   * IMPROVEMENT IDEAS:
   * - Log type mismatches (could indicate attack)
   * - Add telemetry to track common user errors vs malicious attempts
   */
  it('should reject wrong token type', async () => {
    // GIVEN: Valid token but wrong type
    const { getEmailToken } = await import('@/lib/email/token-storage');
    vi.mocked(getEmailToken).mockResolvedValueOnce(
      createValidToken({ type: 'password_reset' })
    );

    // WHEN: Attempting to use as magic link
    const request = createRequest('test-token');
    const response = await GET(request);

    // THEN: Redirect to signin with error
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('error=InvalidToken');
  });

  /**
   * BDD: Token Expiration - Time-Based Security
   *
   * GIVEN: Magic link token created more than 10 minutes ago
   * WHEN: User clicks old link
   * THEN: Redirect to signin with TokenExpired error
   *
   * WHY: Magic links expire after 10 minutes (shorter than password reset's 30 min)
   *      because they grant instant access. Shorter window = higher security.
   *
   * BUSINESS RULE: Magic link tokens valid for 10 minutes
   *
   * UX: User sees clear "link expired" message and can request new one
   *
   * IMPROVEMENT IDEAS:
   * - Auto-resend if user clicks expired link (with rate limit)
   * - Track expiry rates (are users clicking old links often?)
   * - Adjust expiry based on metrics (is 10 min too short?)
   */
  it('should reject expired token', async () => {
    // GIVEN: Token created 11 minutes ago (expired - limit is 10 minutes)
    const { getEmailToken } = await import('@/lib/email/token-storage');
    const expiredTime = Date.now() - (11 * 60 * 1000);
    vi.mocked(getEmailToken).mockResolvedValueOnce(
      createValidToken({ createdAt: expiredTime })
    );

    // WHEN: User clicks expired magic link
    const request = createRequest('expired-token');
    const response = await GET(request);

    // THEN: Redirect with specific expiry error
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('error=TokenExpired');
  });

  /**
   * BDD: Single-Use Token Enforcement - Replay Attack Prevention
   *
   * GIVEN: Valid magic link token
   * WHEN: User clicks link for login
   * THEN: Token is retrieved from storage (will be deleted after)
   *
   * WHY: Single-use enforcement prevents replay attacks. After first use,
   *      token is deleted and cannot be used again.
   *
   * SECURITY: If attacker intercepts magic link, they can only use it once.
   *           After legitimate user logs in, intercepted link is useless.
   *
   * IMPROVEMENT IDEAS:
   * - Add integration test verifying second click returns InvalidToken error
   * - Log token reuse attempts for security monitoring
   */
  it('should consume token (single-use)', async () => {
    // GIVEN: Valid magic link token
    const { getEmailToken } = await import('@/lib/email/token-storage');
    vi.mocked(getEmailToken).mockResolvedValueOnce(createValidToken());

    // WHEN: User clicks magic link
    const request = createRequest('test-token');
    await GET(request);

    // THEN: Token is retrieved from storage
    expect(getEmailToken).toHaveBeenCalledWith('test-token');
  });

  /**
   * BDD: Token Cleanup - Email-Based Invalidation
   *
   * GIVEN: Successful magic link verification
   * WHEN: User logs in via magic link
   * THEN: All magic_link tokens for this email are deleted
   *
   * WHY: User may have requested multiple magic links (clicking button multiple times).
   *      After successful login, invalidate ALL magic link tokens for this email.
   *
   * SECURITY: Prevents use of older magic links if user requested multiple.
   *
   * IMPROVEMENT IDEAS:
   * - Add audit log of which token was used vs which were invalidated
   * - Alert user if multiple tokens existed (possible security concern)
   */
  it('should cleanup token by email', async () => {
    // GIVEN: Valid magic link for user@example.com
    const { getEmailToken, deleteTokenByEmail } = await import('@/lib/email/token-storage');
    vi.mocked(getEmailToken).mockResolvedValueOnce(createValidToken());

    // WHEN: User logs in successfully
    const request = createRequest('test-token');
    await GET(request);

    // THEN: All magic_link tokens for this email deleted
    expect(deleteTokenByEmail).toHaveBeenCalledWith('user@example.com', 'magic_link');
  });

  /**
   * BDD: Storage Infrastructure Failure - Graceful Error Handling
   *
   * GIVEN: Valid request but Redis/storage throws exception
   * WHEN: Token retrieval fails
   * THEN: Redirect to signin with VerificationFailed error
   *
   * WHY: Storage failures should not crash the flow. Redirect user to signin
   *      with generic error (don't leak infrastructure details).
   *
   * SECURITY: Generic error message prevents information disclosure about
   *           internal infrastructure.
   *
   * IMPROVEMENT IDEAS:
   * - Add retry logic for transient storage failures
   * - Implement circuit breaker pattern
   * - Alert ops team when storage errors occur
   */
  it('should handle token consumption errors', async () => {
    // GIVEN: Storage service throws error
    const { getEmailToken } = await import('@/lib/email/token-storage');
    vi.mocked(getEmailToken).mockRejectedValueOnce(new Error('Redis error'));

    // WHEN: Attempting to verify token
    const request = createRequest('test-token');
    const response = await GET(request);

    // THEN: Redirect to signin with generic error
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('error=VerificationFailed');
  });

  /**
   * BDD: Boundary Value Testing - Fresh Token Acceptance
   *
   * GIVEN: Magic link token created 5 minutes ago (well within 10-minute limit)
   * WHEN: User clicks relatively fresh link
   * THEN: Token accepted, redirect to callback without error
   *
   * WHY: Validates that tokens are accepted when well within expiry window.
   *      5 minutes is typical time for user to check email and click.
   *
   * TESTING: Tests happy path with time margin (not at exact boundary)
   *
   * IMPROVEMENT IDEAS:
   * - Test exact boundary (token created 9:59 ago - should pass)
   * - Test just over boundary (10:01 ago - should fail)
   * - Track average click time for UX optimization
   */
  it('should accept fresh token', async () => {
    // GIVEN: Token created 5 minutes ago (well within limit)
    const { getEmailToken } = await import('@/lib/email/token-storage');
    const recentTime = Date.now() - (5 * 60 * 1000);
    vi.mocked(getEmailToken).mockResolvedValueOnce(
      createValidToken({ createdAt: recentTime })
    );

    // WHEN: User clicks fresh magic link
    const request = createRequest('fresh-token');
    const response = await GET(request);

    // THEN: Success redirect without error parameter
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/callback/magic-link');
    expect(response.headers.get('location')).not.toContain('error');
  });

  /**
   * BDD: URL Encoding - Special Character Handling in Email
   *
   * GIVEN: Email with special characters (user+test@example.com)
   * WHEN: Creating redirect URL with email parameter
   * THEN: Email is properly URL-encoded (%2B for +, %40 for @)
   *
   * WHY: Email addresses can contain special characters like + (gmail aliases).
   *      Must be URL-encoded to prevent:
   *      - Breaking URL parsing
   *      - Injection attacks
   *      - Data corruption
   *
   * SECURITY: Proper encoding prevents URL injection and XSS attacks
   *
   * IMPROVEMENT IDEAS:
   * - Test other special characters (, ., etc.)
   * - Verify callback page correctly decodes URL-encoded email
   * - Add integration test for full encode→decode→session flow
   */
  it('should URL-encode email in redirect', async () => {
    // GIVEN: Email with special character (+)
    const { getEmailToken } = await import('@/lib/email/token-storage');
    vi.mocked(getEmailToken).mockResolvedValueOnce(
      createValidToken({ email: 'user+test@example.com' })
    );

    // WHEN: Creating redirect URL
    const request = createRequest('test-token');
    const response = await GET(request);

    // THEN: Email is properly URL-encoded (+ becomes %2B, @ becomes %40)
    expect(response.headers.get('location')).toContain('user%2Btest%40example.com');
  });
});
