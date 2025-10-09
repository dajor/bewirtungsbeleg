/**
 * Unit tests for BewirtungsbelegForm field validation
 * Tests input validation, German format handling, and edge cases
 *
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';
import { bewirtungsbelegSchema } from '@/lib/validation';
import { parseGermanDecimal, formatGermanDecimal } from '@/lib/validation';

describe('Bewirtungsbeleg Form - Field Validation', () => {

  describe('German Decimal Format Validation', () => {
    it('should accept valid German decimal format (29,90)', () => {
      const result = bewirtungsbelegSchema.shape.gesamtbetrag.safeParse('29,90');
      expect(result.success).toBe(true);
    });

    it('should accept German decimal with no decimals (100)', () => {
      const result = bewirtungsbelegSchema.shape.gesamtbetrag.safeParse('100');
      expect(result.success).toBe(true);
    });

    it('should accept German decimal with one decimal (29,9)', () => {
      const result = bewirtungsbelegSchema.shape.gesamtbetrag.safeParse('29,9');
      expect(result.success).toBe(true);
    });

    it('should reject more than 2 decimal places (29,999)', () => {
      const result = bewirtungsbelegSchema.shape.gesamtbetrag.safeParse('29,999');
      expect(result.success).toBe(false);
    });

    it('should reject dot as decimal separator (29.90)', () => {
      const result = bewirtungsbelegSchema.shape.gesamtbetrag.safeParse('29.90');
      expect(result.success).toBe(false);
    });

    it('should reject negative values (-29,90)', () => {
      const result = bewirtungsbelegSchema.shape.gesamtbetrag.safeParse('-29,90');
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric input (abc)', () => {
      const result = bewirtungsbelegSchema.shape.gesamtbetrag.safeParse('abc');
      expect(result.success).toBe(false);
    });

    it('should reject empty string for required field', () => {
      const result = bewirtungsbelegSchema.shape.gesamtbetrag.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should accept empty string for optional fields', () => {
      const result = bewirtungsbelegSchema.shape.gesamtbetragMwst.safeParse('');
      expect(result.success).toBe(true);
    });
  });

  describe('German Decimal Parsing', () => {
    it('should parse German decimal to number (29,90 → 29.90)', () => {
      const result = parseGermanDecimal('29,90');
      expect(result).toBe(29.90);
    });

    it('should parse integer to number (100 → 100)', () => {
      const result = parseGermanDecimal('100');
      expect(result).toBe(100);
    });

    it('should parse one decimal place (29,9 → 29.9)', () => {
      const result = parseGermanDecimal('29,9');
      expect(result).toBe(29.9);
    });

    it('should handle large numbers (1234,56 → 1234.56)', () => {
      const result = parseGermanDecimal('1234,56');
      expect(result).toBe(1234.56);
    });
  });

  describe('German Decimal Formatting', () => {
    it('should format number to German decimal (29.90 → 29,90)', () => {
      const result = formatGermanDecimal(29.90);
      expect(result).toBe('29,90');
    });

    it('should format integer with decimal places (100 → 100,00)', () => {
      const result = formatGermanDecimal(100);
      expect(result).toBe('100,00');
    });

    it('should format one decimal place (29.9 → 29,90)', () => {
      const result = formatGermanDecimal(29.9);
      expect(result).toBe('29,90');
    });

    it('should round to 2 decimal places (29.999 → 30,00)', () => {
      const result = formatGermanDecimal(29.999);
      expect(result).toBe('30,00');
    });
  });

  describe('Required Fields Validation', () => {
    it('should require datum', () => {
      const result = bewirtungsbelegSchema.safeParse({
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
        // datum missing
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('datum'))).toBe(true);
      }
    });

    it('should require restaurantName', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
        // restaurantName missing
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('restaurantName'))).toBe(true);
      }
    });

    it('should require teilnehmer', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
        // teilnehmer missing
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('teilnehmer'))).toBe(true);
      }
    });

    it('should require anlass', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
        // anlass missing
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('anlass'))).toBe(true);
      }
    });

    it('should require gesamtbetrag', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
        // gesamtbetrag missing
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('gesamtbetrag'))).toBe(true);
      }
    });

    it('should require zahlungsart', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        bewirtungsart: 'kunden',
        // zahlungsart missing
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('zahlungsart'))).toBe(true);
      }
    });

    it('should require bewirtungsart', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        // bewirtungsart missing
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('bewirtungsart'))).toBe(true);
      }
    });

    it('should accept valid complete form', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Restaurant Mythos',
        restaurantAnschrift: 'Seifensiedergasse 4, 85570 Markt Schwaben',
        teilnehmer: 'John Doe, Jane Smith',
        anlass: 'Business meeting',
        gesamtbetrag: '29,90',
        gesamtbetragMwst: '4,77',
        gesamtbetragNetto: '25,13',
        trinkgeld: '5,10',
        kreditkartenBetrag: '35,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Optional Fields Validation', () => {
    it('should allow empty MwSt field', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        gesamtbetragMwst: '', // Empty optional field
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(true);
    });

    it('should allow empty Netto field', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        gesamtbetragNetto: '', // Empty optional field
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(true);
    });

    it('should allow empty Trinkgeld field', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        trinkgeld: '', // Empty optional field
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(true);
    });

    it('should allow empty Kreditkartenbetrag field', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        kreditkartenBetrag: '', // Empty optional field
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(true);
    });

    it('should allow missing restaurantAnschrift', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
        // restaurantAnschrift optional
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Enum Field Validation', () => {
    it('should accept valid zahlungsart values (firma, privat, bar)', () => {
      ['firma', 'privat', 'bar'].forEach(zahlungsart => {
        const result = bewirtungsbelegSchema.safeParse({
          datum: new Date(),
          restaurantName: 'Test',
          teilnehmer: 'John Doe',
          anlass: 'Business meeting',
          gesamtbetrag: '100,00',
          zahlungsart,
          bewirtungsart: 'kunden',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid zahlungsart', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        zahlungsart: 'invalid',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid bewirtungsart values (kunden, mitarbeiter)', () => {
      ['kunden', 'mitarbeiter'].forEach(bewirtungsart => {
        const result = bewirtungsbelegSchema.safeParse({
          datum: new Date(),
          restaurantName: 'Test',
          teilnehmer: 'John Doe',
          anlass: 'Business meeting',
          gesamtbetrag: '100,00',
          zahlungsart: 'firma',
          bewirtungsart,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid bewirtungsart', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        bewirtungsart: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Field Length Validation', () => {
    it('should accept restaurantName up to 200 characters', () => {
      const longName = 'A'.repeat(200);
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: longName,
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(true);
    });

    it('should reject restaurantName over 200 characters', () => {
      const tooLongName = 'A'.repeat(201);
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: tooLongName,
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(false);
    });

    it('should accept teilnehmer up to 1000 characters', () => {
      const longTeilnehmer = 'A'.repeat(1000);
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: longTeilnehmer,
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(true);
    });

    it('should reject teilnehmer over 1000 characters', () => {
      const tooLongTeilnehmer = 'A'.repeat(1001);
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: tooLongTeilnehmer,
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(false);
    });

    it('should accept anlass up to 500 characters', () => {
      const longAnlass = 'A'.repeat(500);
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: longAnlass,
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(true);
    });

    it('should reject anlass over 500 characters', () => {
      const tooLongAnlass = 'A'.repeat(501);
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: tooLongAnlass,
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Date Validation', () => {
    it('should accept valid Date object', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date('2025-09-29'),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid date (string)', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: '29.09.2025', // String instead of Date object
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(false);
    });

    it('should reject null date', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: null,
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values (0,00)', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '0,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(true);
    });

    it('should handle very large numbers (9999999999,99)', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '9999999999,99',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(true);
    });

    it('should reject number exceeding max length (11 digits)', () => {
      const result = bewirtungsbelegSchema.shape.gesamtbetrag.safeParse('99999999999,99');
      expect(result.success).toBe(false);
    });

    it('should handle minimum valid value (0,01)', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'John Doe',
        anlass: 'Business meeting',
        gesamtbetrag: '0,01',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      expect(result.success).toBe(true);
    });

    it('should handle special characters in text fields (sanitization)', () => {
      const result = bewirtungsbelegSchema.safeParse({
        datum: new Date(),
        restaurantName: 'Test & Restaurant <script>',
        teilnehmer: 'John O\'Doe',
        anlass: 'Business "meeting"',
        gesamtbetrag: '100,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
      });
      // Schema should accept, but sanitization should remove dangerous chars
      expect(result.success).toBe(true);
    });

    it('should accept leading zeros in gesamtbetrag (regex allows it)', () => {
      // Note: Current regex accepts leading zeros like 0029,90
      // This is acceptable as users can enter it and it parses correctly to 29.90
      const result = bewirtungsbelegSchema.shape.gesamtbetrag.safeParse('0029,90');
      expect(result.success).toBe(true);
    });

    it('should reject spaces in gesamtbetrag', () => {
      const result = bewirtungsbelegSchema.shape.gesamtbetrag.safeParse('29 ,90');
      expect(result.success).toBe(false);
    });
  });

  describe('OCR Response Validation', () => {
    it('should validate OCR response with all fields', () => {
      const { extractReceiptResponseSchema } = require('@/lib/validation');
      const result = extractReceiptResponseSchema.safeParse({
        restaurantName: 'Restaurant Mythos',
        restaurantAnschrift: 'Seifensiedergasse 4, 85570 Markt Schwaben',
        gesamtbetrag: '29,90',
        mwst: '4,77',
        netto: '25,13',
        datum: '29.09.2025',
        trinkgeld: '5,10',
        kreditkartenbetrag: '35,00',
      });
      expect(result.success).toBe(true);
    });

    it('should validate OCR response with missing optional fields', () => {
      const { extractReceiptResponseSchema } = require('@/lib/validation');
      const result = extractReceiptResponseSchema.safeParse({
        restaurantName: 'Test Restaurant',
        gesamtbetrag: '50,00',
        // Other fields missing
      });
      expect(result.success).toBe(true);
    });

    it('should validate empty OCR response', () => {
      const { extractReceiptResponseSchema } = require('@/lib/validation');
      const result = extractReceiptResponseSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
