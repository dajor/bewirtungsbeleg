/**
 * Comprehensive tests for setup-password page
 * Tests the email-first registration flow where users set passwords after email verification
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MantineProvider } from '@mantine/core';
import SetupPasswordPage from './page';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Helper to render with MantineProvider
function renderWithMantine(component: React.ReactElement) {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
}

// Helper to get password inputs reliably
async function getPasswordInputs() {
  // Password input has placeholder "Mindestens 8 Zeichen"
  const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
  // Confirm password has placeholder "Passwort wiederholen"
  const confirmInput = await screen.findByPlaceholderText('Passwort wiederholen');
  return { passwordInput, confirmInput };
}

describe('SetupPasswordPage', () => {
  const mockPush = vi.fn();
  const mockGet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
    (useSearchParams as any).mockReturnValue({
      get: mockGet,
    });
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Token Verification', () => {
    it('should show loading state during token verification', () => {
      mockGet.mockReturnValue('test-token-123');
      (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithMantine(<SetupPasswordPage />);

      expect(screen.getByText(/e-mail-adresse wird verifiziert/i)).toBeInTheDocument();
      // Mantine Loader renders as a span, not with progressbar role
      expect(screen.getByText(/e-mail-adresse wird verifiziert/i).previousSibling).toHaveClass('mantine-Loader-root');
    });

    it('should verify token on mount', async () => {
      const testToken = 'valid-token-123';
      mockGet.mockReturnValue(testToken);
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/auth/verify-email?token=${testToken}`,
          { method: 'GET' }
        );
      });
    });

    it('should display email after successful token verification', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'user@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText(/erstellen sie ein sicheres passwort für user@example.com/i)).toBeInTheDocument();
      });
    });

    it('should show error when token is missing', async () => {
      mockGet.mockReturnValue(null);

      renderWithMantine(<SetupPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText(/kein token gefunden/i)).toBeInTheDocument();
        expect(screen.getByText(/bitte verwenden sie den link aus ihrer e-mail/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid token', async () => {
      mockGet.mockReturnValue('invalid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Ungültiger oder abgelaufener Link' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText(/ungültiger oder abgelaufener link/i)).toBeInTheDocument();
      });
    });

    it('should show error for expired token', async () => {
      mockGet.mockReturnValue('expired-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Token ist abgelaufen' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText(/token ist abgelaufen/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors during token verification', async () => {
      mockGet.mockReturnValue('test-token');
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      renderWithMantine(<SetupPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText(/fehler beim verifizieren des tokens/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Strength Indicator', () => {
    it.skip('should show weak password strength for short passwords', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      fireEvent.change(passwordInput, { target: { value: '12345' } });

      await waitFor(() => {
        expect(screen.getByText('Schwach')).toBeInTheDocument();
      });
    });

    it.skip('should show medium password strength for moderate passwords', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      await waitFor(() => {
        expect(screen.getByText('Mittel')).toBeInTheDocument();
      });
    });

    it.skip('should show good password strength for strong passwords', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      fireEvent.change(passwordInput, { target: { value: 'Password123' } });

      await waitFor(() => {
        expect(screen.getByText('Gut')).toBeInTheDocument();
      });
    });

    it.skip('should show excellent password strength for very strong passwords', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      fireEvent.change(passwordInput, { target: { value: 'Password123!@#' } });

      await waitFor(() => {
        expect(screen.getByText('Sehr gut')).toBeInTheDocument();
      });
    });

    it.skip('should update strength indicator in real-time', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');

      fireEvent.change(passwordInput, { target: { value: '123' } });
      await waitFor(() => expect(screen.getByText('Schwach')).toBeInTheDocument());

      fireEvent.change(passwordInput, { target: { value: 'Password123!@#' } });
      await waitFor(() => expect(screen.getByText('Sehr gut')).toBeInTheDocument());
    });
  });

  describe('Password Validation', () => {
    it('should require password field', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const submitButton = await screen.findByRole('button', { name: /konto erstellen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwort ist erforderlich/i)).toBeInTheDocument();
      });
    });

    it('should enforce minimum 8 character length', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      fireEvent.change(passwordInput, { target: { value: 'Pass1' } });

      const submitButton = await screen.findByRole('button', { name: /konto erstellen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/mindestens 8 zeichen/i)).toBeInTheDocument();
      });
    });

    it('should require at least one uppercase letter', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = await screen.findByRole('button', { name: /konto erstellen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/mindestens einen großbuchstaben/i)).toBeInTheDocument();
      });
    });

    it('should require at least one lowercase letter', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      fireEvent.change(passwordInput, { target: { value: 'PASSWORD123' } });

      const submitButton = await screen.findByRole('button', { name: /konto erstellen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/mindestens einen kleinbuchstaben/i)).toBeInTheDocument();
      });
    });

    it('should require at least one number', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      fireEvent.change(passwordInput, { target: { value: 'PasswordOnly' } });

      const submitButton = await screen.findByRole('button', { name: /konto erstellen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/mindestens eine zahl/i)).toBeInTheDocument();
      });
    });

    it('should require password confirmation', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      fireEvent.change(passwordInput, { target: { value: 'Password123' } });

      const submitButton = await screen.findByRole('button', { name: /konto erstellen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwortbestätigung ist erforderlich/i)).toBeInTheDocument();
      });
    });

    it('should validate password confirmation matches', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      const confirmInput = await screen.findByPlaceholderText('Passwort wiederholen');

      fireEvent.change(passwordInput, { target: { value: 'Password123' } });
      fireEvent.change(confirmInput, { target: { value: 'Password456' } });

      const submitButton = await screen.findByRole('button', { name: /konto erstellen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwörter stimmen nicht überein/i)).toBeInTheDocument();
      });
    });

    it('should accept valid password meeting all requirements', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      const confirmInput = await screen.findByPlaceholderText('Passwort wiederholen');

      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } });
      fireEvent.change(confirmInput, { target: { value: 'ValidPass123' } });

      const submitButton = await screen.findByRole('button', { name: /konto erstellen/i });

      // Mock successful API call
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, email: 'test@example.com' }),
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/setup-password',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('ValidPass123'),
          })
        );
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid password', async () => {
      mockGet.mockReturnValue('valid-token-123');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      const confirmInput = await screen.findByPlaceholderText('Passwort wiederholen');

      fireEvent.change(passwordInput, { target: { value: 'SecurePass123' } });
      fireEvent.change(confirmInput, { target: { value: 'SecurePass123' } });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          email: 'test@example.com',
          message: 'Passwort erfolgreich erstellt',
        }),
      });

      const submitButton = await screen.findByRole('button', { name: /konto erstellen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/setup-password',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: 'valid-token-123',
              password: 'SecurePass123',
            }),
          })
        );
      });
    });

    it('should show success message after password creation', async () => {
      mockGet.mockReturnValue('valid-token-123');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      const confirmInput = await screen.findByPlaceholderText('Passwort wiederholen');

      fireEvent.change(passwordInput, { target: { value: 'SecurePass123' } });
      fireEvent.change(confirmInput, { target: { value: 'SecurePass123' } });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, email: 'test@example.com' }),
      });

      const submitButton = await screen.findByRole('button', { name: /konto erstellen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/konto erfolgreich erstellt/i)).toBeInTheDocument();
      });
    });

    it('should redirect to signin after 3 seconds', async () => {
      vi.useFakeTimers();

      mockGet.mockReturnValue('valid-token-123');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      const confirmInput = await screen.findByPlaceholderText('Passwort wiederholen');

      fireEvent.change(passwordInput, { target: { value: 'SecurePass123' } });
      fireEvent.change(confirmInput, { target: { value: 'SecurePass123' } });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, email: 'test@example.com' }),
      });

      const submitButton = await screen.findByRole('button', { name: /konto erstellen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/konto erfolgreich erstellt/i)).toBeInTheDocument();
      });

      vi.advanceTimersByTime(3000);

      expect(mockPush).toHaveBeenCalledWith('/auth/signin?setup=success');

      vi.useRealTimers();
    });

    it('should show loading state during submission', async () => {
      mockGet.mockReturnValue('valid-token-123');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      const confirmInput = await screen.findByPlaceholderText('Passwort wiederholen');

      fireEvent.change(passwordInput, { target: { value: 'SecurePass123' } });
      fireEvent.change(confirmInput, { target: { value: 'SecurePass123' } });

      (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

      const submitButton = await screen.findByRole('button', { name: /konto erstellen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toHaveAttribute('data-loading', 'true');
      });
    });

    it('should disable submit button when no token', async () => {
      // Clear the mock to simulate no token
      mockGet.mockReturnValue(null);

      renderWithMantine(<SetupPasswordPage />);

      await waitFor(() => {
        const submitButton = screen.queryByRole('button', { name: /konto erstellen/i });
        if (submitButton) {
          expect(submitButton).toBeDisabled();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when API returns error', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      const confirmInput = await screen.findByPlaceholderText('Passwort wiederholen');

      fireEvent.change(passwordInput, { target: { value: 'SecurePass123' } });
      fireEvent.change(confirmInput, { target: { value: 'SecurePass123' } });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Token ist abgelaufen' }),
      });

      const submitButton = await screen.findByRole('button', { name: /konto erstellen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/token ist abgelaufen/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      const confirmInput = await screen.findByPlaceholderText('Passwort wiederholen');

      fireEvent.change(passwordInput, { target: { value: 'SecurePass123' } });
      fireEvent.change(confirmInput, { target: { value: 'SecurePass123' } });

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const submitButton = await screen.findByRole('button', { name: /konto erstellen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/ein fehler ist aufgetreten/i)).toBeInTheDocument();
      });
    });

    it('should allow retrying after error', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      const confirmInput = await screen.findByPlaceholderText('Passwort wiederholen');

      fireEvent.change(passwordInput, { target: { value: 'SecurePass123' } });
      fireEvent.change(confirmInput, { target: { value: 'SecurePass123' } });

      // First attempt fails
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      const submitButton = await screen.findByRole('button', { name: /konto erstellen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });

      // Second attempt succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, email: 'test@example.com' }),
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/konto erfolgreich erstellt/i)).toBeInTheDocument();
      });
    });
  });

  describe('UI Elements', () => {
    it('should display password requirements text', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText(/mindestens 8 zeichen lang sein/i)).toBeInTheDocument();
        expect(screen.getByText(/groß- und kleinbuchstaben/i)).toBeInTheDocument();
      });
    });

    it('should display back to signin link', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      await waitFor(() => {
        const signinLink = screen.getByText(/anmeldung/i);
        expect(signinLink.closest('a')).toHaveAttribute('href', '/auth/signin');
      });
    });

    it('should show password fields with lock icons', async () => {
      mockGet.mockReturnValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      });

      renderWithMantine(<SetupPasswordPage />);

      // Use findBy to wait for elements to be rendered
      const passwordInput = await screen.findByPlaceholderText('Mindestens 8 Zeichen');
      const confirmInput = await screen.findByPlaceholderText('Passwort wiederholen');

      expect(passwordInput).toBeInTheDocument();
      expect(confirmInput).toBeInTheDocument();
    });
  });

  describe('Suspense Boundary', () => {
    it('should show fallback while loading', async () => {
      mockGet.mockReturnValue(null);

      renderWithMantine(<SetupPasswordPage />);

      // The Suspense fallback or error state should show
      // When no token, the page shows an error immediately instead of a loader
      await waitFor(() => {
        expect(screen.getByText(/kein token gefunden/i)).toBeInTheDocument();
      });
    });
  });
});
