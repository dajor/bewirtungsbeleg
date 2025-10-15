'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Stack, Paper, Text } from '@mantine/core';

interface DocumentScannerProps {
  onCapture: (dataUrl: string) => void;
}

export default function DocumentScannerClient({ onCapture }: DocumentScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [loadingState, setLoadingState] = useState<'initializing' | 'loading' | 'ready' | 'error'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Mark that we're on the client-side
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let animationFrameId: number;
    
    const initCamera = async () => {
      try {
        setLoadingState('loading');
        
        const startCamera = async () => {
          try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment' },
            });
            setStream(mediaStream);
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
            }
            setLoadingState('ready');
          } catch (error) {
            console.error('Error accessing camera:', error);
            setErrorMessage('Kamerazugriff fehlgeschlagen: ' + (error as Error).message);
            setLoadingState('error');
          }
        };

        startCamera();

        // Process frames (without OpenCV for now)
        const processFrame = () => {
          if (!videoRef.current || !canvasRef.current) {
            animationFrameId = requestAnimationFrame(processFrame);
            return;
          }

          const video = videoRef.current;
          if (video.readyState !== 4) {
            animationFrameId = requestAnimationFrame(processFrame);
            return;
          }

          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');

          if (context) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Draw the video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
          }

          animationFrameId = requestAnimationFrame(processFrame);
        };

        const video = videoRef.current;
        const onCanPlay = () => {
          animationFrameId = requestAnimationFrame(processFrame);
        };
        video?.addEventListener('canplay', onCanPlay);

        // Clean up
        return () => {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }
          video?.removeEventListener('canplay', onCanPlay);
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        };
      } catch (error) {
        console.error('Error initializing camera:', error);
        setErrorMessage('Fehler: ' + (error as Error).message);
        setLoadingState('error');
      }
    };

    initCamera();

  }, [isClient]);

  const handleCapture = () => {
    if (!isClient || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas for the capture
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    const captureContext = captureCanvas.getContext('2d');
    
    if (captureContext) {
      captureContext.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
      const dataUrl = captureCanvas.toDataURL('image/jpeg');
      onCapture(dataUrl);
    }
  };

  // Don't render anything until we're on the client
  if (!isClient) {
    return (
      <Stack align="center">
        <Paper withBorder shadow="md" style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text>Lade Kamera...</Text>
          </div>
        </Paper>
      </Stack>
    );
  }

  if (loadingState === 'initializing' || loadingState === 'loading') {
    return (
      <Stack align="center">
        <Paper withBorder shadow="md" style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text>
              {loadingState === 'initializing' && 'Initialisiere...'}
              {loadingState === 'loading' && 'Zugriff auf Kamera...'}
            </Text>
          </div>
        </Paper>
      </Stack>
    );
  }

  if (loadingState === 'error') {
    return (
      <Stack align="center">
        <Paper withBorder shadow="md" style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text c="red">{errorMessage || 'Unbekannter Fehler'}</Text>
          </div>
        </Paper>
        <Button onClick={() => window.location.reload()}>Erneut versuchen</Button>
      </Stack>
    );
  }

  return (
    <Stack align="center">
      <Paper withBorder shadow="md" style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '4px' }} />
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      </Paper>
      <Button onClick={handleCapture} size="lg" mt="md">
        Aufnehmen
      </Button>
    </Stack>
  );
}