import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { searchDocuments } from '@/lib/opensearch';
import { ensureUserIndexMiddleware } from '@/middleware/ensure-user-index';
import type {
  Document,
  DocumentListResponse,
  DocumentListQuery,
  DocumentStatus,
  DocumentType,
} from '@/types/document';

/**
 * GET /api/documents/list
 *
 * Fetch paginated list of documents for the authenticated user
 *
 * Search Implementation:
 * - Uses OpenSearch for fulltext and vector search
 * - Supports semantic search across document metadata
 * - Vector embeddings for similar document discovery
 *
 * Query Parameters:
 * - search: Filter by document name or metadata (OpenSearch fulltext + vector)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - dateFrom: Filter documents created after this date (ISO 8601)
 * - dateTo: Filter documents created before this date (ISO 8601)
 * - type: Filter by document type
 * - status: Filter by document status
 * - sortBy: Sort field (default: created_at)
 * - sortOrder: Sort order (default: desc)
 *
 * TODO: Integrate with DocBits OpenSearch API
 * - Endpoint: https://api.polydocs.io/search or similar
 * - Use user's access token for authentication
 * - Implement vector search for semantic similarity
 * - Cache search results for performance
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const userId = session.user.id || session.user.email || 'user-1';

    // Ensure user has an OpenSearch index
    await ensureUserIndexMiddleware(userId);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const query: DocumentListQuery = {
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '20', 10), 100),
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      type: (searchParams.get('type') as DocumentType) || undefined,
      status: (searchParams.get('status') as DocumentStatus) || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    // Search in user's OpenSearch index
    // This ensures User A only sees their documents, User B only sees theirs
    console.log(`[Documents API] Searching in index for user: ${userId}`);
    const { documents, total } = await searchDocuments(userId, query);

    // If OpenSearch is not configured or returns no results, fall back to mock data
    let finalDocuments = documents;
    let finalTotal = total;

    if (finalDocuments.length === 0 && !query.search && !query.type && !query.status) {
      console.log('[Documents API] No OpenSearch results, using mock data for development');
      const mockDocuments: Document[] = generateMockDocuments(userId);

      // Apply filters
      let filteredDocuments = mockDocuments;

      // Search filter
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        filteredDocuments = filteredDocuments.filter(
          (doc) =>
            doc.name.toLowerCase().includes(searchLower) ||
            doc.metadata.restaurant_name?.toLowerCase().includes(searchLower) ||
            doc.metadata.business_purpose?.toLowerCase().includes(searchLower)
        );
      }

      // Date filters
      if (query.dateFrom) {
        filteredDocuments = filteredDocuments.filter(
          (doc) => new Date(doc.created_at) >= new Date(query.dateFrom!)
        );
      }
      if (query.dateTo) {
        filteredDocuments = filteredDocuments.filter(
          (doc) => new Date(doc.created_at) <= new Date(query.dateTo!)
        );
      }

      // Type filter
      if (query.type) {
        filteredDocuments = filteredDocuments.filter((doc) => doc.type === query.type);
      }

      // Status filter
      if (query.status) {
        filteredDocuments = filteredDocuments.filter((doc) => doc.status === query.status);
      }

      // Sort
      filteredDocuments.sort((a, b) => {
        const aValue = getSortValue(a, query.sortBy!);
        const bValue = getSortValue(b, query.sortBy!);

        if (query.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Paginate
      finalTotal = filteredDocuments.length;
      const totalPages = Math.ceil(finalTotal / query.limit!);
      const startIndex = (query.page! - 1) * query.limit!;
      const endIndex = startIndex + query.limit!;
      finalDocuments = filteredDocuments.slice(startIndex, endIndex);
    }

    // Return consistent response format
    const response: DocumentListResponse = {
      documents: finalDocuments,
      pagination: {
        page: query.page!,
        limit: query.limit!,
        total: finalTotal,
        totalPages: Math.ceil(finalTotal / query.limit!),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Documents List] Error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Dokumente' },
      { status: 500 }
    );
  }
}

/**
 * Get sort value from document based on sort field
 */
function getSortValue(doc: Document, sortBy: string): any {
  switch (sortBy) {
    case 'created_at':
      return new Date(doc.created_at).getTime();
    case 'updated_at':
      return doc.updated_at ? new Date(doc.updated_at).getTime() : 0;
    case 'name':
      return doc.name.toLowerCase();
    case 'amount':
      return doc.metadata.total_amount || 0;
    default:
      return 0;
  }
}

/**
 * Generate mock documents for development
 * TODO: Remove when DocBits API integration is complete
 */
function generateMockDocuments(userId: string): Document[] {
  const now = new Date();
  const mockDocuments: Document[] = [];

  // Sample restaurants and data
  const restaurants = [
    'Restaurant Zur Krone',
    'Gasthaus Löwen',
    'Pizzeria Roma',
    'Café Einstein',
    'Steakhouse Texas',
    'Sushi Bar Tokio',
    'Burger Palace',
    'La Trattoria',
  ];

  const purposes = [
    'Kundenmeeting',
    'Geschäftsessen',
    'Teammeeting',
    'Projektbesprechung',
    'Vertragsverhandlung',
    'Mitarbeiteressen',
    'Geschäftsreise',
  ];

  const statuses: DocumentStatus[] = ['completed', 'completed', 'completed', 'processing', 'error'];

  // Generate 25 mock documents
  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 90); // Random date within last 90 days
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - daysAgo);

    const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
    const purpose = purposes[Math.floor(Math.random() * purposes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = (Math.random() * 150 + 20).toFixed(2); // Random amount between 20 and 170 EUR

    const doc: Document = {
      id: `doc-${i + 1}`,
      name: `Bewirtungsbeleg_${restaurant.replace(/\s+/g, '_')}_${createdAt.toISOString().split('T')[0]}.pdf`,
      type: i % 5 === 0 ? 'eigenbeleg' : 'bewirtungsbeleg',
      status,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
      thumbnail_url: '/images/receipt-placeholder.png',
      pdf_url: `/documents/${i + 1}.pdf`,
      user_id: userId,
      metadata: {
        total_amount: parseFloat(amount),
        currency: 'EUR',
        date: createdAt.toISOString().split('T')[0],
        restaurant_name: restaurant,
        participants: ['Max Mustermann', 'Erika Musterfrau'],
        business_purpose: purpose,
      },
      gobd_compliant: status === 'completed',
      signature_hash: status === 'completed' ? `sha256-${Math.random().toString(36).substring(7)}` : undefined,
    };

    mockDocuments.push(doc);
  }

  return mockDocuments;
}
