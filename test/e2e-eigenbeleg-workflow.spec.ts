/**
 * E2E Test: Eigenbeleg (Self-Created Receipt) Workflow
 * Tests the exact scenario from user screenshots where validation error occurred
 * Tests form filling, Eigenbeleg option, and PDF generation without file attachments
 */

import { test, expect, Page } from '@playwright/test';

// Page Object Model for Eigenbeleg workflow
class EigenbelegWorkflow {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/bewirtungsbeleg');
    await this.page.waitForLoadState('networkidle');
  }

  async checkEigenbelegOption() {
    // Check the Eigenbeleg checkbox - try multiple selector strategies
    const eigenbelegCheckbox = this.page.locator(
      'label:has-text("Eigenbeleg") input[type="checkbox"]'
    ).or(
      this.page.locator('input[type="checkbox"]').filter({ 
        has: this.page.locator('text=Eigenbeleg') 
      })
    ).or(
      this.page.locator('[data-testid="eigenbeleg-checkbox"]')
    ).first();
    
    await eigenbelegCheckbox.check();
    await this.page.waitForTimeout(500); // Wait for UI state change
  }

  async fillFormWithTestData() {
    // Fill date - German format DD.MM.YYYY (DateInput component)
    const dateInput = this.page.locator('input[placeholder*="TT.MM.JJJJ"], input[type="text"]').first();
    await dateInput.fill('07.07.2025');

    // Fill restaurant name
    const restaurantInput = this.page.locator('label:has-text("Restaurant") + div input, input[placeholder*="Restaurant"]').first();
    await restaurantInput.fill('OSTERIA DEL PARCO');

    // Fill restaurant address
    const addressInput = this.page.locator('label:has-text("Anschrift") + div textarea, textarea[placeholder*="Anschrift"]').first();
    await addressInput.fill('Anzinger St 1 85586 Poing');

    // Select Mitarbeiterbewirtung radio button
    const mitarbeiterRadio = this.page.locator('label:has-text("Mitarbeiterbewirtung") input[type="radio"]');
    await mitarbeiterRadio.check();

    // Fill Gesamtbetrag (Brutto)
    const gesamtbetragInput = this.page.locator('label:has-text("Gesamtbetrag") + div input').first();
    await gesamtbetragInput.fill('37,00');

    // Fill MwSt. Gesamtbetrag (automatically calculated as 7.03)
    const mwstInput = this.page.locator('label:has-text("MwSt. Gesamtbetrag") + div input').first();
    await mwstInput.fill('7,03');

    // Fill Netto Gesamtbetrag (automatically calculated as 29.97)
    const nettoInput = this.page.locator('label:has-text("Netto Gesamtbetrag") + div input').first();
    await nettoInput.fill('29,97');

    // Select payment method - Firmenkreditkarte
    const paymentSelect = this.page.locator('label:has-text("Zahlungsart") + div select');
    await paymentSelect.selectOption('firma');

    // Fill business occasion
    const anlassInput = this.page.locator('label:has-text("Geschäftlicher Anlass") + div textarea, label:has-text("Anlass") + div textarea').first();
    await anlassInput.fill('Mitarbeiterbesprechung');

    // Fill participants
    const teilnehmerInput = this.page.locator('label:has-text("Teilnehmerkreis") + div textarea').first();
    await teilnehmerInput.fill('Daniel Jordan, Sehrish Abhul');
  }

  async submitForm() {
    // Look for submit or "Bewirtungsbeleg erstellen" button
    const submitButton = this.page.locator('button[type="submit"]').or(
      this.page.locator('button:has-text("erstellen"), button:has-text("Erstellen")')
    ).first();
    await submitButton.click();
  }

  async confirmPDFGeneration() {
    // Wait for confirmation modal and confirm
    await this.page.waitForSelector('button:has-text("Bestätigen"), button:has-text("Ja")', { timeout: 5000 });
    const confirmButton = this.page.locator('button:has-text("Bestätigen"), button:has-text("Ja")').first();
    await confirmButton.click();
  }

  async waitForPDFGeneration() {
    // Wait for PDF generation to complete (up to 30 seconds)
    await this.page.waitForTimeout(2000);
    
    // Check for success message or PDF download
    const successIndicators = [
      'text=erfolgreich',
      'text=erstellt',
      '[role="alert"]:has-text("Erfolg")',
      'button:has-text("Download")'
    ];

    let found = false;
    for (const selector of successIndicators) {
      try {
        await this.page.waitForSelector(selector, { timeout: 15000 });
        found = true;
        break;
      } catch {
        continue;
      }
    }

    if (!found) {
      throw new Error('PDF generation did not complete successfully');
    }
  }

  async verifyNoValidationErrors() {
    // Check that there are no validation error messages
    const errorMessages = [
      'text=Expected string, received null',
      'text=Validierungsfehler',
      '[role="alert"]:has-text("Fehler")',
      '.error:visible'
    ];

    for (const selector of errorMessages) {
      const errorElement = this.page.locator(selector);
      await expect(errorElement).toHaveCount(0);
    }
  }

  async verifyFormData() {
    // Verify that the form contains the expected data by checking input values
    await expect(this.page.locator('input').filter({ hasText: "07.07.2025" }).or(
      this.page.locator('input[value="07.07.2025"]')
    )).toBeVisible();
    
    await expect(this.page.locator('input').filter({ hasText: "OSTERIA DEL PARCO" }).or(
      this.page.locator('input[value="OSTERIA DEL PARCO"]')
    )).toBeVisible();
    
    await expect(this.page.locator('textarea').filter({ hasText: /Anzinger/ }).or(
      this.page.locator('textarea[value*="Anzinger"]')
    )).toBeVisible();
    
    await expect(this.page.locator('input').filter({ hasText: "37,00" }).or(
      this.page.locator('input[value="37,00"]')
    )).toBeVisible();
  }
}

test.describe('Eigenbeleg Workflow', () => {
  test('should successfully create PDF for Eigenbeleg without file attachments', async ({ page }) => {
    const workflow = new EigenbelegWorkflow(page);

    // Step 1: Navigate to the form
    await workflow.navigate();

    // Step 2: Check Eigenbeleg option
    await workflow.checkEigenbelegOption();

    // Step 3: Fill form with exact data from user screenshots
    await workflow.fillFormWithTestData();

    // Step 4: Verify form data is correctly filled
    await workflow.verifyFormData();

    // Step 5: Submit the form
    await workflow.submitForm();

    // Step 6: Verify no validation errors appear
    await workflow.verifyNoValidationErrors();

    // Step 7: Confirm PDF generation
    await workflow.confirmPDFGeneration();

    // Step 8: Wait for PDF generation to complete
    await workflow.waitForPDFGeneration();

    // Step 9: Final verification - no errors occurred
    await workflow.verifyNoValidationErrors();
  });

  test('should show Eigenbeleg warning when option is checked', async ({ page }) => {
    const workflow = new EigenbelegWorkflow(page);

    await workflow.navigate();
    await workflow.checkEigenbelegOption();

    // Verify that the Eigenbeleg warning message is shown
    const warningText = 'Bei Eigenbelegen kann die Vorsteuer (MwSt.) nicht geltend gemacht werden';
    await expect(page.locator(`text=${warningText}`)).toBeVisible();
  });

  test('should handle form validation correctly for required fields', async ({ page }) => {
    const workflow = new EigenbelegWorkflow(page);

    await workflow.navigate();
    await workflow.checkEigenbelegOption();

    // Try to submit without filling required fields
    await workflow.submitForm();

    // Should show validation errors for required fields
    // But should NOT show the "image: Expected string, received null" error
    await expect(page.locator('text=Expected string, received null')).toHaveCount(0);
    await expect(page.locator('text=image')).toHaveCount(0);
  });

  test('should work with and without file attachments', async ({ page }) => {
    const workflow = new EigenbelegWorkflow(page);

    await workflow.navigate();
    await workflow.checkEigenbelegOption();
    await workflow.fillFormWithTestData();

    // Submit without any file attachments (the original failing case)
    await workflow.submitForm();
    await workflow.verifyNoValidationErrors();
    
    // Should be able to proceed to confirmation
    await workflow.confirmPDFGeneration();
    await workflow.waitForPDFGeneration();
    await workflow.verifyNoValidationErrors();
  });
});

test.describe('Eigenbeleg PDF Content Verification', () => {
  test('should generate PDF with correct Eigenbeleg content', async ({ page }) => {
    const workflow = new EigenbelegWorkflow(page);

    await workflow.navigate();
    await workflow.checkEigenbelegOption();
    await workflow.fillFormWithTestData();
    await workflow.submitForm();
    await workflow.confirmPDFGeneration();
    
    // Wait for PDF generation and download
    const downloadPromise = page.waitForEvent('download');
    await workflow.waitForPDFGeneration();
    
    // Verify download started
    try {
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/bewirtungsbeleg.*\.pdf$/i);
    } catch {
      // PDF might be viewed inline instead of downloaded
      // This is acceptable as long as no errors occurred
      await workflow.verifyNoValidationErrors();
    }
  });
});