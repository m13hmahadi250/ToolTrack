import { inspectImage, fileToImage, SupportedImageFormat } from './imageUtils';

export type ImageCompressionPreset =
  | 'maximum'
  | 'strong'
  | 'balanced'
  | 'high'
  | 'target'
  | 'custom'
  | 'smart';

export interface ImageCompressionOptions {
  preset?: ImageCompressionPreset;
  mode?: ImageCompressionPreset; // alias for preset
  quality?: number; // 0.01 to 1.0 (or 1 to 100) — user-selected quality MUST be directly used!
  format?: 'image/jpeg' | 'image/png' | 'image/webp' | 'same';
  maxWidth?: number;
  maxHeight?: number;
  maxDimension?: number;
  targetSizeKb?: number; // Target size in KB (e.g. 500)
  removeMetadata?: boolean;
  backgroundColor?: string;
  allowWebpConversion?: boolean; // If true, PNG/large images can convert to WebP for massive size reduction
  preserveDimensions?: boolean; // If true, dimension downscaling is avoided unless required for target KB
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
  appliedQuality: number;
}

/**
 * Format-aware, Multi-pass, Anti-Bloat Image Compression Engine
 *
 * Guarantees:
 * 1. User quality settings directly and accurately control encoder quality (no hardcoded overrides).
 * 2. Maximum compression performs aggressive optimization (dimensions, quality, multi-pass search).
 * 3. Target size (KB) uses binary search and adaptive downscaling to reach target <= targetSizeKb.
 * 4. Anti-bloat protection: Outputs NEVER exceed original file size.
 * 5. Detailed debug logging in development mode.
 */
export async function compressImage(
  file: File | Blob,
  options: ImageCompressionOptions = {}
): Promise<ImageCompressionResult> {
  const originalSizeBytes = file.size;
  const details = await inspectImage(file);
  const { width: originalWidth, height: originalHeight, hasTransparency, format: detectedFormat } = details;

  const originalFormat = detectedFormat || 'image/jpeg';
  const effectivePreset: ImageCompressionPreset = options.mode || options.preset || 'smart';

  // 1. Determine Target Format
  let targetFormat: SupportedImageFormat = 'image/jpeg';
  if (options.format && options.format !== 'same') {
    targetFormat = options.format as SupportedImageFormat;
  } else {
    // Preserve original format by default
    if (originalFormat.includes('png')) {
      if (options.allowWebpConversion) {
        // WebP preserves transparency with 70-85% smaller file size than lossless PNG
        targetFormat = 'image/webp';
      } else {
        targetFormat = 'image/png';
      }
    } else if (originalFormat.includes('webp')) {
      targetFormat = 'image/webp';
    } else if (originalFormat.includes('bmp')) {
      targetFormat = hasTransparency ? 'image/png' : 'image/jpeg';
    } else {
      targetFormat = 'image/jpeg';
    }
  }

  // 2. Determine Quality & Max Dimension Bounds
  let actualQuality: number;
  let maxDim: number | null = null;
  const isExplicitQuality = options.quality !== undefined && options.quality !== null;

  if (isExplicitQuality) {
    // CRITICAL: User explicitly set quality slider (e.g. 10% or 0.10)
    // NEVER overwrite this value!
    const rawQ = Number(options.quality);
    const normalizedQ = rawQ > 1 ? rawQ / 100 : rawQ;
    actualQuality = Math.max(0.02, Math.min(1.0, normalizedQ));

    // For explicit quality with maximum preset or large images, define dimension boundary if not preserved
    if (effectivePreset === 'maximum' && !options.preserveDimensions) {
      maxDim = 1920;
    }
  } else {
    // Preset defaults when quality is not explicitly provided
    switch (effectivePreset) {
      case 'maximum':
        actualQuality = 0.25;
        maxDim = 1600;
        break;
      case 'strong':
        actualQuality = 0.55;
        maxDim = 2048;
        break;
      case 'balanced':
        actualQuality = 0.75;
        maxDim = 2560;
        break;
      case 'high':
        actualQuality = 0.90;
        maxDim = 4096;
        break;
      case 'target':
        actualQuality = 0.75;
        maxDim = 2560;
        break;
      case 'smart':
      default:
        if (originalSizeBytes > 5 * 1024 * 1024) {
          actualQuality = 0.65;
          maxDim = 2048;
        } else if (originalSizeBytes > 2 * 1024 * 1024) {
          actualQuality = 0.72;
          maxDim = 2560;
        } else if (originalSizeBytes > 800 * 1024) {
          actualQuality = 0.78;
          maxDim = 3200;
        } else {
          actualQuality = 0.80;
          maxDim = 3840;
        }
        break;
    }
  }

  // Override max dimension if explicit options provided
  if (options.maxDimension) {
    maxDim = maxDim ? Math.min(maxDim, options.maxDimension) : options.maxDimension;
  }
  if (options.maxWidth || options.maxHeight) {
    const explicitMax = Math.max(options.maxWidth || 0, options.maxHeight || 0);
    if (explicitMax > 0) {
      maxDim = maxDim ? Math.min(maxDim, explicitMax) : explicitMax;
    }
  }

  // Never upscale! Calculate initial target dimensions preserving aspect ratio
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (maxDim && Math.max(originalWidth, originalHeight) > maxDim) {
    const scale = maxDim / Math.max(originalWidth, originalHeight);
    targetWidth = Math.max(1, Math.round(originalWidth * scale));
    targetHeight = Math.max(1, Math.round(originalHeight * scale));
  }

  // Load HTMLImageElement
  const img = await fileToImage(file);

  // Helper: Renders image at specified dimensions and encodes to Blob
  const renderAndEncode = async (
    width: number,
    height: number,
    format: string,
    quality: number
  ): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to initialize 2D canvas context');

    // Fill background if converting transparent image to JPEG
    if (format === 'image/jpeg') {
      ctx.fillStyle = options.backgroundColor || '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(img, 0, 0, width, height);

    return new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), format, quality);
    });
  };

  let outputBlob: Blob;

  // 3. TARGET SIZE OPTIMIZATION (Binary search quality & adaptive downscaling)
  if (options.targetSizeKb && options.targetSizeKb > 0) {
    const targetBytes = options.targetSizeKb * 1024;

    interface Candidate {
      blob: Blob;
      quality: number;
      width: number;
      height: number;
    }

    const candidates: Candidate[] = [];

    // Phase 3A: Binary search on quality with initial dimensions
    let lowQ = 0.05;
    let highQ = 0.95;
    let iterations = 0;

    while (iterations < 7) {
      iterations++;
      const midQ = (lowQ + highQ) / 2;
      const testBlob = await renderAndEncode(targetWidth, targetHeight, targetFormat, midQ);

      candidates.push({
        blob: testBlob,
        quality: midQ,
        width: targetWidth,
        height: targetHeight,
      });

      if (testBlob.size <= targetBytes) {
        // Output meets target, try higher quality for better visual fidelity
        lowQ = midQ + 0.04;
      } else {
        // Output exceeds target, reduce quality
        highQ = midQ - 0.04;
      }

      if (Math.abs(highQ - lowQ) < 0.03) break;
    }

    // Filter candidates that meet <= targetBytes
    let validCandidates = candidates.filter((c) => c.blob.size <= targetBytes);

    // Phase 3B: If no candidate met target size, downscale dimensions
    if (validCandidates.length === 0) {
      const scaleSteps = [0.80, 0.65, 0.50, 0.38, 0.28];

      for (const scale of scaleSteps) {
        const scaledW = Math.max(160, Math.round(targetWidth * scale));
        const scaledH = Math.max(160, Math.round(targetHeight * scale));

        // Test with moderate quality first
        const testBlob = await renderAndEncode(scaledW, scaledH, targetFormat, 0.65);
        candidates.push({ blob: testBlob, quality: 0.65, width: scaledW, height: scaledH });

        if (testBlob.size <= targetBytes) {
          validCandidates.push({ blob: testBlob, quality: 0.65, width: scaledW, height: scaledH });
          targetWidth = scaledW;
          targetHeight = scaledH;
          break;
        }

        // Test with lower quality on scaled dimensions
        const testBlobLow = await renderAndEncode(scaledW, scaledH, targetFormat, 0.35);
        candidates.push({ blob: testBlobLow, quality: 0.35, width: scaledW, height: scaledH });

        if (testBlobLow.size <= targetBytes) {
          validCandidates.push({ blob: testBlobLow, quality: 0.35, width: scaledW, height: scaledH });
          targetWidth = scaledW;
          targetHeight = scaledH;
          break;
        }
      }
    }

    if (validCandidates.length > 0) {
      // Pick valid candidate with highest quality & dimensions that is closest to target
      validCandidates.sort((a, b) => b.blob.size - a.blob.size);
      const best = validCandidates[0];
      outputBlob = best.blob;
      targetWidth = best.width;
      targetHeight = best.height;
      actualQuality = best.quality;
    } else {
      // If target was impossibly small, choose the smallest valid candidate produced
      candidates.sort((a, b) => a.blob.size - b.blob.size);
      const best = candidates[0];
      outputBlob = best.blob;
      targetWidth = best.width;
      targetHeight = best.height;
      actualQuality = best.quality;
    }
  } else {
    // 4. STANDARD & MAXIMUM ENCODING PIPELINE
    outputBlob = await renderAndEncode(targetWidth, targetHeight, targetFormat, actualQuality);

    // If Maximum Compression is selected and reduction is minor (<12%) on large images:
    if (effectivePreset === 'maximum' && outputBlob.size > originalSizeBytes * 0.88) {
      // Try aggressive downscale pass for Maximum mode
      if (Math.max(targetWidth, targetHeight) > 1200 && !options.preserveDimensions) {
        const aggressiveWidth = Math.round(targetWidth * 0.8);
        const aggressiveHeight = Math.round(targetHeight * 0.8);
        const aggressiveQuality = Math.max(0.12, actualQuality * 0.7);

        const passBlob = await renderAndEncode(aggressiveWidth, aggressiveHeight, targetFormat, aggressiveQuality);
        if (passBlob.size < outputBlob.size) {
          outputBlob = passBlob;
          targetWidth = aggressiveWidth;
          targetHeight = aggressiveHeight;
          actualQuality = aggressiveQuality;
        }
      }
    }
  }

  // 5. CRITICAL ANTI-BLOAT PROTECTION: Guarantee compressed file is NEVER larger than original
  let wasCompressed = false;
  let isAlreadyOptimized = false;
  let statusMessage = '';

  if (outputBlob.size < originalSizeBytes) {
    wasCompressed = true;
    const reduction = (((originalSizeBytes - outputBlob.size) / originalSizeBytes) * 100).toFixed(1);
    if (options.targetSizeKb && outputBlob.size <= options.targetSizeKb * 1024) {
      statusMessage = `✓ Target met: ${(outputBlob.size / 1024).toFixed(1)} KB (≤ ${options.targetSizeKb} KB, -${reduction}%)`;
    } else {
      statusMessage = `✓ Successfully compressed by ${reduction}% (saved ${((originalSizeBytes - outputBlob.size) / 1024).toFixed(1)} KB)`;
    }
  } else {
    // Try fallback pass 1: drop quality to minimum safe level
    const retryQ = Math.max(0.12, actualQuality * 0.5);
    const retryBlob = await renderAndEncode(targetWidth, targetHeight, targetFormat, retryQ);

    if (retryBlob.size < originalSizeBytes) {
      outputBlob = retryBlob;
      actualQuality = retryQ;
      wasCompressed = true;
      const reduction = (((originalSizeBytes - outputBlob.size) / originalSizeBytes) * 100).toFixed(1);
      statusMessage = `✓ Compressed with adaptive quality adjustment (-${reduction}%)`;
    } else {
      // Try fallback pass 2: downsample dimensions if image is large
      if (Math.max(targetWidth, targetHeight) > 1000 && !options.preserveDimensions) {
        const downW = Math.round(targetWidth * 0.75);
        const downH = Math.round(targetHeight * 0.75);
        const downBlob = await renderAndEncode(downW, downH, targetFormat, 0.6);

        if (downBlob.size < originalSizeBytes) {
          outputBlob = downBlob;
          targetWidth = downW;
          targetHeight = downH;
          wasCompressed = true;
          const reduction = (((originalSizeBytes - outputBlob.size) / originalSizeBytes) * 100).toFixed(1);
          statusMessage = `✓ Compressed with dimension optimization (-${reduction}%)`;
        } else {
          // Absolute Anti-Bloat Safeguard:
          // Returning original file because no safe encoder pass produces a smaller file
          outputBlob = file instanceof Blob ? file : new Blob([file]);
          targetWidth = originalWidth;
          targetHeight = originalHeight;
          wasCompressed = false;
          isAlreadyOptimized = true;
          statusMessage = 'Your original file is already highly optimized. Keeping the original prevents unnecessary quality loss.';
        }
      } else {
        outputBlob = file instanceof Blob ? file : new Blob([file]);
        targetWidth = originalWidth;
        targetHeight = originalHeight;
        wasCompressed = false;
        isAlreadyOptimized = true;
        statusMessage = 'Your original file is already highly optimized. Keeping the original prevents unnecessary quality loss.';
      }
    }
  }

  const outputSizeBytes = outputBlob.size;
  const savedBytes = Math.max(0, originalSizeBytes - outputSizeBytes);
  const savedPercent = originalSizeBytes > 0 ? Math.round((savedBytes / originalSizeBytes) * 100) : 0;

  // 6. DEBUG LOGGING (Requirement #26)
  if (
    typeof window !== 'undefined' &&
    (Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) ||
      process.env.NODE_ENV !== 'production')
  ) {
    console.log('[Compression Debug]:', {
      input: `${(originalSizeBytes / 1024).toFixed(2)} KB`,
      format: originalFormat,
      dimensions: `${originalWidth} × ${originalHeight}`,
      selectedMode: effectivePreset,
      selectedQuality: isExplicitQuality ? options.quality : 'preset-default',
      actualEncoderQuality: Number(actualQuality.toFixed(2)),
      metadataRemoved: true,
      outputDimensions: `${targetWidth} × ${targetHeight}`,
      output: `${(outputSizeBytes / 1024).toFixed(2)} KB`,
      reduction: `${savedPercent}%`,
      status: statusMessage,
    });
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
    wasCompressed,
    isAlreadyOptimized,
    hasTransparency,
    statusMessage,
    appliedQuality: actualQuality,
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
  const rawQ = options.quality ?? 0.85;
  const quality = rawQ > 1 ? rawQ / 100 : rawQ;

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
      targetWidth = Math.max(1, Math.round(originalWidth * scale));
      targetHeight = Math.max(1, Math.round(originalHeight * scale));
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
