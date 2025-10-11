/**
 * Integration tests for document list API
 * GET /api/documents/list
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { mockSession, mockUnauthenticatedSession } from '@/__tests__/utils/mock-session';
import { sampleDocumentList } from '@/__tests__/fixtures/sample-documents';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock authOptions
vi.mock('../../auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

// Mock opensearch module
vi.mock('@/lib/opensearch', () => ({
  searchDocuments: vi.fn(),
}));

// Mock middleware
vi.mock('@/middleware/ensure-user-index', () => ({
  ensureUserIndexMiddleware: vi.fn(),
}));

describe('GET /api/documents/list - List API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockUnauthenticatedSession);

      const request = new NextRequest('http://localhost:3000/api/documents/list');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Nicht authentifiziert');
    });

    it('should accept authenticated requests', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: sampleDocumentList,
        total: sampleDocumentList.length,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list');

      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Basic Listing', () => {
    it('should return all documents for authenticated user', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: sampleDocumentList,
        total: sampleDocumentList.length,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list');

      const response = await GET(request);
      const data = await response.json();

      expect(data.documents).toHaveLength(sampleDocumentList.length);
      expect(data.pagination).toBeDefined();
    });

    it('should paginate results correctly', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: sampleDocumentList,
        total: 100,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list?page=2&limit=10');

      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.total).toBe(100);
      expect(data.pagination.totalPages).toBe(10);
    });

    it('should include document metadata', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: sampleDocumentList,
        total: sampleDocumentList.length,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list');

      const response = await GET(request);
      const data = await response.json();

      expect(data.documents[0].metadata).toBeDefined();
      expect(data.documents[0].metadata.restaurant_name).toBeDefined();
      expect(data.documents[0].metadata.total_amount).toBeDefined();
    });

    it('should include URLs', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: sampleDocumentList,
        total: sampleDocumentList.length,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list');

      const response = await GET(request);
      const data = await response.json();

      expect(data.documents[0].pdf_url).toBeDefined();
      expect(data.documents[0].thumbnail_url).toBeDefined();
    });
  });

  describe('Search Functionality', () => {
    it('should search by query string', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: [sampleDocumentList[0]],
        total: 1,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list?search=Goldenen');

      const response = await GET(request);
      const data = await response.json();

      expect(searchDocuments).toHaveBeenCalledWith(
        mockSession.user.id,
        expect.objectContaining({
          search: 'Goldenen',
        })
      );
    });

    it('should pass search query to OpenSearch', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: [],
        total: 0,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const searchQuery = 'test search';
      const request = new NextRequest(`http://localhost:3000/api/documents/list?search=${encodeURIComponent(searchQuery)}`);

      await GET(request);

      expect(searchDocuments).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          search: searchQuery,
        })
      );
    });
  });

  describe('Filtering', () => {
    it('should filter by date range', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: [],
        total: 0,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list?dateFrom=2024-01-01&dateTo=2024-12-31');

      await GET(request);

      expect(searchDocuments).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          dateFrom: '2024-01-01',
          dateTo: '2024-12-31',
        })
      );
    });

    it('should filter by document type', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: sampleDocumentList.filter(d => d.type === 'bewirtungsbeleg'),
        total: 1,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list?type=bewirtungsbeleg');

      await GET(request);

      expect(searchDocuments).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: 'bewirtungsbeleg',
        })
      );
    });

    it('should filter by status', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: sampleDocumentList.filter(d => d.status === 'completed'),
        total: 2,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list?status=completed');

      await GET(request);

      expect(searchDocuments).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: 'completed',
        })
      );
    });

    it('should combine multiple filters', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: [],
        total: 0,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list?type=bewirtungsbeleg&status=completed&dateFrom=2024-01-01');

      await GET(request);

      expect(searchDocuments).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: 'bewirtungsbeleg',
          status: 'completed',
          dateFrom: '2024-01-01',
        })
      );
    });
  });

  describe('Sorting', () => {
    it('should sort by date (ascending)', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: sampleDocumentList,
        total: sampleDocumentList.length,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list?sortBy=created_at&sortOrder=asc');

      await GET(request);

      expect(searchDocuments).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          sortBy: 'created_at',
          sortOrder: 'asc',
        })
      );
    });

    it('should sort by date (descending)', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: sampleDocumentList,
        total: sampleDocumentList.length,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list?sortBy=created_at&sortOrder=desc');

      await GET(request);

      expect(searchDocuments).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          sortBy: 'created_at',
          sortOrder: 'desc',
        })
      );
    });

    it('should sort by amount', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: sampleDocumentList,
        total: sampleDocumentList.length,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list?sortBy=amount&sortOrder=desc');

      await GET(request);

      expect(searchDocuments).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          sortBy: 'amount',
        })
      );
    });

    it('should default to created_at desc', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: sampleDocumentList,
        total: sampleDocumentList.length,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list');

      await GET(request);

      expect(searchDocuments).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          sortBy: 'created_at',
          sortOrder: 'desc',
        })
      );
    });
  });

  describe('Pagination', () => {
    it('should default to page 1 and limit 20', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: sampleDocumentList,
        total: sampleDocumentList.length,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list');

      await GET(request);

      expect(searchDocuments).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          page: 1,
          limit: 20,
        })
      );
    });

    it('should respect page parameter', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: sampleDocumentList,
        total: 100,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list?page=3');

      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(3);
    });

    it('should respect limit parameter', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: sampleDocumentList,
        total: 100,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list?limit=50');

      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(50);
    });

    it('should cap limit at 100', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: sampleDocumentList,
        total: 200,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list?limit=500');

      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(100);
    });

    it('should calculate totalPages correctly', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: sampleDocumentList,
        total: 47,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list?limit=10');

      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.totalPages).toBe(5); // Math.ceil(47 / 10)
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on OpenSearch errors', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockRejectedValue(new Error('OpenSearch error'));
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list');

      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it('should handle empty results gracefully', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: [],
        total: 0,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/documents/list?search=nonexistent');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.documents).toHaveLength(0);
      expect(data.pagination.total).toBe(0);
    });
  });

  describe('BDD Scenario: Search by restaurant name', () => {
    it('Given receipts from multiple restaurants, When searching for specific restaurant, Then should find matching receipts', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      // Given receipts exist
      (searchDocuments as any).mockResolvedValue({
        documents: [sampleDocumentList[0]],
        total: 1,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      // When searching
      const request = new NextRequest('http://localhost:3000/api/documents/list?search=Goldenen');

      const response = await GET(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(200);
      expect(data.documents).toHaveLength(1);
      expect(data.pagination.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('BDD Scenario: Filter by date range', () => {
    it('Given receipts from January to March, When filtering for February, Then should see only February receipts', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(mockSession);

      const { searchDocuments } = await import('@/lib/opensearch');
      const { ensureUserIndexMiddleware } = await import('@/middleware/ensure-user-index');

      (searchDocuments as any).mockResolvedValue({
        documents: [],
        total: 0,
      });
      (ensureUserIndexMiddleware as any).mockResolvedValue(true);

      // When filtering for February
      const request = new NextRequest('http://localhost:3000/api/documents/list?dateFrom=2024-02-01&dateTo=2024-02-29');

      await GET(request);

      // Then correct filters should be applied
      expect(searchDocuments).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          dateFrom: '2024-02-01',
          dateTo: '2024-02-29',
        })
      );
    });
  });
});
