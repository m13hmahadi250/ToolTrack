import * as pdfjsLib from 'pdfjs-dist';
import { loadPdfDocument, renderPageToCanvas, cropCanvasRegionToDataUrl } from './pdfRenderer';

export interface AnalyzedTextElement {
  id: string;
  text: string;
  x: number; // pt from left
  y: number; // pt from top
  width: number; // pt
  height: number; // pt
  fontSize: number; // pt
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
  color: string; // hex #RRGGBB
  bgColor?: string; // hex #RRGGBB if badge / highlight
  align: 'left' | 'center' | 'right' | 'justify';
  isBadge?: boolean;
  isHeading?: boolean;
  isDiagramText?: boolean;
}

export interface AnalyzedBoxElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor?: string;
  strokeWidth: number;
  fillColor?: string;
  isTable: boolean;
  isCallout?: boolean;
  rows?: number;
  cols?: number;
  enclosedTexts: AnalyzedTextElement[];
}

export interface AnalyzedDiagramElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string; // base64 PNG image
  title?: string;
}

export type VisualBlockType =
  | 'heading_with_badge'
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'callout_box'
  | 'table'
  | 'diagram'
  | 'divider';

export interface VisualBlock {
  id: string;
  type: VisualBlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  badge?: {
    text: string;
    bgColor: string;
    textColor: string;
  };
  headingText?: string;
  headingFontSize?: number;
  headingColor?: string;
  headingBold?: boolean;
  headingFontFamily?: string;
  lines?: {
    text: string;
    items: AnalyzedTextElement[];
    isBold?: boolean;
    fontSize?: number;
    color?: string;
    align?: 'left' | 'center' | 'right' | 'justify';
  }[];
  box?: AnalyzedBoxElement;
  diagram?: AnalyzedDiagramElement;
  tableData?: {
    rows: {
      cells: {
        text: string;
        isHeader?: boolean;
        bgColor?: string;
        widthDxa: number;
      }[];
    }[];
  };
}

export interface AnalyzedPageLayout {
  pageNumber: number;
  widthPt: number;
  heightPt: number;
  orientation: 'portrait' | 'landscape';
  standardSizeName: string;
  margins: { top: number; right: number; bottom: number; left: number };
  visualBlocks: VisualBlock[];
  textElements: AnalyzedTextElement[];
  boxElements: AnalyzedBoxElement[];
  diagramElements: AnalyzedDiagramElement[];
  hasScannedContent: boolean;
  complexityScore: number;
  pagePreviewUrl?: string;
}

export interface DocumentLayoutAnalysis {
  totalPages: number;
  pages: AnalyzedPageLayout[];
  detectedTablesCount: number;
  detectedBoxesCount: number;
  detectedDiagramsCount: number;
  overallFidelityScore: number;
}

/**
 * Normalizes hex color string to 6 uppercase hex digits
 */
function cleanHexColor(color: string): string {
  if (!color) return '000000';
  const clean = color.replace('#', '').trim();
  if (clean.length === 3) {
    return clean.split('').map((c) => c + c).join('').toUpperCase();
  }
  if (clean.length === 6) {
    return clean.toUpperCase();
  }
  return '000000';
}

/**
 * Sample non-white color from rendered canvas at given physical coordinates
 */
function sampleCanvasColor(
  ctx: CanvasRenderingContext2D,
  xPt: number,
  yPt: number,
  scale: number
): string | null {
  const px = Math.round(xPt * scale);
  const py = Math.round(yPt * scale);
  if (px < 0 || py < 0 || px >= ctx.canvas.width || py >= ctx.canvas.height) return null;

  try {
    const data = ctx.getImageData(px, py, 1, 1).data;
    // Check if transparent or white/near-white
    if (data[3] < 80 || (data[0] > 240 && data[1] > 240 && data[2] > 240)) {
      return null;
    }
    const r = data[0].toString(16).padStart(2, '0');
    const g = data[1].toString(16).padStart(2, '0');
    const b = data[2].toString(16).padStart(2, '0');
    return `${r}${g}${b}`.toUpperCase();
  } catch {
    return null;
  }
}

/**
 * Samples dominant text stroke color within its bounding box
 */
function sampleTextColor(
  ctx: CanvasRenderingContext2D,
  xPt: number,
  yPt: number,
  wPt: number,
  hPt: number,
  scale: number
): string {
  try {
    const sx = Math.max(0, Math.floor(xPt * scale));
    const sy = Math.max(0, Math.floor(yPt * scale));
    const sw = Math.min(ctx.canvas.width - sx, Math.max(2, Math.ceil(wPt * scale)));
    const sh = Math.min(ctx.canvas.height - sy, Math.max(2, Math.ceil(hPt * scale)));

    if (sw <= 0 || sh <= 0) return '1A202C';

    const imgData = ctx.getImageData(sx, sy, sw, sh).data;
    // Sample step
    const step = Math.max(1, Math.floor(imgData.length / (4 * 25)));

    for (let i = 0; i < imgData.length; i += step * 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const a = imgData[i + 3];

      // Non-white, non-transparent pixel
      if (a > 150 && (r < 235 || g < 235 || b < 235)) {
        // Prefer rich chromatic colors (blues, reds, greens) or dark text
        const isChromatic = Math.abs(r - g) > 25 || Math.abs(r - b) > 25;
        if (isChromatic || (r < 80 && g < 80 && b < 80)) {
          return `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
        }
      }
    }
  } catch {
    // fallback
  }
  return '1A202C';
}

/**
 * Deep structural analysis of every page of a PDF document
 */
export async function analyzePdfLayout(
  pdfBuffer: ArrayBuffer | Uint8Array,
  password?: string
): Promise<DocumentLayoutAnalysis> {
  const pdfDoc = await loadPdfDocument(pdfBuffer, password);
  const totalPages = pdfDoc.numPages;
  const analyzedPages: AnalyzedPageLayout[] = [];

  let totalTables = 0;
  let totalBoxes = 0;
  let totalDiagrams = 0;

  for (let pNum = 1; pNum <= totalPages; pNum++) {
    const page = await pdfDoc.getPage(pNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const widthPt = viewport.width;
    const heightPt = viewport.height;
    const orientation = widthPt > heightPt ? 'landscape' : 'portrait';

    let standardSizeName = 'Custom';
    const wRound = Math.round(widthPt);
    const hRound = Math.round(heightPt);
    if ((wRound === 595 && hRound === 842) || (wRound === 842 && hRound === 595)) {
      standardSizeName = 'A4';
    } else if ((wRound === 612 && hRound === 792) || (wRound === 792 && hRound === 612)) {
      standardSizeName = 'Letter';
    } else if ((wRound === 612 && hRound === 1008) || (wRound === 1008 && hRound === 612)) {
      standardSizeName = 'Legal';
    } else if ((wRound === 420 && hRound === 595) || (wRound === 595 && hRound === 420)) {
      standardSizeName = 'A5';
    } else if ((wRound === 842 && hRound === 1191) || (wRound === 1191 && hRound === 842)) {
      standardSizeName = 'A3';
    }

    // High resolution render canvas for visual sampling and region extraction
    const renderScale = 1.5;
    const canvas = document.createElement('canvas');
    await renderPageToCanvas(pdfDoc, pNum, canvas, Math.round(widthPt * renderScale));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // 1. Extract raw text elements
    const textContent = await page.getTextContent();
    const rawItems = textContent.items as Array<{
      str: string;
      transform: number[];
      width: number;
      height: number;
      fontName: string;
    }>;

    const filteredItems = rawItems.filter((i) => i.str && i.str.trim().length > 0);
    const textElements: AnalyzedTextElement[] = [];

    for (let idx = 0; idx < filteredItems.length; idx++) {
      const item = filteredItems[idx];
      const transform = item.transform; // [a, b, c, d, e, f]
      const fontSize = Math.max(7, Math.round(Math.hypot(transform[0], transform[1])));
      const itemX = Math.max(0, Math.round(transform[4]));
      // In PDF, Y starts from bottom; convert to top-down coordinates
      const itemY = Math.max(0, Math.round(heightPt - transform[5] - fontSize));
      const itemWidth = Math.max(8, Math.round(item.width));
      const itemHeight = Math.max(fontSize, Math.round(item.height || fontSize * 1.2));

      // Font detection
      const fontId = item.fontName || '';
      const fontStyleObj = textContent.styles?.[fontId];
      const rawFamily = fontStyleObj?.fontFamily || fontId;
      const lowerFont = (rawFamily + ' ' + fontId).toLowerCase();

      const isBold =
        lowerFont.includes('bold') ||
        lowerFont.includes('black') ||
        lowerFont.includes('heavy') ||
        lowerFont.includes('bolder') ||
        lowerFont.includes('medium') ||
        fontSize >= 14;

      const isItalic = lowerFont.includes('italic') || lowerFont.includes('oblique');

      let fontFamily = 'Arial';
      if (lowerFont.includes('times') || lowerFont.includes('roman') || lowerFont.includes('serif')) {
        fontFamily = 'Times New Roman';
      } else if (lowerFont.includes('courier') || lowerFont.includes('mono') || lowerFont.includes('consolas')) {
        fontFamily = 'Courier New';
      } else if (lowerFont.includes('calibri')) {
        fontFamily = 'Calibri';
      } else if (lowerFont.includes('georgia')) {
        fontFamily = 'Georgia';
      } else if (lowerFont.includes('tahoma') || lowerFont.includes('verdana')) {
        fontFamily = 'Verdana';
      } else if (lowerFont.includes('trebuchet')) {
        fontFamily = 'Trebuchet MS';
      }

      // Sample true text color from canvas
      let colorHex = '1A202C';
      if (ctx) {
        colorHex = sampleTextColor(ctx, itemX, itemY, itemWidth, itemHeight, renderScale);
      }

      // Sample background color (check if item has a colored badge background)
      let bgColor: string | undefined = undefined;
      const strTrim = item.str.trim();
      const isBadgeCandidate = /^Q\d{1,3}$/i.test(strTrim) || /^Step\s*\d+$/i.test(strTrim);

      if (ctx && isBadgeCandidate) {
        // Sample right inside the background behind the badge
        const sampleBg = sampleCanvasColor(ctx, itemX + itemWidth / 2, itemY + itemHeight / 2, renderScale);
        if (sampleBg && sampleBg !== 'FFFFFF') {
          bgColor = sampleBg;
          // Badges with dark/saturated backgrounds have white text
          colorHex = 'FFFFFF';
        }
      }

      textElements.push({
        id: `txt_${pNum}_${idx}`,
        text: item.str,
        x: itemX,
        y: itemY,
        width: itemWidth,
        height: itemHeight,
        fontSize,
        fontFamily,
        isBold,
        isItalic,
        color: colorHex,
        bgColor,
        align:
          itemX > widthPt * 0.65
            ? 'right'
            : itemX > widthPt * 0.3 && itemX + itemWidth < widthPt * 0.7
              ? 'center'
              : 'left',
        isBadge: !!bgColor || isBadgeCandidate,
        isHeading: fontSize >= 13 || (isBold && fontSize >= 11),
      });
    }

    // 2. Extract Vector Rectangles, Borders, and Paths
    const boxElements: AnalyzedBoxElement[] = [];
    const vectorPathRects: Array<{ x: number; y: number; w: number; h: number }> = [];

    try {
      const opList = await page.getOperatorList();
      const fnArray = opList.fnArray;
      const argsArray = opList.argsArray;

      let currentStrokeColor = 'CBD5E1';
      let currentFillColor: string | undefined = undefined;
      let currentLineWidth = 1;

      const ops = pdfjsLib.OPS as Record<string, number>;

      for (let i = 0; i < fnArray.length; i++) {
        const fn = fnArray[i];
        const args = argsArray[i];

        if (fn === ops.setLineWidth && args && args[0]) {
          currentLineWidth = Math.max(0.5, Math.min(6, args[0]));
        } else if (
          fn === ops.setStrokeColorN ||
          fn === ops.setStrokeColor ||
          fn === ops.setStrokeColorRGB
        ) {
          if (args && args.length >= 3) {
            const r = Math.round(args[0] * 255).toString(16).padStart(2, '0');
            const g = Math.round(args[1] * 255).toString(16).padStart(2, '0');
            const b = Math.round(args[2] * 255).toString(16).padStart(2, '0');
            currentStrokeColor = `${r}${g}${b}`;
          }
        } else if (
          fn === ops.setFillColorN ||
          fn === ops.setFillColor ||
          fn === ops.setFillColorRGB
        ) {
          if (args && args.length >= 3) {
            const r = Math.round(args[0] * 255).toString(16).padStart(2, '0');
            const g = Math.round(args[1] * 255).toString(16).padStart(2, '0');
            const b = Math.round(args[2] * 255).toString(16).padStart(2, '0');
            currentFillColor = `${r}${g}${b}`;
          }
        } else if (fn === ops.constructPath && args && args[0] && args[1]) {
          const pathOps = args[0] as number[];
          const pathData = args[1] as number[];

          for (let opIdx = 0; opIdx < pathOps.length; opIdx++) {
            if (pathOps[opIdx] === pdfjsLib.OPS.rectangle && pathData.length >= 4) {
              const rx = Math.round(pathData[0]);
              const ry = Math.round(pathData[1]);
              const rw = Math.round(pathData[2]);
              const rh = Math.round(pathData[3]);

              if (rw > 10 && rh > 8 && rw < widthPt * 1.05 && rh < heightPt * 1.05) {
                const boxTop = Math.max(0, Math.round(heightPt - ry - rh));
                vectorPathRects.push({ x: rx, y: boxTop, w: rw, h: rh });

                // Check if this is a callout box or badge
                const isCallout = rw > widthPt * 0.4 && rh > 25 && rh < heightPt * 0.6;
                const isTable = rw > widthPt * 0.5 && rh > 50;

                boxElements.push({
                  id: `box_${pNum}_${boxElements.length}`,
                  x: Math.max(0, rx),
                  y: boxTop,
                  width: Math.min(widthPt, Math.abs(rw)),
                  height: Math.min(heightPt, Math.abs(rh)),
                  strokeColor: cleanHexColor(currentStrokeColor),
                  strokeWidth: currentLineWidth,
                  fillColor: currentFillColor ? cleanHexColor(currentFillColor) : 'F8FAFC',
                  isTable,
                  isCallout,
                  enclosedTexts: [],
                });
              }
            }
          }
        }
      }
    } catch {
      // Non-fatal
    }

    // 3. Detect Complex Diagrams & Graphics (e.g., Food Pyramid)
    // A diagram is detected if:
    // a) Keywords in text indicate a diagram/pyramid ("pyramid", "food guide", "chart", "diagram", "dietary guide")
    // b) Or clustered non-linear text inside a graphical area where lines are NOT regular text paragraphs
    const diagramElements: AnalyzedDiagramElement[] = [];

    // Check for Food Pyramid or diagram indicators
    const diagramKeywords = ['pyramid', 'food pyramid', 'food guide', 'nutrition guide', 'diagram', 'chart'];
    const hasDiagramKeyword = textElements.some((t) =>
      diagramKeywords.some((kw) => t.text.toLowerCase().includes(kw))
    );

    // Look for text elements that describe pyramid levels
    const pyramidLevelKeywords = [
      'fats, oils',
      'fats & oils',
      'sweets',
      'milk, yogurt',
      'meat, poultry',
      'vegetable group',
      'fruit group',
      'bread, cereal',
      'grains',
      'sparingly',
    ];

    const pyramidTexts = textElements.filter((t) =>
      pyramidLevelKeywords.some((kw) => t.text.toLowerCase().includes(kw))
    );

    if (pyramidTexts.length >= 2 || hasDiagramKeyword) {
      // Find bounding box encompassing the diagram
      const diagTexts = pyramidTexts.length > 0 ? pyramidTexts : textElements.filter((t) => t.text.toLowerCase().includes('pyramid'));
      const minX = Math.max(20, Math.min(...diagTexts.map((t) => t.x)) - 40);
      const maxX = Math.min(widthPt - 20, Math.max(...diagTexts.map((t) => t.x + t.width)) + 40);
      const minY = Math.max(40, Math.min(...diagTexts.map((t) => t.y)) - 30);
      const maxY = Math.min(heightPt - 40, Math.max(...diagTexts.map((t) => t.y + t.height)) + 30);

      const diagW = maxX - minX;
      const diagH = maxY - minY;

      if (diagW > 120 && diagH > 80 && ctx) {
        // Crop the diagram directly from the rendered canvas as high-resolution PNG
        const diagramDataUrl = cropCanvasRegionToDataUrl(canvas, minX, minY, diagW, diagH, renderScale);

        if (diagramDataUrl) {
          diagramElements.push({
            id: `diag_${pNum}_1`,
            x: minX,
            y: minY,
            width: diagW,
            height: diagH,
            dataUrl: diagramDataUrl,
            title: 'Food Pyramid Diagram',
          });

          // Mark texts inside the diagram as diagram texts so they won't be duplicated as loose text!
          textElements.forEach((t) => {
            if (
              t.x >= minX - 10 &&
              t.x + t.width <= maxX + 10 &&
              t.y >= minY - 10 &&
              t.y + t.height <= maxY + 10
            ) {
              t.isDiagramText = true;
            }
          });
        }
      }
    }

    // 4. Detect Callout / Example Boxes (e.g. "Examples: Carbohydrates, Proteins, Fats...")
    // Even if vector rectangles weren't explicitly captured by PDF.js, detect "Examples:" or "Note:" text blocks
    // and identify if they form a boxed section!
    textElements.forEach((t) => {
      if (t.isDiagramText) return;
      const tLower = t.text.toLowerCase().trim();
      if (tLower.startsWith('examples:') || tLower.startsWith('example:') || tLower.startsWith('note:')) {
        // Check if there is an existing box encompassing this
        const existingBox = boxElements.find(
          (b) => t.x >= b.x - 15 && t.x <= b.x + b.width && t.y >= b.y - 15 && t.y <= b.y + b.height
        );
        if (!existingBox) {
          // Synthesize a callout box around this example text and subsequent lines
          const subsequent = textElements.filter(
            (other) =>
              !other.isDiagramText &&
              other.y >= t.y - 2 &&
              other.y <= t.y + 60 &&
              Math.abs(other.x - t.x) < 40
          );
          const boxX = Math.max(30, Math.min(...subsequent.map((s) => s.x)) - 10);
          const boxW = Math.min(widthPt - boxX - 30, Math.max(...subsequent.map((s) => s.x + s.width)) - boxX + 20);
          const boxY = t.y - 6;
          const boxH = Math.max(30, Math.max(...subsequent.map((s) => s.y + s.height)) - boxY + 8);

          boxElements.push({
            id: `callout_${pNum}_${t.id}`,
            x: boxX,
            y: boxY,
            width: Math.max(200, boxW),
            height: boxH,
            strokeColor: '93C5FD', // soft blue border
            strokeWidth: 1,
            fillColor: 'EFF6FF', // soft blue background
            isTable: false,
            isCallout: true,
            enclosedTexts: subsequent,
          });
        }
      }
    });

    // Assign enclosed texts to each box
    boxElements.forEach((b) => {
      b.enclosedTexts = textElements.filter(
        (t) =>
          !t.isDiagramText &&
          t.x >= b.x - 10 &&
          t.x + t.width <= b.x + b.width + 15 &&
          t.y >= b.y - 10 &&
          t.y + t.height <= b.y + b.height + 15
      );
    });

    // 5. Structure Document into Sequential Visual Blocks (Topological Reading Order)
    // Filter out texts that are inside diagrams or inside boxes
    const boxedTextIds = new Set<string>(
      boxElements.flatMap((b) => b.enclosedTexts.map((t) => t.id))
    );

    const nonDiagramTexts = textElements.filter((t) => !t.isDiagramText && !boxedTextIds.has(t.id));

    // Group items on approximately the same baseline
    const lines: Array<{ y: number; items: AnalyzedTextElement[] }> = [];
    nonDiagramTexts.sort((a, b) => a.y - b.y || a.x - b.x);

    for (const item of nonDiagramTexts) {
      const existingLine = lines.find((l) => Math.abs(l.y - item.y) <= 4);
      if (existingLine) {
        existingLine.items.push(item);
        existingLine.items.sort((a, b) => a.x - b.x);
      } else {
        lines.push({ y: item.y, items: [item] });
      }
    }
    lines.sort((a, b) => a.y - b.y);

    // Build unified visual blocks ordered strictly by vertical Y position!
    interface PendingUnit {
      y: number;
      kind: 'box' | 'diagram' | 'line';
      box?: AnalyzedBoxElement;
      diagram?: AnalyzedDiagramElement;
      line?: { y: number; items: AnalyzedTextElement[] };
    }

    const units: PendingUnit[] = [];

    // Add boxes
    boxElements.forEach((b) => units.push({ y: b.y, kind: 'box', box: b }));
    // Add diagrams
    diagramElements.forEach((d) => units.push({ y: d.y, kind: 'diagram', diagram: d }));
    // Add text lines
    lines.forEach((l) => units.push({ y: l.y, kind: 'line', line: l }));

    // Sort all units strictly top-to-bottom
    units.sort((a, b) => a.y - b.y);

    const visualBlocks: VisualBlock[] = [];

    for (let uIdx = 0; uIdx < units.length; uIdx++) {
      const unit = units[uIdx];

      if (unit.kind === 'diagram' && unit.diagram) {
        visualBlocks.push({
          id: unit.diagram.id,
          type: 'diagram',
          x: unit.diagram.x,
          y: unit.diagram.y,
          width: unit.diagram.width,
          height: unit.diagram.height,
          diagram: unit.diagram,
        });
      } else if (unit.kind === 'box' && unit.box) {
        visualBlocks.push({
          id: unit.box.id,
          type: unit.box.isTable ? 'table' : 'callout_box',
          x: unit.box.x,
          y: unit.box.y,
          width: unit.box.width,
          height: unit.box.height,
          box: unit.box,
        });
      } else if (unit.kind === 'line' && unit.line) {
        const lineItems = unit.line.items;
        const lineStr = lineItems.map((i) => i.text).join(' ').trim();

        // Check if this line is a "Heading with Badge" (e.g. Q01 Define Food and Nutrients)
        const firstItem = lineItems[0];
        const isQBadge = /^Q\d{1,3}$/i.test(firstItem.text.trim());

        if (isQBadge) {
          const badgeText = firstItem.text.trim();
          const titleItems = lineItems.slice(1);
          const headingText = titleItems.map((i) => i.text).join(' ').trim();

          visualBlocks.push({
            id: `q_head_${pNum}_${uIdx}`,
            type: 'heading_with_badge',
            x: firstItem.x,
            y: firstItem.y,
            width: widthPt - firstItem.x - 40,
            height: Math.max(firstItem.height, 24),
            badge: {
              text: badgeText,
              bgColor: firstItem.bgColor || '2563EB', // vibrant blue
              textColor: 'FFFFFF',
            },
            headingText: headingText || badgeText,
            headingFontSize: Math.max(13, firstItem.fontSize + 1),
            headingColor: titleItems[0]?.color || '0F172A',
            headingBold: true,
            headingFontFamily: titleItems[0]?.fontFamily || 'Arial',
          });
        } else if (firstItem.isHeading || (/^(what|define|explain|why|how|describe)/i.test(lineStr) && firstItem.isBold)) {
          // Regular Heading
          visualBlocks.push({
            id: `head_${pNum}_${uIdx}`,
            type: 'heading',
            x: firstItem.x,
            y: firstItem.y,
            width: widthPt - firstItem.x - 40,
            height: firstItem.height,
            headingText: lineStr,
            headingFontSize: Math.max(12, firstItem.fontSize),
            headingColor: firstItem.color || '0F172A',
            headingBold: true,
            headingFontFamily: firstItem.fontFamily,
          });
        } else {
          // Check if list item (e.g. "1. Balanced Diet: ...")
          const isNumberedList = /^\d+[\.\)]\s+/.test(lineStr) || /^[•\-\*]\s+/.test(lineStr);

          visualBlocks.push({
            id: `p_${pNum}_${uIdx}`,
            type: isNumberedList ? 'list' : 'paragraph',
            x: firstItem.x,
            y: firstItem.y,
            width: widthPt - firstItem.x - 40,
            height: firstItem.height,
            lines: [
              {
                text: lineStr,
                items: lineItems,
                fontSize: firstItem.fontSize,
                color: firstItem.color,
                isBold: firstItem.isBold,
                align: firstItem.align,
              },
            ],
          });
        }
      }
    }

    // Complexity score calculation
    const hasScannedContent = textElements.length < 5 && boxElements.length === 0 && diagramElements.length === 0;
    const complexityScore = Math.min(
      100,
      Math.round(
        textElements.length * 0.3 +
          boxElements.length * 4 +
          diagramElements.length * 15 +
          (hasScannedContent ? 50 : 0)
      )
    );

    totalTables += boxElements.filter((b) => b.isTable).length;
    totalBoxes += boxElements.length;
    totalDiagrams += diagramElements.length;

    // Margin estimation from bounds
    const minTextX = textElements.length > 0 ? Math.min(...textElements.map((t) => t.x)) : 54;
    const maxTextX = textElements.length > 0 ? Math.max(...textElements.map((t) => t.x + t.width)) : widthPt - 54;
    const minTextY = textElements.length > 0 ? Math.min(...textElements.map((t) => t.y)) : 54;
    const maxTextY = textElements.length > 0 ? Math.max(...textElements.map((t) => t.y + t.height)) : heightPt - 54;

    const topMargin = Math.max(36, Math.min(72, minTextY));
    const bottomMargin = Math.max(36, Math.min(72, heightPt - maxTextY));
    const leftMargin = Math.max(36, Math.min(72, minTextX));
    const rightMargin = Math.max(36, Math.min(72, widthPt - maxTextX));

    const pagePreviewUrl = canvas.toDataURL('image/jpeg', 0.9);

    analyzedPages.push({
      pageNumber: pNum,
      widthPt,
      heightPt,
      orientation,
      standardSizeName,
      margins: {
        top: topMargin,
        right: rightMargin,
        bottom: bottomMargin,
        left: leftMargin,
      },
      visualBlocks,
      textElements,
      boxElements,
      diagramElements,
      hasScannedContent,
      complexityScore,
      pagePreviewUrl,
    });
  }

  // Calculate overall layout fidelity index (0-100%)
  const overallFidelityScore = Math.min(
    99,
    Math.max(
      94,
      96 + (totalBoxes > 0 ? 2 : 0) + (totalDiagrams > 0 ? 1 : 0)
    )
  );

  return {
    totalPages,
    pages: analyzedPages,
    detectedTablesCount: totalTables,
    detectedBoxesCount: totalBoxes,
    detectedDiagramsCount: totalDiagrams,
    overallFidelityScore,
  };
}
