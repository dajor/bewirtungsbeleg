# Test info

- Name: Complete Bewirtungsbeleg Workflow >> should handle PDF with multiple attachments
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-complete-workflow.spec.ts:238:3

# Error details

```
Error: locator.setInputFiles: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first()

    at /Users/daniel/dev/Bewritung/bewir/test/e2e-complete-workflow.spec.ts:252:5
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
  152 |     
  153 |     // Verify no errors occurred
  154 |     const hasError = await workflow.hasError();
  155 |     expect(hasError).toBe(false);
  156 |   });
  157 |
  158 |   test('should handle OCR extraction and auto-fill form fields', async ({ page }) => {
  159 |     // Mock OCR response for testing
  160 |     await page.route('**/api/extract-receipt', route => {
  161 |       route.fulfill({
  162 |         status: 200,
  163 |         body: JSON.stringify({
  164 |           restaurantName: 'Zur Goldenen Gans',
  165 |           restaurantAnschrift: 'Hauptstraße 42, 10115 Berlin',
  166 |           gesamtbetrag: '85,50',
  167 |           datum: '05.08.2025',
  168 |           mwst: '13,65',
  169 |           netto: '71,85'
  170 |         })
  171 |       });
  172 |     });
  173 |
  174 |     const testImagePath = path.join(process.cwd(), 'test', 'test-receipt.png');
  175 |     if (!fs.existsSync(testImagePath)) {
  176 |       const pngBuffer = Buffer.from([
  177 |         0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  178 |         0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  179 |         0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  180 |         0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  181 |         0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
  182 |         0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  183 |         0x00, 0x00, 0x03, 0x00, 0x01, 0x5E, 0xF9, 0x51,
  184 |         0x36, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
  185 |         0x44, 0xAE, 0x42, 0x60, 0x82
  186 |       ]);
  187 |       fs.writeFileSync(testImagePath, pngBuffer);
  188 |     }
  189 |
  190 |     await workflow.uploadReceipt(testImagePath);
  191 |     await workflow.clickExtractData();
  192 |     await workflow.waitForOCRCompletion();
  193 |
  194 |     // Verify OCR data was filled
  195 |     const restaurantName = await workflow.getFormValue('restaurantName');
  196 |     expect(restaurantName).toBe('Zur Goldenen Gans');
  197 |
  198 |     const amount = await workflow.getFormValue('gesamtbetrag');
  199 |     expect(amount).toBe('85,50');
  200 |
  201 |     // Complete remaining required fields
  202 |     await workflow.fillFormField('teilnehmer', 'Test Teilnehmer');
  203 |     await workflow.fillFormField('anlass', 'Test Anlass');
  204 |     await workflow.selectDropdown('zahlungsart', 'firma');
  205 |     await workflow.selectDropdown('bewirtungsart', 'mitarbeiter');
  206 |
  207 |     // Generate PDF
  208 |     await workflow.clickGeneratePDF();
  209 |     await workflow.waitForPDFGeneration();
  210 |
  211 |     expect(await workflow.hasError()).toBe(false);
  212 |   });
  213 |
  214 |   test('should validate form before PDF generation', async ({ page }) => {
  215 |     // Try to generate PDF without filling required fields
  216 |     await workflow.clickGeneratePDF();
  217 |
  218 |     // Should show validation errors
  219 |     const errorVisible = await page.waitForSelector('[role="alert"]', { timeout: 5000 });
  220 |     expect(errorVisible).toBeTruthy();
  221 |
  222 |     // Fill minimum required fields
  223 |     await workflow.fillFormField('restaurantName', 'Test Restaurant');
  224 |     await workflow.setDate('datum', '06.08.2025');
  225 |     await workflow.fillFormField('teilnehmer', 'Test Person');
  226 |     await workflow.fillFormField('anlass', 'Test');
  227 |     await workflow.fillFormField('gesamtbetrag', '100,00');
  228 |     await workflow.selectDropdown('zahlungsart', 'bar');
  229 |     await workflow.selectDropdown('bewirtungsart', 'mitarbeiter');
  230 |
  231 |     // Now PDF generation should work
  232 |     await workflow.clickGeneratePDF();
  233 |     await workflow.waitForPDFGeneration();
  234 |
  235 |     expect(await workflow.hasError()).toBe(false);
  236 |   });
  237 |
  238 |   test('should handle PDF with multiple attachments', async ({ page }) => {
  239 |     // Upload multiple files
  240 |     const file1 = path.join(process.cwd(), 'test', 'rechnung.pdf');
  241 |     const file2 = path.join(process.cwd(), 'test', 'kreditbeleg.pdf');
  242 |     
  243 |     // Create test files if they don't exist
  244 |     if (!fs.existsSync(file1)) {
  245 |       fs.writeFileSync(file1, 'PDF test content 1');
  246 |     }
  247 |     if (!fs.existsSync(file2)) {
  248 |       fs.writeFileSync(file2, 'PDF test content 2');
  249 |     }
  250 |
  251 |     const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
> 252 |     await fileInput.setInputFiles([file1, file2]);
      |     ^ Error: locator.setInputFiles: Test timeout of 90000ms exceeded.
  253 |
  254 |     // Fill form
  255 |     await workflow.fillFormField('restaurantName', 'Multi-Attachment Test');
  256 |     await workflow.setDate('datum', '06.08.2025');
  257 |     await workflow.fillFormField('teilnehmer', 'Test');
  258 |     await workflow.fillFormField('anlass', 'Test');
  259 |     await workflow.fillFormField('gesamtbetrag', '200,00');
  260 |     await workflow.selectDropdown('zahlungsart', 'firma');
  261 |     await workflow.selectDropdown('bewirtungsart', 'kunden');
  262 |
  263 |     // Generate PDF with attachments
  264 |     await workflow.clickGeneratePDF();
  265 |     await workflow.waitForPDFGeneration();
  266 |
  267 |     expect(await workflow.hasError()).toBe(false);
  268 |   });
  269 |
  270 |   test('should calculate VAT correctly for German amounts', async ({ page }) => {
  271 |     // Fill form with amount
  272 |     await workflow.fillFormField('restaurantName', 'VAT Test Restaurant');
  273 |     await workflow.setDate('datum', '06.08.2025');
  274 |     await workflow.fillFormField('teilnehmer', 'Test');
  275 |     await workflow.fillFormField('anlass', 'VAT Test');
  276 |     await workflow.fillFormField('gesamtbetrag', '119,00'); // 100 + 19% VAT
  277 |     await workflow.selectDropdown('zahlungsart', 'firma');
  278 |     await workflow.selectDropdown('bewirtungsart', 'kunden');
  279 |
  280 |     // Check if VAT fields are calculated
  281 |     const mwstField = page.locator('input[name="gesamtbetragMwst"]');
  282 |     if (await mwstField.isVisible()) {
  283 |       // VAT should be auto-calculated as 19,00
  284 |       const mwstValue = await mwstField.inputValue();
  285 |       if (mwstValue) {
  286 |         expect(mwstValue).toMatch(/19[,.]00/);
  287 |       }
  288 |     }
  289 |
  290 |     // Generate PDF
  291 |     await workflow.clickGeneratePDF();
  292 |     await workflow.waitForPDFGeneration();
  293 |
  294 |     expect(await workflow.hasError()).toBe(false);
  295 |   });
  296 | });
```