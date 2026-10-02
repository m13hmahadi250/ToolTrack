import { PDFDocument } from 'pdf-lib';
import { MM_TO_PT, STANDARD_SIZES_MM } from './pdfRenderer';

export type SupportedImageFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp';

export interface ImageProcessOptions {
  format?: SupportedImageFormat;
  quality?: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
  width?: number;
  height?: number;
  targetSizeKb?: number;
  removeExif?: boolean;
  backgroundColor?: string; // used when converting transparent to JPG
}

export interface ImageDetails {
  fileName: string;
  width: number;
  height: number;
  aspectRatio: string;
  aspectRatioValue: number;
  sizeBytes: number;
  format: string;
  megapixels: number;
  dominantColors: string[];
  estimatedDpi: number;
  hasTransparency: boolean;
}

export async function fileToImage(file: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = typeof file === 'string' ? file : URL.createObjectURL(file);
    img.onload = () => {
      if (typeof file !== 'string') URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      if (typeof file !== 'string') URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Calculates human-readable aspect ratio (e.g., 16:9, 4:3, 1:1)
 */
export function getSimplifiedAspectRatio(width: number, height: number): string {
  if (!width || !height) return '1:1';
  const divisor = gcd(Math.round(width), Math.round(height));
  const w = Math.round(width / divisor);
  const h = Math.round(height / divisor);

  // Common approximation checks
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.02) return '16:9';
  if (Math.abs(ratio - 4 / 3) < 0.02) return '4:3';
  if (Math.abs(ratio - 3 / 2) < 0.02) return '3:2';
  if (Math.abs(ratio - 1) < 0.01) return '1:1';
  if (Math.abs(ratio - 9 / 16) < 0.02) return '9:16';
  if (Math.abs(ratio - 3 / 4) < 0.02) return '3:4';
  if (Math.abs(ratio - 2 / 3) < 0.02) return '2:3';
  if (Math.abs(ratio - 1 / 1.4142) < 0.03) return 'A4 (1:√2)';

  if (w <= 20 && h <= 20) return `${w}:${h}`;
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Inspect image details, dimensions, transparency, and dominant colors
 */
export async function inspectImage(file: File | Blob): Promise<ImageDetails> {
  const img = await fileToImage(file);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const sizeBytes = file.size;
  const fileName = (file as File).name || 'image';
  const format = file.type || 'image/jpeg';
  const megapixels = Number(((width * height) / 1000000).toFixed(2));
  const aspectRatioValue = width / height;
  const aspectRatio = getSimplifiedAspectRatio(width, height);

  // Extract color samples & transparency check
  const canvas = document.createElement('canvas');
  // Use small canvas for fast color extraction
  const sampleW = Math.min(width, 100);
  const sampleH = Math.min(height, 100);
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let hasTransparency = false;
  const dominantColors: string[] = [];

  if (ctx) {
    ctx.drawImage(img, 0, 0, sampleW, sampleH);
    const data = ctx.getImageData(0, 0, sampleW, sampleH).data;

    // Check transparency
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 240) {
        hasTransparency = true;
        break;
      }
    }

    // Color histogram
    const colorMap = new Map<string, number>();
    for (let i = 0; i < data.length; i += 16) {
      if (data[i + 3] > 50) {
        // quantize to 16 steps
        const r = Math.round(data[i] / 16) * 16;
        const g = Math.round(data[i + 1] / 16) * 16;
        const b = Math.round(data[i + 2] / 16) * 16;
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }
    }

    const sortedColors = Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1]);
    dominantColors.push(...sortedColors.slice(0, 6).map((c) => c[0]));
  }

  // Estimated standard web/print DPI
  const estimatedDpi = Math.min(width, height) > 2000 ? 300 : Math.min(width, height) > 1000 ? 150 : 72;

  return {
    fileName,
    width,
    height,
    aspectRatio,
    aspectRatioValue,
    sizeBytes,
    format,
    megapixels,
    dominantColors,
    estimatedDpi,
    hasTransparency,
  };
}

/**
 * Core image processing & format conversion
 */
export async function processImage(
  imageFile: File | Blob,
  options: ImageProcessOptions = {}
): Promise<{ blob: Blob; width: number; height: number; savedBytes: number }> {
  const { compressImage } = await import('./compressionEngine');
  const result = await compressImage(imageFile, {
    format: options.format === 'image/bmp' ? 'image/jpeg' : options.format,
    quality: options.quality,
    maxWidth: options.maxWidth || options.width,
    maxHeight: options.maxHeight || options.height,
    targetSizeKb: options.targetSizeKb,
    backgroundColor: options.backgroundColor,
    removeMetadata: options.removeExif,
  });

  return {
    blob: result.blob,
    width: result.outputWidth,
    height: result.outputHeight,
    savedBytes: result.savedBytes,
  };
}

/**
 * Image Crop & Resize with Rotate & Flip
 */
export interface CropResizeOptions {
  cropArea?: { x: number; y: number; width: number; height: number };
  targetWidth?: number;
  targetHeight?: number;
  rotation?: number; // 0, 90, 180, 270
  flipH?: boolean;
  flipV?: boolean;
  format?: SupportedImageFormat;
  quality?: number;
  backgroundColor?: string;
}

export async function cropAndTransformImage(
  imageFile: File | Blob,
  options: CropResizeOptions
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await fileToImage(imageFile);
  const origW = img.naturalWidth;
  const origH = img.naturalHeight;

  const crop = options.cropArea || { x: 0, y: 0, width: origW, height: origH };
  const outW = options.targetWidth || crop.width;
  const outH = options.targetHeight || crop.height;

  const canvas = document.createElement('canvas');
  const rot = (options.rotation || 0) % 360;
  const isRotated90or270 = rot === 90 || rot === 270;

  canvas.width = isRotated90or270 ? outH : outW;
  canvas.height = isRotated90or270 ? outW : outH;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas 2D context');

  if (options.format === 'image/jpeg') {
    ctx.fillStyle = options.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.scale(options.flipH ? -1 : 1, options.flipV ? -1 : 1);

  ctx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    -outW / 2,
    -outH / 2,
    outW,
    outH
  );
  ctx.restore();

  const format = options.format || 'image/png';
  const quality = options.quality ?? 0.92;

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), format, quality);
  });

  return {
    blob,
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Watermark Settings
 */
export interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
  opacity?: number; // 0 to 1
  rotation?: number; // degrees
  position: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'tile';
  margin?: number; // px
  watermarkImage?: HTMLImageElement;
  watermarkScale?: number; // 0.1 to 1
  format?: SupportedImageFormat;
  quality?: number;
}

export async function applyWatermarkToImage(
  imageFile: File | Blob,
  options: WatermarkOptions
): Promise<Blob> {
  const img = await fileToImage(imageFile);
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(img, 0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = Math.max(0.05, Math.min(1, options.opacity ?? 0.5));

  if (options.type === 'text' && options.text) {
    const fontSize = options.fontSize || Math.max(20, Math.round(width * 0.04));
    ctx.font = `bold ${fontSize}px ${options.fontFamily || 'Inter, sans-serif'}`;
    ctx.fillStyle = options.textColor || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow for high contrast readability over any background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    if (options.position === 'tile') {
      const stepX = fontSize * 12;
      const stepY = fontSize * 6;
      ctx.rotate(((options.rotation || -30) * Math.PI) / 180);
      for (let y = -height; y < height * 2; y += stepY) {
        for (let x = -width; x < width * 2; x += stepX) {
          ctx.fillText(options.text, x, y);
        }
      }
    } else {
      const margin = options.margin ?? 30;
      let x = width / 2;
      let y = height / 2;

      switch (options.position) {
        case 'top-left': x = margin + 80; y = margin + 30; break;
        case 'top-center': x = width / 2; y = margin + 30; break;
        case 'top-right': x = width - margin - 80; y = margin + 30; break;
        case 'center': x = width / 2; y = height / 2; break;
        case 'bottom-left': x = margin + 80; y = height - margin - 30; break;
        case 'bottom-center': x = width / 2; y = height - margin - 30; break;
        case 'bottom-right': x = width - margin - 80; y = height - margin - 30; break;
      }

      ctx.translate(x, y);
      ctx.rotate(((options.rotation || 0) * Math.PI) / 180);
      ctx.fillText(options.text, 0, 0);
    }
  } else if (options.type === 'image' && options.watermarkImage) {
    const wmImg = options.watermarkImage;
    const scale = options.watermarkScale || 0.2;
    const wmWidth = Math.round(width * scale);
    const wmHeight = Math.round((wmImg.naturalHeight / wmImg.naturalWidth) * wmWidth);
    const margin = options.margin ?? 30;

    let x = (width - wmWidth) / 2;
    let y = (height - wmHeight) / 2;

    switch (options.position) {
      case 'top-left': x = margin; y = margin; break;
      case 'top-center': x = (width - wmWidth) / 2; y = margin; break;
      case 'top-right': x = width - wmWidth - margin; y = margin; break;
      case 'center': x = (width - wmWidth) / 2; y = (height - wmHeight) / 2; break;
      case 'bottom-left': x = margin; y = height - wmHeight - margin; break;
      case 'bottom-center': x = (width - wmWidth) / 2; y = height - wmHeight - margin; break;
      case 'bottom-right': x = width - wmWidth - margin; y = height - wmHeight - margin; break;
      case 'tile': {
        const stepX = wmWidth * 2;
        const stepY = wmHeight * 2;
        for (let py = 0; py < height; py += stepY) {
          for (let px = 0; px < width; px += stepX) {
            ctx.drawImage(wmImg, px, py, wmWidth, wmHeight);
          }
        }
        break;
      }
    }

    if (options.position !== 'tile') {
      ctx.translate(x + wmWidth / 2, y + wmHeight / 2);
      ctx.rotate(((options.rotation || 0) * Math.PI) / 180);
      ctx.drawImage(wmImg, -wmWidth / 2, -wmHeight / 2, wmWidth, wmHeight);
    }
  }

  ctx.restore();

  const format = options.format || 'image/png';
  const quality = options.quality ?? 0.92;

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), format, quality);
  });
}

/**
 * Text Layer on Image
 */
export interface TextLayerOptions {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  alignment: 'left' | 'center' | 'right';
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  opacity: number;
  hasShadow: boolean;
  shadowColor?: string;
  hasBackgroundBox?: boolean;
  backgroundColor?: string;
}

export async function addTextToImage(
  imageFile: File | Blob,
  textLayers: TextLayerOptions[],
  format: SupportedImageFormat = 'image/png',
  quality: number = 0.92
): Promise<Blob> {
  const img = await fileToImage(imageFile);
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(img, 0, 0, width, height);

  for (const layer of textLayers) {
    if (!layer.text.trim()) continue;

    ctx.save();
    ctx.globalAlpha = layer.opacity;

    const fontStyle = `${layer.italic ? 'italic ' : ''}${layer.bold ? 'bold ' : ''}${layer.fontSize}px ${layer.fontFamily}`;
    ctx.font = fontStyle;
    ctx.textAlign = layer.alignment;
    ctx.textBaseline = 'middle';

    const posX = (layer.xPercent / 100) * width;
    const posY = (layer.yPercent / 100) * height;

    const lines = layer.text.split('\n');
    const lineHeight = layer.fontSize * 1.3;

    if (layer.hasBackgroundBox) {
      let maxLineWidth = 0;
      for (const line of lines) {
        const m = ctx.measureText(line);
        if (m.width > maxLineWidth) maxLineWidth = m.width;
      }
      const padX = layer.fontSize * 0.5;
      const padY = layer.fontSize * 0.4;
      const totalH = lines.length * lineHeight;

      ctx.fillStyle = layer.backgroundColor || 'rgba(0,0,0,0.6)';
      let boxX = posX - maxLineWidth / 2 - padX;
      if (layer.alignment === 'left') boxX = posX - padX;
      if (layer.alignment === 'right') boxX = posX - maxLineWidth - padX;

      const boxY = posY - totalH / 2 - padY;
      ctx.fillRect(boxX, boxY, maxLineWidth + padX * 2, totalH + padY * 2);
    }

    if (layer.hasShadow) {
      ctx.shadowColor = layer.shadowColor || 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
    }

    ctx.fillStyle = layer.color;
    const startY = posY - ((lines.length - 1) * lineHeight) / 2;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], posX, startY + i * lineHeight);
    }

    ctx.restore();
  }

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), format, quality);
  });
}

export interface ImagesToPdfOptions {
  pageSize: 'A4' | 'Letter' | 'FitImage';
  orientation: 'portrait' | 'landscape' | 'auto';
  marginMm: number;
  quality?: number;
}

export async function imagesToPdf(
  files: (File | Blob)[],
  options: ImagesToPdfOptions = { pageSize: 'A4', orientation: 'auto', marginMm: 10 }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const type = file.type;

    let embeddedImage;
    if (type === 'image/png') {
      embeddedImage = await pdfDoc.embedPng(arrayBuffer);
    } else if (type === 'image/jpeg' || type === 'image/jpg') {
      embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
    } else {
      // Re-encode WebP, BMP, etc. to PNG via canvas
      const img = await fileToImage(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      const pngBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
      const pngBuffer = await pngBlob.arrayBuffer();
      embeddedImage = await pdfDoc.embedPng(pngBuffer);
    }

    const imgDims = embeddedImage.scale(1);
    const mPt = options.marginMm * MM_TO_PT;

    let pageW = imgDims.width + mPt * 2;
    let pageH = imgDims.height + mPt * 2;

    if (options.pageSize !== 'FitImage') {
      const standard = STANDARD_SIZES_MM[options.pageSize] || STANDARD_SIZES_MM.A4;
      const stdW = standard.width * MM_TO_PT;
      const stdH = standard.height * MM_TO_PT;

      if (options.orientation === 'portrait') {
        pageW = Math.min(stdW, stdH);
        pageH = Math.max(stdW, stdH);
      } else if (options.orientation === 'landscape') {
        pageW = Math.max(stdW, stdH);
        pageH = Math.min(stdW, stdH);
      } else {
        if (imgDims.width > imgDims.height) {
          pageW = Math.max(stdW, stdH);
          pageH = Math.min(stdW, stdH);
        } else {
          pageW = Math.min(stdW, stdH);
          pageH = Math.max(stdW, stdH);
        }
      }
    }

    const page = pdfDoc.addPage([pageW, pageH]);
    const usableW = pageW - mPt * 2;
    const usableH = pageH - mPt * 2;

    const scaleFactor = Math.min(usableW / imgDims.width, usableH / imgDims.height, 1);
    const drawW = imgDims.width * scaleFactor;
    const drawH = imgDims.height * scaleFactor;

    const drawX = (pageW - drawW) / 2;
    const drawY = (pageH - drawH) / 2;

    page.drawImage(embeddedImage, {
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
    });
  }

  return await pdfDoc.save();
}
