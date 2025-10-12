/**
 * Playwright E2E Test: PDF Upload and Form Validation
 *
 * Tests complete PDF upload workflow with OCR extraction:
 * 1. Authenticate using TEST_USER credentials
 * 2. Navigate to /bewirtungsbeleg page
 * 3. Upload PDF files (Rechnung and Kreditkartenbeleg)
 * 4. Wait for PDF conversion to complete
 * 5. Wait for OCR extraction and field population
 * 6. Validate all required fields are populated with valid values
 * 7. Verify calculated fields (MwSt., Netto) are correct
 * 8. Test form submission to preview page
 *
 * NOTE: This test depends on playwright-2-login.spec.ts pattern for authentication
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';

// Same test user from login tests
const TEST_USER = {
  email: 'uzylloqimwnkvwjfufeq@inbound.mailersend.net',
  password: 'Tester45%',
};

// Helper function to parse German decimal format (e.g., "51,90" -> 51.90)
function parseGermanDecimal(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.'));
}

// Helper function to wait for PDF conversion to complete
async function waitForPDFConversion(page: any, fileName: string, timeout = 30000) {
  console.log(`Waiting for PDF conversion of ${fileName}...`);

  const startTime = Date.now();

  // Wait for "Konvertiere PDF..." text to disappear
  await page.waitForFunction(
    () => {
      const convertingText = document.querySelector('text=/Konvertiere PDF/i');
      return !convertingText || !convertingText.textContent?.includes('Konvertiere PDF');
    },
    { timeout }
  );

  const elapsed = Date.now() - startTime;
  console.log(`PDF conversion completed in ${elapsed}ms`);
}

// Helper function to wait for OCR extraction
async function waitForOCRExtraction(page: any, timeout = 30000) {
  console.log('Waiting for OCR extraction to complete...');

  // Wait for the "Der Beleg wird analysiert..." notification to disappear
  const processingNotification = page.locator('text=/Der Beleg wird analysiert/i');

  if (await processingNotification.isVisible().catch(() => false)) {
    await processingNotification.waitFor({ state: 'hidden', timeout });
    console.log('OCR processing notification disappeared');
  }

  // Additional wait for form fields to be populated
  await page.waitForTimeout(2000);
}

test.describe('playwright-pdf-upload: PDF Upload and Form Validation', () => {

  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    console.log('=== Setup: Login ===');

    // Navigate to signin page
    await page.goto('/auth/anmelden');
    await page.waitForLoadState('networkidle');

    // Login with test credentials
    await page.getByTestId('login-email').fill(TEST_USER.email);
    await page.getByTestId('login-password').fill(TEST_USER.password);
    await page.getByTestId('login-submit').click();

    // Wait for redirect to bewirtungsbeleg page
    await page.waitForURL('**/bewirtungsbeleg**', { timeout: 10000 });
    console.log('Login successful, on /bewirtungsbeleg page');
  });

  test('should upload Rechnung PDF, extract data, and validate all fields', async ({ page }) => {
    console.log('=== Test: Upload Rechnung PDF ===');

    // Take initial screenshot
    await page.screenshot({
      path: `test-results/pdf-upload-rechnung-start-${Date.now()}.png`,
      fullPage: true
    });

    console.log('=== Step 1: Prepare and Upload PDF ===');

    const rechnungPath = path.join(__dirname, 'test-files', '19092025_(Vendor).pdf');
    console.log('PDF file path:', rechnungPath);

    // Find the file input in the dropzone
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles([rechnungPath]);
    console.log('File uploaded to dropzone');

    console.log('=== Step 2: Wait for PDF Conversion ===');

    // Wait for API call to convert-pdf
    try {
      const convertResponse = await page.waitForResponse(
        response => response.url().includes('/api/convert-pdf') && response.status() === 200,
        { timeout: 30000 }
      );
      console.log('PDF conversion API call completed:', convertResponse.status());
    } catch (error) {
      console.error('PDF conversion API call failed or timed out');
      await page.screenshot({
        path: `test-results/pdf-upload-conversion-error-${Date.now()}.png`,
        fullPage: true
      });
      throw error;
    }

    // Wait for "Konvertiere PDF..." indicator to disappear
    const convertingIndicator = page.locator('text=/Konvertiere PDF/i');
    if (await convertingIndicator.isVisible().catch(() => false)) {
      await convertingIndicator.waitFor({ state: 'hidden', timeout: 30000 });
      console.log('PDF conversion UI indicator cleared');
    }

    console.log('=== Step 3: Wait for Classification ===');

    // Wait for classification API call
    try {
      const classifyResponse = await page.waitForResponse(
        response => response.url().includes('/api/classify-receipt') && response.status() === 200,
        { timeout: 20000 }
      );
      const classificationData = await classifyResponse.json();
      console.log('Classification result:', classificationData);
    } catch (error) {
      console.warn('Classification API call may have failed, continuing...');
    }

    // Verify classification badge appears
    await page.waitForTimeout(2000); // Wait for UI update
    const rechnungBadge = page.locator('text=/RECHNUNG/i').first();
    const hasRechnungBadge = await rechnungBadge.isVisible().catch(() => false);
    if (hasRechnungBadge) {
      console.log('Classification badge visible: RECHNUNG');
    } else {
      console.warn('Classification badge not visible yet');
    }

    console.log('=== Step 4: Wait for OCR Extraction ===');

    // Wait for OCR extraction API call
    try {
      const extractResponse = await page.waitForResponse(
        response => response.url().includes('/api/extract-receipt') && response.status() === 200,
        { timeout: 30000 }
      );
      const extractData = await extractResponse.json();
      console.log('OCR extraction completed. Data keys:', Object.keys(extractData));
    } catch (error) {
      console.error('OCR extraction API call failed or timed out');
      await page.screenshot({
        path: `test-results/pdf-upload-ocr-error-${Date.now()}.png`,
        fullPage: true
      });
      throw error;
    }

    // Wait for processing notification to disappear
    await waitForOCRExtraction(page);

    console.log('=== Step 5: Verify All Form Fields Are Populated ===');

    // Take screenshot after OCR
    await page.screenshot({
      path: `test-results/pdf-upload-rechnung-after-ocr-${Date.now()}.png`,
      fullPage: true
    });

    // 1. Restaurant Name
    const restaurantName = await page.locator('input[placeholder*="Name des Restaurants"]').inputValue();
    console.log('Restaurant Name:', restaurantName);
    expect(restaurantName).toBeTruthy();
    expect(restaurantName.length).toBeGreaterThan(0);

    // 2. Restaurant Address
    const restaurantAddress = await page.locator('input[placeholder*="Anschrift des Restaurants"]').inputValue();
    console.log('Restaurant Address:', restaurantAddress);
    // Address might be optional, so we just log it

    // 3. Date (Datum der Bewirtung)
    const datum = await page.locator('input[placeholder*="Wählen Sie ein Datum"]').inputValue();
    console.log('Datum der Bewirtung:', datum);
    expect(datum).toBeTruthy();
    // Should be in DD.MM.YYYY format
    expect(datum).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);

    // 4. Gesamtbetrag (Brutto)
    const gesamtbetragInput = page.locator('input[placeholder*="Gesamtbetrag"]').first();
    const gesamtbetrag = await gesamtbetragInput.inputValue();
    console.log('Gesamtbetrag (Brutto):', gesamtbetrag);
    expect(gesamtbetrag).toBeTruthy();
    const gesamtbetragValue = parseGermanDecimal(gesamtbetrag);
    expect(gesamtbetragValue).toBeGreaterThan(0);
    console.log('Gesamtbetrag parsed:', gesamtbetragValue);

    // 5. MwSt. Gesamtbetrag
    const mwstGesamtInput = page.locator('input[placeholder*="MwSt. in Euro"]').first();
    const mwstGesamt = await mwstGesamtInput.inputValue();
    console.log('MwSt. Gesamtbetrag:', mwstGesamt);
    expect(mwstGesamt).toBeTruthy();
    const mwstGesamtValue = parseGermanDecimal(mwstGesamt);
    expect(mwstGesamtValue).toBeGreaterThan(0);
    console.log('MwSt. Gesamtbetrag parsed:', mwstGesamtValue);

    // 6. Netto Gesamtbetrag
    const nettoGesamtInput = page.locator('input[placeholder*="Netto in Euro"]').first();
    const nettoGesamt = await nettoGesamtInput.inputValue();
    console.log('Netto Gesamtbetrag:', nettoGesamt);
    expect(nettoGesamt).toBeTruthy();
    const nettoGesamtValue = parseGermanDecimal(nettoGesamt);
    expect(nettoGesamtValue).toBeGreaterThan(0);
    console.log('Netto Gesamtbetrag parsed:', nettoGesamtValue);

    // 7. Betrag auf Kreditkarte/Bar
    const kreditkartenBetragInput = page.locator('input[placeholder*="Betrag auf Kreditkarte/Bar"]');
    const kreditkartenBetrag = await kreditkartenBetragInput.inputValue();
    console.log('Betrag auf Kreditkarte/Bar:', kreditkartenBetrag);
    // This might be empty or have a value, depending on OCR
    if (kreditkartenBetrag) {
      const kreditkartenBetragValue = parseGermanDecimal(kreditkartenBetrag);
      console.log('Kreditkarten Betrag parsed:', kreditkartenBetragValue);
    }

    // 8. Trinkgeld
    const trinkgeldInput = page.locator('input[placeholder*="Trinkgeld in Euro"]');
    const trinkgeld = await trinkgeldInput.inputValue();
    console.log('Trinkgeld:', trinkgeld);
    // Trinkgeld might be empty, which is valid
    if (trinkgeld) {
      const trinkgeldValue = parseGermanDecimal(trinkgeld);
      console.log('Trinkgeld parsed:', trinkgeldValue);
    }

    // 9. MwSt. Trinkgeld (if Trinkgeld exists)
    if (trinkgeld && parseGermanDecimal(trinkgeld) > 0) {
      const mwstTrinkgeldInput = page.locator('input[placeholder*="MwSt. in Euro"]').nth(1);
      const mwstTrinkgeld = await mwstTrinkgeldInput.inputValue();
      console.log('MwSt. Trinkgeld:', mwstTrinkgeld);
      // Should be calculated automatically
    }

    console.log('=== Step 6: Validate Calculated Fields ===');

    // Verify MwSt. calculation is reasonable (approximately 19% of brutto)
    // Netto should be approximately 81% of brutto (100% - 19%)
    const expectedMwst = gesamtbetragValue * 0.19;
    const expectedNetto = gesamtbetragValue * 0.81;

    const mwstDiff = Math.abs(mwstGesamtValue - expectedMwst);
    const nettoDiff = Math.abs(nettoGesamtValue - expectedNetto);

    console.log('Expected MwSt (19%):', expectedMwst.toFixed(2));
    console.log('Actual MwSt:', mwstGesamtValue.toFixed(2));
    console.log('Difference:', mwstDiff.toFixed(2));

    console.log('Expected Netto (81%):', expectedNetto.toFixed(2));
    console.log('Actual Netto:', nettoGesamtValue.toFixed(2));
    console.log('Difference:', nettoDiff.toFixed(2));

    // Allow for rounding differences (max 0.10 EUR difference)
    expect(mwstDiff).toBeLessThanOrEqual(0.10);
    expect(nettoDiff).toBeLessThanOrEqual(0.10);

    // Verify Brutto = Netto + MwSt (within rounding tolerance)
    const sumNettoPlusMwst = nettoGesamtValue + mwstGesamtValue;
    const sumDiff = Math.abs(gesamtbetragValue - sumNettoPlusMwst);
    console.log('Gesamtbetrag:', gesamtbetragValue.toFixed(2));
    console.log('Netto + MwSt:', sumNettoPlusMwst.toFixed(2));
    console.log('Difference:', sumDiff.toFixed(2));
    expect(sumDiff).toBeLessThanOrEqual(0.02);

    console.log('=== Step 7: Check for Form Validation Errors ===');

    // Check if there are any validation error messages
    const errorAlerts = page.locator('[role="alert"]').filter({ hasText: /Fehler|Error/i });
    const hasErrors = await errorAlerts.count();

    if (hasErrors > 0) {
      const errorText = await errorAlerts.first().textContent();
      console.error('Form has validation errors:', errorText);
      await page.screenshot({
        path: `test-results/pdf-upload-validation-error-${Date.now()}.png`,
        fullPage: true
      });
      throw new Error(`Form validation failed: ${errorText}`);
    }

    console.log('No validation errors found');

    console.log('=== Step 8: Fill Required Business Purpose Fields ===');

    // The form requires these fields to be filled before submission
    // Fill geschäftlicher Anlass
    await page.locator('input[placeholder*="Projektbesprechung"]').fill('Test Business Meeting');
    console.log('Filled geschäftlicher Anlass');

    // Fill Teilnehmer
    await page.locator('textarea[placeholder*="Ein Teilnehmer pro Zeile"]').fill('Max Mustermann\nErika Musterfrau');
    console.log('Filled Teilnehmer');

    // Fill Geschäftspartner Namen (required for Kundenbewirtung)
    await page.locator('input[placeholder*="Namen der Geschäftspartner"]').fill('John Doe');
    console.log('Filled Geschäftspartner Namen');

    // Fill Geschäftspartner Firma
    await page.locator('input[placeholder*="Name der Firma"]').fill('Test Company GmbH');
    console.log('Filled Geschäftspartner Firma');

    // Take final screenshot before submission
    await page.screenshot({
      path: `test-results/pdf-upload-rechnung-before-submit-${Date.now()}.png`,
      fullPage: true
    });

    console.log('=== Test Complete ===');
    console.log('All fields validated successfully!');
  });

  test('should upload Kreditkartenbeleg PDF and validate credit card amount', async ({ page }) => {
    console.log('=== Test: Upload Kreditkartenbeleg PDF ===');

    console.log('=== Step 1: Upload Kreditkartenbeleg PDF ===');

    const kreditkartenPath = path.join(__dirname, 'test-files', '19092025_* * Kundenbeleg.pdf');
    console.log('PDF file path:', kreditkartenPath);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles([kreditkartenPath]);
    console.log('File uploaded to dropzone');

    console.log('=== Step 2: Wait for PDF Conversion ===');

    // Wait for conversion
    await page.waitForResponse(
      response => response.url().includes('/api/convert-pdf') && response.status() === 200,
      { timeout: 30000 }
    );

    // Wait for converting indicator to disappear
    const convertingIndicator = page.locator('text=/Konvertiere PDF/i');
    if (await convertingIndicator.isVisible().catch(() => false)) {
      await convertingIndicator.waitFor({ state: 'hidden', timeout: 30000 });
      console.log('PDF conversion completed');
    }

    console.log('=== Step 3: Verify Classification ===');

    // Wait for classification
    await page.waitForTimeout(3000);

    // Check for Kreditkartenbeleg badge
    const kreditkartenBadge = page.locator('text=/KREDITKARTENBELEG/i').first();
    const hasKreditkartenBadge = await kreditkartenBadge.isVisible().catch(() => false);

    if (hasKreditkartenBadge) {
      console.log('Classification badge visible: KREDITKARTENBELEG');
      expect(hasKreditkartenBadge).toBeTruthy();
    } else {
      console.warn('Classification badge not visible, but continuing test');
    }

    console.log('=== Step 4: Wait for OCR Extraction ===');

    // Wait for OCR extraction
    try {
      await page.waitForResponse(
        response => response.url().includes('/api/extract-receipt') && response.status() === 200,
        { timeout: 30000 }
      );
      console.log('OCR extraction completed');
    } catch (error) {
      console.error('OCR extraction may have failed');
    }

    await waitForOCRExtraction(page);

    // Take screenshot
    await page.screenshot({
      path: `test-results/pdf-upload-kreditkarten-after-ocr-${Date.now()}.png`,
      fullPage: true
    });

    console.log('=== Step 5: Validate Credit Card Amount ===');

    // For Kreditkartenbeleg, the OCR should populate kreditkartenBetrag
    const kreditkartenBetragInput = page.locator('input[placeholder*="Betrag auf Kreditkarte/Bar"]');
    const kreditkartenBetrag = await kreditkartenBetragInput.inputValue();
    console.log('Kreditkarten Betrag:', kreditkartenBetrag);

    // This should be populated
    expect(kreditkartenBetrag).toBeTruthy();
    const kreditkartenBetragValue = parseGermanDecimal(kreditkartenBetrag);
    expect(kreditkartenBetragValue).toBeGreaterThan(0);
    console.log('Kreditkarten Betrag parsed:', kreditkartenBetragValue);

    console.log('=== Test Complete ===');
    console.log('Kreditkartenbeleg validated successfully!');
  });

  test('should upload both PDFs (Rechnung + Kreditkartenbeleg) and handle multiple files', async ({ page }) => {
    console.log('=== Test: Upload Both PDFs Together ===');

    console.log('=== Step 1: Upload Both PDFs ===');

    const rechnungPath = path.join(__dirname, 'test-files', '19092025_(Vendor).pdf');
    const kreditkartenPath = path.join(__dirname, 'test-files', '19092025_* * Kundenbeleg.pdf');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles([rechnungPath, kreditkartenPath]);
    console.log('Both files uploaded to dropzone');

    console.log('=== Step 2: Wait for Both PDFs to Convert ===');

    // Wait for first conversion
    await page.waitForResponse(
      response => response.url().includes('/api/convert-pdf') && response.status() === 200,
      { timeout: 30000 }
    );
    console.log('First PDF converted');

    // Wait for second conversion
    await page.waitForResponse(
      response => response.url().includes('/api/convert-pdf') && response.status() === 200,
      { timeout: 30000 }
    );
    console.log('Second PDF converted');

    // Wait for both converting indicators to disappear
    await page.waitForTimeout(5000);

    console.log('=== Step 3: Verify Both Files Are Displayed ===');

    // Count file preview cards
    const fileCards = page.locator('[data-testid="file-preview"]');
    const fileCount = await fileCards.count();
    console.log('Number of file cards:', fileCount);
    expect(fileCount).toBe(2);

    // Check for both classification badges
    await page.waitForTimeout(3000);
    const rechnungBadge = page.locator('text=/RECHNUNG/i').first();
    const kreditkartenBadge = page.locator('text=/KREDITKARTENBELEG/i').first();

    const hasRechnung = await rechnungBadge.isVisible().catch(() => false);
    const hasKreditkarten = await kreditkartenBadge.isVisible().catch(() => false);

    console.log('Has Rechnung badge:', hasRechnung);
    console.log('Has Kreditkartenbeleg badge:', hasKreditkarten);

    // Take screenshot
    await page.screenshot({
      path: `test-results/pdf-upload-both-files-${Date.now()}.png`,
      fullPage: true
    });

    console.log('=== Step 4: Wait for OCR Extraction ===');

    // Wait a bit longer for both OCR extractions
    await page.waitForTimeout(5000);

    console.log('=== Step 5: Validate Both Files Processed ===');

    // Check that Gesamtbetrag is populated (from Rechnung)
    const gesamtbetrag = await page.locator('input[placeholder*="Gesamtbetrag"]').first().inputValue();
    console.log('Gesamtbetrag:', gesamtbetrag);
    expect(gesamtbetrag).toBeTruthy();

    // Check that Kreditkarten Betrag is populated (from Kreditkartenbeleg)
    const kreditkartenBetrag = await page.locator('input[placeholder*="Betrag auf Kreditkarte/Bar"]').inputValue();
    console.log('Kreditkarten Betrag:', kreditkartenBetrag);
    expect(kreditkartenBetrag).toBeTruthy();

    console.log('=== Test Complete ===');
    console.log('Both PDFs processed successfully!');
  });

  test('should handle form submission to preview page', async ({ page }) => {
    console.log('=== Test: Form Submission to Preview ===');

    console.log('=== Step 1: Upload PDF ===');

    const rechnungPath = path.join(__dirname, 'test-files', '19092025_(Vendor).pdf');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles([rechnungPath]);

    // Wait for conversion and OCR
    await page.waitForResponse(
      response => response.url().includes('/api/convert-pdf') && response.status() === 200,
      { timeout: 30000 }
    );

    await page.waitForTimeout(5000);

    console.log('=== Step 2: Fill All Required Fields ===');

    // Fill geschäftlicher Anlass
    await page.locator('input[placeholder*="Projektbesprechung"]').fill('Client Meeting Q4 2024');

    // Fill Teilnehmer
    await page.locator('textarea[placeholder*="Ein Teilnehmer pro Zeile"]').fill('Max Mustermann\nErika Musterfrau\nJohn Doe');

    // Fill Geschäftspartner Namen
    await page.locator('input[placeholder*="Namen der Geschäftspartner"]').fill('John Doe, Jane Smith');

    // Fill Geschäftspartner Firma
    await page.locator('input[placeholder*="Name der Firma"]').fill('ACME Corporation GmbH');

    console.log('All required fields filled');

    // Take screenshot before submission
    await page.screenshot({
      path: `test-results/pdf-upload-before-preview-${Date.now()}.png`,
      fullPage: true
    });

    console.log('=== Step 3: Submit Form ===');

    // Find and click the "Weiter" button
    const weiterButton = page.locator('button[type="submit"]', { hasText: /Weiter/i });
    await weiterButton.click();

    console.log('Clicked Weiter button');

    // Wait for navigation to preview page
    try {
      await page.waitForURL('**/vorschau**', { timeout: 10000 });
      console.log('Successfully navigated to preview page');

      // Verify we're on the preview page
      const currentUrl = page.url();
      expect(currentUrl).toContain('vorschau');

      // Take screenshot of preview page
      await page.screenshot({
        path: `test-results/pdf-upload-preview-page-${Date.now()}.png`,
        fullPage: true
      });

    } catch (error) {
      console.error('Failed to navigate to preview page');

      // Check for validation errors
      const errorAlerts = page.locator('[role="alert"]').filter({ hasText: /Fehler|Error/i });
      const hasErrors = await errorAlerts.count();

      if (hasErrors > 0) {
        const errorText = await errorAlerts.first().textContent();
        console.error('Form validation error:', errorText);
      }

      await page.screenshot({
        path: `test-results/pdf-upload-submit-error-${Date.now()}.png`,
        fullPage: true
      });

      throw error;
    }

    console.log('=== Test Complete ===');
    console.log('Form submission successful!');
  });
});
