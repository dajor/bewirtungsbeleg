'use client';

/**
 * Magic Link Callback Page
 * Handles session creation after magic link verification
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Container, Paper, Title, Text, Loader, Alert, Stack } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

export default function MagicLinkCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    if (!searchParams) {
      setError('Keine Parameter gefunden');
      setProcessing(false);
      return;
    }

    const email = searchParams.get('email');

    if (!email) {
      setError('Keine E-Mail-Adresse gefunden');
      setProcessing(false);
      return;
    }

    // Create a NextAuth session for the verified email
    const createSession = async () => {
      try {
        // Sign in with magic-link provider (email already verified)
        const result = await signIn('magic-link', {
          email,
          redirect: false,
        });

        if (result?.error) {
          setError('Anmeldung fehlgeschlagen');
          setProcessing(false);
          return;
        }

        // Session created successfully, redirect to app
        router.push('/bewirtungsbeleg');
      } catch (err) {
        console.error('Session creation error:', err);
        setError('Fehler beim Erstellen der Sitzung');
        setProcessing(false);
      }
    };

    createSession();
  }, [searchParams, router]);

  return (
    <Container size="xs" py={80}>
      <Paper p="xl" radius="md" withBorder>
        <Stack gap="md" align="center">
          {processing ? (
            <>
              <Loader size="lg" />
              <Title order={2} ta="center">
                Anmeldung wird verarbeitet...
              </Title>
              <Text size="sm" c="dimmed" ta="center">
                Einen Moment bitte, wir erstellen Ihre Sitzung.
              </Text>
            </>
          ) : error ? (
            <>
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Fehler"
                color="red"
              >
                {error}
              </Alert>
              <Text size="sm" ta="center">
                Bitte versuchen Sie es erneut oder{' '}
                <a href="/auth/signin">melden Sie sich an</a>.
              </Text>
            </>
          ) : null}
        </Stack>
      </Paper>
    </Container>
  );
}
