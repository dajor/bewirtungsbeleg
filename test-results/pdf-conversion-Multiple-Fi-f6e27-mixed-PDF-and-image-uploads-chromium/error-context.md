# Test info

- Name: Multiple File Handling >> should handle mixed PDF and image uploads
- Location: /Users/daniel/dev/Bewritung/bewir/test/pdf-conversion.spec.ts:358:3

# Error details

```
Error: locator.setInputFiles: Error: strict mode violation: locator('input[type="file"]') resolved to 2 elements:
    1) <input multiple type="file" tabindex="-1" accept="image/png,image/jpeg,image/webp,application/pdf"/> aka getByRole('button', { name: 'Choose File' })
    2) <input type="file" accept=".json"/> aka locator('div').filter({ hasText: /^JSON DownloadJSON Upload$/ }).locator('input[type="file"]')

Call log:
  - waiting for locator('input[type="file"]')

    at /Users/daniel/dev/Bewritung/bewir/test/pdf-conversion.spec.ts:392:5
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
  292 |     // 3. Verify image displayed
  293 |     expect(await bewirtungsbelegPage.isImageDisplayed()).toBeTruthy();
  294 |
  295 |     // 4. Rotate right
  296 |     await bewirtungsbelegPage.rotateImageRight();
  297 |     expect(await bewirtungsbelegPage.isEditedBadgeVisible()).toBeTruthy();
  298 |
  299 |     // 5. Rotate left
  300 |     await bewirtungsbelegPage.rotateImageLeft();
  301 |
  302 |     // 6. Reset to original
  303 |     await bewirtungsbelegPage.resetImage();
  304 |     expect(await bewirtungsbelegPage.isEditedBadgeVisible()).toBeFalsy();
  305 |
  306 |     // 7. Verify image still displayed
  307 |     expect(await bewirtungsbelegPage.isImageDisplayed()).toBeTruthy();
  308 |   });
  309 |
  310 |   test('should not extract data from PDF files', async ({ page }) => {
  311 |     // Intercept extraction API to verify it's not called for PDFs
  312 |     let extractionCalled = false;
  313 |     await page.route('**/api/extract-receipt', route => {
  314 |       extractionCalled = true;
  315 |       route.continue();
  316 |     });
  317 |
  318 |     const testPdfPath = path.join(process.cwd(), 'test', 'test-receipt.pdf');
  319 |     
  320 |     if (!fs.existsSync(testPdfPath)) {
  321 |       const sourcePdf = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
  322 |       if (fs.existsSync(sourcePdf)) {
  323 |         fs.copyFileSync(sourcePdf, testPdfPath);
  324 |       } else {
  325 |         test.skip();
  326 |         return;
  327 |       }
  328 |     }
  329 |
  330 |     // Upload PDF
  331 |     await bewirtungsbelegPage.uploadFile(testPdfPath);
  332 |
  333 |     // Wait for conversion
  334 |     await bewirtungsbelegPage.waitForPdfConversion();
  335 |
  336 |     // Try to extract data
  337 |     const extractButton = page.locator('button:has-text("Daten extrahieren")');
  338 |     
  339 |     // Button should either be disabled or not trigger extraction for PDFs
  340 |     if (await extractButton.isVisible() && await extractButton.isEnabled()) {
  341 |       await extractButton.click();
  342 |       await page.waitForTimeout(2000);
  343 |     }
  344 |
  345 |     // Verify extraction was not called
  346 |     expect(extractionCalled).toBeFalsy();
  347 |   });
  348 | });
  349 |
  350 | test.describe('Multiple File Handling', () => {
  351 |   let bewirtungsbelegPage: BewirtungsbelegPage;
  352 |
  353 |   test.beforeEach(async ({ page }) => {
  354 |     bewirtungsbelegPage = new BewirtungsbelegPage(page);
  355 |     await bewirtungsbelegPage.navigate();
  356 |   });
  357 |
  358 |   test('should handle mixed PDF and image uploads', async ({ page }) => {
  359 |     // Create test files
  360 |     const testPdfPath = path.join(process.cwd(), 'test', 'test-receipt.pdf');
  361 |     const testPngPath = path.join(process.cwd(), 'test', 'test-image.png');
  362 |     
  363 |     // Ensure PDF exists
  364 |     if (!fs.existsSync(testPdfPath)) {
  365 |       const sourcePdf = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
  366 |       if (fs.existsSync(sourcePdf)) {
  367 |         fs.copyFileSync(sourcePdf, testPdfPath);
  368 |       } else {
  369 |         test.skip();
  370 |         return;
  371 |       }
  372 |     }
  373 |
  374 |     // Ensure PNG exists
  375 |     if (!fs.existsSync(testPngPath)) {
  376 |       const pngBuffer = Buffer.from([
  377 |         0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  378 |         0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  379 |         0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  380 |         0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  381 |         0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
  382 |         0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  383 |         0x00, 0x00, 0x03, 0x00, 0x01, 0x5E, 0xF9, 0x51,
  384 |         0x36, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
  385 |         0x44, 0xAE, 0x42, 0x60, 0x82
  386 |       ]);
  387 |       fs.writeFileSync(testPngPath, pngBuffer);
  388 |     }
  389 |
  390 |     // Upload both files
  391 |     const fileInput = page.locator('input[type="file"]');
> 392 |     await fileInput.setInputFiles([testPngPath, testPdfPath]);
      |     ^ Error: locator.setInputFiles: Error: strict mode violation: locator('input[type="file"]') resolved to 2 elements:
  393 |
  394 |     // Wait for PDF conversion (PNG should be instant)
  395 |     await page.waitForTimeout(3000);
  396 |
  397 |     // Both files should be visible in the list
  398 |     const fileCards = page.locator('[data-testid="file-card"]');
  399 |     const fileCount = await fileCards.count();
  400 |     expect(fileCount).toBeGreaterThanOrEqual(1);
  401 |   });
  402 | });
```