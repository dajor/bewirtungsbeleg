# Test info

- Name: E2E Test 5: Foreign Currency Receipt Handling >> should not calculate VAT for foreign receipts
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-critical-scenarios.spec.ts:428:3

# Error details

```
Error: locator.clear: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('input[name="restaurantName"], textarea[name="restaurantName"]')

    at BewirtungsbelegPage.fillField (/Users/daniel/dev/Bewritung/bewir/test/e2e-critical-scenarios.spec.ts:50:17)
    at BewirtungsbelegPage.fillMinimalValidForm (/Users/daniel/dev/Bewritung/bewir/test/e2e-critical-scenarios.spec.ts:101:16)
    at /Users/daniel/dev/Bewritung/bewir/test/e2e-critical-scenarios.spec.ts:429:16
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
   2 |  * E2E Tests 2-5: Critical scenarios for app quality
   3 |  * - Multiple file handling with ordering
   4 |  * - Error recovery and retry
   5 |  * - Form validation with German formats
   6 |  * - Foreign currency receipt handling
   7 |  */
   8 |
   9 | import { test, expect, Page } from '@playwright/test';
   10 | import * as path from 'path';
   11 | import * as fs from 'fs';
   12 |
   13 | class BewirtungsbelegPage {
   14 |   constructor(private page: Page) {}
   15 |
   16 |   async navigate() {
   17 |     await this.page.goto('/bewirtungsbeleg');
   18 |     await this.page.waitForLoadState('networkidle');
   19 |     await this.page.waitForLoadState('domcontentloaded');
   20 |     await this.page.waitForTimeout(1000);
   21 |   }
   22 |
   23 |   async uploadFiles(filePaths: string[]) {
   24 |     // Use the main receipt upload input (not the JSON import input)
   25 |     const fileInput = this.page.locator('input[type="file"][accept*="image"]').first();
   26 |     await fileInput.setInputFiles(filePaths);
   27 |     await this.page.waitForTimeout(1000);
   28 |   }
   29 |
   30 |   async getUploadedFileNames(): Promise<string[]> {
   31 |     const fileCards = this.page.locator('[data-testid="file-card"], .file-item');
   32 |     const count = await fileCards.count();
   33 |     const names: string[] = [];
   34 |     
   35 |     for (let i = 0; i < count; i++) {
   36 |       const text = await fileCards.nth(i).textContent();
   37 |       if (text) names.push(text);
   38 |     }
   39 |     
   40 |     return names;
   41 |   }
   42 |
   43 |   async removeFile(index: number) {
   44 |     const removeButtons = this.page.locator('[aria-label*="Remove"], [data-testid="remove-file"]');
   45 |     await removeButtons.nth(index).click();
   46 |   }
   47 |
   48 |   async fillField(name: string, value: string) {
   49 |     const field = this.page.locator(`input[name="${name}"], textarea[name="${name}"]`);
>  50 |     await field.clear();
      |                 ^ Error: locator.clear: Test timeout of 90000ms exceeded.
   51 |     await field.fill(value);
   52 |   }
   53 |
   54 |   async selectOption(name: string, value: string) {
   55 |     const select = this.page.locator(`select[name="${name}"]`);
   56 |     await select.selectOption(value);
   57 |   }
   58 |
   59 |   async clickButton(text: string) {
   60 |     await this.page.locator(`button:has-text("${text}")`).click();
   61 |   }
   62 |
   63 |   async getErrorMessages(): Promise<string[]> {
   64 |     const errors = this.page.locator('[role="alert"][data-type="error"], [role="alert"]:has-text("Fehler")');
   65 |     const count = await errors.count();
   66 |     const messages: string[] = [];
   67 |     
   68 |     for (let i = 0; i < count; i++) {
   69 |       const text = await errors.nth(i).textContent();
   70 |       if (text) messages.push(text);
   71 |     }
   72 |     
   73 |     return messages;
   74 |   }
   75 |
   76 |   async getFieldError(fieldName: string): Promise<string | null> {
   77 |     const error = this.page.locator(`[data-field="${fieldName}"] .error-message, #${fieldName}-error`);
   78 |     if (await error.isVisible()) {
   79 |       return await error.textContent();
   80 |     }
   81 |     return null;
   82 |   }
   83 |
   84 |   async isFieldValid(fieldName: string): Promise<boolean> {
   85 |     const field = this.page.locator(`input[name="${fieldName}"]`);
   86 |     const isInvalid = await field.getAttribute('aria-invalid');
   87 |     return isInvalid !== 'true';
   88 |   }
   89 |
   90 |   async waitForLoading() {
   91 |     await this.page.waitForSelector('[role="progressbar"]', { state: 'visible', timeout: 5000 });
   92 |     await this.page.waitForSelector('[role="progressbar"]', { state: 'hidden', timeout: 30000 });
   93 |   }
   94 |
   95 |   async toggleForeignReceipt() {
   96 |     const checkbox = this.page.locator('input[name="istAuslaendischeRechnung"]');
   97 |     await checkbox.click();
   98 |   }
   99 |
  100 |   async fillMinimalValidForm() {
  101 |     await this.fillField('restaurantName', 'Test Restaurant');
  102 |     await this.fillField('datum', '06.08.2025');
  103 |     await this.fillField('teilnehmer', 'Test Person');
  104 |     await this.fillField('anlass', 'Test Anlass');
  105 |     await this.fillField('gesamtbetrag', '100,00');
  106 |     await this.selectOption('zahlungsart', 'firma');
  107 |     await this.selectOption('bewirtungsart', 'mitarbeiter');
  108 |   }
  109 | }
  110 |
  111 | test.describe('E2E Test 2: Multiple File Handling with Ordering', () => {
  112 |   let page: BewirtungsbelegPage;
  113 |
  114 |   test.beforeEach(async ({ page: playwrightPage }) => {
  115 |     page = new BewirtungsbelegPage(playwrightPage);
  116 |     await page.navigate();
  117 |   });
  118 |
  119 |   test('should maintain correct file order: Rechnung before Kreditbeleg', async ({ page: playwrightPage }) => {
  120 |     // This test verifies the business rule that receipts (Rechnung) should be ordered
  121 |     // before credit card statements (Kreditbeleg) in the final PDF for German tax compliance
  122 |
  123 |     // Skip this test for now - it requires:
  124 |     // 1. Proper file classification (Rechnung vs Kreditbeleg)
  125 |     // 2. Automatic reordering logic in the application
  126 |     // 3. Valid image files that don't cause OCR errors
  127 |     // TODO: Implement proper file ordering logic and re-enable this test
  128 |     test.skip();
  129 |   });
  130 |
  131 |   test('should handle multiple attachments of same type', async () => {
  132 |     const files: string[] = [];
  133 |     
  134 |     // Create multiple test files
  135 |     for (let i = 1; i <= 3; i++) {
  136 |       const filePath = path.join(process.cwd(), 'test', `rechnung-${i}.pdf`);
  137 |       if (!fs.existsSync(filePath)) {
  138 |         fs.writeFileSync(filePath, `Rechnung ${i} content`);
  139 |       }
  140 |       files.push(filePath);
  141 |     }
  142 |
  143 |     await page.uploadFiles(files);
  144 |     
  145 |     const uploadedFiles = await page.getUploadedFileNames();
  146 |     expect(uploadedFiles.length).toBeGreaterThanOrEqual(3);
  147 |
  148 |     await page.fillMinimalValidForm();
  149 |     await page.clickButton('PDF generieren');
  150 |
```