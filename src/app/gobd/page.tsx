'use client';

import {
  Container,
  Title,
  Text,
  Stack,
  List,
  Image,
  Paper,
  Divider,
  Badge,
  Group,
  ThemeIcon,
  SimpleGrid,
  Box,
} from '@mantine/core';
import {
  IconShieldCheck,
  IconLock,
  IconFileCheck,
  IconEye,
  IconClock,
} from '@tabler/icons-react';

export default function GoBDPage() {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '80px 0 60px',
        }}
      >
        <Container size="lg">
          <Stack gap="md" align="center" ta="center">
            <Badge size="lg" variant="light" color="white" c="dark">
              Version 1.0 • Stand: 09.10.2025
            </Badge>
            <Title
              order={1}
              size="3rem"
              fw={900}
              style={{
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }}
            >
              GoBD-konform & Finanzamtssicher
            </Title>
            <Text size="xl" maw={700} opacity={0.95}>
              Digitales Signatur- und Prüfverfahren mit Auth-Server und Barcode-Validierung –
              Revisionssicher nach BMF-Schreiben vom 28.11.2019
            </Text>

            <Group gap="md" mt="lg">
              <ThemeIcon size={60} radius="md" variant="white" color="dark">
                <IconShieldCheck size={32} />
              </ThemeIcon>
              <ThemeIcon size={60} radius="md" variant="white" color="dark">
                <IconLock size={32} />
              </ThemeIcon>
              <ThemeIcon size={60} radius="md" variant="white" color="dark">
                <IconFileCheck size={32} />
              </ThemeIcon>
            </Group>
          </Stack>
        </Container>
      </Box>

      <Container size="lg" py="xl">
        <Stack gap="xl">

        {/* Key Benefits */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          <Paper shadow="sm" p="lg" radius="md" withBorder>
            <ThemeIcon size={50} radius="md" variant="light" color="blue" mb="md">
              <IconShieldCheck size={28} />
            </ThemeIcon>
            <Title order={4} mb="xs">
              100% Revisionssicher
            </Title>
            <Text size="sm" c="dimmed">
              Erfüllt alle GoBD-Anforderungen des Finanzamts
            </Text>
          </Paper>

          <Paper shadow="sm" p="lg" radius="md" withBorder>
            <ThemeIcon size={50} radius="md" variant="light" color="violet" mb="md">
              <IconLock size={28} />
            </ThemeIcon>
            <Title order={4} mb="xs">
              WORM-Archivierung
            </Title>
            <Text size="sm" c="dimmed">
              Unveränderbare Speicherung nach Signatur
            </Text>
          </Paper>

          <Paper shadow="sm" p="lg" radius="md" withBorder>
            <ThemeIcon size={50} radius="md" variant="light" color="green" mb="md">
              <IconEye size={28} />
            </ThemeIcon>
            <Title order={4} mb="xs">
              QR-Code Prüfung
            </Title>
            <Text size="sm" c="dimmed">
              Echtheit jederzeit per Scan nachweisbar
            </Text>
          </Paper>

          <Paper shadow="sm" p="lg" radius="md" withBorder>
            <ThemeIcon size={50} radius="md" variant="light" color="orange" mb="md">
              <IconClock size={28} />
            </ThemeIcon>
            <Title order={4} mb="xs">
              10 Jahre Archiv
            </Title>
            <Text size="sm" c="dimmed">
              Gesetzeskonforme Aufbewahrung gemäß § 147 AO
            </Text>
          </Paper>
        </SimpleGrid>

        {/* Section 1: Zweck */}
        <Paper shadow="md" p="xl" radius="lg" style={{ background: 'linear-gradient(to right, #f8f9fa, #e9ecef)' }}>
          <Group gap="md" mb="lg">
            <ThemeIcon size={40} radius="md" variant="light" color="blue">
              <IconFileCheck size={24} />
            </ThemeIcon>
            <Title order={2}>
              Zweck des Verfahrens
            </Title>
          </Group>
          <Text size="lg">
            Dieses Verfahren dient der <strong>revisionssicheren Erfassung, digitalen Signatur und
            Aufbewahrung</strong> steuerrelevanter PDF-Dokumente (z. B. Bewirtungsbelege, Rechnungen,
            Vereinbarungen). Ziel ist es, die Anforderungen an <strong>Authentizität, Integrität,
            Nachvollziehbarkeit und Unveränderbarkeit</strong> gemäß den GoBD (BMF-Schreiben vom 28.11.2019)
            zu erfüllen.
          </Text>
        </Paper>

        {/* Section 2: Technischer Ablauf */}
        <div>
          <Title order={2} mb="xl" ta="center">
            So funktioniert die digitale Signatur
          </Title>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {/* Step 1 */}
            <Paper shadow="md" p="xl" radius="lg" withBorder>
              <Badge size="lg" variant="filled" color="blue" mb="md">
                Schritt 1
              </Badge>
              <Title order={3} size="h3" mb="md" c="blue">
                Authentifizierung
              </Title>
              <Text>
                Der Benutzer meldet sich eindeutig über den zentralen <strong>Auth-Server</strong> an
                (SSO/OAuth2). Benutzeridentität, Zeitpunkt und IP-Adresse werden im Audit-Log
                revisionssicher gespeichert.
              </Text>
            </Paper>

            {/* Step 2 */}
            <Paper shadow="md" p="xl" radius="lg" withBorder>
              <Badge size="lg" variant="filled" color="violet" mb="md">
                Schritt 2
              </Badge>
              <Title order={3} size="h3" mb="md" c="violet">
                Signaturprozess
              </Title>
              <Text mb="sm">
                Nach Bestätigung wird aus dem PDF-Inhalt ein <strong>Hash-Wert (SHA-256)</strong>{' '}
                gebildet. Der Auth-Server speichert:
              </Text>
              <List size="sm">
                <List.Item>Benutzer-ID</List.Item>
                <List.Item>Dokument-ID</List.Item>
                <List.Item>Hash-Wert</List.Item>
                <List.Item>Zeitstempel (UTC)</List.Item>
                <List.Item>Signatur-Status</List.Item>
              </List>
            </Paper>

            {/* Step 3 */}
            <Paper shadow="md" p="xl" radius="lg" withBorder>
              <Badge size="lg" variant="filled" color="green" mb="md">
                Schritt 3
              </Badge>
              <Title order={3} size="h3" mb="md" c="green">
                PDF-Erweiterung
              </Title>
              <Text>
                Im PDF wird ein <strong>Barcode (QR-Code)</strong> eingefügt, der einen Prüflink
                enthält. Über diesen Link kann jederzeit die Echtheit des Dokuments überprüft werden.
              </Text>
            </Paper>

            {/* Step 4 */}
            <Paper shadow="md" p="xl" radius="lg" withBorder>
              <Badge size="lg" variant="filled" color="orange" mb="md">
                Schritt 4
              </Badge>
              <Title order={3} size="h3" mb="md" c="orange">
                Archivierung
              </Title>
              <Text>
                Das signierte PDF wird unveränderbar in einem <strong>WORM-fähigen Speicher</strong>{' '}
                (Write Once Read Many) archiviert. Änderungen sind technisch ausgeschlossen. Alle
                Aktionen werden protokolliert (Audit-Trail).
              </Text>
            </Paper>

            {/* Step 5 */}
            <Paper shadow="md" p="xl" radius="lg" withBorder>
              <Badge size="lg" variant="filled" color="red" mb="md">
                Schritt 5
              </Badge>
              <Title order={3} size="h3" mb="md" c="red">
                Prüfung
              </Title>
              <Text mb="sm">
                Ein Prüfer kann den Barcode scannen und erhält auf der Prüfseite:
              </Text>
              <List size="sm">
                <List.Item>Name des Unterzeichners</List.Item>
                <List.Item>Zeitpunkt der Signatur</List.Item>
                <List.Item>Hash-Vergleich (Original / verändert)</List.Item>
                <List.Item>Statusmeldung „gültig" / „ungültig"</List.Item>
              </List>
            </Paper>
          </SimpleGrid>

          {/* Diagram */}
          <Paper shadow="lg" p="xl" radius="lg" mt="xl" bg="gradient-to-br from-gray-50 to-gray-100">
            <Title order={3} ta="center" mb="md">
              Verfahrensablauf visualisiert
            </Title>
            <Image
              src="/images/GoBD.png"
              alt="GoBD Verfahrensablauf: Benutzer → Auth-Server/Audit-Log → Signatur-API/PDF-Hasher → Archiv (WORM) mit QR-Code → Prüfer/Finanzamt"
              fit="contain"
              maw={700}
              mx="auto"
            />
            <Text size="sm" c="dimmed" ta="center" mt="md">
              <strong>Abbildung:</strong> Vollständiger Verfahrensablauf der digitalen Signatur und
              Prüfung
            </Text>
          </Paper>
        </div>

        {/* Section 3: Verantwortlichkeiten */}
        <Paper shadow="xs" p="xl" radius="md">
          <Title order={2} mb="md">
            3. Verantwortlichkeiten
          </Title>
          <List>
            <List.Item>
              <strong>Benutzer:</strong> Korrekte Erfassung und Unterzeichnung der Dokumente
            </List.Item>
            <List.Item>
              <strong>Auth-Server Administrator:</strong> Betrieb und Wartung des
              Authentifizierungssystems
            </List.Item>
            <List.Item>
              <strong>Archiv-Verantwortlicher:</strong> Sicherstellung der WORM-Speicherung und
              Backup
            </List.Item>
            <List.Item>
              <strong>Datenschutzbeauftragter:</strong> Einhaltung der DSGVO-Anforderungen
            </List.Item>
            <List.Item>
              <strong>IT-Sicherheit:</strong> Monitoring, Incident Response, regelmäßige
              Sicherheitsprüfungen
            </List.Item>
          </List>
        </Paper>

        {/* Section 4: Revisionssicherheit */}
        <Box
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '48px',
            color: 'white',
          }}
        >
          <Title order={2} mb="xl" ta="center" c="white">
            Ihre Sicherheitsgarantien
          </Title>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Group align="flex-start">
              <ThemeIcon size={40} radius="md" variant="white" color="dark">
                <IconShieldCheck size={24} />
              </ThemeIcon>
              <div style={{ flex: 1 }}>
                <Text fw={700} size="lg" mb="xs">
                  Integrität
                </Text>
                <Text size="sm" opacity={0.9}>
                  SHA-256-Hash sichert den Inhalt gegen jede Form von Manipulation.
                </Text>
              </div>
            </Group>

            <Group align="flex-start">
              <ThemeIcon size={40} radius="md" variant="white" color="dark">
                <IconFileCheck size={24} />
              </ThemeIcon>
              <div style={{ flex: 1 }}>
                <Text fw={700} size="lg" mb="xs">
                  Authentizität
                </Text>
                <Text size="sm" opacity={0.9}>
                  Signatur ist eindeutig an den eingeloggten Benutzer gebunden.
                </Text>
              </div>
            </Group>

            <Group align="flex-start">
              <ThemeIcon size={40} radius="md" variant="white" color="dark">
                <IconLock size={24} />
              </ThemeIcon>
              <div style={{ flex: 1 }}>
                <Text fw={700} size="lg" mb="xs">
                  Unveränderbarkeit
                </Text>
                <Text size="sm" opacity={0.9}>
                  WORM-Archivierung verhindert nachträgliche Änderungen technisch.
                </Text>
              </div>
            </Group>

            <Group align="flex-start">
              <ThemeIcon size={40} radius="md" variant="white" color="dark">
                <IconEye size={24} />
              </ThemeIcon>
              <div style={{ flex: 1 }}>
                <Text fw={700} size="lg" mb="xs">
                  Nachvollziehbarkeit
                </Text>
                <Text size="sm" opacity={0.9}>
                  Vollständige Audit-Logs dokumentieren alle Aktionen lückenlos.
                </Text>
              </div>
            </Group>

            <Group align="flex-start">
              <ThemeIcon size={40} radius="md" variant="white" color="dark">
                <IconFileCheck size={24} />
              </ThemeIcon>
              <div style={{ flex: 1 }}>
                <Text fw={700} size="lg" mb="xs">
                  Dokumentation
                </Text>
                <Text size="sm" opacity={0.9}>
                  Diese Verfahrensbeschreibung ist Bestandteil der GoBD-Systemdokumentation.
                </Text>
              </div>
            </Group>
          </SimpleGrid>
        </Box>

        {/* Section 5: Aufbewahrung */}
        <Paper shadow="md" p="xl" radius="lg" withBorder>
          <Group gap="md" mb="lg">
            <ThemeIcon size={40} radius="md" variant="light" color="orange">
              <IconClock size={24} />
            </ThemeIcon>
            <Title order={2}>
              Aufbewahrung und Zugriff
            </Title>
          </Group>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <List
              spacing="md"
              size="sm"
              icon={
                <ThemeIcon size={24} radius="xl" variant="light" color="blue">
                  <IconFileCheck size={16} />
                </ThemeIcon>
              }
            >
              <List.Item>
                <Text fw={600}>Aufbewahrungsdauer</Text>
                <Text size="sm" c="dimmed">10 Jahre gemäß § 147 AO</Text>
              </List.Item>
              <List.Item>
                <Text fw={600}>Zugriff</Text>
                <Text size="sm" c="dimmed">Nur für berechtigte Personen (rollenbasiert)</Text>
              </List.Item>
              <List.Item>
                <Text fw={600}>Prüfzugriff</Text>
                <Text size="sm" c="dimmed">Für Finanzbehörden über QR-Link oder Archiv-Export</Text>
              </List.Item>
            </List>
            <List
              spacing="md"
              size="sm"
              icon={
                <ThemeIcon size={24} radius="xl" variant="light" color="violet">
                  <IconShieldCheck size={16} />
                </ThemeIcon>
              }
            >
              <List.Item>
                <Text fw={600}>Backup</Text>
                <Text size="sm" c="dimmed">Tägliche Sicherung in geografisch getrennten Rechenzentren</Text>
              </List.Item>
              <List.Item>
                <Text fw={600}>Wiederherstellung</Text>
                <Text size="sm" c="dimmed">Dokumentierte Recovery-Verfahren mit definierten RTOs</Text>
              </List.Item>
              <List.Item>
                <Text fw={600}>Datenexport</Text>
                <Text size="sm" c="dimmed">PDF + vollständiger Audit-Trail jederzeit verfügbar</Text>
              </List.Item>
            </List>
          </SimpleGrid>
        </Paper>

        {/* Footer - Call to Action */}
        <Paper
          shadow="xl"
          p="xl"
          radius="lg"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Title order={3} mb="md" c="white">
            Rechtssicher. Prüfbar. GoBD-konform.
          </Title>
          <Text size="lg" mb="md" opacity={0.95}>
            Diese Verfahrensdokumentation erfüllt alle Anforderungen der <strong>Grundsätze zur
            ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in
            elektronischer Form sowie zum Datenzugriff (GoBD)</strong> gemäß BMF-Schreiben vom
            28.11.2019.
          </Text>
          <Badge size="xl" variant="white" c="dark" mt="md">
            § 147 AO konform • 10 Jahre Archiv • Finanzamtgeprüft
          </Badge>
        </Paper>
      </Stack>
    </Container>
    </Box>
  );
}
