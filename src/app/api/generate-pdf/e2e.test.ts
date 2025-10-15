/**
 * End-to-end test for PDF generation with attachments
 * This test verifies the actual PDF generation works without mocking
 */

import { POST } from './route';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

describe('PDF Generation E2E Test', () => {
  it('CRITICAL: Must generate a valid PDF with image attachments', async () => {
    // Set test scenario
    if (typeof setTestScenario === 'function') {
      setTestScenario('single-attachment');
    }

    // Use real data that matches what the form sends
    const formData = {
      datum: '2025-06-04', // Date as string (as sent by form)
      restaurantName: 'Test Restaurant GmbH',
      restaurantAnschrift: 'Musterstraße 123, 12345 Berlin',
      teilnehmer: 'Christian Gabireli, Max Mustermann',
      anlass: 'Projektbesprechung Q4 2025',
      gesamtbetrag: '153,40',
      gesamtbetragMwst: '29,15',
      gesamtbetragNetto: '124,25',
      trinkgeld: '15,00',
      trinkgeldMwst: '2,85',
      kreditkartenBetrag: '168,40',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const,
      geschaeftlicherAnlass: 'Projektbesprechung Q4 2025',
      geschaeftspartnerNamen: 'Max Mustermann',
      geschaeftspartnerFirma: 'Example GmbH',
      istAuslaendischeRechnung: false,
      auslaendischeWaehrung: '',
      attachments: [
        {
          // Minimal valid JPEG (1x1 pixel red image)
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==',
          name: 'receipt.jpg',
          type: 'image/jpeg'
        }
      ]
    };

    const request = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    // Call the actual API endpoint
    const response = await POST(request);
    
    // Verify response is successful
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('bewirtungsbeleg-2025-06-04.pdf');
    
    // Get the PDF buffer
    const pdfBuffer = await response.arrayBuffer();
    expect(pdfBuffer.byteLength).toBeGreaterThan(1000); // Should have content
    
    // Verify it's a valid PDF by checking PDF header
    const pdfBytes = new Uint8Array(pdfBuffer);
    const header = String.fromCharCode(...pdfBytes.slice(0, 4));
    expect(header).toBe('%PDF');
    
    // Parse the PDF to verify it has pages and content
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();

      // Should have at least 2 pages (main + 1 attachment)
      expect(pages.length).toBeGreaterThanOrEqual(2);

      // First page should exist
      const firstPage = pages[0];
      expect(firstPage).toBeDefined();

      // Get page count
      const pageCount = pdfDoc.getPageCount();
      expect(pageCount).toBe(2); // 1 main page + 1 attachment page
    } catch (error) {
      expect(error).toBeUndefined(); // This will fail the test with a clear message
    }
  });

  it('Must handle multiple attachments including PDFs', async () => {
    // Set test scenario
    if (typeof setTestScenario === 'function') {
      setTestScenario('multiple-attachments');
    }

    const formData = {
      datum: new Date().toISOString().split('T')[0],
      restaurantName: 'Multi Attachment Test',
      teilnehmer: 'Test User',
      anlass: 'Test',
      gesamtbetrag: '100,00',
      zahlungsart: 'bar' as const,
      bewirtungsart: 'mitarbeiter' as const,
      attachments: [
        {
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==',
          name: 'image1.jpg',
          type: 'image/jpeg'
        },
        {
          data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          name: 'image2.png', 
          type: 'image/png'
        },
        {
          data: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzMgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Cj4+Ci9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCj4+CmVuZG9iagoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDEyNSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDQKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjIxNQolJUVPRgo=',
          name: 'document.pdf',
          type: 'application/pdf'
        }
      ]
    };

    const request = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    
    const pdfBuffer = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    // Should have 4 pages: 1 main + 3 attachments
    expect(pdfDoc.getPageCount()).toBe(4);
  });

  it('Must generate PDF without attachments (backward compatibility)', async () => {
    // Set test scenario
    if (typeof setTestScenario === 'function') {
      setTestScenario('no-attachments');
    }

    const formData = {
      datum: new Date().toISOString().split('T')[0],
      restaurantName: 'No Attachment Test',
      teilnehmer: 'Test User',
      anlass: 'Test Meeting',
      gesamtbetrag: '50,00',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const,
      geschaeftspartnerNamen: 'Partner Name',
      geschaeftspartnerFirma: 'Partner Company'
      // No attachments field
    };

    const request = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    
    const pdfBuffer = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    // Should have only 1 page (no attachments)
    expect(pdfDoc.getPageCount()).toBe(1);
  });

  it('Must validate required fields', async () => {
    const invalidData = {
      // Missing required fields
      datum: new Date().toISOString().split('T')[0]
    };

    const request = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    
    const errorData = await response.json();
    expect(errorData.error).toBe('Ungültige Eingabe');
    expect(errorData.details).toBeDefined();
  });
});