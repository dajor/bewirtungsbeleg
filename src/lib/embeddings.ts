/**
 * OpenAI Embeddings Helper
 *
 * Generates vector embeddings for semantic search
 * Uses text-embedding-3-small model (1536 dimensions)
 */

import OpenAI from 'openai';
import { env } from './env';
import type { Document } from '@/types/document';

// Singleton OpenAI client instance
let openaiClient: OpenAI | null = null;

/**
 * Initialize and return OpenAI client
 */
function getOpenAIClient(): OpenAI | null {
  if (!env.OPENAI_API_KEY) {
    console.warn('[Embeddings] OPENAI_API_KEY not configured, embeddings disabled');
    return null;
  }

  if (openaiClient) {
    return openaiClient;
  }

  try {
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    console.log('[Embeddings] OpenAI client initialized successfully');
    return openaiClient;
  } catch (error) {
    console.error('[Embeddings] Failed to initialize OpenAI client:', error);
    return null;
  }
}

/**
 * Generate text content for embedding from document metadata
 * This creates a rich text representation of the document for semantic search
 */
export function generateEmbeddingText(metadata: Record<string, any>): string {
  const parts: string[] = [];

  // Add document type
  if (metadata.type) {
    parts.push(`Dokumenttyp: ${metadata.type}`);
  }

  // Add date
  if (metadata.datum || metadata.date) {
    const date = metadata.datum || metadata.date;
    parts.push(`Datum: ${date}`);
  }

  // Add restaurant information
  if (metadata.restaurantName || metadata.restaurant_name) {
    const restaurantName = metadata.restaurantName || metadata.restaurant_name;
    parts.push(`Restaurant: ${restaurantName}`);
  }

  if (metadata.restaurantAnschrift || metadata.restaurant_address) {
    const address = metadata.restaurantAnschrift || metadata.restaurant_address;
    parts.push(`Adresse: ${address}`);
  }

  // Add participants
  if (metadata.teilnehmer || metadata.participants) {
    const participants = metadata.teilnehmer || metadata.participants;
    if (Array.isArray(participants)) {
      parts.push(`Teilnehmer: ${participants.join(', ')}`);
    } else if (typeof participants === 'string') {
      parts.push(`Teilnehmer: ${participants}`);
    }
  }

  // Add business purpose
  if (metadata.anlass || metadata.business_purpose) {
    const purpose = metadata.anlass || metadata.business_purpose;
    parts.push(`Anlass: ${purpose}`);
  }

  // Add amount information
  if (metadata.gesamtbetrag || metadata.total_amount) {
    const amount = metadata.gesamtbetrag || metadata.total_amount;
    const currency = metadata.currency || 'EUR';
    parts.push(`Gesamtbetrag: ${amount} ${currency}`);
  }

  // Add VAT breakdown if available
  if (metadata.gesamtbetragMwst) {
    parts.push(`Mehrwertsteuer: ${metadata.gesamtbetragMwst} EUR`);
  }

  if (metadata.gesamtbetragNetto) {
    parts.push(`Nettobetrag: ${metadata.gesamtbetragNetto} EUR`);
  }

  // Add tip if available
  if (metadata.trinkgeld) {
    parts.push(`Trinkgeld: ${metadata.trinkgeld} EUR`);
  }

  // Add payment method
  if (metadata.zahlungsart || metadata.payment_method) {
    const paymentMethod = metadata.zahlungsart || metadata.payment_method;
    parts.push(`Zahlungsart: ${paymentMethod}`);
  }

  // Add remarks/notes
  if (metadata.bemerkungen || metadata.notes) {
    const notes = metadata.bemerkungen || metadata.notes;
    parts.push(`Bemerkungen: ${notes}`);
  }

  // Add employee information if available
  if (metadata.mitarbeiterName || metadata.employee_name) {
    const employeeName = metadata.mitarbeiterName || metadata.employee_name;
    parts.push(`Mitarbeiter: ${employeeName}`);
  }

  return parts.filter(Boolean).join('\n');
}

/**
 * Generate vector embedding using OpenAI
 *
 * @param text - Text to generate embedding for
 * @returns 1536-dimensional vector or null if failed
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const client = getOpenAIClient();
  if (!client) {
    console.warn('[Embeddings] Cannot generate embedding: client not configured');
    return null;
  }

  if (!text || text.trim().length === 0) {
    console.warn('[Embeddings] Cannot generate embedding: empty text');
    return null;
  }

  try {
    console.log('[Embeddings] Generating embedding...');

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    const embedding = response.data[0].embedding;

    console.log(`[Embeddings] Generated ${embedding.length}-dimensional embedding`);
    return embedding;
  } catch (error) {
    console.error('[Embeddings] Error generating embedding:', error);
    return null;
  }
}

/**
 * Generate embedding for a document from its metadata
 *
 * @param metadata - Document metadata
 * @returns Vector embedding or null if failed
 */
export async function generateDocumentEmbedding(metadata: Record<string, any>): Promise<number[] | null> {
  const text = generateEmbeddingText(metadata);

  if (!text) {
    console.warn('[Embeddings] Cannot generate embedding: no text extracted from metadata');
    return null;
  }

  return await generateEmbedding(text);
}

/**
 * Batch generate embeddings for multiple documents
 * Uses rate limiting to avoid API throttling
 *
 * @param metadataList - Array of document metadata
 * @param delayMs - Delay between API calls (default: 100ms)
 * @returns Array of embeddings (null for failed ones)
 */
export async function batchGenerateEmbeddings(
  metadataList: Record<string, any>[],
  delayMs: number = 100
): Promise<(number[] | null)[]> {
  const embeddings: (number[] | null)[] = [];

  for (let i = 0; i < metadataList.length; i++) {
    const embedding = await generateDocumentEmbedding(metadataList[i]);
    embeddings.push(embedding);

    // Add delay between API calls to avoid rate limiting
    if (i < metadataList.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  const successCount = embeddings.filter((e) => e !== null).length;
  console.log(`[Embeddings] Generated ${successCount}/${metadataList.length} embeddings`);

  return embeddings;
}

/**
 * Calculate cosine similarity between two embeddings
 * Used for testing and validation
 *
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns Similarity score between -1 and 1 (1 = identical)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
