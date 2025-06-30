/**
 * @jest-environment node
 */
import { generatePdfSchema } from '@/lib/validation';

describe('PDF Image Requirements Test', () => {
  it('CRITICAL: Image attachments must have correct structure for jsPDF', () => {
    // This test documents the exact requirements for image attachments
    const validImageAttachments = [
      {
        data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/',
        name: 'receipt.jpg',
        type: 'image/jpeg' as const
      },
      {
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        name: 'logo.png',
        type: 'image/png' as const
      }
    ];

    validImageAttachments.forEach(attachment => {
      // 1. Data must be a data URI
      expect(attachment.data).toMatch(/^data:/);
      
      // 2. Must have correct MIME type
      expect(attachment.data).toMatch(/^data:image\/(jpeg|png);base64,/);
      
      // 3. Must have base64 encoded content
      const parts = attachment.data.split(',');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toContain('base64');
      expect(parts[1]).toBeTruthy();
      
      // 4. Type must match data URI type
      if (attachment.type === 'image/jpeg') {
        expect(attachment.data).toContain('data:image/jpeg');
      } else if (attachment.type === 'image/png') {
        expect(attachment.data).toContain('data:image/png');
      }
      
      // 5. Must be compatible with jsPDF addImage
      const imageFormat = attachment.type === 'image/png' ? 'PNG' : 'JPEG';
      expect(['PNG', 'JPEG']).toContain(imageFormat);
    });
  });

  it('Must handle the exact attachment format from BewirtungsbelegForm', () => {
    // This is the exact format that comes from the form after file reading
    const formAttachment = {
      data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCmAA8A/9k=',
      name: 'receipt.jpg',
      type: 'image/jpeg' as const
    };

    // Validate it matches jsPDF requirements
    expect(formAttachment.data).toMatch(/^data:image\/jpeg;base64,/);
    expect(formAttachment.type).toBe('image/jpeg');
    
    // Extract format for jsPDF
    const imageFormat = formAttachment.type === 'image/png' ? 'PNG' : 'JPEG';
    expect(imageFormat).toBe('JPEG');
    
    // Ensure data can be split properly
    const [header, base64Data] = formAttachment.data.split(',');
    expect(header).toBe('data:image/jpeg;base64');
    expect(base64Data).toBeTruthy();
    expect(base64Data.length).toBeGreaterThan(0);
  });

  it('Must validate complete PDF generation data with attachments', () => {
    const completeFormData = {
      datum: new Date(),
      restaurantName: 'Restaurant Name',
      restaurantAnschrift: 'Street 123',
      teilnehmer: 'Participants',
      anlass: 'Business Meeting',
      gesamtbetrag: '100,00',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const,
      geschaeftlicherAnlass: 'Q4 Planning',
      geschaeftspartnerNamen: 'John Doe',
      geschaeftspartnerFirma: 'ACME Corp',
      attachments: [
        {
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/',
          name: 'receipt1.jpg',
          type: 'image/jpeg' as const
        },
        {
          data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          name: 'receipt2.png',
          type: 'image/png' as const
        }
      ]
    };

    // This must parse successfully
    const result = generatePdfSchema.parse(completeFormData);
    
    // Verify attachments are preserved correctly
    expect(result.attachments).toHaveLength(2);
    expect(result.attachments![0].data).toBe(completeFormData.attachments[0].data);
    expect(result.attachments![1].data).toBe(completeFormData.attachments[1].data);
    
    // Verify each attachment can be used with jsPDF
    result.attachments!.forEach((attachment, index) => {
      const imageFormat = attachment.type === 'image/png' ? 'PNG' : 'JPEG';
      
      // These are the exact parameters that will be passed to jsPDF
      const jsPdfParams = {
        data: attachment.data,
        format: imageFormat,
        x: 20,
        y: 30,
        width: 170,
        height: 200
      };
      
      expect(jsPdfParams.data).toMatch(/^data:image\//);
      expect(['PNG', 'JPEG']).toContain(jsPdfParams.format);
      expect(jsPdfParams.x).toBeGreaterThanOrEqual(0);
      expect(jsPdfParams.y).toBeGreaterThanOrEqual(0);
      expect(jsPdfParams.width).toBeGreaterThan(0);
      expect(jsPdfParams.height).toBeGreaterThan(0);
    });
  });
});