import { PDFDocument } from 'pdf-lib';
import { WhiteboardBoard, WhiteboardElement } from '../types/whiteboard';
import { WhiteboardRenderer } from './whiteboardRenderer';

export type ExportFormat = 'png' | 'jpg' | 'svg' | 'pdf' | 'json';
export type ExportQuality = 'standard' | 'high' | 'ultra';

export interface ExportOptions {
  format: ExportFormat;
  quality?: ExportQuality;
  target?: 'all' | 'selection' | 'frame';
  selectedElements?: WhiteboardElement[];
  frameElement?: WhiteboardElement;
  includeBackground?: boolean;
}

/**
 * Calculates minimal bounding box for target elements with padding
 */
export function calculateExportBounds(
  elements: WhiteboardElement[],
  padding = 32
): { x: number; y: number; width: number; height: number } {
  const bounds = WhiteboardRenderer.getSelectionBounds(elements);
  if (!bounds) {
    return { x: 0, y: 0, width: 1200, height: 800 };
  }

  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: Math.max(bounds.width + padding * 2, 200),
    height: Math.max(bounds.height + padding * 2, 150),
  };
}

/**
 * Exports whiteboard to high-resolution raster or vector file
 */
export async function exportWhiteboard(
  board: WhiteboardBoard,
  options: ExportOptions
): Promise<{ blob: Blob; fileName: string }> {
  const {
    format,
    quality = 'high',
    target = 'all',
    selectedElements = [],
    frameElement,
    includeBackground = true,
  } = options;

  let elementsToRender = board.elements;
  let bounds: { x: number; y: number; width: number; height: number };

  if (target === 'selection' && selectedElements.length > 0) {
    elementsToRender = selectedElements;
    bounds = calculateExportBounds(selectedElements, 40);
  } else if (target === 'frame' && frameElement) {
    // Elements strictly inside or overlapping the frame
    elementsToRender = board.elements.filter((el) => {
      if (el.id === frameElement.id) return true;
      const elBounds = WhiteboardRenderer.getSelectionBounds([el]);
      if (!elBounds) return false;
      return (
        elBounds.x >= frameElement.x - 20 &&
        elBounds.y >= frameElement.y - 20 &&
        elBounds.x + elBounds.width <= frameElement.x + frameElement.width + 20 &&
        elBounds.y + elBounds.height <= frameElement.y + frameElement.height + 20
      );
    });
    bounds = {
      x: frameElement.x,
      y: frameElement.y,
      width: frameElement.width,
      height: frameElement.height,
    };
  } else {
    bounds = calculateExportBounds(elementsToRender, 60);
  }

  const cleanTitle = (board.title || 'whiteboard').toLowerCase().replace(/[^a-z0-9]/g, '-');

  // JSON Project File Export
  if (format === 'json') {
    const jsonStr = JSON.stringify(board, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    return { blob, fileName: `${cleanTitle}.tooltrack-board` };
  }

  // Determine scale multiplier based on quality
  let scale = 2; // high default
  if (quality === 'standard') scale = 1;
  if (quality === 'ultra') scale = 3;

  // Offscreen Canvas for rendering
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = Math.round(bounds.width * scale);
  exportCanvas.height = Math.round(bounds.height * scale);

  const ctx = exportCanvas.getContext('2d', { alpha: format === 'png' && !includeBackground });
  if (!ctx) throw new Error('Could not create offscreen canvas');

  // Background
  if (includeBackground || format === 'jpg') {
    ctx.fillStyle = board.backgroundColor || '#0f172a';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  } else {
    ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
  }

  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-bounds.x, -bounds.y);

  // Render elements in order
  const sorted = [...elementsToRender].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  for (const el of sorted) {
    WhiteboardRenderer.renderElement(ctx, el, true);
  }
  ctx.restore();

  // Export raster image formats
  if (format === 'png') {
    const blob = await new Promise<Blob>((resolve, reject) => {
      exportCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png');
    });
    return { blob, fileName: `${cleanTitle}-${quality}.png` };
  }

  if (format === 'jpg') {
    const blob = await new Promise<Blob>((resolve, reject) => {
      exportCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error('JPG export failed'))), 'image/jpeg', 0.95);
    });
    return { blob, fileName: `${cleanTitle}-${quality}.jpg` };
  }

  // Export to PDF using pdf-lib
  if (format === 'pdf') {
    const imgDataUrl = exportCanvas.toDataURL('image/png');
    const pdfDoc = await PDFDocument.create();
    const pngImage = await pdfDoc.embedPng(imgDataUrl);

    // Standard points (72 DPI)
    const pageW = Math.max(bounds.width * 0.75, 400);
    const pageH = Math.max(bounds.height * 0.75, 300);

    const page = pdfDoc.addPage([pageW, pageH]);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pageW,
      height: pageH,
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    return { blob, fileName: `${cleanTitle}.pdf` };
  }

  // SVG Export
  if (format === 'svg') {
    const svgContent = generateSvg(sorted, bounds, board.backgroundColor, includeBackground);
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    return { blob, fileName: `${cleanTitle}.svg` };
  }

  throw new Error(`Unsupported format: ${format}`);
}

/**
 * Generates valid SVG XML string representing elements
 */
function generateSvg(
  elements: WhiteboardElement[],
  bounds: { x: number; y: number; width: number; height: number },
  bgColor: string,
  includeBackground: boolean
): string {
  let innerElements = '';

  if (includeBackground) {
    innerElements += `<rect width="${bounds.width}" height="${bounds.height}" fill="${bgColor}" />\n`;
  }

  for (const el of elements) {
    const relX = el.x - bounds.x;
    const relY = el.y - bounds.y;
    const stroke = el.strokeColor || '#ffffff';
    const strokeW = el.strokeWidth || 2;
    const fill = el.fillColor || 'none';
    const opacity = el.opacity ?? 1;

    if (el.type === 'rectangle') {
      innerElements += `<rect x="${relX}" y="${relY}" width="${el.width}" height="${el.height}" stroke="${stroke}" stroke-width="${strokeW}" fill="${fill}" opacity="${opacity}" />\n`;
    } else if (el.type === 'circle') {
      const cx = relX + el.width / 2;
      const cy = relY + el.height / 2;
      innerElements += `<ellipse cx="${cx}" cy="${cy}" rx="${Math.abs(el.width / 2)}" ry="${Math.abs(el.height / 2)}" stroke="${stroke}" stroke-width="${strokeW}" fill="${fill}" opacity="${opacity}" />\n`;
    } else if (el.type === 'line' || el.type === 'arrow') {
      innerElements += `<line x1="${relX}" y1="${relY}" x2="${relX + el.width}" y2="${relY + el.height}" stroke="${stroke}" stroke-width="${strokeW}" opacity="${opacity}" />\n`;
    } else if (el.type === 'text') {
      innerElements += `<text x="${relX}" y="${relY + (el.fontSize || 20)}" fill="${stroke}" font-size="${el.fontSize || 20}" font-family="sans-serif">${escapeXml(el.text || '')}</text>\n`;
    } else if (el.type === 'pencil' || el.type === 'pen' || el.type === 'highlighter') {
      if (el.points && el.points.length > 0) {
        const pathData = el.points
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x - bounds.x} ${p.y - bounds.y}`)
          .join(' ');
        innerElements += `<path d="${pathData}" stroke="${stroke}" stroke-width="${strokeW}" fill="none" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round" />\n`;
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="0 0 ${bounds.width} ${bounds.height}">
${innerElements}
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Triggers a direct browser file download
 */
export function triggerFileDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
