import OpenAI from 'openai';
import { env } from '@/lib/env';

let openai: OpenAI | null = null;

try {
  if (env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.error('Failed to initialize OpenAI for image detection:', error);
}

export interface BoundingBox {
  x: number;      // X coordinate (0-1, relative to image width)
  y: number;      // Y coordinate (0-1, relative to image height)
  width: number;  // Width (0-1, relative to image width)
  height: number; // Height (0-1, relative to image height)
}

export interface DetectedRegion {
  type: 'Rechnung' | 'Kreditkartenbeleg';
  boundingBox: BoundingBox;
  confidence: number;
  description: string;
}

export interface ImageDetectionResult {
  hasMultipleDocuments: boolean;
  regions: DetectedRegion[];
  reasoning: string;
}

/**
 * Detect embedded documents/images within a scanned page using OpenAI Vision
 * This is useful for detecting when a page contains both an invoice and a credit card receipt
 */
export async function detectEmbeddedDocuments(
  imageDataUrl: string
): Promise<ImageDetectionResult> {
  if (!openai) {
    console.error('OpenAI not initialized for image detection');
    return {
      hasMultipleDocuments: false,
      regions: [],
      reasoning: 'OpenAI not available'
    };
  }

  try {
    console.log('🔍 Detecting embedded documents in image...');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Du bist ein Experte für die Erkennung von Dokumenten in gescannten Bildern.

          Deine Aufgabe ist es zu erkennen, ob ein gescanntes Bild MEHRERE separate Dokumente enthält.

          Häufige Szenarien:
          1. Eine Restaurantrechnung mit einem aufgeklebten/beigelegten Kreditkartenbeleg
          2. Zwei separate Belege auf einer Seite
          3. Ein Foto eines Kreditkartenbelegs innerhalb einer Rechnung

          Für jedes erkannte Dokument gibst du:
          - Den Typ (Rechnung oder Kreditkartenbeleg)
          - Die Bounding Box (relative Koordinaten 0-1)
          - Eine Beschreibung`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analysiere dieses Bild und erkenne, ob es mehrere separate Dokumente enthält.

              Antworte NUR mit einem JSON-Objekt:
              {
                "hasMultipleDocuments": boolean,
                "regions": [
                  {
                    "type": "Rechnung" | "Kreditkartenbeleg",
                    "boundingBox": {
                      "x": 0-1,      // Linke obere Ecke X (0 = links, 1 = rechts)
                      "y": 0-1,      // Linke obere Ecke Y (0 = oben, 1 = unten)
                      "width": 0-1,  // Breite relativ zur Bildbreite
                      "height": 0-1  // Höhe relativ zur Bildhöhe
                    },
                    "confidence": 0-1,
                    "description": "Kurze Beschreibung (z.B. 'Hauptrechnung' oder 'Aufgeklebter Kreditkartenbeleg')"
                  }
                ],
                "reasoning": "Kurze Begründung der Entscheidung"
              }

              WICHTIG:
              - Wenn das Bild NUR EIN Dokument zeigt, setze hasMultipleDocuments auf false und gib trotzdem die Region zurück
              - Wenn mehrere Dokumente sichtbar sind, gib für jedes eine separate Region an
              - Die Bounding Box sollte das Dokument möglichst genau umschließen
              - Achte auf visuelle Hinweise: unterschiedliche Papierformate, aufgeklebte Bereiche, Fotos`
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl
              }
            }
          ]
        }
      ],
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    console.log('✅ Image detection result:', result);

    return result as ImageDetectionResult;

  } catch (error) {
    console.error('❌ Image detection failed:', error);
    return {
      hasMultipleDocuments: false,
      regions: [],
      reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Simple check if an image likely contains multiple documents
 * This is a faster, non-AI check based on image analysis
 */
export function quickCheckMultipleDocuments(imageDataUrl: string): boolean {
  // This is a placeholder for a quick heuristic check
  // Could analyze image contrast, detect borders, etc.
  // For now, we'll rely on the AI-based detection
  return false;
}
