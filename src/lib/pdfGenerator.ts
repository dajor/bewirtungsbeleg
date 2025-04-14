import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export interface PdfData {
  bewirtungsart: 'mitarbeiter' | 'kunden';
  datum: string;
  restaurantName: string;
  restaurantAnschrift?: string;
  teilnehmer: string;
  anlass?: string;
  gesamtbetrag: string;
  gesamtbetragMwst?: string;
  gesamtbetragNetto?: string;
  trinkgeld: string;
  trinkgeldMwst?: string;
  kreditkartenBetrag: string;
  zahlungsart?: 'firma' | 'privat' | 'bar';
  geschaeftspartnerNamen?: string;
  geschaeftspartnerFirma?: string;
  istAuslaendischeRechnung?: boolean;
  auslaendischeWaehrung?: string;
}

export async function generatePdf(data: PdfData, receiptPath?: string): Promise<Buffer> {
  try {
    // Determine which PDF template to use based on bewirtungsart
    const templateFileName = data.bewirtungsart === 'mitarbeiter' ? 'mitarbeiterbewirtung.pdf' : 'kundenbewirtung.pdf';
    const templatePath = path.join(process.cwd(), 'public', templateFileName);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templateFileName}`);
    }

    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Define the form fields in the template
    const formFields = {
      Datum: "Datum",
      Restaurant: "Restaurant",
      Anschrift: "Anschrift",
      Teilnehmer: "Teilnehmer",
      Anlass: "Anlass",
      Gesamtbetrag: "Gesamtbetrag",
      MwstGesamt: "MwSt. Gesamt",
      GesamtbetragNetto: "Gesamtbetrag Netto",
      KreditkartenBetrag: "Betrag Kreditkarte",
      Trinkgeld: "Trinkgeld",
      MwStTrinkgeld: "MwSt Trinkgeld",
      Zahlungsart: "Zahlungsart",
      Namen: "Namen",
      Firma: "Firma",
      Geschaeftsart: "Geschaeftsart",
    };

    // Fill the fields with data
    form.getTextField(formFields.Datum).setText(new Date(data.datum).toLocaleDateString('de-DE'));
    form.getTextField(formFields.Restaurant).setText(data.restaurantName);
    if (data.restaurantAnschrift) {
      form.getTextField(formFields.Anschrift).setText(data.restaurantAnschrift);
    }

    form.getTextField(formFields.Teilnehmer).setText(data.teilnehmer);
    form.getTextField(formFields.Anlass).setText(data.anlass || 'Projektbesprechung');

    if (data.istAuslaendischeRechnung) {
      form.getTextField(formFields.Gesamtbetrag).setText(`${data.gesamtbetrag} ${data.auslaendischeWaehrung || '$'}`);
      form.getTextField(formFields.Trinkgeld).setText(`${data.trinkgeld}${data.auslaendischeWaehrung || '$'}`);
      form.getTextField(formFields.KreditkartenBetrag).setText(`${data.kreditkartenBetrag} €`);
    } else {
      form.getTextField(formFields.Gesamtbetrag).setText(`${data.gesamtbetrag} €`);
      form.getTextField(formFields.MwstGesamt).setText(`${data.gesamtbetragMwst} €`);
      form.getTextField(formFields.GesamtbetragNetto).setText(`${data.gesamtbetragNetto} €`);
      form.getTextField(formFields.KreditkartenBetrag).setText(`${data.kreditkartenBetrag} €`);
      form.getTextField(formFields.Trinkgeld).setText(`${data.trinkgeld} €`);
      form.getTextField(formFields.MwStTrinkgeld).setText(`${data.trinkgeldMwst} €`);
    }

    if (data.zahlungsart) {
      let zahlungsartText = '';
      switch (data.zahlungsart) {
        case 'firma':
          zahlungsartText = 'Firmenkreditkarte';
          break;
        case 'privat':
          zahlungsartText = 'Private Kreditkarte';
          break;
        case 'bar':
          zahlungsartText = 'Bar';
          break;
      }
      form.getTextField(formFields.Zahlungsart).setText(zahlungsartText);
    }

    if (data.bewirtungsart === 'kunden') {
      form.getTextField(formFields.Namen).setText(data.geschaeftspartnerNamen || '');
      form.getTextField(formFields.Firma).setText(data.geschaeftspartnerFirma || '');
      form.getTextField(formFields.Geschaeftsart).setText("Kundenbewirtung");
    } else {
      form.getTextField(formFields.Geschaeftsart).setText("Mitarbeiterbewirtung");
      if (form.getTextField(formFields.Namen)) {
        form.getTextField(formFields.Namen).setText("");
      }
      if (form.getTextField(formFields.Firma)) {
        form.getTextField(formFields.Firma).setText("");
      }
    }

    // Update appearance of the form fields
    form.flatten();

    // Add the image as a new page at the end if receiptPath is provided
    if (receiptPath && fs.existsSync(receiptPath)) {
      const imageBytes = fs.readFileSync(receiptPath);
      const imagePage = pdfDoc.addPage();
      imagePage.setSize(595, 842);
      const pdfImage = await pdfDoc.embedJpg(imageBytes);
      const { width, height } = pdfImage.scale(0.5);
      const x = (imagePage.getWidth() - width) / 2;
      const y = (imagePage.getHeight() - height) / 2;
      imagePage.drawImage(pdfImage, {
        x,
        y,
        width,
        height,
      });
    }

    // Save and return the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    return Buffer.from(modifiedPdfBytes);
  } catch (error) {
    throw new Error(`Fehler bei der PDF-Generierung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
} 