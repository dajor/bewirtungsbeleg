import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env } from '@/lib/env';
import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/rate-limit';
import { classifyReceiptSchema, classifyReceiptResponseSchema, sanitizeObject } from '@/lib/validation';
import { detectLocale, getLocaleConfig } from '@/lib/locale-config';
import { z } from 'zod';

let openai: OpenAI | null = null;

try {
  if (env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.error('Failed to initialize OpenAI:', error);
}

export async function POST(request: Request) {
  try {
    // Check if OpenAI is available
    if (!openai) {
      console.error('OpenAI not initialized - API key may be missing');
      return NextResponse.json(
        { 
          type: 'Rechnung',
          confidence: 0.5,
          reason: 'Klassifizierung nicht verfügbar - Standard: Rechnung'
        },
        { status: 200 } // Return 200 with default to avoid breaking the flow
      );
    }
    // Check rate limit
    const identifier = getIdentifier(request, undefined);
    const rateLimitResponse = await checkRateLimit(apiRatelimit.general, identifier);
    if (rateLimitResponse) return rateLimitResponse;
    
    const body = await request.json();
    
    // Validate input
    let validatedInput;
    try {
      validatedInput = classifyReceiptSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Ungültige Eingabe', details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }
    
    const { fileName, fileType, image } = sanitizeObject(validatedInput);

    // Prepare messages based on whether we have image content
    const messages: any[] = [
      {
        role: "system",
        content: `Du bist ein Experte für die Klassifizierung von Belegen aus verschiedenen Ländern und Sprachen.

        Eine Rechnung enthält typischerweise:
        - Restaurantname und Adresse
        - Datum
        - Positionen mit Preisen
        - Gesamtbetrag
        - Mehrwertsteuer (MwSt./TVA/IVA/VAT)

        Ein Kreditkartenbeleg enthält typischerweise:
        - Kreditkartennummer (teilweise maskiert)
        - Datum und Uhrzeit
        - Betrag
        - Transaktionsnummer
        - Händlername
        - Oft kompakter und schmaler als eine Rechnung

        WICHTIG: Analysiere auch die Sprache und das Herkunftsland des Belegs:
        - Deutsche Belege: Verwenden Begriffe wie "MwSt.", "Gesamt", "Datum", Zahlenformat: 1.234,56
        - Schweizer Belege (DE): Ähnlich zu deutschen Belegen, aber Zahlenformat: 1'234.56, Währung CHF statt EUR
        - Italienische Belege: "IVA", "Totale", "Data", Zahlenformat: 1.234,56
        - Französische Belege: "TVA", "Total", "Date", Zahlenformat: 1 234,56
        - Schweizer Belege (IT/FR): Italienisch/Französisch mit CHF und Zahlenformat 1'234.56

        Achte auf:
        - Sprache des Textes (Deutsch, Italienisch, Französisch, Englisch)
        - Währung (EUR, CHF, USD, GBP)
        - Zahlenformat (Tausender- und Dezimaltrennzeichen)
        - Typische länderspezifische Begriffe

        Analysiere den Beleg und bestimme den Typ UND die Herkunft basierend auf diesen Merkmalen.`
      }
    ];

    if (image) {
      // If we have an image, analyze its content
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Analysiere dieses Dokument und bestimme:
            1. Ob es sich um eine Rechnung oder einen Kreditkartenbeleg handelt
            2. Die Sprache des Dokuments
            3. Das Herkunftsland/Region

            Antworte nur mit einem JSON-Objekt im folgenden Format:
            {
              "type": "Rechnung" | "Kreditkartenbeleg" | "Unbekannt",
              "confidence": 0-1,
              "reason": "Kurze Begründung auf Deutsch",
              "details": {
                "rechnungProbability": 0-1,
                "kreditkartenbelegProbability": 0-1
              },
              "language": "de" | "it" | "fr" | "en",
              "region": "DE" | "CH" | "IT" | "FR" | "GB" | "US",
              "locale": "de-DE" | "de-CH" | "it-IT" | "it-CH" | "fr-FR" | "fr-CH" | "en-GB" | "en-US",
              "detectedLanguages": [
                {
                  "language": "de",
                  "confidence": 0.95
                }
              ]
            }

            Bestimme die Sprache anhand von:
            - Begriffen wie "MwSt." (Deutsch), "IVA" (Italienisch), "TVA" (Französisch), "VAT" (Englisch)
            - Währung: EUR (Deutschland, Italien, Frankreich), CHF (Schweiz), GBP (UK), USD (US)
            - Zahlenformat: 1.234,56 (DE/IT), 1'234.56 (CH), 1 234,56 (FR), 1,234.56 (US/UK)`
          },
          {
            type: "image_url",
            image_url: {
              url: image
            }
          }
        ]
      });
    } else {
      // Fallback to filename analysis
      const prompt = `Analysiere den folgenden Dateinamen und bestimme, ob es sich um eine Rechnung oder einen Kreditkartenbeleg handelt.
      Dateiname: ${fileName}
      Dateityp: ${fileType}
      
      Antworte nur mit einem JSON-Objekt im folgenden Format:
      {
        "type": "Rechnung" | "Kreditkartenbeleg" | "Unbekannt",
        "confidence": 0-1,
        "reason": "Kurze Begründung",
        "details": {
          "rechnungProbability": 0-1,
          "kreditkartenbelegProbability": 0-1
        }
      }`;
      
      messages.push({
        role: "user",
        content: prompt
      });
    }

    const completion = await openai.chat.completions.create({
      model: image ? "gpt-4o" : "gpt-3.5-turbo",
      messages: messages,
      response_format: { type: "json_object" },
      max_tokens: 500
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    // If language/region detected, validate and enhance with locale config
    if (result.language && result.region) {
      const locale = detectLocale(result.language, result.region);
      result.locale = locale.code;

      console.log(`Detected locale: ${locale.code} (${locale.name})`);
      console.log(`Number format: ${locale.numberFormat.example}`);
      console.log(`Special chars: ${locale.specialChars.join(', ')}`);
    } else {
      // Default to German if not detected
      result.language = 'de';
      result.region = 'DE';
      result.locale = 'de-DE';
      console.log('No language detected - defaulting to de-DE');
    }

    // Validate response schema
    try {
      const validatedResult = classifyReceiptResponseSchema.parse(result);
      return NextResponse.json(sanitizeObject(validatedResult));
    } catch (validationError) {
      console.error('Classification response validation failed:', validationError);
      // Return original result even if validation fails, to maintain backward compatibility
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error in classify-receipt:', error);
    
    // Return a default classification instead of error to avoid breaking the flow
    return NextResponse.json({
      type: 'Rechnung',
      confidence: 0.3,
      reason: 'Fehler bei der Klassifizierung - Standard: Rechnung',
      details: {
        rechnungProbability: 0.7,
        kreditkartenbelegProbability: 0.3
      }
    });
  }
} 