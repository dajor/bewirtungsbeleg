# Test info

- Name: playwright-4-multi-pdf-combinations: Critical Multi-PDF Upload Tests >> Test 2: Kundenbeleg (Kreditkartenbeleg) first, then Vendor (Rechnung)
- Location: /Users/daniel/dev/Bewritung/bewir/test/playwright-4-multi-pdf-combinations.spec.ts:189:3

# Error details

```
Error: locator.setInputFiles: Test ended.
Call log:
  - waiting for locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first()

    at uploadAndWaitForProcessing (/Users/daniel/dev/Bewritung/bewir/test/playwright-4-multi-pdf-combinations.spec.ts:100:3)
    at /Users/daniel/dev/Bewritung/bewir/test/playwright-4-multi-pdf-combinations.spec.ts:193:5
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
   2 |  * Playwright E2E Test: Multi-PDF Upload - All 4 Combinations
   3 |  *
   4 |  * Tests all upload order combinations to ensure NO fields are ever cleared:
   5 |  * 1. Vendor (Rechnung) first, then Kundenbeleg (Kreditkartenbeleg)
   6 |  * 2. Kundenbeleg (Kreditkartenbeleg) first, then Vendor (Rechnung)
   7 |  * 3. Vendor first, wait 20 seconds, then Kundenbeleg
   8 |  * 4. Kundenbeleg first, wait 20 seconds, then Vendor
   9 |  *
   10 |  * All tests verify these fields are populated:
   11 |  * - Gesamtbetrag (Brutto)
   12 |  * - MwSt. Gesamtbetrag
   13 |  * - Netto Gesamtbetrag
   14 |  * - Betrag auf Kreditkarte/Bar
   15 |  * - Trinkgeld
   16 |  * - MwSt. Trinkgeld
   17 |  *
   18 |  * CRITICAL: This test runs before every deployment and git push
   19 |  */
   20 |
   21 | import { test, expect } from '@playwright/test';
   22 | import * as path from 'path';
   23 | import { fileURLToPath } from 'url';
   24 |
   25 | const __filename = fileURLToPath(import.meta.url);
   26 | const __dirname = path.dirname(__filename);
   27 |
   28 | // Helper function to verify all required fields are populated
   29 | async function verifyAllFieldsPopulated(page: any) {
   30 |   console.log('=== Verifying All Required Fields Are Populated ===');
   31 |
   32 |   // Use data-path attributes from Mantine NumberInput components
   33 |   // These are more reliable than ARIA labels for form field selection
   34 |   const gesamtbetrag = await page.locator('[data-path="gesamtbetrag"]').inputValue();
   35 |   const gesamtbetragMwst = await page.locator('[data-path="gesamtbetragMwst"]').inputValue();
   36 |   const gesamtbetragNetto = await page.locator('[data-path="gesamtbetragNetto"]').inputValue();
   37 |   const kreditkartenBetrag = await page.locator('[data-path="kreditkartenBetrag"]').inputValue();
   38 |   const trinkgeld = await page.locator('[data-path="trinkgeld"]').inputValue();
   39 |   const trinkgeldMwst = await page.locator('[data-path="trinkgeldMwst"]').inputValue();
   40 |
   41 |   console.log('Field Values:');
   42 |   console.log('  Gesamtbetrag (Brutto):', gesamtbetrag);
   43 |   console.log('  MwSt. Gesamtbetrag:', gesamtbetragMwst);
   44 |   console.log('  Netto Gesamtbetrag:', gesamtbetragNetto);
   45 |   console.log('  Betrag auf Kreditkarte/Bar:', kreditkartenBetrag);
   46 |   console.log('  Trinkgeld:', trinkgeld);
   47 |   console.log('  MwSt. Trinkgeld:', trinkgeldMwst);
   48 |
   49 |   // CRITICAL: Verify all fields have non-empty values
   50 |   // This is the KEY requirement - NO fields should EVER be cleared
   51 |   expect(gesamtbetrag, 'Gesamtbetrag (Brutto) should be populated').not.toBe('');
   52 |   expect(gesamtbetragMwst, 'MwSt. Gesamtbetrag should be populated').not.toBe('');
   53 |   expect(gesamtbetragNetto, 'Netto Gesamtbetrag should be populated').not.toBe('');
   54 |   expect(kreditkartenBetrag, 'Betrag auf Kreditkarte/Bar should be populated').not.toBe('');
   55 |   expect(trinkgeld, 'Trinkgeld should be populated').not.toBe('');
   56 |   expect(trinkgeldMwst, 'MwSt. Trinkgeld should be populated').not.toBe('');
   57 |
   58 |   // Verify values are numeric
   59 |   expect(parseFloat(gesamtbetrag), 'Gesamtbetrag should be a valid number').toBeGreaterThan(0);
   60 |   expect(parseFloat(gesamtbetragMwst), 'MwSt should be a valid number').toBeGreaterThan(0);
   61 |   expect(parseFloat(gesamtbetragNetto), 'Netto should be a valid number').toBeGreaterThan(0);
   62 |   expect(parseFloat(kreditkartenBetrag), 'Kreditkarten should be a valid number').toBeGreaterThan(0);
   63 |   expect(parseFloat(trinkgeld), 'Trinkgeld should be a valid number').toBeGreaterThan(0);
   64 |   expect(parseFloat(trinkgeldMwst), 'Trinkgeld MwSt should be a valid number').toBeGreaterThan(0);
   65 |
   66 |   console.log('✅ All fields verified successfully!');
   67 |
   68 |   return {
   69 |     gesamtbetrag,
   70 |     gesamtbetragMwst,
   71 |     gesamtbetragNetto,
   72 |     kreditkartenBetrag,
   73 |     trinkgeld,
   74 |     trinkgeldMwst
   75 |   };
   76 | }
   77 |
   78 | // Helper function to upload a file and wait for processing
   79 | async function uploadAndWaitForProcessing(page: any, filePath: string, fileType: string) {
   80 |   console.log(`=== Uploading ${fileType}: ${filePath} ===`);
   81 |
   82 |   // Start listening for responses BEFORE uploading
   83 |   const conversionPromise = page.waitForResponse(
   84 |     (response: any) => response.url().includes('/api/convert-pdf') && response.status() === 200,
   85 |     { timeout: 30000 }
   86 |   );
   87 |
   88 |   const classificationPromise = page.waitForResponse(
   89 |     (response: any) => response.url().includes('/api/classify-receipt') && response.status() === 200,
   90 |     { timeout: 30000 }
   91 |   );
   92 |
   93 |   const extractionPromise = page.waitForResponse(
   94 |     (response: any) => response.url().includes('/api/extract-receipt') && response.status() === 200,
   95 |     { timeout: 30000 }
   96 |   );
   97 |
   98 |   // Now upload the file
   99 |   const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
> 100 |   await fileInput.setInputFiles([filePath]);
      |   ^ Error: locator.setInputFiles: Test ended.
  101 |
  102 |   console.log(`✓ ${fileType} uploaded`);
  103 |
  104 |   // Wait for conversion API to complete
  105 |   await conversionPromise;
  106 |   console.log(`✓ ${fileType} converted`);
  107 |
  108 |   // Wait for classification API to complete
  109 |   await classificationPromise;
  110 |   console.log(`✓ ${fileType} classified`);
  111 |
  112 |   // Wait for OCR extraction API to complete
  113 |   await extractionPromise;
  114 |   console.log(`✓ ${fileType} OCR extraction completed`);
  115 |
  116 |   // CRITICAL: Wait only 200ms (reduced from 1000ms) to verify immediate population
  117 |   // This shorter wait ensures we catch timing issues early
  118 |   await page.waitForTimeout(200);
  119 |
  120 |   // Verify trinkgeld fields are populated immediately (for debugging)
  121 |   const trinkgeld = await page.locator('[data-path="trinkgeld"]').inputValue();
  122 |   const trinkgeldMwst = await page.locator('[data-path="trinkgeldMwst"]').inputValue();
  123 |
  124 |   console.log(`  → Trinkgeld after OCR: "${trinkgeld}"`);
  125 |   console.log(`  → Trinkgeld MwSt after OCR: "${trinkgeldMwst}"`);
  126 |
  127 |   // Take screenshot if trinkgeld is empty (debugging)
  128 |   if (!trinkgeld || trinkgeld === '') {
  129 |     const timestamp = Date.now();
  130 |     await page.screenshot({
  131 |       path: `test-results/trinkgeld-empty-after-${fileType}-${timestamp}.png`,
  132 |       fullPage: true
  133 |     });
  134 |     console.warn(`⚠️ WARNING: Trinkgeld is empty immediately after OCR! Screenshot saved.`);
  135 |   }
  136 | }
  137 |
  138 | test.describe('playwright-4-multi-pdf-combinations: Critical Multi-PDF Upload Tests', () => {
  139 |   const rechnungPath = path.join(__dirname, 'test-files', '19092025_(Vendor).pdf');
  140 |   const kreditkartenPath = path.join(__dirname, 'test-files', '19092025_* * Kundenbeleg.pdf');
  141 |
  142 |   // Set timeout to 2 minutes for each test (20s wait + upload processing)
  143 |   test.setTimeout(120000);
  144 |
  145 |   test.beforeEach(async ({ page }) => {
  146 |     console.log('=== Navigate to Bewirtungsbeleg Form ===');
  147 |     await page.goto('/bewirtungsbeleg');
  148 |     await page.waitForLoadState('networkidle');
  149 |     await page.waitForTimeout(500);
  150 |     console.log('✓ Form page loaded');
  151 |   });
  152 |
  153 |   test('Test 1: Vendor (Rechnung) first, then Kundenbeleg (Kreditkartenbeleg)', async ({ page }) => {
  154 |     console.log('\n🧪 TEST 1: Vendor → Kundenbeleg (Normal Order)\n');
  155 |
  156 |     // Upload Vendor (Rechnung) first
  157 |     await uploadAndWaitForProcessing(page, rechnungPath, 'Vendor (Rechnung)');
  158 |
  159 |     // Upload Kundenbeleg (Kreditkartenbeleg) second
  160 |     await uploadAndWaitForProcessing(page, kreditkartenPath, 'Kundenbeleg (Kreditkartenbeleg)');
  161 |
  162 |     // Take screenshot for verification
  163 |     const timestamp = Date.now();
  164 |     await page.screenshot({ path: `test-results/test1-vendor-then-kundenbeleg-${timestamp}.png`, fullPage: true });
  165 |
  166 |     // Verify all fields are populated
  167 |     const values = await verifyAllFieldsPopulated(page);
  168 |
  169 |     // CRITICAL: Verify specific expected values for trinkgeld calculation
  170 |     expect(values.trinkgeld).toBe('2.10');
  171 |     expect(values.trinkgeldMwst).toBe('0.40');
  172 |
  173 |     // CRITICAL: Test form validation (simulates "Weiter" button click)
  174 |     console.log('=== Testing Form Validation ===');
  175 |
  176 |     // Fill required non-financial fields to enable form submission
  177 |     await page.locator('[data-path="teilnehmer"]').fill('Test Teilnehmer');
  178 |     await page.locator('[data-path="geschaeftlicherAnlass"]').fill('Test Geschäftlicher Anlass');
  179 |
  180 |     // Try to click "Weiter" button
  181 |     const weiterButton = page.getByRole('button', { name: /weiter/i });
  182 |     await expect(weiterButton).toBeEnabled();
  183 |
  184 |     console.log('✅ Form validation passed - Weiter button is enabled');
  185 |
  186 |     console.log('\n✅ TEST 1 PASSED: All fields correctly populated and validation passed!\n');
  187 |   });
  188 |
  189 |   test('Test 2: Kundenbeleg (Kreditkartenbeleg) first, then Vendor (Rechnung)', async ({ page }) => {
  190 |     console.log('\n🧪 TEST 2: Kundenbeleg → Vendor (Reverse Order)\n');
  191 |
  192 |     // Upload Kundenbeleg (Kreditkartenbeleg) first
  193 |     await uploadAndWaitForProcessing(page, kreditkartenPath, 'Kundenbeleg (Kreditkartenbeleg)');
  194 |
  195 |     // Upload Vendor (Rechnung) second
  196 |     await uploadAndWaitForProcessing(page, rechnungPath, 'Vendor (Rechnung)');
  197 |
  198 |     // Take screenshot for verification
  199 |     const timestamp = Date.now();
  200 |     await page.screenshot({ path: `test-results/test2-kundenbeleg-then-vendor-${timestamp}.png`, fullPage: true });
```