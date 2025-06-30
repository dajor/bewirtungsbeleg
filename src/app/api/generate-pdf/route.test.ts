import { POST } from './route';
import { generatePdfSchema } from '@/lib/validation';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('jspdf');
jest.mock('pdf-lib');
jest.mock('image-size');

describe('PDF Generation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Schema', () => {
    it('should validate complete form data from BewirtungsbelegForm', () => {
      // This represents the actual data sent from the form
      const formData = {
        datum: new Date('2025-06-04'),
        restaurantName: 'Engel Restauromiebetriebe GmbH',
        restaurantAnschrift: 'Musterstraße 123, 12345 Berlin',
        teilnehmer: 'Christian Gabireli',
        anlass: 'Projektbesprechung',
        gesamtbetrag: '53,40',
        gesamtbetragMwst: '10,15',
        gesamtbetragNetto: '43,25',
        trinkgeld: '6,60',
        trinkgeldMwst: '1,25',
        kreditkartenBetrag: '60,00',
        zahlungsart: 'bar' as const,
        bewirtungsart: 'mitarbeiter' as const,
        geschaeftlicherAnlass: 'Team Meeting',
        geschaeftspartnerNamen: 'Max Mustermann',
        geschaeftspartnerFirma: 'Musterfirma GmbH',
        istAuslaendischeRechnung: false,
        auslaendischeWaehrung: '',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
        attachments: [
          {
            data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
            name: 'receipt.jpg',
            type: 'image/jpeg'
          },
          {
            data: 'data:application/pdf;base64,JVBERi0xLj...',
            name: 'invoice.pdf',
            type: 'application/pdf'
          }
        ]
      };

      // This should not throw
      const result = generatePdfSchema.parse(formData);
      expect(result).toBeDefined();
      expect(result.restaurantName).toBe('Engel Restauromiebetriebe GmbH');
      expect(result.bewirtungsart).toBe('mitarbeiter');
      expect(result.attachments).toHaveLength(2);
    });

    it('should validate minimal required fields', () => {
      const minimalData = {
        datum: new Date(),
        restaurantName: 'Test Restaurant',
        teilnehmer: 'Test Person',
        anlass: 'Test Anlass',
        gesamtbetrag: '10,00',
        zahlungsart: 'firma' as const,
        bewirtungsart: 'kunden' as const
      };

      const result = generatePdfSchema.parse(minimalData);
      expect(result).toBeDefined();
    });

    it('should reject invalid German decimal format', () => {
      const invalidData = {
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'Test',
        anlass: 'Test',
        gesamtbetrag: '10.00', // Should be comma, not dot
        zahlungsart: 'firma' as const,
        bewirtungsart: 'kunden' as const
      };

      expect(() => generatePdfSchema.parse(invalidData)).toThrow();
    });

    it('should accept foreign currency receipts', () => {
      const foreignData = {
        datum: new Date(),
        restaurantName: 'US Restaurant',
        teilnehmer: 'John Doe',
        anlass: 'Business Meeting',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma' as const,
        bewirtungsart: 'kunden' as const,
        istAuslaendischeRechnung: true,
        auslaendischeWaehrung: 'USD'
      };

      const result = generatePdfSchema.parse(foreignData);
      expect(result.istAuslaendischeRechnung).toBe(true);
      expect(result.auslaendischeWaehrung).toBe('USD');
    });

    it('should handle customer entertainment specific fields', () => {
      const customerData = {
        datum: new Date(),
        restaurantName: 'Restaurant',
        teilnehmer: 'All participants',
        anlass: 'Customer Meeting',
        gesamtbetrag: '200,00',
        zahlungsart: 'firma' as const,
        bewirtungsart: 'kunden' as const,
        geschaeftspartnerNamen: 'Partner Names',
        geschaeftspartnerFirma: 'Partner Company'
      };

      const result = generatePdfSchema.parse(customerData);
      expect(result.geschaeftspartnerNamen).toBe('Partner Names');
      expect(result.geschaeftspartnerFirma).toBe('Partner Company');
    });
  });

  describe('API Endpoint', () => {
    it('should return 400 for invalid data', async () => {
      const invalidRequest = new Request('http://localhost/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required fields
          restaurantName: 'Test'
        })
      });

      const response = await POST(invalidRequest);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Ungültige Eingabe');
      expect(data.details).toBeDefined();
    });

    it('should handle date string conversion', async () => {
      const mockFs = await import('fs');
      const mockJsPDF = await import('jspdf');
      
      // Mock file system operations
      (mockFs.readFileSync as any).mockReturnValue(Buffer.from('fake-logo'));
      
      // Mock jsPDF
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

      const request = new Request('http://localhost/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datum: '2025-06-04', // String date should be converted
          restaurantName: 'Test Restaurant',
          teilnehmer: 'Test Person',
          anlass: 'Test',
          gesamtbetrag: '10,00',
          zahlungsart: 'firma',
          bewirtungsart: 'kunden'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
    });
  });
});

describe('Form to API Data Transformation', () => {
  it('should match the data structure sent by BewirtungsbelegForm', () => {
    // This test ensures the form data structure matches what the API expects
    const formValues = {
      datum: new Date('2025-06-04'),
      restaurantName: 'Test Restaurant',
      restaurantAnschrift: 'Test Address',
      teilnehmer: 'Participants',
      anlass: 'Meeting',
      gesamtbetrag: '100,00',
      gesamtbetragMwst: '19,00',
      gesamtbetragNetto: '81,00',
      trinkgeld: '10,00',
      trinkgeldMwst: '1,90',
      kreditkartenBetrag: '110,00',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const,
      geschaeftlicherAnlass: 'Business Meeting',
      geschaeftspartnerNamen: 'Partners',
      geschaeftspartnerFirma: 'Company',
      istAuslaendischeRechnung: false,
      auslaendischeWaehrung: ''
    };

    // Convert to API format (as done in BewirtungsbelegForm)
    const apiData = {
      ...formValues,
      datum: formValues.datum.toISOString().split('T')[0],
      anlass: formValues.geschaeftlicherAnlass || formValues.anlass,
      attachments: [
        {
          data: 'data:image/jpeg;base64,test',
          name: 'test.jpg',
          type: 'image/jpeg'
        }
      ]
    };

    // This should validate successfully
    const result = generatePdfSchema.parse(apiData);
    expect(result).toBeDefined();
    expect(result.anlass).toBe('Business Meeting');
  });
});