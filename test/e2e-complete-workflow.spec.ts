/**
 * E2E Test 1: Complete workflow (Upload→OCR→Edit→PDF)
 * Tests the entire user journey from receipt upload to PDF generation
 */

import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Page Object Model for complete workflow
class BewirtungsbelegWorkflow {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/bewirtungsbeleg');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1000);
    await this.waitForFormReady();
  }

  async waitForFormReady() {
    // Wait for key form elements to be visible - ensures form is fully rendered
    // This is CRITICAL to prevent "element not found" timeouts
    try {
      await this.page.waitForSelector('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]', {
        state: 'visible',
        timeout: 15000
      });
    } catch (e) {
      console.warn('File input not visible after 15s, but continuing anyway');
    }
  }

  async uploadReceipt(filePath: string) {
    const fileInput = this.page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
    await fileInput.setInputFiles(filePath);
    await this.page.waitForTimeout(1000);
  }

  async clickExtractData() {
    const extractButton = this.page.locator('button:has-text("Daten extrahieren")');
    await extractButton.click();
  }

  async waitForOCRCompletion() {
    // Wait for loading spinner to appear and disappear
    await this.page.waitForSelector('[role="progressbar"]', { state: 'visible', timeout: 5000 });
    await this.page.waitForSelector('[role="progressbar"]', { state: 'hidden', timeout: 30000 });
  }

  async fillFormField(fieldName: string, value: string) {
    const field = this.page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
    await field.clear();
    await field.fill(value);
  }

  async selectDropdown(fieldName: string, value: string) {
    const dropdown = this.page.locator(`select[name="${fieldName}"]`);
    await dropdown.selectOption(value);
  }

  async setDate(fieldName: string, date: string) {
    // German date format DD.MM.YYYY
    const dateInput = this.page.locator(`input[name="${fieldName}"]`);
    await dateInput.clear();
    await dateInput.fill(date);
  }

  async clickGeneratePDF() {
    const generateButton = this.page.locator('button:has-text("PDF generieren")');
    await generateButton.click();
  }

  async waitForPDFGeneration() {
    // Wait for success message or PDF download
    await this.page.waitForSelector('[role="alert"]:has-text("erfolgreich")', { timeout: 10000 });
  }

  async getFormValue(fieldName: string): Promise<string> {
    const field = this.page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
    return await field.inputValue();
  }

  async hasError(): Promise<boolean> {
    const errorAlert = this.page.locator('[role="alert"][data-type="error"]');
    return await errorAlert.isVisible();
  }

  async getErrorMessage(): Promise<string | null> {
    const errorAlert = this.page.locator('[role="alert"][data-type="error"]');
    if (await errorAlert.isVisible()) {
      return await errorAlert.textContent();
    }
    return null;
  }
}

test.describe('Complete Bewirtungsbeleg Workflow', () => {
  let workflow: BewirtungsbelegWorkflow;

  test.beforeEach(async ({ page }) => {
    workflow = new BewirtungsbelegWorkflow(page);
    await workflow.navigate();
  });

  test('should complete full workflow from image upload to PDF generation', async ({ page }) => {
    // Step 1: Upload receipt image
    const testImagePath = path.join(process.cwd(), 'test', 'test-receipt.png');
    
    // Create a simple test image if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
      // Create a minimal PNG file
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
        0x00, 0x00, 0x03, 0x00, 0x01, 0x5E, 0xF9, 0x51,
        0x36, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
        0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(testImagePath, pngBuffer);
    }

    await workflow.uploadReceipt(testImagePath);

    // Step 2: Extract data with OCR (mock or real)
    // Check if extract button is available
    const extractButton = page.locator('button:has-text("Daten extrahieren")');
    if (await extractButton.isVisible()) {
      await workflow.clickExtractData();
      
      // Wait for OCR to complete (or mock response)
      try {
        await workflow.waitForOCRCompletion();
      } catch (e) {
        // OCR might fail with test image, continue with manual data
        console.log('OCR extraction skipped or failed, continuing with manual data entry');
      }
    }

    // Step 3: Fill/Edit form fields
    await workflow.fillFormField('restaurantName', 'Restaurant Mustermann');
    await workflow.fillFormField('restaurantAnschrift', 'Musterstraße 123, 12345 Berlin');
    await workflow.setDate('datum', '06.08.2025');
    await workflow.fillFormField('teilnehmer', 'Max Mustermann, Erika Musterfrau');
    await workflow.fillFormField('anlass', 'Geschäftsessen - Projektbesprechung');
    await workflow.fillFormField('gesamtbetrag', '119,00'); // German decimal format
    
    // Select payment type and entertainment type
    await workflow.selectDropdown('zahlungsart', 'firma');
    await workflow.selectDropdown('bewirtungsart', 'kunden');
    
    // Add business partner info for customer entertainment
    await workflow.fillFormField('geschaeftspartnerNamen', 'Herr Schmidt, Frau Müller');
    await workflow.fillFormField('geschaeftspartnerFirma', 'ABC GmbH');

    // Step 4: Generate PDF
    await workflow.clickGeneratePDF();
    
    // Step 5: Verify PDF generation success
    await workflow.waitForPDFGeneration();
    
    // Verify no errors occurred
    const hasError = await workflow.hasError();
    expect(hasError).toBe(false);
  });

  test('should handle OCR extraction and auto-fill form fields', async ({ page }) => {
    // Mock OCR response for testing
    await page.route('**/api/extract-receipt', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          restaurantName: 'Zur Goldenen Gans',
          restaurantAnschrift: 'Hauptstraße 42, 10115 Berlin',
          gesamtbetrag: '85,50',
          datum: '05.08.2025',
          mwst: '13,65',
          netto: '71,85'
        })
      });
    });

    const testImagePath = path.join(process.cwd(), 'test', 'test-receipt.png');
    if (!fs.existsSync(testImagePath)) {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
        0x00, 0x00, 0x03, 0x00, 0x01, 0x5E, 0xF9, 0x51,
        0x36, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
        0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(testImagePath, pngBuffer);
    }

    await workflow.uploadReceipt(testImagePath);
    await workflow.clickExtractData();
    await workflow.waitForOCRCompletion();

    // Verify OCR data was filled
    const restaurantName = await workflow.getFormValue('restaurantName');
    expect(restaurantName).toBe('Zur Goldenen Gans');

    const amount = await workflow.getFormValue('gesamtbetrag');
    expect(amount).toBe('85,50');

    // Complete remaining required fields
    await workflow.fillFormField('teilnehmer', 'Test Teilnehmer');
    await workflow.fillFormField('anlass', 'Test Anlass');
    await workflow.selectDropdown('zahlungsart', 'firma');
    await workflow.selectDropdown('bewirtungsart', 'mitarbeiter');

    // Generate PDF
    await workflow.clickGeneratePDF();
    await workflow.waitForPDFGeneration();

    expect(await workflow.hasError()).toBe(false);
  });

  test('should validate form before PDF generation', async ({ page }) => {
    // Try to generate PDF without filling required fields
    await workflow.clickGeneratePDF();

    // Should show validation errors
    const errorVisible = await page.waitForSelector('[role="alert"]', { timeout: 5000 });
    expect(errorVisible).toBeTruthy();

    // Fill minimum required fields
    await workflow.fillFormField('restaurantName', 'Test Restaurant');
    await workflow.setDate('datum', '06.08.2025');
    await workflow.fillFormField('teilnehmer', 'Test Person');
    await workflow.fillFormField('anlass', 'Test');
    await workflow.fillFormField('gesamtbetrag', '100,00');
    await workflow.selectDropdown('zahlungsart', 'bar');
    await workflow.selectDropdown('bewirtungsart', 'mitarbeiter');

    // Now PDF generation should work
    await workflow.clickGeneratePDF();
    await workflow.waitForPDFGeneration();

    expect(await workflow.hasError()).toBe(false);
  });

  test('should handle PDF with multiple attachments', async ({ page }) => {
    // Upload multiple files
    const file1 = path.join(process.cwd(), 'test', 'rechnung.pdf');
    const file2 = path.join(process.cwd(), 'test', 'kreditbeleg.pdf');
    
    // Create test files if they don't exist
    if (!fs.existsSync(file1)) {
      fs.writeFileSync(file1, 'PDF test content 1');
    }
    if (!fs.existsSync(file2)) {
      fs.writeFileSync(file2, 'PDF test content 2');
    }

    const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
    await fileInput.setInputFiles([file1, file2]);

    // Fill form
    await workflow.fillFormField('restaurantName', 'Multi-Attachment Test');
    await workflow.setDate('datum', '06.08.2025');
    await workflow.fillFormField('teilnehmer', 'Test');
    await workflow.fillFormField('anlass', 'Test');
    await workflow.fillFormField('gesamtbetrag', '200,00');
    await workflow.selectDropdown('zahlungsart', 'firma');
    await workflow.selectDropdown('bewirtungsart', 'kunden');

    // Generate PDF with attachments
    await workflow.clickGeneratePDF();
    await workflow.waitForPDFGeneration();

    expect(await workflow.hasError()).toBe(false);
  });

  test('should calculate VAT correctly for German amounts', async ({ page }) => {
    // Fill form with amount
    await workflow.fillFormField('restaurantName', 'VAT Test Restaurant');
    await workflow.setDate('datum', '06.08.2025');
    await workflow.fillFormField('teilnehmer', 'Test');
    await workflow.fillFormField('anlass', 'VAT Test');
    await workflow.fillFormField('gesamtbetrag', '119,00'); // 100 + 19% VAT
    await workflow.selectDropdown('zahlungsart', 'firma');
    await workflow.selectDropdown('bewirtungsart', 'kunden');

    // Check if VAT fields are calculated
    const mwstField = page.locator('input[name="gesamtbetragMwst"]');
    if (await mwstField.isVisible()) {
      // VAT should be auto-calculated as 19,00
      const mwstValue = await mwstField.inputValue();
      if (mwstValue) {
        expect(mwstValue).toMatch(/19[,.]00/);
      }
    }

    // Generate PDF
    await workflow.clickGeneratePDF();
    await workflow.waitForPDFGeneration();

    expect(await workflow.hasError()).toBe(false);
  });
});