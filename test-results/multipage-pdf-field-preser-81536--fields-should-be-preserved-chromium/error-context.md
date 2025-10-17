# Test info

- Name: Multi-Page PDF Field Preservation >> Paul1.pdf: Rechnung first, then Kreditkartenbeleg - fields should be preserved
- Location: /Users/daniel/dev/Bewritung/bewir/test/multipage-pdf-field-preservation.spec.ts:113:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "105.00"
Received: ""
    at /Users/daniel/dev/Bewritung/bewir/test/multipage-pdf-field-preservation.spec.ts:171:32
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
- paragraph: Hochgeladene Dateien (2/5)
- img "14102025 (Paul1)_Seite_1.jpg"
- paragraph: 14102025 (Paul1)_Seite_1.jpg
- text: Rechnung 236.8 KB
- textbox "Klassifizierung": Rechnung
- img
- button "Datei entfernen":
  - img
- img "14102025 (Paul1)_Seite_2.jpg"
- paragraph: 14102025 (Paul1)_Seite_2.jpg
- text: Analysiere... 180.0 KB
- button "Datei entfernen":
  - img
- text: Datum der Bewirtung
- textbox "Datum der Bewirtung": 14.10.2025
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
- textbox "Gesamtbetrag (Brutto)": "99.90"
- text: MwSt. Gesamtbetrag
- paragraph: MwSt. (19%) wird automatisch berechnet
- textbox "MwSt. Gesamtbetrag": "15.95"
- text: Netto Gesamtbetrag
- paragraph: Netto wird automatisch berechnet
- textbox "Netto Gesamtbetrag": "83.95"
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
   71 |     if (await errorNotification.isVisible()) {
   72 |       const errorText = await errorNotification.textContent();
   73 |       console.error('❌ Error notification:', errorText);
   74 |     }
   75 |
   76 |     // Extract field values
   77 |     const gesamtbetrag = await page.locator('input[placeholder*="Gesamtbetrag"]').inputValue();
   78 |     const kreditkartenBetrag = await page.locator('input[placeholder*="Kreditkarte"]').inputValue();
   79 |     const trinkgeld = await page.locator('input[placeholder*="Trinkgeld"]').first().inputValue();
   80 |     const trinkgeldMwst = await page.locator('input[placeholder*="MwSt"]').nth(1).inputValue();
   81 |
   82 |     console.log('📊 Extracted Values:');
   83 |     console.log('  gesamtbetrag:', gesamtbetrag);
   84 |     console.log('  kreditkartenBetrag:', kreditkartenBetrag);
   85 |     console.log('  trinkgeld:', trinkgeld);
   86 |     console.log('  trinkgeldMwst:', trinkgeldMwst);
   87 |
   88 |     // Assertions: Verify all fields are correctly populated and NOT overwritten
   89 |
   90 |     // 1. Invoice amount from Page 2 (Rechnung)
   91 |     expect(gesamtbetrag).toBe('99.90');
   92 |     console.log('✅ gesamtbetrag correct: 99.90');
   93 |
   94 |     // 2. CRITICAL: Credit card amount from Page 1 (Kreditkartenbeleg) MUST BE PRESERVED
   95 |     expect(kreditkartenBetrag).toBe('105.00');
   96 |     console.log('✅ kreditkartenBetrag PRESERVED: 105.00');
   97 |
   98 |     // 3. Tip should be calculated correctly (105.00 - 99.90 = 5.10)
   99 |     const tipValue = parseFloat(trinkgeld.replace(',', '.'));
  100 |     expect(tipValue).toBeCloseTo(5.10, 2);
  101 |     console.log('✅ trinkgeld calculated correctly: 5.10');
  102 |
  103 |     // 4. Tip MwSt should be ~0.97 (19% of 5.10)
  104 |     const tipMwstValue = parseFloat(trinkgeldMwst.replace(',', '.'));
  105 |     expect(tipMwstValue).toBeCloseTo(0.97, 2);
  106 |     console.log('✅ trinkgeldMwst calculated correctly: 0.97');
  107 |
  108 |     // Take a screenshot for visual verification
  109 |     await page.screenshot({ path: 'test-results/paul2-final-state.png', fullPage: true });
  110 |     console.log('📸 Screenshot saved: test-results/paul2-final-state.png');
  111 |   });
  112 |
  113 |   test('Paul1.pdf: Rechnung first, then Kreditkartenbeleg - fields should be preserved', async ({ page }) => {
  114 |     // Increase timeout for this test - OCR can take 60+ seconds for multi-page PDFs
  115 |     test.setTimeout(90000); // 90 seconds
  116 |
  117 |     const pdfPath = path.join(TEST_FILES_DIR, '14102025 (Paul1).pdf');
  118 |
  119 |     // Check if file exists
  120 |     if (!fs.existsSync(pdfPath)) {
  121 |       test.skip();
  122 |       return;
  123 |     }
  124 |
  125 |     console.log('📄 Testing Paul1.pdf: Rechnung → Kreditkartenbeleg');
  126 |
  127 |     // Upload the PDF
  128 |     const fileInput = page.locator('input[type="file"]').first();
  129 |     await fileInput.setInputFiles(pdfPath);
  130 |
  131 |     // Wait for PDF conversion and OCR to complete
  132 |     console.log('⏳ Waiting for PDF conversion and OCR...');
  133 |
  134 |     // Wait for the gesamtbetrag field to be populated (with timeout of 60 seconds)
  135 |     await page.waitForFunction(() => {
  136 |       const input = document.querySelector('input[placeholder*="Gesamtbetrag"]') as HTMLInputElement;
  137 |       return input && input.value && input.value !== '';
  138 |     }, { timeout: 60000 }).catch(() => {
  139 |       console.log('⚠️ Timeout waiting for gesamtbetrag to be populated');
  140 |     });
  141 |
  142 |     // Give a bit more time for all fields to settle
  143 |     await page.waitForTimeout(2000);
  144 |
  145 |     // Check if any error notifications appeared
  146 |     const errorNotification = page.locator('[class*="Notification"]', { hasText: 'Fehler' });
  147 |     if (await errorNotification.isVisible()) {
  148 |       const errorText = await errorNotification.textContent();
  149 |       console.error('❌ Error notification:', errorText);
  150 |     }
  151 |
  152 |     // Extract field values
  153 |     const gesamtbetrag = await page.locator('input[placeholder*="Gesamtbetrag"]').inputValue();
  154 |     const kreditkartenBetrag = await page.locator('input[placeholder*="Kreditkarte"]').inputValue();
  155 |     const trinkgeld = await page.locator('input[placeholder*="Trinkgeld"]').first().inputValue();
  156 |     const trinkgeldMwst = await page.locator('input[placeholder*="MwSt"]').nth(1).inputValue();
  157 |
  158 |     console.log('📊 Extracted Values:');
  159 |     console.log('  gesamtbetrag:', gesamtbetrag);
  160 |     console.log('  kreditkartenBetrag:', kreditkartenBetrag);
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
> 171 |     expect(kreditkartenBetrag).toBe('105.00');
      |                                ^ Error: expect(received).toBe(expected) // Object.is equality
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
```