'use client';

import { Container, Title, Text, Stack, Paper, List, rem } from '@mantine/core';

const metadata = {
  title: 'Datenschutzerklärung - DocBits Bewirtungsbeleg App',
  description: 'Datenschutzerklärung für die DocBits Bewirtungsbeleg App',
};

export default function PrivacyPage() {
  return (
    <Container size="md" py={rem(60)}>
      <Stack gap={rem(32)}>
        <Stack gap={rem(16)}>
          <Title order={1}>Datenschutzerklärung</Title>
          <Text c="dimmed">
            Stand: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </Stack>

        <Paper p={rem(24)} withBorder>
          <Stack gap={rem(24)}>
            {/* Section 1 */}
            <Stack gap={rem(12)}>
              <Title order={2}>1. Verantwortlicher</Title>
              <Text>
                Verantwortlich für die Datenverarbeitung im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
              </Text>
              <Text>
                <strong>FELLOWPRO AG</strong><br />
                DocBits Software<br />
                E-Mail: privacy@docbits.com
              </Text>
            </Stack>

            {/* Section 2 */}
            <Stack gap={rem(12)}>
              <Title order={2}>2. Allgemeines zur Datenverarbeitung</Title>
              <Text>
                Wir verarbeiten personenbezogene Daten unserer Nutzer nur, soweit dies zur Bereitstellung einer
                funktionsfähigen App sowie unserer Inhalte und Leistungen erforderlich ist. Die Verarbeitung
                personenbezogener Daten erfolgt nur nach Einwilligung des Nutzers oder auf gesetzlicher Grundlage.
              </Text>
            </Stack>

            {/* Section 3 */}
            <Stack gap={rem(12)}>
              <Title order={2}>3. Erhebung und Verarbeitung personenbezogener Daten</Title>

              <Title order={3} size="h4">3.1 Registrierung und Nutzerkonto</Title>
              <Text>Bei der Registrierung erheben wir folgende Daten:</Text>
              <List>
                <List.Item>Vorname und Nachname</List.Item>
                <List.Item>E-Mail-Adresse</List.Item>
                <List.Item>Passwort (verschlüsselt gespeichert)</List.Item>
                <List.Item>Zeitpunkt der Registrierung</List.Item>
              </List>
              <Text>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
              </Text>

              <Title order={3} size="h4" mt="md">3.2 Bewirtungsbelege</Title>
              <Text>Bei der Erfassung von Bewirtungsbelegen verarbeiten wir:</Text>
              <List>
                <List.Item>Hochgeladene Belegbilder (Fotos, PDFs)</List.Item>
                <List.Item>Extrahierte Daten (Restaurant, Betrag, Datum, etc.)</List.Item>
                <List.Item>Teilnehmerdaten (nur wenn von Ihnen eingegeben)</List.Item>
                <List.Item>Anlass der Bewirtung (nur wenn von Ihnen eingegeben)</List.Item>
              </List>
              <Text>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)
              </Text>

              <Title order={3} size="h4" mt="md">3.3 Automatische Datenerhebung</Title>
              <List>
                <List.Item>IP-Adresse (anonymisiert)</List.Item>
                <List.Item>Browsertyp und -version</List.Item>
                <List.Item>Betriebssystem</List.Item>
                <List.Item>Zugriffszeitpunkt</List.Item>
              </List>
              <Text>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse zur Gewährleistung der Systemsicherheit)
              </Text>
            </Stack>

            {/* Section 4 */}
            <Stack gap={rem(12)}>
              <Title order={2}>4. OCR und KI-Verarbeitung</Title>
              <Text>
                Zur automatischen Extraktion von Daten aus Belegen nutzen wir OpenAI Vision API. Dabei werden
                Belegbilder verschlüsselt an OpenAI übermittelt. OpenAI verarbeitet die Daten gemäß ihrer eigenen
                Datenschutzrichtlinien und speichert die Daten nicht dauerhaft.
              </Text>
              <Text>
                Sie können dieser Verarbeitung jederzeit widersprechen und die Daten manuell eingeben.
              </Text>
              <Text>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) und Art. 6 Abs. 1 lit. f DSGVO
                (berechtigtes Interesse an effizienter Datenverarbeitung)
              </Text>
            </Stack>

            {/* Section 5 */}
            <Stack gap={rem(12)}>
              <Title order={2}>5. Datenspeicherung und -löschung</Title>
              <List>
                <List.Item>
                  <strong>Nutzerkonto:</strong> Ihre Kontodaten werden gespeichert, solange Ihr Nutzerkonto besteht.
                  Nach Löschung des Kontos werden die Daten innerhalb von 30 Tagen vollständig gelöscht.
                </List.Item>
                <List.Item>
                  <strong>Belege:</strong> Ihre hochgeladenen Belege und extrahierten Daten werden bis zur Löschung
                  durch Sie oder Ihr Nutzerkonto gespeichert.
                </List.Item>
                <List.Item>
                  <strong>Log-Daten:</strong> Systemprotokolle werden nach 90 Tagen automatisch gelöscht.
                </List.Item>
              </List>
            </Stack>

            {/* Section 6 */}
            <Stack gap={rem(12)}>
              <Title order={2}>6. Weitergabe von Daten</Title>
              <Text>
                Eine Weitergabe Ihrer personenbezogenen Daten an Dritte erfolgt nur in folgenden Fällen:
              </Text>
              <List>
                <List.Item>
                  Sie haben ausdrücklich eingewilligt (Art. 6 Abs. 1 lit. a DSGVO)
                </List.Item>
                <List.Item>
                  Die Weitergabe ist zur Vertragserfüllung erforderlich (Art. 6 Abs. 1 lit. b DSGVO)
                </List.Item>
                <List.Item>
                  Eine gesetzliche Verpflichtung besteht (Art. 6 Abs. 1 lit. c DSGVO)
                </List.Item>
              </List>
              <Text mt="md">
                <strong>Eingesetzte Auftragsverarbeiter:</strong>
              </Text>
              <List>
                <List.Item>OpenAI (OCR-Verarbeitung) - USA, EU-Standardvertragsklauseln</List.Item>
                <List.Item>Hosting-Provider - Deutschland/EU</List.Item>
              </List>
            </Stack>

            {/* Section 7 */}
            <Stack gap={rem(12)}>
              <Title order={2}>7. Ihre Rechte als betroffene Person</Title>
              <Text>Sie haben folgende Rechte:</Text>
              <List>
                <List.Item>
                  <strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie können Auskunft über Ihre bei uns
                  gespeicherten Daten verlangen.
                </List.Item>
                <List.Item>
                  <strong>Berichtigungsrecht (Art. 16 DSGVO):</strong> Sie können die Berichtigung unrichtiger
                  Daten verlangen.
                </List.Item>
                <List.Item>
                  <strong>Löschungsrecht (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer Daten verlangen,
                  sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
                </List.Item>
                <List.Item>
                  <strong>Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong> Sie können die Einschränkung
                  der Verarbeitung Ihrer Daten verlangen.
                </List.Item>
                <List.Item>
                  <strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können Ihre Daten in einem
                  strukturierten, maschinenlesbaren Format erhalten.
                </List.Item>
                <List.Item>
                  <strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der Verarbeitung Ihrer Daten
                  widersprechen.
                </List.Item>
                <List.Item>
                  <strong>Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO):</strong> Sie können erteilte
                  Einwilligungen jederzeit widerrufen.
                </List.Item>
              </List>
            </Stack>

            {/* Section 8 */}
            <Stack gap={rem(12)}>
              <Title order={2}>8. Datensicherheit</Title>
              <Text>
                Wir verwenden geeignete technische und organisatorische Sicherheitsmaßnahmen zum Schutz Ihrer Daten:
              </Text>
              <List>
                <List.Item>SSL/TLS-Verschlüsselung für alle Datenübertragungen</List.Item>
                <List.Item>Verschlüsselte Speicherung von Passwörtern (bcrypt)</List.Item>
                <List.Item>Regelmäßige Sicherheitsupdates</List.Item>
                <List.Item>Zugriffskontrollen und Protokollierung</List.Item>
                <List.Item>Regelmäßige Backups</List.Item>
              </List>
            </Stack>

            {/* Section 9 */}
            <Stack gap={rem(12)}>
              <Title order={2}>9. Cookies und Tracking</Title>
              <Text>
                Unsere App verwendet nur technisch notwendige Cookies für die Sitzungsverwaltung (Session-Cookies).
                Diese Cookies sind für die Funktion der App erforderlich und werden nach Ende der Sitzung gelöscht.
              </Text>
              <Text>
                Wir setzen keine Tracking- oder Analyse-Cookies ein. Es findet keine Weitergabe an Werbenetzwerke statt.
              </Text>
            </Stack>

            {/* Section 10 */}
            <Stack gap={rem(12)}>
              <Title order={2}>10. Beschwerderecht</Title>
              <Text>
                Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer
                personenbezogenen Daten durch uns zu beschweren.
              </Text>
              <Text>
                Zuständige Aufsichtsbehörde für die FELLOWPRO AG ist die Datenschutzbehörde Ihres Bundeslandes
                oder des Landes, in dem die FELLOWPRO AG ihren Sitz hat.
              </Text>
            </Stack>

            {/* Section 11 */}
            <Stack gap={rem(12)}>
              <Title order={2}>11. Änderungen der Datenschutzerklärung</Title>
              <Text>
                Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslagen oder
                bei Änderungen unserer Dienste anzupassen. Die jeweils aktuelle Datenschutzerklärung ist auf
                dieser Seite verfügbar.
              </Text>
            </Stack>

            {/* Contact Section */}
            <Stack gap={rem(12)}>
              <Title order={2}>12. Kontakt Datenschutz</Title>
              <Text>
                Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte kontaktieren Sie uns bitte:
              </Text>
              <Text>
                <strong>FELLOWPRO AG</strong><br />
                Datenschutzbeauftragter<br />
                E-Mail: privacy@docbits.com
              </Text>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
