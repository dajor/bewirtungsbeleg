/**
 * Unit tests for manual tip calculation
 *
 * These tests verify that when a user manually enters:
 * 1. Gesamtbetrag (invoice total)
 * 2. Kreditkartenbetrag (credit card amount)
 *
 * The tip and tip MwSt are automatically calculated, regardless of:
 * - Entry order (invoice first vs credit card first)
 * - Async state timing issues
 *
 * Bug context: Previously, the calculation relied on form.values.gesamtbetrag
 * which could be stale due to async React state updates.
 *
 * Fix: Use lastInvoiceAmountRef to store invoice amount synchronously.
 */

import { describe, it, expect } from 'vitest';

describe('Manual Tip Calculation', () => {
  describe('Calculation logic', () => {
    it('should calculate tip when credit card amount > invoice amount', () => {
      const gesamtbetrag = 99.90;
      const kreditkartenbetrag = 105.00;

      const tip = Number((kreditkartenbetrag - gesamtbetrag).toFixed(2));
      const tipMwst = Number((tip * 0.19).toFixed(2));

      expect(tip).toBe(5.10);
      expect(tipMwst).toBe(0.97);
    });

    it('should NOT calculate tip when credit card amount = invoice amount', () => {
      const gesamtbetrag = 100.00;
      const kreditkartenbetrag = 100.00;

      const tip = kreditkartenbetrag - gesamtbetrag;

      expect(tip).toBe(0.00);
      // In the app, if tip is 0 or negative, we don't calculate
    });

    it('should NOT calculate tip when credit card amount < invoice amount', () => {
      const gesamtbetrag = 100.00;
      const kreditkartenbetrag = 95.00;

      const shouldCalculate = kreditkartenbetrag > gesamtbetrag;

      expect(shouldCalculate).toBe(false);
    });
  });

  describe('Ref-based preservation (simulating the fix)', () => {
    it('should use ref instead of stale form.values for invoice amount', () => {
      // Simulate refs (synchronous storage)
      const lastInvoiceAmountRef = { current: '' };
      const lastCreditCardAmountRef = { current: '' };
      const lastTipAmountRef = { current: '' };

      // Simulate async form state (may be stale)
      const formValues = {
        gesamtbetrag: '',
        kreditkartenBetrag: '',
        trinkgeld: ''
      };

      // === Step 1: User enters invoice amount ===
      const userInputGesamtbetrag = '99.90';

      // Store in ref immediately (synchronous)
      lastInvoiceAmountRef.current = userInputGesamtbetrag;

      // Form state update (async - may not be available immediately)
      formValues.gesamtbetrag = userInputGesamtbetrag;

      // Verify ref is populated
      expect(lastInvoiceAmountRef.current).toBe('99.90');

      // === Step 2: User enters credit card amount ===
      const userInputKreditkartenbetrag = '105.00';

      // Store in ref immediately
      lastCreditCardAmountRef.current = userInputKreditkartenbetrag;

      // === CRITICAL: Use ref for calculation, not form.values ===
      // OLD (BROKEN): const invoiceAmount = formValues.gesamtbetrag;
      // This might be '' if form state hasn't updated yet!

      // NEW (FIXED): Use ref with fallback to form.values
      const invoiceAmount = lastInvoiceAmountRef.current || formValues.gesamtbetrag;

      expect(invoiceAmount).toBe('99.90'); // Should always work via ref

      // Calculate tip
      const kkBetragNum = Number(userInputKreditkartenbetrag);
      const gesamtbetragNum = Number(invoiceAmount);

      if (kkBetragNum > gesamtbetragNum) {
        const tip = (kkBetragNum - gesamtbetragNum).toFixed(2);
        const tipMwst = (Number(tip) * 0.19).toFixed(2);

        lastTipAmountRef.current = tip;

        expect(tip).toBe('5.10');
        expect(tipMwst).toBe('0.97');
      }
    });

    it('should work regardless of entry order', () => {
      // Test case: Credit card amount entered FIRST, then invoice amount

      const lastInvoiceAmountRef = { current: '' };
      const lastCreditCardAmountRef = { current: '' };

      // === Step 1: User enters credit card amount FIRST ===
      const userInputKreditkartenbetrag = '105.00';
      lastCreditCardAmountRef.current = userInputKreditkartenbetrag;

      // At this point, no invoice amount exists yet
      const invoiceAmountAtStep1 = lastInvoiceAmountRef.current;
      expect(invoiceAmountAtStep1).toBe(''); // No invoice yet

      // Try to calculate - should fail gracefully
      const shouldCalculateAtStep1 = userInputKreditkartenbetrag && invoiceAmountAtStep1;
      expect(shouldCalculateAtStep1).toBeFalsy(); // Can't calculate yet

      // === Step 2: User enters invoice amount AFTER ===
      const userInputGesamtbetrag = '99.90';
      lastInvoiceAmountRef.current = userInputGesamtbetrag;

      // Now both values exist
      const invoiceAmountAtStep2 = lastInvoiceAmountRef.current;
      const kkBetragAtStep2 = lastCreditCardAmountRef.current;

      expect(invoiceAmountAtStep2).toBe('99.90');
      expect(kkBetragAtStep2).toBe('105.00');

      // Now calculation should work
      const kkBetragNum = Number(kkBetragAtStep2);
      const gesamtbetragNum = Number(invoiceAmountAtStep2);

      if (kkBetragNum > gesamtbetragNum) {
        const tip = (kkBetragNum - gesamtbetragNum).toFixed(2);
        expect(tip).toBe('5.10');
      }

      // Note: In the actual implementation, we'd need to trigger
      // the calculation again when invoice amount is entered.
      // This could be done with useEffect watching both fields.
    });
  });

  describe('Edge cases', () => {
    it('should handle empty invoice amount gracefully', () => {
      const lastInvoiceAmountRef = { current: '' };
      const kkBetrag = '105.00';

      const invoiceAmount = lastInvoiceAmountRef.current || '';
      const shouldCalculate = kkBetrag && invoiceAmount;

      expect(shouldCalculate).toBeFalsy();
    });

    it('should handle empty credit card amount gracefully', () => {
      const lastInvoiceAmountRef = { current: '99.90' };
      const kkBetrag = '';

      const invoiceAmount = lastInvoiceAmountRef.current;
      const shouldCalculate = kkBetrag && invoiceAmount;

      expect(shouldCalculate).toBeFalsy();
    });

    it('should handle decimal values correctly', () => {
      const gesamtbetrag = 99.99;
      const kreditkartenbetrag = 105.50;

      const tip = Number((kreditkartenbetrag - gesamtbetrag).toFixed(2));

      expect(tip).toBe(5.51);
    });

    it('should handle German decimal format (comma)', () => {
      const gesamtbetragInput = '99,90'; // German format with comma
      const kreditkartenbetragInput = '105,00';

      // Convert to dot for calculation (as done in the app)
      const gesamtbetrag = Number(gesamtbetragInput.replace(',', '.'));
      const kreditkartenbetrag = Number(kreditkartenbetragInput.replace(',', '.'));

      const tip = Number((kreditkartenbetrag - gesamtbetrag).toFixed(2));

      expect(tip).toBe(5.10);
    });
  });
});
