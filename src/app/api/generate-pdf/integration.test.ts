import { POST } from './route';
import { NextResponse } from 'next/server';

// Mock Next.js dependencies
jest.mock('fs');
jest.mock('jspdf');
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => new Response(JSON.stringify(data), {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }
    }))
  }
}));

describe('PDF Generation Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('CRITICAL: should generate PDF with image attachments successfully', async () => {
    const mockFs = await import('fs');
    const mockJsPDF = await import('jspdf');
    
    // Mock file system for logo
    (mockFs.readFileSync as any).mockReturnValue(Buffer.from('fake-logo'));
    
    // Mock jsPDF
    const mockAddImage = jest.fn();
    const mockDoc = {
      addImage: mockAddImage,
      setFontSize: jest.fn(),
      setFont: jest.fn(),
      text: jest.fn(),
      setLineWidth: jest.fn(),
      line: jest.fn(),
      addPage: jest.fn(),
      setPage: jest.fn(),
      output: jest.fn().mockReturnValue(new ArrayBuffer(1000)),
      internal: { getNumberOfPages: jest.fn().mockReturnValue(2) }
    };
    (mockJsPDF.jsPDF as any).mockImplementation(() => mockDoc);

    // Real form data with attachments
    const formData = {
      datum: new Date('2025-06-04'),
      restaurantName: 'Test Restaurant',
      restaurantAnschrift: 'Test Address',
      teilnehmer: 'Test Participants',
      anlass: 'Business Meeting',
      gesamtbetrag: '100,00',
      gesamtbetragMwst: '19,00',
      gesamtbetragNetto: '81,00',
      trinkgeld: '10,00',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const,
      geschaeftlicherAnlass: 'Project Discussion',
      geschaeftspartnerNamen: 'John Doe',
      geschaeftspartnerFirma: 'ACME Corp',
      attachments: [
        {
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/',
          name: 'receipt.jpg',
          type: 'image/jpeg'
        },
        {
          data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          name: 'logo.png',
          type: 'image/png'
        }
      ]
    };

    const request = new Request('http://localhost/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const response = await POST(request);
    
    // Check response
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('bewirtungsbeleg-2025-06-04.pdf');
    
    // Verify PDF generation steps
    expect(mockDoc.addPage).toHaveBeenCalledTimes(2); // 2 attachments
    
    // Verify images were added with correct format
    expect(mockAddImage).toHaveBeenCalledWith(
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/',
      'JPEG',
      20, 30, 170, 200,
      undefined,
      'FAST'
    );
    
    expect(mockAddImage).toHaveBeenCalledWith(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'PNG',
      20, 30, 170, 200,
      undefined,
      'FAST'
    );
  });

  it('should handle PDF attachments with placeholder', async () => {
    const mockFs = await import('fs');
    const mockJsPDF = await import('jspdf');
    
    (mockFs.readFileSync as any).mockReturnValue(Buffer.from('fake-logo'));
    
    const mockDoc = {
      addImage: jest.fn(),
      setFontSize: jest.fn(),
      setFont: jest.fn(),
      text: jest.fn(),
      setLineWidth: jest.fn(),
      line: jest.fn(),
      addPage: jest.fn(),
      setPage: jest.fn(),
      output: jest.fn().mockReturnValue(new ArrayBuffer(1000)),
      internal: { getNumberOfPages: jest.fn().mockReturnValue(2) }
    };
    (mockJsPDF.jsPDF as any).mockImplementation(() => mockDoc);

    const formData = {
      datum: new Date(),
      restaurantName: 'Test',
      teilnehmer: 'Test',
      anlass: 'Test',
      gesamtbetrag: '10,00',
      zahlungsart: 'bar' as const,
      bewirtungsart: 'mitarbeiter' as const,
      attachments: [{
        data: 'data:application/pdf;base64,JVBERi0x',
        name: 'invoice.pdf',
        type: 'application/pdf'
      }]
    };

    const request = new Request('http://localhost/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    
    // Should not try to add PDF as image
    expect(mockDoc.addImage).not.toHaveBeenCalled();
    
    // Should show placeholder text
    expect(mockDoc.text).toHaveBeenCalledWith('PDF-Anhang', 105, 150, expect.any(Object));
  });

  it('should handle missing attachments gracefully', async () => {
    const mockFs = await import('fs');
    const mockJsPDF = await import('jspdf');
    
    (mockFs.readFileSync as any).mockReturnValue(Buffer.from('fake-logo'));
    
    const mockDoc = {
      addImage: jest.fn(),
      setFontSize: jest.fn(),
      setFont: jest.fn(),
      text: jest.fn(),
      setLineWidth: jest.fn(),
      line: jest.fn(),
      addPage: jest.fn(),
      setPage: jest.fn(),
      output: jest.fn().mockReturnValue(new ArrayBuffer(1000)),
      internal: { getNumberOfPages: jest.fn().mockReturnValue(1) }
    };
    (mockJsPDF.jsPDF as any).mockImplementation(() => mockDoc);

    const formData = {
      datum: new Date(),
      restaurantName: 'Test',
      teilnehmer: 'Test',
      anlass: 'Test',
      gesamtbetrag: '10,00',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const
      // No attachments
    };

    const request = new Request('http://localhost/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    
    // Should not add any attachment pages
    expect(mockDoc.addPage).not.toHaveBeenCalled();
  });

  it('should handle image addition errors gracefully', async () => {
    const mockFs = await import('fs');
    const mockJsPDF = await import('jspdf');
    
    (mockFs.readFileSync as any).mockReturnValue(Buffer.from('fake-logo'));
    
    const mockAddImage = jest.fn()
      .mockImplementationOnce(() => { throw new Error('Invalid image'); })
      .mockImplementationOnce(() => { /* Success on retry */ });
    
    const mockDoc = {
      addImage: mockAddImage,
      setFontSize: jest.fn(),
      setFont: jest.fn(),
      text: jest.fn(),
      setLineWidth: jest.fn(),
      line: jest.fn(),
      addPage: jest.fn(),
      setPage: jest.fn(),
      output: jest.fn().mockReturnValue(new ArrayBuffer(1000)),
      internal: { getNumberOfPages: jest.fn().mockReturnValue(2) }
    };
    (mockJsPDF.jsPDF as any).mockImplementation(() => mockDoc);

    const formData = {
      datum: new Date(),
      restaurantName: 'Test',
      teilnehmer: 'Test',
      anlass: 'Test',
      gesamtbetrag: '10,00',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const,
      attachments: [{
        data: 'data:image/jpeg;base64,INVALID',
        name: 'bad.jpg',
        type: 'image/jpeg'
      }]
    };

    const request = new Request('http://localhost/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    
    // Should try fallback method
    expect(mockAddImage).toHaveBeenCalledTimes(2);
  });
});