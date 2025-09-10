/**
 * Test for Eigenbeleg-specific validation scenarios
 * Specifically tests the fix for "image: Expected string, received null" error
 */

import { generatePdfSchema, bewirtungsbelegSchema } from './validation';

describe('Eigenbeleg Validation Fix', () => {
  const validEigenbelegData = {
    datum: new Date('2025-07-07'),
    restaurantName: 'OSTERIA DEL PARCO',
    restaurantAnschrift: 'Anzinger St 1 85586 Poing',
    teilnehmer: 'Daniel Jordan, Sehrish Abhul',
    anlass: 'Mitarbeiterbesprechung',
    gesamtbetrag: '37,00',
    zahlungsart: 'firma' as const,
    bewirtungsart: 'mitarbeiter' as const,
    istEigenbeleg: true,
    geschaeftlicherAnlass: 'Mitarbeiterbesprechung',
  };

  describe('bewirtungsbelegSchema', () => {
    test('should accept Eigenbeleg data with undefined image', () => {
      const dataWithUndefinedImage = {
        ...validEigenbelegData,
        image: undefined,
      };

      const result = bewirtungsbelegSchema.safeParse(dataWithUndefinedImage);
      expect(result.success).toBe(true);
    });

    test('should accept Eigenbeleg data with null image', () => {
      const dataWithNullImage = {
        ...validEigenbelegData,
        image: null,
      };

      const result = bewirtungsbelegSchema.safeParse(dataWithNullImage);
      expect(result.success).toBe(true);
    });

    test('should accept Eigenbeleg data with string image', () => {
      const dataWithStringImage = {
        ...validEigenbelegData,
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
      };

      const result = bewirtungsbelegSchema.safeParse(dataWithStringImage);
      expect(result.success).toBe(true);
    });

    test('should accept Eigenbeleg data without image field', () => {
      const dataWithoutImage = {
        ...validEigenbelegData,
      };
      
      // Don't add image field at all
      const result = bewirtungsbelegSchema.safeParse(dataWithoutImage);
      expect(result.success).toBe(true);
    });
  });

  describe('generatePdfSchema', () => {
    test('should accept PDF generation data with undefined image', () => {
      const dataWithUndefinedImage = {
        ...validEigenbelegData,
        image: undefined,
      };

      const result = generatePdfSchema.safeParse(dataWithUndefinedImage);
      expect(result.success).toBe(true);
    });

    test('should accept PDF generation data with null image', () => {
      const dataWithNullImage = {
        ...validEigenbelegData,
        image: null,
      };

      const result = generatePdfSchema.safeParse(dataWithNullImage);
      expect(result.success).toBe(true);
    });

    test('should reject invalid image types', () => {
      const dataWithInvalidImage = {
        ...validEigenbelegData,
        image: 12345, // number instead of string/null/undefined
      };

      const result = generatePdfSchema.safeParse(dataWithInvalidImage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('image'))).toBe(true);
      }
    });

    test('should handle the exact failing case from user report', () => {
      // This simulates the exact scenario that was failing
      const userReportData = {
        datum: new Date('2025-07-07'),
        restaurantName: 'OSTERIA DEL PARCO',
        restaurantAnschrift: 'Anzinger St 1 85586 Poing',
        teilnehmer: 'Daniel Jordan, Sehrish Abhul',
        anlass: 'Mitarbeiterbesprechung',
        gesamtbetrag: '37,00',
        gesamtbetragMwst: '7,03',
        gesamtbetragNetto: '29,97',
        zahlungsart: 'firma' as const,
        bewirtungsart: 'mitarbeiter' as const,
        istEigenbeleg: true,
        geschaeftlicherAnlass: 'Mitarbeiterbesprechung',
        // This was the problematic field - originally would be null
        image: null,
        attachments: [], // Empty attachments array
      };

      const result = generatePdfSchema.safeParse(userReportData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.image).toBe(null);
        expect(result.data.istEigenbeleg).toBe(true);
        expect(result.data.restaurantName).toBe('OSTERIA DEL PARCO');
      }
    });
  });
});