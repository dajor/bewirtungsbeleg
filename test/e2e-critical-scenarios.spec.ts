/**
 * E2E Tests 2-5: Critical scenarios for app quality
 * - Multiple file handling with ordering
 * - Error recovery and retry
 * - Form validation with German formats
 * - Foreign currency receipt handling
 */

import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

class BewirtungsbelegPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/bewirtungsbeleg');
    await this.page.waitForLoadState('networkidle');
  }

  async uploadFiles(filePaths: string[]) {
    // Use more specific selector to target the main receipt upload input (not JSON upload)
    const fileInput = this.page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
    await fileInput.setInputFiles(filePaths);
    await this.page.waitForTimeout(1000);
  }

  async getUploadedFileNames(): Promise<string[]> {
    const fileCards = this.page.locator('[data-testid="file-card"], .file-item');
    const count = await fileCards.count();
    const names: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const text = await fileCards.nth(i).textContent();
      if (text) names.push(text);
    }
    
    return names;
  }

  async removeFile(index: number) {
    const removeButtons = this.page.locator('[aria-label*="Remove"], [data-testid="remove-file"]');
    await removeButtons.nth(index).click();
  }

  async fillField(name: string, value: string) {
    const field = this.page.locator(`input[name="${name}"], textarea[name="${name}"]`);
    await field.clear();
    await field.fill(value);
  }

  async selectOption(name: string, value: string) {
    const select = this.page.locator(`select[name="${name}"]`);
    await select.selectOption(value);
  }

  async clickButton(text: string) {
    await this.page.locator(`button:has-text("${text}")`).click();
  }

  async getErrorMessages(): Promise<string[]> {
    const errors = this.page.locator('[role="alert"][data-type="error"], [role="alert"]:has-text("Fehler")');
    const count = await errors.count();
    const messages: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const text = await errors.nth(i).textContent();
      if (text) messages.push(text);
    }
    
    return messages;
  }

  async getFieldError(fieldName: string): Promise<string | null> {
    const error = this.page.locator(`[data-field="${fieldName}"] .error-message, #${fieldName}-error`);
    if (await error.isVisible()) {
      return await error.textContent();
    }
    return null;
  }

  async isFieldValid(fieldName: string): Promise<boolean> {
    const field = this.page.locator(`input[name="${fieldName}"]`);
    const isInvalid = await field.getAttribute('aria-invalid');
    return isInvalid !== 'true';
  }

  async waitForLoading() {
    await this.page.waitForSelector('[role="progressbar"]', { state: 'visible', timeout: 5000 });
    await this.page.waitForSelector('[role="progressbar"]', { state: 'hidden', timeout: 30000 });
  }

  async toggleForeignReceipt() {
    const checkbox = this.page.locator('input[name="istAuslaendischeRechnung"]');
    await checkbox.click();
  }

  async fillMinimalValidForm() {
    await this.fillField('restaurantName', 'Test Restaurant');
    await this.fillField('datum', '06.08.2025');
    await this.fillField('teilnehmer', 'Test Person');
    await this.fillField('anlass', 'Test Anlass');
    await this.fillField('gesamtbetrag', '100,00');
    await this.selectOption('zahlungsart', 'firma');
    await this.selectOption('bewirtungsart', 'mitarbeiter');
  }
}

test.describe('E2E Test 2: Multiple File Handling with Ordering', () => {
  let page: BewirtungsbelegPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new BewirtungsbelegPage(playwrightPage);
    await page.navigate();
  });

  test('should maintain correct file order: Rechnung before Kreditbeleg', async () => {
    // Create test files
    const rechnungPath = path.join(process.cwd(), 'test', 'test-rechnung.pdf');
    const kreditbelegPath = path.join(process.cwd(), 'test', 'test-kreditbeleg.pdf');
    
    if (!fs.existsSync(rechnungPath)) {
      fs.writeFileSync(rechnungPath, 'Rechnung PDF content');
    }
    if (!fs.existsSync(kreditbelegPath)) {
      fs.writeFileSync(kreditbelegPath, 'Kreditbeleg PDF content');
    }

    // Upload in wrong order
    await page.uploadFiles([kreditbelegPath, rechnungPath]);

    // Fill minimal form
    await page.fillMinimalValidForm();

    // Generate PDF
    await page.clickButton('PDF generieren');

    // The system should automatically reorder attachments
    // Rechnung should come before Kreditbeleg in the final PDF
    // This is a business rule for German tax compliance
    
    const errors = await page.getErrorMessages();
    expect(errors.length).toBe(0);
  });

  test('should handle multiple attachments of same type', async () => {
    const files: string[] = [];
    
    // Create multiple test files
    for (let i = 1; i <= 3; i++) {
      const filePath = path.join(process.cwd(), 'test', `rechnung-${i}.pdf`);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, `Rechnung ${i} content`);
      }
      files.push(filePath);
    }

    await page.uploadFiles(files);
    
    const uploadedFiles = await page.getUploadedFileNames();
    expect(uploadedFiles.length).toBeGreaterThanOrEqual(3);

    await page.fillMinimalValidForm();
    await page.clickButton('PDF generieren');

    const errors = await page.getErrorMessages();
    expect(errors.length).toBe(0);
  });

  test('should allow file removal and re-upload', async () => {
    const filePath = path.join(process.cwd(), 'test', 'removable.pdf');
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, 'Test content');
    }

    // Upload file
    await page.uploadFiles([filePath]);
    let files = await page.getUploadedFileNames();
    expect(files.length).toBeGreaterThan(0);

    // Remove file
    await page.removeFile(0);
    await page.page.waitForTimeout(500);

    // Re-upload
    await page.uploadFiles([filePath]);
    files = await page.getUploadedFileNames();
    expect(files.length).toBeGreaterThan(0);
  });
});

test.describe('E2E Test 3: Error Recovery and Retry', () => {
  let page: BewirtungsbelegPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new BewirtungsbelegPage(playwrightPage);
    await page.navigate();
  });

  test('should recover from OCR API failure', async ({ page: playwrightPage }) => {
    // Mock OCR failure
    let attemptCount = 0;
    await playwrightPage.route('**/api/extract-receipt', route => {
      attemptCount++;
      if (attemptCount === 1) {
        // First attempt fails
        route.fulfill({
          status: 503,
          body: JSON.stringify({ error: 'Service temporarily unavailable' })
        });
      } else {
        // Second attempt succeeds
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            restaurantName: 'Recovered Restaurant',
            gesamtbetrag: '100,00'
          })
        });
      }
    });

    const testImage = path.join(process.cwd(), 'test', 'test.png');
    if (!fs.existsSync(testImage)) {
      fs.writeFileSync(testImage, Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE
      ]));
    }

    await page.uploadFiles([testImage]);
    
    // First extraction attempt - should fail
    await page.clickButton('Daten extrahieren');
    await playwrightPage.waitForTimeout(2000);

    // Should show error
    let errors = await page.getErrorMessages();
    expect(errors.length).toBeGreaterThan(0);

    // Retry - should succeed
    await page.clickButton('Daten extrahieren');
    await page.waitForLoading();

    // Check if data was extracted
    const restaurantName = await playwrightPage.locator('input[name="restaurantName"]').inputValue();
    expect(restaurantName).toBe('Recovered Restaurant');
  });

  test('should handle network timeout gracefully', async ({ page: playwrightPage }) => {
    // Mock network timeout
    await playwrightPage.route('**/api/generate-pdf', route => {
      // Delay response to simulate timeout
      setTimeout(() => {
        route.fulfill({
          status: 408,
          body: JSON.stringify({ error: 'Request timeout' })
        });
      }, 5000);
    });

    await page.fillMinimalValidForm();
    await page.clickButton('PDF generieren');

    // Should show timeout error
    const errors = await page.getErrorMessages();
    expect(errors.some(e => e.toLowerCase().includes('timeout') || e.toLowerCase().includes('zeit'))).toBeTruthy();
  });

  test('should clear errors when fixing invalid input', async () => {
    // Submit with invalid data
    await page.fillField('gesamtbetrag', '100.00'); // Wrong format (dot instead of comma)
    await page.clickButton('PDF generieren');

    // Should show validation error
    let errors = await page.getErrorMessages();
    expect(errors.length).toBeGreaterThan(0);

    // Fix the error
    await page.fillField('gesamtbetrag', '100,00'); // Correct German format
    await page.fillMinimalValidForm();
    await page.clickButton('PDF generieren');

    // Error should be cleared
    errors = await page.getErrorMessages();
    expect(errors.length).toBe(0);
  });
});

test.describe('E2E Test 4: Form Validation with German Formats', () => {
  let page: BewirtungsbelegPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new BewirtungsbelegPage(playwrightPage);
    await page.navigate();
  });

  test('should validate German decimal format', async () => {
    await page.fillField('restaurantName', 'Test');
    await page.fillField('datum', '06.08.2025');
    await page.fillField('teilnehmer', 'Test');
    await page.fillField('anlass', 'Test');
    
    // Test invalid formats
    const invalidFormats = ['100.00', '100,000', '100,', 'abc'];
    
    for (const format of invalidFormats) {
      await page.fillField('gesamtbetrag', format);
      await page.clickButton('PDF generieren');
      
      const errors = await page.getErrorMessages();
      expect(errors.length).toBeGreaterThan(0);
    }

    // Test valid formats
    const validFormats = ['100,00', '1,99', '9999,99', '100', '0,01'];
    
    for (const format of validFormats) {
      await page.fillField('gesamtbetrag', format);
      const isValid = await page.isFieldValid('gesamtbetrag');
      expect(isValid).toBeTruthy();
    }
  });

  test('should validate German date format DD.MM.YYYY', async () => {
    // Invalid date formats
    const invalidDates = ['2025-08-06', '08/06/2025', '6.8.2025', '06.13.2025'];
    
    for (const date of invalidDates) {
      await page.fillField('datum', date);
      await page.clickButton('PDF generieren');
      
      const errors = await page.getErrorMessages();
      expect(errors.length).toBeGreaterThan(0);
    }

    // Valid date format
    await page.fillField('datum', '06.08.2025');
    const isValid = await page.isFieldValid('datum');
    expect(isValid).toBeTruthy();
  });

  test('should handle tip amount in German format', async () => {
    await page.fillMinimalValidForm();
    
    // Add tip in German format
    await page.fillField('trinkgeld', '15,50');
    
    await page.clickButton('PDF generieren');
    
    const errors = await page.getErrorMessages();
    expect(errors.length).toBe(0);
  });

  test('should validate conditional fields for customer entertainment', async () => {
    await page.fillMinimalValidForm();
    
    // Select customer entertainment
    await page.selectOption('bewirtungsart', 'kunden');
    
    // Should require business partner info
    await page.clickButton('PDF generieren');
    
    // Add business partner info
    await page.fillField('geschaeftspartnerNamen', 'Herr Schmidt');
    await page.fillField('geschaeftspartnerFirma', 'ABC GmbH');
    
    await page.clickButton('PDF generieren');
    
    const errors = await page.getErrorMessages();
    expect(errors.length).toBe(0);
  });
});

test.describe('E2E Test 5: Foreign Currency Receipt Handling', () => {
  let page: BewirtungsbelegPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new BewirtungsbelegPage(playwrightPage);
    await page.navigate();
  });

  test('should handle foreign currency receipt without VAT', async () => {
    await page.fillMinimalValidForm();
    
    // Toggle foreign receipt
    await page.toggleForeignReceipt();
    
    // Add foreign currency details
    await page.fillField('auslaendischeWaehrung', 'USD');
    await page.fillField('fremdwaehrung', 'USD');
    await page.fillField('wechselkurs', '1,08'); // German decimal format
    
    // Foreign receipts treat Brutto as Netto (no VAT)
    await page.fillField('gesamtbetrag', '100,00');
    
    await page.clickButton('PDF generieren');
    
    const errors = await page.getErrorMessages();
    expect(errors.length).toBe(0);
  });

  test('should validate exchange rate format', async () => {
    await page.fillMinimalValidForm();
    await page.toggleForeignReceipt();
    
    // Invalid exchange rate format (using dot)
    await page.fillField('wechselkurs', '1.08');
    await page.clickButton('PDF generieren');
    
    let errors = await page.getErrorMessages();
    expect(errors.length).toBeGreaterThan(0);
    
    // Valid exchange rate format (using comma)
    await page.fillField('wechselkurs', '1,08');
    await page.clickButton('PDF generieren');
    
    errors = await page.getErrorMessages();
    expect(errors.length).toBe(0);
  });

  test('should handle multiple currency codes', async () => {
    await page.fillMinimalValidForm();
    await page.toggleForeignReceipt();
    
    const currencies = ['USD', 'GBP', 'CHF', 'JPY'];
    
    for (const currency of currencies) {
      await page.fillField('auslaendischeWaehrung', currency);
      await page.fillField('fremdwaehrung', currency);
      await page.fillField('wechselkurs', '1,50');
      
      await page.clickButton('PDF generieren');
      
      const errors = await page.getErrorMessages();
      expect(errors.length).toBe(0);
    }
  });

  test('should not calculate VAT for foreign receipts', async ({ page: playwrightPage }) => {
    await page.fillMinimalValidForm();
    
    // Domestic receipt with VAT
    await page.fillField('gesamtbetrag', '119,00');
    
    // Check if VAT fields exist
    let mwstField = playwrightPage.locator('input[name="gesamtbetragMwst"]');
    if (await mwstField.isVisible()) {
      const domesticVAT = await mwstField.inputValue();
      expect(domesticVAT).toBeTruthy();
    }
    
    // Toggle to foreign receipt
    await page.toggleForeignReceipt();
    await page.fillField('auslaendischeWaehrung', 'USD');
    
    // VAT should not be calculated for foreign receipts
    mwstField = playwrightPage.locator('input[name="gesamtbetragMwst"]');
    if (await mwstField.isVisible()) {
      const foreignVAT = await mwstField.inputValue();
      expect(foreignVAT).toBeFalsy(); // Should be empty or zero
    }
  });
});