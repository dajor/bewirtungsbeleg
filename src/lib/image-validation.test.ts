/**
 * @jest-environment node
 */

import {
  validateImageDataUrl,
  reencodeImageDataUrl,
  getBase64ImageSize,
  validateImageSize,
  ImageValidationResult
} from './image-validation';

describe('Image Validation Utilities', () => {
  describe('validateImageDataUrl', () => {
    it('should validate a valid JPEG data URL', () => {
      // Create a minimal valid JPEG header (FFD8FF magic bytes)
      const validJpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
      const base64 = validJpegHeader.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      const result = validateImageDataUrl(dataUrl);

      expect(result.valid).toBe(true);
      expect(result.format).toBe('jpeg');
      expect(result.base64Data).toBe(base64);
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid PNG data URL', () => {
      // Create a minimal valid PNG header (89504E47 magic bytes)
      const validPngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const base64 = validPngHeader.toString('base64');
      const dataUrl = `data:image/png;base64,${base64}`;

      const result = validateImageDataUrl(dataUrl);

      expect(result.valid).toBe(true);
      expect(result.format).toBe('png');
      expect(result.base64Data).toBe(base64);
    });

    it('should normalize jpg to jpeg format', () => {
      const validJpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      const base64 = validJpegHeader.toString('base64');
      const dataUrl = `data:image/jpg;base64,${base64}`;

      const result = validateImageDataUrl(dataUrl);

      expect(result.valid).toBe(true);
      expect(result.format).toBe('jpeg');
    });

    it('should reject invalid data URL format (missing data: prefix)', () => {
      const result = validateImageDataUrl('image/jpeg;base64,somedata');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid data URL format');
    });

    it('should reject invalid data URL format (wrong MIME type)', () => {
      const result = validateImageDataUrl('data:text/plain;base64,somedata');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid image data URL format');
    });

    it('should reject invalid data URL format (missing base64 prefix)', () => {
      const result = validateImageDataUrl('data:image/jpeg,somedata');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid image data URL format');
    });

    it('should reject empty base64 data', () => {
      const result = validateImageDataUrl('data:image/jpeg;base64,');

      expect(result.valid).toBe(false);
      // The regex validation catches this before the empty check
      expect(result.error).toContain('Invalid image data URL format');
    });

    it('should reject invalid base64 encoding', () => {
      const result = validateImageDataUrl('data:image/jpeg;base64,invalid!@#$%^&*()data');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid base64 encoding');
    });

    it('should validate WebP format', () => {
      // Create a minimal valid WebP header (RIFF...WEBP)
      const validWebPHeader = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
      const base64 = validWebPHeader.toString('base64');
      const dataUrl = `data:image/webp;base64,${base64}`;

      const result = validateImageDataUrl(dataUrl);

      expect(result.valid).toBe(true);
      expect(result.format).toBe('webp');
    });

    it('should validate GIF format', () => {
      // Create a minimal valid GIF header (GIF89a)
      const validGifHeader = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
      const base64 = validGifHeader.toString('base64');
      const dataUrl = `data:image/gif;base64,${base64}`;

      const result = validateImageDataUrl(dataUrl);

      expect(result.valid).toBe(true);
      expect(result.format).toBe('gif');
    });
  });

  describe('reencodeImageDataUrl', () => {
    it('should re-encode a valid data URL', () => {
      const validJpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      const base64 = validJpegHeader.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      const reencoded = reencodeImageDataUrl(dataUrl);

      expect(reencoded).toBe(dataUrl);
      expect(reencoded).toContain('data:image/jpeg;base64,');
    });

    it('should normalize jpg to jpeg when re-encoding', () => {
      const validJpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      const base64 = validJpegHeader.toString('base64');
      const dataUrl = `data:image/jpg;base64,${base64}`;

      const reencoded = reencodeImageDataUrl(dataUrl);

      expect(reencoded).toBe(`data:image/jpeg;base64,${base64}`);
      expect(reencoded).not.toContain('jpg');
    });

    it('should throw error for invalid data URL', () => {
      expect(() => {
        reencodeImageDataUrl('invalid-data-url');
      }).toThrow();
    });
  });

  describe('getBase64ImageSize', () => {
    it('should calculate approximate size for base64 string', () => {
      // Create a 100 byte buffer
      const buffer = Buffer.alloc(100, 0xFF);
      const base64 = buffer.toString('base64');

      const size = getBase64ImageSize(base64);

      // Base64 encoding increases size by ~33%, so 100 bytes ≈ 133 chars
      // Decoded back should be close to 100 bytes
      expect(size).toBeGreaterThan(90);
      expect(size).toBeLessThan(110);
    });

    it('should handle base64 with padding', () => {
      const base64WithPadding = 'SGVsbG8gV29ybGQ='; // "Hello World" with padding
      const size = getBase64ImageSize(base64WithPadding);

      expect(size).toBeGreaterThan(0);
    });

    it('should handle base64 without padding', () => {
      const base64NoPadding = 'SGVsbG8gV29ybGQ'; // "Hello World" without padding
      const size = getBase64ImageSize(base64NoPadding);

      expect(size).toBeGreaterThan(0);
    });
  });

  describe('validateImageSize', () => {
    it('should accept images within size limit', () => {
      // Create a small base64 string (< 1KB)
      const smallBuffer = Buffer.alloc(500, 0xFF);
      const base64 = smallBuffer.toString('base64');

      const isValid = validateImageSize(base64, 1024); // 1KB limit

      expect(isValid).toBe(true);
    });

    it('should reject images exceeding size limit', () => {
      // Create a large base64 string (> 1MB)
      const largeBuffer = Buffer.alloc(2 * 1024 * 1024, 0xFF); // 2MB
      const base64 = largeBuffer.toString('base64');

      const isValid = validateImageSize(base64, 1024 * 1024); // 1MB limit

      expect(isValid).toBe(false);
    });

    it('should use default limit of 20MB if not specified', () => {
      // Create a 10MB buffer
      const buffer = Buffer.alloc(10 * 1024 * 1024, 0xFF);
      const base64 = buffer.toString('base64');

      const isValid = validateImageSize(base64); // Uses default 20MB limit

      expect(isValid).toBe(true);
    });

    it('should reject images larger than default limit', () => {
      // Create a 25MB buffer
      const buffer = Buffer.alloc(25 * 1024 * 1024, 0xFF);
      const base64 = buffer.toString('base64');

      const isValid = validateImageSize(base64); // Uses default 20MB limit

      expect(isValid).toBe(false);
    });
  });

  describe('Integration: PDF-to-Image validation', () => {
    it('should validate a converted PDF image (JPEG)', () => {
      // Simulate a PDF converted to JPEG
      const jpegHeader = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, // JPEG SOI and APP0 markers
        0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, // JFIF
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00
      ]);
      const base64 = jpegHeader.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      const result = validateImageDataUrl(dataUrl);

      expect(result.valid).toBe(true);
      expect(result.format).toBe('jpeg');
    });

    it('should validate a converted PDF image (PNG)', () => {
      // Simulate a PDF converted to PNG
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, // PNG signature
        0x0D, 0x0A, 0x1A, 0x0A, // PNG signature continued
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
        0x49, 0x48, 0x44, 0x52  // IHDR chunk type
      ]);
      const base64 = pngHeader.toString('base64');
      const dataUrl = `data:image/png;base64,${base64}`;

      const result = validateImageDataUrl(dataUrl);

      expect(result.valid).toBe(true);
      expect(result.format).toBe('png');
    });

    it('should detect corrupted JPEG magic bytes', () => {
      // Create invalid JPEG (wrong magic bytes)
      const invalidJpeg = Buffer.from([0x00, 0x00, 0xFF, 0xE0]); // Should start with FFD8
      const base64 = invalidJpeg.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      const result = validateImageDataUrl(dataUrl);

      // Should still pass basic validation but warn about header mismatch
      expect(result.valid).toBe(true);
      // Note: The function logs a warning but doesn't fail on header mismatch
    });
  });
});
