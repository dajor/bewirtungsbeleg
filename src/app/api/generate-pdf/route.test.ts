import { POST } from '@/app/api/generate-pdf/route';
import { generatePdf } from '@/lib/pdfGenerator';
import fs from 'fs/promises';
import path from 'path';

describe('PDF Generation API Tests', () => {
  const mockPdfData = {
    bewirtungsart: 'kunden',
    datum: '2024-03-20',
    restaurantName: 'Test Restaurant',
    teilnehmer: 'Max Mustermann',
    gesamtbetrag: '100',
    trinkgeld: '10',
    kreditkartenBetrag: '110',
    geschaeftspartnerNamen: 'Max Mustermann',
    geschaeftspartnerFirma: 'Test GmbH'
  };

  test('should use kundenbewirtung.pdf for kunden bewirtungsart', async () => {
    console.log('Test started: should use kundenbewirtung.pdf for kunden bewirtungsart');
    
    const req = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jsonData: { ...mockPdfData, bewirtungsart: 'kunden' } })
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
  });

  test('should use mitarbeiterbewirtung.pdf for mitarbeiter bewirtungsart', async () => {
    console.log('Test started: should use mitarbeiterbewirtung.pdf for mitarbeiter bewirtungsart');
    
    const req = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jsonData: { ...mockPdfData, bewirtungsart: 'mitarbeiter' } })
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
  });

  test('should add an image as a new page', async () => {
    console.log('Test started: should add an image as a new page');
    
    const imageBuffer = Buffer.from('fake-image-data');
    const req = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonData: mockPdfData,
        imageData: imageBuffer.toString('base64')
      })
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
  });
});