/**
 * High-Speed Background Removal Engine & Provider Manager
 * Architecture:
 * - PRIMARY PROVIDER: Photoroom API (via secure backend proxy /api/remove-background)
 * - FALLBACK PROVIDER: Local Neural Matting (WebGPU/IS-Net - 100% free, universal, client-side)
 *
 * Centralized Single Function: removeBackground(imageSource, options)
 * Clean developer console reporting of the active provider.
 */

import { hasCachedWeights } from './indexedDbCache';

export const PRIMARY_PROVIDER = 'Photoroom';
export const FALLBACK_PROVIDER = 'Local Neural Matting (WebGPU/IS-Net)';

export interface SegmentationOptions {
  modelQuality?: 'medium' | 'small' | 'large';
  sensitivity?: number;
  edgeFeather?: number;
  onProgress?: (progress: number, stage: string, isCacheHit?: boolean) => void;
}

export interface RemoveBackgroundResult {
  transparentBlob: Blob;
  imageData: ImageData;
  width: number;
  height: number;
  methodUsed: 'server-gpu' | 'neural-model';
  engineUsed: string;
  provider: 'Primary: Photoroom' | 'Fallback: Local Neural Matting (WebGPU/IS-Net)';
  durationMs: number;
  isCacheHit: boolean;
}

export interface BackgroundSettings {
  type: 'transparent' | 'color' | 'gradient' | 'image';
  color?: string;
  gradient?: { from: string; to: string };
  imageElement?: HTMLImageElement;
}

// Persistent Worker Singleton - Kept alive across image runs to eliminate cold starts
let persistentWorker: Worker | null = null;
let isWorkerWarming = false;
let currentResolve: ((val: any) => void) | null = null;
let currentReject: ((err: any) => void) | null = null;
let currentProgressCallback: ((progress: number, stage: string, isCacheHit?: boolean) => void) | null = null;
let currentIsCacheHit = false;

function getPersistentWorker(): Worker {
  if (!persistentWorker) {
    persistentWorker = new Worker(
      new URL('../workers/backgroundRemovalWorker.ts', import.meta.url),
      { type: 'module' }
    );

    persistentWorker.onmessage = (e) => {
      const data = e.data;

      if (data.type === 'CACHE_HIT') {
        currentIsCacheHit = true;
      } else if (data.type === 'CACHE_MISS') {
        currentIsCacheHit = false;
        currentProgressCallback?.(0.15, 'Initializing AI engine...', false);
      } else if (data.type === 'PROGRESS') {
        const stageMsg = data.hadCacheMiss ? 'Initializing AI engine...' : 'Segmenting subject...';
        currentProgressCallback?.(data.progress, stageMsg, !data.hadCacheMiss);
      } else if (data.type === 'SUCCESS') {
        currentResolve?.(data);
      } else if (data.type === 'ERROR') {
        currentReject?.(new Error(data.error || 'Background removal error'));
      }
    };

    persistentWorker.onerror = (err) => {
      currentReject?.(err);
    };
  }
  return persistentWorker;
}

/**
 * Pre-warms the background removal engine during idle time to eliminate startup lag
 */
export function prewarmEngine(): void {
  if (typeof window === 'undefined' || isWorkerWarming) return;
  isWorkerWarming = true;

  try {
    const worker = getPersistentWorker();
    worker.postMessage({ type: 'WARMUP', model: 'medium' });
  } catch {
    // Opportunistic warm-up failure is non-blocking
  }
}

// Auto-trigger warm-up during browser idle
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      prewarmEngine();
    });
  } else {
    setTimeout(prewarmEngine, 1000);
  }
}

/**
 * Attempts primary background removal via Photoroom API proxy
 */
async function callPrimaryProvider(file: File | Blob): Promise<Blob | null> {
  try {
    const res = await fetch('/api/remove-background', {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'image/png',
      },
      body: file,
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('image/')) {
        return await res.blob();
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Centralized Provider Manager function: removeBackground
 * Orchestrates Primary (Photoroom) -> Verified Free Fallback (Local Neural Matting)
 */
export async function removeBackground(
  imageSource: File | Blob | string | HTMLImageElement,
  options: SegmentationOptions = {}
): Promise<RemoveBackgroundResult> {
  const startTime = performance.now();
  const { modelQuality = 'medium', onProgress } = options;

  currentProgressCallback = onProgress || null;

  // 1. Prepare Image Element to measure original resolution & preserve full fidelity
  let origImg: HTMLImageElement;
  let sourceBlob: Blob;

  if (imageSource instanceof HTMLImageElement) {
    origImg = imageSource;
    const canvas = document.createElement('canvas');
    canvas.width = origImg.naturalWidth;
    canvas.height = origImg.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(origImg, 0, 0);
    sourceBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
  } else if (typeof imageSource === 'string') {
    origImg = new Image();
    origImg.src = imageSource;
    await new Promise<void>((res) => {
      origImg.onload = () => res();
      origImg.onerror = () => res();
    });
    const res = await fetch(imageSource);
    sourceBlob = await res.blob();
  } else {
    sourceBlob = imageSource;
    origImg = new Image();
    const url = URL.createObjectURL(sourceBlob);
    origImg.src = url;
    await new Promise<void>((res) => {
      origImg.onload = () => res();
      origImg.onerror = () => res();
    });
    URL.revokeObjectURL(url);
  }

  const origWidth = origImg.naturalWidth || origImg.width || 1;
  const origHeight = origImg.naturalHeight || origImg.height || 1;

  // 2. Try PRIMARY PROVIDER: Photoroom API
  onProgress?.(0.1, 'Contacting Photoroom AI...');
  const primaryResultBlob = await callPrimaryProvider(sourceBlob);

  if (primaryResultBlob) {
    console.log('[BackgroundRemover] Processed by Primary: Photoroom');
    onProgress?.(0.9, 'Finalizing Photoroom cutout...');

    const resultImg = new Image();
    const resUrl = URL.createObjectURL(primaryResultBlob);
    resultImg.src = resUrl;
    await new Promise<void>((res) => {
      resultImg.onload = () => res();
    });
    URL.revokeObjectURL(resUrl);

    const canvas = document.createElement('canvas');
    canvas.width = origWidth;
    canvas.height = origHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(resultImg, 0, 0, origWidth, origHeight);
    const imageData = ctx.getImageData(0, 0, origWidth, origHeight);

    const durationMs = Math.round(performance.now() - startTime);
    onProgress?.(1.0, `Cutout complete in ${(durationMs / 1000).toFixed(2)}s`);

    return {
      transparentBlob: primaryResultBlob,
      imageData,
      width: origWidth,
      height: origHeight,
      methodUsed: 'server-gpu',
      engineUsed: 'Photoroom AI (Primary)',
      provider: 'Primary: Photoroom',
      durationMs,
      isCacheHit: true,
    };
  }

  // 3. FALLBACK PROVIDER: Local Neural Matting (WebGPU / IS-Net)
  console.log('[BackgroundRemover] Processed by Fallback: Local Neural Matting (WebGPU/IS-Net)');

  // Check IndexedDB cache hit status up front
  const isInitiallyCached = await hasCachedWeights();
  currentIsCacheHit = isInitiallyCached;

  if (isInitiallyCached) {
    onProgress?.(0.15, 'Fallback active: Cached Neural Matting...', true);
  } else {
    onProgress?.(0.1, 'Fallback active: Initializing AI engine...', false);
  }

  // Smart Neural Resolution Preprocessing:
  // Optimize input size for tensor inference to eliminate multi-second decoding lag,
  // then map the refined alpha matte back to the original full-res pixels.
  let inferenceSource: Blob | File = sourceBlob;
  const MAX_INFERENCE_DIM = 1024;

  if (origWidth > MAX_INFERENCE_DIM || origHeight > MAX_INFERENCE_DIM) {
    const scale = Math.min(MAX_INFERENCE_DIM / origWidth, MAX_INFERENCE_DIM / origHeight);
    const inferWidth = Math.round(origWidth * scale);
    const inferHeight = Math.round(origHeight * scale);

    const inferCanvas = document.createElement('canvas');
    inferCanvas.width = inferWidth;
    inferCanvas.height = inferHeight;
    const inferCtx = inferCanvas.getContext('2d')!;
    inferCtx.drawImage(origImg, 0, 0, inferWidth, inferHeight);

    inferenceSource = await new Promise<Blob>((res) =>
      inferCanvas.toBlob((b) => res(b!), 'image/png')
    );
  }

  const worker = getPersistentWorker();

  const workerResult: { blob: Blob; isCacheHit: boolean } = await new Promise((resolve, reject) => {
    currentResolve = resolve;
    currentReject = reject;

    worker.postMessage({
      imageSource: inferenceSource,
      config: {
        model: modelQuality,
        device: 'gpu',
      },
    });
  });

  onProgress?.(0.9, 'Applying full-resolution alpha matte...', currentIsCacheHit);

  // Map the neural alpha mask back to original full-resolution image
  const maskImg = new Image();
  const maskUrl = URL.createObjectURL(workerResult.blob);
  maskImg.src = maskUrl;
  await new Promise<void>((res) => {
    maskImg.onload = () => res();
    maskImg.onerror = () => res();
  });
  URL.revokeObjectURL(maskUrl);

  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = origWidth;
  fullCanvas.height = origHeight;
  const fullCtx = fullCanvas.getContext('2d', { willReadFrequently: true })!;

  // Draw original image pixels
  fullCtx.drawImage(origImg, 0, 0, origWidth, origHeight);

  // Read original image data
  const finalImageData = fullCtx.getImageData(0, 0, origWidth, origHeight);
  const finalPixels = finalImageData.data;

  // Extract mask alpha channel scaled to original image dimensions
  const alphaCanvas = document.createElement('canvas');
  alphaCanvas.width = origWidth;
  alphaCanvas.height = origHeight;
  const alphaCtx = alphaCanvas.getContext('2d', { willReadFrequently: true })!;
  alphaCtx.drawImage(maskImg, 0, 0, origWidth, origHeight);
  const alphaData = alphaCtx.getImageData(0, 0, origWidth, origHeight).data;

  // Apply alpha matte with anti-aliasing preservation
  for (let i = 0; i < origWidth * origHeight; i++) {
    const alpha = alphaData[i * 4 + 3];
    finalPixels[i * 4 + 3] = alpha;
  }

  fullCtx.putImageData(finalImageData, 0, 0);

  const finalBlob = await new Promise<Blob>((resolve) => {
    fullCanvas.toBlob((b) => resolve(b || workerResult.blob), 'image/png');
  });

  const durationMs = Math.round(performance.now() - startTime);
  onProgress?.(1.0, `Cutout complete in ${(durationMs / 1000).toFixed(2)}s`, currentIsCacheHit);

  return {
    transparentBlob: finalBlob,
    imageData: finalImageData,
    width: origWidth,
    height: origHeight,
    methodUsed: 'neural-model',
    engineUsed: 'Neural Matting (Free Fallback)',
    provider: 'Fallback: Local Neural Matting (WebGPU/IS-Net)',
    durationMs,
    isCacheHit: workerResult.isCacheHit ?? currentIsCacheHit,
  };
}

// Backward-compatible alias
export const removeImageBackground = removeBackground;

/**
 * Interactive Brush / Eraser tool to manually add or remove background pixels
 */
export function applyBrush(
  workingData: ImageData,
  origImageData: ImageData,
  x: number,
  y: number,
  radius: number,
  mode: 'erase' | 'restore'
): ImageData {
  const { width, height } = workingData;
  const wData = workingData.data;
  const oData = origImageData.data;
  const rSq = radius * radius;

  for (let dy = -radius; dy <= radius; dy++) {
    const py = y + dy;
    if (py < 0 || py >= height) continue;
    for (let dx = -radius; dx <= radius; dx++) {
      const px = x + dx;
      if (px < 0 || px >= width) continue;
      if (dx * dx + dy * dy <= rSq) {
        const idx = (py * width + px) * 4;
        if (mode === 'erase') {
          wData[idx + 3] = 0;
        } else {
          wData[idx] = oData[idx];
          wData[idx + 1] = oData[idx + 1];
          wData[idx + 2] = oData[idx + 2];
          wData[idx + 3] = oData[idx + 3] > 0 ? oData[idx + 3] : 255;
        }
      }
    }
  }
  return workingData;
}

/**
 * Magic Wand tool for connected color-similarity erasure
 */
export function applyMagicWand(
  workingData: ImageData,
  startX: number,
  startY: number,
  tolerance: number = 32
): ImageData {
  const { width, height } = workingData;
  const data = workingData.data;
  const startIdx = (startY * width + startX) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  if (targetA === 0) return workingData;

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height * 2);
  let qHead = 0;
  let qTail = 0;

  queue[qTail++] = startX;
  queue[qTail++] = startY;
  visited[startY * width + startX] = 1;

  const tolSq = tolerance * tolerance * 3;

  while (qHead < qTail) {
    const cx = queue[qHead++];
    const cy = queue[qHead++];
    const cIdx = (cy * width + cx) * 4;

    data[cIdx + 3] = 0;

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (let i = 0; i < 4; i++) {
      const [nx, ny] = neighbors[i];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nPos = ny * width + nx;
        if (!visited[nPos]) {
          visited[nPos] = 1;
          const nIdx = nPos * 4;
          const dr = data[nIdx] - targetR;
          const dg = data[nIdx + 1] - targetG;
          const db = data[nIdx + 2] - targetB;
          const distSq = dr * dr + dg * dg + db * db;
          if (distSq <= tolSq && data[nIdx + 3] > 0) {
            queue[qTail++] = nx;
            queue[qTail++] = ny;
          }
        }
      }
    }
  }

  return workingData;
}

/**
 * Composite the cutout subject onto custom solid colors, gradients, images, or transparent canvas
 */
export async function renderWithBackground(
  imageData: ImageData,
  bgSettings: BackgroundSettings,
  format: 'image/png' | 'image/webp' | 'image/jpeg' = 'image/png',
  quality: number = 0.95
): Promise<Blob> {
  const { width, height } = imageData;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d canvas context');

  if (bgSettings.type === 'color' && bgSettings.color) {
    ctx.fillStyle = bgSettings.color;
    ctx.fillRect(0, 0, width, height);
  } else if (bgSettings.type === 'gradient' && bgSettings.gradient) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, bgSettings.gradient.from);
    grad.addColorStop(1, bgSettings.gradient.to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (bgSettings.type === 'image' && bgSettings.imageElement) {
    ctx.drawImage(bgSettings.imageElement, 0, 0, width, height);
  } else if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (tempCtx) {
    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode image'));
      },
      format,
      quality
    );
  });
}
