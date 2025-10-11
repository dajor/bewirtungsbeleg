/**
 * Unit tests for OpenSearch Client (opensearch.ts)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkUserIndexExists,
  createUserIndex,
  indexDocument,
  searchDocuments,
  deleteDocument,
  ensureUserIndex,
} from '../opensearch';
import { sampleDocument1, sampleDocument2 } from '@/__tests__/fixtures/sample-documents';
import {
  createMockOpenSearchClient,
  mockSearchResponse,
  mockEmptySearchResponse,
} from '@/__tests__/utils/mock-opensearch';

// Mock OpenSearch
vi.mock('@opensearch-project/opensearch', () => ({
  Client: vi.fn(),
}));

// Note: AWS Sigv4Signer is no longer used (requires aws-sdk v2)
// The opensearch.ts file now uses basic auth only

// Mock environment
vi.mock('../env', () => ({
  env: {
    OPENSEARCH_URL: 'https://localhost:9200',
    OPENSEARCH_USERNAME: 'admin',
    OPENSEARCH_PASSWORD: 'admin',
    NODE_ENV: 'test',
  },
}));

describe('opensearch.ts - OpenSearch Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkUserIndexExists()', () => {
    it('should check if user index exists', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient({ indexExists: true });
      (Client as any).mockImplementation(() => mockClient);

      const exists = await checkUserIndexExists('user-1');

      expect(exists).toBe(true);
      expect(mockClient.indices.exists).toHaveBeenCalledWith({
        index: expect.stringContaining('user-1'),
      });
    });

    it('should return false when index does not exist', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient({ indexExists: false });
      (Client as any).mockImplementation(() => mockClient);

      const exists = await checkUserIndexExists('user-1');

      expect(exists).toBe(false);
    });

    it('should use cache for subsequent calls', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient({ indexExists: true });
      (Client as any).mockImplementation(() => mockClient);

      // First call
      await checkUserIndexExists('user-1');
      // Second call (should use cache)
      await checkUserIndexExists('user-1');

      // Should only call API once
      expect(mockClient.indices.exists).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient();
      mockClient.indices.exists.mockRejectedValue(new Error('Connection error'));
      (Client as any).mockImplementation(() => mockClient);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const exists = await checkUserIndexExists('user-1');

      expect(exists).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('createUserIndex()', () => {
    it('should create index with correct schema', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient({ indexExists: false });
      (Client as any).mockImplementation(() => mockClient);

      const success = await createUserIndex('user-1');

      expect(success).toBe(true);
      expect(mockClient.indices.create).toHaveBeenCalledWith({
        index: expect.stringContaining('user-1'),
        body: expect.objectContaining({
          settings: expect.any(Object),
          mappings: expect.any(Object),
        }),
      });
    });

    it('should skip creation if index already exists', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient({ indexExists: true });
      (Client as any).mockImplementation(() => mockClient);

      const success = await createUserIndex('user-1');

      expect(success).toBe(true);
      expect(mockClient.indices.create).not.toHaveBeenCalled();
    });

    it('should handle creation errors', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient({ indexExists: false });
      mockClient.indices.create.mockRejectedValue(new Error('Creation failed'));
      (Client as any).mockImplementation(() => mockClient);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const success = await createUserIndex('user-1');

      expect(success).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should update cache after successful creation', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient({ indexExists: false });
      (Client as any).mockImplementation(() => mockClient);

      await createUserIndex('user-1');

      // Check cache by calling checkUserIndexExists (should not hit API)
      mockClient.indices.exists.mockClear();
      const exists = await checkUserIndexExists('user-1');

      expect(exists).toBe(true);
      expect(mockClient.indices.exists).not.toHaveBeenCalled();
    });
  });

  describe('indexDocument()', () => {
    it('should index document with all fields', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient({ indexSuccess: true });
      (Client as any).mockImplementation(() => mockClient);

      const success = await indexDocument('user-1', sampleDocument1);

      expect(success).toBe(true);
      expect(mockClient.index).toHaveBeenCalledWith({
        index: expect.stringContaining('user-1'),
        id: sampleDocument1.id,
        body: expect.objectContaining({
          id: sampleDocument1.id,
          user_id: 'user-1',
          name: sampleDocument1.name,
          type: sampleDocument1.type,
          metadata: sampleDocument1.metadata,
        }),
        refresh: true,
      });
    });

    it('should generate fulltext field', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient();
      (Client as any).mockImplementation(() => mockClient);

      await indexDocument('user-1', sampleDocument1);

      const callArgs = mockClient.index.mock.calls[0][0];
      expect(callArgs.body.full_text).toBeDefined();
      expect(typeof callArgs.body.full_text).toBe('string');
    });

    it('should set refresh: true for immediate searchability', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient();
      (Client as any).mockImplementation(() => mockClient);

      await indexDocument('user-1', sampleDocument1);

      const callArgs = mockClient.index.mock.calls[0][0];
      expect(callArgs.refresh).toBe(true);
    });

    it('should handle indexing errors', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient({ indexSuccess: false });
      mockClient.index.mockRejectedValue(new Error('Indexing failed'));
      (Client as any).mockImplementation(() => mockClient);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const success = await indexDocument('user-1', sampleDocument1);

      expect(success).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('searchDocuments()', () => {
    it('should search by fulltext query', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient({ searchResults: mockSearchResponse });
      (Client as any).mockImplementation(() => mockClient);

      const result = await searchDocuments('user-1', { search: 'Goldenen Löwen' });

      expect(result.documents).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockClient.search).toHaveBeenCalledWith({
        index: expect.stringContaining('user-1'),
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                expect.objectContaining({
                  multi_match: expect.any(Object),
                }),
              ]),
            }),
          }),
        }),
      });
    });

    it('should filter by document type', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient();
      (Client as any).mockImplementation(() => mockClient);

      await searchDocuments('user-1', { type: 'bewirtungsbeleg' });

      const callArgs = mockClient.search.mock.calls[0][0];
      expect(callArgs.body.query.bool.filter).toContainEqual({
        term: { type: 'bewirtungsbeleg' },
      });
    });

    it('should filter by date range', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient();
      (Client as any).mockImplementation(() => mockClient);

      await searchDocuments('user-1', {
        dateFrom: '2024-03-01',
        dateTo: '2024-03-31',
      });

      const callArgs = mockClient.search.mock.calls[0][0];
      expect(callArgs.body.query.bool.filter).toContainEqual({
        range: {
          created_at: {
            gte: '2024-03-01',
            lte: '2024-03-31',
          },
        },
      });
    });

    it('should paginate results', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient();
      (Client as any).mockImplementation(() => mockClient);

      await searchDocuments('user-1', { page: 2, limit: 10 });

      const callArgs = mockClient.search.mock.calls[0][0];
      expect(callArgs.body.from).toBe(10); // (page 2 - 1) * 10
      expect(callArgs.body.size).toBe(10);
    });

    it('should sort by specified field', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient();
      (Client as any).mockImplementation(() => mockClient);

      await searchDocuments('user-1', { sortBy: 'created_at', sortOrder: 'asc' });

      const callArgs = mockClient.search.mock.calls[0][0];
      expect(callArgs.body.sort).toEqual([
        {
          created_at: {
            order: 'asc',
          },
        },
      ]);
    });

    it('should return empty results when index does not exist', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient({ indexExists: false });
      (Client as any).mockImplementation(() => mockClient);

      const result = await searchDocuments('user-1', {});

      expect(result.documents).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle search errors gracefully', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient();
      mockClient.search.mockRejectedValue(new Error('Search failed'));
      (Client as any).mockImplementation(() => mockClient);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await searchDocuments('user-1', {});

      expect(result.documents).toHaveLength(0);
      expect(result.total).toBe(0);

      consoleErrorSpy.mockRestore();
    });

    it('should use fuzziness for typo tolerance', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient();
      (Client as any).mockImplementation(() => mockClient);

      await searchDocuments('user-1', { search: 'Goldnen' }); // Typo

      const callArgs = mockClient.search.mock.calls[0][0];
      const multiMatch = callArgs.body.query.bool.must[0].multi_match;
      expect(multiMatch.fuzziness).toBe('AUTO');
    });
  });

  describe('deleteDocument()', () => {
    it('should delete document by ID', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient();
      (Client as any).mockImplementation(() => mockClient);

      const success = await deleteDocument('user-1', 'doc-123');

      expect(success).toBe(true);
      expect(mockClient.delete).toHaveBeenCalledWith({
        index: expect.stringContaining('user-1'),
        id: 'doc-123',
        refresh: true,
      });
    });

    it('should handle non-existent documents', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient();
      mockClient.delete.mockRejectedValue(new Error('Document not found'));
      (Client as any).mockImplementation(() => mockClient);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const success = await deleteDocument('user-1', 'non-existent');

      expect(success).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should set refresh: true for immediate effect', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient();
      (Client as any).mockImplementation(() => mockClient);

      await deleteDocument('user-1', 'doc-123');

      const callArgs = mockClient.delete.mock.calls[0][0];
      expect(callArgs.refresh).toBe(true);
    });
  });

  describe('ensureUserIndex()', () => {
    it('should return true if index exists', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient({ indexExists: true });
      (Client as any).mockImplementation(() => mockClient);

      const success = await ensureUserIndex('user-1');

      expect(success).toBe(true);
      expect(mockClient.indices.create).not.toHaveBeenCalled();
    });

    it('should create index if it does not exist', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient({ indexExists: false });
      (Client as any).mockImplementation(() => mockClient);

      const success = await ensureUserIndex('user-1');

      expect(success).toBe(true);
      expect(mockClient.indices.create).toHaveBeenCalled();
    });
  });

  describe('BDD Scenario: Search by restaurant name', () => {
    it('Given receipts from multiple restaurants, When searching for specific restaurant, Then should find matching receipts', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient({ searchResults: mockSearchResponse });
      (Client as any).mockImplementation(() => mockClient);

      // Given receipts are indexed
      // When searching
      const result = await searchDocuments('user-1', { search: 'Goldenen Löwen' });

      // Then
      expect(result.documents).toHaveLength(2);
      expect(result.total).toBeGreaterThan(0);
      expect(mockClient.search).toHaveBeenCalled();
    });
  });

  describe('BDD Scenario: Filter by date range', () => {
    it('Given receipts from January to March, When filtering for February, Then should see only February receipts', async () => {
      const { Client } = await import('@opensearch-project/opensearch');
      const mockClient = createMockOpenSearchClient({ searchResults: mockSearchResponse });
      (Client as any).mockImplementation(() => mockClient);

      // When filtering by February
      const result = await searchDocuments('user-1', {
        dateFrom: '2024-02-01',
        dateTo: '2024-02-29',
      });

      // Then
      const callArgs = mockClient.search.mock.calls[0][0];
      expect(callArgs.body.query.bool.filter).toContainEqual(
        expect.objectContaining({
          range: expect.any(Object),
        })
      );
    });
  });
});
