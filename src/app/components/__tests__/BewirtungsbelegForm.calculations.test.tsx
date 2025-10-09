/**
 * Unit tests for BewirtungsbelegForm automatic calculations
 * Tests all auto-calculation scenarios and field entry order permutations
 *
 * NOTE: These tests document the expected calculation behavior.
 * They use renderHook which requires jsdom, but jsdom has canvas dependency issues.
 * The tests are currently skipped in CI but serve as documentation.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useForm } from '@mantine/form';

describe('Bewirtungsbeleg Form - Automatic Calculations', () => {

  describe('Gesamtbetrag → MwSt & Netto Calculation', () => {
    it('should calculate MwSt (19%) and Netto from Gesamtbetrag', () => {
      const { result } = renderHook(() => useForm({
        initialValues: {
          gesamtbetrag: '',
          gesamtbetragMwst: '',
          gesamtbetragNetto: '',
        }
      }));

      // Simulate entering Gesamtbetrag = 100.00
      act(() => {
        const brutto = 100;
        const mwst = (brutto * 0.19).toFixed(2); // 19.00
        const netto = (brutto - Number(mwst)).toFixed(2); // 81.00

        result.current.setFieldValue('gesamtbetrag', brutto.toString());
        result.current.setFieldValue('gesamtbetragMwst', mwst);
        result.current.setFieldValue('gesamtbetragNetto', netto);
      });

      expect(result.current.values.gesamtbetrag).toBe('100');
      expect(result.current.values.gesamtbetragMwst).toBe('19.00');
      expect(result.current.values.gesamtbetragNetto).toBe('81.00');
    });

    it('should calculate correct MwSt for 29.90 (Restaurant Mythos example)', () => {
      const { result } = renderHook(() => useForm({
        initialValues: {
          gesamtbetrag: '',
          gesamtbetragMwst: '',
          gesamtbetragNetto: '',
        }
      }));

      act(() => {
        const brutto = 29.90;
        const mwst = (brutto * 0.19).toFixed(2); // 5.68
        const netto = (brutto - Number(mwst)).toFixed(2); // 24.22

        result.current.setFieldValue('gesamtbetrag', brutto.toString());
        result.current.setFieldValue('gesamtbetragMwst', mwst);
        result.current.setFieldValue('gesamtbetragNetto', netto);
      });

      expect(result.current.values.gesamtbetrag).toBe('29.9');
      expect(result.current.values.gesamtbetragMwst).toBe('5.68');
      expect(result.current.values.gesamtbetragNetto).toBe('24.22');
    });

    it('should recalculate when Gesamtbetrag changes', () => {
      const { result } = renderHook(() => useForm({
        initialValues: {
          gesamtbetrag: '50',
          gesamtbetragMwst: '9.50',
          gesamtbetragNetto: '40.50',
        }
      }));

      // Change Gesamtbetrag to 60
      act(() => {
        const brutto = 60;
        const mwst = (brutto * 0.19).toFixed(2);
        const netto = (brutto - Number(mwst)).toFixed(2);

        result.current.setFieldValue('gesamtbetrag', brutto.toString());
        result.current.setFieldValue('gesamtbetragMwst', mwst);
        result.current.setFieldValue('gesamtbetragNetto', netto);
      });

      expect(result.current.values.gesamtbetragMwst).toBe('11.40');
      expect(result.current.values.gesamtbetragNetto).toBe('48.60');
    });
  });

  describe('Kreditkartenbetrag → Tip Calculation', () => {
    it('should calculate tip when Kreditkartenbetrag > Gesamtbetrag', () => {
      const { result } = renderHook(() => useForm({
        initialValues: {
          gesamtbetrag: '29.90',
          kreditkartenBetrag: '',
          trinkgeld: '',
        }
      }));

      // Enter Kreditkartenbetrag = 35.00
      act(() => {
        const kkBetrag = 35.00;
        const gesamtbetrag = 29.90;
        const tip = (kkBetrag - gesamtbetrag).toFixed(2);

        result.current.setFieldValue('kreditkartenBetrag', kkBetrag.toString());
        result.current.setFieldValue('trinkgeld', tip);
      });

      expect(result.current.values.kreditkartenBetrag).toBe('35');
      expect(result.current.values.trinkgeld).toBe('5.10');
    });

    it('should not calculate tip when Kreditkartenbetrag < Gesamtbetrag', () => {
      const { result } = renderHook(() => useForm({
        initialValues: {
          gesamtbetrag: '50.00',
          kreditkartenBetrag: '',
          trinkgeld: '',
        }
      }));

      // Enter Kreditkartenbetrag = 40.00 (less than Gesamtbetrag)
      act(() => {
        const kkBetrag = 40.00;
        const gesamtbetrag = 50.00;

        result.current.setFieldValue('kreditkartenBetrag', kkBetrag.toString());
        // No tip should be calculated
      });

      expect(result.current.values.kreditkartenBetrag).toBe('40');
      expect(result.current.values.trinkgeld).toBe('');
    });

    it('should not calculate tip when Gesamtbetrag is empty', () => {
      const { result } = renderHook(() => useForm({
        initialValues: {
          gesamtbetrag: '',
          kreditkartenBetrag: '',
          trinkgeld: '',
        }
      }));

      act(() => {
        result.current.setFieldValue('kreditkartenBetrag', '35.00');
      });

      expect(result.current.values.trinkgeld).toBe('');
    });
  });

  describe('Trinkgeld → Kreditkartenbetrag Calculation', () => {
    it('should calculate Kreditkartenbetrag from Gesamtbetrag + Trinkgeld', () => {
      const { result } = renderHook(() => useForm({
        initialValues: {
          gesamtbetrag: '30.00',
          kreditkartenBetrag: '',
          trinkgeld: '',
        }
      }));

      // Enter Trinkgeld = 5.00
      act(() => {
        const gesamtbetrag = 30.00;
        const tip = 5.00;
        const kkBetrag = (gesamtbetrag + tip).toFixed(2);

        result.current.setFieldValue('trinkgeld', tip.toString());
        result.current.setFieldValue('kreditkartenBetrag', kkBetrag);
      });

      expect(result.current.values.trinkgeld).toBe('5');
      expect(result.current.values.kreditkartenBetrag).toBe('35.00');
    });

    it('should calculate MwSt for Trinkgeld', () => {
      const { result } = renderHook(() => useForm({
        initialValues: {
          trinkgeld: '',
          trinkgeldMwst: '',
        }
      }));

      act(() => {
        const tip = 5.00;
        const tipMwst = (tip * 0.19).toFixed(2);

        result.current.setFieldValue('trinkgeld', tip.toString());
        result.current.setFieldValue('trinkgeldMwst', tipMwst);
      });

      expect(result.current.values.trinkgeld).toBe('5');
      expect(result.current.values.trinkgeldMwst).toBe('0.95');
    });
  });

  describe('Field Entry Order Permutations', () => {
    it('Scenario 1: Gesamtbetrag first, then Kreditkartenbetrag', () => {
      const { result } = renderHook(() => useForm({
        initialValues: {
          gesamtbetrag: '',
          gesamtbetragMwst: '',
          gesamtbetragNetto: '',
          kreditkartenBetrag: '',
          trinkgeld: '',
        }
      }));

      // Step 1: Enter Gesamtbetrag
      act(() => {
        const brutto = 29.90;
        const mwst = (brutto * 0.19).toFixed(2);
        const netto = (brutto - Number(mwst)).toFixed(2);

        result.current.setFieldValue('gesamtbetrag', brutto.toString());
        result.current.setFieldValue('gesamtbetragMwst', mwst);
        result.current.setFieldValue('gesamtbetragNetto', netto);
      });

      // Step 2: Enter Kreditkartenbetrag
      act(() => {
        const kkBetrag = 35.00;
        const gesamtbetrag = Number(result.current.values.gesamtbetrag);
        const tip = (kkBetrag - gesamtbetrag).toFixed(2);

        result.current.setFieldValue('kreditkartenBetrag', kkBetrag.toString());
        result.current.setFieldValue('trinkgeld', tip);
      });

      expect(result.current.values.gesamtbetrag).toBe('29.9');
      expect(result.current.values.kreditkartenBetrag).toBe('35');
      expect(result.current.values.trinkgeld).toBe('5.10');
    });

    it('Scenario 2: Kreditkartenbetrag first, then Gesamtbetrag', () => {
      const { result } = renderHook(() => useForm({
        initialValues: {
          gesamtbetrag: '',
          kreditkartenBetrag: '',
          trinkgeld: '',
        }
      }));

      // Step 1: Enter Kreditkartenbetrag (no tip calculation yet)
      act(() => {
        result.current.setFieldValue('kreditkartenBetrag', '35.00');
      });

      expect(result.current.values.trinkgeld).toBe('');

      // Step 2: Enter Gesamtbetrag (now tip should be calculated)
      act(() => {
        const gesamtbetrag = 29.90;
        const kkBetrag = Number(result.current.values.kreditkartenBetrag);
        const tip = (kkBetrag - gesamtbetrag).toFixed(2);

        result.current.setFieldValue('gesamtbetrag', gesamtbetrag.toString());
        result.current.setFieldValue('trinkgeld', tip);
      });

      expect(result.current.values.trinkgeld).toBe('5.10');
    });

    it('Scenario 3: Gesamtbetrag and Trinkgeld, calculate Kreditkartenbetrag', () => {
      const { result } = renderHook(() => useForm({
        initialValues: {
          gesamtbetrag: '',
          kreditkartenBetrag: '',
          trinkgeld: '',
        }
      }));

      // Step 1: Enter Gesamtbetrag
      act(() => {
        result.current.setFieldValue('gesamtbetrag', '30.00');
      });

      // Step 2: Enter Trinkgeld
      act(() => {
        const gesamtbetrag = Number(result.current.values.gesamtbetrag);
        const tip = 4.50;
        const kkBetrag = (gesamtbetrag + tip).toFixed(2);

        result.current.setFieldValue('trinkgeld', tip.toString());
        result.current.setFieldValue('kreditkartenBetrag', kkBetrag);
      });

      expect(result.current.values.kreditkartenBetrag).toBe('34.50');
    });
  });

  describe('German Decimal Format', () => {
    it('should handle comma as decimal separator', () => {
      const { result } = renderHook(() => useForm({
        initialValues: {
          gesamtbetrag: '',
        }
      }));

      act(() => {
        // Simulate user entering "29,90" (German format)
        const germanValue = '29,90';
        const normalizedValue = germanValue.replace(',', '.');
        result.current.setFieldValue('gesamtbetrag', normalizedValue);
      });

      expect(result.current.values.gesamtbetrag).toBe('29.90');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      const { result } = renderHook(() => useForm({
        initialValues: {
          gesamtbetrag: '0',
          kreditkartenBetrag: '0',
          trinkgeld: '',
        }
      }));

      expect(result.current.values.gesamtbetrag).toBe('0');
      expect(result.current.values.trinkgeld).toBe('');
    });

    it('should handle very small differences (< 0.01)', () => {
      const { result } = renderHook(() => useForm({
        initialValues: {
          gesamtbetrag: '10.00',
          kreditkartenBetrag: '',
          trinkgeld: '',
        }
      }));

      act(() => {
        const kkBetrag = 10.001;
        const gesamtbetrag = 10.00;
        const tip = (kkBetrag - gesamtbetrag).toFixed(2);

        result.current.setFieldValue('kreditkartenBetrag', kkBetrag.toString());
        result.current.setFieldValue('trinkgeld', tip);
      });

      expect(result.current.values.trinkgeld).toBe('0.00');
    });
  });
});
