import {
  WhiteboardElement,
  WhiteboardBoard,
  LaserPoint,
  MeasureLine,
  SelectionBounds,
  ResizeHandle,
  Point,
  SmoothingMode,
} from '../types/whiteboard';
import { WhiteboardStroke } from './whiteboardStroke';

// Cache for loaded HTML images
const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(url: string, onLoaded?: () => void): HTMLImageElement | null {
  if (imageCache.has(url)) {
    const img = imageCache.get(url)!;
    if (img.complete && img.naturalWidth > 0) return img;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    if (onLoaded) onLoaded();
  };
  img.src = url;
  imageCache.set(url, img);
  return img.complete ? img : null;
}

/**
 * Determines whether a color is considered dark
 */
export function isDarkColor(hexOrRgb: string): boolean {
  if (!hexOrRgb || hexOrRgb === 'transparent') return false;
  let r = 0, g = 0, b = 0;
  if (hexOrRgb.startsWith('#')) {
    const hex = hexOrRgb.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length >= 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  } else if (hexOrRgb.startsWith('rgb')) {
    const match = hexOrRgb.match(/\d+/g);
    if (match && match.length >= 3) {
      r = parseInt(match[0], 10);
      g = parseInt(match[1], 10);
      b = parseInt(match[2], 10);
    }
  }
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

/**
 * Main Whiteboard Canvas Renderer
 */
export class WhiteboardRenderer {
  /**
   * Renders the complete whiteboard scene onto the canvas context
   */
  static render(
    ctx: CanvasRenderingContext2D,
    board: WhiteboardBoard,
    width: number,
    height: number,
    selectedElements: WhiteboardElement[],
    activeDrawingElement: WhiteboardElement | null,
    laserPoints: LaserPoint[],
    measureLine: MeasureLine | null,
    marqueeBox: { start: Point; current: Point } | null,
    showGrid = true,
    renderTrigger?: () => void,
    smoothingMode: SmoothingMode = 'smooth',
    lassoPoints: Point[] | null = null
  ) {
    const { viewport, backgroundColor, gridType } = board;
    const isDark = isDarkColor(backgroundColor);

    ctx.save();
    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Apply viewport transformation (Pan & Zoom)
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Render Grid
    if (showGrid && gridType !== 'none') {
      this.renderGrid(ctx, board, width, height, isDark);
    }

    // Sort elements by zIndex
    const allElements = [...board.elements];
    if (activeDrawingElement) {
      allElements.push(activeDrawingElement);
    }
    allElements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // Render Frames first (background layer)
    const frames = allElements.filter((el) => el.type === 'frame');
    for (const frame of frames) {
      this.renderElement(ctx, frame, isDark, renderTrigger, smoothingMode);
    }

    // Render other elements
    const nonFrames = allElements.filter((el) => el.type !== 'frame');
    for (const el of nonFrames) {
      this.renderElement(ctx, el, isDark, renderTrigger, smoothingMode);
    }

    // Render Connectors dynamic attachments
    this.renderConnectors(ctx, allElements);

    // Render Laser Pointer trails (transient)
    if (laserPoints.length > 0) {
      this.renderLaser(ctx, laserPoints);
    }

    // Render Measurement Line (transient)
    if (measureLine) {
      this.renderMeasureLine(ctx, measureLine, isDark);
    }

    // Render Selection Bounds & Handles
    if (selectedElements.length > 0 && !activeDrawingElement) {
      this.renderSelection(ctx, selectedElements, viewport.zoom);
    }

    // Render Drag Selection Marquee
    if (marqueeBox) {
      this.renderMarquee(ctx, marqueeBox);
    }

    // Render Freehand Lasso Trail
    if (lassoPoints && lassoPoints.length > 1) {
      this.renderLasso(ctx, lassoPoints);
    }

    ctx.restore();
  }

  /**
   * Renders the grid background (dot, square, ruled)
   */
  private static renderGrid(
    ctx: CanvasRenderingContext2D,
    board: WhiteboardBoard,
    viewportW: number,
    viewportH: number,
    isDark: boolean
  ) {
    const { viewport, gridType } = board;
    const step = 28; // Grid distance in canvas coords

    // Visible canvas boundary in world coords
    const startX = Math.floor(-viewport.x / viewport.zoom / step) * step - step;
    const endX = Math.ceil((viewportW - viewport.x) / viewport.zoom / step) * step + step;
    const startY = Math.floor(-viewport.y / viewport.zoom / step) * step - step;
    const endY = Math.ceil((viewportH - viewport.y) / viewport.zoom / step) * step + step;

    ctx.save();

    if (gridType === 'dot') {
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.15)';
      const dotRadius = Math.max(1, 1.2 / viewport.zoom);
      for (let x = startX; x <= endX; x += step) {
        for (let y = startY; y <= endY; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (gridType === 'square') {
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1 / viewport.zoom;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += step) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += step) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    } else if (gridType === 'ruled') {
      ctx.strokeStyle = isDark ? 'rgba(99, 102, 241, 0.16)' : 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 1 / viewport.zoom;
      ctx.beginPath();
      for (let y = startY; y <= endY; y += step * 1.2) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Renders an individual element
   */
  static renderElement(
    ctx: CanvasRenderingContext2D,
    el: WhiteboardElement,
    isDark = true,
    renderTrigger?: () => void,
    smoothingMode: SmoothingMode = 'smooth'
  ) {
    ctx.save();
    ctx.globalAlpha = el.opacity ?? 1;

    // Apply rotation around element center if specified
    if (el.rotation && el.type !== 'pencil' && el.type !== 'pen' && el.type !== 'highlighter') {
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    // Set line dash style
    if (el.strokeStyle === 'dashed') {
      ctx.setLineDash([8, 6]);
    } else if (el.strokeStyle === 'dotted') {
      ctx.setLineDash([3, 5]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.strokeStyle = el.strokeColor || '#ffffff';
    ctx.fillStyle = el.fillColor || 'transparent';
    ctx.lineWidth = el.strokeWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (el.type) {
      case 'pencil':
      case 'pen':
      case 'highlighter':
        this.renderFreehand(ctx, el, smoothingMode);
        break;
      case 'line':
        this.renderLine(ctx, el);
        break;
      case 'arrow':
        this.renderArrow(ctx, el, false);
        break;
      case 'double_arrow':
        this.renderArrow(ctx, el, true);
        break;
      case 'rectangle':
        this.renderRectangle(ctx, el);
        break;
      case 'rounded_rectangle':
        this.renderRoundedRectangle(ctx, el);
        break;
      case 'circle':
        this.renderCircle(ctx, el);
        break;
      case 'diamond':
        this.renderDiamond(ctx, el);
        break;
      case 'triangle':
        this.renderTriangle(ctx, el);
        break;
      case 'polygon':
        this.renderPolygon(ctx, el, 6);
        break;
      case 'star':
        this.renderStar(ctx, el);
        break;
      case 'text':
        this.renderText(ctx, el, isDark);
        break;
      case 'sticky':
        this.renderStickyNote(ctx, el);
        break;
      case 'image':
        this.renderImage(ctx, el, renderTrigger);
        break;
      case 'frame':
        this.renderFrame(ctx, el, isDark);
        break;
    }

    ctx.restore();
  }

  /**
   * Freehand / Pen / Highlighter renderer with smooth curves
   */
  private static renderFreehand(
    ctx: CanvasRenderingContext2D,
    el: WhiteboardElement,
    smoothingMode: SmoothingMode = 'smooth'
  ) {
    WhiteboardStroke.renderStroke(ctx, el, el.smoothingMode || smoothingMode);
  }

  private static renderLine(ctx: CanvasRenderingContext2D, el: WhiteboardElement) {
    ctx.beginPath();
    ctx.moveTo(el.x, el.y);
    ctx.lineTo(el.x + el.width, el.y + el.height);
    ctx.stroke();
  }

  private static renderArrow(ctx: CanvasRenderingContext2D, el: WhiteboardElement, isDouble: boolean) {
    const x1 = el.x;
    const y1 = el.y;
    const x2 = el.x + el.width;
    const y2 = el.y + el.height;
    const headLen = Math.max(12, el.strokeWidth * 3.5);
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Draw main line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw end arrow head
    ctx.fillStyle = el.strokeColor;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLen * Math.cos(angle - Math.PI / 7),
      y2 - headLen * Math.sin(angle - Math.PI / 7)
    );
    ctx.lineTo(
      x2 - headLen * Math.cos(angle + Math.PI / 7),
      y2 - headLen * Math.sin(angle + Math.PI / 7)
    );
    ctx.closePath();
    ctx.fill();

    // Double arrow: start head
    if (isDouble) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(
        x1 + headLen * Math.cos(angle - Math.PI / 7),
        y1 + headLen * Math.sin(angle - Math.PI / 7)
      );
      ctx.lineTo(
        x1 + headLen * Math.cos(angle + Math.PI / 7),
        y1 + headLen * Math.sin(angle + Math.PI / 7)
      );
      ctx.closePath();
      ctx.fill();
    }
  }

  private static renderRectangle(ctx: CanvasRenderingContext2D, el: WhiteboardElement) {
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fillRect(el.x, el.y, el.width, el.height);
    }
    if (el.strokeWidth > 0) {
      ctx.strokeRect(el.x, el.y, el.width, el.height);
    }
  }

  private static renderRoundedRectangle(ctx: CanvasRenderingContext2D, el: WhiteboardElement) {
    const radius = Math.min(Math.abs(el.width) * 0.15, Math.abs(el.height) * 0.15, 20);
    ctx.beginPath();
    ctx.roundRect(el.x, el.y, el.width, el.height, radius);
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fill();
    }
    if (el.strokeWidth > 0) {
      ctx.stroke();
    }
  }

  private static renderCircle(ctx: CanvasRenderingContext2D, el: WhiteboardElement) {
    const rx = Math.abs(el.width / 2);
    const ry = Math.abs(el.height / 2);
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;

    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fill();
    }
    if (el.strokeWidth > 0) {
      ctx.stroke();
    }
  }

  private static renderDiamond(ctx: CanvasRenderingContext2D, el: WhiteboardElement) {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;

    ctx.beginPath();
    ctx.moveTo(cx, el.y);
    ctx.lineTo(el.x + el.width, cy);
    ctx.lineTo(cx, el.y + el.height);
    ctx.lineTo(el.x, cy);
    ctx.closePath();

    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fill();
    }
    if (el.strokeWidth > 0) {
      ctx.stroke();
    }
  }

  private static renderTriangle(ctx: CanvasRenderingContext2D, el: WhiteboardElement) {
    ctx.beginPath();
    ctx.moveTo(el.x + el.width / 2, el.y);
    ctx.lineTo(el.x + el.width, el.y + el.height);
    ctx.lineTo(el.x, el.y + el.height);
    ctx.closePath();

    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fill();
    }
    if (el.strokeWidth > 0) {
      ctx.stroke();
    }
  }

  private static renderPolygon(ctx: CanvasRenderingContext2D, el: WhiteboardElement, sides = 6) {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const rx = Math.abs(el.width / 2);
    const ry = Math.abs(el.height / 2);

    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const px = cx + rx * Math.cos(a);
      const py = cy + ry * Math.sin(a);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fill();
    }
    if (el.strokeWidth > 0) {
      ctx.stroke();
    }
  }

  private static renderStar(ctx: CanvasRenderingContext2D, el: WhiteboardElement) {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const spikes = 5;
    const outerRadius = Math.min(Math.abs(el.width), Math.abs(el.height)) / 2;
    const innerRadius = outerRadius * 0.45;

    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const px = cx + radius * Math.cos(angle);
      const py = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fill();
    }
    if (el.strokeWidth > 0) {
      ctx.stroke();
    }
  }

  private static renderText(
    ctx: CanvasRenderingContext2D,
    el: WhiteboardElement,
    _isDark = true
  ) {
    const fontSize = el.fontSize || 20;
    const fontFamily = el.fontFamily || 'Plus Jakarta Sans, sans-serif';
    const fontStyle = `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;

    ctx.font = fontStyle;
    ctx.fillStyle = el.strokeColor || '#ffffff';
    ctx.textBaseline = 'top';

    // Text background pill if specified
    if (el.textBackground && el.textBackground !== 'transparent') {
      ctx.save();
      ctx.fillStyle = el.textBackground;
      ctx.beginPath();
      ctx.roundRect(el.x - 6, el.y - 4, el.width + 12, el.height + 8, 6);
      ctx.fill();
      ctx.restore();
    }

    const lines = (el.text || 'Text').split('\n');
    const lineHeight = fontSize * 1.35;

    lines.forEach((line, index) => {
      const lineY = el.y + index * lineHeight;
      let lineX = el.x;
      if (el.textAlign === 'center') {
        const textW = ctx.measureText(line).width;
        lineX = el.x + (el.width - textW) / 2;
      } else if (el.textAlign === 'right') {
        const textW = ctx.measureText(line).width;
        lineX = el.x + el.width - textW;
      }
      ctx.fillText(line, lineX, lineY);

      if (el.underline) {
        const textW = ctx.measureText(line).width;
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = el.strokeColor;
        ctx.lineWidth = Math.max(1, fontSize / 16);
        ctx.moveTo(lineX, lineY + fontSize + 2);
        ctx.lineTo(lineX + textW, lineY + fontSize + 2);
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  private static renderStickyNote(ctx: CanvasRenderingContext2D, el: WhiteboardElement) {
    const bg = el.stickyColor || '#fef08a'; // default warm yellow sticky
    const foldSize = 20;

    ctx.save();
    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;

    // Sticky Body with folded top-right corner
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(el.x, el.y);
    ctx.lineTo(el.x + el.width - foldSize, el.y);
    ctx.lineTo(el.x + el.width, el.y + foldSize);
    ctx.lineTo(el.x + el.width, el.y + el.height);
    ctx.lineTo(el.x, el.y + el.height);
    ctx.closePath();
    ctx.fill();

    // Folded corner flap
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.moveTo(el.x + el.width - foldSize, el.y);
    ctx.lineTo(el.x + el.width - foldSize, el.y + foldSize);
    ctx.lineTo(el.x + el.width, el.y + foldSize);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Note Text
    ctx.font = '16px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.textBaseline = 'top';

    const padding = 14;
    const maxWidth = el.width - padding * 2;
    const lines = (el.text || 'Sticky Note').split('\n');
    let currY = el.y + padding;

    for (const rawLine of lines) {
      // Auto-wrap words
      const words = rawLine.split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, el.x + padding, currY);
          line = words[n] + ' ';
          currY += 20;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, el.x + padding, currY);
      currY += 22;
    }

    ctx.restore();
  }

  private static renderImage(
    ctx: CanvasRenderingContext2D,
    el: WhiteboardElement,
    renderTrigger?: () => void
  ) {
    if (!el.imageUrl) return;

    const img = getCachedImage(el.imageUrl, renderTrigger);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, el.x, el.y, el.width, el.height);

      // Subtle border if configured
      if (el.strokeWidth && el.strokeWidth > 0) {
        ctx.strokeStyle = el.strokeColor || '#6366f1';
        ctx.lineWidth = el.strokeWidth;
        ctx.strokeRect(el.x, el.y, el.width, el.height);
      }
      ctx.restore();
    } else {
      // Placeholder while loading
      ctx.save();
      ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(el.x, el.y, el.width, el.height);
      ctx.fillRect(el.x, el.y, el.width, el.height);
      ctx.fillStyle = '#6366f1';
      ctx.font = '14px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Loading Image...', el.x + el.width / 2, el.y + el.height / 2);
      ctx.restore();
    }
  }

  private static renderFrame(
    ctx: CanvasRenderingContext2D,
    el: WhiteboardElement,
    isDark: boolean
  ) {
    ctx.save();
    // Frame background (subtle transparency)
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
    ctx.fillRect(el.x, el.y, el.width, el.height);

    // Frame border
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(el.x, el.y, el.width, el.height);

    // Frame title tab atop
    const title = el.frameTitle || 'Frame';
    ctx.font = 'bold 13px Plus Jakarta Sans, sans-serif';
    const textW = ctx.measureText(title).width;
    const tabW = Math.max(textW + 20, 80);
    const tabH = 26;

    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.roundRect(el.x, el.y - tabH, tabW, tabH, [6, 6, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(title, el.x + 10, el.y - tabH / 2);

    ctx.restore();
  }

  /**
   * Connectors that dynamically connect shapes
   */
  private static renderConnectors(
    ctx: CanvasRenderingContext2D,
    elements: WhiteboardElement[]
  ) {
    const connectors = elements.filter((el) => el.type === 'connector');
    if (connectors.length === 0) return;

    for (const conn of connectors) {
      let x1 = conn.connectorStart?.x ?? conn.x;
      let y1 = conn.connectorStart?.y ?? conn.y;
      let x2 = conn.connectorEnd?.x ?? conn.x + conn.width;
      let y2 = conn.connectorEnd?.y ?? conn.y + conn.height;

      // If connected to target elements, calculate exact anchor edge points
      if (conn.connectorStart?.elementId) {
        const startEl = elements.find((e) => e.id === conn.connectorStart?.elementId);
        if (startEl) {
          const pt = this.getAnchorCoordinate(startEl, conn.connectorStart.anchor || 'center');
          x1 = pt.x;
          y1 = pt.y;
        }
      }
      if (conn.connectorEnd?.elementId) {
        const endEl = elements.find((e) => e.id === conn.connectorEnd?.elementId);
        if (endEl) {
          const pt = this.getAnchorCoordinate(endEl, conn.connectorEnd.anchor || 'center');
          x2 = pt.x;
          y2 = pt.y;
        }
      }

      ctx.save();
      ctx.strokeStyle = conn.strokeColor || '#6366f1';
      ctx.fillStyle = conn.strokeColor || '#6366f1';
      ctx.lineWidth = conn.strokeWidth || 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const type = conn.connectorType || 'elbow';

      ctx.beginPath();
      if (type === 'straight') {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      } else if (type === 'elbow') {
        const midX = (x1 + x2) / 2;
        ctx.moveTo(x1, y1);
        ctx.lineTo(midX, y1);
        ctx.lineTo(midX, y2);
        ctx.lineTo(x2, y2);
      } else if (type === 'curved') {
        const dx = (x2 - x1) / 2;
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1 + dx, y1, x2 - dx, y2, x2, y2);
      }
      ctx.stroke();

      // Terminal arrowhead
      const headLen = Math.max(10, (conn.strokeWidth || 2) * 3);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - headLen * Math.cos(angle - Math.PI / 7),
        y2 - headLen * Math.sin(angle - Math.PI / 7)
      );
      ctx.lineTo(
        x2 - headLen * Math.cos(angle + Math.PI / 7),
        y2 - headLen * Math.sin(angle + Math.PI / 7)
      );
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  private static getAnchorCoordinate(el: WhiteboardElement, anchor: string): Point {
    switch (anchor) {
      case 'top':
        return { x: el.x + el.width / 2, y: el.y };
      case 'right':
        return { x: el.x + el.width, y: el.y + el.height / 2 };
      case 'bottom':
        return { x: el.x + el.width / 2, y: el.y + el.height };
      case 'left':
        return { x: el.x, y: el.y + el.height / 2 };
      default:
        return { x: el.x + el.width / 2, y: el.y + el.height / 2 };
    }
  }

  /**
   * Laser pointer trail renderer (disappears gracefully after ~1.2s)
   */
  static renderLaser(ctx: CanvasRenderingContext2D, points: LaserPoint[]) {
    const now = Date.now();
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const age = now - p.timestamp;
      if (age > 1200) continue;

      const alpha = Math.max(0, 1 - age / 1200);
      const size = Math.max(4, 14 * alpha);

      // Glowing halo
      ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.35})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Sharp core
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Measurement ruler overlay renderer
   */
  static renderMeasureLine(
    ctx: CanvasRenderingContext2D,
    line: MeasureLine,
    isDark: boolean
  ) {
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    const distancePx = Math.round(Math.sqrt(dx * dx + dy * dy));
    const distanceCm = (distancePx / 37.795).toFixed(1); // Standard 96 DPI estimate

    ctx.save();
    ctx.strokeStyle = '#ec4899'; // vivid pink
    ctx.fillStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    // Measure line
    ctx.beginPath();
    ctx.moveTo(line.start.x, line.start.y);
    ctx.lineTo(line.end.x, line.end.y);
    ctx.stroke();

    // Start & End markers
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(line.start.x, line.start.y, 4, 0, Math.PI * 2);
    ctx.arc(line.end.x, line.end.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Measurement badge in middle
    const midX = (line.start.x + line.end.x) / 2;
    const midY = (line.start.y + line.end.y) / 2;
    const label = `${distancePx} px (${distanceCm} cm)`;

    ctx.font = 'bold 12px JetBrains Mono, monospace';
    const textW = ctx.measureText(label).width;
    ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(midX - textW / 2 - 8, midY - 14, textW + 16, 24, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? '#f472b6' : '#db2777';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, midX, midY - 2);

    ctx.restore();
  }

  private static measureCanvas: HTMLCanvasElement | null = null;

  /**
   * Accurately measures multiline text dimensions
   */
  static measureTextDimensions(
    text: string,
    fontSize: number,
    fontFamily: string,
    bold = false,
    italic = false
  ): { width: number; height: number } {
    if (!this.measureCanvas && typeof document !== 'undefined') {
      this.measureCanvas = document.createElement('canvas');
    }
    const ctx = this.measureCanvas?.getContext('2d');
    if (!ctx) {
      const charWidth = fontSize * 0.6;
      const lines = (text || '').split('\n');
      const maxLen = Math.max(...lines.map((l) => l.length), 1);
      return {
        width: Math.max(maxLen * charWidth, 24),
        height: Math.max(lines.length * (fontSize * 1.35), fontSize),
      };
    }

    ctx.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
    const lines = (text || '').split('\n');
    let maxW = 0;
    for (const l of lines) {
      const w = ctx.measureText(l).width;
      if (w > maxW) maxW = w;
    }
    const lineHeight = fontSize * 1.35;
    return {
      width: Math.max(Math.ceil(maxW), 24),
      height: Math.max(Math.ceil(lines.length * lineHeight), fontSize),
    };
  }

  /**
   * Computes precise tight bounding box for an individual element based on its actual geometry
   */
  static getElementBounds(el: WhiteboardElement): SelectionBounds {
    if (el.type === 'pencil' || el.type === 'pen' || el.type === 'highlighter') {
      return WhiteboardStroke.getStrokeBounds(el);
    }

    if (el.type === 'text') {
      const dims = this.measureTextDimensions(
        el.text || 'Text',
        el.fontSize || 18,
        el.fontFamily || 'Plus Jakarta Sans, sans-serif',
        el.bold,
        el.italic
      );
      return {
        x: el.x - 3,
        y: el.y - 2,
        width: Math.max(dims.width + 6, 20),
        height: Math.max(dims.height + 4, 16),
      };
    }

    if (['line', 'arrow', 'double_arrow'].includes(el.type)) {
      const x1 = el.x;
      const y1 = el.y;
      const x2 = el.x + el.width;
      const y2 = el.y + el.height;
      const pad = (el.strokeWidth || 2) / 2 + 3;
      return {
        x: Math.min(x1, x2) - pad,
        y: Math.min(y1, y2) - pad,
        width: Math.max(Math.abs(x2 - x1) + pad * 2, 8),
        height: Math.max(Math.abs(y2 - y1) + pad * 2, 8),
      };
    }

    const x = Math.min(el.x, el.x + el.width);
    const y = Math.min(el.y, el.y + el.height);
    return {
      x: x - 1,
      y: y - 1,
      width: Math.max(Math.abs(el.width) + 2, 8),
      height: Math.max(Math.abs(el.height) + 2, 8),
    };
  }

  /**
   * Selection Box and Handles renderer
   */
  private static renderSelection(
    ctx: CanvasRenderingContext2D,
    elements: WhiteboardElement[],
    zoom: number
  ) {
    if (!elements || elements.length === 0) return;

    // Single element with rotation: render rotated oriented bounding box
    const isSingleRotated = elements.length === 1 && !!elements[0].rotation && elements[0].rotation !== 0;

    const bounds = this.getSelectionBounds(elements);
    if (!bounds) return;

    ctx.save();

    if (isSingleRotated) {
      const el = elements[0];
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((el.rotation! * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5 / zoom;
    ctx.setLineDash([4 / zoom, 3 / zoom]);
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    // If single locked element, show lock badge
    if (elements.length === 1 && elements[0].locked) {
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.font = `${12 / zoom}px Plus Jakarta Sans, sans-serif`;
      ctx.fillText('🔒 Locked', bounds.x, bounds.y - 8 / zoom);
      ctx.restore();
      return;
    }

    // Handles
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5 / zoom;
    const handleSize = 8 / zoom;

    const handles: Point[] = [
      { x: bounds.x, y: bounds.y }, // tl
      { x: bounds.x + bounds.width / 2, y: bounds.y }, // t
      { x: bounds.x + bounds.width, y: bounds.y }, // tr
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }, // r
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // br
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }, // b
      { x: bounds.x, y: bounds.y + bounds.height }, // bl
      { x: bounds.x, y: bounds.y + bounds.height / 2 }, // l
    ];

    for (const h of handles) {
      ctx.beginPath();
      ctx.rect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
      ctx.fill();
      ctx.stroke();
    }

    // Rotation Handle atop
    const rotY = bounds.y - 20 / zoom;
    ctx.beginPath();
    ctx.moveTo(bounds.x + bounds.width / 2, bounds.y);
    ctx.lineTo(bounds.x + bounds.width / 2, rotY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(bounds.x + bounds.width / 2, rotY, handleSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dimensions badge
    const dims = `${Math.round(bounds.width)} × ${Math.round(bounds.height)}`;
    ctx.font = `${11 / zoom}px JetBrains Mono, monospace`;
    const dimW = ctx.measureText(dims).width;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(
      bounds.x + (bounds.width - dimW) / 2 - 6 / zoom,
      bounds.y + bounds.height + 8 / zoom,
      dimW + 12 / zoom,
      18 / zoom,
      4 / zoom
    );
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dims, bounds.x + bounds.width / 2, bounds.y + bounds.height + 17 / zoom);

    ctx.restore();
  }

  /**
   * Marquee drag selection renderer
   */
  static renderMarquee(
    ctx: CanvasRenderingContext2D,
    box: { start: Point; current: Point }
  ) {
    const x = Math.min(box.start.x, box.current.x);
    const y = Math.min(box.start.y, box.current.y);
    const w = Math.abs(box.start.x - box.current.x);
    const h = Math.abs(box.start.y - box.current.y);

    ctx.save();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  /**
   * Freehand lasso selection trail renderer
   */
  static renderLasso(ctx: CanvasRenderingContext2D, points: Point[]) {
    if (!points || points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.14)';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Ray-casting point-in-polygon algorithm for lasso selection
   */
  static isPointInPolygon(point: Point, polygon: Point[]): boolean {
    if (polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Calculates bounding box enclosing elements (using actual content geometry)
   */
  static getSelectionBounds(elements: WhiteboardElement[]): SelectionBounds | null {
    if (!elements || elements.length === 0) return null;
    if (elements.length === 1) {
      return this.getElementBounds(elements[0]);
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const el of elements) {
      const b = this.getElementBounds(el);
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }

    if (minX === Infinity) return null;

    return {
      x: minX,
      y: minY,
      width: Math.max(maxX - minX, 10),
      height: Math.max(maxY - minY, 10),
    };
  }

  /**
   * Determines which resize handle (if any) was hit by a point
   */
  static getHandleAtPoint(
    bounds: SelectionBounds,
    point: Point,
    zoom: number,
    singleElementRotation = 0
  ): ResizeHandle | null {
    const handleThreshold = 14 / zoom;
    let pt = point;

    // If single element is rotated, test against inverse-rotated point
    if (singleElementRotation !== 0) {
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      const rad = (-singleElementRotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = point.x - cx;
      const dy = point.y - cy;
      pt = {
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos,
      };
    }

    // Rotation handle
    const rot = { x: bounds.x + bounds.width / 2, y: bounds.y - 20 / zoom };
    if (Math.hypot(pt.x - rot.x, pt.y - rot.y) <= handleThreshold) return 'rot';

    // 8 resize handles
    const handles: { handle: ResizeHandle; x: number; y: number }[] = [
      { handle: 'tl', x: bounds.x, y: bounds.y },
      { handle: 't', x: bounds.x + bounds.width / 2, y: bounds.y },
      { handle: 'tr', x: bounds.x + bounds.width, y: bounds.y },
      { handle: 'r', x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
      { handle: 'br', x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { handle: 'b', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
      { handle: 'bl', x: bounds.x, y: bounds.y + bounds.height },
      { handle: 'l', x: bounds.x, y: bounds.y + bounds.height / 2 },
    ];

    for (const h of handles) {
      if (Math.hypot(pt.x - h.x, pt.y - h.y) <= handleThreshold) {
        return h.handle;
      }
    }

    return null;
  }

  /**
   * Determines if a point collides with an element (used for selection and eraser)
   */
  static isPointInElement(point: Point, el: WhiteboardElement): boolean {
    const padding = Math.max(12, (el.strokeWidth || 2) * 2);

    if (el.type === 'pencil' || el.type === 'pen' || el.type === 'highlighter') {
      if (!el.points || el.points.length === 0) return false;
      const strokeRadius = Math.max(22, (el.strokeWidth || 3) * 3);

      if (el.points.length === 1) {
        return Math.hypot(el.points[0].x - point.x, el.points[0].y - point.y) <= strokeRadius;
      }

      // Check distance to every segment of the stroke for 100% reliable eraser crossing
      for (let i = 0; i < el.points.length - 1; i++) {
        const p1 = el.points[i];
        const p2 = el.points[i + 1];
        const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
        if (l2 === 0) {
          if (Math.hypot(point.x - p1.x, point.y - p1.y) <= strokeRadius) return true;
          continue;
        }
        const t = Math.max(0, Math.min(1, ((point.x - p1.x) * (p2.x - p1.x) + (point.y - p1.y) * (p2.y - p1.y)) / l2));
        const projX = p1.x + t * (p2.x - p1.x);
        const projY = p1.y + t * (p2.y - p1.y);
        if (Math.hypot(point.x - projX, point.y - projY) <= strokeRadius) {
          return true;
        }
      }
      return false;
    }

    let pt = point;
    if (el.rotation && el.rotation !== 0) {
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const rad = (-el.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = point.x - cx;
      const dy = point.y - cy;
      pt = {
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos,
      };
    }

    // Precise segment distance for lines & arrows
    if (['line', 'arrow', 'double_arrow'].includes(el.type)) {
      const x1 = el.x;
      const y1 = el.y;
      const x2 = el.x + el.width;
      const y2 = el.y + el.height;
      const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
      if (l2 === 0) return Math.hypot(pt.x - x1, pt.y - y1) <= padding;
      const t = Math.max(0, Math.min(1, ((pt.x - x1) * (x2 - x1) + (pt.y - y1) * (y2 - y1)) / l2));
      const projX = x1 + t * (x2 - x1);
      const projY = y1 + t * (y2 - y1);
      return Math.hypot(pt.x - projX, pt.y - projY) <= padding + (el.strokeWidth || 2);
    }

    const minX = Math.min(el.x, el.x + el.width) - padding;
    const maxX = Math.max(el.x, el.x + el.width) + padding;
    const minY = Math.min(el.y, el.y + el.height) - padding;
    const maxY = Math.max(el.y, el.y + el.height) + padding;

    return pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY;
  }

  /**
   * Determines if an element can be erased by the normal Ink Eraser.
   * Only freehand ink annotations (pencil, pen, highlighter) that are unlocked
   * are erasable. Images, shapes, text, sticky notes, connectors, and frames
   * are strictly protected and NEVER deleted by the ink eraser.
   */
  static isErasableElement(el: WhiteboardElement): boolean {
    if (!el || el.locked) return false;
    return el.type === 'pencil' || el.type === 'pen' || el.type === 'highlighter';
  }
}
