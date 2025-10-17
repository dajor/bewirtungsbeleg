# Test info

- Name: PDF to Image Conversion >> should complete full PDF workflow with rotation
- Location: /Users/daniel/dev/Bewritung/bewir/test/pdf-conversion.spec.ts:274:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
    at /Users/daniel/dev/Bewritung/bewir/test/pdf-conversion.spec.ts:294:58
```

# Page snapshot

```yaml
- banner:
  - link "DocBits":
    - /url: /
    - img "DocBits"
  - link "Beleg erstellen":
    - /url: /bewirtungsbeleg
  - link "Dokument scannen":
    - /url: /scanner
  - link "Features":
    - /url: /#features
  - link "GoBD":
    - /url: /gobd
  - link "Release Notes":
    - /url: /release-notes
  - link "Anmelden":
    - /url: /auth/anmelden
  - link "Registrieren":
    - /url: /auth/registrieren
- main:
  - img "DocBits Logo"
  - alert:
    - text: Fehler Fehler bei der PDF-Konvertierung von test-receipt.pdf. Bitte füllen Sie die Felder manuell aus.
    - button:
      - img
  - text: Zahlenformat
  - paragraph: Wählen Sie das Zahlenformat für die Anzeige. Die Daten werden automatisch umgerechnet.
  - textbox "Zahlenformat": English (United States) (1,234.56)
  - img
  - separator
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
  - paragraph: Hochgeladene Dateien (1/5)
  - img
  - paragraph: PDF
  - paragraph: test-receipt.pdf
  - text: Analysiere... 210.3 KB
  - button "Datei entfernen":
    - img
  - text: Datum der Bewirtung
  - textbox "Datum der Bewirtung"
  - text: Restaurant
  - textbox "Restaurant"
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
  - heading "💰 Finanzielle Berechnung" [level=3]
  - paragraph: "Bitte folgen Sie der Reihenfolge auf Ihrer Rechnung: Netto → MwSt. → Gesamtsumme → Bezahlter Betrag → Trinkgeld"
  - paragraph: 📝 Eingabefelder
  - paragraph: Tragen Sie die Beträge von Ihrer Rechnung ein
  - text: 1. Netto Betrag
  - paragraph: Netto-Gesamtsumme von der Rechnung
  - textbox "1. Netto Betrag"
  - paragraph: 2. Mehrwertsteuer
  - text: MwSt. 7%
  - paragraph: 7% (Speisen)
  - textbox "MwSt. 7%"
  - text: MwSt. 19%
  - paragraph: 19% (Getränke)
  - textbox "MwSt. 19%"
  - text: Gesamt MwSt.
  - paragraph: = MwSt. 7% + MwSt. 19%
  - textbox "Gesamt MwSt."
  - text: 3. Brutto Gesamtbetrag
  - paragraph: "Editierbar: Brutto ⇄ Netto (Berechnung in beide Richtungen)"
  - textbox "3. Brutto Gesamtbetrag"
  - separator
  - text: 4. Bezahlter Betrag
  - paragraph: Was wurde tatsächlich bezahlt? (inkl. Trinkgeld)
  - textbox "4. Bezahlter Betrag"
  - text: 5. Trinkgeld
  - paragraph: = Bezahlt - Gesamtbetrag (automatisch berechnet)
  - textbox "5. Trinkgeld"
  - text: MwSt. Trinkgeld (19%)
  - paragraph: 19% vom Trinkgeld
  - textbox "MwSt. Trinkgeld (19%)"
  - paragraph: 🧮 Live Berechnung
  - paragraph: Echtzeit-Übersicht Ihrer Eingaben
  - paragraph: Gesamtbetrag Berechnung
  - paragraph: "Netto:"
  - paragraph: 0.00 €
  - paragraph: "+ MwSt. 7%:"
  - paragraph: 0.00 €
  - paragraph: "+ MwSt. 19%:"
  - paragraph: 0.00 €
  - separator
  - paragraph: "= Gesamtbetrag:"
  - paragraph: 0.00 €
  - text: Zahlungsart
  - paragraph: Wie wurde bezahlt? Die Rechnung muss auf die Firma ausgestellt sein.
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
  - button "Weiter"
  - paragraph: Image Editor
  - alert:
    - img
    - text: Failed to convert PDF. Please try with an image file.
    - button:
      - img
  - img
  - paragraph: No preview available
  - paragraph: Rotation Controls
  - button [disabled]:
    - img
  - button [disabled]:
    - img
  - button [disabled]:
    - img
  - button [disabled]:
    - img
  - button "Apply Rotation" [disabled]
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
  194 |     await page.waitForTimeout(2000);
  195 |     
  196 |     // Check error is visible
  197 |     const errorVisible = await bewirtungsbelegPage.isErrorMessageVisible();
  198 |     expect(errorVisible).toBeTruthy();
  199 |   });
  200 |
  201 |   test('should clear error when removing PDF file', async ({ page }) => {
  202 |     // Mock a failed PDF conversion
  203 |     await page.route('**/api/convert-pdf', route => {
  204 |       route.fulfill({
  205 |         status: 500,
  206 |         body: JSON.stringify({ error: 'Conversion failed' })
  207 |       });
  208 |     });
  209 |
  210 |     const testPdfPath = path.join(process.cwd(), 'test', 'test-receipt.pdf');
  211 |     
  212 |     if (!fs.existsSync(testPdfPath)) {
  213 |       const sourcePdf = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
  214 |       if (fs.existsSync(sourcePdf)) {
  215 |         fs.copyFileSync(sourcePdf, testPdfPath);
  216 |       } else {
  217 |         test.skip();
  218 |         return;
  219 |       }
  220 |     }
  221 |
  222 |     // Upload PDF that will fail
  223 |     await bewirtungsbelegPage.uploadFile(testPdfPath);
  224 |
  225 |     // Wait for error
  226 |     await page.waitForTimeout(2000);
  227 |     expect(await bewirtungsbelegPage.isErrorMessageVisible()).toBeTruthy();
  228 |
  229 |     // Remove file
  230 |     await bewirtungsbelegPage.removeFile();
  231 |
  232 |     // Error should be cleared
  233 |     await page.waitForTimeout(500);
  234 |     expect(await bewirtungsbelegPage.isErrorMessageVisible()).toBeFalsy();
  235 |   });
  236 |
  237 |   test('should handle PNG files without conversion', async ({ page }) => {
  238 |     // Create a test PNG file
  239 |     const testPngPath = path.join(process.cwd(), 'test', 'test-image.png');
  240 |     
  241 |     // Create a simple PNG if it doesn't exist
  242 |     if (!fs.existsSync(testPngPath)) {
  243 |       // Create a 1x1 red pixel PNG
  244 |       const pngBuffer = Buffer.from([
  245 |         0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  246 |         0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  247 |         0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  248 |         0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  249 |         0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
  250 |         0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  251 |         0x00, 0x00, 0x03, 0x00, 0x01, 0x5E, 0xF9, 0x51,
  252 |         0x36, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
  253 |         0x44, 0xAE, 0x42, 0x60, 0x82
  254 |       ]);
  255 |       fs.writeFileSync(testPngPath, pngBuffer);
  256 |     }
  257 |
  258 |     // Upload PNG file
  259 |     await bewirtungsbelegPage.uploadFile(testPngPath);
  260 |
  261 |     // Should NOT show "Converting PDF..." message
  262 |     const convertingMessage = page.locator('text=Converting PDF...');
  263 |     await expect(convertingMessage).not.toBeVisible({ timeout: 2000 });
  264 |
  265 |     // Image should be displayed immediately
  266 |     const isImageVisible = await bewirtungsbelegPage.isImageDisplayed();
  267 |     expect(isImageVisible).toBeTruthy();
  268 |
  269 |     // Rotation should be enabled
  270 |     const isRotateEnabled = await bewirtungsbelegPage.isRotateButtonEnabled();
  271 |     expect(isRotateEnabled).toBeTruthy();
  272 |   });
  273 |
  274 |   test('should complete full PDF workflow with rotation', async ({ page }) => {
  275 |     const testPdfPath = path.join(process.cwd(), 'test', 'test-receipt.pdf');
  276 |     
  277 |     if (!fs.existsSync(testPdfPath)) {
  278 |       const sourcePdf = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
  279 |       if (fs.existsSync(sourcePdf)) {
  280 |         fs.copyFileSync(sourcePdf, testPdfPath);
  281 |       } else {
  282 |         test.skip();
  283 |         return;
  284 |       }
  285 |     }
  286 |
  287 |     // 1. Upload PDF
  288 |     await bewirtungsbelegPage.uploadFile(testPdfPath);
  289 |
  290 |     // 2. Wait for conversion
  291 |     await bewirtungsbelegPage.waitForPdfConversion();
  292 |
  293 |     // 3. Verify image displayed
> 294 |     expect(await bewirtungsbelegPage.isImageDisplayed()).toBeTruthy();
      |                                                          ^ Error: expect(received).toBeTruthy()
  295 |
  296 |     // 4. Rotate right
  297 |     await bewirtungsbelegPage.rotateImageRight();
  298 |     expect(await bewirtungsbelegPage.isEditedBadgeVisible()).toBeTruthy();
  299 |
  300 |     // 5. Rotate left
  301 |     await bewirtungsbelegPage.rotateImageLeft();
  302 |
  303 |     // 6. Reset to original
  304 |     await bewirtungsbelegPage.resetImage();
  305 |     expect(await bewirtungsbelegPage.isEditedBadgeVisible()).toBeFalsy();
  306 |
  307 |     // 7. Verify image still displayed
  308 |     expect(await bewirtungsbelegPage.isImageDisplayed()).toBeTruthy();
  309 |   });
  310 |
  311 |   test('should not extract data from PDF files', async ({ page }) => {
  312 |     // Intercept extraction API to verify it's not called for PDFs
  313 |     let extractionCalled = false;
  314 |     await page.route('**/api/extract-receipt', route => {
  315 |       extractionCalled = true;
  316 |       route.continue();
  317 |     });
  318 |
  319 |     const testPdfPath = path.join(process.cwd(), 'test', 'test-receipt.pdf');
  320 |     
  321 |     if (!fs.existsSync(testPdfPath)) {
  322 |       const sourcePdf = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
  323 |       if (fs.existsSync(sourcePdf)) {
  324 |         fs.copyFileSync(sourcePdf, testPdfPath);
  325 |       } else {
  326 |         test.skip();
  327 |         return;
  328 |       }
  329 |     }
  330 |
  331 |     // Upload PDF
  332 |     await bewirtungsbelegPage.uploadFile(testPdfPath);
  333 |
  334 |     // Wait for conversion
  335 |     await bewirtungsbelegPage.waitForPdfConversion();
  336 |
  337 |     // Try to extract data
  338 |     const extractButton = page.locator('button:has-text("Daten extrahieren")');
  339 |     
  340 |     // Button should either be disabled or not trigger extraction for PDFs
  341 |     if (await extractButton.isVisible() && await extractButton.isEnabled()) {
  342 |       await extractButton.click();
  343 |       await page.waitForTimeout(2000);
  344 |     }
  345 |
  346 |     // Verify extraction was not called
  347 |     expect(extractionCalled).toBeFalsy();
  348 |   });
  349 | });
  350 |
  351 | test.describe('Multiple File Handling', () => {
  352 |   let bewirtungsbelegPage: BewirtungsbelegPage;
  353 |
  354 |   test.beforeEach(async ({ page }) => {
  355 |     bewirtungsbelegPage = new BewirtungsbelegPage(page);
  356 |     await bewirtungsbelegPage.navigate();
  357 |   });
  358 |
  359 |   test('should handle mixed PDF and image uploads', async ({ page }) => {
  360 |     // Create test files
  361 |     const testPdfPath = path.join(process.cwd(), 'test', 'test-receipt.pdf');
  362 |     const testPngPath = path.join(process.cwd(), 'test', 'test-image.png');
  363 |     
  364 |     // Ensure PDF exists
  365 |     if (!fs.existsSync(testPdfPath)) {
  366 |       const sourcePdf = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
  367 |       if (fs.existsSync(sourcePdf)) {
  368 |         fs.copyFileSync(sourcePdf, testPdfPath);
  369 |       } else {
  370 |         test.skip();
  371 |         return;
  372 |       }
  373 |     }
  374 |
  375 |     // Ensure PNG exists
  376 |     if (!fs.existsSync(testPngPath)) {
  377 |       const pngBuffer = Buffer.from([
  378 |         0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  379 |         0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  380 |         0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  381 |         0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  382 |         0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
  383 |         0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  384 |         0x00, 0x00, 0x03, 0x00, 0x01, 0x5E, 0xF9, 0x51,
  385 |         0x36, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
  386 |         0x44, 0xAE, 0x42, 0x60, 0x82
  387 |       ]);
  388 |       fs.writeFileSync(testPngPath, pngBuffer);
  389 |     }
  390 |
  391 |     // Upload both files
  392 |     const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
  393 |     await fileInput.setInputFiles([testPngPath, testPdfPath]);
  394 |
```