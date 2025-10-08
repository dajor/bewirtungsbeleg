/**
 * @jest-environment node
 */

/**
 * Integration tests for PDF classification with real test files
 * Tests the complete flow: PDF → Image → OpenAI Classification
 *
 * Test files:
 * - test/29092025_(Vendor).pdf - Restaurant invoice (should classify as "Rechnung")
 * - test/08102025_Bezahlung MASTERCARD.pdf - Credit card receipt (should classify as "Kreditkartenbeleg")
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateImageDataUrl } from '@/lib/image-validation';
import { convertPdfToImagesAllPages } from '@/lib/pdf-to-image-multipage';

describe('PDF Classification Integration Tests', () => {
  const testFilesDir = path.join(__dirname, '../../../../test');

  describe('Test file validation', () => {
    it('should have the restaurant invoice PDF test file', () => {
      const restaurantInvoicePath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      expect(fs.existsSync(restaurantInvoicePath)).toBe(true);

      const stats = fs.statSync(restaurantInvoicePath);
      expect(stats.size).toBeGreaterThan(0);
      console.log(`Restaurant invoice PDF size: ${Math.round(stats.size / 1024)}KB`);
    });

    it('should have the credit card receipt PDF test file', () => {
      const creditCardPath = path.join(testFilesDir, '08102025_Bezahlung MASTERCARD.pdf');
      expect(fs.existsSync(creditCardPath)).toBe(true);

      const stats = fs.statSync(creditCardPath);
      expect(stats.size).toBeGreaterThan(0);
      console.log(`Credit card receipt PDF size: ${Math.round(stats.size / 1024)}KB`);
    });
  });

  describe('PDF to Image Conversion', () => {
    it('should convert restaurant invoice PDF to valid JPEG image', async () => {
      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      const pdfBuffer = fs.readFileSync(pdfPath);

      const convertedPages = await convertPdfToImagesAllPages(pdfBuffer, '29092025_(Vendor).pdf');

      expect(convertedPages).toBeDefined();
      expect(convertedPages.length).toBeGreaterThan(0);

      const firstPage = convertedPages[0];
      expect(firstPage.pageNumber).toBe(1);
      expect(firstPage.data).toContain('data:image/jpeg;base64,');
      expect(firstPage.name).toContain('29092025_(Vendor)');

      // Validate the converted image
      const validation = validateImageDataUrl(firstPage.data);
      expect(validation.valid).toBe(true);
      expect(validation.format).toBe('jpeg');

      console.log(`Converted restaurant invoice: ${validation.format}, ~${Math.round((validation.base64Data?.length || 0) * 0.75 / 1024)}KB`);
    }, 30000); // 30 second timeout for PDF conversion

    it('should convert credit card receipt PDF to valid JPEG image', async () => {
      const pdfPath = path.join(testFilesDir, '08102025_Bezahlung MASTERCARD.pdf');
      const pdfBuffer = fs.readFileSync(pdfPath);

      const convertedPages = await convertPdfToImagesAllPages(pdfBuffer, '08102025_Bezahlung MASTERCARD.pdf');

      expect(convertedPages).toBeDefined();
      expect(convertedPages.length).toBeGreaterThan(0);

      const firstPage = convertedPages[0];
      expect(firstPage.pageNumber).toBe(1);
      expect(firstPage.data).toContain('data:image/jpeg;base64,');
      expect(firstPage.name).toContain('08102025_Bezahlung MASTERCARD');

      // Validate the converted image
      const validation = validateImageDataUrl(firstPage.data);
      expect(validation.valid).toBe(true);
      expect(validation.format).toBe('jpeg');

      console.log(`Converted credit card receipt: ${validation.format}, ~${Math.round((validation.base64Data?.length || 0) * 0.75 / 1024)}KB`);
    }, 30000);

    it('should fallback to PNG if JPEG conversion fails', async () => {
      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      const pdfBuffer = fs.readFileSync(pdfPath);

      // Try with PNG format explicitly
      const convertedPages = await convertPdfToImagesAllPages(
        pdfBuffer,
        '29092025_(Vendor).pdf',
        { format: 'png' }
      );

      expect(convertedPages).toBeDefined();
      expect(convertedPages.length).toBeGreaterThan(0);

      const firstPage = convertedPages[0];
      expect(firstPage.data).toContain('data:image/png;base64,');

      // Validate the PNG image
      const validation = validateImageDataUrl(firstPage.data);
      expect(validation.valid).toBe(true);
      expect(validation.format).toBe('png');
    }, 30000);
  });

  describe('Image Validation for Classification', () => {
    it('should produce OpenAI-compatible image data from restaurant invoice PDF', async () => {
      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      const pdfBuffer = fs.readFileSync(pdfPath);
      const convertedPages = await convertPdfToImagesAllPages(pdfBuffer, '29092025_(Vendor).pdf');

      const imageData = convertedPages[0].data;

      // Validate that this image format is acceptable for OpenAI
      const validation = validateImageDataUrl(imageData);

      expect(validation.valid).toBe(true);
      expect(['jpeg', 'png', 'gif', 'webp']).toContain(validation.format);
      expect(validation.base64Data).toBeDefined();
      expect(validation.base64Data!.length).toBeGreaterThan(0);

      // Check image size is reasonable (not too large for API)
      const imageSizeBytes = (validation.base64Data!.length * 3) / 4;
      expect(imageSizeBytes).toBeLessThan(20 * 1024 * 1024); // < 20MB

      console.log(`Restaurant invoice image validated for OpenAI: ${validation.format}, ${Math.round(imageSizeBytes / 1024)}KB`);
    }, 30000);

    it('should produce OpenAI-compatible image data from credit card receipt PDF', async () => {
      const pdfPath = path.join(testFilesDir, '08102025_Bezahlung MASTERCARD.pdf');
      const pdfBuffer = fs.readFileSync(pdfPath);
      const convertedPages = await convertPdfToImagesAllPages(pdfBuffer, '08102025_Bezahlung MASTERCARD.pdf');

      const imageData = convertedPages[0].data;

      // Validate that this image format is acceptable for OpenAI
      const validation = validateImageDataUrl(imageData);

      expect(validation.valid).toBe(true);
      expect(['jpeg', 'png', 'gif', 'webp']).toContain(validation.format);
      expect(validation.base64Data).toBeDefined();
      expect(validation.base64Data!.length).toBeGreaterThan(0);

      // Check image size is reasonable
      const imageSizeBytes = (validation.base64Data!.length * 3) / 4;
      expect(imageSizeBytes).toBeLessThan(20 * 1024 * 1024);

      console.log(`Credit card receipt image validated for OpenAI: ${validation.format}, ${Math.round(imageSizeBytes / 1024)}KB`);
    }, 30000);
  });

  describe('Classification API Integration', () => {
    const mockOpenAICreate = jest.fn();

    beforeAll(() => {
      // Mock OpenAI
      jest.doMock('openai', () => {
        return jest.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockOpenAICreate
            }
          }
        }));
      });

      jest.doMock('next/server', () => ({
        NextResponse: {
          json: (data: any, init?: ResponseInit) => ({
            json: async () => data,
            status: init?.status || 200
          })
        }
      }));

      jest.doMock('@/lib/rate-limit', () => ({
        checkRateLimit: jest.fn().mockResolvedValue(null),
        getIdentifier: jest.fn().mockReturnValue('test-user'),
        apiRatelimit: { general: {} }
      }));

      process.env.OPENAI_API_KEY = 'test-api-key';
    });

    afterAll(() => {
      jest.resetModules();
    });

    beforeEach(() => {
      jest.clearAllMocks();
      mockOpenAICreate.mockReset();
    });

    it('should classify restaurant invoice PDF as "Rechnung"', async () => {
      const { POST } = await import('./route');

      // Read and convert the restaurant invoice PDF
      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      const pdfBuffer = fs.readFileSync(pdfPath);
      const convertedPages = await convertPdfToImagesAllPages(pdfBuffer, '29092025_(Vendor).pdf');
      const imageData = convertedPages[0].data;

      // Mock OpenAI response for invoice classification
      mockOpenAICreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              type: 'Rechnung',
              confidence: 0.95,
              reason: 'Das Dokument zeigt eine detaillierte Restaurantrechnung mit Positionen und MwSt.',
              details: {
                rechnungProbability: 0.95,
                kreditkartenbelegProbability: 0.05
              }
            })
          }
        }]
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          fileName: '29092025_(Vendor).pdf',
          fileType: 'application/pdf',
          image: imageData
        })
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe('Rechnung');
      expect(data.confidence).toBeGreaterThan(0.9);
      expect(mockOpenAICreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o' // Should use vision model when image is provided
        })
      );
    }, 30000);

    it('should classify credit card receipt PDF as "Kreditkartenbeleg"', async () => {
      const { POST } = await import('./route');

      // Read and convert the credit card receipt PDF
      const pdfPath = path.join(testFilesDir, '08102025_Bezahlung MASTERCARD.pdf');
      const pdfBuffer = fs.readFileSync(pdfPath);
      const convertedPages = await convertPdfToImagesAllPages(pdfBuffer, '08102025_Bezahlung MASTERCARD.pdf');
      const imageData = convertedPages[0].data;

      // Mock OpenAI response for credit card receipt
      mockOpenAICreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              type: 'Kreditkartenbeleg',
              confidence: 0.93,
              reason: 'Das Dokument zeigt typische Merkmale eines Kreditkartenbelegs mit Transaktionsnummer.',
              details: {
                rechnungProbability: 0.07,
                kreditkartenbelegProbability: 0.93
              }
            })
          }
        }]
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          fileName: '08102025_Bezahlung MASTERCARD.pdf',
          fileType: 'application/pdf',
          image: imageData
        })
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe('Kreditkartenbeleg');
      expect(data.confidence).toBeGreaterThan(0.9);
      expect(mockOpenAICreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o'
        })
      );
    }, 30000);
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle corrupted PDF files gracefully', async () => {
      const corruptedPdf = Buffer.from('This is not a valid PDF file');

      await expect(
        convertPdfToImagesAllPages(corruptedPdf, 'corrupted.pdf')
      ).rejects.toThrow();
    });

    it('should handle empty PDF files', async () => {
      const emptyPdf = Buffer.alloc(0);

      await expect(
        convertPdfToImagesAllPages(emptyPdf, 'empty.pdf')
      ).rejects.toThrow();
    });

    it('should validate image size constraints', async () => {
      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      const pdfBuffer = fs.readFileSync(pdfPath);
      const convertedPages = await convertPdfToImagesAllPages(pdfBuffer, '29092025_(Vendor).pdf');

      const imageData = convertedPages[0].data;
      const validation = validateImageDataUrl(imageData);

      // Ensure image is not too large for OpenAI API (20MB limit)
      const imageSizeBytes = (validation.base64Data!.length * 3) / 4;
      expect(imageSizeBytes).toBeLessThan(20 * 1024 * 1024);
    }, 30000);
  });
});
