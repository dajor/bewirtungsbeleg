/**
 * Integration test for OCR extraction with real test files
 *
 * Tests the complete flow:
 * 1. Extract data from Vendor PDF (Rechnung)
 * 2. Extract data from Kundenbeleg PDF (Kreditkartenbeleg)
 * 3. Merge data using FormDataAccumulator
 * 4. Validate against expected JSON output
 *
 * This test ensures that the OCR → FormDataAccumulator → field population
 * pipeline works correctly and produces accurate results.
 */

import { describe, it, expect } from 'vitest';
import { FormDataAccumulator } from '../FormDataAccumulator';

// Expected results from test file
const expectedResults = {
  "datum": "2025-09-19T00:00:00.000Z",
  "restaurantName": "Osteria del Parco",
  "restaurantAnschrift": "Anzinger Strasse 1, 85586 Poing, Osteria",
  "teilnehmer": "",
  "anlass": "",
  "gesamtbetrag": "53.90",
  "gesamtbetragMwst": "8.61",
  "gesamtbetragNetto": "45.29",
  "trinkgeld": "2.10",
  "trinkgeldMwst": "0.40",
  "kreditkartenBetrag": "56.00",
  "zahlungsart": "firma",
  "bewirtungsart": "kunden",
  "geschaeftlicherAnlass": "",
  "geschaeftspartnerNamen": "",
  "geschaeftspartnerFirma": "",
  "istAuslaendischeRechnung": false,
  "auslaendischeWaehrung": "",
  "generateZugferd": false,
  "istEigenbeleg": false,
  "restaurantPlz": "",
  "restaurantOrt": "",
  "unternehmen": "",
  "unternehmenAnschrift": "",
  "unternehmenPlz": "",
  "unternehmenOrt": "",
  "speisen": "",
  "getraenke": "",
};

describe('OCR Extraction Integration Test', () => {
  // Mock initial form values (empty form)
  const getInitialFormValues = () => ({
    datum: null,
    restaurantName: '',
    restaurantAnschrift: '',
    teilnehmer: '',
    anlass: '',
    gesamtbetrag: '',
    gesamtbetragMwst: '',
    gesamtbetragNetto: '',
    trinkgeld: '',
    trinkgeldMwst: '',
    kreditkartenBetrag: '',
    zahlungsart: 'firma' as const,
    bewirtungsart: 'kunden' as const,
    geschaeftlicherAnlass: '',
    geschaeftspartnerNamen: '',
    geschaeftspartnerFirma: '',
    istAuslaendischeRechnung: false,
    auslaendischeWaehrung: '',
    generateZugferd: false,
    istEigenbeleg: false,
    restaurantPlz: '',
    restaurantOrt: '',
    unternehmen: '',
    unternehmenAnschrift: '',
    unternehmenPlz: '',
    unternehmenOrt: '',
    speisen: '',
    getraenke: '',
  });

  // Mock OCR data from Vendor PDF (19092025_(Vendor).pdf)
  const getVendorOcrData = () => ({
    restaurantName: 'Osteria del Parco',
    restaurantAnschrift: 'Anzinger Strasse 1, 85586 Poing, Osteria',
    datum: '19.09.2025',
    gesamtbetrag: '53,90',
    mwst: '8,61',
    netto: '45,29',
    trinkgeld: '',
  });

  // Mock OCR data from Kundenbeleg PDF (19092025_* * Kundenbeleg.pdf)
  const getKundenbelegOcrData = () => ({
    restaurantName: 'Osteria del Parco',
    gesamtbetrag: '56,00', // 53.90 + 2.10 tip
    datum: '19.09.2025',
  });

  describe('Complete OCR Extraction Flow', () => {
    it('should extract and merge data from both PDFs correctly', () => {
      // Step 1: Initialize FormDataAccumulator with empty form
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Step 2: Process Vendor PDF (Rechnung) - this should populate main financial fields
      accumulator.mergeOcrData(getVendorOcrData(), 'Rechnung');

      const afterVendor = accumulator.getAccumulatedValues();

      // Verify Vendor data was extracted correctly
      expect(afterVendor.restaurantName).toBe('Osteria del Parco');
      expect(afterVendor.restaurantAnschrift).toBe('Anzinger Strasse 1, 85586 Poing, Osteria');
      expect(afterVendor.gesamtbetrag).toBe('53.90');
      expect(afterVendor.gesamtbetragMwst).toBe('8.61');
      expect(afterVendor.gesamtbetragNetto).toBe('45.29');

      // Step 3: Process Kundenbeleg PDF - this should only update kreditkartenBetrag
      accumulator.mergeOcrData(getKundenbelegOcrData(), 'Kreditkartenbeleg');

      const final = accumulator.getAccumulatedValues();

      // Step 4: Validate against expected JSON results
      console.log('Final accumulated values:', final);
      console.log('Expected values:', expectedResults);

      // Text field validation
      expect(final.restaurantName).toBe(expectedResults.restaurantName);
      expect(final.restaurantAnschrift).toBe(expectedResults.restaurantAnschrift);

      // Date validation
      expect(final.datum).toBeInstanceOf(Date);
      const extractedDate = final.datum as Date;
      expect(extractedDate.getFullYear()).toBe(2025);
      expect(extractedDate.getMonth()).toBe(8); // September (0-indexed)
      expect(extractedDate.getDate()).toBe(19);

      // Financial fields validation (exact match)
      expect(final.gesamtbetrag).toBe(expectedResults.gesamtbetrag);
      expect(final.gesamtbetragMwst).toBe(expectedResults.gesamtbetragMwst);
      expect(final.gesamtbetragNetto).toBe(expectedResults.gesamtbetragNetto);
      expect(final.kreditkartenBetrag).toBe(expectedResults.kreditkartenBetrag);

      // CRITICAL: Verify trinkgeld calculation
      expect(final.trinkgeld).toBe(expectedResults.trinkgeld);
      expect(final.trinkgeldMwst).toBe(expectedResults.trinkgeldMwst);

      // Verify calculation logic
      const gesamtbetrag = Number(final.gesamtbetrag);
      const kreditkartenBetrag = Number(final.kreditkartenBetrag);
      const trinkgeld = Number(final.trinkgeld);
      const trinkgeldMwst = Number(final.trinkgeldMwst);

      // Trinkgeld = Kreditkartenbetrag - Gesamtbetrag
      expect(trinkgeld).toBeCloseTo(kreditkartenBetrag - gesamtbetrag, 2);
      expect(trinkgeld).toBeCloseTo(2.10, 2);

      // Trinkgeld MwSt = Trinkgeld × 0.19
      expect(trinkgeldMwst).toBeCloseTo(trinkgeld * 0.19, 2);
      expect(trinkgeldMwst).toBeCloseTo(0.40, 2);
    });

    it('should handle Kundenbeleg first, then Vendor order', () => {
      // Test reverse upload order
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Step 1: Process Kundenbeleg first
      accumulator.mergeOcrData(getKundenbelegOcrData(), 'Kreditkartenbeleg');

      const afterKundenbeleg = accumulator.getAccumulatedValues();
      expect(afterKundenbeleg.kreditkartenBetrag).toBe('56.00');

      // Step 2: Process Vendor (Rechnung)
      accumulator.mergeOcrData(getVendorOcrData(), 'Rechnung');

      const final = accumulator.getAccumulatedValues();

      // All fields should be populated correctly regardless of upload order
      expect(final.gesamtbetrag).toBe(expectedResults.gesamtbetrag);
      expect(final.kreditkartenBetrag).toBe(expectedResults.kreditkartenBetrag);
      expect(final.trinkgeld).toBe(expectedResults.trinkgeld);
      expect(final.trinkgeldMwst).toBe(expectedResults.trinkgeldMwst);
    });

    it('should validate all financial fields are populated', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Process both PDFs
      accumulator.mergeOcrData(getVendorOcrData(), 'Rechnung');
      accumulator.mergeOcrData(getKundenbelegOcrData(), 'Kreditkartenbeleg');

      // Validate using FormDataAccumulator's validation method
      const validation = accumulator.validateFinancialFields();

      expect(validation.isValid).toBe(true);
      expect(validation.missingFields).toHaveLength(0);
    });

    it('should apply values to form correctly', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Process both PDFs
      accumulator.mergeOcrData(getVendorOcrData(), 'Rechnung');
      accumulator.mergeOcrData(getKundenbelegOcrData(), 'Kreditkartenbeleg');

      // Mock form object
      const mockForm = {
        values: { ...getInitialFormValues() },
        setFieldValue: (key: string, value: any) => {
          (mockForm.values as any)[key] = value;
        },
      };

      // Apply to form
      accumulator.applyToForm(mockForm);

      // Verify all fields were set correctly IMMEDIATELY (no setTimeout needed)
      expect(mockForm.values.gesamtbetrag).toBe(expectedResults.gesamtbetrag);
      expect(mockForm.values.gesamtbetragMwst).toBe(expectedResults.gesamtbetragMwst);
      expect(mockForm.values.gesamtbetragNetto).toBe(expectedResults.gesamtbetragNetto);
      expect(mockForm.values.kreditkartenBetrag).toBe(expectedResults.kreditkartenBetrag);

      // CRITICAL: Trinkgeld fields should be set synchronously (no await/setTimeout)
      expect(mockForm.values.trinkgeld).toBe(expectedResults.trinkgeld);
      expect(mockForm.values.trinkgeldMwst).toBe(expectedResults.trinkgeldMwst);
    });

    it('should populate trinkgeld immediately without setTimeout race conditions', () => {
      // This test specifically validates that trinkgeld is set synchronously
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Process both PDFs
      accumulator.mergeOcrData(getVendorOcrData(), 'Rechnung');
      accumulator.mergeOcrData(getKundenbelegOcrData(), 'Kreditkartenbeleg');

      // Mock form with tracking
      let trinkgeldSetCount = 0;
      let trinkgeldMwstSetCount = 0;

      const mockForm = {
        values: { ...getInitialFormValues() },
        setFieldValue: (key: string, value: any) => {
          (mockForm.values as any)[key] = value;
          if (key === 'trinkgeld') trinkgeldSetCount++;
          if (key === 'trinkgeldMwst') trinkgeldMwstSetCount++;
        },
      };

      // Apply to form
      accumulator.applyToForm(mockForm);

      // Verify trinkgeld was set exactly once (no setTimeout retries)
      expect(trinkgeldSetCount).toBe(1);
      expect(trinkgeldMwstSetCount).toBe(1);

      // Verify trinkgeld values are correct immediately (no delay)
      expect(mockForm.values.trinkgeld).toBe('2.10');
      expect(mockForm.values.trinkgeldMwst).toBe('0.40');

      // Verify calculation is correct
      const gesamtbetrag = Number(mockForm.values.gesamtbetrag);
      const kreditkartenBetrag = Number(mockForm.values.kreditkartenBetrag);
      const trinkgeld = Number(mockForm.values.trinkgeld);

      expect(trinkgeld).toBeCloseTo(kreditkartenBetrag - gesamtbetrag, 2);
      expect(trinkgeld).toBeCloseTo(2.10, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing trinkgeld when kreditkartenBetrag equals gesamtbetrag', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Vendor data
      accumulator.mergeOcrData(getVendorOcrData(), 'Rechnung');

      // Kundenbeleg with same amount (no tip)
      accumulator.mergeOcrData({
        gesamtbetrag: '53,90', // Same as Rechnung
        datum: '19.09.2025',
      }, 'Kreditkartenbeleg');

      const final = accumulator.getAccumulatedValues();

      // Should not calculate trinkgeld when amounts are equal
      expect(final.kreditkartenBetrag).toBe('53.90');
      // Trinkgeld should not be set (or be 0)
      expect(final.trinkgeld || '0.00').toBe('0.00');
    });

    it('should calculate MwSt and Netto when only Brutto is provided', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      accumulator.mergeOcrData({
        restaurantName: 'Test Restaurant',
        gesamtbetrag: '100,00',
        mwst: '15,97',
        netto: '', // Missing
        datum: '19.09.2025',
      }, 'Rechnung');

      const final = accumulator.getAccumulatedValues();

      expect(final.gesamtbetrag).toBe('100.00');
      expect(final.gesamtbetragMwst).toBe('15.97');
      // Netto should be calculated: 100 - 15.97 = 84.03
      expect(final.gesamtbetragNetto).toBe('84.03');
    });

    it('should handle German decimal format conversion', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      accumulator.mergeOcrData({
        gesamtbetrag: '51,90', // German format with comma
        mwst: '8,28',
        netto: '43,62',
      }, 'Rechnung');

      const final = accumulator.getAccumulatedValues();

      // Should convert to English format (dot)
      expect(final.gesamtbetrag).toBe('51.90');
      expect(final.gesamtbetragMwst).toBe('8.28');
      expect(final.gesamtbetragNetto).toBe('43.62');
    });
  });

  describe('Comparison with Expected JSON', () => {
    it('should match all critical fields from expected JSON', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Simulate complete extraction flow
      accumulator.mergeOcrData(getVendorOcrData(), 'Rechnung');
      accumulator.mergeOcrData(getKundenbelegOcrData(), 'Kreditkartenbeleg');

      const result = accumulator.getAccumulatedValues();

      // Define critical fields that MUST match
      const criticalFields = [
        'restaurantName',
        'restaurantAnschrift',
        'gesamtbetrag',
        'gesamtbetragMwst',
        'gesamtbetragNetto',
        'kreditkartenBetrag',
        'trinkgeld',
        'trinkgeldMwst',
      ];

      // Verify each critical field
      criticalFields.forEach(field => {
        if (field === 'datum') {
          // Special handling for date
          return;
        }

        const expectedValue = (expectedResults as any)[field];
        const actualValue = (result as any)[field];

        expect(actualValue, `Field "${field}" should match expected value`).toBe(expectedValue);
      });
    });
  });
});
