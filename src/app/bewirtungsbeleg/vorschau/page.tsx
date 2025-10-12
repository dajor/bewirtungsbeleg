'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Stack,
  Button,
  Group,
  Title,
  Text,
  Alert,
  Notification,
  Loader,
  Center,
  Box,
  Tooltip,
} from '@mantine/core';
import {
  IconDownload,
  IconCloudUpload,
  IconCheckupList,
  IconAlertCircle,
  IconArrowLeft,
} from '@tabler/icons-react';
import Link from 'next/link';

interface BewirtungsbelegFormData {
  datum: string | null;
  restaurantName: string;
  restaurantAnschrift: string;
  teilnehmer: string;
  anlass: string;
  gesamtbetrag: string;
  gesamtbetragMwst: string;
  gesamtbetragNetto: string;
  trinkgeld: string;
  trinkgeldMwst: string;
  kreditkartenBetrag: string;
  zahlungsart: 'firma' | 'privat' | 'bar';
  bewirtungsart: 'kunden' | 'mitarbeiter';
  geschaeftlicherAnlass: string;
  geschaeftspartnerNamen: string;
  geschaeftspartnerFirma: string;
  istAuslaendischeRechnung: boolean;
  auslaendischeWaehrung: string;
  generateZugferd: boolean;
  istEigenbeleg: boolean;
  restaurantPlz: string;
  restaurantOrt: string;
  unternehmen: string;
  unternehmenAnschrift: string;
  unternehmenPlz: string;
  unternehmenOrt: string;
  speisen: string;
  getraenke: string;
  attachedFiles?: Array<{ name: string; type: string; classification?: any }>;
}

interface FileData {
  id: string;
  data: string;
  name: string;
  type: string;
  classification?: any;
}

export default function BewirtungsbelegVorschauPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState<BewirtungsbelegFormData | null>(null);
  const [filesData, setFilesData] = useState<FileData[]>([]);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isAuthenticated = status === 'authenticated' && !!session?.user;

  // Load form data and files from sessionStorage
  useEffect(() => {
    const storedData = sessionStorage.getItem('bewirtungsbeleg-preview-data');
    const storedFiles = sessionStorage.getItem('bewirtungsbeleg-preview-files');

    if (!storedData) {
      // No data found, redirect back to form
      router.push('/bewirtungsbeleg');
      return;
    }

    try {
      const parsedData = JSON.parse(storedData);
      setFormData(parsedData);

      if (storedFiles) {
        const parsedFiles = JSON.parse(storedFiles);
        setFilesData(parsedFiles);
      }
    } catch (err) {
      console.error('Error parsing session data:', err);
      setError('Fehler beim Laden der Formulardaten');
      router.push('/bewirtungsbeleg');
    }
  }, [router]);

  // Generate PDF when component mounts
  useEffect(() => {
    if (!formData) return;

    const generatePDF = async () => {
      setIsGenerating(true);
      setError(null);

      try {
        // Prepare attachments
        const attachments = filesData.map(f => ({
          data: f.data,
          name: f.name,
          type: f.type,
          classification: f.classification?.type
        }));

        // Sort attachments: Rechnung first, then Kreditkartenbeleg
        attachments.sort((a, b) => {
          if (a.classification === 'Rechnung' && b.classification !== 'Rechnung') return -1;
          if (a.classification !== 'Rechnung' && b.classification === 'Rechnung') return 1;
          if (a.classification === 'Kreditkartenbeleg' && b.classification !== 'Kreditkartenbeleg') return 1;
          if (a.classification !== 'Kreditkartenbeleg' && b.classification === 'Kreditkartenbeleg') return -1;
          return 0;
        });

        const imageData = attachments.length > 0 ? attachments[0].data : undefined;

        // Convert to German decimal format
        const convertToGermanDecimal = (value: string | number) => {
          if (!value) return '';
          const numValue = Number(value);
          return numValue.toFixed(2).replace('.', ',');
        };

        // Prepare API data
        const apiData = {
          ...formData,
          datum: formData.datum,
          anlass: formData.geschaeftlicherAnlass || formData.anlass,
          gesamtbetrag: convertToGermanDecimal(formData.gesamtbetrag),
          gesamtbetragMwst: convertToGermanDecimal(formData.gesamtbetragMwst),
          gesamtbetragNetto: convertToGermanDecimal(formData.gesamtbetragNetto),
          trinkgeld: convertToGermanDecimal(formData.trinkgeld),
          trinkgeldMwst: convertToGermanDecimal(formData.trinkgeldMwst),
          kreditkartenBetrag: convertToGermanDecimal(formData.kreditkartenBetrag),
          speisen: convertToGermanDecimal(formData.speisen),
          getraenke: convertToGermanDecimal(formData.getraenke),
          betragBrutto: convertToGermanDecimal(formData.gesamtbetrag),
          bewirtetePersonen: formData.teilnehmer,
          image: imageData,
          attachments: attachments
        };

        // Generate PDF
        const response = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Fehler bei der PDF-Generierung');
        }

        const blob = await response.blob();
        setPdfBlob(blob);

        // Create object URL for preview
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error('Error generating PDF:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Erstellen des PDFs');
      } finally {
        setIsGenerating(false);
      }
    };

    generatePDF();

    // Cleanup
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [formData]);

  const handleDownload = () => {
    if (!pdfBlob || !formData) return;

    const formattedDate = formData.datum ? formData.datum.split('T')[0] : new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    const url = URL.createObjectURL(pdfBlob);
    a.href = url;
    a.download = `bewirtungsbeleg-${formattedDate}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    setSuccess('PDF wurde erfolgreich heruntergeladen!');
  };

  const handleUploadToDigitalOcean = async (withValidation = false) => {
    if (!pdfBlob || !formData || !isAuthenticated) {
      setError('Sie müssen angemeldet sein, um Dokumente hochzuladen');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert PDF to base64
      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      // Generate PNG preview from PDF
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1131;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Bewirtungsbeleg', canvas.width / 2, 60);
        ctx.font = '16px Arial';
        ctx.fillText(formData.restaurantName, canvas.width / 2, 100);
        if (formData.datum) {
          ctx.fillText(`Datum: ${new Date(formData.datum).toLocaleDateString('de-DE')}`, canvas.width / 2, 140);
        }
        ctx.fillText(`Betrag: ${formData.gesamtbetrag} EUR`, canvas.width / 2, 180);
      }

      const pngBase64 = canvas.toDataURL('image/png').split(',')[1];

      // Prepare metadata
      const formattedDate = formData.datum || new Date().toISOString();
      const metadata = {
        ...formData,
        uploadDate: new Date().toISOString(),
        fileName: `bewirtungsbeleg-${formattedDate.split('T')[0]}.pdf`,
      };

      // Upload to DigitalOcean Spaces
      const uploadResponse = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata,
          withValidation,
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Fehler beim Hochladen in den GoBD-Tresor');
      }

      const uploadResult = await uploadResponse.json();
      console.log('Upload successful:', uploadResult);

      setSuccess(withValidation
        ? 'Dokument wurde erfolgreich geprüft und in den GoBD-Tresor hochgeladen!'
        : 'Dokument wurde erfolgreich in den GoBD-Tresor hochgeladen!');

      // Clear session storage
      sessionStorage.removeItem('bewirtungsbeleg-preview-data');
      sessionStorage.removeItem('bewirtungsbeleg-preview-files');

      // Redirect to documents page after 2 seconds
      setTimeout(() => {
        router.push('/meine-belege');
      }, 2000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Hochladen');
    } finally {
      setIsUploading(false);
    }
  };

  if (!formData) {
    return (
      <Container size="lg" py="xl">
        <Center h={400}>
          <Loader size="xl" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        {/* Back button */}
        <Button
          component={Link}
          href="/bewirtungsbeleg"
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          size="sm"
        >
          Zurück zum Formular
        </Button>

        {/* Notifications */}
        {error && (
          <Alert color="red" title="Fehler" icon={<IconAlertCircle />} onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        )}

        {success && (
          <Notification color="green" title="Erfolg" onClose={() => setSuccess(null)} withCloseButton>
            {success}
          </Notification>
        )}

        {/* Authentication warning */}
        {!isAuthenticated && (
          <Alert color="yellow" title="Anmeldung erforderlich" icon={<IconAlertCircle />}>
            <Text size="sm">
              Um Dokumente in DigitalOcean zu speichern, müssen Sie sich{' '}
              <Text component={Link} href="/auth/anmelden" c="blue" td="underline" inherit span>
                anmelden
              </Text>{' '}
              oder{' '}
              <Text component={Link} href="/auth/registrieren" c="blue" td="underline" inherit span>
                registrieren
              </Text>
              .
            </Text>
          </Alert>
        )}

        {/* Header */}
        <Paper shadow="sm" p="md" withBorder>
          <Title order={2} size="h3">Bewirtungsbeleg Vorschau</Title>
          <Text size="sm" c="dimmed" mt="xs">
            Überprüfen Sie Ihren Bewirtungsbeleg und wählen Sie eine der folgenden Optionen
          </Text>
        </Paper>

        {/* PDF Preview */}
        <Paper shadow="sm" p="md" withBorder>
          {isGenerating ? (
            <Center h={600}>
              <Stack align="center" gap="md">
                <Loader size="xl" />
                <Text>PDF wird generiert...</Text>
              </Stack>
            </Center>
          ) : pdfUrl ? (
            <Box style={{ height: '800px', width: '100%', position: 'relative' }}>
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                width="100%"
                height="100%"
                style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '4px'
                }}
                title="PDF Vorschau"
              />
              {/* Fallback message for browsers that don't support PDF preview */}
              <noscript>
                <Center h="100%">
                  <Stack align="center" gap="md">
                    <IconAlertCircle size={48} color="orange" />
                    <Text>Ihr Browser unterstützt keine PDF-Vorschau.</Text>
                    <Button
                      leftSection={<IconDownload size={20} />}
                      onClick={handleDownload}
                    >
                      PDF herunterladen
                    </Button>
                  </Stack>
                </Center>
              </noscript>
            </Box>
          ) : (
            <Center h={600}>
              <Stack align="center" gap="md">
                <IconAlertCircle size={48} color="red" />
                <Text c="dimmed">Vorschau nicht verfügbar</Text>
                <Text size="sm" c="dimmed">Das PDF konnte nicht generiert werden</Text>
              </Stack>
            </Center>
          )}
        </Paper>

        {/* Action Buttons */}
        <Paper shadow="sm" p="md" withBorder>
          <Stack gap="md">
            <Title order={3} size="h4">Was möchten Sie tun?</Title>

            <Group grow>
              {/* Download PDF */}
              <Button
                leftSection={<IconDownload size={20} />}
                onClick={handleDownload}
                disabled={!pdfBlob || isGenerating}
                size="md"
              >
                PDF herunterladen
              </Button>

              {/* Upload to DigitalOcean */}
              <Tooltip
                label="Sie müssen angemeldet sein"
                disabled={isAuthenticated}
                withArrow
              >
                <Button
                  leftSection={<IconCloudUpload size={20} />}
                  onClick={() => handleUploadToDigitalOcean(false)}
                  disabled={!pdfBlob || isGenerating || !isAuthenticated || isUploading}
                  loading={isUploading}
                  color="green"
                  size="md"
                >
                  In Cloud speichern
                </Button>
              </Tooltip>

              {/* Check & Upload to DigitalOcean */}
              <Tooltip
                label="Sie müssen angemeldet sein"
                disabled={isAuthenticated}
                withArrow
              >
                <Button
                  leftSection={<IconCheckupList size={20} />}
                  onClick={() => handleUploadToDigitalOcean(true)}
                  disabled={!pdfBlob || isGenerating || !isAuthenticated || isUploading}
                  loading={isUploading}
                  color="blue"
                  variant="light"
                  size="md"
                >
                  Signieren und Cloud GoBD speichern
                </Button>
              </Tooltip>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
