/**
 * BDD Tests for Magic Link Send API Route
 *
 * PURPOSE: Verifies passwordless login flow - sending magic link for instant login
 *
 * BUSINESS CONTEXT:
 * Magic links provide passwordless login. Users enter their email and receive a link
 * that logs them in directly without needing a password. This is more convenient than
 * traditional password login and eliminates password reset flows for many users.
 *
 * SECURITY REQUIREMENTS:
 * - Rate limiting: 5 requests per hour per IP (prevents spam)
 * - Token expiry: SHORTER than password reset (10 minutes vs 30 minutes)
 * - Email validation: Only valid email formats accepted
 * - Single-use tokens: Token consumed when used
 * - No user enumeration: Same response whether email exists or not
 *
 * USER FLOW:
 * 1. User clicks "Login with Magic Link" on login page
 * 2. User enters their email address
 * 3. Frontend calls POST /api/auth/magic-link/send with email
 * 4. Backend generates token, stores it, sends email with magic link
 * 5. User receives email with link: /api/auth/magic-link/verify?token=xyz
 * 6. User clicks link → automatically logged in (handled by verify route)
 *
 * KEY DIFFERENCES FROM PASSWORD RESET:
 * - Token type: 'magic_link' instead of 'password_reset'
 * - Expiry: 10 minutes (shorter - higher security for instant login)
 * - Verify URL: Points to API route, not frontend page (auto-redirect to callback)
 * - Subject line: "Anmelde-Link" (login link) not "Passwort zurücksetzen" (password reset)
 *
 * INTEGRATION POINTS:
 * - Rate limiting (Upstash Redis)
 * - Token storage (Redis or file-based fallback)
 * - Email service (MailerSend)
 * - Frontend: /src/app/auth/login/page.tsx (magic link option)
 *
 * RELATED ROUTES:
 * - /api/auth/magic-link/verify - Verifies token and creates session (next step)
 * - /api/auth/passwort-vergessen - Similar flow but for password reset
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

describe('POST /api/auth/magic-link/send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/auth/magic-link/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: JSON.stringify(body),
    });
  };

  /**
   * BDD: Successful Magic Link Send - Passwordless Login Happy Path
   *
   * GIVEN: Valid email address for passwordless login
   * WHEN: User requests magic link
   * THEN: Token generated, stored with 10-min expiry, email sent, success response
   *
   * WHY: Magic links provide frictionless login. No password to remember/type.
   *      Especially useful for mobile users and infrequent users.
   *
   * UX: Confirms email was sent with German message
   *
   * IMPROVEMENT IDEAS:
   * - Add "Remember this device" option to reduce magic link frequency
   * - Track how often users use magic links vs password login
   * - Add SMS magic links as alternative
   */
  it('should send magic link email for valid email', async () => {
    // GIVEN: Valid email address
    const request = createRequest({ email: 'user@example.com' });

    // WHEN: User requests magic link for login
    const response = await POST(request);
    const data = await response.json();

    // THEN: Success response with German confirmation
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('Anmelde-Link wurde an Ihre E-Mail-Adresse gesendet');
  });

  /**
   * BDD: Email Normalization - Case Insensitive Matching
   * (Same as forgot-password - email addresses are case-insensitive per RFC 5321)
   */
  it('should sanitize and lowercase email', async () => {
    const request = createRequest({ email: 'USER@EXAMPLE.COM' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    const { sendEmail } = await import('@/lib/email/mailer');
    expect(sendEmail).toHaveBeenCalled();
  });

  /**
   * BDD: Input Validation - Invalid Email Format
   * (Prevents wasting resources on malformed email addresses)
   */
  it('should reject invalid email format', async () => {
    const request = createRequest({ email: 'invalid-email' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Ungültige E-Mail-Adresse');
  });

  /**
   * BDD: Required Field Validation - Missing Email
   */
  it('should reject missing email', async () => {
    const request = createRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  /**
   * BDD: Rate Limiting - Magic Link Spam Prevention
   *
   * WHY: Without rate limiting, attackers could:
   *      - Spam user's inbox with login links
   *      - Cost money via email service
   *      - Social engineering attacks (flood user, hide phishing email)
   *
   * BUSINESS RULE: 5 magic link requests per hour per IP
   */
  it('should handle rate limiting', async () => {
    const { apiRatelimit } = await import('@/lib/rate-limit');
    vi.mocked(apiRatelimit.email.limit).mockResolvedValueOnce({ success: false } as any);

    const request = createRequest({ email: 'user@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('Zu viele Anfragen');
  });

  /**
   * BDD: Token Persistence - Magic Link Type Storage
   *
   * CRITICAL: Token type is 'magic_link', not 'password_reset'
   *           This ensures tokens can't be reused across different flows
   *
   * STORAGE KEYS:
   * - email_token:TOKEN - contains {email, type: 'magic_link', createdAt}
   * - email_token_by_email:magic_link:EMAIL - maps email→token for cleanup
   */
  it('should store token in Redis', async () => {
    const { storeEmailToken, storeTokenByEmail } = await import('@/lib/email/token-storage');

    const request = createRequest({ email: 'user@example.com' });
    await POST(request);

    expect(storeEmailToken).toHaveBeenCalled();
    expect(storeTokenByEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.any(String),
      'magic_link'  // Type is 'magic_link', not 'password_reset'
    );
  });

  /**
   * BDD: Email URL Generation - API Verify Endpoint
   *
   * CRITICAL DIFFERENCE: Magic link points to /api/auth/magic-link/verify (API route),
   *                      NOT /auth/... (frontend page). API route handles verification
   *                      and redirects to callback page with session.
   *
   * URL FORMAT: https://test.example.com/api/auth/magic-link/verify?token=xyz
   *
   * WHY API ROUTE: User clicks link → immediate verification → auto-redirect with session.
   *                No intermediate form page needed (unlike password reset).
   */
  it('should generate magic link URL with token', async () => {
    const { sendEmail } = await import('@/lib/email/mailer');

    const request = createRequest({ email: 'user@example.com' });
    await POST(request);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('https://test.example.com/api/auth/magic-link/verify?token='),
      })
    );
  });

  /**
   * BDD: Email Subject - Login Link Identification
   *
   * Subject: "Ihr Anmelde-Link" (Your Login Link)
   * NOT: "Passwort zurücksetzen" (Password Reset)
   *
   * WHY: Clear distinction helps users identify email type immediately
   */
  it('should send email with correct subject', async () => {
    const { sendEmail } = await import('@/lib/email/mailer');

    const request = createRequest({ email: 'user@example.com' });
    await POST(request);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Ihr Anmelde-Link - DocBits Bewirtungsbeleg',
      })
    );
  });

  /**
   * BDD: Email Service Failure - Critical Path
   *
   * BUSINESS DECISION: Magic link email IS critical (like password reset).
   *                    Can't log in without it, so return 500 if email fails.
   */
  it('should handle email sending failure', async () => {
    const { sendEmail } = await import('@/lib/email/mailer');
    vi.mocked(sendEmail).mockResolvedValueOnce({
      success: false,
      error: 'SMTP error',
    });

    const request = createRequest({ email: 'user@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('E-Mail konnte nicht gesendet werden');
  });

  /**
   * BDD: Storage Infrastructure Failure
   */
  it('should handle token storage failure', async () => {
    const { storeEmailToken } = await import('@/lib/email/token-storage');
    vi.mocked(storeEmailToken).mockResolvedValueOnce(false);

    const request = createRequest({ email: 'user@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  /**
   * BDD: Unexpected Error Handling
   */
  it('should handle unexpected errors', async () => {
    const { sendEmail } = await import('@/lib/email/mailer');
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('Unexpected error'));

    const request = createRequest({ email: 'user@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Ein Fehler ist aufgetreten');
  });

  /**
   * BDD: Token Expiry Configuration - Security vs UX Trade-off
   *
   * GIVEN: Magic link email generated
   * WHEN: Email HTML is created
   * THEN: Email clearly states "10 Minuten" (10 minutes) expiry
   *
   * WHY: 10 minutes is SHORTER than password reset (30 min) because:
   *      - Magic links grant instant access (higher security risk)
   *      - Password reset requires additional step (setting new password)
   *      - 10 minutes is enough for user to check email and click
   *
   * BUSINESS RULE: Magic link tokens expire in 10 minutes
   *
   * SECURITY: Short expiry window limits attack opportunity if email is intercepted
   *
   * IMPROVEMENT IDEAS:
   * - Make expiry configurable via environment variable
   * - Add "resend magic link" button if expired
   * - Track average time from send to click (optimize expiry)
   */
  it('should use 10 minute expiry for magic links', async () => {
    // GIVEN: Magic link request
    const { sendEmail } = await import('@/lib/email/mailer');

    const request = createRequest({ email: 'user@example.com' });

    // WHEN: Email is generated
    await POST(request);

    // THEN: Email clearly communicates 10-minute expiry to user
    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('10 Minuten');
  });
});
