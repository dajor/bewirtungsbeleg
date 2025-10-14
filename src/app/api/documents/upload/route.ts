import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { randomUUID } from 'crypto';
import { authOptions } from '@/lib/auth';
import { uploadDocumentSet } from '@/lib/spaces';
import { generateDocumentEmbedding, generateEmbeddingText } from '@/lib/embeddings';
import { indexDocument } from '@/lib/opensearch';
import { ensureUserIndexMiddleware } from '@/middleware/ensure-user-index';
import { validateSpacesConfig } from '@/lib/env';
import { convertToProxyUrl } from '@/lib/url';
import type { Document } from '@/types/document';

/**
 * POST /api/documents/upload
 *
 * Upload document to DigitalOcean Spaces and index in OpenSearch
 *
 * Expected request body:
 * {
 *   pdfBase64: string;       // PDF document in base64
 *   pngBase64: string;       // PNG preview in base64
 *   metadata: {              // Form data from Bewirtungsbeleg
 *     datum: string;
 *     restaurantName: string;
 *     restaurantAnschrift: string;
 *     teilnehmer: string;
 *     anlass: string;
 *     gesamtbetrag: string;
 *     gesamtbetragMwst: string;
 *     gesamtbetragNetto: string;
 *     trinkgeld: string;
 *     zahlungsart: string;
 *     bemerkungen: string;
 *     mitarbeiterName: string;
 *     mitarbeiterPersonalnummer: string;
 *     istEigenbeleg: boolean;
 *     // ... other form fields
 *   }
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   document?: {
 *     id: string;
 *     pdfUrl: string;
 *     pngUrl: string;
 *     metadataUrl: string;
 *   };
 *   error?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const userId = session.user.id || session.user.email || 'user-1';

    // Check if DigitalOcean Spaces is configured
    const spacesConfig = validateSpacesConfig();
    if (!spacesConfig.configured) {
      console.error('[Upload API] DigitalOcean Spaces not configured:', spacesConfig.missingVars);
      return NextResponse.json(
        {
          error: 'Cloud-Speicher ist nicht konfiguriert',
          details: `Fehlende Konfiguration: ${spacesConfig.missingVars.join(', ')}`,
          code: 'SPACES_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Ensure user has an OpenSearch index
    await ensureUserIndexMiddleware(userId);

    // Parse request body
    const body = await request.json();
    const { pdfBase64, pngBase64, metadata, extractedJson, gobdCheckJson } = body;

    // Validate required fields
    if (!pdfBase64 || !pngBase64 || !metadata) {
      return NextResponse.json(
        { error: 'PDF, PNG preview und Metadaten sind erforderlich' },
        { status: 400 }
      );
    }

    console.log('[Upload API] Starting document upload for user:', userId);

    // Convert base64 to buffers
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const pngBuffer = Buffer.from(pngBase64, 'base64');

    const documentId = randomUUID();
    metadata.id = documentId;

    // Step 1: Upload files to DigitalOcean Spaces (PDF, PNG, metadata, and optionally extracted + GoBD JSONs)
    console.log('[Upload API] Uploading to DigitalOcean Spaces...');
    const uploadResult = await uploadDocumentSet(userId, pdfBuffer, pngBuffer, metadata, {
      extractedData: extractedJson || undefined,
      gobdCheckData: gobdCheckJson || undefined,
    });

    if (!uploadResult || !uploadResult.success) {
      console.error('[Upload API] Failed to upload files to Spaces');
      return NextResponse.json(
        { error: 'Fehler beim Hochladen der Dateien' },
        { status: 500 }
      );
    }

    const { pdfUrl, pngUrl, metadataUrl, extractedUrl, gobdCheckUrl } = uploadResult;

    // Convert Spaces URLs to API proxy URLs for secure access
    const pdfProxyUrl = pdfUrl ? convertToProxyUrl(pdfUrl) : null;
    const pngProxyUrl = pngUrl ? convertToProxyUrl(pngUrl) : null;
    const metadataProxyUrl = metadataUrl ? convertToProxyUrl(metadataUrl) : null;
    const extractedProxyUrl = extractedUrl ? convertToProxyUrl(extractedUrl) : null;
    const gobdCheckProxyUrl = gobdCheckUrl ? convertToProxyUrl(gobdCheckUrl) : null;

    // Verify critical URLs are present
    if (!pdfProxyUrl || !pngProxyUrl) {
      console.error('[Upload API] Missing critical URLs:', { pdfProxyUrl, pngProxyUrl });
      return NextResponse.json(
        { error: 'Fehler beim Generieren der Dokument-URLs' },
        { status: 500 }
      );
    }

    // Step 2: Generate vector embedding for semantic search
    console.log('[Upload API] Generating vector embedding for document...');
    const embeddingStartTime = Date.now();
    let embedding: number[] | null = null;

    try {
      embedding = await generateDocumentEmbedding(metadata);

      if (embedding) {
        const embeddingTime = Date.now() - embeddingStartTime;
        console.log(`[Upload API] Vector embedding generated successfully (${embedding.length} dimensions, ${embeddingTime}ms)`);
      } else {
        console.warn('[Upload API] Failed to generate embedding - semantic search will not be available for this document');
        console.warn('[Upload API] Possible causes: OpenAI API key not configured, empty metadata, or API error');
      }
    } catch (error) {
      console.error('[Upload API] Exception during embedding generation:', error);
      console.warn('[Upload API] Continuing without embedding - document will still be indexed with fulltext search');
      embedding = null;
    }

    // Step 3: Generate fulltext content
    const fullText = generateEmbeddingText(metadata);

    // Step 4: Create document object for OpenSearch
    const document: Document = {
      id: documentId,
      name: metadata.fileName || `Bewirtungsbeleg_${metadata.restaurantName}_${metadata.datum}.pdf`,
      type: metadata.istEigenbeleg ? 'eigenbeleg' : 'bewirtungsbeleg',
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      thumbnail_url: pngProxyUrl,
      pdf_url: pdfProxyUrl,
      original_url: pdfProxyUrl,
      user_id: userId,
      metadata: {
        total_amount: parseFloat(metadata.gesamtbetrag) || 0,
        currency: 'EUR',
        date: metadata.datum,
        restaurant_name: metadata.restaurantName,
        participants: Array.isArray(metadata.teilnehmer)
          ? metadata.teilnehmer
          : metadata.teilnehmer?.split(',').map((p: string) => p.trim()),
        business_purpose: metadata.anlass,
        restaurant_address: metadata.restaurantAnschrift,
        payment_method: metadata.zahlungsart,
        notes: metadata.bemerkungen,
        employee_name: metadata.mitarbeiterName,
        employee_number: metadata.mitarbeiterPersonalnummer,
        vat_amount: parseFloat(metadata.gesamtbetragMwst) || 0,
        net_amount: parseFloat(metadata.gesamtbetragNetto) || 0,
        tip: parseFloat(metadata.trinkgeld) || 0,
        is_eigenbeleg: metadata.istEigenbeleg || false,
      },
      gobd_compliant: gobdCheckJson ? (gobdCheckJson.compliant === true) : false,
      gobd_validated_at: gobdCheckJson && gobdCheckJson.compliant ? new Date().toISOString() : undefined,
      gobd_check_url: gobdCheckProxyUrl || undefined,
      signature_hash: generateSignatureHash(metadata),
    };

    // Step 5: Index document in OpenSearch with embedding
    console.log('[Upload API] Indexing document in OpenSearch...');
    const documentToIndex = {
      ...document,
      embedding,
      full_text: fullText,
      form_data: metadata,
    };

    console.log('[Upload API] Document to index:', JSON.stringify(documentToIndex, null, 2));

    try {
      const indexSuccess = await indexDocument(userId, documentToIndex as any);

      if (!indexSuccess) {
        throw new Error('indexDocument returned false');
      }
    } catch (error) {
      console.error('[Upload API] Failed to index document in OpenSearch:', error);
      // Don't fail the request, files are already uploaded
      console.warn('[Upload API] Document uploaded to Spaces but not indexed in OpenSearch');
    }

    console.log('[Upload API] Document upload completed successfully');

    // Return success response
    return NextResponse.json({
      success: true,
      document: {
        id: documentId,
        pdfUrl: pdfProxyUrl,
        pngUrl: pngProxyUrl,
        metadataUrl: metadataProxyUrl,
        extractedUrl: extractedProxyUrl,
        gobdCheckUrl: gobdCheckProxyUrl,
      },
    });
  } catch (error) {
    console.error('[Upload API] Error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Hochladen des Dokuments' },
      { status: 500 }
    );
  }
}

/**
 * Generate GoBD-compliant signature hash
 * Uses SHA-256 hash of key document fields
 */
function generateSignatureHash(metadata: Record<string, any>): string {
  const crypto = require('crypto');

  // Create consistent string from key fields
  const signatureData = [
    metadata.datum,
    metadata.restaurantName,
    metadata.gesamtbetrag,
    metadata.anlass,
    new Date().toISOString(),
  ]
    .filter(Boolean)
    .join('|');

  // Generate SHA-256 hash
  const hash = crypto.createHash('sha256').update(signatureData).digest('hex');

  return `sha256-${hash}`;
}
