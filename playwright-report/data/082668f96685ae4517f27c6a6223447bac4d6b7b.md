# Test info

- Name: ZUGFeRD PDF Generation >> should handle ZUGFeRD generation errors gracefully
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-zugferd.spec.ts:104:3

# Error details

```
Error: page.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[name="datum"]')
    - waiting for" http://localhost:3000/bewirtungsbeleg" navigation to finish...
    - navigated to "http://localhost:3000/bewirtungsbeleg"

    at /Users/daniel/dev/Bewritung/bewir/test/e2e-zugferd.spec.ts:106:16
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
  - text: Datum der Bewirtung
  - textbox "Datum der Bewirtung"
  - text: Restaurant
  - textbox "Restaurant"
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
  - heading "💰 Finanzielle Berechnung" [level=3]
  - paragraph: "Bitte folgen Sie der Reihenfolge auf Ihrer Rechnung: Netto → MwSt. → Gesamtsumme → Bezahlter Betrag → Trinkgeld"
  - paragraph: 📝 Eingabefelder
  - paragraph: Tragen Sie die Beträge von Ihrer Rechnung ein
  - text: 1. Netto Betrag
  - paragraph: Netto-Gesamtsumme von der Rechnung
  - textbox "1. Netto Betrag"
  - paragraph: 2. Mehrwertsteuer
  - text: MwSt. 7%
  - paragraph: 7% (Speisen)
  - textbox "MwSt. 7%"
  - text: MwSt. 19%
  - paragraph: 19% (Getränke)
  - textbox "MwSt. 19%"
  - text: Gesamt MwSt.
  - paragraph: = MwSt. 7% + MwSt. 19%
  - textbox "Gesamt MwSt."
  - text: 3. Brutto Gesamtbetrag
  - paragraph: "Editierbar: Brutto ⇄ Netto (Berechnung in beide Richtungen)"
  - textbox "3. Brutto Gesamtbetrag"
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
  - paragraph: 0.00 €
  - paragraph: "+ MwSt. 7%:"
  - paragraph: 0.00 €
  - paragraph: "+ MwSt. 19%:"
  - paragraph: 0.00 €
  - separator
  - paragraph: "= Gesamtbetrag:"
  - paragraph: 0.00 €
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
   6 | import { test, expect } from '@playwright/test';
   7 | import path from 'path';
   8 | import fs from 'fs';
   9 |
   10 | test.describe('ZUGFeRD PDF Generation', () => {
   11 |   test.beforeEach(async ({ page }) => {
   12 |     await page.goto('/bewirtungsbeleg');
   13 |     await page.waitForLoadState('networkidle');
   14 |     await page.waitForTimeout(500);
   15 |   });
   16 |
   17 |   test('should generate ZUGFeRD-compliant PDF with all required fields', async ({ page }) => {
   18 |     // Fill in the form with complete data
   19 |     await page.fill('input[name="datum"]', '15.04.2024');
   20 |     await page.fill('input[name="restaurantName"]', 'Restaurant Zur Post');
   21 |     await page.fill('input[name="restaurantAnschrift"]', 'Hauptstraße 42');
   22 |     await page.fill('input[name="restaurantPlz"]', '10115');
   23 |     await page.fill('input[name="restaurantOrt"]', 'Berlin');
   24 |     
   25 |     // Company details
   26 |     await page.fill('input[name="unternehmen"]', 'DocBits GmbH');
   27 |     await page.fill('input[name="unternehmenAnschrift"]', 'Technologiepark 10');
   28 |     await page.fill('input[name="unternehmenPlz"]', '20099');
   29 |     await page.fill('input[name="unternehmenOrt"]', 'Hamburg');
   30 |     
   31 |     // Participants and occasion
   32 |     await page.fill('textarea[name="teilnehmer"]', 'Max Mustermann, Erika Musterfrau');
   33 |     await page.fill('textarea[name="anlass"]', 'Geschäftsbesprechung Q2 Planung');
   34 |     
   35 |     // Amounts with German decimal format
   36 |     await page.fill('input[name="speisen"]', '45,00');
   37 |     await page.fill('input[name="getraenke"]', '30,00');
   38 |     await page.fill('input[name="trinkgeld"]', '5,00');
   39 |     await page.fill('input[name="gesamtbetrag"]', '80,00');
   40 |     
   41 |     // Select payment and entertainment type
   42 |     await page.selectOption('select[name="zahlungsart"]', 'firma');
   43 |     await page.selectOption('select[name="bewirtungsart"]', 'kunden');
   44 |     
   45 |     // Business partner details for customer entertainment
   46 |     await page.fill('input[name="geschaeftspartnerNamen"]', 'Max Mustermann, Erika Musterfrau');
   47 |     await page.fill('input[name="geschaeftspartnerFirma"]', 'Example AG');
   48 |     
   49 |     // Enable ZUGFeRD generation
   50 |     const zugferdCheckbox = page.locator('input[name="generateZugferd"]');
   51 |     if (await zugferdCheckbox.isVisible()) {
   52 |       await zugferdCheckbox.check();
   53 |     }
   54 |     
   55 |     // Upload a test receipt image
   56 |     const testImagePath = path.join(process.cwd(), 'test', 'test-receipt.png');
   57 |     if (!fs.existsSync(testImagePath)) {
   58 |       // Create a simple test image if it doesn't exist
   59 |       const pngBuffer = Buffer.from([
   60 |         0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
   61 |         0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
   62 |         0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
   63 |         0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
   64 |         0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
   65 |         0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
   66 |         0x00, 0x00, 0x03, 0x00, 0x01, 0x5E, 0xF9, 0x51,
   67 |         0x36, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
   68 |         0x44, 0xAE, 0x42, 0x60, 0x82
   69 |       ]);
   70 |       fs.writeFileSync(testImagePath, pngBuffer);
   71 |     }
   72 |     
   73 |     const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
   74 |     await fileInput.setInputFiles(testImagePath);
   75 |     await page.waitForTimeout(1000);
   76 |     
   77 |     // Set up response listener for PDF generation
   78 |     const downloadPromise = page.waitForEvent('download');
   79 |     
   80 |     // Click generate PDF button
   81 |     const generateButton = page.locator('button:has-text("PDF generieren")');
   82 |     await generateButton.click();
   83 |     
   84 |     // Wait for the download
   85 |     const download = await downloadPromise;
   86 |     
   87 |     // Verify the download
   88 |     expect(download).toBeTruthy();
   89 |     const fileName = download.suggestedFilename();
   90 |     expect(fileName).toContain('zugferd');
   91 |     expect(fileName).toEndWith('.pdf');
   92 |     
   93 |     // Save the file for inspection
   94 |     const downloadPath = path.join(process.cwd(), 'test-results', fileName);
   95 |     await download.saveAs(downloadPath);
   96 |     
   97 |     // Verify file exists and has content
   98 |     const fileStats = fs.statSync(downloadPath);
   99 |     expect(fileStats.size).toBeGreaterThan(1000); // PDF should be at least 1KB
  100 |     
  101 |     console.log(`ZUGFeRD PDF generated: ${downloadPath} (${fileStats.size} bytes)`);
  102 |   });
  103 |
  104 |   test('should handle ZUGFeRD generation errors gracefully', async ({ page }) => {
  105 |     // Fill minimal required fields
> 106 |     await page.fill('input[name="datum"]', '15.04.2024');
      |                ^ Error: page.fill: Test timeout of 60000ms exceeded.
  107 |     await page.fill('input[name="restaurantName"]', 'Test Restaurant');
  108 |     await page.fill('textarea[name="teilnehmer"]', 'Test Person');
  109 |     await page.fill('textarea[name="anlass"]', 'Test');
  110 |     await page.fill('input[name="gesamtbetrag"]', '50,00');
  111 |     
  112 |     // Enable ZUGFeRD with incomplete data
  113 |     const zugferdCheckbox = page.locator('input[name="generateZugferd"]');
  114 |     if (await zugferdCheckbox.isVisible()) {
  115 |       await zugferdCheckbox.check();
  116 |     }
  117 |     
  118 |     // Mock the ZUGFeRD API to return an error
  119 |     await page.route('**/api/zugferd/**', route => {
  120 |       route.fulfill({
  121 |         status: 500,
  122 |         contentType: 'application/json',
  123 |         body: JSON.stringify({ error: 'ZUGFeRD service unavailable' })
  124 |       });
  125 |     });
  126 |     
  127 |     // Try to generate PDF
  128 |     const generateButton = page.locator('button:has-text("PDF generieren")');
  129 |     await generateButton.click();
  130 |     
  131 |     // Should still generate a regular PDF as fallback
  132 |     const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
  133 |     const download = await downloadPromise;
  134 |     
  135 |     if (download) {
  136 |       const fileName = download.suggestedFilename();
  137 |       // Should fall back to regular PDF without 'zugferd' in name
  138 |       expect(fileName).not.toContain('zugferd');
  139 |       expect(fileName).toContain('bewirtungsbeleg');
  140 |     }
  141 |   });
  142 |
  143 |   test('should validate VAT breakdown for ZUGFeRD', async ({ page }) => {
  144 |     // Fill form with specific VAT rates
  145 |     await page.fill('input[name="datum"]', '15.04.2024');
  146 |     await page.fill('input[name="restaurantName"]', 'Test Restaurant');
  147 |     await page.fill('input[name="restaurantAnschrift"]', 'Test Straße 1');
  148 |     await page.fill('input[name="restaurantPlz"]', '12345');
  149 |     await page.fill('input[name="restaurantOrt"]', 'Test Stadt');
  150 |     
  151 |     // Amounts with different VAT rates
  152 |     await page.fill('input[name="speisen"]', '107,00'); // 100€ + 7% VAT
  153 |     await page.fill('input[name="getraenke"]', '119,00'); // 100€ + 19% VAT
  154 |     await page.fill('input[name="trinkgeld"]', '10,00'); // No VAT
  155 |     await page.fill('input[name="gesamtbetrag"]', '236,00');
  156 |     
  157 |     await page.fill('textarea[name="teilnehmer"]', 'Test Teilnehmer');
  158 |     await page.fill('textarea[name="anlass"]', 'VAT Test');
  159 |     
  160 |     // Enable ZUGFeRD
  161 |     const zugferdCheckbox = page.locator('input[name="generateZugferd"]');
  162 |     if (await zugferdCheckbox.isVisible()) {
  163 |       await zugferdCheckbox.check();
  164 |     }
  165 |     
  166 |     // Intercept the API call to verify VAT calculation
  167 |     let apiRequestData: any = null;
  168 |     await page.route('**/api/generate-pdf', async route => {
  169 |       const request = route.request();
  170 |       apiRequestData = await request.postDataJSON();
  171 |       await route.continue();
  172 |     });
  173 |     
  174 |     // Generate PDF
  175 |     const generateButton = page.locator('button:has-text("PDF generieren")');
  176 |     await generateButton.click();
  177 |     
  178 |     // Wait a bit for the request to be captured
  179 |     await page.waitForTimeout(2000);
  180 |     
  181 |     // Verify the request included ZUGFeRD flag
  182 |     if (apiRequestData) {
  183 |       expect(apiRequestData.generateZugferd).toBe(true);
  184 |       expect(apiRequestData.speisen).toBe('107,00');
  185 |       expect(apiRequestData.getraenke).toBe('119,00');
  186 |       expect(apiRequestData.trinkgeld).toBe('10,00');
  187 |     }
  188 |   });
  189 |
  190 |   test('should include business entertainment deductibility in ZUGFeRD', async ({ page }) => {
  191 |     // Test customer entertainment (70% deductible)
  192 |     await page.fill('input[name="datum"]', '15.04.2024');
  193 |     await page.fill('input[name="restaurantName"]', 'Restaurant Test');
  194 |     await page.fill('input[name="gesamtbetrag"]', '100,00');
  195 |     await page.fill('textarea[name="teilnehmer"]', 'Kunde A, Kunde B');
  196 |     await page.fill('textarea[name="anlass"]', 'Kundenakquise');
  197 |     
  198 |     await page.selectOption('select[name="bewirtungsart"]', 'kunden');
  199 |     await page.fill('input[name="geschaeftspartnerNamen"]', 'Kunde A, Kunde B');
  200 |     await page.fill('input[name="geschaeftspartnerFirma"]', 'Kunden GmbH');
  201 |     
  202 |     // Enable ZUGFeRD
  203 |     const zugferdCheckbox = page.locator('input[name="generateZugferd"]');
  204 |     if (await zugferdCheckbox.isVisible()) {
  205 |       await zugferdCheckbox.check();
  206 |     }
```