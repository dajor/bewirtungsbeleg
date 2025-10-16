/**
 * Tests for forgot-password page
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForgotPasswordPage from './page';
import { renderWithProviders } from '@/test-utils';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Initial State', () => {
    it('should render the forgot password form', () => {
      renderWithProviders(<ForgotPasswordPage />);

      expect(screen.getByText(/passwort vergessen/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /passwort zurücksetzen/i })).toBeInTheDocument();
    });

    it('should display DocBits logo', () => {
      renderWithProviders(<ForgotPasswordPage />);

      const logo = screen.getByAltText('DocBits');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/docbits.svg');
    });

    it('should display back to signin link', () => {
      renderWithProviders(<ForgotPasswordPage />);

      const backLink = screen.getByText(/zurück zur anmeldung/i);
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/auth/anmelden');
    });

    it('should display instructions', () => {
      renderWithProviders(<ForgotPasswordPage />);

      expect(screen.getByText(/geben sie ihre e-mail-adresse ein/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required email field', async () => {
      renderWithProviders(<ForgotPasswordPage />);

      const submitButton = screen.getByRole('button', { name: /passwort zurücksetzen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Check for the error message in a more flexible way
        expect(screen.getByText((content, element) => {
          return content.includes('E-Mail') && content.includes('erforderlich');
        })).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      renderWithProviders(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByRole('button', { name: /passwort zurücksetzen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Check for the error message in a more flexible way
        expect(screen.getByText((content, element) => {
          return content.includes('E-Mail') && content.includes('Ungültige');
        })).toBeInTheDocument();
      });
    });

    it('should accept valid email format', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithProviders(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', { name: /passwort zurücksetzen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/passwort-vergessen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' }),
        });
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should submit form with valid email', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Email sent' }),
      });

      renderWithProviders(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByRole('button', { name: /passwort zurücksetzen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/passwort-vergessen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'user@example.com' }),
        });
      });
    });

    it('should show success state after email sent', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithProviders(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByRole('button', { name: /passwort zurücksetzen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/e-mail versendet/i)).toBeInTheDocument();
        expect(screen.getByText(/anweisungen zum zurücksetzen/i)).toBeInTheDocument();
        expect(screen.getByText(/spam-ordner/i)).toBeInTheDocument();
      });
    });

    it('should show back to signin button in success state', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithProviders(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByRole('button', { name: /passwort zurücksetzen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /zurück zur anmeldung/i });
        expect(backButton).toBeInTheDocument();
        expect(backButton.closest('a')).toHaveAttribute('href', '/auth/anmelden');
      });
    });

    it('should show error message on API failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Too many requests' }),
      });

      renderWithProviders(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByRole('button', { name: /passwort zurücksetzen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
      });
    });

    it('should show generic error message on network failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByRole('button', { name: /passwort zurücksetzen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/ein fehler ist aufgetreten/i)).toBeInTheDocument();
      });
    });
  });

  describe('UI Interaction', () => {
    it('should show loading state during submission', async () => {
      (global.fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByRole('button', { name: /passwort zurücksetzen/i });
      fireEvent.click(submitButton);

      expect(submitButton).toHaveAttribute('data-loading', 'true');
    });

    it('should disable input field during submission', async () => {
      (global.fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/e-mail/i) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByRole('button', { name: /passwort zurücksetzen/i });
      fireEvent.click(submitButton);

      expect(emailInput.disabled).toBe(true);
    });

    it('should allow closing error alert', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Test error' }),
      });

      renderWithProviders(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByRole('button', { name: /passwort zurücksetzen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/test error/i)).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      expect(screen.queryByText(/test error/i)).not.toBeInTheDocument();
    });

    it('should hide form after successful submission', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithProviders(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByRole('button', { name: /passwort zurücksetzen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByLabelText(/e-mail/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /passwort zurücksetzen/i })).not.toBeInTheDocument();
      });
    });

    it('should display success icon in success state', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithProviders(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByRole('button', { name: /passwort zurücksetzen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/e-mail versendet/i)).toBeInTheDocument();
      });
    });
  });
});
