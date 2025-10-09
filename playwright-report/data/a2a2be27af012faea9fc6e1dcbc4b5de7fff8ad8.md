# Test info

- Name: Tip Calculation - Manual Entry >> should auto-calculate tip when manually entering credit card amount
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-tip-calculation.spec.ts:168:3

# Error details

```
Error: locator.setInputFiles: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Rechnung hochladen').locator('..').locator('..').locator('input[type="file"]')

    at TipCalculationWorkflow.uploadFile (/Users/daniel/dev/Bewritung/bewir/test/e2e-tip-calculation.spec.ts:30:5)
    at /Users/daniel/dev/Bewritung/bewir/test/e2e-tip-calculation.spec.ts:173:5
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
   26 |     // Find the file input by looking for the label text first
   27 |     const section = this.page.locator(`text=${label}`).locator('..').locator('..');
   28 |     const fileInput = section.locator('input[type="file"]');
   29 |
>  30 |     await fileInput.setInputFiles(filePath);
      |     ^ Error: locator.setInputFiles: Test timeout of 30000ms exceeded.
   31 |     console.log(`✅ File uploaded: ${label}`);
   32 |
   33 |     // Wait a moment for file to be processed
   34 |     await this.page.waitForTimeout(500);
   35 |   }
   36 |
   37 |   async clickExtractData() {
   38 |     console.log('🔍 Clicking "Daten extrahieren" button');
   39 |     const extractButton = this.page.locator('button:has-text("Daten extrahieren")');
   40 |     await expect(extractButton).toBeVisible();
   41 |     await extractButton.click();
   42 |   }
   43 |
   44 |   async waitForOCRCompletion(timeout = 45000) {
   45 |     console.log('⏳ Waiting for OCR to complete...');
   46 |
   47 |     // Wait for any loading indicators to appear
   48 |     try {
   49 |       await this.page.waitForSelector('text=/ANALYSIERE|Konvertiere PDF/', {
   50 |         state: 'visible',
   51 |         timeout: 5000
   52 |       });
   53 |       console.log('📊 OCR started, waiting for completion...');
   54 |     } catch (e) {
   55 |       console.log('ℹ️ No loading indicator found, OCR may have completed instantly');
   56 |     }
   57 |
   58 |     // Wait for loading indicators to disappear
   59 |     await this.page.waitForSelector('text=/ANALYSIERE|Konvertiere PDF/', {
   60 |       state: 'hidden',
   61 |       timeout
   62 |     }).catch(() => {
   63 |       console.log('⚠️ Loading indicator timeout, checking if data was extracted anyway');
   64 |     });
   65 |
   66 |     // Additional wait for form to update
   67 |     await this.page.waitForTimeout(1000);
   68 |     console.log('✅ OCR completed');
   69 |   }
   70 |
   71 |   async getFieldValue(fieldName: string): Promise<string> {
   72 |     const field = this.page.locator(`input[name="${fieldName}"]`);
   73 |     const value = await field.inputValue();
   74 |     console.log(`📝 Field "${fieldName}": ${value}`);
   75 |     return value;
   76 |   }
   77 |
   78 |   async setFieldValue(fieldName: string, value: string) {
   79 |     console.log(`✏️ Setting field "${fieldName}" to: ${value}`);
   80 |     const field = this.page.locator(`input[name="${fieldName}"]`);
   81 |     await field.clear();
   82 |     await field.fill(value);
   83 |
   84 |     // Trigger blur to ensure onChange fires
   85 |     await field.blur();
   86 |
   87 |     // Wait for any calculations to complete
   88 |     await this.page.waitForTimeout(500);
   89 |   }
   90 |
   91 |   async getAllFormValues() {
   92 |     const values = {
   93 |       gesamtbetrag: await this.getFieldValue('gesamtbetrag'),
   94 |       gesamtbetragMwst: await this.getFieldValue('gesamtbetragMwst'),
   95 |       gesamtbetragNetto: await this.getFieldValue('gesamtbetragNetto'),
   96 |       kreditkartenBetrag: await this.getFieldValue('kreditkartenBetrag'),
   97 |       trinkgeld: await this.getFieldValue('trinkgeld'),
   98 |       trinkgeldMwst: await this.getFieldValue('trinkgeldMwst'),
   99 |     };
  100 |     console.log('📋 Current form values:', values);
  101 |     return values;
  102 |   }
  103 | }
  104 |
  105 | test.describe('Tip Calculation - OCR Extraction', () => {
  106 |   let workflow: TipCalculationWorkflow;
  107 |
  108 |   test.beforeEach(async ({ page }) => {
  109 |     workflow = new TipCalculationWorkflow(page);
  110 |     await workflow.navigate();
  111 |   });
  112 |
  113 |   test('should auto-calculate tip after OCR extracts both invoice and credit card', async ({ page }) => {
  114 |     console.log('\n🧪 TEST: OCR Auto-calculation of tip');
  115 |
  116 |     // Step 1: Upload invoice PDF
  117 |     const invoicePath = path.join(process.cwd(), 'test', '29092025_(Vendor).pdf');
  118 |     await workflow.uploadFile(invoicePath, 'Rechnung hochladen');
  119 |
  120 |     // Step 2: Upload credit card PDF
  121 |     const creditCardPath = path.join(process.cwd(), 'test', '08102025_Bezahlung MASTERCARD.pdf');
  122 |     await workflow.uploadFile(creditCardPath, 'Kreditkarte hochladen');
  123 |
  124 |     // Step 3: Click extract data button
  125 |     await workflow.clickExtractData();
  126 |
  127 |     // Step 4: Wait for OCR to complete
  128 |     await workflow.waitForOCRCompletion();
  129 |
  130 |     // Step 5: Check all extracted values
```