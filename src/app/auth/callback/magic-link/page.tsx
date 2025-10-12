'use client';

/**
 * Magic Link Callback Page
 * Handles session creation after magic link verification
 */

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Container, Paper, Title, Text, Loader, Alert, Stack } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

function MagicLinkCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    if (!searchParams) {
      console.error('[Magic Link Callback] No search params found');
      setError('Keine Parameter gefunden');
      setProcessing(false);
      return;
    }

    const email = searchParams.get('email');

    if (!email) {
      console.error('[Magic Link Callback] No email parameter found');
      setError('Keine E-Mail-Adresse gefunden');
      setProcessing(false);
      return;
    }

    console.log('[Magic Link Callback] Creating session for:', email);

    // Create a NextAuth session for the verified email
    const createSession = async () => {
      try {
        // Sign in with magic-link provider (email already verified)
        console.log('[Magic Link Callback] Calling signIn with magic-link provider');
        const result = await signIn('magic-link', {
          email,
          redirect: false,
        });

        console.log('[Magic Link Callback] signIn result:', result);

        if (result?.error) {
          console.error('[Magic Link Callback] signIn error:', result.error);
          setError(`Anmeldung fehlgeschlagen: ${result.error}`);
          setProcessing(false);
          return;
        }

        // Session created successfully, redirect to app
        console.log('[Magic Link Callback] Session created successfully, redirecting to /bewirtungsbeleg');
        router.push('/bewirtungsbeleg');
      } catch (err) {
        console.error('[Magic Link Callback] Session creation error:', err);
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
                <a href="/auth/anmelden">melden Sie sich an</a>.
              </Text>
            </>
          ) : null}
        </Stack>
      </Paper>
    </Container>
  );
}

export default function MagicLinkCallbackPage() {
  return (
    <Suspense fallback={<div />}>
      <MagicLinkCallbackContent />
    </Suspense>
  );
}
