import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listDocuments, getDocument, getDocumentUrl } from '@/lib/spaces';
import { indexDocument, getAllDocumentIds, deleteDocumentsByIds } from '@/lib/opensearch';
import { createHash } from 'crypto';
import { convertToProxyUrl } from '@/lib/url';
import type { Document } from '@/types/document';

// Helper to extract timestamp from filename
const getTimestampFromKey = (key: string): number | null => {
  const match = key.match(/\/(\d{13})-/);
  return match ? parseInt(match[1], 10) : null;
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const userId = session.user.id || session.user.email || 'user-1';

    console.log(`[Re-index API] Starting re-index for user: ${userId}`);

    // Get all existing document IDs from OpenSearch
    const existingIds = await getAllDocumentIds(userId);
    console.log(`[Re-index API] Found ${existingIds.length} existing documents in the index.`);

    const allFiles = await listDocuments(userId);

    if (allFiles.length === 0) {
      // If no files in spaces, delete all documents from the index
      if (existingIds.length > 0) {
        await deleteDocumentsByIds(userId, existingIds);
        console.log(`[Re-index API] Deleted ${existingIds.length} documents from the index as no files were found in Spaces.`);
      }
      return NextResponse.json({ message: 'Keine Dokumente zum Re-indizieren gefunden.' });
    }

    // Group files by timestamp (rounded to nearest 2 seconds)
    const groupedFiles = new Map<number, { pdf?: string; png?: string; json?: string }>();

    for (const key of allFiles) {
      const timestamp = getTimestampFromKey(key);
      if (timestamp) {
        const groupKey = Math.round(timestamp / 2000);
        if (!groupedFiles.has(groupKey)) {
          groupedFiles.set(groupKey, {});
        }
        const group = groupedFiles.get(groupKey)!;
        if (key.endsWith('.pdf')) group.pdf = key;
        if (key.endsWith('.png')) group.png = key;
        if (key.endsWith('.json') && !key.endsWith('-extracted.json') && !key.endsWith('-gobd.json')) {
          group.json = key;
        }
      }
    }

    let successCount = 0;
    let errorCount = 0;
    const reindexedIds: string[] = [];

    // Convert Map to array for iteration to avoid TypeScript downlevelIteration issues
    // This fix ensures compatibility with older TypeScript targets
    const groupedFilesArray = Array.from(groupedFiles.entries());
    for (const [_, group] of groupedFilesArray) {
      if (!group.json) {
        continue;
      }

      try {
        const metadataBuffer = await getDocument(group.json);
        if (!metadataBuffer) {
          console.error(`[Re-index API] Failed to fetch metadata for key: ${group.json}`);
          errorCount++;
          continue;
        }

        const metadata = JSON.parse(metadataBuffer.toString('utf-8'));

        const documentId = metadata.id || createHash('sha1').update(group.json).digest('hex');
        console.log(`[Re-index API] Processing document with ID: ${documentId}`);

        const pdfUrl = group.pdf ? getDocumentUrl(group.pdf) : metadata.pdf_url;
        const thumbnailUrl = group.png ? getDocumentUrl(group.png) : metadata.thumbnail_url;

        const pdfProxyUrl = pdfUrl ? convertToProxyUrl(pdfUrl) : undefined;
        const thumbnailProxyUrl = thumbnailUrl ? convertToProxyUrl(thumbnailUrl) : undefined;

        const document: Document = {
          id: documentId,
          name: metadata.fileName || `Bewirtungsbeleg_${metadata.restaurantName}_${metadata.datum}.pdf`,
          type: metadata.istEigenbeleg ? 'eigenbeleg' : 'bewirtungsbeleg',
          status: 'completed',
          created_at: metadata.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          thumbnail_url: thumbnailProxyUrl,
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
          gobd_compliant: false,
          gobd_validated_at: undefined,
          gobd_check_url: undefined,
          signature_hash: undefined,
        };

        const indexSuccess = await indexDocument(userId, document as any);

        if (indexSuccess) {
          successCount++;
          reindexedIds.push(documentId);
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`[Re-index API] Error processing group:`, error);
        errorCount++;
      }
    }

    // Delete documents that are in the index but not in Spaces
    const idsToDelete = existingIds.filter(id => !reindexedIds.includes(id));
    if (idsToDelete.length > 0) {
      console.log(`[Re-index API] Deleting ${idsToDelete.length} old documents from the index.`);
      await deleteDocumentsByIds(userId, idsToDelete);
    }

    console.log(`[Re-index API] Re-index completed for user: ${userId}. Success: ${successCount}, Errors: ${errorCount}, Deleted: ${idsToDelete.length}`);

    return NextResponse.json({
      message: `Re-indizierung abgeschlossen. ${successCount} Dokumente erfolgreich re-indiziert, ${errorCount} Fehler, ${idsToDelete.length} alte Dokumente gelöscht.`,
      successCount,
      errorCount,
      deletedCount: idsToDelete.length,
    });
  } catch (error) {
    console.error('[Re-index API] Error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Re-indizierung.' },
      { status: 500 }
    );
  }
}
