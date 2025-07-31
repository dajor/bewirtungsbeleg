import { POST } from './route';
import * as fs from 'fs';
import * as path from 'path';

// Mock the PDF conversion libraries
jest.mock('@/lib/pdf-to-image-multipage', () => ({
  convertPdfToImagesAllPages: jest.fn()
}));

jest.mock('@/lib/pdf-to-image', () => ({
  convertPdfToImage: jest.fn()
}));

jest.mock('../timeout-middleware', () => ({
  withTimeout: (handler: Function) => handler
}));

describe('PDF to Image Conversion API', () => {
  const mockConvertPdfToImagesAllPages = require('@/lib/pdf-to-image-multipage').convertPdfToImagesAllPages;
  const mockConvertPdfToImage = require('@/lib/pdf-to-image').convertPdfToImage;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should convert PDF to image successfully', async () => {
    // Mock successful conversion
    const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
    mockConvertPdfToImagesAllPages.mockResolvedValue([
      {
        pageNumber: 1,
        data: mockImageData,
        name: 'test-page-1.jpg'
      }
    ]);

    // Create test PDF file
    const testPdfPath = path.join(__dirname, '../../../../test/08042025_kreditbeleg_Pareo.pdf');
    let pdfBuffer: Buffer;
    
    try {
      pdfBuffer = fs.readFileSync(testPdfPath);
    } catch (error) {
      console.log('Test PDF not found, using mock data');
      pdfBuffer = Buffer.from('mock pdf content');
    }

    const testFile = new File([pdfBuffer], '08042025_kreditbeleg_Pareo.pdf', {
      type: 'application/pdf'
    });

    // Create form data
    const formData = new FormData();
    formData.append('file', testFile);

    // Create request
    const request = {
      formData: async () => formData
    } as unknown as Request;

    // Call the API
    const response = await POST(request);
    const result = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.image).toBe(mockImageData);
    expect(result.pageCount).toBe(1);
    expect(mockConvertPdfToImagesAllPages).toHaveBeenCalledWith(
      expect.any(Buffer),
      '08042025_kreditbeleg_Pareo.pdf'
    );
  });

  it('should fall back to single page conversion if multi-page fails', async () => {
    // Mock multi-page conversion failure
    mockConvertPdfToImagesAllPages.mockRejectedValue(new Error('pdftoppm not found'));
    
    // Mock successful single-page conversion
    const mockImageData = 'data:image/jpeg;base64,fallback...';
    mockConvertPdfToImage.mockResolvedValue(mockImageData);

    // Create test file
    const testFile = new File(['pdf content'], 'test.pdf', {
      type: 'application/pdf'
    });

    const formData = new FormData();
    formData.append('file', testFile);

    const request = {
      formData: async () => formData
    } as unknown as Request;

    const response = await POST(request);
    const result = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.image).toBe(mockImageData);
    expect(result.pageCount).toBe(1);
    expect(mockConvertPdfToImagesAllPages).toHaveBeenCalled();
    expect(mockConvertPdfToImage).toHaveBeenCalled();
  });

  it('should handle missing file', async () => {
    const formData = new FormData();
    // No file appended

    const request = {
      formData: async () => formData
    } as unknown as Request;

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe('Keine Datei hochgeladen');
  });

  it('should reject non-PDF files', async () => {
    const testFile = new File(['image content'], 'image.jpg', {
      type: 'image/jpeg'
    });

    const formData = new FormData();
    formData.append('file', testFile);

    const request = {
      formData: async () => formData
    } as unknown as Request;

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe('Nur PDF-Dateien werden unterstützt');
  });

  it('should handle conversion errors gracefully', async () => {
    // Mock both conversions failing
    mockConvertPdfToImagesAllPages.mockRejectedValue(new Error('Conversion failed'));
    mockConvertPdfToImage.mockResolvedValue(null);

    const testFile = new File(['pdf content'], 'test.pdf', {
      type: 'application/pdf'
    });

    const formData = new FormData();
    formData.append('file', testFile);

    const request = {
      formData: async () => formData
    } as unknown as Request;

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toContain('Fehler bei der PDF-Konvertierung');
  });
});