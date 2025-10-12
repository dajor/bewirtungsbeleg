/**
 * FormDataAccumulator
 *
 * Intelligently accumulates and merges form data from multiple receipt sources (Rechnung + Kreditkartenbeleg).
 * Prevents field overwriting and ensures all financial data is preserved.
 *
 * Usage:
 * ```typescript
 * const accumulator = new FormDataAccumulator(form.values);
 * accumulator.mergeOcrData(ocrData, 'Rechnung');
 * accumulator.mergeOcrData(ocrData2, 'Kreditkartenbeleg');
 * accumulator.applyToForm(form);
 * ```
 */

interface OcrExtractedData {
  restaurantName?: string;
  restaurantAnschrift?: string;
  gesamtbetrag?: string;
  mwst?: string;
  netto?: string;
  datum?: string;
  trinkgeld?: string;
}

interface BewirtungsbelegFormData {
  datum: Date | null;
  restaurantName: string;
  restaurantAnschrift: string;
  teilnehmer: string;
  anlass: string;
  gesamtbetrag: string;
  gesamtbetragMwst: string;
  gesamtbetragNetto: string;
  trinkgeld: string;
  trinkgeldMwst: string;
  kreditkartenBetrag: string;
  zahlungsart: 'firma' | 'privat' | 'bar';
  bewirtungsart: 'kunden' | 'mitarbeiter';
  geschaeftlicherAnlass: string;
  geschaeftspartnerNamen: string;
  geschaeftspartnerFirma: string;
  istAuslaendischeRechnung: boolean;
  auslaendischeWaehrung: string;
  generateZugferd: boolean;
  istEigenbeleg: boolean;
  restaurantPlz: string;
  restaurantOrt: string;
  unternehmen: string;
  unternehmenAnschrift: string;
  unternehmenPlz: string;
  unternehmenOrt: string;
  speisen: string;
  getraenke: string;
}

export class FormDataAccumulator {
  private accumulated: Partial<BewirtungsbelegFormData>;

  constructor(initialValues: BewirtungsbelegFormData) {
    // Start with current form values to preserve user edits
    this.accumulated = { ...initialValues };
  }

  /**
   * Merge OCR-extracted data based on classification type
   */
  mergeOcrData(data: OcrExtractedData, classificationType: string): void {
    console.log(`[FormDataAccumulator] Merging OCR data for ${classificationType}:`, data);

    // Convert amounts from German format (51,90) to English format (51.90)
    const gesamtbetrag = data.gesamtbetrag ? data.gesamtbetrag.replace(',', '.') : '';
    const mwst = data.mwst ? data.mwst.replace(',', '.') : '';
    const netto = data.netto ? data.netto.replace(',', '.') : '';
    const trinkgeld = data.trinkgeld ? data.trinkgeld.replace(',', '.') : '';

    // Calculate missing financial values
    let finalGesamtbetrag = gesamtbetrag;
    let finalMwst = mwst;
    let finalNetto = netto;

    if (gesamtbetrag && mwst && !netto) {
      finalNetto = (Number(gesamtbetrag) - Number(mwst)).toFixed(2);
    } else if (gesamtbetrag && netto && !mwst) {
      finalMwst = (Number(gesamtbetrag) - Number(netto)).toFixed(2);
    } else if (mwst && netto && !gesamtbetrag) {
      finalGesamtbetrag = (Number(mwst) + Number(netto)).toFixed(2);
    }

    // Always update restaurant info if provided (overwrites previous value)
    if (data.restaurantName) {
      this.accumulated.restaurantName = data.restaurantName;
    }

    if (data.restaurantAnschrift) {
      this.accumulated.restaurantAnschrift = data.restaurantAnschrift;
    }

    // Always update datum if provided (overwrites previous value)
    if (data.datum) {
      try {
        this.accumulated.datum = new Date(data.datum.split('.').reverse().join('-'));
      } catch (e) {
        console.error('[FormDataAccumulator] Error parsing date:', e);
      }
    }

    if (classificationType === 'Kreditkartenbeleg') {
      // For Kreditkartenbeleg: ONLY update kreditkartenBetrag
      // Keep all other financial fields (gesamtbetrag, mwst, netto) from Rechnung
      console.log('[FormDataAccumulator] Processing Kreditkartenbeleg - only updating kreditkartenBetrag');

      if (finalGesamtbetrag) {
        this.accumulated.kreditkartenBetrag = finalGesamtbetrag;
      }

      // Calculate trinkgeld if kreditkartenBetrag > gesamtbetrag
      if (finalGesamtbetrag && this.accumulated.gesamtbetrag) {
        const kkBetrag = Number(finalGesamtbetrag);
        const rechBetrag = Number(this.accumulated.gesamtbetrag);

        if (kkBetrag > rechBetrag) {
          const calculatedTrinkgeld = (kkBetrag - rechBetrag).toFixed(2);
          this.accumulated.trinkgeld = calculatedTrinkgeld;

          // Calculate MwSt for trinkgeld (19%)
          const trinkgeldMwst = (Number(calculatedTrinkgeld) * 0.19).toFixed(2);
          this.accumulated.trinkgeldMwst = trinkgeldMwst;

          console.log(`[FormDataAccumulator] Calculated trinkgeld: ${calculatedTrinkgeld}, MwSt: ${trinkgeldMwst}`);
        }
      }
    } else {
      // For Rechnung: Update all financial fields
      console.log('[FormDataAccumulator] Processing Rechnung - updating all financial fields');

      if (finalGesamtbetrag) {
        this.accumulated.gesamtbetrag = finalGesamtbetrag;
      }

      if (finalMwst) {
        this.accumulated.gesamtbetragMwst = finalMwst;
      }

      if (finalNetto) {
        this.accumulated.gesamtbetragNetto = finalNetto;
      }

      if (trinkgeld) {
        this.accumulated.trinkgeld = trinkgeld;

        // Calculate MwSt for trinkgeld (19%)
        const trinkgeldMwst = (Number(trinkgeld) * 0.19).toFixed(2);
        this.accumulated.trinkgeldMwst = trinkgeldMwst;
      }

      // For Rechnung, keep existing kreditkartenBetrag if it exists
      // (Don't overwrite it with Rechnung amount)

      // If kreditkartenBetrag was already set (uploaded before Rechnung), calculate trinkgeld now
      if (finalGesamtbetrag && this.accumulated.kreditkartenBetrag) {
        const rechBetrag = Number(finalGesamtbetrag);
        const kkBetrag = Number(this.accumulated.kreditkartenBetrag);

        if (kkBetrag > rechBetrag) {
          const calculatedTrinkgeld = (kkBetrag - rechBetrag).toFixed(2);
          this.accumulated.trinkgeld = calculatedTrinkgeld;

          // Calculate MwSt for trinkgeld (19%)
          const trinkgeldMwst = (Number(calculatedTrinkgeld) * 0.19).toFixed(2);
          this.accumulated.trinkgeldMwst = trinkgeldMwst;

          console.log(`[FormDataAccumulator] Calculated trinkgeld from existing kreditkartenBetrag: ${calculatedTrinkgeld}, MwSt: ${trinkgeldMwst}`);
        }
      }
    }

    console.log('[FormDataAccumulator] Accumulated values:', this.getAccumulatedValues());
  }

  /**
   * Get accumulated values
   */
  getAccumulatedValues(): Partial<BewirtungsbelegFormData> {
    return { ...this.accumulated };
  }

  /**
   * Apply accumulated values to form using setFieldValue for each field
   * This prevents race conditions and ensures each field update is atomic
   */
  applyToForm(form: any): void {
    console.log('[FormDataAccumulator] ===== STARTING APPLY TO FORM =====');
    console.log('[FormDataAccumulator] Current accumulated values:', JSON.stringify(this.accumulated, null, 2));

    const updates = this.getAccumulatedValues();

    // CRITICAL: Apply fields in specific order to prevent race conditions
    // 1. First apply all non-calculated fields
    // 2. Then apply calculated trinkgeld fields LAST
    const fieldsToApplyFirst = Object.entries(updates).filter(
      ([key]) => key !== 'trinkgeld' && key !== 'trinkgeldMwst'
    );

    // Apply non-calculated fields first
    fieldsToApplyFirst.forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        console.log(`[FormDataAccumulator] ✓ Setting ${key} = "${value}"`);
        form.setFieldValue(key, value);
      } else {
        console.log(`[FormDataAccumulator] ✗ Skipping ${key} (value: ${value})`);
      }
    });

    // CRITICAL: Always recalculate AND set trinkgeld if we have both amounts
    // This must be done AFTER all other fields to prevent being overwritten
    if (this.accumulated.gesamtbetrag && this.accumulated.kreditkartenBetrag) {
      const gesamtbetrag = Number(this.accumulated.gesamtbetrag);
      const kreditkartenBetrag = Number(this.accumulated.kreditkartenBetrag);

      if (kreditkartenBetrag > gesamtbetrag) {
        const trinkgeld = (kreditkartenBetrag - gesamtbetrag).toFixed(2);
        const trinkgeldMwst = (Number(trinkgeld) * 0.19).toFixed(2);

        console.log(`[FormDataAccumulator] 💰 RECALCULATING TRINKGELD: ${kreditkartenBetrag} - ${gesamtbetrag} = ${trinkgeld}`);
        console.log(`[FormDataAccumulator] 💰 RECALCULATING TRINKGELD MWST: ${trinkgeld} * 0.19 = ${trinkgeldMwst}`);

        // Force set these calculated values LAST (after a small delay to ensure other setFieldValue calls complete)
        setTimeout(() => {
          form.setFieldValue('trinkgeld', trinkgeld);
          form.setFieldValue('trinkgeldMwst', trinkgeldMwst);

          console.log(`[FormDataAccumulator] ✓ FORCED trinkgeld = "${trinkgeld}" (delayed)`);
          console.log(`[FormDataAccumulator] ✓ FORCED trinkgeldMwst = "${trinkgeldMwst}" (delayed)`);
        }, 100);

      } else {
        console.log(`[FormDataAccumulator] ℹ️ No tip: kreditkartenBetrag (${kreditkartenBetrag}) <= gesamtbetrag (${gesamtbetrag})`);
      }
    } else {
      console.log(`[FormDataAccumulator] ⚠️ Cannot calculate trinkgeld: gesamtbetrag=${this.accumulated.gesamtbetrag}, kreditkartenBetrag=${this.accumulated.kreditkartenBetrag}`);
    }

    console.log('[FormDataAccumulator] Form values after update (before delay):', JSON.stringify(form.values, null, 2));
    console.log('[FormDataAccumulator] ===== APPLY TO FORM COMPLETE =====');
  }

  /**
   * Validate that all critical financial fields have values
   */
  validateFinancialFields(): { isValid: boolean; missingFields: string[] } {
    const requiredFields = [
      'gesamtbetrag',
      'gesamtbetragMwst',
      'gesamtbetragNetto',
      'kreditkartenBetrag'
    ];

    const missingFields: string[] = [];

    requiredFields.forEach(field => {
      const value = this.accumulated[field as keyof BewirtungsbelegFormData];
      if (!value || value === '' || value === '0' || value === '0.00') {
        missingFields.push(field);
      }
    });

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }
}
