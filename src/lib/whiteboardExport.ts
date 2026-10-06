import { PDFDocument } from 'pdf-lib';
import { WhiteboardBoard, WhiteboardElement } from '../types/whiteboard';
import { WhiteboardRenderer, getCachedImage } from './whiteboardRenderer';

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
 * Preloads all image elements present in the export list so they render immediately
 */
async function preloadImagesForExport(elements: WhiteboardElement[]): Promise<void> {
  const imageElements = elements.filter((el) => el.type === 'image' && el.imageUrl);
  if (imageElements.length === 0) return;

  const loadPromises = imageElements.map((el) => {
    return new Promise<void>((resolve) => {
      const img = getCachedImage(el.imageUrl!);
      if (img && img.complete && img.naturalWidth > 0) {
        resolve();
        return;
      }
      const loader = new Image();
      loader.crossOrigin = 'anonymous';
      loader.onload = () => resolve();
      loader.onerror = () => resolve(); // continue even if an image fails
      loader.src = el.imageUrl!;
    });
  });

  await Promise.race([
    Promise.all(loadPromises),
    new Promise<void>((r) => setTimeout(r, 4000)), // 4s timeout maximum
  ]);
}
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

  // Preload any image elements so they are ready before drawing to canvas
  await preloadImagesForExport(elementsToRender);

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

  // Helper to safely obtain blob with dataURL fallback
  const canvasToBlobSafe = (canvas: HTMLCanvasElement, mimeType: string, qualityVal?: number): Promise<Blob> => {
    return new Promise<Blob>((resolve, reject) => {
      try {
        canvas.toBlob(
          (b) => {
            if (b) {
              resolve(b);
            } else {
              // Fallback to dataURL if toBlob returns null or is not supported
              try {
                const dataUrl = canvas.toDataURL(mimeType, qualityVal);
                const arr = dataUrl.split(',');
                const mimeMatch = arr[0].match(/:(.*?);/);
                const mime = mimeMatch ? mimeMatch[1] : mimeType;
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                  u8arr[n] = bstr.charCodeAt(n);
                }
                resolve(new Blob([u8arr], { type: mime }));
              } catch (fallbackErr) {
                reject(fallbackErr || new Error(`${mimeType} export conversion failed`));
              }
            }
          },
          mimeType,
          qualityVal
        );
      } catch (err) {
        // Fallback to dataURL
        try {
          const dataUrl = canvas.toDataURL(mimeType, qualityVal);
          const arr = dataUrl.split(',');
          const mimeMatch = arr[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : mimeType;
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          resolve(new Blob([u8arr], { type: mime }));
        } catch (fallbackErr) {
          reject(err || fallbackErr || new Error(`${mimeType} export failed`));
        }
      }
    });
  };

  // Export raster image formats
  if (format === 'png') {
    const blob = await canvasToBlobSafe(exportCanvas, 'image/png');
    return { blob, fileName: `${cleanTitle}-${quality}.png` };
  }

  if (format === 'jpg') {
    const blob = await canvasToBlobSafe(exportCanvas, 'image/jpeg', 0.95);
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
    // Use Uint8Array slice to ensure safe ArrayBuffer across all browsers
    const pdfArrayBuffer = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength
    );
    const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
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

    const isDashed = el.strokeStyle === 'dashed' ? ' stroke-dasharray="8,6"' : el.strokeStyle === 'dotted' ? ' stroke-dasharray="3,5"' : '';

    if (el.type === 'rectangle') {
      innerElements += `<rect x="${relX}" y="${relY}" width="${el.width}" height="${el.height}" stroke="${stroke}" stroke-width="${strokeW}" fill="${fill}" opacity="${opacity}"${isDashed} />\n`;
    } else if (el.type === 'rounded_rectangle') {
      innerElements += `<rect x="${relX}" y="${relY}" width="${el.width}" height="${el.height}" rx="12" ry="12" stroke="${stroke}" stroke-width="${strokeW}" fill="${fill}" opacity="${opacity}"${isDashed} />\n`;
    } else if (el.type === 'circle') {
      const cx = relX + el.width / 2;
      const cy = relY + el.height / 2;
      innerElements += `<ellipse cx="${cx}" cy="${cy}" rx="${Math.abs(el.width / 2)}" ry="${Math.abs(el.height / 2)}" stroke="${stroke}" stroke-width="${strokeW}" fill="${fill}" opacity="${opacity}"${isDashed} />\n`;
    } else if (el.type === 'diamond') {
      const p1 = `${relX + el.width / 2},${relY}`;
      const p2 = `${relX + el.width},${relY + el.height / 2}`;
      const p3 = `${relX + el.width / 2},${relY + el.height}`;
      const p4 = `${relX},${relY + el.height / 2}`;
      innerElements += `<polygon points="${p1} ${p2} ${p3} ${p4}" stroke="${stroke}" stroke-width="${strokeW}" fill="${fill}" opacity="${opacity}"${isDashed} />\n`;
    } else if (el.type === 'triangle') {
      const p1 = `${relX + el.width / 2},${relY}`;
      const p2 = `${relX + el.width},${relY + el.height}`;
      const p3 = `${relX},${relY + el.height}`;
      innerElements += `<polygon points="${p1} ${p2} ${p3}" stroke="${stroke}" stroke-width="${strokeW}" fill="${fill}" opacity="${opacity}"${isDashed} />\n`;
    } else if (el.type === 'line' || el.type === 'arrow' || el.type === 'double_arrow') {
      innerElements += `<line x1="${relX}" y1="${relY}" x2="${relX + el.width}" y2="${relY + el.height}" stroke="${stroke}" stroke-width="${strokeW}" opacity="${opacity}"${isDashed} stroke-linecap="round" />\n`;
    } else if (el.type === 'image' && el.imageUrl) {
      innerElements += `<image href="${el.imageUrl}" x="${relX}" y="${relY}" width="${el.width}" height="${el.height}" opacity="${opacity}" preserveAspectRatio="none" />\n`;
    } else if (el.type === 'sticky') {
      const stickyBg = el.fillColor || '#fef08a';
      innerElements += `<rect x="${relX}" y="${relY}" width="${el.width}" height="${el.height}" rx="6" ry="6" fill="${stickyBg}" stroke="rgba(0,0,0,0.1)" stroke-width="1" opacity="${opacity}" />\n`;
      innerElements += `<text x="${relX + 12}" y="${relY + 24}" fill="#1e293b" font-size="14" font-family="sans-serif">${escapeXml(el.text || '')}</text>\n`;
    } else if (el.type === 'text') {
      innerElements += `<text x="${relX}" y="${relY + (el.fontSize || 20)}" fill="${stroke}" font-size="${el.fontSize || 20}" font-family="sans-serif">${escapeXml(el.text || '')}</text>\n`;
    } else if (el.type === 'pencil' || el.type === 'pen' || el.type === 'highlighter') {
      if (el.points && el.points.length > 0) {
        const pathData = el.points
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x - bounds.x} ${p.y - bounds.y}`)
          .join(' ');
        const hlOpacity = el.type === 'highlighter' ? 0.35 : opacity;
        innerElements += `<path d="${pathData}" stroke="${stroke}" stroke-width="${strokeW}" fill="none" opacity="${hlOpacity}" stroke-linecap="round" stroke-linejoin="round" />\n`;
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
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    } catch {
      // ignore cleanup errors
    }
  }, 1000);
}
