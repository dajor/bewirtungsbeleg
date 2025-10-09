/**
 * E2E Test: Tip Calculation with Real PDFs
 * Tests automatic tip calculation when credit card amount > invoice amount
 *
 * Test Documents:
 * - test/29092025_(Vendor).pdf - Restaurant Mythos invoice (29.90 EUR)
 * - test/08102025_Bezahlung MASTERCARD.pdf - Credit card receipt (35.00 EUR)
 *
 * Expected: Trinkgeld = 35.00 - 29.90 = 5.10 EUR
 */

import { test, expect, Page } from '@playwright/test';
import * as path from 'path';

class TipCalculationWorkflow {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/bewirtungsbeleg');
    await this.page.waitForLoadState('networkidle');
  }

  async uploadFile(filePath: string, label: string) {
    console.log(`📤 Uploading ${label}: ${filePath}`);

    // Just find the first or second file input directly
    // (Rechnung is first, Kreditkarte is second)
    const fileInputs = this.page.locator('input[type="file"]');
    const index = label.includes('Rechnung') ? 0 : 1;
    const fileInput = fileInputs.nth(index);

    await fileInput.setInputFiles(filePath);
    console.log(`✅ File uploaded: ${label}`);

    // Wait a moment for file to be processed
    await this.page.waitForTimeout(500);
  }

  async clickExtractData() {
    console.log('🔍 Clicking "Daten extrahieren" button');
    const extractButton = this.page.locator('button:has-text("Daten extrahieren")');
    await expect(extractButton).toBeVisible();
    await extractButton.click();
  }

  async waitForOCRCompletion(timeout = 45000) {
    console.log('⏳ Waiting for OCR to complete...');

    // Wait for any loading indicators to appear
    try {
      await this.page.waitForSelector('text=/ANALYSIERE|Konvertiere PDF/', {
        state: 'visible',
        timeout: 5000
      });
      console.log('📊 OCR started, waiting for completion...');
    } catch (e) {
      console.log('ℹ️ No loading indicator found, OCR may have completed instantly');
    }

    // Wait for loading indicators to disappear
    await this.page.waitForSelector('text=/ANALYSIERE|Konvertiere PDF/', {
      state: 'hidden',
      timeout
    }).catch(() => {
      console.log('⚠️ Loading indicator timeout, checking if data was extracted anyway');
    });

    // Additional wait for form to update
    await this.page.waitForTimeout(1000);
    console.log('✅ OCR completed');
  }

  async getFieldValue(fieldName: string): Promise<string> {
    // Mantine forms use IDs, not names
    const field = this.page.locator(`#${fieldName}, input[id="${fieldName}"]`).first();
    const value = await field.inputValue();
    console.log(`📝 Field "${fieldName}": ${value}`);
    return value;
  }

  async setFieldValue(fieldName: string, value: string) {
    console.log(`✏️ Setting field "${fieldName}" to: ${value}`);
    // Mantine forms use IDs, not names
    const field = this.page.locator(`#${fieldName}, input[id="${fieldName}"]`).first();
    await field.clear();
    await field.fill(value);

    // Trigger blur to ensure onChange fires
    await field.blur();

    // Wait for any calculations to complete
    await this.page.waitForTimeout(500);
  }

  async getAllFormValues() {
    const values = {
      gesamtbetrag: await this.getFieldValue('gesamtbetrag'),
      gesamtbetragMwst: await this.getFieldValue('gesamtbetragMwst'),
      gesamtbetragNetto: await this.getFieldValue('gesamtbetragNetto'),
      kreditkartenBetrag: await this.getFieldValue('kreditkartenBetrag'),
      trinkgeld: await this.getFieldValue('trinkgeld'),
      trinkgeldMwst: await this.getFieldValue('trinkgeldMwst'),
    };
    console.log('📋 Current form values:', values);
    return values;
  }
}

test.describe('Tip Calculation - OCR Extraction', () => {
  let workflow: TipCalculationWorkflow;

  test.beforeEach(async ({ page }) => {
    workflow = new TipCalculationWorkflow(page);
    await workflow.navigate();
  });

  test('should auto-calculate tip after OCR extracts both invoice and credit card', async ({ page }) => {
    console.log('\n🧪 TEST: OCR Auto-calculation of tip');

    // Step 1: Upload invoice PDF
    const invoicePath = path.join(process.cwd(), 'test', '29092025_(Vendor).pdf');
    await workflow.uploadFile(invoicePath, 'Rechnung hochladen');

    // Step 2: Upload credit card PDF
    const creditCardPath = path.join(process.cwd(), 'test', '08102025_Bezahlung MASTERCARD.pdf');
    await workflow.uploadFile(creditCardPath, 'Kreditkarte hochladen');

    // Step 3: Click extract data button
    await workflow.clickExtractData();

    // Step 4: Wait for OCR to complete
    await workflow.waitForOCRCompletion();

    // Step 5: Check all extracted values
    const values = await workflow.getAllFormValues();

    // Verify invoice data
    console.log('\n✅ Verifying invoice data:');
    expect(parseFloat(values.gesamtbetrag.replace(',', '.'))).toBeCloseTo(29.90, 2);
    expect(parseFloat(values.gesamtbetragMwst.replace(',', '.'))).toBeCloseTo(4.77, 2);
    expect(parseFloat(values.gesamtbetragNetto.replace(',', '.'))).toBeCloseTo(25.13, 2);

    // Verify credit card data
    console.log('\n✅ Verifying credit card data:');
    expect(parseFloat(values.kreditkartenBetrag.replace(',', '.'))).toBeCloseTo(35.00, 2);

    // Verify tip calculation (THIS IS THE KEY TEST!)
    console.log('\n✅ Verifying tip calculation:');
    const expectedTip = 5.10; // 35.00 - 29.90
    const actualTip = parseFloat(values.trinkgeld.replace(',', '.'));

    expect(actualTip).toBeCloseTo(expectedTip, 2);

    // Verify tip MwSt (19%)
    const expectedTipMwst = 0.97; // 5.10 * 0.19
    const actualTipMwst = parseFloat(values.trinkgeldMwst.replace(',', '.'));

    expect(actualTipMwst).toBeCloseTo(expectedTipMwst, 2);

    console.log('\n🎉 All tip calculations verified successfully!');
  });
});

test.describe('Tip Calculation - Manual Entry', () => {
  let workflow: TipCalculationWorkflow;

  test.beforeEach(async ({ page }) => {
    workflow = new TipCalculationWorkflow(page);
    await workflow.navigate();
  });

  test('should auto-calculate tip when manually entering credit card amount', async ({ page }) => {
    console.log('\n🧪 TEST: Manual entry tip calculation');

    // Step 1: Upload invoice PDF only
    const invoicePath = path.join(process.cwd(), 'test', '29092025_(Vendor).pdf');
    await workflow.uploadFile(invoicePath, 'Rechnung hochladen');

    // Step 2: Click extract data button
    await workflow.clickExtractData();

    // Step 3: Wait for OCR to complete
    await workflow.waitForOCRCompletion();

    // Step 4: Verify invoice data was extracted
    let values = await workflow.getAllFormValues();
    console.log('\n✅ Invoice data extracted:');
    expect(parseFloat(values.gesamtbetrag.replace(',', '.'))).toBeCloseTo(29.90, 2);

    // Step 5: Manually enter credit card amount
    console.log('\n✏️ Manually entering credit card amount: 35.00');
    await workflow.setFieldValue('kreditkartenBetrag', '35.00');

    // Step 6: Wait a moment for onChange handler to fire
    await page.waitForTimeout(1000);

    // Step 7: Verify tip was calculated
    values = await workflow.getAllFormValues();

    console.log('\n✅ Verifying tip calculation after manual entry:');
    const expectedTip = 5.10; // 35.00 - 29.90
    const actualTip = parseFloat(values.trinkgeld.replace(',', '.'));

    expect(actualTip).toBeCloseTo(expectedTip, 2);

    // Verify tip MwSt (19%)
    const expectedTipMwst = 0.97; // 5.10 * 0.19
    const actualTipMwst = parseFloat(values.trinkgeldMwst.replace(',', '.'));

    expect(actualTipMwst).toBeCloseTo(expectedTipMwst, 2);

    console.log('\n🎉 Manual entry tip calculation verified successfully!');
  });

  test('should handle German decimal format (comma separator)', async ({ page }) => {
    console.log('\n🧪 TEST: German decimal format with comma');

    // Step 1: Manually set invoice amount
    await workflow.setFieldValue('gesamtbetrag', '29,90');

    // Step 2: Manually enter credit card amount with comma
    await workflow.setFieldValue('kreditkartenBetrag', '35,00');

    // Wait for calculation
    await page.waitForTimeout(1000);

    // Step 3: Verify tip calculation works with German format
    const values = await workflow.getAllFormValues();

    const actualTip = parseFloat(values.trinkgeld.replace(',', '.'));
    expect(actualTip).toBeCloseTo(5.10, 2);

    console.log('\n🎉 German decimal format works correctly!');
  });

  test('should not calculate tip when credit card amount < invoice amount', async ({ page }) => {
    console.log('\n🧪 TEST: No tip when credit card < invoice');

    // Step 1: Set invoice amount
    await workflow.setFieldValue('gesamtbetrag', '50.00');

    // Step 2: Enter smaller credit card amount (partial payment)
    await workflow.setFieldValue('kreditkartenBetrag', '40.00');

    // Wait for handler to fire
    await page.waitForTimeout(1000);

    // Step 3: Verify tip field is empty
    const values = await workflow.getAllFormValues();

    expect(values.trinkgeld).toBe('');
    expect(values.trinkgeldMwst).toBe('');

    console.log('\n✅ Correctly did not calculate tip for partial payment!');
  });

  test('should not calculate tip when amounts are equal', async ({ page }) => {
    console.log('\n🧪 TEST: No tip when amounts are equal');

    // Step 1: Set invoice amount
    await workflow.setFieldValue('gesamtbetrag', '30.00');

    // Step 2: Enter exact same credit card amount
    await workflow.setFieldValue('kreditkartenBetrag', '30.00');

    // Wait for handler to fire
    await page.waitForTimeout(1000);

    // Step 3: Verify tip field is empty
    const values = await workflow.getAllFormValues();

    expect(values.trinkgeld).toBe('');
    expect(values.trinkgeldMwst).toBe('');

    console.log('\n✅ Correctly did not calculate tip for exact payment!');
  });
});

test.describe('Tip Calculation - Reverse Flow', () => {
  let workflow: TipCalculationWorkflow;

  test.beforeEach(async ({ page }) => {
    workflow = new TipCalculationWorkflow(page);
    await workflow.navigate();
  });

  test('should calculate credit card amount when entering tip manually', async ({ page }) => {
    console.log('\n🧪 TEST: Calculate credit card from tip entry');

    // Step 1: Set invoice amount
    await workflow.setFieldValue('gesamtbetrag', '29.90');

    // Step 2: Enter tip amount
    await workflow.setFieldValue('trinkgeld', '5.10');

    // Wait for calculation
    await page.waitForTimeout(1000);

    // Step 3: Verify credit card amount was calculated
    const values = await workflow.getAllFormValues();

    const expectedCreditCard = 35.00; // 29.90 + 5.10
    const actualCreditCard = parseFloat(values.kreditkartenBetrag.replace(',', '.'));

    expect(actualCreditCard).toBeCloseTo(expectedCreditCard, 2);

    console.log('\n🎉 Reverse calculation (tip → credit card) works!');
  });
});
