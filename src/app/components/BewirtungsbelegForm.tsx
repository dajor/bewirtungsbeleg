'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Alert,
} from '@mantine/core';
import { IconAlertCircle, IconDownload, IconUpload } from '@tabler/icons-react';
import { DateInput } from '@mantine/dates';
import { jsPDF } from 'jspdf';
import { MultiFileDropzone, FileWithPreview } from './MultiFileDropzone';
import { ImageEditor } from '@/components/ImageEditor';
import { CalculationPanel } from '@/components/CalculationPanel';
import { FormDataAccumulator } from '@/lib/FormDataAccumulator';
import { SanitizedTextInput, SanitizedTextarea } from './SanitizedInput';
import { useLocale } from '@/contexts/LocaleContext';
import { LOCALE_CONFIGS } from '@/lib/locale-config';

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
  generateZugferd: boolean;
  istEigenbeleg: boolean;
  // Additional fields for ZUGFeRD
  restaurantPlz: string;
  restaurantOrt: string;
  unternehmen: string;
  unternehmenAnschrift: string;
  unternehmenPlz: string;
  unternehmenOrt: string;
  speisen: string;
  getraenke: string;
}

export default function BewirtungsbelegForm() {
  // Locale context for number formatting
  const { locale, setLocale } = useLocale();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<FileWithPreview[]>([]);

  // Helper function to create a PDF thumbnail
  const createPdfThumbnail = () => {
    // Create a canvas to draw PDF icon
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 260;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Background
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border
      ctx.strokeStyle = '#dee2e6';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

      // PDF icon background
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(60, 40, 80, 100);

      // White fold corner
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(140, 40);
      ctx.lineTo(140, 60);
      ctx.lineTo(120, 60);
      ctx.closePath();
      ctx.fill();

      // PDF text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PDF', 100, 95);

      // File icon lines
      ctx.strokeStyle = '#868e96';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 170);
      ctx.lineTo(160, 170);
      ctx.moveTo(40, 190);
      ctx.lineTo(160, 190);
      ctx.moveTo(40, 210);
      ctx.lineTo(120, 210);
      ctx.stroke();
    }

    return canvas.toDataURL('image/png');
  };
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref to prevent infinite loops from useEffect calculations
  const isUpdatingFromBackend = useRef(false);

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
      generateZugferd: false,
      istEigenbeleg: false,
      restaurantPlz: '',
      restaurantOrt: '',
      unternehmen: '',
      unternehmenAnschrift: '',
      unternehmenPlz: '',
      unternehmenOrt: '',
      speisen: '',
      getraenke: '',
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
      anlass: (value) => null, // Optional - geschaeftlicherAnlass is the required field
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

  // ===== AUTOMATIC CALCULATION TRIGGERS FOR OCR DATA =====
  // These useEffect hooks trigger calculations when form values change programmatically
  // (e.g., from OCR extraction), since onChange handlers only fire on user interaction

  // Watch for Kreditkarten + Gesamtbetrag changes → Calculate Trinkgeld
  useEffect(() => {
    // Skip if we're currently updating from backend to prevent infinite loop
    if (isUpdatingFromBackend.current) {
      console.log('[Auto-Calc useEffect] Skipping - currently updating from backend');
      return;
    }

    const kkBetrag = form.values.kreditkartenBetrag;
    const gesamtbetrag = form.values.gesamtbetrag;

    console.log('[Auto-Calc useEffect] kreditkartenBetrag or gesamtbetrag changed:', { kkBetrag, gesamtbetrag });

    // Only trigger if both values exist and are numbers
    if (kkBetrag && gesamtbetrag && !isNaN(Number(kkBetrag)) && !isNaN(Number(gesamtbetrag))) {
      const kkNum = Number(kkBetrag);
      const totalNum = Number(gesamtbetrag);

      // Only trigger if Kreditkarte > Gesamtbetrag (meaning there's a tip)
      if (kkNum > totalNum) {
        console.log('[Auto-Calc useEffect] Triggering Trinkgeld calculation');
        callBackendCalculation('kreditkartenBetrag');
      }
    }
  }, [form.values.kreditkartenBetrag, form.values.gesamtbetrag]);

  // Watch for Gesamtbetrag changes → Calculate Netto + MwSt breakdown
  useEffect(() => {
    // Skip if we're currently updating from backend to prevent infinite loop
    if (isUpdatingFromBackend.current) {
      return;
    }

    const gesamtbetrag = form.values.gesamtbetrag;
    const gesamtbetragMwst = form.values.gesamtbetragMwst;

    console.log('[Auto-Calc useEffect] gesamtbetrag changed:', gesamtbetrag);

    // Only trigger if Brutto exists and we have Total MwSt OR individual MwSt components
    if (gesamtbetrag && !isNaN(Number(gesamtbetrag)) && !form.values.istAuslaendischeRechnung) {
      const bruttoNum = Number(gesamtbetrag);

      // Check if we have any MwSt information to work with
      const hasMwstInfo = (gesamtbetragMwst && Number(gesamtbetragMwst) > 0) ||
                         (form.values.speisen && Number(form.values.speisen) > 0) ||
                         (form.values.getraenke && Number(form.values.getraenke) > 0);

      if (bruttoNum > 0 && hasMwstInfo) {
        console.log('[Auto-Calc useEffect] Triggering backward calculation from Brutto');
        callBackendCalculation('gesamtbetrag');
      }
    }
  }, [form.values.gesamtbetrag, form.values.gesamtbetragMwst, form.values.istAuslaendischeRechnung]);

  // Watch for Netto changes → Calculate forward to Brutto
  useEffect(() => {
    // Skip if we're currently updating from backend to prevent infinite loop
    if (isUpdatingFromBackend.current) {
      return;
    }

    const netto = form.values.gesamtbetragNetto;
    const speisen = form.values.speisen;
    const getraenke = form.values.getraenke;

    console.log('[Auto-Calc useEffect] netto changed:', netto);

    // Only trigger if we have Netto and at least one MwSt component
    if (netto && !isNaN(Number(netto)) && !form.values.istAuslaendischeRechnung) {
      const nettoNum = Number(netto);
      const hasMwst = (speisen && Number(speisen) > 0) || (getraenke && Number(getraenke) > 0);

      if (nettoNum > 0 && hasMwst) {
        console.log('[Auto-Calc useEffect] Triggering forward calculation from Netto');
        callBackendCalculation('gesamtbetragNetto');
      }
    }
  }, [form.values.gesamtbetragNetto, form.values.speisen, form.values.getraenke, form.values.istAuslaendischeRechnung]);

  // Watch for MwSt component changes → Recalculate totals
  useEffect(() => {
    // Skip if we're currently updating from backend to prevent infinite loop
    if (isUpdatingFromBackend.current) {
      return;
    }

    const speisen = form.values.speisen;
    const getraenke = form.values.getraenke;

    console.log('[Auto-Calc useEffect] speisen or getraenke changed:', { speisen, getraenke });

    // Only trigger if at least one MwSt component exists
    if (!form.values.istAuslaendischeRechnung) {
      const hasMwst7 = speisen && !isNaN(Number(speisen)) && Number(speisen) > 0;
      const hasMwst19 = getraenke && !isNaN(Number(getraenke)) && Number(getraenke) > 0;

      if (hasMwst7) {
        console.log('[Auto-Calc useEffect] Triggering MwSt 7% calculation');
        callBackendCalculation('speisen');
      } else if (hasMwst19) {
        console.log('[Auto-Calc useEffect] Triggering MwSt 19% calculation');
        callBackendCalculation('getraenke');
      }
    }
  }, [form.values.speisen, form.values.getraenke, form.values.istAuslaendischeRechnung]);

  const extractDataFromImage = async (file: File, classificationType?: string, classificationData?: any) => {
    // Skip PDFs from OCR extraction - they need to be converted first
    if (file.type === 'application/pdf') {
      console.log('Skipping OCR for PDF file - needs conversion first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Pass classification type if available
      if (classificationType) {
        formData.append('classificationType', classificationType);
      }

      // Pass locale information from classification if available
      if (classificationData) {
        if (classificationData.locale) {
          formData.append('locale', classificationData.locale);
          console.log(`[OCR] Using locale: ${classificationData.locale}`);
        }
        if (classificationData.language) {
          formData.append('language', classificationData.language);
        }
        if (classificationData.region) {
          formData.append('region', classificationData.region);
        }
      }

      // ===== PASS EXISTING FORM VALUES FOR TRINKGELD CALCULATION =====
      // Pass rechnungGesamtbetrag if we have it (for Kreditkartenbeleg upload)
      if (form.values.gesamtbetrag) {
        formData.append('rechnungGesamtbetrag', form.values.gesamtbetrag);
        console.log(`[OCR] Passing rechnungGesamtbetrag: ${form.values.gesamtbetrag}`);
      }

      // Pass kreditkartenBetrag if we have it (for Rechnung upload after Kreditkartenbeleg)
      if (form.values.kreditkartenBetrag) {
        formData.append('kreditkartenBetrag', form.values.kreditkartenBetrag);
        console.log(`[OCR] Passing kreditkartenBetrag: ${form.values.kreditkartenBetrag}`);
      }

      console.log(`[OCR] Extracting data from ${file.name} (${classificationType || 'Unknown type'})`);

      const response = await fetch('/api/extract-receipt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', response.status, errorData);

        // Use the user-friendly message if available
        if (errorData.userMessage) {
          throw new Error(errorData.userMessage);
        }

        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[OCR] Extracted data from ${file.name}:`, data);

      // Use FormDataAccumulator to intelligently merge data
      const accumulator = new FormDataAccumulator(form.values);
      accumulator.mergeOcrData(data, classificationType || 'Rechnung');

      // Apply accumulated values to form using setFieldValue for each field
      accumulator.applyToForm(form);

      // CRITICAL DEBUG: Check form values IMMEDIATELY after applyToForm
      console.log(`[OCR] ===== FORM STATE IMMEDIATELY AFTER applyToForm() =====`);
      console.log(`[OCR] form.values.gesamtbetrag: "${form.values.gesamtbetrag}"`);
      console.log(`[OCR] form.values.kreditkartenBetrag: "${form.values.kreditkartenBetrag}"`);
      console.log(`[OCR] form.values.trinkgeld: "${form.values.trinkgeld}"`);
      console.log(`[OCR] form.values.trinkgeldMwst: "${form.values.trinkgeldMwst}"`);
      console.log(`[OCR] Full form.values:`, JSON.stringify(form.values, null, 2));
      console.log(`[OCR] ===== END FORM STATE CHECK =====`);

      console.log(`[OCR] Successfully applied ${classificationType || 'Rechnung'} data to form`);

      // Validate that all financial fields are populated
      const validation = accumulator.validateFinancialFields();
      if (!validation.isValid) {
        console.warn(`[OCR] Missing financial fields: ${validation.missingFields.join(', ')}`);
      } else {
        console.log('[OCR] All financial fields populated successfully ✓');
      }

    } catch (err) {
      console.error('Fehler bei der OCR-Verarbeitung:', err);

      // If it's already a user-friendly message, use it directly
      if (err instanceof Error && err.message.includes('📄') || err.message.includes('🔑') || err.message.includes('⏱️') || err.message.includes('❌')) {
        setError(err.message);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
        setError(`Fehler bei der Verarbeitung: ${errorMessage}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageChange = async (file: File | null) => {
    setSelectedImage(file);
    if (file) {
      // Get full classification data for the file
      const fileClassification = attachedFiles.find(f => f.file === file)?.classification;
      await extractDataFromImage(
        file,
        fileClassification?.type,
        fileClassification
      );
    }
  };

  const classifyDocument = async (fileId: string, file: File) => {
    try {
      let imageData: string | undefined;

      // For images and PDFs, prepare image data for classification
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        if (file.type === 'application/pdf') {
          // Convert PDF to image first
          const formData = new FormData();
          formData.append('file', file);

          const convertResponse = await fetch('/api/convert-pdf', {
            method: 'POST',
            body: formData
          });

          if (convertResponse.ok) {
            const result = await convertResponse.json();
            imageData = result.image;
          }
        } else {
          // For images, convert to base64
          const reader = new FileReader();
          imageData = await new Promise((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        }
      }

      // Call classification API
      const response = await fetch('/api/classify-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          image: imageData
        })
      });

      if (response.ok) {
        const classification = await response.json();
        console.log('Classification successful:', classification);

        // Store full classification data including locale information
        const fullClassification = {
          type: classification.type || 'Rechnung', // Default to Rechnung instead of Unbekannt
          confidence: classification.confidence || 0.5,
          isProcessing: false,
          // Include locale data for OCR
          language: classification.language,
          region: classification.region,
          locale: classification.locale,
          detectedLanguages: classification.detectedLanguages
        };

        setAttachedFiles(prev => prev.map(f =>
          f.id === fileId
            ? {
                ...f,
                classification: fullClassification
              }
            : f
        ));

        return fullClassification;
      } else {
        console.error('Classification failed:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Classification error:', error);

      // Try to determine type from filename as fallback
      let fallbackType = 'Rechnung';
      const lowerFileName = file.name.toLowerCase();
      if (lowerFileName.includes('kredit') || lowerFileName.includes('card') || lowerFileName.includes('beleg')) {
        fallbackType = 'Kreditkartenbeleg';
      }

      // Create fallback classification with default locale (de-DE)
      const fallbackClassification = {
        type: fallbackType,
        confidence: 0.3,
        isProcessing: false,
        language: 'de',
        region: 'DE',
        locale: 'de-DE'
      };

      // Mark classification as complete with fallback type
      setAttachedFiles(prev => prev.map(f =>
        f.id === fileId
          ? {
              ...f,
              classification: fallbackClassification
            }
          : f
      ));
      return fallbackClassification;
    }

    // Default fallback
    const defaultClassification = {
      type: 'Rechnung',
      confidence: 0.5,
      isProcessing: false,
      language: 'de',
      region: 'DE',
      locale: 'de-DE'
    };
    return defaultClassification;
  };

  const handleFileDrop = useCallback(async (files: File[]) => {
    const newFiles: FileWithPreview[] = [];

    for (const file of files) {
      const fileData: FileWithPreview = {
        file,
        id: Math.random().toString(36).substr(2, 9),
        isConverting: file.type === 'application/pdf',
        classification: { type: '', confidence: 0, isProcessing: true }
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachedFiles(prev => prev.map(f =>
            f.id === fileData.id ? { ...f, preview: e.target?.result as string } : f
          ));
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        // For PDFs, we'll create a generic PDF thumbnail
        // You could also use pdf.js or similar to generate actual thumbnails
        const pdfThumbnail = createPdfThumbnail();
        setAttachedFiles(prev => prev.map(f =>
          f.id === fileData.id ? { ...f, preview: pdfThumbnail } : f
        ));
      }

      newFiles.push(fileData);
    }

    setAttachedFiles(prev => [...prev, ...newFiles]);

    // Start classification for all files and get results
    const classificationResults = await Promise.all(
      newFiles.map(async (fileData, index) => {
        const classification = await classifyDocument(fileData.id, fileData.file);
        return { index, classification, fileData };
      })
    );

    // Set the first file as selected if none is selected yet
    if (!selectedImage && files.length > 0) {
      setSelectedImage(files[0]);
    }

    // Process ALL PDF files for OCR extraction (not just the first one)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileData = newFiles[i];
      const classification = classificationResults.find(r => r.index === i);

      if (file.type === 'application/pdf') {
        setError(null);
        setSuccess(false);

        // Show converting message
        setAttachedFiles(prev => prev.map(f =>
          f.id === fileData.id ? { ...f, isConverting: true } : f
        ));

        try {
          console.log(`Starting PDF conversion for: ${file.name} (${i + 1}/${files.length})`);

          // Convert PDF to image
          const formData = new FormData();
          formData.append('file', file);

          // Add timeout to fetch request (25 seconds)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000);

          const response = await fetch('/api/convert-pdf', {
            method: 'POST',
            body: formData,
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));

          console.log(`PDF conversion response status for ${file.name}:`, response.status);

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'PDF-Konvertierung fehlgeschlagen');
          }

          const result = await response.json();
          console.log(`PDF conversion result for ${file.name}:`, result.success);

          if (!result.success || !result.image) {
            throw new Error('PDF-Konvertierung fehlgeschlagen - keine Bilddaten erhalten');
          }

          // Create a temporary file object with the converted image
          console.log(`Creating blob from base64 image for ${file.name}...`);
          const convertedImageBlob = await fetch(result.image).then(r => r.blob());
          const convertedImageFile = new File([convertedImageBlob], file.name.replace('.pdf', '.jpg'), {
            type: 'image/jpeg'
          });
          console.log(`Converted image file created for ${file.name}:`, convertedImageFile.size, 'bytes');

          // Get classification for this file
          const fileClassification = classification?.classification;
          console.log(`PDF Classification for ${file.name}:`, fileClassification);

          // Extract data from the converted image - pass full classification data
          await extractDataFromImage(
            convertedImageFile,
            fileClassification?.type || 'Rechnung',
            fileClassification
          );

          // Update the file status - mark as NOT converting
          setAttachedFiles(prev => prev.map(f =>
            f.id === fileData.id ? { ...f, isConverting: false } : f
          ));

          console.log(`✅ Successfully processed PDF: ${file.name}`);

        } catch (error) {
          console.error(`PDF conversion error for ${file.name}:`, error);

          let errorMessage = `Fehler bei der PDF-Konvertierung von ${file.name}. Bitte füllen Sie die Felder manuell aus.`;

          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              errorMessage = `PDF-Konvertierung von ${file.name} abgebrochen: Zeitüberschreitung. Die Datei ist möglicherweise zu groß.`;
            } else if (error.message.includes('timeout')) {
              errorMessage = `PDF-Konvertierung von ${file.name} dauerte zu lange. Bitte versuchen Sie eine kleinere Datei.`;
            }
          }

          setError(errorMessage);

          // Mark as not converting even on error
          setAttachedFiles(prev => prev.map(f =>
            f.id === fileData.id ? { ...f, isConverting: false } : f
          ));
        }
      } else if (file.type.startsWith('image/')) {
        // Process image files directly - pass full classification data
        const fileClassification = classification?.classification;
        await extractDataFromImage(
          file,
          fileClassification?.type || 'Rechnung',
          fileClassification
        );
      }
    }

    console.log(`✅ Finished processing all ${files.length} file(s)`);
  }, [selectedImage, attachedFiles]);

  const handleFileRemove = useCallback((id: string) => {
    setAttachedFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);

      // If we removed the selected image, clear it
      const removedFile = prev.find(f => f.id === id);
      if (removedFile && selectedImage === removedFile.file) {
        setSelectedImage(null);
      }

      // Clear error when all files are removed
      if (newFiles.length === 0) {
        setError(null);
        setSuccess(false);
      }

      return newFiles;
    });
  }, [selectedImage]);

  const handleClassificationChange = useCallback((fileId: string, newType: string) => {
    setAttachedFiles(prev => prev.map(file =>
      file.id === fileId
        ? {
            ...file,
            classification: {
              ...file.classification!,
              type: newType,
              manualOverride: true
            }
          }
        : file
    ));
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Form submitted with values:', form.values);

    // Validate form before proceeding to preview
    const validation = form.validate();
    if (validation.hasErrors) {
      // Create detailed error message showing which fields are missing
      const missingFields = Object.entries(validation.errors)
        .map(([field, error]) => {
          // Map field names to German labels
          const fieldLabels: Record<string, string> = {
            datum: 'Datum',
            restaurantName: 'Restaurant',
            teilnehmer: 'Teilnehmer',
            anlass: 'Anlass',
            gesamtbetrag: 'Gesamtbetrag',
            zahlungsart: 'Zahlungsart',
            bewirtungsart: 'Bewirtungsart',
            geschaeftlicherAnlass: 'Geschäftlicher Anlass',
            geschaeftspartnerNamen: 'Namen der Geschäftspartner',
            geschaeftspartnerFirma: 'Firma der Geschäftspartner',
          };
          return fieldLabels[field] || field;
        })
        .join(', ');

      setError(`Bitte füllen Sie folgende Felder aus: ${missingFields}`);
      return;
    }

    // Navigate to preview page with form data
    handleNavigateToPreview();
  };

  const handleNavigateToPreview = () => {
    // Store form data in sessionStorage for preview page
    const formData = {
      ...form.values,
      datum: form.values.datum?.toISOString() || null,
      attachedFiles: attachedFiles.map(f => ({
        name: f.file.name,
        type: f.file.type,
        classification: f.classification
      }))
    };

    sessionStorage.setItem('bewirtungsbeleg-preview-data', JSON.stringify(formData));

    // Also store files in a way we can retrieve them
    const filePromises = attachedFiles.map(async (fileData) => {
      const reader = new FileReader();
      return new Promise<{ id: string; data: string; name: string; type: string; classification?: any }>((resolve) => {
        reader.onload = () => {
          resolve({
            id: fileData.id,
            data: reader.result as string,
            name: fileData.file.name,
            type: fileData.file.type,
            classification: fileData.classification
          });
        };
        reader.readAsDataURL(fileData.file);
      });
    });

    Promise.all(filePromises).then((filesData) => {
      sessionStorage.setItem('bewirtungsbeleg-preview-files', JSON.stringify(filesData));

      // Navigate to preview page
      window.location.href = '/bewirtungsbeleg/vorschau';
    });
  };

  const handleConfirm = async () => {
    console.log('Starting PDF generation...');
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate: If there's a Kreditkartenbeleg, there must also be a Rechnung
      const hasKreditkartenbeleg = attachedFiles.some(f => f.classification?.type === 'Kreditkartenbeleg');
      const hasRechnung = attachedFiles.some(f => f.classification?.type === 'Rechnung');

      if (hasKreditkartenbeleg && !hasRechnung) {
        setError('Ein Kreditkartenbeleg allein reicht nicht aus. Bitte fügen Sie auch die Rechnung hinzu.');
        setIsSubmitting(false);
        setShowConfirm(false);
        return;
      }

      console.log('Starting PDF generation with form values:', Object.keys(form.values));

      // Konvertiere alle Anhänge in Base64
      const attachments: Array<{ data: string; name: string; type: string; classification?: string }> = [];

      for (const fileData of attachedFiles) {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileData.file);
        });

        attachments.push({
          data: base64Data,
          name: fileData.file.name,
          type: fileData.file.type,
          classification: fileData.classification?.type
        });
      }

      // Sort attachments: Rechnung first, then Kreditkartenbeleg
      attachments.sort((a, b) => {
        if (a.classification === 'Rechnung' && b.classification !== 'Rechnung') return -1;
        if (a.classification !== 'Rechnung' && b.classification === 'Rechnung') return 1;
        if (a.classification === 'Kreditkartenbeleg' && b.classification !== 'Kreditkartenbeleg') return 1;
        if (a.classification !== 'Kreditkartenbeleg' && b.classification === 'Kreditkartenbeleg') return -1;
        return 0;
      });

      // For backward compatibility, keep the first image as the main image
      const imageData = attachments.length > 0 ? attachments[0].data : undefined;

      // Formatiere das Datum
      if (!form.values.datum) {
        throw new Error('Datum ist erforderlich');
      }
      const formattedDate = form.values.datum.toISOString().split('T')[0];

      // Konvertiere numerische Werte zu deutschem Dezimalformat
      const convertToGermanDecimal = (value: string | number) => {
        if (!value) return '';
        // Ensure number has 2 decimal places and convert to German format
        const numValue = Number(value);
        return numValue.toFixed(2).replace('.', ',');
      };

      // Erstelle die Daten für die API
      const apiData = {
        ...form.values,
        datum: formattedDate,
        anlass: form.values.geschaeftlicherAnlass || form.values.anlass, // Map geschaeftlicherAnlass to anlass
        gesamtbetrag: convertToGermanDecimal(form.values.gesamtbetrag),
        gesamtbetragMwst: convertToGermanDecimal(form.values.gesamtbetragMwst),
        gesamtbetragNetto: convertToGermanDecimal(form.values.gesamtbetragNetto),
        trinkgeld: convertToGermanDecimal(form.values.trinkgeld),
        trinkgeldMwst: convertToGermanDecimal(form.values.trinkgeldMwst),
        kreditkartenBetrag: convertToGermanDecimal(form.values.kreditkartenBetrag),
        // ZUGFeRD fields
        generateZugferd: form.values.generateZugferd,
        restaurantPlz: form.values.restaurantPlz,
        restaurantOrt: form.values.restaurantOrt,
        unternehmen: form.values.unternehmen,
        unternehmenAnschrift: form.values.unternehmenAnschrift,
        unternehmenPlz: form.values.unternehmenPlz,
        unternehmenOrt: form.values.unternehmenOrt,
        speisen: convertToGermanDecimal(form.values.speisen),
        getraenke: convertToGermanDecimal(form.values.getraenke),
        betragBrutto: convertToGermanDecimal(form.values.gesamtbetrag), // Add betragBrutto for ZUGFeRD
        bewirtetePersonen: form.values.teilnehmer, // Map teilnehmer to bewirtetePersonen for ZUGFeRD
        image: imageData,
        attachments: attachments
      };

      console.log('Sending data to PDF API:', apiData);
      console.log('API data keys:', Object.keys(apiData));
      console.log('Restaurant name:', apiData.restaurantName);

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('PDF generation error:', errorData);

        // Show detailed validation errors
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details.map((detail: any) =>
            `${detail.path?.join('.')}: ${detail.message}`
          ).join(', ');
          throw new Error(`Validierungsfehler: ${validationErrors}`);
        }

        throw new Error(errorData.error || 'Fehler bei der PDF-Generierung');
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
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Fehler beim Erstellen des PDFs. Bitte versuchen Sie es erneut.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGobdUpload = async () => {
    // Validate form first
    const validation = form.validate();
    if (validation.hasErrors) {
      setError('Bitte füllen Sie alle erforderlichen Felder aus');
      return;
    }

    console.log('[GoBD Upload] Starting upload to GoBD-Tresor...');
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate: If there's a Kreditkartenbeleg, there must also be a Rechnung
      const hasKreditkartenbeleg = attachedFiles.some(f => f.classification?.type === 'Kreditkartenbeleg');
      const hasRechnung = attachedFiles.some(f => f.classification?.type === 'Rechnung');

      if (hasKreditkartenbeleg && !hasRechnung) {
        throw new Error('Ein Kreditkartenbeleg allein reicht nicht aus. Bitte fügen Sie auch die Rechnung hinzu.');
      }

      // Generate PDF first (same as download flow)
      console.log('[GoBD Upload] Generating PDF...');

      // Convert all attachments to Base64
      const attachments: Array<{ data: string; name: string; type: string; classification?: string }> = [];

      for (const fileData of attachedFiles) {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileData.file);
        });

        attachments.push({
          data: base64Data,
          name: fileData.file.name,
          type: fileData.file.type,
          classification: fileData.classification?.type
        });
      }

      // Sort attachments: Rechnung first, then Kreditkartenbeleg
      attachments.sort((a, b) => {
        if (a.classification === 'Rechnung' && b.classification !== 'Rechnung') return -1;
        if (a.classification !== 'Rechnung' && b.classification === 'Rechnung') return 1;
        if (a.classification === 'Kreditkartenbeleg' && b.classification !== 'Kreditkartenbeleg') return 1;
        if (a.classification !== 'Kreditkartenbeleg' && b.classification === 'Kreditkartenbeleg') return -1;
        return 0;
      });

      // For backward compatibility, keep the first image as the main image
      const imageData = attachments.length > 0 ? attachments[0].data : undefined;

      // Format date
      if (!form.values.datum) {
        throw new Error('Datum ist erforderlich');
      }
      const formattedDate = form.values.datum.toISOString().split('T')[0];

      // Convert to German decimal format
      const convertToGermanDecimal = (value: string | number) => {
        if (!value) return '';
        const numValue = Number(value);
        return numValue.toFixed(2).replace('.', ',');
      };

      // Prepare API data
      const apiData = {
        ...form.values,
        datum: formattedDate,
        anlass: form.values.geschaeftlicherAnlass || form.values.anlass,
        gesamtbetrag: convertToGermanDecimal(form.values.gesamtbetrag),
        gesamtbetragMwst: convertToGermanDecimal(form.values.gesamtbetragMwst),
        gesamtbetragNetto: convertToGermanDecimal(form.values.gesamtbetragNetto),
        trinkgeld: convertToGermanDecimal(form.values.trinkgeld),
        trinkgeldMwst: convertToGermanDecimal(form.values.trinkgeldMwst),
        kreditkartenBetrag: convertToGermanDecimal(form.values.kreditkartenBetrag),
        generateZugferd: form.values.generateZugferd,
        restaurantPlz: form.values.restaurantPlz,
        restaurantOrt: form.values.restaurantOrt,
        unternehmen: form.values.unternehmen,
        unternehmenAnschrift: form.values.unternehmenAnschrift,
        unternehmenPlz: form.values.unternehmenPlz,
        unternehmenOrt: form.values.unternehmenOrt,
        speisen: convertToGermanDecimal(form.values.speisen),
        getraenke: convertToGermanDecimal(form.values.getraenke),
        betragBrutto: convertToGermanDecimal(form.values.gesamtbetrag),
        bewirtetePersonen: form.values.teilnehmer,
        image: imageData,
        attachments: attachments
      };

      console.log('[GoBD Upload] Generating PDF document...');

      // Generate PDF via API
      const pdfResponse = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!pdfResponse.ok) {
        const errorData = await pdfResponse.json();
        console.error('[GoBD Upload] PDF generation error:', errorData);
        throw new Error(errorData.error || 'Fehler bei der PDF-Generierung');
      }

      // Get PDF as blob
      const pdfBlob = await pdfResponse.blob();
      console.log('[GoBD Upload] PDF generated successfully, size:', pdfBlob.size);

      // Convert PDF to base64 for upload
      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:application/pdf;base64, prefix
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      // Generate PNG preview from PDF (using first page)
      // For now, we'll use a placeholder - in production, use pdf-to-image conversion
      console.log('[GoBD Upload] Generating PNG preview...');

      // Create a simple placeholder PNG (in production, convert PDF first page)
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1131; // A4 aspect ratio
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add some content
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Bewirtungsbeleg', canvas.width / 2, 60);
        ctx.font = '16px Arial';
        ctx.fillText(form.values.restaurantName, canvas.width / 2, 100);
        ctx.fillText(`Datum: ${form.values.datum.toLocaleDateString('de-DE')}`, canvas.width / 2, 140);
        ctx.fillText(`Betrag: ${apiData.gesamtbetrag} EUR`, canvas.width / 2, 180);
      }

      const pngBase64 = canvas.toDataURL('image/png').split(',')[1];

      // Prepare metadata for upload
      const metadata = {
        ...apiData,
        uploadDate: new Date().toISOString(),
        fileName: `bewirtungsbeleg-${formattedDate}.pdf`,
      };

      console.log('[GoBD Upload] Uploading to DigitalOcean Spaces...');

      // Upload to DigitalOcean Spaces and index in OpenSearch
      const uploadResponse = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64,
          pngBase64,
          metadata,
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error('[GoBD Upload] Upload error:', errorData);
        throw new Error(errorData.error || 'Fehler beim Hochladen in den GoBD-Tresor');
      }

      const uploadResult = await uploadResponse.json();
      console.log('[GoBD Upload] Upload successful:', uploadResult);

      setSuccess('Bewirtungsbeleg wurde erfolgreich in den GoBD-Tresor hochgeladen!');

      // Optionally reset form after successful upload
      // form.reset();
      // setAttachedFiles([]);
      // setSelectedImage(null);

    } catch (error) {
      console.error('[GoBD Upload] Error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Fehler beim Hochladen in den GoBD-Tresor. Bitte versuchen Sie es erneut.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKreditkartenBetragChange = async (value: string | number) => {
    console.log('[Trinkgeld Debug] ===== handleKreditkartenBetragChange START =====');
    console.log('[Trinkgeld Debug] Input value:', value);

    const kkBetrag = String(value).replace(',', '.');
    console.log('[Trinkgeld Debug] Converted kkBetrag:', kkBetrag);
    console.log('[Trinkgeld Debug] Current form.values.gesamtbetrag:', form.values.gesamtbetrag);
    console.log('[Trinkgeld Debug] Current form.values.trinkgeld:', form.values.trinkgeld);

    form.setFieldValue('kreditkartenBetrag', kkBetrag);
    console.log('[Trinkgeld Debug] Set kreditkartenBetrag in form, calling backend...');

    await callBackendCalculation('kreditkartenBetrag');

    console.log('[Trinkgeld Debug] Backend calculation complete');
    console.log('[Trinkgeld Debug] After backend - form.values.trinkgeld:', form.values.trinkgeld);
    console.log('[Trinkgeld Debug] After backend - form.values.trinkgeldMwst:', form.values.trinkgeldMwst);
    console.log('[Trinkgeld Debug] ===== handleKreditkartenBetragChange END =====');
  };

  // ===== NEW CALCULATION LOGIC FOR CORRECT GERMAN RECEIPT ORDER =====

  /**
   * Helper function to call backend calculation API
   * Sends current form state to backend and updates form with result
   */
  const callBackendCalculation = async (changedField: string) => {
    try {
      const requestPayload = {
        gesamtbetragNetto: form.values.gesamtbetragNetto ? Number(form.values.gesamtbetragNetto) : undefined,
        speisen: form.values.speisen ? Number(form.values.speisen) : undefined,
        getraenke: form.values.getraenke ? Number(form.values.getraenke) : undefined,
        gesamtbetragMwst: form.values.gesamtbetragMwst ? Number(form.values.gesamtbetragMwst) : undefined,
        gesamtbetrag: form.values.gesamtbetrag ? Number(form.values.gesamtbetrag) : undefined,
        kreditkartenBetrag: form.values.kreditkartenBetrag ? Number(form.values.kreditkartenBetrag) : undefined,
        trinkgeld: form.values.trinkgeld ? Number(form.values.trinkgeld) : undefined,
        trinkgeldMwst: form.values.trinkgeldMwst ? Number(form.values.trinkgeldMwst) : undefined,
        istAuslaendischeRechnung: form.values.istAuslaendischeRechnung,
        changedField
      };

      console.log(`[Backend API Call] Sending request for ${changedField}:`, requestPayload);

      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      console.log(`[Backend API Call] Response status for ${changedField}:`, response.status);

      if (response.ok) {
        const responseData = await response.json();
        const { result } = responseData;

        console.log(`[Backend API Call] Response received for ${changedField}:`, result);

        // Set ref to prevent useEffect from triggering infinite loop
        isUpdatingFromBackend.current = true;

        // Update form with calculated values
        form.setFieldValue('gesamtbetragNetto', result.gesamtbetragNetto.toFixed(2));
        form.setFieldValue('speisen', result.speisen.toFixed(2));
        form.setFieldValue('getraenke', result.getraenke.toFixed(2));
        form.setFieldValue('gesamtbetragMwst', result.gesamtbetragMwst.toFixed(2));
        form.setFieldValue('gesamtbetrag', result.gesamtbetrag.toFixed(2));

        if (result.kreditkartenBetrag !== undefined) {
          console.log(`[Backend API Call] Setting kreditkartenBetrag to: ${result.kreditkartenBetrag.toFixed(2)}`);
          form.setFieldValue('kreditkartenBetrag', result.kreditkartenBetrag.toFixed(2));
        }
        if (result.trinkgeld !== undefined) {
          console.log(`[Backend API Call] Setting trinkgeld to: ${result.trinkgeld.toFixed(2)}`);
          form.setFieldValue('trinkgeld', result.trinkgeld.toFixed(2));
        }
        if (result.trinkgeldMwst !== undefined) {
          console.log(`[Backend API Call] Setting trinkgeldMwst to: ${result.trinkgeldMwst.toFixed(2)}`);
          form.setFieldValue('trinkgeldMwst', result.trinkgeldMwst.toFixed(2));
        }

        // Reset ref after a short delay to allow React to process updates
        setTimeout(() => {
          isUpdatingFromBackend.current = false;
          console.log('[Backend API Call] Reset isUpdatingFromBackend flag');
        }, 100);

        console.log(`[Backend Calculation] ${changedField}:`, result);

        if (result.warnings && result.warnings.length > 0) {
          console.warn('[Backend Calculation] Warnings:', result.warnings);
        }
      } else {
        const errorText = await response.text();
        console.error(`[Backend API Call] Backend calculation failed for ${changedField}:`, response.status, errorText);
      }
    } catch (error) {
      console.error(`[Backend API Call] Error calling backend calculation for ${changedField}:`, error);
      // Reset ref on error as well
      isUpdatingFromBackend.current = false;
    }
  };

  // Handler for Netto field changes - calls backend
  const handleNettoChange = async (value: string | number) => {
    const netto = String(value).replace(',', '.');
    form.setFieldValue('gesamtbetragNetto', netto);
    await callBackendCalculation('gesamtbetragNetto');
  };

  // Handler for MwSt 7% field changes - calls backend
  const handleMwst7Change = async (value: string | number) => {
    const mwst7 = String(value).replace(',', '.');
    form.setFieldValue('speisen', mwst7);
    await callBackendCalculation('speisen');
  };

  // Handler for MwSt 19% field changes - calls backend
  const handleMwst19Change = async (value: string | number) => {
    const mwst19 = String(value).replace(',', '.');
    form.setFieldValue('getraenke', mwst19);
    await callBackendCalculation('getraenke');
  };

  // Handler for Total MwSt field changes - triggers backend breakdown calculation
  const handleTotalMwstChange = async (value: string | number) => {
    const totalMwst = String(value).replace(',', '.');
    form.setFieldValue('gesamtbetragMwst', totalMwst);

    // Call backend to calculate breakdown and update all fields
    await callBackendCalculation('gesamtbetragMwst');
  };


  // Handler for Brutto (Gesamtbetrag) field changes - calls backend for backward calculation
  const handleBruttoChange = async (value: string | number) => {
    const brutto = String(value).replace(',', '.');
    form.setFieldValue('gesamtbetrag', brutto);
    await callBackendCalculation('gesamtbetrag');
  };

  // Handler for Trinkgeld changes - recalculates Kreditkartenbetrag
  const handleTrinkgeldChange = async (value: string | number) => {
    const trinkgeld = String(value).replace(',', '.');
    form.setFieldValue('trinkgeld', trinkgeld);

    // If Trinkgeld is entered, calculate Kreditkartenbetrag = Gesamtbetrag + Trinkgeld
    if (trinkgeld && form.values.gesamtbetrag) {
      const gesamtbetrag = Number(form.values.gesamtbetrag);
      const trinkgeldNum = Number(trinkgeld);
      const kkBetrag = (gesamtbetrag + trinkgeldNum).toFixed(2);
      form.setFieldValue('kreditkartenBetrag', kkBetrag);

      // Call backend to recalculate Trinkgeld MwSt
      await callBackendCalculation('trinkgeld');
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

  // JSON Download functionality
  const handleJsonDownload = () => {
    try {
      // Prepare form data for export
      const exportData = {
        ...form.values,
        // Convert date to ISO string for JSON serialization
        datum: form.values.datum?.toISOString() || null,
        // Include metadata
        exportTimestamp: new Date().toISOString(),
        version: '1.0'
      };

      // Create JSON blob
      const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      // Create download link
      const url = URL.createObjectURL(jsonBlob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with current date
      const today = new Date().toISOString().split('T')[0];
      link.download = `bewirtungsbeleg-${today}.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('JSON-Datei wurde heruntergeladen!');
    } catch (error) {
      console.error('JSON Download Error:', error);
      setError('Fehler beim Herunterladen der JSON-Datei');
    }
  };

  // JSON Upload functionality
  const handleJsonUpload = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);

        // Validate basic structure
        if (typeof jsonData !== 'object' || jsonData === null) {
          throw new Error('Invalid JSON structure');
        }

        // Convert date string back to Date object if present
        if (jsonData.datum && typeof jsonData.datum === 'string') {
          jsonData.datum = new Date(jsonData.datum);
        }

        // Remove metadata fields that shouldn't be imported
        const { exportTimestamp, version, ...importData } = jsonData;

        // Set form values
        form.setValues(importData);

        setSuccess('Formulardaten wurden erfolgreich importiert!');
      } catch (error) {
        console.error('JSON Upload Error:', error);
        setError('Fehler beim Importieren der JSON-Datei. Bitte überprüfen Sie das Dateiformat.');
      }
    };

    reader.readAsText(file);
  };

  return (
    <Container size="1600px" py="xs" style={{ maxWidth: '95%' }}>
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
          {typeof success === 'string' ? success : 'Bewirtungsbeleg wurde erfolgreich als PDF erstellt!'}
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

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: selectedImage ? 8 : 12 }}>
          <Paper shadow="sm" p="xs">
            <form onSubmit={handleSubmit}>
              <Stack gap="xs">
                {/* Locale Selector */}
                <Select
                  label="Zahlenformat"
                  description="Wählen Sie das Zahlenformat für die Anzeige. Die Daten werden automatisch umgerechnet."
                  placeholder="Format wählen"
                  data={Object.values(LOCALE_CONFIGS).map(config => ({
                    value: config.code,
                    label: `${config.name} (${config.numberFormat.example})`
                  }))}
                  value={locale.code}
                  onChange={(value) => value && setLocale(value)}
                  size="sm"
                  styles={{
                    label: { fontWeight: 600, fontSize: '14px' },
                    input: { backgroundColor: '#f0f9ff', borderColor: '#228be6' }
                  }}
                />

                <Divider my="xs" />

                <Title order={1} size="h6">
                  Bewirtungsbeleg
                </Title>

                <Checkbox
                  label="Eigenbeleg (ohne Originalbeleg)"
                  description="Aktivieren Sie diese Option, wenn Sie keinen Originalbeleg haben. Hinweis: Bei Eigenbelegen kann die Vorsteuer (MwSt.) nicht geltend gemacht werden."
                  checked={form.values.istEigenbeleg}
                  onChange={(event) => form.setFieldValue('istEigenbeleg', event.currentTarget.checked)}
                  mb="md"
                />

                <Box>
                  <Title order={2} size="h6">Allgemeine Angaben</Title>
                  <Stack gap="xs">
                    {!form.values.istEigenbeleg && (
                      <Box>
                        <Text size="sm" fw={500} mb="xs">Foto/Scan der Rechnung</Text>
                        <Text size="xs" c="dimmed" mb="sm">
                          Laden Sie Fotos, Scans oder PDFs hoch - die Daten werden automatisch extrahiert
                        </Text>
                        <MultiFileDropzone
                          files={attachedFiles}
                          onDrop={handleFileDrop}
                          onRemove={handleFileRemove}
                          onFileClick={handleImageChange}
                          onClassificationChange={handleClassificationChange}
                          selectedFile={selectedImage}
                          loading={isProcessing}
                        />
                      </Box>
                    )}
                    {form.values.istEigenbeleg && (
                      <Alert color="yellow" variant="light" icon={<IconAlertCircle size="1rem" />}>
                        <Text size="sm" fw={500}>Hinweis zur Eigenbeleg-Erstellung</Text>
                        <Text size="xs" mt="xs">
                          Da Sie einen Eigenbeleg ohne Originalrechnung erstellen, kann die Vorsteuer (MwSt.)
                          steuerlich nicht geltend gemacht werden. Bitte füllen Sie alle erforderlichen Felder
                          manuell aus.
                        </Text>
                      </Alert>
                    )}
                    <DateInput
                      label="Datum der Bewirtung"
                      placeholder="Wählen Sie ein Datum"
                      required
                      valueFormat="DD.MM.YYYY"
                      size="sm"
                      {...form.getInputProps('datum')}
                    />
                    <SanitizedTextInput
                      label="Restaurant"
                      placeholder="Name des Restaurants"
                      required
                      size="sm"
                      {...form.getInputProps('restaurantName')}
                    />
                    <SanitizedTextInput
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
                      <SanitizedTextInput
                        label="Andere Währung"
                        placeholder="z.B. CAD, AUD, NZD"
                        value={form.values.auslaendischeWaehrung}
                        onChangeEvent={(event) => form.setFieldValue('auslaendischeWaehrung', event.currentTarget.value)}
                      />
                    )}

                    <Divider my="xs" />

                    <Checkbox
                      label="ZUGFeRD-kompatibles PDF generieren"
                      description="Erstellt ein elektronisches Rechnungsformat nach ZUGFeRD 2.0 Standard für die digitale Archivierung"
                      checked={form.values.generateZugferd}
                      onChange={(event) => form.setFieldValue('generateZugferd', event.currentTarget.checked)}
                    />

                    {form.values.generateZugferd && (
                      <Stack gap="xs">
                        <Text size="xs" c="dimmed">
                          Zusätzliche Informationen für ZUGFeRD benötigt:
                        </Text>
                        <Grid>
                          <Grid.Col span={6}>
                            <SanitizedTextInput
                              label="Restaurant PLZ"
                              placeholder="z.B. 10115"
                              size="sm"
                              {...form.getInputProps('restaurantPlz')}
                            />
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <SanitizedTextInput
                              label="Restaurant Ort"
                              placeholder="z.B. Berlin"
                              size="sm"
                              {...form.getInputProps('restaurantOrt')}
                            />
                          </Grid.Col>
                        </Grid>
                        <SanitizedTextInput
                          label="Ihr Unternehmen"
                          placeholder="Name Ihres Unternehmens"
                          size="sm"
                          {...form.getInputProps('unternehmen')}
                        />
                        <SanitizedTextInput
                          label="Unternehmensanschrift"
                          placeholder="Straße und Hausnummer"
                          size="sm"
                          {...form.getInputProps('unternehmenAnschrift')}
                        />
                        <Grid>
                          <Grid.Col span={6}>
                            <SanitizedTextInput
                              label="Unternehmens-PLZ"
                              placeholder="z.B. 20099"
                              size="sm"
                              {...form.getInputProps('unternehmenPlz')}
                            />
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <SanitizedTextInput
                              label="Unternehmens-Ort"
                              placeholder="z.B. Hamburg"
                              size="sm"
                              {...form.getInputProps('unternehmenOrt')}
                            />
                          </Grid.Col>
                        </Grid>
                        <Grid>
                          <Grid.Col span={6}>
                            <NumberInput
                              label="Speisen"
                              placeholder="Betrag für Speisen"
                              min={0}
                              step={0.01}
                              size="sm"
                              decimalScale={2}
                              fixedDecimalScale
                              decimalSeparator={locale.numberFormat.decimalSeparator}
                              thousandSeparator={locale.numberFormat.thousandSeparator}
                              description="7% MwSt."
                              {...form.getInputProps('speisen')}
                            />
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <NumberInput
                              label="Getränke"
                              placeholder="Betrag für Getränke"
                              min={0}
                              step={0.01}
                              size="sm"
                              decimalScale={2}
                              fixedDecimalScale
                              decimalSeparator={locale.numberFormat.decimalSeparator}
                              thousandSeparator={locale.numberFormat.thousandSeparator}
                              description="19% MwSt."
                              {...form.getInputProps('getraenke')}
                            />
                          </Grid.Col>
                        </Grid>
                      </Stack>
                    )}

                    {/* Financial Section with Correct German Receipt Logic */}
                    <Paper p="md" withBorder radius="md" style={{ backgroundColor: '#f8f9fa', borderColor: '#dee2e6' }}>
                      <Stack gap="lg">
                        <Box>
                          <Title order={3} size="h5" mb="xs" style={{ color: '#228be6' }}>
                            💰 Finanzielle Berechnung
                          </Title>
                          <Text size="sm" c="dimmed">
                            Bitte folgen Sie der Reihenfolge auf Ihrer Rechnung: Netto → MwSt. → Gesamtsumme → Bezahlter Betrag → Trinkgeld
                          </Text>
                        </Box>

                        {/* Two-column layout: Input fields left, Visual calculation right */}
                        <Grid gutter="lg">
                          <Grid.Col span={{ base: 12, md: 7 }}>
                            <Paper p="md" withBorder radius="md" style={{ backgroundColor: '#ffffff', borderColor: '#e3f2fd' }}>
                              <Stack gap="md">
                                <Box>
                                  <Text size="sm" fw={700} c="blue" mb="xs" tt="uppercase">
                                    📝 Eingabefelder
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    Tragen Sie die Beträge von Ihrer Rechnung ein
                                  </Text>
                                </Box>

                                {/* Step 1: Netto Betrag */}
                                <Box>
                                  <NumberInput
                                    label="1. Netto Betrag"
                                    placeholder="Netto von der Rechnung"
                                    min={0}
                                    step={0.01}
                                    size="md"
                                    decimalScale={2}
                                    fixedDecimalScale
                                    decimalSeparator={locale.numberFormat.decimalSeparator}
                                    thousandSeparator={locale.numberFormat.thousandSeparator}
                                    description="Netto-Gesamtsumme von der Rechnung"
                                    value={form.values.gesamtbetragNetto}
                                    onChange={handleNettoChange}
                                    error={form.errors.gesamtbetragNetto}
                                    styles={{
                                      label: { fontWeight: 600, fontSize: '14px' },
                                      input: {
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        backgroundColor: '#f8f9fa',
                                        borderColor: '#228be6'
                                      }
                                    }}
                                  />
                                </Box>

                                {/* Step 2: MwSt fields (7% + 19%) */}
                                {!form.values.istAuslaendischeRechnung && (
                                  <Box>
                                    <Text size="sm" fw={600} mb="xs">2. Mehrwertsteuer</Text>
                                    <Grid gutter="sm">
                                      <Grid.Col span={6}>
                                        <NumberInput
                                          label="MwSt. 7%"
                                          placeholder="Speisen"
                                          min={0}
                                          step={0.01}
                                          size="md"
                                          decimalScale={2}
                                          fixedDecimalScale
                                          decimalSeparator={locale.numberFormat.decimalSeparator}
                                          thousandSeparator={locale.numberFormat.thousandSeparator}
                                          description="7% (Speisen)"
                                          value={form.values.speisen}
                                          onChange={handleMwst7Change}
                                          error={form.errors.speisen}
                                          styles={{
                                            label: { fontWeight: 600, fontSize: '13px' },
                                            input: {
                                              backgroundColor: '#fff4e6',
                                              borderColor: '#fd7e14',
                                              fontWeight: 500
                                            }
                                          }}
                                        />
                                      </Grid.Col>
                                      <Grid.Col span={6}>
                                        <NumberInput
                                          label="MwSt. 19%"
                                          placeholder="Getränke"
                                          min={0}
                                          step={0.01}
                                          size="md"
                                          decimalScale={2}
                                          fixedDecimalScale
                                          decimalSeparator={locale.numberFormat.decimalSeparator}
                                          thousandSeparator={locale.numberFormat.thousandSeparator}
                                          description="19% (Getränke)"
                                          value={form.values.getraenke}
                                          onChange={handleMwst19Change}
                                          error={form.errors.getraenke}
                                          styles={{
                                            label: { fontWeight: 600, fontSize: '13px' },
                                            input: {
                                              backgroundColor: '#fff4e6',
                                              borderColor: '#fd7e14',
                                              fontWeight: 500
                                            }
                                          }}
                                        />
                                      </Grid.Col>
                                    </Grid>

                                    {/* Total MwSt (calculated from 7% + 19%) */}
                                    <Box mt="sm">
                                      <NumberInput
                                        label="Gesamt MwSt."
                                        placeholder="Summe aller MwSt."
                                        min={0}
                                        step={0.01}
                                        size="md"
                                        decimalScale={2}
                                        fixedDecimalScale
                                        decimalSeparator={locale.numberFormat.decimalSeparator}
                                        thousandSeparator={locale.numberFormat.thousandSeparator}
                                        description="= MwSt. 7% + MwSt. 19%"
                                        {...form.getInputProps('gesamtbetragMwst')}
                                        readOnly
                                        styles={{
                                          label: { fontWeight: 600, fontSize: '13px' },
                                          input: {
                                            backgroundColor: '#ffe8cc',
                                            fontWeight: 600,
                                            color: '#d9480f',
                                            borderColor: '#fd7e14'
                                          }
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                )}

                                {/* Step 3: Gesamtbetrag (calculated: Netto + Total MwSt OR editable for backward calc) */}
                                <Box>
                                  <NumberInput
                                    label="3. Brutto Gesamtbetrag"
                                    placeholder="Gesamtsumme von der Rechnung"
                                    required
                                    min={0}
                                    step={0.01}
                                    size="lg"
                                    decimalScale={2}
                                    fixedDecimalScale
                                    decimalSeparator={locale.numberFormat.decimalSeparator}
                                    thousandSeparator={locale.numberFormat.thousandSeparator}
                                    description={form.values.istAuslaendischeRechnung
                                      ? `Betrag in ${form.values.auslaendischeWaehrung || 'ausländischer Währung'}`
                                      : "Editierbar: Brutto ⇄ Netto (Berechnung in beide Richtungen)"}
                                    value={form.values.gesamtbetrag}
                                    onChange={handleBruttoChange}
                                    error={form.errors.gesamtbetrag}
                                    styles={{
                                      label: { fontWeight: 700, fontSize: '15px', color: '#1971c2' },
                                      input: {
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        backgroundColor: '#e3f2fd',
                                        borderColor: '#1971c2',
                                        borderWidth: 2,
                                        color: '#0c4a6e'
                                      }
                                    }}
                                  />
                                </Box>

                                <Divider my="xs" />

                                {/* Step 4: Bezahlter Betrag (Bar/Kreditkarte) */}
                                <Box>
                                  <NumberInput
                                    label="4. Bezahlter Betrag"
                                    placeholder="Betrag Bar/Kreditkarte"
                                    min={0}
                                    step={0.01}
                                    size="md"
                                    decimalScale={2}
                                    fixedDecimalScale
                                    decimalSeparator={locale.numberFormat.decimalSeparator}
                                    thousandSeparator={locale.numberFormat.thousandSeparator}
                                    description="Was wurde tatsächlich bezahlt? (inkl. Trinkgeld)"
                                    value={form.values.kreditkartenBetrag}
                                    onChange={handleKreditkartenBetragChange}
                                    error={form.errors.kreditkartenBetrag}
                                    styles={{
                                      label: { fontWeight: 600, fontSize: '14px' },
                                      input: {
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        backgroundColor: '#f8f9fa',
                                        borderColor: '#228be6'
                                      }
                                    }}
                                  />
                                </Box>

                                {/* Step 5: Trinkgeld (calculated automatically) */}
                                <Box>
                                  <NumberInput
                                    label="5. Trinkgeld"
                                    placeholder="Trinkgeld"
                                    min={0}
                                    step={0.01}
                                    size="md"
                                    decimalScale={2}
                                    fixedDecimalScale
                                    decimalSeparator={locale.numberFormat.decimalSeparator}
                                    thousandSeparator={locale.numberFormat.thousandSeparator}
                                    description="= Bezahlt - Gesamtbetrag (automatisch berechnet)"
                                    {...form.getInputProps('trinkgeld')}
                                    readOnly
                                    styles={{
                                      label: { fontWeight: 600, fontSize: '14px' },
                                      input: {
                                        backgroundColor: '#d0f4de',
                                        color: '#2b8a3e',
                                        fontWeight: 700,
                                        fontSize: '16px',
                                        borderColor: '#40c057'
                                      }
                                    }}
                                  />
                                </Box>

                                {/* MwSt on Trinkgeld */}
                                {!form.values.istAuslaendischeRechnung && (
                                  <Box>
                                    <NumberInput
                                      label="MwSt. Trinkgeld (19%)"
                                      placeholder="MwSt. auf Trinkgeld"
                                      min={0}
                                      step={0.01}
                                      size="sm"
                                      decimalScale={2}
                                      fixedDecimalScale
                                      decimalSeparator={locale.numberFormat.decimalSeparator}
                                      thousandSeparator={locale.numberFormat.thousandSeparator}
                                      description="19% vom Trinkgeld"
                                      {...form.getInputProps('trinkgeldMwst')}
                                      readOnly
                                      styles={{
                                        label: { fontWeight: 600, fontSize: '13px' },
                                        input: {
                                          backgroundColor: '#e7f5dd',
                                          borderColor: '#82c91e'
                                        }
                                      }}
                                    />
                                  </Box>
                                )}
                              </Stack>
                            </Paper>
                          </Grid.Col>

                          {/* Visual Calculation Display (Right Column) */}
                          <Grid.Col span={{ base: 12, md: 5 }}>
                            <CalculationPanel
                              gesamtbetragNetto={form.values.gesamtbetragNetto}
                              speisen={form.values.speisen}
                              getraenke={form.values.getraenke}
                              gesamtbetragMwst={form.values.gesamtbetragMwst}
                              gesamtbetrag={form.values.gesamtbetrag}
                              kreditkartenBetrag={form.values.kreditkartenBetrag}
                              trinkgeld={form.values.trinkgeld}
                              trinkgeldMwst={form.values.trinkgeldMwst}
                              istAuslaendischeRechnung={form.values.istAuslaendischeRechnung}
                            />
                          </Grid.Col>
                        </Grid>

                        {/* Zahlungsart below the calculations */}
                        <Select
                          label="Zahlungsart"
                          placeholder="Wählen Sie die Zahlungsart"
                          required
                          size="sm"
                          description="Wie wurde bezahlt? Die Rechnung muss auf die Firma ausgestellt sein."
                          data={[
                            { value: 'firma', label: 'Firmenkreditkarte' },
                            { value: 'privat', label: 'Private Kreditkarte' },
                            { value: 'bar', label: 'Bar' },
                          ]}
                          {...form.getInputProps('zahlungsart')}
                        />
                      </Stack>
                    </Paper>
                  </Stack>
                </Box>

                <Box>
                  <Title order={2} size="h6">Geschäftlicher Anlass</Title>
                  <Stack gap="xs">
                    <SanitizedTextInput
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
                    <SanitizedTextarea
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
                        <SanitizedTextInput
                          label="Namen der Geschäftspartner"
                          placeholder="Namen der Geschäftspartner"
                          required
                          size="sm"
                          description="Geben Sie die Namen der Geschäftspartner ein"
                          {...form.getInputProps('geschaeftspartnerNamen')}
                        />
                        <SanitizedTextInput
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

                {/* JSON Download/Upload Buttons */}
                <Group grow mb="sm">
                  <Button
                    variant="outline"
                    size="sm"
                    leftSection={<IconDownload size={16} />}
                    onClick={handleJsonDownload}
                  >
                    JSON Download
                  </Button>

                  <FileInput
                    placeholder="JSON Upload"
                    size="sm"
                    leftSection={<IconUpload size={16} />}
                    accept=".json"
                    onChange={(file) => file && handleJsonUpload(file)}
                    clearable
                  />
                </Group>

                {/* Single Weiter button to navigate to preview page */}
                <Button
                  type="submit"
                  size="md"
                  fullWidth
                  loading={isSubmitting}
                >
                  Weiter
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid.Col>

        {selectedImage && (
          <Grid.Col span={{ base: 12, md: 4 }}>
            <ImageEditor
              file={selectedImage}
              onImageUpdate={(processedUrl) => {
                console.log('Image updated:', processedUrl);
              }}
            />
          </Grid.Col>
        )}
      </Grid>
    </Container>
  );
}
