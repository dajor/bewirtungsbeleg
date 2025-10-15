'use client';

import { useEffect } from 'react';
import { Container, Stack, Button, Title, Paper } from '@mantine/core';
import { isMobile } from 'react-device-detect';
import { useRouter } from 'next/navigation';

export default function BewirtungsbelegPWAPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dedicated scanner page
    router.push('/scanner');
  }, [router]);

  if (!isMobile) {
    return (
      <Container size="lg" py="xl">
        <Title order={2} align="center" mb="xl">
          Diese Seite ist für mobile Geräte optimiert.
        </Title>
        <Title order={4} align="center" mb="xl">
          Bitte öffnen Sie diese Seite auf Ihrem Smartphone oder Tablet.
        </Title>
      </Container>
    );
  }

  return (
    <Container size="xs" py="xl">
      <Stack align="center">
        <Title order={2}>Weiterleitung...</Title>
        <Paper withBorder shadow="md" p="md">
          <p>Sie werden zum Scanner weitergeleitet...</p>
        </Paper>
      </Stack>
    </Container>
  );
}

export default function BewirtungsbelegPWAPage() {
  const [showCamera, setShowCamera] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);

  if (!isMobile) {
    return (
      <Container size="lg" py="xl">
        <Title order={2} align="center" mb="xl">
          Diese Seite ist für mobile Geräte optimiert.
        </Title>
        <Title order={4} align="center" mb="xl">
          Bitte öffnen Sie diese Seite auf Ihrem Smartphone oder Tablet.
        </Title>
      </Container>
    );
  }

  const handleOpenCamera = () => {
    setShowCamera(true);
  };

  const handleCapture = (dataUrl: string) => {
    setImageData(dataUrl);
    setShowCamera(false);
  };

  return (
    <Container size="xs" py="xl" style={{ height: '100%' }}>
      <Stack justify="space-between" style={{ height: '100%' }}>
        <Title order={2} align="center" mb="xl">
          Bewirtungsbeleg Erfassen
        </Title>

        {showCamera && (
          <DocumentScanner onCapture={handleCapture} />
        )}

        {!showCamera && !imageData && (
          <Button onClick={handleOpenCamera} size="lg" fullWidth>
            Dokument scannen
          </Button>
        )}

        {imageData && (
          <Paper withBorder shadow="md" p="md">
            <Title order={4} mb="md">Erfasste Daten</Title>
            <BewirtungsbelegForm initialData={{ image: imageData }} />
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
