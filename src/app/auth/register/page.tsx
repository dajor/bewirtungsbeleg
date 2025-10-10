'use client';

import {
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Container,
  Group,
  Anchor,
  Stack,
  Checkbox,
  Alert,
  Image,
  Divider,
  rem,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      acceptTerms: false,
    },
    validate: {
      firstName: (value) => (!value ? 'Vorname ist erforderlich' : null),
      lastName: (value) => (!value ? 'Nachname ist erforderlich' : null),
      email: (value) => {
        if (!value) return 'E-Mail ist erforderlich';
        if (!/^\S+@\S+$/.test(value)) return 'Ungültige E-Mail-Adresse';
        return null;
      },
      acceptTerms: (value) =>
        !value ? 'Sie müssen die AGB und Datenschutzbestimmungen akzeptieren' : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);
      setError(null);

      // Send email verification link
      const response = await fetch('/api/auth/register/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registrierung fehlgeschlagen');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container size={450} my={rem(80)}>
        <Paper radius="md" p="xl" withBorder>
          <Stack gap={rem(24)} align="center">
            <div
              style={{
                width: rem(56),
                height: rem(56),
                borderRadius: '50%',
                backgroundColor: '#E7F5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconCheck size={32} color="#228BE6" />
            </div>
            <Stack gap={rem(8)} align="center">
              <Title order={2}>E-Mail gesendet!</Title>
              <Text c="dimmed" ta="center">
                Wir haben Ihnen einen Bestätigungslink per E-Mail gesendet.
                Bitte prüfen Sie Ihr Postfach und klicken Sie auf den Link,
                um Ihr Passwort zu erstellen und Ihr Konto zu aktivieren.
              </Text>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={450} my={rem(80)}>
      <Stack gap={rem(32)}>
        {/* Logo */}
        <Stack align="center">
          <Link href="/">
            <Image
              src="/docbits.svg"
              alt="DocBits"
              width={180}
              height={45}
              fit="contain"
            />
          </Link>
        </Stack>

        {/* Register Card */}
        <Paper radius="md" p="xl" withBorder>
          <Stack gap={rem(24)}>
            <Stack gap={rem(8)} align="center">
              <Title order={2} ta="center">
                Konto erstellen
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                Erstellen Sie ein kostenloses Konto
              </Text>
            </Stack>

            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Registrierungsfehler"
                color="red"
                variant="light"
                onClose={() => setError(null)}
                withCloseButton
              >
                {error}
              </Alert>
            )}

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap={rem(16)}>
                <Group grow>
                  <TextInput
                    label="Vorname"
                    placeholder="Max"
                    size="md"
                    {...form.getInputProps('firstName')}
                    disabled={loading}
                    required
                  />
                  <TextInput
                    label="Nachname"
                    placeholder="Mustermann"
                    size="md"
                    {...form.getInputProps('lastName')}
                    disabled={loading}
                    required
                  />
                </Group>

                <TextInput
                  label="E-Mail"
                  placeholder="ihre@email.de"
                  size="md"
                  {...form.getInputProps('email')}
                  disabled={loading}
                  required
                />

                <Text size="xs" c="dimmed">
                  Sie erhalten eine E-Mail mit einem Link zum Erstellen Ihres Passworts.
                </Text>

                <Checkbox
                  label={
                    <Text size="sm">
                      Ich akzeptiere die{' '}
                      <Anchor component={Link} href="/terms" target="_blank" size="sm">
                        AGB
                      </Anchor>{' '}
                      und{' '}
                      <Anchor component={Link} href="/privacy" target="_blank" size="sm">
                        Datenschutzbestimmungen
                      </Anchor>
                    </Text>
                  }
                  {...form.getInputProps('acceptTerms', { type: 'checkbox' })}
                  disabled={loading}
                  required
                />

                <Button type="submit" size="md" fullWidth loading={loading}>
                  Registrieren
                </Button>
              </Stack>
            </form>

            <Divider label="oder" labelPosition="center" />

            <Text c="dimmed" size="sm" ta="center">
              Haben Sie bereits ein Konto?{' '}
              <Anchor component={Link} href="/auth/signin" fw={500}>
                Jetzt anmelden
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
