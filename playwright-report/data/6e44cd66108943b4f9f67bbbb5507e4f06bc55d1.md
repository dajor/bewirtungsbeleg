# Test info

- Name: ZUGFeRD Integration Tests >> should handle UTF-8 characters in ZUGFeRD data
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-zugferd.spec.ts:278:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
    at /Users/daniel/dev/Bewritung/bewir/test/e2e-zugferd.spec.ts:293:27
```

# Test source

```ts
  193 |     await page.fill('input[name="gesamtbetrag"]', '100,00');
  194 |     await page.fill('textarea[name="teilnehmer"]', 'Kunde A, Kunde B');
  195 |     await page.fill('textarea[name="anlass"]', 'Kundenakquise');
  196 |     
  197 |     await page.selectOption('select[name="bewirtungsart"]', 'kunden');
  198 |     await page.fill('input[name="geschaeftspartnerNamen"]', 'Kunde A, Kunde B');
  199 |     await page.fill('input[name="geschaeftspartnerFirma"]', 'Kunden GmbH');
  200 |     
  201 |     // Enable ZUGFeRD
  202 |     const zugferdCheckbox = page.locator('input[name="generateZugferd"]');
  203 |     if (await zugferdCheckbox.isVisible()) {
  204 |       await zugferdCheckbox.check();
  205 |     }
  206 |     
  207 |     // Generate PDF
  208 |     const downloadPromise = page.waitForEvent('download');
  209 |     const generateButton = page.locator('button:has-text("PDF generieren")');
  210 |     await generateButton.click();
  211 |     
  212 |     const download = await downloadPromise;
  213 |     const fileName = download.suggestedFilename();
  214 |     
  215 |     // Customer entertainment PDFs should indicate 70% deductibility
  216 |     expect(fileName).toContain('bewirtungsbeleg');
  217 |     
  218 |     // Now test employee entertainment (100% deductible)
  219 |     await page.selectOption('select[name="bewirtungsart"]', 'mitarbeiter');
  220 |     await page.fill('textarea[name="teilnehmer"]', 'Mitarbeiter A, Mitarbeiter B');
  221 |     await page.fill('textarea[name="anlass"]', 'Teambuilding');
  222 |     
  223 |     const downloadPromise2 = page.waitForEvent('download');
  224 |     await generateButton.click();
  225 |     
  226 |     const download2 = await downloadPromise2;
  227 |     const fileName2 = download2.suggestedFilename();
  228 |     expect(fileName2).toContain('bewirtungsbeleg');
  229 |   });
  230 | });
  231 |
  232 | test.describe('ZUGFeRD Integration Tests', () => {
  233 |   test('should properly format German addresses in ZUGFeRD XML', async ({ request }) => {
  234 |     // Direct API test for ZUGFeRD generation
  235 |     const pdfBase64 = 'JVBERi0xLjQKJeLjz9M='; // Mock PDF
  236 |     
  237 |     const response = await request.post('/api/generate-pdf', {
  238 |       data: {
  239 |         datum: new Date('2024-04-15'),
  240 |         restaurantName: 'Müller\'s Gasthof',
  241 |         restaurantAnschrift: 'Schöneberger Straße 42',
  242 |         restaurantPlz: '10115',
  243 |         restaurantOrt: 'Berlin',
  244 |         unternehmen: 'Süddeutsche GmbH & Co. KG',
  245 |         unternehmenAnschrift: 'Königsallee 1',
  246 |         unternehmenPlz: '80331',
  247 |         unternehmenOrt: 'München',
  248 |         teilnehmer: 'Herr Müller, Frau Schäfer',
  249 |         anlass: 'Geschäftsessen für Vertragsabschluss',
  250 |         speisen: '45,50',
  251 |         getraenke: '28,90',
  252 |         trinkgeld: '7,00',
  253 |         gesamtbetrag: '81,40',
  254 |         zahlungsart: 'firma',
  255 |         bewirtungsart: 'kunden',
  256 |         geschaeftspartnerNamen: 'Herr Müller',
  257 |         geschaeftspartnerFirma: 'Müller AG',
  258 |         generateZugferd: true,
  259 |         attachments: [{
  260 |           data: `data:image/png;base64,${pdfBase64}`,
  261 |           name: 'Rechnung',
  262 |           type: 'image/png'
  263 |         }]
  264 |       }
  265 |     });
  266 |     
  267 |     // Should return a PDF (even if ZUGFeRD fails, it falls back to regular PDF)
  268 |     expect(response.ok()).toBeTruthy();
  269 |     expect(response.headers()['content-type']).toContain('application/pdf');
  270 |     
  271 |     // Check for ZUGFeRD headers if successful
  272 |     const zugferdHeader = response.headers()['x-zugferd'];
  273 |     if (zugferdHeader === 'true') {
  274 |       expect(response.headers()['x-zugferd-profile']).toBe('BASIC');
  275 |     }
  276 |   });
  277 |
  278 |   test('should handle UTF-8 characters in ZUGFeRD data', async ({ request }) => {
  279 |     const response = await request.post('/api/generate-pdf', {
  280 |       data: {
  281 |         datum: new Date('2024-04-15'),
  282 |         restaurantName: 'Café Français',
  283 |         restaurantAnschrift: 'Große Freiheit 39',
  284 |         teilnehmer: 'José García, François Müller, 王明',
  285 |         anlass: 'Internationale Geschäftsbesprechung',
  286 |         gesamtbetrag: '150,00',
  287 |         zahlungsart: 'firma',
  288 |         bewirtungsart: 'kunden',
  289 |         generateZugferd: true
  290 |       }
  291 |     });
  292 |     
> 293 |     expect(response.ok()).toBeTruthy();
      |                           ^ Error: expect(received).toBeTruthy()
  294 |   });
  295 | });
```