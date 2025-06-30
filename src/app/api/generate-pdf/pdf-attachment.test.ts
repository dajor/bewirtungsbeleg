import { POST } from './route';
import { generatePdfSchema } from '@/lib/validation';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('jspdf');
jest.mock('pdf-lib');
jest.mock('image-size');

describe('PDF Generation - Attachment Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Image Attachment Tests', () => {
    it('should successfully add image attachments to PDF', async () => {
      const mockFs = await import('fs');
      const mockJsPDF = await import('jspdf');
      const mockImageSize = await import('image-size');
      
      // Mock file system operations
      (mockFs.readFileSync as any).mockReturnValue(Buffer.from('fake-logo'));
      
      // Mock image-size to return valid dimensions
      (mockImageSize.default as any).mockReturnValue({
        width: 800,
        height: 600,
        type: 'jpg'
      });
      
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
        internal: { getNumberOfPages: jest.fn().mockReturnValue(2) }
      };
      (mockJsPDF.jsPDF as any).mockImplementation(() => mockDoc);

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
        trinkgeldMwst: '1,90',
        kreditkartenBetrag: '110,00',
        zahlungsart: 'firma' as const,
        bewirtungsart: 'kunden' as const,
        geschaeftlicherAnlass: 'Project Discussion',
        geschaeftspartnerNamen: 'Partner Names',
        geschaeftspartnerFirma: 'Partner Company',
        istAuslaendischeRechnung: false,
        auslaendischeWaehrung: '',
        attachments: [
          {
            data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
            name: 'receipt.jpg',
            type: 'image/jpeg'
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
      
      // Verify addPage was called for attachment
      expect(mockDoc.addPage).toHaveBeenCalled();
      
      // Verify attachment header was added
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Anlage 1:'),
        expect.any(Number),
        expect.any(Number)
      );
      
      // Verify image was added with correct parameters
      expect(mockDoc.addImage).toHaveBeenCalledWith(
        expect.stringContaining('data:image/jpeg;base64,'),
        'JPEG',
        expect.any(Number), // x position
        expect.any(Number), // y position
        expect.any(Number), // width
        expect.any(Number), // height
        undefined,
        'FAST'
      );
    });

    it('should handle multiple attachments including PDFs', async () => {
      const mockFs = await import('fs');
      const mockJsPDF = await import('jspdf');
      const mockImageSize = await import('image-size');
      
      (mockFs.readFileSync as any).mockReturnValue(Buffer.from('fake-logo'));
      (mockImageSize.default as any).mockReturnValue({ width: 800, height: 600, type: 'jpg' });
      
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
        internal: { getNumberOfPages: jest.fn().mockReturnValue(3) }
      };
      (mockJsPDF.jsPDF as any).mockImplementation(() => mockDoc);

      const formData = {
        datum: new Date('2025-06-04'),
        restaurantName: 'Test Restaurant',
        teilnehmer: 'Test',
        anlass: 'Test',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma' as const,
        bewirtungsart: 'kunden' as const,
        attachments: [
          {
            data: 'data:image/jpeg;base64,/9j/4AAQ...',
            name: 'receipt1.jpg',
            type: 'image/jpeg'
          },
          {
            data: 'data:application/pdf;base64,JVBERi0x...',
            name: 'invoice.pdf',
            type: 'application/pdf'
          }
        ]
      };

      const request = new Request('http://localhost/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      // Should add 2 pages for 2 attachments
      expect(mockDoc.addPage).toHaveBeenCalledTimes(2);
      
      // Should add image only for JPEG, not for PDF
      expect(mockDoc.addImage).toHaveBeenCalledTimes(1);
      
      // Should show placeholder text for PDF
      expect(mockDoc.text).toHaveBeenCalledWith(
        'PDF-Anhang',
        expect.any(Number),
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should handle legacy single image field', async () => {
      const mockFs = await import('fs');
      const mockJsPDF = await import('jspdf');
      const mockImageSize = await import('image-size');
      
      (mockFs.readFileSync as any).mockReturnValue(Buffer.from('fake-logo'));
      (mockImageSize.default as any).mockReturnValue({ width: 800, height: 600, type: 'jpg' });
      
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
        datum: new Date('2025-06-04'),
        restaurantName: 'Test Restaurant',
        teilnehmer: 'Test',
        anlass: 'Test',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma' as const,
        bewirtungsart: 'kunden' as const,
        // Using legacy image field instead of attachments array
        image: 'data:image/jpeg;base64,/9j/4AAQ...'
      };

      const request = new Request('http://localhost/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      // Should still add attachment page
      expect(mockDoc.addPage).toHaveBeenCalled();
      expect(mockDoc.addImage).toHaveBeenCalled();
    });

    it('should handle attachment errors gracefully', async () => {
      const mockFs = await import('fs');
      const mockJsPDF = await import('jspdf');
      const mockImageSize = await import('image-size');
      
      (mockFs.readFileSync as any).mockReturnValue(Buffer.from('fake-logo'));
      
      // Mock image-size to throw error
      (mockImageSize.default as any).mockImplementation(() => {
        throw new Error('Invalid image format');
      });
      
      const mockDoc = {
        addImage: jest.fn().mockImplementation(() => {
          throw new Error('Failed to add image');
        }),
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
        datum: new Date('2025-06-04'),
        restaurantName: 'Test Restaurant',
        teilnehmer: 'Test',
        anlass: 'Test',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma' as const,
        bewirtungsart: 'kunden' as const,
        attachments: [{
          data: 'data:image/jpeg;base64,INVALID_DATA',
          name: 'receipt.jpg',
          type: 'image/jpeg'
        }]
      };

      const request = new Request('http://localhost/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const response = await POST(request);
      
      // Should still generate PDF even if attachment fails
      expect(response.status).toBe(200);
      
      // Should show error message
      expect(mockDoc.text).toHaveBeenCalledWith(
        'Fehler beim Hinzufügen des Anhangs',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should correctly scale large images to fit A4 page', async () => {
      const mockFs = await import('fs');
      const mockJsPDF = await import('jspdf');
      const mockImageSize = await import('image-size');
      
      (mockFs.readFileSync as any).mockReturnValue(Buffer.from('fake-logo'));
      
      // Mock a very large image
      (mockImageSize.default as any).mockReturnValue({
        width: 4000,
        height: 3000,
        type: 'jpg'
      });
      
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
        datum: new Date('2025-06-04'),
        restaurantName: 'Test Restaurant',
        teilnehmer: 'Test',
        anlass: 'Test',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma' as const,
        bewirtungsart: 'kunden' as const,
        attachments: [{
          data: 'data:image/jpeg;base64,/9j/4AAQ...',
          name: 'large-receipt.jpg',
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
      
      // Check that image was added with scaled dimensions
      const addImageCall = mockDoc.addImage.mock.calls[0];
      const width = addImageCall[4];
      const height = addImageCall[5];
      
      // Width should be scaled down to fit within maxWidth (170mm)
      expect(width).toBeLessThanOrEqual(170);
      // Height should be scaled proportionally
      expect(height).toBeLessThanOrEqual(250);
      // Aspect ratio should be maintained
      expect(width / height).toBeCloseTo(4000 / 3000, 1);
    });
  });

  describe('Form Data to PDF Attachment Flow', () => {
    it('should validate the complete attachment flow from form to PDF', () => {
      // This test validates that the form data structure for attachments
      // matches what the PDF generation expects
      const formAttachments = [
        {
          data: 'data:image/jpeg;base64,/9j/4AAQ...',
          name: 'receipt.jpg',
          type: 'image/jpeg'
        },
        {
          data: 'data:application/pdf;base64,JVBERi0x...',
          name: 'invoice.pdf', 
          type: 'application/pdf'
        }
      ];

      const formData = {
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'Test',
        anlass: 'Test',
        gesamtbetrag: '10,00',
        zahlungsart: 'firma' as const,
        bewirtungsart: 'kunden' as const,
        attachments: formAttachments
      };

      // Validate against schema
      const result = generatePdfSchema.parse(formData);
      expect(result.attachments).toEqual(formAttachments);
      expect(result.attachments).toHaveLength(2);
    });
  });
});