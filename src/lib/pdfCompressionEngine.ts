import './pdfPolyfill';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Ensure pdf.js worker is properly configured
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  } catch {
    // Non-blocking fallback
  }
}

export type PdfCompressionPreset = 'maximum' | 'strong' | 'balanced' | 'high' | 'target';

export interface PdfCompressionProgressDetails {
  page?: number;
  totalPages?: number;
  phase?: 'structure' | 'pages' | 'finalizing';
}

export interface PdfCompressionOptions {
  preset?: PdfCompressionPreset;
  targetSizeKb?: number;
  removeMetadata?: boolean;
  flattenForms?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: number, status: string, details?: PdfCompressionProgressDetails) => void;
}

export interface PdfCompressionResult {
  pdfBytes: Uint8Array;
  originalSizeBytes: number;
  outputSizeBytes: number;
  savedBytes: number;
  savedPercent: number;
  pageCount: number;
  wasCompressed: boolean;
  isAlreadyOptimized: boolean;
  statusMessage: string;
}

function formatBytesReadable(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getCompressionSettings(
  preset: PdfCompressionPreset,
  pageCount: number,
  targetSizeKb?: number
): { dpi: number; quality: number } {
  if (targetSizeKb && targetSizeKb > 0) {
    const totalTargetBytes = targetSizeKb * 1024;
    // Allow 8% safety budget for PDF structural overhead (xref, headers, catalogs)
    const budgetPerPage = (totalTargetBytes * 0.92) / Math.max(1, pageCount);

    if (budgetPerPage < 35_000) {
      return { dpi: 85, quality: 0.42 };
    } else if (budgetPerPage < 65_000) {
      return { dpi: 100, quality: 0.50 };
    } else if (budgetPerPage < 120_000) {
      return { dpi: 120, quality: 0.60 };
    } else if (budgetPerPage < 250_000) {
      return { dpi: 140, quality: 0.70 };
    } else {
      return { dpi: 160, quality: 0.78 };
    }
  }

  switch (preset) {
    case 'maximum':
      return { dpi: 100, quality: 0.52 };
    case 'strong':
      return { dpi: 120, quality: 0.62 };
    case 'balanced':
      return { dpi: 144, quality: 0.72 };
    case 'high':
      return { dpi: 180, quality: 0.82 };
    case 'target':
      return { dpi: 120, quality: 0.60 };
    default:
      return { dpi: 144, quality: 0.72 };
  }
}

/**
 * Renders a PDF page to high-quality compressed JPEG bytes
 */
async function renderPageToJpeg(
  page: pdfjsLib.PDFPageProxy,
  dpi: number,
  quality: number
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const unscaledViewport = page.getViewport({ scale: 1 });
  const scale = dpi / 72;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Draw clean opaque white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render PDF.js page onto canvas
  const renderTask = page.render({
    canvasContext: ctx,
    viewport,
  } as unknown as Parameters<typeof page.render>[0]);
  await renderTask.promise;

  // Convert to JPEG blob
  let jpegBlob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
  });

  let bytes: Uint8Array;
  if (jpegBlob && jpegBlob.size > 0) {
    const arrayBuffer = await jpegBlob.arrayBuffer();
    bytes = new Uint8Array(arrayBuffer);
  } else {
    // Fallback if toBlob returns null (e.g. tainted canvas or resource limitation)
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const base64 = dataUrl.split(',')[1] || '';
    const binary = atob(base64);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
  }

  // Free canvas buffer memory immediately
  canvas.width = 0;
  canvas.height = 0;

  return {
    bytes,
    width: unscaledViewport.width,
    height: unscaledViewport.height,
  };
}

/**
 * Safe PDF.js loader with defensive buffer clone
 */
async function loadSafePdfJsDoc(inputBytes: Uint8Array): Promise<pdfjsLib.PDFDocumentProxy> {
  const safeCopy = new Uint8Array(inputBytes.length);
  safeCopy.set(inputBytes);

  const loadingTask = pdfjsLib.getDocument({
    data: safeCopy,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  return await loadingTask.promise;
}

/**
 * Format-Aware, Anti-Bloat PDF Compression Engine
 * Dual-stage pipeline:
 *  - Pass 1: Lossless structure compaction & metadata stripping
 *  - Pass 2: Adaptive raster re-encoding & downsampling for scanned / image-heavy PDFs
 *  - Strict Anti-Bloat: Output size is never permitted to exceed input size.
 */
export async function compressPdfEngine(
  pdfInput: ArrayBuffer | Uint8Array,
  options: PdfCompressionOptions = {}
): Promise<PdfCompressionResult> {
  const inputBytes = pdfInput instanceof Uint8Array ? pdfInput : new Uint8Array(pdfInput);
  const originalSizeBytes = inputBytes.length;

  const preset = options.preset || 'balanced';
  const hasDom =
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof document.createElement === 'function';

  if (options.signal?.aborted) {
    throw new DOMException('PDF compression cancelled by user', 'AbortError');
  }

  if (options.onProgress) {
    options.onProgress(0.1, 'Analyzing PDF document structure...', {
      page: 0,
      totalPages: 1,
      phase: 'structure',
    });
  }

  // -------------------------------------------------------------------------
  // PASS 1: Lossless Vector & Structure Stream Compaction
  // -------------------------------------------------------------------------
  let pass1Doc: PDFDocument;
  let pageCount = 1;
  try {
    pass1Doc = await PDFDocument.load(inputBytes, { ignoreEncryption: true });
    pageCount = pass1Doc.getPageCount();
  } catch (err) {
    throw new Error('Failed to load PDF document: ' + String(err));
  }

  if (options.removeMetadata !== false) {
    pass1Doc.setTitle('');
    pass1Doc.setAuthor('');
    pass1Doc.setSubject('');
    pass1Doc.setKeywords([]);
    pass1Doc.setProducer('ToolTrack PDF Engine');
    pass1Doc.setCreator('ToolTrack');
  }

  if (options.flattenForms) {
    try {
      const form = pass1Doc.getForm();
      form.flatten();
    } catch {
      // PDF may not contain form fields
    }
  }

  let pass1Bytes: Uint8Array | null = null;
  try {
    pass1Bytes = await pass1Doc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    });
  } catch {
    // If Pass 1 save fails, continue with original input
  }

  if (options.signal?.aborted) {
    throw new DOMException('PDF compression cancelled by user', 'AbortError');
  }

  if (options.onProgress) {
    options.onProgress(0.2, 'Optimizing internal vector streams & fonts...', {
      page: 0,
      totalPages: pageCount,
      phase: 'structure',
    });
  }

  // -------------------------------------------------------------------------
  // PASS 2: Adaptive Raster Re-encoding & Downsampling
  // -------------------------------------------------------------------------
  let rasterBytes: Uint8Array | null = null;

  // Decide if Pass 2 should be executed:
  // - Always if DOM is available AND (preset is maximum/strong/target, or targetSizeKb requested,
  //   or Pass 1 didn't achieve significant reduction > 8%)
  const pass1Saved = pass1Bytes ? originalSizeBytes - pass1Bytes.length : 0;
  const pass1SavedPct = (pass1Saved / originalSizeBytes) * 100;
  const targetBytes = options.targetSizeKb ? options.targetSizeKb * 1024 : 0;
  const pass1ExceedsTarget = targetBytes > 0 && pass1Bytes && pass1Bytes.length > targetBytes;

  const shouldRunPass2 =
    hasDom &&
    (preset === 'maximum' ||
      preset === 'strong' ||
      targetBytes > 0 ||
      pass1SavedPct < 8 ||
      pass1ExceedsTarget);

  if (shouldRunPass2) {
    try {
      const { dpi, quality } = getCompressionSettings(preset, pageCount, options.targetSizeKb);
      const pdfJsDoc = await loadSafePdfJsDoc(inputBytes);
      const reencodedDoc = await PDFDocument.create();

      for (let i = 1; i <= pageCount; i++) {
        if (options.signal?.aborted) {
          throw new DOMException('PDF compression cancelled by user', 'AbortError');
        }

        if (options.onProgress) {
          const pct = 0.2 + (i / pageCount) * 0.72;
          options.onProgress(
            pct,
            `Compacting and downsampling page ${i} of ${pageCount}...`,
            {
              page: i,
              totalPages: pageCount,
              phase: 'pages',
            }
          );
        }

        const page = await pdfJsDoc.getPage(i);
        const { bytes: jpegData, width: origWidth, height: origHeight } = await renderPageToJpeg(
          page,
          dpi,
          quality
        );

        const embeddedImage = await reencodedDoc.embedJpg(jpegData);
        const newPage = reencodedDoc.addPage([origWidth, origHeight]);
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: origWidth,
          height: origHeight,
        });
      }

      if (options.removeMetadata !== false) {
        reencodedDoc.setProducer('ToolTrack PDF Engine');
        reencodedDoc.setCreator('ToolTrack');
      }

      rasterBytes = await reencodedDoc.save({ useObjectStreams: true });

      // Adaptive second pass: If targetSizeKb is requested and output is STILL too large,
      // try a lower quality pass to fit strictly under the user's limit
      if (
        targetBytes > 0 &&
        rasterBytes.length > targetBytes &&
        quality > 0.45 &&
        pageCount <= 12
      ) {
        if (options.signal?.aborted) {
          throw new DOMException('PDF compression cancelled by user', 'AbortError');
        }

        if (options.onProgress) {
          options.onProgress(0.9, 'Calibrating quality to meet target portal limit...', {
            page: pageCount,
            totalPages: pageCount,
            phase: 'pages',
          });
        }
        const lowerDoc = await PDFDocument.create();
        const lowerDpi = Math.max(80, Math.round(dpi * 0.8));
        const lowerQuality = Math.max(0.38, quality * 0.72);

        for (let i = 1; i <= pageCount; i++) {
          const page = await pdfJsDoc.getPage(i);
          const { bytes: jpegData, width: origWidth, height: origHeight } = await renderPageToJpeg(
            page,
            lowerDpi,
            lowerQuality
          );
          const embeddedImage = await lowerDoc.embedJpg(jpegData);
          const newPage = lowerDoc.addPage([origWidth, origHeight]);
          newPage.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: origWidth,
            height: origHeight,
          });
        }
        const lowerBytes = await lowerDoc.save({ useObjectStreams: true });
        if (lowerBytes.length < rasterBytes.length) {
          rasterBytes = lowerBytes;
        }
      }
    } catch (err) {
      console.warn('PDF.js raster compression pass failed, falling back to Pass 1:', err);
    }
  }

  if (options.onProgress) {
    options.onProgress(0.95, 'Finalizing output & verifying compression...', {
      page: pageCount,
      totalPages: pageCount,
      phase: 'finalizing',
    });
  }

  // -------------------------------------------------------------------------
  // PASS 3: Candidate Evaluation & Anti-Bloat Selection
  // -------------------------------------------------------------------------
  let finalBytes: Uint8Array = inputBytes;
  let wasCompressed = false;
  let isAlreadyOptimized = false;
  let statusMessage = '';

  // Evaluate candidates
  let selectedCandidate: Uint8Array | null = null;

  if (rasterBytes && pass1Bytes) {
    if (targetBytes > 0) {
      // If target size requested, pick candidate closest to / under target
      const rasterUnder = rasterBytes.length <= targetBytes;
      const pass1Under = pass1Bytes.length <= targetBytes;
      if (rasterUnder && !pass1Under) {
        selectedCandidate = rasterBytes;
      } else if (pass1Under && !rasterUnder) {
        selectedCandidate = pass1Bytes;
      } else {
        selectedCandidate = rasterBytes.length < pass1Bytes.length ? rasterBytes : pass1Bytes;
      }
    } else if (preset === 'maximum' || preset === 'strong') {
      selectedCandidate = rasterBytes.length < pass1Bytes.length ? rasterBytes : pass1Bytes;
    } else if (preset === 'balanced') {
      // Prefer raster if it achieved at least 10% better reduction than pass1
      if (rasterBytes.length < pass1Bytes.length * 0.9) {
        selectedCandidate = rasterBytes;
      } else if (pass1Bytes.length < originalSizeBytes) {
        selectedCandidate = pass1Bytes;
      } else {
        selectedCandidate = rasterBytes;
      }
    } else {
      // High preset: prefer pass 1 (keeps vector text crisp) if it achieved any savings
      if (pass1Bytes.length < originalSizeBytes && pass1SavedPct >= 5) {
        selectedCandidate = pass1Bytes;
      } else {
        selectedCandidate = rasterBytes.length < pass1Bytes.length ? rasterBytes : pass1Bytes;
      }
    }
  } else if (rasterBytes) {
    selectedCandidate = rasterBytes;
  } else if (pass1Bytes) {
    selectedCandidate = pass1Bytes;
  }

  // Strictly enforce anti-bloat: Output MUST be smaller than original
  if (selectedCandidate && selectedCandidate.length < originalSizeBytes) {
    finalBytes = selectedCandidate;
    wasCompressed = true;
    const savedBytes = originalSizeBytes - finalBytes.length;
    const savedPercent = Math.round((savedBytes / originalSizeBytes) * 100);
    const beforeStr = formatBytesReadable(originalSizeBytes);
    const afterStr = formatBytesReadable(finalBytes.length);
    const savedStr = formatBytesReadable(savedBytes);

    statusMessage = `Successfully compressed from ${beforeStr} to ${afterStr} (${savedPercent}% saved, ${savedStr} reduction).`;
  } else {
    // If no candidate was smaller than input, preserve original file completely
    finalBytes = inputBytes;
    wasCompressed = false;
    isAlreadyOptimized = true;
    statusMessage = `Your PDF is already fully optimized at ${formatBytesReadable(originalSizeBytes)}. Original document preserved to prevent size increase.`;
  }

  const outputSizeBytes = finalBytes.length;
  const savedBytes = Math.max(0, originalSizeBytes - outputSizeBytes);
  const savedPercent = originalSizeBytes > 0 ? Math.round((savedBytes / originalSizeBytes) * 100) : 0;

  if (options.onProgress) {
    options.onProgress(1.0, 'Complete!');
  }

  return {
    pdfBytes: finalBytes,
    originalSizeBytes,
    outputSizeBytes,
    savedBytes,
    savedPercent,
    pageCount,
    wasCompressed,
    isAlreadyOptimized,
    statusMessage,
  };
}
