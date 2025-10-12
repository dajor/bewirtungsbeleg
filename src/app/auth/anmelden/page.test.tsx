/**
 * BDD: SignIn Page Component Tests
 *
 * PURPOSE: Test the signin page UI, form validation, and authentication flows
 *
 * BUSINESS CONTEXT:
 * The signin page is the primary entry point for users to access the application.
 * It must handle:
 * - Email/password authentication via DocBits OAuth2
 * - Magic link passwordless authentication
 * - Form validation (email format, password length)
 * - Error display (invalid credentials, network errors, DocBits API errors)
 * - User feedback (loading states, success/error messages)
 *
 * WHY THESE TESTS ARE CRITICAL:
 * - Login is the most used feature - any bugs block ALL users
 * - Error messages must be user-friendly and in German
 * - Form validation prevents unnecessary API calls
 * - Loading states provide feedback during slow network
 * - DocBits error scenarios must be handled gracefully
 *
 * PRODUCTION BUGS THESE TESTS CATCH:
 * 1. **Invalid Email Format**: Users enter invalid emails, should be caught before API call
 * 2. **Missing Credentials**: Empty fields should show validation errors
 * 3. **DocBits Auth Errors**: OAuth2 errors must be translated to German
 * 4. **Network Errors**: Timeout/connection errors must show user-friendly message
 * 5. **Missing Client Credentials**: Configuration errors must be clear
 *
 * BUSINESS RULES:
 * - Email is required and must be valid format
 * - Password is required and min 6 characters (for password mode)
 * - Magic link mode doesn't require password
 * - Successful login redirects to /bewirtungsbeleg or callback URL
 * - Failed login shows error message without page reload
 *
 * TEST STRATEGY:
 * - Unit tests: Test component behavior in isolation with mocks
 * - Integration tests: Already covered in auth-login.integration.test.ts
 * - Focus on UI interactions, form validation, error display
 * - Mock NextAuth signIn() and fetch() for API calls
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignInPage from './page';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('SignInPage', () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();
  const mockGet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (useSearchParams as any).mockReturnValue({
      get: mockGet,
    });
    mockGet.mockReturnValue(null); // Default: no callback URL
    global.fetch = vi.fn();
  });

  describe('Mode Switch', () => {
    it('should start in password mode by default', () => {
      render(<SignInPage />);

      expect(screen.getByLabelText('E-Mail')).toBeInTheDocument();
      expect(screen.getByLabelText('Passwort')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /anmelden/i })).toBeInTheDocument();
    });

    it('should switch to magic link mode and hide password field', () => {
      render(<SignInPage />);

      const magicLinkTab = screen.getByText('Magic Link').closest('button');
      fireEvent.click(magicLinkTab!);

      expect(screen.getByLabelText('E-Mail')).toBeInTheDocument();
      expect(screen.queryByLabelText('Passwort')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /magic link senden/i })).toBeInTheDocument();
    });

    it('should switch back to password mode', () => {
      render(<SignInPage />);

      const magicLinkTab = screen.getByText('Magic Link').closest('button');
      fireEvent.click(magicLinkTab!);

      const passwordTab = screen.getByText('Passwort').closest('button');
      fireEvent.click(passwordTab!);

      expect(screen.getByLabelText('Passwort')).toBeInTheDocument();
    });

    it('should clear errors when switching modes', () => {
      render(<SignInPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: /anmelden/i });

      // Trigger validation error
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      // Switch to magic link mode
      const magicLinkTab = screen.getByText('Magic Link').closest('button');
      fireEvent.click(magicLinkTab!);

      // Error should be cleared
      expect(screen.queryByText(/ungültige e-mail/i)).not.toBeInTheDocument();
    });
  });

  describe('Password Mode', () => {
    it('should validate required email field', async () => {
      render(<SignInPage />);

      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/e-mail ist erforderlich/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      render(<SignInPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/ungültige e-mail-adresse/i)).toBeInTheDocument();
      });
    });

    it('should validate required password field', async () => {
      render(<SignInPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwort ist erforderlich/i)).toBeInTheDocument();
      });
    });

    it('should validate minimum password length', async () => {
      render(<SignInPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '12345' } });

      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/mindestens 6 zeichen/i)).toBeInTheDocument();
      });
    });

    it('should submit valid credentials and redirect on success', async () => {
      (signIn as any).mockResolvedValueOnce({ ok: true, error: null });

      render(<SignInPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password123',
          redirect: false,
        });
        expect(mockPush).toHaveBeenCalledWith('/bewirtungsbeleg');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should display error message on failed login', async () => {
      (signIn as any).mockResolvedValueOnce({
        ok: false,
        error: 'Ungültige Anmeldedaten',
      });

      render(<SignInPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/ungültige anmeldedaten/i)).toBeInTheDocument();
      });
    });

    it('should use custom callback URL from search params', async () => {
      mockGet.mockReturnValue('/custom-page');
      (signIn as any).mockResolvedValueOnce({ ok: true, error: null });

      render(<SignInPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-page');
      });
    });

    it('should show remember me checkbox', () => {
      render(<SignInPage />);

      expect(screen.getByLabelText(/angemeldet bleiben/i)).toBeInTheDocument();
    });

    it('should show forgot password link', () => {
      render(<SignInPage />);

      const forgotPasswordLink = screen.getByText(/passwort vergessen/i);
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/auth/passwort-vergessen');
    });
  });

  describe('Magic Link Mode', () => {
    beforeEach(() => {
      render(<SignInPage />);
      const magicLinkTab = screen.getByText('Magic Link').closest('button');
      fireEvent.click(magicLinkTab!);
    });

    it('should not require password in magic link mode', async () => {
      const emailInput = screen.getByLabelText('E-Mail');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', { name: /magic link senden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/passwort ist erforderlich/i)).not.toBeInTheDocument();
      });
    });

    it('should send magic link successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'E-Mail gesendet' }),
      });

      const emailInput = screen.getByLabelText('E-Mail');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', { name: /magic link senden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/magic-link/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' }),
        });
      });
    });

    it('should show success alert after magic link sent', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const emailInput = screen.getByLabelText('E-Mail');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', { name: /magic link senden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/magic link gesendet/i)).toBeInTheDocument();
        expect(screen.getByText(/anmelde-link per e-mail gesendet/i)).toBeInTheDocument();
      });
    });

    it('should disable button after magic link sent', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const emailInput = screen.getByLabelText('E-Mail');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', { name: /magic link senden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should show error message on failed magic link send', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Rate limit exceeded' }),
      });

      const emailInput = screen.getByLabelText('E-Mail');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', { name: /magic link senden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
      });
    });
  });

  describe('UI Elements', () => {
    it('should display DocBits logo', () => {
      render(<SignInPage />);

      const logo = screen.getByAltText('DocBits');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/docbits.svg');
    });

    it('should display welcome message', () => {
      render(<SignInPage />);

      expect(screen.getByText(/willkommen zurück/i)).toBeInTheDocument();
    });

    it('should display register link', () => {
      render(<SignInPage />);

      const registerLink = screen.getByText(/jetzt registrieren/i);
      expect(registerLink).toBeInTheDocument();
      expect(registerLink.closest('a')).toHaveAttribute('href', '/auth/registrieren');
    });

    it('should show loading state during password login', async () => {
      (signIn as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<SignInPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      fireEvent.click(submitButton);

      // Button should show loading state
      expect(submitButton).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('Error Handling', () => {
    /**
     * BDD: Network Error Handling
     *
     * GIVEN DocBits API is unreachable (network timeout, server down, DNS failure)
     * WHEN user submits valid credentials
     * THEN show user-friendly German error message
     * AND user can retry without refreshing page
     *
     * WHY: External API calls can fail for many reasons
     * - Network connectivity issues
     * - DocBits server maintenance/downtime
     * - Firewall/proxy blocking requests
     *
     * BUSINESS RULE: Never show technical stack traces to users
     */
    it('should handle network errors gracefully', async () => {
      (signIn as any).mockRejectedValueOnce(new Error('Network error'));

      render(<SignInPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/ein fehler ist aufgetreten/i)).toBeInTheDocument();
      });
    });

    it('should allow closing error alert', async () => {
      (signIn as any).mockResolvedValueOnce({
        ok: false,
        error: 'Test error',
      });

      render(<SignInPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/test error/i)).toBeInTheDocument();
      });

      // Click close button
      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      expect(screen.queryByText(/test error/i)).not.toBeInTheDocument();
    });
  });

  describe('DocBits Error Scenarios', () => {
    /**
     * BDD: Invalid Credentials Error
     *
     * GIVEN user enters wrong password or non-existent email
     * WHEN they submit login form
     * THEN DocBits returns 401 Unauthorized
     * AND user sees German error message
     * AND error doesn't reveal if email exists (security)
     *
     * WHY: Most common login failure scenario
     * - User forgets password
     * - User types wrong password
     * - Caps lock is on
     *
     * SECURITY RULE: Don't reveal if email exists in system
     * - Bad: "Email not found" (reveals valid emails)
     * - Good: "Invalid credentials" (generic message)
     *
     * PRODUCTION BUG FIXED: Missing OAuth2 Basic Auth header caused this error for ALL logins
     */
    it('should display DocBits invalid credentials error in German', async () => {
      (signIn as any).mockResolvedValueOnce({
        ok: false,
        error: 'Ungültige Anmeldedaten',
      });

      render(<SignInPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/ungültige anmeldedaten/i)).toBeInTheDocument();
      });
    });

    /**
     * BDD: Missing OAuth2 Client Credentials
     *
     * GIVEN DOCBITS_CLIENT_ID or DOCBITS_CLIENT_SECRET is not configured
     * WHEN user attempts to login
     * THEN DocBits returns "Missing Authorization header" error
     * AND user sees configuration error message
     *
     * WHY: Deployment/configuration issue
     * - Environment variables not set in production
     * - Docker secrets not mounted
     * - Kubernetes ConfigMap missing values
     *
     * BUSINESS RULE: This should NEVER happen in production!
     * - Should be caught in CI/CD deployment checks
     * - Should be caught by health check endpoints
     *
     * PRODUCTION BUG: This was the root cause of login failures!
     * - Missing Basic Auth header: Authorization: Basic base64(client_id:client_secret)
     * - All logins failed with "Client authentication failed"
     */
    it('should display configuration error for missing client credentials', async () => {
      (signIn as any).mockResolvedValueOnce({
        ok: false,
        error: 'DocBits OAuth2 client credentials not configured. Please set DOCBITS_CLIENT_ID and DOCBITS_CLIENT_SECRET environment variables.',
      });

      render(<SignInPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorElement = screen.getByText(/client credentials/i);
        expect(errorElement).toBeInTheDocument();
      });
    });

    /**
     * BDD: DocBits API Timeout
     *
     * GIVEN DocBits API is responding slowly (>30 seconds)
     * WHEN user submits login
     * THEN request times out
     * AND user sees network error message
     * AND user can retry
     *
     * WHY: High load, database issues, or network congestion
     * - DocBits under heavy load
     * - Database query taking too long
     * - Network latency spikes
     *
     * BUSINESS RULE: Timeouts should be generous (30s) for login
     * - OAuth2 token generation can be slow
     * - Better to wait than fail prematurely
     */
    it('should handle DocBits API timeout gracefully', async () => {
      (signIn as any).mockRejectedValueOnce(new Error('Request timeout'));

      render(<SignInPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/ein fehler ist aufgetreten/i)).toBeInTheDocument();
      });

      // User should be able to retry (button not permanently disabled)
      expect(submitButton).not.toBeDisabled();
    });

    /**
     * BDD: DocBits API Rate Limiting
     *
     * GIVEN user has made too many failed login attempts
     * WHEN they try again
     * THEN DocBits returns 429 Too Many Requests
     * AND user sees rate limit error message
     * AND user is told to wait before retrying
     *
     * WHY: Prevent brute force attacks
     * - Attackers trying to guess passwords
     * - Bots attempting credential stuffing
     * - DDoS attacks
     *
     * BUSINESS RULE: Rate limit per IP and per email
     * - 5 failed attempts per email within 15 minutes
     * - 10 attempts per IP within 15 minutes
     * - Exponential backoff (5min, 15min, 1hour)
     *
     * IMPROVEMENT: Add CAPTCHA after 3 failed attempts
     */
    it('should display rate limit error from DocBits', async () => {
      (signIn as any).mockResolvedValueOnce({
        ok: false,
        error: 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.',
      });

      render(<SignInPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/zu viele anmeldeversuche/i)).toBeInTheDocument();
      });
    });

    /**
     * BDD: DocBits Server Error (500)
     *
     * GIVEN DocBits API encounters internal server error
     * WHEN user submits login
     * THEN show generic error message (not expose internal error)
     * AND error should be logged for monitoring
     * AND user can retry
     *
     * WHY: Internal errors happen
     * - Database connection failures
     * - Unhandled exceptions
     * - Service dependencies down
     *
     * SECURITY: Never expose internal error details to users
     * - Don't show stack traces
     * - Don't show database query errors
     * - Don't reveal service architecture
     *
     * BUSINESS RULE: Log full error details server-side for debugging
     */
    it('should handle DocBits 500 server error gracefully', async () => {
      (signIn as any).mockResolvedValueOnce({
        ok: false,
        error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
      });

      render(<SignInPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/ein fehler ist aufgetreten/i)).toBeInTheDocument();
      });
    });

    /**
     * BDD: Account Locked Error
     *
     * GIVEN user account has been locked (too many failed attempts, admin action, etc.)
     * WHEN they try to login
     * THEN show account locked message
     * AND provide instructions to unlock (reset password, contact admin)
     *
     * WHY: Security measure to prevent brute force
     * - Automatic lock after N failed attempts
     * - Manual lock by administrator
     * - Suspicious activity detected
     *
     * BUSINESS RULE: Locked accounts require password reset or admin unlock
     *
     * IMPROVEMENT: Add "Unlock my account" flow with email verification
     */
    it('should display account locked error', async () => {
      (signIn as any).mockResolvedValueOnce({
        ok: false,
        error: 'Ihr Konto wurde gesperrt. Bitte setzen Sie Ihr Passwort zurück oder kontaktieren Sie den Administrator.',
      });

      render(<SignInPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');

      fireEvent.change(emailInput, { target: { value: 'locked@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/konto wurde gesperrt/i)).toBeInTheDocument();
      });
    });
  });
});
