/**
 * BDD Tests for Password Reset API Route
 *
 * PURPOSE: Verifies the complete password reset flow - from token validation to password update
 *
 * BUSINESS CONTEXT:
 * Users who forget their passwords request a reset link via email. When they click the link,
 * they're directed to a form where they enter a new password. This endpoint validates the
 * reset token and updates their password.
 *
 * SECURITY REQUIREMENTS:
 * - Tokens expire after 30 minutes (shorter than email verification's 24 hours)
 * - Tokens are single-use only (consumed after first use)
 * - Minimum password length: 8 characters
 * - Wrong token type rejected (prevents token reuse across flows)
 * - Confirmation email sent after successful reset
 *
 * USER FLOW:
 * 1. User clicks "Forgot Password" and enters email
 * 2. Backend sends password reset email with token
 * 3. User clicks link in email → redirected to reset-password page
 * 4. User enters new password and submits
 * 5. Frontend calls POST /api/auth/reset-password with token + new password
 * 6. Backend validates token, updates password, sends confirmation email
 * 7. User can now log in with new password
 *
 * INTEGRATION POINTS:
 * - Token storage (Redis or file-based fallback)
 * - Email service (confirmation email)
 * - Frontend: /src/app/auth/reset-password/page.tsx (line 77)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import type { EmailToken } from '@/lib/email/utils';

// Mock dependencies
vi.mock('@/lib/email/token-storage', () => ({
  verifyAndConsumeToken: vi.fn(),
  deleteTokenByEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/email/mailer', () => ({
  sendEmail: vi.fn().mockResolvedValue({
    success: true,
    messageId: 'msg-123',
  }),
}));

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  const createValidToken = (overrides?: Partial<EmailToken>): EmailToken => {
    return {
      token: 'test-reset-token-123',
      email: 'user@example.com',
      createdAt: Date.now(),
      type: 'password_reset',
      ...overrides,
    };
  };

  /**
   * BDD: Successful Password Reset - Happy Path
   *
   * GIVEN: A valid password_reset token exists in storage (not expired, correct type)
   * WHEN: User submits new password with valid token (POST request)
   * THEN: Password is updated, token consumed, confirmation email sent, success response returned
   *
   * WHY: This is the PRIMARY password reset flow. After clicking the reset link in their email,
   *      users land on /auth/reset-password page where they enter a new password. The frontend
   *      then calls this endpoint with the token from the URL and the new password.
   *
   * SECURITY: Token is single-use (consumed after verification), preventing replay attacks.
   *           Confirmation email alerts user to password change (security notification).
   *
   * IMPROVEMENT IDEAS:
   * - Add password strength validation (complexity requirements)
   * - Check against previously used passwords
   * - Invalidate all existing sessions after password reset
   * - Add rate limiting per IP for reset attempts
   * - Log password reset events for audit trail
   */
  it('should reset password with valid token', async () => {
    // GIVEN: Valid password reset token in storage
    const { verifyAndConsumeToken } = await import('@/lib/email/token-storage');
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(createValidToken());

    // WHEN: User submits new password with token
    const request = createRequest({
      token: 'test-token-123',
      password: 'newPassword123',
    });
    const response = await POST(request);
    const data = await response.json();

    // THEN: Success response with user email and confirmation message
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.email).toBe('user@example.com');
    expect(data.message).toContain('erfolgreich geändert');
  });

  /**
   * BDD: Input Validation - Missing Token
   *
   * GIVEN: Request with password but no token
   * WHEN: User submits reset request
   * THEN: 400 error with validation message
   *
   * WHY: Token is required to identify which user is resetting their password.
   *      Without it, we can't verify the reset request is legitimate.
   *
   * IMPROVEMENT IDEAS:
   * - Return specific error message for missing token vs missing password
   * - Add field-level validation errors for better UX
   */
  it('should reject missing token', async () => {
    // GIVEN: Request with password but missing token
    const request = createRequest({ password: 'newPassword123' });

    // WHEN: Attempting password reset
    const response = await POST(request);
    const data = await response.json();

    // THEN: Validation error returned
    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  /**
   * BDD: Input Validation - Missing Password
   *
   * GIVEN: Request with token but no password
   * WHEN: User submits reset request
   * THEN: 400 error with validation message
   *
   * WHY: Password is required - can't reset to an empty password.
   *
   * IMPROVEMENT IDEAS:
   * - Return specific error: "Password is required"
   * - Add client-side validation to prevent this API call
   */
  it('should reject missing password', async () => {
    // GIVEN: Request with token but missing password
    const request = createRequest({ token: 'test-token' });

    // WHEN: Attempting password reset
    const response = await POST(request);
    const data = await response.json();

    // THEN: Validation error returned
    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  /**
   * BDD: Password Strength Validation - Minimum Length
   *
   * GIVEN: Request with valid token but password shorter than 8 characters
   * WHEN: User submits weak password
   * THEN: 400 error with specific message about minimum length
   *
   * WHY: Enforces minimum password security standard (8 characters).
   *      Prevents users from choosing easily guessable passwords.
   *
   * SECURITY: 8-character minimum is industry standard baseline.
   *
   * IMPROVEMENT IDEAS:
   * - Add complexity requirements (uppercase, lowercase, numbers, symbols)
   * - Check against common password lists (pwned passwords)
   * - Show password strength indicator in frontend
   * - Enforce maximum length to prevent DoS attacks
   */
  it('should reject short password', async () => {
    // GIVEN: Request with password shorter than 8 characters
    const request = createRequest({
      token: 'test-token',
      password: 'short',
    });

    // WHEN: Attempting password reset with weak password
    const response = await POST(request);
    const data = await response.json();

    // THEN: Specific validation error about minimum length
    expect(response.status).toBe(400);
    expect(data.error).toContain('mindestens 8 Zeichen');
  });

  /**
   * BDD: Token Validation - Invalid/Non-existent Token
   *
   * GIVEN: Token that doesn't exist in storage (never created or already consumed)
   * WHEN: User attempts password reset
   * THEN: 400 error indicating invalid or expired token
   *
   * WHY: Prevents unauthorized password resets. Only users with valid tokens
   *      (received via email) can reset passwords.
   *
   * SECURITY: This prevents attackers from guessing token values to reset passwords.
   *
   * IMPROVEMENT IDEAS:
   * - Add rate limiting on failed token attempts per IP
   * - Log suspicious activity (multiple failed attempts)
   * - Add CAPTCHA after N failed attempts
   */
  it('should reject invalid token', async () => {
    // GIVEN: Token doesn't exist in storage (returns null)
    const { verifyAndConsumeToken } = await import('@/lib/email/token-storage');
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(null);

    // WHEN: Attempting password reset with invalid token
    const request = createRequest({
      token: 'invalid-token',
      password: 'newPassword123',
    });
    const response = await POST(request);
    const data = await response.json();

    // THEN: Error indicating token is invalid or expired
    expect(response.status).toBe(400);
    expect(data.error).toContain('Ungültiger oder abgelaufener');
  });

  /**
   * BDD: Token Type Validation - Cross-Flow Token Reuse Prevention
   *
   * GIVEN: Valid token but wrong type (e.g., email_verify token used for password reset)
   * WHEN: User attempts password reset with wrong token type
   * THEN: 400 error indicating wrong token type
   *
   * WHY: Prevents token reuse across different authentication flows.
   *      An email verification token should not work for password reset.
   *
   * SECURITY: This prevents privilege escalation. Each token type has specific
   *           permissions and expiration times. Email verification tokens last
   *           24 hours, password reset only 30 minutes.
   *
   * IMPROVEMENT IDEAS:
   * - Log token type mismatches (could indicate attack attempt)
   * - Add telemetry to track common user errors vs attacks
   */
  it('should reject wrong token type', async () => {
    // GIVEN: Valid token but wrong type (email_verify instead of password_reset)
    const { verifyAndConsumeToken } = await import('@/lib/email/token-storage');
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(
      createValidToken({ type: 'email_verify' })
    );

    // WHEN: Attempting password reset with email verification token
    const request = createRequest({
      token: 'test-token',
      password: 'newPassword123',
    });
    const response = await POST(request);
    const data = await response.json();

    // THEN: Specific error about wrong token type
    expect(response.status).toBe(400);
    expect(data.error).toContain('Falscher Token-Typ');
  });

  /**
   * BDD: Token Expiration - Time-Based Security
   *
   * GIVEN: Valid password_reset token created more than 30 minutes ago
   * WHEN: User attempts to use expired token
   * THEN: 400 error indicating token has expired
   *
   * WHY: Password reset tokens expire after 30 minutes to limit the attack window.
   *      If someone gains access to user's email, they have limited time to exploit it.
   *
   * SECURITY: Short expiration (30 min) for password_reset vs 24 hours for email_verify
   *           reflects higher security risk of password changes.
   *
   * BUSINESS RULE: 30-minute expiration for password_reset tokens
   *
   * IMPROVEMENT IDEAS:
   * - Make expiration configurable via environment variable
   * - Send new reset link automatically when user tries expired token
   * - Add "resend reset link" button with rate limiting
   */
  it('should reject expired token', async () => {
    // GIVEN: Token created 31 minutes ago (expired - limit is 30 minutes)
    const { verifyAndConsumeToken } = await import('@/lib/email/token-storage');
    const expiredTime = Date.now() - (31 * 60 * 1000);
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(
      createValidToken({ createdAt: expiredTime })
    );

    // WHEN: Attempting password reset with expired token
    const request = createRequest({
      token: 'expired-token',
      password: 'newPassword123',
    });
    const response = await POST(request);
    const data = await response.json();

    // THEN: Error indicating token has expired
    expect(response.status).toBe(400);
    expect(data.error).toContain('abgelaufen');
  });

  /**
   * BDD: Single-Use Token Enforcement - Replay Attack Prevention
   *
   * GIVEN: Valid password reset token
   * WHEN: User successfully resets password
   * THEN: Token is consumed (deleted from storage) during verification
   *
   * WHY: Tokens must be single-use only. Once used for password reset, the token
   *      should be invalid for future attempts.
   *
   * SECURITY: Prevents replay attacks. If attacker intercepts reset link, they can
   *           only use it once. After legitimate user resets password, intercepted
   *           link becomes useless.
   *
   * IMPROVEMENT IDEAS:
   * - Add integration test verifying second use returns 400
   * - Log token reuse attempts (security monitoring)
   * - Alert user if token reuse is detected after successful reset
   */
  it('should consume token (single-use)', async () => {
    // GIVEN: Valid password reset token
    const { verifyAndConsumeToken } = await import('@/lib/email/token-storage');
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(createValidToken());

    // WHEN: User resets password
    const request = createRequest({
      token: 'test-token',
      password: 'newPassword123',
    });
    await POST(request);

    // THEN: verifyAndConsumeToken was called (consumes the token)
    expect(verifyAndConsumeToken).toHaveBeenCalledWith('test-token');
  });

  /**
   * BDD: Token Cleanup - Email-Based Token Invalidation
   *
   * GIVEN: Successful password reset
   * WHEN: Token is verified and password updated
   * THEN: All password_reset tokens for this email are deleted
   *
   * WHY: User may have requested multiple reset links (clicking "forgot password"
   *      multiple times). After successful reset, invalidate ALL reset tokens for
   *      this email, not just the one used.
   *
   * SECURITY: Prevents attacker from using older reset link if user requested
   *           multiple resets. Only the most recent password is valid.
   *
   * IMPROVEMENT IDEAS:
   * - Extend to invalidate all sessions for this user (force re-login)
   * - Add audit log of which token was used vs which were invalidated
   */
  it('should cleanup token by email', async () => {
    // GIVEN: Valid password reset token for user@example.com
    const { verifyAndConsumeToken, deleteTokenByEmail } = await import('@/lib/email/token-storage');
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(createValidToken());

    // WHEN: User resets password successfully
    const request = createRequest({
      token: 'test-token',
      password: 'newPassword123',
    });
    await POST(request);

    // THEN: All password_reset tokens for this email are deleted
    expect(deleteTokenByEmail).toHaveBeenCalledWith('user@example.com', 'password_reset');
  });

  /**
   * BDD: Security Notification - Password Change Confirmation Email
   *
   * GIVEN: Successful password reset
   * WHEN: Password is updated in system
   * THEN: Confirmation email sent to user's email address
   *
   * WHY: Security best practice - notify users when sensitive account changes occur.
   *      If user didn't initiate the reset, they'll know their account was compromised.
   *
   * SECURITY: Alerts users to unauthorized password changes. Even if attacker gained
   *           access to email and changed password, user gets notification and can
   *           take action (contact support, change email password, etc.).
   *
   * IMPROVEMENT IDEAS:
   * - Include timestamp and IP address of password change
   * - Add "I didn't make this change" link to immediately lock account
   * - Include device/browser information if available
   */
  it('should send password changed confirmation email', async () => {
    // GIVEN: Successful password reset
    const { verifyAndConsumeToken } = await import('@/lib/email/token-storage');
    const { sendEmail } = await import('@/lib/email/mailer');
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(createValidToken());

    // WHEN: User resets password
    const request = createRequest({
      token: 'test-token',
      password: 'newPassword123',
    });
    await POST(request);

    // THEN: Confirmation email sent with success subject
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringContaining('Passwort erfolgreich geändert'),
      })
    );
  });

  /**
   * BDD: Resilience - Email Failure Doesn't Block Password Reset
   *
   * GIVEN: Valid password reset request but email service is down
   * WHEN: Confirmation email fails to send
   * THEN: Password reset still succeeds (200 response)
   *
   * WHY: Email is notification only, not critical to password reset operation.
   *      Password reset should succeed even if email service is temporarily down.
   *
   * BUSINESS DECISION: User experience prioritized - let users reset password
   *                    even if notification email fails. They'll know it worked
   *                    because they can log in with new password.
   *
   * IMPROVEMENT IDEAS:
   * - Queue failed emails for retry
   * - Log email failures for monitoring
   * - Show in-app notification if email fails but reset succeeds
   */
  it('should succeed even if confirmation email fails', async () => {
    // GIVEN: Valid token but email service is down
    const { verifyAndConsumeToken } = await import('@/lib/email/token-storage');
    const { sendEmail } = await import('@/lib/email/mailer');
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(createValidToken());
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('SMTP error'));

    // WHEN: User resets password despite email failure
    const request = createRequest({
      token: 'test-token',
      password: 'newPassword123',
    });
    const response = await POST(request);
    const data = await response.json();

    // THEN: Password reset succeeds anyway
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  /**
   * BDD: Error Handling - Storage Infrastructure Failure
   *
   * GIVEN: Request with valid format but storage service is down
   * WHEN: Token verification fails due to Redis/storage error
   * THEN: 500 error with generic error message
   *
   * WHY: Infrastructure failures should be handled gracefully with appropriate
   *      HTTP status codes. 500 indicates server error, not client error.
   *
   * SECURITY: Generic error message prevents information leakage about internal
   *           infrastructure (don't expose Redis errors to users).
   *
   * IMPROVEMENT IDEAS:
   * - Add retry logic for transient storage failures
   * - Implement circuit breaker pattern
   * - Alert ops team when storage errors occur
   * - Add fallback to secondary storage if primary fails
   */
  it('should handle token verification errors', async () => {
    // GIVEN: Storage service is down (Redis error)
    const { verifyAndConsumeToken } = await import('@/lib/email/token-storage');
    vi.mocked(verifyAndConsumeToken).mockRejectedValueOnce(new Error('Redis error'));

    // WHEN: Attempting password reset during outage
    const request = createRequest({
      token: 'test-token',
      password: 'newPassword123',
    });
    const response = await POST(request);
    const data = await response.json();

    // THEN: Server error with generic message (don't leak infrastructure details)
    expect(response.status).toBe(500);
    expect(data.error).toContain('Ein Fehler ist aufgetreten');
  });

  /**
   * BDD: Boundary Value Testing - Minimum Password Length Acceptance
   *
   * GIVEN: Password with exactly 8 characters (minimum allowed)
   * WHEN: User resets password with boundary value
   * THEN: Password is accepted (200 success)
   *
   * WHY: Validates that boundary condition is properly handled. Common bug is
   *      off-by-one errors (requiring > 8 instead of >= 8).
   *
   * TESTING: Boundary value analysis - test exactly at the minimum threshold.
   *
   * IMPROVEMENT IDEAS:
   * - Add test for maximum password length boundary
   * - Test with exactly 7 characters (should fail)
   * - Test with 9 characters (should pass with margin)
   */
  it('should accept password with exactly 8 characters', async () => {
    // GIVEN: Valid token and password with exactly 8 characters
    const { verifyAndConsumeToken } = await import('@/lib/email/token-storage');
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(createValidToken());

    // WHEN: User resets password with minimum length
    const request = createRequest({
      token: 'test-token',
      password: '12345678',
    });
    const response = await POST(request);
    const data = await response.json();

    // THEN: Password is accepted (boundary value is inclusive)
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
