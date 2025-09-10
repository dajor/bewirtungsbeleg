'use client';

import React, { useState, useCallback } from 'react';
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

  const extractDataFromImage = async (file: File, classificationType?: string) => {
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
      
      // Handle tip if present
      let trinkgeld = data.trinkgeld ? data.trinkgeld.replace(',', '.') : '';
      
      // Handle Kreditkartenbeleg vs Rechnung differently
      if (classificationType === 'Kreditkartenbeleg') {
        // For Kreditkartenbeleg, only update kreditkartenBetrag and keep other fields from existing form
        form.setValues({
          ...form.values,
          restaurantName: data.restaurantName || form.values.restaurantName,
          datum: data.datum ? new Date(data.datum.split('.').reverse().join('-')) : form.values.datum,
          kreditkartenBetrag: finalGesamtbetrag || form.values.kreditkartenBetrag,
          // Don't update gesamtbetrag, mwst, netto for Kreditkartenbeleg
        });
      } else {
        // For Rechnung, update all financial fields
        form.setValues({
          ...form.values,
          restaurantName: data.restaurantName || form.values.restaurantName,
          restaurantAnschrift: data.restaurantAnschrift || form.values.restaurantAnschrift,
          gesamtbetrag: finalGesamtbetrag || form.values.gesamtbetrag,
          gesamtbetragMwst: finalMwst || form.values.gesamtbetragMwst,
          gesamtbetragNetto: finalNetto || form.values.gesamtbetragNetto,
          datum: data.datum ? new Date(data.datum.split('.').reverse().join('-')) : form.values.datum,
          trinkgeld: trinkgeld || form.values.trinkgeld,
          kreditkartenBetrag: form.values.kreditkartenBetrag, // Keep existing value for Rechnung
        });
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
      // Get classification for the file
      const fileClassification = attachedFiles.find(f => f.file === file)?.classification;
      await extractDataFromImage(file, fileClassification?.type);
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
        setAttachedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { 
                ...f, 
                classification: {
                  type: classification.type || 'Rechnung', // Default to Rechnung instead of Unbekannt
                  confidence: classification.confidence || 0.5,
                  isProcessing: false
                }
              } 
            : f
        ));
        return classification.type || 'Rechnung';
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
      
      // Mark classification as complete with fallback type
      setAttachedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              classification: {
                type: fallbackType,
                confidence: 0.3,
                isProcessing: false
              }
            } 
          : f
      ));
      return fallbackType;
    }
    return 'Rechnung'; // Default to Rechnung instead of Unbekannt
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
        const type = await classifyDocument(fileData.id, fileData.file);
        return { index, type };
      })
    );

    // Process the first file for OCR if no file has been processed yet
    if (!selectedImage && files.length > 0) {
      const firstFile = files[0];
      setSelectedImage(firstFile);
      
      // If it's a PDF, convert it to image first for OCR
      if (firstFile.type === 'application/pdf') {
        setError(null);
        setSuccess(false);
        
        // Show converting message
        const fileId = newFiles[0].id;
        setAttachedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, isConverting: true } : f
        ));
        
        try {
          console.log('Starting PDF conversion for:', firstFile.name);
          
          // Convert PDF to image
          const formData = new FormData();
          formData.append('file', firstFile);
          
          // Add timeout to fetch request (25 seconds)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000);
          
          const response = await fetch('/api/convert-pdf', {
            method: 'POST',
            body: formData,
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));
          
          console.log('PDF conversion response status:', response.status);
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'PDF-Konvertierung fehlgeschlagen');
          }
          
          const result = await response.json();
          console.log('PDF conversion result:', result);
          
          if (!result.success || !result.image) {
            throw new Error('PDF-Konvertierung fehlgeschlagen - keine Bilddaten erhalten');
          }
          
          // Create a temporary file object with the converted image
          console.log('Creating blob from base64 image...');
          const convertedImageBlob = await fetch(result.image).then(r => r.blob());
          const convertedImageFile = new File([convertedImageBlob], firstFile.name.replace('.pdf', '.jpg'), {
            type: 'image/jpeg'
          });
          console.log('Converted image file created:', convertedImageFile.size, 'bytes');
          
          // Get classification for the first file
          const firstFileClassification = classificationResults.find(r => r.index === 0)?.type || 'Unbekannt';
          console.log('PDF Classification:', firstFileClassification);
          
          // Extract data from the converted image
          await extractDataFromImage(convertedImageFile, firstFileClassification);
          
          // Update the file status
          setAttachedFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, isConverting: false } : f
          ));
          
        } catch (error) {
          console.error('PDF conversion error:', error);
          
          let errorMessage = 'Fehler bei der PDF-Konvertierung. Bitte füllen Sie die Felder manuell aus.';
          
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              errorMessage = 'PDF-Konvertierung abgebrochen: Zeitüberschreitung. Die Datei ist möglicherweise zu groß.';
            } else if (error.message.includes('timeout')) {
              errorMessage = 'PDF-Konvertierung dauerte zu lange. Bitte versuchen Sie eine kleinere Datei.';
            }
          }
          
          setError(errorMessage);
          
          // Mark as not converting
          setAttachedFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, isConverting: false } : f
          ));
        }
      } else {
        // Get classification for the first file
        const firstFileClassification = classificationResults.find(r => r.index === 0)?.type || 'Unbekannt';
        
        // Process image files directly  
        await extractDataFromImage(firstFile, firstFileClassification);
      }
    }
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
    setShowConfirm(true);
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
    <Container size="lg" py="xs">
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
        <Grid.Col span={{ base: 12, md: selectedImage ? 7 : 12 }}>
          <Paper shadow="sm" p="xs">
            <form onSubmit={handleSubmit}>
              <Stack gap="xs">
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
                        <TextInput
                          label="Restaurant PLZ"
                          placeholder="z.B. 10115"
                          size="sm"
                          {...form.getInputProps('restaurantPlz')}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <TextInput
                          label="Restaurant Ort"
                          placeholder="z.B. Berlin"
                          size="sm"
                          {...form.getInputProps('restaurantOrt')}
                        />
                      </Grid.Col>
                    </Grid>
                    <TextInput
                      label="Ihr Unternehmen"
                      placeholder="Name Ihres Unternehmens"
                      size="sm"
                      {...form.getInputProps('unternehmen')}
                    />
                    <TextInput
                      label="Unternehmensanschrift"
                      placeholder="Straße und Hausnummer"
                      size="sm"
                      {...form.getInputProps('unternehmenAnschrift')}
                    />
                    <Grid>
                      <Grid.Col span={6}>
                        <TextInput
                          label="Unternehmens-PLZ"
                          placeholder="z.B. 20099"
                          size="sm"
                          {...form.getInputProps('unternehmenPlz')}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <TextInput
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
                          description="19% MwSt."
                          {...form.getInputProps('getraenke')}
                        />
                      </Grid.Col>
                    </Grid>
                  </Stack>
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
                  {...form.getInputProps('gesamtbetrag')}
                  onChange={handleGesamtbetragChange}
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
                      {...form.getInputProps('gesamtbetragMwst')}
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
                      {...form.getInputProps('gesamtbetragNetto')}
                      readOnly
                    />
                  </>
                )}
                <NumberInput
                  label="Betrag auf Kreditkarte/Bar"
                  placeholder="Betrag auf Kreditkarte/Bar in Euro"
                  min={0}
                  step={0.01}
                  size="sm"
                  decimalScale={2}
                  fixedDecimalScale
                  description="Geben Sie den Betrag ein, der auf der Kreditkarte belastet wurde (inkl. Trinkgeld)"
                  {...form.getInputProps('kreditkartenBetrag')}
                  onChange={handleKreditkartenBetragChange}
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
                  {...form.getInputProps('trinkgeld')}
                  onChange={handleTrinkgeldChange}
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
                    {...form.getInputProps('trinkgeldMwst')}
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
    </Grid.Col>
    
    {selectedImage && (
      <Grid.Col span={{ base: 12, md: 5 }}>
        <ImageEditor 
          file={selectedImage} 
          onImageUpdate={(processedUrl) => {
            console.log('Image updated:', processedUrl);
          }}
        />
      </Grid.Col>
    )}
  </Grid>

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