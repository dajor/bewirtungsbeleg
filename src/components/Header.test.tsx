import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from './Header';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock Mantine hooks
vi.mock('@mantine/hooks', () => ({
  useDisclosure: vi.fn(() => [false, { toggle: vi.fn(), close: vi.fn() }]),
}));

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePathname as any).mockReturnValue('/');
  });

  describe('Navigation Links', () => {
    it('should render "Beleg erstellen" link', () => {
      (useSession as any).mockReturnValue({ data: null, status: 'unauthenticated' });

      render(<Header />);

      const link = screen.getByText('Beleg erstellen');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/bewirtungsbeleg');
    });

    it('should render "Dokument scannen" link', () => {
      (useSession as any).mockReturnValue({ data: null, status: 'unauthenticated' });

      render(<Header />);

      const link = screen.getByText('Dokument scannen');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/scanner');
    });

    it('should render "Features" link', () => {
      (useSession as any).mockReturnValue({ data: null, status: 'unauthenticated' });

      render(<Header />);

      const link = screen.getByText('Features');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/#features');
    });

    it('should render "GoBD" link', () => {
      (useSession as any).mockReturnValue({ data: null, status: 'unauthenticated' });

      render(<Header />);

      const link = screen.getByText('GoBD');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/gobd');
    });

    it('should render "Release Notes" link', () => {
      (useSession as any).mockReturnValue({ data: null, status: 'unauthenticated' });

      render(<Header />);

      const link = screen.getByText('Release Notes');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/release-notes');
    });

    it('should render all navigation links in correct order', () => {
      (useSession as any).mockReturnValue({ data: null, status: 'unauthenticated' });

      render(<Header />);

      const links = screen.getAllByRole('link').filter(link =>
        ['Beleg erstellen', 'Dokument scannen', 'Features', 'GoBD', 'Release Notes'].includes(
          link.textContent || ''
        )
      );

      expect(links).toHaveLength(10); // 5 links x 2 (desktop + mobile)

      // Check first 5 are in correct order (desktop nav)
      expect(links[0]).toHaveTextContent('Beleg erstellen');
      expect(links[1]).toHaveTextContent('Dokument scannen');
      expect(links[2]).toHaveTextContent('Features');
      expect(links[3]).toHaveTextContent('GoBD');
      expect(links[4]).toHaveTextContent('Release Notes');
    });
  });

  describe('Authenticated User Menu', () => {
    it('should render "Meine Belege" link when authenticated', () => {
      (useSession as any).mockReturnValue({
        data: { user: { email: 'test@example.com' } },
        status: 'authenticated',
      });

      render(<Header />);

      const link = screen.getByText('Meine Belege');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/meine-belege');
    });

    it('should render user menu items when authenticated', () => {
      (useSession as any).mockReturnValue({
        data: { user: { email: 'test@example.com' } },
        status: 'authenticated',
      });

      render(<Header />);

      expect(screen.getByText('Meine Belege')).toBeInTheDocument();
      expect(screen.getByText('Mein Profil')).toBeInTheDocument();
      expect(screen.getByText('Einstellungen')).toBeInTheDocument();
      expect(screen.getByText('Abmelden')).toBeInTheDocument();
    });
  });

  describe('Unauthenticated Menu', () => {
    it('should render auth buttons when not authenticated', () => {
      (useSession as any).mockReturnValue({ data: null, status: 'unauthenticated' });

      render(<Header />);

      const anmeldenButtons = screen.getAllByText('Anmelden');
      const registrierenButtons = screen.getAllByText('Registrieren');

      expect(anmeldenButtons.length).toBeGreaterThan(0);
      expect(registrierenButtons.length).toBeGreaterThan(0);
    });

    it('should not render authenticated menu items when not logged in', () => {
      (useSession as any).mockReturnValue({ data: null, status: 'unauthenticated' });

      render(<Header />);

      expect(screen.queryByText('Meine Belege')).not.toBeInTheDocument();
      expect(screen.queryByText('Mein Profil')).not.toBeInTheDocument();
    });
  });

  describe('DocBits Logo', () => {
    it('should render DocBits logo', () => {
      (useSession as any).mockReturnValue({ data: null, status: 'unauthenticated' });

      render(<Header />);

      const logo = screen.getByAltText('DocBits');
      expect(logo).toBeInTheDocument();
    });
  });
});
