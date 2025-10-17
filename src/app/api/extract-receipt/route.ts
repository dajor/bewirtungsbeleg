import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env } from '@/lib/env';
// import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/rate-limit'; // Temporarily disabled
import { fileValidation, extractReceiptResponseSchema, sanitizeObject } from '@/lib/validation';
import { sanitizeFilename } from '@/lib/sanitize';
import { isPdfFile } from '@/lib/pdf-to-image';
import { checkOpenAIKey } from '@/lib/check-openai';

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

const prompt = `Analysiere den Rechnungsbeleg und extrahiere die folgenden Informationen:
- Name des Restaurants/Geschäfts
- Anschrift des Restaurants
- Datum der Rechnung (im Format DD.MM.YYYY)
- Gesamtbetrag (Brutto/Total)
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
- GESAMTBETRAG: Suche nach "Total", "Gesamtbetrag", "Summe", "Brutto", "Endsumme", "Zahlung", "Betrag", "Amount", "Pay"
  * Die Beträge können an BELIEBIGEN Positionen im Dokument stehen
  * Scanne das GESAMTE Dokument nach allen Zahlenbeträgen im Format XX,XX oder XX.XX
  * Der Gesamtbetrag ist meist der GRÖSSTE Betrag auf der Rechnung
- MWST: Suche nach "MwSt", "MwSt.", "USt", "Steuer", "Tax", "Steuersumme", "Verkäufe XX% inkl", "VAT"
  * Bei "Verkäufe 19% inkl. XX,XX €" ist der Betrag der MwSt-Anteil (berechne 19% vom Gesamtbetrag)
  * Die MwSt. kann ÜBERALL im Dokument stehen, nicht nur in bestimmten Bereichen
- NETTO: Suche nach "Netto", "Nettoumsatz", "Nettobetrag", "Net", "Subtotal"
  * Der Nettobetrag kann ÜBERALL im Dokument stehen
- FLEXIBILITÄT:
  * Achte auf verschiedene Schreibweisen und Sprachen (DE/EN/FR/IT)
  * Beträge können in verschiedenen Bereichen des Dokuments verteilt sein
  * Ignoriere die Position - finde die Felder anhand ihrer Beschriftung
- Wenn MwSt. oder Netto nicht gefunden werden, lass diese Felder leer
- Verwende Komma als Dezimaltrennzeichen (z.B. "51,90" statt "51.90")
- Wenn nur zwei der drei Beträge (Brutto, MwSt., Netto) gefunden werden, lass das dritte Feld leer
- Formatiere alle Beträge mit zwei Dezimalstellen
- Ignoriere € Zeichen und andere Währungssymbole
- Bei mehreren Beträgen: Der größte Betrag ist normalerweise der Gesamtbetrag`;

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
      extractionPrompt = `Dies ist ein Kreditkartenbeleg (NICHT eine Rechnung). Extrahiere:
      - restaurantName: Name des Händlers/Restaurants
      - datum: Transaktionsdatum (Format: DD.MM.YYYY)
      - kreditkartenbetrag: Der BEZAHLTE Betrag auf der Kreditkarte
        * Suche nach: "Betrag", "Zahlung", "Total", "Gesamt", "Amount", "Paid"
        * Dies ist der HAUPTBETRAG auf dem Kreditkartenbeleg
        * Oft der GRÖSSTE oder EINZIGE Betrag auf dem Beleg

      WICHTIG:
      - Ein reiner Kreditkartenbeleg zeigt NUR den bezahlten Betrag (kreditkartenbetrag)
      - SETZE gesamtbetrag NICHT - das ist NUR für Rechnungen
      - Falls das Dokument BEIDE Beträge zeigt (Rechnung + Kreditkarte), dann ist es KEIN reiner Kreditkartenbeleg
      - Der Betrag auf einem Kreditkartenbeleg ist der Gesamtbetrag INKL. Trinkgeld
      - Trinkgeld separat: Falls "Trinkgeld", "Tip", "Gratuity" sichtbar, extrahiere es

      BEISPIEL:
      Kreditkartenbeleg mit "Betrag: 105,00€" → kreditkartenbetrag: "105,00"
      (NICHT gesamtbetrag setzen!)

      Antworte NUR mit einem JSON-Objekt.`;
    } else if (classificationType === 'Rechnung') {
      extractionPrompt = `Dies ist eine Restaurantrechnung. Extrahiere:
      - restaurantName, restaurantAnschrift, datum (DD.MM.YYYY)
      - gesamtbetrag: "Total", "Summe", "Gesamtbetrag", "Endsumme"
      - mwst: "MwSt", "Steuer", "Steuersumme", "Verkäufe XX% inkl"
      - netto: "Netto", "Nettoumsatz", "Nettobetrag"
      - trinkgeld: Falls separat aufgeführt

      WICHTIG: Bei deutschen Kassenbons/Rechnungen:
      - "Total" oder "Gesamtbetrag" → gesamtbetrag
      - "Nettoumsatz" → netto
      - "MwSt XX%" oder "Verkäufe XX% inkl" → mwst
      - "Steuersumme" → mwst

      Wenn zwei Beträge sichtbar sind (z.B. 95,30€ Rechnung und 100,00€ bezahlt):
      - Der kleinere Betrag ist der Rechnungsbetrag (gesamtbetrag)
      - Der größere Betrag ist der gezahlte Betrag
      - Die Differenz ist das Trinkgeld (trinkgeld)

      Antworte NUR mit einem JSON-Objekt.`;
    } else if (classificationType === 'Rechnung&Kreditkartenbeleg') {
      extractionPrompt = `Dies ist ein kombiniertes Dokument mit SOWOHL Rechnung ALS AUCH Kreditkartenbeleg auf derselben Seite.

      KRITISCHE ANWEISUNG - Du MUSST BEIDE Beträge extrahieren:

      1. KREDITKARTENBELEG (oft LINKS oder OBEN):
         - kreditkartenbetrag: Der BEZAHLTE Betrag inkl. Trinkgeld
         - Suche nach: "SUMME", "Betrag", "TOTAL", "Zahlung", "EUR:", "€"
         - Dies ist normalerweise der GRÖSSERE Betrag
         - BEISPIEL: "SUMME EUR: 45,00" → kreditkartenbetrag: "45,00"

      2. RECHNUNG (oft RECHTS oder UNTEN):
         - gesamtbetrag: Der Rechnungsbetrag (ohne Trinkgeld)
         - Suche nach: "EC-Cash-Total", "Total", "Zwischensumme", "Gesamtbetrag"
         - Dies ist normalerweise der KLEINERE Betrag
         - BEISPIEL: "EC-Cash-Total *38,90" → gesamtbetrag: "38,90"

      ZUSÄTZLICHE INFORMATIONEN:
      - restaurantName, restaurantAnschrift, datum (DD.MM.YYYY)
      - mwst, netto (falls verfügbar)
      - trinkgeld: Wird automatisch berechnet als (kreditkartenbetrag - gesamtbetrag)

      WICHTIG:
      - Scanne das GESAMTE Bild nach ZWEI verschiedenen Bereichen
      - Links/Oben ist oft der Kreditkartenbeleg, Rechts/Unten die Rechnung
      - Du MUSST beide Beträge finden - ein Fehlen ist ein Extraktionsfehler
      - Der kreditkartenbetrag ist IMMER >= gesamtbetrag
      - Wenn du nur einen Betrag findest, suche nochmal nach einem zweiten!

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
    console.log('=== OpenAI RAW Response ===');
    console.log('Classification Type:', classificationType);
    console.log('Response:', result);

    try {
      const parsedResult = JSON.parse(result || '{}');
      console.log('=== Parsed JSON ===');
      console.log(JSON.stringify(parsedResult, null, 2));

      // Validate and sanitize the response
      const validatedResult = extractReceiptResponseSchema.parse(parsedResult);
      console.log('=== Validated Result ===');
      console.log(JSON.stringify(validatedResult, null, 2));

      const sanitizedResult = sanitizeObject(validatedResult);
      console.log('=== Sanitized Result ===');
      console.log(JSON.stringify(sanitizedResult, null, 2));
      
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