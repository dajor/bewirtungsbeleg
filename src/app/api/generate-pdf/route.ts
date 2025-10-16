import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generatePdfSchema, sanitizeObject, parseGermanDecimal } from '@/lib/validation';
import { sanitizeFilename } from '@/lib/sanitize';
import { convertPdfToImagesAllPages } from '@/lib/pdf-to-image-multipage';
import { ZugferdService } from '@/lib/zugferd-service';
import { z } from 'zod';
import autoTable from 'jspdf-autotable';

// Design System Constants
const COLORS = {
  primary: '#1A4E80',      // DocBits blue
  primaryLight: '#E8F0F7', // Light blue for section backgrounds
  textDark: '#2C3E50',     // Dark gray for headings
  textMedium: '#5A6C7D',   // Medium gray for body text
  textLight: '#8B9DAF',    // Light gray for labels
  border: '#D5DCE3',       // Border color
  white: '#FFFFFF',
  success: '#28A745',      // Green for positive amounts
};

const FONTS = {
  heading: { size: 14, style: 'bold' as const },
  subheading: { size: 12, style: 'bold' as const },
  body: { size: 10, style: 'normal' as const },
  small: { size: 9, style: 'normal' as const },
  label: { size: 9, style: 'bold' as const },
};

const SPACING = {
  margin: 20,
  sectionGap: 6,  // Reduced from 8 to 6 for tighter layout
  lineHeight: 5,  // Reduced from 6 to 5 for tighter layout
  indent: 10,
};

// Helper function to convert hex color to RGB array
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

// Helper: Add section header with colored background
function addSectionHeader(doc: any, title: string, yPos: number): number {
  const [r, g, b] = hexToRgb(COLORS.primaryLight);

  // Background rectangle
  doc.setFillColor(r, g, b);
  doc.rect(SPACING.margin, yPos - 6, 170, 8, 'F');

  // Section title
  doc.setFontSize(FONTS.subheading.size);
  doc.setFont('helvetica', FONTS.subheading.style);
  const [tr, tg, tb] = hexToRgb(COLORS.textDark);
  doc.setTextColor(tr, tg, tb);

  // Use a simple bullet point instead of emoji
  doc.text(`> ${title}`, SPACING.margin + 3, yPos);

  // Reset text color
  doc.setTextColor(0, 0, 0);

  return yPos + SPACING.sectionGap;
}

// Helper: Add label-value pair
function addLabelValuePair(doc: any, label: string, value: string, x: number, y: number, valueColor?: string): void {
  doc.setFontSize(FONTS.body.size);

  // Label
  doc.setFont('helvetica', FONTS.label.style);
  const [lr, lg, lb] = hexToRgb(COLORS.textLight);
  doc.setTextColor(lr, lg, lb);
  doc.text(label, x, y);

  // Value
  doc.setFont('helvetica', FONTS.body.style);
  if (valueColor) {
    const [vr, vg, vb] = hexToRgb(valueColor);
    doc.setTextColor(vr, vg, vb);
  } else {
    const [vr, vg, vb] = hexToRgb(COLORS.textMedium);
    doc.setTextColor(vr, vg, vb);
  }
  doc.text(value, x + 50, y);

  // Reset
  doc.setTextColor(0, 0, 0);
}

// Helper: Add summary box (top-right)
function addSummaryBox(doc: any, data: any, x: number, y: number): void {
  const boxWidth = 60;
  const boxHeight = 35;

  // Border
  const [br, bg, bb] = hexToRgb(COLORS.border);
  doc.setDrawColor(br, bg, bb);
  doc.setLineWidth(0.5);
  doc.rect(x, y, boxWidth, boxHeight);

  // Background for header
  const [hr, hg, hb] = hexToRgb(COLORS.primary);
  doc.setFillColor(hr, hg, hb);
  doc.rect(x, y, boxWidth, 8, 'F');

  // Header text
  doc.setFontSize(FONTS.label.size);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Zusammenfassung', x + boxWidth / 2, y + 5, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Content
  let contentY = y + 13;
  doc.setFontSize(FONTS.small.size);
  doc.setFont('helvetica', 'normal');

  // Gesamtbetrag
  doc.setFont('helvetica', 'bold');
  const [tr, tg, tb] = hexToRgb(COLORS.textMedium);
  doc.setTextColor(tr, tg, tb);
  doc.text('Gesamtbetrag:', x + 3, contentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONTS.body.size);
  const [sr, sg, sb] = hexToRgb(COLORS.primary);
  doc.setTextColor(sr, sg, sb);
  doc.text(`${data.gesamtbetrag} €`, x + boxWidth - 3, contentY, { align: 'right' });

  contentY += 6;

  // Datum
  doc.setFontSize(FONTS.small.size);
  const [dr, dg, db] = hexToRgb(COLORS.textLight);
  doc.setTextColor(dr, dg, db);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(data.datum).toLocaleDateString('de-DE'), x + 3, contentY);

  contentY += 5;

  // Zahlungsart
  const zahlungsart = data.zahlungsart === 'Bargeld' ? 'Bargeld' : 'Kreditkarte';
  doc.text(zahlungsart, x + 3, contentY);

  contentY += 5;

  // Bewirtungsart
  const bewirtungsart = data.bewirtungsart === 'kunden' ? 'Kunden (70%)' : 'Mitarbeiter (100%)';
  doc.text(bewirtungsart, x + 3, contentY);

  // Reset
  doc.setTextColor(0, 0, 0);
}

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

    // ========================================
    // PROFESSIONAL HEADER WITH BLUE BRANDING BAR
    // ========================================

    // Blue header bar (full width)
    const [hr, hg, hb] = hexToRgb(COLORS.primary);
    doc.setFillColor(hr, hg, hb);
    doc.rect(0, 0, 210, 25, 'F'); // Full width (A4 = 210mm)

    // Logo in header bar (white background circle for contrast)
    try {
      const logoPath = path.join(process.cwd(), 'public', 'LOGO-192.png');
      console.log('Loading logo from:', logoPath);
      const logoBuffer = fs.readFileSync(logoPath);
      const base64Logo = logoBuffer.toString('base64');

      // White circle background for logo
      doc.setFillColor(255, 255, 255);
      doc.circle(30, 12.5, 9, 'F');

      // Logo
      doc.addImage(`data:image/png;base64,${base64Logo}`, 'PNG', 23, 6, 14, 14);
      console.log('Logo added successfully');
    } catch (logoError) {
      console.error('Error adding logo:', logoError);
      // Continue without logo
    }

    // Main title in header bar
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const mainTitle = data.istEigenbeleg ? 'Bewirtungsbeleg - EIGENBELEG' : 'Bewirtungsbeleg';
    doc.text(mainTitle, 105, 13, { align: 'center' });

    // Subtitle in header bar
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const bewirtungsart = data.bewirtungsart === 'kunden'
      ? 'Kundenbewirtung (70% abzugsfähig)'
      : 'Mitarbeiterbewirtung (100% abzugsfähig)';
    doc.text(bewirtungsart, 105, 19, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Add DocBits branding on the right side of header
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.text('powered by DocBits', 185, 20, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    let yPosition = 30;  // Reduced from 35 to 30
    console.log('Starting to add content to PDF');

    // Eigenbeleg warning banner (if applicable)
    if (data.istEigenbeleg) {
      const [wr, wg, wb] = hexToRgb('#FFF3CD'); // Light yellow warning background
      doc.setFillColor(wr, wg, wb);
      doc.rect(SPACING.margin, yPosition, 170, 8, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const [tr, tg, tb] = hexToRgb('#856404'); // Dark yellow/brown text
      doc.setTextColor(tr, tg, tb);
      doc.text('Hinweis: Vorsteuer (MwSt.) kann bei Eigenbelegen nicht geltend gemacht werden', 105, yPosition + 5, { align: 'center' });
      doc.setTextColor(0, 0, 0);

      yPosition += 10;  // Reduced from 13 to 10
    }

    // Add summary box (top-right)
    addSummaryBox(doc, data, 130, yPosition);
    console.log('Added professional header with branding');
    
    // ========================================
    // SECTION 1: ALLGEMEINE ANGABEN
    // ========================================
    yPosition += 5;  // Reduced from 8 to 5 for tighter layout
    yPosition = addSectionHeader(doc, 'Allgemeine Angaben', yPosition);

    addLabelValuePair(doc, 'Datum:', new Date(data.datum).toLocaleDateString('de-DE'), SPACING.margin, yPosition);
    yPosition += SPACING.lineHeight;

    addLabelValuePair(doc, 'Restaurant:', data.restaurantName, SPACING.margin, yPosition);
    yPosition += SPACING.lineHeight;

    if (data.restaurantAnschrift) {
      addLabelValuePair(doc, 'Anschrift:', data.restaurantAnschrift, SPACING.margin, yPosition);
      yPosition += SPACING.lineHeight;
    }

    console.log('Added general information with professional formatting');

    // ========================================
    // SECTION 2: GESCHÄFTLICHER ANLASS
    // ========================================
    yPosition += 3;  // Reduced from 5 to 3 for tighter layout
    yPosition = addSectionHeader(
      doc,
      data.bewirtungsart === 'kunden' ? 'Geschäftlicher Anlass' : 'Anlass',
      yPosition
    );

    addLabelValuePair(doc, 'Teilnehmer:', data.teilnehmer, SPACING.margin, yPosition);
    yPosition += SPACING.lineHeight;

    addLabelValuePair(doc, 'Anlass:', data.anlass || 'Projektbesprechung', SPACING.margin, yPosition);
    yPosition += SPACING.lineHeight;

    // ========================================
    // SECTION 3: FINANZIELLE DETAILS (PROFESSIONAL TABLE)
    // ========================================
    yPosition += 3;  // Reduced from 5 to 3 for tighter layout
    yPosition = addSectionHeader(doc, 'Finanzielle Details', yPosition);

    const [borderR, borderG, borderB] = hexToRgb(COLORS.border);
    const [primaryR, primaryG, primaryB] = hexToRgb(COLORS.primary);
    const [lightBgR, lightBgG, lightBgB] = hexToRgb(COLORS.primaryLight);

    if (data.istAuslaendischeRechnung) {
      // Foreign currency table
      const foreignTableData = [
        ['Gesamtbetrag (Brutto)', `${data.gesamtbetrag}${data.auslaendischeWaehrung || '$'}`],
        ['Trinkgeld', `${data.trinkgeld}${data.auslaendischeWaehrung || '$'}`],
        ['Betrag auf Kreditkarte/Bar', `${data.kreditkartenBetrag}€`],
        ['Zahlungsart', data.zahlungsart === 'firma' ? 'Firmenkreditkarte' : data.zahlungsart === 'privat' ? 'Private Kreditkarte' : 'Bar'],
      ];

      if (data.auslaendischeWaehrung) {
        foreignTableData.push(['Währung', data.auslaendischeWaehrung]);
      }

      const [textLightR, textLightG, textLightB] = hexToRgb(COLORS.textLight);

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: foreignTableData,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 4,
          lineColor: [borderR, borderG, borderB],
          lineWidth: 0.5,
        },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [textLightR, textLightG, textLightB], cellWidth: 100 },
          1: { halign: 'right', textColor: [primaryR, primaryG, primaryB], fontStyle: 'bold' },
        },
        margin: { left: SPACING.margin, right: SPACING.margin },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 5;
    } else {
      // Domestic currency table with sections
      const invoiceSection = [
        ['Gesamtbetrag (Brutto)', `${data.gesamtbetrag}€`],
        ['MwSt. Gesamtbetrag', `${data.gesamtbetragMwst}€`],
        ['Netto Gesamtbetrag', `${data.gesamtbetragNetto}€`],
      ];

      const tipSection = [
        ['Betrag auf Kreditkarte/Bar', `${data.kreditkartenBetrag}€`],
        ['Trinkgeld', `${data.trinkgeld}€`],
        ['MwSt. Trinkgeld', `${data.trinkgeldMwst}€`],
        ['Zahlungsart', data.zahlungsart === 'firma' ? 'Firmenkreditkarte' : data.zahlungsart === 'privat' ? 'Private Kreditkarte' : 'Bar'],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Beschreibung', 'Betrag']],
        body: [...invoiceSection, ...tipSection],
        theme: 'striped',
        headStyles: {
          fillColor: [primaryR, primaryG, primaryB],
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: 'bold',
          halign: 'left',
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
          lineColor: [borderR, borderG, borderB],
          lineWidth: 0.5,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 100 },
          1: { halign: 'right', textColor: [primaryR, primaryG, primaryB], fontStyle: 'bold' },
        },
        margin: { left: SPACING.margin, right: SPACING.margin },
        didParseCell: (data: any) => {
          // Add separator line after invoice section (row 2)
          if (data.row.index === 2 && data.section === 'body') {
            data.cell.styles.lineWidth = { bottom: 1.5 };
            data.cell.styles.lineColor = [primaryR, primaryG, primaryB];
          }
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 5;
    }

    // ========================================
    // SECTION 4: GESCHÄFTSPARTNER (nur bei Kundenbewirtung)
    // ========================================
    if (data.bewirtungsart === 'kunden') {
      yPosition += 3;  // Reduced from 5 to 3 for tighter layout
      yPosition = addSectionHeader(doc, 'Geschäftspartner', yPosition);

      addLabelValuePair(doc, 'Namen:', data.geschaeftspartnerNamen, SPACING.margin, yPosition);
      yPosition += SPACING.lineHeight;

      addLabelValuePair(doc, 'Firma:', data.geschaeftspartnerFirma, SPACING.margin, yPosition);
      yPosition += SPACING.lineHeight;
    }

    // Ensure we have enough space for signature (check if we need a new page)
    if (yPosition > 250) {  // Increased threshold from 240 to 250 for tighter layout
      doc.addPage();
      yPosition = 20;
    }

    // ========================================
    // SECTION 5: UNTERSCHRIFT
    // ========================================
    yPosition += 5;  // Reduced from 8 to 5 for tighter layout
    yPosition = addSectionHeader(doc, 'Unterschrift', yPosition);

    // Signature box with border
    const [sigBorderR, sigBorderG, sigBorderB] = hexToRgb(COLORS.border);
    doc.setDrawColor(sigBorderR, sigBorderG, sigBorderB);
    doc.setLineWidth(0.5);
    doc.rect(SPACING.margin, yPosition, 100, 14);  // Reduced height from 16 to 14 for tighter layout

    // Signature line inside box
    doc.setLineWidth(0.3);
    const [primaryR2, primaryG2, primaryB2] = hexToRgb(COLORS.primary);
    doc.setDrawColor(primaryR2, primaryG2, primaryB2);
    doc.line(SPACING.margin + 5, yPosition + 12, SPACING.margin + 95, yPosition + 12);  // Adjusted

    // Label below signature line
    doc.setFontSize(7);  // Reduced from 8 to 7
    doc.setFont('helvetica', 'normal');
    const [textLightR, textLightG, textLightB] = hexToRgb(COLORS.textLight);
    doc.setTextColor(textLightR, textLightG, textLightB);
    doc.text('Unterschrift des Bewirtenden', SPACING.margin + 50, yPosition + 14, { align: 'center' });  // Adjusted
    doc.setTextColor(0, 0, 0);

    yPosition += 15;  // Reduced from 20 to 15 for tighter layout

    // Important notice
    doc.setFontSize(7);  // Reduced from 8 to 7
    doc.setFont('helvetica', 'italic');
    const [noticeR, noticeG, noticeB] = hexToRgb(COLORS.textLight);
    doc.setTextColor(noticeR, noticeG, noticeB);
    doc.text('Dieser Bewirtungsbeleg wurde automatisch erstellt und muss unterschrieben werden.', 20, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 3;  // Reduced from 5 to 3

    // Professional footer on every page
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Footer separator line
      const [footerLineR, footerLineG, footerLineB] = hexToRgb(COLORS.border);
      doc.setDrawColor(footerLineR, footerLineG, footerLineB);
      doc.setLineWidth(0.5);
      doc.line(SPACING.margin, 280, 190, 280);

      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const [footerTextR, footerTextG, footerTextB] = hexToRgb(COLORS.textLight);
      doc.setTextColor(footerTextR, footerTextG, footerTextB);
      doc.text('Bewirtungsbeleg App · powered by DocBits', 105, 285, { align: 'center' });

      // Footer link
      const [linkR, linkG, linkB] = hexToRgb(COLORS.primary);
      doc.setTextColor(linkR, linkG, linkB);
      doc.text('https://bewirtungsbeleg.docbits.com/', 105, 290, { align: 'center' });

      // Page number
      doc.setTextColor(footerTextR, footerTextG, footerTextB);
      doc.text(`Seite ${i} von ${pageCount}`, 190, 290, { align: 'right' });

      // Reset
      doc.setTextColor(0, 0, 0);
    }
    console.log('Added professional footer to all pages');

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
            
            // Convert all pages of PDF to images
            const convertedPages = await convertPdfToImagesAllPages(pdfBuffer, attachment.name);
            console.log(`PDF has ${convertedPages.length} page(s)`);
            
            // Add each page as a separate attachment
            for (const page of convertedPages) {
              doc.addPage();

              // Professional attachment header
              const [attachHeaderR, attachHeaderG, attachHeaderB] = hexToRgb(COLORS.primaryLight);
              doc.setFillColor(attachHeaderR, attachHeaderG, attachHeaderB);
              doc.rect(SPACING.margin, 10, 170, 12, 'F');

              doc.setFontSize(12);
              doc.setFont('helvetica', 'bold');
              const [attachTextR, attachTextG, attachTextB] = hexToRgb(COLORS.textDark);
              doc.setTextColor(attachTextR, attachTextG, attachTextB);
              doc.text(`Anlage ${i + 1}: ${page.name}`, SPACING.margin + 3, 17);
              doc.setTextColor(0, 0, 0);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(10);
              
              // Calculate proportional scaling to preserve aspect ratio
              const maxWidth = 170; // A4 width (210mm - 40mm margins)
              const maxHeight = 240; // Leave space for header text
              
              // Get image dimensions from base64 data
              const base64Buffer = Buffer.from(page.data.split(',')[1], 'base64');
              const sizeOf = await import('image-size');
              const dimensions = sizeOf.default(base64Buffer);
              
              if (!dimensions.width || !dimensions.height) {
                throw new Error('Could not determine image dimensions');
              }
              
              const originalWidth = dimensions.width;
              const originalHeight = dimensions.height;
              
              console.log(`Page ${page.pageNumber} - Original dimensions: ${originalWidth}x${originalHeight}`);
              
              // Calculate scale to fit within max dimensions while preserving aspect ratio
              const scaleX = maxWidth / originalWidth;
              const scaleY = maxHeight / originalHeight;
              const scale = Math.min(scaleX, scaleY); // Use smaller scale to fit within bounds
              
              const scaledWidth = originalWidth * scale;
              const scaledHeight = originalHeight * scale;
              
              console.log(`Page ${page.pageNumber} - Scaled dimensions: ${scaledWidth.toFixed(1)}x${scaledHeight.toFixed(1)}`);
              
              // Add the image to the PDF
              const x = 20;
              const y = 30;
              
              doc.addImage(page.data, 'JPEG', x, y, scaledWidth, scaledHeight);
              console.log(`Page ${page.pageNumber} added successfully`);
              
              // Increment attachment counter for next page
              if (page.pageNumber < convertedPages.length) {
                i++;
              }
            }
            
            // Skip the normal page addition since we already added all pages
            continue;
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

          // Professional attachment header (consistent with PDF pages)
          const [attachHeaderR, attachHeaderG, attachHeaderB] = hexToRgb(COLORS.primaryLight);
          doc.setFillColor(attachHeaderR, attachHeaderG, attachHeaderB);
          doc.rect(SPACING.margin, 10, 170, 12, 'F');

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          const [attachTextR, attachTextG, attachTextB] = hexToRgb(COLORS.textDark);
          doc.setTextColor(attachTextR, attachTextG, attachTextB);
          doc.text(`Anlage ${i + 1}: ${attachment.name || 'Original-Rechnung'}`, SPACING.margin + 3, 17);
          doc.setTextColor(0, 0, 0);
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