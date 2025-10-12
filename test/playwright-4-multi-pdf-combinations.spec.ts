/**
 * Playwright E2E Test: Multi-PDF Upload - All 4 Combinations
 *
 * Tests all upload order combinations to ensure NO fields are ever cleared:
 * 1. Vendor (Rechnung) first, then Kundenbeleg (Kreditkartenbeleg)
 * 2. Kundenbeleg (Kreditkartenbeleg) first, then Vendor (Rechnung)
 * 3. Vendor first, wait 20 seconds, then Kundenbeleg
 * 4. Kundenbeleg first, wait 20 seconds, then Vendor
 *
 * All tests verify these fields are populated:
 * - Gesamtbetrag (Brutto)
 * - MwSt. Gesamtbetrag
 * - Netto Gesamtbetrag
 * - Betrag auf Kreditkarte/Bar
 * - Trinkgeld
 * - MwSt. Trinkgeld
 *
 * CRITICAL: This test runs before every deployment and git push
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to verify all required fields are populated
async function verifyAllFieldsPopulated(page: any) {
  console.log('=== Verifying All Required Fields Are Populated ===');

  // Use data-path attributes from Mantine NumberInput components
  // These are more reliable than ARIA labels for form field selection
  const gesamtbetrag = await page.locator('[data-path="gesamtbetrag"]').inputValue();
  const gesamtbetragMwst = await page.locator('[data-path="gesamtbetragMwst"]').inputValue();
  const gesamtbetragNetto = await page.locator('[data-path="gesamtbetragNetto"]').inputValue();
  const kreditkartenBetrag = await page.locator('[data-path="kreditkartenBetrag"]').inputValue();
  const trinkgeld = await page.locator('[data-path="trinkgeld"]').inputValue();
  const trinkgeldMwst = await page.locator('[data-path="trinkgeldMwst"]').inputValue();

  console.log('Field Values:');
  console.log('  Gesamtbetrag (Brutto):', gesamtbetrag);
  console.log('  MwSt. Gesamtbetrag:', gesamtbetragMwst);
  console.log('  Netto Gesamtbetrag:', gesamtbetragNetto);
  console.log('  Betrag auf Kreditkarte/Bar:', kreditkartenBetrag);
  console.log('  Trinkgeld:', trinkgeld);
  console.log('  MwSt. Trinkgeld:', trinkgeldMwst);

  // CRITICAL: Verify all fields have non-empty values
  // This is the KEY requirement - NO fields should EVER be cleared
  expect(gesamtbetrag, 'Gesamtbetrag (Brutto) should be populated').not.toBe('');
  expect(gesamtbetragMwst, 'MwSt. Gesamtbetrag should be populated').not.toBe('');
  expect(gesamtbetragNetto, 'Netto Gesamtbetrag should be populated').not.toBe('');
  expect(kreditkartenBetrag, 'Betrag auf Kreditkarte/Bar should be populated').not.toBe('');
  expect(trinkgeld, 'Trinkgeld should be populated').not.toBe('');
  expect(trinkgeldMwst, 'MwSt. Trinkgeld should be populated').not.toBe('');

  // Verify values are numeric
  expect(parseFloat(gesamtbetrag), 'Gesamtbetrag should be a valid number').toBeGreaterThan(0);
  expect(parseFloat(gesamtbetragMwst), 'MwSt should be a valid number').toBeGreaterThan(0);
  expect(parseFloat(gesamtbetragNetto), 'Netto should be a valid number').toBeGreaterThan(0);
  expect(parseFloat(kreditkartenBetrag), 'Kreditkarten should be a valid number').toBeGreaterThan(0);
  expect(parseFloat(trinkgeld), 'Trinkgeld should be a valid number').toBeGreaterThan(0);
  expect(parseFloat(trinkgeldMwst), 'Trinkgeld MwSt should be a valid number').toBeGreaterThan(0);

  console.log('✅ All fields verified successfully!');

  return {
    gesamtbetrag,
    gesamtbetragMwst,
    gesamtbetragNetto,
    kreditkartenBetrag,
    trinkgeld,
    trinkgeldMwst
  };
}

// Helper function to upload a file and wait for processing
async function uploadAndWaitForProcessing(page: any, filePath: string, fileType: string) {
  console.log(`=== Uploading ${fileType}: ${filePath} ===`);

  // Start listening for responses BEFORE uploading
  const conversionPromise = page.waitForResponse(
    (response: any) => response.url().includes('/api/convert-pdf') && response.status() === 200,
    { timeout: 30000 }
  );

  const classificationPromise = page.waitForResponse(
    (response: any) => response.url().includes('/api/classify-receipt') && response.status() === 200,
    { timeout: 30000 }
  );

  const extractionPromise = page.waitForResponse(
    (response: any) => response.url().includes('/api/extract-receipt') && response.status() === 200,
    { timeout: 30000 }
  );

  // Now upload the file
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles([filePath]);

  console.log(`✓ ${fileType} uploaded`);

  // Wait for conversion API to complete
  await conversionPromise;
  console.log(`✓ ${fileType} converted`);

  // Wait for classification API to complete
  await classificationPromise;
  console.log(`✓ ${fileType} classified`);

  // Wait for OCR extraction API to complete
  await extractionPromise;
  console.log(`✓ ${fileType} OCR extraction completed`);

  // CRITICAL: Wait only 200ms (reduced from 1000ms) to verify immediate population
  // This shorter wait ensures we catch timing issues early
  await page.waitForTimeout(200);

  // Verify trinkgeld fields are populated immediately (for debugging)
  const trinkgeld = await page.locator('[data-path="trinkgeld"]').inputValue();
  const trinkgeldMwst = await page.locator('[data-path="trinkgeldMwst"]').inputValue();

  console.log(`  → Trinkgeld after OCR: "${trinkgeld}"`);
  console.log(`  → Trinkgeld MwSt after OCR: "${trinkgeldMwst}"`);

  // Take screenshot if trinkgeld is empty (debugging)
  if (!trinkgeld || trinkgeld === '') {
    const timestamp = Date.now();
    await page.screenshot({
      path: `test-results/trinkgeld-empty-after-${fileType}-${timestamp}.png`,
      fullPage: true
    });
    console.warn(`⚠️ WARNING: Trinkgeld is empty immediately after OCR! Screenshot saved.`);
  }
}

test.describe('playwright-4-multi-pdf-combinations: Critical Multi-PDF Upload Tests', () => {
  const rechnungPath = path.join(__dirname, 'test-files', '19092025_(Vendor).pdf');
  const kreditkartenPath = path.join(__dirname, 'test-files', '19092025_* * Kundenbeleg.pdf');

  // Set timeout to 2 minutes for each test (20s wait + upload processing)
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    console.log('=== Navigate to Bewirtungsbeleg Form ===');
    await page.goto('/bewirtungsbeleg');
    await page.waitForLoadState('networkidle');
    console.log('✓ Form page loaded');
  });

  test('Test 1: Vendor (Rechnung) first, then Kundenbeleg (Kreditkartenbeleg)', async ({ page }) => {
    console.log('\n🧪 TEST 1: Vendor → Kundenbeleg (Normal Order)\n');

    // Upload Vendor (Rechnung) first
    await uploadAndWaitForProcessing(page, rechnungPath, 'Vendor (Rechnung)');

    // Upload Kundenbeleg (Kreditkartenbeleg) second
    await uploadAndWaitForProcessing(page, kreditkartenPath, 'Kundenbeleg (Kreditkartenbeleg)');

    // Take screenshot for verification
    const timestamp = Date.now();
    await page.screenshot({ path: `test-results/test1-vendor-then-kundenbeleg-${timestamp}.png`, fullPage: true });

    // Verify all fields are populated
    const values = await verifyAllFieldsPopulated(page);

    // CRITICAL: Verify specific expected values for trinkgeld calculation
    expect(values.trinkgeld).toBe('2.10');
    expect(values.trinkgeldMwst).toBe('0.40');

    // CRITICAL: Test form validation (simulates "Weiter" button click)
    console.log('=== Testing Form Validation ===');

    // Fill required non-financial fields to enable form submission
    await page.locator('[data-path="teilnehmer"]').fill('Test Teilnehmer');
    await page.locator('[data-path="geschaeftlicherAnlass"]').fill('Test Geschäftlicher Anlass');

    // Try to click "Weiter" button
    const weiterButton = page.getByRole('button', { name: /weiter/i });
    await expect(weiterButton).toBeEnabled();

    console.log('✅ Form validation passed - Weiter button is enabled');

    console.log('\n✅ TEST 1 PASSED: All fields correctly populated and validation passed!\n');
  });

  test('Test 2: Kundenbeleg (Kreditkartenbeleg) first, then Vendor (Rechnung)', async ({ page }) => {
    console.log('\n🧪 TEST 2: Kundenbeleg → Vendor (Reverse Order)\n');

    // Upload Kundenbeleg (Kreditkartenbeleg) first
    await uploadAndWaitForProcessing(page, kreditkartenPath, 'Kundenbeleg (Kreditkartenbeleg)');

    // Upload Vendor (Rechnung) second
    await uploadAndWaitForProcessing(page, rechnungPath, 'Vendor (Rechnung)');

    // Take screenshot for verification
    const timestamp = Date.now();
    await page.screenshot({ path: `test-results/test2-kundenbeleg-then-vendor-${timestamp}.png`, fullPage: true });

    // Verify all fields are populated
    const values = await verifyAllFieldsPopulated(page);

    // CRITICAL: Verify specific expected values (most common bug scenario)
    expect(values.trinkgeld).toBe('2.10');
    expect(values.trinkgeldMwst).toBe('0.40');

    // CRITICAL: Test form validation
    await page.locator('[data-path="teilnehmer"]').fill('Test Teilnehmer');
    await page.locator('[data-path="geschaeftlicherAnlass"]').fill('Test Geschäftlicher Anlass');

    const weiterButton = page.getByRole('button', { name: /weiter/i });
    await expect(weiterButton).toBeEnabled();

    console.log('✅ Form validation passed - Weiter button is enabled');

    console.log('\n✅ TEST 2 PASSED: All fields correctly populated and validation passed!\n');
  });

  test('Test 3: Vendor first, wait 20 seconds, then Kundenbeleg', async ({ page }) => {
    console.log('\n🧪 TEST 3: Vendor → Wait 20s → Kundenbeleg (Delayed Upload)\n');

    // Upload Vendor (Rechnung) first
    await uploadAndWaitForProcessing(page, rechnungPath, 'Vendor (Rechnung)');

    console.log('⏳ Waiting 20 seconds before uploading Kundenbeleg...');
    await page.waitForTimeout(20000);
    console.log('✓ 20 second wait completed');

    // Upload Kundenbeleg (Kreditkartenbeleg) after delay
    await uploadAndWaitForProcessing(page, kreditkartenPath, 'Kundenbeleg (Kreditkartenbeleg)');

    // Take screenshot for verification
    const timestamp = Date.now();
    await page.screenshot({ path: `test-results/test3-vendor-wait-kundenbeleg-${timestamp}.png`, fullPage: true });

    // Verify all fields are populated
    const values = await verifyAllFieldsPopulated(page);

    // CRITICAL: Verify trinkgeld calculation works even with delayed upload
    expect(values.trinkgeld).toBe('2.10');
    expect(values.trinkgeldMwst).toBe('0.40');

    // CRITICAL: Test form validation
    await page.locator('[data-path="teilnehmer"]').fill('Test Teilnehmer');
    await page.locator('[data-path="geschaeftlicherAnlass"]').fill('Test Geschäftlicher Anlass');

    const weiterButton = page.getByRole('button', { name: /weiter/i });
    await expect(weiterButton).toBeEnabled();

    console.log('✅ Form validation passed - Weiter button is enabled');

    console.log('\n✅ TEST 3 PASSED: All fields correctly populated and validation passed!\n');
  });

  test('Test 4: Kundenbeleg first, wait 20 seconds, then Vendor', async ({ page }) => {
    console.log('\n🧪 TEST 4: Kundenbeleg → Wait 20s → Vendor (Delayed Reverse Order)\n');

    // Upload Kundenbeleg (Kreditkartenbeleg) first
    await uploadAndWaitForProcessing(page, kreditkartenPath, 'Kundenbeleg (Kreditkartenbeleg)');

    console.log('⏳ Waiting 20 seconds before uploading Vendor...');
    await page.waitForTimeout(20000);
    console.log('✓ 20 second wait completed');

    // Upload Vendor (Rechnung) after delay
    await uploadAndWaitForProcessing(page, rechnungPath, 'Vendor (Rechnung)');

    // Take screenshot for verification
    const timestamp = Date.now();
    await page.screenshot({ path: `test-results/test4-kundenbeleg-wait-vendor-${timestamp}.png`, fullPage: true });

    // Verify all fields are populated
    const values = await verifyAllFieldsPopulated(page);

    // CRITICAL: This is the most problematic scenario - verify it works
    expect(values.trinkgeld).toBe('2.10');
    expect(values.trinkgeldMwst).toBe('0.40');

    // CRITICAL: Test form validation
    await page.locator('[data-path="teilnehmer"]').fill('Test Teilnehmer');
    await page.locator('[data-path="geschaeftlicherAnlass"]').fill('Test Geschäftlicher Anlass');

    const weiterButton = page.getByRole('button', { name: /weiter/i });
    await expect(weiterButton).toBeEnabled();

    console.log('✅ Form validation passed - Weiter button is enabled');

    console.log('\n✅ TEST 4 PASSED: All fields correctly populated and validation passed!\n');
  });
});
