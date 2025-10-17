# Test info

- Name: Complete Bewirtungsbeleg Workflow >> should handle PDF with multiple attachments
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-complete-workflow.spec.ts:237:3

# Error details

```
Error: locator.setInputFiles: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first()

    at /Users/daniel/dev/Bewritung/bewir/test/e2e-complete-workflow.spec.ts:251:5
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
  151 |     
  152 |     // Verify no errors occurred
  153 |     const hasError = await workflow.hasError();
  154 |     expect(hasError).toBe(false);
  155 |   });
  156 |
  157 |   test('should handle OCR extraction and auto-fill form fields', async ({ page }) => {
  158 |     // Mock OCR response for testing
  159 |     await page.route('**/api/extract-receipt', route => {
  160 |       route.fulfill({
  161 |         status: 200,
  162 |         body: JSON.stringify({
  163 |           restaurantName: 'Zur Goldenen Gans',
  164 |           restaurantAnschrift: 'Hauptstraße 42, 10115 Berlin',
  165 |           gesamtbetrag: '85,50',
  166 |           datum: '05.08.2025',
  167 |           mwst: '13,65',
  168 |           netto: '71,85'
  169 |         })
  170 |       });
  171 |     });
  172 |
  173 |     const testImagePath = path.join(process.cwd(), 'test', 'test-receipt.png');
  174 |     if (!fs.existsSync(testImagePath)) {
  175 |       const pngBuffer = Buffer.from([
  176 |         0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  177 |         0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  178 |         0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  179 |         0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  180 |         0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
  181 |         0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  182 |         0x00, 0x00, 0x03, 0x00, 0x01, 0x5E, 0xF9, 0x51,
  183 |         0x36, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
  184 |         0x44, 0xAE, 0x42, 0x60, 0x82
  185 |       ]);
  186 |       fs.writeFileSync(testImagePath, pngBuffer);
  187 |     }
  188 |
  189 |     await workflow.uploadReceipt(testImagePath);
  190 |     await workflow.clickExtractData();
  191 |     await workflow.waitForOCRCompletion();
  192 |
  193 |     // Verify OCR data was filled
  194 |     const restaurantName = await workflow.getFormValue('restaurantName');
  195 |     expect(restaurantName).toBe('Zur Goldenen Gans');
  196 |
  197 |     const amount = await workflow.getFormValue('gesamtbetrag');
  198 |     expect(amount).toBe('85,50');
  199 |
  200 |     // Complete remaining required fields
  201 |     await workflow.fillFormField('teilnehmer', 'Test Teilnehmer');
  202 |     await workflow.fillFormField('anlass', 'Test Anlass');
  203 |     await workflow.selectDropdown('zahlungsart', 'firma');
  204 |     await workflow.selectDropdown('bewirtungsart', 'mitarbeiter');
  205 |
  206 |     // Generate PDF
  207 |     await workflow.clickGeneratePDF();
  208 |     await workflow.waitForPDFGeneration();
  209 |
  210 |     expect(await workflow.hasError()).toBe(false);
  211 |   });
  212 |
  213 |   test('should validate form before PDF generation', async ({ page }) => {
  214 |     // Try to generate PDF without filling required fields
  215 |     await workflow.clickGeneratePDF();
  216 |
  217 |     // Should show validation errors
  218 |     const errorVisible = await page.waitForSelector('[role="alert"]', { timeout: 5000 });
  219 |     expect(errorVisible).toBeTruthy();
  220 |
  221 |     // Fill minimum required fields
  222 |     await workflow.fillFormField('restaurantName', 'Test Restaurant');
  223 |     await workflow.setDate('datum', '06.08.2025');
  224 |     await workflow.fillFormField('teilnehmer', 'Test Person');
  225 |     await workflow.fillFormField('anlass', 'Test');
  226 |     await workflow.fillFormField('gesamtbetrag', '100,00');
  227 |     await workflow.selectDropdown('zahlungsart', 'bar');
  228 |     await workflow.selectDropdown('bewirtungsart', 'mitarbeiter');
  229 |
  230 |     // Now PDF generation should work
  231 |     await workflow.clickGeneratePDF();
  232 |     await workflow.waitForPDFGeneration();
  233 |
  234 |     expect(await workflow.hasError()).toBe(false);
  235 |   });
  236 |
  237 |   test('should handle PDF with multiple attachments', async ({ page }) => {
  238 |     // Upload multiple files
  239 |     const file1 = path.join(process.cwd(), 'test', 'rechnung.pdf');
  240 |     const file2 = path.join(process.cwd(), 'test', 'kreditbeleg.pdf');
  241 |     
  242 |     // Create test files if they don't exist
  243 |     if (!fs.existsSync(file1)) {
  244 |       fs.writeFileSync(file1, 'PDF test content 1');
  245 |     }
  246 |     if (!fs.existsSync(file2)) {
  247 |       fs.writeFileSync(file2, 'PDF test content 2');
  248 |     }
  249 |
  250 |     const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
> 251 |     await fileInput.setInputFiles([file1, file2]);
      |     ^ Error: locator.setInputFiles: Test timeout of 60000ms exceeded.
  252 |
  253 |     // Fill form
  254 |     await workflow.fillFormField('restaurantName', 'Multi-Attachment Test');
  255 |     await workflow.setDate('datum', '06.08.2025');
  256 |     await workflow.fillFormField('teilnehmer', 'Test');
  257 |     await workflow.fillFormField('anlass', 'Test');
  258 |     await workflow.fillFormField('gesamtbetrag', '200,00');
  259 |     await workflow.selectDropdown('zahlungsart', 'firma');
  260 |     await workflow.selectDropdown('bewirtungsart', 'kunden');
  261 |
  262 |     // Generate PDF with attachments
  263 |     await workflow.clickGeneratePDF();
  264 |     await workflow.waitForPDFGeneration();
  265 |
  266 |     expect(await workflow.hasError()).toBe(false);
  267 |   });
  268 |
  269 |   test('should calculate VAT correctly for German amounts', async ({ page }) => {
  270 |     // Fill form with amount
  271 |     await workflow.fillFormField('restaurantName', 'VAT Test Restaurant');
  272 |     await workflow.setDate('datum', '06.08.2025');
  273 |     await workflow.fillFormField('teilnehmer', 'Test');
  274 |     await workflow.fillFormField('anlass', 'VAT Test');
  275 |     await workflow.fillFormField('gesamtbetrag', '119,00'); // 100 + 19% VAT
  276 |     await workflow.selectDropdown('zahlungsart', 'firma');
  277 |     await workflow.selectDropdown('bewirtungsart', 'kunden');
  278 |
  279 |     // Check if VAT fields are calculated
  280 |     const mwstField = page.locator('input[name="gesamtbetragMwst"]');
  281 |     if (await mwstField.isVisible()) {
  282 |       // VAT should be auto-calculated as 19,00
  283 |       const mwstValue = await mwstField.inputValue();
  284 |       if (mwstValue) {
  285 |         expect(mwstValue).toMatch(/19[,.]00/);
  286 |       }
  287 |     }
  288 |
  289 |     // Generate PDF
  290 |     await workflow.clickGeneratePDF();
  291 |     await workflow.waitForPDFGeneration();
  292 |
  293 |     expect(await workflow.hasError()).toBe(false);
  294 |   });
  295 | });
```