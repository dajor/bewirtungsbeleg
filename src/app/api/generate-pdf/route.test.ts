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

  test('should return 405 for non-POST methods', async () => {
    const req = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(req);
    expect(response.status).toBe(405);
    const data = await response.json();
    expect(data.error).toBe('Method GET Not Allowed');
  });

  test('should return 400 for missing JSON data', async () => {
    const req = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Fehlende JSON-Daten');
    expect(data.fields).toBeDefined();
  });

  test('should return 400 for missing bewirtungsart', async () => {
    const req = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jsonData: { ...mockPdfData, bewirtungsart: undefined } })
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Hauptbeleg fehlt');
    expect(data.files).toBeDefined();
  });

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

  test('should return 500 for invalid PDF template', async () => {
    const req = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jsonData: { ...mockPdfData, bewirtungsart: 'invalid' } })
    });

    const response = await POST(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('PDF-Vorlage nicht gefunden');
  });

  test('should return 500 for invalid form fields', async () => {
    const req = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jsonData: { ...mockPdfData, bewirtungsart: 'kunden', invalidField: 'test' } })
    });

    const response = await POST(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Fehler beim Ausfüllen des Formulars');
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