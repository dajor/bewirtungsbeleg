import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import path from 'path';
import sizeOf from 'image-size';
import {degrees, rgb} from 'pdf-lib'

export async function POST(request: Request) {
  try {
    console.log('PDF generation API called');
    const data = await request.json();    
    console.log('Received data:', JSON.stringify(data, null, 2));

    // Determine which PDF template to use based on bewirtungsart
    const templateFileName = data.bewirtungsart === 'mitarbeiter' ? 'mitarbeiterbewirtung.pdf' : 'kundenbewirtung.pdf';
    const templatePath = path.join(process.cwd(), 'public', templateFileName);
    console.log(`Loading template from public/${templateFileName}`);

    if (!fs.existsSync(templatePath)) {
      console.error(`Template file not found: ${templatePath}`);
      return NextResponse.json(
        { error: `Template file not found: ${templateFileName}` },
        { status: 500 }
      );
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
    }

    // Fill the fields with data
    form.getTextField(formFields.Datum).setText(new Date(data.datum).toLocaleDateString('de-DE'));
    form.getTextField(formFields.Restaurant).setText(data.restaurantName);
    if(data.restaurantAnschrift) {
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
        form.getTextField(formFields.Namen).setText(data.geschaeftspartnerNamen);
        form.getTextField(formFields.Firma).setText(data.geschaeftspartnerFirma);
        form.getTextField(formFields.Geschaeftsart).setText("Kundenbewirtung");
    }else {
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

    // Add the image as a new page at the end
    if (data.image) {
      console.log('Adding image attachment...');
      try {
        const base64Data = data.image.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const dimensions = sizeOf(imageBuffer);
        const imgWidth = dimensions.width!;
        const imgHeight = dimensions.height!;
        const maxWidth = 500;
        const maxHeight = 700;
        const widthRatio = maxWidth / imgWidth;
        const heightRatio = maxHeight / imgHeight;
        const scaleFactor = Math.min(widthRatio, heightRatio);
        const scaledWidth = imgWidth * scaleFactor;
        const scaledHeight = imgHeight * scaleFactor;
        const imagePage = pdfDoc.addPage();
        imagePage.setSize(595, 842);
        const pdfImage = await pdfDoc.embedPng(imageBuffer);
        const x = (imagePage.getWidth() - scaledWidth) / 2;
        const y = (imagePage.getHeight() - scaledHeight) / 2;
        imagePage.drawImage(pdfImage, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight
        });
        console.log('Image added successfully with proportional scaling');
      } catch (imageError) {
        console.error('Error adding image:', imageError);
      }
    }

    // Save and return the modified PDF
    console.log('Converting PDF to buffer...');
    const modifiedPdfBytes = await pdfDoc.save();
    console.log('PDF generated successfully, size:', modifiedPdfBytes.byteLength);

    return new NextResponse(modifiedPdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=bewirtungsbeleg-${new Date(data.datum).toISOString().split('T')[0]}.pdf`,
      },
    });
  } catch (error) {
    console.error('Error in PDF generation API:', error);
    return NextResponse.json(
      { error: 'Fehler bei der PDF-Generierung: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler') },
      { status: 500 }
    );
  }
} 
    } catch (pdfError) {
        console.error('Error trying to modify existing pdf file', pdfError);
    }

    console.log('Received data:', JSON.stringify(data, null, 2));

    console.log('Loading template from public/kundenbewirtung.pdf');
    const pdfPath = path.join(process.cwd(), 'public', 'kundenbewirtung.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the form and fill the fields
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
    }

    // Fill the fields with data
    form.getTextField(formFields.Datum).setText(new Date(data.datum).toLocaleDateString('de-DE'));
    form.getTextField(formFields.Restaurant).setText(data.restaurantName);
    if(data.restaurantAnschrift) {
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
        form.getTextField(formFields.Namen).setText(data.geschaeftspartnerNamen);
        form.getTextField(formFields.Firma).setText(data.geschaeftspartnerFirma);
        form.getTextField(formFields.Geschaeftsart).setText("Kundenbewirtung");
    }else {
        form.getTextField(formFields.Geschaeftsart).setText("Mitarbeiterbewirtung");
    }

    // Update appearance of the form fields
    form.flatten();

    // Wenn ein Bild vorhanden ist, füge es als Anlage hinzu
    if (data.image) {
      console.log('Adding image attachment...');
      try {
        // Base64-Bild in Buffer umwandeln
        const base64Data = data.image.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Originaldimensionen auslesen
        const dimensions = sizeOf(imageBuffer);
        const imgWidth = dimensions.width!;
        const imgHeight = dimensions.height!;

        // Maximal zulässige Abmessungen (mm) auf A4 Seite
        const maxWidth = 500;
        const maxHeight = 700;

        // Proportionalen Skalierungsfaktor berechnen
        const widthRatio = maxWidth / imgWidth;
        const heightRatio = maxHeight / imgHeight;
        const scaleFactor = Math.min(widthRatio, heightRatio);

        // Skalierte Dimensionen berechnen
        const scaledWidth = imgWidth * scaleFactor;
        const scaledHeight = imgHeight * scaleFactor;

        // Add a new page to the PDF document
        const imagePage = pdfDoc.addPage();
        imagePage.setSize(595, 842);

        // Bild hinzufügen
        const pdfImage = await pdfDoc.embedPng(imageBuffer);
        const imageWidth = pdfImage.width;
        const imageHeight = pdfImage.height;

        // Calculate the position to center the image
        const x = (imagePage.getWidth() - scaledWidth) / 2;
        const y = (imagePage.getHeight() - scaledHeight) / 2;

        imagePage.drawImage(pdfImage, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight
        })

        console.log('Image added successfully with proportional scaling');

      } catch (imageError) {
        console.error('Error adding image:', imageError);

      }
    }

    // PDF als Buffer zurückgeben
    console.log('Converting PDF to buffer...');
    const modifiedPdfBytes = await pdfDoc.save();
    console.log('PDF generated successfully, size:', modifiedPdfBytes.byteLength);

    return new NextResponse(modifiedPdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=bewirtungsbeleg-${new Date(data.datum).toISOString().split('T')[0]}.pdf`,
      },
    });
  } catch (error) {
    console.error('Error in PDF generation API:', error);
    return NextResponse.json(
      { error: 'Fehler bei der PDF-Generierung: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler') },
      { status: 500 }
    );
  }
} 