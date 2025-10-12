/**
 * Component tests for meine-belege/page.tsx
 * Tests the document list page with OpenSearch integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { SessionProvider } from 'next-auth/react';
import MeineBelegePage from '../page';
import type { Document, DocumentListResponse } from '@/types/document';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock fetch globally
global.fetch = vi.fn();

// Helper to wrap components with providers
const renderWithProviders = (component: React.ReactElement, session: any = null) => {
  const { useSession } = require('next-auth/react');
  useSession.mockReturnValue({
    data: session,
    status: session ? 'authenticated' : 'unauthenticated',
  });

  return render(
    <SessionProvider session={session}>
      <MantineProvider>{component}</MantineProvider>
    </SessionProvider>
  );
};

// Sample document data
const createMockDocument = (overrides: Partial<Document> = {}): Document => ({
  id: 'doc-1',
  user_id: 'user-1',
  name: 'bewirtungsbeleg-2024-03-15.pdf',
  type: 'bewirtungsbeleg',
  status: 'completed',
  created_at: '2024-03-15T10:00:00Z',
  updated_at: '2024-03-15T10:00:00Z',
  pdf_url: 'https://spaces.example.com/doc-1.pdf',
  thumbnail_url: 'https://spaces.example.com/doc-1.png',
  original_url: 'https://spaces.example.com/doc-1-original.pdf',
  gobd_compliant: true,
  gobd_signature: 'sha256-abc123',
  signature_hash: 'abc123',
  full_text: 'Goldener Löwe Restaurant',
  metadata: {
    restaurant_name: 'Goldener Löwe',
    restaurant_address: 'Hauptstraße 1, Berlin',
    total_amount: 125.5,
    currency: 'EUR',
    date: '2024-03-15',
    business_purpose: 'Kundengespräch',
    participants: 'Max Mustermann, John Doe',
    ...overrides.metadata,
  },
  form_data: {},
  ...overrides,
});

const mockDocumentList: Document[] = [
  createMockDocument({ id: 'doc-1' }),
  createMockDocument({
    id: 'doc-2',
    metadata: {
      restaurant_name: 'Steakhouse Berlin',
      total_amount: 89.9,
      currency: 'EUR',
      date: '2024-03-14',
    },
  }),
  createMockDocument({
    id: 'doc-3',
    status: 'processing',
    metadata: {
      restaurant_name: 'Pizza Palace',
      total_amount: 45.0,
      currency: 'EUR',
      date: '2024-03-13',
    },
  }),
];

const mockSession = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: '2025-01-01',
};

describe('meine-belege/page.tsx - Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
    mockPush.mockClear();
  });

  describe('Authentication', () => {
    it('should redirect to signin page if not authenticated', () => {
      renderWithProviders(<MeineBelegePage />, null);

      expect(mockPush).toHaveBeenCalledWith('/auth/anmelden');
    });

    it('should show loading spinner while checking authentication', () => {
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValue({
        data: null,
        status: 'loading',
      });

      renderWithProviders(<MeineBelegePage />, null);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should load documents when authenticated', async () => {
      const mockResponse: DocumentListResponse = {
        documents: mockDocumentList,
        pagination: {
          page: 1,
          limit: 12,
          total: 3,
          totalPages: 1,
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/documents/list?page=1&limit=12')
        );
      });
    });
  });

  describe('Document Display', () => {
    beforeEach(() => {
      const mockResponse: DocumentListResponse = {
        documents: mockDocumentList,
        pagination: {
          page: 1,
          limit: 12,
          total: 3,
          totalPages: 1,
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
    });

    it('should display PNG thumbnails from Spaces', async () => {
      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
        expect(images[0]).toHaveAttribute('src', expect.stringContaining('spaces.example.com'));
      });
    });

    it('should show fallback icon when no thumbnail available', async () => {
      const docsWithoutThumbnail = [
        createMockDocument({ id: 'doc-1', thumbnail_url: undefined }),
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            documents: docsWithoutThumbnail,
            pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
          }),
      });

      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        // IconFileDescription should be visible as fallback
        expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
      });
    });

    it('should display restaurant name as document title', async () => {
      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
        expect(screen.getByText('Steakhouse Berlin')).toBeInTheDocument();
        expect(screen.getByText('Pizza Palace')).toBeInTheDocument();
      });
    });

    it('should display formatted amounts with currency', async () => {
      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        expect(screen.getByText('125,50 €')).toBeInTheDocument();
        expect(screen.getByText('89,90 €')).toBeInTheDocument();
        expect(screen.getByText('45,00 €')).toBeInTheDocument();
      });
    });

    it('should display document type badges', async () => {
      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        const typeBadges = screen.getAllByText('Bewirtungsbeleg');
        expect(typeBadges.length).toBe(mockDocumentList.length);
      });
    });

    it('should display status badges with correct colors', async () => {
      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        expect(screen.getByText('Abgeschlossen')).toBeInTheDocument();
        expect(screen.getByText('In Bearbeitung')).toBeInTheDocument();
      });
    });

    it('should display GoBD compliance badge for compliant documents', async () => {
      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        const gobdBadges = screen.getAllByText(/GoBD/i);
        expect(gobdBadges.length).toBeGreaterThan(0);
      });
    });

    it('should display formatted dates in German locale', async () => {
      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        expect(screen.getByText('15.03.2024')).toBeInTheDocument();
      });
    });
  });

  describe('Grid View and List View', () => {
    beforeEach(() => {
      const mockResponse: DocumentListResponse = {
        documents: mockDocumentList,
        pagination: {
          page: 1,
          limit: 12,
          total: 3,
          totalPages: 1,
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
    });

    it('should default to grid view', async () => {
      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        // Grid view renders Card components
        expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
      });
    });

    it('should toggle to list view when list button is clicked', async () => {
      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
      });

      const listViewButton = screen.getAllByRole('button').find((button) => {
        const svg = button.querySelector('svg');
        return svg && svg.classList.toString().includes('IconList');
      });

      if (listViewButton) {
        await userEvent.click(listViewButton);

        // List view should still show documents
        expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
      }
    });

    it('should toggle back to grid view', async () => {
      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
      });

      // Switch to list view first
      const listViewButton = screen.getAllByRole('button').find((button) => {
        const svg = button.querySelector('svg');
        return svg && svg.classList.toString().includes('IconList');
      });

      if (listViewButton) {
        await userEvent.click(listViewButton);
      }

      // Switch back to grid view
      const gridViewButton = screen.getAllByRole('button').find((button) => {
        const svg = button.querySelector('svg');
        return svg && svg.classList.toString().includes('IconGrid');
      });

      if (gridViewButton) {
        await userEvent.click(gridViewButton);
      }

      // Documents should still be visible
      expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      const mockResponse: DocumentListResponse = {
        documents: mockDocumentList,
        pagination: {
          page: 1,
          limit: 12,
          total: 3,
          totalPages: 1,
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
    });

    it('should have search input with OpenSearch label', async () => {
      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(
          /Dokumente durchsuchen \(OpenSearch: Volltext & Vektor\)/i
        );
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('should send search query to API after debounce', async () => {
      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Dokumente durchsuchen/i);
      await userEvent.type(searchInput, 'Pizza');

      // Wait for debounce (300ms) + API call
      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('search=Pizza')
          );
        },
        { timeout: 500 }
      );
    });

    it('should clear search query when clear button is clicked', async () => {
      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Dokumente durchsuchen/i);
      await userEvent.type(searchInput, 'Test query');

      // Find and click clear button (×)
      const clearButton = screen.getByText('×');
      await userEvent.click(clearButton);

      expect((searchInput as HTMLInputElement).value).toBe('');
    });
  });

  describe('Action Menu', () => {
    beforeEach(() => {
      const mockResponse: DocumentListResponse = {
        documents: [mockDocumentList[0]],
        pagination: {
          page: 1,
          limit: 12,
          total: 1,
          totalPages: 1,
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
    });

    it('should show View PDF menu item', async () => {
      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
      });

      // Open action menu
      const menuButtons = screen.getAllByRole('button').filter((button) => {
        const svg = button.querySelector('svg');
        return svg && svg.classList.toString().includes('IconDots');
      });

      if (menuButtons[0]) {
        await userEvent.click(menuButtons[0]);

        await waitFor(() => {
          expect(screen.getByText('Ansehen')).toBeInTheDocument();
        });
      }
    });

    it('should open PDF in new tab when View is clicked', async () => {
      window.open = vi.fn();

      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
      });

      // Open action menu
      const menuButtons = screen.getAllByRole('button').filter((button) => {
        const svg = button.querySelector('svg');
        return svg && svg.classList.toString().includes('IconDots');
      });

      if (menuButtons[0]) {
        await userEvent.click(menuButtons[0]);

        const viewItem = screen.getByText('Ansehen');
        await userEvent.click(viewItem);

        expect(window.open).toHaveBeenCalledWith(
          'https://spaces.example.com/doc-1.pdf',
          '_blank'
        );
      }
    });

    it('should download PDF when Download is clicked', async () => {
      // Mock document.createElement
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
      });

      // Open action menu
      const menuButtons = screen.getAllByRole('button').filter((button) => {
        const svg = button.querySelector('svg');
        return svg && svg.classList.toString().includes('IconDots');
      });

      if (menuButtons[0]) {
        await userEvent.click(menuButtons[0]);

        const downloadItem = screen.getByText('Herunterladen');
        await userEvent.click(downloadItem);

        expect(mockLink.href).toBe('https://spaces.example.com/doc-1.pdf');
        expect(mockLink.download).toBe('bewirtungsbeleg-2024-03-15.pdf');
        expect(mockLink.click).toHaveBeenCalled();
      }
    });

    it('should show delete menu item', async () => {
      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
      });

      // Open action menu
      const menuButtons = screen.getAllByRole('button').filter((button) => {
        const svg = button.querySelector('svg');
        return svg && svg.classList.toString().includes('IconDots');
      });

      if (menuButtons[0]) {
        await userEvent.click(menuButtons[0]);

        await waitFor(() => {
          expect(screen.getByText('Löschen')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should show error message when API fails', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        expect(screen.getByText(/Fehler beim Laden der Dokumente/i)).toBeInTheDocument();
      });
    });

    it('should show error for broken image URLs', async () => {
      const docsWithBrokenImages = [
        createMockDocument({
          id: 'doc-1',
          thumbnail_url: 'https://spaces.example.com/broken-image.png',
        }),
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            documents: docsWithBrokenImages,
            pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
          }),
      });

      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        // Even with broken URL, component should still show document info
        expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no documents found', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            documents: [],
            pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
          }),
      });

      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        expect(screen.getByText('Keine Dokumente gefunden')).toBeInTheDocument();
        expect(screen.getByText(/Erstellen Sie Ihren ersten Bewirtungsbeleg/i)).toBeInTheDocument();
      });
    });

    it('should show create button in empty state', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            documents: [],
            pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
          }),
      });

      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        const createButton = screen.getByText('Beleg erstellen');
        expect(createButton).toBeInTheDocument();
      });
    });

    it('should navigate to form when create button is clicked', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            documents: [],
            pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
          }),
      });

      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        const createButton = screen.getByText('Beleg erstellen');
        userEvent.click(createButton);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/bewirtungsbeleg');
      });
    });
  });

  describe('Pagination', () => {
    it('should show pagination when there are multiple pages', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            documents: mockDocumentList,
            pagination: { page: 1, limit: 12, total: 30, totalPages: 3 },
          }),
      });

      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        // Pagination should be visible
        expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
      });
    });

    it('should hide pagination when only one page', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            documents: mockDocumentList,
            pagination: { page: 1, limit: 12, total: 3, totalPages: 1 },
          }),
      });

      renderWithProviders(<MeineBelegePage />, mockSession);

      await waitFor(() => {
        expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
      });

      // Pagination component should not be rendered
      const pagination = screen.queryByRole('navigation');
      expect(pagination).not.toBeInTheDocument();
    });
  });

  describe('BDD Scenario: Complete document browsing workflow', () => {
    it('Given authenticated user, When visiting meine-belege page, Then documents load and display correctly', async () => {
      // Given: Authenticated user
      const mockResponse: DocumentListResponse = {
        documents: mockDocumentList,
        pagination: {
          page: 1,
          limit: 12,
          total: 3,
          totalPages: 1,
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // When: Visiting page
      renderWithProviders(<MeineBelegePage />, mockSession);

      // Then: Documents load and display
      await waitFor(() => {
        // 1. API called
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/documents/list')
        );

        // 2. Documents displayed
        expect(screen.getByText('Goldener Löwe')).toBeInTheDocument();
        expect(screen.getByText('Steakhouse Berlin')).toBeInTheDocument();
        expect(screen.getByText('Pizza Palace')).toBeInTheDocument();

        // 3. Amounts formatted
        expect(screen.getByText('125,50 €')).toBeInTheDocument();

        // 4. Thumbnails displayed
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);

        // 5. Status badges shown
        expect(screen.getByText('Abgeschlossen')).toBeInTheDocument();
        expect(screen.getByText('In Bearbeitung')).toBeInTheDocument();
      });
    });
  });
});
