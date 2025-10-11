import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { uploadDocumentSet } from '@/lib/spaces';
import { generateDocumentEmbedding, generateEmbeddingText } from '@/lib/embeddings';
import { indexDocument } from '@/lib/opensearch';
import { ensureUserIndexMiddleware } from '@/middleware/ensure-user-index';
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

    // Ensure user has an OpenSearch index
    await ensureUserIndexMiddleware(userId);

    // Parse request body
    const body = await request.json();
    const { pdfBase64, pngBase64, metadata } = body;

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

    // Step 1: Upload files to DigitalOcean Spaces
    console.log('[Upload API] Uploading to DigitalOcean Spaces...');
    const uploadResult = await uploadDocumentSet(userId, pdfBuffer, pngBuffer, metadata);

    if (!uploadResult || !uploadResult.success) {
      console.error('[Upload API] Failed to upload files to Spaces');
      return NextResponse.json(
        { error: 'Fehler beim Hochladen der Dateien' },
        { status: 500 }
      );
    }

    const { pdfUrl, pngUrl, metadataUrl } = uploadResult;

    // Step 2: Generate vector embedding for semantic search
    console.log('[Upload API] Generating vector embedding...');
    const embedding = await generateDocumentEmbedding(metadata);

    if (!embedding) {
      console.warn('[Upload API] Failed to generate embedding, continuing without it');
    }

    // Step 3: Generate fulltext content
    const fullText = generateEmbeddingText(metadata);

    // Step 4: Create document object for OpenSearch
    const documentId = `doc-${userId}-${Date.now()}`;
    const document: Document = {
      id: documentId,
      name: metadata.fileName || `Bewirtungsbeleg_${metadata.restaurantName}_${metadata.datum}.pdf`,
      type: metadata.istEigenbeleg ? 'eigenbeleg' : 'bewirtungsbeleg',
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      thumbnail_url: pngUrl!,
      pdf_url: pdfUrl!,
      original_url: pdfUrl,
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
      gobd_compliant: true,
      signature_hash: generateSignatureHash(metadata),
    };

    // Step 5: Index document in OpenSearch with embedding
    console.log('[Upload API] Indexing document in OpenSearch...');
    const indexSuccess = await indexDocument(userId, {
      ...document,
      // Add embedding to document for OpenSearch
      embedding,
      full_text: fullText,
      // Add complete form data for detailed queries
      form_data: metadata,
    } as any);

    if (!indexSuccess) {
      console.error('[Upload API] Failed to index document in OpenSearch');
      // Don't fail the request, files are already uploaded
      console.warn('[Upload API] Document uploaded to Spaces but not indexed in OpenSearch');
    }

    console.log('[Upload API] Document upload completed successfully');

    // Return success response
    return NextResponse.json({
      success: true,
      document: {
        id: documentId,
        pdfUrl: pdfUrl!,
        pngUrl: pngUrl!,
        metadataUrl: metadataUrl!,
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
