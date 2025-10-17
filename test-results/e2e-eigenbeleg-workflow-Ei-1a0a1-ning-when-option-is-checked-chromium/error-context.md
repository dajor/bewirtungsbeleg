# Test info

- Name: Eigenbeleg Workflow >> should show Eigenbeleg warning when option is checked
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-eigenbeleg-workflow.spec.ts:186:3

# Error details

```
Error: locator.check: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('label:has-text("Eigenbeleg") input[type="checkbox"]').or(locator('input[type="checkbox"]').filter({ has: locator('text=Eigenbeleg') })).or(locator('[data-testid="eigenbeleg-checkbox"]')).first()

    at EigenbelegWorkflow.checkEigenbelegOption (/Users/daniel/dev/Bewritung/bewir/test/e2e-eigenbeleg-workflow.spec.ts:30:30)
    at /Users/daniel/dev/Bewritung/bewir/test/e2e-eigenbeleg-workflow.spec.ts:190:20
```

# Page snapshot

```yaml
- alert
- dialog:
  - heading "Build Error" [level=1]
  - paragraph: Failed to compile
  - text: Next.js (14.2.29) is outdated
  - link "(learn more)":
    - /url: https://nextjs.org/docs/messages/version-staleness
  - link "./src/lib/opensearch.ts:8:1":
    - text: ./src/lib/opensearch.ts:8:1
    - img
  - text: "Module not found: Can't resolve '@opensearch-project/opensearch' 6 | */ 7 | > 8 | import { Client } from '@opensearch-project/opensearch'; | ^ 9 | // AWS Sigv4 Signer requires aws-sdk v2, which conflicts with our AWS SDK v3 usage 10 | // If you need AWS OpenSearch, install aws-sdk separately or use basic auth 11 | // import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';"
  - link "https://nextjs.org/docs/messages/module-not-found":
    - /url: https://nextjs.org/docs/messages/module-not-found
  - text: "Import trace for requested module:"
  - link "./src/middleware/ensure-user-index.ts":
    - text: ./src/middleware/ensure-user-index.ts
    - img
  - link "./src/lib/auth.ts":
    - text: ./src/lib/auth.ts
    - img
  - link "./src/app/api/auth/[...nextauth]/route.ts":
    - text: ./src/app/api/auth/[...nextauth]/route.ts
    - img
  - contentinfo:
    - paragraph: This error occurred during the build process and can only be dismissed by fixing the error.
```

# Test source

```ts
   1 | /**
   2 |  * E2E Test: Eigenbeleg (Self-Created Receipt) Workflow
   3 |  * Tests the exact scenario from user screenshots where validation error occurred
   4 |  * Tests form filling, Eigenbeleg option, and PDF generation without file attachments
   5 |  */
   6 |
   7 | import { test, expect, Page } from '@playwright/test';
   8 |
   9 | // Page Object Model for Eigenbeleg workflow
   10 | class EigenbelegWorkflow {
   11 |   constructor(private page: Page) {}
   12 |
   13 |   async navigate() {
   14 |     await this.page.goto('/bewirtungsbeleg');
   15 |     await this.page.waitForLoadState('networkidle');
   16 |   }
   17 |
   18 |   async checkEigenbelegOption() {
   19 |     // Check the Eigenbeleg checkbox - try multiple selector strategies
   20 |     const eigenbelegCheckbox = this.page.locator(
   21 |       'label:has-text("Eigenbeleg") input[type="checkbox"]'
   22 |     ).or(
   23 |       this.page.locator('input[type="checkbox"]').filter({ 
   24 |         has: this.page.locator('text=Eigenbeleg') 
   25 |       })
   26 |     ).or(
   27 |       this.page.locator('[data-testid="eigenbeleg-checkbox"]')
   28 |     ).first();
   29 |     
>  30 |     await eigenbelegCheckbox.check();
      |                              ^ Error: locator.check: Test timeout of 60000ms exceeded.
   31 |     await this.page.waitForTimeout(500); // Wait for UI state change
   32 |   }
   33 |
   34 |   async fillFormWithTestData() {
   35 |     // Fill date - German format DD.MM.YYYY (DateInput component)
   36 |     const dateInput = this.page.locator('input[placeholder*="TT.MM.JJJJ"], input[type="text"]').first();
   37 |     await dateInput.fill('07.07.2025');
   38 |
   39 |     // Fill restaurant name
   40 |     const restaurantInput = this.page.locator('label:has-text("Restaurant") + div input, input[placeholder*="Restaurant"]').first();
   41 |     await restaurantInput.fill('OSTERIA DEL PARCO');
   42 |
   43 |     // Fill restaurant address
   44 |     const addressInput = this.page.locator('label:has-text("Anschrift") + div textarea, textarea[placeholder*="Anschrift"]').first();
   45 |     await addressInput.fill('Anzinger St 1 85586 Poing');
   46 |
   47 |     // Select Mitarbeiterbewirtung radio button
   48 |     const mitarbeiterRadio = this.page.locator('label:has-text("Mitarbeiterbewirtung") input[type="radio"]');
   49 |     await mitarbeiterRadio.check();
   50 |
   51 |     // Fill Gesamtbetrag (Brutto)
   52 |     const gesamtbetragInput = this.page.locator('label:has-text("Gesamtbetrag") + div input').first();
   53 |     await gesamtbetragInput.fill('37,00');
   54 |
   55 |     // Fill MwSt. Gesamtbetrag (automatically calculated as 7.03)
   56 |     const mwstInput = this.page.locator('label:has-text("MwSt. Gesamtbetrag") + div input').first();
   57 |     await mwstInput.fill('7,03');
   58 |
   59 |     // Fill Netto Gesamtbetrag (automatically calculated as 29.97)
   60 |     const nettoInput = this.page.locator('label:has-text("Netto Gesamtbetrag") + div input').first();
   61 |     await nettoInput.fill('29,97');
   62 |
   63 |     // Select payment method - Firmenkreditkarte
   64 |     const paymentSelect = this.page.locator('label:has-text("Zahlungsart") + div select');
   65 |     await paymentSelect.selectOption('firma');
   66 |
   67 |     // Fill business occasion
   68 |     const anlassInput = this.page.locator('label:has-text("Geschäftlicher Anlass") + div textarea, label:has-text("Anlass") + div textarea').first();
   69 |     await anlassInput.fill('Mitarbeiterbesprechung');
   70 |
   71 |     // Fill participants
   72 |     const teilnehmerInput = this.page.locator('label:has-text("Teilnehmerkreis") + div textarea').first();
   73 |     await teilnehmerInput.fill('Daniel Jordan, Sehrish Abhul');
   74 |   }
   75 |
   76 |   async submitForm() {
   77 |     // Look for submit or "Bewirtungsbeleg erstellen" button
   78 |     const submitButton = this.page.locator('button[type="submit"]').or(
   79 |       this.page.locator('button:has-text("erstellen"), button:has-text("Erstellen")')
   80 |     ).first();
   81 |     await submitButton.click();
   82 |   }
   83 |
   84 |   async confirmPDFGeneration() {
   85 |     // Wait for confirmation modal and confirm
   86 |     await this.page.waitForSelector('button:has-text("Bestätigen"), button:has-text("Ja")', { timeout: 5000 });
   87 |     const confirmButton = this.page.locator('button:has-text("Bestätigen"), button:has-text("Ja")').first();
   88 |     await confirmButton.click();
   89 |   }
   90 |
   91 |   async waitForPDFGeneration() {
   92 |     // Wait for PDF generation to complete (up to 30 seconds)
   93 |     await this.page.waitForTimeout(2000);
   94 |     
   95 |     // Check for success message or PDF download
   96 |     const successIndicators = [
   97 |       'text=erfolgreich',
   98 |       'text=erstellt',
   99 |       '[role="alert"]:has-text("Erfolg")',
  100 |       'button:has-text("Download")'
  101 |     ];
  102 |
  103 |     let found = false;
  104 |     for (const selector of successIndicators) {
  105 |       try {
  106 |         await this.page.waitForSelector(selector, { timeout: 15000 });
  107 |         found = true;
  108 |         break;
  109 |       } catch {
  110 |         continue;
  111 |       }
  112 |     }
  113 |
  114 |     if (!found) {
  115 |       throw new Error('PDF generation did not complete successfully');
  116 |     }
  117 |   }
  118 |
  119 |   async verifyNoValidationErrors() {
  120 |     // Check that there are no validation error messages
  121 |     const errorMessages = [
  122 |       'text=Expected string, received null',
  123 |       'text=Validierungsfehler',
  124 |       '[role="alert"]:has-text("Fehler")',
  125 |       '.error:visible'
  126 |     ];
  127 |
  128 |     for (const selector of errorMessages) {
  129 |       const errorElement = this.page.locator(selector);
  130 |       await expect(errorElement).toHaveCount(0);
```