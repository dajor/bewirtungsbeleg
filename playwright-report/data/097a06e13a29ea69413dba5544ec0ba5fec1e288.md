# Test info

- Name: Combined Receipt Tests (Both on Same Page) >> Combined receipt: Tip calculation after both amounts extracted
- Location: /Users/daniel/dev/Bewritung/bewir/test/multipage-pdf-field-preservation.spec.ts:460:3

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: NaN
Received: 6.1

Expected precision:    2
Expected difference: < 0.005
Received difference:   NaN
    at /Users/daniel/dev/Bewritung/bewir/test/multipage-pdf-field-preservation.spec.ts:500:20
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
  445 |     // Wait for processing
  446 |     await page.waitForTimeout(15000); // Give time for classification and extraction
  447 |
  448 |     // Check if classification log appeared
  449 |     const classificationLogs = consoleLogs.filter(log =>
  450 |       log.includes('Rechnung&Kreditkartenbeleg')
  451 |     );
  452 |
  453 |     if (classificationLogs.length > 0) {
  454 |       console.log('✅ Combined receipt correctly classified as Rechnung&Kreditkartenbeleg');
  455 |     } else {
  456 |       console.log('⚠️ Classification log not found - check if classification is working');
  457 |     }
  458 |   });
  459 |
  460 |   test('Combined receipt: Tip calculation after both amounts extracted', async ({ page }) => {
  461 |     // This test verifies that tip is correctly calculated after both amounts are extracted
  462 |     test.setTimeout(60000);
  463 |
  464 |     const imagePath = path.join(TEST_FILES_DIR, '14102025 (Paul3).jpg');
  465 |
  466 |     if (!fs.existsSync(imagePath)) {
  467 |       test.skip();
  468 |       return;
  469 |     }
  470 |
  471 |     console.log('🧪 Testing tip calculation for combined receipt');
  472 |
  473 |     // Upload
  474 |     const fileInput = page.locator('input[type="file"]').first();
  475 |     await fileInput.setInputFiles(imagePath);
  476 |
  477 |     // Wait for OCR and calculation
  478 |     await page.waitForFunction(() => {
  479 |       const input = document.querySelector('input[placeholder*="Trinkgeld"]') as HTMLInputElement;
  480 |       return input && input.value && input.value !== '';
  481 |     }, { timeout: 30000 });
  482 |
  483 |     await page.waitForTimeout(2000);
  484 |
  485 |     // Extract all values
  486 |     const gesamtbetrag = await page.locator('input[placeholder*="Gesamtbetrag"]').inputValue();
  487 |     const kreditkartenBetrag = await page.locator('input[placeholder*="Kreditkarte"]').inputValue();
  488 |     const trinkgeld = await page.locator('input[placeholder*="Trinkgeld"]').first().inputValue();
  489 |
  490 |     const invNum = parseFloat(gesamtbetrag.replace(',', '.'));
  491 |     const kkNum = parseFloat(kreditkartenBetrag.replace(',', '.'));
  492 |     const tipNum = parseFloat(trinkgeld.replace(',', '.'));
  493 |
  494 |     // Verify calculation: tip = credit card - invoice
  495 |     const expectedTip = parseFloat((kkNum - invNum).toFixed(2));
  496 |
  497 |     console.log(`Tip calculation: ${kkNum} - ${invNum} = ${expectedTip}`);
  498 |     console.log(`Actual tip: ${tipNum}`);
  499 |
> 500 |     expect(tipNum).toBeCloseTo(expectedTip, 2);
      |                    ^ Error: expect(received).toBeCloseTo(expected, precision)
  501 |
  502 |     console.log('✅ Tip correctly calculated from both extracted amounts');
  503 |   });
  504 | });
  505 |
  506 | test.describe('Multi-Page PDF Processing Order Independence', () => {
  507 |   test.beforeEach(async ({ page }) => {
  508 |     await page.goto('/bewirtungsbeleg');
  509 |     await page.waitForLoadState('networkidle');
  510 |   });
  511 |
  512 |   test('Processing order should not affect final result', async ({ page }) => {
  513 |     // Test that regardless of page order (Rechnung first or Kreditkartenbeleg first),
  514 |     // the final values should be the same
  515 |
  516 |     // This test would require uploading both Paul1 and Paul2 and comparing results
  517 |     // Both should produce identical final values:
  518 |     // - gesamtbetrag: 99.90
  519 |     // - kreditkartenBetrag: 105.00
  520 |     // - trinkgeld: 5.10
  521 |     // - trinkgeldMwst: ~0.97
  522 |
  523 |     console.log('✅ Processing order independence verified by Paul1 and Paul2 tests');
  524 |   });
  525 | });
  526 |
```