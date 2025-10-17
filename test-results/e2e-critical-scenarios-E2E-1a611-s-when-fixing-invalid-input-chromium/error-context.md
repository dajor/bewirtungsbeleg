# Test info

- Name: E2E Test 3: Error Recovery and Retry >> should clear errors when fixing invalid input
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-critical-scenarios.spec.ts:256:3

# Error details

```
Error: locator.clear: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[name="gesamtbetrag"], textarea[name="gesamtbetrag"]')

    at BewirtungsbelegPage.fillField (/Users/daniel/dev/Bewritung/bewir/test/e2e-critical-scenarios.spec.ts:48:17)
    at /Users/daniel/dev/Bewritung/bewir/test/e2e-critical-scenarios.spec.ts:258:16
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
   19 |   }
   20 |
   21 |   async uploadFiles(filePaths: string[]) {
   22 |     // Use the main receipt upload input (not the JSON import input)
   23 |     const fileInput = this.page.locator('input[type="file"][accept*="image"]').first();
   24 |     await fileInput.setInputFiles(filePaths);
   25 |     await this.page.waitForTimeout(1000);
   26 |   }
   27 |
   28 |   async getUploadedFileNames(): Promise<string[]> {
   29 |     const fileCards = this.page.locator('[data-testid="file-card"], .file-item');
   30 |     const count = await fileCards.count();
   31 |     const names: string[] = [];
   32 |     
   33 |     for (let i = 0; i < count; i++) {
   34 |       const text = await fileCards.nth(i).textContent();
   35 |       if (text) names.push(text);
   36 |     }
   37 |     
   38 |     return names;
   39 |   }
   40 |
   41 |   async removeFile(index: number) {
   42 |     const removeButtons = this.page.locator('[aria-label*="Remove"], [data-testid="remove-file"]');
   43 |     await removeButtons.nth(index).click();
   44 |   }
   45 |
   46 |   async fillField(name: string, value: string) {
   47 |     const field = this.page.locator(`input[name="${name}"], textarea[name="${name}"]`);
>  48 |     await field.clear();
      |                 ^ Error: locator.clear: Test timeout of 60000ms exceeded.
   49 |     await field.fill(value);
   50 |   }
   51 |
   52 |   async selectOption(name: string, value: string) {
   53 |     const select = this.page.locator(`select[name="${name}"]`);
   54 |     await select.selectOption(value);
   55 |   }
   56 |
   57 |   async clickButton(text: string) {
   58 |     await this.page.locator(`button:has-text("${text}")`).click();
   59 |   }
   60 |
   61 |   async getErrorMessages(): Promise<string[]> {
   62 |     const errors = this.page.locator('[role="alert"][data-type="error"], [role="alert"]:has-text("Fehler")');
   63 |     const count = await errors.count();
   64 |     const messages: string[] = [];
   65 |     
   66 |     for (let i = 0; i < count; i++) {
   67 |       const text = await errors.nth(i).textContent();
   68 |       if (text) messages.push(text);
   69 |     }
   70 |     
   71 |     return messages;
   72 |   }
   73 |
   74 |   async getFieldError(fieldName: string): Promise<string | null> {
   75 |     const error = this.page.locator(`[data-field="${fieldName}"] .error-message, #${fieldName}-error`);
   76 |     if (await error.isVisible()) {
   77 |       return await error.textContent();
   78 |     }
   79 |     return null;
   80 |   }
   81 |
   82 |   async isFieldValid(fieldName: string): Promise<boolean> {
   83 |     const field = this.page.locator(`input[name="${fieldName}"]`);
   84 |     const isInvalid = await field.getAttribute('aria-invalid');
   85 |     return isInvalid !== 'true';
   86 |   }
   87 |
   88 |   async waitForLoading() {
   89 |     await this.page.waitForSelector('[role="progressbar"]', { state: 'visible', timeout: 5000 });
   90 |     await this.page.waitForSelector('[role="progressbar"]', { state: 'hidden', timeout: 30000 });
   91 |   }
   92 |
   93 |   async toggleForeignReceipt() {
   94 |     const checkbox = this.page.locator('input[name="istAuslaendischeRechnung"]');
   95 |     await checkbox.click();
   96 |   }
   97 |
   98 |   async fillMinimalValidForm() {
   99 |     await this.fillField('restaurantName', 'Test Restaurant');
  100 |     await this.fillField('datum', '06.08.2025');
  101 |     await this.fillField('teilnehmer', 'Test Person');
  102 |     await this.fillField('anlass', 'Test Anlass');
  103 |     await this.fillField('gesamtbetrag', '100,00');
  104 |     await this.selectOption('zahlungsart', 'firma');
  105 |     await this.selectOption('bewirtungsart', 'mitarbeiter');
  106 |   }
  107 | }
  108 |
  109 | test.describe('E2E Test 2: Multiple File Handling with Ordering', () => {
  110 |   let page: BewirtungsbelegPage;
  111 |
  112 |   test.beforeEach(async ({ page: playwrightPage }) => {
  113 |     page = new BewirtungsbelegPage(playwrightPage);
  114 |     await page.navigate();
  115 |   });
  116 |
  117 |   test('should maintain correct file order: Rechnung before Kreditbeleg', async ({ page: playwrightPage }) => {
  118 |     // This test verifies the business rule that receipts (Rechnung) should be ordered
  119 |     // before credit card statements (Kreditbeleg) in the final PDF for German tax compliance
  120 |
  121 |     // Skip this test for now - it requires:
  122 |     // 1. Proper file classification (Rechnung vs Kreditbeleg)
  123 |     // 2. Automatic reordering logic in the application
  124 |     // 3. Valid image files that don't cause OCR errors
  125 |     // TODO: Implement proper file ordering logic and re-enable this test
  126 |     test.skip();
  127 |   });
  128 |
  129 |   test('should handle multiple attachments of same type', async () => {
  130 |     const files: string[] = [];
  131 |     
  132 |     // Create multiple test files
  133 |     for (let i = 1; i <= 3; i++) {
  134 |       const filePath = path.join(process.cwd(), 'test', `rechnung-${i}.pdf`);
  135 |       if (!fs.existsSync(filePath)) {
  136 |         fs.writeFileSync(filePath, `Rechnung ${i} content`);
  137 |       }
  138 |       files.push(filePath);
  139 |     }
  140 |
  141 |     await page.uploadFiles(files);
  142 |     
  143 |     const uploadedFiles = await page.getUploadedFileNames();
  144 |     expect(uploadedFiles.length).toBeGreaterThanOrEqual(3);
  145 |
  146 |     await page.fillMinimalValidForm();
  147 |     await page.clickButton('PDF generieren');
  148 |
```