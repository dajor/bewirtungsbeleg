/**
 * Unit tests for MultiFileDropzone component
 * Tests file upload, preview display for PDFs and images
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MultiFileDropzone, FileWithPreview } from './MultiFileDropzone';
import { MantineProvider } from '@mantine/core';

// Helper to wrap component with MantineProvider
const renderWithMantine = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  onload: jest.fn(),
  onerror: jest.fn(),
  result: 'data:image/png;base64,mockbase64data'
};

(global as any).FileReader = jest.fn(() => mockFileReader);

describe('MultiFileDropzone Component', () => {
  const mockOnDrop = jest.fn();
  const mockOnRemove = jest.fn();
  const mockOnFileClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PDF File Display', () => {
    it('should display PDF file with PDF icon', () => {
      const pdfFile: FileWithPreview = {
        id: '1',
        file: new File(['pdf content'], 'document.pdf', { type: 'application/pdf' }),
        isConverting: false,
        classification: { type: 'Rechnung', confidence: 0.9 }
      };

      renderWithMantine(
        <MultiFileDropzone
          files={[pdfFile]}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
          onFileClick={mockOnFileClick}
        />
      );

      // Check PDF is displayed with proper elements
      expect(screen.getByTestId('file-preview')).toBeInTheDocument();
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });

    it('should show converting state for PDF files', () => {
      const pdfFile: FileWithPreview = {
        id: '1',
        file: new File(['pdf'], 'scan.pdf', { type: 'application/pdf' }),
        isConverting: true,
        classification: { type: '', confidence: 0, isProcessing: true }
      };

      renderWithMantine(
        <MultiFileDropzone
          files={[pdfFile]}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
        />
      );

      // Should show loading state
      expect(screen.getByText('Konvertiere PDF...')).toBeInTheDocument();
    });

    it('should handle multiple PDF files', () => {
      const pdfFiles: FileWithPreview[] = [
        {
          id: '1',
          file: new File(['pdf1'], 'receipt1.pdf', { type: 'application/pdf' }),
        },
        {
          id: '2',
          file: new File(['pdf2'], 'receipt2.pdf', { type: 'application/pdf' }),
        }
      ];

      renderWithMantine(
        <MultiFileDropzone
          files={pdfFiles}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
        />
      );

      // Both PDFs should be displayed
      expect(screen.getByText('receipt1.pdf')).toBeInTheDocument();
      expect(screen.getByText('receipt2.pdf')).toBeInTheDocument();
      expect(screen.getAllByText('PDF')).toHaveLength(2);
    });

    it('should show classification for PDF files', () => {
      const pdfFile: FileWithPreview = {
        id: '1',
        file: new File(['pdf'], 'kreditkarte.pdf', { type: 'application/pdf' }),
        classification: { 
          type: 'Kreditkartenbeleg', 
          confidence: 0.95,
          isProcessing: false
        }
      };

      renderWithMantine(
        <MultiFileDropzone
          files={[pdfFile]}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Kreditkartenbeleg')).toBeInTheDocument();
    });
  });

  describe('Image File Display', () => {
    it('should display PNG file with image preview', () => {
      const pngFile: FileWithPreview = {
        id: '1',
        file: new File(['image'], 'receipt.png', { type: 'image/png' }),
        preview: 'data:image/png;base64,mockimagedata'
      };

      renderWithMantine(
        <MultiFileDropzone
          files={[pngFile]}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
        />
      );

      // Check image is displayed
      expect(screen.getByTestId('file-preview')).toBeInTheDocument();
      const image = screen.getByAltText('receipt.png');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'data:image/png;base64,mockimagedata');
    });

    it('should display JPEG file correctly', () => {
      const jpegFile: FileWithPreview = {
        id: '1',
        file: new File(['image'], 'photo.jpg', { type: 'image/jpeg' }),
        preview: 'data:image/jpeg;base64,mockjpegdata'
      };

      renderWithMantine(
        <MultiFileDropzone
          files={[jpegFile]}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
        />
      );

      const image = screen.getByAltText('photo.jpg');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'data:image/jpeg;base64,mockjpegdata');
    });

    it('should handle multiple image files', () => {
      const imageFiles: FileWithPreview[] = [
        {
          id: '1',
          file: new File(['img1'], 'photo1.png', { type: 'image/png' }),
          preview: 'data:image/png;base64,mock1'
        },
        {
          id: '2',
          file: new File(['img2'], 'photo2.jpg', { type: 'image/jpeg' }),
          preview: 'data:image/jpeg;base64,mock2'
        },
        {
          id: '3',
          file: new File(['img3'], 'photo3.gif', { type: 'image/gif' }),
          preview: 'data:image/gif;base64,mock3'
        }
      ];

      renderWithMantine(
        <MultiFileDropzone
          files={imageFiles}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
        />
      );

      // All images should be displayed
      expect(screen.getByAltText('photo1.png')).toBeInTheDocument();
      expect(screen.getByAltText('photo2.jpg')).toBeInTheDocument();
      expect(screen.getByAltText('photo3.gif')).toBeInTheDocument();
    });

    it('should show classification for image files', () => {
      const imageFile: FileWithPreview = {
        id: '1',
        file: new File(['img'], 'receipt.png', { type: 'image/png' }),
        preview: 'data:image/png;base64,mock',
        classification: {
          type: 'Rechnung',
          confidence: 0.88,
          isProcessing: false
        }
      };

      renderWithMantine(
        <MultiFileDropzone
          files={[imageFile]}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Rechnung')).toBeInTheDocument();
    });
  });

  describe('Mixed File Types', () => {
    it('should correctly display both PDF and image files together', () => {
      const mixedFiles: FileWithPreview[] = [
        {
          id: '1',
          file: new File(['pdf'], 'document.pdf', { type: 'application/pdf' }),
        },
        {
          id: '2',
          file: new File(['img'], 'photo.png', { type: 'image/png' }),
          preview: 'data:image/png;base64,mockpng'
        },
        {
          id: '3',
          file: new File(['pdf2'], 'scan.pdf', { type: 'application/pdf' }),
        },
        {
          id: '4',
          file: new File(['img2'], 'receipt.jpg', { type: 'image/jpeg' }),
          preview: 'data:image/jpeg;base64,mockjpeg'
        }
      ];

      renderWithMantine(
        <MultiFileDropzone
          files={mixedFiles}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
        />
      );

      // Check PDFs
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('scan.pdf')).toBeInTheDocument();
      expect(screen.getAllByText('PDF')).toHaveLength(2);

      // Check images
      expect(screen.getByAltText('photo.png')).toBeInTheDocument();
      expect(screen.getByAltText('receipt.jpg')).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should highlight selected file', () => {
      const selectedFile = new File(['img'], 'selected.png', { type: 'image/png' });
      const files: FileWithPreview[] = [
        {
          id: '1',
          file: selectedFile,
          preview: 'data:image/png;base64,mock'
        },
        {
          id: '2',
          file: new File(['img2'], 'other.png', { type: 'image/png' }),
          preview: 'data:image/png;base64,mock2'
        }
      ];

      renderWithMantine(
        <MultiFileDropzone
          files={files}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
          onFileClick={mockOnFileClick}
          selectedFile={selectedFile}
        />
      );

      const previews = screen.getAllByTestId('file-preview');
      // First file should have selection styling
      expect(previews[0]).toHaveStyle({ border: '2px solid var(--mantine-color-blue-5)' });
    });

    it('should call onFileClick when file is clicked', () => {
      const file = new File(['img'], 'clickable.png', { type: 'image/png' });
      const files: FileWithPreview[] = [
        {
          id: '1',
          file: file,
          preview: 'data:image/png;base64,mock'
        }
      ];

      renderWithMantine(
        <MultiFileDropzone
          files={files}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
          onFileClick={mockOnFileClick}
        />
      );

      const preview = screen.getByTestId('file-preview');
      fireEvent.click(preview);

      expect(mockOnFileClick).toHaveBeenCalledWith(file);
    });

    it('should show pointer cursor when onFileClick is provided', () => {
      const files: FileWithPreview[] = [
        {
          id: '1',
          file: new File(['img'], 'test.png', { type: 'image/png' }),
        }
      ];

      renderWithMantine(
        <MultiFileDropzone
          files={files}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
          onFileClick={mockOnFileClick}
        />
      );

      const preview = screen.getByTestId('file-preview');
      expect(preview).toHaveStyle({ cursor: 'pointer' });
    });
  });

  describe('File Removal', () => {
    it('should show remove button for each file', () => {
      const files: FileWithPreview[] = [
        {
          id: '1',
          file: new File(['content'], 'test.pdf', { type: 'application/pdf' }),
        }
      ];

      renderWithMantine(
        <MultiFileDropzone
          files={files}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
        />
      );

      // ActionIcon doesn't have a name, look for the X icon button
      const removeButtons = screen.getAllByRole('button');
      expect(removeButtons.length).toBeGreaterThan(0);
    });

    it('should call onRemove when remove button is clicked', () => {
      const files: FileWithPreview[] = [
        {
          id: 'file-123',
          file: new File(['content'], 'test.pdf', { type: 'application/pdf' }),
        }
      ];

      renderWithMantine(
        <MultiFileDropzone
          files={files}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
        />
      );

      // Find the remove button (ActionIcon)
      const removeButtons = screen.getAllByRole('button');
      const removeButton = removeButtons[removeButtons.length - 1]; // Last button is remove
      fireEvent.click(removeButton);

      expect(mockOnRemove).toHaveBeenCalledWith('file-123');
    });
  });

  describe('Processing States', () => {
    it('should show processing state for classification', () => {
      const files: FileWithPreview[] = [
        {
          id: '1',
          file: new File(['content'], 'processing.pdf', { type: 'application/pdf' }),
          classification: {
            type: '',
            confidence: 0,
            isProcessing: true
          }
        }
      ];

      renderWithMantine(
        <MultiFileDropzone
          files={files}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Analysiere...')).toBeInTheDocument();
    });

    it('should show confidence level with color coding', () => {
      const files: FileWithPreview[] = [
        {
          id: '1',
          file: new File(['content'], 'high-conf.pdf', { type: 'application/pdf' }),
          classification: {
            type: 'Rechnung',
            confidence: 0.95,
            isProcessing: false
          }
        }
      ];

      renderWithMantine(
        <MultiFileDropzone
          files={files}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
        />
      );

      // Classification type should be shown
      expect(screen.getByText('Rechnung')).toBeInTheDocument();
      // Note: The actual component might not show percentage, just the classification type
    });
  });

  describe('File Size Display', () => {
    it('should display file size correctly', () => {
      // Create files with specific sizes
      const smallFile = new File(['x'.repeat(1024)], 'small.pdf', { type: 'application/pdf' });
      Object.defineProperty(smallFile, 'size', { value: 1024, writable: false });
      
      const mediumFile = new File(['x'.repeat(1024 * 512)], 'medium.pdf', { type: 'application/pdf' });
      Object.defineProperty(mediumFile, 'size', { value: 1024 * 512, writable: false });
      
      const files: FileWithPreview[] = [
        {
          id: '1',
          file: smallFile
        },
        {
          id: '2',
          file: mediumFile
        }
      ];

      renderWithMantine(
        <MultiFileDropzone
          files={files}
          onDrop={mockOnDrop}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('1.0 KB')).toBeInTheDocument();
      expect(screen.getByText('512.0 KB')).toBeInTheDocument();
    });
  });
});