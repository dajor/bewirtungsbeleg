import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deleteDocument as deleteFromOpenSearch, searchDocuments } from '@/lib/opensearch';
import { deleteDocument as deleteFromSpaces } from '@/lib/spaces';

/**
 * DELETE /api/documents/[id]
 *
 * Delete a document from both OpenSearch and DigitalOcean Spaces
 *
 * Security:
 * - Requires authentication
 * - User can only delete their own documents
 * - GoBD-compliant documents CANNOT be deleted (immutable for compliance)
 *
 * @param request NextRequest
 * @param params Route parameters { id: string }
 * @returns JSON response with success/error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const userId = session.user.id || session.user.email || 'user-1';
    const documentId = params.id;

    if (!documentId) {
      return NextResponse.json({ error: 'Dokument-ID erforderlich' }, { status: 400 });
    }

    console.log(`[Delete API] Deleting document ${documentId} for user ${userId}`);

    // Step 1: Fetch document from OpenSearch to verify ownership and GoBD status
    const { documents } = await searchDocuments(userId, { documentId });
    const document = documents[0];

    if (!document) {
      return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 });
    }

    // Step 2: Check if document is GoBD-compliant
    if (document.gobd_compliant) {
      console.warn(`[Delete API] Attempted to delete GoBD-compliant document ${documentId}`);
      return NextResponse.json(
        {
          error: 'GoBD-validierte Dokumente können nicht gelöscht werden',
          reason: 'gobd_compliance',
          validated_at: document.gobd_validated_at,
        },
        { status: 403 }
      );
    }

    // Step 3: Delete from OpenSearch
    console.log(`[Delete API] Deleting document ${documentId} from OpenSearch...`);
    const openSearchDeleted = await deleteFromOpenSearch(userId, documentId);

    if (!openSearchDeleted) {
      console.error(`[Delete API] Failed to delete document ${documentId} from OpenSearch`);
      return NextResponse.json(
        { error: 'Fehler beim Löschen aus der Datenbank' },
        { status: 500 }
      );
    }

    // Step 4: Delete files from DigitalOcean Spaces
    console.log(`[Delete API] Deleting files from DigitalOcean Spaces...`);
    const deletionResults: { file: string; success: boolean }[] = [];

    // Extract file keys from URLs
    const urlsToDelete = [
      { type: 'pdf', url: document.pdf_url },
      { type: 'thumbnail', url: document.thumbnail_url },
      { type: 'original', url: document.original_url },
      { type: 'gobd_check', url: document.gobd_check_url },
    ];

    for (const { type, url } of urlsToDelete) {
      if (!url) continue;

      try {
        // Extract file key from proxy URL
        // Format: /api/documents/image/bewirtungsbelege/user-1/file.png
        const fileKey = url.replace('/api/documents/image/', '');

        if (fileKey && fileKey !== url) {
          const deleted = await deleteFromSpaces(fileKey);
          deletionResults.push({ file: type, success: deleted });

          if (deleted) {
            console.log(`[Delete API] Deleted ${type} file: ${fileKey}`);
          } else {
            console.warn(`[Delete API] Failed to delete ${type} file: ${fileKey}`);
          }
        }
      } catch (error) {
        console.error(`[Delete API] Error deleting ${type} file:`, error);
        deletionResults.push({ file: type, success: false });
      }
    }

    // Check if any Spaces deletions failed
    const failedDeletions = deletionResults.filter((r) => !r.success);
    if (failedDeletions.length > 0) {
      console.warn('[Delete API] Some files failed to delete from Spaces:', failedDeletions);
      // Don't fail the request - document is already deleted from OpenSearch
    }

    console.log(`[Delete API] Document ${documentId} deleted successfully`);

    return NextResponse.json({
      success: true,
      message: 'Dokument erfolgreich gelöscht',
      deletedFiles: deletionResults,
    });
  } catch (error) {
    console.error('[Delete API] Error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Dokuments' },
      { status: 500 }
    );
  }
}
