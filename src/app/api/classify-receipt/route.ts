import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env } from '@/lib/env';
import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/rate-limit';
import { classifyReceiptSchema, sanitizeObject } from '@/lib/validation';
import { z } from 'zod';
import { validateImageDataUrl, reencodeImageDataUrl, getBase64ImageSize } from '@/lib/image-validation';

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
        content: `Du bist ein Experte für die Klassifizierung von Belegen.
        Eine Rechnung enthält typischerweise:
        - Restaurantname und Adresse
        - Datum
        - Positionen mit Preisen
        - Gesamtbetrag
        - Mehrwertsteuer

        Ein Kreditkartenbeleg enthält typischerweise:
        - Kreditkartennummer (teilweise maskiert)
        - Datum und Uhrzeit
        - Betrag
        - Transaktionsnummer
        - Händlername
        - Oft kompakter und schmaler als eine Rechnung

        Analysiere den Beleg und bestimme den Typ basierend auf diesen Merkmalen.`
      }
    ];

    if (image) {
      // Validate and re-encode the image to ensure proper formatting
      console.log('Validating image data for OpenAI...');
      const validation = validateImageDataUrl(image);

      if (!validation.valid) {
        console.error('Image validation failed:', validation.error);
        return NextResponse.json({
          type: 'Rechnung',
          confidence: 0.5,
          reason: 'Bildvalidierung fehlgeschlagen - Standard: Rechnung',
          details: {
            rechnungProbability: 0.7,
            kreditkartenbelegProbability: 0.3
          }
        });
      }

      // Log image details for debugging
      const imageSize = getBase64ImageSize(validation.base64Data!);
      console.log(`Image validated: format=${validation.format}, size=${Math.round(imageSize / 1024)}KB`);

      // Re-encode the image to ensure proper formatting
      let validatedImageUrl: string;
      try {
        validatedImageUrl = reencodeImageDataUrl(image);
        console.log('Image successfully re-encoded for OpenAI');
      } catch (error) {
        console.error('Image re-encoding failed:', error);
        validatedImageUrl = image; // Use original if re-encoding fails
      }

      // If we have an image, analyze its content
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Analysiere dieses Dokument und bestimme, ob es sich um eine Rechnung oder einen Kreditkartenbeleg handelt.

            Antworte nur mit einem JSON-Objekt im folgenden Format:
            {
              "type": "Rechnung" | "Kreditkartenbeleg" | "Unbekannt",
              "confidence": 0-1,
              "reason": "Kurze Begründung auf Deutsch",
              "details": {
                "rechnungProbability": 0-1,
                "kreditkartenbelegProbability": 0-1
              }
            }`
          },
          {
            type: "image_url",
            image_url: {
              url: validatedImageUrl
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
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in classify-receipt:', error);

    // Log specific error details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      if ('code' in error) {
        console.error('Error code:', (error as any).code);
      }
      if ('status' in error) {
        console.error('Error status:', (error as any).status);
      }
    }

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