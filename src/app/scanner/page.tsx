'use client';

import { useState, useEffect } from 'react';
import { Container, Stack, Button, Title, Paper, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the scanner component to prevent server-side rendering issues
const DocumentScanner = dynamic(
  () => import('@/components/DocumentScanner'),
  { ssr: false, loading: () => <div>Lade Scanner...</div> }
);

export default function ScannerPage() {
  const [imageData, setImageData] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Confirm we're on a mobile device
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile) {
      // For desktop users, redirect to main form
      router.push('/bewirtungsbeleg');
    }
  }, [router]);

  const handleCapture = (dataUrl: string) => {
    setImageData(dataUrl);
  };

  if (imageData) {
    return (
      <Container size="xs" py="xl">
        <Stack align="center">
          <Title order={2} mb="xl">Scan Erfolgreich</Title>
          <Paper withBorder shadow="md" p="md">
            <img src={imageData} alt="Gescanntes Dokument" style={{ width: '100%', height: 'auto' }} />
          </Paper>
          <Button onClick={() => setImageData(null)}>Neues Dokument scannen</Button>
          <Button variant="outline" onClick={() => router.push('/bewirtungsbeleg')}>
            Zurück zum Formular
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xs" py="xl" style={{ height: '100%' }}>
      <Stack justify="space-between" style={{ height: '100%' }}>
        <Title order={2} align="center" mb="xl">
          Dokument Scanner
        </Title>
        
        <Paper withBorder shadow="md" p="md">
          <Text align="center" mb="md">
            Richten Sie das Dokument in den Bereich ein und drücken Sie auf Aufnehmen
          </Text>
        </Paper>
        
        <DocumentScanner onCapture={handleCapture} />
      </Stack>
    </Container>
  );
}