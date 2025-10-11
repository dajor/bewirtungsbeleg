/**
 * Integration tests for document upload API
 * POST /api/documents/upload
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { sampleReceiptMetadata } from '@/__tests__/fixtures/sample-receipt-metadata';
import { mockSession, mockUnauthenticatedSession } from '@/__tests__/utils/mock-session';
import { mockUploadResult } from '@/__tests__/utils/mock-spaces';
import { sampleEmbedding1 } from '@/__tests__/fixtures/sample-embeddings';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock authOptions
vi.mock('../../auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

// Mock spaces module
vi.mock('@/lib/spaces', () => ({
  uploadDocumentSet: vi.fn(),
}));

// Mock embeddings module
vi.mock('@/lib/embeddings', () => ({
  generateDocumentEmbedding: vi.fn(),
  generateEmbeddingText: vi.fn(),
}));

// Mock opensearch module
vi.mock('@/lib/opensearch', () => ({
  indexDocument: vi.fn(),
}));

// Mock middleware
vi.mock('@/middleware/ensure-user-index', () => ({
  ensureUserIndexMiddleware: vi.fn(),
}));

describe('POST /api/documents/upload - Upload API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockUnauthenticatedSession);

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Nicht authentifiziert');
    });

    it('should accept authenticated requests with valid session', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const { indexDocument } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(mockUploadResult);
      (generateDocumentEmbedding as any).mockResolvedValue(sampleEmbedding1);
      (generateEmbeddingText as any).mockReturnValue('Sample text');
      (indexDocument as any).mockResolvedValue(true);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should extract user ID from session', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const { indexDocument } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(mockUploadResult);
      (generateDocumentEmbedding as any).mockResolvedValue(sampleEmbedding1);
      (generateEmbeddingText as any).mockReturnValue('Sample text');
      (indexDocument as any).mockResolvedValue(true);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      await POST(request);

      expect(ensureUserIndexMiddleware).toHaveBeenCalledWith(mockSession.user.id);
    });
  });

  describe('Request Validation', () => {
    it('should reject requests without pdfBase64', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pngBase64: 'test',
          metadata: sampleReceiptMetadata,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('erforderlich');
    });

    it('should reject requests without pngBase64', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64: 'test',
          metadata: sampleReceiptMetadata,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('erforderlich');
    });

    it('should reject requests without metadata', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64: 'test',
          pngBase64: 'test',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('erforderlich');
    });

    it('should accept valid request body', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const { indexDocument } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(mockUploadResult);
      (generateDocumentEmbedding as any).mockResolvedValue(sampleEmbedding1);
      (generateEmbeddingText as any).mockReturnValue('Sample text');
      (indexDocument as any).mockResolvedValue(true);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('File Upload Flow', () => {
    it('should convert base64 to Buffer correctly', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const { indexDocument } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(mockUploadResult);
      (generateDocumentEmbedding as any).mockResolvedValue(sampleEmbedding1);
      (generateEmbeddingText as any).mockReturnValue('Sample text');
      (indexDocument as any).mockResolvedValue(true);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfContent = 'PDF test content';
      const pngContent = 'PNG test content';
      const pdfBase64 = Buffer.from(pdfContent).toString('base64');
      const pngBase64 = Buffer.from(pngContent).toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      await POST(request);

      expect(uploadDocumentSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Buffer),
        expect.any(Buffer),
        sampleReceiptMetadata
      );
    });

    it('should upload to DigitalOcean Spaces', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const { indexDocument } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(mockUploadResult);
      (generateDocumentEmbedding as any).mockResolvedValue(sampleEmbedding1);
      (generateEmbeddingText as any).mockReturnValue('Sample text');
      (indexDocument as any).mockResolvedValue(true);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      await POST(request);

      expect(uploadDocumentSet).toHaveBeenCalledTimes(1);
    });

    it('should return 500 when Spaces upload fails', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(null);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should receive all three URLs on successful upload', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const { indexDocument } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(mockUploadResult);
      (generateDocumentEmbedding as any).mockResolvedValue(sampleEmbedding1);
      (generateEmbeddingText as any).mockReturnValue('Sample text');
      (indexDocument as any).mockResolvedValue(true);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.document.pdfUrl).toBeDefined();
      expect(data.document.pngUrl).toBeDefined();
      expect(data.document.metadataUrl).toBeDefined();
    });
  });

  describe('Embedding Generation', () => {
    it('should generate vector embedding from metadata', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const { indexDocument } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(mockUploadResult);
      (generateDocumentEmbedding as any).mockResolvedValue(sampleEmbedding1);
      (generateEmbeddingText as any).mockReturnValue('Sample text');
      (indexDocument as any).mockResolvedValue(true);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      await POST(request);

      expect(generateDocumentEmbedding).toHaveBeenCalledWith(sampleReceiptMetadata);
    });

    it('should continue if embedding generation fails', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const { indexDocument } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(mockUploadResult);
      (generateDocumentEmbedding as any).mockResolvedValue(null); // Embedding fails
      (generateEmbeddingText as any).mockReturnValue('Sample text');
      (indexDocument as any).mockResolvedValue(true);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(indexDocument).toHaveBeenCalled();
    });

    it('should generate fulltext content', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const { indexDocument } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(mockUploadResult);
      (generateDocumentEmbedding as any).mockResolvedValue(sampleEmbedding1);
      (generateEmbeddingText as any).mockReturnValue('Sample fulltext content');
      (indexDocument as any).mockResolvedValue(true);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      await POST(request);

      expect(generateEmbeddingText).toHaveBeenCalledWith(sampleReceiptMetadata);
    });
  });

  describe('OpenSearch Indexing', () => {
    it('should index document in OpenSearch', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const { indexDocument } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(mockUploadResult);
      (generateDocumentEmbedding as any).mockResolvedValue(sampleEmbedding1);
      (generateEmbeddingText as any).mockReturnValue('Sample text');
      (indexDocument as any).mockResolvedValue(true);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      await POST(request);

      expect(indexDocument).toHaveBeenCalledWith(
        mockSession.user.id,
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          type: expect.any(String),
          metadata: expect.any(Object),
        })
      );
    });

    it('should include embedding in indexed document', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const { indexDocument } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(mockUploadResult);
      (generateDocumentEmbedding as any).mockResolvedValue(sampleEmbedding1);
      (generateEmbeddingText as any).mockReturnValue('Sample text');
      (indexDocument as any).mockResolvedValue(true);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      await POST(request);

      const callArgs = (indexDocument as any).mock.calls[0][1];
      expect(callArgs.embedding).toEqual(sampleEmbedding1);
    });

    it('should include form_data in indexed document', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const { indexDocument } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(mockUploadResult);
      (generateDocumentEmbedding as any).mockResolvedValue(sampleEmbedding1);
      (generateEmbeddingText as any).mockReturnValue('Sample text');
      (indexDocument as any).mockResolvedValue(true);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      await POST(request);

      const callArgs = (indexDocument as any).mock.calls[0][1];
      expect(callArgs.form_data).toEqual(sampleReceiptMetadata);
    });

    it('should generate GoBD signature hash', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const { indexDocument } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(mockUploadResult);
      (generateDocumentEmbedding as any).mockResolvedValue(sampleEmbedding1);
      (generateEmbeddingText as any).mockReturnValue('Sample text');
      (indexDocument as any).mockResolvedValue(true);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(indexDocument).toHaveBeenCalled();
      const callArgs = (indexDocument as any).mock.calls[0][1];
      expect(callArgs.signature_hash).toMatch(/^sha256-/);
    });
  });

  describe('Response', () => {
    it('should return success: true on complete upload', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const { indexDocument } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(mockUploadResult);
      (generateDocumentEmbedding as any).mockResolvedValue(sampleEmbedding1);
      (generateEmbeddingText as any).mockReturnValue('Sample text');
      (indexDocument as any).mockResolvedValue(true);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
    });

    it('should return document with all URLs', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const { indexDocument } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(mockUploadResult);
      (generateDocumentEmbedding as any).mockResolvedValue(sampleEmbedding1);
      (generateEmbeddingText as any).mockReturnValue('Sample text');
      (indexDocument as any).mockResolvedValue(true);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.document).toBeDefined();
      expect(data.document.id).toBeDefined();
      expect(data.document.pdfUrl).toBeDefined();
      expect(data.document.pngUrl).toBeDefined();
      expect(data.document.metadataUrl).toBeDefined();
    });

    it('should return 500 on errors', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockRejectedValue(new Error('Upload failed'));
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });

  describe('BDD Scenario: Complete document upload workflow', () => {
    it('Given authenticated user with complete data, When uploading to GoBD-Tresor, Then all steps should complete successfully', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const { indexDocument } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (uploadDocumentSet as any).mockResolvedValue(mockUploadResult);
      (generateDocumentEmbedding as any).mockResolvedValue(sampleEmbedding1);
      (generateEmbeddingText as any).mockReturnValue('Sample text');
      (indexDocument as any).mockResolvedValue(true);
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      // Given authenticated user
      const pdfBase64 = Buffer.from('PDF content').toString('base64');
      const pngBase64 = Buffer.from('PNG content').toString('base64');

      // When uploading
      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata: sampleReceiptMetadata,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Then all steps complete
      expect(uploadDocumentSet).toHaveBeenCalled(); // Spaces upload
      expect(generateDocumentEmbedding).toHaveBeenCalled(); // Embedding generation
      expect(indexDocument).toHaveBeenCalled(); // OpenSearch indexing
      expect(data.success).toBe(true);
      expect(data.document.pdfUrl).toBeDefined();
      expect(data.document.pngUrl).toBeDefined();
      expect(data.document.metadataUrl).toBeDefined();
    });
  });
});
