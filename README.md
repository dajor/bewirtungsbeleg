# Bewirtungsbeleg-App

[![Tests](https://github.com/dajor/bewirtungsbeleg/actions/workflows/develop-to-main.yml/badge.svg)](https://github.com/dajor/bewirtungsbeleg/actions/workflows/develop-to-main.yml)
[![Coverage Status](https://github.com/dajor/bewirtungsbeleg/actions/workflows/coverage.yml/badge.svg)](https://github.com/dajor/bewirtungsbeleg/actions/workflows/coverage.yml)
[![Coverage](https://codecov.io/gh/dajor/bewirtungsbeleg/branch/main/graph/badge.svg)](https://codecov.io/gh/dajor/bewirtungsbeleg)

Eine moderne Web-Anwendung zur Erstellung von Bewirtungsbelegen mit automatischer Datenextraktion aus Fotos/Scans.

## Features

- 📝 Einfache Erfassung von Bewirtungsbelegen
- 📸 Automatische Datenextraktion aus Fotos/Scans mittels OCR
- 🏷️ Automatische Dokumentenklassifizierung (Rechnung vs Kreditkartenbeleg)
- 💳 Intelligente Feldausfüllung basierend auf Dokumenttyp
- 💶 Unterstützung für deutsches Zahlenformat
- 📅 Datumseingabe im deutschen Format
- 📄 PDF-Export mit allen Details
- 🖼️ Automatisches Anhängen des Original-Belegs im PDF
- 🔒 Benutzer-Authentifizierung mit NextAuth.js
- 👥 Rollenbasierte Zugriffskontrolle
- 🚦 API Rate Limiting mit Upstash Redis
- 🛡️ Input-Validierung und Sanitierung mit Zod

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
   - Kopiere die `.env.example` Datei zu `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Füge deine API-Keys und Secrets hinzu:
     ```
     # OpenAI API Key für OCR und Textverarbeitung
     OPENAI_API_KEY=dein-openai-api-key-hier
     
     # NextAuth Konfiguration
     NEXTAUTH_URL=http://localhost:3000
     NEXTAUTH_SECRET=dein-nextauth-secret-hier
     ```
   - Generiere ein sicheres NEXTAUTH_SECRET:
     ```bash
     openssl rand -base64 32
     ```

## Entwicklung

1. Entwicklungsserver starten:
   ```bash
   yarn dev
   ```

2. Öffne http://localhost:3000 in deinem Browser

3. Demo-Accounts für die Entwicklung:
   - Admin: `admin@docbits.com` / `admin123`
   - Benutzer: `user@docbits.com` / `user123`

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
- Rate Limit: 5 Anfragen pro Minute

### POST /api/classify-receipt
Klassifiziert eine Datei als Rechnung oder Kundenbeleg:
- Akzeptiert: JSON mit fileName und fileType
- Gibt JSON zurück mit Klassifizierung
- Rate Limit: 10 Anfragen pro 10 Sekunden

### POST /api/generate-pdf
Generiert ein PDF aus den Bewirtungsdaten:
- Akzeptiert: JSON mit allen Formulardaten
- Gibt PDF als Base64 zurück
- Rate Limit: 20 Anfragen pro Minute

## Rate Limiting

Die API verwendet Upstash Redis für Rate Limiting. Limits:
- OCR-Endpunkte: 5 Anfragen/Minute (höhere Kosten)
- PDF-Generierung: 20 Anfragen/Minute
- Allgemeine API: 10 Anfragen/10 Sekunden

Rate Limits werden pro Benutzer (wenn angemeldet) oder pro IP-Adresse angewendet.

## Sicherheit

Die Anwendung implementiert mehrere Sicherheitsmaßnahmen:

### Input-Validierung
- Alle API-Eingaben werden mit Zod-Schemas validiert
- Dateiuploads sind auf 10MB und bestimmte Bildformate beschränkt
- HTML-Inhalte werden sanitiert um XSS zu verhindern
- Dateinamen werden bereinigt um Path-Traversal-Angriffe zu verhindern

### Authentifizierung & Autorisierung
- JWT-basierte Sessions mit NextAuth.js
- Geschützte API-Routen mit Middleware
- Rollenbasierte Zugriffskontrolle

### Rate Limiting
- API-Endpunkte haben unterschiedliche Rate Limits
- Limits basieren auf Benutzer-ID oder IP-Adresse
- Headers zeigen verbleibende Anfragen an

### Umgebungsvariablen
- Sensible Daten werden nur serverseitig verwendet
- API-Keys sind nie im Client-Code enthalten
- Verwendung von `server-only` Package zur Sicherstellung

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