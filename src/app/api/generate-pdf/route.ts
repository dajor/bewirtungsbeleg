import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';
import sizeOf from 'image-size';

export async function POST(request: Request) {
  console.log('PDF generation API called');
  try {
    const data = await request.json();
    console.log('Received data:', JSON.stringify(data, null, 2));

    const doc = new jsPDF();
    console.log('Created new PDF document');
    
    // Logo hinzufügen
    try {
      const logoPath = path.join(process.cwd(), 'public', 'LOGO-192.png');
      console.log('Loading logo from:', logoPath);
      const logoBuffer = fs.readFileSync(logoPath);
      const base64Logo = logoBuffer.toString('base64');
      doc.addImage(`data:image/png;base64,${base64Logo}`, 'PNG', 20, 10, 20, 20);
      console.log('Logo added successfully');
    } catch (logoError) {
      console.error('Error adding logo:', logoError);
      // Continue without logo
    }
    
    let yPosition = 35;
    console.log('Starting to add content to PDF');
    
    // Titel mit Linie
    doc.setFontSize(16);
    doc.text('Bewirtungsbeleg', 105, yPosition, { align: 'center' });
    doc.setLineWidth(0.5);
    yPosition += 5;
    doc.line(20, yPosition, 190, yPosition);
    console.log('Added title and line');
    
    // Allgemeine Angaben
    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Allgemeine Angaben:', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    yPosition += 10;
    doc.text(`Datum: ${new Date(data.datum).toLocaleDateString('de-DE')}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Restaurant: ${data.restaurantName}`, 20, yPosition);
    
    if (data.restaurantAnschrift) {
      yPosition += 10;
      doc.text(`Anschrift: ${data.restaurantAnschrift}`, 20, yPosition);
    }
    console.log('Added general information');
    
    // Finanzielle Details
    yPosition += 20;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Finanzielle Details:', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    yPosition += 10;
    doc.text(`Gesamtbetrag: ${data.gesamtbetrag}€`, 20, yPosition);
    
    if (data.trinkgeld && Number(data.trinkgeld) > 0) {
      yPosition += 10;
      doc.text(`Trinkgeld: ${data.trinkgeld}€`, 20, yPosition);
      yPosition += 10;
      const gesamtbetrag = typeof data.gesamtbetrag === 'string' ? parseFloat(data.gesamtbetrag.replace(',', '.')) : Number(data.gesamtbetrag);
      const trinkgeld = typeof data.trinkgeld === 'string' ? parseFloat(data.trinkgeld.replace(',', '.')) : Number(data.trinkgeld);
      doc.text(`Rechnungsbetrag ohne Trinkgeld: ${(gesamtbetrag - trinkgeld).toFixed(2).replace('.', ',')}€`, 20, yPosition);
      yPosition += 10;
      doc.text(`Zahlungsart: ${data.zahlungsart === 'firma' ? 'Firmenkreditkarte' : data.zahlungsart === 'privat' ? 'Private Kreditkarte' : 'Bar'}`, 20, yPosition);
    } else {
      yPosition += 10;
      doc.text(`Zahlungsart: ${data.zahlungsart === 'firma' ? 'Firmenkreditkarte' : data.zahlungsart === 'privat' ? 'Private Kreditkarte' : 'Bar'}`, 20, yPosition);
    }
    console.log('Added financial details');

    // Geschäftlicher Anlass
    yPosition += 20;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Geschäftlicher Anlass:', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    yPosition += 10;
    doc.text(`Anlass: ${data.geschaeftlicherAnlass}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Teilnehmer: ${data.teilnehmer}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Geschäftspartner: ${data.geschaeftspartnerNamen}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Firma: ${data.geschaeftspartnerFirma}`, 20, yPosition);
    console.log('Added business occasion details');

    // Footer auf jeder Seite
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setLineWidth(0.5);
      doc.line(20, 280, 190, 280);
      doc.setFontSize(8);
      doc.text('Bewirtungsbeleg App', 105, 285, { align: 'center' });
      doc.text('https://bewirtungsbeleg.docbits.com/', 105, 290, { align: 'center' });
    }
    console.log('Added footer to all pages');

    // Wenn ein Bild vorhanden ist, füge es als Anlage hinzu
    if (data.image) {
      console.log('Adding image attachment...');
      doc.addPage();
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Anlage: Original-Rechnung', 20, 20);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
  
      try {
        // Base64-Bild in Buffer umwandeln
        const base64Data = data.image.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');
  
        // Originaldimensionen auslesen
        const dimensions = sizeOf(imageBuffer);
        const imgWidth = dimensions.width!;
        const imgHeight = dimensions.height!;
  
        // Maximal zulässige Abmessungen (mm) auf A4 Seite
        const maxWidth = 170; // A4 Breite (210mm - 40mm Rand)
        const maxHeight = 250; // A4 Höhe (297mm - 47mm Rand)
  
        // Proportionalen Skalierungsfaktor berechnen
        const widthRatio = maxWidth / imgWidth;
        const heightRatio = maxHeight / imgHeight;
        const scaleFactor = Math.min(widthRatio, heightRatio);
  
        // Skalierte Dimensionen berechnen
        const scaledWidth = imgWidth * scaleFactor;
        const scaledHeight = imgHeight * scaleFactor;
  
        // Zentriere das Bild horizontal
        const xOffset = 20 + (maxWidth - scaledWidth) / 2;
        const yOffset = 30; // Du kannst auch vertikal zentrieren, wenn gewünscht
  
        // Bild hinzufügen
        doc.addImage(
          data.image,
          'JPEG',
          xOffset,
          yOffset,
          scaledWidth,
          scaledHeight,
          undefined,
          'FAST'
        );
  
        console.log('Image added successfully with proportional scaling');
  
      } catch (imageError) {
        console.error('Error adding image:', imageError);
        doc.text('Fehler beim Hinzufügen des Bildes', 20, 30);
      }
    }

    // PDF als Buffer zurückgeben
    console.log('Converting PDF to buffer...');
    const pdfBuffer = doc.output('arraybuffer');
    console.log('PDF generated successfully, size:', pdfBuffer.byteLength);

    return new NextResponse(pdfBuffer, {
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