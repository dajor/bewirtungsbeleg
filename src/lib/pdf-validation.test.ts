/**
 * @jest-environment node
 */
import { generatePdfSchema, bewirtungsbelegSchema } from './validation';

describe('PDF Generation Schema Validation', () => {
  describe('Critical test: Form data structure must match API expectations', () => {
    it('MUST accept all fields sent by BewirtungsbelegForm', () => {
      // This is the exact data structure sent by the form
      // If this test fails, the PDF generation will fail with 400 error
      const formData = {
        // Date as Date object (before string conversion)
        datum: new Date('2025-06-04'),
        
        // Restaurant info
        restaurantName: 'Engel Restauromiebetriebe GmbH',
        restaurantAnschrift: 'Musterstraße 123, 12345 Berlin',
        
        // Participants and occasion
        teilnehmer: 'Christian Gabireli',
        anlass: '-',
        geschaeftlicherAnlass: 'Projektbesprechung',
        
        // Amounts in German format (without currency symbol)
        gesamtbetrag: '53,40',
        gesamtbetragMwst: '10,15',
        gesamtbetragNetto: '43,25',
        trinkgeld: '6,60',
        trinkgeldMwst: '1,25',
        kreditkartenBetrag: '',
        
        // Enums
        zahlungsart: 'bar' as const,
        bewirtungsart: 'mitarbeiter' as const,
        
        // Foreign currency
        istAuslaendischeRechnung: false,
        auslaendischeWaehrung: '',
        
        // Business partner (for Kundenbewirtung)
        geschaeftspartnerNamen: '',
        geschaeftspartnerFirma: '',
        
        // Attachments
        attachments: []
      };

      // This must not throw
      expect(() => bewirtungsbelegSchema.parse(formData)).not.toThrow();
    });

    it('MUST accept form data after API transformation', () => {
      // This is how BewirtungsbelegForm transforms data before sending to API
      const apiData = {
        datum: new Date('2025-06-04'),
        restaurantName: 'Engel Restauromiebetriebe GmbH',
        restaurantAnschrift: 'Musterstraße 123',
        teilnehmer: 'Christian Gabireli',
        anlass: 'Business Meeting', // Note: geschaeftlicherAnlass is mapped to anlass
        gesamtbetrag: '53,40', // Note: converted to German decimal format
        gesamtbetragMwst: '10,15',
        gesamtbetragNetto: '43,25',
        trinkgeld: '6,60',
        trinkgeldMwst: '1,25',
        kreditkartenBetrag: '60,00',
        zahlungsart: 'bar' as const,
        bewirtungsart: 'mitarbeiter' as const,
        geschaeftlicherAnlass: 'Business Meeting',
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
          }
        ]
      };

      // This must not throw
      const result = generatePdfSchema.parse(apiData);
      expect(result).toBeDefined();
      expect(result.restaurantName).toBe('Engel Restauromiebetriebe GmbH');
      expect(result.attachments).toHaveLength(1);
    });

    it('MUST handle all possible zahlungsart values', () => {
      const baseData = {
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'Test',
        anlass: 'Test',
        gesamtbetrag: '10,00',
        bewirtungsart: 'kunden' as const,
      };

      // All these must be valid
      const validPaymentTypes = ['firma', 'privat', 'bar'] as const;
      
      validPaymentTypes.forEach(zahlungsart => {
        const data = { ...baseData, zahlungsart };
        expect(() => generatePdfSchema.parse(data)).not.toThrow();
      });
    });

    it('MUST handle all possible bewirtungsart values', () => {
      const baseData = {
        datum: new Date(),
        restaurantName: 'Test',
        teilnehmer: 'Test',
        anlass: 'Test',
        gesamtbetrag: '10,00',
        zahlungsart: 'firma' as const,
      };

      // All these must be valid
      const validTypes = ['kunden', 'mitarbeiter'] as const;
      
      validTypes.forEach(bewirtungsart => {
        const data = { ...baseData, bewirtungsart };
        expect(() => generatePdfSchema.parse(data)).not.toThrow();
      });
    });

    it('MUST accept empty strings for optional fields', () => {
      const data = {
        datum: new Date(),
        restaurantName: 'Test',
        restaurantAnschrift: '', // Empty optional field
        teilnehmer: 'Test',
        anlass: 'Test',
        gesamtbetrag: '10,00',
        gesamtbetragMwst: '', // Empty optional field
        gesamtbetragNetto: '', // Empty optional field
        trinkgeld: '', // Empty optional field
        zahlungsart: 'firma' as const,
        bewirtungsart: 'kunden' as const,
        geschaeftspartnerNamen: '', // Empty optional field
        geschaeftspartnerFirma: '', // Empty optional field
      };

      expect(() => generatePdfSchema.parse(data)).not.toThrow();
    });
  });

  describe('Schema field requirements', () => {
    it('should list all fields that can cause 400 errors if missing', () => {
      // These fields MUST be present in the schema
      const requiredSchemaFields = [
        'datum',
        'restaurantName',
        'teilnehmer',
        'anlass',
        'gesamtbetrag',
        'zahlungsart',
        'bewirtungsart',
        // Optional but must be accepted
        'restaurantAnschrift',
        'gesamtbetragMwst',
        'gesamtbetragNetto',
        'trinkgeld',
        'trinkgeldMwst',
        'kreditkartenBetrag',
        'geschaeftlicherAnlass',
        'geschaeftspartnerNamen',
        'geschaeftspartnerFirma',
        'istAuslaendischeRechnung',
        'auslaendischeWaehrung',
        'image',
        'attachments'
      ];

      const schema = generatePdfSchema;
      const shape = schema.shape;

      requiredSchemaFields.forEach(field => {
        expect(shape).toHaveProperty(field);
      });
    });
  });
});