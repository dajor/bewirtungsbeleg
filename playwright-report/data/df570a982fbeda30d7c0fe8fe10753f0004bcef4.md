# Test info

- Name: Complete Bewirtungsbeleg Workflow >> should calculate VAT correctly for German amounts
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-complete-workflow.spec.ts:269:3

# Error details

```
Error: locator.clear: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[name="restaurantName"], textarea[name="restaurantName"]')

    at BewirtungsbelegWorkflow.fillFormField (/Users/daniel/dev/Bewritung/bewir/test/e2e-complete-workflow.spec.ts:39:17)
    at /Users/daniel/dev/Bewritung/bewir/test/e2e-complete-workflow.spec.ts:271:20
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
   17 |     await this.page.waitForTimeout(500);
   18 |   }
   19 |
   20 |   async uploadReceipt(filePath: string) {
   21 |     const fileInput = this.page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
   22 |     await fileInput.setInputFiles(filePath);
   23 |     await this.page.waitForTimeout(1000);
   24 |   }
   25 |
   26 |   async clickExtractData() {
   27 |     const extractButton = this.page.locator('button:has-text("Daten extrahieren")');
   28 |     await extractButton.click();
   29 |   }
   30 |
   31 |   async waitForOCRCompletion() {
   32 |     // Wait for loading spinner to appear and disappear
   33 |     await this.page.waitForSelector('[role="progressbar"]', { state: 'visible', timeout: 5000 });
   34 |     await this.page.waitForSelector('[role="progressbar"]', { state: 'hidden', timeout: 30000 });
   35 |   }
   36 |
   37 |   async fillFormField(fieldName: string, value: string) {
   38 |     const field = this.page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
>  39 |     await field.clear();
      |                 ^ Error: locator.clear: Test timeout of 60000ms exceeded.
   40 |     await field.fill(value);
   41 |   }
   42 |
   43 |   async selectDropdown(fieldName: string, value: string) {
   44 |     const dropdown = this.page.locator(`select[name="${fieldName}"]`);
   45 |     await dropdown.selectOption(value);
   46 |   }
   47 |
   48 |   async setDate(fieldName: string, date: string) {
   49 |     // German date format DD.MM.YYYY
   50 |     const dateInput = this.page.locator(`input[name="${fieldName}"]`);
   51 |     await dateInput.clear();
   52 |     await dateInput.fill(date);
   53 |   }
   54 |
   55 |   async clickGeneratePDF() {
   56 |     const generateButton = this.page.locator('button:has-text("PDF generieren")');
   57 |     await generateButton.click();
   58 |   }
   59 |
   60 |   async waitForPDFGeneration() {
   61 |     // Wait for success message or PDF download
   62 |     await this.page.waitForSelector('[role="alert"]:has-text("erfolgreich")', { timeout: 10000 });
   63 |   }
   64 |
   65 |   async getFormValue(fieldName: string): Promise<string> {
   66 |     const field = this.page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
   67 |     return await field.inputValue();
   68 |   }
   69 |
   70 |   async hasError(): Promise<boolean> {
   71 |     const errorAlert = this.page.locator('[role="alert"][data-type="error"]');
   72 |     return await errorAlert.isVisible();
   73 |   }
   74 |
   75 |   async getErrorMessage(): Promise<string | null> {
   76 |     const errorAlert = this.page.locator('[role="alert"][data-type="error"]');
   77 |     if (await errorAlert.isVisible()) {
   78 |       return await errorAlert.textContent();
   79 |     }
   80 |     return null;
   81 |   }
   82 | }
   83 |
   84 | test.describe('Complete Bewirtungsbeleg Workflow', () => {
   85 |   let workflow: BewirtungsbelegWorkflow;
   86 |
   87 |   test.beforeEach(async ({ page }) => {
   88 |     workflow = new BewirtungsbelegWorkflow(page);
   89 |     await workflow.navigate();
   90 |   });
   91 |
   92 |   test('should complete full workflow from image upload to PDF generation', async ({ page }) => {
   93 |     // Step 1: Upload receipt image
   94 |     const testImagePath = path.join(process.cwd(), 'test', 'test-receipt.png');
   95 |     
   96 |     // Create a simple test image if it doesn't exist
   97 |     if (!fs.existsSync(testImagePath)) {
   98 |       // Create a minimal PNG file
   99 |       const pngBuffer = Buffer.from([
  100 |         0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  101 |         0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  102 |         0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  103 |         0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  104 |         0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
  105 |         0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  106 |         0x00, 0x00, 0x03, 0x00, 0x01, 0x5E, 0xF9, 0x51,
  107 |         0x36, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
  108 |         0x44, 0xAE, 0x42, 0x60, 0x82
  109 |       ]);
  110 |       fs.writeFileSync(testImagePath, pngBuffer);
  111 |     }
  112 |
  113 |     await workflow.uploadReceipt(testImagePath);
  114 |
  115 |     // Step 2: Extract data with OCR (mock or real)
  116 |     // Check if extract button is available
  117 |     const extractButton = page.locator('button:has-text("Daten extrahieren")');
  118 |     if (await extractButton.isVisible()) {
  119 |       await workflow.clickExtractData();
  120 |       
  121 |       // Wait for OCR to complete (or mock response)
  122 |       try {
  123 |         await workflow.waitForOCRCompletion();
  124 |       } catch (e) {
  125 |         // OCR might fail with test image, continue with manual data
  126 |         console.log('OCR extraction skipped or failed, continuing with manual data entry');
  127 |       }
  128 |     }
  129 |
  130 |     // Step 3: Fill/Edit form fields
  131 |     await workflow.fillFormField('restaurantName', 'Restaurant Mustermann');
  132 |     await workflow.fillFormField('restaurantAnschrift', 'Musterstraße 123, 12345 Berlin');
  133 |     await workflow.setDate('datum', '06.08.2025');
  134 |     await workflow.fillFormField('teilnehmer', 'Max Mustermann, Erika Musterfrau');
  135 |     await workflow.fillFormField('anlass', 'Geschäftsessen - Projektbesprechung');
  136 |     await workflow.fillFormField('gesamtbetrag', '119,00'); // German decimal format
  137 |     
  138 |     // Select payment type and entertainment type
  139 |     await workflow.selectDropdown('zahlungsart', 'firma');
```