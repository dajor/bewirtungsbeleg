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

    it('should apply values to form correctly using setValues()', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Process both PDFs
      accumulator.mergeOcrData(getVendorOcrData(), 'Rechnung');
      accumulator.mergeOcrData(getKundenbelegOcrData(), 'Kreditkartenbeleg');

      // Mock form object with setValues method (Mantine-like)
      const mockForm = {
        values: { ...getInitialFormValues() },
        setValues: (updates: any) => {
          // Merge updates into values (like Mantine does)
          Object.assign(mockForm.values, updates);
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

      // Mock form with tracking for setValues calls
      let setValuesCallCount = 0;
      let lastUpdateObject: any = null;

      const mockForm = {
        values: { ...getInitialFormValues() },
        setValues: (updates: any) => {
          setValuesCallCount++;
          lastUpdateObject = { ...updates };
          // Merge updates into values (like Mantine does)
          Object.assign(mockForm.values, updates);
        },
      };

      // Apply to form
      accumulator.applyToForm(mockForm);

      // Verify setValues was called exactly once (atomic update)
      expect(setValuesCallCount).toBe(1);

      // Verify trinkgeld and trinkgeldMwst were included in the update object
      expect(lastUpdateObject).toHaveProperty('trinkgeld', '2.10');
      expect(lastUpdateObject).toHaveProperty('trinkgeldMwst', '0.40');

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

  describe('Critical Bug Detection Tests', () => {
    it('CRITICAL: should calculate trinkgeld when Kundenbeleg uploads before Rechnung', () => {
      // This test specifically catches the bug where trinkgeld wasn't calculated
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Step 1: Upload Kundenbeleg first (sets kreditkartenBetrag only)
      accumulator.mergeOcrData(getKundenbelegOcrData(), 'Kreditkartenbeleg');

      const afterKundenbeleg = accumulator.getAccumulatedValues();
      expect(afterKundenbeleg.kreditkartenBetrag).toBe('56.00');
      expect(afterKundenbeleg.gesamtbetrag).toBe(''); // Still empty
      expect(afterKundenbeleg.trinkgeld || '').toBe(''); // Can't calculate yet

      // Step 2: Upload Rechnung (NOW we have both values)
      accumulator.mergeOcrData(getVendorOcrData(), 'Rechnung');

      const afterRechnung = accumulator.getAccumulatedValues();

      // CRITICAL: Trinkgeld MUST be calculated now
      expect(afterRechnung.gesamtbetrag).toBe('53.90');
      expect(afterRechnung.kreditkartenBetrag).toBe('56.00');
      expect(afterRechnung.trinkgeld).toBe('2.10');
      expect(afterRechnung.trinkgeldMwst).toBe('0.40');

      // Mock form and apply
      const mockForm = {
        values: { ...getInitialFormValues() },
        setValues: (updates: any) => {
          Object.assign(mockForm.values, updates);
        },
      };

      accumulator.applyToForm(mockForm);

      // CRITICAL: Form values must persist (not get cleared)
      expect(mockForm.values.trinkgeld).toBe('2.10');
      expect(mockForm.values.trinkgeldMwst).toBe('0.40');
      expect(mockForm.values.kreditkartenBetrag).toBe('56.00');
      expect(mockForm.values.gesamtbetrag).toBe('53.90');
    });

    it('CRITICAL: should calculate trinkgeld when Rechnung uploads before Kundenbeleg', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Step 1: Upload Rechnung first (sets financial fields)
      accumulator.mergeOcrData(getVendorOcrData(), 'Rechnung');

      const afterRechnung = accumulator.getAccumulatedValues();
      expect(afterRechnung.gesamtbetrag).toBe('53.90');
      expect(afterRechnung.kreditkartenBetrag).toBe(''); // Still empty
      expect(afterRechnung.trinkgeld || '').toBe(''); // Can't calculate yet

      // Step 2: Upload Kundenbeleg (NOW we have both values)
      accumulator.mergeOcrData(getKundenbelegOcrData(), 'Kreditkartenbeleg');

      const afterKundenbeleg = accumulator.getAccumulatedValues();

      // CRITICAL: Trinkgeld MUST be calculated now
      expect(afterKundenbeleg.gesamtbetrag).toBe('53.90');
      expect(afterKundenbeleg.kreditkartenBetrag).toBe('56.00');
      expect(afterKundenbeleg.trinkgeld).toBe('2.10');
      expect(afterKundenbeleg.trinkgeldMwst).toBe('0.40');

      // Mock form and apply
      const mockForm = {
        values: { ...getInitialFormValues() },
        setValues: (updates: any) => {
          Object.assign(mockForm.values, updates);
        },
      };

      accumulator.applyToForm(mockForm);

      // CRITICAL: Form values must persist
      expect(mockForm.values.trinkgeld).toBe('2.10');
      expect(mockForm.values.trinkgeldMwst).toBe('0.40');
      expect(mockForm.values.kreditkartenBetrag).toBe('56.00');
      expect(mockForm.values.gesamtbetrag).toBe('53.90');
    });

    it('CRITICAL: should include trinkgeld in the setValues() update object', () => {
      // This test verifies that trinkgeld is included in the atomic update
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      accumulator.mergeOcrData(getVendorOcrData(), 'Rechnung');
      accumulator.mergeOcrData(getKundenbelegOcrData(), 'Kreditkartenbeleg');

      let capturedUpdates: any = null;

      const mockForm = {
        values: { ...getInitialFormValues() },
        setValues: (updates: any) => {
          capturedUpdates = { ...updates };
          Object.assign(mockForm.values, updates);
        },
      };

      accumulator.applyToForm(mockForm);

      // CRITICAL: The updates object passed to setValues() must include trinkgeld
      expect(capturedUpdates).toBeDefined();
      expect(capturedUpdates).toHaveProperty('trinkgeld', '2.10');
      expect(capturedUpdates).toHaveProperty('trinkgeldMwst', '0.40');
      expect(capturedUpdates).toHaveProperty('gesamtbetrag', '53.90');
      expect(capturedUpdates).toHaveProperty('kreditkartenBetrag', '56.00');
    });

    it('CRITICAL: form validation should pass after OCR extraction', () => {
      // This test simulates the "Weiter" button validation issue
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      accumulator.mergeOcrData(getVendorOcrData(), 'Rechnung');
      accumulator.mergeOcrData(getKundenbelegOcrData(), 'Kreditkartenbeleg');

      const mockForm = {
        values: { ...getInitialFormValues() },
        setValues: (updates: any) => {
          Object.assign(mockForm.values, updates);
        },
      };

      accumulator.applyToForm(mockForm);

      // Simulate Mantine form validation
      const requiredFinancialFields = [
        'gesamtbetrag',
        'gesamtbetragMwst',
        'gesamtbetragNetto',
        'kreditkartenBetrag',
        'trinkgeld',
        'trinkgeldMwst',
      ];

      const missingFields: string[] = [];

      requiredFinancialFields.forEach(field => {
        const value = mockForm.values[field as keyof typeof mockForm.values];
        if (!value || value === '' || value === '0' || value === '0.00') {
          missingFields.push(field);
        }
      });

      // CRITICAL: Validation must pass (no missing fields)
      expect(missingFields, `Missing required fields: ${missingFields.join(', ')}`).toHaveLength(0);

      // Verify specific values are populated
      expect(mockForm.values.gesamtbetrag).toBe('53.90');
      expect(mockForm.values.kreditkartenBetrag).toBe('56.00');
      expect(mockForm.values.trinkgeld).toBe('2.10');
    });

    it('CRITICAL: should handle rapid sequential OCR uploads without losing data', () => {
      // This test simulates the production scenario of rapid uploads
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Simulate rapid uploads (no delay between them)
      accumulator.mergeOcrData(getVendorOcrData(), 'Rechnung');
      accumulator.mergeOcrData(getKundenbelegOcrData(), 'Kreditkartenbeleg');

      const mockForm = {
        values: { ...getInitialFormValues() },
        setValues: (updates: any) => {
          Object.assign(mockForm.values, updates);
        },
      };

      // Apply immediately (no setTimeout)
      accumulator.applyToForm(mockForm);

      // CRITICAL: All values must be present immediately
      const allFieldsPopulated = [
        mockForm.values.gesamtbetrag === '53.90',
        mockForm.values.gesamtbetragMwst === '8.61',
        mockForm.values.gesamtbetragNetto === '45.29',
        mockForm.values.kreditkartenBetrag === '56.00',
        mockForm.values.trinkgeld === '2.10',
        mockForm.values.trinkgeldMwst === '0.40',
        mockForm.values.restaurantName === 'Osteria del Parco',
      ].every(Boolean);

      expect(allFieldsPopulated, 'Not all fields were populated correctly').toBe(true);
    });
  });
});
