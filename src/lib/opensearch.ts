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
      body: DOCUMENT_INDEX_MAPPING,
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
 */
export async function indexDocument(
  userId: string,
  document: Document
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
      signature_hash: document.signature_hash,
      // TODO: Generate full_text from document metadata
      full_text: generateFullText(document),
      // TODO: Generate vector embeddings using OpenAI
      // embedding: await generateEmbedding(generateFullText(document)),
    };

    await client.index({
      index: indexName,
      id: document.id,
      body: osDoc,
      refresh: true, // Make document searchable immediately
    });

    console.log(`[OpenSearch] Document ${document.id} indexed successfully`);
    return true;
  } catch (error) {
    console.error(`[OpenSearch] Error indexing document ${document.id}:`, error);
    return false;
  }
}

/**
 * Generate full text content from document for fulltext search
 */
function generateFullText(document: Document): string {
  const parts: string[] = [
    document.name,
    document.type,
    document.metadata.restaurant_name || '',
    document.metadata.business_purpose || '',
    ...(document.metadata.participants || []),
  ];

  return parts.filter(Boolean).join(' ');
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

    // Fulltext search across multiple fields
    if (query.search) {
      must.push({
        multi_match: {
          query: query.search,
          fields: [
            'name^2', // Boost name field
            'full_text',
            'metadata.restaurant_name^1.5',
            'metadata.business_purpose',
            'metadata.participants',
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
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
        signature_hash: source.signature_hash,
      };
    });

    const total = response.body.hits.total.value;

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
