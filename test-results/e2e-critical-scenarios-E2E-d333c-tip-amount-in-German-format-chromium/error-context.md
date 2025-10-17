# Test info

- Name: E2E Test 4: Form Validation with German Formats >> should handle tip amount in German format
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-critical-scenarios.spec.ts:345:3

# Error details

```
Error: locator.clear: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="restaurantName"], textarea[name="restaurantName"]')

    at BewirtungsbelegPage.fillField (/Users/daniel/dev/Bewritung/bewir/test/e2e-critical-scenarios.spec.ts:47:17)
    at BewirtungsbelegPage.fillMinimalValidForm (/Users/daniel/dev/Bewritung/bewir/test/e2e-critical-scenarios.spec.ts:98:16)
    at /Users/daniel/dev/Bewritung/bewir/test/e2e-critical-scenarios.spec.ts:346:16
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
   2 |  * E2E Tests 2-5: Critical scenarios for app quality
   3 |  * - Multiple file handling with ordering
   4 |  * - Error recovery and retry
   5 |  * - Form validation with German formats
   6 |  * - Foreign currency receipt handling
   7 |  */
   8 |
   9 | import { test, expect, Page } from '@playwright/test';
   10 | import * as path from 'path';
   11 | import * as fs from 'fs';
   12 |
   13 | class BewirtungsbelegPage {
   14 |   constructor(private page: Page) {}
   15 |
   16 |   async navigate() {
   17 |     await this.page.goto('/bewirtungsbeleg');
   18 |     await this.page.waitForLoadState('networkidle');
   19 |   }
   20 |
   21 |   async uploadFiles(filePaths: string[]) {
   22 |     const fileInput = this.page.locator('input[type="file"]');
   23 |     await fileInput.setInputFiles(filePaths);
   24 |     await this.page.waitForTimeout(1000);
   25 |   }
   26 |
   27 |   async getUploadedFileNames(): Promise<string[]> {
   28 |     const fileCards = this.page.locator('[data-testid="file-card"], .file-item');
   29 |     const count = await fileCards.count();
   30 |     const names: string[] = [];
   31 |     
   32 |     for (let i = 0; i < count; i++) {
   33 |       const text = await fileCards.nth(i).textContent();
   34 |       if (text) names.push(text);
   35 |     }
   36 |     
   37 |     return names;
   38 |   }
   39 |
   40 |   async removeFile(index: number) {
   41 |     const removeButtons = this.page.locator('[aria-label*="Remove"], [data-testid="remove-file"]');
   42 |     await removeButtons.nth(index).click();
   43 |   }
   44 |
   45 |   async fillField(name: string, value: string) {
   46 |     const field = this.page.locator(`input[name="${name}"], textarea[name="${name}"]`);
>  47 |     await field.clear();
      |                 ^ Error: locator.clear: Test timeout of 30000ms exceeded.
   48 |     await field.fill(value);
   49 |   }
   50 |
   51 |   async selectOption(name: string, value: string) {
   52 |     const select = this.page.locator(`select[name="${name}"]`);
   53 |     await select.selectOption(value);
   54 |   }
   55 |
   56 |   async clickButton(text: string) {
   57 |     await this.page.locator(`button:has-text("${text}")`).click();
   58 |   }
   59 |
   60 |   async getErrorMessages(): Promise<string[]> {
   61 |     const errors = this.page.locator('[role="alert"][data-type="error"], [role="alert"]:has-text("Fehler")');
   62 |     const count = await errors.count();
   63 |     const messages: string[] = [];
   64 |     
   65 |     for (let i = 0; i < count; i++) {
   66 |       const text = await errors.nth(i).textContent();
   67 |       if (text) messages.push(text);
   68 |     }
   69 |     
   70 |     return messages;
   71 |   }
   72 |
   73 |   async getFieldError(fieldName: string): Promise<string | null> {
   74 |     const error = this.page.locator(`[data-field="${fieldName}"] .error-message, #${fieldName}-error`);
   75 |     if (await error.isVisible()) {
   76 |       return await error.textContent();
   77 |     }
   78 |     return null;
   79 |   }
   80 |
   81 |   async isFieldValid(fieldName: string): Promise<boolean> {
   82 |     const field = this.page.locator(`input[name="${fieldName}"]`);
   83 |     const isInvalid = await field.getAttribute('aria-invalid');
   84 |     return isInvalid !== 'true';
   85 |   }
   86 |
   87 |   async waitForLoading() {
   88 |     await this.page.waitForSelector('[role="progressbar"]', { state: 'visible', timeout: 5000 });
   89 |     await this.page.waitForSelector('[role="progressbar"]', { state: 'hidden', timeout: 30000 });
   90 |   }
   91 |
   92 |   async toggleForeignReceipt() {
   93 |     const checkbox = this.page.locator('input[name="istAuslaendischeRechnung"]');
   94 |     await checkbox.click();
   95 |   }
   96 |
   97 |   async fillMinimalValidForm() {
   98 |     await this.fillField('restaurantName', 'Test Restaurant');
   99 |     await this.fillField('datum', '06.08.2025');
  100 |     await this.fillField('teilnehmer', 'Test Person');
  101 |     await this.fillField('anlass', 'Test Anlass');
  102 |     await this.fillField('gesamtbetrag', '100,00');
  103 |     await this.selectOption('zahlungsart', 'firma');
  104 |     await this.selectOption('bewirtungsart', 'mitarbeiter');
  105 |   }
  106 | }
  107 |
  108 | test.describe('E2E Test 2: Multiple File Handling with Ordering', () => {
  109 |   let page: BewirtungsbelegPage;
  110 |
  111 |   test.beforeEach(async ({ page: playwrightPage }) => {
  112 |     page = new BewirtungsbelegPage(playwrightPage);
  113 |     await page.navigate();
  114 |   });
  115 |
  116 |   test('should maintain correct file order: Rechnung before Kreditbeleg', async () => {
  117 |     // Create test files
  118 |     const rechnungPath = path.join(process.cwd(), 'test', 'test-rechnung.pdf');
  119 |     const kreditbelegPath = path.join(process.cwd(), 'test', 'test-kreditbeleg.pdf');
  120 |     
  121 |     if (!fs.existsSync(rechnungPath)) {
  122 |       fs.writeFileSync(rechnungPath, 'Rechnung PDF content');
  123 |     }
  124 |     if (!fs.existsSync(kreditbelegPath)) {
  125 |       fs.writeFileSync(kreditbelegPath, 'Kreditbeleg PDF content');
  126 |     }
  127 |
  128 |     // Upload in wrong order
  129 |     await page.uploadFiles([kreditbelegPath, rechnungPath]);
  130 |
  131 |     // Fill minimal form
  132 |     await page.fillMinimalValidForm();
  133 |
  134 |     // Generate PDF
  135 |     await page.clickButton('PDF generieren');
  136 |
  137 |     // The system should automatically reorder attachments
  138 |     // Rechnung should come before Kreditbeleg in the final PDF
  139 |     // This is a business rule for German tax compliance
  140 |     
  141 |     const errors = await page.getErrorMessages();
  142 |     expect(errors.length).toBe(0);
  143 |   });
  144 |
  145 |   test('should handle multiple attachments of same type', async () => {
  146 |     const files: string[] = [];
  147 |     
```