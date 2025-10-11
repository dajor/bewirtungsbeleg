/**
 * Unit tests for OpenAI Embeddings Helper (embeddings.ts)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateEmbeddingText,
  generateEmbedding,
  generateDocumentEmbedding,
  batchGenerateEmbeddings,
  cosineSimilarity,
} from '../embeddings';
import {
  sampleReceiptMetadata,
  sampleEigenbelegMetadata,
  minimalReceiptMetadata,
} from '@/__tests__/fixtures/sample-receipt-metadata';
import {
  sampleEmbedding1,
  sampleEmbedding2,
  identicalEmbedding,
  zeroEmbedding,
  invalidDimensionEmbedding,
  mockOpenAIEmbeddingResponse,
} from '@/__tests__/fixtures/sample-embeddings';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      embeddings: {
        create: vi.fn(),
      },
    })),
  };
});

// Mock environment
vi.mock('../env', () => ({
  env: {
    OPENAI_API_KEY: 'test-api-key',
  },
}));

describe('embeddings.ts - OpenAI Embeddings Helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateEmbeddingText()', () => {
    it('should extract all metadata fields', () => {
      const text = generateEmbeddingText(sampleReceiptMetadata);

      expect(text).toContain('Datum: 15.03.2024');
      expect(text).toContain('Restaurant: Zum Goldenen Löwen');
      expect(text).toContain('Adresse: Hauptstraße 123, 10115 Berlin');
      expect(text).toContain('Teilnehmer: Max Mustermann, Erika Beispiel, Hans Schmidt');
      expect(text).toContain('Anlass: Kundengespräch und Vertragsverhandlung');
      expect(text).toContain('Gesamtbetrag: 156.50 EUR');
      expect(text).toContain('Mehrwertsteuer: 25.04 EUR');
      expect(text).toContain('Nettobetrag: 131.46 EUR');
      expect(text).toContain('Trinkgeld: 10.00 EUR');
      expect(text).toContain('Zahlungsart: Kreditkarte');
      expect(text).toContain('Bemerkungen: Geschäftsessen mit wichtigen Kunden');
      expect(text).toContain('Mitarbeiter: Max Mustermann');
    });

    it('should handle missing optional fields gracefully', () => {
      const text = generateEmbeddingText(minimalReceiptMetadata);

      expect(text).toContain('Datum: 01.04.2024');
      expect(text).toContain('Restaurant: Test Restaurant');
      expect(text).toContain('Gesamtbetrag: 50.00 EUR');
      expect(text).toContain('Zahlungsart: Bar');

      // Should not crash on missing fields
      expect(text).toBeDefined();
    });

    it('should format participants array as comma-separated string', () => {
      const metadataWithArray = {
        ...sampleReceiptMetadata,
        teilnehmer: ['Max Mustermann', 'Erika Beispiel'],
      };

      const text = generateEmbeddingText(metadataWithArray);

      expect(text).toContain('Teilnehmer: Max Mustermann, Erika Beispiel');
    });

    it('should format participants string correctly', () => {
      const metadataWithString = {
        ...sampleReceiptMetadata,
        teilnehmer: 'Max Mustermann, Erika Beispiel',
      };

      const text = generateEmbeddingText(metadataWithString);

      expect(text).toContain('Teilnehmer: Max Mustermann, Erika Beispiel');
    });

    it('should include currency with amounts', () => {
      const text = generateEmbeddingText(sampleReceiptMetadata);

      expect(text).toMatch(/\d+\.\d+ EUR/);
    });

    it('should handle both German and English field names', () => {
      const englishMetadata = {
        date: '15.03.2024',
        restaurant_name: 'Test Restaurant',
        participants: ['John Doe'],
        business_purpose: 'Business meeting',
        total_amount: '100.00',
        payment_method: 'Cash',
      };

      const text = generateEmbeddingText(englishMetadata);

      expect(text).toContain('Datum: 15.03.2024');
      expect(text).toContain('Restaurant: Test Restaurant');
      expect(text).toContain('Teilnehmer: John Doe');
      expect(text).toContain('Anlass: Business meeting');
      expect(text).toContain('Gesamtbetrag: 100.00 EUR');
      expect(text).toContain('Zahlungsart: Cash');
    });

    it('should filter out undefined/null values', () => {
      const sparseMetadata = {
        datum: '15.03.2024',
        restaurantName: null,
        gesamtbetrag: undefined,
        zahlungsart: 'Bar',
      };

      const text = generateEmbeddingText(sparseMetadata);

      expect(text).toContain('Datum: 15.03.2024');
      expect(text).toContain('Zahlungsart: Bar');
      expect(text).not.toContain('null');
      expect(text).not.toContain('undefined');
    });
  });

  describe('generateEmbedding()', () => {
    it('should call OpenAI API with text-embedding-3-small model', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIEmbeddingResponse);

      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      const text = 'Test document text';
      await generateEmbedding(text);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
      });
    });

    it('should return 1536-dimensional vector', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIEmbeddingResponse);

      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      const text = 'Test document text';
      const embedding = await generateEmbedding(text);

      expect(embedding).toBeTruthy();
      expect(embedding?.length).toBe(1536);
    });

    it('should handle API rate limiting errors', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockRejectedValue(new Error('Rate limit exceeded'));

      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const text = 'Test document text';
      const embedding = await generateEmbedding(text);

      expect(embedding).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid API keys', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockRejectedValue(new Error('Invalid API key'));

      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const text = 'Test document text';
      const embedding = await generateEmbedding(text);

      expect(embedding).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty text input', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const embedding = await generateEmbedding('');

      expect(embedding).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('empty text')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should use encoding_format: float', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIEmbeddingResponse);

      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      const text = 'Test document text';
      await generateEmbedding(text);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          encoding_format: 'float',
        })
      );
    });
  });

  describe('generateDocumentEmbedding()', () => {
    it('should generate embedding from metadata', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIEmbeddingResponse);

      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      const embedding = await generateDocumentEmbedding(sampleReceiptMetadata);

      expect(embedding).toBeTruthy();
      expect(embedding?.length).toBe(1536);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should extract text using generateEmbeddingText', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIEmbeddingResponse);

      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      await generateDocumentEmbedding(sampleReceiptMetadata);

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.input).toContain('Restaurant: Zum Goldenen Löwen');
      expect(callArgs.input).toContain('Datum: 15.03.2024');
    });

    it('should return null when metadata generates no text', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const emptyMetadata = {};
      const embedding = await generateDocumentEmbedding(emptyMetadata);

      expect(embedding).toBeNull();

      consoleWarnSpy.mockRestore();
    });

    it('should handle complex metadata structures', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIEmbeddingResponse);

      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      const complexMetadata = {
        ...sampleReceiptMetadata,
        customFields: {
          field1: 'value1',
          field2: 'value2',
        },
      };

      const embedding = await generateDocumentEmbedding(complexMetadata);

      expect(embedding).toBeTruthy();
    });
  });

  describe('batchGenerateEmbeddings()', () => {
    it('should generate embeddings for multiple documents', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIEmbeddingResponse);

      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      const metadataList = [
        sampleReceiptMetadata,
        sampleEigenbelegMetadata,
        minimalReceiptMetadata,
      ];

      const embeddings = await batchGenerateEmbeddings(metadataList, 10); // 10ms delay for testing

      expect(embeddings).toHaveLength(3);
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should add delay between API calls', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIEmbeddingResponse);

      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      const metadataList = [sampleReceiptMetadata, sampleEigenbelegMetadata];

      const startTime = Date.now();
      await batchGenerateEmbeddings(metadataList, 50); // 50ms delay
      const endTime = Date.now();

      // Should take at least 50ms (one delay between 2 calls)
      expect(endTime - startTime).toBeGreaterThanOrEqual(40); // Some tolerance
    });

    it('should handle partial failures', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi
        .fn()
        .mockResolvedValueOnce(mockOpenAIEmbeddingResponse)
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce(mockOpenAIEmbeddingResponse);

      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const metadataList = [
        sampleReceiptMetadata,
        sampleEigenbelegMetadata,
        minimalReceiptMetadata,
      ];

      const embeddings = await batchGenerateEmbeddings(metadataList, 10);

      expect(embeddings).toHaveLength(3);
      expect(embeddings[0]).toBeTruthy();
      expect(embeddings[1]).toBeNull();
      expect(embeddings[2]).toBeTruthy();

      consoleErrorSpy.mockRestore();
    });

    it('should log success/failure statistics', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi
        .fn()
        .mockResolvedValueOnce(mockOpenAIEmbeddingResponse)
        .mockRejectedValueOnce(new Error('API error'));

      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const metadataList = [sampleReceiptMetadata, sampleEigenbelegMetadata];

      await batchGenerateEmbeddings(metadataList, 10);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('1/2')
      );

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should respect custom delay parameter', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIEmbeddingResponse);

      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      const metadataList = [sampleReceiptMetadata, sampleEigenbelegMetadata];

      const startTime = Date.now();
      await batchGenerateEmbeddings(metadataList, 100); // 100ms delay
      const endTime = Date.now();

      // Should take at least 100ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(90);
    });
  });

  describe('cosineSimilarity()', () => {
    it('should return 1.0 for identical vectors', () => {
      const similarity = cosineSimilarity(sampleEmbedding1, identicalEmbedding);

      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should return values between -1 and 1', () => {
      const similarity = cosineSimilarity(sampleEmbedding1, sampleEmbedding2);

      expect(similarity).toBeGreaterThanOrEqual(-1);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should throw error for different dimensions', () => {
      expect(() => {
        cosineSimilarity(sampleEmbedding1, invalidDimensionEmbedding);
      }).toThrow('same dimension');
    });

    it('should handle zero vectors', () => {
      // Cosine similarity with zero vector is undefined (NaN)
      const similarity = cosineSimilarity(zeroEmbedding, sampleEmbedding1);

      expect(isNaN(similarity)).toBe(true);
    });
  });

  describe('BDD Scenario: Generate embedding from receipt metadata', () => {
    it('Given receipt with complete data, When generating embedding, Then should receive 1536-dimensional vector', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIEmbeddingResponse);

      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      // Given
      const metadata = {
        restaurantName: 'Zum Goldenen Löwen',
        datum: '15.03.2024',
        teilnehmer: ['Max Mustermann', 'Erika Beispiel'],
      };

      // When
      const embedding = await generateDocumentEmbedding(metadata);

      // Then
      expect(embedding).toBeTruthy();
      expect(embedding?.length).toBe(1536);
    });
  });

  describe('BDD Scenario: Batch process multiple receipts', () => {
    it('Given 10 receipts, When batch generating with 100ms delay, Then all embeddings should be generated without rate limits', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIEmbeddingResponse);

      (OpenAI as any).mockImplementation(() => ({
        embeddings: {
          create: mockCreate,
        },
      }));

      // Given
      const metadataList = Array(10).fill(sampleReceiptMetadata);

      // When
      const embeddings = await batchGenerateEmbeddings(metadataList, 100);

      // Then
      expect(embeddings).toHaveLength(10);
      expect(embeddings.filter((e) => e !== null)).toHaveLength(10);
      expect(mockCreate).toHaveBeenCalledTimes(10);
    });
  });
});
