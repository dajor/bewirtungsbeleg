/**
 * Tests for register page
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterPage from './page';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, target }: any) => <a href={href} target={target}>{children}</a>,
}));

describe('RegisterPage', () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    global.fetch = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Form Validation', () => {
    it('should validate required first name', async () => {
      render(<RegisterPage />);

      const submitButton = screen.getByRole('button', { name: /registrieren/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/vorname ist erforderlich/i)).toBeInTheDocument();
      });
    });

    it('should validate required last name', async () => {
      render(<RegisterPage />);

      const submitButton = screen.getByRole('button', { name: /registrieren/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nachname ist erforderlich/i)).toBeInTheDocument();
      });
    });

    it('should validate required email', async () => {
      render(<RegisterPage />);

      const submitButton = screen.getByRole('button', { name: /registrieren/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/e-mail ist erforderlich/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      render(<RegisterPage />);

      const emailInput = screen.getByLabelText('E-Mail');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByRole('button', { name: /registrieren/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/ungültige e-mail-adresse/i)).toBeInTheDocument();
      });
    });

    it('should validate required password', async () => {
      render(<RegisterPage />);

      const submitButton = screen.getByRole('button', { name: /registrieren/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwort ist erforderlich/i)).toBeInTheDocument();
      });
    });

    it('should validate minimum password length (8 characters)', async () => {
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText('Passwort');
      fireEvent.change(passwordInput, { target: { value: '1234567' } });

      const submitButton = screen.getByRole('button', { name: /registrieren/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/mindestens 8 zeichen/i)).toBeInTheDocument();
      });
    });

    it('should validate password confirmation match', async () => {
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText('Passwort');
      const confirmPasswordInput = screen.getByLabelText('Passwort bestätigen');

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });

      const submitButton = screen.getByRole('button', { name: /registrieren/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwörter stimmen nicht überein/i)).toBeInTheDocument();
      });
    });

    it('should validate terms acceptance', async () => {
      render(<RegisterPage />);

      const firstNameInput = screen.getByLabelText('Vorname');
      const lastNameInput = screen.getByLabelText('Nachname');
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');
      const confirmPasswordInput = screen.getByLabelText('Passwort bestätigen');

      fireEvent.change(firstNameInput, { target: { value: 'Max' } });
      fireEvent.change(lastNameInput, { target: { value: 'Mustermann' } });
      fireEvent.change(emailInput, { target: { value: 'max@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: /registrieren/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/sie müssen die agb akzeptieren/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Strength Indicator', () => {
    it('should show weak password strength for short passwords', () => {
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText('Passwort');
      fireEvent.change(passwordInput, { target: { value: '12345678' } });

      expect(screen.getByText(/schwach/i)).toBeInTheDocument();
    });

    it('should show medium password strength', () => {
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText('Passwort');
      fireEvent.change(passwordInput, { target: { value: 'Password123' } });

      expect(screen.getByText(/mittel|gut/i)).toBeInTheDocument();
    });

    it('should show strong password strength for complex passwords', () => {
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText('Passwort');
      fireEvent.change(passwordInput, { target: { value: 'Password123!@#' } });

      expect(screen.getByText(/gut|sehr gut/i)).toBeInTheDocument();
    });

    it('should only show strength indicator when password is entered', () => {
      render(<RegisterPage />);

      expect(screen.queryByText(/passwortstärke/i)).not.toBeInTheDocument();

      const passwordInput = screen.getByLabelText('Passwort');
      fireEvent.change(passwordInput, { target: { value: 'test' } });

      expect(screen.getByText(/passwortstärke/i)).toBeInTheDocument();
    });
  });

  describe('Registration Flow', () => {
    it('should submit valid registration data', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<RegisterPage />);

      const firstNameInput = screen.getByLabelText('Vorname');
      const lastNameInput = screen.getByLabelText('Nachname');
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');
      const confirmPasswordInput = screen.getByLabelText('Passwort bestätigen');
      const termsCheckbox = screen.getByRole('checkbox');

      fireEvent.change(firstNameInput, { target: { value: 'Max' } });
      fireEvent.change(lastNameInput, { target: { value: 'Mustermann' } });
      fireEvent.change(emailInput, { target: { value: 'max@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
      fireEvent.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /registrieren/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/docbits-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: 'Max',
            last_name: 'Mustermann',
            email: 'max@example.com',
            password: 'Password123!',
          }),
        });
      });
    });

    it('should show success state after registration', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<RegisterPage />);

      const firstNameInput = screen.getByLabelText('Vorname');
      const lastNameInput = screen.getByLabelText('Nachname');
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');
      const confirmPasswordInput = screen.getByLabelText('Passwort bestätigen');
      const termsCheckbox = screen.getByRole('checkbox');

      fireEvent.change(firstNameInput, { target: { value: 'Max' } });
      fireEvent.change(lastNameInput, { target: { value: 'Mustermann' } });
      fireEvent.change(emailInput, { target: { value: 'max@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
      fireEvent.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /registrieren/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/erfolgreich registriert/i)).toBeInTheDocument();
        expect(screen.getByText(/automatisch angemeldet/i)).toBeInTheDocument();
      });
    });

    it('should auto-login after successful registration', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      (signIn as any).mockResolvedValueOnce({ ok: true });

      render(<RegisterPage />);

      const firstNameInput = screen.getByLabelText('Vorname');
      const lastNameInput = screen.getByLabelText('Nachname');
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');
      const confirmPasswordInput = screen.getByLabelText('Passwort bestätigen');
      const termsCheckbox = screen.getByRole('checkbox');

      fireEvent.change(firstNameInput, { target: { value: 'Max' } });
      fireEvent.change(lastNameInput, { target: { value: 'Mustermann' } });
      fireEvent.change(emailInput, { target: { value: 'max@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
      fireEvent.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /registrieren/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/erfolgreich registriert/i)).toBeInTheDocument();
      });

      // Fast forward timers for auto-login
      vi.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('credentials', {
          email: 'max@example.com',
          password: 'Password123!',
          redirect: false,
        });
        expect(mockPush).toHaveBeenCalledWith('/bewirtungsbeleg');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should show error message on registration failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email already exists' }),
      });

      render(<RegisterPage />);

      const firstNameInput = screen.getByLabelText('Vorname');
      const lastNameInput = screen.getByLabelText('Nachname');
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');
      const confirmPasswordInput = screen.getByLabelText('Passwort bestätigen');
      const termsCheckbox = screen.getByRole('checkbox');

      fireEvent.change(firstNameInput, { target: { value: 'Max' } });
      fireEvent.change(lastNameInput, { target: { value: 'Mustermann' } });
      fireEvent.change(emailInput, { target: { value: 'max@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
      fireEvent.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /registrieren/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('UI Elements', () => {
    it('should display DocBits logo', () => {
      render(<RegisterPage />);

      const logo = screen.getByAltText('DocBits');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/docbits.svg');
    });

    it('should display registration title', () => {
      render(<RegisterPage />);

      expect(screen.getByText(/konto erstellen/i)).toBeInTheDocument();
    });

    it('should display AGB link', () => {
      render(<RegisterPage />);

      const agbLink = screen.getByText('AGB');
      expect(agbLink).toBeInTheDocument();
      expect(agbLink.closest('a')).toHaveAttribute('href', '/terms');
      expect(agbLink.closest('a')).toHaveAttribute('target', '_blank');
    });

    it('should display Datenschutz link', () => {
      render(<RegisterPage />);

      const privacyLink = screen.getByText('Datenschutzbestimmungen');
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink.closest('a')).toHaveAttribute('href', '/privacy');
      expect(privacyLink.closest('a')).toHaveAttribute('target', '_blank');
    });

    it('should display signin link', () => {
      render(<RegisterPage />);

      const signinLink = screen.getByText(/jetzt anmelden/i);
      expect(signinLink).toBeInTheDocument();
      expect(signinLink.closest('a')).toHaveAttribute('href', '/auth/signin');
    });

    it('should show loading state during registration', async () => {
      (global.fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<RegisterPage />);

      const firstNameInput = screen.getByLabelText('Vorname');
      const lastNameInput = screen.getByLabelText('Nachname');
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');
      const confirmPasswordInput = screen.getByLabelText('Passwort bestätigen');
      const termsCheckbox = screen.getByRole('checkbox');

      fireEvent.change(firstNameInput, { target: { value: 'Max' } });
      fireEvent.change(lastNameInput, { target: { value: 'Mustermann' } });
      fireEvent.change(emailInput, { target: { value: 'max@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
      fireEvent.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /registrieren/i });
      fireEvent.click(submitButton);

      expect(submitButton).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<RegisterPage />);

      const firstNameInput = screen.getByLabelText('Vorname');
      const lastNameInput = screen.getByLabelText('Nachname');
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');
      const confirmPasswordInput = screen.getByLabelText('Passwort bestätigen');
      const termsCheckbox = screen.getByRole('checkbox');

      fireEvent.change(firstNameInput, { target: { value: 'Max' } });
      fireEvent.change(lastNameInput, { target: { value: 'Mustermann' } });
      fireEvent.change(emailInput, { target: { value: 'max@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
      fireEvent.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /registrieren/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/ein fehler ist aufgetreten/i)).toBeInTheDocument();
      });
    });

    it('should allow closing error alert', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Test error' }),
      });

      render(<RegisterPage />);

      const firstNameInput = screen.getByLabelText('Vorname');
      const lastNameInput = screen.getByLabelText('Nachname');
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');
      const confirmPasswordInput = screen.getByLabelText('Passwort bestätigen');
      const termsCheckbox = screen.getByRole('checkbox');

      fireEvent.change(firstNameInput, { target: { value: 'Max' } });
      fireEvent.change(lastNameInput, { target: { value: 'Mustermann' } });
      fireEvent.change(emailInput, { target: { value: 'max@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
      fireEvent.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /registrieren/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/test error/i)).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      expect(screen.queryByText(/test error/i)).not.toBeInTheDocument();
    });
  });
});
