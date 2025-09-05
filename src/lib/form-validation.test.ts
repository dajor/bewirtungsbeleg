/**
 * Unit Test 3: Form validation for conditional fields
 * Tests business rules for Kundenbewirtung vs Mitarbeiterbewirtung
 */

import { z } from 'zod';
import { bewirtungsbelegSchema, sanitizeInput, sanitizeObject, parseGermanDecimal } from './validation';

describe('Form Validation for Conditional Fields', () => {
  describe('Required fields based on bewirtungsart', () => {
    const baseValidData = {
      datum: new Date('2025-08-06'),
      restaurantName: 'Restaurant Test',
      restaurantAnschrift: 'Teststraße 123, 12345 Berlin',
      teilnehmer: 'Max Mustermann, Erika Mustermann',
      anlass: 'Geschäftsessen',
      gesamtbetrag: '119,00',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const,
    };

    describe('Kundenbewirtung (Customer Entertainment)', () => {
      it('should validate correctly with all customer fields', () => {
        const customerData = {
          ...baseValidData,
          bewirtungsart: 'kunden' as const,
          geschaeftspartnerNamen: 'Herr Schmidt, Frau Müller',
          geschaeftspartnerFirma: 'ABC GmbH',
          geschaeftlicherAnlass: 'Vertragsverhandlung für Projekt XYZ'
        };

        const result = bewirtungsbelegSchema.safeParse(customerData);
        expect(result.success).toBe(true);
      });

      it('should accept Kundenbewirtung without optional business partner fields', () => {
        const customerData = {
          ...baseValidData,
          bewirtungsart: 'kunden' as const,
        };

        const result = bewirtungsbelegSchema.safeParse(customerData);
        expect(result.success).toBe(true);
      });

      it('should validate business partner field lengths', () => {
        const customerData = {
          ...baseValidData,
          bewirtungsart: 'kunden' as const,
          geschaeftspartnerNamen: 'A'.repeat(501), // Exceeds max length
          geschaeftspartnerFirma: 'B'.repeat(501), // Exceeds max length
        };

        const result = bewirtungsbelegSchema.safeParse(customerData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(issue => 
            issue.path.includes('geschaeftspartnerNamen')
          )).toBe(true);
          expect(result.error.issues.some(issue => 
            issue.path.includes('geschaeftspartnerFirma')
          )).toBe(true);
        }
      });
    });

    describe('Mitarbeiterbewirtung (Employee Entertainment)', () => {
      it('should validate employee entertainment without business partner fields', () => {
        const employeeData = {
          ...baseValidData,
          bewirtungsart: 'mitarbeiter' as const,
        };

        const result = bewirtungsbelegSchema.safeParse(employeeData);
        expect(result.success).toBe(true);
      });

      it('should accept but not require business partner fields for employees', () => {
        const employeeData = {
          ...baseValidData,
          bewirtungsart: 'mitarbeiter' as const,
          geschaeftspartnerNamen: 'Ignored for employees',
          geschaeftspartnerFirma: 'Also ignored',
        };

        const result = bewirtungsbelegSchema.safeParse(employeeData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Conditional validation for receipt types', () => {
    const baseData = {
      datum: new Date('2025-08-06'),
      restaurantName: 'Restaurant Test',
      teilnehmer: 'Test Teilnehmer',
      anlass: 'Test Anlass',
      gesamtbetrag: '100,00',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const,
    };

    it('should validate Rechnung (invoice) type', () => {
      const data = {
        ...baseData,
        receiptType: 'rechnung' as const,
        gesamtbetragMwst: '19,00',
        gesamtbetragNetto: '81,00',
      };

      const result = bewirtungsbelegSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate Kreditkartenbeleg (credit card receipt)', () => {
      const data = {
        ...baseData,
        receiptType: 'kundenbeleg' as const,
        kreditkartenBetrag: '100,00',
      };

      const result = bewirtungsbelegSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate combined receipt types', () => {
      const data = {
        ...baseData,
        receiptType: 'rechnung' as const,
        kreditkartenBetrag: '100,00', // Both invoice and credit card amount
        attachments: [
          { data: 'base64data1', name: 'rechnung.pdf', type: 'application/pdf' },
          { data: 'base64data2', name: 'kreditbeleg.pdf', type: 'application/pdf' }
        ]
      };

      const result = bewirtungsbelegSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Foreign currency conditional fields', () => {
    const baseData = {
      datum: new Date('2025-08-06'),
      restaurantName: 'Restaurant International',
      teilnehmer: 'Test Person',
      anlass: 'International Meeting',
      gesamtbetrag: '100,00',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const,
    };

    it('should validate foreign receipt with currency fields', () => {
      const foreignData = {
        ...baseData,
        istAuslaendischeRechnung: true,
        auslaendischeWaehrung: 'USD',
        fremdwaehrung: 'USD',
        wechselkurs: '1,08',
      };

      const result = bewirtungsbelegSchema.safeParse(foreignData);
      expect(result.success).toBe(true);
    });

    it('should validate domestic receipt without currency fields', () => {
      const domesticData = {
        ...baseData,
        istAuslaendischeRechnung: false,
      };

      const result = bewirtungsbelegSchema.safeParse(domesticData);
      expect(result.success).toBe(true);
    });

    it('should accept foreign receipt without optional currency details', () => {
      const foreignData = {
        ...baseData,
        istAuslaendischeRechnung: true,
        // Currency fields are optional even for foreign receipts
      };

      const result = bewirtungsbelegSchema.safeParse(foreignData);
      expect(result.success).toBe(true);
    });

    it('should validate exchange rate format', () => {
      const foreignData = {
        ...baseData,
        istAuslaendischeRechnung: true,
        wechselkurs: '1.08', // Wrong format (dot instead of comma)
      };

      const result = bewirtungsbelegSchema.safeParse(foreignData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('wechselkurs') && 
          issue.message.includes('deutsche Zahlenformat')
        )).toBe(true);
      }
    });
  });

  describe('German decimal format validation', () => {
    const baseData = {
      datum: new Date('2025-08-06'),
      restaurantName: 'Test Restaurant',
      teilnehmer: 'Test',
      anlass: 'Test',
      zahlungsart: 'firma' as const,
      bewirtungsart: 'kunden' as const,
    };

    it('should accept valid German decimal formats', () => {
      const validFormats = ['100,00', '1,99', '0,01', '9999,99', '100', '0'];
      
      validFormats.forEach(format => {
        const data = { ...baseData, gesamtbetrag: format };
        const result = bewirtungsbelegSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid German decimal formats', () => {
      const invalidFormats = [
        '100.00',     // Dot instead of comma
        '100,000',    // Three decimal places
        '100,',       // Missing decimal digits
        ',50',        // Missing integer part - Note: might be valid depending on requirements
        '100,00,00',  // Multiple commas
        'abc',        // Non-numeric
      ];
      
      invalidFormats.forEach(format => {
        const data = { ...baseData, gesamtbetrag: format };
        const result = bewirtungsbelegSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    it('should validate optional amount fields', () => {
      const data = {
        ...baseData,
        gesamtbetrag: '100,00',
        gesamtbetragMwst: '',      // Empty string allowed for optional
        gesamtbetragNetto: '81,00', // Valid format
        trinkgeld: '',              // Empty string allowed
        trinkgeldMwst: '3,80',      // Valid format
      };

      const result = bewirtungsbelegSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Input sanitization', () => {
    it('should sanitize HTML tags from input', () => {
      const dangerous = '<script>alert("XSS")</script>Normal Text';
      const sanitized = sanitizeInput(dangerous);
      // The regex removes tags but not their content
      expect(sanitized).toBe('alert("XSS")Normal Text');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    it('should remove javascript: protocol', () => {
      const dangerous = 'javascript:alert("XSS")';
      const sanitized = sanitizeInput(dangerous);
      expect(sanitized).toBe('alert("XSS")');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const dangerous = 'Text onclick=alert("XSS") more text';
      const sanitized = sanitizeInput(dangerous);
      // The regex removes "onclick=" but leaves the rest
      expect(sanitized).toBe('Text alert("XSS") more text');
      expect(sanitized).not.toContain('onclick=');
    });

    it('should sanitize entire objects recursively', () => {
      const dangerousObj = {
        name: '<b>Bold Name</b>',
        description: 'Normal text',
        nested: {
          field: 'javascript:void(0)',
          array: ['<script>bad</script>', 'good text']
        }
      };

      const sanitized = sanitizeObject(dangerousObj);
      
      expect(sanitized.name).toBe('Bold Name');
      expect(sanitized.description).toBe('Normal text');
      expect(sanitized.nested.field).toBe('void(0)');
      expect(sanitized.nested.array[0]).toBe('bad'); // Only <script> tags are removed, not their content
      expect(sanitized.nested.array[1]).toBe('good text');
    });

    it('should preserve valid data while sanitizing', () => {
      const validData = {
        restaurantName: 'Müller\'s Restaurant & Bar',
        anlass: 'Meeting with CEO & CTO',
        betrag: '100,50',
        datum: new Date('2025-08-06'),
      };

      const sanitized = sanitizeObject(validData);
      
      expect(sanitized.restaurantName).toBe('Müller\'s Restaurant & Bar');
      expect(sanitized.anlass).toBe('Meeting with CEO & CTO');
      expect(sanitized.betrag).toBe('100,50');
      expect(sanitized.datum).toEqual(validData.datum);
    });
  });

  describe('Payment method conditional validation', () => {
    const baseData = {
      datum: new Date('2025-08-06'),
      restaurantName: 'Test Restaurant',
      teilnehmer: 'Test',
      anlass: 'Test',
      gesamtbetrag: '100,00',
      bewirtungsart: 'kunden' as const,
    };

    it('should validate company payment', () => {
      const data = {
        ...baseData,
        zahlungsart: 'firma' as const,
      };

      const result = bewirtungsbelegSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate private payment', () => {
      const data = {
        ...baseData,
        zahlungsart: 'privat' as const,
      };

      const result = bewirtungsbelegSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate cash payment', () => {
      const data = {
        ...baseData,
        zahlungsart: 'bar' as const,
      };

      const result = bewirtungsbelegSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid payment types', () => {
      const data = {
        ...baseData,
        zahlungsart: 'invalid' as any,
      };

      const result = bewirtungsbelegSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});