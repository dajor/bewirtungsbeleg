/**
 * OpenSearch Client for Document Search
 *
 * Provides user-specific document indexing and search functionality
 * Each user has their own index for data isolation
 */

import { Client } from '@opensearch-project/opensearch';
// AWS Sigv4 Signer requires aws-sdk v2, which conflicts with our AWS SDK v3 usage
// If you need AWS OpenSearch, install aws-sdk separately or use basic auth
// import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { env } from './env';
import {
  DOCUMENT_INDEX_MAPPING,
  getUserIndexName,
  type OpenSearchDocumentSchema,
} from './opensearch-schema';
import type { Document, DocumentListQuery } from '@/types/document';

// Singleton client instance
let client: Client | null = null;

// In-memory cache for index existence checks
const indexExistsCache = new Map<string, boolean>();

/**
 * Initialize and return OpenSearch client
 * Supports both AWS OpenSearch and self-hosted with basic auth
 */
function getOpenSearchClient(): Client | null {
  if (!env.OPENSEARCH_URL) {
    console.warn('[OpenSearch] OPENSEARCH_URL not configured, search functionality disabled');
    return null;
  }

  if (client) {
    return client;
  }

  try {
    // AWS OpenSearch with IAM authentication
    // Note: This requires aws-sdk v2, which we don't use. Use basic auth or install aws-sdk separately
    if (env.OPENSEARCH_ACCESS_KEY_ID && env.OPENSEARCH_SECRET_ACCESS_KEY && env.OPENSEARCH_REGION) {
      console.warn('[OpenSearch] AWS IAM authentication not available (requires aws-sdk v2)');
      console.warn('[OpenSearch] Please use basic auth or install aws-sdk package');
      return null;
    }
    // Self-hosted OpenSearch with basic auth
    if (env.OPENSEARCH_USERNAME && env.OPENSEARCH_PASSWORD) {
      console.log('[OpenSearch] Initializing self-hosted OpenSearch client');
      client = new Client({
        node: env.OPENSEARCH_URL,
        auth: {
          username: env.OPENSEARCH_USERNAME,
          password: env.OPENSEARCH_PASSWORD,
        },
        ssl: {
          rejectUnauthorized: env.NODE_ENV === 'production',
        },
      });
    }
    // No credentials configured
    else {
      console.warn('[OpenSearch] No credentials configured, trying unauthenticated connection');
      client = new Client({
        node: env.OPENSEARCH_URL,
      });
    }

    console.log('[OpenSearch] Client initialized successfully');
    return client;
  } catch (error) {
    console.error('[OpenSearch] Failed to initialize client:', error);
    return null;
  }
}

/**
 * Check if user's index exists
 */
export async function checkUserIndexExists(userId: string): Promise<boolean> {
  const indexName = getUserIndexName(userId);

  // Check cache first
  if (indexExistsCache.has(indexName)) {
    return indexExistsCache.get(indexName)!;
  }

  const client = getOpenSearchClient();
  if (!client) return false;

  try {
    const exists = await client.indices.exists({ index: indexName });
    indexExistsCache.set(indexName, exists.body);
    return exists.body;
  } catch (error) {
    console.error(`[OpenSearch] Error checking index existence for user ${userId}:`, error);
    return false;
  }
}

/**
 * Create index for user with proper mapping
 */
export async function createUserIndex(userId: string): Promise<boolean> {
  const indexName = getUserIndexName(userId);
  const client = getOpenSearchClient();

  if (!client) {
    console.warn('[OpenSearch] Client not available, cannot create index');
    return false;
  }

  try {
    // Check if index already exists
    const exists = await checkUserIndexExists(userId);
    if (exists) {
      console.log(`[OpenSearch] Index ${indexName} already exists`);
      return true;
    }

    // Create index with mapping
    console.log(`[OpenSearch] Creating index ${indexName}`);
    await client.indices.create({
      index: indexName,
      body: DOCUMENT_INDEX_MAPPING as any,
    });

    // Update cache
    indexExistsCache.set(indexName, true);

    console.log(`[OpenSearch] Index ${indexName} created successfully`);
    return true;
  } catch (error) {
    console.error(`[OpenSearch] Error creating index for user ${userId}:`, error);
    return false;
  }
}

/**
 * Index a document in user's index
 * Supports optional embedding and form_data from upload API
 */
export async function indexDocument(
  userId: string,
  document: Document & {
    embedding?: number[];
    full_text?: string;
    form_data?: Record<string, any>;
  }
): Promise<boolean> {
  const indexName = getUserIndexName(userId);
  const client = getOpenSearchClient();

  if (!client) {
    console.warn('[OpenSearch] Client not available, cannot index document');
    return false;
  }

  try {
    // Ensure user index exists
    await ensureUserIndex(userId);

    // Prepare document for indexing
    const osDoc: OpenSearchDocumentSchema = {
      id: document.id,
      user_id: userId,
      name: document.name,
      type: document.type,
      status: document.status,
      created_at: document.created_at,
      updated_at: document.updated_at,
      thumbnail_url: document.thumbnail_url,
      pdf_url: document.pdf_url,
      original_url: document.original_url,
      metadata: document.metadata,
      gobd_compliant: document.gobd_compliant,
      gobd_validated_at: document.gobd_validated_at,
      gobd_check_url: document.gobd_check_url,
      signature_hash: document.signature_hash,
      gobd_signature: document.signature_hash, // Same as signature_hash for now
      // Use provided full_text or generate it from document data
      full_text: document.full_text || generateFullText(document),
      // Use provided embedding for semantic search
      embedding: document.embedding,
      // Store complete form data for detailed queries
      form_data: document.form_data,
    };

    const response = await client.index({
      index: indexName,
      id: document.id,
      body: osDoc,
      refresh: true, // Make document searchable immediately
    });

    // Check if the response indicates an error
    if (response.statusCode && response.statusCode >= 400) {
      console.error(`[OpenSearch] Error indexing document ${document.id}:`, response);
      return false;
    }

    console.log(`[OpenSearch] Document ${document.id} indexed successfully`);
    if (document.embedding) {
      console.log(`[OpenSearch] Document indexed with vector embedding (${document.embedding.length} dimensions)`);
    }
    return true;
  } catch (error) {
    console.error(`[OpenSearch] Error indexing document ${document.id}:`, JSON.stringify(error, null, 2));
    return false;
  }
}

/**
 * Generate full text content from document for fulltext search
 * Includes metadata fields and OCR extracted data from form_data
 */
function generateFullText(document: Document & { form_data?: Record<string, any> }): string {
  const parts: string[] = [
    document.name,
    document.type,
    document.metadata.restaurant_name || '',
    document.metadata.business_purpose || '',
    ...(document.metadata.participants || []),
  ];

  // Add OCR extracted data from form_data if available
  if (document.form_data) {
    const extractedText = extractTextFromObject(document.form_data);
    parts.push(extractedText);
  }

  return parts.filter(Boolean).join(' ');
}

/**
 * Recursively extract all string values from an object
 * Used to include OCR extracted data in fulltext search
 */
function extractTextFromObject(obj: Record<string, any>, maxDepth: number = 3, currentDepth: number = 0): string {
  if (currentDepth >= maxDepth) {
    return '';
  }

  const textParts: string[] = [];

  for (const value of Object.values(obj)) {
    if (value === null || value === undefined) {
      continue;
    }

    // Extract strings
    if (typeof value === 'string' && value.trim()) {
      textParts.push(value.trim());
    }
    // Extract numbers (convert to string)
    else if (typeof value === 'number') {
      textParts.push(value.toString());
    }
    // Recursively extract from nested objects
    else if (typeof value === 'object' && !Array.isArray(value)) {
      const nestedText = extractTextFromObject(value, maxDepth, currentDepth + 1);
      if (nestedText) {
        textParts.push(nestedText);
      }
    }
    // Extract from arrays
    else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.trim()) {
          textParts.push(item.trim());
        } else if (typeof item === 'number') {
          textParts.push(item.toString());
        } else if (typeof item === 'object' && item !== null) {
          const itemText = extractTextFromObject(item, maxDepth, currentDepth + 1);
          if (itemText) {
            textParts.push(itemText);
          }
        }
      }
    }
  }

  return textParts.join(' ');
}

/**
 * Search documents in user's index
 * Supports fulltext search and filters
 */
export async function searchDocuments(
  userId: string,
  query: DocumentListQuery
): Promise<{ documents: Document[]; total: number }> {
  const indexName = getUserIndexName(userId);
  const client = getOpenSearchClient();

  if (!client) {
    console.warn('[OpenSearch] Client not available, returning empty results');
    return { documents: [], total: 0 };
  }

  try {
    // Ensure user index exists
    const exists = await checkUserIndexExists(userId);
    if (!exists) {
      console.log(`[OpenSearch] Index ${indexName} does not exist yet`);
      return { documents: [], total: 0 };
    }

    // Build OpenSearch query
    const must: any[] = [];
    const filter: any[] = [];
    const should: any[] = [];

    // Fulltext and prefix search across multiple fields
    if (query.search) {
      const fields = [
        'name^2',
        'full_text',
        'metadata.restaurant_name^1.5',
        'metadata.business_purpose',
        'metadata.participants',
      ];

      should.push({
        multi_match: {
          query: query.search,
          fields,
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });

      should.push({
        multi_match: {
          query: query.search,
          fields,
          type: 'phrase_prefix',
        },
      });

      must.push({
        bool: {
          should,
          minimum_should_match: 1,
        },
      });
    }

    // ID filter
    if (query.documentId) {
      filter.push({ term: { _id: query.documentId } });
    }

    // Type filter
    if (query.type) {
      filter.push({ term: { type: query.type } });
    }

    // Status filter
    if (query.status) {
      filter.push({ term: { status: query.status } });
    }

    // Date range filter
    if (query.dateFrom || query.dateTo) {
      const rangeQuery: any = {};
      if (query.dateFrom) rangeQuery.gte = query.dateFrom;
      if (query.dateTo) rangeQuery.lte = query.dateTo;
      filter.push({ range: { created_at: rangeQuery } });
    }

    // Build final query
    const searchBody: any = {
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter,
        },
      },
      from: ((query.page || 1) - 1) * (query.limit || 20),
      size: query.limit || 20,
      sort: [
        {
          [query.sortBy || 'created_at']: {
            order: query.sortOrder || 'desc',
          },
        },
      ],
    };

    // Execute search
    const response = await client.search({
      index: indexName,
      body: searchBody,
    });

    // Map OpenSearch results to Document type
    const documents: Document[] = response.body.hits.hits.map((hit: any) => {
      const source = hit._source;
      return {
        id: source.id,
        name: source.name,
        type: source.type,
        status: source.status,
        created_at: source.created_at,
        updated_at: source.updated_at,
        thumbnail_url: source.thumbnail_url,
        pdf_url: source.pdf_url,
        original_url: source.original_url,
        user_id: source.user_id,
        metadata: source.metadata,
        gobd_compliant: source.gobd_compliant,
        gobd_validated_at: source.gobd_validated_at,
        gobd_check_url: source.gobd_check_url,
        signature_hash: source.signature_hash,
      };
    });

    const total = typeof response.body.hits.total === 'number'
      ? response.body.hits.total
      : response.body.hits.total?.value || 0;

    console.log(`[OpenSearch] Found ${total} documents for user ${userId}`);
    return { documents, total };
  } catch (error) {
    console.error(`[OpenSearch] Error searching documents for user ${userId}:`, error);
    return { documents: [], total: 0 };
  }
}

/**
 * Delete document from user's index
 */
export async function deleteDocument(
  userId: string,
  documentId: string
): Promise<boolean> {
  const indexName = getUserIndexName(userId);
  const client = getOpenSearchClient();

  if (!client) {
    console.warn('[OpenSearch] Client not available, cannot delete document');
    return false;
  }

  try {
    await client.delete({
      index: indexName,
      id: documentId,
      refresh: true,
    });

    console.log(`[OpenSearch] Document ${documentId} deleted successfully`);
    return true;
  } catch (error) {
    console.error(`[OpenSearch] Error deleting document ${documentId}:`, error);
    return false;
  }
}

/**
 * Delete multiple documents from user's index by their IDs
 */
export async function deleteDocumentsByIds(
  userId: string,
  documentIds: string[]
): Promise<boolean> {
  const indexName = getUserIndexName(userId);
  const client = getOpenSearchClient();

  if (!client) {
    console.warn('[OpenSearch] Client not available, cannot delete documents');
    return false;
  }

  if (documentIds.length === 0) {
    return true;
  }

  try {
    await client.deleteByQuery({
      index: indexName,
      body: {
        query: {
          terms: {
            _id: documentIds,
          },
        },
      },
      refresh: true,
    });

    console.log(`[OpenSearch] Deleted ${documentIds.length} documents successfully`);
    return true;
  } catch (error) {
    console.error(`[OpenSearch] Error deleting documents by IDs:`, error);
    return false;
  }
}

/**
 * Get all document IDs from user's index
 */
export async function getAllDocumentIds(userId: string): Promise<string[]> {
  const indexName = getUserIndexName(userId);
  const client = getOpenSearchClient();

  if (!client) {
    console.warn('[OpenSearch] Client not available, cannot get all document IDs');
    return [];
  }

  const documentIds: string[] = [];
  try {
    let response = await client.search({
      index: indexName,
      scroll: '1m',
      _source: false,
      body: {
        query: { match_all: {} },
      },
    });

    while (response.body.hits.hits.length > 0) {
      documentIds.push(...response.body.hits.hits.map((hit: any) => hit._id));

      if (!response.body._scroll_id) {
        break;
      }

      response = await client.scroll({
        scroll_id: response.body._scroll_id,
        scroll: '1m',
      });
    }
  } catch (error) {
    console.error(`[OpenSearch] Error getting all document IDs for user ${userId}:`, error);
  }

  return documentIds;
}

/**
 * Ensure user has an index (create if not exists)
 * This should be called on user login or first document upload
 */
export async function ensureUserIndex(userId: string): Promise<boolean> {
  const exists = await checkUserIndexExists(userId);
  if (exists) {
    return true;
  }

  return await createUserIndex(userId);
}

/**
 * TODO: Generate vector embeddings using OpenAI
 * This will enable semantic search functionality
 */
/*
async function generateEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}
*/
