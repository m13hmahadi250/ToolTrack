import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Ensure pdf.js worker is properly configured
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export type PdfCompressionPreset = 'maximum' | 'strong' | 'balanced' | 'high' | 'target';

export interface PdfCompressionOptions {
  preset?: PdfCompressionPreset;
  targetSizeKb?: number;
  removeMetadata?: boolean;
  flattenForms?: boolean;
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

/**
 * Format-Aware, Anti-Bloat PDF Compression Engine
 * Applies object stream compaction, metadata stripping, and raster re-encoding.
 * Strictly guarantees output size never exceeds input size.
 */
export async function compressPdfEngine(
  pdfInput: ArrayBuffer | Uint8Array,
  options: PdfCompressionOptions = {}
): Promise<PdfCompressionResult> {
  const inputBytes = pdfInput instanceof Uint8Array ? pdfInput : new Uint8Array(pdfInput);
  const originalSizeBytes = inputBytes.length;

  const pdfDoc = await PDFDocument.load(inputBytes, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();

  const preset = options.preset || 'balanced';

  // Pass 1: Stream compaction & metadata stripping
  if (options.removeMetadata !== false) {
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('ToolTrack PDF Engine');
    pdfDoc.setCreator('ToolTrack');
  }

  if (options.flattenForms) {
    try {
      const form = pdfDoc.getForm();
      form.flatten();
    } catch {
      // PDF may not contain form fields
    }
  }

  let compressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50,
  });

  let outputSizeBytes = compressedBytes.length;

  // Pass 2: If Pass 1 didn't reduce size (or if preset is 'maximum' / 'strong' / target size requested)
  if (outputSizeBytes >= originalSizeBytes || preset === 'maximum' || (options.targetSizeKb && options.targetSizeKb > 0)) {
    try {
      // Raster re-encoding pass via pdf.js + canvas for image-heavy/scanned PDFs
      const targetDpi = preset === 'maximum' ? 120 : preset === 'strong' ? 150 : 200;
      const targetJpgQuality = preset === 'maximum' ? 0.55 : preset === 'strong' ? 0.68 : 0.78;

      const loadingTask = pdfjsLib.getDocument({ data: inputBytes.slice(0) });
      const pdfJsDoc = await loadingTask.promise;
      const reencodedDoc = await PDFDocument.create();

      for (let i = 1; i <= pageCount; i++) {
        const page = await pdfJsDoc.getPage(i);
        const viewport = page.getViewport({ scale: targetDpi / 72 });

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: ctx,
            viewport,
            intent: 'print',
            canvasFactory: undefined,
          } as unknown as Parameters<typeof page.render>[0]).promise;

          const jpgBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', targetJpgQuality);
          });

          const jpgBuffer = await jpgBlob.arrayBuffer();
          const embeddedImage = await reencodedDoc.embedJpg(jpgBuffer);

          const originalPageObj = pdfDoc.getPage(i - 1);
          const origSize = originalPageObj.getSize();

          const newPage = reencodedDoc.addPage([origSize.width, origSize.height]);
          newPage.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: origSize.width,
            height: origSize.height,
          });
        }
      }

      const reencodedBytes = await reencodedDoc.save({ useObjectStreams: true });

      // Accept re-encoded bytes ONLY IF strictly smaller than original
      if (reencodedBytes.length < originalSizeBytes) {
        compressedBytes = reencodedBytes;
        outputSizeBytes = reencodedBytes.length;
      }
    } catch {
      // Re-encoding fallback: continue with Pass 1 output
    }
  }

  // ANTI-BLOAT ENFORCEMENT:
  // If final output is STILL >= original size, return ORIGINAL PDF!
  let wasCompressed = false;
  let isAlreadyOptimized = false;
  let finalBytes = compressedBytes;
  let statusMessage = '';

  if (outputSizeBytes < originalSizeBytes) {
    wasCompressed = true;
    const saved = originalSizeBytes - outputSizeBytes;
    const pct = Math.round((saved / originalSizeBytes) * 100);
    statusMessage = `PDF compressed successfully! Reduced by ${pct}% (${(saved / (1024 * 1024)).toFixed(2)} MB saved).`;
  } else {
    // Return original PDF
    finalBytes = inputBytes;
    outputSizeBytes = originalSizeBytes;
    wasCompressed = false;
    isAlreadyOptimized = true;
    statusMessage = 'Your PDF is already fully optimized. Original document preserved to prevent size increase.';
  }

  const savedBytes = Math.max(0, originalSizeBytes - outputSizeBytes);
  const savedPercent = originalSizeBytes > 0 ? Math.round((savedBytes / originalSizeBytes) * 100) : 0;

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
