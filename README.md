# Bewirtungsbeleg-App

[![Tests](https://github.com/dajor/bewirtungsbeleg/actions/workflows/develop-to-main.yml/badge.svg)](https://github.com/dajor/bewirtungsbeleg/actions/workflows/develop-to-main.yml)
[![Coverage Status](https://github.com/dajor/bewirtungsbeleg/actions/workflows/coverage.yml/badge.svg)](https://github.com/dajor/bewirtungsbeleg/actions/workflows/coverage.yml)
[![Coverage](https://codecov.io/gh/dajor/bewirtungsbeleg/branch/main/graph/badge.svg)](https://codecov.io/gh/dajor/bewirtungsbeleg)

Eine moderne Web-Anwendung zur Erstellung von Bewirtungsbelegen mit automatischer Datenextraktion aus Fotos/Scans.

## Features

- 📝 Einfache Erfassung von Bewirtungsbelegen
- 📸 Automatische Datenextraktion aus Fotos/Scans mittels OCR
- 💶 Unterstützung für deutsches Zahlenformat
- 📅 Datumseingabe im deutschen Format
- 📄 PDF-Export mit allen Details
- 🖼️ Automatisches Anhängen des Original-Belegs im PDF

## Voraussetzungen

- Node.js (Version 18 oder höher)
- Yarn (über Corepack mit Node.js geliefert)
- Ein OpenAI API-Key für die OCR-Funktionalität

## Installation

1. Repository klonen:
   ```bash
   git clone [repository-url]
   cd bewirtungsbeleg-app
   ```

2. Abhängigkeiten installieren:
   ```bash
   yarn install
   ```

3. Umgebungsvariablen einrichten:
   - Erstelle eine Datei `.env.local` im Hauptverzeichnis
   - Füge deinen OpenAI API-Key hinzu:
     ```
     OPENAI_API_KEY=dein-api-key-hier
     ```

## Entwicklung

1. Entwicklungsserver starten:
   ```bash
   yarn dev
   ```

2. Öffne http://localhost:3000 in deinem Browser

## Verwendete Technologien

- Next.js 14
- TypeScript
- Mantine UI
- OpenAI Vision API für OCR
- jsPDF für PDF-Generierung

## Projektstruktur

```
src/
├── app/
│   ├── api/
│   │   └── extract-receipt/    # OCR API-Endpoint
│   │   └── extract-receipt/    # OCR API-Endpoint
│   ├── components/
│   │   └── BewirtungsbelegForm # Hauptformular-Komponente
│   ├── layout.tsx              # App-Layout
│   └── page.tsx               # Hauptseite
```

## API-Endpunkte

### POST /api/extract-receipt
Extrahiert Daten aus einem hochgeladenen Bild:
- Akzeptiert: multipart/form-data mit einem Bild
- Gibt JSON zurück mit:
  - restaurantName
  - restaurantAnschrift
  - gesamtbetrag (im deutschen Format)
  - datum (im Format DD.MM.YYYY)

## Bekannte Einschränkungen

- Die OCR-Funktionalität benötigt einen gültigen OpenAI API-Key
- Die Bildqualität beeinflusst die Genauigkeit der OCR-Erkennung
- PDF-Generierung erfolgt client-seitig

## Troubleshooting

### OCR funktioniert nicht
- Überprüfe, ob dein OpenAI API-Key korrekt in `.env.local` gesetzt ist
- Stelle sicher, dass das Bild lesbar und nicht zu groß ist
- Überprüfe die Browser-Konsole auf Fehlermeldungen

### Zahlenformat-Probleme
- Die App verwendet das deutsche Zahlenformat (Komma als Dezimaltrennzeichen)
- Stelle sicher, dass Zahlen im Format "XX,XX" eingegeben werden

## Lizenz

MIT 