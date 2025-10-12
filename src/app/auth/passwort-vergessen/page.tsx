'use client';

import {
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Container,
  Stack,
  Alert,
  Image,
  rem,
  Anchor,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCheck, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => {
        if (!value) return 'E-Mail ist erforderlich';
        if (!/^\S+@\S+$/.test(value)) return 'Ungültige E-Mail-Adresse';
        return null;
      },
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implement password reset API call to DocBits
      const response = await fetch('/api/auth/passwort-vergessen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Zurücksetzen des Passworts');
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
              <Title order={2} data-testid="forgot-password-success">E-Mail versendet!</Title>
              <Text c="dimmed" ta="center">
                Wir haben Ihnen eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts gesendet.
                Bitte überprüfen Sie auch Ihren Spam-Ordner.
              </Text>
            </Stack>
            <Button
              component={Link}
              href="/auth/anmelden"
              variant="light"
              fullWidth
              leftSection={<IconArrowLeft size={16} />}
            >
              Zurück zur Anmeldung
            </Button>
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

        {/* Forgot Password Card */}
        <Paper radius="md" p="xl" withBorder>
          <Stack gap={rem(24)}>
            <Stack gap={rem(8)} align="center">
              <Title order={2} ta="center">
                Passwort vergessen?
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
              </Text>
            </Stack>

            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Fehler"
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
                <TextInput
                  label="E-Mail"
                  placeholder="ihre@email.de"
                  size="md"
                  {...form.getInputProps('email')}
                  disabled={loading}
                  required
                  data-testid="forgot-password-email"
                />

                <Button
                  type="submit"
                  size="md"
                  fullWidth
                  loading={loading}
                  data-testid="forgot-password-submit"
                >
                  Passwort zurücksetzen
                </Button>
              </Stack>
            </form>

            <Stack gap={rem(8)}>
              <Text c="dimmed" size="sm" ta="center">
                <Anchor
                  component={Link}
                  href="/auth/anmelden"
                  size="sm"
                  c="dimmed"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: rem(4) }}
                >
                  <IconArrowLeft size={14} />
                  Zurück zur Anmeldung
                </Anchor>
              </Text>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
