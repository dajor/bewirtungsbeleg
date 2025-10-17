# Test info

- Name: Complete Bewirtungsbeleg Workflow >> should handle PDF with multiple attachments
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-complete-workflow.spec.ts:236:3

# Error details

```
Error: locator.setInputFiles: Error: strict mode violation: locator('input[type="file"]') resolved to 2 elements:
    1) <input multiple type="file" tabindex="-1" accept="image/png,image/jpeg,image/webp,application/pdf"/> aka getByRole('button', { name: 'Choose File' })
    2) <input type="file" accept=".json"/> aka locator('div').filter({ hasText: /^JSON DownloadJSON Upload$/ }).locator('input[type="file"]')

Call log:
  - waiting for locator('input[type="file"]')

    at /Users/daniel/dev/Bewritung/bewir/test/e2e-complete-workflow.spec.ts:250:5
```

# Page snapshot

```yaml
- img "DocBits Logo"
- heading "Bewirtungsbeleg" [level=1]
- checkbox "Eigenbeleg (ohne Originalbeleg)"
- text: Eigenbeleg (ohne Originalbeleg)
- paragraph: "Aktivieren Sie diese Option, wenn Sie keinen Originalbeleg haben. Hinweis: Bei Eigenbelegen kann die Vorsteuer (MwSt.) nicht geltend gemacht werden."
- heading "Allgemeine Angaben" [level=2]
- paragraph: Foto/Scan der Rechnung
- paragraph: Laden Sie Fotos, Scans oder PDFs hoch - die Daten werden automatisch extrahiert
- button "Choose File"
- img
- paragraph: Dateien hier ablegen
- paragraph: Bilder (PNG, JPEG, WEBP) oder PDFs, max. 5 Dateien
- text: Datum der Bewirtung
- textbox "Datum der Bewirtung"
- text: Restaurant
- textbox "Restaurant"
- button "Restaurant suchen":
  - img
- text: Anschrift
- textbox "Anschrift"
- text: Art der Bewirtung
- paragraph: Wählen Sie die Art der Bewirtung - dies beeinflusst die steuerliche Abzugsfähigkeit
- radiogroup "Art der Bewirtung":
  - radio "Kundenbewirtung (70% abzugsfähig)" [checked]
  - text: Kundenbewirtung (70% abzugsfähig)
  - paragraph: Für Geschäftsfreunde (Kunden, Geschäftspartner). 70% der Kosten sind als Betriebsausgabe abziehbar.
  - radio "Mitarbeiterbewirtung (100% abzugsfähig)"
  - text: Mitarbeiterbewirtung (100% abzugsfähig)
  - paragraph: Für betriebliche Veranstaltungen (Teamessen, Arbeitsessen). 100% der Kosten sind als Betriebsausgabe abziehbar.
- heading "Finanzielle Details" [level=2]
- checkbox "Ausländische Rechnung (keine MwSt.)"
- text: Ausländische Rechnung (keine MwSt.)
- paragraph: Aktivieren Sie diese Option, wenn die Rechnung aus dem Ausland stammt. In diesem Fall wird der Gesamtbetrag als Netto behandelt.
- separator
- checkbox "ZUGFeRD-kompatibles PDF generieren"
- text: ZUGFeRD-kompatibles PDF generieren
- paragraph: Erstellt ein elektronisches Rechnungsformat nach ZUGFeRD 2.0 Standard für die digitale Archivierung
- text: Gesamtbetrag (Brutto)
- paragraph: Geben Sie den Gesamtbetrag der Rechnung ein (inkl. MwSt.)
- textbox "Gesamtbetrag (Brutto)"
- text: MwSt. Gesamtbetrag
- paragraph: MwSt. (19%) wird automatisch berechnet
- textbox "MwSt. Gesamtbetrag"
- text: Netto Gesamtbetrag
- paragraph: Netto wird automatisch berechnet
- textbox "Netto Gesamtbetrag"
- text: Betrag auf Kreditkarte/Bar
- paragraph: Geben Sie den Betrag ein, der auf der Kreditkarte belastet wurde (inkl. Trinkgeld)
- textbox "Betrag auf Kreditkarte/Bar"
- text: Trinkgeld
- paragraph: Geben Sie das Trinkgeld ein. Dies wird automatisch berechnet, wenn Sie den Betrag auf der Kreditkarte eingeben
- textbox "Trinkgeld"
- text: MwSt. Trinkgeld
- paragraph: MwSt. (19%) wird automatisch berechnet
- textbox "MwSt. Trinkgeld"
- text: Zahlungsart
- paragraph: Wählen Sie die Art der Zahlung. Die Rechnung muss auf die Firma ausgestellt sein.
- textbox "Zahlungsart": Firmenkreditkarte
- img
- heading "Geschäftlicher Anlass" [level=2]
- text: Geschäftlicher Anlass
- paragraph: Geben Sie den konkreten Anlass an (z.B. 'Kundengespräch', 'Projektbesprechung')
- textbox "Geschäftlicher Anlass"
- text: Namen aller Teilnehmer
- paragraph: Geben Sie die Namen aller Teilnehmer ein (auch Ihren eigenen Namen)
- textbox "Namen aller Teilnehmer"
- text: Namen der Geschäftspartner
- paragraph: Geben Sie die Namen der Geschäftspartner ein
- textbox "Namen der Geschäftspartner"
- text: Firma der Geschäftspartner
- paragraph: Geben Sie die Firma der Geschäftspartner ein
- textbox "Firma der Geschäftspartner"
- button "JSON Download":
  - img
  - text: JSON Download
- img
- button "JSON Upload"
- button "Bewirtungsbeleg erstellen"
- alert
```

# Test source

```ts
  150 |     
  151 |     // Verify no errors occurred
  152 |     const hasError = await workflow.hasError();
  153 |     expect(hasError).toBe(false);
  154 |   });
  155 |
  156 |   test('should handle OCR extraction and auto-fill form fields', async ({ page }) => {
  157 |     // Mock OCR response for testing
  158 |     await page.route('**/api/extract-receipt', route => {
  159 |       route.fulfill({
  160 |         status: 200,
  161 |         body: JSON.stringify({
  162 |           restaurantName: 'Zur Goldenen Gans',
  163 |           restaurantAnschrift: 'Hauptstraße 42, 10115 Berlin',
  164 |           gesamtbetrag: '85,50',
  165 |           datum: '05.08.2025',
  166 |           mwst: '13,65',
  167 |           netto: '71,85'
  168 |         })
  169 |       });
  170 |     });
  171 |
  172 |     const testImagePath = path.join(process.cwd(), 'test', 'test-receipt.png');
  173 |     if (!fs.existsSync(testImagePath)) {
  174 |       const pngBuffer = Buffer.from([
  175 |         0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  176 |         0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  177 |         0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  178 |         0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  179 |         0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
  180 |         0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  181 |         0x00, 0x00, 0x03, 0x00, 0x01, 0x5E, 0xF9, 0x51,
  182 |         0x36, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
  183 |         0x44, 0xAE, 0x42, 0x60, 0x82
  184 |       ]);
  185 |       fs.writeFileSync(testImagePath, pngBuffer);
  186 |     }
  187 |
  188 |     await workflow.uploadReceipt(testImagePath);
  189 |     await workflow.clickExtractData();
  190 |     await workflow.waitForOCRCompletion();
  191 |
  192 |     // Verify OCR data was filled
  193 |     const restaurantName = await workflow.getFormValue('restaurantName');
  194 |     expect(restaurantName).toBe('Zur Goldenen Gans');
  195 |
  196 |     const amount = await workflow.getFormValue('gesamtbetrag');
  197 |     expect(amount).toBe('85,50');
  198 |
  199 |     // Complete remaining required fields
  200 |     await workflow.fillFormField('teilnehmer', 'Test Teilnehmer');
  201 |     await workflow.fillFormField('anlass', 'Test Anlass');
  202 |     await workflow.selectDropdown('zahlungsart', 'firma');
  203 |     await workflow.selectDropdown('bewirtungsart', 'mitarbeiter');
  204 |
  205 |     // Generate PDF
  206 |     await workflow.clickGeneratePDF();
  207 |     await workflow.waitForPDFGeneration();
  208 |
  209 |     expect(await workflow.hasError()).toBe(false);
  210 |   });
  211 |
  212 |   test('should validate form before PDF generation', async ({ page }) => {
  213 |     // Try to generate PDF without filling required fields
  214 |     await workflow.clickGeneratePDF();
  215 |
  216 |     // Should show validation errors
  217 |     const errorVisible = await page.waitForSelector('[role="alert"]', { timeout: 5000 });
  218 |     expect(errorVisible).toBeTruthy();
  219 |
  220 |     // Fill minimum required fields
  221 |     await workflow.fillFormField('restaurantName', 'Test Restaurant');
  222 |     await workflow.setDate('datum', '06.08.2025');
  223 |     await workflow.fillFormField('teilnehmer', 'Test Person');
  224 |     await workflow.fillFormField('anlass', 'Test');
  225 |     await workflow.fillFormField('gesamtbetrag', '100,00');
  226 |     await workflow.selectDropdown('zahlungsart', 'bar');
  227 |     await workflow.selectDropdown('bewirtungsart', 'mitarbeiter');
  228 |
  229 |     // Now PDF generation should work
  230 |     await workflow.clickGeneratePDF();
  231 |     await workflow.waitForPDFGeneration();
  232 |
  233 |     expect(await workflow.hasError()).toBe(false);
  234 |   });
  235 |
  236 |   test('should handle PDF with multiple attachments', async ({ page }) => {
  237 |     // Upload multiple files
  238 |     const file1 = path.join(process.cwd(), 'test', 'rechnung.pdf');
  239 |     const file2 = path.join(process.cwd(), 'test', 'kreditbeleg.pdf');
  240 |     
  241 |     // Create test files if they don't exist
  242 |     if (!fs.existsSync(file1)) {
  243 |       fs.writeFileSync(file1, 'PDF test content 1');
  244 |     }
  245 |     if (!fs.existsSync(file2)) {
  246 |       fs.writeFileSync(file2, 'PDF test content 2');
  247 |     }
  248 |
  249 |     const fileInput = page.locator('input[type="file"]');
> 250 |     await fileInput.setInputFiles([file1, file2]);
      |     ^ Error: locator.setInputFiles: Error: strict mode violation: locator('input[type="file"]') resolved to 2 elements:
  251 |
  252 |     // Fill form
  253 |     await workflow.fillFormField('restaurantName', 'Multi-Attachment Test');
  254 |     await workflow.setDate('datum', '06.08.2025');
  255 |     await workflow.fillFormField('teilnehmer', 'Test');
  256 |     await workflow.fillFormField('anlass', 'Test');
  257 |     await workflow.fillFormField('gesamtbetrag', '200,00');
  258 |     await workflow.selectDropdown('zahlungsart', 'firma');
  259 |     await workflow.selectDropdown('bewirtungsart', 'kunden');
  260 |
  261 |     // Generate PDF with attachments
  262 |     await workflow.clickGeneratePDF();
  263 |     await workflow.waitForPDFGeneration();
  264 |
  265 |     expect(await workflow.hasError()).toBe(false);
  266 |   });
  267 |
  268 |   test('should calculate VAT correctly for German amounts', async ({ page }) => {
  269 |     // Fill form with amount
  270 |     await workflow.fillFormField('restaurantName', 'VAT Test Restaurant');
  271 |     await workflow.setDate('datum', '06.08.2025');
  272 |     await workflow.fillFormField('teilnehmer', 'Test');
  273 |     await workflow.fillFormField('anlass', 'VAT Test');
  274 |     await workflow.fillFormField('gesamtbetrag', '119,00'); // 100 + 19% VAT
  275 |     await workflow.selectDropdown('zahlungsart', 'firma');
  276 |     await workflow.selectDropdown('bewirtungsart', 'kunden');
  277 |
  278 |     // Check if VAT fields are calculated
  279 |     const mwstField = page.locator('input[name="gesamtbetragMwst"]');
  280 |     if (await mwstField.isVisible()) {
  281 |       // VAT should be auto-calculated as 19,00
  282 |       const mwstValue = await mwstField.inputValue();
  283 |       if (mwstValue) {
  284 |         expect(mwstValue).toMatch(/19[,.]00/);
  285 |       }
  286 |     }
  287 |
  288 |     // Generate PDF
  289 |     await workflow.clickGeneratePDF();
  290 |     await workflow.waitForPDFGeneration();
  291 |
  292 |     expect(await workflow.hasError()).toBe(false);
  293 |   });
  294 | });
```