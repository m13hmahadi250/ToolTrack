import { PDFDocument } from 'pdf-lib';
import { loadPdfDocument, renderPageToCanvas } from './pdfRenderer';
import { WhiteboardElement } from '../types/whiteboard';
import { WhiteboardRenderer } from './whiteboardRenderer';

export interface RenderedPdfPage {
  element: WhiteboardElement;
  pageNumber: number;
  totalPages: number;
  width: number;
  height: number;
  dataUrl: string;
}

export interface ImportPdfOptions {
  name?: string;
  startX?: number;
  startY?: number;
  pageWidth?: number; // Default 720px wide
  pageGap?: number; // Vertical gap between sequential pages (default 36px)
  existingElementCount?: number;
}

/**
 * Renders every page of a PDF file sequentially into high-resolution image elements
 * arranged vertically for the Whiteboard canvas.
 */
export async function convertPdfToWhiteboardElements(
  fileOrBuffer: File | Blob | ArrayBuffer | Uint8Array,
  options: ImportPdfOptions = {}
): Promise<{
  elements: WhiteboardElement[];
  documentId: string;
  documentTitle: string;
  totalPages: number;
}> {
  let arrayBuffer: ArrayBuffer;
  let fileName = options.name || 'Document.pdf';

  if (fileOrBuffer instanceof File) {
    fileName = fileOrBuffer.name;
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else if (fileOrBuffer instanceof Blob) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else if (fileOrBuffer instanceof Uint8Array) {
    const copy = new Uint8Array(fileOrBuffer.byteLength);
    copy.set(fileOrBuffer);
    arrayBuffer = copy.buffer;
  } else {
    arrayBuffer = fileOrBuffer;
  }

  const pdfDoc = await loadPdfDocument(arrayBuffer);
  const totalPages = pdfDoc.numPages;
  const docId = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '');

  const startX = options.startX ?? 100;
  let currentY = options.startY ?? 100;
  const targetWidth = options.pageWidth ?? 740;
  const pageGap = options.pageGap ?? 40;
  const zBase = options.existingElementCount ?? 0;

  const elements: WhiteboardElement[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1 });
    const aspectRatio = unscaledViewport.height / unscaledViewport.width;
    const targetHeight = Math.round(targetWidth * aspectRatio);

    // Render to offscreen canvas with 1.8x crisp pixel ratio for zoom clarity
    const renderScale = 1.8;
    const renderWidth = Math.round(targetWidth * renderScale);
    const canvas = document.createElement('canvas');
    await renderPageToCanvas(pdfDoc, pageNum, canvas, renderWidth);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    const pageElement: WhiteboardElement = {
      id: `el_pdf_${docId}_p${pageNum}`,
      type: 'image',
      x: startX,
      y: currentY,
      width: targetWidth,
      height: targetHeight,
      strokeColor: '#cbd5e1',
      strokeWidth: 1, // Clean subtle border around PDF page
      opacity: 1,
      zIndex: zBase + pageNum,
      imageUrl: dataUrl,
      naturalWidth: canvas.width,
      naturalHeight: canvas.height,
      pdfDocumentId: docId,
      pdfPageNumber: pageNum,
      pdfTotalPages: totalPages,
      pdfDocTitle: cleanTitle,
    };

    elements.push(pageElement);
    currentY += targetHeight + pageGap;
  }

  return {
    elements,
    documentId: docId,
    documentTitle: cleanTitle,
    totalPages,
  };
}

/**
 * Exports an annotated PDF: Combines the original PDF pages with any user
 * strokes/annotations drawn on top of those respective pages into a new PDF.
 */
export async function exportAnnotatedPdfDocument(
  pdfDocumentId: string,
  allBoardElements: WhiteboardElement[],
  boardBackgroundColor = '#ffffff'
): Promise<{ blob: Blob; fileName: string }> {
  // Find all page elements for this document ordered by page number
  const pageElements = allBoardElements
    .filter((el) => el.pdfDocumentId === pdfDocumentId && el.type === 'image')
    .sort((a, b) => (a.pdfPageNumber || 0) - (b.pdfPageNumber || 0));

  if (pageElements.length === 0) {
    throw new Error('No PDF pages found for the specified document');
  }

  const docTitle = pageElements[0].pdfDocTitle || 'Annotated-Document';
  const newPdfDoc = await PDFDocument.create();

  for (const pageEl of pageElements) {
    // Collect annotations positioned over this specific page
    const pageBounds = {
      x: pageEl.x,
      y: pageEl.y,
      width: pageEl.width,
      height: pageEl.height,
    };

    // Find annotations that intersect or sit atop this page
    const annotationsOnPage = allBoardElements.filter((el) => {
      if (el.id === pageEl.id) return false;
      if (el.pdfDocumentId === pdfDocumentId && el.pdfPageNumber) return false; // don't treat other pages as annotations
      // Must be higher zIndex than the page
      if (el.zIndex <= pageEl.zIndex) return false;
      const b = WhiteboardRenderer.getSelectionBounds([el]);
      if (!b) return false;
      return (
        b.x + b.width > pageBounds.x &&
        b.x < pageBounds.x + pageBounds.width &&
        b.y + b.height > pageBounds.y &&
        b.y < pageBounds.y + pageBounds.height
      );
    });

    // Render page image + overlaid annotations onto a high-res offscreen canvas
    const exportScale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(pageBounds.width * exportScale);
    canvas.height = Math.round(pageBounds.height * exportScale);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    // Draw background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(exportScale, exportScale);
    ctx.translate(-pageBounds.x, -pageBounds.y);

    // Draw the PDF page
    WhiteboardRenderer.renderElement(ctx, pageEl, true);

    // Sort and draw annotations on top
    const sortedAnnotations = [...annotationsOnPage].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    for (const ann of sortedAnnotations) {
      WhiteboardRenderer.renderElement(ctx, ann, false);
    }
    ctx.restore();

    const pagePngDataUrl = canvas.toDataURL('image/png');
    const embeddedPng = await newPdfDoc.embedPng(pagePngDataUrl);

    // Standard points (72pt/inch): preserve aspect ratio
    const ptWidth = Math.max(pageBounds.width * 0.75, 400);
    const ptHeight = Math.max(pageBounds.height * 0.75, 300);

    const pdfPage = newPdfDoc.addPage([ptWidth, ptHeight]);
    pdfPage.drawImage(embeddedPng, {
      x: 0,
      y: 0,
      width: ptWidth,
      height: ptHeight,
    });
  }

  const pdfBytes = await newPdfDoc.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  return {
    blob,
    fileName: `${docTitle}-annotated.pdf`,
  };
}
