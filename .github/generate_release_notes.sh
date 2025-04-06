#!/bin/bash

# Lese .env Datei
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "❌ Fehler: .env Datei nicht gefunden"
    exit 1
fi

# Prüfe ob OPENAI_API_KEY gesetzt ist
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Fehler: OPENAI_API_KEY ist nicht in .env gesetzt"
    exit 1
fi

# Temporäre Datei für Commits
COMMITS_FILE=$(mktemp)

# Sammle Commits seit dem letzten Tag (oder alle wenn kein Tag existiert)
if git describe --tags --abbrev=0 >/dev/null 2>&1; then
    LAST_TAG=$(git describe --tags --abbrev=0)
    git log --pretty=format:"%s" $LAST_TAG..HEAD > $COMMITS_FILE
else
    git log --pretty=format:"%s" > $COMMITS_FILE
fi

# Hole Build ID (Timestamp) und Commit SHA
BUILD_ID=$(date +%Y%m%d_%H%M%S)
COMMIT_SHA=$(git rev-parse HEAD)

# Führe Release Manager aus
python .github/release_manager.py "$COMMITS_FILE" "$BUILD_ID" "$COMMIT_SHA"
EXIT_CODE=$?

# Lösche temporäre Datei
rm $COMMITS_FILE

# Kopiere release-notes.json in public Verzeichnis
if [ -f "release-notes.json" ]; then
    mkdir -p public
    cp release-notes.json public/
    echo "✅ release-notes.json wurde in public/ kopiert"
else
    echo "❌ release-notes.json wurde nicht gefunden"
    exit 1
fi

# Gib Erfolg oder Fehler zurück
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Release Notes wurden erfolgreich generiert!"
else
    echo "❌ Fehler beim Generieren der Release Notes"
    exit $EXIT_CODE
fi 