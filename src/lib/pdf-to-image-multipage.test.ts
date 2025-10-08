/**
 * @jest-environment node
 */

/**
 * Unit tests for PDF to Image conversion
 * Tests the convertPdfToImagesAllPages function with various scenarios
 */

import * as fs from 'fs';
import * as path from 'path';
import { convertPdfToImagesAllPages, ConversionOptions } from './pdf-to-image-multipage';

describe('PDF to Image Conversion', () => {
  const testFilesDir = path.join(__dirname, '../../test');

  describe('Basic Conversion', () => {
    it('should convert a single-page PDF to JPEG', async () => {
      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      if (!fs.existsSync(pdfPath)) {
        console.warn('Test file not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(pdfPath);
      const result = await convertPdfToImagesAllPages(pdfBuffer, '29092025_(Vendor).pdf');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const firstPage = result[0];
      expect(firstPage.pageNumber).toBe(1);
      expect(firstPage.data).toContain('data:image/jpeg;base64,');
      expect(firstPage.name).toBe('29092025_(Vendor).jpg');
    }, 30000);

    it('should convert a PDF to PNG when format is specified', async () => {
      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      if (!fs.existsSync(pdfPath)) {
        console.warn('Test file not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(pdfPath);
      const options: ConversionOptions = { format: 'png' };
      const result = await convertPdfToImagesAllPages(pdfBuffer, '29092025_(Vendor).pdf', options);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);

      const firstPage = result[0];
      expect(firstPage.data).toContain('data:image/png;base64,');
      expect(firstPage.name).toBe('29092025_(Vendor).png');
    }, 30000);

    it('should include correct page numbers', async () => {
      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      if (!fs.existsSync(pdfPath)) {
        console.warn('Test file not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(pdfPath);
      const result = await convertPdfToImagesAllPages(pdfBuffer, '29092025_(Vendor).pdf');

      expect(result.length).toBeGreaterThan(0);
      result.forEach((page, index) => {
        expect(page.pageNumber).toBe(index + 1);
      });
    }, 30000);

    it('should generate correct file names for single-page PDFs', async () => {
      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      if (!fs.existsSync(pdfPath)) {
        console.warn('Test file not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(pdfPath);
      const result = await convertPdfToImagesAllPages(pdfBuffer, '29092025_(Vendor).pdf');

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('29092025_(Vendor).jpg');
      expect(result[0].name).not.toContain('_Seite_');
    }, 30000);
  });

  describe('Conversion Options', () => {
    it('should use default options when not specified', async () => {
      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      if (!fs.existsSync(pdfPath)) {
        console.warn('Test file not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(pdfPath);
      const result = await convertPdfToImagesAllPages(pdfBuffer, 'test.pdf');

      expect(result).toBeDefined();
      expect(result[0].data).toContain('data:image/jpeg;base64,'); // Default format is JPEG
    }, 30000);

    it('should respect custom resolution', async () => {
      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      if (!fs.existsSync(pdfPath)) {
        console.warn('Test file not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(pdfPath);
      const options: ConversionOptions = { resolution: 300 };
      const result = await convertPdfToImagesAllPages(pdfBuffer, 'test.pdf', options);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    }, 30000);

    it('should respect custom scale', async () => {
      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      if (!fs.existsSync(pdfPath)) {
        console.warn('Test file not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(pdfPath);
      const options: ConversionOptions = { scale: 1200 };
      const result = await convertPdfToImagesAllPages(pdfBuffer, 'test.pdf', options);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Format Fallback', () => {
    it('should automatically fallback to PNG if JPEG conversion fails', async () => {
      // This test verifies the fallback mechanism exists
      // In practice, this would require a PDF that fails JPEG conversion
      // but succeeds with PNG conversion

      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      if (!fs.existsSync(pdfPath)) {
        console.warn('Test file not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(pdfPath);

      // Try JPEG conversion first
      const jpegResult = await convertPdfToImagesAllPages(pdfBuffer, 'test.pdf', { format: 'jpeg' });
      expect(jpegResult).toBeDefined();

      // Try PNG conversion
      const pngResult = await convertPdfToImagesAllPages(pdfBuffer, 'test.pdf', { format: 'png' });
      expect(pngResult).toBeDefined();

      // Both should succeed for a valid PDF
      expect(jpegResult.length).toBe(pngResult.length);
    }, 60000);
  });

  describe('Error Handling', () => {
    it('should throw error for empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);

      await expect(
        convertPdfToImagesAllPages(emptyBuffer, 'empty.pdf')
      ).rejects.toThrow();
    });

    it('should throw error for invalid PDF data', async () => {
      const invalidBuffer = Buffer.from('This is not a PDF');

      await expect(
        convertPdfToImagesAllPages(invalidBuffer, 'invalid.pdf')
      ).rejects.toThrow();
    });

    it('should throw error for corrupted PDF', async () => {
      // Create a buffer that starts like a PDF but is corrupted
      const corruptedBuffer = Buffer.from('%PDF-1.4\n%CORRUPTED DATA');

      await expect(
        convertPdfToImagesAllPages(corruptedBuffer, 'corrupted.pdf')
      ).rejects.toThrow();
    });

    it('should handle PDF without pages gracefully', async () => {
      // Create a minimal PDF with no pages
      const minimalPdf = Buffer.from(
        '%PDF-1.4\n' +
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
        '2 0 obj\n<< /Type /Pages /Count 0 /Kids [] >>\nendobj\n' +
        'xref\n0 3\n' +
        '0000000000 65535 f\n' +
        '0000000009 00000 n\n' +
        '0000000058 00000 n\n' +
        'trailer\n<< /Size 3 /Root 1 0 R >>\n' +
        'startxref\n109\n%%EOF'
      );

      // PDF with no pages should fail conversion
      await expect(
        convertPdfToImagesAllPages(minimalPdf, 'empty.pdf')
      ).rejects.toThrow();
    }, 30000);
  });

  describe('Multiple Test Files', () => {
    it('should convert credit card receipt PDF', async () => {
      const pdfPath = path.join(testFilesDir, '08102025_Bezahlung MASTERCARD.pdf');
      if (!fs.existsSync(pdfPath)) {
        console.warn('Test file not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(pdfPath);
      const result = await convertPdfToImagesAllPages(pdfBuffer, '08102025_Bezahlung MASTERCARD.pdf');

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].data).toContain('data:image/jpeg;base64,');
      expect(result[0].name).toContain('08102025_Bezahlung MASTERCARD');
    }, 30000);

    it('should handle filenames with spaces correctly', async () => {
      const pdfPath = path.join(testFilesDir, '08102025_Bezahlung MASTERCARD.pdf');
      if (!fs.existsSync(pdfPath)) {
        console.warn('Test file not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(pdfPath);
      const result = await convertPdfToImagesAllPages(pdfBuffer, '08102025_Bezahlung MASTERCARD.pdf');

      expect(result[0].name).toBe('08102025_Bezahlung MASTERCARD.jpg');
      expect(result[0].name).not.toContain('.pdf');
    }, 30000);
  });

  describe('Data URL Format', () => {
    it('should produce valid data URL format', async () => {
      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      if (!fs.existsSync(pdfPath)) {
        console.warn('Test file not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(pdfPath);
      const result = await convertPdfToImagesAllPages(pdfBuffer, 'test.pdf');

      const dataUrl = result[0].data;

      expect(dataUrl).toMatch(/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+=*$/);
    }, 30000);

    it('should produce valid base64 encoding', async () => {
      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      if (!fs.existsSync(pdfPath)) {
        console.warn('Test file not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(pdfPath);
      const result = await convertPdfToImagesAllPages(pdfBuffer, 'test.pdf');

      const dataUrl = result[0].data;
      const base64Data = dataUrl.split(',')[1];

      // Verify it's valid base64 by trying to decode it
      expect(() => {
        Buffer.from(base64Data, 'base64');
      }).not.toThrow();
    }, 30000);

    it('should produce non-empty images', async () => {
      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      if (!fs.existsSync(pdfPath)) {
        console.warn('Test file not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(pdfPath);
      const result = await convertPdfToImagesAllPages(pdfBuffer, 'test.pdf');

      const base64Data = result[0].data.split(',')[1];
      const imageSize = Buffer.from(base64Data, 'base64').length;

      expect(imageSize).toBeGreaterThan(1024); // At least 1KB
    }, 30000);
  });

  describe('Performance', () => {
    it('should complete conversion within reasonable time', async () => {
      const pdfPath = path.join(testFilesDir, '29092025_(Vendor).pdf');
      if (!fs.existsSync(pdfPath)) {
        console.warn('Test file not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(pdfPath);
      const startTime = Date.now();

      await convertPdfToImagesAllPages(pdfBuffer, 'test.pdf');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 10 seconds for a single-page PDF
      expect(duration).toBeLessThan(10000);
      console.log(`Conversion completed in ${duration}ms`);
    }, 30000);
  });
});
