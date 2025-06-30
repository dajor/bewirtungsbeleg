import { POST } from './route';

// Mock dependencies
jest.mock('fs');
jest.mock('jspdf');
jest.mock('next/server', () => ({
  NextResponse: class {
    constructor(body: any, init: any) {
      return new Response(body, init);
    }
    static json(data: any, init: any) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }
      });
    }
  }
}));

describe('PDF Attachment Rendering Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('CRITICAL: Must successfully render image attachments in PDF', async () => {
    const mockFs = await import('fs');
    const mockJsPDF = await import('jspdf');
    
    // Mock file system for logo
    (mockFs.readFileSync as any).mockReturnValue(Buffer.from('fake-logo'));
    
    // Track if addImage was called successfully
    const addImageCalls: any[] = [];
    
    // Mock jsPDF with proper image handling
    const mockDoc = {
      addImage: jest.fn((data, x, y, width, height) => {
        // Simulate successful image addition
        addImageCalls.push({ data, x, y, width, height });
        console.log('Mock addImage called with:', { x, y, width, height });
      }),
      setFontSize: jest.fn(),
      setFont: jest.fn(),
      text: jest.fn(),
      setLineWidth: jest.fn(),
      line: jest.fn(),
      addPage: jest.fn(),
      setPage: jest.fn(),
      output: jest.fn().mockReturnValue(new ArrayBuffer(10000)), // Larger size indicates content
      internal: { getNumberOfPages: jest.fn().mockReturnValue(3) } // 1 main + 2 attachments
    };
    
    (mockJsPDF.jsPDF as any).mockImplementation(() => mockDoc);

    // Test data with real base64 images
    const formData = {
      datum: new Date('2025-06-04'),
      restaurantName: 'Test Restaurant',
      restaurantAnschrift: 'Test Address 123',
      teilnehmer: 'John Doe, Jane Smith',
      anlass: 'Business Meeting',
      gesamtbetrag: '150,00',
      gesamtbetragMwst: '28,50',
      gesamtbetragNetto: '121,50',
      trinkgeld: '15,00',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const,
      geschaeftlicherAnlass: 'Q4 Planning Meeting',
      geschaeftspartnerNamen: 'Max Mustermann',
      geschaeftspartnerFirma: 'Example GmbH',
      attachments: [
        {
          // Small valid JPEG
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCmAA8A/9k=',
          name: 'receipt.jpg',
          type: 'image/jpeg'
        },
        {
          // Small valid PNG (1x1 red pixel)
          data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
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
    
    // Verify successful response
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    
    // CRITICAL: Verify that addPage was called for each attachment
    expect(mockDoc.addPage).toHaveBeenCalledTimes(2);
    
    // CRITICAL: Verify that addImage was called for each image attachment
    expect(mockDoc.addImage).toHaveBeenCalledTimes(2);
    expect(addImageCalls).toHaveLength(2);
    
    // Verify first image was added with correct parameters
    expect(addImageCalls[0]).toEqual({
      data: formData.attachments[0].data,
      x: 20,
      y: 30,
      width: 170,
      height: 200
    });
    
    // Verify second image was added
    expect(addImageCalls[1]).toEqual({
      data: formData.attachments[1].data,
      x: 20,
      y: 30,
      width: 170,
      height: 200
    });
    
    // Verify no error text was added (which would indicate failure)
    const errorTextCalls = mockDoc.text.mock.calls.filter(
      call => call[0] === 'Fehler beim Hinzufügen des Anhangs'
    );
    expect(errorTextCalls).toHaveLength(0);
  });

  it('Must show error message when image cannot be added', async () => {
    const mockFs = await import('fs');
    const mockJsPDF = await import('jspdf');
    
    (mockFs.readFileSync as any).mockReturnValue(Buffer.from('fake-logo'));
    
    const mockDoc = {
      addImage: jest.fn(() => {
        throw new Error('Invalid image data');
      }),
      setFontSize: jest.fn(),
      setFont: jest.fn(),
      text: jest.fn(),
      setLineWidth: jest.fn(),
      line: jest.fn(),
      addPage: jest.fn(),
      setPage: jest.fn(),
      output: jest.fn().mockReturnValue(new ArrayBuffer(5000)),
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
        data: 'data:image/jpeg;base64,INVALID_BASE64',
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
    
    // Should still generate PDF
    expect(response.status).toBe(200);
    
    // Should show error text
    const errorTextCalls = mockDoc.text.mock.calls.filter(
      call => call[0] === 'Fehler beim Hinzufügen des Anhangs'
    );
    expect(errorTextCalls).toHaveLength(1);
  });

  it('Must validate attachment data format', async () => {
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
      output: jest.fn().mockReturnValue(new ArrayBuffer(5000)),
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
        data: 'not-a-data-uri', // Invalid format
        name: 'invalid.jpg',
        type: 'image/jpeg'
      }]
    };

    const request = new Request('http://localhost/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const response = await POST(request);
    
    // Should still generate PDF
    expect(response.status).toBe(200);
    
    // Should not call addImage with invalid data
    expect(mockDoc.addImage).not.toHaveBeenCalled();
    
    // Should show error text
    expect(mockDoc.text).toHaveBeenCalledWith(
      'Fehler beim Hinzufügen des Anhangs',
      20,
      30
    );
  });
});