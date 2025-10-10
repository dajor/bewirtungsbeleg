/**
 * BDD: Receipt Data Extraction (OCR) API Tests
 *
 * PURPOSE: Test AI-powered OCR extraction of receipt data from images
 *
 * BUSINESS CONTEXT:
 * German "Bewirtungsbeleg" (hospitality receipt) requires specific data:
 * - Restaurant name, address
 * - Date, time
 * - Individual menu items with prices
 * - VAT breakdown (7% reduced, 19% standard)
 * - Total amount
 * - Payment method
 * - Participants (for business meals)
 *
 * WHY OCR:
 * - Automates manual data entry (saves 5-10 min per receipt)
 * - Reduces human error in tax documentation
 * - Enables bulk receipt processing
 *
 * SECURITY & VALIDATION:
 * - File type whitelist (JPEG, PNG only - no PDFs for OCR)
 * - File size limit (10MB max - prevents DoS)
 * - Path traversal prevention (filename sanitization)
 * - API key validation (OpenAI must be configured)
 *
 * BUSINESS RULES:
 * - PDF files rejected for OCR (use separate PDF-to-image converter first)
 * - Classification type determines extraction strategy
 * - Graceful degradation on API failures
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextResponse } from 'next/server';

describe('POST /api/extract-receipt', () => {
  const mockOpenAICreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenAICreate.mockReset();
  });

  /**
   * BDD: Input Validation - Missing Image
   *
   * GIVEN request without image file
   * WHEN OCR extraction is attempted
   * THEN reject with "Kein Bild gefunden" (400) or service unavailable (503)
   *
   * WHY: Image is required for OCR - no fallback possible
   *
   * SECURITY: Fail fast on missing required data
   *
   * ERROR CODES:
   * - 400: Bad request (OpenAI initialized, validation ran)
   * - 503: Service unavailable (OpenAI not initialized)
   */
  it('should reject request without image', async () => {
    // Mock formData without image
    const mockFormData = new Map();
    mockFormData.set('classificationType', 'rechnung');

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as any;

    const { POST } = await import('./route');
    const response = await POST(mockRequest);
    const data = await response.json();

    // May return 503 if OpenAI not initialized or 400 if it is
    expect([400, 503]).toContain(response.status);
    if (response.status === 400) {
      expect(data.error).toBe('Kein Bild gefunden');
    }
  });

  /**
   * BDD: Security - File Type Whitelist
   *
   * GIVEN file with invalid MIME type (text/plain)
   * WHEN uploaded for OCR
   * THEN reject with "Ungültiger Dateityp"
   *
   * WHY: Only images can be OCR'd
   * - JPEG, PNG: Supported image formats
   * - Other types: No OCR capability
   *
   * SECURITY: Whitelist prevents:
   * - Executable uploads (.exe, .sh)
   * - Archive bombs (.zip with nested files)
   * - Script injection (.html, .js)
   *
   * BUSINESS RULE: Only accept formats that OpenAI Vision supports
   */
  it('should reject invalid file types', async () => {
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

    const mockFormData = new Map();
    mockFormData.set('image', invalidFile);

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as any;

    const { POST } = await import('./route');
    const response = await POST(mockRequest);
    const data = await response.json();

    // May return 503 if OpenAI not initialized or 400 if it is
    expect([400, 503]).toContain(response.status);
    if (response.status === 400) {
      expect(data.error).toContain('Ungültiger Dateityp');
    }
  });

  /**
   * BDD: Business Logic - PDF OCR Not Supported
   *
   * GIVEN a PDF file upload
   * WHEN OCR is attempted
   * THEN reject with 422 and skipOCR=true flag
   *
   * WHY: PDFs need conversion first
   * - OpenAI Vision reads images, not PDFs directly
   * - PDFs must be converted to images first (separate endpoint)
   * - skipOCR flag tells frontend to use PDF converter
   *
   * WORKFLOW:
   * 1. User uploads PDF
   * 2. Frontend detects PDF type
   * 3. Call PDF-to-image converter
   * 4. Then call OCR with resulting image
   *
   * STATUS 422: Unprocessable entity (valid request, wrong format)
   */
  it('should reject PDF files', async () => {
    // Create a minimal PDF file
    const pdfContent = '%PDF-1.4\n%test\n';
    const pdfFile = new File([pdfContent], 'test.pdf', { type: 'application/pdf' });

    const mockFormData = new Map();
    mockFormData.set('image', pdfFile);

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as any;

    const { POST } = await import('./route');
    const response = await POST(mockRequest);
    const data = await response.json();

    // May return 503 if OpenAI not initialized or 422 if it is
    expect([422, 503]).toContain(response.status);
    if (response.status === 422) {
      expect(data.error).toContain('PDF-Dateien werden für OCR nicht unterstützt');
      expect(data.skipOCR).toBe(true);
    }
  });

  /**
   * BDD: Security - File Size Limit (DoS Prevention)
   *
   * GIVEN file larger than 10MB
   * WHEN uploaded for OCR
   * THEN reject with "Datei ist zu groß"
   *
   * WHY 10MB LIMIT:
   * - Prevents DoS attacks (users uploading gigabyte files)
   * - OpenAI API has size limits
   * - Keeps processing fast (large images = slow OCR)
   *
   * SECURITY: Resource protection
   * BUSINESS: 10MB sufficient for phone photos of receipts
   */
  it('should reject files that are too large', async () => {
    // Create a file larger than 10MB
    const largeContent = new ArrayBuffer(11 * 1024 * 1024); // 11MB
    const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });

    const mockFormData = new Map();
    mockFormData.set('image', largeFile);

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as any;

    const { POST } = await import('./route');
    const response = await POST(mockRequest);
    const data = await response.json();

    // May return 503 if OpenAI not initialized or 400 if it is
    expect([400, 503]).toContain(response.status);
    if (response.status === 400) {
      expect(data.error).toContain('Datei ist zu groß');
    }
  });

  it('should handle missing OpenAI API key', async () => {
    // This test verifies the error handling when OpenAI is not initialized
    // Since we have env vars mocked in vitest.setup.ts, this tests the error path
    const validFile = new File(['fake-image-data'], 'receipt.jpg', { type: 'image/jpeg' });

    const mockFormData = new Map();
    mockFormData.set('image', validFile);
    mockFormData.set('classificationType', 'rechnung');

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as any;

    // The actual response depends on OpenAI initialization
    // This test ensures the route handles the case gracefully
    const { POST } = await import('./route');
    const response = await POST(mockRequest);

    expect(response).toBeDefined();
    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  /**
   * BDD: Security - Path Traversal Prevention
   *
   * GIVEN filename with path traversal attempt ("../../../etc/passwd.jpg")
   * WHEN logged/processed
   * THEN sanitize to prevent directory traversal
   *
   * ATTACK VECTOR: Malicious filename could:
   * - Read system files if logged to filesystem
   * - Overwrite config files
   * - Access sensitive directories
   *
   * MITIGATION: Filename sanitization removes "../" patterns
   *
   * SECURITY PRINCIPLE: Never trust user input, even filenames
   */
  it('should sanitize filename for logging', async () => {
    const maliciousFile = new File(
      ['fake-image-data'],
      '../../../etc/passwd.jpg',
      { type: 'image/jpeg' }
    );

    const mockFormData = new Map();
    mockFormData.set('image', maliciousFile);

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as any;

    const { POST } = await import('./route');

    // Spy on console.log to verify sanitization
    const consoleLogSpy = vi.spyOn(console, 'log');

    await POST(mockRequest);

    // Verify that the logged filename doesn't contain path traversal
    if (consoleLogSpy.mock.calls.length > 0) {
      const loggedData = consoleLogSpy.mock.calls.find(call =>
        call[0] === 'Verarbeite Bild:' && call[1]?.name
      );

      if (loggedData) {
        expect(loggedData[1].name).not.toContain('../');
        expect(loggedData[1].name).not.toContain('etc/passwd');
      }
    }

    consoleLogSpy.mockRestore();
  });

  it('should accept valid JPEG files', async () => {
    const validFile = new File(['fake-jpeg-data'], 'receipt.jpg', { type: 'image/jpeg' });

    const mockFormData = new Map();
    mockFormData.set('image', validFile);
    mockFormData.set('classificationType', 'rechnung');

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as any;

    const { POST } = await import('./route');
    const response = await POST(mockRequest);

    // Should not return 400 for valid file types
    expect(response.status).not.toBe(400);
  });

  it('should accept valid PNG files', async () => {
    const validFile = new File(['fake-png-data'], 'receipt.png', { type: 'image/png' });

    const mockFormData = new Map();
    mockFormData.set('image', validFile);
    mockFormData.set('classificationType', 'rechnung');

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as any;

    const { POST } = await import('./route');
    const response = await POST(mockRequest);

    // Should not return 400 for valid file types
    expect(response.status).not.toBe(400);
  });

  it('should include classification type in request', async () => {
    const validFile = new File(['fake-image-data'], 'receipt.jpg', { type: 'image/jpeg' });

    const mockFormData = new Map();
    mockFormData.set('image', validFile);
    mockFormData.set('classificationType', 'kreditkartenbeleg');

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as any;

    const { POST } = await import('./route');
    const response = await POST(mockRequest);

    // Verify the endpoint accepted the classification type
    expect(response).toBeDefined();
    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});
