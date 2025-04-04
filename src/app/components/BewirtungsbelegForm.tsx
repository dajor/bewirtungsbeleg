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
  Table,
  TableThead,
  TableTbody,
  TableTd,
  TableTh,
  TableTr,
  Checkbox,
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
}

export default function BewirtungsbelegForm() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BewirtungsbelegFormData>({
    initialValues: {
      datum: null,
      restaurantName: '',
      restaurantAnschrift: '',
      teilnehmer: '',
      anlass: '',
      gesamtbetrag: '',
      gesamtbetragMwst: '',
      gesamtbetragNetto: '',
      trinkgeld: '',
      trinkgeldMwst: '',
      kreditkartenBetrag: '',
      zahlungsart: 'firma',
      bewirtungsart: 'kunden',
      geschaeftlicherAnlass: '',
      geschaeftspartnerNamen: '',
      geschaeftspartnerFirma: '',
      istAuslaendischeRechnung: false,
      auslaendischeWaehrung: '',
    },
    validate: {
      datum: (value) => (value ? null : 'Datum ist erforderlich'),
      restaurantName: (value) => (value ? null : 'Name des Restaurants ist erforderlich'),
      teilnehmer: (value, values) => {
        if (values.bewirtungsart === 'kunden') {
          return value ? null : 'Namen aller Teilnehmer sind erforderlich';
        }
        return value ? null : 'Teilnehmerkreis ist erforderlich';
      },
      anlass: (value) => (value ? null : 'Anlass ist erforderlich'),
      gesamtbetrag: (value) => (value ? null : 'Gesamtbetrag ist erforderlich'),
      zahlungsart: (value) => (value ? null : 'Zahlungsart ist erforderlich'),
      bewirtungsart: (value) => (value ? null : 'Bewirtungsart ist erforderlich'),
      geschaeftlicherAnlass: (value) => (value ? null : 'Geschäftlicher Anlass ist erforderlich'),
      geschaeftspartnerNamen: (value, values) => {
        if (values.bewirtungsart === 'kunden') {
          return value ? null : 'Namen der Geschäftspartner sind erforderlich';
        }
        return null;
      },
      geschaeftspartnerFirma: (value, values) => {
        if (values.bewirtungsart === 'kunden') {
          return value ? null : 'Firma der Geschäftspartner ist erforderlich';
        }
        return null;
      },
      kreditkartenBetrag: (value) => {
        if (value && isNaN(Number(value.replace(',', '.')))) {
          return 'Ungültiger Betrag';
        }
        return null;
      },
      gesamtbetragMwst: (value) => {
        if (value && isNaN(Number(value.replace(',', '.')))) {
          return 'Ungültiger Betrag';
        }
        return null;
      },
      gesamtbetragNetto: (value) => {
        if (value && isNaN(Number(value.replace(',', '.')))) {
          return 'Ungültiger Betrag';
        }
        return null;
      },
      trinkgeldMwst: (value) => {
        if (value && isNaN(Number(value.replace(',', '.')))) {
          return 'Ungültiger Betrag';
        }
        return null;
      },
      istAuslaendischeRechnung: (value) => null,
      auslaendischeWaehrung: (value) => null,
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
      
      // Konvertiere die Beträge von "51,90" zu "51.90"
      const gesamtbetrag = data.gesamtbetrag ? data.gesamtbetrag.replace(',', '.') : '';
      const mwst = data.mwst ? data.mwst.replace(',', '.') : '';
      const netto = data.netto ? data.netto.replace(',', '.') : '';

      // Berechne fehlende Werte basierend auf den vorhandenen
      let finalGesamtbetrag = gesamtbetrag;
      let finalMwst = mwst;
      let finalNetto = netto;

      if (gesamtbetrag && mwst && !netto) {
        finalNetto = (Number(gesamtbetrag) - Number(mwst)).toFixed(2);
      } else if (gesamtbetrag && netto && !mwst) {
        finalMwst = (Number(gesamtbetrag) - Number(netto)).toFixed(2);
      } else if (mwst && netto && !gesamtbetrag) {
        finalGesamtbetrag = (Number(mwst) + Number(netto)).toFixed(2);
      }
      
      form.setValues({
        ...form.values,
        restaurantName: data.restaurantName || form.values.restaurantName,
        restaurantAnschrift: data.restaurantAnschrift || form.values.restaurantAnschrift,
        gesamtbetrag: finalGesamtbetrag || form.values.gesamtbetrag,
        gesamtbetragMwst: finalMwst || form.values.gesamtbetragMwst,
        gesamtbetragNetto: finalNetto || form.values.gesamtbetragNetto,
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
    console.log('Form submitted with values:', form.values);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    console.log('Starting PDF generation...');
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Form values before PDF generation:', form.values);
      
      // Konvertiere das Bild in Base64, wenn es vorhanden ist
      let imageData = null;
      if (selectedImage) {
        const reader = new FileReader();
        imageData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(selectedImage);
        });
      }

      // Formatiere das Datum
      const formattedDate = form.values.datum.toISOString().split('T')[0];

      // Erstelle die Daten für die API
      const apiData = {
        ...form.values,
        datum: formattedDate,
        anlass: form.values.anlass, // Stelle sicher, dass der Anlass explizit übergeben wird
        image: imageData
      };

      console.log('Sende Daten an API:', apiData);

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        throw new Error('Fehler bei der PDF-Generierung');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bewirtungsbeleg-${formattedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setShowConfirm(false);
      setSuccess(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setShowConfirm(false);
      setError('Fehler beim Erstellen des PDFs. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKreditkartenBetragChange = (value: string | number) => {
    const kkBetrag = String(value).replace(',', '.');
    form.setFieldValue('kreditkartenBetrag', kkBetrag);

    if (kkBetrag && form.values.gesamtbetrag) {
      const gesamtbetrag = Number(form.values.gesamtbetrag.replace(',', '.'));
      const kkBetragNum = Number(kkBetrag);
      
      if (kkBetragNum > gesamtbetrag) {
        const trinkgeld = (kkBetragNum - gesamtbetrag).toFixed(2);
        form.setFieldValue('trinkgeld', trinkgeld);
      }
    }
  };

  const calculateMwst = (brutto: number) => {
    const mwst = brutto * 0.19; // 19% MwSt
    const netto = brutto - mwst;
    return {
      mwst: mwst.toFixed(2),
      netto: netto.toFixed(2)
    };
  };

  const handleGesamtbetragChange = (value: string | number) => {
    const brutto = String(value).replace(',', '.');
    form.setFieldValue('gesamtbetrag', brutto);

    if (brutto) {
      const bruttoNum = Number(brutto);
      const { mwst, netto } = calculateMwst(bruttoNum);
      form.setFieldValue('gesamtbetragMwst', mwst);
      form.setFieldValue('gesamtbetragNetto', netto);
    }
  };

  const handleTrinkgeldChange = (value: string | number) => {
    const trinkgeld = String(value).replace(',', '.');
    form.setFieldValue('trinkgeld', trinkgeld);

    if (trinkgeld) {
      const trinkgeldNum = Number(trinkgeld);
      const { mwst } = calculateMwst(trinkgeldNum);
      form.setFieldValue('trinkgeldMwst', mwst);
    }

    if (trinkgeld && form.values.gesamtbetrag) {
      const gesamtbetrag = Number(form.values.gesamtbetrag.replace(',', '.'));
      const trinkgeldNum = Number(trinkgeld);
      const kkBetrag = (gesamtbetrag + trinkgeldNum).toFixed(2);
      form.setFieldValue('kreditkartenBetrag', kkBetrag);
    }
  };

  const handleAuslaendischeRechnungChange = (checked: boolean) => {
    form.setFieldValue('istAuslaendischeRechnung', checked);
    if (checked) {
      // Wenn es eine ausländische Rechnung ist, setze Brutto = Netto
      const brutto = form.values.gesamtbetrag;
      if (brutto) {
        form.setFieldValue('gesamtbetragNetto', brutto);
        form.setFieldValue('gesamtbetragMwst', '0.00');
      }
    }
  };

  return (
    <Container size="xs" py="xs">
      {error && (
        <Notification
          color="red"
          title="Fehler"
          onClose={() => setError(null)}
          mb="xs"
        >
          {error}
        </Notification>
      )}

      {success && (
        <Notification
          color="green"
          title="Erfolg"
          onClose={() => setSuccess(false)}
          mb="xs"
        >
          Bewirtungsbeleg wurde erfolgreich als PDF erstellt!
        </Notification>
      )}

      {isProcessing && (
        <Notification
          loading
          title="Verarbeitung läuft"
          mb="xs"
        >
          Der Beleg wird analysiert...
        </Notification>
      )}

      <Paper shadow="sm" p="xs">
        <form onSubmit={handleSubmit}>
          <Stack gap="xs">
            <Title order={1} ta="center" size="h6">
              Bewirtungsbeleg
            </Title>
            
            <Box>
              <Title order={2} size="h6">Allgemeine Angaben</Title>
              <Stack gap="xs">
                <FileInput
                  label="Foto/Scan der Rechnung"
                  description="Laden Sie ein Foto oder einen Scan hoch - die Daten werden automatisch extrahiert"
                  accept="image/*"
                  onChange={handleImageChange}
                  value={selectedImage}
                  size="sm"
                />
                <DateInput
                  label="Datum der Bewirtung"
                  placeholder="Wählen Sie ein Datum"
                  required
                  valueFormat="DD.MM.YYYY"
                  size="sm"
                  {...form.getInputProps('datum')}
                />
                <TextInput
                  label="Restaurant"
                  placeholder="Name des Restaurants"
                  required
                  size="sm"
                  {...form.getInputProps('restaurantName')}
                />
                <TextInput
                  label="Anschrift"
                  placeholder="Anschrift des Restaurants"
                  size="sm"
                  {...form.getInputProps('restaurantAnschrift')}
                />
                <Radio.Group
                  label="Art der Bewirtung"
                  required
                  size="sm"
                  description="Wählen Sie die Art der Bewirtung - dies beeinflusst die steuerliche Abzugsfähigkeit"
                  {...form.getInputProps('bewirtungsart')}
                >
                  <Stack gap="xs" mt="xs">
                    <Radio 
                      value="kunden" 
                      label="Kundenbewirtung (70% abzugsfähig)"
                      description="Für Geschäftsfreunde (Kunden, Geschäftspartner). 70% der Kosten sind als Betriebsausgabe abziehbar."
                    />
                    <Radio 
                      value="mitarbeiter" 
                      label="Mitarbeiterbewirtung (100% abzugsfähig)"
                      description="Für betriebliche Veranstaltungen (Teamessen, Arbeitsessen). 100% der Kosten sind als Betriebsausgabe abziehbar."
                    />
                  </Stack>
                </Radio.Group>
              </Stack>
            </Box>

            <Box>
              <Title order={2} size="h6">Finanzielle Details</Title>
              <Stack gap="xs">
                <Checkbox
                  label="Ausländische Rechnung (keine MwSt.)"
                  description="Aktivieren Sie diese Option, wenn die Rechnung aus dem Ausland stammt. In diesem Fall wird der Gesamtbetrag als Netto behandelt."
                  checked={form.values.istAuslaendischeRechnung}
                  onChange={(event) => handleAuslaendischeRechnungChange(event.currentTarget.checked)}
                />
                {form.values.istAuslaendischeRechnung && (
                  <Select
                    label="Währung"
                    placeholder="Wählen Sie die Währung"
                    data={[
                      { value: 'USD', label: 'USD ($)' },
                      { value: 'GBP', label: 'GBP (£)' },
                      { value: 'CHF', label: 'CHF (Fr.)' },
                      { value: 'JPY', label: 'JPY (¥)' },
                      { value: 'EUR', label: 'EUR (€)' },
                      { value: 'other', label: 'Andere Währung' },
                    ]}
                    value={form.values.auslaendischeWaehrung}
                    onChange={(value) => {
                      form.setFieldValue('auslaendischeWaehrung', value || '');
                      if (value === 'other') {
                        form.setFieldValue('auslaendischeWaehrung', '');
                      }
                    }}
                  />
                )}
                {form.values.istAuslaendischeRechnung && form.values.auslaendischeWaehrung === 'other' && (
                  <TextInput
                    label="Andere Währung"
                    placeholder="z.B. CAD, AUD, NZD"
                    value={form.values.auslaendischeWaehrung}
                    onChange={(event) => form.setFieldValue('auslaendischeWaehrung', event.currentTarget.value)}
                  />
                )}
                <NumberInput
                  label="Gesamtbetrag (Brutto)"
                  placeholder={`Gesamtbetrag in ${form.values.istAuslaendischeRechnung ? (form.values.auslaendischeWaehrung || 'ausländischer Währung') : 'Euro'}`}
                  required
                  min={0}
                  step={0.01}
                  size="sm"
                  decimalScale={2}
                  fixedDecimalScale
                  description={form.values.istAuslaendischeRechnung 
                    ? `Geben Sie den Gesamtbetrag in ${form.values.auslaendischeWaehrung || 'ausländischer Währung'} ein` 
                    : "Geben Sie den Gesamtbetrag der Rechnung ein (inkl. MwSt.)"}
                  value={form.values.gesamtbetrag}
                  onChange={handleGesamtbetragChange}
                  onBlur={(event) => {
                    const value = event.currentTarget.value;
                    if (value) {
                      const numericValue = value.replace(',', '.');
                      handleGesamtbetragChange(numericValue);
                    }
                  }}
                />
                {!form.values.istAuslaendischeRechnung && (
                  <>
                    <NumberInput
                      label="MwSt. Gesamtbetrag"
                      placeholder="MwSt. in Euro"
                      min={0}
                      step={0.01}
                      size="sm"
                      decimalScale={2}
                      fixedDecimalScale
                      description="MwSt. (19%) wird automatisch berechnet"
                      value={form.values.gesamtbetragMwst}
                      readOnly
                    />
                    <NumberInput
                      label="Netto Gesamtbetrag"
                      placeholder="Netto in Euro"
                      min={0}
                      step={0.01}
                      size="sm"
                      decimalScale={2}
                      fixedDecimalScale
                      description="Netto wird automatisch berechnet"
                      value={form.values.gesamtbetragNetto}
                      readOnly
                    />
                  </>
                )}
                <NumberInput
                  label="Betrag auf Kreditkarte"
                  placeholder="Betrag auf Kreditkarte in Euro"
                  min={0}
                  step={0.01}
                  size="sm"
                  decimalScale={2}
                  fixedDecimalScale
                  description="Geben Sie den Betrag ein, der auf der Kreditkarte belastet wurde (inkl. Trinkgeld)"
                  value={form.values.kreditkartenBetrag}
                  onChange={handleKreditkartenBetragChange}
                  onBlur={(event) => {
                    const value = event.currentTarget.value;
                    if (value) {
                      const numericValue = value.replace(',', '.');
                      handleKreditkartenBetragChange(numericValue);
                    }
                  }}
                />
                <NumberInput
                  label="Trinkgeld"
                  placeholder="Trinkgeld in Euro"
                  min={0}
                  step={0.01}
                  size="sm"
                  decimalScale={2}
                  fixedDecimalScale
                  description="Geben Sie das Trinkgeld ein. Dies wird automatisch berechnet, wenn Sie den Betrag auf der Kreditkarte eingeben"
                  value={form.values.trinkgeld}
                  onChange={handleTrinkgeldChange}
                  onBlur={(event) => {
                    const value = event.currentTarget.value;
                    if (value) {
                      const numericValue = value.replace(',', '.');
                      handleTrinkgeldChange(numericValue);
                    }
                  }}
                />
                {!form.values.istAuslaendischeRechnung && (
                  <NumberInput
                    label="MwSt. Trinkgeld"
                    placeholder="MwSt. in Euro"
                    min={0}
                    step={0.01}
                    size="sm"
                    decimalScale={2}
                    fixedDecimalScale
                    description="MwSt. (19%) wird automatisch berechnet"
                    value={form.values.trinkgeldMwst}
                    readOnly
                  />
                )}
                <Select
                  label="Zahlungsart"
                  placeholder="Wählen Sie die Zahlungsart"
                  required
                  size="sm"
                  description="Wählen Sie die Art der Zahlung. Die Rechnung muss auf die Firma ausgestellt sein."
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
              <Title order={2} size="h6">Geschäftlicher Anlass</Title>
              <Stack gap="xs">
                <TextInput
                  label="Geschäftlicher Anlass"
                  placeholder={form.values.bewirtungsart === 'kunden' 
                    ? "z.B. Projektbesprechung Kunde X" 
                    : "z.B. Projektabschluss Team Meeting"}
                  required
                  size="sm"
                  description={form.values.bewirtungsart === 'kunden'
                    ? "Geben Sie den konkreten Anlass an (z.B. 'Kundengespräch', 'Projektbesprechung')"
                    : "Geben Sie den Anlass an (z.B. 'Teamevent', 'Projektabschluss')"}
                  {...form.getInputProps('geschaeftlicherAnlass')}
                />
                <Textarea
                  label={form.values.bewirtungsart === 'kunden' 
                    ? "Namen aller Teilnehmer" 
                    : "Teilnehmerkreis"}
                  placeholder={form.values.bewirtungsart === 'kunden'
                    ? "Ein Teilnehmer pro Zeile"
                    : "z.B. Team Marketing"}
                  required
                  minRows={3}
                  size="sm"
                  description={form.values.bewirtungsart === 'kunden'
                    ? "Geben Sie die Namen aller Teilnehmer ein (auch Ihren eigenen Namen)"
                    : "Geben Sie den Teilnehmerkreis an (z.B. 'Team Marketing', 'Abteilung Vertrieb')"}
                  {...form.getInputProps('teilnehmer')}
                />
                {form.values.bewirtungsart === 'kunden' && (
                  <>
                    <TextInput
                      label="Namen der Geschäftspartner"
                      placeholder="Namen der Geschäftspartner"
                      required
                      size="sm"
                      description="Geben Sie die Namen der Geschäftspartner ein"
                      {...form.getInputProps('geschaeftspartnerNamen')}
                    />
                    <TextInput
                      label="Firma der Geschäftspartner"
                      placeholder="Name der Firma"
                      required
                      size="sm"
                      description="Geben Sie die Firma der Geschäftspartner ein"
                      {...form.getInputProps('geschaeftspartnerFirma')}
                    />
                  </>
                )}
              </Stack>
            </Box>

            <Button 
              type="submit" 
              size="sm"
              fullWidth
              loading={isSubmitting}
            >
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
        size="sm"
      >
        <Stack gap="sm">
          <Text size="sm">
            Möchten Sie den Bewirtungsbeleg mit folgenden Details erstellen?
          </Text>
          
          <Stack gap="sm">
            <Text size="sm">
              <strong>Restaurant:</strong> {form.values.restaurantName}
            </Text>
            <Text size="sm">
              <strong>Datum:</strong> {form.values.datum?.toLocaleDateString('de-DE')}
            </Text>
            <Text size="sm">
              <strong>Art der Bewirtung:</strong> {form.values.bewirtungsart === 'kunden' ? 'Kundenbewirtung (70% abzugsfähig)' : 'Mitarbeiterbewirtung (100% abzugsfähig)'}
            </Text>
            <Text size="sm">
              <strong>Ausländische Rechnung:</strong> {form.values.istAuslaendischeRechnung ? 'Ja' : 'Nein'}
            </Text>
            <Text size="sm">
              <strong>Anlass:</strong> {form.values.anlass || '-'}
            </Text>
            <Text size="sm">
              <strong>Teilnehmer:</strong> {form.values.teilnehmer}
            </Text>
            <Text size="sm">
              <strong>Gesamtbetrag (Brutto):</strong> {form.values.gesamtbetrag}€
            </Text>
            <Text size="sm">
              <strong>MwSt. Gesamtbetrag:</strong> {form.values.gesamtbetragMwst}€
            </Text>
            <Text size="sm">
              <strong>Netto Gesamtbetrag:</strong> {form.values.gesamtbetragNetto}€
            </Text>
            <Text size="sm">
              <strong>Betrag auf Kreditkarte:</strong> {form.values.kreditkartenBetrag}€
            </Text>
            <Text size="sm">
              <strong>Trinkgeld:</strong> {form.values.trinkgeld}€
            </Text>
            <Text size="sm">
              <strong>MwSt. Trinkgeld:</strong> {form.values.trinkgeldMwst}€
            </Text>
            <Text size="sm">
              <strong>Zahlungsart:</strong> {form.values.zahlungsart === 'firma' ? 'Firmenkreditkarte' : form.values.zahlungsart === 'privat' ? 'Private Kreditkarte' : 'Bar'}
            </Text>
            {form.values.bewirtungsart === 'kunden' && (
              <>
                <Text size="sm">
                  <strong>Geschäftspartner:</strong> {form.values.geschaeftspartnerNamen}
                </Text>
                <Text size="sm">
                  <strong>Firma:</strong> {form.values.geschaeftspartnerFirma}
                </Text>
              </>
            )}
          </Stack>

          <Group justify="space-between" mt="md">
            <Button 
              variant="light" 
              onClick={() => setShowConfirm(false)}
              size="sm"
            >
              Abbrechen
            </Button>
            <Button 
              onClick={handleConfirm}
              size="sm"
            >
              PDF erstellen
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
} 