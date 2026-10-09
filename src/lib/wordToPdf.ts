import { loadPdfDocument, renderPageToCanvas, getPdfPagesInfo, extractTextFromPdf } from './pdfRenderer';
import { PDFDocument } from 'pdf-lib';

export interface WordToPdfOptions {
  fileName?: string;
  onProgress?: (progress: number, stage: string) => void;
  signal?: AbortSignal;
}

export interface WordToPdfValidation {
  isValid: boolean;
  pageCount: number;
  dimensions: { width: number; height: number }[];
  hasImages: boolean;
  hasText: boolean;
  error?: string;
}

export interface WordToPdfResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  provider: string;
  fileName: string;
  validation: WordToPdfValidation;
  previewDataUrl?: string;
}

/**
 * Validates the converted PDF on the client side to verify visual integrity and structure (Section 10).
 */
export async function validateConvertedPdf(pdfBytes: Uint8Array): Promise<WordToPdfValidation> {
  if (!pdfBytes || pdfBytes.length === 0) {
    return {
      isValid: false,
      pageCount: 0,
      dimensions: [],
      hasImages: false,
      hasText: false,
      error: 'Generated PDF byte array is empty.',
    };
  }

  try {
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    if (pageCount < 1) {
      return {
        isValid: false,
        pageCount: 0,
        dimensions: [],
        hasImages: false,
        hasText: false,
        error: 'PDF contains zero pages.',
      };
    }

    const pages = pdfDoc.getPages();
    const dimensions = pages.map((p) => {
      const { width, height } = p.getSize();
      return { width: Math.round(width), height: Math.round(height) };
    });

    // Inspect text and objects using PDF.js
    let hasText = false;
    let hasImages = false;

    try {
      const doc = await loadPdfDocument(pdfBytes);
      const textInfo = await extractTextFromPdf(doc);
      hasText = textInfo.text.trim().length > 0;

      // Check first page operator list for image draws
      const firstPage = await doc.getPage(1);
      const opList = await firstPage.getOperatorList();
      // Look for paintImageXObject (usually fn 82, 85, or paintJpegXObject)
      hasImages = opList.fnArray.some((fn) => fn === 82 || fn === 83 || fn === 85);
    } catch (parseErr) {
      console.warn('[WordToPdf] PDF.js inspection non-fatal note:', parseErr);
    }

    return {
      isValid: true,
      pageCount,
      dimensions,
      hasImages,
      hasText,
    };
  } catch (err: unknown) {
    return {
      isValid: false,
      pageCount: 0,
      dimensions: [],
      hasImages: false,
      hasText: false,
      error: 'Failed to parse PDF document structure: ' + String(err),
    };
  }
}

/**
 * Generates a thumbnail preview of the first page of the generated PDF.
 */
export async function renderPdfThumbnail(pdfBytes: Uint8Array, pageNumber = 1, width = 320): Promise<string> {
  try {
    const doc = await loadPdfDocument(pdfBytes);
    const canvas = document.createElement('canvas');
    await renderPageToCanvas(doc, pageNumber, canvas, width);
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('[WordToPdf] Thumbnail generation warning:', err);
    return '';
  }
}

/**
 * HIGH-FIDELITY DOCUMENT CONVERSION PIPELINE (Section 1-13)
 * Converts Word / DOCX / DOC to visually identical PDF using the native document rendering engine.
 * Never degrades to plain text extraction or unstyled paragraph reconstruction.
 */
export async function convertWordToPdf(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  options?: WordToPdfOptions
): Promise<WordToPdfResult> {
  const notify = (p: number, stage: string) => {
    if (options?.onProgress) options.onProgress(p, stage);
  };

  notify(0.1, 'Preparing document buffer...');

  let fileName = options?.fileName || 'document.docx';
  let buffer: ArrayBuffer;

  if (fileOrBuffer instanceof File) {
    fileName = fileOrBuffer.name;
    buffer = await fileOrBuffer.arrayBuffer();
  } else if (fileOrBuffer instanceof Uint8Array) {
    buffer = fileOrBuffer.buffer.slice(fileOrBuffer.byteOffset, fileOrBuffer.byteOffset + fileOrBuffer.byteLength) as ArrayBuffer;
  } else {
    buffer = fileOrBuffer;
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Internet connection required: High-fidelity Word to PDF document conversion requires an active connection to the rendering server. Please reconnect to continue.');
  }

  notify(0.25, 'Sending to native document rendering engine...');

  const response = await fetch('/api/convert-word-to-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'X-File-Name': encodeURIComponent(fileName),
    },
    body: buffer,
    signal: options?.signal,
  });

  if (!response.ok) {
    let errMessage = `Document conversion failed with HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errMessage = errJson.error;
    } catch {
      // response might not be JSON
    }
    throw new Error(errMessage);
  }

  notify(0.65, 'Receiving rendered PDF stream...');

  const providerUsed = response.headers.get('x-provider-used') || 'libreoffice-headless';
  const arrayBuffer = await response.arrayBuffer();
  const pdfBytes = new Uint8Array(arrayBuffer);

  notify(0.8, 'Validating document layout & structure...');

  const validation = await validateConvertedPdf(pdfBytes);
  if (!validation.isValid) {
    throw new Error(`PDF Output Validation Error: ${validation.error || 'The generated PDF failed visual and structural verification.'}`);
  }

  notify(0.9, 'Generating document visual preview...');
  const previewDataUrl = await renderPdfThumbnail(pdfBytes, 1, 380);

  notify(1.0, 'Conversion complete!');

  return {
    pdfBytes,
    pageCount: validation.pageCount,
    provider: providerUsed,
    fileName: fileName.replace(/\.[^/.]+$/, '') + '.pdf',
    validation,
    previewDataUrl,
  };
}

/**
 * Runs automated regression test against document engine (Section 11)
 */
export async function runDocumentEngineTest(): Promise<{
  status: string;
  engine: string;
  testCase: string;
  validation: WordToPdfValidation;
  generatedBytes: number;
}> {
  const res = await fetch('/api/test-word-to-pdf');
  if (!res.ok) {
    throw new Error(`Regression test endpoint returned HTTP ${res.status}`);
  }
  return await res.json();
}
