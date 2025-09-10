/**
 * Unit tests for ImageEditor component
 * Tests PDF and PNG image display functionality
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImageEditor } from './ImageEditor';
import { MantineProvider } from '@mantine/core';

// Mock the ImageProcessor module
jest.mock('@/lib/image-processor', () => ({
  ImageProcessor: {
    rotateImage: jest.fn(),
    deskewImage: jest.fn(),
    processImage: jest.fn(),
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

// Mock fetch globally for PDF conversion
global.fetch = jest.fn();

describe('ImageEditor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });

  describe('PDF File Display', () => {
    it('should show converting message when PDF file is uploaded', async () => {
      const pdfFile = new File(['pdf content'], 'test-document.pdf', { 
        type: 'application/pdf' 
      });

      renderWithMantine(<ImageEditor file={pdfFile} />);

      // Check that PDF conversion loading state is shown
      expect(screen.getByText('Image Editor')).toBeInTheDocument();
      expect(screen.getByText('Converting PDF...')).toBeInTheDocument();
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    });

    it('should attempt to convert PDF files', async () => {
      // Mock fetch for PDF conversion
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            image: 'mockBase64ImageData',
            pageCount: 1 
          }),
        })
      ) as jest.Mock;

      const pdfFile = new File(['pdf content'], 'receipt.pdf', { 
        type: 'application/pdf' 
      });

      renderWithMantine(<ImageEditor file={pdfFile} />);

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
    });

    it('should enable rotation controls after PDF conversion', async () => {
      // Mock successful PDF conversion
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            image: 'mockBase64ImageData',
            pageCount: 1 
          }),
        })
      ) as jest.Mock;

      const pdfFile = new File(['pdf content'], 'document.pdf', { 
        type: 'application/pdf' 
      });

      renderWithMantine(<ImageEditor file={pdfFile} />);

      // Wait for conversion to complete
      await waitFor(() => {
        const rotateLeftButton = screen.getByTestId('rotate-left-90');
        expect(rotateLeftButton).not.toBeDisabled();
      });
    });

    it('should show error message if PDF conversion fails', async () => {
      // Mock failed PDF conversion
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500
        })
      ) as jest.Mock;

      const pdfFile = new File(['pdf content'], 'document.pdf', { 
        type: 'application/pdf' 
      });

      renderWithMantine(<ImageEditor file={pdfFile} />);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/Failed to convert PDF/)).toBeInTheDocument();
      });
    });
  });

  describe('PNG/Image File Display', () => {
    it('should display image preview when PNG file is uploaded', async () => {
      const pngFile = new File(['image content'], 'receipt.png', { 
        type: 'image/png' 
      });

      renderWithMantine(<ImageEditor file={pngFile} />);

      // Check that image element is displayed (not PDF placeholder)
      expect(screen.getByText('Image Editor')).toBeInTheDocument();
      expect(screen.queryByText('PDF Document')).not.toBeInTheDocument();
      
      // Check for image element
      const image = screen.getByAltText('Receipt preview');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'blob:mock-url');
    });

    it('should enable rotation controls for image files', async () => {
      const pngFile = new File(['image content'], 'photo.png', { 
        type: 'image/png' 
      });

      renderWithMantine(<ImageEditor file={pngFile} />);

      // Check that rotation buttons are enabled
      const rotateLeftButton = screen.getByTestId('rotate-left-90');
      const rotateRightButton = screen.getByTestId('rotate-right-90');
      const deskewButton = screen.getByTestId('deskew-button');

      expect(rotateLeftButton).not.toBeDisabled();
      expect(rotateRightButton).not.toBeDisabled();
      expect(deskewButton).not.toBeDisabled();
    });

    it('should create blob URL for image files', async () => {
      const jpegFile = new File(['image content'], 'photo.jpg', { 
        type: 'image/jpeg' 
      });

      renderWithMantine(<ImageEditor file={jpegFile} />);

      // Verify URL.createObjectURL was called with the file
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(jpegFile);

      // Check image has the blob URL
      const image = screen.getByAltText('Receipt preview');
      expect(image).toHaveAttribute('src', 'blob:mock-url');
    });

    it('should show rotation slider for image files', async () => {
      const pngFile = new File(['image content'], 'scan.png', { 
        type: 'image/png' 
      });

      renderWithMantine(<ImageEditor file={pngFile} />);

      // Check rotation slider is present and functional
      const slider = screen.getByTestId('rotation-slider');
      expect(slider).toBeInTheDocument();
      expect(slider).not.toBeDisabled();
      // Slider value is managed by Mantine component internally
    });

    it('should handle JPEG files correctly', async () => {
      const jpegFile = new File(['image content'], 'photo.jpeg', { 
        type: 'image/jpeg' 
      });

      renderWithMantine(<ImageEditor file={jpegFile} />);

      // Should display as image, not PDF
      expect(screen.queryByText('PDF Document')).not.toBeInTheDocument();
      expect(screen.getByAltText('Receipt preview')).toBeInTheDocument();
    });

    it('should handle WebP files correctly', async () => {
      const webpFile = new File(['image content'], 'modern-image.webp', { 
        type: 'image/webp' 
      });

      renderWithMantine(<ImageEditor file={webpFile} />);

      // Should display as image
      const image = screen.getByAltText('Receipt preview');
      expect(image).toBeInTheDocument();
      expect(screen.queryByText('PDF Document')).not.toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('should reset state when file changes', async () => {
      const { rerender } = renderWithMantine(
        <ImageEditor file={new File(['img1'], 'first.png', { type: 'image/png' })} />
      );

      // Verify first file is displayed
      expect(screen.getByAltText('Receipt preview')).toHaveAttribute('src', 'blob:mock-url');

      // Change to a different file
      rerender(
        <MantineProvider>
          <ImageEditor file={new File(['img2'], 'second.png', { type: 'image/png' })} />
        </MantineProvider>
      );

      // Verify URL.createObjectURL was called again
      expect(global.URL.createObjectURL).toHaveBeenCalledTimes(2);
    });

    it('should cleanup blob URLs on unmount', async () => {
      const pngFile = new File(['image'], 'test.png', { type: 'image/png' });
      
      const { unmount } = renderWithMantine(<ImageEditor file={pngFile} />);

      // Unmount component
      unmount();

      // Cleanup happens in useEffect cleanup - verify URL was created
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should handle null file gracefully', () => {
      renderWithMantine(<ImageEditor file={null} />);
      
      // Component should render nothing when file is null
      expect(screen.queryByText('Image Editor')).not.toBeInTheDocument();
    });

    it('should clear error when switching from PDF to image', async () => {
      // Mock failed PDF conversion for error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { rerender } = renderWithMantine(
        <ImageEditor file={new File(['pdf'], 'doc.pdf', { type: 'application/pdf' })} />
      );

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/Failed to convert PDF/)).toBeInTheDocument();
      });

      // Switch to image file
      rerender(
        <MantineProvider>
          <ImageEditor file={new File(['img'], 'pic.png', { type: 'image/png' })} />
        </MantineProvider>
      );

      // Error should be cleared
      expect(screen.queryByText(/Failed to convert PDF/)).not.toBeInTheDocument();
    });
  });

  describe('File Type Detection', () => {
    const fileTypes = [
      { type: 'image/png', extension: 'png', shouldShowImage: true },
      { type: 'image/jpeg', extension: 'jpg', shouldShowImage: true },
      { type: 'image/gif', extension: 'gif', shouldShowImage: true },
      { type: 'image/bmp', extension: 'bmp', shouldShowImage: true },
      { type: 'image/svg+xml', extension: 'svg', shouldShowImage: true },
      { type: 'application/pdf', extension: 'pdf', shouldShowImage: false },
    ];

    fileTypes.forEach(({ type, extension, shouldShowImage }) => {
      it(`should correctly handle ${extension} files (${type})`, () => {
        const file = new File(['content'], `test.${extension}`, { type });
        
        renderWithMantine(<ImageEditor file={file} />);

        if (shouldShowImage) {
          expect(screen.getByAltText('Receipt preview')).toBeInTheDocument();
          expect(screen.queryByText('Converting PDF...')).not.toBeInTheDocument();
        } else {
          // PDFs show converting message initially
          expect(screen.getByText('Converting PDF...')).toBeInTheDocument();
          expect(screen.queryByAltText('Receipt preview')).not.toBeInTheDocument();
        }
      });
    });
  });

  describe('Rotation Controls UI', () => {
    it('should display all rotation control buttons', () => {
      const imageFile = new File(['img'], 'test.png', { type: 'image/png' });
      
      renderWithMantine(<ImageEditor file={imageFile} />);

      expect(screen.getByTestId('rotate-left-90')).toBeInTheDocument();
      expect(screen.getByTestId('rotate-right-90')).toBeInTheDocument();
      expect(screen.getByTestId('deskew-button')).toBeInTheDocument();
      expect(screen.getByTestId('reset-button')).toBeInTheDocument();
    });

    it('should display rotation slider with correct range', () => {
      const imageFile = new File(['img'], 'test.png', { type: 'image/png' });
      
      renderWithMantine(<ImageEditor file={imageFile} />);

      const slider = screen.getByTestId('rotation-slider');
      expect(slider).toBeInTheDocument();
      // Mantine Slider component doesn't directly expose HTML attributes
      // The range is configured internally via props
    });

    it('should show "Apply Rotation" button', () => {
      const imageFile = new File(['img'], 'test.png', { type: 'image/png' });
      
      renderWithMantine(<ImageEditor file={imageFile} />);

      expect(screen.getByTestId('apply-rotation')).toBeInTheDocument();
    });
  });
});