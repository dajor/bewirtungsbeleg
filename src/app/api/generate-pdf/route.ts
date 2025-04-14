import { NextResponse } from 'next/server';
import { generatePdf } from '@/lib/pdfGenerator';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import sizeOf from 'image-size';
import {degrees, rgb} from 'pdf-lib'

export async function POST(request: Request) {
  if (request.method !== 'POST') {
    console.log(`Invalid method: ${request.method}`);
    return new Response(
      JSON.stringify({ error: `Method ${request.method} Not Allowed` }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('PDF generation API called');
    
    let requestData;
    try {
      const body = await request.text();
      console.log('Raw request body:', body);
      requestData = JSON.parse(body);
      console.log('Parsed request data:', requestData);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Ungültige JSON-Daten',
          details: error instanceof Error ? error.message : 'Unbekannter Fehler',
          fields: {} 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!requestData || !requestData.jsonData) {
      console.log('Missing JSON data:', requestData);
      return new Response(
        JSON.stringify({ 
          error: 'Fehlende JSON-Daten',
          fields: {} 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { bewirtungsart } = requestData.jsonData;

    if (!bewirtungsart) {
      console.log('Missing bewirtungsart:', requestData.jsonData);
      return new Response(
        JSON.stringify({ 
          error: 'Hauptbeleg fehlt',
          files: {} 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const templatePath = path.join(process.cwd(), 'public', 
        bewirtungsart === 'kunden' ? 'kundenbewirtung.pdf' : 'mitarbeiterbewirtung.pdf'
      );
      
      console.log('Loading template from', templatePath);

      // Überprüfe, ob die Vorlage existiert
      try {
        await fs.access(templatePath);
      } catch (error) {
        console.error('Template file not found:', templatePath);
        return new Response(
          JSON.stringify({ 
            error: 'PDF-Vorlage nicht gefunden',
            details: `Vorlage ${templatePath} existiert nicht`
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const pdfBytes = await fs.readFile(templatePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Überprüfe die verfügbaren Formularfelder
      const fields = form.getFields();
      console.log('\nAvailable form fields:');
      fields.forEach(field => {
        console.log(`- ${field.getName()}`);
      });

      // Formularfelder ausfüllen
      try {
        console.log('Filling form fields with data:', requestData.jsonData);
        
        // Versuche, die Felder mit verschiedenen Namensvarianten zu füllen
        const fieldMappings = {
          // Allgemeine Angaben
          'datum': ['datum', 'Datum', 'date', 'Date'],
          'restaurantName': ['restaurantName', 'RestaurantName', 'restaurant', 'Restaurant'],
          'restaurantAnschrift': ['restaurantAnschrift', 'RestaurantAnschrift', 'address', 'Address'],
          'teilnehmer': ['teilnehmer', 'Teilnehmer', 'participants', 'Participants'],
          'anlass': ['anlass', 'Anlass', 'occasion', 'Occasion'],
          
          // Finanzielle Details
          'gesamtbetrag': ['gesamtbetrag', 'Gesamtbetrag', 'total', 'Total'],
          'gesamtbetragMwst': ['gesamtbetragMwst', 'GesamtbetragMwst', 'vat', 'VAT'],
          'gesamtbetragNetto': ['gesamtbetragNetto', 'GesamtbetragNetto', 'net', 'Net'],
          'trinkgeld': ['trinkgeld', 'Trinkgeld', 'tip', 'Tip'],
          'trinkgeldMwst': ['trinkgeldMwst', 'TrinkgeldMwst', 'tipVat', 'TipVAT'],
          'kreditkartenBetrag': ['kreditkartenBetrag', 'KreditkartenBetrag', 'creditCard', 'CreditCard'],
          
          // Geschäftlicher Anlass
          'geschaeftlicherAnlass': ['geschaeftlicherAnlass', 'GeschaeftlicherAnlass', 'businessOccasion', 'BusinessOccasion'],
          'geschaeftspartnerNamen': ['geschaeftspartnerNamen', 'GeschaeftspartnerNamen', 'businessPartner', 'BusinessPartner'],
          'geschaeftspartnerFirma': ['geschaeftspartnerFirma', 'GeschaeftspartnerFirma', 'company', 'Company'],
          
          // Zusätzliche Felder
          'zahlungsart': ['zahlungsart', 'Zahlungsart', 'paymentMethod', 'PaymentMethod'],
          'bewirtungsart': ['bewirtungsart', 'Bewirtungsart', 'entertainmentType', 'EntertainmentType'],
          'istAuslaendischeRechnung': ['istAuslaendischeRechnung', 'IstAuslaendischeRechnung', 'foreignInvoice', 'ForeignInvoice'],
          'auslaendischeWaehrung': ['auslaendischeWaehrung', 'AuslaendischeWaehrung', 'foreignCurrency', 'ForeignCurrency']
        };

        for (const [key, variants] of Object.entries(fieldMappings)) {
          let fieldFound = false;
          for (const variant of variants) {
            try {
              const field = form.getTextField(variant);
              if (field) {
                field.setText(requestData.jsonData[key] || '');
                console.log(`Successfully set field ${variant} with value:`, requestData.jsonData[key]);
                fieldFound = true;
                break;
              }
            } catch (error) {
              // Ignoriere Fehler und versuche die nächste Variante
            }
          }
          if (!fieldFound) {
            console.warn(`Could not find field for key ${key} with variants:`, variants);
          }
        }
        
        console.log('Form fields filled successfully');
      } catch (error) {
        console.error('Error filling form fields:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Fehler beim Ausfüllen des Formulars',
            details: error instanceof Error ? error.message : 'Unbekannter Fehler',
            field: error instanceof Error ? error.message.split(' ').pop() : 'Unbekannt'
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Formularfelder fixieren
      form.flatten();

      console.log('Converting PDF to buffer...');
      const modifiedPdfBytes = await pdfDoc.save();
      console.log('PDF generated successfully, size:', modifiedPdfBytes.length);

      return new Response(modifiedPdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="bewirtungsbeleg.pdf"`,
          'Last-Modified': new Date().toUTCString(),
        },
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Fehler bei der PDF-Verarbeitung',
          details: error instanceof Error ? error.message : 'Unbekannter Fehler'
        }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error in PDF generation:', error);
    
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({ 
          error: 'Ungültige JSON-Daten',
          details: error.message,
          fields: {} 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Interner Serverfehler',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 