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
      geschaeftlicherAnlass: '',
      geschaeftspartnerNamen: '',
      geschaeftspartnerFirma: '',
    },
    validate: {
      datum: (value) => (value ? null : 'Datum ist erforderlich'),
      restaurantName: (value) => (value ? null : 'Name des Restaurants ist erforderlich'),
      restaurantAnschrift: (value) => (value ? null : 'Anschrift ist erforderlich'),
      teilnehmer: (value) => (value ? null : 'Teilnehmer sind erforderlich'),
      anlass: (value) => (value ? null : 'Anlass ist erforderlich'),
      gesamtbetrag: (value) => (value ? null : 'Gesamtbetrag ist erforderlich'),
      trinkgeld: (value) => (value ? null : 'Trinkgeld ist erforderlich'),
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

  const generatePDF = async (data: BewirtungsbelegFormData) => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Bewirtungsbeleg', 105, 20, { align: 'center' });
      
      // Allgemeine Angaben
      doc.setFontSize(12);
      doc.text('Allgemeine Angaben:', 20, 40);
      doc.setFontSize(10);
      doc.text(`Datum: ${data.datum?.toLocaleDateString('de-DE')}`, 20, 50);
      doc.text(`Restaurant: ${data.restaurantName}`, 20, 60);
      doc.text(`Anschrift: ${data.restaurantAnschrift}`, 20, 70);

      // Finanzielle Details
      doc.setFontSize(12);
      doc.text('Finanzielle Details:', 20, 90);
      doc.setFontSize(10);
      doc.text(`Gesamtbetrag: ${data.gesamtbetrag}€`, 20, 100);
      doc.text(`Trinkgeld: ${data.trinkgeld}€`, 20, 110);
      doc.text(`Rechnungsbetrag ohne Trinkgeld: ${Number(data.gesamtbetrag) - Number(data.trinkgeld)}€`, 20, 120);

      // Geschäftlicher Anlass
      doc.setFontSize(12);
      doc.text('Geschäftlicher Anlass:', 20, 140);
      doc.setFontSize(10);
      doc.text(`Anlass: ${data.anlass}`, 20, 150);
      doc.text(`Teilnehmer: ${data.teilnehmer}`, 20, 160);
      doc.text(`Geschäftspartner: ${data.geschaeftspartnerNamen}`, 20, 170);
      doc.text(`Firma: ${data.geschaeftspartnerFirma}`, 20, 180);

      // Wenn ein Bild ausgewählt wurde
      if (selectedImage) {
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = (e) => {
            if (e.target?.result) {
              doc.addPage();
              doc.text('Beleg:', 20, 20);
              doc.addImage(e.target.result as string, 'JPEG', 20, 30, 170, 200);
            }
            resolve();
          };
          reader.readAsDataURL(selectedImage);
        });
      }

      doc.save('Bewirtungsbeleg.pdf');
      setSuccess(true);
      setShowConfirm(false);
    } catch (err) {
      setError('Fehler beim Erstellen des PDFs. Bitte versuchen Sie es erneut.');
      console.error('PDF Fehler:', err);
    }
  };

  const handleSubmit = form.onSubmit(() => {
    setError(null);
    setSuccess(false);
    setShowConfirm(true);
  });

  const handleConfirm = () => {
    generatePDF(form.values);
  };

  return (
    <Container size="md" py="xl">
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

      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <form onSubmit={handleSubmit}>
          <Stack gap={rem(24)}>
            <Title order={1} ta="center" c="blue">
              Bewirtungsbeleg
            </Title>

            <Box>
              <Title order={2} size="h4" mb="md">
                Allgemeine Angaben
              </Title>
              <Stack gap={rem(12)}>
                <FileInput
                  label="Foto/Scan der Rechnung"
                  description="Laden Sie ein Foto oder einen Scan hoch - die Daten werden automatisch extrahiert"
                  placeholder="Wählen Sie eine Datei"
                  accept="image/*"
                  value={selectedImage}
                  onChange={handleImageChange}
                  disabled={isProcessing}
                />
                <DateInput
                  label="Datum der Bewirtung"
                  placeholder="Wählen Sie ein Datum"
                  valueFormat="DD.MM.YYYY"
                  {...form.getInputProps('datum')}
                  required
                />
                <TextInput
                  label="Name des Restaurants"
                  placeholder="z.B. Restaurant Zur Post"
                  {...form.getInputProps('restaurantName')}
                  required
                />
                <Textarea
                  label="Anschrift des Restaurants"
                  placeholder="Straße, Hausnummer, PLZ, Ort"
                  {...form.getInputProps('restaurantAnschrift')}
                  required
                  minRows={2}
                />
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Title order={2} size="h4" mb="md">
                Finanzielle Details
              </Title>
              <Grid align="flex-end">
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <NumberInput
                    label="Gesamtbetrag (€)"
                    description="Rechnungsbetrag inkl. Trinkgeld"
                    placeholder="0,00"
                    {...form.getInputProps('gesamtbetrag')}
                    required
                    decimalSeparator=","
                    thousandSeparator="."
                    fixedDecimalScale
                    decimalScale={2}
                    min={0}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <NumberInput
                    label="Trinkgeld (€)"
                    description=" "
                    placeholder="0,00"
                    {...form.getInputProps('trinkgeld')}
                    required
                    decimalSeparator=","
                    thousandSeparator="."
                    fixedDecimalScale
                    decimalScale={2}
                    min={0}
                  />
                </Grid.Col>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Title order={2} size="h4" mb="md">
                Geschäftlicher Anlass
              </Title>
              <Stack gap={rem(12)}>
                <Textarea
                  label="Anlass der Bewirtung"
                  placeholder="Beschreiben Sie den geschäftlichen Anlass"
                  {...form.getInputProps('anlass')}
                  required
                  minRows={3}
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