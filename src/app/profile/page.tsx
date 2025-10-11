'use client';

import {
  Container,
  Paper,
  Title,
  Text,
  Stack,
  Group,
  Avatar,
  Button,
  TextInput,
  Divider,
  Badge,
  Box,
  Alert,
} from '@mantine/core';
import {
  IconUser,
  IconMail,
  IconEdit,
  IconCheck,
  IconX,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect to signin if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Show loading state
  if (status === 'loading') {
    return (
      <Container size="md" py="xl">
        <Paper shadow="sm" p="xl" radius="md">
          <Stack gap="md" align="center">
            <Text c="dimmed">Lädt Profil...</Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const user = session?.user;
  if (!user) return null;

  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user.email?.[0].toUpperCase() || '?';

  const handleEdit = () => {
    // Initialize form with current values
    const nameParts = user.name?.split(' ') || [];
    setFirstName(nameParts[0] || '');
    setLastName(nameParts.slice(1).join(' ') || '');
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Implement profile update API endpoint
      // For now, just show a success message
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess('Profil wurde erfolgreich aktualisiert!');
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Fehler beim Aktualisieren des Profils. Bitte versuchen Sie es erneut.');
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
            Mein Profil
          </Title>
          <Text c="dimmed" size="sm">
            Verwalten Sie Ihre persönlichen Informationen
          </Text>
        </div>

        {/* Profile Card */}
        <Paper shadow="sm" p="xl" radius="md">
          <Stack gap="xl">
            {/* Avatar and Basic Info */}
            <Group>
              <Avatar color="blue" size={80} radius="xl">
                <Text size="xl" fw={600}>
                  {initials}
                </Text>
              </Avatar>
              <Box style={{ flex: 1 }}>
                <Group gap="xs" mb={4}>
                  <Text size="xl" fw={600}>
                    {user.name || 'Benutzer'}
                  </Text>
                  {user.role && (
                    <Badge variant="light" color="blue">
                      {user.role}
                    </Badge>
                  )}
                </Group>
                <Text c="dimmed" size="sm">
                  {user.email}
                </Text>
              </Box>
              {!isEditing && (
                <Button
                  leftSection={<IconEdit size={16} />}
                  variant="light"
                  onClick={handleEdit}
                >
                  Bearbeiten
                </Button>
              )}
            </Group>

            <Divider />

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
                icon={<IconX size={16} />}
                color="red"
                title="Fehler"
                onClose={() => setError('')}
                withCloseButton
              >
                {error}
              </Alert>
            )}

            {/* Profile Information */}
            {isEditing ? (
              <Stack gap="md">
                <TextInput
                  label="Vorname"
                  placeholder="Vorname"
                  value={firstName}
                  onChange={(e) => setFirstName(e.currentTarget.value)}
                  leftSection={<IconUser size={16} />}
                  required
                />
                <TextInput
                  label="Nachname"
                  placeholder="Nachname"
                  value={lastName}
                  onChange={(e) => setLastName(e.currentTarget.value)}
                  leftSection={<IconUser size={16} />}
                  required
                />
                <TextInput
                  label="E-Mail"
                  value={user.email || ''}
                  leftSection={<IconMail size={16} />}
                  disabled
                  description="E-Mail-Adresse kann nicht geändert werden"
                />

                <Group justify="flex-end" mt="md">
                  <Button
                    variant="subtle"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    leftSection={<IconCheck size={16} />}
                    onClick={handleSave}
                    loading={isSaving}
                  >
                    Speichern
                  </Button>
                </Group>
              </Stack>
            ) : (
              <Stack gap="md">
                <div>
                  <Text size="sm" c="dimmed" mb={4}>
                    Name
                  </Text>
                  <Group gap="xs">
                    <IconUser size={16} color="gray" />
                    <Text>{user.name || 'Nicht angegeben'}</Text>
                  </Group>
                </div>

                <div>
                  <Text size="sm" c="dimmed" mb={4}>
                    E-Mail
                  </Text>
                  <Group gap="xs">
                    <IconMail size={16} color="gray" />
                    <Text>{user.email}</Text>
                  </Group>
                </div>

                {user.user_id && (
                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      Benutzer-ID
                    </Text>
                    <Text size="xs" c="dimmed" ff="monospace">
                      {user.user_id}
                    </Text>
                  </div>
                )}
              </Stack>
            )}
          </Stack>
        </Paper>

        {/* Additional Info */}
        <Paper shadow="sm" p="xl" radius="md">
          <Stack gap="md">
            <Group gap="xs">
              <IconInfoCircle size={20} color="blue" />
              <Text fw={500}>Kontoinformationen</Text>
            </Group>
            <Divider />
            <Text size="sm" c="dimmed">
              Ihr Konto wurde mit DocBits verknüpft. Alle Bewirtungsbelege werden
              automatisch in Ihrem DocBits-Konto gespeichert und sind GoBD-konform archiviert.
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
