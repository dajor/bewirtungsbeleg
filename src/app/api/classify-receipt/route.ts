import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env } from '@/lib/env';
import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/rate-limit';
import { getToken } from 'next-auth/jwt';
import { classifyReceiptSchema, sanitizeObject } from '@/lib/validation';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Get user ID from session if available
    const token = await getToken({ req: request as any });
    const userId = token?.id as string | undefined;
    
    // Check rate limit
    const identifier = getIdentifier(request, userId);
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
    
    const { fileName, fileType } = sanitizeObject(validatedInput);

    const prompt = `Analysiere den folgenden Dateinamen und bestimme, ob es sich um eine Rechnung oder einen Kundenbeleg (Kreditkartenabrechnung) handelt.
    Dateiname: ${fileName}
    Dateityp: ${fileType}
    
    Antworte nur mit einem JSON-Objekt im folgenden Format:
    {
      "type": "rechnung" | "kundenbeleg" | "unbekannt",
      "confidence": 0-1,
      "reason": "Kurze Begründung",
      "details": {
        "rechnungProbability": 0-1,
        "kundenbelegProbability": 0-1
      }
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Du bist ein Experte für die Klassifizierung von Belegen. 
          Eine Rechnung enthält typischerweise:
          - Restaurantname und Adresse
          - Datum
          - Positionen mit Preisen
          - Gesamtbetrag
          - Mehrwertsteuer
          
          Ein Kundenbeleg (Kreditkartenabrechnung) enthält typischerweise:
          - Kreditkartennummer (teilweise maskiert)
          - Datum und Uhrzeit
          - Betrag
          - Transaktionsnummer
          - Händlername
          
          Analysiere den Dateinamen und bestimme den Belegtyp basierend auf diesen Merkmalen.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in classify-receipt:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Klassifizierung' },
      { status: 500 }
    );
  }
} 