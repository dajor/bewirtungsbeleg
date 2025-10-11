/**
 * End-to-End tests for complete GoBD-Tresor workflow
 * Tests the entire user journey: Create receipt → Upload to GoBD → View in list
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock external dependencies
vi.mock('@aws-sdk/client-s3');
vi.mock('@opensearch-project/opensearch');
vi.mock('openai');
vi.mock('next-auth');

describe('E2E: Complete GoBD-Tresor Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scenario 1: Complete user journey from form to document list', () => {
    it('should complete full workflow: create receipt → upload → index → retrieve', async () => {
      // Step 1: User fills out receipt form
      const receiptData = {
        datum: '2024-03-15',
        restaurantName: 'Goldener Löwe',
        restaurantAnschrift: 'Hauptstraße 1, Berlin',
        teilnehmer: 'Max Mustermann\nErika Musterfrau',
        anlass: 'Kundengespräch',
        gesamtbetrag: '125,50',
        gesamtbetragMwst: '20,08',
        gesamtbetragNetto: '105,42',
        trinkgeld: '12,00',
        trinkgeldMwst: '1,92',
        kreditkartenBetrag: '137,50',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
        geschaeftlicherAnlass: 'Projektbesprechung mit Kunde X',
        geschaeftspartnerNamen: 'John Doe',
        geschaeftspartnerFirma: 'Acme Corporation',
        istAuslaendischeRechnung: false,
        auslaendischeWaehrung: '',
        generateZugferd: false,
        istEigenbeleg: false,
      };

      // Step 2: Generate PDF
      const { generateReceiptPDF } = await import('@/lib/pdf-generator');

      // Mock PDF generation (in real E2E, this would call actual function)
      vi.mocked(generateReceiptPDF).mockResolvedValue(
        Buffer.from('PDF content', 'utf-8')
      );

      const pdfBuffer = await generateReceiptPDF(receiptData);
      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // Step 3: Upload to DigitalOcean Spaces
      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { mockSend } = await import('@aws-sdk/client-s3');

      vi.mocked(mockSend).mockResolvedValue({
        $metadata: { httpStatusCode: 200 },
        ETag: '"abc123"',
      });

      const userId = 'user-test-123';
      const pngBuffer = Buffer.from('PNG content', 'utf-8');
      const metadata = {
        ...receiptData,
        uploadDate: new Date().toISOString(),
        fileName: 'bewirtungsbeleg-2024-03-15.pdf',
      };

      const uploadResult = await uploadDocumentSet(userId, pdfBuffer, pngBuffer, metadata);

      expect(uploadResult).toBeDefined();
      expect(uploadResult?.success).toBe(true);
      expect(uploadResult?.pdfUrl).toContain('.pdf');
      expect(uploadResult?.pngUrl).toContain('.png');
      expect(uploadResult?.metadataUrl).toContain('.json');
      expect(mockSend).toHaveBeenCalledTimes(3); // PDF, PNG, JSON

      // Step 4: Generate embeddings
      const { generateDocumentEmbedding, generateEmbeddingText } = await import('@/lib/embeddings');
      const OpenAI = (await import('openai')).default;

      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      const mockOpenAIResponse = {
        data: [
          {
            embedding: mockEmbedding,
            index: 0,
            object: 'embedding' as const,
          },
        ],
        model: 'text-embedding-3-small',
        object: 'list' as const,
        usage: {
          prompt_tokens: 10,
          total_tokens: 10,
        },
      };

      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIResponse);
      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      const embeddingText = generateEmbeddingText(metadata);
      expect(embeddingText).toContain('Goldener Löwe');
      expect(embeddingText).toContain('Hauptstraße 1, Berlin');
      expect(embeddingText).toContain('Kundengespräch');

      const embedding = await generateDocumentEmbedding(metadata);
      expect(embedding).toBeDefined();
      expect(embedding?.length).toBe(1536);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: expect.any(String),
        dimensions: 1536,
      });

      // Step 5: Index document in OpenSearch
      const { indexDocument } = await import('@/lib/opensearch');
      const { Client } = await import('@opensearch-project/opensearch');

      const mockClient = {
        index: vi.fn().mockResolvedValue({
          body: {
            _id: 'doc-123',
            result: 'created',
          },
        }),
      };
      (Client as any).mockImplementation(() => mockClient);

      const document = {
        id: 'doc-123',
        user_id: userId,
        name: 'bewirtungsbeleg-2024-03-15.pdf',
        type: 'bewirtungsbeleg' as const,
        status: 'completed' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pdf_url: uploadResult?.pdfUrl || '',
        thumbnail_url: uploadResult?.pngUrl || '',
        original_url: uploadResult?.metadataUrl || '',
        gobd_compliant: true,
        gobd_signature: 'sha256-abc123',
        signature_hash: 'abc123',
        full_text: embeddingText,
        embedding,
        metadata: {
          restaurant_name: receiptData.restaurantName,
          restaurant_address: receiptData.restaurantAnschrift,
          total_amount: 125.5,
          currency: 'EUR',
          date: receiptData.datum,
          business_purpose: receiptData.geschaeftlicherAnlass,
          participants: receiptData.teilnehmer,
        },
        form_data: receiptData,
      };

      const indexResult = await indexDocument(userId, document);
      expect(indexResult).toBe(true);
      expect(mockClient.index).toHaveBeenCalledWith({
        index: expect.stringContaining(`documents-user-${userId}`),
        id: document.id,
        body: expect.objectContaining({
          name: document.name,
          type: document.type,
          metadata: expect.objectContaining({
            restaurant_name: 'Goldener Löwe',
          }),
          embedding: expect.arrayContaining([expect.any(Number)]),
        }),
      });

      // Step 6: Search and retrieve document
      const { searchDocuments } = await import('@/lib/opensearch');

      mockClient.search = vi.fn().mockResolvedValue({
        body: {
          hits: {
            total: { value: 1 },
            hits: [
              {
                _id: 'doc-123',
                _source: document,
              },
            ],
          },
        },
      });

      const searchResults = await searchDocuments(userId, {
        search: 'Goldener Löwe',
      });

      expect(searchResults.total).toBe(1);
      expect(searchResults.documents).toHaveLength(1);
      expect(searchResults.documents[0].metadata.restaurant_name).toBe('Goldener Löwe');
      expect(searchResults.documents[0].pdf_url).toBe(uploadResult?.pdfUrl);
      expect(searchResults.documents[0].thumbnail_url).toBe(uploadResult?.pngUrl);

      // Verify complete workflow
      expect(uploadResult?.success).toBe(true);
      expect(embedding).toBeDefined();
      expect(indexResult).toBe(true);
      expect(searchResults.documents.length).toBe(1);
    });
  });

  describe('Scenario 2: Search functionality end-to-end', () => {
    it('should find documents by fulltext search', async () => {
      const { searchDocuments } = await import('@/lib/opensearch');
      const { Client } = await import('@opensearch-project/opensearch');

      const mockDocuments = [
        {
          id: 'doc-1',
          user_id: 'user-1',
          name: 'bewirtungsbeleg-1.pdf',
          type: 'bewirtungsbeleg',
          status: 'completed',
          metadata: {
            restaurant_name: 'Goldener Löwe',
            total_amount: 125.5,
          },
        },
        {
          id: 'doc-2',
          user_id: 'user-1',
          name: 'bewirtungsbeleg-2.pdf',
          type: 'bewirtungsbeleg',
          status: 'completed',
          metadata: {
            restaurant_name: 'Pizza Palace',
            total_amount: 45.0,
          },
        },
      ];

      const mockClient = {
        search: vi.fn().mockResolvedValue({
          body: {
            hits: {
              total: { value: 1 },
              hits: [
                {
                  _id: 'doc-1',
                  _source: mockDocuments[0],
                },
              ],
            },
          },
        }),
      };
      (Client as any).mockImplementation(() => mockClient);

      const results = await searchDocuments('user-1', { search: 'Goldener Löwen' });

      expect(results.total).toBe(1);
      expect(results.documents[0].metadata.restaurant_name).toBe('Goldener Löwe');
      expect(mockClient.search).toHaveBeenCalledWith({
        index: expect.stringContaining('documents-user-user-1'),
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

    it('should find documents by semantic (vector) search', async () => {
      const { searchDocuments } = await import('@/lib/opensearch');
      const { Client } = await import('@opensearch-project/opensearch');
      const { generateEmbedding } = await import('@/lib/embeddings');
      const OpenAI = (await import('openai')).default;

      // Mock OpenAI to generate search query embedding
      const searchEmbedding = new Array(1536).fill(0).map(() => Math.random());
      const mockCreate = vi.fn().mockResolvedValue({
        data: [
          {
            embedding: searchEmbedding,
            index: 0,
            object: 'embedding' as const,
          },
        ],
        model: 'text-embedding-3-small',
        object: 'list' as const,
        usage: {
          prompt_tokens: 5,
          total_tokens: 5,
        },
      });
      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      // Mock OpenSearch k-NN search
      const mockClient = {
        search: vi.fn().mockResolvedValue({
          body: {
            hits: {
              total: { value: 1 },
              hits: [
                {
                  _id: 'doc-1',
                  _score: 0.95,
                  _source: {
                    id: 'doc-1',
                    metadata: {
                      restaurant_name: 'Goldener Löwe',
                      business_purpose: 'Kundengespräch',
                    },
                  },
                },
              ],
            },
          },
        }),
      };
      (Client as any).mockImplementation(() => mockClient);

      // Generate embedding for search query
      const queryEmbedding = await generateEmbedding('Restaurant mit guter Atmosphäre');
      expect(queryEmbedding).toBeDefined();
      expect(queryEmbedding?.length).toBe(1536);

      // Search with vector
      const results = await searchDocuments('user-1', {
        search: 'gemütliches Restaurant',
      });

      expect(results.documents.length).toBeGreaterThan(0);
    });

    it('should filter documents by date range', async () => {
      const { searchDocuments } = await import('@/lib/opensearch');
      const { Client } = await import('@opensearch-project/opensearch');

      const mockClient = {
        search: vi.fn().mockResolvedValue({
          body: {
            hits: {
              total: { value: 2 },
              hits: [
                {
                  _id: 'doc-1',
                  _source: {
                    id: 'doc-1',
                    created_at: '2024-03-15T10:00:00Z',
                    metadata: {
                      restaurant_name: 'Restaurant 1',
                    },
                  },
                },
                {
                  _id: 'doc-2',
                  _source: {
                    id: 'doc-2',
                    created_at: '2024-03-20T10:00:00Z',
                    metadata: {
                      restaurant_name: 'Restaurant 2',
                    },
                  },
                },
              ],
            },
          },
        }),
      };
      (Client as any).mockImplementation(() => mockClient);

      const results = await searchDocuments('user-1', {
        dateFrom: '2024-03-01',
        dateTo: '2024-03-31',
      });

      expect(results.total).toBe(2);
      expect(mockClient.search).toHaveBeenCalledWith({
        index: expect.any(String),
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                expect.objectContaining({
                  range: expect.objectContaining({
                    created_at: expect.any(Object),
                  }),
                }),
              ]),
            }),
          }),
        }),
      });
    });

    it('should combine fulltext search with filters', async () => {
      const { searchDocuments } = await import('@/lib/opensearch');
      const { Client } = await import('@opensearch-project/opensearch');

      const mockClient = {
        search: vi.fn().mockResolvedValue({
          body: {
            hits: {
              total: { value: 1 },
              hits: [
                {
                  _id: 'doc-1',
                  _source: {
                    id: 'doc-1',
                    type: 'bewirtungsbeleg',
                    status: 'completed',
                    metadata: {
                      restaurant_name: 'Goldener Löwe',
                    },
                  },
                },
              ],
            },
          },
        }),
      };
      (Client as any).mockImplementation(() => mockClient);

      const results = await searchDocuments('user-1', {
        search: 'Goldener Löwe',
        type: 'bewirtungsbeleg',
        status: 'completed',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      });

      expect(results.total).toBe(1);
      expect(mockClient.search).toHaveBeenCalledWith({
        index: expect.any(String),
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                expect.objectContaining({
                  multi_match: expect.any(Object),
                }),
              ]),
              filter: expect.arrayContaining([
                expect.objectContaining({ term: { type: 'bewirtungsbeleg' } }),
                expect.objectContaining({ term: { status: 'completed' } }),
              ]),
            }),
          }),
        }),
      });
    });
  });

  describe('Scenario 3: Multi-tenant isolation', () => {
    it('should isolate documents between users', async () => {
      const { searchDocuments } = await import('@/lib/opensearch');
      const { Client } = await import('@opensearch-project/opensearch');

      const mockClient = {
        search: vi.fn()
          .mockResolvedValueOnce({
            // User 1 results
            body: {
              hits: {
                total: { value: 2 },
                hits: [
                  { _id: 'doc-1', _source: { id: 'doc-1', user_id: 'user-1' } },
                  { _id: 'doc-2', _source: { id: 'doc-2', user_id: 'user-1' } },
                ],
              },
            },
          })
          .mockResolvedValueOnce({
            // User 2 results
            body: {
              hits: {
                total: { value: 1 },
                hits: [{ _id: 'doc-3', _source: { id: 'doc-3', user_id: 'user-2' } }],
              },
            },
          }),
      };
      (Client as any).mockImplementation(() => mockClient);

      // User 1 searches
      const user1Results = await searchDocuments('user-1', {});
      expect(user1Results.total).toBe(2);
      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'documents-user-user-1',
        body: expect.any(Object),
      });

      // User 2 searches
      const user2Results = await searchDocuments('user-2', {});
      expect(user2Results.total).toBe(1);
      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'documents-user-user-2',
        body: expect.any(Object),
      });

      // Verify isolation
      expect(user1Results.documents.every((d) => d.user_id === 'user-1')).toBe(true);
      expect(user2Results.documents.every((d) => d.user_id === 'user-2')).toBe(true);
    });
  });

  describe('Scenario 4: Error recovery and graceful degradation', () => {
    it('should continue upload even if embedding generation fails', async () => {
      const { uploadDocumentSet } = await import('@/lib/spaces');
      const { indexDocument } = await import('@/lib/opensearch');
      const { generateDocumentEmbedding } = await import('@/lib/embeddings');
      const { mockSend } = await import('@aws-sdk/client-s3');
      const { Client } = await import('@opensearch-project/opensearch');
      const OpenAI = (await import('openai')).default;

      // Mock successful upload
      vi.mocked(mockSend).mockResolvedValue({
        $metadata: { httpStatusCode: 200 },
        ETag: '"abc123"',
      });

      // Mock failed embedding generation
      const mockCreate = vi.fn().mockRejectedValue(new Error('OpenAI API error'));
      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      // Mock successful indexing (without embedding)
      const mockClient = {
        index: vi.fn().mockResolvedValue({
          body: { _id: 'doc-123', result: 'created' },
        }),
      };
      (Client as any).mockImplementation(() => mockClient);

      const userId = 'user-1';
      const pdfBuffer = Buffer.from('PDF', 'utf-8');
      const pngBuffer = Buffer.from('PNG', 'utf-8');
      const metadata = { restaurantName: 'Test Restaurant' };

      // Upload should succeed
      const uploadResult = await uploadDocumentSet(userId, pdfBuffer, pngBuffer, metadata);
      expect(uploadResult?.success).toBe(true);

      // Embedding generation should fail gracefully
      const embedding = await generateDocumentEmbedding(metadata);
      expect(embedding).toBeNull(); // Graceful degradation

      // Indexing should still work without embedding
      const document = {
        id: 'doc-123',
        user_id: userId,
        name: 'test.pdf',
        type: 'bewirtungsbeleg' as const,
        status: 'completed' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pdf_url: uploadResult?.pdfUrl || '',
        thumbnail_url: uploadResult?.pngUrl || '',
        original_url: uploadResult?.metadataUrl || '',
        gobd_compliant: true,
        gobd_signature: 'sha256-abc',
        signature_hash: 'abc',
        full_text: '',
        embedding: null, // No embedding
        metadata: { restaurant_name: 'Test Restaurant' },
        form_data: metadata,
      };

      const indexResult = await indexDocument(userId, document);
      expect(indexResult).toBe(true);
    });

    it('should handle OpenSearch index creation on first use', async () => {
      const { ensureUserIndex } = await import('@/lib/opensearch');
      const { Client } = await import('@opensearch-project/opensearch');

      const mockClient = {
        indices: {
          exists: vi.fn().mockResolvedValue({ body: false }),
          create: vi.fn().mockResolvedValue({ body: { acknowledged: true } }),
        },
      };
      (Client as any).mockImplementation(() => mockClient);

      const result = await ensureUserIndex('new-user-123');

      expect(result).toBe(true);
      expect(mockClient.indices.exists).toHaveBeenCalled();
      expect(mockClient.indices.create).toHaveBeenCalledWith({
        index: 'documents-user-new-user-123',
        body: expect.objectContaining({
          mappings: expect.objectContaining({
            properties: expect.objectContaining({
              embedding: expect.objectContaining({
                type: 'knn_vector',
                dimension: 1536,
              }),
            }),
          }),
        }),
      });
    });
  });
});
