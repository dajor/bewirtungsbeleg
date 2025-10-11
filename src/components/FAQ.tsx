'use client';

import { Accordion, Container, Title, rem, Text } from '@mantine/core';

export function FAQ() {
  return (
    <Container size="md" py={rem(64)}>
      <Title order={2} ta="center" mb={rem(48)}>
        Häufig gestellte Fragen
      </Title>

      <Accordion variant="separated" defaultValue="was-ist">
        <Accordion.Item value="was-ist">
          <Accordion.Control>
            <Text fw={500}>Was ist ein Bewirtungsbeleg und wann brauche ich einen?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm">
              Ein Bewirtungsbeleg ist ein Nachweis für geschäftliche Bewirtungskosten.
              Sie benötigen ihn, wenn Sie Geschäftspartner, Kunden oder Mitarbeiter
              aus geschäftlichem Anlass bewirten und die Kosten steuerlich absetzen möchten.
            </Text>
            <Text size="sm" mt="sm">
              <strong>Beispiele:</strong> Kundengespräch im Restaurant, Teamessen nach
              Projektabschluss, Geschäftsfrühstück mit Lieferanten.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="unterschied-70-100">
          <Accordion.Control>
            <Text fw={500}>Was bedeutet 70% vs. 100% abzugsfähig?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm">
              <strong>Kundenbewirtung (70%):</strong> Wenn Sie Geschäftsfreunde wie Kunden,
              Lieferanten oder potenzielle Partner bewirten, können Sie 70% der Kosten als
              Betriebsausgabe absetzen.
            </Text>
            <Text size="sm" mt="sm">
              <strong>Mitarbeiterbewirtung (100%):</strong> Bei betrieblichen Anlässen mit
              Ihren eigenen Mitarbeitern (z.B. Teamessen, Arbeitsessen) sind 100% der Kosten
              abzugsfähig.
            </Text>
            <Text size="sm" mt="sm" c="dimmed">
              <strong>Wichtig:</strong> Reine Bewirtungen ohne Geschäftsanlass sind nicht
              abzugsfähig.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="pflichtangaben">
          <Accordion.Control>
            <Text fw={500}>Welche Angaben muss ein Bewirtungsbeleg enthalten?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" mb="xs">
              Das Finanzamt verlangt folgende Angaben:
            </Text>
            <Text size="sm" component="ul">
              <li>Datum und Ort der Bewirtung</li>
              <li>Name und Anschrift des Restaurants</li>
              <li>Teilnehmer der Bewirtung (Namen)</li>
              <li>Anlass der Bewirtung (geschäftlicher Grund)</li>
              <li>Höhe der Aufwendungen (Gesamtbetrag)</li>
              <li>Unterschrift des Gastgebers</li>
            </Text>
            <Text size="sm" mt="sm">
              <strong>Zusätzlich bei Kundenbewirtung:</strong> Name und Firma der
              bewirteten Geschäftspartner
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="zugferd">
          <Accordion.Control>
            <Text fw={500}>Was ist ZUGFeRD und wann brauche ich das?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm">
              ZUGFeRD (Zentraler User Guide des Forums elektronische Rechnung Deutschland)
              ist ein Standard für elektronische Rechnungen. Ein ZUGFeRD-PDF enthält sowohl
              ein lesbares PDF als auch maschinenlesbare XML-Daten.
            </Text>
            <Text size="sm" mt="sm">
              <strong>Vorteile:</strong>
            </Text>
            <Text size="sm" component="ul">
              <li>Automatische Verarbeitung in Buchhaltungssoftware</li>
              <li>GoBD-konforme digitale Archivierung</li>
              <li>Reduzierung manueller Dateneingabe</li>
            </Text>
            <Text size="sm" mt="sm" c="dimmed">
              <strong>Hinweis:</strong> ZUGFeRD ist optional. Für die meisten Nutzer
              reicht das Standard-PDF vollkommen aus.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="gobd-tresor">
          <Accordion.Control>
            <Text fw={500}>Was ist der GoBD-Tresor?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm">
              Der GoBD-Tresor ist ein revisionssicheres digitales Archiv für Ihre
              Bewirtungsbelege. GoBD steht für "Grundsätze zur ordnungsmäßigen Führung
              und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer
              Form".
            </Text>
            <Text size="sm" mt="sm">
              <strong>Vorteile:</strong>
            </Text>
            <Text size="sm" component="ul">
              <li>Sichere Aufbewahrung für 10 Jahre (gesetzliche Aufbewahrungsfrist)</li>
              <li>Schnelle Suche und Abruf aller Belege</li>
              <li>Revisionssicher und finanzamtkonform</li>
              <li>Automatische Verschlagwortung und Kategorisierung</li>
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="eigenbeleg">
          <Accordion.Control>
            <Text fw={500}>Was ist ein Eigenbeleg und wann darf ich ihn verwenden?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm">
              Ein Eigenbeleg ist eine selbst erstellte Quittung, die Sie verwenden können,
              wenn Sie keine Originalrechnung vom Restaurant erhalten haben.
            </Text>
            <Text size="sm" mt="sm">
              <strong>Wann erlaubt:</strong>
            </Text>
            <Text size="sm" component="ul">
              <li>Originalbeleg wurde verloren</li>
              <li>Restaurant stellt keine Rechnung aus</li>
              <li>Beträge unter 150 € (Kleinbetragsrechnung)</li>
            </Text>
            <Text size="sm" mt="sm" c="orange" fw={500}>
              <strong>Wichtig:</strong> Bei Eigenbelegen kann die Vorsteuer (MwSt.) nicht
              geltend gemacht werden! Verwenden Sie Eigenbelege nur, wenn unbedingt nötig.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="kreditkarte-rechnung">
          <Accordion.Control>
            <Text fw={500}>
              Warum soll ich Rechnung UND Kreditkartenbeleg hochladen?
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm">
              Das Finanzamt verlangt zum Nachweis der tatsächlichen Zahlung oft beide Belege:
            </Text>
            <Text size="sm" mt="sm">
              <strong>Restaurant-Rechnung:</strong> Zeigt die einzelnen Positionen,
              MwSt.-Betrag und Gesamtsumme.
            </Text>
            <Text size="sm" mt="xs">
              <strong>Kreditkartenbeleg:</strong> Beweist, dass Sie tatsächlich bezahlt haben
              und zeigt eventuell gezahltes Trinkgeld.
            </Text>
            <Text size="sm" mt="sm" c="dimmed">
              Unsere App erkennt automatisch, welcher Beleg welcher ist, und ordnet die
              Informationen korrekt zu.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="ausland">
          <Accordion.Control>
            <Text fw={500}>Wie handhabe ich Bewirtungen im Ausland?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm">
              Bei Bewirtungen im Ausland aktivieren Sie bitte die Option "Ausländische
              Rechnung". Dadurch wird die MwSt. automatisch auf 0 gesetzt, da Sie bei
              ausländischen Rechnungen keine deutsche Vorsteuer geltend machen können.
            </Text>
            <Text size="sm" mt="sm">
              <strong>Wichtig:</strong> Geben Sie die Währung an, in der Sie bezahlt haben.
              Sie können den Betrag in der Originalwährung eingeben - eine Umrechnung in
              Euro sollte Ihre Buchhaltung vornehmen.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Container>
  );
}
