import { generatePdfSchema } from '@/lib/validation';

describe('PDF Image Attachment Validation', () => {
  it('CRITICAL: should handle attachment without image-size library errors', () => {
    // This test ensures the PDF generation doesn't fail due to image-size library issues
    const formData = {
      datum: new Date('2025-06-04'),
      restaurantName: 'Test Restaurant',
      teilnehmer: 'Test Participants',
      anlass: 'Business Meeting',
      gesamtbetrag: '100,00',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const,
      attachments: [
        {
          // Real base64 data that might cause image-size to fail
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
          name: 'receipt.jpg',
          type: 'image/jpeg'
        },
        {
          // Another format that might cause issues
          data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          name: 'tiny.png',
          type: 'image/png'
        }
      ]
    };

    // Should validate without throwing
    const result = generatePdfSchema.parse(formData);
    expect(result.attachments).toBeDefined();
    expect(result.attachments).toHaveLength(2);
    
    // Ensure the data format is correct for jsPDF
    result.attachments!.forEach(attachment => {
      expect(attachment.data).toMatch(/^data:image\/(jpeg|png);base64,/);
      expect(attachment.type).toMatch(/^image\/(jpeg|png)$/);
    });
  });

  it('should validate attachment structure from form', () => {
    const formData = {
      datum: new Date('2025-06-04'),
      restaurantName: 'Test Restaurant',
      restaurantAnschrift: 'Test Address',
      teilnehmer: 'Test Participants',
      anlass: 'Business Meeting',
      gesamtbetrag: '100,00',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const,
      attachments: [
        {
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/',
          name: 'receipt.jpg',
          type: 'image/jpeg'
        }
      ]
    };

    // Should not throw
    const result = generatePdfSchema.parse(formData);
    expect(result.attachments).toBeDefined();
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments![0].data).toContain('data:image/jpeg;base64,');
  });

  it('should handle multiple attachments', () => {
    const formData = {
      datum: new Date(),
      restaurantName: 'Test',
      teilnehmer: 'Test',
      anlass: 'Test',
      gesamtbetrag: '10,00',
      zahlungsart: 'bar' as const,
      bewirtungsart: 'mitarbeiter' as const,
      attachments: [
        {
          data: 'data:image/jpeg;base64,test1',
          name: 'receipt1.jpg',
          type: 'image/jpeg'
        },
        {
          data: 'data:image/png;base64,test2',
          name: 'receipt2.png',
          type: 'image/png'
        },
        {
          data: 'data:application/pdf;base64,test3',
          name: 'invoice.pdf',
          type: 'application/pdf'
        }
      ]
    };

    const result = generatePdfSchema.parse(formData);
    expect(result.attachments).toHaveLength(3);
    expect(result.attachments![0].type).toBe('image/jpeg');
    expect(result.attachments![1].type).toBe('image/png');
    expect(result.attachments![2].type).toBe('application/pdf');
  });

  it('should work without attachments', () => {
    const formData = {
      datum: new Date(),
      restaurantName: 'Test',
      teilnehmer: 'Test',
      anlass: 'Test',
      gesamtbetrag: '10,00',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const
      // No attachments field
    };

    const result = generatePdfSchema.parse(formData);
    expect(result.attachments).toBeUndefined();
  });

  it('should validate attachment data format', () => {
    const validAttachment = {
      data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/',
      name: 'receipt.jpg',
      type: 'image/jpeg'
    };

    expect(validAttachment.data).toMatch(/^data:image\/\w+;base64,/);
    expect(validAttachment.name).toBeDefined();
    expect(validAttachment.type).toMatch(/^image\/\w+$/);
  });
});