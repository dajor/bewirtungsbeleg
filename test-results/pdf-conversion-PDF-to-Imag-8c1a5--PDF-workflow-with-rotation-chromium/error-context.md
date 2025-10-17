# Test info

- Name: PDF to Image Conversion >> should complete full PDF workflow with rotation
- Location: /Users/daniel/dev/Bewritung/bewir/test/pdf-conversion.spec.ts:273:3

# Error details

```
Error: locator.setInputFiles: Error: strict mode violation: locator('input[type="file"]') resolved to 2 elements:
    1) <input multiple type="file" tabindex="-1" accept="image/png,image/jpeg,image/webp,application/pdf"/> aka getByRole('button', { name: 'Choose File' })
    2) <input type="file" accept=".json"/> aka locator('div').filter({ hasText: /^JSON DownloadJSON Upload$/ }).locator('input[type="file"]')

Call log:
  - waiting for locator('input[type="file"]')

    at BewirtungsbelegPage.uploadFile (/Users/daniel/dev/Bewritung/bewir/test/pdf-conversion.spec.ts:21:5)
    at /Users/daniel/dev/Bewritung/bewir/test/pdf-conversion.spec.ts:287:5
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
   2 |  * E2E Playwright tests for PDF conversion functionality
   3 |  * Tests the complete flow of uploading PDFs, converting to images, and rotating
   4 |  */
   5 |
   6 | import { test, expect, Page } from '@playwright/test';
   7 | import * as path from 'path';
   8 | import * as fs from 'fs';
   9 |
   10 | // Page Object Model for BewirtungsbelegForm
   11 | class BewirtungsbelegPage {
   12 |   constructor(private page: Page) {}
   13 |
   14 |   async navigate() {
   15 |     await this.page.goto('/bewirtungsbeleg');
   16 |     await this.page.waitForLoadState('networkidle');
   17 |   }
   18 |
   19 |   async uploadFile(filePath: string) {
   20 |     const fileInput = this.page.locator('input[type="file"]');
>  21 |     await fileInput.setInputFiles(filePath);
      |     ^ Error: locator.setInputFiles: Error: strict mode violation: locator('input[type="file"]') resolved to 2 elements:
   22 |   }
   23 |
   24 |   async waitForPdfConversion() {
   25 |     // Wait for "Converting PDF..." message to appear
   26 |     await expect(this.page.locator('text=Converting PDF...')).toBeVisible({ timeout: 10000 });
   27 |     
   28 |     // Wait for conversion to complete (message disappears)
   29 |     await expect(this.page.locator('text=Converting PDF...')).toBeHidden({ timeout: 30000 });
   30 |   }
   31 |
   32 |   async isImageDisplayed(): Promise<boolean> {
   33 |     const image = this.page.locator('img[alt="Receipt preview"]');
   34 |     return await image.isVisible();
   35 |   }
   36 |
   37 |   async getImageSrc(): Promise<string | null> {
   38 |     const image = this.page.locator('img[alt="Receipt preview"]');
   39 |     return await image.getAttribute('src');
   40 |   }
   41 |
   42 |   async rotateImageRight() {
   43 |     await this.page.locator('[data-testid="rotate-right-90"]').click();
   44 |     await this.page.waitForTimeout(500); // Wait for rotation animation
   45 |   }
   46 |
   47 |   async rotateImageLeft() {
   48 |     await this.page.locator('[data-testid="rotate-left-90"]').click();
   49 |     await this.page.waitForTimeout(500);
   50 |   }
   51 |
   52 |   async isRotateButtonEnabled(): Promise<boolean> {
   53 |     return await this.page.locator('[data-testid="rotate-right-90"]').isEnabled();
   54 |   }
   55 |
   56 |   async isEditedBadgeVisible(): Promise<boolean> {
   57 |     return await this.page.locator('text=Edited').isVisible();
   58 |   }
   59 |
   60 |   async resetImage() {
   61 |     await this.page.locator('[data-testid="reset-button"]').click();
   62 |   }
   63 |
   64 |   async removeFile() {
   65 |     // Click the remove button (X) on the file card
   66 |     await this.page.locator('button[aria-label*="Remove"]').first().click();
   67 |   }
   68 |
   69 |   async getErrorMessage(): Promise<string | null> {
   70 |     const errorElement = this.page.locator('[role="alert"]');
   71 |     if (await errorElement.isVisible()) {
   72 |       return await errorElement.textContent();
   73 |     }
   74 |     return null;
   75 |   }
   76 |
   77 |   async isErrorMessageVisible(): Promise<boolean> {
   78 |     return await this.page.locator('[role="alert"]').isVisible();
   79 |   }
   80 |
   81 |   async extractData() {
   82 |     await this.page.locator('button:has-text("Daten extrahieren")').click();
   83 |   }
   84 |
   85 |   async waitForExtractionComplete() {
   86 |     // Wait for extraction to complete
   87 |     await this.page.waitForResponse(resp => 
   88 |       resp.url().includes('/api/extract-receipt') && resp.status() === 200,
   89 |       { timeout: 30000 }
   90 |     );
   91 |   }
   92 | }
   93 |
   94 | // Test Suite
   95 | test.describe('PDF to Image Conversion', () => {
   96 |   let bewirtungsbelegPage: BewirtungsbelegPage;
   97 |
   98 |   test.beforeEach(async ({ page }) => {
   99 |     bewirtungsbelegPage = new BewirtungsbelegPage(page);
  100 |     await bewirtungsbelegPage.navigate();
  101 |   });
  102 |
  103 |   test('should convert PDF to image and display it', async ({ page }) => {
  104 |     // Create a test PDF file
  105 |     const testPdfPath = path.join(process.cwd(), 'test', 'test-receipt.pdf');
  106 |     
  107 |     // Check if test PDF exists, if not create a simple one
  108 |     if (!fs.existsSync(testPdfPath)) {
  109 |       console.log('Creating test PDF...');
  110 |       // Use existing PDF from test directory if available
  111 |       const sourcePdf = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
  112 |       if (fs.existsSync(sourcePdf)) {
  113 |         fs.copyFileSync(sourcePdf, testPdfPath);
  114 |       } else {
  115 |         // Skip test if no PDF available
  116 |         test.skip();
  117 |         return;
  118 |       }
  119 |     }
  120 |
  121 |     // Upload PDF file
```