/**
 * Vitest tests for PDF to Image conversion with real test files
 *
 * These tests verify that both test PDFs convert successfully:
 * - test/29092025_(Vendor).pdf (Restaurant invoice)
 * - test/08102025_Bezahlung MASTERCARD.pdf (Credit card receipt)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { convertPdfToImagesAllPages } from './pdf-to-image-multipage';
import { validateImageDataUrl } from './image-validation';

describe('PDF to Image Conversion - Vitest', () => {
  const testFilesDir = path.join(__dirname, '../../test');

  const testFiles = [
    {
      name: '29092025_(Vendor).pdf',
      description: 'Restaurant invoice PDF',
      expectedType: 'Rechnung'
    },
    {
      name: '08102025_Bezahlung MASTERCARD.pdf',
      description: 'Credit card receipt PDF',
      expectedType: 'Kreditkartenbeleg'
    }
  ];

  beforeAll(() => {
    // Verify test files exist
    testFiles.forEach(file => {
      const filePath = path.join(testFilesDir, file.name);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Test file not found: ${filePath}`);
      }
    });
  });

  describe('File Existence', () => {
    testFiles.forEach(file => {
      it(`should have ${file.description}`, () => {
        const filePath = path.join(testFilesDir, file.name);
        expect(fs.existsSync(filePath)).toBe(true);

        const stats = fs.statSync(filePath);
        expect(stats.size).toBeGreaterThan(0);
        console.log(`✓ ${file.description}: ${Math.round(stats.size / 1024)}KB`);
      });
    });
  });

  describe('PDF to JPEG Conversion', () => {
    testFiles.forEach(file => {
      it(`should convert ${file.description} to JPEG`, async () => {
        const filePath = path.join(testFilesDir, file.name);
        const pdfBuffer = fs.readFileSync(filePath);

        const result = await convertPdfToImagesAllPages(pdfBuffer, file.name);

        // Verify conversion succeeded
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);

        // Verify first page
        const firstPage = result[0];
        expect(firstPage.pageNumber).toBe(1);
        expect(firstPage.data).toContain('data:image/jpeg;base64,');
        expect(firstPage.name).toContain(file.name.replace('.pdf', ''));

        console.log(`✓ ${file.description} converted successfully`);
      });
    });
  });

  describe('PDF to PNG Conversion', () => {
    testFiles.forEach(file => {
      it(`should convert ${file.description} to PNG`, async () => {
        const filePath = path.join(testFilesDir, file.name);
        const pdfBuffer = fs.readFileSync(filePath);

        const result = await convertPdfToImagesAllPages(pdfBuffer, file.name, { format: 'png' });

        // Verify conversion succeeded
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);

        // Verify PNG format
        const firstPage = result[0];
        expect(firstPage.data).toContain('data:image/png;base64,');
        expect(firstPage.name).toMatch(/\.png$/);

        console.log(`✓ ${file.description} converted to PNG successfully`);
      });
    });
  });

  describe('Image Validation', () => {
    testFiles.forEach(file => {
      it(`should produce OpenAI-compatible image from ${file.description}`, async () => {
        const filePath = path.join(testFilesDir, file.name);
        const pdfBuffer = fs.readFileSync(filePath);
        const result = await convertPdfToImagesAllPages(pdfBuffer, file.name);

        const imageData = result[0].data;

        // Validate image format
        const validation = validateImageDataUrl(imageData);

        expect(validation.valid).toBe(true);
        expect(validation.format).toBe('jpeg');
        expect(validation.base64Data).toBeDefined();
        expect(validation.base64Data!.length).toBeGreaterThan(0);

        // Check size is within OpenAI limits
        const imageSizeBytes = (validation.base64Data!.length * 3) / 4;
        expect(imageSizeBytes).toBeLessThan(20 * 1024 * 1024); // < 20MB

        console.log(`✓ ${file.description} image validated: ${validation.format}, ${Math.round(imageSizeBytes / 1024)}KB`);
      });
    });
  });

  describe('Format Fallback', () => {
    testFiles.forEach(file => {
      it(`should support format fallback for ${file.description}`, async () => {
        const filePath = path.join(testFilesDir, file.name);
        const pdfBuffer = fs.readFileSync(filePath);

        // Try JPEG
        const jpegResult = await convertPdfToImagesAllPages(pdfBuffer, file.name, { format: 'jpeg' });
        expect(jpegResult[0].data).toContain('data:image/jpeg;base64,');

        // Try PNG
        const pngResult = await convertPdfToImagesAllPages(pdfBuffer, file.name, { format: 'png' });
        expect(pngResult[0].data).toContain('data:image/png;base64,');

        // Both should succeed
        expect(jpegResult.length).toBe(pngResult.length);
        console.log(`✓ ${file.description} supports both JPEG and PNG`);
      });
    });
  });

  describe('Data URL Format', () => {
    testFiles.forEach(file => {
      it(`should produce valid data URL for ${file.description}`, async () => {
        const filePath = path.join(testFilesDir, file.name);
        const pdfBuffer = fs.readFileSync(filePath);
        const result = await convertPdfToImagesAllPages(pdfBuffer, file.name);

        const dataUrl = result[0].data;

        // Verify data URL format
        expect(dataUrl).toMatch(/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+=*$/);

        // Verify base64 can be decoded
        const base64Data = dataUrl.split(',')[1];
        expect(() => {
          Buffer.from(base64Data, 'base64');
        }).not.toThrow();

        // Verify non-empty
        const imageSize = Buffer.from(base64Data, 'base64').length;
        expect(imageSize).toBeGreaterThan(1024); // At least 1KB

        console.log(`✓ ${file.description} produces valid data URL: ${Math.round(imageSize / 1024)}KB`);
      });
    });
  });

  describe('Performance', () => {
    testFiles.forEach(file => {
      it(`should convert ${file.description} within reasonable time`, async () => {
        const filePath = path.join(testFilesDir, file.name);
        const pdfBuffer = fs.readFileSync(filePath);

        const startTime = Date.now();
        await convertPdfToImagesAllPages(pdfBuffer, file.name);
        const duration = Date.now() - startTime;

        // Should complete within 10 seconds
        expect(duration).toBeLessThan(10000);
        console.log(`✓ ${file.description} converted in ${duration}ms`);
      });
    });
  });
});
