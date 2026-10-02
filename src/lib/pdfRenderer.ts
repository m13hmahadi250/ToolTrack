import * as pdfjsLib from 'pdfjs-dist';
import type { DetectedPageInfo } from '../types';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  try {
    // In modern bundlers, we point to the unpkg / cdnjs worker matching version or local
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  } catch {
    // Fallback is non-blocking
  }
}

export const MM_TO_PT = 72 / 25.4;
export const PT_TO_MM = 25.4 / 72;

export const STANDARD_SIZES_MM: Record<string, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A5: { width: 148, height: 210 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
  Tabloid: { width: 279.4, height: 431.8 },
};

export function identifyStandardSize(widthPt: number, heightPt: number): string {
  const wMm = Math.round(Math.min(widthPt, heightPt) * PT_TO_MM);
  const hMm = Math.round(Math.max(widthPt, heightPt) * PT_TO_MM);

  for (const [name, dims] of Object.entries(STANDARD_SIZES_MM)) {
    const sw = Math.round(dims.width);
    const sh = Math.round(dims.height);
    if (Math.abs(wMm - sw) <= 3 && Math.abs(hMm - sh) <= 3) {
      return name;
    }
  }
  return `Custom (${Math.round(widthPt * PT_TO_MM)} × ${Math.round(heightPt * PT_TO_MM)} mm)`;
}

export async function loadPdfDocument(data: ArrayBuffer | Uint8Array, password?: string) {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(data),
    password: password || '',
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

export async function getPdfPagesInfo(data: ArrayBuffer | Uint8Array, password?: string): Promise<DetectedPageInfo[]> {
  const pdf = await loadPdfDocument(data, password);
  const numPages = pdf.numPages;
  const pagesInfo: DetectedPageInfo[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const widthPt = viewport.width;
    const heightPt = viewport.height;
    const widthMm = Math.round(widthPt * PT_TO_MM * 10) / 10;
    const heightMm = Math.round(heightPt * PT_TO_MM * 10) / 10;

    const orientation = widthPt > heightPt ? 'landscape' : widthPt < heightPt ? 'portrait' : 'square';
    const detectedStandard = identifyStandardSize(widthPt, heightPt);

    pagesInfo.push({
      pageNumber: i,
      widthPt,
      heightPt,
      widthMm,
      heightMm,
      orientation,
      detectedStandard,
    });
  }

  return pagesInfo;
}

export async function renderPageToCanvas(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  targetWidth = 300,
  rotation = 0
): Promise<number> {
  const page = await pdfDoc.getPage(pageNumber);
  const unscaledViewport = page.getViewport({ scale: 1, rotation });
  const scale = targetWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale, rotation });

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return scale;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: ctx,
    viewport,
  };

  // @ts-expect-error PDF.js render returns RenderTask
  await page.render(renderContext).promise;
  return scale;
}

export async function renderPageToImageDataUrl(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  maxWidth = 800
): Promise<string> {
  const canvas = document.createElement('canvas');
  await renderPageToCanvas(pdfDoc, pageNumber, canvas, maxWidth);
  return canvas.toDataURL('image/jpeg', 0.9);
}

export function cropCanvasRegionToDataUrl(
  sourceCanvas: HTMLCanvasElement,
  xPt: number,
  yPt: number,
  widthPt: number,
  heightPt: number,
  scale: number
): string {
  const cropCanvas = document.createElement('canvas');
  const sx = Math.max(0, Math.floor(xPt * scale));
  const sy = Math.max(0, Math.floor(yPt * scale));
  const sw = Math.min(sourceCanvas.width - sx, Math.ceil(widthPt * scale));
  const sh = Math.min(sourceCanvas.height - sy, Math.ceil(heightPt * scale));

  if (sw <= 0 || sh <= 0) return '';

  cropCanvas.width = sw;
  cropCanvas.height = sh;
  const ctx = cropCanvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return cropCanvas.toDataURL('image/png');
}

export async function extractTextFromPdf(data: ArrayBuffer | Uint8Array, password?: string): Promise<{ text: string; pages: string[] }> {
  const pdf = await loadPdfDocument(data, password);
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      // @ts-expect-error item has str property in TextItem
      .map((item: { str?: string }) => item.str || '')
      .join(' ');
    pages.push(pageText);
  }

  return {
    text: pages.join('\n\n--- Page Break ---\n\n'),
    pages,
  };
}
