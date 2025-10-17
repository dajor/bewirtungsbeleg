# Test info

- Name: PDF to Image Conversion >> should handle PDF conversion errors gracefully
- Location: /Users/daniel/dev/Bewritung/bewir/test/pdf-conversion.spec.ts:169:3

# Error details

```
Error: locator.setInputFiles: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first()

    at BewirtungsbelegPage.uploadFile (/Users/daniel/dev/Bewritung/bewir/test/pdf-conversion.spec.ts:22:5)
    at /Users/daniel/dev/Bewritung/bewir/test/pdf-conversion.spec.ts:191:5
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
   2 |  * E2E Playwright tests for PDF conversion functionality
   3 |  * Tests the complete flow of uploading PDFs, converting to images, and rotating
   4 |  */
   5 |
   6 | import { test, expect, Page } from '@playwright/test';
   7 | import * as path from 'path';
   8 | import * as fs from 'fs';
   9 |
   10 | // Page Object Model for BewirtungsbelegForm
   11 | class BewirtungsbelegPage {
   12 |   constructor(private page: Page) {}
   13 |
   14 |   async navigate() {
   15 |     await this.page.goto('/bewirtungsbeleg');
   16 |     await this.page.waitForLoadState('networkidle');
   17 |     await this.page.waitForTimeout(500);
   18 |   }
   19 |
   20 |   async uploadFile(filePath: string) {
   21 |     const fileInput = this.page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
>  22 |     await fileInput.setInputFiles(filePath);
      |     ^ Error: locator.setInputFiles: Test timeout of 60000ms exceeded.
   23 |   }
   24 |
   25 |   async waitForPdfConversion() {
   26 |     // Wait for "Converting PDF..." message to appear
   27 |     await expect(this.page.locator('text=Converting PDF...')).toBeVisible({ timeout: 10000 });
   28 |     
   29 |     // Wait for conversion to complete (message disappears)
   30 |     await expect(this.page.locator('text=Converting PDF...')).toBeHidden({ timeout: 30000 });
   31 |   }
   32 |
   33 |   async isImageDisplayed(): Promise<boolean> {
   34 |     const image = this.page.locator('img[alt="Receipt preview"]');
   35 |     return await image.isVisible();
   36 |   }
   37 |
   38 |   async getImageSrc(): Promise<string | null> {
   39 |     const image = this.page.locator('img[alt="Receipt preview"]');
   40 |     return await image.getAttribute('src');
   41 |   }
   42 |
   43 |   async rotateImageRight() {
   44 |     await this.page.locator('[data-testid="rotate-right-90"]').click();
   45 |     await this.page.waitForTimeout(500); // Wait for rotation animation
   46 |   }
   47 |
   48 |   async rotateImageLeft() {
   49 |     await this.page.locator('[data-testid="rotate-left-90"]').click();
   50 |     await this.page.waitForTimeout(500);
   51 |   }
   52 |
   53 |   async isRotateButtonEnabled(): Promise<boolean> {
   54 |     return await this.page.locator('[data-testid="rotate-right-90"]').isEnabled();
   55 |   }
   56 |
   57 |   async isEditedBadgeVisible(): Promise<boolean> {
   58 |     return await this.page.locator('text=Edited').isVisible();
   59 |   }
   60 |
   61 |   async resetImage() {
   62 |     await this.page.locator('[data-testid="reset-button"]').click();
   63 |   }
   64 |
   65 |   async removeFile() {
   66 |     // Click the remove button (X) on the file card
   67 |     await this.page.locator('button[aria-label*="Remove"]').first().click();
   68 |   }
   69 |
   70 |   async getErrorMessage(): Promise<string | null> {
   71 |     const errorElement = this.page.locator('[role="alert"]');
   72 |     if (await errorElement.isVisible()) {
   73 |       return await errorElement.textContent();
   74 |     }
   75 |     return null;
   76 |   }
   77 |
   78 |   async isErrorMessageVisible(): Promise<boolean> {
   79 |     return await this.page.locator('[role="alert"]').isVisible();
   80 |   }
   81 |
   82 |   async extractData() {
   83 |     await this.page.locator('button:has-text("Daten extrahieren")').click();
   84 |   }
   85 |
   86 |   async waitForExtractionComplete() {
   87 |     // Wait for extraction to complete
   88 |     await this.page.waitForResponse(resp => 
   89 |       resp.url().includes('/api/extract-receipt') && resp.status() === 200,
   90 |       { timeout: 30000 }
   91 |     );
   92 |   }
   93 | }
   94 |
   95 | // Test Suite
   96 | test.describe('PDF to Image Conversion', () => {
   97 |   let bewirtungsbelegPage: BewirtungsbelegPage;
   98 |
   99 |   test.beforeEach(async ({ page }) => {
  100 |     bewirtungsbelegPage = new BewirtungsbelegPage(page);
  101 |     await bewirtungsbelegPage.navigate();
  102 |   });
  103 |
  104 |   test('should convert PDF to image and display it', async ({ page }) => {
  105 |     // Create a test PDF file
  106 |     const testPdfPath = path.join(process.cwd(), 'test', 'test-receipt.pdf');
  107 |     
  108 |     // Check if test PDF exists, if not create a simple one
  109 |     if (!fs.existsSync(testPdfPath)) {
  110 |       console.log('Creating test PDF...');
  111 |       // Use existing PDF from test directory if available
  112 |       const sourcePdf = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
  113 |       if (fs.existsSync(sourcePdf)) {
  114 |         fs.copyFileSync(sourcePdf, testPdfPath);
  115 |       } else {
  116 |         // Skip test if no PDF available
  117 |         test.skip();
  118 |         return;
  119 |       }
  120 |     }
  121 |
  122 |     // Upload PDF file
```