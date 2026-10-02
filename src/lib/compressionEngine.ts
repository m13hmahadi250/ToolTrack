import { inspectImage, fileToImage, SupportedImageFormat } from './imageUtils';

export type ImageCompressionPreset = 'maximum' | 'strong' | 'balanced' | 'high' | 'custom' | 'smart';

export interface ImageCompressionOptions {
  preset?: ImageCompressionPreset;
  quality?: number; // 0.05 to 1.0
  format?: 'image/jpeg' | 'image/png' | 'image/webp' | 'same';
  maxWidth?: number;
  maxHeight?: number;
  targetSizeKb?: number; // Target size in KB (e.g. 500)
  removeMetadata?: boolean;
  backgroundColor?: string;
}

export interface ImageCompressionResult {
  blob: Blob;
  originalSizeBytes: number;
  outputSizeBytes: number;
  savedBytes: number;
  savedPercent: number;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  originalFormat: string;
  outputFormat: string;
  wasCompressed: boolean; // true if outputSizeBytes < originalSizeBytes
  isAlreadyOptimized: boolean; // true if file was already optimized and original returned
  hasTransparency: boolean;
  statusMessage: string;
}

/**
 * Format-aware, Anti-Bloat Image Compression Engine
 * Guarantees that compressed outputs NEVER exceed original file size.
 */
export async function compressImage(
  file: File | Blob,
  options: ImageCompressionOptions = {}
): Promise<ImageCompressionResult> {
  const originalSizeBytes = file.size;
  const details = await inspectImage(file);
  const { width: originalWidth, height: originalHeight, hasTransparency, format: detectedFormat } = details;

  const originalFileName = (file as File).name || 'image';
  const originalFormat = detectedFormat || 'image/jpeg';

  // Determine target output format
  let targetFormat: SupportedImageFormat = 'image/jpeg';
  if (options.format && options.format !== 'same') {
    targetFormat = options.format as SupportedImageFormat;
  } else {
    // If 'same' or unspecified
    if (originalFormat.includes('png')) {
      targetFormat = 'image/png';
    } else if (originalFormat.includes('webp')) {
      targetFormat = 'image/webp';
    } else if (originalFormat.includes('bmp')) {
      // BMP is uncompressed bitmap; default to JPEG (or PNG if transparency)
      targetFormat = hasTransparency ? 'image/png' : 'image/jpeg';
    } else {
      targetFormat = 'image/jpeg';
    }
  }

  const preset = options.preset || 'smart';

  // Determine initial quality and max dimension bounds
  let quality = 0.80;
  let maxDim: number | null = null;

  if (preset === 'maximum') {
    quality = 0.48;
    maxDim = 1920;
  } else if (preset === 'strong') {
    quality = 0.65;
    maxDim = 2560;
  } else if (preset === 'balanced') {
    quality = 0.78;
    maxDim = 3840;
  } else if (preset === 'high') {
    quality = 0.90;
    maxDim = null;
  } else if (preset === 'custom') {
    quality = options.quality ?? 0.80;
    maxDim = null;
  } else if (preset === 'smart') {
    // Smart adapt based on file size and dimensions
    if (originalSizeBytes > 5 * 1024 * 1024) {
      quality = 0.72;
      maxDim = 2560;
    } else if (originalSizeBytes > 2 * 1024 * 1024) {
      quality = 0.76;
      maxDim = 3840;
    } else if (originalSizeBytes > 800 * 1024) {
      quality = 0.80;
    } else {
      quality = 0.82;
    }
  }

  // Override max dimensions if explicitly provided
  if (options.maxWidth || options.maxHeight) {
    const explicitMax = Math.max(options.maxWidth || 0, options.maxHeight || 0);
    if (explicitMax > 0) {
      maxDim = maxDim ? Math.min(maxDim, explicitMax) : explicitMax;
    }
  }

  // Calculate target dimensions (Never upscale!)
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (maxDim && Math.max(originalWidth, originalHeight) > maxDim) {
    const scale = maxDim / Math.max(originalWidth, originalHeight);
    targetWidth = Math.round(originalWidth * scale);
    targetHeight = Math.round(originalHeight * scale);
  }

  // Load HTMLImageElement for canvas rendering
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to initialize 2D canvas context');

  // Fill background if converting transparent image to JPEG
  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = options.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Function to encode canvas to blob
  const encodeCanvas = (fmt: string, q: number): Promise<Blob> => {
    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), fmt, q);
    });
  };

  let outputBlob = await encodeCanvas(targetFormat, quality);

  // Target size optimization (Iterative binary adaptive pass)
  if (options.targetSizeKb && options.targetSizeKb > 0) {
    const targetBytes = options.targetSizeKb * 1024;
    let currentQuality = quality;
    let currentWidth = targetWidth;
    let currentHeight = targetHeight;
    let attempts = 0;

    while (attempts < 8 && outputBlob.size > targetBytes) {
      attempts++;
      if (currentQuality > 0.25) {
        currentQuality = Math.max(0.15, currentQuality - 0.12);
      } else {
        // Downscale resolution by 15% if quality is already low
        currentWidth = Math.max(200, Math.round(currentWidth * 0.85));
        currentHeight = Math.max(200, Math.round(currentHeight * 0.85));
        canvas.width = currentWidth;
        canvas.height = currentHeight;
        if (targetFormat === 'image/jpeg') {
          ctx.fillStyle = options.backgroundColor || '#ffffff';
          ctx.fillRect(0, 0, currentWidth, currentHeight);
        }
        ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
      }

      outputBlob = await encodeCanvas(targetFormat, currentQuality);
    }
  }

  // ANTI-BLOAT SIZE CHECK: Ensure compressed blob is strictly smaller than original!
  let wasCompressed = false;
  let isAlreadyOptimized = false;
  let statusMessage = '';

  if (outputBlob.size < originalSizeBytes) {
    wasCompressed = true;
    statusMessage = `Successfully compressed file from ${(originalSizeBytes / (1024 * 1024)).toFixed(2)} MB to ${(outputBlob.size / (1024 * 1024)).toFixed(2)} MB.`;
  } else {
    // Retry Pass 1: Aggressive quality drop
    let retryQuality = Math.max(0.35, quality * 0.65);
    outputBlob = await encodeCanvas(targetFormat, retryQuality);

    if (outputBlob.size < originalSizeBytes) {
      wasCompressed = true;
      statusMessage = `Compressed with aggressive quality adjustment.`;
    } else {
      // Retry Pass 2: Downsample dimensions slightly if resolution is large
      if (Math.max(targetWidth, targetHeight) > 1200) {
        const retryWidth = Math.round(targetWidth * 0.8);
        const retryHeight = Math.round(targetHeight * 0.8);
        canvas.width = retryWidth;
        canvas.height = retryHeight;
        if (targetFormat === 'image/jpeg') {
          ctx.fillStyle = options.backgroundColor || '#ffffff';
          ctx.fillRect(0, 0, retryWidth, retryHeight);
        }
        ctx.drawImage(img, 0, 0, retryWidth, retryHeight);
        outputBlob = await encodeCanvas(targetFormat, 0.65);
        targetWidth = retryWidth;
        targetHeight = retryHeight;
      }

      if (outputBlob.size < originalSizeBytes) {
        wasCompressed = true;
        statusMessage = `Compressed with resolution optimization.`;
      } else {
        // FINAL ANTI-BLOAT PROTECTION:
        // Original is already smaller than any safe re-encoded output!
        // Return original file to prevent file size inflation.
        outputBlob = file instanceof Blob ? file : new Blob([file]);
        targetWidth = originalWidth;
        targetHeight = originalHeight;
        wasCompressed = false;
        isAlreadyOptimized = true;
        statusMessage = 'Your file is already highly optimized. Original file preserved to prevent size increase.';
      }
    }
  }

  const outputSizeBytes = outputBlob.size;
  const savedBytes = Math.max(0, originalSizeBytes - outputSizeBytes);
  const savedPercent = originalSizeBytes > 0 ? Math.round((savedBytes / originalSizeBytes) * 100) : 0;

  return {
    blob: outputBlob,
    originalSizeBytes,
    outputSizeBytes,
    savedBytes,
    savedPercent,
    originalWidth,
    originalHeight,
    outputWidth: targetWidth,
    outputHeight: targetHeight,
    originalFormat,
    outputFormat: targetFormat,
    wasCompressed,
    isAlreadyOptimized,
    hasTransparency,
    statusMessage,
  };
}

export interface ImageConversionOptions {
  targetFormat: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp';
  quality?: number;
  backgroundColor?: string;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ImageConversionResult {
  blob: Blob;
  originalSizeBytes: number;
  outputSizeBytes: number;
  savedBytes: number;
  savedPercent: number;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  originalFormat: string;
  outputFormat: string;
  transparencyRemovedWarning: boolean;
  statusMessage: string;
}

/**
 * Format-Aware Image Conversion Engine
 * Safely converts between JPG, PNG, WebP, and BMP with intelligent encoding controls
 */
export async function convertImage(
  file: File | Blob,
  options: ImageConversionOptions
): Promise<ImageConversionResult> {
  const originalSizeBytes = file.size;
  const details = await inspectImage(file);
  const { width: originalWidth, height: originalHeight, hasTransparency, format: detectedFormat } = details;

  const originalFormat = detectedFormat || 'image/jpeg';
  const targetFormat = options.targetFormat;
  const quality = options.quality ?? 0.85;

  let transparencyRemovedWarning = false;
  if (hasTransparency && targetFormat === 'image/jpeg') {
    transparencyRemovedWarning = true;
  }

  // Dimension scaling if max limits provided
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (options.maxWidth || options.maxHeight) {
    const maxDim = Math.max(options.maxWidth || 0, options.maxHeight || 0);
    if (maxDim > 0 && Math.max(originalWidth, originalHeight) > maxDim) {
      const scale = maxDim / Math.max(originalWidth, originalHeight);
      targetWidth = Math.round(originalWidth * scale);
      targetHeight = Math.round(originalHeight * scale);
    }
  }

  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to initialize 2D canvas context');

  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = options.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const outputBlob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), targetFormat, quality);
  });

  const outputSizeBytes = outputBlob.size;
  const savedBytes = originalSizeBytes - outputSizeBytes;
  const savedPercent = originalSizeBytes > 0 ? Math.round((savedBytes / originalSizeBytes) * 100) : 0;

  let statusMessage = `Converted from ${originalFormat.split('/')[1]?.toUpperCase() || 'IMAGE'} to ${targetFormat.split('/')[1]?.toUpperCase() || 'IMAGE'}.`;
  if (transparencyRemovedWarning) {
    statusMessage += ' Note: JPEG does not support transparency; transparent areas filled with background.';
  }

  return {
    blob: outputBlob,
    originalSizeBytes,
    outputSizeBytes,
    savedBytes,
    savedPercent,
    originalWidth,
    originalHeight,
    outputWidth: targetWidth,
    outputHeight: targetHeight,
    originalFormat,
    outputFormat: targetFormat,
    transparencyRemovedWarning,
    statusMessage,
  };
}
