'use client';

import { useState } from 'react';

export const dynamic = 'force-dynamic';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Container,
  Title,
  Text,
  Stack,
  Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { Suspense } from 'react';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/bewirtungsbeleg';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setError('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" className="text-2xl font-bold">
        Anmelden
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Melden Sie sich mit Ihrem DocBits-Konto an
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Anmeldefehler"
                color="red"
                variant="light"
              >
                {error}
              </Alert>
            )}

            <TextInput
              label="Email"
              placeholder="ihre@email.de"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              disabled={isLoading}
            />

            <PasswordInput
              label="Passwort"
              placeholder="Ihr Passwort"
              required
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              disabled={isLoading}
            />

            <Button
              fullWidth
              mt="xl"
              type="submit"
              loading={isLoading}
              disabled={isLoading}
            >
              Anmelden
            </Button>
          </Stack>
        </form>

        <Text c="dimmed" size="xs" ta="center" mt={20}>
          Demo-Konten:
          <br />
          admin@docbits.com / admin123
          <br />
          user@docbits.com / user123
        </Text>
      </Paper>
    </Container>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}