/**
 * Unit tests for ImageEditor PDF conversion functionality
 * Tests PDF to image conversion, rotation controls, and error handling
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImageEditor } from './ImageEditor';
import { MantineProvider } from '@mantine/core';

// Mock the ImageProcessor module
jest.mock('@/lib/image-processor', () => ({
  ImageProcessor: {
    rotateImage: jest.fn().mockResolvedValue('blob:rotated-image'),
    deskewImage: jest.fn().mockResolvedValue('blob:deskewed-image'),
    processImage: jest.fn().mockResolvedValue('blob:processed-image'),
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
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock fetch for PDF conversion
global.fetch = jest.fn();

describe('ImageEditor - PDF Conversion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('PDF File Handling', () => {
    it('should initiate PDF conversion when PDF file is provided', async () => {
      const mockPdfFile = new File(['pdf content'], 'test-receipt.pdf', { 
        type: 'application/pdf' 
      });

      // Mock successful PDF conversion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          image: 'mockBase64ImageData',
          pageCount: 1,
          allPages: [{ pageNumber: 1, data: 'mockBase64ImageData', name: 'test-receipt.pdf' }]
        })
      });

      renderWithMantine(<ImageEditor file={mockPdfFile} />);

      // Should show converting message initially
      expect(screen.getByText('Converting PDF...')).toBeInTheDocument();
      expect(screen.getByText('test-receipt.pdf')).toBeInTheDocument();

      // Wait for conversion to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/convert-pdf',
          expect.objectContaining({
            method: 'POST',
            body: expect.any(FormData)
          })
        );
      });

      // After conversion, image should be displayed
      await waitFor(() => {
        const image = screen.getByAltText('Receipt preview');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', expect.stringContaining('data:image/png;base64,'));
      });
    });

    it('should enable rotation controls after successful PDF conversion', async () => {
      const mockPdfFile = new File(['pdf content'], 'document.pdf', { 
        type: 'application/pdf' 
      });

      // Mock successful conversion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          image: 'mockBase64ImageData',
          pageCount: 1
        })
      });

      renderWithMantine(<ImageEditor file={mockPdfFile} />);

      // Initially buttons should be disabled (during conversion)
      expect(screen.getByTestId('rotate-left-90')).toBeDisabled();
      expect(screen.getByTestId('rotate-right-90')).toBeDisabled();
      expect(screen.getByTestId('deskew-button')).toBeDisabled();

      // Wait for conversion to complete
      await waitFor(() => {
        expect(screen.queryByText('Converting PDF...')).not.toBeInTheDocument();
      });

      // After conversion, buttons should be enabled
      expect(screen.getByTestId('rotate-left-90')).not.toBeDisabled();
      expect(screen.getByTestId('rotate-right-90')).not.toBeDisabled();
      expect(screen.getByTestId('deskew-button')).not.toBeDisabled();
    });

    it('should handle PDF conversion failure gracefully', async () => {
      const mockPdfFile = new File(['pdf content'], 'bad-document.pdf', { 
        type: 'application/pdf' 
      });

      // Mock failed conversion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      renderWithMantine(<ImageEditor file={mockPdfFile} />);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/Failed to convert PDF/)).toBeInTheDocument();
      });

      // Rotation controls should remain disabled on error
      expect(screen.getByTestId('rotate-left-90')).toBeDisabled();
      expect(screen.getByTestId('rotate-right-90')).toBeDisabled();
      expect(screen.getByTestId('deskew-button')).toBeDisabled();
    });

    it('should handle network errors during PDF conversion', async () => {
      const mockPdfFile = new File(['pdf content'], 'network-error.pdf', { 
        type: 'application/pdf' 
      });

      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      renderWithMantine(<ImageEditor file={mockPdfFile} />);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/Failed to convert PDF/)).toBeInTheDocument();
      });
    });

    it('should clear loading state after conversion', async () => {
      const mockPdfFile = new File(['pdf content'], 'loading-test.pdf', { 
        type: 'application/pdf' 
      });

      // Mock successful conversion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          image: 'mockBase64ImageData'
        })
      });

      renderWithMantine(<ImageEditor file={mockPdfFile} />);

      // Loading state should be visible initially
      expect(screen.getByText('Converting PDF...')).toBeInTheDocument();

      // Wait for conversion to complete
      await waitFor(() => {
        expect(screen.queryByText('Converting PDF...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Rotation Controls for Converted PDFs', () => {
    it('should allow rotation of converted PDF images', async () => {
      const mockPdfFile = new File(['pdf content'], 'rotate-test.pdf', { 
        type: 'application/pdf' 
      });

      // Mock successful conversion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          image: 'mockBase64ImageData'
        })
      });

      const { getByTestId } = renderWithMantine(<ImageEditor file={mockPdfFile} />);

      // Wait for conversion
      await waitFor(() => {
        expect(screen.queryByText('Converting PDF...')).not.toBeInTheDocument();
      });

      // Click rotate right button
      const rotateRightButton = getByTestId('rotate-right-90');
      fireEvent.click(rotateRightButton);

      // Should call ImageProcessor.rotateImage
      const { ImageProcessor } = require('@/lib/image-processor');
      await waitFor(() => {
        expect(ImageProcessor.rotateImage).toHaveBeenCalled();
      });
    });

    it('should show edited badge after rotation', async () => {
      const mockPdfFile = new File(['pdf content'], 'badge-test.pdf', { 
        type: 'application/pdf' 
      });

      // Mock successful conversion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          image: 'mockBase64ImageData'
        })
      });

      renderWithMantine(<ImageEditor file={mockPdfFile} />);

      // Wait for conversion
      await waitFor(() => {
        expect(screen.queryByText('Converting PDF...')).not.toBeInTheDocument();
      });

      // Rotate image
      fireEvent.click(screen.getByTestId('rotate-right-90'));

      // Wait for edited badge to appear
      await waitFor(() => {
        expect(screen.getByText('Edited')).toBeInTheDocument();
      });
    });

    it('should reset converted PDF to original state', async () => {
      const mockPdfFile = new File(['pdf content'], 'reset-test.pdf', { 
        type: 'application/pdf' 
      });

      // Mock successful conversion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          image: 'mockBase64ImageData'
        })
      });

      renderWithMantine(<ImageEditor file={mockPdfFile} />);

      // Wait for conversion
      await waitFor(() => {
        expect(screen.queryByText('Converting PDF...')).not.toBeInTheDocument();
      });

      // Rotate image
      fireEvent.click(screen.getByTestId('rotate-right-90'));

      // Wait for edited badge
      await waitFor(() => {
        expect(screen.getByText('Edited')).toBeInTheDocument();
      });

      // Click reset button
      fireEvent.click(screen.getByTestId('reset-button'));

      // Edited badge should disappear
      expect(screen.queryByText('Edited')).not.toBeInTheDocument();
    });
  });

  describe('PDF vs Image File Handling', () => {
    it('should handle PDF files differently from image files', async () => {
      // Test with PDF
      const pdfFile = new File(['pdf'], 'test.pdf', { type: 'application/pdf' });
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, image: 'pdfImageData' })
      });

      const { rerender } = renderWithMantine(<ImageEditor file={pdfFile} />);
      
      // Should call API for PDF
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/convert-pdf', expect.anything());
      });

      // Clear mocks
      jest.clearAllMocks();

      // Test with image
      const imageFile = new File(['image'], 'test.png', { type: 'image/png' });
      rerender(
        <MantineProvider>
          <ImageEditor file={imageFile} />
        </MantineProvider>
      );

      // Should NOT call API for image
      expect(global.fetch).not.toHaveBeenCalled();
      
      // Should create blob URL for image
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(imageFile);
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after conversion failure', async () => {
      const mockPdfFile = new File(['pdf content'], 'retry-test.pdf', { 
        type: 'application/pdf' 
      });

      // First attempt fails
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { rerender } = renderWithMantine(<ImageEditor file={mockPdfFile} />);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/Failed to convert PDF/)).toBeInTheDocument();
      });

      // Mock successful retry
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          image: 'retryImageData'
        })
      });

      // Retry by re-rendering with same file
      rerender(
        <MantineProvider>
          <ImageEditor file={mockPdfFile} />
        </MantineProvider>
      );

      // Should attempt conversion again
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});

describe('ImageEditor - PDF Conversion Integration', () => {
  it('should complete full PDF workflow', async () => {
    const mockPdfFile = new File(['pdf content'], 'workflow-test.pdf', { 
      type: 'application/pdf' 
    });

    const mockOnImageUpdate = jest.fn();

    // Mock successful conversion
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        image: 'workflowImageData',
        pageCount: 1
      })
    });

    renderWithMantine(
      <ImageEditor file={mockPdfFile} onImageUpdate={mockOnImageUpdate} />
    );

    // 1. Shows loading state
    expect(screen.getByText('Converting PDF...')).toBeInTheDocument();

    // 2. Completes conversion
    await waitFor(() => {
      expect(screen.queryByText('Converting PDF...')).not.toBeInTheDocument();
    });

    // 3. Displays image
    expect(screen.getByAltText('Receipt preview')).toBeInTheDocument();

    // 4. Enables controls
    expect(screen.getByTestId('rotate-right-90')).not.toBeDisabled();

    // 5. Allows rotation
    fireEvent.click(screen.getByTestId('rotate-right-90'));

    // 6. Calls update callback
    await waitFor(() => {
      expect(mockOnImageUpdate).toHaveBeenCalled();
    });
  });
});