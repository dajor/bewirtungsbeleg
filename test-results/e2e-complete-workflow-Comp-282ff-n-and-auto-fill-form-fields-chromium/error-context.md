# Test info

- Name: Complete Bewirtungsbeleg Workflow >> should handle OCR extraction and auto-fill form fields
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-complete-workflow.spec.ts:158:3

# Error details

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Daten extrahieren")')

    at BewirtungsbelegWorkflow.clickExtractData (/Users/daniel/dev/Bewritung/bewir/test/e2e-complete-workflow.spec.ts:29:25)
    at /Users/daniel/dev/Bewritung/bewir/test/e2e-complete-workflow.spec.ts:191:20
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
  - img "test-receipt.png"
  - paragraph: test-receipt.png
  - text: Analysiere... 0.1 KB
  - button "Datei entfernen":
    - img
  - text: Datum der Bewirtung
  - textbox "Datum der Bewirtung": 05.08.2025
  - text: Restaurant
  - textbox "Restaurant": Zur Goldenen Gans
  - text: Anschrift
  - textbox "Anschrift": Hauptstraße 42, 10115 Berlin
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
  - textbox "1. Netto Betrag": "71.85"
  - paragraph: 2. Mehrwertsteuer
  - text: MwSt. 7%
  - paragraph: 7% (Speisen)
  - textbox "MwSt. 7%"
  - text: MwSt. 19%
  - paragraph: 19% (Getränke)
  - textbox "MwSt. 19%"
  - text: Gesamt MwSt.
  - paragraph: = MwSt. 7% + MwSt. 19%
  - textbox "Gesamt MwSt.": "13.65"
  - text: 3. Brutto Gesamtbetrag
  - paragraph: "Editierbar: Brutto ⇄ Netto (Berechnung in beide Richtungen)"
  - textbox "3. Brutto Gesamtbetrag": "85.50"
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
  - paragraph: 71.85 €
  - paragraph: "+ MwSt. 7%:"
  - paragraph: 0.00 €
  - paragraph: "+ MwSt. 19%:"
  - paragraph: 0.00 €
  - separator
  - paragraph: "= Gesamtbetrag:"
  - paragraph: 85.50 €
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
   1 | /**
   2 |  * E2E Test 1: Complete workflow (Upload→OCR→Edit→PDF)
   3 |  * Tests the entire user journey from receipt upload to PDF generation
   4 |  */
   5 |
   6 | import { test, expect, Page } from '@playwright/test';
   7 | import * as path from 'path';
   8 | import * as fs from 'fs';
   9 |
   10 | // Page Object Model for complete workflow
   11 | class BewirtungsbelegWorkflow {
   12 |   constructor(private page: Page) {}
   13 |
   14 |   async navigate() {
   15 |     await this.page.goto('/bewirtungsbeleg');
   16 |     await this.page.waitForLoadState('networkidle');
   17 |     await this.page.waitForLoadState('domcontentloaded');
   18 |     await this.page.waitForTimeout(1000);
   19 |   }
   20 |
   21 |   async uploadReceipt(filePath: string) {
   22 |     const fileInput = this.page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
   23 |     await fileInput.setInputFiles(filePath);
   24 |     await this.page.waitForTimeout(1000);
   25 |   }
   26 |
   27 |   async clickExtractData() {
   28 |     const extractButton = this.page.locator('button:has-text("Daten extrahieren")');
>  29 |     await extractButton.click();
      |                         ^ Error: locator.click: Test timeout of 90000ms exceeded.
   30 |   }
   31 |
   32 |   async waitForOCRCompletion() {
   33 |     // Wait for loading spinner to appear and disappear
   34 |     await this.page.waitForSelector('[role="progressbar"]', { state: 'visible', timeout: 5000 });
   35 |     await this.page.waitForSelector('[role="progressbar"]', { state: 'hidden', timeout: 30000 });
   36 |   }
   37 |
   38 |   async fillFormField(fieldName: string, value: string) {
   39 |     const field = this.page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
   40 |     await field.clear();
   41 |     await field.fill(value);
   42 |   }
   43 |
   44 |   async selectDropdown(fieldName: string, value: string) {
   45 |     const dropdown = this.page.locator(`select[name="${fieldName}"]`);
   46 |     await dropdown.selectOption(value);
   47 |   }
   48 |
   49 |   async setDate(fieldName: string, date: string) {
   50 |     // German date format DD.MM.YYYY
   51 |     const dateInput = this.page.locator(`input[name="${fieldName}"]`);
   52 |     await dateInput.clear();
   53 |     await dateInput.fill(date);
   54 |   }
   55 |
   56 |   async clickGeneratePDF() {
   57 |     const generateButton = this.page.locator('button:has-text("PDF generieren")');
   58 |     await generateButton.click();
   59 |   }
   60 |
   61 |   async waitForPDFGeneration() {
   62 |     // Wait for success message or PDF download
   63 |     await this.page.waitForSelector('[role="alert"]:has-text("erfolgreich")', { timeout: 10000 });
   64 |   }
   65 |
   66 |   async getFormValue(fieldName: string): Promise<string> {
   67 |     const field = this.page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
   68 |     return await field.inputValue();
   69 |   }
   70 |
   71 |   async hasError(): Promise<boolean> {
   72 |     const errorAlert = this.page.locator('[role="alert"][data-type="error"]');
   73 |     return await errorAlert.isVisible();
   74 |   }
   75 |
   76 |   async getErrorMessage(): Promise<string | null> {
   77 |     const errorAlert = this.page.locator('[role="alert"][data-type="error"]');
   78 |     if (await errorAlert.isVisible()) {
   79 |       return await errorAlert.textContent();
   80 |     }
   81 |     return null;
   82 |   }
   83 | }
   84 |
   85 | test.describe('Complete Bewirtungsbeleg Workflow', () => {
   86 |   let workflow: BewirtungsbelegWorkflow;
   87 |
   88 |   test.beforeEach(async ({ page }) => {
   89 |     workflow = new BewirtungsbelegWorkflow(page);
   90 |     await workflow.navigate();
   91 |   });
   92 |
   93 |   test('should complete full workflow from image upload to PDF generation', async ({ page }) => {
   94 |     // Step 1: Upload receipt image
   95 |     const testImagePath = path.join(process.cwd(), 'test', 'test-receipt.png');
   96 |     
   97 |     // Create a simple test image if it doesn't exist
   98 |     if (!fs.existsSync(testImagePath)) {
   99 |       // Create a minimal PNG file
  100 |       const pngBuffer = Buffer.from([
  101 |         0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  102 |         0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  103 |         0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  104 |         0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  105 |         0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
  106 |         0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  107 |         0x00, 0x00, 0x03, 0x00, 0x01, 0x5E, 0xF9, 0x51,
  108 |         0x36, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
  109 |         0x44, 0xAE, 0x42, 0x60, 0x82
  110 |       ]);
  111 |       fs.writeFileSync(testImagePath, pngBuffer);
  112 |     }
  113 |
  114 |     await workflow.uploadReceipt(testImagePath);
  115 |
  116 |     // Step 2: Extract data with OCR (mock or real)
  117 |     // Check if extract button is available
  118 |     const extractButton = page.locator('button:has-text("Daten extrahieren")');
  119 |     if (await extractButton.isVisible()) {
  120 |       await workflow.clickExtractData();
  121 |       
  122 |       // Wait for OCR to complete (or mock response)
  123 |       try {
  124 |         await workflow.waitForOCRCompletion();
  125 |       } catch (e) {
  126 |         // OCR might fail with test image, continue with manual data
  127 |         console.log('OCR extraction skipped or failed, continuing with manual data entry');
  128 |       }
  129 |     }
```