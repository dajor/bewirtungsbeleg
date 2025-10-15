import dynamic from 'next/dynamic';

interface DocumentScannerProps {
  onCapture: (dataUrl: string) => void;
}

// Dynamically import the DocumentScanner component with SSR disabled
const DynamicDocumentScanner = dynamic(
  () => import('./DocumentScannerClient'),
  { ssr: false }
);

export default function DocumentScanner({ onCapture }: DocumentScannerProps) {
  return <DynamicDocumentScanner onCapture={onCapture} />;
}
