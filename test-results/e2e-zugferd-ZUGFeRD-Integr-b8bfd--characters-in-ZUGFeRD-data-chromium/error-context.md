# Test info

- Name: ZUGFeRD Integration Tests >> should handle UTF-8 characters in ZUGFeRD data
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-zugferd.spec.ts:279:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
    at /Users/daniel/dev/Bewritung/bewir/test/e2e-zugferd.spec.ts:294:27
```

# Test source

```ts
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
  293 |     
> 294 |     expect(response.ok()).toBeTruthy();
      |                           ^ Error: expect(received).toBeTruthy()
  295 |   });
  296 | });
```