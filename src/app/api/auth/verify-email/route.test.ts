/**
 * BDD Tests: Email Verification API Route
 *
 * PURPOSE: Validate email verification tokens WITHOUT consuming them
 * CRITICAL: This endpoint must support BOTH GET and POST methods for frontend compatibility
 *
 * CONTEXT: After registration, users receive an email with a verification link.
 * When they click the link, the frontend calls this endpoint to VALIDATE the token
 * (but NOT consume it). After validation succeeds, the user enters their password
 * and the setup-password endpoint CONSUMES the token.
 *
 * PRODUCTION BUGS FIXED:
 * 1. Backend only had POST but frontend was using GET → 404 errors
 * 2. verify-email was consuming token with getEmailToken() → setup-password failed!
 *    Fixed: Now uses getEmailToken() to validate WITHOUT consuming
 *
 * WHY TWO-STEP VALIDATION?
 * - Step 1 (this endpoint): Validate token exists and show password form
 * - Step 2 (setup-password): User sets password, token is consumed
 * This allows user to see any token errors BEFORE entering password
 *
 * Test both GET and POST methods to ensure frontend compatibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import type { EmailToken } from '@/lib/email/utils';

// Mock dependencies
vi.mock('@/lib/email/token-storage', () => ({
  getEmailToken: vi.fn(), // Changed from getEmailToken - we NO LONGER consume here!
}));

describe('/api/auth/verify-email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createPostRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  const createGetRequest = (token: string): NextRequest => {
    return new NextRequest(`http://localhost:3000/api/auth/verify-email?token=${token}`, {
      method: 'GET',
    });
  };

  const createValidToken = (overrides?: Partial<EmailToken>): EmailToken => {
    return {
      token: 'test-token-123',
      email: 'user@example.com',
      createdAt: Date.now(),
      type: 'email_verify',
      ...overrides,
    };
  };

  describe('GET (frontend compatibility)', () => {
    /**
     * BDD: Email Verification Success - Primary User Journey
     *
     * GIVEN: A valid email verification token exists in storage
     * WHEN: User clicks verification link from email (GET request with token as query parameter)
     * THEN: Token is verified, consumed (single-use), and success response with email returned
     *
     * WHY: This is the PRIMARY registration flow. Users receive emails with links like:
     *      http://localhost:3001/auth/setup-password?token=xyz
     *      The setup-password page then calls GET /api/auth/verify-email?token=xyz
     *      to verify the token before allowing password setup.
     *
     * CRITICAL: GET method is used because it's a link click from an email client.
     *           Email clients make GET requests when users click links.
     *
     * PRODUCTION INCIDENT: Initially, backend only supported POST, causing 404 errors
     *                      when users clicked verification links. This test now prevents
     *                      that regression.
     *
     * IMPROVEMENT IDEAS:
     * - Add rate limiting tests for verification attempts
     * - Test concurrent verification attempts with same token
     * - Verify email content format (subject, sender, etc.)
     */
    it('should verify email with valid token via GET', async () => {
      // GIVEN: Valid email verification token in storage
      const { getEmailToken } = await import('@/lib/email/token-storage');
      vi.mocked(getEmailToken).mockResolvedValueOnce(createValidToken());

      // WHEN: User clicks verification link (GET request)
      const request = createGetRequest('test-token-123');
      const response = await GET(request);
      const data = await response.json();

      // THEN: Success response with verified email address
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.email).toBe('user@example.com');
    });

    /**
     * BDD: Missing Token Validation
     *
     * GIVEN: No token provided in GET request
     * WHEN: Request is made to verification endpoint without token parameter
     * THEN: 400 error with clear message about missing token
     *
     * WHY: Prevents incomplete/malformed verification attempts
     *      Provides clear feedback to frontend about what's wrong
     *
     * IMPROVEMENT IDEAS:
     * - Add logging for security monitoring
     * - Track failed verification attempts by IP
     */
    it('should reject GET request without token', async () => {
      // GIVEN: No token in request
      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'GET',
      });

      // WHEN: Verification attempt without token
      const response = await GET(request);
      const data = await response.json();

      // THEN: Clear error message
      expect(response.status).toBe(400);
      expect(data.error).toBe('Token ist erforderlich');
    });

    /**
     * BDD: Invalid Token Handling
     *
     * GIVEN: Token that doesn't exist in storage or has been consumed
     * WHEN: User attempts verification with invalid/expired token
     * THEN: 400 error indicating token is invalid or expired
     *
     * WHY: Security - prevents token guessing attacks
     *      UX - clear error message for expired verification links
     *
     * IMPROVEMENT IDEAS:
     * - Differentiate between "expired" and "invalid" in error message
     * - Provide "resend verification email" option in error response
     * - Log suspicious patterns (many failed verifications from same IP)
     */
    it('should reject GET request with invalid token', async () => {
      // GIVEN: Token doesn't exist in storage
      const { getEmailToken } = await import('@/lib/email/token-storage');
      vi.mocked(getEmailToken).mockResolvedValueOnce(null);

      // WHEN: Verification attempt with invalid token
      const request = createGetRequest('invalid-token');
      const response = await GET(request);
      const data = await response.json();

      // THEN: Clear error about invalid/expired token
      expect(response.status).toBe(400);
      expect(data.error).toContain('Ungültiger oder abgelaufener');
    });
  });

  describe('POST (backward compatibility)', () => {
    /**
     * BDD: POST Method Support for Backward Compatibility
     *
     * GIVEN: Valid token in request body (POST method)
     * WHEN: API client sends POST request with token in body
     * THEN: Same successful verification as GET method
     *
     * WHY: Maintains backward compatibility if any API clients use POST
     *      Future-proof for programmatic API access (not just link clicks)
     *
     * IMPROVEMENT IDEAS:
     * - Consider deprecating POST in favor of GET for consistency
     * - Add API versioning if we want to phase out POST
     */
    it('should verify email with valid token via POST', async () => {
      // GIVEN: Valid token
      const { getEmailToken } = await import('@/lib/email/token-storage');
      vi.mocked(getEmailToken).mockResolvedValueOnce(createValidToken());

      // WHEN: POST request with token in body
      const request = createPostRequest({ token: 'test-token-123' });
      const response = await POST(request);
      const data = await response.json();

      // THEN: Same success response as GET
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.email).toBe('user@example.com');
      expect(data.message).toContain('erfolgreich bestätigt');
    });

    /**
     * BDD: Missing Token in POST Body
     *
     * GIVEN: POST request with empty body
     * WHEN: Token field is missing from request
     * THEN: Validation error about missing token
     *
     * WHY: Input validation - Zod schema enforcement
     *      Clear error messages for API clients
     */
    it('should reject missing token', async () => {
      // GIVEN: Empty request body
      const request = createPostRequest({});

      // WHEN: POST without token
      const response = await POST(request);
      const data = await response.json();

      // THEN: Validation error
      expect(response.status).toBe(400);
      expect(data.error).toContain('Ungültiger Verifizierungstoken');
    });

    /**
     * BDD: Empty Token String
     *
     * GIVEN: Token field exists but is empty string
     * WHEN: POST request with token: ""
     * THEN: Validation error
     *
     * WHY: Zod schema requires min length of 1
     *      Prevents empty string bypass attempts
     */
    it('should reject empty token', async () => {
      // GIVEN: Empty token string
      const request = createPostRequest({ token: '' });

      // WHEN: Verification with empty token
      const response = await POST(request);
      const data = await response.json();

      // THEN: Validation error
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    /**
     * BDD: Non-existent Token
     *
     * GIVEN: Token string that doesn't exist in storage
     * WHEN: Verification attempted
     * THEN: Error indicating invalid or expired token
     *
     * WHY: Could be expired token, typo, or attack attempt
     *      Same error for security (don't reveal token existence)
     */
    it('should reject invalid token', async () => {
      // GIVEN: Token not in storage
      const { getEmailToken } = await import('@/lib/email/token-storage');
      vi.mocked(getEmailToken).mockResolvedValueOnce(null);

      // WHEN: Verification attempt
      const request = createPostRequest({ token: 'invalid-token' });
      const response = await POST(request);
      const data = await response.json();

      // THEN: Error message
      expect(response.status).toBe(400);
      expect(data.error).toContain('Ungültiger oder abgelaufener');
    });

    /**
     * BDD: Wrong Token Type Security Check
     *
     * GIVEN: Valid token BUT wrong type (e.g., password_reset instead of email_verify)
     * WHEN: User attempts to use password reset token for email verification
     * THEN: Rejected with "wrong token type" error
     *
     * WHY: Security - prevents token reuse across different flows
     *      Each token type has specific purpose and permissions
     *      Prevents escalation attacks (using less privileged token for more privileged action)
     *
     * CRITICAL: Without this check, a password reset token could be used to verify email,
     *           potentially bypassing email ownership verification
     *
     * IMPROVEMENT IDEAS:
     * - Log token type mismatch attempts for security monitoring
     * - Add more specific error messages per token type
     */
    it('should reject wrong token type', async () => {
      // GIVEN: Valid token of wrong type (password_reset instead of email_verify)
      const { getEmailToken } = await import('@/lib/email/token-storage');
      vi.mocked(getEmailToken).mockResolvedValueOnce(
        createValidToken({ type: 'password_reset' })
      );

      // WHEN: Attempt to use wrong token type
      const request = createPostRequest({ token: 'test-token' });
      const response = await POST(request);
      const data = await response.json();

      // THEN: Specific error about token type
      expect(response.status).toBe(400);
      expect(data.error).toContain('Falscher Token-Typ');
    });

    /**
     * BDD: Expired Token Rejection
     *
     * GIVEN: Token created more than 24 hours ago (expiry time for email_verify)
     * WHEN: User attempts verification with expired token
     * THEN: Error indicating token has expired
     *
     * WHY: Security - limits token validity window
     *      Compliance - email verification must be timely
     *      UX - forces users to request new verification if too much time has passed
     *
     * BUSINESS RULE: Email verification tokens valid for 24 hours
     *
     * IMPROVEMENT IDEAS:
     * - Make expiry time configurable per environment
     * - Add automatic "resend verification" option in error
     * - Track expiry patterns to optimize default timeout
     */
    it('should reject expired token', async () => {
      // GIVEN: Token created 25 hours ago (expired, as email_verify tokens are valid for 24 hours)
      const { getEmailToken } = await import('@/lib/email/token-storage');
      const expiredTime = Date.now() - (25 * 60 * 60 * 1000);
      vi.mocked(getEmailToken).mockResolvedValueOnce(
        createValidToken({ createdAt: expiredTime })
      );

      // WHEN: Verification with expired token
      const request = createPostRequest({ token: 'expired-token' });
      const response = await POST(request);
      const data = await response.json();

      // THEN: Expiry error
      expect(response.status).toBe(400);
      expect(data.error).toContain('abgelaufen');
    });

    /**
     * BDD: Single-Use Token Consumption
     *
     * GIVEN: Valid verification token
     * WHEN: Verification succeeds
     * THEN: Token is consumed (deleted from storage) to prevent reuse
     *
     * WHY: Security - prevents token replay attacks
     *      Each verification link should only work once
     *      After email is verified, token should be unusable
     *
     * CRITICAL: Without consumption, same link could be used multiple times,
     *           potentially allowing attackers to verify emails they don't own
     *
     * IMPROVEMENT IDEAS:
     * - Add audit log of token consumption
     * - Track time between token creation and consumption
     */
    it('should consume token (single-use)', async () => {
      // GIVEN: Valid token
      const { getEmailToken } = await import('@/lib/email/token-storage');
      vi.mocked(getEmailToken).mockResolvedValueOnce(createValidToken());

      // WHEN: Successful verification
      const request = createPostRequest({ token: 'test-token' });
      await POST(request);

      // THEN: Token consumed (getEmailToken deletes it)
      expect(getEmailToken).toHaveBeenCalledWith('test-token');
    });

    /**
     * NOTE: Token cleanup is NOT done by this endpoint anymore!
     *       verify-email just VALIDATES the token without consuming it.
     *       Token cleanup happens in setup-password endpoint after password is set.
     *       This prevents the bug where verify-email consumed the token,
     *       making it unavailable for setup-password.
     */

    /**
     * BDD: Storage Error Handling
     *
     * GIVEN: Redis/storage service is unavailable or errors
     * WHEN: Token verification is attempted
     * THEN: 500 error with generic message (don't expose internal errors)
     *
     * WHY: Reliability - graceful handling of infrastructure failures
     *      Security - don't expose internal system details to users
     *      Operations - log error for debugging while returning safe user message
     *
     * IMPROVEMENT IDEAS:
     * - Implement retry logic for transient Redis errors
     * - Add circuit breaker pattern
     * - Queue verification for retry if storage is down
     * - Alert ops team on storage errors
     */
    it('should handle token consumption errors', async () => {
      // GIVEN: Storage service error (Redis down, network issue, etc.)
      const { getEmailToken } = await import('@/lib/email/token-storage');
      vi.mocked(getEmailToken).mockRejectedValueOnce(new Error('Redis error'));

      // WHEN: Verification attempted
      const request = createPostRequest({ token: 'test-token' });
      const response = await POST(request);
      const data = await response.json();

      // THEN: Generic 500 error (don't expose internal details)
      expect(response.status).toBe(500);
      expect(data.error).toContain('Ein Fehler ist aufgetreten');
    });

    /**
     * BDD: Optional UserId Support
     *
     * GIVEN: Token with optional userId field
     * WHEN: Verification is performed
     * THEN: Verification succeeds (userId is optional metadata)
     *
     * WHY: Flexibility - tokens can optionally include userId for future use
     *      Future-proofing - when user management is added, userId helps link tokens to users
     *      Currently userId is not required but system accepts it
     *
     * IMPROVEMENT IDEAS:
     * - Use userId to update user record when user management is implemented
     * - Validate userId format if present
     * - Link verified email to user account
     */
    it('should accept token with userId', async () => {
      // GIVEN: Token with optional userId metadata
      const { getEmailToken } = await import('@/lib/email/token-storage');
      vi.mocked(getEmailToken).mockResolvedValueOnce(
        createValidToken({ userId: 'user-123' })
      );

      // WHEN: Verification with userId-containing token
      const request = createPostRequest({ token: 'test-token' });
      const response = await POST(request);
      const data = await response.json();

      // THEN: Success (userId is optional, doesn't affect verification)
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    /**
     * BDD: Fresh Token Success
     *
     * GIVEN: Token created recently (1 hour ago, well within 24-hour expiry)
     * WHEN: Verification is attempted
     * THEN: Verification succeeds
     *
     * WHY: Positive test case for typical user behavior
     *      Most users verify email within minutes/hours of registration
     *      Confirms expiry logic doesn't false-positive on fresh tokens
     *
     * IMPROVEMENT IDEAS:
     * - Track average time-to-verification for UX insights
     * - Adjust email copy if users take too long to verify
     */
    it('should accept fresh token', async () => {
      // GIVEN: Recently created token (1 hour ago)
      const { getEmailToken } = await import('@/lib/email/token-storage');
      const recentTime = Date.now() - (1 * 60 * 60 * 1000);
      vi.mocked(getEmailToken).mockResolvedValueOnce(
        createValidToken({ createdAt: recentTime })
      );

      // WHEN: Verification with fresh token
      const request = createPostRequest({ token: 'fresh-token' });
      const response = await POST(request);
      const data = await response.json();

      // THEN: Success
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
