# Test info

- Name: Complete Bewirtungsbeleg Workflow >> should calculate VAT correctly for German amounts
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-complete-workflow.spec.ts:270:3

# Error details

```
Error: locator.clear: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('input[name="restaurantName"], textarea[name="restaurantName"]')

    at BewirtungsbelegWorkflow.fillFormField (/Users/daniel/dev/Bewritung/bewir/test/e2e-complete-workflow.spec.ts:40:17)
    at /Users/daniel/dev/Bewritung/bewir/test/e2e-complete-workflow.spec.ts:272:20
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
   2 |  * E2E Test 1: Complete workflow (Upload→OCR→Edit→PDF)
   3 |  * Tests the entire user journey from receipt upload to PDF generation
   4 |  */
   5 |
   6 | import { test, expect, Page } from '@playwright/test';
   7 | import * as path from 'path';
   8 | import * as fs from 'fs';
   9 |
   10 | // Page Object Model for complete workflow
   11 | class BewirtungsbelegWorkflow {
   12 |   constructor(private page: Page) {}
   13 |
   14 |   async navigate() {
   15 |     await this.page.goto('/bewirtungsbeleg');
   16 |     await this.page.waitForLoadState('networkidle');
   17 |     await this.page.waitForLoadState('domcontentloaded');
   18 |     await this.page.waitForTimeout(1000);
   19 |   }
   20 |
   21 |   async uploadReceipt(filePath: string) {
   22 |     const fileInput = this.page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
   23 |     await fileInput.setInputFiles(filePath);
   24 |     await this.page.waitForTimeout(1000);
   25 |   }
   26 |
   27 |   async clickExtractData() {
   28 |     const extractButton = this.page.locator('button:has-text("Daten extrahieren")');
   29 |     await extractButton.click();
   30 |   }
   31 |
   32 |   async waitForOCRCompletion() {
   33 |     // Wait for loading spinner to appear and disappear
   34 |     await this.page.waitForSelector('[role="progressbar"]', { state: 'visible', timeout: 5000 });
   35 |     await this.page.waitForSelector('[role="progressbar"]', { state: 'hidden', timeout: 30000 });
   36 |   }
   37 |
   38 |   async fillFormField(fieldName: string, value: string) {
   39 |     const field = this.page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
>  40 |     await field.clear();
      |                 ^ Error: locator.clear: Test timeout of 90000ms exceeded.
   41 |     await field.fill(value);
   42 |   }
   43 |
   44 |   async selectDropdown(fieldName: string, value: string) {
   45 |     const dropdown = this.page.locator(`select[name="${fieldName}"]`);
   46 |     await dropdown.selectOption(value);
   47 |   }
   48 |
   49 |   async setDate(fieldName: string, date: string) {
   50 |     // German date format DD.MM.YYYY
   51 |     const dateInput = this.page.locator(`input[name="${fieldName}"]`);
   52 |     await dateInput.clear();
   53 |     await dateInput.fill(date);
   54 |   }
   55 |
   56 |   async clickGeneratePDF() {
   57 |     const generateButton = this.page.locator('button:has-text("PDF generieren")');
   58 |     await generateButton.click();
   59 |   }
   60 |
   61 |   async waitForPDFGeneration() {
   62 |     // Wait for success message or PDF download
   63 |     await this.page.waitForSelector('[role="alert"]:has-text("erfolgreich")', { timeout: 10000 });
   64 |   }
   65 |
   66 |   async getFormValue(fieldName: string): Promise<string> {
   67 |     const field = this.page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
   68 |     return await field.inputValue();
   69 |   }
   70 |
   71 |   async hasError(): Promise<boolean> {
   72 |     const errorAlert = this.page.locator('[role="alert"][data-type="error"]');
   73 |     return await errorAlert.isVisible();
   74 |   }
   75 |
   76 |   async getErrorMessage(): Promise<string | null> {
   77 |     const errorAlert = this.page.locator('[role="alert"][data-type="error"]');
   78 |     if (await errorAlert.isVisible()) {
   79 |       return await errorAlert.textContent();
   80 |     }
   81 |     return null;
   82 |   }
   83 | }
   84 |
   85 | test.describe('Complete Bewirtungsbeleg Workflow', () => {
   86 |   let workflow: BewirtungsbelegWorkflow;
   87 |
   88 |   test.beforeEach(async ({ page }) => {
   89 |     workflow = new BewirtungsbelegWorkflow(page);
   90 |     await workflow.navigate();
   91 |   });
   92 |
   93 |   test('should complete full workflow from image upload to PDF generation', async ({ page }) => {
   94 |     // Step 1: Upload receipt image
   95 |     const testImagePath = path.join(process.cwd(), 'test', 'test-receipt.png');
   96 |     
   97 |     // Create a simple test image if it doesn't exist
   98 |     if (!fs.existsSync(testImagePath)) {
   99 |       // Create a minimal PNG file
  100 |       const pngBuffer = Buffer.from([
  101 |         0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  102 |         0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  103 |         0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  104 |         0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  105 |         0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
  106 |         0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  107 |         0x00, 0x00, 0x03, 0x00, 0x01, 0x5E, 0xF9, 0x51,
  108 |         0x36, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
  109 |         0x44, 0xAE, 0x42, 0x60, 0x82
  110 |       ]);
  111 |       fs.writeFileSync(testImagePath, pngBuffer);
  112 |     }
  113 |
  114 |     await workflow.uploadReceipt(testImagePath);
  115 |
  116 |     // Step 2: Extract data with OCR (mock or real)
  117 |     // Check if extract button is available
  118 |     const extractButton = page.locator('button:has-text("Daten extrahieren")');
  119 |     if (await extractButton.isVisible()) {
  120 |       await workflow.clickExtractData();
  121 |       
  122 |       // Wait for OCR to complete (or mock response)
  123 |       try {
  124 |         await workflow.waitForOCRCompletion();
  125 |       } catch (e) {
  126 |         // OCR might fail with test image, continue with manual data
  127 |         console.log('OCR extraction skipped or failed, continuing with manual data entry');
  128 |       }
  129 |     }
  130 |
  131 |     // Step 3: Fill/Edit form fields
  132 |     await workflow.fillFormField('restaurantName', 'Restaurant Mustermann');
  133 |     await workflow.fillFormField('restaurantAnschrift', 'Musterstraße 123, 12345 Berlin');
  134 |     await workflow.setDate('datum', '06.08.2025');
  135 |     await workflow.fillFormField('teilnehmer', 'Max Mustermann, Erika Musterfrau');
  136 |     await workflow.fillFormField('anlass', 'Geschäftsessen - Projektbesprechung');
  137 |     await workflow.fillFormField('gesamtbetrag', '119,00'); // German decimal format
  138 |     
  139 |     // Select payment type and entertainment type
  140 |     await workflow.selectDropdown('zahlungsart', 'firma');
```