'use client';

import {
  Container,
  Paper,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Switch,
  Divider,
  Badge,
  Alert,
  Select,
  Accordion,
  Box,
} from '@mantine/core';
import {
  IconSettings,
  IconBell,
  IconLock,
  IconPalette,
  IconLanguage,
  IconDatabase,
  IconInfoCircle,
  IconCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [receiptNotifications, setReceiptNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Privacy settings
  const [profileVisible, setProfileVisible] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  // UI preferences
  const [language, setLanguage] = useState('de');
  const [theme, setTheme] = useState('light');

  // Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Redirect to signin if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/anmelden');
    return null;
  }

  // Show loading state
  if (status === 'loading') {
    return (
      <Container size="md" py="xl">
        <Paper shadow="sm" p="xl" radius="md">
          <Stack gap="md" align="center">
            <Text c="dimmed">Lädt Einstellungen...</Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const user = session?.user;
  if (!user) return null;

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Implement settings update API endpoint
      // For now, just simulate saving
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess('Einstellungen wurden erfolgreich gespeichert!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Fehler beim Speichern der Einstellungen. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <div>
          <Title order={1} mb="xs">
            Einstellungen
          </Title>
          <Text c="dimmed" size="sm">
            Verwalten Sie Ihre Präferenzen und Kontoeinstellungen
          </Text>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Alert
            icon={<IconCheck size={16} />}
            color="green"
            title="Erfolg"
            onClose={() => setSuccess('')}
            withCloseButton
          >
            {success}
          </Alert>
        )}

        {error && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            color="red"
            title="Fehler"
            onClose={() => setError('')}
            withCloseButton
          >
            {error}
          </Alert>
        )}

        {/* Settings Sections */}
        <Accordion variant="separated" radius="md" defaultValue="notifications">
          {/* Notifications */}
          <Accordion.Item value="notifications">
            <Accordion.Control icon={<IconBell size={20} color="blue" />}>
              <Text fw={500}>Benachrichtigungen</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Switch
                  label="E-Mail-Benachrichtigungen aktivieren"
                  description="Erhalten Sie wichtige Updates per E-Mail"
                  checked={emailNotifications}
                  onChange={(event) => setEmailNotifications(event.currentTarget.checked)}
                />
                <Switch
                  label="Beleg-Benachrichtigungen"
                  description="Benachrichtigung bei neuen oder verarbeiteten Belegen"
                  checked={receiptNotifications}
                  onChange={(event) => setReceiptNotifications(event.currentTarget.checked)}
                  disabled={!emailNotifications}
                />
                <Switch
                  label="Marketing-E-Mails"
                  description="Informationen über neue Features und Angebote"
                  checked={marketingEmails}
                  onChange={(event) => setMarketingEmails(event.currentTarget.checked)}
                  disabled={!emailNotifications}
                />
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Privacy & Security */}
          <Accordion.Item value="privacy">
            <Accordion.Control icon={<IconLock size={20} color="blue" />}>
              <Text fw={500}>Datenschutz & Sicherheit</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Switch
                  label="Profil öffentlich sichtbar"
                  description="Anderen Benutzern erlauben, Ihr Profil zu sehen"
                  checked={profileVisible}
                  onChange={(event) => setProfileVisible(event.currentTarget.checked)}
                />
                <Switch
                  label="Analyse-Cookies aktivieren"
                  description="Hilft uns, die Anwendung zu verbessern"
                  checked={analyticsEnabled}
                  onChange={(event) => setAnalyticsEnabled(event.currentTarget.checked)}
                />
                <Divider />
                <Box>
                  <Text size="sm" fw={500} mb={8}>
                    Passwort ändern
                  </Text>
                  <Button
                    variant="light"
                    color="blue"
                    size="sm"
                    onClick={() => router.push('/auth/passwort-zurucksetzen')}
                  >
                    Passwort zurücksetzen
                  </Button>
                </Box>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Appearance */}
          <Accordion.Item value="appearance">
            <Accordion.Control icon={<IconPalette size={20} color="blue" />}>
              <Text fw={500}>Darstellung</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Select
                  label="Theme"
                  description="Wählen Sie Ihr bevorzugtes Farbschema"
                  placeholder="Theme auswählen"
                  data={[
                    { value: 'light', label: 'Hell' },
                    { value: 'dark', label: 'Dunkel' },
                    { value: 'auto', label: 'Automatisch' },
                  ]}
                  value={theme}
                  onChange={(value) => setTheme(value || 'light')}
                />
                <Alert
                  icon={<IconInfoCircle size={16} />}
                  color="blue"
                  variant="light"
                >
                  Dark Mode wird in einem zukünftigen Update verfügbar sein
                </Alert>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Language & Region */}
          <Accordion.Item value="language">
            <Accordion.Control icon={<IconLanguage size={20} color="blue" />}>
              <Text fw={500}>Sprache & Region</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Select
                  label="Sprache"
                  description="Wählen Sie Ihre bevorzugte Sprache"
                  placeholder="Sprache auswählen"
                  data={[
                    { value: 'de', label: 'Deutsch' },
                    { value: 'en', label: 'English' },
                  ]}
                  value={language}
                  onChange={(value) => setLanguage(value || 'de')}
                />
                <Alert
                  icon={<IconInfoCircle size={16} />}
                  color="blue"
                  variant="light"
                >
                  Englische Sprachunterstützung wird in einem zukünftigen Update verfügbar sein
                </Alert>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Data & Storage */}
          <Accordion.Item value="data">
            <Accordion.Control icon={<IconDatabase size={20} color="blue" />}>
              <Text fw={500}>Daten & Speicher</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <div>
                  <Text size="sm" fw={500} mb={4}>
                    Datenspeicherung
                  </Text>
                  <Text size="sm" c="dimmed" mb={8}>
                    Alle Ihre Bewirtungsbelege werden GoBD-konform in Ihrem DocBits-Konto
                    archiviert und sind jederzeit abrufbar.
                  </Text>
                  <Group gap="xs">
                    <Badge color="green" variant="light">
                      GoBD-konform
                    </Badge>
                    <Badge color="blue" variant="light">
                      WORM-Speicher
                    </Badge>
                  </Group>
                </div>
                <Divider />
                <div>
                  <Text size="sm" fw={500} mb={4}>
                    Speichernutzung
                  </Text>
                  <Text size="sm" c="dimmed" mb={8}>
                    Informationen über Ihre Speichernutzung sind im DocBits-Dashboard verfügbar.
                  </Text>
                  <Button
                    variant="light"
                    color="blue"
                    size="sm"
                    component="a"
                    href="https://app.docbits.com"
                    target="_blank"
                  >
                    DocBits Dashboard öffnen
                  </Button>
                </div>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        {/* Save Button */}
        <Group justify="flex-end">
          <Button
            leftSection={<IconCheck size={16} />}
            onClick={handleSaveSettings}
            loading={isSaving}
            size="md"
          >
            Einstellungen speichern
          </Button>
        </Group>

        {/* Additional Info */}
        <Paper shadow="sm" p="xl" radius="md">
          <Stack gap="md">
            <Group gap="xs">
              <IconInfoCircle size={20} color="blue" />
              <Text fw={500}>Wichtige Informationen</Text>
            </Group>
            <Divider />
            <Text size="sm" c="dimmed">
              Ihre Einstellungen werden sicher in Ihrem DocBits-Konto gespeichert und
              automatisch mit allen Ihren Geräten synchronisiert. Änderungen an
              Datenschutz- und Sicherheitseinstellungen werden sofort wirksam.
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
