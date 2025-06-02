/**
 * @jest-environment node
 */

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

// Mock image-size module
jest.mock('image-size', () => jest.fn(() => ({ width: 800, height: 600 })));

// Mock pdf-lib
jest.mock('pdf-lib', () => ({
  PDFDocument: {
    load: jest.fn().mockResolvedValue({
      getPages: jest.fn().mockReturnValue([{
        getSize: jest.fn().mockReturnValue({ width: 595, height: 842 }),
        drawText: jest.fn()
      }]),
      save: jest.fn().mockResolvedValue(Buffer.from('mock-pdf'))
    })
  }
}));

// Mock jsPDF
const mockAddImage = jest.fn();
const mockText = jest.fn();
const mockSetFontSize = jest.fn();
const mockSetFont = jest.fn();
const mockSetLineWidth = jest.fn();
const mockLine = jest.fn();
const mockAddPage = jest.fn();
const mockSetPage = jest.fn();
const mockOutput = jest.fn();

jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    addImage: mockAddImage,
    text: mockText,
    setFontSize: mockSetFontSize,
    setFont: mockSetFont,
    setLineWidth: mockSetLineWidth,
    line: mockLine,
    addPage: mockAddPage,
    setPage: mockSetPage,
    output: mockOutput,
    internal: {
      getNumberOfPages: jest.fn().mockReturnValue(1)
    }
  }));
});

describe('POST /api/generate-pdf', () => {
  const fs = require('fs');
  
  // Mock NextResponse
  jest.doMock('next/server', () => {
    const NextResponse = jest.fn((body, init) => ({
      body,
      headers: init?.headers || {},
      status: init?.status || 200,
      json: async () => body
    }));
    
    NextResponse.json = jest.fn((data, init) => ({
      body: JSON.stringify(data),
      headers: init?.headers || {},
      status: init?.status || 200,
      json: async () => data
    }));
    
    return { NextResponse };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    fs.readFileSync.mockImplementation((path: string) => {
      if (path.includes('.pdf')) {
        return Buffer.from('mock-pdf-data');
      }
      return Buffer.from('mock-logo-data');
    });
    mockOutput.mockReturnValue(new ArrayBuffer(1000));
  });

  afterEach(() => {
    jest.resetModules();
  });

  const createMockRequest = (data: any) => ({
    json: jest.fn().mockResolvedValue(data)
  } as any);

  const mockKundenbewirtungData = {
    bewirtungsart: 'kunden',
    datum: '2024-01-15',
    restaurantName: 'Restaurant Zur Post',
    restaurantAnschrift: 'Hauptstraße 123, 10115 Berlin',
    teilnehmer: 'Max Mustermann, Erika Musterfrau',
    anlass: 'Geschäftsessen Projektbesprechung',
    gesamtbetrag: '89.50',
    gesamtbetragMwst: '14.27',
    gesamtbetragNetto: '75.23',
    kreditkartenBetrag: '100.00',
    trinkgeld: '10.50',
    trinkgeldMwst: '1.68',
    zahlungsart: 'firma',
    geschaeftspartnerNamen: 'Max Mustermann, Erika Musterfrau',
    geschaeftspartnerFirma: 'ABC GmbH',
    istAuslaendischeRechnung: false
  };

  const mockMitarbeiterbewirtungData = {
    bewirtungsart: 'mitarbeiter',
    datum: '2024-01-15',
    restaurantName: 'Kantine Firma',
    restaurantAnschrift: 'Firmenstraße 1, 10115 Berlin',
    teilnehmer: 'Team IT',
    anlass: 'Team Meeting Q1',
    gesamtbetrag: '45.80',
    gesamtbetragMwst: '7.31',
    gesamtbetragNetto: '38.49',
    kreditkartenBetrag: '45.80',
    trinkgeld: '0.00',
    trinkgeldMwst: '0.00',
    zahlungsart: 'firma',
    istAuslaendischeRechnung: false
  };

  it('should successfully generate a PDF for Kundenbewirtung', async () => {
    const { POST } = await import('./route');
    
    const request = createMockRequest(mockKundenbewirtungData);
    const response = await POST(request);

    // Verify PDF generation
    expect(mockSetFontSize).toHaveBeenCalled();
    expect(mockText).toHaveBeenCalledWith('Bewirtungsbeleg', 105, 20, { align: 'center' });
    expect(mockText).toHaveBeenCalledWith('Kundenbewirtung (70% abzugsfähig)', 105, 30, { align: 'center' });
    
    // Verify content - check that the calls were made
    const textCalls = mockText.mock.calls;
    const datumCall = textCalls.find(call => call[0].includes('Datum:'));
    const restaurantCall = textCalls.find(call => call[0].includes('Restaurant:'));
    const anschriftCall = textCalls.find(call => call[0].includes('Anschrift:'));
    
    expect(datumCall).toBeTruthy();
    expect(datumCall[0]).toContain('15.1.2024'); // Date is formatted without leading zero
    expect(restaurantCall).toBeTruthy();
    expect(restaurantCall[0]).toContain('Restaurant Zur Post');
    expect(anschriftCall).toBeTruthy();
    expect(anschriftCall[0]).toContain('Hauptstraße 123, 10115 Berlin');
    
    // Verify Geschäftspartner section (only for Kundenbewirtung)
    expect(mockText).toHaveBeenCalledWith('Geschäftspartner:', 20, expect.any(Number));
    expect(mockText).toHaveBeenCalledWith('Namen: Max Mustermann, Erika Musterfrau', 20, expect.any(Number));
    expect(mockText).toHaveBeenCalledWith('Firma: ABC GmbH', 20, expect.any(Number));
    
    // Verify response
    expect(response.headers['Content-Type']).toBe('application/pdf');
    expect(response.headers['Content-Disposition']).toContain('bewirtungsbeleg-2024-01-15.pdf');
  });

  it('should successfully generate a PDF for Mitarbeiterbewirtung', async () => {
    const { POST } = await import('./route');
    
    const request = createMockRequest(mockMitarbeiterbewirtungData);
    const response = await POST(request);

    // Verify specific text for Mitarbeiterbewirtung
    expect(mockText).toHaveBeenCalledWith('Mitarbeiterbewirtung (100% abzugsfähig)', 105, 30, { align: 'center' });
    expect(mockText).toHaveBeenCalledWith('Anlass:', 20, expect.any(Number));
    
    // Verify Geschäftspartner section is NOT included
    expect(mockText).not.toHaveBeenCalledWith('Geschäftspartner:', 20, expect.any(Number));
    
    expect(response.headers['Content-Type']).toBe('application/pdf');
  });

  it('should handle foreign currency receipts', async () => {
    const { POST } = await import('./route');
    
    const foreignData = {
      ...mockKundenbewirtungData,
      istAuslaendischeRechnung: true,
      auslaendischeWaehrung: 'USD',
      gesamtbetrag: '100.00',
      trinkgeld: '15.00',
      kreditkartenBetrag: '125.00'
    };
    
    const request = createMockRequest(foreignData);
    const response = await POST(request);

    // Verify foreign currency formatting
    expect(mockText).toHaveBeenCalledWith('Gesamtbetrag (Brutto): 100.00USD', 20, expect.any(Number));
    expect(mockText).toHaveBeenCalledWith('Trinkgeld: 15.00USD', 20, expect.any(Number));
    expect(mockText).toHaveBeenCalledWith('Betrag auf Kreditkarte: 125.00€', 20, expect.any(Number));
    expect(mockText).toHaveBeenCalledWith('Währung: USD', 20, expect.any(Number));
    
    expect(response.headers['Content-Type']).toBe('application/pdf');
  });

  it('should add receipt image as attachment when provided', async () => {
    const { POST } = await import('./route');
    
    const dataWithImage = {
      ...mockKundenbewirtungData,
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
    };
    
    const request = createMockRequest(dataWithImage);
    const response = await POST(request);

    // Verify image attachment
    expect(mockAddPage).toHaveBeenCalled();
    expect(mockText).toHaveBeenCalledWith('Anlage: Original-Rechnung', 20, 20);
    expect(mockAddImage).toHaveBeenCalledWith(
      dataWithImage.image,
      'JPEG',
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      undefined,
      'FAST'
    );
    
    expect(response.headers['Content-Type']).toBe('application/pdf');
  });

  it('should handle logo loading errors gracefully', async () => {
    const { POST } = await import('./route');
    
    // Mock fs to throw error when reading logo
    fs.readFileSync.mockImplementation((path: string) => {
      if (path.includes('LOGO-192.png')) {
        throw new Error('Logo file not found');
      }
      return Buffer.from('mock-data');
    });
    
    const request = createMockRequest(mockKundenbewirtungData);
    const response = await POST(request);

    // PDF should still be generated even without logo
    expect(response.headers['Content-Type']).toBe('application/pdf');
    expect(mockText).toHaveBeenCalledWith('Bewirtungsbeleg', 105, 20, { align: 'center' });
  });

  it('should handle PDF generation errors', async () => {
    const { POST } = await import('./route');
    
    // Mock output to throw error
    mockOutput.mockImplementation(() => {
      throw new Error('PDF generation failed');
    });
    
    const request = createMockRequest(mockKundenbewirtungData);
    const response = await POST(request);

    // Check error response
    const responseData = await response.json();
    expect(responseData.error).toContain('Fehler bei der PDF-Generierung: PDF generation failed');
    expect(response.status).toBe(500);
  });

  it('should handle different payment methods correctly', async () => {
    const { POST } = await import('./route');
    
    const paymentMethods = [
      { zahlungsart: 'firma', expected: 'Zahlungsart: Firmenkreditkarte' },
      { zahlungsart: 'privat', expected: 'Zahlungsart: Private Kreditkarte' },
      { zahlungsart: 'bar', expected: 'Zahlungsart: Bar' }
    ];

    for (const { zahlungsart, expected } of paymentMethods) {
      jest.clearAllMocks();
      
      const data = { ...mockKundenbewirtungData, zahlungsart };
      const request = createMockRequest(data);
      await POST(request);
      
      expect(mockText).toHaveBeenCalledWith(expected, 20, expect.any(Number));
    }
  });

  it('should add footer to all pages', async () => {
    const { POST } = await import('./route');
    
    const request = createMockRequest(mockKundenbewirtungData);
    await POST(request);

    // Verify footer elements
    expect(mockSetPage).toHaveBeenCalledWith(1);
    expect(mockLine).toHaveBeenCalledWith(20, 280, 190, 280);
    expect(mockText).toHaveBeenCalledWith('Bewirtungsbeleg App', 105, 285, { align: 'center' });
    expect(mockText).toHaveBeenCalledWith('https://bewirtungsbeleg.docbits.com/', 105, 290, { align: 'center' });
  });

  it('should handle missing optional fields gracefully', async () => {
    const { POST } = await import('./route');
    
    const minimalData = {
      bewirtungsart: 'kunden',
      datum: '2024-01-15',
      restaurantName: 'Test Restaurant',
      teilnehmer: 'Test Person',
      gesamtbetrag: '50.00',
      gesamtbetragMwst: '8.00',
      gesamtbetragNetto: '42.00',
      kreditkartenBetrag: '50.00',
      trinkgeld: '0.00',
      trinkgeldMwst: '0.00',
      zahlungsart: 'bar',
      geschaeftspartnerNamen: 'Test Partner',
      geschaeftspartnerFirma: 'Test Firma',
      istAuslaendischeRechnung: false
    };
    
    const request = createMockRequest(minimalData);
    const response = await POST(request);

    expect(response.headers['Content-Type']).toBe('application/pdf');
    expect(mockText).toHaveBeenCalledWith('Anlass: Projektbesprechung', 20, expect.any(Number));
  });
});