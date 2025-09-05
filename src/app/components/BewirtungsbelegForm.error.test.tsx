/**
 * Unit tests for BewirtungsbelegForm error handling
 * Tests that errors are properly cleared when files are removed
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BewirtungsbelegForm from './BewirtungsbelegForm';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import 'dayjs/locale/de';

// Mock fetch globally
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  onload: jest.fn(),
  onerror: jest.fn(),
  result: 'data:image/png;base64,mockbase64data'
};

(global as any).FileReader = jest.fn(() => mockFileReader);

// Helper to wrap component with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      <DatesProvider settings={{ locale: 'de' }}>
        {component}
      </DatesProvider>
    </MantineProvider>
  );
};

describe('BewirtungsbelegForm Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('File Removal Error Clearing', () => {
    it('should clear error message when all files are removed', async () => {
      renderWithProviders(<BewirtungsbelegForm />);

      // Find the file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      // Create a PDF file
      const pdfFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
      
      // Upload the PDF file
      Object.defineProperty(fileInput, 'files', {
        value: [pdfFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      // Wait for file to be processed
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      // PDFs should not trigger OCR extraction error anymore
      // Check that no error is shown initially
      expect(screen.queryByText(/PDF-Dateien können nicht automatisch ausgelesen werden/)).not.toBeInTheDocument();

      // Remove the file
      const removeButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('[data-testid="remove-file"]') || 
        btn.className.includes('ActionIcon') ||
        btn.getAttribute('aria-label')?.includes('remove')
      );
      
      if (removeButton) {
        fireEvent.click(removeButton);
      }

      // Wait for file to be removed
      await waitFor(() => {
        expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
      });

      // Verify no error is shown after removal
      expect(screen.queryByText(/PDF-Dateien können nicht automatisch ausgelesen werden/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Fehler/)).not.toBeInTheDocument();
    });

    it('should not show OCR error for PDF files', async () => {
      renderWithProviders(<BewirtungsbelegForm />);

      // Find the file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Create and upload a PDF file
      const pdfFile = new File(['pdf content'], 'receipt.pdf', { type: 'application/pdf' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [pdfFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      // Wait for file to appear
      await waitFor(() => {
        expect(screen.getByText('receipt.pdf')).toBeInTheDocument();
      });

      // Verify no OCR error is shown for PDFs
      expect(screen.queryByText(/PDF-Dateien können nicht automatisch ausgelesen werden/)).not.toBeInTheDocument();
      
      // The extractDataFromImage function should not be called for PDFs
      expect(global.fetch).not.toHaveBeenCalledWith(
        '/api/extract-receipt',
        expect.anything()
      );
    });

    it('should handle image files without errors', async () => {
      // Mock successful OCR response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          restaurantName: 'Test Restaurant',
          gesamtbetrag: '50.00',
          datum: '01.01.2024'
        })
      });

      renderWithProviders(<BewirtungsbelegForm />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Create and upload an image file
      const imageFile = new File(['image content'], 'receipt.png', { type: 'image/png' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [imageFile],
        writable: false,
      });
      
      // Mock FileReader for image preview
      mockFileReader.readAsDataURL.mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onload) {
            mockFileReader.onload({ target: { result: mockFileReader.result } });
          }
        }, 0);
      });
      
      fireEvent.change(fileInput);

      // Wait for file to appear
      await waitFor(() => {
        expect(screen.getByText('receipt.png')).toBeInTheDocument();
      });

      // OCR should be called for image files
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/extract-receipt',
          expect.objectContaining({
            method: 'POST',
            body: expect.any(FormData)
          })
        );
      });

      // No error should be shown
      expect(screen.queryByText(/Fehler/)).not.toBeInTheDocument();
    });

    it('should clear errors when switching from error state to new file', async () => {
      // First, mock a failed OCR response
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<BewirtungsbelegForm />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Upload an image that will fail
      const imageFile = new File(['image'], 'bad.png', { type: 'image/png' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [imageFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/Fehler bei der Verarbeitung/)).toBeInTheDocument();
      });

      // Remove the file
      const removeButtons = screen.getAllByRole('button');
      const removeButton = removeButtons.find(btn => 
        btn.querySelector('svg') || btn.getAttribute('aria-label')?.includes('remove')
      );
      
      if (removeButton) {
        fireEvent.click(removeButton);
      }

      // Error should be cleared when file is removed
      await waitFor(() => {
        expect(screen.queryByText(/Fehler bei der Verarbeitung/)).not.toBeInTheDocument();
      });
    });
  });

  describe('PDF Handling', () => {
    it('should not attempt OCR extraction for PDF files', async () => {
      renderWithProviders(<BewirtungsbelegForm />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Upload multiple files including PDFs
      const files = [
        new File(['pdf1'], 'doc1.pdf', { type: 'application/pdf' }),
        new File(['pdf2'], 'doc2.pdf', { type: 'application/pdf' }),
        new File(['image'], 'photo.jpg', { type: 'image/jpeg' })
      ];
      
      // Upload first PDF
      Object.defineProperty(fileInput, 'files', {
        value: [files[0]],
        writable: false,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('doc1.pdf')).toBeInTheDocument();
      });

      // Upload second PDF
      Object.defineProperty(fileInput, 'files', {
        value: [files[1]],
        writable: false,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('doc2.pdf')).toBeInTheDocument();
      });

      // Mock successful OCR for image
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ restaurantName: 'Test' })
      });

      // Upload image
      Object.defineProperty(fileInput, 'files', {
        value: [files[2]],
        writable: false,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('photo.jpg')).toBeInTheDocument();
      });

      // Only the image should trigger OCR
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // No errors should be shown
      expect(screen.queryByText(/PDF-Dateien können nicht automatisch ausgelesen werden/)).not.toBeInTheDocument();
    });
  });
});