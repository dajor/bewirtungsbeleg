import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Ausführlicheres Logging für Debugging
console.log('Verfügbare Umgebungsvariablen:', {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY?.substring(0, 10) + '...',
  NODE_ENV: process.env.NODE_ENV,
});

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY ist nicht gesetzt');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim(),
});

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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'Kein Bild gefunden' },
        { status: 400 }
      );
    }

    console.log('Verarbeite Bild:', {
      name: image.name,
      type: image.type,
      size: image.size
    });

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    console.log('Sende Anfrage an OpenAI...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Du gibst ausschließlich valides JSON zurück, ohne Markdown-Formatierung oder zusätzlichen Text. Zahlen sollten als Strings im Format '00,00' zurückgegeben werden."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extrahiere diese Informationen aus der Rechnung: restaurantName, restaurantAnschrift, gesamtbetrag, datum (Format: DD.MM.YYYY). Gib die Beträge im deutschen Format mit Komma zurück (z.B. '38,60'). Antworte NUR mit einem JSON-Objekt."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${image.type};base64,${base64Image}`
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
      
      // Konvertiere Zahlen ins deutsche Format
      if (parsedResult.gesamtbetrag) {
        parsedResult.gesamtbetrag = convertToGermanNumber(parsedResult.gesamtbetrag);
      }

      return NextResponse.json(parsedResult);
    } catch (e) {
      console.error('Fehler beim Parsen der Daten:', e);
      return NextResponse.json(
        { error: 'Fehler beim Parsen der Daten' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Fehler bei der OCR-Verarbeitung:', error);
    return NextResponse.json(
      { error: 'Fehler bei der OCR-Verarbeitung' },
      { status: 500 }
    );
  }
} 