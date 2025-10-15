'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Stack, Paper, Text } from '@mantine/core';
import type { Mat, MatVector } from '@techstark/opencv-js';

interface DocumentScannerProps {
  onCapture: (dataUrl: string) => void;
}

export default function DocumentScannerClient({ onCapture }: DocumentScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detectedCorners, setDetectedCorners] = useState<Mat | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark that we're on the client-side
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Dynamically load OpenCV
    let cv: any;
    const loadAndInitCamera = async () => {
      try {
        const opencvModule = await import('@techstark/opencv-js');
        cv = opencvModule.default;
        
        // Wait for OpenCV to be loaded
        await new Promise((resolve) => {
          if (cv.getBuildInformation) {
            // OpenCV is ready
            resolve(true);
          } else {
            // Wait for initialization
            const checkCvReady = () => {
              if (cv.getBuildInformation) {
                resolve(true);
              } else {
                setTimeout(checkCvReady, 100);
              }
            };
            checkCvReady();
          }
        });

        const startCamera = async () => {
          try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment' },
            });
            setStream(mediaStream);
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
            }
          } catch (error) {
            console.error('Error accessing camera:', error);
          }
        };

        startCamera();

        // Process frames
        const processFrame = () => {
          if (!videoRef.current || !canvasRef.current || !cv) {
            requestAnimationFrame(processFrame);
            return;
          }

          const video = videoRef.current;
          if (video.readyState !== 4) {
            requestAnimationFrame(processFrame);
            return;
          }

          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');

          if (context) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const src = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
            const cap = new cv.VideoCapture(video);
            cap.read(src);

            const gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

            const blurred = new cv.Mat();
            cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

            const edged = new cv.Mat();
            cv.Canny(blurred, edged, 75, 200);

            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(edged, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

            if (contours.size() > 0) {
              let largestContour = contours.get(0);
              let maxArea = 0;
              for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour, false);
                if (area > maxArea) {
                  maxArea = area;
                  largestContour = contour;
                }
              }

              const peri = cv.arcLength(largestContour, true);
              const approx = new cv.Mat();
              cv.approxPolyDP(largestContour, approx, 0.02 * peri, true);

              if (approx.rows === 4) {
                setDetectedCorners(approx.clone());
                const points = [];
                for (let i = 0; i < approx.rows; i++) {
                  points.push(new cv.Point(approx.data32S[i * 2], approx.data32S[i * 2 + 1]));
                }
                const color = new cv.Scalar(0, 255, 0, 255);
                for (let i = 0; i < 4; i++) {
                  cv.line(src, points[i], points[(i + 1) % 4], color, 2, cv.LINE_AA, 0);
                }
              } else {
                setDetectedCorners(null);
              }
              approx.delete();
            }

            cv.imshow(canvas, src);
            src.delete();
            gray.delete();
            blurred.delete();
            edged.delete();
            contours.delete();
            hierarchy.delete();
          }

          requestAnimationFrame(processFrame);
        };

        const video = videoRef.current;
        const onCanPlay = () => {
          requestAnimationFrame(processFrame);
        };
        video?.addEventListener('canplay', onCanPlay);

        // Clean up
        return () => {
          video?.removeEventListener('canplay', onCanPlay);
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        };
      } catch (error) {
        console.error('Error initializing OpenCV or camera:', error);
      }
    };

    loadAndInitCamera();

  }, [isClient]);

  const handleCapture = () => {
    if (!isClient || !videoRef.current || !detectedCorners) return;

    import('@techstark/opencv-js').then((module) => {
      const cv = module.default;
      const video = videoRef.current!;
      const src = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
      const cap = new cv.VideoCapture(video);
      cap.read(src);

      const corners = [];
      for (let i = 0; i < detectedCorners.rows; i++) {
        corners.push({ x: detectedCorners.data32S[i * 2], y: detectedCorners.data32S[i * 2 + 1] });
      }

      // Order the corners
      corners.sort((a, b) => a.y - b.y);
      const topCorners = corners.slice(0, 2).sort((a, b) => a.x - b.x);
      const bottomCorners = corners.slice(2, 4).sort((a, b) => a.x - b.x);
      const [tl, tr] = topCorners;
      const [bl, br] = bottomCorners;

      const widthA = Math.sqrt(Math.pow(br.x - bl.x, 2) + Math.pow(br.y - bl.y, 2));
      const widthB = Math.sqrt(Math.pow(tr.x - tl.x, 2) + Math.pow(tr.y - tl.y, 2));
      const maxWidth = Math.max(widthA, widthB);

      const heightA = Math.sqrt(Math.pow(tr.x - br.x, 2) + Math.pow(tr.y - br.y, 2));
      const heightB = Math.sqrt(Math.pow(tl.x - bl.x, 2) + Math.pow(tl.y - bl.y, 2));
      const maxHeight = Math.max(heightA, heightB);

      const dst = new cv.Mat();
      const dsize = new cv.Size(maxWidth, maxHeight);
      const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);
      const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, maxWidth, 0, maxWidth, maxHeight, 0, maxHeight]);
      const M = cv.getPerspectiveTransform(srcTri, dstTri);
      cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

      const outputCanvas = document.createElement('canvas');
      cv.imshow(outputCanvas, dst);
      const dataUrl = outputCanvas.toDataURL('image/jpeg');
      onCapture(dataUrl);

      src.delete();
      dst.delete();
      M.delete();
      srcTri.delete();
      dstTri.delete();
    });
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