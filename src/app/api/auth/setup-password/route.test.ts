/**
 * BDD Tests for Setup Password API Route
 *
 * PURPOSE: Completes user registration by setting password after email verification
 *
 * BUSINESS CONTEXT:
 * This is the FINAL step of registration. After user clicks verification link from email,
 * they land on setup-password page where they create their password. This endpoint
 * validates the token, creates the user account, and stores their hashed password.
 *
 * SECURITY REQUIREMENTS:
 * - Token validation: Only 'email_verify' tokens accepted (not password_reset or magic_link)
 * - Token expiry: 24 hours (same as registration email)
 * - Single-use tokens: Token consumed after use
 * - Password strength: Minimum 8 characters
 * - Password hashing: Passwords are hashed before storage (TODO: implement in production)
 *
 * USER FLOW:
 * 1. User receives registration email with verification link
 * 2. User clicks link → lands on /auth/setup-password?token=xyz
 * 3. Frontend calls verify-email endpoint to validate token
 * 4. Frontend shows password form if token valid
 * 5. User enters password and submits
 * 6. Frontend calls POST /api/auth/setup-password with token + password
 * 7. Backend verifies token, creates user account, stores password
 * 8. User can now log in with email + password
 *
 * KEY DIFFERENCES FROM PASSWORD RESET:
 * - Creates NEW user account (not updating existing account)
 * - Token type: 'email_verify' (not 'password_reset')
 * - Longer token expiry: 24 hours (vs 30 minutes for password reset)
 * - No confirmation email sent (user knows they just set password)
 *
 * INTEGRATION POINTS:
 * - Token storage (Redis or file-based fallback)
 * - User database (TODO: implement actual user creation at line 63-65)
 * - Frontend: /src/app/auth/setup-password/page.tsx
 *
 * RELATED ROUTES:
 * - /api/auth/register/send-verification - Sends verification email (step 1)
 * - /api/auth/verify-email - Verifies token before showing password form (step 2)
 * - /api/auth/reset-password - Similar but updates password for existing user
 *
 * TODO IN PRODUCTION:
 * - Line 63-65: Implement actual user creation in database
 * - Add password hashing (bcrypt/argon2)
 * - Add email to verified users table
 * - Create initial user session
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import type { EmailToken } from '@/lib/email/utils';

// Mock dependencies
vi.mock('@/lib/email/token-storage', () => ({
  verifyAndConsumeToken: vi.fn(),
  deleteTokenByEmail: vi.fn(),
}));

vi.mock('@/lib/docbits-auth', () => ({
  docbitsRegister: vi.fn(),
  DocBitsAuthError: class extends Error {
    constructor(message: string, public statusCode?: number, public code?: string) {
      super(message);
      this.name = 'DocBitsAuthError';
    }
  },
}));

describe('POST /api/auth/setup-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/auth/setup-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  const createValidToken = (overrides?: Partial<EmailToken>): any => {
    return {
      token: 'test-token-123',
      email: 'user@example.com',
      createdAt: Date.now(),
      type: 'email_verify',
      firstName: 'Test',
      lastName: 'User',
      ...overrides,
    };
  };

  /**
   * BDD: Successful Account Creation - Registration Completion
   *
   * GIVEN: Valid email_verify token and password meeting strength requirements
   * WHEN: User sets password after email verification
   * THEN: Account created, token consumed, success response with email
   *
   * WHY: This COMPLETES the registration flow. User has:
   *      1. Submitted registration form (name + email)
   *      2. Received verification email
   *      3. Clicked verification link
   *      4. Now setting password to finalize account
   *
   * BUSINESS RULE: 24-hour token expiry for email_verify tokens
   *
   * TODO: Currently returns success but doesn't actually create user in database (line 63-65).
   *       In production, this endpoint should:
   *       - Hash password (bcrypt/argon2)
   *       - Create user record in database
   *       - Mark email as verified
   *       - Create initial session
   *
   * IMPROVEMENT IDEAS:
   * - Implement actual user creation in database
   * - Add password hashing before storage
   * - Send welcome email after account creation
   * - Automatically log user in after password setup
   * - Add password strength indicator in frontend
   */
  it('should setup password with valid token and password', async () => {
    // GIVEN: Valid email_verify token
    const { verifyAndConsumeToken, deleteTokenByEmail } = await import('@/lib/email/token-storage');
    const { docbitsRegister } = await import('@/lib/docbits-auth');

    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(createValidToken());
    vi.mocked(deleteTokenByEmail).mockResolvedValueOnce(true);
    vi.mocked(docbitsRegister).mockResolvedValueOnce({
      user_id: 'user-123',
      email: 'user@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
    });

    // WHEN: User sets password
    const request = createRequest({
      token: 'test-token-123',
      password: 'SecurePass123',
    });
    const response = await POST(request);
    const data = await response.json();

    // THEN: Account created successfully
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.email).toBe('user@example.com');
    expect(data.message).toContain('erfolgreich erstellt');
  });

  /** BDD: Input Validation - Missing token */
  it('should reject missing token', async () => {
    const request = createRequest({ password: 'SecurePass123' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  /** BDD: Input Validation - Empty token string */
  it('should reject empty token', async () => {
    const request = createRequest({ token: '', password: 'SecurePass123' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Token ist erforderlich');
  });

  /** BDD: Input Validation - Missing password */
  it('should reject missing password', async () => {
    const request = createRequest({ token: 'test-token-123' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  /**
   * BDD: Password Strength - Minimum Length Enforcement
   * BUSINESS RULE: 8-character minimum for all passwords
   */
  it('should reject password shorter than 8 characters', async () => {
    const request = createRequest({ token: 'test-token', password: 'Short1' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('mindestens 8 Zeichen');
  });

  /**
   * BDD: Token Validation - Invalid/Consumed Token
   * WHY: Prevents account creation with invalid or already-used tokens
   */
  it('should reject invalid token', async () => {
    const { verifyAndConsumeToken } = await import('@/lib/email/token-storage');
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(null);

    const request = createRequest({ token: 'invalid-token', password: 'SecurePass123' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Ungültiger oder abgelaufener Token');
  });

  /**
   * BDD: Token Type Validation - Registration vs Reset
   * CRITICAL: Only email_verify tokens work here (not password_reset or magic_link)
   * WHY: setup-password creates NEW account, reset-password updates EXISTING account
   */
  it('should reject wrong token type', async () => {
    const { verifyAndConsumeToken } = await import('@/lib/email/token-storage');
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(
      createValidToken({ type: 'password_reset' })
    );

    const request = createRequest({ token: 'test-token', password: 'SecurePass123' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Falscher Token-Typ');
  });

  /**
   * BDD: Token Expiration - 24 Hour Window
   * BUSINESS RULE: email_verify tokens expire after 24 hours
   * WHY: Longer than login tokens (10 min) because users may not check email immediately
   */
  it('should reject expired token', async () => {
    const { verifyAndConsumeToken } = await import('@/lib/email/token-storage');
    const expiredTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(
      createValidToken({ createdAt: expiredTime })
    );

    const request = createRequest({ token: 'expired-token', password: 'SecurePass123' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('abgelaufen');
  });

  /**
   * BDD: Single-Use Token Enforcement
   * SECURITY: Prevents token reuse attacks
   */
  it('should consume token (single-use)', async () => {
    const { verifyAndConsumeToken, deleteTokenByEmail } = await import('@/lib/email/token-storage');
    const { docbitsRegister } = await import('@/lib/docbits-auth');
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(createValidToken());
    vi.mocked(deleteTokenByEmail).mockResolvedValueOnce(true);
    vi.mocked(docbitsRegister).mockResolvedValueOnce({
      user_id: 'user-123',
      email: 'user@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
    });

    const request = createRequest({ token: 'test-token', password: 'SecurePass123' });
    await POST(request);

    expect(verifyAndConsumeToken).toHaveBeenCalledWith('test-token');
  });

  /**
   * BDD: Token Cleanup - Email-Based Invalidation
   * WHY: User may have requested multiple verification emails. Invalidate all after account creation.
   */
  it('should cleanup token by email', async () => {
    const { verifyAndConsumeToken, deleteTokenByEmail } = await import('@/lib/email/token-storage');
    const { docbitsRegister } = await import('@/lib/docbits-auth');
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(createValidToken());
    vi.mocked(deleteTokenByEmail).mockResolvedValueOnce(true);
    vi.mocked(docbitsRegister).mockResolvedValueOnce({
      user_id: 'user-123',
      email: 'user@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
    });

    const request = createRequest({ token: 'test-token', password: 'SecurePass123' });
    await POST(request);

    expect(deleteTokenByEmail).toHaveBeenCalledWith('user@example.com', 'email_verify');
  });

  /**
   * BDD: Error Handling - Storage Infrastructure Failure
   */
  it('should handle token consumption errors', async () => {
    const { verifyAndConsumeToken } = await import('@/lib/email/token-storage');
    vi.mocked(verifyAndConsumeToken).mockRejectedValueOnce(new Error('Storage error'));

    const request = createRequest({ token: 'test-token', password: 'SecurePass123' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Ein Fehler ist aufgetreten');
  });

  /**
   * BDD: Boundary Value - Fresh Token Acceptance
   * WHY: Validates tokens work well within 24-hour window
   */
  it('should accept fresh token', async () => {
    const { verifyAndConsumeToken, deleteTokenByEmail } = await import('@/lib/email/token-storage');
    const { docbitsRegister } = await import('@/lib/docbits-auth');
    const recentTime = Date.now() - (1 * 60 * 60 * 1000); // 1 hour ago
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(
      createValidToken({ createdAt: recentTime })
    );
    vi.mocked(deleteTokenByEmail).mockResolvedValueOnce(true);
    vi.mocked(docbitsRegister).mockResolvedValueOnce({
      user_id: 'user-123',
      email: 'user@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
    });

    const request = createRequest({ token: 'fresh-token', password: 'SecurePass123' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  /**
   * BDD: Password Complexity - Special Character Support
   *
   * GIVEN: Valid tokens with passwords containing special characters
   * WHEN: User sets password with symbols, numbers, mixed case
   * THEN: All passwords accepted (no complexity requirements beyond length)
   *
   * WHY: Our system only enforces 8-character minimum, not complexity.
   *      Users can choose simple or complex passwords (their choice).
   *
   * SECURITY NOTE: Tests @ ! $ # symbols work properly (no injection issues)
   *
   * IMPROVEMENT IDEAS:
   * - Consider enforcing complexity (uppercase + lowercase + number + symbol)
   * - Add password strength indicator in frontend
   * - Warn users about weak passwords but allow them
   */
  it('should accept complex passwords', async () => {
    const { verifyAndConsumeToken, deleteTokenByEmail } = await import('@/lib/email/token-storage');
    const { docbitsRegister } = await import('@/lib/docbits-auth');
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(createValidToken());
    vi.mocked(deleteTokenByEmail).mockResolvedValueOnce(true);
    vi.mocked(docbitsRegister).mockResolvedValueOnce({
      user_id: 'user-123',
      email: 'user@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
    });

    const complexPasswords = [
      'MyP@ssw0rd!',
      'Secure123$Password',
      'C0mpl3x!P@ss',
      'Test123Test!@#',
    ];

    for (const password of complexPasswords) {
      vi.clearAllMocks();
      vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(createValidToken());
      vi.mocked(deleteTokenByEmail).mockResolvedValueOnce(true);
      vi.mocked(docbitsRegister).mockResolvedValueOnce({
        user_id: 'user-123',
        email: 'user@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
      });

      const request = createRequest({
        token: 'test-token',
        password,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    }
  });

  /**
   * BDD: Boundary Value Testing - Minimum Password Length
   *
   * GIVEN: Valid token with password of exactly 8 characters (minimum)
   * WHEN: User sets password at boundary value
   * THEN: Password accepted (meets minimum requirement)
   *
   * WHY: Boundary value testing ensures validation logic works correctly at edges.
   *      Tests that ">= 8" logic works (not "> 8" which would reject 8-char passwords)
   *
   * BUSINESS RULE: 8 characters is industry-standard minimum for passwords
   *
   * IMPROVEMENT IDEAS:
   * - Test 7 characters fails (one below boundary)
   * - Test empty string fails
   * - Document why 8 characters (NIST recommendations)
   */
  it('should accept minimum length password', async () => {
    const { verifyAndConsumeToken, deleteTokenByEmail } = await import('@/lib/email/token-storage');
    const { docbitsRegister } = await import('@/lib/docbits-auth');
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(createValidToken());
    vi.mocked(deleteTokenByEmail).mockResolvedValueOnce(true);
    vi.mocked(docbitsRegister).mockResolvedValueOnce({
      user_id: 'user-123',
      email: 'user@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
    });

    const request = createRequest({
      token: 'test-token',
      password: '12345678', // Exactly 8 characters
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  /**
   * BDD: Password Length - No Upper Limit
   *
   * GIVEN: Valid token with very long password (47 characters)
   * WHEN: User sets long password (passphrase)
   * THEN: Password accepted without upper limit
   *
   * WHY: Modern password guidelines (NIST SP 800-63B) recommend allowing long passwords.
   *      Passphrases like "correct horse battery staple" are more secure and memorable.
   *      No reason to reject long passwords - storage impact is minimal.
   *
   * SECURITY: Longer passwords = more entropy = harder to crack
   *
   * IMPROVEMENT IDEAS:
   * - Test extremely long passwords (1000+ chars) to find reasonable upper limit
   * - Add upper limit only for DoS prevention (e.g., 128 characters max)
   * - Encourage passphrases in UI
   */
  it('should accept long passwords', async () => {
    const { verifyAndConsumeToken, deleteTokenByEmail } = await import('@/lib/email/token-storage');
    const { docbitsRegister } = await import('@/lib/docbits-auth');
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(createValidToken());
    vi.mocked(deleteTokenByEmail).mockResolvedValueOnce(true);
    vi.mocked(docbitsRegister).mockResolvedValueOnce({
      user_id: 'user-123',
      email: 'user@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
    });

    const request = createRequest({
      token: 'test-token',
      password: 'ThisIsAVeryLongPasswordWithManyCharacters123!@#',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  /**
   * BDD: Response Contract - Email Verification
   *
   * GIVEN: Successful password setup
   * WHEN: Account creation completes
   * THEN: Response includes email address from token
   *
   * WHY: Frontend needs email to:
   *      - Show confirmation message ("Account created for user@example.com")
   *      - Pre-fill login form
   *      - Track which account was created (analytics)
   *
   * SECURITY: Email comes from validated token, not user input
   *           (prevents user from claiming different email)
   *
   * IMPROVEMENT IDEAS:
   * - Return user ID when user management is implemented
   * - Return account creation timestamp
   * - Return next steps in response (e.g., "Please log in")
   */
  it('should return email from token in response', async () => {
    const { verifyAndConsumeToken, deleteTokenByEmail } = await import('@/lib/email/token-storage');
    const { docbitsRegister } = await import('@/lib/docbits-auth');
    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(createValidToken());
    vi.mocked(deleteTokenByEmail).mockResolvedValueOnce(true);
    vi.mocked(docbitsRegister).mockResolvedValueOnce({
      user_id: 'user-123',
      email: 'user@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
    });

    const request = createRequest({
      token: 'test-token',
      password: 'SecurePass123',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.email).toBe('user@example.com'); // Should return email from token
  });

  /**
   * BDD: DocBits User Creation - Success
   *
   * GIVEN: Valid token with firstName, lastName, email
   * WHEN: Password is set
   * THEN: User account is created in DocBits
   * AND: docbitsRegister() is called with correct parameters
   * AND: Success response includes email
   *
   * WHY: This is the actual account creation step
   * - Previous TODO is now implemented
   * - DocBits backend stores the user
   * - User can immediately login after this step
   *
   * BUSINESS RULE: Account created in DocBits = registration complete
   * - Token data (firstName, lastName) used for account
   * - Password from user input
   * - Email from validated token
   *
   * SECURITY: All data validated before reaching this point
   */
  it('should create user in DocBits with token data and password', async () => {
    const { verifyAndConsumeToken, deleteTokenByEmail } = await import('@/lib/email/token-storage');
    const { docbitsRegister } = await import('@/lib/docbits-auth');

    const tokenWithUserData = {
      token: 'test-token-123',
      email: 'user@example.com',
      createdAt: Date.now(),
      type: 'email_verify' as const,
      firstName: 'Max',
      lastName: 'Mustermann',
    };

    // Reset all mocks to ensure clean state
    vi.mocked(verifyAndConsumeToken).mockReset();
    vi.mocked(deleteTokenByEmail).mockReset();
    vi.mocked(docbitsRegister).mockReset();

    // Set up mocks for this test
    vi.mocked(verifyAndConsumeToken).mockResolvedValue(tokenWithUserData as any);
    vi.mocked(deleteTokenByEmail).mockResolvedValue(true);
    vi.mocked(docbitsRegister).mockResolvedValue({
      user_id: 'user-123',
      email: 'user@example.com',
      first_name: 'Max',
      last_name: 'Mustermann',
      role: 'user',
    });

    const request = createRequest({
      token: 'test-token',
      password: 'SecurePass123!',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.email).toBe('user@example.com');

    // Verify docbitsRegister was called with correct parameters
    expect(docbitsRegister).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'SecurePass123!',
      first_name: 'Max',
      last_name: 'Mustermann',
    });
  });

  /**
   * BDD: DocBits User Creation - Duplicate Email (409)
   *
   * GIVEN: User tries to complete registration with email that was just registered
   * WHEN: DocBits user creation is attempted
   * THEN: DocBits returns 409 Conflict (USER_EXISTS)
   * AND: API returns clear error message in German
   * AND: User is directed to login
   *
   * WHY: Race condition scenario
   * - Email check passed during send-verification
   * - But between verification and password setup, another user registered with same email
   * - OR user completed registration in another tab
   *
   * BUSINESS RULE: DocBits is source of truth
   * - Even if our check passes, DocBits final decision
   * - 409 from DocBits = definitive duplicate
   *
   * ERROR MESSAGE: "Ein Konto mit dieser E-Mail existiert bereits. Bitte melden Sie sich an."
   */
  it('should handle DocBits duplicate email error (409)', async () => {
    const { verifyAndConsumeToken, deleteTokenByEmail } = await import('@/lib/email/token-storage');
    const { docbitsRegister, DocBitsAuthError } = await import('@/lib/docbits-auth');

    const tokenWithUserData = {
      token: 'test-token-123',
      email: 'user@example.com',
      createdAt: Date.now(),
      type: 'email_verify' as const,
      firstName: 'Max',
      lastName: 'Mustermann',
    };

    // Mock DocBits returning 409 duplicate error
    const duplicateError = new DocBitsAuthError(
      'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits',
      409,
      'USER_EXISTS'
    );

    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(tokenWithUserData as any);
    vi.mocked(deleteTokenByEmail).mockResolvedValueOnce(true);
    // Reset the mock completely before setting up new behavior
    vi.mocked(docbitsRegister).mockReset();
    vi.mocked(docbitsRegister).mockRejectedValue(duplicateError);

    const request = createRequest({
      token: 'test-token',
      password: 'SecurePass123!',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('Ein Konto mit dieser E-Mail existiert bereits');
    expect(data.error).toContain('melden');
  });

  /**
   * BDD: DocBits User Creation - Server Error (500)
   *
   * GIVEN: DocBits API encounters internal error during user creation
   * WHEN: docbitsRegister() is called
   * THEN: Error is caught and returned as 500
   * AND: User sees generic error message in German
   * AND: User is instructed to try again
   *
   * WHY: External API can fail for many reasons
   * - Database issues
   * - Service outages
   * - Network problems
   *
   * SECURITY: Don't expose internal error details to user
   * - Show generic "try again" message
   * - Log actual error server-side for debugging
   *
   * BUSINESS RULE: Graceful degradation
   * - User can retry
   * - Token still valid (not consumed on error)
   */
  it('should handle DocBits server error during user creation', async () => {
    const { verifyAndConsumeToken, deleteTokenByEmail } = await import('@/lib/email/token-storage');
    const { docbitsRegister, DocBitsAuthError } = await import('@/lib/docbits-auth');

    const tokenWithUserData = {
      token: 'test-token-123',
      email: 'user@example.com',
      createdAt: Date.now(),
      type: 'email_verify' as const,
      firstName: 'Max',
      lastName: 'Mustermann',
    };

    // Mock DocBits returning 500 server error
    const serverError = new DocBitsAuthError(
      'Interner Serverfehler',
      500,
      'INTERNAL_ERROR'
    );

    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(tokenWithUserData as any);
    vi.mocked(deleteTokenByEmail).mockResolvedValueOnce(true);
    // Reset the mock completely before setting up new behavior
    vi.mocked(docbitsRegister).mockReset();
    vi.mocked(docbitsRegister).mockRejectedValue(serverError);

    const request = createRequest({
      token: 'test-token',
      password: 'SecurePass123!',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  /**
   * BDD: DocBits User Creation - Network Error
   *
   * GIVEN: Cannot reach DocBits API (network timeout, DNS failure, etc.)
   * WHEN: docbitsRegister() is called
   * THEN: Network error is caught
   * AND: User sees generic error message
   * AND: 500 status code returned
   *
   * WHY: Network calls can fail
   * - Internet connectivity issues
   * - DocBits server unreachable
   * - Firewall blocking requests
   *
   * BUSINESS RULE: Fail gracefully
   * - Show user-friendly error
   * - Don't crash
   * - Allow retry
   */
  it('should handle network error during DocBits user creation', async () => {
    const { verifyAndConsumeToken, deleteTokenByEmail } = await import('@/lib/email/token-storage');
    const { docbitsRegister } = await import('@/lib/docbits-auth');

    const tokenWithUserData = {
      token: 'test-token-123',
      email: 'user@example.com',
      createdAt: Date.now(),
      type: 'email_verify' as const,
      firstName: 'Max',
      lastName: 'Mustermann',
    };

    vi.mocked(verifyAndConsumeToken).mockResolvedValueOnce(tokenWithUserData as any);
    vi.mocked(deleteTokenByEmail).mockResolvedValueOnce(true);
    // Reset the mock completely before setting up new behavior
    vi.mocked(docbitsRegister).mockReset();
    vi.mocked(docbitsRegister).mockRejectedValue(new Error('Network error'));

    const request = createRequest({
      token: 'test-token',
      password: 'SecurePass123!',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Ein Fehler ist aufgetreten');
  });

  /**
   * BDD: Missing User Data in Token
   *
   * GIVEN: Token is missing firstName or lastName
   * WHEN: Password setup is attempted
   * THEN: Return 400 error with clear message
   * AND: Instruct user to register again
   *
   * WHY: Token data corruption or old token format
   * - Tokens created before firstName/lastName added
   * - Token storage corruption
   * - Migration issue
   *
   * BUSINESS RULE: firstName and lastName are required
   * - Cannot create DocBits user without them
   * - Better to fail fast with clear message
   */
  it('should reject token missing firstName or lastName', async () => {
    const { verifyAndConsumeToken, deleteTokenByEmail } = await import('@/lib/email/token-storage');
    const { docbitsRegister } = await import('@/lib/docbits-auth');

    // Token without user data - explicitly set to use "email_verify" type
    const incompleteToken = {
      token: 'test-token',
      email: 'user@example.com',
      type: 'email_verify' as const,
      createdAt: Date.now(),
      // Missing firstName and lastName
    };

    // Reset mocks to avoid interference from previous error tests
    vi.mocked(verifyAndConsumeToken).mockReset();
    vi.mocked(deleteTokenByEmail).mockReset();
    vi.mocked(docbitsRegister).mockReset();

    vi.mocked(verifyAndConsumeToken).mockResolvedValue(incompleteToken as any);
    vi.mocked(deleteTokenByEmail).mockResolvedValue(true);

    const request = createRequest({
      token: 'test-token',
      password: 'SecurePass123!',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Ungültige Token-Daten');
    expect(data.error).toContain('registrieren Sie sich erneut');
  });
});
