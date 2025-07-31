'use client';

import React from 'react';
import { Group, Text, rem, Stack, Image, ActionIcon, Paper, Badge, Center, Loader } from '@mantine/core';
import { IconUpload, IconPhoto, IconX, IconFile } from '@tabler/icons-react';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import classes from './MultiFileDropzone.module.css';

export interface FileWithPreview {
  file: File;
  preview?: string;
  id: string;
  isConverting?: boolean;
  classification?: {
    type: string;
    confidence: number;
    isProcessing?: boolean;
  };
}

interface MultiFileDropzoneProps {
  files: FileWithPreview[];
  onDrop: (files: File[]) => void;
  onRemove: (id: string) => void;
  maxSize?: number;
  maxFiles?: number;
  loading?: boolean;
}

export function MultiFileDropzone({
  files,
  onDrop,
  onRemove,
  maxSize = 10 * 1024 ** 2, // 10MB
  maxFiles = 5,
  loading = false
}: MultiFileDropzoneProps) {
  const previews = files.map((fileData) => {
    const isPdf = fileData.file.type === 'application/pdf';
    
    return (
      <Paper
        key={fileData.id}
        shadow="sm"
        p="sm"
        radius="md"
        withBorder
        style={{ 
          position: 'relative',
          width: rem(180),
          backgroundColor: 'white'
        }}
      >
        {fileData.isConverting && (
          <Center
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 10,
              borderRadius: rem(8)
            }}
          >
            <Stack align="center" gap="xs">
              <Loader size="sm" />
              <Text size="xs">Konvertiere PDF...</Text>
            </Stack>
          </Center>
        )}
        
        {fileData.preview ? (
          <div style={{ 
            height: 120, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: rem(4),
            backgroundColor: '#f8f9fa'
          }}>
            <Image
              src={fileData.preview}
              alt={fileData.file.name}
              height={120}
              fit="contain"
              style={{ maxWidth: '100%' }}
            />
          </div>
        ) : (
          <Center h={120} style={{ backgroundColor: '#f8f9fa', borderRadius: rem(4) }}>
            <Stack align="center" gap="xs">
              <IconFile size={48} stroke={1.5} color="#868e96" />
              <Text size="xs" c="dimmed">
                {isPdf ? 'PDF' : 'Datei'}
              </Text>
            </Stack>
          </Center>
        )}
        
        <Text size="xs" mt="xs" lineClamp={1}>
          {fileData.file.name}
        </Text>
        
        <Group gap="xs" mt="xs">
          {fileData.classification && !fileData.classification.isProcessing && (
            <Badge 
              size="xs" 
              variant="filled" 
              color={fileData.classification.type === 'Kreditkartenbeleg' ? 'blue' : 'green'}
            >
              {fileData.classification.type}
            </Badge>
          )}
          {fileData.classification?.isProcessing && (
            <Badge size="xs" variant="light" color="gray">
              <Group gap={4}>
                <Loader size={10} />
                <span>Analysiere...</span>
              </Group>
            </Badge>
          )}
          <Badge size="xs" variant="light" color="gray">
            {fileData.file.size > 1024 * 1024 
              ? `${(fileData.file.size / (1024 * 1024)).toFixed(1)} MB`
              : `${(fileData.file.size / 1024).toFixed(1)} KB`
            }
          </Badge>
        </Group>
        
        <ActionIcon
          size="sm"
          color="red"
          variant="filled"
          style={{
            position: 'absolute',
            top: rem(4),
            right: rem(4)
          }}
          onClick={() => onRemove(fileData.id)}
          disabled={fileData.isConverting}
        >
          <IconX size={16} />
        </ActionIcon>
      </Paper>
    );
  });

  return (
    <Stack gap="md">
      <Dropzone
        onDrop={onDrop}
        maxSize={maxSize}
        accept={[MIME_TYPES.png, MIME_TYPES.jpeg, MIME_TYPES.webp, MIME_TYPES.pdf]}
        multiple
        maxFiles={maxFiles - files.length}
        disabled={loading || files.length >= maxFiles}
        className={classes.dropzone}
      >
        <Group justify="center" gap="xl" mih={rem(120)} style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload
              style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-blue-6)' }}
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-red-6)' }}
              stroke={1.5}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconPhoto
              style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-dimmed)' }}
              stroke={1.5}
            />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              Dateien hier ablegen
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Bilder (PNG, JPEG, WEBP) oder PDFs, max. {maxFiles} Dateien
            </Text>
          </div>
        </Group>
      </Dropzone>

      {previews.length > 0 && (
        <div>
          <Text size="sm" fw={500} mb="xs">
            Hochgeladene Dateien ({files.length}/{maxFiles})
          </Text>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: rem(12)
          }}>
            {previews}
          </div>
        </div>
      )}
    </Stack>
  );
}