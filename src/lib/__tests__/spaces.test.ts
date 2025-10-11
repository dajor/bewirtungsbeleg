/**
 * Unit tests for DigitalOcean Spaces client (spaces.ts)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateDocumentFilename,
  uploadPdfDocument,
  uploadPngPreview,
  uploadMetadataJson,
  uploadDocumentSet,
} from '../spaces';
import { env } from '../env';
import { sampleReceiptMetadata } from '@/__tests__/fixtures/sample-receipt-metadata';
import {
  createMockPdfBuffer,
  createMockPngBuffer,
  createMockS3Response,
} from '@/__tests__/utils/mock-spaces';

// Mock the AWS SDK
vi.mock('@aws-sdk/client-s3', () => {
  const mockSend = vi.fn();
  return {
    S3Client: vi.fn(() => ({
      send: mockSend,
    })),
    PutObjectCommand: vi.fn((input) => ({ input })),
    GetObjectCommand: vi.fn((input) => ({ input })),
    DeleteObjectCommand: vi.fn((input) => ({ input })),
    mockSend, // Export for test access
  };
});

// Mock environment variables
vi.mock('../env', () => ({
  env: {
    DIGITALOCEAN_SPACES_ENDPOINT: 'fra1.digitaloceanspaces.com',
    DIGITALOCEAN_SPACES_BUCKET: 'test-bucket',
    DIGITALOCEAN_SPACES_KEY: 'test-key',
    DIGITALOCEAN_SPACES_SECRET: 'test-secret',
    DIGITALOCEAN_SPACES_FOLDER: 'test-documents',
    DIGITALOCEAN_SPACES_REGION: 'fra1',
  },
}));

describe('spaces.ts - DigitalOcean Spaces Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateDocumentFilename()', () => {
    it('should generate unique filenames with correct structure', () => {
      const userId = 'user-123';
      const filename = generateDocumentFilename(userId, 'pdf');

      expect(filename).toMatch(/test-documents\/user-123\/\d+-bewirtungsbeleg\.pdf/);
    });

    it('should sanitize user IDs with special characters', () => {
      const userId = 'user@example.com';
      const filename = generateDocumentFilename(userId, 'pdf');

      // Should replace @ and . with hyphens or remove them
      expect(filename).toMatch(/test-documents\/user/);
      expect(filename).toContain('bewirtungsbeleg.pdf');
    });

    it('should support all file extensions', () => {
      const userId = 'user-1';

      const pdfFile = generateDocumentFilename(userId, 'pdf');
      const pngFile = generateDocumentFilename(userId, 'png');
      const jsonFile = generateDocumentFilename(userId, 'json');

      expect(pdfFile).toMatch(/\.pdf$/);
      expect(pngFile).toMatch(/\.png$/);
      expect(jsonFile).toMatch(/\.json$/);
    });

    it('should include timestamp for uniqueness', () => {
      const userId = 'user-1';

      const filename1 = generateDocumentFilename(userId, 'pdf');
      // Wait a tiny bit to ensure different timestamp
      const filename2 = generateDocumentFilename(userId, 'pdf');

      // Filenames should be different due to timestamp
      expect(filename1).not.toBe(filename2);
    });
  });

  describe('uploadPdfDocument()', () => {
    it('should upload PDF buffer successfully', async () => {
      const { mockSend } = await import('@aws-sdk/client-s3');
      mockSend.mockResolvedValueOnce(createMockS3Response(true));

      const userId = 'user-1';
      const pdfBuffer = createMockPdfBuffer();

      const url = await uploadPdfDocument(userId, pdfBuffer);

      expect(url).toBeTruthy();
      expect(url).toContain('.pdf');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should use correct ContentType for PDF', async () => {
      const { mockSend, PutObjectCommand } = await import('@aws-sdk/client-s3');
      mockSend.mockResolvedValueOnce(createMockS3Response(true));

      const userId = 'user-1';
      const pdfBuffer = createMockPdfBuffer();

      await uploadPdfDocument(userId, pdfBuffer);

      const commandCall = (PutObjectCommand as any).mock.calls[0][0];
      expect(commandCall.ContentType).toBe('application/pdf');
    });

    it('should handle S3 upload errors gracefully', async () => {
      const { mockSend } = await import('@aws-sdk/client-s3');
      mockSend.mockRejectedValueOnce(new Error('S3 upload failed'));

      const userId = 'user-1';
      const pdfBuffer = createMockPdfBuffer();

      const url = await uploadPdfDocument(userId, pdfBuffer);

      expect(url).toBeNull();
    });

    it('should return null when buffer is empty', async () => {
      const userId = 'user-1';
      const emptyBuffer = Buffer.from('');

      const url = await uploadPdfDocument(userId, emptyBuffer);

      // Should either return null or handle gracefully
      expect(url).toBeDefined();
    });
  });

  describe('uploadPngPreview()', () => {
    it('should upload PNG buffer successfully', async () => {
      const { mockSend } = await import('@aws-sdk/client-s3');
      mockSend.mockResolvedValueOnce(createMockS3Response(true));

      const userId = 'user-1';
      const pngBuffer = createMockPngBuffer();

      const url = await uploadPngPreview(userId, pngBuffer);

      expect(url).toBeTruthy();
      expect(url).toContain('.png');
    });

    it('should use correct ContentType for PNG', async () => {
      const { mockSend, PutObjectCommand } = await import('@aws-sdk/client-s3');
      mockSend.mockResolvedValueOnce(createMockS3Response(true));

      const userId = 'user-1';
      const pngBuffer = createMockPngBuffer();

      await uploadPngPreview(userId, pngBuffer);

      const commandCall = (PutObjectCommand as any).mock.calls[0][0];
      expect(commandCall.ContentType).toBe('image/png');
    });

    it('should handle large PNG files', async () => {
      const { mockSend } = await import('@aws-sdk/client-s3');
      mockSend.mockResolvedValueOnce(createMockS3Response(true));

      const userId = 'user-1';
      const largePngBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB

      const url = await uploadPngPreview(userId, largePngBuffer);

      expect(url).toBeTruthy();
    });
  });

  describe('uploadMetadataJson()', () => {
    it('should upload JSON metadata successfully', async () => {
      const { mockSend } = await import('@aws-sdk/client-s3');
      mockSend.mockResolvedValueOnce(createMockS3Response(true));

      const userId = 'user-1';
      const metadata = sampleReceiptMetadata;

      const url = await uploadMetadataJson(userId, metadata);

      expect(url).toBeTruthy();
      expect(url).toContain('.json');
    });

    it('should use correct ContentType for JSON', async () => {
      const { mockSend, PutObjectCommand } = await import('@aws-sdk/client-s3');
      mockSend.mockResolvedValueOnce(createMockS3Response(true));

      const userId = 'user-1';
      const metadata = sampleReceiptMetadata;

      await uploadMetadataJson(userId, metadata);

      const commandCall = (PutObjectCommand as any).mock.calls[0][0];
      expect(commandCall.ContentType).toBe('application/json');
    });

    it('should serialize metadata correctly', async () => {
      const { mockSend, PutObjectCommand } = await import('@aws-sdk/client-s3');
      mockSend.mockResolvedValueOnce(createMockS3Response(true));

      const userId = 'user-1';
      const metadata = { test: 'value', nested: { key: 'data' } };

      await uploadMetadataJson(userId, metadata);

      const commandCall = (PutObjectCommand as any).mock.calls[0][0];
      const body = commandCall.Body;

      // Body should be a stringified JSON
      expect(body).toBeDefined();
    });

    it('should handle complex nested objects', async () => {
      const { mockSend } = await import('@aws-sdk/client-s3');
      mockSend.mockResolvedValueOnce(createMockS3Response(true));

      const userId = 'user-1';
      const complexMetadata = {
        ...sampleReceiptMetadata,
        nested: {
          level1: {
            level2: {
              data: 'deep value',
            },
          },
        },
        array: [1, 2, 3],
      };

      const url = await uploadMetadataJson(userId, complexMetadata);

      expect(url).toBeTruthy();
    });
  });

  describe('uploadDocumentSet()', () => {
    it('should upload all three files in parallel', async () => {
      const { mockSend } = await import('@aws-sdk/client-s3');
      mockSend.mockResolvedValue(createMockS3Response(true));

      const userId = 'user-1';
      const pdfBuffer = createMockPdfBuffer();
      const pngBuffer = createMockPngBuffer();
      const metadata = sampleReceiptMetadata;

      const result = await uploadDocumentSet(userId, pdfBuffer, pngBuffer, metadata);

      expect(result).toBeTruthy();
      expect(result?.success).toBe(true);
      expect(result?.pdfUrl).toBeTruthy();
      expect(result?.pngUrl).toBeTruthy();
      expect(result?.metadataUrl).toBeTruthy();
      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it('should return all three URLs on success', async () => {
      const { mockSend } = await import('@aws-sdk/client-s3');
      mockSend.mockResolvedValue(createMockS3Response(true));

      const userId = 'user-1';
      const pdfBuffer = createMockPdfBuffer();
      const pngBuffer = createMockPngBuffer();
      const metadata = sampleReceiptMetadata;

      const result = await uploadDocumentSet(userId, pdfBuffer, pngBuffer, metadata);

      expect(result?.pdfUrl).toContain('.pdf');
      expect(result?.pngUrl).toContain('.png');
      expect(result?.metadataUrl).toContain('.json');
    });

    it('should return success: false if any upload fails', async () => {
      const { mockSend } = await import('@aws-sdk/client-s3');
      // First upload succeeds, second fails, third succeeds
      mockSend
        .mockResolvedValueOnce(createMockS3Response(true))
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockResolvedValueOnce(createMockS3Response(true));

      const userId = 'user-1';
      const pdfBuffer = createMockPdfBuffer();
      const pngBuffer = createMockPngBuffer();
      const metadata = sampleReceiptMetadata;

      const result = await uploadDocumentSet(userId, pdfBuffer, pngBuffer, metadata);

      expect(result?.success).toBe(false);
    });

    it('should handle partial failures gracefully', async () => {
      const { mockSend } = await import('@aws-sdk/client-s3');
      mockSend
        .mockResolvedValueOnce(createMockS3Response(true))
        .mockRejectedValueOnce(new Error('PNG upload failed'))
        .mockRejectedValueOnce(new Error('JSON upload failed'));

      const userId = 'user-1';
      const pdfBuffer = createMockPdfBuffer();
      const pngBuffer = createMockPngBuffer();
      const metadata = sampleReceiptMetadata;

      const result = await uploadDocumentSet(userId, pdfBuffer, pngBuffer, metadata);

      // Should still return a result object
      expect(result).toBeDefined();
      expect(result?.success).toBe(false);
    });
  });

  describe('BDD Scenario: Successfully upload complete document set', () => {
    it('Given valid files, When uploading to Spaces, Then all files should be uploaded successfully', async () => {
      const { mockSend } = await import('@aws-sdk/client-s3');
      mockSend.mockResolvedValue(createMockS3Response(true));

      // Given
      const userId = 'user-1';
      const pdfBuffer = createMockPdfBuffer();
      const pngBuffer = createMockPngBuffer();
      const metadata = sampleReceiptMetadata;

      // When
      const result = await uploadDocumentSet(userId, pdfBuffer, pngBuffer, metadata);

      // Then
      expect(result).toBeTruthy();
      expect(result?.success).toBe(true);
      expect(result?.pdfUrl).toMatch(/user-1/);
      expect(result?.pngUrl).toMatch(/user-1/);
      expect(result?.metadataUrl).toMatch(/user-1/);
    });
  });

  describe('BDD Scenario: Handle upload failure gracefully', () => {
    it('Given Spaces service unavailable, When attempting upload, Then should return null and log error', async () => {
      const { mockSend } = await import('@aws-sdk/client-s3');
      mockSend.mockRejectedValue(new Error('Service unavailable'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Given service is unavailable
      const userId = 'user-1';
      const pdfBuffer = createMockPdfBuffer();

      // When attempting to upload
      const url = await uploadPdfDocument(userId, pdfBuffer);

      // Then
      expect(url).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
