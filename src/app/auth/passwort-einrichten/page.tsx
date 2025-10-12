'use client';

/**
 * Password Setup Page
 * Allows users to set their password after email verification
 */

import React from 'react';
import {
  Paper,
  Title,
  Text,
  PasswordInput,
  Button,
  Container,
  Stack,
  Alert,
  Loader,
  Group,
  Progress,
  rem,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCheck, IconLock } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function getPasswordStrength(password: string): { strength: number; label: string; color: string } {
  let strength = 0;

  if (password.length > 7) strength += 25;
  if (password.length > 11) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 20;
  if (/\d/.test(password)) strength += 15;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 15;

  if (strength <= 40) return { strength, label: 'Schwach', color: 'red' };
  if (strength <= 60) return { strength, label: 'Mittel', color: 'yellow' };
  if (strength <= 80) return { strength, label: 'Gut', color: 'blue' };
  return { strength, label: 'Sehr gut', color: 'green' };
}

function SetupPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    if (!tokenParam) {
      setError('Kein Token gefunden. Bitte verwenden Sie den Link aus Ihrer E-Mail.');
      setVerifying(false);
    } else {
      setToken(tokenParam);
      verifyToken(tokenParam);
    }
  }, [searchParams]);

  const verifyToken = async (tokenValue: string) => {
    console.log('[setup-password] Starting token verification for:', tokenValue);
    try {
      // Verify token is valid
      console.log('[setup-password] Fetching /api/auth/verify-email...');
      const response = await fetch(`/api/auth/verify-email?token=${tokenValue}`, {
        method: 'GET',
      });

      console.log('[setup-password] Response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.log('[setup-password] Verification failed:', data);
        setError(data.error || 'Ungültiger oder abgelaufener Link');
        setVerifying(false);
        return;
      }

      const data = await response.json();
      console.log('[setup-password] Verification successful:', data);
      setEmail(data.email);
      setVerifying(false);
      console.log('[setup-password] State updated, should show form now');
    } catch (err) {
      console.error('[setup-password] Token verification error:', err);
      setError('Fehler beim Verifizieren des Tokens');
      setVerifying(false);
    }
  };

  const form = useForm({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validate: {
      password: (value) => {
        if (!value) return 'Passwort ist erforderlich';
        if (value.length < 8) return 'Passwort muss mindestens 8 Zeichen lang sein';
        if (!/[A-Z]/.test(value)) return 'Passwort muss mindestens einen Großbuchstaben enthalten';
        if (!/[a-z]/.test(value)) return 'Passwort muss mindestens einen Kleinbuchstaben enthalten';
        if (!/[0-9]/.test(value)) return 'Passwort muss mindestens eine Zahl enthalten';
        return null;
      },
      confirmPassword: (value, values) => {
        if (!value) return 'Passwortbestätigung ist erforderlich';
        if (value !== values.password) return 'Passwörter stimmen nicht überein';
        return null;
      },
    },
  });

  const passwordStrength = useMemo(
    () => getPasswordStrength(form.values.password),
    [form.values.password]
  );

  const handleSubmit = async (values: typeof form.values) => {
    if (!token) {
      setError('Kein Token gefunden');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/passwort-einrichten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Fehler beim Erstellen des Passworts');
        return;
      }

      setSuccess(true);

      // Auto-login with the newly created credentials
      console.log('[Setup Password] Password setup successful, auto-logging in...');

      try {
        const signInResult = await signIn('credentials', {
          email: data.email || email,
          password: values.password,
          redirect: false,
        });

        if (signInResult?.error) {
          console.error('[Setup Password] Auto-login failed:', signInResult.error);
          // Still show success but redirect to signin
          setTimeout(() => {
            router.push('/auth/anmelden?setup=success');
          }, 2000);
          return;
        }

        if (signInResult?.ok) {
          console.log('[Setup Password] Auto-login successful, redirecting to main app');
          // Redirect to main app after successful auto-login
          setTimeout(() => {
            router.push('/bewirtungsbeleg');
            router.refresh();
          }, 1500);
        }
      } catch (loginError) {
        console.error('[Setup Password] Auto-login error:', loginError);
        // Fallback to signin page
        setTimeout(() => {
          router.push('/auth/anmelden?setup=success');
        }, 2000);
      }
    } catch (err) {
      console.error('Setup password error:', err);
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <Container size="xs" py={80}>
        <Paper p="xl" radius="md" withBorder>
          <Stack gap="md" align="center">
            <Loader size="lg" />
            <Text size="sm" c="dimmed">
              E-Mail-Adresse wird verifiziert...
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (success) {
    return (
      <Container size="xs" py={80}>
        <Paper p="xl" radius="md" withBorder>
          <Stack gap="md" align="center">
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
            <Title order={2} ta="center">
              Konto erfolgreich erstellt!
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              Sie werden automatisch angemeldet...
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // Show friendly error state if token validation failed
  if (error && !verifying) {
    return (
      <Container size="xs" py={80}>
        <Paper p="xl" radius="md" withBorder>
          <Stack gap="md" align="center">
            <div
              style={{
                width: rem(56),
                height: rem(56),
                borderRadius: '50%',
                backgroundColor: '#FFE9E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconAlertCircle size={32} color="#FA5252" />
            </div>
            <Title order={2} ta="center">
              Link ungültig oder abgelaufen
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              {error}
            </Text>
            <Button
              component={Link}
              href="/auth/registrieren"
              variant="light"
              fullWidth
            >
              Zurück zur Registrierung
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xs" py={80}>
      <Paper p="xl" radius="md" withBorder>
        <Stack gap="md">
          <div>
            <Title order={2} ta="center">
              Passwort erstellen
            </Title>
            <Text size="sm" c="dimmed" ta="center" mt="xs">
              Erstellen Sie ein sicheres Passwort für {email}
            </Text>
          </div>

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Fehler"
              color="red"
            >
              {error}
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <div>
                <PasswordInput
                  label="Passwort"
                  placeholder="Mindestens 8 Zeichen"
                  required
                  leftSection={<IconLock size={16} />}
                  disabled={loading}
                  data-testid="setup-password"
                  {...form.getInputProps('password')}
                />
                {form.values.password && (
                  <div style={{ marginTop: rem(8) }}>
                    <Group justify="space-between" mb={4}>
                      <Text size="xs" c="dimmed">
                        Passwortstärke
                      </Text>
                      <Text size="xs" c={passwordStrength.color}>
                        {passwordStrength.label}
                      </Text>
                    </Group>
                    <Progress
                      value={passwordStrength.strength}
                      color={passwordStrength.color}
                      size="sm"
                    />
                  </div>
                )}
              </div>

              <PasswordInput
                label="Passwort bestätigen"
                placeholder="Passwort wiederholen"
                required
                leftSection={<IconLock size={16} />}
                disabled={loading}
                data-testid="setup-confirmPassword"
                {...form.getInputProps('confirmPassword')}
              />

              <Text size="xs" c="dimmed">
                Das Passwort muss mindestens 8 Zeichen lang sein und
                Groß- und Kleinbuchstaben sowie eine Zahl enthalten.
              </Text>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={!token}
                data-testid="setup-submit"
              >
                Konto erstellen
              </Button>
            </Stack>
          </form>

          <Group justify="center" mt="md">
            <Text size="sm" c="dimmed">
              Zurück zur{' '}
              <Text component={Link} href="/auth/anmelden" c="blue" td="underline" span>
                Anmeldung
              </Text>
            </Text>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <Container size="xs" py={80}>
          <Paper p="xl" radius="md" withBorder>
            <Stack gap="md" align="center">
              <Loader size="lg" />
            </Stack>
          </Paper>
        </Container>
      }
    >
      <SetupPasswordForm />
    </Suspense>
  );
}
