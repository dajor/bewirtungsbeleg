import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env } from '@/lib/env';
// import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/rate-limit'; // Temporarily disabled
import { fileValidation, extractReceiptResponseSchema, sanitizeObject } from '@/lib/validation';
import { sanitizeFilename } from '@/lib/sanitize';
import { convertPdfToImage, isPdfFile } from '@/lib/pdf-to-image';
import { checkOpenAIKey } from '@/lib/check-openai';
import { getLocaleConfig, formatLocalizedNumber } from '@/lib/locale-config';

// Initialize OpenAI client and check key validity on startup
let openai: OpenAI | null = null;
let apiKeyError: string | null = null;
let initializationPromise: Promise<void> | null = null;

// Initialize OpenAI client lazily
async function initializeOpenAI() {
  if (openai || apiKeyError) {
    return; // Already initialized
  }
  
  const keyCheck = await checkOpenAIKey();
  if (!keyCheck.valid) {
    apiKeyError = keyCheck.error || 'OpenAI API-Schlüssel ist ungültig';
    console.error('❌ OpenAI API Fehler:', apiKeyError);
  } else {
    openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
}

// Create initialization promise
initializationPromise = initializeOpenAI();

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

// Build locale-aware system prompt
function buildSystemPrompt(locale: any): string {
  const numberExample = locale.numberFormat.example;
  const decimalSep = locale.numberFormat.decimalSeparator;
  const dateFormat = locale.dateFormat.shortFormat;

  // Build list of VAT terms for this locale
  const vatTerms = locale.receiptTerms.vat.join(', ');
  const totalTerms = locale.receiptTerms.total.join(', ');
  const netTerms = locale.receiptTerms.net.join(', ');
  const dateTerms = locale.receiptTerms.date.join(', ');

  return `Analysiere den Rechnungsbeleg und extrahiere die folgenden Informationen:
- Name des Restaurants
- Anschrift des Restaurants
- Datum der Rechnung (im Format ${dateFormat})
- Gesamtbetrag (Brutto)
- MwSt./Steuer Betrag
- Netto Betrag

WICHTIG - Locale-spezifische Informationen:
- Sprache: ${locale.name}
- Zahlenformat: ${numberExample} (Dezimaltrennzeichen: "${decimalSep}", Tausendertrennzeichen: "${locale.numberFormat.thousandSeparator}")
- Währung: ${locale.currencySymbol}
- Spezielle Zeichen in dieser Sprache: ${locale.specialChars.join(', ')}

Antworte im folgenden JSON-Format:
{
  "restaurantName": "Name des Restaurants",
  "restaurantAnschrift": "Vollständige Anschrift",
  "gesamtbetrag": "Gesamtbetrag im Format ${numberExample}",
  "mwst": "MwSt. Betrag im Format ${numberExample}",
  "netto": "Netto Betrag im Format ${numberExample}",
  "datum": "Datum im Format ${dateFormat}"
}

Wichtige Hinweise:
- Suche nach Begriffen wie: Gesamt (${totalTerms}), MwSt. (${vatTerms}), Netto (${netTerms}), Datum (${dateTerms})
- Verwende "${decimalSep}" als Dezimaltrennzeichen (z.B. "51${decimalSep}90")
- Beachte das Zahlenformat: ${numberExample}
- Wenn MwSt. oder Netto nicht gefunden werden, lass diese Felder leer
- Formatiere alle Beträge mit zwei Dezimalstellen
- Achte auf spezielle Zeichen: ${locale.specialChars.join(', ')}`;
}

export async function POST(request: Request) {
  try {
    // Wait for OpenAI initialization
    if (initializationPromise) {
      await initializationPromise;
    }

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
    const classificationType = formData.get('classificationType') as string | null;

    // Get locale information from classification
    const localeCode = formData.get('locale') as string | null;
    const language = formData.get('language') as string | null;
    const region = formData.get('region') as string | null;

    // Get locale configuration (default to de-DE if not provided)
    const locale = localeCode ? getLocaleConfig(localeCode) : getLocaleConfig('de-DE');

    console.log(`Processing with locale: ${locale.code} (${locale.name})`);

    // Build locale-aware prompt
    const prompt = buildSystemPrompt(locale);

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

    // Customize prompt based on classification
    let extractionPrompt = "Extrahiere diese Informationen aus der Rechnung: restaurantName, restaurantAnschrift, gesamtbetrag, mwst, netto, datum (Format: DD.MM.YYYY) und optional trinkgeld. Gib die Beträge im deutschen Format mit Komma zurück (z.B. '38,60'). Antworte NUR mit einem JSON-Objekt.";
    
    if (classificationType === 'Kreditkartenbeleg') {
      extractionPrompt = `Dies ist ein Kreditkartenbeleg. Extrahiere:
      - restaurantName: Name des Händlers/Restaurants
      - datum: Transaktionsdatum (Format: DD.MM.YYYY)
      - gesamtbetrag: Der Hauptbetrag der Transaktion
      - trinkgeld: Falls separat aufgeführt
      
      WICHTIG: Bei Kreditkartenbelegen ist der Hauptbetrag normalerweise der einzige oder größte Betrag.
      Wenn Trinkgeld separat aufgeführt ist, gib es im Feld "trinkgeld" an.
      Antworte NUR mit einem JSON-Objekt.`;
    } else if (classificationType === 'Rechnung') {
      extractionPrompt = `Dies ist eine Restaurantrechnung. Extrahiere:
      - restaurantName, restaurantAnschrift, datum (DD.MM.YYYY)
      - gesamtbetrag, mwst, netto
      
      WICHTIG: Wenn zwei Beträge zu sehen sind (z.B. 95,30€ und 100,00€):
      - Der kleinere Betrag ist der Rechnungsbetrag (gesamtbetrag)
      - Der größere Betrag ist der gezahlte Betrag
      - Die Differenz ist das Trinkgeld (trinkgeld)
      
      Antworte NUR mit einem JSON-Objekt.`;
    }

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
              text: extractionPrompt
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