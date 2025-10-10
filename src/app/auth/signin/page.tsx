'use client';

import {
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Container,
  Group,
  Anchor,
  Stack,
  Checkbox,
  Divider,
  Alert,
  Image,
  rem,
  SegmentedControl,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconMail, IconCheck, IconLock } from '@tabler/icons-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

export const dynamic = 'force-dynamic';

type LoginMode = 'password' | 'magic-link';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams?.get('callbackUrl') || '/bewirtungsbeleg';

  // Handle URL error parameters
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'TokenAlreadyUsed': 'Dieser Magic Link wurde bereits verwendet. Bitte fordern Sie einen neuen Link an.',
        'TokenExpired': 'Dieser Magic Link ist abgelaufen. Magic Links sind 10 Minuten gültig. Bitte fordern Sie einen neuen Link an.',
        'MissingToken': 'Kein Anmelde-Token gefunden. Bitte verwenden Sie den vollständigen Link aus Ihrer E-Mail.',
        'InvalidToken': 'Ungültiger Anmelde-Link. Bitte fordern Sie einen neuen Link an.',
        'VerificationFailed': 'Die Verifizierung ist fehlgeschlagen. Bitte versuchen Sie es erneut.',
      };
      setError(errorMessages[errorParam] || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    }
  }, [searchParams]);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
    validate: {
      email: (value) => {
        if (!value) return 'E-Mail ist erforderlich';
        if (!/^\S+@\S+$/.test(value)) return 'Ungültige E-Mail-Adresse';
        return null;
      },
      password: (value) => {
        // Password is only required in password mode
        if (loginMode === 'password' && !value) return 'Passwort ist erforderlich';
        if (value && value.length < 6) return 'Passwort muss mindestens 6 Zeichen lang sein';
        return null;
      },
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (loginMode === 'magic-link') {
      // Magic link mode - send email
      try {
        setMagicLinkLoading(true);
        setError(null);

        const response = await fetch('/api/auth/magic-link/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: values.email }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Fehler beim Senden des Magic Links');
          return;
        }

        setMagicLinkSent(true);
      } catch (err) {
        setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      } finally {
        setMagicLinkLoading(false);
      }
    } else {
      // Password mode - regular login
      try {
        setLoading(true);
        setError(null);

        const result = await signIn('credentials', {
          email: values.email,
          password: values.password,
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
          return;
        }

        if (result?.ok) {
          router.push(callbackUrl);
          router.refresh();
        }
      } catch (err) {
        setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      } finally {
        setLoading(false);
      }
    }
  };

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

        {/* Sign In Card */}
        <Paper radius="md" p="xl" withBorder>
          <Stack gap={rem(24)}>
            <Stack gap={rem(8)} align="center">
              <Title order={2} ta="center">
                Willkommen zurück
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                Melden Sie sich an, um fortzufahren
              </Text>
            </Stack>

            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Anmeldefehler"
                color="red"
                variant="light"
                onClose={() => setError(null)}
                withCloseButton
              >
                {error}
              </Alert>
            )}

            {magicLinkSent && (
              <Alert
                icon={<IconCheck size={16} />}
                title="Magic Link gesendet"
                color="green"
                variant="light"
              >
                Wir haben Ihnen einen Anmelde-Link per E-Mail gesendet. Bitte prüfen Sie Ihr
                Postfach und klicken Sie auf den Link, um sich anzumelden.
              </Alert>
            )}

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap={rem(16)}>
                <SegmentedControl
                  fullWidth
                  value={loginMode}
                  onChange={(value) => {
                    setLoginMode(value as LoginMode);
                    setError(null);
                    setMagicLinkSent(false);
                  }}
                  data={[
                    {
                      label: (
                        <Group gap="xs" justify="center">
                          <IconLock size={16} />
                          <span>Passwort</span>
                        </Group>
                      ),
                      value: 'password',
                    },
                    {
                      label: (
                        <Group gap="xs" justify="center">
                          <IconMail size={16} />
                          <span>Magic Link</span>
                        </Group>
                      ),
                      value: 'magic-link',
                    },
                  ]}
                  disabled={loading || magicLinkLoading}
                />

                <TextInput
                  label="E-Mail"
                  placeholder="ihre@email.de"
                  size="md"
                  {...form.getInputProps('email')}
                  disabled={loading || magicLinkLoading}
                  required
                />

                {loginMode === 'password' && (
                  <>
                    <PasswordInput
                      label="Passwort"
                      placeholder="Ihr Passwort"
                      size="md"
                      {...form.getInputProps('password')}
                      disabled={loading}
                      required
                    />

                    <Group justify="space-between">
                      <Checkbox
                        label="Angemeldet bleiben"
                        size="sm"
                        {...form.getInputProps('rememberMe', { type: 'checkbox' })}
                        disabled={loading}
                      />
                      <Anchor
                        component={Link}
                        href="/auth/forgot-password"
                        size="sm"
                        c="dimmed"
                      >
                        Passwort vergessen?
                      </Anchor>
                    </Group>
                  </>
                )}

                <Button
                  type="submit"
                  size="md"
                  fullWidth
                  loading={loginMode === 'password' ? loading : magicLinkLoading}
                  disabled={magicLinkSent}
                >
                  {loginMode === 'password'
                    ? 'Anmelden'
                    : magicLinkSent
                      ? 'Magic Link gesendet'
                      : 'Magic Link senden'}
                </Button>
              </Stack>
            </form>

            <Text c="dimmed" size="sm" ta="center">
              Noch kein Konto?{' '}
              <Anchor component={Link} href="/auth/register" fw={500}>
                Jetzt registrieren
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<Container size={450} my={rem(80)}><Text>Laden...</Text></Container>}>
      <SignInForm />
    </Suspense>
  );
}
