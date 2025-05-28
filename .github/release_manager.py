#!/usr/bin/env python3
import os
import sys
import json
from datetime import datetime
import openai
from typing import List, Dict, Tuple

class ReleaseManager:
    def __init__(self):
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY nicht gefunden")
        
        openai.api_key = self.openai_api_key
        self.client = openai.OpenAI()

    def get_current_version(self) -> str:
        """Liest die aktuelle Version aus version.txt"""
        try:
            with open('version.txt', 'r', encoding='utf-8') as f:
                return f.read().strip()
        except FileNotFoundError:
            return "0.0.0"  # Startversion wenn keine Datei existiert

    def analyze_commits(self, commits: List[str]) -> Tuple[str, List[str]]:
        """Analysiert Commits mit OpenAI um die Versionsnummer und verbesserte Beschreibungen zu generieren"""
        
        current_version = self.get_current_version()
        
        prompt = f"""
        Die aktuelle Version ist: {current_version}

        Analysiere diese Git-Commits und erstelle eine neue Version und verbesserte Beschreibungen.
        Folge dabei Semantic Versioning (MAJOR.MINOR.PATCH):
        - MAJOR: Breaking Changes
        - MINOR: Neue Features
        - PATCH: Bugfixes

        Aktuelle Commits:
        {commits}

        Antworte ausschließlich mit einem JSON-Objekt im folgenden Format:
        {{
            "version": "x.y.z",
            "changes": [
                "Klare Beschreibung der Änderung 1",
                "Klare Beschreibung der Änderung 2"
            ]
        }}
        """

        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "Du bist ein erfahrener Software Release Manager, der Semantic Versioning perfekt beherrscht und technische Änderungen klar kommunizieren kann. Antworte ausschließlich im spezifizierten JSON-Format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={ "type": "json_object" }
        )

        try:
            result = json.loads(response.choices[0].message.content)
            return result["version"], result["changes"]
        except (json.JSONDecodeError, KeyError) as e:
            raise ValueError(f"Fehler beim Parsen der OpenAI-Antwort: {str(e)}")

    def create_release_notes(self, version: str, changes: List[str], build_id: str, commit_sha: str) -> Tuple[str, Dict]:
        """Erstellt Release Notes in Text- und JSON-Format"""
        
        # Text Format
        today = datetime.now().strftime('%d.%m.%Y')
        text_content = f"""# Version {version}
Datum: {today}

## Änderungen
{chr(10).join(f'- {change}' for change in changes)}

## Technische Details
- Build: {build_id}
- Commit: {commit_sha}

---

"""

        # JSON Format
        json_content = {
            "versions": [{
                "version": version,
                "date": today,
                "changes": changes,
                "build": build_id,
                "commit": commit_sha
            }]
        }

        # Wenn bereits Release Notes existieren, füge sie hinzu
        if os.path.exists('release-notes.txt'):
            with open('release-notes.txt', 'r', encoding='utf-8') as f:
                existing_text = f.read()
                text_content += existing_text

        if os.path.exists('release-notes.json'):
            with open('release-notes.json', 'r', encoding='utf-8') as f:
                try:
                    existing_json = json.load(f)
                    json_content["versions"].extend(existing_json["versions"])
                except json.JSONDecodeError:
                    pass

        return text_content, json_content

    def save_release_files(self, version: str, text_content: str, json_content: Dict):
        """Speichert die Release-Dateien"""
        
        # Speichere Version
        with open('version.txt', 'w', encoding='utf-8') as f:
            f.write(version)

        # Speichere Text Release Notes
        with open('release-notes.txt', 'w', encoding='utf-8') as f:
            f.write(text_content)

        # Speichere JSON Release Notes
        with open('release-notes.json', 'w', encoding='utf-8') as f:
            json.dump(json_content, f, indent=2, ensure_ascii=False)

        # Kopiere JSON-Datei auch in das public-Verzeichnis, damit die
        # Release Notes von der Anwendung geladen werden können
        os.makedirs('public', exist_ok=True)
        with open('public/release-notes.json', 'w', encoding='utf-8') as f:
            json.dump(json_content, f, indent=2, ensure_ascii=False)

def main():
    if len(sys.argv) < 4:
        print("Verwendung: release_manager.py <commits_file> <build_id> <commit_sha>")
        sys.exit(1)

    commits_file = sys.argv[1]
    build_id = sys.argv[2]
    commit_sha = sys.argv[3]

    # Lese Commits aus Datei
    with open(commits_file, 'r', encoding='utf-8') as f:
        commits = f.readlines()

    try:
        manager = ReleaseManager()
        
        # Analysiere Commits und bestimme neue Version
        new_version, changes = manager.analyze_commits(commits)
        
        # Erstelle Release Notes
        text_content, json_content = manager.create_release_notes(
            new_version, changes, build_id, commit_sha
        )
        
        # Speichere alle Dateien
        manager.save_release_files(new_version, text_content, json_content)
        
        print(f"✅ Release {new_version} erfolgreich erstellt!")
        
    except Exception as e:
        print(f"❌ Fehler beim Erstellen des Releases: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 