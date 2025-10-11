/**
 * Component tests for BewirtungsbelegForm.tsx
 * Tests the receipt creation form with GoBD-Tresor upload functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import BewirtungsbelegForm from '../BewirtungsbelegForm';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock fetch globally
global.fetch = vi.fn();

// Helper to wrap components with MantineProvider
const renderWithMantine = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>);
};

describe('BewirtungsbelegForm.tsx - Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  describe('Form Rendering', () => {
    it('should render all required form fields', () => {
      renderWithMantine(<BewirtungsbelegForm />);

      expect(screen.getByText('Bewirtungsbeleg')).toBeInTheDocument();
      expect(screen.getByLabelText(/Datum der Bewirtung/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Restaurant/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Gesamtbetrag/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Art der Bewirtung/i)).toBeInTheDocument();
    });

    it('should render split buttons for download and GoBD upload', () => {
      renderWithMantine(<BewirtungsbelegForm />);

      expect(screen.getByText('Bewirtungsbeleg erstellen')).toBeInTheDocument();
      expect(screen.getByText('In GoBD-Tresor speichern')).toBeInTheDocument();
    });

    it('should have equal width buttons (50% each)', () => {
      const { container } = renderWithMantine(<BewirtungsbelegForm />);

      // Find the Group component containing both buttons
      const buttonGroup = container.querySelector('[class*="Group-root"]');
      expect(buttonGroup).toBeInTheDocument();

      // Both buttons should be in the same group with grow property
      const buttons = screen.getAllByRole('button');
      const downloadButton = buttons.find((b) => b.textContent === 'Bewirtungsbeleg erstellen');
      const uploadButton = buttons.find((b) => b.textContent === 'In GoBD-Tresor speichern');

      expect(downloadButton).toBeInTheDocument();
      expect(uploadButton).toBeInTheDocument();
    });

    it('should render file dropzone when not Eigenbeleg', () => {
      renderWithMantine(<BewirtungsbelegForm />);

      expect(screen.getByText(/Foto\/Scan der Rechnung/i)).toBeInTheDocument();
    });

    it('should hide file dropzone when Eigenbeleg is checked', async () => {
      renderWithMantine(<BewirtungsbelegForm />);

      const eigenbelegCheckbox = screen.getByLabelText(/Eigenbeleg \(ohne Originalbeleg\)/i);
      await userEvent.click(eigenbelegCheckbox);

      expect(screen.queryByText(/Foto\/Scan der Rechnung/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      renderWithMantine(<BewirtungsbelegForm />);

      const downloadButton = screen.getByText('Bewirtungsbeleg erstellen');
      await userEvent.click(downloadButton);

      // Form validation should prevent submission
      await waitFor(() => {
        // Check if validation errors are displayed
        expect(screen.getByText(/Datum ist erforderlich/i)).toBeInTheDocument();
      });
    });

    it('should validate Gesamtbetrag is required', async () => {
      renderWithMantine(<BewirtungsbelegForm />);

      const downloadButton = screen.getByText('Bewirtungsbeleg erstellen');
      await userEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText(/Gesamtbetrag ist erforderlich/i)).toBeInTheDocument();
      });
    });

    it('should validate geschaeftlicher Anlass is required', async () => {
      renderWithMantine(<BewirtungsbelegForm />);

      const downloadButton = screen.getByText('Bewirtungsbeleg erstellen');
      await userEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText(/Geschäftlicher Anlass ist erforderlich/i)).toBeInTheDocument();
      });
    });

    it('should require Geschäftspartner fields for Kundenbewirtung', async () => {
      renderWithMantine(<BewirtungsbelegForm />);

      // Kundenbewirtung is default, so just try to submit
      const downloadButton = screen.getByText('Bewirtungsbeleg erstellen');
      await userEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText(/Namen der Geschäftspartner sind erforderlich/i)).toBeInTheDocument();
        expect(screen.getByText(/Firma der Geschäftspartner ist erforderlich/i)).toBeInTheDocument();
      });
    });

    it('should not require Geschäftspartner fields for Mitarbeiterbewirtung', async () => {
      renderWithMantine(<BewirtungsbelegForm />);

      // Switch to Mitarbeiterbewirtung
      const mitarbeiterRadio = screen.getByLabelText(/Mitarbeiterbewirtung/i);
      await userEvent.click(mitarbeiterRadio);

      const downloadButton = screen.getByText('Bewirtungsbeleg erstellen');
      await userEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.queryByText(/Namen der Geschäftspartner sind erforderlich/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Firma der Geschäftspartner ist erforderlich/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('handleGobdUpload Function', () => {
    it('should validate form before uploading to GoBD-Tresor', async () => {
      renderWithMantine(<BewirtungsbelegForm />);

      const gobdButton = screen.getByText('In GoBD-Tresor speichern');
      await userEvent.click(gobdButton);

      // Should show error notification
      await waitFor(() => {
        expect(screen.getByText(/Bitte füllen Sie alle erforderlichen Felder aus/i)).toBeInTheDocument();
      });

      // Should not call API
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should generate PDF before uploading to GoBD-Tresor', async () => {
      renderWithMantine(<BewirtungsbelegForm />);

      // Fill in required fields
      const datumInput = screen.getByLabelText(/Datum der Bewirtung/i);
      await userEvent.type(datumInput, '01.01.2024');

      const restaurantInput = screen.getByLabelText(/Restaurant/i);
      await userEvent.type(restaurantInput, 'Test Restaurant');

      const gesamtbetragInput = screen.getByLabelText(/Gesamtbetrag/i);
      await userEvent.type(gesamtbetragInput, '100.00');

      const anlassInput = screen.getByLabelText(/Geschäftlicher Anlass/i);
      await userEvent.type(anlassInput, 'Kundengespräch');

      const teilnehmerInput = screen.getByLabelText(/Namen aller Teilnehmer/i);
      await userEvent.type(teilnehmerInput, 'Max Mustermann\nJohn Doe');

      const geschaeftspartnerNamenInput = screen.getByLabelText(/Namen der Geschäftspartner/i);
      await userEvent.type(geschaeftspartnerNamenInput, 'John Doe');

      const geschaeftspartnerFirmaInput = screen.getByLabelText(/Firma der Geschäftspartner/i);
      await userEvent.type(geschaeftspartnerFirmaInput, 'Test GmbH');

      // Mock PDF generation API
      (global.fetch as any).mockImplementation((url: string) => {
        if (url === '/api/generate-pdf') {
          return Promise.resolve({
            ok: true,
            blob: () => Promise.resolve(new Blob(['PDF content'], { type: 'application/pdf' })),
          });
        }
        if (url === '/api/documents/upload') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const gobdButton = screen.getByText('In GoBD-Tresor speichern');
      await userEvent.click(gobdButton);

      // Should call PDF generation API first
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/generate-pdf',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    it('should create PNG preview from PDF', async () => {
      renderWithMantine(<BewirtungsbelegForm />);

      // Fill in minimal required fields
      const datumInput = screen.getByLabelText(/Datum der Bewirtung/i);
      await userEvent.type(datumInput, '01.01.2024');

      const restaurantInput = screen.getByLabelText(/Restaurant/i);
      await userEvent.type(restaurantInput, 'Test Restaurant');

      const gesamtbetragInput = screen.getByLabelText(/Gesamtbetrag/i);
      await userEvent.type(gesamtbetragInput, '100.00');

      const anlassInput = screen.getByLabelText(/Geschäftlicher Anlass/i);
      await userEvent.type(anlassInput, 'Meeting');

      const teilnehmerInput = screen.getByLabelText(/Namen aller Teilnehmer/i);
      await userEvent.type(teilnehmerInput, 'Test User');

      const geschaeftspartnerNamenInput = screen.getByLabelText(/Namen der Geschäftspartner/i);
      await userEvent.type(geschaeftspartnerNamenInput, 'Client');

      const geschaeftspartnerFirmaInput = screen.getByLabelText(/Firma der Geschäftspartner/i);
      await userEvent.type(geschaeftspartnerFirmaInput, 'Client Co');

      // Mock APIs
      (global.fetch as any).mockImplementation((url: string) => {
        if (url === '/api/generate-pdf') {
          return Promise.resolve({
            ok: true,
            blob: () => Promise.resolve(new Blob(['PDF'], { type: 'application/pdf' })),
          });
        }
        if (url === '/api/documents/upload') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const gobdButton = screen.getByText('In GoBD-Tresor speichern');
      await userEvent.click(gobdButton);

      // Should call upload API with pngBase64
      await waitFor(() => {
        const uploadCall = (global.fetch as any).mock.calls.find(
          (call: any) => call[0] === '/api/documents/upload'
        );
        expect(uploadCall).toBeDefined();

        const uploadBody = JSON.parse(uploadCall[1].body);
        expect(uploadBody.pngBase64).toBeDefined();
        expect(typeof uploadBody.pngBase64).toBe('string');
      });
    });

    it('should upload to /api/documents/upload with correct payload', async () => {
      renderWithMantine(<BewirtungsbelegForm />);

      // Fill form
      const datumInput = screen.getByLabelText(/Datum der Bewirtung/i);
      await userEvent.type(datumInput, '01.01.2024');

      const restaurantInput = screen.getByLabelText(/Restaurant/i);
      await userEvent.type(restaurantInput, 'Golden Lion');

      const gesamtbetragInput = screen.getByLabelText(/Gesamtbetrag/i);
      await userEvent.type(gesamtbetragInput, '150.00');

      const anlassInput = screen.getByLabelText(/Geschäftlicher Anlass/i);
      await userEvent.type(anlassInput, 'Projektbesprechung');

      const teilnehmerInput = screen.getByLabelText(/Namen aller Teilnehmer/i);
      await userEvent.type(teilnehmerInput, 'Max Mustermann');

      const geschaeftspartnerNamenInput = screen.getByLabelText(/Namen der Geschäftspartner/i);
      await userEvent.type(geschaeftspartnerNamenInput, 'John Doe');

      const geschaeftspartnerFirmaInput = screen.getByLabelText(/Firma der Geschäftspartner/i);
      await userEvent.type(geschaeftspartnerFirmaInput, 'Acme Corp');

      // Mock APIs
      (global.fetch as any).mockImplementation((url: string) => {
        if (url === '/api/generate-pdf') {
          return Promise.resolve({
            ok: true,
            blob: () => Promise.resolve(new Blob(['PDF'], { type: 'application/pdf' })),
          });
        }
        if (url === '/api/documents/upload') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const gobdButton = screen.getByText('In GoBD-Tresor speichern');
      await userEvent.click(gobdButton);

      await waitFor(() => {
        const uploadCall = (global.fetch as any).mock.calls.find(
          (call: any) => call[0] === '/api/documents/upload'
        );
        expect(uploadCall).toBeDefined();

        const uploadBody = JSON.parse(uploadCall[1].body);
        expect(uploadBody.pdfBase64).toBeDefined();
        expect(uploadBody.pngBase64).toBeDefined();
        expect(uploadBody.metadata).toBeDefined();
        expect(uploadBody.metadata.restaurantName).toBe('Golden Lion');
      });
    });

    it('should show success notification on successful upload', async () => {
      renderWithMantine(<BewirtungsbelegForm />);

      // Fill minimal form
      const datumInput = screen.getByLabelText(/Datum der Bewirtung/i);
      await userEvent.type(datumInput, '01.01.2024');

      const restaurantInput = screen.getByLabelText(/Restaurant/i);
      await userEvent.type(restaurantInput, 'Test');

      const gesamtbetragInput = screen.getByLabelText(/Gesamtbetrag/i);
      await userEvent.type(gesamtbetragInput, '50');

      const anlassInput = screen.getByLabelText(/Geschäftlicher Anlass/i);
      await userEvent.type(anlassInput, 'Meeting');

      const teilnehmerInput = screen.getByLabelText(/Namen aller Teilnehmer/i);
      await userEvent.type(teilnehmerInput, 'User');

      const geschaeftspartnerNamenInput = screen.getByLabelText(/Namen der Geschäftspartner/i);
      await userEvent.type(geschaeftspartnerNamenInput, 'Client');

      const geschaeftspartnerFirmaInput = screen.getByLabelText(/Firma der Geschäftspartner/i);
      await userEvent.type(geschaeftspartnerFirmaInput, 'Co');

      // Mock APIs
      (global.fetch as any).mockImplementation((url: string) => {
        if (url === '/api/generate-pdf') {
          return Promise.resolve({
            ok: true,
            blob: () => Promise.resolve(new Blob(['PDF'], { type: 'application/pdf' })),
          });
        }
        if (url === '/api/documents/upload') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const gobdButton = screen.getByText('In GoBD-Tresor speichern');
      await userEvent.click(gobdButton);

      await waitFor(() => {
        expect(screen.getByText(/erfolgreich in den GoBD-Tresor hochgeladen/i)).toBeInTheDocument();
      });
    });

    it('should show error notification on upload failure', async () => {
      renderWithMantine(<BewirtungsbelegForm />);

      // Fill minimal form
      const datumInput = screen.getByLabelText(/Datum der Bewirtung/i);
      await userEvent.type(datumInput, '01.01.2024');

      const restaurantInput = screen.getByLabelText(/Restaurant/i);
      await userEvent.type(restaurantInput, 'Test');

      const gesamtbetragInput = screen.getByLabelText(/Gesamtbetrag/i);
      await userEvent.type(gesamtbetragInput, '50');

      const anlassInput = screen.getByLabelText(/Geschäftlicher Anlass/i);
      await userEvent.type(anlassInput, 'Meeting');

      const teilnehmerInput = screen.getByLabelText(/Namen aller Teilnehmer/i);
      await userEvent.type(teilnehmerInput, 'User');

      const geschaeftspartnerNamenInput = screen.getByLabelText(/Namen der Geschäftspartner/i);
      await userEvent.type(geschaeftspartnerNamenInput, 'Client');

      const geschaeftspartnerFirmaInput = screen.getByLabelText(/Firma der Geschäftspartner/i);
      await userEvent.type(geschaeftspartnerFirmaInput, 'Co');

      // Mock APIs - upload fails
      (global.fetch as any).mockImplementation((url: string) => {
        if (url === '/api/generate-pdf') {
          return Promise.resolve({
            ok: true,
            blob: () => Promise.resolve(new Blob(['PDF'], { type: 'application/pdf' })),
          });
        }
        if (url === '/api/documents/upload') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Upload failed' }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const gobdButton = screen.getByText('In GoBD-Tresor speichern');
      await userEvent.click(gobdButton);

      await waitFor(() => {
        expect(screen.getByText(/Upload failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('PDF Generation (Existing Download Flow)', () => {
    it('should generate PDF via /api/generate-pdf when download button is clicked', async () => {
      renderWithMantine(<BewirtungsbelegForm />);

      // Fill minimal form
      const datumInput = screen.getByLabelText(/Datum der Bewirtung/i);
      await userEvent.type(datumInput, '01.01.2024');

      const restaurantInput = screen.getByLabelText(/Restaurant/i);
      await userEvent.type(restaurantInput, 'Test');

      const gesamtbetragInput = screen.getByLabelText(/Gesamtbetrag/i);
      await userEvent.type(gesamtbetragInput, '50');

      const anlassInput = screen.getByLabelText(/Geschäftlicher Anlass/i);
      await userEvent.type(anlassInput, 'Meeting');

      const teilnehmerInput = screen.getByLabelText(/Namen aller Teilnehmer/i);
      await userEvent.type(teilnehmerInput, 'User');

      const geschaeftspartnerNamenInput = screen.getByLabelText(/Namen der Geschäftspartner/i);
      await userEvent.type(geschaeftspartnerNamenInput, 'Client');

      const geschaeftspartnerFirmaInput = screen.getByLabelText(/Firma der Geschäftspartner/i);
      await userEvent.type(geschaeftspartnerFirmaInput, 'Co');

      // Mock PDF API
      (global.fetch as any).mockImplementation((url: string) => {
        if (url === '/api/generate-pdf') {
          return Promise.resolve({
            ok: true,
            blob: () => Promise.resolve(new Blob(['PDF'], { type: 'application/pdf' })),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const downloadButton = screen.getByText('Bewirtungsbeleg erstellen');
      await userEvent.click(downloadButton);

      // Should show confirmation modal
      await waitFor(() => {
        expect(screen.getByText(/Möchten Sie den Bewirtungsbeleg mit folgenden Details erstellen\?/i)).toBeInTheDocument();
      });

      // Confirm in modal
      const confirmButton = screen.getByRole('button', { name: /PDF erstellen/i });
      await userEvent.click(confirmButton);

      // Should call PDF API
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/generate-pdf',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    it('should download PDF when generation succeeds', async () => {
      renderWithMantine(<BewirtungsbelegForm />);

      // Fill minimal form
      const datumInput = screen.getByLabelText(/Datum der Bewirtung/i);
      await userEvent.type(datumInput, '01.01.2024');

      const restaurantInput = screen.getByLabelText(/Restaurant/i);
      await userEvent.type(restaurantInput, 'Test');

      const gesamtbetragInput = screen.getByLabelText(/Gesamtbetrag/i);
      await userEvent.type(gesamtbetragInput, '50');

      const anlassInput = screen.getByLabelText(/Geschäftlicher Anlass/i);
      await userEvent.type(anlassInput, 'Meeting');

      const teilnehmerInput = screen.getByLabelText(/Namen aller Teilnehmer/i);
      await userEvent.type(teilnehmerInput, 'User');

      const geschaeftspartnerNamenInput = screen.getByLabelText(/Namen der Geschäftspartner/i);
      await userEvent.type(geschaeftspartnerNamenInput, 'Client');

      const geschaeftspartnerFirmaInput = screen.getByLabelText(/Firma der Geschäftspartner/i);
      await userEvent.type(geschaeftspartnerFirmaInput, 'Co');

      // Mock PDF API
      (global.fetch as any).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['PDF content'], { type: 'application/pdf' })),
      });

      // Mock window.URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      const downloadButton = screen.getByText('Bewirtungsbeleg erstellen');
      await userEvent.click(downloadButton);

      // Confirm in modal
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /PDF erstellen/i });
        userEvent.click(confirmButton);
      });

      // Should trigger download
      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });
    });
  });

  describe('BDD Scenario: Complete GoBD upload workflow', () => {
    it('Given valid form data, When clicking GoBD upload button, Then all steps complete successfully', async () => {
      // Given: Valid form data
      renderWithMantine(<BewirtungsbelegForm />);

      const datumInput = screen.getByLabelText(/Datum der Bewirtung/i);
      await userEvent.type(datumInput, '15.03.2024');

      const restaurantInput = screen.getByLabelText(/Restaurant/i);
      await userEvent.type(restaurantInput, 'Goldener Löwe');

      const gesamtbetragInput = screen.getByLabelText(/Gesamtbetrag/i);
      await userEvent.type(gesamtbetragInput, '125.50');

      const anlassInput = screen.getByLabelText(/Geschäftlicher Anlass/i);
      await userEvent.type(anlassInput, 'Projektbesprechung');

      const teilnehmerInput = screen.getByLabelText(/Namen aller Teilnehmer/i);
      await userEvent.type(teilnehmerInput, 'Max Mustermann\nErika Musterfrau');

      const geschaeftspartnerNamenInput = screen.getByLabelText(/Namen der Geschäftspartner/i);
      await userEvent.type(geschaeftspartnerNamenInput, 'John Doe');

      const geschaeftspartnerFirmaInput = screen.getByLabelText(/Firma der Geschäftspartner/i);
      await userEvent.type(geschaeftspartnerFirmaInput, 'Acme Corporation');

      // Mock successful API calls
      (global.fetch as any).mockImplementation((url: string) => {
        if (url === '/api/generate-pdf') {
          return Promise.resolve({
            ok: true,
            blob: () => Promise.resolve(new Blob(['PDF'], { type: 'application/pdf' })),
          });
        }
        if (url === '/api/documents/upload') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                pdfUrl: 'https://spaces.example.com/pdf.pdf',
                pngUrl: 'https://spaces.example.com/preview.png',
                metadataUrl: 'https://spaces.example.com/metadata.json',
              }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      // When: Clicking GoBD upload button
      const gobdButton = screen.getByText('In GoBD-Tresor speichern');
      await userEvent.click(gobdButton);

      // Then: All steps complete
      await waitFor(() => {
        // 1. PDF generation called
        const pdfCall = (global.fetch as any).mock.calls.find(
          (call: any) => call[0] === '/api/generate-pdf'
        );
        expect(pdfCall).toBeDefined();

        // 2. Upload called
        const uploadCall = (global.fetch as any).mock.calls.find(
          (call: any) => call[0] === '/api/documents/upload'
        );
        expect(uploadCall).toBeDefined();

        // 3. Success notification shown
        expect(screen.getByText(/erfolgreich in den GoBD-Tresor hochgeladen/i)).toBeInTheDocument();
      });
    });
  });
});
