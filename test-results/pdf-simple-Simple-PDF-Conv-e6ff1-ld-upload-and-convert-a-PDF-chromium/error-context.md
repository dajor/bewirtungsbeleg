# Test info

- Name: Simple PDF Conversion Test >> should upload and convert a PDF
- Location: /Users/daniel/dev/Bewritung/bewir/test/pdf-simple.spec.ts:30:3

# Error details

```
Error: locator.setInputFiles: Error: strict mode violation: locator('input[type="file"]') resolved to 2 elements:
    1) <input multiple type="file" tabindex="-1" accept="image/png,image/jpeg,image/webp,application/pdf"/> aka getByRole('button', { name: 'Choose File' })
    2) <input type="file" accept=".json"/> aka locator('div').filter({ hasText: /^JSON DownloadJSON Upload$/ }).locator('input[type="file"]')

Call log:
  - waiting for locator('input[type="file"]')

    at /Users/daniel/dev/Bewritung/bewir/test/pdf-simple.spec.ts:48:5
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
   2 |  * Simple test to verify PDF conversion is working
   3 |  */
   4 |
   5 | import { test, expect } from '@playwright/test';
   6 | import * as path from 'path';
   7 | import * as fs from 'fs';
   8 |
   9 | test.describe('Simple PDF Conversion Test', () => {
  10 |   test('should display the upload area', async ({ page }) => {
  11 |     // Navigate to the form page
  12 |     await page.goto('/bewirtungsbeleg');
  13 |     
  14 |     // Wait for page to load
  15 |     await page.waitForLoadState('networkidle');
  16 |     
  17 |     // Check if the file input exists
  18 |     const fileInput = page.locator('input[type="file"]');
  19 |     await expect(fileInput).toBeAttached();
  20 |     
  21 |     // Check if dropzone area is visible
  22 |     const dropzone = page.locator('text=/Dateien hier ablegen oder klicken/i');
  23 |     const isVisible = await dropzone.isVisible();
  24 |     console.log('Dropzone visible:', isVisible);
  25 |     
  26 |     // Take screenshot for debugging
  27 |     await page.screenshot({ path: 'test-results/upload-area.png' });
  28 |   });
  29 |
  30 |   test('should upload and convert a PDF', async ({ page }) => {
  31 |     // Navigate to the form page
  32 |     await page.goto('/bewirtungsbeleg');
  33 |     await page.waitForLoadState('networkidle');
  34 |     
  35 |     // Create test PDF path
  36 |     const testPdfPath = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
  37 |     
  38 |     if (!fs.existsSync(testPdfPath)) {
  39 |       console.log('Test PDF not found at:', testPdfPath);
  40 |       test.skip();
  41 |       return;
  42 |     }
  43 |     
  44 |     console.log('Uploading PDF from:', testPdfPath);
  45 |     
  46 |     // Upload the file
  47 |     const fileInput = page.locator('input[type="file"]');
> 48 |     await fileInput.setInputFiles(testPdfPath);
     |     ^ Error: locator.setInputFiles: Error: strict mode violation: locator('input[type="file"]') resolved to 2 elements:
  49 |     
  50 |     // Wait a bit for processing
  51 |     await page.waitForTimeout(3000);
  52 |     
  53 |     // Take screenshot to see what happened
  54 |     await page.screenshot({ path: 'test-results/after-upload.png' });
  55 |     
  56 |     // Check if any image is displayed
  57 |     const images = page.locator('img');
  58 |     const imageCount = await images.count();
  59 |     console.log('Number of images found:', imageCount);
  60 |     
  61 |     if (imageCount > 0) {
  62 |       for (let i = 0; i < imageCount; i++) {
  63 |         const src = await images.nth(i).getAttribute('src');
  64 |         const alt = await images.nth(i).getAttribute('alt');
  65 |         console.log(`Image ${i}: alt="${alt}", src starts with:`, src?.substring(0, 50));
  66 |       }
  67 |     }
  68 |     
  69 |     // Check for any error messages
  70 |     const alerts = page.locator('[role="alert"]');
  71 |     const alertCount = await alerts.count();
  72 |     if (alertCount > 0) {
  73 |       for (let i = 0; i < alertCount; i++) {
  74 |         const text = await alerts.nth(i).textContent();
  75 |         console.log(`Alert ${i}:`, text);
  76 |       }
  77 |     }
  78 |   });
  79 | });
```