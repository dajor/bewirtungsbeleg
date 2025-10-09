# Test info

- Name: Tip Calculation - Manual Entry >> should auto-calculate tip when manually entering credit card amount
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-tip-calculation.spec.ts:172:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('button:has-text("Daten extrahieren")')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('button:has-text("Daten extrahieren")')

    at TipCalculationWorkflow.clickExtractData (/Users/daniel/dev/Bewritung/bewir/test/e2e-tip-calculation.spec.ts:42:33)
    at /Users/daniel/dev/Bewritung/bewir/test/e2e-tip-calculation.spec.ts:180:20
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
- paragraph: Konvertiere PDF...
- img
- paragraph: PDF
- paragraph: 29092025_(Vendor).pdf
- text: Analysiere... 644.4 KB
- button "Konvertierung abbrechen":
  - img
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
- alert "🔍 Debug Info": "🔍 Debug Info Gesamtbetrag: \"\" (type: string) Kreditkartenbetrag: \"\" (type: string) Trinkgeld: \"\" (type: string) TrinkgeldMwSt: \"\" (type: string)"
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
   1 | /**
   2 |  * E2E Test: Tip Calculation with Real PDFs
   3 |  * Tests automatic tip calculation when credit card amount > invoice amount
   4 |  *
   5 |  * Test Documents:
   6 |  * - test/29092025_(Vendor).pdf - Restaurant Mythos invoice (29.90 EUR)
   7 |  * - test/08102025_Bezahlung MASTERCARD.pdf - Credit card receipt (35.00 EUR)
   8 |  *
   9 |  * Expected: Trinkgeld = 35.00 - 29.90 = 5.10 EUR
   10 |  */
   11 |
   12 | import { test, expect, Page } from '@playwright/test';
   13 | import * as path from 'path';
   14 |
   15 | class TipCalculationWorkflow {
   16 |   constructor(private page: Page) {}
   17 |
   18 |   async navigate() {
   19 |     await this.page.goto('/bewirtungsbeleg');
   20 |     await this.page.waitForLoadState('networkidle');
   21 |   }
   22 |
   23 |   async uploadFile(filePath: string, label: string) {
   24 |     console.log(`📤 Uploading ${label}: ${filePath}`);
   25 |
   26 |     // Just find the first or second file input directly
   27 |     // (Rechnung is first, Kreditkarte is second)
   28 |     const fileInputs = this.page.locator('input[type="file"]');
   29 |     const index = label.includes('Rechnung') ? 0 : 1;
   30 |     const fileInput = fileInputs.nth(index);
   31 |
   32 |     await fileInput.setInputFiles(filePath);
   33 |     console.log(`✅ File uploaded: ${label}`);
   34 |
   35 |     // Wait a moment for file to be processed
   36 |     await this.page.waitForTimeout(500);
   37 |   }
   38 |
   39 |   async clickExtractData() {
   40 |     console.log('🔍 Clicking "Daten extrahieren" button');
   41 |     const extractButton = this.page.locator('button:has-text("Daten extrahieren")');
>  42 |     await expect(extractButton).toBeVisible();
      |                                 ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
   43 |     await extractButton.click();
   44 |   }
   45 |
   46 |   async waitForOCRCompletion(timeout = 45000) {
   47 |     console.log('⏳ Waiting for OCR to complete...');
   48 |
   49 |     // Wait for any loading indicators to appear
   50 |     try {
   51 |       await this.page.waitForSelector('text=/ANALYSIERE|Konvertiere PDF/', {
   52 |         state: 'visible',
   53 |         timeout: 5000
   54 |       });
   55 |       console.log('📊 OCR started, waiting for completion...');
   56 |     } catch (e) {
   57 |       console.log('ℹ️ No loading indicator found, OCR may have completed instantly');
   58 |     }
   59 |
   60 |     // Wait for loading indicators to disappear
   61 |     await this.page.waitForSelector('text=/ANALYSIERE|Konvertiere PDF/', {
   62 |       state: 'hidden',
   63 |       timeout
   64 |     }).catch(() => {
   65 |       console.log('⚠️ Loading indicator timeout, checking if data was extracted anyway');
   66 |     });
   67 |
   68 |     // Additional wait for form to update
   69 |     await this.page.waitForTimeout(1000);
   70 |     console.log('✅ OCR completed');
   71 |   }
   72 |
   73 |   async getFieldValue(fieldName: string): Promise<string> {
   74 |     // Mantine forms use IDs, not names
   75 |     const field = this.page.locator(`#${fieldName}, input[id="${fieldName}"]`).first();
   76 |     const value = await field.inputValue();
   77 |     console.log(`📝 Field "${fieldName}": ${value}`);
   78 |     return value;
   79 |   }
   80 |
   81 |   async setFieldValue(fieldName: string, value: string) {
   82 |     console.log(`✏️ Setting field "${fieldName}" to: ${value}`);
   83 |     // Mantine forms use IDs, not names
   84 |     const field = this.page.locator(`#${fieldName}, input[id="${fieldName}"]`).first();
   85 |     await field.clear();
   86 |     await field.fill(value);
   87 |
   88 |     // Trigger blur to ensure onChange fires
   89 |     await field.blur();
   90 |
   91 |     // Wait for any calculations to complete
   92 |     await this.page.waitForTimeout(500);
   93 |   }
   94 |
   95 |   async getAllFormValues() {
   96 |     const values = {
   97 |       gesamtbetrag: await this.getFieldValue('gesamtbetrag'),
   98 |       gesamtbetragMwst: await this.getFieldValue('gesamtbetragMwst'),
   99 |       gesamtbetragNetto: await this.getFieldValue('gesamtbetragNetto'),
  100 |       kreditkartenBetrag: await this.getFieldValue('kreditkartenBetrag'),
  101 |       trinkgeld: await this.getFieldValue('trinkgeld'),
  102 |       trinkgeldMwst: await this.getFieldValue('trinkgeldMwst'),
  103 |     };
  104 |     console.log('📋 Current form values:', values);
  105 |     return values;
  106 |   }
  107 | }
  108 |
  109 | test.describe('Tip Calculation - OCR Extraction', () => {
  110 |   let workflow: TipCalculationWorkflow;
  111 |
  112 |   test.beforeEach(async ({ page }) => {
  113 |     workflow = new TipCalculationWorkflow(page);
  114 |     await workflow.navigate();
  115 |   });
  116 |
  117 |   test('should auto-calculate tip after OCR extracts both invoice and credit card', async ({ page }) => {
  118 |     console.log('\n🧪 TEST: OCR Auto-calculation of tip');
  119 |
  120 |     // Step 1: Upload invoice PDF
  121 |     const invoicePath = path.join(process.cwd(), 'test', '29092025_(Vendor).pdf');
  122 |     await workflow.uploadFile(invoicePath, 'Rechnung hochladen');
  123 |
  124 |     // Step 2: Upload credit card PDF
  125 |     const creditCardPath = path.join(process.cwd(), 'test', '08102025_Bezahlung MASTERCARD.pdf');
  126 |     await workflow.uploadFile(creditCardPath, 'Kreditkarte hochladen');
  127 |
  128 |     // Step 3: Click extract data button
  129 |     await workflow.clickExtractData();
  130 |
  131 |     // Step 4: Wait for OCR to complete
  132 |     await workflow.waitForOCRCompletion();
  133 |
  134 |     // Step 5: Check all extracted values
  135 |     const values = await workflow.getAllFormValues();
  136 |
  137 |     // Verify invoice data
  138 |     console.log('\n✅ Verifying invoice data:');
  139 |     expect(parseFloat(values.gesamtbetrag.replace(',', '.'))).toBeCloseTo(29.90, 2);
  140 |     expect(parseFloat(values.gesamtbetragMwst.replace(',', '.'))).toBeCloseTo(4.77, 2);
  141 |     expect(parseFloat(values.gesamtbetragNetto.replace(',', '.'))).toBeCloseTo(25.13, 2);
  142 |
```