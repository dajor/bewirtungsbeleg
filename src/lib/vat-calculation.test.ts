/**
 * Unit Test 2: VAT calculation with 70/30 split for business entertainment
 * Critical for German tax compliance (Bewirtungsbelege)
 */

import { parseGermanDecimal, formatGermanDecimal } from './validation';

// Business logic for VAT calculations
export function calculateVAT(bruttoAmount: number, vatRate: number = 19): { netto: number; vat: number } {
  const netto = bruttoAmount / (1 + vatRate / 100);
  const vat = bruttoAmount - netto;
  return { netto, vat };
}

// Business entertainment 70/30 split calculation
export function calculateBusinessEntertainmentSplit(
  bruttoAmount: number,
  bewirtungsart: 'geschäftlich' | 'betrieblich'
): { deductible: number; nonDeductible: number; deductibleVAT: number } {
  if (bewirtungsart === 'betrieblich') {
    // 100% deductible for employee entertainment
    const { netto, vat } = calculateVAT(bruttoAmount);
    return {
      deductible: bruttoAmount,
      nonDeductible: 0,
      deductibleVAT: vat
    };
  } else {
    // 70/30 split for customer entertainment (geschäftlich)
    const { netto, vat } = calculateVAT(bruttoAmount);
    const deductibleNetto = netto * 0.7;
    const deductibleVAT = vat * 0.7;
    const deductible = deductibleNetto + deductibleVAT;
    const nonDeductible = bruttoAmount - deductible;
    
    return {
      deductible,
      nonDeductible,
      deductibleVAT
    };
  }
}

describe('VAT Calculation with 70/30 Split', () => {
  describe('calculateVAT', () => {
    it('should calculate correct VAT at 19% rate', () => {
      const result = calculateVAT(119.00, 19);
      expect(result.netto).toBeCloseTo(100.00, 2);
      expect(result.vat).toBeCloseTo(19.00, 2);
    });

    it('should calculate correct VAT at 7% reduced rate', () => {
      const result = calculateVAT(107.00, 7);
      expect(result.netto).toBeCloseTo(100.00, 2);
      expect(result.vat).toBeCloseTo(7.00, 2);
    });

    it('should handle zero amount', () => {
      const result = calculateVAT(0, 19);
      expect(result.netto).toBe(0);
      expect(result.vat).toBe(0);
    });

    it('should handle small amounts with precision', () => {
      const result = calculateVAT(1.19, 19);
      expect(result.netto).toBeCloseTo(1.00, 2);
      expect(result.vat).toBeCloseTo(0.19, 2);
    });

    it('should handle large amounts', () => {
      const result = calculateVAT(11900.00, 19);
      expect(result.netto).toBeCloseTo(10000.00, 2);
      expect(result.vat).toBeCloseTo(1900.00, 2);
    });
  });

  describe('calculateBusinessEntertainmentSplit', () => {
    describe('Customer Entertainment (geschäftlich) - 70/30 split', () => {
      it('should apply 70/30 split for customer entertainment', () => {
        const bruttoAmount = 119.00;
        const result = calculateBusinessEntertainmentSplit(bruttoAmount, 'geschäftlich');
        
        // Total should equal original amount
        expect(result.deductible + result.nonDeductible).toBeCloseTo(bruttoAmount, 2);
        
        // 70% should be deductible
        expect(result.deductible).toBeCloseTo(83.30, 2); // 70% of 119
        
        // 30% should be non-deductible
        expect(result.nonDeductible).toBeCloseTo(35.70, 2); // 30% of 119
        
        // VAT portion should also be 70%
        expect(result.deductibleVAT).toBeCloseTo(13.30, 2); // 70% of 19 VAT
      });

      it('should handle typical restaurant bill amounts', () => {
        const testCases = [
          { brutto: 238.00, expectedDeductible: 166.60, expectedNonDeductible: 71.40 },
          { brutto: 59.50, expectedDeductible: 41.65, expectedNonDeductible: 17.85 },
          { brutto: 357.00, expectedDeductible: 249.90, expectedNonDeductible: 107.10 },
        ];

        testCases.forEach(({ brutto, expectedDeductible, expectedNonDeductible }) => {
          const result = calculateBusinessEntertainmentSplit(brutto, 'geschäftlich');
          expect(result.deductible).toBeCloseTo(expectedDeductible, 2);
          expect(result.nonDeductible).toBeCloseTo(expectedNonDeductible, 2);
          expect(result.deductible + result.nonDeductible).toBeCloseTo(brutto, 2);
        });
      });

      it('should calculate correct VAT portion for 70/30 split', () => {
        const brutto = 119.00; // 100 netto + 19 VAT
        const result = calculateBusinessEntertainmentSplit(brutto, 'geschäftlich');
        
        // 70% of 19 EUR VAT = 13.30 EUR
        expect(result.deductibleVAT).toBeCloseTo(13.30, 2);
      });
    });

    describe('Employee Entertainment (betrieblich) - 100% deductible', () => {
      it('should allow 100% deduction for employee entertainment', () => {
        const bruttoAmount = 119.00;
        const result = calculateBusinessEntertainmentSplit(bruttoAmount, 'betrieblich');
        
        expect(result.deductible).toBe(bruttoAmount);
        expect(result.nonDeductible).toBe(0);
        expect(result.deductibleVAT).toBeCloseTo(19.00, 2); // Full VAT amount
      });

      it('should handle various amounts for employee entertainment', () => {
        const testAmounts = [238.00, 59.50, 357.00, 1000.00];
        
        testAmounts.forEach(amount => {
          const result = calculateBusinessEntertainmentSplit(amount, 'betrieblich');
          expect(result.deductible).toBe(amount);
          expect(result.nonDeductible).toBe(0);
          
          // Check VAT calculation
          const expectedVAT = amount - (amount / 1.19);
          expect(result.deductibleVAT).toBeCloseTo(expectedVAT, 2);
        });
      });
    });

    describe('Edge cases', () => {
      it('should handle zero amount', () => {
        const result = calculateBusinessEntertainmentSplit(0, 'geschäftlich');
        expect(result.deductible).toBe(0);
        expect(result.nonDeductible).toBe(0);
        expect(result.deductibleVAT).toBe(0);
      });

      it('should handle very small amounts', () => {
        const result = calculateBusinessEntertainmentSplit(1.19, 'geschäftlich');
        expect(result.deductible).toBeCloseTo(0.833, 2);
        expect(result.nonDeductible).toBeCloseTo(0.357, 2);
        expect(result.deductible + result.nonDeductible).toBeCloseTo(1.19, 2);
      });

      it('should maintain precision for large amounts', () => {
        const largeAmount = 9999.99;
        const result = calculateBusinessEntertainmentSplit(largeAmount, 'geschäftlich');
        expect(result.deductible + result.nonDeductible).toBeCloseTo(largeAmount, 2);
        expect(result.deductible).toBeCloseTo(largeAmount * 0.7, 2);
      });
    });

    describe('German formatting integration', () => {
      it('should work with German decimal format', () => {
        const germanAmount = '119,00';
        const amount = parseGermanDecimal(germanAmount);
        const result = calculateBusinessEntertainmentSplit(amount, 'geschäftlich');
        
        const formattedDeductible = formatGermanDecimal(result.deductible);
        const formattedNonDeductible = formatGermanDecimal(result.nonDeductible);
        
        expect(formattedDeductible).toBe('83,30');
        expect(formattedNonDeductible).toBe('35,70');
      });
    });
  });
});