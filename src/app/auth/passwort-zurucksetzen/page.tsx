'use client';

/**
 * Password Reset Page
 * Allows users to set a new password using a reset token
 */

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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCheck, IconLock } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [autoLoginStatus, setAutoLoginStatus] = useState<'pending' | 'success' | 'failed' | null>(null);

  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    if (!tokenParam) {
      setError('Kein Token gefunden. Bitte fordern Sie einen neuen Passwort-Reset-Link an.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

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

  const handleSubmit = async (values: typeof form.values) => {
    if (!token) {
      setError('Kein Token gefunden');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/passwort-zurucksetzen', {
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
        setError(data.error || 'Fehler beim Zurücksetzen des Passworts');
        return;
      }

      setSuccess(true);

      // Auto-login with the newly reset credentials
      console.log('[Reset Password] Password reset successful, auto-logging in...');
      setAutoLoginStatus('pending');

      // Add a small delay to ensure password is fully updated in the backend
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        const signInResult = await signIn('credentials', {
          email: data.email,
          password: values.password,
          redirect: false,
        });

        console.log('[Reset Password] SignIn result:', {
          ok: signInResult?.ok,
          error: signInResult?.error,
          status: signInResult?.status
        });

        if (signInResult?.error) {
          console.error('[Reset Password] Auto-login failed:', signInResult.error);
          setAutoLoginStatus('failed');

          // Show user-friendly error message
          setError(`Passwort wurde geändert, aber automatische Anmeldung fehlgeschlagen: ${signInResult.error}. Sie werden zur Anmeldeseite weitergeleitet...`);

          // Redirect to signin page with success message
          setTimeout(() => {
            router.push('/auth/anmelden?password_reset=success');
          }, 3000);
          return;
        }

        if (signInResult?.ok) {
          console.log('[Reset Password] Auto-login successful, redirecting to main app');
          setAutoLoginStatus('success');

          // Redirect to main app after successful auto-login
          setTimeout(() => {
            router.push('/bewirtungsbeleg');
            router.refresh();
          }, 1500);
        } else {
          // signInResult exists but neither ok nor error (edge case)
          console.warn('[Reset Password] Unexpected signIn result:', signInResult);
          setAutoLoginStatus('failed');
          setTimeout(() => {
            router.push('/auth/anmelden?password_reset=success');
          }, 2000);
        }
      } catch (loginError) {
        console.error('[Reset Password] Auto-login exception:', loginError);
        setAutoLoginStatus('failed');

        // Show error but still allow manual login
        setError('Passwort wurde geändert, aber automatische Anmeldung fehlgeschlagen. Sie werden zur Anmeldeseite weitergeleitet...');

        // Fallback to signin page
        setTimeout(() => {
          router.push('/auth/anmelden?password_reset=success');
        }, 3000);
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <Container size="xs" py={80}>
        <Paper p="xl" radius="md" withBorder>
          <Stack gap="md" align="center">
            <Loader size="lg" />
            <Text size="sm" c="dimmed">
              Token wird überprüft...
            </Text>
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
              Passwort zurücksetzen
            </Title>
            <Text size="sm" c="dimmed" ta="center" mt="xs">
              Geben Sie Ihr neues Passwort ein
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

          {success ? (
            <Alert
              icon={<IconCheck size={16} />}
              title="Erfolg"
              color="green"
              data-testid="reset-password-success"
            >
              {autoLoginStatus === 'pending' && 'Ihr Passwort wurde erfolgreich geändert. Sie werden automatisch angemeldet...'}
              {autoLoginStatus === 'success' && 'Ihr Passwort wurde erfolgreich geändert. Sie werden zur Anwendung weitergeleitet...'}
              {autoLoginStatus === 'failed' && 'Ihr Passwort wurde erfolgreich geändert. Sie werden zur Anmeldeseite weitergeleitet...'}
              {autoLoginStatus === null && 'Ihr Passwort wurde erfolgreich geändert. Sie werden automatisch angemeldet...'}
            </Alert>
          ) : (
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <PasswordInput
                  label="Neues Passwort"
                  placeholder="Mindestens 8 Zeichen"
                  required
                  leftSection={<IconLock size={16} />}
                  data-testid="reset-password-password"
                  {...form.getInputProps('password')}
                />

                <PasswordInput
                  label="Passwort bestätigen"
                  placeholder="Passwort wiederholen"
                  required
                  leftSection={<IconLock size={16} />}
                  data-testid="reset-password-confirmPassword"
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
                  data-testid="reset-password-submit"
                >
                  Passwort ändern
                </Button>
              </Stack>
            </form>
          )}

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

export default function ResetPasswordPage() {
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
      <ResetPasswordForm />
    </Suspense>
  );
}
