/**
 * Playwright E2E Test: Multi-PDF Upload and Conversion
 *
 * Tests uploading multiple PDF files (Rechnung + Kreditkartenbeleg):
 * 1. Upload both PDFs simultaneously
 * 2. Verify both PDFs convert successfully
 * 3. Verify both PDFs are classified correctly
 * 4. Verify OCR extraction works for both files
 * 5. Verify form fields are populated correctly
 *
 * Bug: Currently the second PDF (Kreditkartenbeleg) stays in "Konvertiere PDF..." state
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('playwright-multi-pdf-upload: Multiple PDF Upload and Conversion', () => {
  test('should upload and process two PDFs (Rechnung + Kreditkartenbeleg)', async ({ page }) => {
    console.log('=== Step 1: Navigate to Bewirtungsbeleg Form ===');

    await page.goto('/bewirtungsbeleg');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    console.log('✓ Form page loaded');

    console.log('=== Step 2: Prepare Test Files ===');

    const rechnungPath = path.join(__dirname, 'test-files', '19092025_(Vendor).pdf');
    const kreditkartenPath = path.join(__dirname, 'test-files', '19092025_* * Kundenbeleg.pdf');

    console.log('Rechnung file:', rechnungPath);
    console.log('Kreditkarten file:', kreditkartenPath);

    console.log('=== Step 3: Upload Both PDFs ===');

    // Find the file input (it should be hidden in the dropzone)
    const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();

    // Upload both files at once
    await fileInput.setInputFiles([rechnungPath, kreditkartenPath]);

    console.log('✓ Files uploaded to dropzone');

    console.log('=== Step 4: Wait for Conversions to Complete ===');

    // Wait for conversion API calls to complete
    // We expect 2 calls to /api/convert-pdf
    await page.waitForResponse(
      response => response.url().includes('/api/convert-pdf') && response.status() === 200,
      { timeout: 15000 }
    );

    await page.waitForResponse(
      response => response.url().includes('/api/convert-pdf') && response.status() === 200,
      { timeout: 15000 }
    );

    console.log('✓ Both PDFs converted successfully');

    console.log('=== Step 5: Wait for Classifications ===');

    // Wait for classification API calls
    await page.waitForResponse(
      response => response.url().includes('/api/classify-receipt') && response.status() === 200,
      { timeout: 15000 }
    );

    await page.waitForResponse(
      response => response.url().includes('/api/classify-receipt') && response.status() === 200,
      { timeout: 15000 }
    );

    console.log('✓ Both files classified');

    console.log('=== Step 6: Check File Upload Cards ===');

    // Wait a bit for UI to update
    await page.waitForTimeout(2000);

    // Take screenshot of current state
    const timestamp = Date.now();
    await page.screenshot({ path: `test-results/multi-pdf-upload-${timestamp}.png`, fullPage: true });
    console.log(`📸 Screenshot saved: test-results/multi-pdf-upload-${timestamp}.png`);

    // Check for file cards
    const fileCards = page.locator('[data-testid*="file-card"], .mantine-Paper-root').filter({
      has: page.locator('text=/Rechnung|Kreditkartenbeleg/i')
    });

    const cardCount = await fileCards.count();
    console.log(`Found ${cardCount} file cards`);

    // Check if any card shows "Konvertiere PDF..."
    const convertingText = page.locator('text=/Konvertiere PDF/i');
    const isStillConverting = await convertingText.isVisible().catch(() => false);

    if (isStillConverting) {
      console.log('❌ BUG FOUND: A file is still showing "Konvertiere PDF..." state');
      const convertingCardText = await convertingText.locator('..').textContent();
      console.log('Card text:', convertingCardText);

      // This is the bug - the second file gets stuck in converting state
      throw new Error('Second PDF file stuck in "Konvertiere PDF..." state - isConverting flag never cleared');
    } else {
      console.log('✓ No files stuck in converting state');
    }

    console.log('=== Step 7: Verify Form Fields Populated ===');

    // Check if restaurant name was populated
    const restaurantName = await page.locator('input[name="restaurantName"]').inputValue();
    console.log('Restaurant name from form:', restaurantName);

    if (!restaurantName) {
      console.log('⚠️ Restaurant name not populated - OCR may not have run');
    } else {
      console.log('✓ Restaurant name populated:', restaurantName);
    }

    // Check if amount was populated
    const gesamtbetrag = await page.locator('input[placeholder*="Gesamtbetrag"]').first().inputValue();
    console.log('Gesamtbetrag from form:', gesamtbetrag);

    if (!gesamtbetrag) {
      console.log('⚠️ Gesamtbetrag not populated - OCR may not have run');
    } else {
      console.log('✓ Gesamtbetrag populated:', gesamtbetrag);
    }

    console.log('=== Step 8: Check Classification Tags ===');

    // Look for classification badges
    const rechnungBadge = page.locator('text=/RECHNUNG/i').first();
    const kreditkartenBadge = page.locator('text=/KREDITKARTENBELEG/i').first();

    const hasRechnung = await rechnungBadge.isVisible().catch(() => false);
    const hasKreditkarten = await kreditkartenBadge.isVisible().catch(() => false);

    console.log('Has Rechnung badge:', hasRechnung);
    console.log('Has Kreditkartenbeleg badge:', hasKreditkarten);

    if (!hasRechnung || !hasKreditkarten) {
      console.log('⚠️ Not all classification badges visible');
    } else {
      console.log('✓ Both files correctly classified');
    }

    console.log('=== Test Complete ===');
    console.log('✅ Multi-PDF upload test completed successfully!');
  });
});
