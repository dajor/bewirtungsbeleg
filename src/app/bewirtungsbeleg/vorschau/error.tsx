'use client';

import { Container, Alert, Button, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Vorschau page error:', error);
  }, [error]);

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Alert color="red" title="Ein Fehler ist aufgetreten" icon={<IconAlertCircle />}>
          <Text size="sm" mb="md">
            {error.message || 'Beim Laden der Vorschau ist ein Fehler aufgetreten.'}
          </Text>
          <Button onClick={reset} size="sm">
            Erneut versuchen
          </Button>
        </Alert>
      </Stack>
    </Container>
  );
}
