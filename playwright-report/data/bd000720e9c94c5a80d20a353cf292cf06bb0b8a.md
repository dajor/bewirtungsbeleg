# Test info

- Name: Image Preview Real-World Test >> PDF should be converted and displayed in Image Editor preview
- Location: /Users/daniel/dev/Bewritung/bewir/test/image-preview-real.spec.ts:11:3

# Error details

```
Error: locator.setInputFiles: Error: strict mode violation: locator('input[type="file"]') resolved to 2 elements:
    1) <input multiple type="file" tabindex="-1" accept="image/png,image/jpeg,image/webp,application/pdf"/> aka getByRole('button', { name: 'Choose File' })
    2) <input type="file" accept=".json"/> aka locator('div').filter({ hasText: /^JSON DownloadJSON Upload$/ }).locator('input[type="file"]')

Call log:
  - waiting for locator('input[type="file"]')

    at /Users/daniel/dev/Bewritung/bewir/test/image-preview-real.spec.ts:29:5
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
   2 |  * Real-world test for image preview functionality
   3 |  * This test simulates the actual user flow to verify PDF/image preview works
   4 |  */
   5 |
   6 | import { test, expect, Page } from '@playwright/test';
   7 | import * as path from 'path';
   8 | import * as fs from 'fs';
   9 |
   10 | test.describe('Image Preview Real-World Test', () => {
   11 |   test('PDF should be converted and displayed in Image Editor preview', async ({ page }) => {
   12 |     // Navigate to the actual page
   13 |     await page.goto('/bewirtungsbeleg');
   14 |     await page.waitForLoadState('networkidle');
   15 |     
   16 |     // Create a real PDF file for testing
   17 |     const testPdfPath = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
   18 |     
   19 |     if (!fs.existsSync(testPdfPath)) {
   20 |       console.log('Test PDF not found, skipping test');
   21 |       test.skip();
   22 |       return;
   23 |     }
   24 |
   25 |     console.log('Uploading PDF:', testPdfPath);
   26 |     
   27 |     // Upload the PDF file
   28 |     const fileInput = page.locator('input[type="file"]');
>  29 |     await fileInput.setInputFiles(testPdfPath);
      |     ^ Error: locator.setInputFiles: Error: strict mode violation: locator('input[type="file"]') resolved to 2 elements:
   30 |     
   31 |     // Wait for file to appear in the uploaded files list
   32 |     await page.waitForTimeout(1000);
   33 |     
   34 |     // Click on the uploaded file to select it (this triggers handleImageChange)
   35 |     // The file card should be clickable
   36 |     const fileCard = page.locator('[data-testid="file-card"], .file-item, div:has-text("08042025_kreditbeleg_Pareo.pdf")').first();
   37 |     
   38 |     if (await fileCard.isVisible()) {
   39 |       console.log('Clicking on file card to select it');
   40 |       await fileCard.click();
   41 |       await page.waitForTimeout(500);
   42 |     }
   43 |     
   44 |     // Now the Image Editor should appear on the right
   45 |     const imageEditor = page.locator('text=Image Editor');
   46 |     await expect(imageEditor).toBeVisible({ timeout: 5000 });
   47 |     console.log('Image Editor is visible');
   48 |     
   49 |     // Check for "Converting PDF..." message
   50 |     const convertingMessage = page.locator('text=Converting PDF...');
   51 |     if (await convertingMessage.isVisible({ timeout: 2000 })) {
   52 |       console.log('PDF conversion in progress...');
   53 |       
   54 |       // Wait for conversion to complete (message should disappear)
   55 |       await expect(convertingMessage).toBeHidden({ timeout: 30000 });
   56 |       console.log('PDF conversion completed');
   57 |     }
   58 |     
   59 |     // Check if the image preview is now visible
   60 |     const imagePreview = page.locator('img[alt="Receipt preview"]');
   61 |     const isImageVisible = await imagePreview.isVisible({ timeout: 5000 });
   62 |     
   63 |     if (isImageVisible) {
   64 |       console.log('✅ SUCCESS: Image preview is visible!');
   65 |       
   66 |       // Get the image source to verify it's a valid data URL
   67 |       const imageSrc = await imagePreview.getAttribute('src');
   68 |       console.log('Image source:', imageSrc?.substring(0, 50) + '...');
   69 |       
   70 |       expect(imageSrc).toBeTruthy();
   71 |       expect(imageSrc).toContain('data:image');
   72 |       
   73 |       // Check if rotation controls are enabled
   74 |       const rotateButton = page.locator('[data-testid="rotate-right-90"]');
   75 |       const isRotateEnabled = await rotateButton.isEnabled();
   76 |       console.log('Rotation controls enabled:', isRotateEnabled);
   77 |       expect(isRotateEnabled).toBeTruthy();
   78 |     } else {
   79 |       // Check for error messages
   80 |       const errorMessage = page.locator('text=Failed to convert PDF');
   81 |       const noPreview = page.locator('text=No preview available');
   82 |       
   83 |       if (await errorMessage.isVisible()) {
   84 |         console.log('❌ FAILURE: PDF conversion error displayed');
   85 |         const errorText = await errorMessage.textContent();
   86 |         console.log('Error:', errorText);
   87 |       } else if (await noPreview.isVisible()) {
   88 |         console.log('❌ FAILURE: "No preview available" is shown');
   89 |       } else {
   90 |         console.log('❌ FAILURE: Image preview not visible and no error shown');
   91 |         
   92 |         // Take a screenshot for debugging
   93 |         await page.screenshot({ path: 'test-results/image-preview-failure.png', fullPage: true });
   94 |         console.log('Screenshot saved to test-results/image-preview-failure.png');
   95 |       }
   96 |       
   97 |       // This should fail the test
   98 |       expect(isImageVisible).toBeTruthy();
   99 |     }
  100 |   });
  101 |
  102 |   test('Regular image should display immediately in preview', async ({ page }) => {
  103 |     await page.goto('/bewirtungsbeleg');
  104 |     await page.waitForLoadState('networkidle');
  105 |     
  106 |     // Create a test PNG file
  107 |     const testImagePath = path.join(process.cwd(), 'test', 'test-receipt.png');
  108 |     
  109 |     if (!fs.existsSync(testImagePath)) {
  110 |       // Create a simple PNG if it doesn't exist
  111 |       const pngBuffer = Buffer.from([
  112 |         0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  113 |         0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  114 |         0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  115 |         0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  116 |         0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
  117 |         0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  118 |         0x00, 0x00, 0x03, 0x00, 0x01, 0x5E, 0xF9, 0x51,
  119 |         0x36, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
  120 |         0x44, 0xAE, 0x42, 0x60, 0x82
  121 |       ]);
  122 |       fs.writeFileSync(testImagePath, pngBuffer);
  123 |     }
  124 |     
  125 |     // Upload the image
  126 |     const fileInput = page.locator('input[type="file"]');
  127 |     await fileInput.setInputFiles(testImagePath);
  128 |     await page.waitForTimeout(1000);
  129 |     
```