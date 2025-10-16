import { BoundingBox } from './image-detection';
import { convertPdfPageToImage } from './client-pdf-converter';

export interface ExtractedRegion {
  imageDataUrl: string;
  type: 'Rechnung' | 'Kreditkartenbeleg';
  description: string;
  originalBoundingBox: BoundingBox;
}

/**
 * Extract a specific region from a PDF page and return it as a separate image
 * This uses canvas cropping after converting the PDF page to an image
 */
export async function extractRegionFromPdfPage(
  pdfFile: File,
  pageNumber: number,
  boundingBox: BoundingBox,
  type: 'Rechnung' | 'Kreditkartenbeleg',
  description: string
): Promise<ExtractedRegion> {
  try {
    console.log(`📄 Extracting region from page ${pageNumber}:`, { boundingBox, type });

    // First, convert the entire PDF page to an image
    const fullPageImageUrl = await convertPdfPageToImage(pdfFile, pageNumber, {
      scale: 2.0,  // High resolution for better cropping
      format: 'jpeg',
      quality: 0.95
    });

    // Load the image into a canvas
    const img = await loadImage(fullPageImageUrl);

    // Calculate absolute pixel coordinates from relative bounding box
    const x = Math.floor(boundingBox.x * img.width);
    const y = Math.floor(boundingBox.y * img.height);
    const width = Math.floor(boundingBox.width * img.width);
    const height = Math.floor(boundingBox.height * img.height);

    console.log(`📏 Crop coordinates: x=${x}, y=${y}, width=${width}, height=${height}`);

    // Create a canvas for the cropped region
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw the cropped region
    ctx.drawImage(
      img,
      x, y, width, height,  // Source rectangle
      0, 0, width, height   // Destination rectangle
    );

    // Convert canvas to data URL
    const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.95);

    console.log(`✅ Region extracted successfully (${width}x${height}px)`);

    return {
      imageDataUrl: croppedImageUrl,
      type,
      description,
      originalBoundingBox: boundingBox
    };

  } catch (error) {
    console.error('❌ Failed to extract region from PDF:', error);
    throw new Error(`Region extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract multiple regions from a PDF page
 */
export async function extractMultipleRegionsFromPdfPage(
  pdfFile: File,
  pageNumber: number,
  regions: Array<{
    boundingBox: BoundingBox;
    type: 'Rechnung' | 'Kreditkartenbeleg';
    description: string;
  }>
): Promise<ExtractedRegion[]> {
  console.log(`📄 Extracting ${regions.length} regions from page ${pageNumber}`);

  const extractedRegions: ExtractedRegion[] = [];

  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    try {
      const extracted = await extractRegionFromPdfPage(
        pdfFile,
        pageNumber,
        region.boundingBox,
        region.type,
        region.description
      );
      extractedRegions.push(extracted);
      console.log(`✅ Region ${i + 1}/${regions.length} extracted: ${region.type}`);
    } catch (error) {
      console.error(`❌ Failed to extract region ${i + 1}:`, error);
      // Continue with other regions even if one fails
    }
  }

  return extractedRegions;
}

/**
 * Helper function to load an image from a data URL
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(new Error(`Failed to load image: ${error}`));
    img.src = dataUrl;
  });
}

/**
 * Crop an image data URL directly (without PDF conversion)
 * Useful for processing images that have already been converted from PDF
 */
export async function cropImageRegion(
  imageDataUrl: string,
  boundingBox: BoundingBox,
  type: 'Rechnung' | 'Kreditkartenbeleg',
  description: string
): Promise<ExtractedRegion> {
  try {
    console.log('✂️ Cropping image region:', { boundingBox, type });

    const img = await loadImage(imageDataUrl);

    const x = Math.floor(boundingBox.x * img.width);
    const y = Math.floor(boundingBox.y * img.height);
    const width = Math.floor(boundingBox.width * img.width);
    const height = Math.floor(boundingBox.height * img.height);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
    const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.95);

    console.log(`✅ Image region cropped (${width}x${height}px)`);

    return {
      imageDataUrl: croppedImageUrl,
      type,
      description,
      originalBoundingBox: boundingBox
    };

  } catch (error) {
    console.error('❌ Failed to crop image region:', error);
    throw new Error(`Image cropping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
