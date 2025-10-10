'use client';

import { Container, Title, Text, Stack, Paper, List, rem } from '@mantine/core';

const metadata = {
  title: 'AGB - DocBits Bewirtungsbeleg App',
  description: 'Allgemeine Geschäftsbedingungen für die DocBits Bewirtungsbeleg App',
};

export default function TermsPage() {
  return (
    <Container size="md" py={rem(60)}>
      <Stack gap={rem(32)}>
        <Stack gap={rem(16)}>
          <Title order={1}>Allgemeine Geschäftsbedingungen</Title>
          <Text c="dimmed">
            Stand: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </Stack>

        <Paper p={rem(24)} withBorder>
          <Stack gap={rem(24)}>
            {/* Section 1 */}
            <Stack gap={rem(12)}>
              <Title order={2}>1. Geltungsbereich</Title>
              <Text>
                Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der DocBits Bewirtungsbeleg App,
                bereitgestellt von der FELLOWPRO AG. Mit der Registrierung und Nutzung der App akzeptieren Sie diese AGB.
              </Text>
            </Stack>

            {/* Section 2 */}
            <Stack gap={rem(12)}>
              <Title order={2}>2. Anbieter</Title>
              <Text>
                <strong>FELLOWPRO AG</strong><br />
                Anbieter der DocBits Software und Dienste
              </Text>
              <Text size="sm" c="dimmed">
                Weitere Kontaktinformationen finden Sie in unserem Impressum.
              </Text>
            </Stack>

            {/* Section 3 */}
            <Stack gap={rem(12)}>
              <Title order={2}>3. Leistungsumfang</Title>
              <Text>
                Die DocBits Bewirtungsbeleg App ermöglicht die digitale Erfassung und Verwaltung von Bewirtungsbelegen.
                Die bereitgestellten Funktionen umfassen:
              </Text>
              <List>
                <List.Item>Digitale Erfassung von Bewirtungsbelegen</List.Item>
                <List.Item>OCR-basierte Datenextraktion mittels KI</List.Item>
                <List.Item>Erstellung rechtskonfomer PDF-Dokumente</List.Item>
                <List.Item>Verwaltung und Archivierung von Belegen</List.Item>
              </List>
            </Stack>

            {/* Section 4 */}
            <Stack gap={rem(12)}>
              <Title order={2}>4. Registrierung und Nutzerkonto</Title>
              <List>
                <List.Item>
                  Die Nutzung der App erfordert eine Registrierung mit gültiger E-Mail-Adresse.
                </List.Item>
                <List.Item>
                  Sie sind verpflichtet, wahrheitsgemäße Angaben zu machen und Ihre Zugangsdaten vertraulich zu behandeln.
                </List.Item>
                <List.Item>
                  Sie sind für alle Aktivitäten verantwortlich, die über Ihr Nutzerkonto durchgeführt werden.
                </List.Item>
                <List.Item>
                  Bei Verdacht auf unbefugte Nutzung sind Sie verpflichtet, uns unverzüglich zu informieren.
                </List.Item>
              </List>
            </Stack>

            {/* Section 5 */}
            <Stack gap={rem(12)}>
              <Title order={2}>5. Nutzungsrechte und Pflichten</Title>
              <Text>
                Sie erhalten ein nicht-exklusives, nicht übertragbares Recht zur Nutzung der App für eigene Zwecke.
                Folgende Handlungen sind untersagt:
              </Text>
              <List>
                <List.Item>Reverse Engineering, Dekompilierung oder Disassemblierung der Software</List.Item>
                <List.Item>Weitergabe von Zugangsdaten an Dritte</List.Item>
                <List.Item>Missbrauch der App für rechtswidrige Zwecke</List.Item>
                <List.Item>Beeinträchtigung der Systemsicherheit oder -verfügbarkeit</List.Item>
              </List>
            </Stack>

            {/* Section 6 */}
            <Stack gap={rem(12)}>
              <Title order={2}>6. Datenschutz</Title>
              <Text>
                Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer Datenschutzerklärung und den
                Bestimmungen der DSGVO. Weitere Informationen finden Sie in unserer Datenschutzerklärung.
              </Text>
            </Stack>

            {/* Section 7 */}
            <Stack gap={rem(12)}>
              <Title order={2}>7. Gewährleistung und Haftung</Title>
              <List>
                <List.Item>
                  Die FELLOWPRO AG bemüht sich um eine hohe Verfügbarkeit und Qualität der Dienste, übernimmt
                  jedoch keine Garantie für eine unterbrechungsfreie Verfügbarkeit.
                </List.Item>
                <List.Item>
                  Die Haftung für Schäden ist auf Vorsatz und grobe Fahrlässigkeit beschränkt, soweit gesetzlich zulässig.
                </List.Item>
                <List.Item>
                  Die OCR-Funktionalität dient als Hilfsmittel. Sie sind selbst für die Prüfung und Richtigkeit
                  der erfassten Daten verantwortlich.
                </List.Item>
              </List>
            </Stack>

            {/* Section 8 */}
            <Stack gap={rem(12)}>
              <Title order={2}>8. Preise und Zahlungsbedingungen</Title>
              <Text>
                Die Nutzung der Basisfunktionen ist kostenlos. Für erweiterte Funktionen können kostenpflichtige
                Pakete angeboten werden. Die aktuellen Preise werden transparent auf der Webseite dargestellt.
              </Text>
            </Stack>

            {/* Section 9 */}
            <Stack gap={rem(12)}>
              <Title order={2}>9. Laufzeit und Kündigung</Title>
              <List>
                <List.Item>
                  Der Nutzungsvertrag wird auf unbestimmte Zeit geschlossen.
                </List.Item>
                <List.Item>
                  Sie können Ihr Nutzerkonto jederzeit über die Einstellungen löschen.
                </List.Item>
                <List.Item>
                  Die FELLOWPRO AG behält sich das Recht vor, Nutzerkonten bei Verstoß gegen diese AGB zu sperren
                  oder zu löschen.
                </List.Item>
              </List>
            </Stack>

            {/* Section 10 */}
            <Stack gap={rem(12)}>
              <Title order={2}>10. Änderungen der AGB</Title>
              <Text>
                Die FELLOWPRO AG behält sich vor, diese AGB jederzeit zu ändern. Registrierte Nutzer werden über
                wesentliche Änderungen per E-Mail informiert. Die Fortsetzung der Nutzung nach Änderungsmitteilung
                gilt als Zustimmung zu den neuen AGB.
              </Text>
            </Stack>

            {/* Section 11 */}
            <Stack gap={rem(12)}>
              <Title order={2}>11. Schlussbestimmungen</Title>
              <List>
                <List.Item>
                  Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
                </List.Item>
                <List.Item>
                  Erfüllungsort und Gerichtsstand ist der Sitz der FELLOWPRO AG, soweit gesetzlich zulässig.
                </List.Item>
                <List.Item>
                  Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen
                  Bestimmungen unberührt.
                </List.Item>
              </List>
            </Stack>

            {/* Contact Section */}
            <Stack gap={rem(12)}>
              <Title order={2}>12. Kontakt</Title>
              <Text>
                Bei Fragen zu diesen AGB kontaktieren Sie uns bitte:
              </Text>
              <Text>
                <strong>FELLOWPRO AG</strong><br />
                DocBits Software<br />
                E-Mail: support@docbits.com
              </Text>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
