# Test info

- Name: playwright-pdf-upload: PDF Upload and Form Validation >> should upload Rechnung PDF, extract data, and validate all fields
- Location: /Users/daniel/dev/Bewritung/bewir/test/playwright-3-pdf-upload.spec.ts:90:3

# Error details

```
Error: locator.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByTestId('login-email')

    at /Users/daniel/dev/Bewritung/bewir/test/playwright-3-pdf-upload.spec.ts:79:43
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
   2 |  * Playwright E2E Test: PDF Upload and Form Validation
   3 |  *
   4 |  * Tests complete PDF upload workflow with OCR extraction:
   5 |  * 1. Authenticate using TEST_USER credentials
   6 |  * 2. Navigate to /bewirtungsbeleg page
   7 |  * 3. Upload PDF files (Rechnung and Kreditkartenbeleg)
   8 |  * 4. Wait for PDF conversion to complete
   9 |  * 5. Wait for OCR extraction and field population
   10 |  * 6. Validate all required fields are populated with valid values
   11 |  * 7. Verify calculated fields (MwSt., Netto) are correct
   12 |  * 8. Test form submission to preview page
   13 |  *
   14 |  * NOTE: This test depends on playwright-2-login.spec.ts pattern for authentication
   15 |  */
   16 |
   17 | import { test, expect } from '@playwright/test';
   18 | import * as path from 'path';
   19 |
   20 | // Same test user from login tests
   21 | const TEST_USER = {
   22 |   email: 'uzylloqimwnkvwjfufeq@inbound.mailersend.net',
   23 |   password: 'Tester45%',
   24 | };
   25 |
   26 | // Helper function to parse German decimal format (e.g., "51,90" -> 51.90)
   27 | function parseGermanDecimal(value: string): number {
   28 |   if (!value) return 0;
   29 |   return parseFloat(value.replace(',', '.'));
   30 | }
   31 |
   32 | // Helper function to wait for PDF conversion to complete
   33 | async function waitForPDFConversion(page: any, fileName: string, timeout = 30000) {
   34 |   console.log(`Waiting for PDF conversion of ${fileName}...`);
   35 |
   36 |   const startTime = Date.now();
   37 |
   38 |   // Wait for "Konvertiere PDF..." text to disappear
   39 |   await page.waitForFunction(
   40 |     () => {
   41 |       const convertingText = document.querySelector('text=/Konvertiere PDF/i');
   42 |       return !convertingText || !convertingText.textContent?.includes('Konvertiere PDF');
   43 |     },
   44 |     { timeout }
   45 |   );
   46 |
   47 |   const elapsed = Date.now() - startTime;
   48 |   console.log(`PDF conversion completed in ${elapsed}ms`);
   49 | }
   50 |
   51 | // Helper function to wait for OCR extraction
   52 | async function waitForOCRExtraction(page: any, timeout = 30000) {
   53 |   console.log('Waiting for OCR extraction to complete...');
   54 |
   55 |   // Wait for the "Der Beleg wird analysiert..." notification to disappear
   56 |   const processingNotification = page.locator('text=/Der Beleg wird analysiert/i');
   57 |
   58 |   if (await processingNotification.isVisible().catch(() => false)) {
   59 |     await processingNotification.waitFor({ state: 'hidden', timeout });
   60 |     console.log('OCR processing notification disappeared');
   61 |   }
   62 |
   63 |   // Additional wait for form fields to be populated
   64 |   await page.waitForTimeout(2000);
   65 | }
   66 |
   67 | test.describe('playwright-pdf-upload: PDF Upload and Form Validation', () => {
   68 |
   69 |   // Setup: Login before each test
   70 |   test.beforeEach(async ({ page }) => {
   71 |     console.log('=== Setup: Login ===');
   72 |
   73 |     // Navigate to signin page
   74 |     await page.goto('/auth/anmelden');
   75 |     await page.waitForLoadState('networkidle');
   76 |     await page.waitForTimeout(500);
   77 |
   78 |     // Login with test credentials
>  79 |     await page.getByTestId('login-email').fill(TEST_USER.email);
      |                                           ^ Error: locator.fill: Test timeout of 60000ms exceeded.
   80 |     await page.getByTestId('login-password').fill(TEST_USER.password);
   81 |     await page.getByTestId('login-submit').click();
   82 |
   83 |     // Wait for redirect to bewirtungsbeleg page
   84 |     await page.waitForURL('**/bewirtungsbeleg**', { timeout: 10000 });
   85 |     await page.waitForLoadState('networkidle');
   86 |     await page.waitForTimeout(500);
   87 |     console.log('Login successful, on /bewirtungsbeleg page');
   88 |   });
   89 |
   90 |   test('should upload Rechnung PDF, extract data, and validate all fields', async ({ page }) => {
   91 |     console.log('=== Test: Upload Rechnung PDF ===');
   92 |
   93 |     // Take initial screenshot
   94 |     await page.screenshot({
   95 |       path: `test-results/pdf-upload-rechnung-start-${Date.now()}.png`,
   96 |       fullPage: true
   97 |     });
   98 |
   99 |     console.log('=== Step 1: Prepare and Upload PDF ===');
  100 |
  101 |     const rechnungPath = path.join(__dirname, 'test-files', '19092025_(Vendor).pdf');
  102 |     console.log('PDF file path:', rechnungPath);
  103 |
  104 |     // Find the file input in the dropzone
  105 |     const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
  106 |     await fileInput.setInputFiles([rechnungPath]);
  107 |     console.log('File uploaded to dropzone');
  108 |
  109 |     console.log('=== Step 2: Wait for PDF Conversion ===');
  110 |
  111 |     // Wait for API call to convert-pdf
  112 |     try {
  113 |       const convertResponse = await page.waitForResponse(
  114 |         response => response.url().includes('/api/convert-pdf') && response.status() === 200,
  115 |         { timeout: 30000 }
  116 |       );
  117 |       console.log('PDF conversion API call completed:', convertResponse.status());
  118 |     } catch (error) {
  119 |       console.error('PDF conversion API call failed or timed out');
  120 |       await page.screenshot({
  121 |         path: `test-results/pdf-upload-conversion-error-${Date.now()}.png`,
  122 |         fullPage: true
  123 |       });
  124 |       throw error;
  125 |     }
  126 |
  127 |     // Wait for "Konvertiere PDF..." indicator to disappear
  128 |     const convertingIndicator = page.locator('text=/Konvertiere PDF/i');
  129 |     if (await convertingIndicator.isVisible().catch(() => false)) {
  130 |       await convertingIndicator.waitFor({ state: 'hidden', timeout: 30000 });
  131 |       console.log('PDF conversion UI indicator cleared');
  132 |     }
  133 |
  134 |     console.log('=== Step 3: Wait for Classification ===');
  135 |
  136 |     // Wait for classification API call
  137 |     try {
  138 |       const classifyResponse = await page.waitForResponse(
  139 |         response => response.url().includes('/api/classify-receipt') && response.status() === 200,
  140 |         { timeout: 20000 }
  141 |       );
  142 |       const classificationData = await classifyResponse.json();
  143 |       console.log('Classification result:', classificationData);
  144 |     } catch (error) {
  145 |       console.warn('Classification API call may have failed, continuing...');
  146 |     }
  147 |
  148 |     // Verify classification badge appears
  149 |     await page.waitForTimeout(2000); // Wait for UI update
  150 |     const rechnungBadge = page.locator('text=/RECHNUNG/i').first();
  151 |     const hasRechnungBadge = await rechnungBadge.isVisible().catch(() => false);
  152 |     if (hasRechnungBadge) {
  153 |       console.log('Classification badge visible: RECHNUNG');
  154 |     } else {
  155 |       console.warn('Classification badge not visible yet');
  156 |     }
  157 |
  158 |     console.log('=== Step 4: Wait for OCR Extraction ===');
  159 |
  160 |     // Wait for OCR extraction API call
  161 |     try {
  162 |       const extractResponse = await page.waitForResponse(
  163 |         response => response.url().includes('/api/extract-receipt') && response.status() === 200,
  164 |         { timeout: 30000 }
  165 |       );
  166 |       const extractData = await extractResponse.json();
  167 |       console.log('OCR extraction completed. Data keys:', Object.keys(extractData));
  168 |     } catch (error) {
  169 |       console.error('OCR extraction API call failed or timed out');
  170 |       await page.screenshot({
  171 |         path: `test-results/pdf-upload-ocr-error-${Date.now()}.png`,
  172 |         fullPage: true
  173 |       });
  174 |       throw error;
  175 |     }
  176 |
  177 |     // Wait for processing notification to disappear
  178 |     await waitForOCRExtraction(page);
  179 |
```