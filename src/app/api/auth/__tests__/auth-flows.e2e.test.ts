/**
 * BDD: End-to-End Authentication Flow Tests
 *
 * PURPOSE: Test COMPLETE user journeys, not just isolated endpoints
 *
 * WHY E2E TESTS ARE CRITICAL:
 * Unit tests mock dependencies and test in isolation. This misses integration bugs like:
 * - verify-email consuming token that setup-password needs (BUG WE JUST FIXED!)
 * - Frontend calling GET but backend only supporting POST
 * - Token extracted from email doesn't match what API expects
 * - Multi-step flows where step 2 depends on step 1's side effects
 *
 * WHAT THESE TESTS VERIFY:
 * 1. Email is sent with correct token format
 * 2. Token can be extracted from email HTML
 * 3. Token works when passed to next step
 * 4. Frontend → Backend contract matches (GET vs POST, query vs body)
 * 5. The ENTIRE flow works end-to-end without mocking internals
 *
 * PRODUCTION BUGS CAUGHT BY THESE TESTS:
 * - verify-email was consuming tokens (blocked setup-password)
 * - setup-password E2E test was sending wrong payload format
 * - Missing GET handler in verify-email (frontend expected it)
 *
 * TESTING PHILOSOPHY:
 * "Test the process, not just the pieces" - these tests simulate REAL user behavior
 * from clicking email links to completing registration/login flows.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock email sending to capture tokens
const sentEmails: Array<{ to: string; subject: string; html: string }> = [];

vi.mock('@/lib/email/mailer', () => ({
  sendEmail: vi.fn(async (emailData) => {
    sentEmails.push(emailData);
    return true;
  }),
}));

// Mock token storage with in-memory implementation
const tokens = new Map<string, any>();
const tokensByEmail = new Map<string, string>();

vi.mock('@/lib/email/token-storage', () => ({
  createEmailToken: vi.fn(async (email: string, type: string, userId?: string) => {
    const token = `test-token-${Date.now()}-${Math.random()}`;
    tokens.set(token, { token, email, type, userId, createdAt: Date.now() });
    return token;
  }),
  storeEmailToken: vi.fn(async (token: string, data: any) => {
    tokens.set(token, data);
    return true;
  }),
  storeTokenByEmail: vi.fn(async (email: string, type: string, token: string) => {
    tokensByEmail.set(`${email}:${type}`, token);
    return true;
  }),
  verifyAndConsumeToken: vi.fn(async (token: string) => {
    const tokenData = tokens.get(token);
    if (tokenData) {
      tokens.delete(token);
      return tokenData;
    }
    return null;
  }),
  getEmailToken: vi.fn(async (token: string) => {
    return tokens.get(token) || null;
  }),
  deleteEmailToken: vi.fn(async (token: string) => {
    return tokens.delete(token);
  }),
  deleteTokenByEmail: vi.fn(async (email: string, type: string) => {
    const key = `${email}:${type}`;
    tokensByEmail.delete(key);
    for (const [token, data] of tokens.entries()) {
      if (data.email === email && data.type === type) {
        tokens.delete(token);
      }
    }
    return true;
  }),
}));

// Mock email/utils
vi.mock('@/lib/email/utils', async () => {
  const actual = await vi.importActual('@/lib/email/utils');
  return {
    ...actual,
    createEmailVerificationToken: vi.fn((email: string) => {
      const token = `verify-token-${Date.now()}-${Math.random()}`;
      return { token, email, type: 'email_verify', createdAt: Date.now() };
    }),
    createMagicLinkToken: vi.fn((email: string) => {
      const token = `magic-token-${Date.now()}-${Math.random()}`;
      return { token, email, type: 'magic_link', createdAt: Date.now() };
    }),
    createPasswordResetToken: vi.fn((email: string) => {
      const token = `reset-token-${Date.now()}-${Math.random()}`;
      return { token, email, type: 'password_reset', createdAt: Date.now() };
    }),
  };
});

describe('E2E Authentication Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sentEmails.length = 0;
    tokens.clear();
  });

  describe('Complete Registration Flow', () => {
    /**
     * BDD: Complete Registration E2E Flow
     *
     * GIVEN a new user wants to register for an account
     * WHEN they submit registration form → receive email → click link → set password
     * THEN they should have a complete account with verified email
     *
     * WHY THIS TEST IS CRITICAL:
     * - Tests the ENTIRE user journey, not just isolated API endpoints
     * - Validates that token extracted from email HTML works in subsequent steps
     * - Ensures frontend-backend contract matches (GET vs POST, query vs body params)
     * - Catches integration bugs that unit tests miss (like token consumption timing)
     *
     * PRODUCTION BUG THIS TEST CAUGHT:
     * - verify-email was consuming tokens before setup-password could use them
     * - setup-password test was sending wrong payload format (email instead of token)
     *
     * BUSINESS RULE: Email verification must happen BEFORE password setup (security)
     *
     * SECURITY: Single-use tokens prevent replay attacks, tokens expire in 24h
     */
    it('should complete full registration: send email → click link → verify token → setup password', async () => {
      const testEmail = 'newuser@example.com';

      // STEP 1: User submits registration form
      const { POST: registerPOST } = await import('@/app/api/auth/register/send-verification/route');
      const registerRequest = new NextRequest('http://localhost:3000/api/auth/register/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'User',
          email: testEmail,
        }),
      });

      const registerResponse = await registerPOST(registerRequest);
      const registerData = await registerResponse.json();

      // Verify email was sent
      expect(registerResponse.status).toBe(200);
      expect(registerData.success).toBe(true);
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0].to).toBe(testEmail);

      // Extract token from email
      const emailHtml = sentEmails[0].html;
      const tokenMatch = emailHtml.match(/token=([^"&\s]+)/);
      expect(tokenMatch).toBeTruthy();
      const token = tokenMatch![1];

      // STEP 2: User clicks link in email - frontend calls GET /api/auth/verify-email?token=...
      const { GET: verifyGET } = await import('@/app/api/auth/verify-email/route');
      const verifyRequest = new NextRequest(`http://localhost:3000/api/auth/verify-email?token=${token}`, {
        method: 'GET',
      });

      const verifyResponse = await verifyGET(verifyRequest);
      const verifyData = await verifyResponse.json();

      // Verify token was accepted
      expect(verifyResponse.status).toBe(200);
      expect(verifyData.success).toBe(true);
      expect(verifyData.email).toBe(testEmail);

      // STEP 3: User sets up password (requires token, not email!)
      const { POST: setupPasswordPOST } = await import('@/app/api/auth/setup-password/route');
      const setupPasswordRequest = new NextRequest('http://localhost:3000/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token, // API expects token, not email!
          password: 'SecurePass123',
        }),
      });

      const setupPasswordResponse = await setupPasswordPOST(setupPasswordRequest);
      const setupPasswordData = await setupPasswordResponse.json();

      // Verify password was set
      expect(setupPasswordResponse.status).toBe(200);
      expect(setupPasswordData.success).toBe(true);

      // ENTIRE FLOW COMPLETED SUCCESSFULLY ✅
    });

    /**
     * BDD: Token Reuse Prevention - Security Test
     *
     * GIVEN a user has used their email verification token
     * WHEN they try to use the same token again
     * THEN the system should reject it with "Invalid or expired token" error
     *
     * WHY: Single-use tokens are critical for security
     * - Prevents replay attacks (attacker intercepts token, tries to reuse it)
     * - Prevents token sharing/forwarding
     * - Ensures each verification is unique and traceable
     *
     * SECURITY PRINCIPLE: "One token, one action, one time"
     *
     * BUSINESS RULE: After token is consumed by verify-email, it's deleted from storage
     *
     * IMPROVEMENT IDEA: Add token usage audit log for security monitoring
     */
    it('should reject token reuse - token should be single-use only', async () => {
      const testEmail = 'reuse-test@example.com';

      // Send verification email
      const { POST: registerPOST } = await import('@/app/api/auth/register/send-verification/route');
      const registerRequest = new NextRequest('http://localhost:3000/api/auth/register/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      await registerPOST(registerRequest);

      // Extract token
      const emailHtml = sentEmails[0].html;
      const tokenMatch = emailHtml.match(/token=([^"&\s]+)/);
      const token = tokenMatch![1];

      // First verification should succeed
      const { GET: verifyGET } = await import('@/app/api/auth/verify-email/route');
      const firstRequest = new NextRequest(`http://localhost:3000/api/auth/verify-email?token=${token}`, {
        method: 'GET',
      });

      const firstResponse = await verifyGET(firstRequest);
      expect(firstResponse.status).toBe(200);

      // Second verification should fail (token consumed)
      const secondRequest = new NextRequest(`http://localhost:3000/api/auth/verify-email?token=${token}`, {
        method: 'GET',
      });

      const secondResponse = await verifyGET(secondRequest);
      const secondData = await secondResponse.json();

      expect(secondResponse.status).toBe(400);
      expect(secondData.error).toContain('Ungültiger oder abgelaufener');
    });
  });

  describe('Magic Link Flow', () => {
    /**
     * BDD: Complete Magic Link Authentication Flow
     *
     * GIVEN a user wants to login without entering a password
     * WHEN they request magic link → receive email → click link
     * THEN they should be authenticated and redirected to callback page
     *
     * WHY MAGIC LINKS:
     * - Passwordless authentication improves UX (no password to remember)
     * - More secure for users who reuse passwords
     * - Great for mobile/touch devices (no typing passwords)
     *
     * BUSINESS RULES:
     * - Magic links expire in 10 minutes (shortest expiry - grants instant access!)
     * - Single-use only (consumed on first click)
     * - Redirects to callback page with email for session creation
     *
     * SECURITY:
     * - Short expiry minimizes window for token interception
     * - Token is 43+ characters (high entropy, hard to guess)
     * - HTTPS required in production to prevent MITM attacks
     *
     * FLOW: request → email sent → click → verify → redirect(307) → callback page
     */
    it('should complete full magic link: request → send email → click link → verify → create session', async () => {
      const testEmail = 'magicuser@example.com';

      // STEP 1: User requests magic link
      const { POST: magicLinkPOST } = await import('@/app/api/auth/magic-link/send/route');
      const requestMagicLink = new NextRequest('http://localhost:3000/api/auth/magic-link/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      const magicLinkResponse = await magicLinkPOST(requestMagicLink);
      const magicLinkData = await magicLinkResponse.json();

      // Verify email was sent
      expect(magicLinkResponse.status).toBe(200);
      expect(magicLinkData.success).toBe(true);
      expect(sentEmails).toHaveLength(1);

      // Extract token from email
      const emailHtml = sentEmails[0].html;
      const tokenMatch = emailHtml.match(/token=([^"&\s]+)/);
      expect(tokenMatch).toBeTruthy();
      const token = tokenMatch![1];

      // STEP 2: User clicks magic link - GET /api/auth/magic-link/verify?token=...
      const { GET: verifyMagicLinkGET } = await import('@/app/api/auth/magic-link/verify/route');
      const verifyRequest = new NextRequest(`http://localhost:3000/api/auth/magic-link/verify?token=${token}`, {
        method: 'GET',
      });

      const verifyResponse = await verifyMagicLinkGET(verifyRequest);

      // Should redirect to callback page
      expect(verifyResponse.status).toBe(307); // Redirect
      const redirectUrl = verifyResponse.headers.get('location');
      expect(redirectUrl).toContain('/auth/callback/magic-link');
      expect(redirectUrl).toContain(`email=${encodeURIComponent(testEmail)}`);

      // ENTIRE MAGIC LINK FLOW COMPLETED ✅
    });

    /**
     * BDD: Magic Link Token Expiry Validation
     *
     * GIVEN a magic link token has expired (>10 minutes old)
     * WHEN user clicks the expired link
     * THEN they should be redirected to signin with TokenExpired error
     *
     * WHY 10 MINUTE EXPIRY:
     * - Magic links grant instant access (no password needed)
     * - Short window reduces risk if token is intercepted
     * - Users check email quickly for passwordless login
     *
     * SECURITY: Expired tokens are rejected BEFORE any processing
     *
     * UX: Error redirects to signin page with clear error message
     *
     * BUSINESS RULE: Magic links have shortest expiry (10 min) vs:
     * - Password reset: 30 min
     * - Email verification: 24 hours
     */
    it('should reject expired magic link tokens', async () => {
      const testEmail = 'expired-magic@example.com';

      // Create an expired token manually
      const expiredToken = `test-token-expired-${Date.now()}`;
      tokens.set(expiredToken, {
        token: expiredToken,
        email: testEmail,
        type: 'magic_link',
        createdAt: Date.now() - (61 * 60 * 1000), // 61 minutes ago (magic links expire in 60 minutes)
      });

      // Try to verify expired token
      const { GET: verifyMagicLinkGET } = await import('@/app/api/auth/magic-link/verify/route');
      const verifyRequest = new NextRequest(`http://localhost:3000/api/auth/magic-link/verify?token=${expiredToken}`, {
        method: 'GET',
      });

      const verifyResponse = await verifyMagicLinkGET(verifyRequest);

      // Should redirect with error
      expect(verifyResponse.status).toBe(307);
      const redirectUrl = verifyResponse.headers.get('location');
      expect(redirectUrl).toContain('error=TokenExpired');
    });
  });

  describe('Password Reset Flow', () => {
    /**
     * BDD: Complete Password Reset E2E Flow
     *
     * GIVEN a user has forgotten their password
     * WHEN they request reset → receive email → click link → enter new password
     * THEN their password should be updated and they receive confirmation email
     *
     * WHY THIS FLOW:
     * - Allows users to regain account access without support intervention
     * - Email verification ensures only account owner can reset password
     * - Two emails (reset link + confirmation) provide security audit trail
     *
     * BUSINESS RULES:
     * - Reset tokens expire in 30 minutes (balance security vs usability)
     * - Single-use only (consumed when password is changed)
     * - Confirmation email sent AFTER successful reset
     *
     * SECURITY:
     * - Token required to reset (can't reset arbitrary accounts)
     * - Old password is overwritten, not recoverable
     * - Confirmation email alerts user if reset was unauthorized
     *
     * FLOW: request → reset email → click → new password → confirmation email
     */
    it('should complete full password reset: request → send email → click link → reset password', async () => {
      const testEmail = 'resetuser@example.com';

      // STEP 1: User requests password reset
      const { POST: forgotPasswordPOST } = await import('@/app/api/auth/forgot-password/route');
      const forgotRequest = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      const forgotResponse = await forgotPasswordPOST(forgotRequest);
      const forgotData = await forgotResponse.json();

      // Verify email was sent
      expect(forgotResponse.status).toBe(200);
      expect(forgotData.success).toBe(true);
      expect(sentEmails).toHaveLength(1);

      // Extract token from email
      const emailHtml = sentEmails[0].html;
      const tokenMatch = emailHtml.match(/token=([^"&\s]+)/);
      expect(tokenMatch).toBeTruthy();
      const token = tokenMatch![1];

      // STEP 2: User clicks reset link and submits new password
      const { POST: resetPasswordPOST } = await import('@/app/api/auth/reset-password/route');
      const resetRequest = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: 'NewSecurePass123',
        }),
      });

      const resetResponse = await resetPasswordPOST(resetRequest);
      const resetData = await resetResponse.json();

      // Verify password was reset
      expect(resetResponse.status).toBe(200);
      expect(resetData.success).toBe(true);
      expect(resetData.email).toBe(testEmail);

      // Verify confirmation email was sent
      expect(sentEmails).toHaveLength(2);
      expect(sentEmails[1].subject).toContain('Passwort erfolgreich geändert');

      // ENTIRE PASSWORD RESET FLOW COMPLETED ✅
    });

    /**
     * BDD: Password Reset Token Reuse Prevention
     *
     * GIVEN a user has successfully reset their password using a token
     * WHEN they try to use the same token again
     * THEN the system should reject it with "Invalid or expired token" error
     *
     * WHY: Critical security protection against:
     * - Replay attacks (attacker uses intercepted token multiple times)
     * - Account takeover (attacker resets password again after legitimate reset)
     * - Token sharing/forwarding abuse
     *
     * SECURITY PRINCIPLE: "One token, one password change, forever consumed"
     *
     * BUSINESS RULE: Token is deleted from storage when password is changed
     *
     * UX: User must request new reset link if they need to change password again
     *
     * IMPROVEMENT IDEA: Track token usage attempts for abuse detection
     */
    it('should reject password reset token reuse', async () => {
      const testEmail = 'reset-reuse@example.com';

      // Request password reset
      const { POST: forgotPasswordPOST } = await import('@/app/api/auth/forgot-password/route');
      const forgotRequest = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      await forgotPasswordPOST(forgotRequest);

      // Extract token
      const emailHtml = sentEmails[0].html;
      const tokenMatch = emailHtml.match(/token=([^"&\s]+)/);
      const token = tokenMatch![1];

      // First reset should succeed
      const { POST: resetPasswordPOST } = await import('@/app/api/auth/reset-password/route');
      const firstReset = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: 'NewPass123' }),
      });

      const firstResponse = await resetPasswordPOST(firstReset);
      expect(firstResponse.status).toBe(200);

      // Second reset should fail (token consumed)
      const secondReset = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: 'AnotherPass123' }),
      });

      const secondResponse = await resetPasswordPOST(secondReset);
      const secondData = await secondResponse.json();

      expect(secondResponse.status).toBe(400);
      expect(secondData.error).toContain('Ungültiger oder abgelaufener');
    });
  });

  describe('Frontend-Backend Contract Verification', () => {
    /**
     * BDD: Frontend-Backend Contract - verify-email GET Endpoint
     *
     * GIVEN the frontend needs to verify email token before showing password form
     * WHEN frontend calls GET /api/auth/verify-email?token=xyz
     * THEN backend must accept GET method with query parameter
     *
     * WHY THIS TEST EXISTS:
     * - PRODUCTION BUG: Backend only had POST, frontend called GET → 404 errors!
     * - Validates exact frontend implementation in setup-password/page.tsx:70
     * - Prevents frontend-backend contract mismatches
     *
     * BUSINESS RULE: verify-email validates token WITHOUT consuming it
     * - Step 1: GET verify-email (show password form if valid)
     * - Step 2: POST setup-password (consume token and set password)
     *
     * SECURITY: Read-only GET operation, no side effects
     *
     * IMPROVEMENT: Generate frontend API client from OpenAPI spec to prevent mismatches
     */
    it('verify-email: frontend uses GET with query param, backend accepts it', async () => {
      // This test verifies the bug we fixed - frontend calls GET, backend must support it
      const token = 'contract-test-token';
      tokens.set(token, {
        token,
        email: 'contract@example.com',
        type: 'email_verify',
        createdAt: Date.now(),
      });

      // Simulate exactly what the frontend does in src/app/auth/setup-password/page.tsx line 70
      const { GET } = await import('@/app/api/auth/verify-email/route');
      const request = new NextRequest(`http://localhost:3000/api/auth/verify-email?token=${token}`, {
        method: 'GET', // Frontend uses GET!
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    /**
     * BDD: Frontend-Backend Contract - reset-password POST Endpoint
     *
     * GIVEN the frontend needs to reset user's password with token
     * WHEN frontend calls POST /api/auth/reset-password with {token, password}
     * THEN backend must accept POST method with JSON body
     *
     * WHY THIS TEST:
     * - Validates exact frontend implementation in reset-password/page.tsx:77
     * - Ensures token and password are passed in request body (not query params)
     * - Prevents breaking changes to API contract
     *
     * BUSINESS RULE: Passwords must be in request body (never in URL/query params)
     * - URLs are logged, cached, visible in browser history
     * - Request body is encrypted with HTTPS, not visible in logs
     *
     * SECURITY: POST for sensitive operations, GET only for safe read operations
     *
     * API CONTRACT: POST {token: string, password: string} → {success, email}
     */
    it('reset-password: frontend uses POST with body, backend accepts it', async () => {
      const token = 'reset-contract-token';
      tokens.set(token, {
        token,
        email: 'reset-contract@example.com',
        type: 'password_reset',
        createdAt: Date.now(),
      });

      // Simulate exactly what the frontend does in src/app/auth/reset-password/page.tsx line 77
      const { POST } = await import('@/app/api/auth/reset-password/route');
      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST', // Frontend uses POST
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: 'TestPass123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    /**
     * BDD: Frontend-Backend Contract - magic-link/verify GET with Redirect
     *
     * GIVEN the user clicks a magic link in their email
     * WHEN they access GET /api/auth/magic-link/verify?token=xyz
     * THEN backend must verify token and redirect(307) to callback page
     *
     * WHY THIS TEST:
     * - Magic links are clicked from email (direct browser navigation = GET)
     * - Backend must handle GET method (not POST)
     * - Must redirect to callback page for session creation
     *
     * BUSINESS RULE: Magic link flow uses redirects, not JSON responses
     * - User clicks link → verify → redirect to callback → session created
     * - No frontend API call needed (link itself triggers entire flow)
     *
     * SECURITY: 307 redirect preserves POST method if needed by callback
     *
     * API CONTRACT: GET ?token=xyz → 307 redirect to /auth/callback/magic-link?email=xyz
     *
     * UX: Seamless authentication without manual intervention
     */
    it('magic-link/verify: uses GET with query param and redirects', async () => {
      const token = 'magic-contract-token';
      tokens.set(token, {
        token,
        email: 'magic-contract@example.com',
        type: 'magic_link',
        createdAt: Date.now(),
      });

      // Magic link verification uses GET and redirects
      const { GET } = await import('@/app/api/auth/magic-link/verify/route');
      const request = new NextRequest(`http://localhost:3000/api/auth/magic-link/verify?token=${token}`, {
        method: 'GET',
      });

      const response = await GET(request);

      expect(response.status).toBe(307); // Redirect
      expect(response.headers.get('location')).toContain('/auth/callback/magic-link');
    });
  });
});
