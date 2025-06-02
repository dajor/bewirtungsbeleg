import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import BewirtungsbelegForm from './BewirtungsbelegForm';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock file reader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  result: 'data:image/jpeg;base64,mockbase64',
};

Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: jest.fn(() => mockFileReader),
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('BewirtungsbelegForm', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
      blob: async () => new Blob(['mock pdf'], { type: 'application/pdf' }),
    } as Response);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render the form with all required fields', () => {
      renderWithProviders(<BewirtungsbelegForm />);
      
      // Check main title
      expect(screen.getByRole('heading', { name: /bewirtungsbeleg/i, level: 1 })).toBeInTheDocument();
      
      // Check form sections
      expect(screen.getByText(/allgemeine angaben/i)).toBeInTheDocument();
      expect(screen.getByText(/finanzielle details/i)).toBeInTheDocument();
      
      // Check key input fields
      expect(screen.getByLabelText(/datum der bewirtung/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name des restaurants/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/gesamtbetrag \(brutto\)/i)).toBeInTheDocument();
      
      // Check buttons
      expect(screen.getByRole('button', { name: /foto.*scan.*rechnung/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bewirtungsbeleg erstellen/i })).toBeInTheDocument();
    });

    it('should show Kundenbewirtung form by default', () => {
      renderWithProviders(<BewirtungsbelegForm />);
      
      const kundenbewirtungRadio = screen.getByLabelText(/kundenbewirtung/i);
      expect(kundenbewirtungRadio).toBeChecked();
      
      // Should show Geschäftspartner fields
      expect(screen.getByLabelText(/namen der geschäftspartner/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/firma der geschäftspartner/i)).toBeInTheDocument();
    });

    it('should switch to Mitarbeiterbewirtung form when selected', async () => {
      renderWithProviders(<BewirtungsbelegForm />);
      
      const mitarbeiterbewirtungRadio = screen.getByLabelText(/mitarbeiterbewirtung/i);
      await user.click(mitarbeiterbewirtungRadio);
      
      // Should not show Geschäftspartner fields
      expect(screen.queryByLabelText(/namen der geschäftspartner/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/firma der geschäftspartner/i)).not.toBeInTheDocument();
    });
  });

  describe('Image Upload and OCR', () => {
    it('should handle image upload and trigger OCR', async () => {
      renderWithProviders(<BewirtungsbelegForm />);
      
      const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
      
      // Find the hidden file input (Mantine FileInput uses a hidden input)
      const fileButton = screen.getByRole('button', { name: /foto.*scan.*rechnung/i });
      const fileInput = fileButton.parentElement?.querySelector('input[type="file"]');
      
      if (!fileInput) {
        throw new Error('File input not found');
      }
      
      // Mock successful OCR response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          restaurantName: 'Test Restaurant',
          restaurantAnschrift: 'Test Straße 123',
          gesamtbetrag: '89,50',
          mwst: '14,27',
          netto: '75,23',
          datum: '15.01.2024'
        }),
      } as Response);
      
      // Trigger file reader onload
      mockFileReader.readAsDataURL.mockImplementation(function(this: any) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: mockFileReader.result } } as any);
          }
        }, 0);
      });
      
      // Upload file by firing change event directly
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      // Wait for OCR to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/extract-receipt', expect.any(Object));
      });
      
      // Check if form fields were populated
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Restaurant')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Straße 123')).toBeInTheDocument();
        expect(screen.getByDisplayValue('89,50')).toBeInTheDocument();
      });
    });

    it('should handle OCR errors gracefully', async () => {
      renderWithProviders(<BewirtungsbelegForm />);
      
      const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
      const fileButton = screen.getByRole('button', { name: /foto.*scan.*rechnung/i });
      const fileInput = fileButton.parentElement?.querySelector('input[type="file"]');
      
      if (!fileInput) {
        throw new Error('File input not found');
      }
      
      // Mock failed OCR response
      mockFetch.mockRejectedValueOnce(new Error('OCR failed'));
      
      // Trigger file reader onload
      mockFileReader.readAsDataURL.mockImplementation(function(this: any) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: mockFileReader.result } } as any);
          }
        }, 0);
      });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      // Wait for error notification
      await waitFor(() => {
        expect(screen.getByText(/fehler beim extrahieren der daten/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields on submit', async () => {
      renderWithProviders(<BewirtungsbelegForm />);
      
      const submitButton = screen.getByRole('button', { name: /bewirtungsbeleg erstellen/i });
      await user.click(submitButton);
      
      // Check validation errors
      expect(screen.getByText(/datum ist erforderlich/i)).toBeInTheDocument();
      expect(screen.getByText(/name des restaurants ist erforderlich/i)).toBeInTheDocument();
      expect(screen.getByText(/gesamtbetrag ist erforderlich/i)).toBeInTheDocument();
    });

    it('should validate Kundenbewirtung specific fields', async () => {
      renderWithProviders(<BewirtungsbelegForm />);
      
      // Fill some fields but not Geschäftspartner fields
      await user.type(screen.getByLabelText(/name des restaurants/i), 'Test Restaurant');
      
      const submitButton = screen.getByRole('button', { name: /bewirtungsbeleg erstellen/i });
      await user.click(submitButton);
      
      // Check for Geschäftspartner validation errors
      expect(screen.getByText(/namen der geschäftspartner sind erforderlich/i)).toBeInTheDocument();
      expect(screen.getByText(/firma der geschäftspartner ist erforderlich/i)).toBeInTheDocument();
    });
  });

  describe('Amount Calculations', () => {
    it('should calculate MwSt automatically when Gesamtbetrag is entered', async () => {
      renderWithProviders(<BewirtungsbelegForm />);
      
      const gesamtbetragInput = screen.getByLabelText(/gesamtbetrag \(brutto\)/i);
      await user.clear(gesamtbetragInput);
      await user.type(gesamtbetragInput, '119');
      
      // Trigger blur to calculate
      fireEvent.blur(gesamtbetragInput);
      
      // Check if MwSt was calculated (19% of 119 = 19.00 in German VAT calculation)
      await waitFor(() => {
        const mwstInput = screen.getByLabelText(/mwst\. gesamtbetrag/i) as HTMLInputElement;
        expect(mwstInput.value).toBe('19,00');
      });
      
      // Check if Netto was calculated
      await waitFor(() => {
        const nettoInput = screen.getByLabelText(/netto gesamtbetrag/i) as HTMLInputElement;
        expect(nettoInput.value).toBe('100,00');
      });
    });

    it('should calculate tip tax when tip is entered', async () => {
      renderWithProviders(<BewirtungsbelegForm />);
      
      const trinkgeldInput = screen.getByLabelText(/^trinkgeld$/i);
      await user.clear(trinkgeldInput);
      await user.type(trinkgeldInput, '11,90');
      
      // Trigger blur to calculate
      fireEvent.blur(trinkgeldInput);
      
      // Check if tip MwSt was calculated
      await waitFor(() => {
        const tipMwstInput = screen.getByLabelText(/mwst\. trinkgeld/i) as HTMLInputElement;
        expect(tipMwstInput.value).toBe('1,90');
      });
    });

    it('should calculate credit card amount as sum of total and tip', async () => {
      renderWithProviders(<BewirtungsbelegForm />);
      
      // Set total amount
      const gesamtbetragInput = screen.getByLabelText(/gesamtbetrag \(brutto\)/i);
      await user.clear(gesamtbetragInput);
      await user.type(gesamtbetragInput, '100,00');
      fireEvent.blur(gesamtbetragInput);
      
      // Set tip
      const trinkgeldInput = screen.getByLabelText(/^trinkgeld$/i);
      await user.clear(trinkgeldInput);
      await user.type(trinkgeldInput, '10,00');
      fireEvent.blur(trinkgeldInput);
      
      // Check credit card amount
      await waitFor(() => {
        const kreditkartenInput = screen.getByLabelText(/betrag auf kreditkarte/i) as HTMLInputElement;
        expect(kreditkartenInput.value).toBe('110,00');
      });
    });
  });

  describe('Foreign Currency Support', () => {
    it('should show currency field when foreign receipt is selected', async () => {
      renderWithProviders(<BewirtungsbelegForm />);
      
      const foreignCheckbox = screen.getByLabelText(/ausländische rechnung/i);
      await user.click(foreignCheckbox);
      
      // Currency field should appear
      expect(screen.getByLabelText(/währung/i)).toBeInTheDocument();
      
      // MwSt fields should be hidden
      expect(screen.queryByLabelText(/mwst\. gesamtbetrag/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/netto gesamtbetrag/i)).not.toBeInTheDocument();
    });
  });

  describe('PDF Generation', () => {
    it('should generate PDF with form data', async () => {
      renderWithProviders(<BewirtungsbelegForm />);
      
      // Fill required fields
      const dateInput = screen.getByLabelText(/datum/i);
      await user.type(dateInput, '15.01.2024');
      
      await user.type(screen.getByLabelText(/name des restaurants/i), 'Test Restaurant');
      await user.type(screen.getByLabelText(/anschrift des restaurants/i), 'Test Straße 123');
      await user.type(screen.getByLabelText(/teilnehmer/i), 'Max Mustermann, Erika Musterfrau');
      await user.type(screen.getByLabelText(/anlass/i), 'Geschäftsessen');
      await user.type(screen.getByLabelText(/gesamtbetrag/i), '119,00');
      await user.type(screen.getByLabelText(/geschäftlicher anlass/i), 'Projektbesprechung');
      await user.type(screen.getByLabelText(/namen der geschäftspartner/i), 'Max Mustermann');
      await user.type(screen.getByLabelText(/firma der geschäftspartner/i), 'ABC GmbH');
      
      // Mock successful PDF generation
      const mockBlob = new Blob(['mock pdf'], { type: 'application/pdf' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
        headers: {
          get: () => 'attachment; filename="bewirtungsbeleg.pdf"',
        },
      } as Response);
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /bewirtungsbeleg erstellen/i });
      await user.click(submitButton);
      
      // Wait for PDF generation
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/generate-pdf', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test Restaurant'),
        }));
      });
      
      // Check success message
      await waitFor(() => {
        expect(screen.getByText(/pdf wurde erfolgreich erstellt/i)).toBeInTheDocument();
      });
    });

    it('should handle PDF generation errors', async () => {
      renderWithProviders(<BewirtungsbelegForm />);
      
      // Fill minimum required fields
      const dateInput = screen.getByLabelText(/datum/i);
      await user.type(dateInput, '15.01.2024');
      await user.type(screen.getByLabelText(/name des restaurants/i), 'Test');
      await user.type(screen.getByLabelText(/teilnehmer/i), 'Test');
      await user.type(screen.getByLabelText(/anlass/i), 'Test');
      await user.type(screen.getByLabelText(/gesamtbetrag/i), '50');
      await user.type(screen.getByLabelText(/geschäftlicher anlass/i), 'Test');
      await user.type(screen.getByLabelText(/namen der geschäftspartner/i), 'Test');
      await user.type(screen.getByLabelText(/firma der geschäftspartner/i), 'Test');
      
      // Mock failed PDF generation
      mockFetch.mockRejectedValueOnce(new Error('PDF generation failed'));
      
      const submitButton = screen.getByRole('button', { name: /bewirtungsbeleg erstellen/i });
      await user.click(submitButton);
      
      // Check error message
      await waitFor(() => {
        expect(screen.getByText(/fehler beim erstellen des pdfs/i)).toBeInTheDocument();
      });
    });
  });

  describe('Receipt Type Classification', () => {
    it('should classify receipt type when image is uploaded', async () => {
      renderWithProviders(<BewirtungsbelegForm />);
      
      const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
      const fileButton = screen.getByRole('button', { name: /foto.*scan.*rechnung/i });
      const fileInput = fileButton.parentElement?.querySelector('input[type="file"]');
      
      if (!fileInput) {
        throw new Error('File input not found');
      }
      
      // Mock classification response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            type: 'rechnung',
            confidence: 0.95,
            reason: 'Enthält typische Rechnungsmerkmale'
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            restaurantName: 'Test Restaurant',
            gesamtbetrag: '50,00',
            datum: '15.01.2024'
          }),
        } as Response);
      
      // Trigger file reader onload
      mockFileReader.readAsDataURL.mockImplementation(function(this: any) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: mockFileReader.result } } as any);
          }
        }, 0);
      });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      // Should call classify endpoint
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/classify-receipt', expect.any(Object));
      });
    });
  });

  describe('Payment Method Selection', () => {
    it('should show all payment method options', () => {
      renderWithProviders(<BewirtungsbelegForm />);
      
      const zahlungsartSelect = screen.getByLabelText(/zahlungsart/i);
      fireEvent.click(zahlungsartSelect);
      
      expect(screen.getByText('Firmenkreditkarte')).toBeInTheDocument();
      expect(screen.getByText('Private Kreditkarte')).toBeInTheDocument();
      expect(screen.getByText('Bar')).toBeInTheDocument();
    });
  });
});