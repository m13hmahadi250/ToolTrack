import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import type { PageSizeNormalizerOptions, Margins } from '../types';
import { MM_TO_PT, STANDARD_SIZES_MM } from './pdfRenderer';

export interface PageModificationOptions {
  pageOrder: number[]; // 0-indexed page numbers in desired sequence
  rotations?: Record<number, number>; // page index -> rotation in degrees (0, 90, 180, 270)
  deletedPages?: number[];
  blankPagesAfter?: number[];
}

export async function mergePdfs(pdfBuffers: (ArrayBuffer | Uint8Array)[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

export async function splitPdfByRanges(
  pdfBytes: ArrayBuffer | Uint8Array,
  rangesString: string
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const sourcePdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const totalPages = sourcePdf.getPageCount();
  const results: { name: string; bytes: Uint8Array }[] = [];

  // Parse ranges, e.g., "1-3, 5, 7-9" or "every"
  const rangeGroups = rangesString.split(',').map((r) => r.trim()).filter(Boolean);

  let groupIndex = 1;
  for (const group of rangeGroups) {
    const newDoc = await PDFDocument.create();
    let pageNumbers: number[] = [];

    if (group.toLowerCase() === 'all' || group === '*') {
      pageNumbers = Array.from({ length: totalPages }, (_, i) => i);
    } else if (group.includes('-')) {
      const [startStr, endStr] = group.split('-').map((s) => s.trim());
      const start = Math.max(1, parseInt(startStr, 10));
      const end = Math.min(totalPages, parseInt(endStr, 10));
      for (let p = start; p <= end; p++) {
        pageNumbers.push(p - 1);
      }
    } else {
      const p = parseInt(group, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        pageNumbers.push(p - 1);
      }
    }

    if (pageNumbers.length > 0) {
      const copiedPages = await newDoc.copyPages(sourcePdf, pageNumbers);
      copiedPages.forEach((page) => newDoc.addPage(page));
      const bytes = await newDoc.save();
      const rangeLabel = group.replace(/\s+/g, '');
      results.push({
        name: `split-pages-${rangeLabel || groupIndex}.pdf`,
        bytes,
      });
      groupIndex++;
    }
  }

  return results;
}

export async function splitEveryPage(pdfBytes: ArrayBuffer | Uint8Array): Promise<{ name: string; bytes: Uint8Array }[]> {
  const sourcePdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const totalPages = sourcePdf.getPageCount();
  const results: { name: string; bytes: Uint8Array }[] = [];

  for (let i = 0; i < totalPages; i++) {
    const newDoc = await PDFDocument.create();
    const [copiedPage] = await newDoc.copyPages(sourcePdf, [i]);
    newDoc.addPage(copiedPage);
    const bytes = await newDoc.save();
    results.push({
      name: `page-${i + 1}.pdf`,
      bytes,
    });
  }

  return results;
}

export async function organizeAndModifyPdf(
  pdfBytes: ArrayBuffer | Uint8Array,
  options: PageModificationOptions
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  for (const pageIdx of options.pageOrder) {
    if (options.deletedPages?.includes(pageIdx)) continue;

    const [copiedPage] = await newDoc.copyPages(sourcePdf, [pageIdx]);

    if (options.rotations && options.rotations[pageIdx] !== undefined) {
      const currentRot = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((currentRot + options.rotations[pageIdx]) % 360));
    }

    newDoc.addPage(copiedPage);

    if (options.blankPagesAfter?.includes(pageIdx)) {
      const { width, height } = copiedPage.getSize();
      newDoc.addPage([width, height]);
    }
  }

  return await newDoc.save();
}

export async function rotateAllPages(
  pdfBytes: ArrayBuffer | Uint8Array,
  angleDegrees: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const currentRot = page.getRotation().angle;
    page.setRotation(degrees((currentRot + angleDegrees) % 360));
  }

  return await pdfDoc.save();
}

/**
 * Flagship Normalizer:
 * Takes any PDF with mixed or irregular page sizes, and normalizes every page
 * into a consistent standard target dimensions without unwanted distortion.
 */
export async function normalizePdfPageSizes(
  pdfBytes: ArrayBuffer | Uint8Array,
  options: PageSizeNormalizerOptions
): Promise<Uint8Array> {
  const sourceDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pageCount = sourceDoc.getPageCount();
  const sourcePages = sourceDoc.getPages();

  // Determine target standard dimensions in points
  let targetWidthPt = 0;
  let targetHeightPt = 0;

  if (options.targetSize === 'Custom') {
    targetWidthPt = options.customWidthMm * MM_TO_PT;
    targetHeightPt = options.customHeightMm * MM_TO_PT;
  } else if (options.targetSize === 'FirstPage' && pageCount > 0) {
    const p1 = sourcePages[0].getSize();
    targetWidthPt = p1.width;
    targetHeightPt = p1.height;
  } else if (options.targetSize === 'LargestPage' && pageCount > 0) {
    let maxArea = 0;
    for (const p of sourcePages) {
      const s = p.getSize();
      const area = s.width * s.height;
      if (area > maxArea) {
        maxArea = area;
        targetWidthPt = s.width;
        targetHeightPt = s.height;
      }
    }
  } else if (options.targetSize === 'SmallestPage' && pageCount > 0) {
    let minArea = Infinity;
    for (const p of sourcePages) {
      const s = p.getSize();
      const area = s.width * s.height;
      if (area < minArea) {
        minArea = area;
        targetWidthPt = s.width;
        targetHeightPt = s.height;
      }
    }
  } else {
    // Standard sizes
    const standard = STANDARD_SIZES_MM[options.targetSize] || STANDARD_SIZES_MM.A4;
    targetWidthPt = standard.width * MM_TO_PT;
    targetHeightPt = standard.height * MM_TO_PT;
  }

  const newDoc = await PDFDocument.create();

  // Margins in points
  const mTop = (options.margins.top || 0) * MM_TO_PT;
  const mBottom = (options.margins.bottom || 0) * MM_TO_PT;
  const mLeft = (options.margins.left || 0) * MM_TO_PT;
  const mRight = (options.margins.right || 0) * MM_TO_PT;

  for (let i = 0; i < pageCount; i++) {
    const origPage = sourcePages[i];
    const origSize = origPage.getSize();
    const origW = origSize.width;
    const origH = origSize.height;

    // Check target orientation for this page
    let finalPageW = targetWidthPt;
    let finalPageH = targetHeightPt;

    if (options.orientation === 'portrait') {
      finalPageW = Math.min(targetWidthPt, targetHeightPt);
      finalPageH = Math.max(targetWidthPt, targetHeightPt);
    } else if (options.orientation === 'landscape') {
      finalPageW = Math.max(targetWidthPt, targetHeightPt);
      finalPageH = Math.min(targetWidthPt, targetHeightPt);
    } else if (options.orientation === 'auto') {
      // Keep native orientation
      const isOrigLandscape = origW > origH;
      if (isOrigLandscape) {
        finalPageW = Math.max(targetWidthPt, targetHeightPt);
        finalPageH = Math.min(targetWidthPt, targetHeightPt);
      } else {
        finalPageW = Math.min(targetWidthPt, targetHeightPt);
        finalPageH = Math.max(targetWidthPt, targetHeightPt);
      }
    }

    const newPage = newDoc.addPage([finalPageW, finalPageH]);

    // Usable drawing area inside margins
    const usableW = Math.max(10, finalPageW - mLeft - mRight);
    const usableH = Math.max(10, finalPageH - mTop - mBottom);

    const [embeddedPage] = await newDoc.embedPages([origPage]);

    let drawW = origW;
    let drawH = origH;
    let drawX = mLeft;
    let drawY = mBottom;

    if (options.allowDistortion) {
      // Stretch to fill usable area
      drawW = usableW;
      drawH = usableH;
      drawX = mLeft;
      drawY = mBottom;
    } else {
      // Maintain aspect ratio
      const scaleX = usableW / origW;
      const scaleY = usableH / origH;

      if (options.scaleMode === 'fit' || options.scaleMode === 'proportional') {
        const factor = Math.min(scaleX, scaleY);
        drawW = origW * factor;
        drawH = origH * factor;
      } else if (options.scaleMode === 'fill') {
        const factor = Math.max(scaleX, scaleY);
        drawW = origW * factor;
        drawH = origH * factor;
      } else if (options.scaleMode === 'original' || options.scaleMode === 'crop') {
        drawW = origW;
        drawH = origH;
      }

      // Alignment
      if (options.alignment === 'center') {
        drawX = mLeft + (usableW - drawW) / 2;
        drawY = mBottom + (usableH - drawH) / 2;
      } else if (options.alignment === 'top') {
        drawX = mLeft + (usableW - drawW) / 2;
        drawY = finalPageH - mTop - drawH;
      } else if (options.alignment === 'bottom') {
        drawX = mLeft + (usableW - drawW) / 2;
        drawY = mBottom;
      } else if (options.alignment === 'left') {
        drawX = mLeft;
        drawY = mBottom + (usableH - drawH) / 2;
      } else if (options.alignment === 'right') {
        drawX = finalPageW - mRight - drawW;
        drawY = mBottom + (usableH - drawH) / 2;
      }
    }

    newPage.drawPage(embeddedPage, {
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
    });
  }

  return await newDoc.save({ useObjectStreams: true });
}

export async function compressPdf(
  pdfBytes: ArrayBuffer | Uint8Array,
  quality: 'maximum' | 'balanced' | 'high'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  // Clear unneeded metadata to save space
  if (quality === 'maximum' || quality === 'balanced') {
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('ToolTrack Document Optimizer');
    pdfDoc.setCreator('ToolTrack');
  }

  // Save with maximum object streams and compact serialization
  return await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50,
  });
}

export async function flattenPdf(pdfBytes: ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  try {
    const form = pdfDoc.getForm();
    form.flatten();
  } catch {
    // PDF might not contain interactive form fields
  }
  return await pdfDoc.save({ useObjectStreams: true });
}

export async function removeMetadata(pdfBytes: ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer('');
  pdfDoc.setCreator('');
  return await pdfDoc.save({ useObjectStreams: true });
}

export async function addWatermark(
  pdfBytes: ArrayBuffer | Uint8Array,
  text: string,
  opacity = 0.25,
  fontSize = 48,
  color = { r: 0.8, g: 0.1, b: 0.1 }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - textHeight / 2,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(45),
    });
  }

  return await pdfDoc.save();
}

export async function addPageNumbers(
  pdfBytes: ArrayBuffer | Uint8Array,
  format: 'page_x' | 'page_x_of_y' | 'x' = 'page_x_of_y',
  position: 'bottom-center' | 'bottom-right' | 'top-right' = 'bottom-center'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const total = pages.length;

  pages.forEach((page, idx) => {
    const currentNum = idx + 1;
    let label = `${currentNum}`;
    if (format === 'page_x') label = `Page ${currentNum}`;
    if (format === 'page_x_of_y') label = `Page ${currentNum} of ${total}`;

    const { width, height } = page.getSize();
    const fontSize = 10;
    const textWidth = font.widthOfTextAtSize(label, fontSize);

    let x = width / 2 - textWidth / 2;
    let y = 25;

    if (position === 'bottom-right') {
      x = width - textWidth - 36;
      y = 25;
    } else if (position === 'top-right') {
      x = width - textWidth - 36;
      y = height - 30;
    }

    page.drawText(label, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  return await pdfDoc.save();
}

export async function redactPdfRectangles(
  pdfBytes: ArrayBuffer | Uint8Array,
  redactions: { pageIndex: number; x: number; y: number; width: number; height: number }[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  for (const r of redactions) {
    if (r.pageIndex >= 0 && r.pageIndex < pages.length) {
      const page = pages[r.pageIndex];
      page.drawRectangle({
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        color: rgb(0, 0, 0),
        borderColor: rgb(0, 0, 0),
        borderWidth: 0,
      });
    }
  }

  return await pdfDoc.save();
}

export async function getPdfMetadata(pdfBytes: ArrayBuffer | Uint8Array) {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  return {
    pageCount: pages.length,
    title: pdfDoc.getTitle() || 'Untitled',
    author: pdfDoc.getAuthor() || 'Unknown',
    subject: pdfDoc.getSubject() || '',
    creator: pdfDoc.getCreator() || 'Unknown',
    producer: pdfDoc.getProducer() || 'Unknown',
    creationDate: pdfDoc.getCreationDate()?.toLocaleString() || 'Unknown',
    modificationDate: pdfDoc.getModificationDate()?.toLocaleString() || 'Unknown',
    keywords: pdfDoc.getKeywords() || '',
  };
}
