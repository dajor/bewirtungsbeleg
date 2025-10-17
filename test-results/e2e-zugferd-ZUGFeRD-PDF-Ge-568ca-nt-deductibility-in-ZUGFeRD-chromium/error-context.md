# Test info

- Name: ZUGFeRD PDF Generation >> should include business entertainment deductibility in ZUGFeRD
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-zugferd.spec.ts:190:3

# Error details

```
Error: page.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[name="datum"]')
    - waiting for" http://localhost:3000/bewirtungsbeleg" navigation to finish...
    - navigated to "http://localhost:3000/bewirtungsbeleg"

    at /Users/daniel/dev/Bewritung/bewir/test/e2e-zugferd.spec.ts:192:16
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
  106 |     await page.fill('input[name="datum"]', '15.04.2024');
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
> 192 |     await page.fill('input[name="datum"]', '15.04.2024');
      |                ^ Error: page.fill: Test timeout of 60000ms exceeded.
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
  207 |     
  208 |     // Generate PDF
  209 |     const downloadPromise = page.waitForEvent('download');
  210 |     const generateButton = page.locator('button:has-text("PDF generieren")');
  211 |     await generateButton.click();
  212 |     
  213 |     const download = await downloadPromise;
  214 |     const fileName = download.suggestedFilename();
  215 |     
  216 |     // Customer entertainment PDFs should indicate 70% deductibility
  217 |     expect(fileName).toContain('bewirtungsbeleg');
  218 |     
  219 |     // Now test employee entertainment (100% deductible)
  220 |     await page.selectOption('select[name="bewirtungsart"]', 'mitarbeiter');
  221 |     await page.fill('textarea[name="teilnehmer"]', 'Mitarbeiter A, Mitarbeiter B');
  222 |     await page.fill('textarea[name="anlass"]', 'Teambuilding');
  223 |     
  224 |     const downloadPromise2 = page.waitForEvent('download');
  225 |     await generateButton.click();
  226 |     
  227 |     const download2 = await downloadPromise2;
  228 |     const fileName2 = download2.suggestedFilename();
  229 |     expect(fileName2).toContain('bewirtungsbeleg');
  230 |   });
  231 | });
  232 |
  233 | test.describe('ZUGFeRD Integration Tests', () => {
  234 |   test('should properly format German addresses in ZUGFeRD XML', async ({ request }) => {
  235 |     // Direct API test for ZUGFeRD generation
  236 |     const pdfBase64 = 'JVBERi0xLjQKJeLjz9M='; // Mock PDF
  237 |     
  238 |     const response = await request.post('/api/generate-pdf', {
  239 |       data: {
  240 |         datum: new Date('2024-04-15'),
  241 |         restaurantName: 'Müller\'s Gasthof',
  242 |         restaurantAnschrift: 'Schöneberger Straße 42',
  243 |         restaurantPlz: '10115',
  244 |         restaurantOrt: 'Berlin',
  245 |         unternehmen: 'Süddeutsche GmbH & Co. KG',
  246 |         unternehmenAnschrift: 'Königsallee 1',
  247 |         unternehmenPlz: '80331',
  248 |         unternehmenOrt: 'München',
  249 |         teilnehmer: 'Herr Müller, Frau Schäfer',
  250 |         anlass: 'Geschäftsessen für Vertragsabschluss',
  251 |         speisen: '45,50',
  252 |         getraenke: '28,90',
  253 |         trinkgeld: '7,00',
  254 |         gesamtbetrag: '81,40',
  255 |         zahlungsart: 'firma',
  256 |         bewirtungsart: 'kunden',
  257 |         geschaeftspartnerNamen: 'Herr Müller',
  258 |         geschaeftspartnerFirma: 'Müller AG',
  259 |         generateZugferd: true,
  260 |         attachments: [{
  261 |           data: `data:image/png;base64,${pdfBase64}`,
  262 |           name: 'Rechnung',
  263 |           type: 'image/png'
  264 |         }]
  265 |       }
  266 |     });
  267 |     
  268 |     // Should return a PDF (even if ZUGFeRD fails, it falls back to regular PDF)
  269 |     expect(response.ok()).toBeTruthy();
  270 |     expect(response.headers()['content-type']).toContain('application/pdf');
  271 |     
  272 |     // Check for ZUGFeRD headers if successful
  273 |     const zugferdHeader = response.headers()['x-zugferd'];
  274 |     if (zugferdHeader === 'true') {
  275 |       expect(response.headers()['x-zugferd-profile']).toBe('BASIC');
  276 |     }
  277 |   });
  278 |
  279 |   test('should handle UTF-8 characters in ZUGFeRD data', async ({ request }) => {
  280 |     const response = await request.post('/api/generate-pdf', {
  281 |       data: {
  282 |         datum: new Date('2024-04-15'),
  283 |         restaurantName: 'Café Français',
  284 |         restaurantAnschrift: 'Große Freiheit 39',
  285 |         teilnehmer: 'José García, François Müller, 王明',
  286 |         anlass: 'Internationale Geschäftsbesprechung',
  287 |         gesamtbetrag: '150,00',
  288 |         zahlungsart: 'firma',
  289 |         bewirtungsart: 'kunden',
  290 |         generateZugferd: true
  291 |       }
  292 |     });
```