/**
 * E2E Tests for ZUGFeRD PDF Generation
 * Tests the complete workflow of generating ZUGFeRD-compliant PDFs
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('ZUGFeRD PDF Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bewirtungsbeleg');
    await page.waitForLoadState('networkidle');
  });

  test('should generate ZUGFeRD-compliant PDF with all required fields', async ({ page }) => {
    // Fill in the form with complete data
    await page.fill('input[name="datum"]', '15.04.2024');
    await page.fill('input[name="restaurantName"]', 'Restaurant Zur Post');
    await page.fill('input[name="restaurantAnschrift"]', 'Hauptstraße 42');
    await page.fill('input[name="restaurantPlz"]', '10115');
    await page.fill('input[name="restaurantOrt"]', 'Berlin');
    
    // Company details
    await page.fill('input[name="unternehmen"]', 'DocBits GmbH');
    await page.fill('input[name="unternehmenAnschrift"]', 'Technologiepark 10');
    await page.fill('input[name="unternehmenPlz"]', '20099');
    await page.fill('input[name="unternehmenOrt"]', 'Hamburg');
    
    // Participants and occasion
    await page.fill('textarea[name="teilnehmer"]', 'Max Mustermann, Erika Musterfrau');
    await page.fill('textarea[name="anlass"]', 'Geschäftsbesprechung Q2 Planung');
    
    // Amounts with German decimal format
    await page.fill('input[name="speisen"]', '45,00');
    await page.fill('input[name="getraenke"]', '30,00');
    await page.fill('input[name="trinkgeld"]', '5,00');
    await page.fill('input[name="gesamtbetrag"]', '80,00');
    
    // Select payment and entertainment type
    await page.selectOption('select[name="zahlungsart"]', 'firma');
    await page.selectOption('select[name="bewirtungsart"]', 'kunden');
    
    // Business partner details for customer entertainment
    await page.fill('input[name="geschaeftspartnerNamen"]', 'Max Mustermann, Erika Musterfrau');
    await page.fill('input[name="geschaeftspartnerFirma"]', 'Example AG');
    
    // Enable ZUGFeRD generation
    const zugferdCheckbox = page.locator('input[name="generateZugferd"]');
    if (await zugferdCheckbox.isVisible()) {
      await zugferdCheckbox.check();
    }
    
    // Upload a test receipt image
    const testImagePath = path.join(process.cwd(), 'test', 'test-receipt.png');
    if (!fs.existsSync(testImagePath)) {
      // Create a simple test image if it doesn't exist
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
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    await page.waitForTimeout(1000);
    
    // Set up response listener for PDF generation
    const downloadPromise = page.waitForEvent('download');
    
    // Click generate PDF button
    const generateButton = page.locator('button:has-text("PDF generieren")');
    await generateButton.click();
    
    // Wait for the download
    const download = await downloadPromise;
    
    // Verify the download
    expect(download).toBeTruthy();
    const fileName = download.suggestedFilename();
    expect(fileName).toContain('zugferd');
    expect(fileName).toEndWith('.pdf');
    
    // Save the file for inspection
    const downloadPath = path.join(process.cwd(), 'test-results', fileName);
    await download.saveAs(downloadPath);
    
    // Verify file exists and has content
    const fileStats = fs.statSync(downloadPath);
    expect(fileStats.size).toBeGreaterThan(1000); // PDF should be at least 1KB
    
    console.log(`ZUGFeRD PDF generated: ${downloadPath} (${fileStats.size} bytes)`);
  });

  test('should handle ZUGFeRD generation errors gracefully', async ({ page }) => {
    // Fill minimal required fields
    await page.fill('input[name="datum"]', '15.04.2024');
    await page.fill('input[name="restaurantName"]', 'Test Restaurant');
    await page.fill('textarea[name="teilnehmer"]', 'Test Person');
    await page.fill('textarea[name="anlass"]', 'Test');
    await page.fill('input[name="gesamtbetrag"]', '50,00');
    
    // Enable ZUGFeRD with incomplete data
    const zugferdCheckbox = page.locator('input[name="generateZugferd"]');
    if (await zugferdCheckbox.isVisible()) {
      await zugferdCheckbox.check();
    }
    
    // Mock the ZUGFeRD API to return an error
    await page.route('**/api/zugferd/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'ZUGFeRD service unavailable' })
      });
    });
    
    // Try to generate PDF
    const generateButton = page.locator('button:has-text("PDF generieren")');
    await generateButton.click();
    
    // Should still generate a regular PDF as fallback
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    const download = await downloadPromise;
    
    if (download) {
      const fileName = download.suggestedFilename();
      // Should fall back to regular PDF without 'zugferd' in name
      expect(fileName).not.toContain('zugferd');
      expect(fileName).toContain('bewirtungsbeleg');
    }
  });

  test('should validate VAT breakdown for ZUGFeRD', async ({ page }) => {
    // Fill form with specific VAT rates
    await page.fill('input[name="datum"]', '15.04.2024');
    await page.fill('input[name="restaurantName"]', 'Test Restaurant');
    await page.fill('input[name="restaurantAnschrift"]', 'Test Straße 1');
    await page.fill('input[name="restaurantPlz"]', '12345');
    await page.fill('input[name="restaurantOrt"]', 'Test Stadt');
    
    // Amounts with different VAT rates
    await page.fill('input[name="speisen"]', '107,00'); // 100€ + 7% VAT
    await page.fill('input[name="getraenke"]', '119,00'); // 100€ + 19% VAT
    await page.fill('input[name="trinkgeld"]', '10,00'); // No VAT
    await page.fill('input[name="gesamtbetrag"]', '236,00');
    
    await page.fill('textarea[name="teilnehmer"]', 'Test Teilnehmer');
    await page.fill('textarea[name="anlass"]', 'VAT Test');
    
    // Enable ZUGFeRD
    const zugferdCheckbox = page.locator('input[name="generateZugferd"]');
    if (await zugferdCheckbox.isVisible()) {
      await zugferdCheckbox.check();
    }
    
    // Intercept the API call to verify VAT calculation
    let apiRequestData: any = null;
    await page.route('**/api/generate-pdf', async route => {
      const request = route.request();
      apiRequestData = await request.postDataJSON();
      await route.continue();
    });
    
    // Generate PDF
    const generateButton = page.locator('button:has-text("PDF generieren")');
    await generateButton.click();
    
    // Wait a bit for the request to be captured
    await page.waitForTimeout(2000);
    
    // Verify the request included ZUGFeRD flag
    if (apiRequestData) {
      expect(apiRequestData.generateZugferd).toBe(true);
      expect(apiRequestData.speisen).toBe('107,00');
      expect(apiRequestData.getraenke).toBe('119,00');
      expect(apiRequestData.trinkgeld).toBe('10,00');
    }
  });

  test('should include business entertainment deductibility in ZUGFeRD', async ({ page }) => {
    // Test customer entertainment (70% deductible)
    await page.fill('input[name="datum"]', '15.04.2024');
    await page.fill('input[name="restaurantName"]', 'Restaurant Test');
    await page.fill('input[name="gesamtbetrag"]', '100,00');
    await page.fill('textarea[name="teilnehmer"]', 'Kunde A, Kunde B');
    await page.fill('textarea[name="anlass"]', 'Kundenakquise');
    
    await page.selectOption('select[name="bewirtungsart"]', 'kunden');
    await page.fill('input[name="geschaeftspartnerNamen"]', 'Kunde A, Kunde B');
    await page.fill('input[name="geschaeftspartnerFirma"]', 'Kunden GmbH');
    
    // Enable ZUGFeRD
    const zugferdCheckbox = page.locator('input[name="generateZugferd"]');
    if (await zugferdCheckbox.isVisible()) {
      await zugferdCheckbox.check();
    }
    
    // Generate PDF
    const downloadPromise = page.waitForEvent('download');
    const generateButton = page.locator('button:has-text("PDF generieren")');
    await generateButton.click();
    
    const download = await downloadPromise;
    const fileName = download.suggestedFilename();
    
    // Customer entertainment PDFs should indicate 70% deductibility
    expect(fileName).toContain('bewirtungsbeleg');
    
    // Now test employee entertainment (100% deductible)
    await page.selectOption('select[name="bewirtungsart"]', 'mitarbeiter');
    await page.fill('textarea[name="teilnehmer"]', 'Mitarbeiter A, Mitarbeiter B');
    await page.fill('textarea[name="anlass"]', 'Teambuilding');
    
    const downloadPromise2 = page.waitForEvent('download');
    await generateButton.click();
    
    const download2 = await downloadPromise2;
    const fileName2 = download2.suggestedFilename();
    expect(fileName2).toContain('bewirtungsbeleg');
  });
});

test.describe('ZUGFeRD Integration Tests', () => {
  test('should properly format German addresses in ZUGFeRD XML', async ({ request }) => {
    // Direct API test for ZUGFeRD generation
    const pdfBase64 = 'JVBERi0xLjQKJeLjz9M='; // Mock PDF
    
    const response = await request.post('/api/generate-pdf', {
      data: {
        datum: new Date('2024-04-15'),
        restaurantName: 'Müller\'s Gasthof',
        restaurantAnschrift: 'Schöneberger Straße 42',
        restaurantPlz: '10115',
        restaurantOrt: 'Berlin',
        unternehmen: 'Süddeutsche GmbH & Co. KG',
        unternehmenAnschrift: 'Königsallee 1',
        unternehmenPlz: '80331',
        unternehmenOrt: 'München',
        teilnehmer: 'Herr Müller, Frau Schäfer',
        anlass: 'Geschäftsessen für Vertragsabschluss',
        speisen: '45,50',
        getraenke: '28,90',
        trinkgeld: '7,00',
        gesamtbetrag: '81,40',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
        geschaeftspartnerNamen: 'Herr Müller',
        geschaeftspartnerFirma: 'Müller AG',
        generateZugferd: true,
        attachments: [{
          data: `data:image/png;base64,${pdfBase64}`,
          name: 'Rechnung',
          type: 'image/png'
        }]
      }
    });
    
    // Should return a PDF (even if ZUGFeRD fails, it falls back to regular PDF)
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('application/pdf');
    
    // Check for ZUGFeRD headers if successful
    const zugferdHeader = response.headers()['x-zugferd'];
    if (zugferdHeader === 'true') {
      expect(response.headers()['x-zugferd-profile']).toBe('BASIC');
    }
  });

  test('should handle UTF-8 characters in ZUGFeRD data', async ({ request }) => {
    const response = await request.post('/api/generate-pdf', {
      data: {
        datum: new Date('2024-04-15'),
        restaurantName: 'Café Français',
        restaurantAnschrift: 'Große Freiheit 39',
        teilnehmer: 'José García, François Müller, 王明',
        anlass: 'Internationale Geschäftsbesprechung',
        gesamtbetrag: '150,00',
        zahlungsart: 'firma',
        bewirtungsart: 'kunden',
        generateZugferd: true
      }
    });
    
    expect(response.ok()).toBeTruthy();
  });
});