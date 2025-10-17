# Test info

- Name: Multi-Page PDF Field Preservation >> Paul3.jpg: Combined receipt - both amounts on same page
- Location: /Users/daniel/dev/Bewritung/bewir/test/multipage-pdf-field-preservation.spec.ts:286:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "45.00"
Received: ""
    at /Users/daniel/dev/Bewritung/bewir/test/multipage-pdf-field-preservation.spec.ts:344:32
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
- paragraph: Hochgeladene Dateien (1/5)
- img "14102025 (Paul3).jpg"
- paragraph: 14102025 (Paul3).jpg
- text: Rechnung&Kreditkartenbeleg 1.2 MB
- textbox "Klassifizierung"
- img
- button "Datei entfernen":
  - img
- text: Datum der Bewirtung
- textbox "Datum der Bewirtung": 06.12.2023
- text: Restaurant
- textbox "Restaurant": Osteria del Parco
- button "Restaurant suchen":
  - img
- text: Anschrift
- textbox "Anschrift": Anzinger Strasse 1, 85586 Poing
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
- textbox "Gesamtbetrag (Brutto)": "38.90"
- text: MwSt. Gesamtbetrag
- paragraph: MwSt. (19%) wird automatisch berechnet
- textbox "MwSt. Gesamtbetrag": "6.21"
- text: Netto Gesamtbetrag
- paragraph: Netto wird automatisch berechnet
- textbox "Netto Gesamtbetrag": "32.69"
- text: Betrag auf Kreditkarte/Bar
- paragraph: Geben Sie den Betrag ein, der auf der Kreditkarte belastet wurde (inkl. Trinkgeld)
- textbox "Betrag auf Kreditkarte/Bar"
- text: Trinkgeld
- paragraph: Geben Sie das Trinkgeld ein. Dies wird automatisch berechnet, wenn Sie den Betrag auf der Kreditkarte eingeben
- textbox "Trinkgeld": "6.10"
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
- paragraph: Image Editor
- img "Receipt preview"
- paragraph: Rotation Controls
- button:
  - img
- button:
  - img
- button:
  - img
- button [disabled]:
  - img
- button "Apply Rotation" [disabled]
- alert
```

# Test source

```ts
  244 |   });
  245 |
  246 |   test('Edge case: Empty tip (kreditkartenbetrag equals gesamtbetrag)', async ({ page }) => {
  247 |     // Manually enter values to test edge case
  248 |     await page.locator('input[placeholder*="Gesamtbetrag"]').fill('100.00');
  249 |     await page.locator('input[placeholder*="Kreditkarte"]').fill('100.00');
  250 |
  251 |     // Trigger calculation by blurring the input
  252 |     await page.locator('input[placeholder*="Kreditkarte"]').blur();
  253 |
  254 |     // Wait for calculation
  255 |     await page.waitForTimeout(500);
  256 |
  257 |     // Tip should be 0.00
  258 |     const trinkgeld = await page.locator('input[placeholder*="Trinkgeld"]').first().inputValue();
  259 |     const tipValue = parseFloat(trinkgeld.replace(',', '.'));
  260 |
  261 |     expect(tipValue).toBe(0.00);
  262 |     console.log('✅ Edge case: Empty tip correctly calculated as 0.00');
  263 |   });
  264 |
  265 |   test('Edge case: Negative tip (kreditkartenbetrag less than gesamtbetrag)', async ({ page }) => {
  266 |     // Manually enter values to test edge case
  267 |     await page.locator('input[placeholder*="Gesamtbetrag"]').fill('100.00');
  268 |     await page.locator('input[placeholder*="Kreditkarte"]').fill('95.00');
  269 |
  270 |     // Trigger calculation by blurring the input
  271 |     await page.locator('input[placeholder*="Kreditkarte"]').blur();
  272 |
  273 |     // Wait for calculation
  274 |     await page.waitForTimeout(500);
  275 |
  276 |     // In this case, the application should handle negative tips appropriately
  277 |     // (either not calculate or show error)
  278 |     const trinkgeld = await page.locator('input[placeholder*="Trinkgeld"]').first().inputValue();
  279 |     console.log('Edge case: Negative tip scenario, trinkgeld =', trinkgeld);
  280 |
  281 |     // Application-specific validation: tip should either be empty or negative
  282 |     // (depends on business logic)
  283 |     expect(trinkgeld).toBeDefined();
  284 |   });
  285 |
  286 |   test('Paul3.jpg: Combined receipt - both amounts on same page', async ({ page }) => {
  287 |     // Increase timeout for this test
  288 |     test.setTimeout(60000); // 60 seconds
  289 |
  290 |     const imagePath = path.join(TEST_FILES_DIR, '14102025 (Paul3).jpg');
  291 |
  292 |     // Check if file exists
  293 |     if (!fs.existsSync(imagePath)) {
  294 |       test.skip();
  295 |       return;
  296 |     }
  297 |
  298 |     console.log('📄 Testing Paul3.jpg: Combined receipt (Kreditkartenbeleg + Rechnung on same page)');
  299 |
  300 |     // Upload the image
  301 |     const fileInput = page.locator('input[type="file"]').first();
  302 |     await fileInput.setInputFiles(imagePath);
  303 |
  304 |     // Wait for OCR to complete
  305 |     console.log('⏳ Waiting for OCR...');
  306 |
  307 |     // Wait for the gesamtbetrag field to be populated
  308 |     await page.waitForFunction(() => {
  309 |       const input = document.querySelector('input[placeholder*="Gesamtbetrag"]') as HTMLInputElement;
  310 |       return input && input.value && input.value !== '';
  311 |     }, { timeout: 30000 }).catch(() => {
  312 |       console.log('⚠️ Timeout waiting for gesamtbetrag to be populated');
  313 |     });
  314 |
  315 |     // Give a bit more time for all fields to settle
  316 |     await page.waitForTimeout(2000);
  317 |
  318 |     // Check if any error notifications appeared
  319 |     const errorNotification = page.locator('[class*="Notification"]', { hasText: 'Fehler' });
  320 |     if (await errorNotification.isVisible()) {
  321 |       const errorText = await errorNotification.textContent();
  322 |       console.error('❌ Error notification:', errorText);
  323 |     }
  324 |
  325 |     // Extract field values
  326 |     const gesamtbetrag = await page.locator('input[placeholder*="Gesamtbetrag"]').inputValue();
  327 |     const kreditkartenBetrag = await page.locator('input[placeholder*="Kreditkarte"]').inputValue();
  328 |     const trinkgeld = await page.locator('input[placeholder*="Trinkgeld"]').first().inputValue();
  329 |     const trinkgeldMwst = await page.locator('input[placeholder*="MwSt"]').nth(1).inputValue();
  330 |
  331 |     console.log('📊 Extracted Values:');
  332 |     console.log('  gesamtbetrag:', gesamtbetrag);
  333 |     console.log('  kreditkartenBetrag:', kreditkartenBetrag);
  334 |     console.log('  trinkgeld:', trinkgeld);
  335 |     console.log('  trinkgeldMwst:', trinkgeldMwst);
  336 |
  337 |     // Assertions: Verify BOTH amounts are extracted correctly from combined receipt
  338 |
  339 |     // 1. Invoice amount from right side (Rechnung: EC-Cash-Total *38,90)
  340 |     expect(gesamtbetrag).toBe('38.90');
  341 |     console.log('✅ gesamtbetrag correct: 38.90');
  342 |
  343 |     // 2. CRITICAL: Credit card amount from left side (SUMME EUR: 45,00) MUST BE EXTRACTED
> 344 |     expect(kreditkartenBetrag).toBe('45.00');
      |                                ^ Error: expect(received).toBe(expected) // Object.is equality
  345 |     console.log('✅ kreditkartenBetrag extracted: 45.00');
  346 |
  347 |     // 3. Tip should be calculated correctly (45.00 - 38.90 = 6.10)
  348 |     const tipValue = parseFloat(trinkgeld.replace(',', '.'));
  349 |     expect(tipValue).toBeCloseTo(6.10, 2);
  350 |     console.log('✅ trinkgeld calculated correctly: 6.10');
  351 |
  352 |     // 4. Tip MwSt should be ~1.16 (19% of 6.10)
  353 |     const tipMwstValue = parseFloat(trinkgeldMwst.replace(',', '.'));
  354 |     expect(tipMwstValue).toBeCloseTo(1.16, 2);
  355 |     console.log('✅ trinkgeldMwst calculated correctly: 1.16');
  356 |
  357 |     // Take a screenshot for visual verification
  358 |     await page.screenshot({ path: 'test-results/paul3-final-state.png', fullPage: true });
  359 |     console.log('📸 Screenshot saved: test-results/paul3-final-state.png');
  360 |   });
  361 | });
  362 |
  363 | test.describe('Combined Receipt Tests (Both on Same Page)', () => {
  364 |   test.beforeEach(async ({ page }) => {
  365 |     await page.goto('/bewirtungsbeleg');
  366 |     await page.waitForLoadState('networkidle');
  367 |   });
  368 |
  369 |   test('Combined receipt: Both amounts extracted correctly', async ({ page }) => {
  370 |     // This test verifies the spatial guidance enhancement for combined receipts
  371 |     test.setTimeout(60000);
  372 |
  373 |     const imagePath = path.join(TEST_FILES_DIR, '14102025 (Paul3).jpg');
  374 |
  375 |     if (!fs.existsSync(imagePath)) {
  376 |       test.skip();
  377 |       return;
  378 |     }
  379 |
  380 |     console.log('🧪 Testing combined receipt extraction with spatial guidance');
  381 |
  382 |     // Upload the combined receipt
  383 |     const fileInput = page.locator('input[type="file"]').first();
  384 |     await fileInput.setInputFiles(imagePath);
  385 |
  386 |     // Wait for OCR
  387 |     await page.waitForFunction(() => {
  388 |       const input = document.querySelector('input[placeholder*="Gesamtbetrag"]') as HTMLInputElement;
  389 |       return input && input.value && input.value !== '';
  390 |     }, { timeout: 30000 });
  391 |
  392 |     await page.waitForTimeout(2000);
  393 |
  394 |     // Extract values
  395 |     const gesamtbetrag = await page.locator('input[placeholder*="Gesamtbetrag"]').inputValue();
  396 |     const kreditkartenBetrag = await page.locator('input[placeholder*="Kreditkarte"]').inputValue();
  397 |
  398 |     // CRITICAL ASSERTIONS:
  399 |     // The enhanced prompt MUST extract BOTH amounts
  400 |
  401 |     console.log('Verifying both amounts extracted:');
  402 |     console.log('  Invoice (gesamtbetrag):', gesamtbetrag);
  403 |     console.log('  Credit Card (kreditkartenbetrag):', kreditkartenBetrag);
  404 |
  405 |     // Both fields MUST be populated
  406 |     expect(gesamtbetrag).not.toBe('');
  407 |     expect(kreditkartenBetrag).not.toBe('');
  408 |
  409 |     // Credit card amount should be >= invoice amount
  410 |     const kkNum = parseFloat(kreditkartenBetrag.replace(',', '.'));
  411 |     const invNum = parseFloat(gesamtbetrag.replace(',', '.'));
  412 |     expect(kkNum).toBeGreaterThanOrEqual(invNum);
  413 |
  414 |     console.log('✅ Both amounts extracted successfully');
  415 |     console.log('✅ Credit card amount >= invoice amount validation passed');
  416 |   });
  417 |
  418 |   test('Combined receipt: Verify classification as Rechnung&Kreditkartenbeleg', async ({ page }) => {
  419 |     // This test verifies that the classification system correctly identifies combined receipts
  420 |     test.setTimeout(60000);
  421 |
  422 |     const imagePath = path.join(TEST_FILES_DIR, '14102025 (Paul3).jpg');
  423 |
  424 |     if (!fs.existsSync(imagePath)) {
  425 |       test.skip();
  426 |       return;
  427 |     }
  428 |
  429 |     console.log('🧪 Testing combined receipt classification');
  430 |
  431 |     // Listen for console logs to check classification
  432 |     const consoleLogs: string[] = [];
  433 |     page.on('console', msg => {
  434 |       const text = msg.text();
  435 |       if (text.includes('Classification') || text.includes('Rechnung&Kreditkartenbeleg')) {
  436 |         consoleLogs.push(text);
  437 |         console.log('📝 Console:', text);
  438 |       }
  439 |     });
  440 |
  441 |     // Upload
  442 |     const fileInput = page.locator('input[type="file"]').first();
  443 |     await fileInput.setInputFiles(imagePath);
  444 |
```