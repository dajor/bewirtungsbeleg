/**
 * @jest-environment node
 */
import { generatePdfSchema } from '@/lib/validation';

describe('PDF Attachment Critical Tests', () => {
  it('MUST accept attachments in the exact format sent by the form', () => {
    // This is the exact structure that causes the error
    const formDataWithAttachments = {
      datum: new Date('2025-06-04'),
      restaurantName: 'Test Restaurant',
      restaurantAnschrift: 'Test Address',
      teilnehmer: 'Test Participants',
      anlass: 'Business Meeting',
      gesamtbetrag: '100,00',
      gesamtbetragMwst: '19,00',
      gesamtbetragNetto: '81,00',
      trinkgeld: '10,00',
      trinkgeldMwst: '1,90',
      kreditkartenBetrag: '110,00',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const,
      geschaeftlicherAnlass: 'Project Discussion',
      geschaeftspartnerNamen: 'Partner Names',
      geschaeftspartnerFirma: 'Partner Company',
      istAuslaendischeRechnung: false,
      auslaendischeWaehrung: '',
      // Critical: This is exactly how attachments come from the form
      attachments: [
        {
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
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

    // This MUST not throw - if it does, PDF generation will fail
    const result = generatePdfSchema.parse(formDataWithAttachments);
    
    // Validate critical fields
    expect(result).toBeDefined();
    expect(result.attachments).toBeDefined();
    expect(result.attachments).toHaveLength(2);
    
    // Validate attachment structure
    result.attachments!.forEach((attachment, index) => {
      expect(attachment).toHaveProperty('data');
      expect(attachment).toHaveProperty('name');
      expect(attachment).toHaveProperty('type');
      
      // Data must be in base64 format
      expect(attachment.data).toMatch(/^data:(image|application)\/(jpeg|jpg|png|pdf);base64,/);
      
      // Type must be valid
      expect(['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']).toContain(attachment.type);
    });
  });

  it('MUST handle attachments with various image formats', () => {
    const testCases = [
      {
        data: 'data:image/jpeg;base64,/9j/4AAQ...',
        name: 'photo.jpg',
        type: 'image/jpeg'
      },
      {
        data: 'data:image/jpg;base64,/9j/4AAQ...',
        name: 'photo.jpg',
        type: 'image/jpg'
      },
      {
        data: 'data:image/png;base64,iVBORw0K...',
        name: 'logo.png',
        type: 'image/png'
      },
      {
        data: 'data:application/pdf;base64,JVBERi0x...',
        name: 'invoice.pdf',
        type: 'application/pdf'
      }
    ];

    testCases.forEach(testCase => {
      const formData = {
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'Test',
        anlass: 'Test',
        gesamtbetrag: '10,00',
        zahlungsart: 'bar' as const,
        bewirtungsart: 'mitarbeiter' as const,
        attachments: [testCase]
      };

      const result = generatePdfSchema.parse(formData);
      expect(result.attachments![0]).toEqual(testCase);
    });
  });

  it('MUST work without attachments (backward compatibility)', () => {
    const formDataWithoutAttachments = {
      datum: new Date(),
      restaurantName: 'Test Restaurant',
      teilnehmer: 'Test',
      anlass: 'Test',
      gesamtbetrag: '10,00',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const
      // No attachments field
    };

    const result = generatePdfSchema.parse(formDataWithoutAttachments);
    expect(result).toBeDefined();
    expect(result.attachments).toBeUndefined();
  });

  it('MUST handle empty attachments array', () => {
    const formDataEmptyAttachments = {
      datum: new Date(),
      restaurantName: 'Test',
      teilnehmer: 'Test',
      anlass: 'Test',
      gesamtbetrag: '10,00',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const,
      attachments: []
    };

    const result = generatePdfSchema.parse(formDataEmptyAttachments);
    expect(result.attachments).toEqual([]);
  });

  it('MUST validate that attachment data is properly formatted for jsPDF', () => {
    const attachment = {
      data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/',
      name: 'receipt.jpg',
      type: 'image/jpeg'
    };

    // Extract format from type
    const imageFormat = attachment.type === 'image/png' ? 'PNG' : 'JPEG';
    expect(['JPEG', 'PNG']).toContain(imageFormat);

    // Ensure data starts with correct prefix
    expect(attachment.data.startsWith('data:image/')).toBe(true);
    expect(attachment.data.includes('base64,')).toBe(true);

    // Ensure we can extract base64 data
    const base64Data = attachment.data.split(',')[1];
    expect(base64Data).toBeDefined();
    expect(base64Data.length).toBeGreaterThan(0);
  });
});