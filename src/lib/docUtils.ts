import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { extractTextFromPdf } from './pdfRenderer';
import { analyzePdfLayout, type DocumentLayoutAnalysis } from './pdfLayoutAnalyzer';
import { buildHighFidelityDocx, type DocxBuildOptions } from './docxLayoutBuilder';
import { sanitizePdfText, safeDrawText, safeWidthOfTextAtSize } from './pdfTextSanitizer';
import { convertWordToPdf } from './wordToPdf';

export async function textToPdf(textContent: string, title = 'Document'): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4 pt
  const pageHeight = 841.89;
  const margin = 50;
  const usableWidth = pageWidth - margin * 2;
  const fontSize = 11;
  const lineHeight = 16;

  // Clean and sanitize text to prevent WinAnsi cannot encode errors (e.g. 0x1f4de 📞)
  const cleanContent = sanitizePdfText(textContent);
  const cleanTitle = sanitizePdfText(title);

  const lines = cleanContent.split(/\r?\n/);
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  // Title
  if (cleanTitle) {
    safeDrawText(currentPage, cleanTitle, {
      x: margin,
      y: currentY - 14,
      size: 16,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.2),
    });
    currentY -= 36;
  }

  for (const rawLine of lines) {
    // Word wrap line to fit usableWidth
    const words = rawLine.split(' ');
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const textWidth = safeWidthOfTextAtSize(font, testLine, fontSize);

      if (textWidth > usableWidth && currentLine) {
        if (currentY - lineHeight < margin) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }
        safeDrawText(currentPage, currentLine, {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
          color: rgb(0.15, 0.15, 0.15),
        });
        currentY -= lineHeight;
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine || rawLine === '') {
      if (currentY - lineHeight < margin) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }
      safeDrawText(currentPage, currentLine, {
        x: margin,
        y: currentY,
        size: fontSize,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
      currentY -= lineHeight;
    }
  }

  return await pdfDoc.save();
}

export async function excelToPdf(fileBuffer: ArrayBuffer, fileName = 'spreadsheet.xlsx'): Promise<Uint8Array> {
  // 1. Primary: High-fidelity LibreOffice headless Calc engine (calc_pdf_Export)
  try {
    const response = await fetch('/api/convert-excel-to-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-File-Name': encodeURIComponent(fileName),
      },
      body: fileBuffer,
    });
    if (response.ok) {
      const arr = await response.arrayBuffer();
      if (arr.byteLength > 100) {
        return new Uint8Array(arr);
      }
    }
  } catch (netErr) {
    console.warn('[ExcelToPdf] Server Calc endpoint unavailable, utilizing client-side fallback:', netErr);
  }

  // 2. Client-side Offline Fallback: SheetJS + PDF-Lib
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const data: (string | number)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Landscape A4 for tables
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const margin = 40;
  const usableWidth = pageWidth - margin * 2;
  const rowHeight = 22;
  const fontSize = 9;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  // Title
  safeDrawText(currentPage, `Sheet: ${sanitizePdfText(firstSheetName)}`, {
    x: margin,
    y: currentY - 12,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4),
  });
  currentY -= 30;

  if (data.length === 0) {
    safeDrawText(currentPage, 'Empty worksheet', { x: margin, y: currentY, size: 10, font });
    return await pdfDoc.save();
  }

  // Determine max columns
  const maxCols = Math.min(12, Math.max(...data.map((r) => r.length)));
  const colWidth = usableWidth / maxCols;

  data.forEach((row, rowIdx) => {
    if (currentY - rowHeight < margin) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - margin;
    }

    const isHeader = rowIdx === 0;

    // Background for header
    if (isHeader) {
      currentPage.drawRectangle({
        x: margin,
        y: currentY - rowHeight + 4,
        width: usableWidth,
        height: rowHeight,
        color: rgb(0.9, 0.93, 0.98),
      });
    }

    for (let c = 0; c < maxCols; c++) {
      const rawCellVal = row[c] !== undefined && row[c] !== null ? String(row[c]) : '';
      const cellVal = sanitizePdfText(rawCellVal);
      const cellX = margin + c * colWidth;
      const truncated = cellVal.length > 25 ? cellVal.substring(0, 22) + '...' : cellVal;

      safeDrawText(currentPage, truncated, {
        x: cellX + 4,
        y: currentY - 12,
        size: fontSize,
        font: isHeader ? boldFont : font,
        color: isHeader ? rgb(0.1, 0.2, 0.5) : rgb(0.15, 0.15, 0.15),
      });
    }

    // Row underline
    currentPage.drawLine({
      start: { x: margin, y: currentY - rowHeight + 4 },
      end: { x: margin + usableWidth, y: currentY - rowHeight + 4 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });

    currentY -= rowHeight;
  });

  return await pdfDoc.save();
}

export async function docxToPdf(
  fileBuffer: ArrayBuffer,
  fileName = 'document.docx',
  onProgress?: (progress: number, stage: string) => void
): Promise<Uint8Array> {
  const result = await convertWordToPdf(fileBuffer, { fileName, onProgress });
  return result.pdfBytes;
}

/**
 * PDF to authentic Word (.docx) generator using advanced page-by-page
 * layout analysis, preserving boxes, tables, typography, and page geometry.
 */
export async function pdfToDocx(
  pdfBuffer: ArrayBuffer,
  options?: DocxBuildOptions
): Promise<{ blob: Blob; analysis: DocumentLayoutAnalysis }> {
  // Step 1: Deep page-by-page layout and vector structure analysis
  const analysis = await analyzePdfLayout(pdfBuffer);

  // Step 2: Build authentic OpenXML document with geometry and styles
  const blob = await buildHighFidelityDocx(analysis, options || {
    mode: 'layout-preserved',
    preserveBoxes: true,
    preserveFonts: true,
    reconstructTables: true,
  });

  return { blob, analysis };
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface PdfToExcelResult {
  blob: Blob;
  rows: string[][];
  previewRows: string[][];
  totalRows: number;
  totalCols: number;
}

export async function pdfToExcel(pdfBuffer: ArrayBuffer): Promise<PdfToExcelResult> {
  const rows: string[][] = [];

  try {
    const analysis = await analyzePdfLayout(pdfBuffer);
    analysis.pages.forEach((page, pIdx) => {
      let pageHasTable = false;
      page.visualBlocks.forEach((block) => {
        if (block.type === 'table' && block.tableData && block.tableData.rows.length > 0) {
          pageHasTable = true;
          rows.push([`[Table Page ${pIdx + 1}]`]);
          block.tableData.rows.forEach((r) => {
            const rowCells = r.cells.map((c) => c.text.trim());
            if (rowCells.some((c) => c.length > 0)) {
              rows.push(rowCells);
            }
          });
        }
      });

      // If no explicit table block, group text lines by column alignments
      if (!pageHasTable) {
        rows.push([`[Page ${pIdx + 1}]`]);
        page.visualBlocks.forEach((block) => {
          if (block.lines && block.lines.length > 0) {
            block.lines.forEach((line) => {
              const cols = line.text.split(/\t|\s{2,}/).map((c: string) => c.trim()).filter(Boolean);
              if (cols.length > 0) {
                rows.push(cols);
              }
            });
          }
        });
      }
    });
  } catch (err) {
    console.warn('[PdfToExcel] Layout analysis fallback:', err);
    const { pages } = await extractTextFromPdf(pdfBuffer);
    pages.forEach((pageText, pIdx) => {
      rows.push([`[Page ${pIdx + 1}]`]);
      const lines = pageText.split('\n');
      lines.forEach((line) => {
        const cols = line.split(/\t|\s{2,}/).map((c) => c.trim()).filter(Boolean);
        if (cols.length > 0) {
          rows.push(cols);
        }
      });
    });
  }

  if (rows.length === 0) {
    rows.push(['No tabular data detected in PDF document']);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const previewRows = rows.slice(0, 20);
  const maxCols = Math.max(...rows.map((r) => r.length), 1);

  return {
    blob,
    rows,
    previewRows,
    totalRows: rows.length,
    totalCols: maxCols,
  };
}
