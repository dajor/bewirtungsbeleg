'use client';

export const dynamic = 'force-dynamic';

import { useSearchParams } from 'next/navigation';
import { Container, Title, Text, Button, Paper } from '@mantine/core';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'Configuration':
        return 'Es gibt ein Problem mit der Server-Konfiguration.';
      case 'AccessDenied':
        return 'Sie haben keine Berechtigung, auf diese Ressource zuzugreifen.';
      case 'Verification':
        return 'Der Verifizierungslink ist abgelaufen oder wurde bereits verwendet.';
      default:
        return 'Ein Fehler ist bei der Authentifizierung aufgetreten.';
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" className="text-2xl font-bold">
        Authentifizierungsfehler
      </Title>
      
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Text c="dimmed" size="sm" ta="center" mb={20}>
          {getErrorMessage()}
        </Text>
        
        <Button fullWidth component={Link} href="/auth/signin">
          Zurück zur Anmeldung
        </Button>
      </Paper>
    </Container>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}