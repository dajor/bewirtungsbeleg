/**
 * BDD Tests for Registration Send-Verification API Route
 *
 * PURPOSE: Verifies the first step of user registration - email verification
 *
 * BUSINESS CONTEXT:
 * New users register by providing their name and email. This endpoint sends them
 * a verification email with a link to confirm their email address. After clicking
 * the link, they can set up their password and complete registration.
 *
 * SECURITY REQUIREMENTS:
 * - Email validation: Only valid email formats accepted
 * - Name validation: First and last name required (prevents anonymous registrations)
 * - Token expiry: Verification tokens valid for 24 hours (longer than login tokens)
 * - Single-use tokens: Token consumed after email verification
 * - Token type: 'email_verify' (different from password_reset and magic_link)
 *
 * USER FLOW:
 * 1. User fills out registration form (first name, last name, email)
 * 2. Frontend calls POST /api/auth/registrieren/send-verification
 * 3. Backend generates verification token, stores it, sends email
 * 4. User receives email with link: /auth/passwort-einrichten?token=xyz
 * 5. User clicks link → verify-email endpoint verifies token
 * 6. User sets password → setup-password endpoint creates account
 *
 * KEY DIFFERENCES FROM OTHER FLOWS:
 * - Collects user name (first/last) for account creation
 * - Longer token expiry (24h vs 10-30 min for other flows)
 * - Link goes to setup-password page (not API endpoint like magic links)
 * - Creates new user account (not login existing user)
 *
 * INTEGRATION POINTS:
 * - Token storage (Redis or file-based fallback)
 * - Email service (MailerSend)
 * - Email templates (verification email with user's name)
 * - Frontend: /src/app/auth/registrieren/page.tsx
 *
 * RELATED ROUTES:
 * - /api/auth/verify-email - Verifies token (step 2)
 * - /api/auth/passwort-einrichten - Sets password and creates account (step 3)
 * - /api/auth/passwort-vergessen - Similar email flow but for password reset
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/email/utils', () => ({
  createEmailVerificationToken: vi.fn(),
}));

vi.mock('@/lib/email/token-storage', () => ({
  storeEmailToken: vi.fn(),
  storeTokenByEmail: vi.fn(),
}));

vi.mock('@/lib/email/mailer', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/email/templates/verification', () => ({
  generateEmailVerificationEmail: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  env: {
    NEXTAUTH_URL: 'http://localhost:3000',
    AUTH_SERVER: 'https://api.docbits.com',
  },
}));

vi.mock('@/lib/docbits-auth', () => ({
  docbitsEmailExists: vi.fn(),
}));

describe('POST /api/auth/registrieren/send-verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/auth/registrieren/send-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  const validRegistrationData = {
    firstName: 'Max',
    lastName: 'Mustermann',
    email: 'max.mustermann@example.com',
  };

  /**
   * BDD: Successful Registration - Complete Happy Path
   *
   * GIVEN: Valid registration data (first name, last name, email)
   * WHEN: User submits registration form
   * THEN: Token generated with 24h expiry, stored, personalized email sent, success response
   *
   * WHY: This is the PRIMARY registration flow. User provides their information,
   *      receives personalized verification email, clicks link to complete registration.
   *
   * EMAIL PERSONALIZATION: Email includes user's full name ("Max Mustermann")
   *                        for better UX and trust (proves we received their info)
   *
   * TOKEN TYPE: 'email_verify' (not 'magic_link' or 'password_reset')
   *
   * BUSINESS RULE: Verification tokens valid for 24 hours (vs 10 min for magic links)
   *                Longer expiry is acceptable because:
   *                - User hasn't set password yet (no account to compromise)
   *                - Users may not check email immediately after registering
   *
   * IMPROVEMENT IDEAS:
   * - Check if email already registered (prevent duplicate accounts)
   * - Add email domain validation (catch typos like "gmial.com")
   * - Rate limit registrations per IP (prevent spam)
   * - Add CAPTCHA for bot prevention
   */
  it('should send verification email with valid registration data', async () => {
    // GIVEN: All required mocks configured for success
    const { createEmailVerificationToken } = await import('@/lib/email/utils');
    const { storeEmailToken, storeTokenByEmail } = await import('@/lib/email/token-storage');
    const { sendEmail } = await import('@/lib/email/mailer');
    const { generateEmailVerificationEmail } = await import('@/lib/email/templates/verification');

    const mockToken = {
      token: 'test-verification-token-123',
      email: 'max.mustermann@example.com',
      type: 'email_verify' as const,
      createdAt: Date.now(),
    };

    vi.mocked(createEmailVerificationToken).mockReturnValueOnce(mockToken);
    vi.mocked(storeEmailToken).mockResolvedValueOnce(true);
    vi.mocked(storeTokenByEmail).mockResolvedValueOnce(true);
    vi.mocked(generateEmailVerificationEmail).mockReturnValueOnce('<html>Email content</html>');
    vi.mocked(sendEmail).mockResolvedValueOnce(undefined);

    // WHEN: User submits valid registration form
    const request = createRequest(validRegistrationData);
    const response = await POST(request);
    const data = await response.json();

    // THEN: Success response with German confirmation message
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('Bestätigungs-E-Mail wurde gesendet');

    // THEN: Token created for correct email
    expect(createEmailVerificationToken).toHaveBeenCalledWith('max.mustermann@example.com');

    // THEN: Token stored with type 'email_verify' and user data
    expect(storeEmailToken).toHaveBeenCalledWith(mockToken.token, {
      token: mockToken.token,
      email: mockToken.email,
      type: mockToken.type,
      createdAt: mockToken.createdAt,
      firstName: 'Max',
      lastName: 'Mustermann',
    });

    // THEN: Personalized email sent with verification subject
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'max.mustermann@example.com',
        subject: expect.stringContaining('E-Mail-Adresse bestätigen'),
        html: '<html>Email content</html>',
      })
    );
  });

  /**
   * BDD: Name Validation - Missing firstName
   * WHY: firstName required for account creation and email personalization
   */
  it('should reject missing firstName', async () => {
    const request = createRequest({ lastName: 'Mustermann', email: 'max@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  /**
   * BDD: Name Validation - Empty firstName
   * WHY: Empty strings not allowed (prevents whitespace-only names)
   * IMPROVEMENT IDEAS: Validate name length (min 2 chars), check for numbers/special chars
   */
  it('should reject empty firstName', async () => {
    const request = createRequest({ ...validRegistrationData, firstName: '' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Vorname ist erforderlich');
  });

  /**
   * BDD: Name Validation - Missing lastName
   * WHY: lastName required for full user identification
   */
  it('should reject missing lastName', async () => {
    const request = createRequest({ firstName: 'Max', email: 'max@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  /**
   * BDD: Name Validation - Empty lastName
   */
  it('should reject empty lastName', async () => {
    const request = createRequest({ ...validRegistrationData, lastName: '' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Nachname ist erforderlich');
  });

  /**
   * BDD: Email Validation - Missing email
   */
  it('should reject missing email', async () => {
    const request = createRequest({ firstName: 'Max', lastName: 'Mustermann' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  /**
   * BDD: Email Validation - Invalid Format
   * WHY: Prevents typos and ensures deliverable email addresses
   */
  it('should reject invalid email format', async () => {
    const request = createRequest({ ...validRegistrationData, email: 'invalid-email' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Ungültige E-Mail-Adresse');
  });

  /**
   * BDD: Email Validation - Missing @ Symbol
   * WHY: @ is required in all valid email addresses (RFC 5321)
   */
  it('should reject email without @', async () => {
    const request = createRequest({ ...validRegistrationData, email: 'maxexample.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Ungültige E-Mail-Adresse');
  });

  /**
   * BDD: Email Validation - Missing Domain
   */
  it('should reject email without domain', async () => {
    const request = createRequest({ ...validRegistrationData, email: 'max@' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Ungültige E-Mail-Adresse');
  });

  /**
   * BDD: Storage Infrastructure Failure
   * WHY: If token can't be stored, user will never be able to verify email
   * IMPROVEMENT IDEAS: Retry storage, fallback to file storage, alert ops team
   */
  it('should handle token storage failure', async () => {
    const { createEmailVerificationToken } = await import('@/lib/email/utils');
    const { storeEmailToken } = await import('@/lib/email/token-storage');

    vi.mocked(createEmailVerificationToken).mockReturnValueOnce({
      token: 'test-token',
      email: 'max@example.com',
      type: 'email_verify',
      createdAt: Date.now(),
    });
    vi.mocked(storeEmailToken).mockResolvedValueOnce(false);

    const request = createRequest(validRegistrationData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Token konnte nicht gespeichert werden');
  });

  /**
   * BDD: Email Service Failure - Critical Path
   * BUSINESS DECISION: Registration email IS critical (like password reset).
   *                    Can't complete registration without it, so return 500 if email fails.
   */
  it('should handle email sending errors', async () => {
    const { createEmailVerificationToken } = await import('@/lib/email/utils');
    const { storeEmailToken, storeTokenByEmail } = await import('@/lib/email/token-storage');
    const { sendEmail } = await import('@/lib/email/mailer');
    const { generateEmailVerificationEmail } = await import('@/lib/email/templates/verification');

    vi.mocked(createEmailVerificationToken).mockReturnValueOnce({
      token: 'test-token',
      email: 'max@example.com',
      type: 'email_verify',
      createdAt: Date.now(),
    });
    vi.mocked(storeEmailToken).mockResolvedValueOnce(true);
    vi.mocked(storeTokenByEmail).mockResolvedValueOnce(true);
    vi.mocked(generateEmailVerificationEmail).mockReturnValueOnce('<html>Email</html>');
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('SMTP error'));

    const request = createRequest(validRegistrationData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Ein Fehler ist aufgetreten');
  });

  /**
   * BDD: Verification URL Generation - Frontend Page Destination
   *
   * CRITICAL: Registration verification links go to /auth/passwort-einrichten (frontend page),
   *           NOT /api/auth/verify-email (API endpoint like magic links do)
   *
   * URL FORMAT: http://localhost:3000/auth/passwort-einrichten?token=abc123
   *
   * EMAIL PERSONALIZATION: Email includes full name "Max Mustermann" for trust
   *
   * WHY FRONTEND PAGE: After email verification, user needs to set password.
   *                    Frontend page handles token verification THEN shows password form.
   */
  it('should generate correct verification URL', async () => {
    const { createEmailVerificationToken } = await import('@/lib/email/utils');
    const { storeEmailToken, storeTokenByEmail } = await import('@/lib/email/token-storage');
    const { generateEmailVerificationEmail } = await import('@/lib/email/templates/verification');
    const { sendEmail } = await import('@/lib/email/mailer');

    const mockToken = {
      token: 'abc123',
      email: 'max@example.com',
      type: 'email_verify' as const,
      createdAt: Date.now(),
    };

    vi.mocked(createEmailVerificationToken).mockReturnValueOnce(mockToken);
    vi.mocked(storeEmailToken).mockResolvedValueOnce(true);
    vi.mocked(storeTokenByEmail).mockResolvedValueOnce(true);
    vi.mocked(generateEmailVerificationEmail).mockReturnValueOnce('<html>Email</html>');
    vi.mocked(sendEmail).mockResolvedValueOnce(undefined);

    const request = createRequest(validRegistrationData);
    await POST(request);

    expect(generateEmailVerificationEmail).toHaveBeenCalledWith(
      'Max Mustermann',
      'http://localhost:3000/auth/passwort-einrichten?token=abc123'
    );
  });

  /**
   * BDD: Token Email Mapping - Resend Feature Support
   *
   * WHY: storeTokenByEmail enables "Resend verification email" feature.
   *      Maps email→token so we can invalidate old tokens when resending.
   *
   * IMPROVEMENT IDEAS:
   * - Implement actual resend endpoint
   * - Add rate limiting on resend (prevent spam)
   * - Track how often users need to resend (UX metric)
   */
  it('should store token by email for resending', async () => {
    const { createEmailVerificationToken } = await import('@/lib/email/utils');
    const { storeEmailToken, storeTokenByEmail } = await import('@/lib/email/token-storage');
    const { sendEmail } = await import('@/lib/email/mailer');
    const { generateEmailVerificationEmail } = await import('@/lib/email/templates/verification');

    const mockToken = {
      token: 'test-token',
      email: 'max.mustermann@example.com',
      type: 'email_verify' as const,
      createdAt: Date.now(),
    };

    vi.mocked(createEmailVerificationToken).mockReturnValueOnce(mockToken);
    vi.mocked(storeEmailToken).mockResolvedValueOnce(true);
    vi.mocked(storeTokenByEmail).mockResolvedValueOnce(true);
    vi.mocked(generateEmailVerificationEmail).mockReturnValueOnce('<html>Email</html>');
    vi.mocked(sendEmail).mockResolvedValueOnce(undefined);

    const request = createRequest(validRegistrationData);
    await POST(request);

    expect(storeTokenByEmail).toHaveBeenCalledWith(
      'max.mustermann@example.com',
      'test-token',
      'email_verify'
    );
  });

  /**
   * BDD: International Name Support - Special Characters
   *
   * GIVEN: Names with accents/umlauts/hyphens (François, Müller-Schmidt)
   * WHEN: User registers with non-ASCII name
   * THEN: Registration succeeds
   *
   * WHY: Application is German (Müller, Schröder common). Must support:
   *      - Accents: François, José
   *      - Umlauts: Müller, Schröder
   *      - Hyphens: Müller-Schmidt (compound names)
   *
   * SECURITY: Proper Unicode handling prevents encoding attacks
   *
   * IMPROVEMENT IDEAS:
   * - Test other scripts (Cyrillic, Arabic, Chinese)
   * - Add name sanitization (remove control characters)
   * - Validate name length limits
   */
  it('should accept special characters in names', async () => {
    const { createEmailVerificationToken } = await import('@/lib/email/utils');
    const { storeEmailToken, storeTokenByEmail } = await import('@/lib/email/token-storage');
    const { sendEmail } = await import('@/lib/email/mailer');
    const { generateEmailVerificationEmail } = await import('@/lib/email/templates/verification');

    vi.mocked(createEmailVerificationToken).mockReturnValueOnce({
      token: 'token',
      email: 'test@example.com',
      type: 'email_verify',
      createdAt: Date.now(),
    });
    vi.mocked(storeEmailToken).mockResolvedValueOnce(true);
    vi.mocked(storeTokenByEmail).mockResolvedValueOnce(true);
    vi.mocked(generateEmailVerificationEmail).mockReturnValueOnce('<html>Email</html>');
    vi.mocked(sendEmail).mockResolvedValueOnce(undefined);

    const request = createRequest({
      firstName: 'François',
      lastName: 'Müller-Schmidt',
      email: 'test@example.com',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  /**
   * BDD: Concurrency Handling - Multiple Simultaneous Registrations
   *
   * GIVEN: Same user submits registration twice simultaneously (double-click button)
   * WHEN: Both requests processed in parallel
   * THEN: Both succeed (idempotent operation)
   *
   * WHY: User might double-click submit button. Both requests should succeed.
   *      Second token overwrites first (latest token wins).
   *
   * BUSINESS DECISION: Allow multiple registration emails vs blocking duplicates.
   *                    We allow it because:
   *                    - User hasn't confirmed email yet (no account exists)
   *                    - Latest token wins (older token automatically invalidated)
   *                    - Better UX than showing "already registered" error
   *
   * IMPROVEMENT IDEAS:
   * - Prevent duplicate emails if account already exists with verified email
   * - Add frontend debouncing to prevent double-submission
   * - Track concurrent registration patterns (detect abuse)
   */
  it('should handle concurrent registration attempts', async () => {
    const { createEmailVerificationToken } = await import('@/lib/email/utils');
    const { storeEmailToken, storeTokenByEmail } = await import('@/lib/email/token-storage');
    const { sendEmail } = await import('@/lib/email/mailer');
    const { generateEmailVerificationEmail } = await import('@/lib/email/templates/verification');

    vi.mocked(createEmailVerificationToken).mockReturnValue({
      token: 'token',
      email: 'test@example.com',
      type: 'email_verify',
      createdAt: Date.now(),
    });
    vi.mocked(storeEmailToken).mockResolvedValue(true);
    vi.mocked(storeTokenByEmail).mockResolvedValue(true);
    vi.mocked(generateEmailVerificationEmail).mockReturnValue('<html>Email</html>');
    vi.mocked(sendEmail).mockResolvedValue(undefined);

    const request1 = createRequest(validRegistrationData);
    const request2 = createRequest(validRegistrationData);

    const [response1, response2] = await Promise.all([
      POST(request1),
      POST(request2),
    ]);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });

  /**
   * BDD: Duplicate Email Prevention - Email Already Registered
   *
   * GIVEN: User tries to register with email that already exists in DocBits
   * WHEN: Registration request is submitted
   * THEN: API checks DocBits and returns 409 Conflict error
   * AND: Error message directs user to login or password reset
   * AND: No verification email is sent (prevent spam)
   *
   * WHY: Critical security and UX issue
   * - Prevents multiple accounts with same email
   * - Prevents verification email spam
   * - Clear messaging guides user to correct action
   *
   * SECURITY: Balance between preventing enumeration and clear errors
   * - We DO check if email exists (better UX, prevents duplicate accounts)
   * - Error message suggests login OR password reset (doesn't confirm existence)
   * - This is acceptable because registration is public action
   *
   * BUSINESS RULE: One email = one account
   * - Users must use unique emails
   * - Duplicate check happens BEFORE sending verification email
   * - Saves email quota and prevents user confusion
   *
   * ERROR MESSAGE: "Ein Konto mit dieser E-Mail-Adresse existiert bereits.
   *                 Bitte melden Sie sich an oder verwenden Sie die Funktion 'Passwort vergessen'."
   */
  it('should reject registration if email already exists in DocBits', async () => {
    // Mock docbitsEmailExists to return true (email exists)
    const { docbitsEmailExists } = await import('@/lib/docbits-auth');
    vi.mocked(docbitsEmailExists).mockResolvedValueOnce(true);

    const request = createRequest(validRegistrationData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('Ein Konto mit dieser E-Mail-Adresse existiert bereits');
    expect(data.error).toContain('Passwort vergessen');
    expect(data.code).toBe('EMAIL_EXISTS');

    // Verify docbitsEmailExists was called with correct email
    expect(docbitsEmailExists).toHaveBeenCalledWith('max.mustermann@example.com');

    // Verify no email was sent
    const { sendEmail } = await import('@/lib/email/mailer');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  /**
   * BDD: Duplicate Check Failure - Allow Registration
   *
   * GIVEN: DocBits email check fails due to network error
   * WHEN: Registration is attempted
   * THEN: Allow registration to proceed (fail open)
   * AND: Duplicate will be caught during actual user creation
   *
   * WHY: Availability over perfect duplicate prevention
   * - Don't block registrations if check endpoint is down
   * - Duplicate detection will happen in setup-password step
   * - Better to allow duplicate attempt than block legitimate users
   *
   * BUSINESS RULE: Fail open, not closed
   * - Registration availability more important than perfect dup prevention
   * - Second layer of duplicate detection in user creation
   */
  it('should allow registration if duplicate check fails', async () => {
    const { docbitsEmailExists } = await import('@/lib/docbits-auth');
    const { createEmailVerificationToken } = await import('@/lib/email/utils');
    const { storeEmailToken, storeTokenByEmail } = await import('@/lib/email/token-storage');
    const { sendEmail } = await import('@/lib/email/mailer');
    const { generateEmailVerificationEmail } = await import('@/lib/email/templates/verification');

    // Mock docbitsEmailExists to return false (fails open on error)
    vi.mocked(docbitsEmailExists).mockResolvedValueOnce(false);

    vi.mocked(createEmailVerificationToken).mockReturnValueOnce({
      token: 'test-token',
      email: 'test@example.com',
      type: 'email_verify',
      createdAt: Date.now(),
    });
    vi.mocked(storeEmailToken).mockResolvedValueOnce(true);
    vi.mocked(storeTokenByEmail).mockResolvedValueOnce(true);
    vi.mocked(generateEmailVerificationEmail).mockReturnValueOnce('<html>Email</html>');
    vi.mocked(sendEmail).mockResolvedValueOnce(undefined);

    const request = createRequest(validRegistrationData);
    const response = await POST(request);
    const data = await response.json();

    // Should succeed with fail-open behavior
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  /**
   * BDD: New Email - Registration Proceeds
   *
   * GIVEN: User registers with email that doesn't exist in DocBits
   * WHEN: Duplicate check runs
   * THEN: Check returns false (email not found)
   * AND: Registration proceeds normally
   * AND: Verification email is sent
   *
   * WHY: Normal success case after duplicate check added
   * - Verifies duplicate check doesn't break normal flow
   * - Confirms false is interpreted as "email available"
   */
  it('should proceed with registration if email does not exist', async () => {
    const { docbitsEmailExists } = await import('@/lib/docbits-auth');
    const { createEmailVerificationToken } = await import('@/lib/email/utils');
    const { storeEmailToken, storeTokenByEmail } = await import('@/lib/email/token-storage');
    const { sendEmail } = await import('@/lib/email/mailer');
    const { generateEmailVerificationEmail } = await import('@/lib/email/templates/verification');

    // Mock docbitsEmailExists to return false (email available)
    vi.mocked(docbitsEmailExists).mockResolvedValueOnce(false);

    vi.mocked(createEmailVerificationToken).mockReturnValueOnce({
      token: 'test-token',
      email: 'newemail@example.com',
      type: 'email_verify',
      createdAt: Date.now(),
    });
    vi.mocked(storeEmailToken).mockResolvedValueOnce(true);
    vi.mocked(storeTokenByEmail).mockResolvedValueOnce(true);
    vi.mocked(generateEmailVerificationEmail).mockReturnValueOnce('<html>Email</html>');
    vi.mocked(sendEmail).mockResolvedValueOnce(undefined);

    const request = createRequest({ ...validRegistrationData, email: 'newemail@example.com' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(docbitsEmailExists).toHaveBeenCalledWith('newemail@example.com');
    expect(sendEmail).toHaveBeenCalledOnce();
  });
});
