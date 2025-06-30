import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env } from '@/lib/env';
// import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/rate-limit'; // Temporarily disabled
import { fileValidation, extractReceiptResponseSchema, sanitizeObject } from '@/lib/validation';
import { sanitizeFilename } from '@/lib/sanitize';
import { convertPdfToImage, isPdfFile } from '@/lib/pdf-to-image';
import { checkOpenAIKey } from '@/lib/check-openai';

// Initialize OpenAI client and check key validity on startup
let openai: OpenAI | null = null;
let apiKeyError: string | null = null;

// Check API key on module load
(async () => {
  const keyCheck = await checkOpenAIKey();
  if (!keyCheck.valid) {
    apiKeyError = keyCheck.error || 'OpenAI API-Schlüssel ist ungültig';
    console.error('❌ OpenAI API Fehler:', apiKeyError);
  } else {
    openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
})();

// Hilfsfunktion zum Konvertieren von Zahlen ins deutsche Format
function convertToGermanNumber(value: string | number): string {
  if (typeof value === 'string') {
    // Entferne alle Währungssymbole und Leerzeichen
    value = value.replace(/[€\s]/g, '');
    // Ersetze Punkt durch Komma, falls es ein Dezimalpunkt ist
    if (value.includes('.')) {
      value = value.replace('.', ',');
    }
    return value;
  }
  // Konvertiere Zahl ins deutsche Format
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

const prompt = `Analysiere den Rechnungsbeleg und extrahiere die folgenden Informationen:
- Name des Restaurants
- Anschrift des Restaurants
- Datum der Rechnung (im Format DD.MM.YYYY)
- Gesamtbetrag (Brutto)
- MwSt. Betrag
- Netto Betrag

Antworte im folgenden JSON-Format:
{
  "restaurantName": "Name des Restaurants",
  "restaurantAnschrift": "Vollständige Anschrift",
  "gesamtbetrag": "Gesamtbetrag mit Komma als Dezimaltrennzeichen",
  "mwst": "MwSt. Betrag mit Komma als Dezimaltrennzeichen",
  "netto": "Netto Betrag mit Komma als Dezimaltrennzeichen",
  "datum": "Datum im Format DD.MM.YYYY"
}

Wichtige Hinweise:
- Suche nach Begriffen wie "Gesamtbetrag", "Brutto", "MwSt.", "Netto"
- Achte auf verschiedene Schreibweisen (z.B. "MwSt.", "MwSt", "USt.")
- Wenn MwSt. oder Netto nicht gefunden werden, lass diese Felder leer
- Verwende Komma als Dezimaltrennzeichen (z.B. "51,90" statt "51.90")
- Wenn nur zwei der drei Beträge (Brutto, MwSt., Netto) gefunden werden, lass das dritte Feld leer
- Formatiere alle Beträge mit zwei Dezimalstellen`;

export async function POST(request: Request) {
  try {
    // Check if OpenAI is initialized
    if (!openai || apiKeyError) {
      return NextResponse.json(
        { 
          error: apiKeyError || 'OpenAI API ist nicht verfügbar.',
          userMessage: '🔑 Die automatische Texterkennung ist derzeit nicht verfügbar. Bitte füllen Sie die Felder manuell aus.',
          details: 'Der Administrator muss einen gültigen OpenAI API-Schlüssel in der .env Datei konfigurieren.'
        },
        { status: 503 }
      );
    }
    
    // Rate limiting temporarily disabled
    // const identifier = getIdentifier(request, undefined);
    // const rateLimitResponse = await checkRateLimit(apiRatelimit.ocr, identifier);
    // if (rateLimitResponse) return rateLimitResponse;
    
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'Kein Bild gefunden' },
        { status: 400 }
      );
    }

    // Validate file
    const fileValidationResult = fileValidation.validate(image);
    if (!fileValidationResult.valid) {
      return NextResponse.json(
        { error: fileValidationResult.error },
        { status: 400 }
      );
    }

    // Sanitize filename for logging
    const safeFilename = sanitizeFilename(image.name);
    
    console.log('Verarbeite Bild:', {
      name: safeFilename,
      type: image.type,
      size: image.size
    });

    // Check if the file is a PDF
    if (await isPdfFile(image)) {
      console.log('PDF erkannt - OCR für PDFs wird nicht unterstützt');
      return NextResponse.json(
        { 
          error: 'PDF-Dateien werden für OCR nicht unterstützt',
          userMessage: '📄 PDF-Dateien können nicht automatisch ausgelesen werden. Bitte laden Sie ein Foto oder Scan der Rechnung hoch (JPG, PNG) oder füllen Sie die Felder manuell aus.',
          skipOCR: true
        },
        { status: 422 }
      );
    }

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const imageType = image.type;
    
    const base64Image = buffer.toString('base64');

    console.log('Sende Anfrage an OpenAI...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extrahiere diese Informationen aus der Rechnung: restaurantName, restaurantAnschrift, gesamtbetrag, mwst, netto, datum (Format: DD.MM.YYYY) und optional trinkgeld. Gib die Beträge im deutschen Format mit Komma zurück (z.B. '38,60'). Antworte NUR mit einem JSON-Objekt."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${imageType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const result = response.choices[0].message.content;
    console.log('OpenAI Antwort erhalten:', result);
    
    try {
      const parsedResult = JSON.parse(result || '{}');
      
      // Validate and sanitize the response
      const validatedResult = extractReceiptResponseSchema.parse(parsedResult);
      const sanitizedResult = sanitizeObject(validatedResult);
      
      // Konvertiere Zahlen ins deutsche Format
      if (sanitizedResult.gesamtbetrag) {
        sanitizedResult.gesamtbetrag = convertToGermanNumber(sanitizedResult.gesamtbetrag);
      }
      if (sanitizedResult.mwst) {
        sanitizedResult.mwst = convertToGermanNumber(sanitizedResult.mwst);
      }
      if (sanitizedResult.netto) {
        sanitizedResult.netto = convertToGermanNumber(sanitizedResult.netto);
      }

      return NextResponse.json(sanitizedResult);
    } catch (e) {
      console.error('Fehler beim Parsen der Daten:', e);
      return NextResponse.json(
        { error: 'Fehler beim Parsen der Daten' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Fehler bei der OCR-Verarbeitung:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { 
            error: 'Ungültiger API-Schlüssel',
            userMessage: '🔑 Die automatische Texterkennung ist nicht verfügbar. Bitte füllen Sie die Felder manuell aus.',
            details: 'Der OpenAI API-Schlüssel ist ungültig oder abgelaufen.'
          },
          { status: 401 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { 
            error: 'API-Limit erreicht',
            userMessage: '⏱️ Die automatische Texterkennung ist momentan überlastet. Bitte versuchen Sie es später erneut oder füllen Sie die Felder manuell aus.'
          },
          { status: 429 }
        );
      }
    }
    
    // Generic error
    return NextResponse.json(
      { 
        error: 'Fehler bei der Verarbeitung',
        userMessage: '❌ Die automatische Texterkennung ist fehlgeschlagen. Bitte füllen Sie die Felder manuell aus.',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
} 