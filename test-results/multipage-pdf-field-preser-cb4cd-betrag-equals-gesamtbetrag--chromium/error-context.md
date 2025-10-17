# Test info

- Name: Multi-Page PDF Field Preservation >> Edge case: Empty tip (kreditkartenbetrag equals gesamtbetrag)
- Location: /Users/daniel/dev/Bewritung/bewir/test/multipage-pdf-field-preservation.spec.ts:246:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: NaN
    at /Users/daniel/dev/Bewritung/bewir/test/multipage-pdf-field-preservation.spec.ts:261:22
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
- textbox "Gesamtbetrag (Brutto)": "100.00"
- text: MwSt. Gesamtbetrag
- paragraph: MwSt. (19%) wird automatisch berechnet
- textbox "MwSt. Gesamtbetrag": "19.00"
- text: Netto Gesamtbetrag
- paragraph: Netto wird automatisch berechnet
- textbox "Netto Gesamtbetrag": "81.00"
- text: Betrag auf Kreditkarte/Bar
- paragraph: Geben Sie den Betrag ein, der auf der Kreditkarte belastet wurde (inkl. Trinkgeld)
- textbox "Betrag auf Kreditkarte/Bar": "100.00"
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
  161 |     console.log('  trinkgeld:', trinkgeld);
  162 |     console.log('  trinkgeldMwst:', trinkgeldMwst);
  163 |
  164 |     // Assertions: Verify all fields are correctly populated
  165 |
  166 |     // 1. Invoice amount from Page 1 (Rechnung)
  167 |     expect(gesamtbetrag).toBe('99.90');
  168 |     console.log('✅ gesamtbetrag correct: 99.90');
  169 |
  170 |     // 2. Credit card amount from Page 2 (Kreditkartenbeleg)
  171 |     expect(kreditkartenBetrag).toBe('105.00');
  172 |     console.log('✅ kreditkartenBetrag correct: 105.00');
  173 |
  174 |     // 3. Tip should be calculated correctly (105.00 - 99.90 = 5.10)
  175 |     const tipValue = parseFloat(trinkgeld.replace(',', '.'));
  176 |     expect(tipValue).toBeCloseTo(5.10, 2);
  177 |     console.log('✅ trinkgeld calculated correctly: 5.10');
  178 |
  179 |     // 4. Tip MwSt should be ~0.97 (19% of 5.10)
  180 |     const tipMwstValue = parseFloat(trinkgeldMwst.replace(',', '.'));
  181 |     expect(tipMwstValue).toBeCloseTo(0.97, 2);
  182 |     console.log('✅ trinkgeldMwst calculated correctly: 0.97');
  183 |
  184 |     // Take a screenshot for visual verification
  185 |     await page.screenshot({ path: 'test-results/paul1-final-state.png', fullPage: true });
  186 |     console.log('📸 Screenshot saved: test-results/paul1-final-state.png');
  187 |   });
  188 |
  189 |   test('Paul2.pdf: Verify console logs show ref preservation', async ({ page }) => {
  190 |     // Increase timeout for this test - OCR can take 60+ seconds for multi-page PDFs
  191 |     test.setTimeout(90000); // 90 seconds
  192 |
  193 |     const pdfPath = path.join(TEST_FILES_DIR, '14102025 (Paul2).pdf');
  194 |
  195 |     // Check if file exists
  196 |     if (!fs.existsSync(pdfPath)) {
  197 |       test.skip();
  198 |       return;
  199 |     }
  200 |
  201 |     console.log('📄 Testing console logs for ref preservation');
  202 |
  203 |     // Listen to console messages
  204 |     const consoleLogs: string[] = [];
  205 |     page.on('console', msg => {
  206 |       const text = msg.text();
  207 |       if (text.includes('Preserving') || text.includes('refs') || text.includes('REF')) {
  208 |         consoleLogs.push(text);
  209 |         console.log('🔍 Console:', text);
  210 |       }
  211 |     });
  212 |
  213 |     // Upload the PDF
  214 |     const fileInput = page.locator('input[type="file"]').first();
  215 |     await fileInput.setInputFiles(pdfPath);
  216 |
  217 |     // Wait for processing - wait for field population (with timeout of 60 seconds)
  218 |     await page.waitForFunction(() => {
  219 |       const input = document.querySelector('input[placeholder*="Gesamtbetrag"]') as HTMLInputElement;
  220 |       return input && input.value && input.value !== '';
  221 |     }, { timeout: 60000 }).catch(() => {
  222 |       console.log('⚠️ Timeout waiting for processing');
  223 |     });
  224 |
  225 |     await page.waitForTimeout(2000);
  226 |
  227 |     // Verify that ref preservation logs appeared
  228 |     const preservationLogs = consoleLogs.filter(log =>
  229 |       log.includes('Preserving kreditkartenBetrag from ref') ||
  230 |       log.includes('lastCreditCardAmountRef')
  231 |     );
  232 |
  233 |     expect(preservationLogs.length).toBeGreaterThan(0);
  234 |     console.log('✅ Found preservation logs:', preservationLogs.length);
  235 |
  236 |     // Verify the fix log appeared (using setFieldValue, not setValues)
  237 |     const fixLogs = consoleLogs.filter(log =>
  238 |       log.includes('Using setFieldValue') ||
  239 |       log.includes('NOT setValues')
  240 |     );
  241 |
  242 |     expect(fixLogs.length).toBeGreaterThan(0);
  243 |     console.log('✅ Found fix logs:', fixLogs.length);
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
> 261 |     expect(tipValue).toBe(0.00);
      |                      ^ Error: expect(received).toBe(expected) // Object.is equality
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
  344 |     expect(kreditkartenBetrag).toBe('45.00');
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
```