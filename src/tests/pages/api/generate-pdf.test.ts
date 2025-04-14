import { NextRequest } from 'next/server';
import { POST } from '@/app/api/generate-pdf/route';
import { generatePdf, PdfData } from '@/lib/pdfGenerator';
import formidable from 'formidable';

jest.mock('@/lib/pdfGenerator');

const mockFormidable = {
  parse: jest.fn(),
};

jest.mock('formidable', () => ({
  __esModule: true,
  default: jest.fn(() => mockFormidable),
}));

describe('/api/generate-pdf API Route', () => {
  const mockPdfData: PdfData = {
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormidable.parse.mockImplementation((req, callback) => {
      const testCase = (req as any).__testCase;
      let mockFields = {};
      let mockFiles = {};

      switch (testCase) {
        case 'missing_json':
          mockFields = {};
          mockFiles = {};
          break;
        case 'missing_receipt':
          mockFields = {
            jsonData: JSON.stringify(mockPdfData)
          };
          mockFiles = {};
          break;
        case 'valid_data':
        case 'pdf_generation':
          mockFields = {
            jsonData: JSON.stringify(mockPdfData)
          };
          mockFiles = {
            mainReceipt: [{ filepath: '/tmp/receipt.jpg' }]
          };
          break;
        case 'pdf_error':
          mockFields = {
            jsonData: JSON.stringify(mockPdfData)
          };
          mockFiles = {
            mainReceipt: [{ filepath: '/tmp/receipt.jpg' }]
          };
          break;
        default:
          mockFields = {};
          mockFiles = {};
      }

      callback(null, mockFields, mockFiles);
    });
  });

  test('sollte 405 zurückgeben für nicht-POST Requests', async () => {
    const req = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'GET',
      headers: {
        'content-type': 'application/json'
      }
    });
    
    const response = await POST(req);
    
    expect(response.status).toBe(405);
    const data = await response.json();
    expect(data).toEqual({
      error: 'Method GET Not Allowed'
    });
  });

  test('sollte 400 zurückgeben, wenn jsonData fehlt', async () => {
    const req = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data'
      },
      body: JSON.stringify({})
    });

    // @ts-ignore
    req.__testCase = 'missing_json';
    
    const response = await POST(req);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({
      error: 'Fehlende JSON-Daten',
      fields: {}
    });
  });

  test('sollte 400 zurückgeben, wenn Hauptbeleg fehlt', async () => {
    const req = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data'
      },
      body: JSON.stringify({ jsonData: mockPdfData })
    });

    // @ts-ignore
    req.__testCase = 'missing_receipt';
    
    const response = await POST(req);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({
      error: 'Hauptbeleg fehlt',
      files: {}
    });
  });

  test('sollte 200 mit PDF zurückgeben bei gültigen Daten', async () => {
    const mockPdfBuffer = Buffer.from('fake-pdf-content');
    (generatePdf as jest.Mock).mockResolvedValue(mockPdfBuffer);
    
    const req = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data'
      },
      body: JSON.stringify({ jsonData: mockPdfData })
    });

    // @ts-ignore
    req.__testCase = 'valid_data';
    
    const response = await POST(req);
    
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="bewirtungsbeleg.pdf"');
    const buffer = await response.arrayBuffer();
    expect(buffer).toBeTruthy();
  });

  test('sollte 500 zurückgeben, wenn generatePdf einen Fehler wirft', async () => {
    const req = new Request('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data'
      },
      body: JSON.stringify({ jsonData: mockPdfData })
    });

    // @ts-ignore
    req.__testCase = 'pdf_error';

    (generatePdf as jest.Mock).mockRejectedValue(new Error('PDF generation failed'));
    
    const response = await POST(req);
    
    expect(response.status).toBe(500);
  });
}); 