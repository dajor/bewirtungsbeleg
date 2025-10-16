'use client';

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Group,
  Button,
  Text,
  Stack,
  Box,
  Image,
  LoadingOverlay,
  Alert,
  ActionIcon,
  Tooltip,
  Badge,
  Loader,
} from '@mantine/core';
import {
  IconRotate,
  IconRotate2,
  IconCrop,
  IconMaximize,
  IconRefresh,
  IconAlertCircle,
  IconFile,
} from '@tabler/icons-react';
import { ImageProcessor } from '@/lib/image-processor';
import { convertPdfPageToImage, isClientSidePdfConversionSupported } from '@/lib/client-pdf-converter';
import PDFToImageConverter from '@/lib/pdf-to-image-converter';

// Helper function to convert data URL to Blob
function dataURLToBlob(dataURL: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const [header, data] = dataURL.split(',');
      const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
      const binaryString = atob(data);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      resolve(new Blob([bytes], { type: mime }));
    } catch (error) {
      reject(error);
    }
  });
}

interface ImageEditorProps {
  file: File | null;
  onImageUpdate?: (processedUrl: string) => void;
}

export function ImageEditor({ file, onImageUpdate }: ImageEditorProps) {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create preview URL when file changes
  useEffect(() => {
    if (file) {
      // For PDFs, convert to image first
      if (file.type === 'application/pdf') {
        setLoading(true);
        setError(null);
        
        // Convert PDF to image using server-side API
        const convertPdf = async () => {
          try {
            // Use PDFToImageConverter with local method (server-side pdftoppm - most reliable)
            const imageUrl = await PDFToImageConverter.convert(file, {
              method: 'local',
              page: 1
            });

            setOriginalUrl(imageUrl);
            setError(null);
          } catch (err) {
            console.error('PDF conversion error:', err);
            setError('Failed to convert PDF. Please try with an image file.');
            setOriginalUrl(null);
          } finally {
            setLoading(false);
          }
        };
        
        convertPdf();
      } else {
        // Regular image file
        const url = URL.createObjectURL(file);
        setOriginalUrl(url);
        setError(null);
      }
      setProcessedUrl(null);
      setRotation(0);
      
      return () => {
        if (originalUrl && !originalUrl.startsWith('data:')) {
          URL.revokeObjectURL(originalUrl);
        }
      };
    } else {
      setOriginalUrl(null);
      setProcessedUrl(null);
    }
  }, [file]);

  const handleRotate = async (angle: number) => {
    if (!file || !originalUrl) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // For PDFs that have been converted, we need to work with the converted image
      if (file.type === 'application/pdf' && originalUrl.startsWith('data:')) {
        // Create a blob from the data URL for processing
        const blob = await dataURLToBlob(originalUrl);
        const imageFile = new File([blob], 'converted.png', { type: 'image/png' });
        
        const result = await ImageProcessor.rotateImage(imageFile, angle);
        setProcessedUrl(result);
        if (onImageUpdate) {
          onImageUpdate(result);
        }
      } else {
        // Regular image file
        const result = await ImageProcessor.rotateImage(file, angle);
        setProcessedUrl(result);
        if (onImageUpdate) {
          onImageUpdate(result);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate image');
      console.error('Rotation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeskew = async () => {
    if (!file || !originalUrl) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // For PDFs that have been converted, we need to work with the converted image
      if (file.type === 'application/pdf' && originalUrl.startsWith('data:')) {
        const blob = await dataURLToBlob(originalUrl);
        const imageFile = new File([blob], 'converted.png', { type: 'image/png' });
        
        const result = await ImageProcessor.deskewImage(imageFile);
        setProcessedUrl(result);
        if (onImageUpdate) {
          onImageUpdate(result);
        }
      } else {
        // Regular image file
        const result = await ImageProcessor.deskewImage(file);
        setProcessedUrl(result);
        if (onImageUpdate) {
          onImageUpdate(result);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deskew image');
      console.error('Deskew error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setProcessedUrl(null);
    setRotation(0);
    setError(null);
  };

  const handleQuickRotate = (angle: number) => {
    const newRotation = rotation + angle;
    setRotation(newRotation);
    handleRotate(newRotation);
  };

  if (!file) {
    return null;
  }

  const displayUrl = processedUrl || originalUrl;

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="sm" fw={500}>Image Editor</Text>
          {processedUrl && (
            <Badge color="green" variant="light">
              Edited
            </Badge>
          )}
        </Group>

        {error && (
          <Alert 
            icon={<IconAlertCircle size="1rem" />} 
            color="red" 
            variant="light"
            onClose={() => setError(null)}
            withCloseButton
          >
            {error}
          </Alert>
        )}

        <Box pos="relative" style={{ minHeight: 200 }}>
          <LoadingOverlay visible={loading} />
          {file?.type === 'application/pdf' && !originalUrl && !error ? (
            // Show placeholder while PDF is being converted
            <Paper p="xl" radius="md" withBorder style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stack align="center" gap="xs">
                <Loader size="lg" />
                <Text size="sm" c="dimmed">Converting PDF...</Text>
                <Text size="xs" c="dimmed">{file.name}</Text>
              </Stack>
            </Paper>
          ) : originalUrl ? (
            // Show the image (either original or converted from PDF)
            <Image
              src={displayUrl}
              alt="Receipt preview"
              radius="md"
              fit="contain"
              height={300}
            />
          ) : (
            // No image to show
            <Paper p="xl" radius="md" withBorder style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stack align="center" gap="xs">
                <IconFile size={48} />
                <Text size="sm" c="dimmed">No preview available</Text>
              </Stack>
            </Paper>
          )}
        </Box>

        <Stack gap="xs">
          <Text size="xs" fw={500}>Rotation Controls</Text>
          
          <Group gap="xs">
            <Tooltip label="Rotate 90° left">
              <ActionIcon 
                variant="light" 
                onClick={() => handleQuickRotate(-90)}
                disabled={loading || !originalUrl}
                data-testid="rotate-left-90"
              >
                <IconRotate2 size="1rem" />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Rotate 90° right">
              <ActionIcon 
                variant="light" 
                onClick={() => handleQuickRotate(90)}
                disabled={loading || !originalUrl}
                data-testid="rotate-right-90"
              >
                <IconRotate size="1rem" />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Auto-straighten">
              <ActionIcon 
                variant="light" 
                onClick={handleDeskew}
                disabled={loading || !originalUrl}
                data-testid="deskew-button"
              >
                <IconMaximize size="1rem" />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Reset">
              <ActionIcon 
                variant="light" 
                onClick={handleReset}
                disabled={loading || !processedUrl}
                data-testid="reset-button"
              >
                <IconRefresh size="1rem" />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Stack>

        <Group gap="xs">
          <Button
            size="xs"
            variant="subtle"
            onClick={() => handleRotate(rotation)}
            disabled={loading || !originalUrl || rotation === 0}
            data-testid="apply-rotation"
          >
            Apply Rotation
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}