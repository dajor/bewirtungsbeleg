'use client';

import React, { useState } from 'react';
import { useForm } from '@mantine/form';
import {
  TextInput,
  Textarea,
  NumberInput,
  Button,
  Paper,
  Title,
  Stack,
  Group,
  Grid,
  FileInput,
  Modal,
  Text,
  Container,
  Box,
  Divider,
  rem,
  Notification,
  Radio,
  Select,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { jsPDF } from 'jspdf';

interface BewirtungsbelegFormData {
  datum: Date | null;
  restaurantName: string;
  restaurantAnschrift: string;
  teilnehmer: string;
  anlass: string;
  gesamtbetrag: string;
  trinkgeld: string;
  zahlungsart: 'firma' | 'privat' | 'bar';
  geschaeftlicherAnlass: string;
  geschaeftspartnerNamen: string;
  geschaeftspartnerFirma: string;
}

export default function BewirtungsbelegForm() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<BewirtungsbelegFormData>({
    initialValues: {
      datum: null,
      restaurantName: '',
      restaurantAnschrift: '',
      teilnehmer: '',
      anlass: '',
      gesamtbetrag: '',
      trinkgeld: '',
      zahlungsart: 'firma',
      geschaeftlicherAnlass: '',
      geschaeftspartnerNamen: '',
      geschaeftspartnerFirma: '',
    },
    validate: {
      datum: (value) => (value ? null : 'Datum ist erforderlich'),
      restaurantName: (value) => (value ? null : 'Name des Restaurants ist erforderlich'),
      teilnehmer: (value) => (value ? null : 'Teilnehmer sind erforderlich'),
      anlass: (value) => (value ? null : 'Anlass ist erforderlich'),
      gesamtbetrag: (value) => (value ? null : 'Gesamtbetrag ist erforderlich'),
      zahlungsart: (value) => (value ? null : 'Zahlungsart ist erforderlich'),
    },
  });

  const extractDataFromImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/extract-receipt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Fehler bei der Verarbeitung des Belegs');
      }

      const data = await response.json();
      
      form.setValues({
        ...form.values,
        restaurantName: data.restaurantName || form.values.restaurantName,
        restaurantAnschrift: data.restaurantAnschrift || form.values.restaurantAnschrift,
        gesamtbetrag: data.gesamtbetrag || form.values.gesamtbetrag,
        datum: data.datum ? new Date(data.datum.split('.').reverse().join('-')) : form.values.datum,
      });
    } catch (err) {
      console.error('Fehler bei der OCR-Verarbeitung:', err);
      setError('Fehler bei der Verarbeitung des Belegs. Bitte füllen Sie die Felder manuell aus.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageChange = async (file: File | null) => {
    setSelectedImage(file);
    if (file) {
      await extractDataFromImage(file);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.onSubmit((values) => {
      console.log('Form submitted with values:', values);
      setShowConfirm(true);
    })(event);
  };

  const handleConfirm = async () => {
    console.log('Starting PDF generation...');
    try {
      console.log('Form values before PDF generation:', form.values);
      const pdf = await generatePDF(form.values);
      console.log('PDF generated successfully');
      setShowConfirm(false);
      setSuccess(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setShowConfirm(false);
      setError('Fehler beim Erstellen des PDFs. Bitte versuchen Sie es erneut.');
    }
  };

  const generatePDF = async (data: typeof form.values) => {
    console.log('generatePDF function called with data:', data);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Fehler bei der PDF-Generierung');
      }

      const blob = await response.blob();
      console.log('PDF blob received, size:', blob.size);
      
      const url = window.URL.createObjectURL(blob);
      console.log('Created object URL:', url);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `bewirtungsbeleg-${data.datum?.toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log('PDF download initiated');
    } catch (error) {
      console.error('Error in generatePDF:', error);
      throw error;
    }
  };

  return (
    <Container size="xs" py="md">
      {error && (
        <Notification
          color="red"
          title="Fehler"
          onClose={() => setError(null)}
          mb="md"
        >
          {error}
        </Notification>
      )}

      {success && (
        <Notification
          color="green"
          title="Erfolg"
          onClose={() => setSuccess(false)}
          mb="md"
        >
          Bewirtungsbeleg wurde erfolgreich als PDF erstellt!
        </Notification>
      )}

      {isProcessing && (
        <Notification
          loading
          title="Verarbeitung läuft"
          mb="md"
        >
          Der Beleg wird analysiert...
        </Notification>
      )}

      <Paper shadow="sm" p="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <Title order={1} ta="center">Bewirtungsbeleg</Title>
            
            <Box>
              <Title order={2} size="h4">Allgemeine Angaben</Title>
              <Stack gap="sm">
                <FileInput
                  label="Foto/Scan der Rechnung"
                  description="Laden Sie ein Foto oder einen Scan hoch - die Daten werden automatisch extrahiert"
                  accept="image/*"
                  onChange={handleImageChange}
                  value={selectedImage}
                />
                <DateInput
                  label="Datum der Bewirtung"
                  placeholder="Wählen Sie ein Datum"
                  required
                  valueFormat="DD.MM.YYYY"
                  {...form.getInputProps('datum')}
                />
                <TextInput
                  label="Restaurant"
                  placeholder="Name des Restaurants"
                  required
                  {...form.getInputProps('restaurantName')}
                />
                <TextInput
                  label="Anschrift"
                  placeholder="Anschrift des Restaurants"
                  {...form.getInputProps('restaurantAnschrift')}
                />
              </Stack>
            </Box>

            <Box>
              <Title order={2} size="h4">Finanzielle Details</Title>
              <Stack gap="sm">
                <NumberInput
                  label="Gesamtbetrag"
                  placeholder="Gesamtbetrag in Euro"
                  required
                  min={0}
                  step={0.01}
                  {...form.getInputProps('gesamtbetrag')}
                />
                <NumberInput
                  label="Trinkgeld"
                  placeholder="Trinkgeld in Euro"
                  min={0}
                  step={0.01}
                  {...form.getInputProps('trinkgeld')}
                />
                <Select
                  label="Zahlungsart"
                  placeholder="Wählen Sie die Zahlungsart"
                  required
                  data={[
                    { value: 'firma', label: 'Firmenkreditkarte' },
                    { value: 'privat', label: 'Private Kreditkarte' },
                    { value: 'bar', label: 'Bar' },
                  ]}
                  {...form.getInputProps('zahlungsart')}
                />
              </Stack>
            </Box>

            <Box>
              <Title order={2} size="h4">Geschäftlicher Anlass</Title>
              <Stack gap="sm">
                <TextInput
                  label="Geschäftlicher Anlass"
                  placeholder="Grund der Bewirtung"
                  required
                  {...form.getInputProps('geschaeftlicherAnlass')}
                />
                <Textarea
                  label="Namen der Teilnehmer"
                  placeholder="Ein Teilnehmer pro Zeile"
                  {...form.getInputProps('teilnehmer')}
                  required
                  minRows={3}
                />
                <TextInput
                  label="Namen der Geschäftspartner"
                  placeholder="Namen der Geschäftspartner"
                  {...form.getInputProps('geschaeftspartnerNamen')}
                  required
                />
                <TextInput
                  label="Firma der Geschäftspartner"
                  placeholder="Name der Firma"
                  {...form.getInputProps('geschaeftspartnerFirma')}
                  required
                />
              </Stack>
            </Box>

            <Button type="submit" size="md" fullWidth>
              Bewirtungsbeleg erstellen
            </Button>
          </Stack>
        </form>
      </Paper>

      <Modal
        opened={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Bestätigung"
        centered
      >
        <Stack gap={rem(12)}>
          <Text>Möchten Sie den Bewirtungsbeleg mit folgenden Details erstellen?</Text>
          
          <Stack gap={rem(8)}>
            <Text size="sm">
              <strong>Restaurant:</strong> {form.values.restaurantName}
            </Text>
            <Text size="sm">
              <strong>Datum:</strong> {form.values.datum?.toLocaleDateString('de-DE')}
            </Text>
            <Text size="sm">
              <strong>Gesamtbetrag:</strong> {form.values.gesamtbetrag}€
            </Text>
            <Text size="sm">
              <strong>Zahlungsart:</strong> {form.values.zahlungsart === 'firma' ? 'Firmenkreditkarte' : form.values.zahlungsart === 'privat' ? 'Private Kreditkarte' : 'Bar'}
            </Text>
          </Stack>

          <Group justify="space-between" mt="md">
            <Button variant="light" onClick={() => setShowConfirm(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleConfirm}>
              PDF erstellen
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
} 