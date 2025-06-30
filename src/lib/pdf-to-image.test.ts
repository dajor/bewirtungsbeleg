/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';
import { convertPdfToImage, isPdfFile } from './pdf-to-image';

describe('PDF to Image Conversion', () => {
  const testPdfPath = path.join(__dirname, '../../test/input.pdf');
  
  beforeAll(() => {
    // Ensure test PDF exists
    if (!fs.existsSync(testPdfPath)) {
      throw new Error('Test PDF not found. Please ensure test/input.pdf exists for testing.');
    }
  });

  describe('isPdfFile', () => {
    it('should correctly identify PDF files by extension', () => {
      expect(isPdfFile('document.pdf')).toBe(true);
      expect(isPdfFile('document.PDF')).toBe(true);
      expect(isPdfFile('document.txt')).toBe(false);
      expect(isPdfFile('image.jpg')).toBe(false);
    });

    it('should correctly identify PDF files by File object', () => {
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      expect(isPdfFile(pdfFile)).toBe(true);
      expect(isPdfFile(txtFile)).toBe(false);
    });
  });

  describe('convertPdfToImage', () => {
    it('should convert PDF to base64 image with actual content', async () => {
      const pdfBuffer = fs.readFileSync(testPdfPath);
      const fileName = 'test_document.pdf';
      
      console.log(`📄 Testing PDF conversion for file: ${fileName}`);
      console.log(`📊 PDF size: ${pdfBuffer.length} bytes`);
      
      const result = await convertPdfToImage(pdfBuffer, fileName);
      
      // Verify it's a valid base64 image
      expect(result).toMatch(/^data:image\/jpeg;base64,/);
      
      // Extract base64 content
      const base64Content = result.replace(/^data:image\/jpeg;base64,/, '');
      expect(base64Content.length).toBeGreaterThan(1000); // Should be substantial image data
      
      // Verify base64 is valid
      expect(() => Buffer.from(base64Content, 'base64')).not.toThrow();
      
      const imageBuffer = Buffer.from(base64Content, 'base64');
      console.log(`🖼️ Generated image size: ${imageBuffer.length} bytes`);
      
      // Actual PDF content should generate larger images than placeholders
      expect(imageBuffer.length).toBeGreaterThan(50000); // Real PDF content is substantial
      
      // Save the result for visual inspection
      const outputPath = path.join(__dirname, '../../test/converted_pdf_image.jpg');
      fs.writeFileSync(outputPath, imageBuffer);
      console.log(`💾 Converted image saved to: ${outputPath}`);
      
    }, 30000); // 30 second timeout for PDF processing

    it('should handle invalid PDF gracefully', async () => {
      const invalidBuffer = Buffer.from('This is not a PDF file', 'utf-8');
      const fileName = 'invalid.pdf';
      
      const result = await convertPdfToImage(invalidBuffer, fileName);
      
      // Should still return a valid image (fallback)
      expect(result).toMatch(/^data:image\/jpeg;base64,/);
      
      const base64Content = result.replace(/^data:image\/jpeg;base64,/, '');
      const imageBuffer = Buffer.from(base64Content, 'base64');
      
      // Fallback images are smaller
      expect(imageBuffer.length).toBeLessThan(100000);
    });

    it('should handle empty buffer gracefully', async () => {
      const emptyBuffer = Buffer.alloc(0);
      const fileName = 'empty.pdf';
      
      const result = await convertPdfToImage(emptyBuffer, fileName);
      
      // Should return fallback image
      expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('should process different file names correctly', async () => {
      const pdfBuffer = fs.readFileSync(testPdfPath);
      const fileNames = [
        'simple.pdf',
        'document with spaces.pdf',
        'german-ümlaut-ß.pdf',
        'very_long_filename_that_might_cause_issues_with_some_systems.pdf'
      ];
      
      for (const fileName of fileNames) {
        const result = await convertPdfToImage(pdfBuffer, fileName);
        expect(result).toMatch(/^data:image\/jpeg;base64,/);
        
        const base64Content = result.replace(/^data:image\/jpeg;base64,/, '');
        const imageBuffer = Buffer.from(base64Content, 'base64');
        expect(imageBuffer.length).toBeGreaterThan(1000);
      }
    }, 60000); // Extended timeout for multiple conversions
  });

  describe('PDF Content Quality', () => {
    it('should generate high-quality images from PDF content', async () => {
      const pdfBuffer = fs.readFileSync(testPdfPath);
      const fileName = 'quality_test.pdf';
      
      const result = await convertPdfToImage(pdfBuffer, fileName);
      const base64Content = result.replace(/^data:image\/jpeg;base64,/, '');
      const imageBuffer = Buffer.from(base64Content, 'base64');
      
      // High-quality images should be substantial in size
      expect(imageBuffer.length).toBeGreaterThan(100000);
      
      // Verify JPEG header
      const jpegHeader = imageBuffer.slice(0, 2);
      expect(jpegHeader.toString('hex')).toBe('ffd8'); // JPEG magic bytes
      
      console.log(`✅ High-quality PDF conversion successful`);
      console.log(`📊 Final image size: ${imageBuffer.length} bytes`);
      console.log(`📐 Quality indicator: ${imageBuffer.length > 200000 ? 'Excellent' : 'Good'}`);
    });
  });
});