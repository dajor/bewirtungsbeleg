import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generatePdfSchema, sanitizeObject, parseGermanDecimal } from '@/lib/validation';
import { sanitizeFilename } from '@/lib/sanitize';
import { convertPdfToImage } from '@/lib/pdf-to-image';
import { convertPdfToImagesAllPages } from '@/lib/pdf-to-image-multipage';
import { ZugferdService } from '@/lib/zugferd-service';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    console.log('PDF generation API called');

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

    // ===== NEW APPROACH: Use professional UX designer PDF templates =====
    console.log('Loading professional PDF template...');

    // Dynamic import for pdf-lib
    const { PDFDocument } = await import('pdf-lib');

    // Select template based on bewirtungsart
    const templateFilename = data.bewirtungsart === 'kunden'
      ? 'kundenbewirtung.pdf'
      : 'mitarbeiterbewirtung.pdf';

    const templatePath = path.join(process.cwd(), 'pdf-template', templateFilename);
    console.log('Using template:', templatePath);

    // Load the professional template
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();

    console.log('Professional template loaded successfully');

    // Fill form fields with data
    try {
      // Restaurant & Location
      const restaurantField = form.getTextField('Restaurant');
      restaurantField.setText(data.restaurantName || '');

      const ortField = form.getTextField('Ort_der_Bewirtung');
      ortField.setText(data.restaurantAnschrift || '');

      // Date
      const datumField = form.getTextField('Datum');
      datumField.setText(new Date(data.datum).toLocaleDateString('de-DE'));

      // Participants
      const teilnehmerField = form.getTextField('Teilnehmer');
      // Combine teilnehmer with geschaeftspartner info for Kundenbewirtung
      let teilnehmerText = data.teilnehmer || '';
      if (data.bewirtungsart === 'kunden' && (data.geschaeftspartnerNamen || data.geschaeftspartnerFirma)) {
        teilnehmerText += `\n${data.geschaeftspartnerNamen || ''} (${data.geschaeftspartnerFirma || ''})`;
      }
      teilnehmerField.setText(teilnehmerText);

      // Anlass (occasion)
      const anlassField = form.getTextField('Anlass');
      anlassField.setText(data.geschaeftlicherAnlass || data.anlass || '');

      // Financial fields
      const gesamtkostenField = form.getTextField('Gesamtkosten');
      gesamtkostenField.setText(`${data.gesamtbetrag || ''}€`);

      const nettoField = form.getTextField('Netto');
      nettoField.setText(`${data.gesamtbetragNetto || ''}€`);

      const mwstField = form.getTextField('MwSt');
      mwstField.setText(`${data.gesamtbetragMwst || ''}€`);

      const trinkgeldField = form.getTextField('Trinkgeld');
      trinkgeldField.setText(`${data.trinkgeld || ''}€`);

      const mwstTrinkgeldField = form.getTextField('MwSt_Trinkgeld');
      mwstTrinkgeldField.setText(`${data.trinkgeldMwst || ''}€`);

      // Zahlungsart (payment method)
      const zahlungsartField = form.getTextField('Zahlungsart');
      const zahlungsartText = data.zahlungsart === 'firma'
        ? 'Firmenkreditkarte'
        : data.zahlungsart === 'privat'
        ? 'Private Kreditkarte'
        : 'Bar';
      zahlungsartField.setText(zahlungsartText);

      // Signature fields (leave empty for manual signing)
      // unterschriftField and ortDatumField are left blank

      console.log('All form fields filled successfully');

    } catch (formError) {
      console.error('Error filling form fields:', formError);
      throw new Error('Fehler beim Ausfüllen der PDF-Formularfelder: ' + (formError instanceof Error ? formError.message : 'Unbekannter Fehler'));
    }

    // Flatten the form to make fields non-editable (optional - preserves professional design)
    form.flatten();
    console.log('Form fields flattened (non-editable)');

    // Handle attachments - prioritize new attachments array over legacy single image
    const attachmentsToAdd: Array<{ data: string; name: string; type: string }> = [];

    // Check for new attachments array first
    if (data.attachments && Array.isArray(data.attachments) && data.attachments.length > 0) {
      console.log(`Found ${data.attachments.length} attachments in request`);
      attachmentsToAdd.push(...data.attachments);
    }
    // Fall back to legacy single image only if no attachments array
    else if (data.image) {
      attachmentsToAdd.push({
        data: data.image,
        name: 'Original-Rechnung',
        type: 'image/jpeg'
      });
    }

    // Add all attachments using pdf-lib
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

          // Handle PDF attachments by converting them to images
          if (attachment.type === 'application/pdf') {
            console.log(`Converting PDF attachment: ${attachment.name}`);

            // Extract PDF data from base64
            const base64Data = attachment.data.split(',')[1];
            const pdfBuffer = Buffer.from(base64Data, 'base64');

            // Convert all pages of PDF to images
            const convertedPages = await convertPdfToImagesAllPages(pdfBuffer, attachment.name);
            console.log(`PDF has ${convertedPages.length} page(s)`);

            // Add each page as a separate page with image
            for (const page of convertedPages) {
              // Add new page
              const newPage = pdfDoc.addPage();
              const { width, height } = newPage.getSize();

              // Embed image
              const imageBytes = Buffer.from(page.data.split(',')[1], 'base64');
              const embeddedImage = await pdfDoc.embedJpg(imageBytes);
              const imageDims = embeddedImage.scale(1);

              // Calculate proportional scaling
              const maxWidth = width - 80; // Margins
              const maxHeight = height - 80; // Leave space for header
              const scaleX = maxWidth / imageDims.width;
              const scaleY = maxHeight / imageDims.height;
              const scale = Math.min(scaleX, scaleY);

              const scaledWidth = imageDims.width * scale;
              const scaledHeight = imageDims.height * scale;

              // Draw image on page
              newPage.drawImage(embeddedImage, {
                x: 40,
                y: height - scaledHeight - 60,
                width: scaledWidth,
                height: scaledHeight,
              });

              console.log(`Page ${page.pageNumber} added successfully`);
            }

          } else {
            // Handle regular images (JPEG/PNG)
            console.log(`Processing regular image: ${attachment.name}`);

            // Add new page
            const newPage = pdfDoc.addPage();
            const { width, height } = newPage.getSize();

            // Embed image based on type
            const imageBytes = Buffer.from(attachment.data.split(',')[1], 'base64');
            let embeddedImage;

            if (attachment.type === 'image/png') {
              embeddedImage = await pdfDoc.embedPng(imageBytes);
            } else {
              embeddedImage = await pdfDoc.embedJpg(imageBytes);
            }

            const imageDims = embeddedImage.scale(1);

            // Calculate proportional scaling
            const maxWidth = width - 80; // Margins
            const maxHeight = height - 80; // Leave space for header
            const scaleX = maxWidth / imageDims.width;
            const scaleY = maxHeight / imageDims.height;
            const scale = Math.min(scaleX, scaleY);

            const scaledWidth = imageDims.width * scale;
            const scaledHeight = imageDims.height * scale;

            console.log(`Scaled dimensions (preserving aspect ratio): ${scaledWidth.toFixed(1)}x${scaledHeight.toFixed(1)}`);

            // Draw image on page
            newPage.drawImage(embeddedImage, {
              x: 40,
              y: height - scaledHeight - 60,
              width: scaledWidth,
              height: scaledHeight,
            });

            console.log(`Attachment ${i + 1} added successfully`);
          }

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

    // Convert PDF to buffer using pdf-lib
    console.log('Converting PDF to buffer...');
    const pdfBuffer = await pdfDoc.save();
    console.log('PDF generated successfully, size:', pdfBuffer.byteLength);

    // Check if ZUGFeRD generation is requested
    if (data.generateZugferd === true) {
      console.log('Generating ZUGFeRD-compliant PDF...');
      
      try {
        // Convert ArrayBuffer to Base64
        const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
        
        // Create ZUGFeRD invoice data from form data
        const invoiceData = ZugferdService.createInvoiceDataFromBewirtungsbeleg(data);
        
        // Generate ZUGFeRD PDF
        const zugferdResult = await ZugferdService.generateZugferdPdf({
          pdfBase64,
          invoiceData,
          format: 'BASIC'
        });
        
        if (zugferdResult.success && zugferdResult.pdfBase64) {
          console.log('ZUGFeRD PDF generated successfully');
          // Return the ZUGFeRD-compliant PDF
          const zugferdBuffer = Buffer.from(zugferdResult.pdfBase64, 'base64');
          
          return new NextResponse(zugferdBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename=bewirtungsbeleg-zugferd-${new Date(data.datum).toISOString().split('T')[0]}.pdf`,
              'X-ZUGFeRD': 'true',
              'X-ZUGFeRD-Profile': 'BASIC'
            },
          });
        } else {
          console.error('ZUGFeRD generation failed:', zugferdResult.error);
          // Fall back to regular PDF
        }
      } catch (zugferdError) {
        console.error('ZUGFeRD generation error:', zugferdError);
        // Fall back to regular PDF
      }
    }

    // Return regular PDF
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