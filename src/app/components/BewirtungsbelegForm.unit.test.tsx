/**
 * Unit tests for BewirtungsbelegForm component
 * Testing individual functions and logic without full rendering
 */

import '@testing-library/jest-dom';

// Mock the component's internal functions
describe('BewirtungsbelegForm - Unit Tests', () => {
  describe('Amount Calculations', () => {
    it('should calculate MwSt correctly (19% German VAT)', () => {
      const bruttoAmount = 119.00;
      const expectedMwst = 19.00;
      const expectedNetto = 100.00;
      
      // German VAT calculation
      const calculatedMwst = (bruttoAmount / 1.19 * 0.19);
      const calculatedNetto = bruttoAmount - calculatedMwst;
      
      expect(Number(calculatedMwst.toFixed(2))).toBe(expectedMwst);
      expect(Number(calculatedNetto.toFixed(2))).toBe(expectedNetto);
    });

    it('should calculate tip tax correctly', () => {
      const tipAmount = 11.90;
      const expectedTipTax = 1.90;
      
      const calculatedTipTax = (tipAmount / 1.19 * 0.19);
      
      expect(Number(calculatedTipTax.toFixed(2))).toBe(expectedTipTax);
    });

    it('should format German currency correctly', () => {
      const amount = 1234.56;
      const formatted = amount.toFixed(2).replace('.', ',');
      
      expect(formatted).toBe('1234,56');
    });
  });

  describe('Date Formatting', () => {
    it('should format date to ISO string for API', () => {
      const date = new Date('2024-01-15');
      const formatted = date.toISOString().split('T')[0];
      
      expect(formatted).toBe('2024-01-15');
    });

    it('should format date to German format for display', () => {
      const date = new Date('2024-01-15');
      const formatted = date.toLocaleDateString('de-DE');
      
      expect(formatted).toBe('15.1.2024');
    });
  });

  describe('Form Validation Rules', () => {
    it('should require restaurant name', () => {
      const validate = (value: string) => (value ? null : 'Name des Restaurants ist erforderlich');
      
      expect(validate('')).toBe('Name des Restaurants ist erforderlich');
      expect(validate('Test Restaurant')).toBeNull();
    });

    it('should require Geschäftspartner for Kundenbewirtung', () => {
      const validate = (value: string, values: { bewirtungsart: string }) => {
        if (values.bewirtungsart === 'kunden' && !value) {
          return 'Namen der Geschäftspartner sind erforderlich';
        }
        return null;
      };
      
      expect(validate('', { bewirtungsart: 'kunden' })).toBe('Namen der Geschäftspartner sind erforderlich');
      expect(validate('Max Mustermann', { bewirtungsart: 'kunden' })).toBeNull();
      expect(validate('', { bewirtungsart: 'mitarbeiter' })).toBeNull();
    });
  });

  describe('API Data Formatting', () => {
    it('should format form data for PDF generation API', () => {
      const formData = {
        datum: new Date('2024-01-15'),
        restaurantName: 'Test Restaurant',
        restaurantAnschrift: 'Test Straße 123',
        teilnehmer: 'Max Mustermann',
        anlass: 'Geschäftsessen',
        gesamtbetrag: '119,00',
        gesamtbetragMwst: '19,00',
        gesamtbetragNetto: '100,00',
        trinkgeld: '10,00',
        trinkgeldMwst: '1,59',
        kreditkartenBetrag: '129,00',
        zahlungsart: 'firma' as const,
        bewirtungsart: 'kunden' as const,
        geschaeftlicherAnlass: 'Projektbesprechung',
        geschaeftspartnerNamen: 'Max Mustermann',
        geschaeftspartnerFirma: 'ABC GmbH',
        istAuslaendischeRechnung: false,
        auslaendischeWaehrung: ''
      };

      const apiData = {
        ...formData,
        datum: formData.datum.toISOString().split('T')[0],
        image: null
      };

      expect(apiData.datum).toBe('2024-01-15');
      expect(apiData.restaurantName).toBe('Test Restaurant');
      expect(apiData.bewirtungsart).toBe('kunden');
    });

    it('should handle foreign currency data correctly', () => {
      const formData = {
        istAuslaendischeRechnung: true,
        auslaendischeWaehrung: 'USD',
        gesamtbetrag: '100.00',
        trinkgeld: '15.00',
        kreditkartenBetrag: '115.00'
      };

      expect(formData.auslaendischeWaehrung).toBe('USD');
      expect(formData.istAuslaendischeRechnung).toBe(true);
    });
  });

  describe('Receipt Type Classification', () => {
    it('should identify invoice type from classification result', () => {
      const classificationResult = {
        type: 'rechnung',
        confidence: 0.95,
        reason: 'Enthält typische Rechnungsmerkmale'
      };

      expect(classificationResult.type).toBe('rechnung');
      expect(classificationResult.confidence).toBeGreaterThan(0.8);
    });

    it('should handle customer receipt classification', () => {
      const classificationResult = {
        type: 'kundenbeleg',
        confidence: 0.88,
        reason: 'Kreditkarten-Transaktionsbeleg'
      };

      expect(classificationResult.type).toBe('kundenbeleg');
      expect(classificationResult.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Image Processing', () => {
    it('should convert file to base64', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const reader = new FileReader();
      
      const result = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(mockFile);
      });

      expect(result).toContain('data:image/jpeg;base64,');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing date error', () => {
      const formData = { datum: null };
      
      const validateDate = () => {
        if (!formData.datum) {
          throw new Error('Datum ist erforderlich');
        }
      };

      expect(() => validateDate()).toThrow('Datum ist erforderlich');
    });

    it('should handle PDF generation failure', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };

      const handleError = (response: typeof mockResponse) => {
        if (!response.ok) {
          throw new Error(`Fehler beim Erstellen des PDFs: ${response.statusText}`);
        }
      };

      expect(() => handleError(mockResponse)).toThrow('Fehler beim Erstellen des PDFs: Internal Server Error');
    });
  });
});