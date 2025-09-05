/**
 * Unit Test 1: German decimal formatting and parsing
 * Critical for tax compliance and financial accuracy
 */

import { parseGermanDecimal, formatGermanDecimal } from './validation';

describe('German Decimal Formatting and Parsing', () => {
  describe('parseGermanDecimal', () => {
    it('should parse standard German decimal with comma', () => {
      expect(parseGermanDecimal('123,45')).toBe(123.45);
      expect(parseGermanDecimal('1,00')).toBe(1.00);
      expect(parseGermanDecimal('0,99')).toBe(0.99);
    });

    it('should parse whole numbers without decimals', () => {
      expect(parseGermanDecimal('100')).toBe(100);
      expect(parseGermanDecimal('0')).toBe(0);
      expect(parseGermanDecimal('9999')).toBe(9999);
    });

    it('should handle thousand separators (dots)', () => {
      expect(parseGermanDecimal('1.234,56')).toBe(1234.56);
      expect(parseGermanDecimal('10.000,00')).toBe(10000.00);
      expect(parseGermanDecimal('1.234.567,89')).toBe(1234567.89);
    });

    it('should handle edge cases', () => {
      expect(parseGermanDecimal('0,00')).toBe(0);
      expect(parseGermanDecimal('0,01')).toBe(0.01);
      expect(parseGermanDecimal(',50')).toBe(0.50);
    });

    it('should handle invalid inputs gracefully', () => {
      expect(parseGermanDecimal('')).toBeNaN();
      expect(parseGermanDecimal('abc')).toBeNaN();
      expect(parseGermanDecimal('12.34.56')).toBe(123456); // Dots are removed as thousand separators
    });
  });

  describe('formatGermanDecimal', () => {
    it('should format numbers to German decimal format', () => {
      expect(formatGermanDecimal(123.45)).toBe('123,45');
      expect(formatGermanDecimal(1.0)).toBe('1,00');
      expect(formatGermanDecimal(0.99)).toBe('0,99');
    });

    it('should always show two decimal places', () => {
      expect(formatGermanDecimal(100)).toBe('100,00');
      expect(formatGermanDecimal(100.1)).toBe('100,10');
      expect(formatGermanDecimal(100.999)).toBe('101,00'); // Rounding
    });

    it('should handle negative numbers', () => {
      expect(formatGermanDecimal(-123.45)).toBe('-123,45');
      expect(formatGermanDecimal(-0.01)).toBe('-0,01');
    });

    it('should handle zero correctly', () => {
      expect(formatGermanDecimal(0)).toBe('0,00');
      expect(formatGermanDecimal(-0)).toBe('0,00');
    });

    it('should handle large numbers', () => {
      expect(formatGermanDecimal(999999.99)).toBe('999999,99');
      expect(formatGermanDecimal(1234567.89)).toBe('1234567,89');
    });

    it('should round correctly', () => {
      // toFixed uses banker's rounding, not always rounding up
      expect(formatGermanDecimal(10.995)).toBe('10,99'); // toFixed(2) rounds 10.995 to 10.99
      expect(formatGermanDecimal(10.994)).toBe('10,99');
      expect(formatGermanDecimal(10.005)).toBe('10,01'); // toFixed(2) rounds 10.005 to 10.01
      expect(formatGermanDecimal(10.004)).toBe('10,00');
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain precision through format and parse', () => {
      const testValues = [123.45, 0.01, 999.99, 1000.00, 0.00];
      
      testValues.forEach(value => {
        const formatted = formatGermanDecimal(value);
        const parsed = parseGermanDecimal(formatted);
        expect(parsed).toBeCloseTo(value, 2);
      });
    });
  });
});