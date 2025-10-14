import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env } from '@/lib/env';
import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/rate-limit';
import { classifyReceiptSchema, classifyReceiptResponseSchema, sanitizeObject } from '@/lib/validation';
import { detectLocale } from '@/lib/locale-config';
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

const CREDIT_CARD_KEYWORDS = [
  'credit',
  'kredit',
  'card',
  'karte',
  'visa',
  'mastercard',
  'amex',
  'terminal',
  'pos',
  'kartenbeleg',
  'cc',
  'cardreceipt',
  'transaction',
  'chip',
  'tap'
];

const INVOICE_KEYWORDS = [
  'rechnung',
  'invoice',
  'bewirtungs',
  'bill',
  'faktura',
  'receipt'
];

function buildHeuristicClassification(fileName?: string, fileType?: string) {
  const normalizedName = (fileName || '').toLowerCase();
  const normalizedType = (fileType || '').toLowerCase();

  let type: 'Rechnung' | 'Kreditkartenbeleg' = 'Rechnung';
  let confidence = 0.55;
  let reason = 'Standardklassifizierung basierend auf Dateiinformationen';

  if (CREDIT_CARD_KEYWORDS.some(keyword => normalizedName.includes(keyword))) {
    type = 'Kreditkartenbeleg';
    confidence = 0.75;
    reason = 'Dateiname deutet auf Kreditkartenzahlung hin';
  } else if (INVOICE_KEYWORDS.some(keyword => normalizedName.includes(keyword))) {
    type = 'Rechnung';
    confidence = 0.75;
    reason = 'Dateiname enthält typische Rechnungsbegriffe';
  } else if (normalizedType.includes('png') || normalizedType.includes('jpg') || normalizedType.includes('jpeg')) {
    type = 'Kreditkartenbeleg';
    confidence = 0.6;
    reason = 'Bilddatei ohne weitere Hinweise – Kreditkartenbeleg als wahrscheinlicher angenommen';
  } else if (normalizedType.includes('pdf')) {
    type = 'Rechnung';
    confidence = 0.6;
    reason = 'PDF-Datei ohne weitere Hinweise – Rechnung als Standard angenommen';
  }

  return {
    type,
    confidence,
    reason,
    details: {
      rechnungProbability: type === 'Rechnung' ? confidence : 1 - confidence,
      kreditkartenbelegProbability: type === 'Kreditkartenbeleg' ? confidence : 1 - confidence
    },
    language: 'de',
    region: 'DE',
    locale: 'de-DE'
  };
}

function isLikelyImageDataUrl(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  return /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(value.trim());
}

export async function POST(request: Request) {
  let heuristicFallback = buildHeuristicClassification();

  try {
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
    heuristicFallback = buildHeuristicClassification(fileName, fileType);

    // Check if OpenAI is available
    if (!openai) {
      console.error('OpenAI not initialized - using heuristic fallback');
      return NextResponse.json(heuristicFallback);
    }

    let preparedImage: string | null = image ?? null;
    if (preparedImage) {
      console.log('Validating image data for OpenAI...');
      if (!isLikelyImageDataUrl(preparedImage)) {
        console.error('Image validation failed: Invalid image data URL format');
        preparedImage = null;
      }
    }

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

    if (preparedImage) {
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
              url: preparedImage
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

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: preparedImage ? "gpt-4o" : "gpt-3.5-turbo",
        messages: messages,
        response_format: { type: "json_object" },
        max_tokens: 500
      });
    } catch (apiError) {
      console.error('OpenAI API error:', apiError);
      return NextResponse.json({
        ...heuristicFallback,
        reason: `${heuristicFallback.reason} (OpenAI nicht erreichbar)`
      });
    }

    const rawContent = completion?.choices?.[0]?.message?.content;
    let result: any = null;

    try {
      if (rawContent) {
        result = JSON.parse(rawContent);
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return NextResponse.json({
        ...heuristicFallback,
        reason: `${heuristicFallback.reason} (OpenAI Antwort ungültig)`
      });
    }

    if (!result) {
      return NextResponse.json({
        ...heuristicFallback,
        reason: `${heuristicFallback.reason} (keine verwertbare Antwort erhalten)`
      });
    }

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
    
    return NextResponse.json({
      ...heuristicFallback,
      reason: `${heuristicFallback.reason} (Fehler bei der Klassifizierung)`
    });
  }
}
