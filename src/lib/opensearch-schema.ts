/**
 * OpenSearch Index Schema for Document Management
 *
 * Each user gets their own index: documents-user-{user_id}
 * This schema defines the mapping for document fields including
 * fulltext search and vector embeddings for semantic search.
 */

export interface OpenSearchDocumentSchema {
  // Core document fields
  id: string;
  user_id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
  updated_at?: string;

  // URLs
  thumbnail_url?: string;
  pdf_url?: string;
  original_url?: string;

  // Metadata for search
  metadata: {
    total_amount?: number;
    currency?: string;
    date?: string;
    restaurant_name?: string;
    participants?: string[];
    business_purpose?: string;
    [key: string]: any;
  };

  // Complete form data (stored as JSON for detailed querying)
  form_data?: Record<string, any>;

  // GoBD compliance
  gobd_compliant?: boolean;
  signature_hash?: string;
  gobd_signature?: string; // Additional signature field for GoBD archival

  // Vector embeddings for semantic search (1536 dimensions for OpenAI text-embedding-3-small)
  embedding?: number[];

  // Full document text for fulltext search
  full_text?: string;
}

/**
 * OpenSearch index mapping configuration
 * Defines how fields are indexed and analyzed
 */
export const DOCUMENT_INDEX_MAPPING = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 1,
    analysis: {
      analyzer: {
        german_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'german_stop', 'german_stemmer'],
        },
      },
      filter: {
        german_stop: {
          type: 'stop',
          stopwords: '_german_',
        },
        german_stemmer: {
          type: 'stemmer',
          language: 'german',
        },
      },
    },
  },
  mappings: {
    properties: {
      // Exact match fields
      id: {
        type: 'keyword',
      },
      user_id: {
        type: 'keyword',
      },
      type: {
        type: 'keyword',
      },
      status: {
        type: 'keyword',
      },

      // Text search fields with German analyzer
      name: {
        type: 'text',
        analyzer: 'german_analyzer',
        fields: {
          keyword: {
            type: 'keyword',
          },
        },
      },
      full_text: {
        type: 'text',
        analyzer: 'german_analyzer',
      },

      // Date fields
      created_at: {
        type: 'date',
      },
      updated_at: {
        type: 'date',
      },

      // URLs
      thumbnail_url: {
        type: 'keyword',
        index: false,
      },
      pdf_url: {
        type: 'keyword',
        index: false,
      },
      original_url: {
        type: 'keyword',
        index: false,
      },

      // Metadata nested object
      metadata: {
        type: 'object',
        properties: {
          total_amount: {
            type: 'float',
          },
          currency: {
            type: 'keyword',
          },
          date: {
            type: 'date',
          },
          restaurant_name: {
            type: 'text',
            analyzer: 'german_analyzer',
            fields: {
              keyword: {
                type: 'keyword',
              },
            },
          },
          participants: {
            type: 'text',
            analyzer: 'german_analyzer',
          },
          business_purpose: {
            type: 'text',
            analyzer: 'german_analyzer',
          },
        },
      },

      // Complete form data (stored as JSON object)
      form_data: {
        type: 'object',
        enabled: true, // Allow dynamic fields within form_data
      },

      // GoBD fields
      gobd_compliant: {
        type: 'boolean',
      },
      signature_hash: {
        type: 'keyword',
        index: false,
      },
      gobd_signature: {
        type: 'keyword',
        index: false,
      },

      // Vector embeddings for semantic search
      // Use k-NN plugin for vector search
      embedding: {
        type: 'knn_vector',
        dimension: 1536, // OpenAI text-embedding-3-small dimension
        method: {
          name: 'hnsw',
          space_type: 'cosinesimil',
          engine: 'nmslib',
          parameters: {
            ef_construction: 128,
            m: 24,
          },
        },
      },
    },
  },
};

/**
 * Get the index name for a specific user
 */
export function getUserIndexName(userId: string): string {
  // Sanitize user ID for index name (lowercase, no special chars)
  const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  return `documents-user-${sanitizedUserId}`;
}

/**
 * Get index pattern for searching across multiple user indexes (admin only)
 */
export function getAllUsersIndexPattern(): string {
  return 'documents-user-*';
}
