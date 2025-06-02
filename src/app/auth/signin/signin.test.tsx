import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import SignInPage from './page';
import { renderWithProviders } from '@/test-utils';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('SignInPage', () => {
  const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    });
    mockGet.mockReturnValue(null);
  });

  it('should render sign in form', () => {
    renderWithProviders(<SignInPage />);

    expect(screen.getByRole('heading', { name: 'Anmelden' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ihre@email.de')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ihr Passwort')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
  });

  it('should display demo accounts', () => {
    renderWithProviders(<SignInPage />);

    expect(screen.getByText(/Demo-Konten:/)).toBeInTheDocument();
    expect(screen.getByText(/admin@docbits.com \/ admin123/)).toBeInTheDocument();
    expect(screen.getByText(/user@docbits.com \/ user123/)).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    mockSignIn.mockResolvedValue({ error: null, ok: true } as any);

    renderWithProviders(<SignInPage />);

    const emailInput = screen.getByPlaceholderText('ihre@email.de');
    const passwordInput = screen.getByPlaceholderText('Ihr Passwort');
    const submitButton = screen.getByRole('button', { name: 'Anmelden' });

    fireEvent.change(emailInput, { target: { value: 'admin@docbits.com' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'admin@docbits.com',
        password: 'admin123',
        redirect: false,
      });
      expect(mockPush).toHaveBeenCalledWith('/bewirtungsbeleg');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should redirect to callback URL if provided', async () => {
    mockGet.mockReturnValue('/some/protected/route');
    mockSignIn.mockResolvedValue({ error: null, ok: true } as any);

    renderWithProviders(<SignInPage />);

    const emailInput = screen.getByPlaceholderText('ihre@email.de');
    const passwordInput = screen.getByPlaceholderText('Ihr Passwort');
    const submitButton = screen.getByRole('button', { name: 'Anmelden' });

    fireEvent.change(emailInput, { target: { value: 'admin@docbits.com' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/some/protected/route');
    });
  });

  it('should display error on failed login', async () => {
    mockSignIn.mockResolvedValue({ 
      error: 'Ungültige Anmeldedaten',
      ok: false 
    } as any);

    renderWithProviders(<SignInPage />);

    const emailInput = screen.getByPlaceholderText('ihre@email.de');
    const passwordInput = screen.getByPlaceholderText('Ihr Passwort');
    const submitButton = screen.getByRole('button', { name: 'Anmelden' });

    fireEvent.change(emailInput, { target: { value: 'wrong@email.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Ungültige Anmeldedaten')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('should disable form while logging in', async () => {
    let resolveSignIn: any;
    mockSignIn.mockImplementation(() => new Promise((resolve) => {
      resolveSignIn = resolve;
    }));

    renderWithProviders(<SignInPage />);

    const emailInput = screen.getByPlaceholderText('ihre@email.de');
    const passwordInput = screen.getByPlaceholderText('Ihr Passwort');
    const submitButton = screen.getByRole('button', { name: 'Anmelden' });

    fireEvent.change(emailInput, { target: { value: 'admin@docbits.com' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    resolveSignIn({ error: null, ok: true });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it('should handle unexpected errors', async () => {
    mockSignIn.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<SignInPage />);

    const emailInput = screen.getByPlaceholderText('ihre@email.de');
    const passwordInput = screen.getByPlaceholderText('Ihr Passwort');
    const submitButton = screen.getByRole('button', { name: 'Anmelden' });

    fireEvent.change(emailInput, { target: { value: 'admin@docbits.com' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Ein unerwarteter Fehler ist aufgetreten')).toBeInTheDocument();
    });
  });
});