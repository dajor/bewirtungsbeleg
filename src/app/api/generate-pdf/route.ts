import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  console.log('PDF generation API called');
  try {
    const data = await request.json();
    console.log('Received data:', data);

    const doc = new jsPDF();
    
    // Logo hinzufügen
    const logoPath = path.join(process.cwd(), 'public', 'LOGO-192.png');
    const logoBuffer = fs.readFileSync(logoPath);
    const base64Logo = logoBuffer.toString('base64');
    doc.addImage(`data:image/png;base64,${base64Logo}`, 'PNG', 20, 10, 40, 40);
    
    let yPosition = 35;
    
    // Titel mit Linie
    doc.setFontSize(16);
    doc.text('Bewirtungsbeleg', 105, yPosition, { align: 'center' });
    doc.setLineWidth(0.5);
    yPosition += 5;
    doc.line(20, yPosition, 190, yPosition);
    
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
      doc.text(`Rechnungsbetrag ohne Trinkgeld: ${Number(data.gesamtbetrag) - Number(data.trinkgeld)}€`, 20, yPosition);
      yPosition += 10;
      doc.text(`Zahlungsart: ${data.zahlungsart === 'firma' ? 'Firmenkreditkarte' : data.zahlungsart === 'privat' ? 'Private Kreditkarte' : 'Bar'}`, 20, yPosition);
    } else {
      yPosition += 10;
      doc.text(`Zahlungsart: ${data.zahlungsart === 'firma' ? 'Firmenkreditkarte' : data.zahlungsart === 'privat' ? 'Private Kreditkarte' : 'Bar'}`, 20, yPosition);
    }

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

    // PDF als Buffer zurückgeben
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
      { error: 'Fehler bei der PDF-Generierung' },
      { status: 500 }
    );
  }
} 