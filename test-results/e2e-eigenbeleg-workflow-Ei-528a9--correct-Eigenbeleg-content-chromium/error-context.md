# Test info

- Name: Eigenbeleg PDF Content Verification >> should generate PDF with correct Eigenbeleg content
- Location: /Users/daniel/dev/Bewritung/bewir/test/e2e-eigenbeleg-workflow.spec.ts:231:3

# Error details

```
Error: locator.check: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('label:has-text("Eigenbeleg") input[type="checkbox"]').or(locator('input[type="checkbox"]').filter({ has: locator('text=Eigenbeleg') })).or(locator('[data-testid="eigenbeleg-checkbox"]')).first()
    - waiting for" http://localhost:3000/bewirtungsbeleg" navigation to finish...
    - navigated to "http://localhost:3000/bewirtungsbeleg"

    at EigenbelegWorkflow.checkEigenbelegOption (/Users/daniel/dev/Bewritung/bewir/test/e2e-eigenbeleg-workflow.spec.ts:30:30)
    at /Users/daniel/dev/Bewritung/bewir/test/e2e-eigenbeleg-workflow.spec.ts:235:20
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
   1 | /**
   2 |  * E2E Test: Eigenbeleg (Self-Created Receipt) Workflow
   3 |  * Tests the exact scenario from user screenshots where validation error occurred
   4 |  * Tests form filling, Eigenbeleg option, and PDF generation without file attachments
   5 |  */
   6 |
   7 | import { test, expect, Page } from '@playwright/test';
   8 |
   9 | // Page Object Model for Eigenbeleg workflow
   10 | class EigenbelegWorkflow {
   11 |   constructor(private page: Page) {}
   12 |
   13 |   async navigate() {
   14 |     await this.page.goto('/bewirtungsbeleg');
   15 |     await this.page.waitForLoadState('networkidle');
   16 |   }
   17 |
   18 |   async checkEigenbelegOption() {
   19 |     // Check the Eigenbeleg checkbox - try multiple selector strategies
   20 |     const eigenbelegCheckbox = this.page.locator(
   21 |       'label:has-text("Eigenbeleg") input[type="checkbox"]'
   22 |     ).or(
   23 |       this.page.locator('input[type="checkbox"]').filter({ 
   24 |         has: this.page.locator('text=Eigenbeleg') 
   25 |       })
   26 |     ).or(
   27 |       this.page.locator('[data-testid="eigenbeleg-checkbox"]')
   28 |     ).first();
   29 |     
>  30 |     await eigenbelegCheckbox.check();
      |                              ^ Error: locator.check: Test timeout of 60000ms exceeded.
   31 |     await this.page.waitForTimeout(500); // Wait for UI state change
   32 |   }
   33 |
   34 |   async fillFormWithTestData() {
   35 |     // Fill date - German format DD.MM.YYYY (DateInput component)
   36 |     const dateInput = this.page.locator('input[placeholder*="TT.MM.JJJJ"], input[type="text"]').first();
   37 |     await dateInput.fill('07.07.2025');
   38 |
   39 |     // Fill restaurant name
   40 |     const restaurantInput = this.page.locator('label:has-text("Restaurant") + div input, input[placeholder*="Restaurant"]').first();
   41 |     await restaurantInput.fill('OSTERIA DEL PARCO');
   42 |
   43 |     // Fill restaurant address
   44 |     const addressInput = this.page.locator('label:has-text("Anschrift") + div textarea, textarea[placeholder*="Anschrift"]').first();
   45 |     await addressInput.fill('Anzinger St 1 85586 Poing');
   46 |
   47 |     // Select Mitarbeiterbewirtung radio button
   48 |     const mitarbeiterRadio = this.page.locator('label:has-text("Mitarbeiterbewirtung") input[type="radio"]');
   49 |     await mitarbeiterRadio.check();
   50 |
   51 |     // Fill Gesamtbetrag (Brutto)
   52 |     const gesamtbetragInput = this.page.locator('label:has-text("Gesamtbetrag") + div input').first();
   53 |     await gesamtbetragInput.fill('37,00');
   54 |
   55 |     // Fill MwSt. Gesamtbetrag (automatically calculated as 7.03)
   56 |     const mwstInput = this.page.locator('label:has-text("MwSt. Gesamtbetrag") + div input').first();
   57 |     await mwstInput.fill('7,03');
   58 |
   59 |     // Fill Netto Gesamtbetrag (automatically calculated as 29.97)
   60 |     const nettoInput = this.page.locator('label:has-text("Netto Gesamtbetrag") + div input').first();
   61 |     await nettoInput.fill('29,97');
   62 |
   63 |     // Select payment method - Firmenkreditkarte
   64 |     const paymentSelect = this.page.locator('label:has-text("Zahlungsart") + div select');
   65 |     await paymentSelect.selectOption('firma');
   66 |
   67 |     // Fill business occasion
   68 |     const anlassInput = this.page.locator('label:has-text("Geschäftlicher Anlass") + div textarea, label:has-text("Anlass") + div textarea').first();
   69 |     await anlassInput.fill('Mitarbeiterbesprechung');
   70 |
   71 |     // Fill participants
   72 |     const teilnehmerInput = this.page.locator('label:has-text("Teilnehmerkreis") + div textarea').first();
   73 |     await teilnehmerInput.fill('Daniel Jordan, Sehrish Abhul');
   74 |   }
   75 |
   76 |   async submitForm() {
   77 |     // Look for submit or "Bewirtungsbeleg erstellen" button
   78 |     const submitButton = this.page.locator('button[type="submit"]').or(
   79 |       this.page.locator('button:has-text("erstellen"), button:has-text("Erstellen")')
   80 |     ).first();
   81 |     await submitButton.click();
   82 |   }
   83 |
   84 |   async confirmPDFGeneration() {
   85 |     // Wait for confirmation modal and confirm
   86 |     await this.page.waitForSelector('button:has-text("Bestätigen"), button:has-text("Ja")', { timeout: 5000 });
   87 |     const confirmButton = this.page.locator('button:has-text("Bestätigen"), button:has-text("Ja")').first();
   88 |     await confirmButton.click();
   89 |   }
   90 |
   91 |   async waitForPDFGeneration() {
   92 |     // Wait for PDF generation to complete (up to 30 seconds)
   93 |     await this.page.waitForTimeout(2000);
   94 |     
   95 |     // Check for success message or PDF download
   96 |     const successIndicators = [
   97 |       'text=erfolgreich',
   98 |       'text=erstellt',
   99 |       '[role="alert"]:has-text("Erfolg")',
  100 |       'button:has-text("Download")'
  101 |     ];
  102 |
  103 |     let found = false;
  104 |     for (const selector of successIndicators) {
  105 |       try {
  106 |         await this.page.waitForSelector(selector, { timeout: 15000 });
  107 |         found = true;
  108 |         break;
  109 |       } catch {
  110 |         continue;
  111 |       }
  112 |     }
  113 |
  114 |     if (!found) {
  115 |       throw new Error('PDF generation did not complete successfully');
  116 |     }
  117 |   }
  118 |
  119 |   async verifyNoValidationErrors() {
  120 |     // Check that there are no validation error messages
  121 |     const errorMessages = [
  122 |       'text=Expected string, received null',
  123 |       'text=Validierungsfehler',
  124 |       '[role="alert"]:has-text("Fehler")',
  125 |       '.error:visible'
  126 |     ];
  127 |
  128 |     for (const selector of errorMessages) {
  129 |       const errorElement = this.page.locator(selector);
  130 |       await expect(errorElement).toHaveCount(0);
```