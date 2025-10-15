import dynamic from 'next/dynamic';

interface DocumentScannerProps {
  onCapture: (dataUrl: string) => void;
}

// Dynamically import the DocumentScanner component with SSR disabled
// Use a function to import to ensure it's not statically analyzed during build
const DynamicDocumentScanner = dynamic(
  () => import('./DocumentScannerClient').then((mod) => ({ default: mod.default })),
  { ssr: false, loading: () => <div>Lade Scanner...</div> }
);

export default function DocumentScanner({ onCapture }: DocumentScannerProps) {
  return <DynamicDocumentScanner onCapture={onCapture} />;
}
