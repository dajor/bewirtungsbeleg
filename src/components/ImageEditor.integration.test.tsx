/**
 * Integration tests for ImageEditor PDF to Image conversion and preview functionality
 * Tests the complete workflow from PDF upload to image display in the preview
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImageEditor } from './ImageEditor';
import { MantineProvider } from '@mantine/core';

// Mock the ImageProcessor module
jest.mock('@/lib/image-processor', () => ({
  ImageProcessor: {
    rotateImage: jest.fn().mockResolvedValue('data:image/png;base64,rotatedImageData'),
    deskewImage: jest.fn().mockResolvedValue('data:image/png;base64,deskewedImageData'),
    processImage: jest.fn().mockResolvedValue('data:image/png;base64,processedImageData'),
  }
}));

// Helper to wrap component with MantineProvider
const renderWithMantine = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-image-url');
global.URL.revokeObjectURL = jest.fn();

// Mock fetch for PDF conversion API
global.fetch = jest.fn();

describe.skip('ImageEditor - PDF to Image Conversion Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('PDF Upload and Preview Display', () => {
    it('should convert PDF and display image preview in receipt panel', async () => {
      const pdfFile = new File(['pdf content'], '07042025_RISTORANTE.pdf', { 
        type: 'application/pdf' 
      });

      // Mock successful PDF conversion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          pageCount: 1,
          allPages: [{
            pageNumber: 1,
            data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            name: '07042025_RISTORANTE.pdf'
          }]
        })
      });

      const onImageUpdate = jest.fn();
      
      await act(async () => {
        renderWithMantine(
          <ImageEditor file={pdfFile} onImageUpdate={onImageUpdate} />
        );
      });

      // Initially should show converting message
      expect(screen.getByText('Converting PDF...')).toBeInTheDocument();
      expect(screen.getByText('07042025_RISTORANTE.pdf')).toBeInTheDocument();

      // Wait for conversion to complete
      await act(async () => {
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/convert-pdf',
            expect.objectContaining({
              method: 'POST',
              body: expect.any(FormData)
            })
          );
        }, { timeout: 3000 });
      });

      // After conversion, image should be displayed
      await act(async () => {
        await waitFor(() => {
          const image = screen.getByAltText('Receipt preview');
          expect(image).toBeInTheDocument();
          expect(image).toHaveAttribute('src', expect.stringContaining('data:image/png;base64,'));
        }, { timeout: 3000 });
      });

      // Converting message should be gone
      expect(screen.queryByText('Converting PDF...')).not.toBeInTheDocument();

      // Image Editor title should be visible
      expect(screen.getByText('Image Editor')).toBeInTheDocument();
    });

    it('should enable rotation controls after successful PDF conversion', async () => {
      const pdfFile = new File(['pdf content'], 'restaurant-receipt.pdf', { 
        type: 'application/pdf' 
      });

      // Mock successful conversion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          pageCount: 1
        })
      });

      await act(async () => {
        renderWithMantine(<ImageEditor file={pdfFile} />);
      });

      // Initially rotation controls should be disabled (no originalUrl yet)
      expect(screen.getByTestId('rotate-left-90')).toBeDisabled();
      expect(screen.getByTestId('rotate-right-90')).toBeDisabled();
      expect(screen.getByTestId('deskew-button')).toBeDisabled();
      
      // Slider disabled state is handled by Mantine differently - check attribute
      const slider = screen.getByTestId('rotation-slider');
      expect(slider).toHaveAttribute('tabindex', '-1'); // Mantine's way of showing disabled

      // Wait for conversion to complete
      await act(async () => {
        await waitFor(() => {
          expect(screen.queryByText('Converting PDF...')).not.toBeInTheDocument();
        }, { timeout: 3000 });
      });

      // After conversion, rotation controls should be enabled
      expect(screen.getByTestId('rotate-left-90')).not.toBeDisabled();
      expect(screen.getByTestId('rotate-right-90')).not.toBeDisabled();
      expect(screen.getByTestId('deskew-button')).not.toBeDisabled();
      expect(screen.getByTestId('rotation-slider')).not.toBeDisabled();
    });

    it('should handle PDF rotation correctly after conversion', async () => {
      const pdfFile = new File(['pdf content'], 'test-receipt.pdf', { 
        type: 'application/pdf' 
      });

      const baseImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      // Mock successful conversion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          image: baseImage,
          pageCount: 1
        })
      });

      const onImageUpdate = jest.fn();
      
      await act(async () => {
        renderWithMantine(
          <ImageEditor file={pdfFile} onImageUpdate={onImageUpdate} />
        );
      });

      // Wait for conversion to complete
      await waitFor(() => {
        expect(screen.queryByText('Converting PDF...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // No need to mock fetch for data URL conversion anymore - using direct blob conversion

      // Click rotate right button
      await act(async () => {
        fireEvent.click(screen.getByTestId('rotate-right-90'));
      });

      // Wait for rotation to complete
      await waitFor(() => {
        const { ImageProcessor } = require('@/lib/image-processor');
        expect(ImageProcessor.rotateImage).toHaveBeenCalledWith(
          expect.any(File),
          90
        );
      }, { timeout: 3000 });

      // Should show "Edited" badge
      await waitFor(() => {
        expect(screen.getByText('Edited')).toBeInTheDocument();
      });

      // Should call onImageUpdate callback
      expect(onImageUpdate).toHaveBeenCalledWith('data:image/png;base64,rotatedImageData');
    });

    it('should display error message when PDF conversion fails', async () => {
      const pdfFile = new File(['invalid pdf'], 'broken-document.pdf', { 
        type: 'application/pdf' 
      });

      // Mock failed conversion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await act(async () => {
        renderWithMantine(<ImageEditor file={pdfFile} />);
      });

      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/Failed to convert PDF/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should show "No preview available" instead of image
      expect(screen.getByText('No preview available')).toBeInTheDocument();
      expect(screen.queryByAltText('Receipt preview')).not.toBeInTheDocument();

      // Rotation controls should remain disabled
      expect(screen.getByTestId('rotate-left-90')).toBeDisabled();
      expect(screen.getByTestId('rotate-right-90')).toBeDisabled();
      expect(screen.getByTestId('deskew-button')).toBeDisabled();
    });
  });

  describe('Image File Handling (Comparison)', () => {
    it('should display image files immediately without conversion', async () => {
      const imageFile = new File(['image content'], 'receipt.jpg', { 
        type: 'image/jpeg' 
      });

      await act(async () => {
        renderWithMantine(<ImageEditor file={imageFile} />);
      });

      // Should immediately show image preview
      const image = screen.getByAltText('Receipt preview');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'blob:mock-image-url');

      // Should not show PDF conversion messages
      expect(screen.queryByText('Converting PDF...')).not.toBeInTheDocument();

      // Should not call convert-pdf API
      expect(global.fetch).not.toHaveBeenCalled();

      // Rotation controls should be immediately enabled
      expect(screen.getByTestId('rotate-left-90')).not.toBeDisabled();
      expect(screen.getByTestId('rotate-right-90')).not.toBeDisabled();
      expect(screen.getByTestId('deskew-button')).not.toBeDisabled();
    });

    it('should handle both PDF and image files in same session', async () => {
      const pdfFile = new File(['pdf'], 'document.pdf', { type: 'application/pdf' });
      const imageFile = new File(['image'], 'photo.png', { type: 'image/png' });

      // Mock PDF conversion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          image: 'pdfConvertedImageData'
        })
      });

      // Start with PDF
      const { rerender } = await act(async () => {
        return renderWithMantine(<ImageEditor file={pdfFile} />);
      });

      // Wait for PDF conversion
      await waitFor(() => {
        expect(screen.queryByText('Converting PDF...')).not.toBeInTheDocument();
      });

      // Clear mocks
      jest.clearAllMocks();

      // Switch to image file
      await act(async () => {
        rerender(
          <MantineProvider>
            <ImageEditor file={imageFile} />
          </MantineProvider>
        );
      });

      // Should immediately show image
      expect(screen.getByAltText('Receipt preview')).toHaveAttribute('src', 'blob:mock-image-url');
      
      // Should not call API for regular images
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network timeout during PDF conversion', async () => {
      const pdfFile = new File(['pdf'], 'timeout-test.pdf', { type: 'application/pdf' });

      // Mock network timeout
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('timeout of 30000ms exceeded')
      );

      await act(async () => {
        renderWithMantine(<ImageEditor file={pdfFile} />);
      });

      // Wait for timeout error
      await waitFor(() => {
        expect(screen.getByText(/Failed to convert PDF/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle malformed PDF conversion response', async () => {
      const pdfFile = new File(['pdf'], 'malformed-response.pdf', { type: 'application/pdf' });

      // Mock malformed response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          // Missing image data
          pageCount: 1
        })
      });

      await act(async () => {
        renderWithMantine(<ImageEditor file={pdfFile} />);
      });

      // Should handle missing image data gracefully
      await waitFor(() => {
        expect(screen.getByText(/Failed to convert PDF/)).toBeInTheDocument();
      });
    });
  });

  describe('UI State Management', () => {
    it('should show loading overlay during PDF conversion', async () => {
      const pdfFile = new File(['pdf'], 'loading-test.pdf', { type: 'application/pdf' });

      // Mock delayed response
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true, image: 'delayedImage' })
          }), 100);
        })
      );

      await act(async () => {
        renderWithMantine(<ImageEditor file={pdfFile} />);
      });

      // Should show loading state
      expect(screen.getByText('Converting PDF...')).toBeInTheDocument();
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Converting PDF...')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should clear previous errors when switching files', async () => {
      const badPdfFile = new File(['bad pdf'], 'bad.pdf', { type: 'application/pdf' });
      const goodImageFile = new File(['image'], 'good.jpg', { type: 'image/jpeg' });

      // Mock failed PDF conversion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      const { rerender } = await act(async () => {
        return renderWithMantine(<ImageEditor file={badPdfFile} />);
      });

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/Failed to convert PDF/)).toBeInTheDocument();
      });

      // Switch to valid image
      await act(async () => {
        rerender(
          <MantineProvider>
            <ImageEditor file={goodImageFile} />
          </MantineProvider>
        );
      });

      // Error should be cleared
      expect(screen.queryByText(/Failed to convert PDF/)).not.toBeInTheDocument();
      expect(screen.getByAltText('Receipt preview')).toBeInTheDocument();
    });
  });
});