/**
 * Unit tests for FormDataAccumulator
 *
 * Tests all upload combination scenarios to ensure fields are never cleared
 */

import { describe, it, expect, vi } from 'vitest';
import { FormDataAccumulator } from '../FormDataAccumulator';

describe('FormDataAccumulator', () => {
  // Mock initial form values
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

  // Mock Rechnung OCR data (Vendor PDF)
  const getRechnungOcrData = () => ({
    restaurantName: 'Test Restaurant',
    restaurantAnschrift: 'Test Str. 1, 10115 Berlin',
    gesamtbetrag: '51,90',
    mwst: '8,28',
    netto: '43,62',
    datum: '19.09.2025',
    trinkgeld: '',
  });

  // Mock Kreditkartenbeleg OCR data
  const getKreditkartenOcrData = () => ({
    restaurantName: 'Test Restaurant',
    gesamtbetrag: '61,90', // 51.90 + 10.00 tip
    datum: '19.09.2025',
  });

  describe('Scenario 1: Rechnung first, then Kreditkartenbeleg', () => {
    it('should preserve all Rechnung fields when Kreditkartenbeleg is added', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Step 1: Add Rechnung data
      accumulator.mergeOcrData(getRechnungOcrData(), 'Rechnung');

      const afterRechnung = accumulator.getAccumulatedValues();
      expect(afterRechnung.gesamtbetrag).toBe('51.90');
      expect(afterRechnung.gesamtbetragMwst).toBe('8.28');
      expect(afterRechnung.gesamtbetragNetto).toBe('43.62');
      expect(afterRechnung.restaurantName).toBe('Test Restaurant');

      // Step 2: Add Kreditkartenbeleg data
      accumulator.mergeOcrData(getKreditkartenOcrData(), 'Kreditkartenbeleg');

      const final = accumulator.getAccumulatedValues();

      // Rechnung fields should NOT be cleared
      expect(final.gesamtbetrag).toBe('51.90');
      expect(final.gesamtbetragMwst).toBe('8.28');
      expect(final.gesamtbetragNetto).toBe('43.62');

      // Kreditkarten field should be populated
      expect(final.kreditkartenBetrag).toBe('61.90');

      // Trinkgeld should be calculated
      expect(final.trinkgeld).toBe('10.00'); // 61.90 - 51.90
      expect(final.trinkgeldMwst).toBe('1.90'); // 10.00 * 0.19
    });
  });

  describe('Scenario 2: Kreditkartenbeleg first, then Rechnung', () => {
    it('should populate all fields correctly when uploads are reversed', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Step 1: Add Kreditkartenbeleg data first
      accumulator.mergeOcrData(getKreditkartenOcrData(), 'Kreditkartenbeleg');

      const afterKreditkarte = accumulator.getAccumulatedValues();
      expect(afterKreditkarte.kreditkartenBetrag).toBe('61.90');

      // Step 2: Add Rechnung data
      accumulator.mergeOcrData(getRechnungOcrData(), 'Rechnung');

      const final = accumulator.getAccumulatedValues();

      // All Rechnung fields should be populated
      expect(final.gesamtbetrag).toBe('51.90');
      expect(final.gesamtbetragMwst).toBe('8.28');
      expect(final.gesamtbetragNetto).toBe('43.62');

      // Kreditkarten field should still be there
      expect(final.kreditkartenBetrag).toBe('61.90');

      // Trinkgeld should be calculated after Rechnung is added
      expect(final.trinkgeld).toBe('10.00');
      expect(final.trinkgeldMwst).toBe('1.90');
    });
  });

  describe('Scenario 3: Multiple Rechnung updates', () => {
    it('should update Rechnung fields when new Rechnung data comes in', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // First Rechnung
      accumulator.mergeOcrData(getRechnungOcrData(), 'Rechnung');

      expect(accumulator.getAccumulatedValues().gesamtbetrag).toBe('51.90');

      // Second Rechnung with different amount
      const updatedRechnung = {
        ...getRechnungOcrData(),
        gesamtbetrag: '75,50',
        mwst: '12,05',
        netto: '63,45'
      };

      accumulator.mergeOcrData(updatedRechnung, 'Rechnung');

      const final = accumulator.getAccumulatedValues();
      expect(final.gesamtbetrag).toBe('75.50');
      expect(final.gesamtbetragMwst).toBe('12.05');
      expect(final.gesamtbetragNetto).toBe('63.45');
    });
  });

  describe('Scenario 4: Multiple Kreditkartenbeleg updates', () => {
    it('should update only kreditkartenBetrag when new Kreditkartenbeleg comes in', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Add Rechnung first
      accumulator.mergeOcrData(getRechnungOcrData(), 'Rechnung');

      // First Kreditkartenbeleg
      accumulator.mergeOcrData(getKreditkartenOcrData(), 'Kreditkartenbeleg');

      expect(accumulator.getAccumulatedValues().kreditkartenBetrag).toBe('61.90');

      // Second Kreditkartenbeleg with different amount
      const updatedKreditkarte = {
        ...getKreditkartenOcrData(),
        gesamtbetrag: '70,00'
      };

      accumulator.mergeOcrData(updatedKreditkarte, 'Kreditkartenbeleg');

      const final = accumulator.getAccumulatedValues();

      // Rechnung fields should still be intact
      expect(final.gesamtbetrag).toBe('51.90');
      expect(final.gesamtbetragMwst).toBe('8.28');
      expect(final.gesamtbetragNetto).toBe('43.62');

      // Kreditkarten field updated
      expect(final.kreditkartenBetrag).toBe('70.00');

      // Trinkgeld updated
      expect(final.trinkgeld).toBe('18.10'); // 70.00 - 51.90
      expect(final.trinkgeldMwst).toBe('3.44'); // 18.10 * 0.19
    });
  });

  describe('Financial Field Calculations', () => {
    it('should calculate MwSt and Netto when only Brutto is provided', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      const ocrData = {
        gesamtbetrag: '100,00',
        mwst: '15,97',
        netto: '', // Missing
      };

      accumulator.mergeOcrData(ocrData, 'Rechnung');

      const final = accumulator.getAccumulatedValues();
      expect(final.gesamtbetrag).toBe('100.00');
      expect(final.gesamtbetragMwst).toBe('15.97');
      expect(final.gesamtbetragNetto).toBe('84.03'); // Calculated
    });

    it('should calculate trinkgeld MwSt (19%)', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Add Rechnung
      accumulator.mergeOcrData({ gesamtbetrag: '50,00', mwst: '7,98', netto: '42,02' }, 'Rechnung');

      // Add Kreditkartenbeleg with tip
      accumulator.mergeOcrData({ gesamtbetrag: '60,00' }, 'Kreditkartenbeleg');

      const final = accumulator.getAccumulatedValues();
      expect(final.trinkgeld).toBe('10.00');
      expect(final.trinkgeldMwst).toBe('1.90'); // 10.00 * 0.19
    });
  });

  describe('Field Validation', () => {
    it('should validate that all financial fields are populated', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Initially should fail validation
      let validation = accumulator.validateFinancialFields();
      expect(validation.isValid).toBe(false);
      expect(validation.missingFields).toContain('gesamtbetrag');
      expect(validation.missingFields).toContain('kreditkartenBetrag');

      // Add complete data
      accumulator.mergeOcrData(getRechnungOcrData(), 'Rechnung');
      accumulator.mergeOcrData(getKreditkartenOcrData(), 'Kreditkartenbeleg');

      // Should pass validation
      validation = accumulator.validateFinancialFields();
      expect(validation.isValid).toBe(true);
      expect(validation.missingFields).toHaveLength(0);
    });
  });

  describe('Date Handling', () => {
    it('should parse German date format correctly', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      accumulator.mergeOcrData({ datum: '19.09.2025' }, 'Rechnung');

      const final = accumulator.getAccumulatedValues();
      expect(final.datum).toBeInstanceOf(Date);
      expect(final.datum?.getFullYear()).toBe(2025);
      expect(final.datum?.getMonth()).toBe(8); // September (0-indexed)
      expect(final.datum?.getDate()).toBe(19);
    });
  });

  describe('Apply to Form', () => {
    it('should call setFieldValue for each field when applying to form', () => {
      const accumulator = new FormDataAccumulator(getInitialFormValues());

      // Mock form object
      const mockForm = {
        setFieldValue: vi.fn()
      };

      accumulator.mergeOcrData(getRechnungOcrData(), 'Rechnung');
      accumulator.applyToForm(mockForm);

      // Should have called setFieldValue multiple times
      expect(mockForm.setFieldValue).toHaveBeenCalled();

      // Check specific calls
      expect(mockForm.setFieldValue).toHaveBeenCalledWith('gesamtbetrag', '51.90');
      expect(mockForm.setFieldValue).toHaveBeenCalledWith('gesamtbetragMwst', '8.28');
      expect(mockForm.setFieldValue).toHaveBeenCalledWith('gesamtbetragNetto', '43.62');
      expect(mockForm.setFieldValue).toHaveBeenCalledWith('restaurantName', 'Test Restaurant');
    });
  });
});
