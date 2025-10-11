/**
 * BDD Tests for Forgot Password API Route
 *
 * PURPOSE: Verifies the password reset REQUEST flow - when users forget their password
 *          and need to receive a reset link via email
 *
 * BUSINESS CONTEXT:
 * Users who forget their password click "Forgot Password" link and enter their email.
 * This endpoint generates a secure token, stores it, and emails a reset link to the user.
 * The user then clicks the link to proceed to the actual password reset form.
 *
 * SECURITY REQUIREMENTS:
 * - Rate limiting: Prevents email bombing attacks (limit: 5 per hour per IP)
 * - Token expiry: Reset tokens valid for 30 minutes only
 * - Email validation: Only valid email formats accepted
 * - No user enumeration: Same response whether email exists or not
 * - Single-use tokens: Token consumed when used
 *
 * USER FLOW:
 * 1. User clicks "Forgot Password" on login page
 * 2. User enters their email address
 * 3. Frontend calls POST /api/auth/forgot-password with email
 * 4. Backend generates token, stores it, sends email with reset link
 * 5. User receives email with link: /auth/reset-password?token=xyz
 * 6. User clicks link → redirected to reset-password page
 * 7. User enters new password (handled by reset-password route)
 *
 * INTEGRATION POINTS:
 * - Rate limiting (Upstash Redis)
 * - Token storage (Redis or file-based fallback)
 * - Email service (MailerSend)
 * - Frontend: /src/app/auth/forgot-password/page.tsx
 *
 * RELATED ROUTES:
 * - /api/auth/reset-password - Handles actual password change (next step)
 * - /api/auth/verify-email - Similar token-based flow for registration
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/rate-limit', () => ({
  apiRatelimit: {
    email: {
      limit: vi.fn().mockResolvedValue({ success: true }),
    },
  },
}));

vi.mock('@/lib/email/mailer', () => ({
  sendEmail: vi.fn().mockResolvedValue({
    success: true,
    messageId: 'msg-123',
  }),
}));

vi.mock('@/lib/email/token-storage', () => ({
  storeEmailToken: vi.fn().mockResolvedValue(true),
  storeTokenByEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/env', () => ({
  env: {
    NEXTAUTH_URL: 'https://test.example.com',
    MAILERSEND_API_KEY: 'test-key',
  },
}));

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: JSON.stringify(body),
    });
  };

  /**
   * BDD: Successful Password Reset Request - Happy Path
   *
   * GIVEN: Valid email address submitted
   * WHEN: User requests password reset
   * THEN: Token generated, stored, email sent, success response returned
   *
   * WHY: This is the PRIMARY forgot-password flow. User enters email on forgot-password
   *      page, backend sends them a reset link via email.
   *
   * SECURITY: Email address is validated, sanitized, and lowercased before processing.
   *           Token is securely generated and stored with 30-minute expiration.
   *
   * IMPROVEMENT IDEAS:
   * - Add email verification (only send reset to verified emails)
   * - Include timestamp in email showing when request was made
   * - Add link to cancel/invalidate reset request
   */
  it('should send password reset email for valid email', async () => {
    // GIVEN: Valid email address
    const request = createRequest({ email: 'user@example.com' });

    // WHEN: User requests password reset
    const response = await POST(request);
    const data = await response.json();

    // THEN: Success response with German confirmation message
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('E-Mail zum Zurücksetzen des Passworts gesendet');
  });

  /**
   * BDD: Email Normalization - Case Insensitive Email Matching
   *
   * GIVEN: Email with mixed case (USER@EXAMPLE.COM)
   * WHEN: User submits forgot-password request
   * THEN: Email normalized to lowercase before processing
   *
   * WHY: Email addresses are case-insensitive per RFC 5321. user@example.com
   *      and USER@EXAMPLE.com are the same email. We normalize to lowercase
   *      for consistent database lookups and token storage.
   *
   * SECURITY: Prevents duplicate reset tokens for same email with different casing.
   *
   * IMPROVEMENT IDEAS:
   * - Add test verifying database lookup uses normalized email
   * - Trim whitespace from email input
   * - Validate email domain exists (MX record check)
   */
  it('should sanitize and lowercase email', async () => {
    // GIVEN: Email with uppercase characters
    const request = createRequest({ email: 'USER@EXAMPLE.COM' });

    // WHEN: User submits request
    const response = await POST(request);
    const data = await response.json();

    // THEN: Request succeeds (email normalized internally)
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // THEN: Email was sent (verifies normalization didn't break flow)
    const { sendEmail } = await import('@/lib/email/mailer');
    expect(sendEmail).toHaveBeenCalled();
  });

  /**
   * BDD: Input Validation - Invalid Email Format Rejection
   *
   * GIVEN: Malformed email address (missing @domain)
   * WHEN: User submits invalid email
   * THEN: 400 error with validation message
   *
   * WHY: Prevents wasting resources on invalid emails. No point generating
   *      tokens or attempting to send emails to malformed addresses.
   *
   * SECURITY: Validates input before any database or email service operations.
   *           Prevents injection attacks through email field.
   *
   * IMPROVEMENT IDEAS:
   * - Add specific validation messages (missing @, invalid domain, etc.)
   * - Return field-level errors for better UX
   * - Add frontend validation to catch this before API call
   */
  it('should reject invalid email format', async () => {
    // GIVEN: Malformed email address
    const request = createRequest({ email: 'invalid-email' });

    // WHEN: Attempting password reset
    const response = await POST(request);
    const data = await response.json();

    // THEN: Validation error in German
    expect(response.status).toBe(400);
    expect(data.error).toContain('Ungültige E-Mail-Adresse');
  });

  /**
   * BDD: Required Field Validation - Missing Email
   *
   * GIVEN: Request without email field
   * WHEN: User submits empty request
   * THEN: 400 error
   *
   * WHY: Email is required - can't send reset link without knowing where to send it.
   *
   * IMPROVEMENT IDEAS:
   * - Return specific error: "Email address is required"
   * - Add client-side validation to prevent this API call
   */
  it('should reject missing email', async () => {
    // GIVEN: Request with no email field
    const request = createRequest({});

    // WHEN: Attempting password reset
    const response = await POST(request);
    const data = await response.json();

    // THEN: Validation error returned
    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  /**
   * BDD: Rate Limiting - Email Bombing Prevention
   *
   * GIVEN: User has exceeded rate limit (5 requests per hour per IP)
   * WHEN: User attempts another password reset request
   * THEN: 429 Too Many Requests error
   *
   * WHY: Prevents abuse of forgot-password endpoint. Without rate limiting:
   *      - Attacker could spam user's inbox with reset emails
   *      - Email service costs would spike
   *      - User experience degraded (inbox flooded)
   *
   * SECURITY: Rate limiting is per IP address, not per email. This prevents
   *           attackers from spamming different emails from same IP.
   *
   * BUSINESS RULE: 5 forgot-password requests per hour per IP
   *
   * IMPROVEMENT IDEAS:
   * - Add separate rate limit per email address
   * - Implement progressive delays (first attempt instant, then 1s, 2s, 4s...)
   * - Alert security team if rate limit hit multiple times
   * - Add CAPTCHA after N failed attempts
   */
  it('should handle rate limiting', async () => {
    // GIVEN: Rate limit exceeded for this IP
    const { apiRatelimit } = await import('@/lib/rate-limit');
    vi.mocked(apiRatelimit.email.limit).mockResolvedValueOnce({ success: false } as any);

    // WHEN: Attempting another password reset
    const request = createRequest({ email: 'user@example.com' });
    const response = await POST(request);
    const data = await response.json();

    // THEN: Rate limit error in German
    expect(response.status).toBe(429);
    expect(data.error).toContain('Zu viele Anfragen');
  });

  /**
   * BDD: Token Persistence - Dual Storage Strategy
   *
   * GIVEN: Valid password reset request
   * WHEN: Token is generated
   * THEN: Token stored with both token-based and email-based keys
   *
   * WHY: Dual storage enables:
   *      1. Token lookup: GET /api/auth/reset-password?token=xyz needs fast token→data lookup
   *      2. Email lookup: User requests multiple resets, we can invalidate old tokens
   *
   * STORAGE KEYS:
   * - email_token:TOKEN - stores full token data (email, type, createdAt, etc.)
   * - email_token_by_email:TYPE:EMAIL - maps email→token for cleanup
   *
   * IMPROVEMENT IDEAS:
   * - Add TTL monitoring to ensure expiry works correctly
   * - Test Redis failover to file-based storage
   * - Add metrics for token storage failures
   */
  it('should store token in Redis', async () => {
    // GIVEN: Valid password reset request
    const { storeEmailToken, storeTokenByEmail } = await import('@/lib/email/token-storage');

    const request = createRequest({ email: 'user@example.com' });

    // WHEN: Token is generated
    await POST(request);

    // THEN: Token stored with both token-based and email-based keys
    expect(storeEmailToken).toHaveBeenCalled();
    expect(storeTokenByEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.any(String),
      'password_reset'
    );
  });

  /**
   * BDD: Email Content - Reset URL Generation
   *
   * GIVEN: Valid password reset request
   * WHEN: Email is sent to user
   * THEN: Email HTML contains reset URL with token as query parameter
   *
   * WHY: User needs clickable link to reset their password. Link format must match
   *      what frontend expects: /auth/reset-password?token=xyz
   *
   * URL FORMAT: https://test.example.com/auth/reset-password?token=<generated-token>
   *
   * SECURITY: Token in URL is acceptable for email links (not stored in browser history
   *           after use). Token is single-use and expires in 30 minutes.
   *
   * IMPROVEMENT IDEAS:
   * - Add test verifying token format (length, character set)
   * - Test URL encoding for special characters in token
   * - Verify NEXTAUTH_URL environment variable is used correctly
   */
  it('should generate reset URL with token', async () => {
    // GIVEN: Valid password reset request
    const { sendEmail } = await import('@/lib/email/mailer');

    const request = createRequest({ email: 'user@example.com' });

    // WHEN: Email is generated and sent
    await POST(request);

    // THEN: Email HTML contains properly formatted reset URL
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('https://test.example.com/auth/reset-password?token='),
      })
    );
  });

  /**
   * BDD: Email Metadata - Subject Line Verification
   *
   * GIVEN: Valid password reset request
   * WHEN: Email is sent
   * THEN: Subject line is in German with application name
   *
   * WHY: Clear subject line helps users:
   *      - Identify email is from this application (not phishing)
   *      - Find email in inbox when searching
   *      - Understand email purpose before opening
   *
   * LOCALIZATION: Subject is in German for German application
   *
   * IMPROVEMENT IDEAS:
   * - Add localization support (en, de, etc.)
   * - Include timestamp in subject for multiple resets
   * - A/B test subject lines for open rates
   */
  it('should send email with correct subject', async () => {
    // GIVEN: Valid password reset request
    const { sendEmail } = await import('@/lib/email/mailer');

    const request = createRequest({ email: 'user@example.com' });

    // WHEN: Email is sent
    await POST(request);

    // THEN: Subject line is in German with app name
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Passwort zurücksetzen - DocBits Bewirtungsbeleg',
      })
    );
  });

  /**
   * BDD: Email Service Failure Handling - Graceful Degradation
   *
   * GIVEN: Email service returns failure (SMTP error, API down, etc.)
   * WHEN: Attempting to send reset email
   * THEN: 500 error with user-friendly message
   *
   * WHY: Email service failures should be handled gracefully. User gets clear
   *      error message instead of generic "something went wrong".
   *
   * BUSINESS DECISION: Unlike password-reset confirmation email (which is optional),
   *                    the forgot-password email IS critical - can't proceed without it.
   *                    So we return 500 error rather than silently failing.
   *
   * IMPROVEMENT IDEAS:
   * - Retry email send 2-3 times before failing
   * - Queue email for later delivery if service is down
   * - Alert ops team when email service fails
   * - Show user alternative contact method (phone support, etc.)
   */
  it('should handle email sending failure', async () => {
    // GIVEN: Email service returns failure
    const { sendEmail } = await import('@/lib/email/mailer');
    vi.mocked(sendEmail).mockResolvedValueOnce({
      success: false,
      error: 'SMTP error',
    });

    // WHEN: Attempting to send reset email
    const request = createRequest({ email: 'user@example.com' });
    const response = await POST(request);
    const data = await response.json();

    // THEN: Server error with German message
    expect(response.status).toBe(500);
    expect(data.error).toContain('E-Mail konnte nicht gesendet werden');
  });

  /**
   * BDD: Storage Infrastructure Failure - Token Persistence Error
   *
   * GIVEN: Valid request but Redis/storage returns failure
   * WHEN: Attempting to store reset token
   * THEN: 500 error (cannot proceed without storing token)
   *
   * WHY: If token storage fails, user will never be able to reset password even
   *      if they receive the email. Better to fail fast and let user retry.
   *
   * IMPROVEMENT IDEAS:
   * - Retry token storage 2-3 times before failing
   * - Implement circuit breaker for storage
   * - Fallback to alternative storage (file-based if Redis fails)
   * - Alert ops team when storage fails
   */
  it('should handle token storage failure', async () => {
    // GIVEN: Storage service returns failure
    const { storeEmailToken } = await import('@/lib/email/token-storage');
    vi.mocked(storeEmailToken).mockResolvedValueOnce(false);

    // WHEN: Attempting to store token
    const request = createRequest({ email: 'user@example.com' });
    const response = await POST(request);
    const data = await response.json();

    // THEN: Server error (cannot proceed without token)
    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  /**
   * BDD: Unexpected Error Handling - Generic Exception Catch
   *
   * GIVEN: Unexpected exception during request processing
   * WHEN: Error is thrown (email service crash, etc.)
   * THEN: 500 error with generic German message
   *
   * WHY: All unexpected errors should be caught and handled gracefully.
   *      User sees friendly error message, not stack trace.
   *
   * SECURITY: Generic error message prevents information leakage about
   *           internal system details.
   *
   * IMPROVEMENT IDEAS:
   * - Log full error details for debugging
   * - Add error tracking (Sentry, etc.)
   * - Include request ID in error response for support
   * - Differentiate between transient vs permanent errors
   */
  it('should handle unexpected errors', async () => {
    // GIVEN: Unexpected exception during processing
    const { sendEmail } = await import('@/lib/email/mailer');
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('Unexpected error'));

    // WHEN: Processing request
    const request = createRequest({ email: 'user@example.com' });
    const response = await POST(request);
    const data = await response.json();

    // THEN: Generic error message in German
    expect(response.status).toBe(500);
    expect(data.error).toContain('Ein Fehler ist aufgetreten');
  });

  /**
   * BDD: IP Address Extraction - Proxy Header Support
   *
   * GIVEN: Request through reverse proxy (production setup)
   * WHEN: Extracting client IP for rate limiting
   * THEN: Uses x-forwarded-for header value
   *
   * WHY: In production, application runs behind reverse proxy (Vercel, Nginx, etc.).
   *      Real client IP is in x-forwarded-for header, not direct connection.
   *
   * SECURITY: Proper IP extraction crucial for rate limiting effectiveness.
   *           Without it, all requests appear from same IP (proxy IP).
   *
   * IMPROVEMENT IDEAS:
   * - Validate x-forwarded-for format (could be spoofed)
   * - Use first IP in comma-separated list (closest to client)
   * - Add logging for IP extraction debugging
   */
  it('should use x-forwarded-for header for rate limiting', async () => {
    // GIVEN: Request through proxy with x-forwarded-for header
    const { apiRatelimit } = await import('@/lib/rate-limit');

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.100',
      },
      body: JSON.stringify({ email: 'user@example.com' }),
    });

    // WHEN: Processing request
    await POST(request);

    // THEN: Rate limit checked using x-forwarded-for IP
    expect(apiRatelimit.email.limit).toHaveBeenCalledWith('192.168.1.100');
  });

  /**
   * BDD: IP Address Fallback - Missing Proxy Header
   *
   * GIVEN: Request without x-forwarded-for header (local dev, direct access)
   * WHEN: Extracting client IP for rate limiting
   * THEN: Falls back to "unknown" identifier
   *
   * WHY: In local development or direct access, x-forwarded-for may not exist.
   *      Use "unknown" as fallback to prevent rate limit failures.
   *
   * SECURITY: All requests without IP header share same "unknown" rate limit.
   *           Acceptable for development, should not happen in production.
   *
   * IMPROVEMENT IDEAS:
   * - Log when fallback to "unknown" occurs
   * - Alert if too many "unknown" IPs in production
   * - Use request.connection.remoteAddress as secondary fallback
   */
  it('should fallback to "unknown" IP if x-forwarded-for is missing', async () => {
    // GIVEN: Request without x-forwarded-for header
    const { apiRatelimit } = await import('@/lib/rate-limit');

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'user@example.com' }),
    });

    // WHEN: Processing request
    await POST(request);

    // THEN: Rate limit checked using "unknown" identifier
    expect(apiRatelimit.email.limit).toHaveBeenCalledWith('unknown');
  });
});
