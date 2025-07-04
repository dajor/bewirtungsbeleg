import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generatePdfSchema, sanitizeObject, parseGermanDecimal } from '@/lib/validation';
import { sanitizeFilename } from '@/lib/sanitize';
import { convertPdfToImage } from '@/lib/pdf-to-image';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    console.log('PDF generation API called');
    
    // Dynamic import for jsPDF to avoid SSR issues
    const { default: jsPDF } = await import('jspdf');
    
    // Rate limiting temporarily disabled
    // const identifier = getIdentifier(request, undefined);
    // const rateLimitResponse = await checkRateLimit(apiRatelimit.pdf, identifier);
    // if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    
    // Validate input
    let data;
    try {
      // Convert date string to Date object if needed
      if (body.datum && typeof body.datum === 'string') {
        body.datum = new Date(body.datum);
      }
      const validatedInput = generatePdfSchema.parse(body);
      data = sanitizeObject(validatedInput);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Ungültige Eingabe', details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }
    
    console.log('Validated data:', JSON.stringify(data, null, 2));


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
    doc.text('Bewirtungsbeleg', 105, 20, { align: 'center' });

    // Füge die Art der Bewirtung hinzu
    doc.setFontSize(12);
    const bewirtungsart = data.bewirtungsart === 'kunden' 
      ? 'Kundenbewirtung (70% abzugsfähig)' 
      : 'Mitarbeiterbewirtung (100% abzugsfähig)';
    doc.text(bewirtungsart, 105, 30, { align: 'center' });
    
    // Titel mit Linie
    doc.setLineWidth(0.5);
    yPosition += 5;
    doc.line(20, yPosition, 190, yPosition);
    console.log('Added title and line');
    
    // Allgemeine Angaben
    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Allgemeine Angaben:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
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
    
    // Geschäftlicher Anlass
    yPosition += 20;
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.bewirtungsart === 'kunden' ? 'Geschäftlicher Anlass:' : 'Anlass:'}`, 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    yPosition += 15;
    doc.text(`Teilnehmer: ${data.teilnehmer}`, 20, yPosition);
    yPosition += 15;
    doc.text(`Anlass: ${data.anlass || 'Projektbesprechung'}`, 20, yPosition);

    // Finanzielle Details
    yPosition += 20;
    doc.setFontSize(10);
    doc.text('Finanzielle Details:', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(9);
    if (data.istAuslaendischeRechnung) {
      doc.text(`Gesamtbetrag (Brutto): ${data.gesamtbetrag}${data.auslaendischeWaehrung || '$'}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Trinkgeld: ${data.trinkgeld}${data.auslaendischeWaehrung || '$'}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Betrag auf Kreditkarte: ${data.kreditkartenBetrag}€`, 20, yPosition);
      yPosition += 8;
      doc.text(`Zahlungsart: ${data.zahlungsart === 'firma' ? 'Firmenkreditkarte' : data.zahlungsart === 'privat' ? 'Private Kreditkarte' : 'Bar'}`, 20, yPosition);
      yPosition += 8;
      if (data.auslaendischeWaehrung) {
        doc.text(`Währung: ${data.auslaendischeWaehrung}`, 20, yPosition);
      }
      yPosition += 10;
    } else {
      doc.text(`Gesamtbetrag (Brutto): ${data.gesamtbetrag}€`, 20, yPosition);
      yPosition += 8;
      doc.text(`MwSt. Gesamtbetrag: ${data.gesamtbetragMwst}€`, 20, yPosition);
      yPosition += 8;
      doc.text(`Netto Gesamtbetrag: ${data.gesamtbetragNetto}€`, 20, yPosition);
      yPosition += 8;
      doc.text(`Betrag auf Kreditkarte: ${data.kreditkartenBetrag}€`, 20, yPosition);
      yPosition += 8;
      doc.text(`Trinkgeld: ${data.trinkgeld}€`, 20, yPosition);
      yPosition += 8;
      doc.text(`MwSt. Trinkgeld: ${data.trinkgeldMwst}€`, 20, yPosition);
      yPosition += 8;
      doc.text(`Zahlungsart: ${data.zahlungsart === 'firma' ? 'Firmenkreditkarte' : data.zahlungsart === 'privat' ? 'Private Kreditkarte' : 'Bar'}`, 20, yPosition);
      yPosition += 10;
    }

    // Geschäftspartner (nur bei Kundenbewirtung)
    if (data.bewirtungsart === 'kunden') {
      yPosition += 20; // Mehr Abstand vor dem Abschnitt
      doc.setFontSize(10);
      doc.text('Geschäftspartner:', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(9);
      doc.text(`Namen: ${data.geschaeftspartnerNamen}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Firma: ${data.geschaeftspartnerFirma}`, 20, yPosition);
      yPosition += 10;
    }

    // Ensure we have enough space for signature (check if we need a new page)
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Add some space before signature section
    yPosition += 20;

    // Unterschrift Section with better layout
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Unterschrift:', 20, yPosition);
    yPosition += 15;

    // Signature line
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 120, yPosition);
    yPosition += 15;

    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Dieser Bewirtungsbeleg wurde automatisch erstellt und muss unterschrieben werden.', 20, yPosition);
    yPosition += 5;

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

    // Handle attachments - both legacy single image and new multiple attachments
    const attachmentsToAdd: Array<{ data: string; name: string; type: string }> = [];
    
    // Check for legacy single image
    if (data.image) {
      attachmentsToAdd.push({
        data: data.image,
        name: 'Original-Rechnung',
        type: 'image/jpeg'
      });
    }
    
    // Check for new attachments array
    if (data.attachments && Array.isArray(data.attachments)) {
      console.log(`Found ${data.attachments.length} attachments in request`);
      attachmentsToAdd.push(...data.attachments);
    }
    
    // Add all attachments
    if (attachmentsToAdd.length > 0) {
      console.log(`Adding ${attachmentsToAdd.length} attachment(s) to PDF...`);
      
      for (let i = 0; i < attachmentsToAdd.length; i++) {
        const attachment = attachmentsToAdd[i];
        
        try {
          console.log(`Processing attachment ${i + 1}: ${attachment.name}, type: ${attachment.type}`);
          
          // Validate attachment data
          if (!attachment.data || !attachment.data.startsWith('data:')) {
            throw new Error('Invalid attachment data format');
          }
          
          // Variables to store processed attachment data
          let processedImageData: string;
          let scaledWidth: number;
          let scaledHeight: number;

          // Handle PDF attachments by converting them to images
          if (attachment.type === 'application/pdf') {
            console.log(`Converting PDF attachment: ${attachment.name}`);
            
            // Extract PDF data from base64
            const base64Data = attachment.data.split(',')[1];
            const pdfBuffer = Buffer.from(base64Data, 'base64');
            
            // Convert PDF to image
            const imageData = await convertPdfToImage(pdfBuffer, attachment.name);
            
            // Calculate proportional scaling to preserve aspect ratio
            const maxWidth = 170; // A4 width (210mm - 40mm margins)
            const maxHeight = 240; // Leave space for header text
            
            // Get image dimensions from base64 data
            const base64Buffer = Buffer.from(imageData.split(',')[1], 'base64');
            const sizeOf = await import('image-size');
            const dimensions = sizeOf.default(base64Buffer);
            
            if (!dimensions.width || !dimensions.height) {
              throw new Error('Could not determine image dimensions');
            }
            
            const originalWidth = dimensions.width;
            const originalHeight = dimensions.height;
            
            console.log(`Original image dimensions: ${originalWidth}x${originalHeight}`);
            
            // Calculate scale to fit within max dimensions while preserving aspect ratio
            const scaleX = maxWidth / originalWidth;
            const scaleY = maxHeight / originalHeight;
            const scale = Math.min(scaleX, scaleY); // Use smaller scale to fit within bounds
            
            scaledWidth = originalWidth * scale;
            scaledHeight = originalHeight * scale;
            processedImageData = imageData;
            
            console.log(`Scaled dimensions (preserving aspect ratio): ${scaledWidth.toFixed(1)}x${scaledHeight.toFixed(1)}`);
            console.log(`PDF attachment ${i + 1} converted successfully`);
          } else {
            // Handle regular images
            console.log(`Processing regular image: ${attachment.name}`);
            
            // Calculate proportional scaling for regular images
            const maxWidth = 170; // A4 width (210mm - 40mm margins)
            const maxHeight = 240; // Leave space for header text
            
            // Get image dimensions from base64 data
            const base64Buffer = Buffer.from(attachment.data.split(',')[1], 'base64');
            const sizeOf = await import('image-size');
            const dimensions = sizeOf.default(base64Buffer);
            
            if (!dimensions.width || !dimensions.height) {
              throw new Error('Could not determine image dimensions');
            }
            
            const originalWidth = dimensions.width;
            const originalHeight = dimensions.height;
            
            console.log(`Original image dimensions: ${originalWidth}x${originalHeight}`);
            
            // Calculate scale to fit within max dimensions while preserving aspect ratio
            const scaleX = maxWidth / originalWidth;
            const scaleY = maxHeight / originalHeight;
            const scale = Math.min(scaleX, scaleY); // Use smaller scale to fit within bounds
            
            scaledWidth = originalWidth * scale;
            scaledHeight = originalHeight * scale;
            processedImageData = attachment.data;
            
            console.log(`Scaled dimensions (preserving aspect ratio): ${scaledWidth.toFixed(1)}x${scaledHeight.toFixed(1)}`);
          }
          
          // If we reach here, attachment processing was successful
          // NOW create the page and add the content
          doc.addPage();
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`Anlage ${i + 1}: ${attachment.name || 'Original-Rechnung'}`, 20, 20);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          
          // Add the processed image to the PDF
          const x = 20;
          const y = 30;
          
          // Determine image format for jsPDF
          let imageFormat = 'JPEG'; // default for PDF conversions
          if (attachment.type === 'image/png') {
            imageFormat = 'PNG';
          } else if (attachment.type === 'application/pdf') {
            imageFormat = 'JPEG'; // PDF conversions are always JPEG
          }
          
          console.log(`Adding image with format: ${imageFormat} (original type: ${attachment.type})`);
          doc.addImage(processedImageData, imageFormat, x, y, scaledWidth, scaledHeight);
          
          console.log(`Attachment ${i + 1} added successfully`);
    
        } catch (imageError) {
          console.error(`Error adding attachment ${i + 1}:`, imageError);
          console.error('Attachment details:', {
            name: attachment.name,
            type: attachment.type,
            dataLength: attachment.data?.length || 0,
            dataPrefix: attachment.data?.substring(0, 50)
          });
          // Don't add empty error pages - just log the error and continue
          console.warn(`Skipping attachment ${i + 1} due to processing error`);
        }
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