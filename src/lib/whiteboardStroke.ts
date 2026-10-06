import { Point, WhiteboardElement, PenStyle, SmoothingMode } from '../types/whiteboard';

/**
 * Professional Whiteboard Stroke & Handwriting Engine
 *
 * Implements:
 * 1. High-frequency pointer sampling & noise/jitter reduction
 * 2. Laplacian & corner-preserving ink beautification
 * 3. Dynamic velocity & pressure-based thickness modulation
 * 4. Realistic pen style simulation:
 *    - Fountain Pen: expressive calligraphic variation, angle sensitivity, rich flow
 *    - Ballpoint: crisp, uniform core with subtle organic velocity modulation
 *    - Marker: bold, smooth rounded edges, consistent wet ink
 *    - Pencil: delicate graphite modulation with organic grain
 *    - Fine Pen: razor-sharp precision technical pen
 *    - Highlighter: broad translucent chisel-tip glide
 * 5. Smooth Bézier & Catmull-Rom spline curves with round caps
 * 6. Variable-width dynamic ribbon contour rendering with zero visual gaps
 * 7. Smart shape recognition (circle, rectangle, triangle, straight line, arrow)
 */

export interface RecognizedShape {
  type: 'circle' | 'rectangle' | 'triangle' | 'line' | 'arrow';
  confidence: number;
  bounds: { x: number; y: number; width: number; height: number };
  points?: Point[];
}

export class WhiteboardStroke {
  /**
   * Filters out redundant points that are too close (< minDistance px)
   * Eliminates hand trembling and mouse integer quantization steps.
   */
  static filterPoints(rawPoints: Point[], minDistance = 1.5): Point[] {
    if (rawPoints.length <= 2) return rawPoints;

    const filtered: Point[] = [rawPoints[0]];
    let lastPoint = rawPoints[0];

    for (let i = 1; i < rawPoints.length; i++) {
      const p = rawPoints[i];
      const dist = Math.hypot(p.x - lastPoint.x, p.y - lastPoint.y);
      if (dist >= minDistance || i === rawPoints.length - 1) {
        filtered.push(p);
        lastPoint = p;
      }
    }

    return filtered;
  }

  /**
   * Beautify ink / adaptive smoothing:
   * Smooths mouse jitter and micro-wobbles while strictly preserving sharp letter corners.
   */
  static beautifyPoints(points: Point[], passes = 1): Point[] {
    if (points.length <= 3) return points;

    let pts = [...points];

    for (let pass = 0; pass < passes; pass++) {
      const result: Point[] = [pts[0]];

      for (let i = 1; i < pts.length - 1; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const next = pts[i + 1];

        // Compute angle change at curr
        const v1x = curr.x - prev.x;
        const v1y = curr.y - prev.y;
        const v2x = next.x - curr.x;
        const v2y = next.y - curr.y;
        const d1 = Math.hypot(v1x, v1y);
        const d2 = Math.hypot(v2x, v2y);

        let isCorner = false;
        if (d1 > 1.5 && d2 > 1.5) {
          const cosAngle = (v1x * v2x + v1y * v2y) / (d1 * d2);
          // If direction changes sharply (e.g. sharp corner in A, M, N, Z, cursive turn), lock vertex
          if (cosAngle < 0.2) {
            isCorner = true;
          }
        }

        if (isCorner) {
          result.push(curr);
        } else {
          // Weighted moving average (Chaikin / Laplacian filter)
          result.push({
            x: 0.22 * prev.x + 0.56 * curr.x + 0.22 * next.x,
            y: 0.22 * prev.y + 0.56 * curr.y + 0.22 * next.y,
            pressure: curr.pressure,
            time: curr.time,
            width: curr.width,
          });
        }
      }

      result.push(pts[pts.length - 1]);
      pts = result;
    }

    return pts;
  }

  /**
   * Computes dynamic variable width for each point in the stroke
   * based on pen style, stroke velocity, angle, and stylus pressure.
   */
  static computeStrokeWidths(
    points: Point[],
    baseWidth: number,
    penStyle: PenStyle = 'fountain'
  ): number[] {
    const n = points.length;
    if (n === 0) return [];
    if (n === 1) return [baseWidth];

    const widths: number[] = new Array(n);
    const CALLIGRAPHIC_ANGLE = Math.PI / 4; // 45 degree fountain pen nib

    // 1. Calculate raw widths per point
    for (let i = 0; i < n; i++) {
      const p = points[i];
      const prev = points[Math.max(0, i - 1)];
      const next = points[Math.min(n - 1, i + 1)];

      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const dist = Math.hypot(dx, dy);

      // Speed in px/ms
      let speed = 0.5;
      if (p.time && prev.time && p.time > prev.time) {
        const dt = Math.max(1, p.time - prev.time);
        const segmentDist = Math.hypot(p.x - prev.x, p.y - prev.y);
        speed = segmentDist / dt;
      }
      const normSpeed = Math.min(Math.max((speed - 0.05) / 1.5, 0), 1);

      // Stylus pressure (0.0 to 1.0)
      const hasPressure = p.pressure !== undefined && p.pressure > 0 && p.pressure !== 0.5;
      const pressure = hasPressure ? p.pressure! : 0.5;

      let w = baseWidth;

      switch (penStyle) {
        case 'fountain': {
          // Angle modulation (45 degree nib slant)
          const angle = Math.atan2(dy, dx);
          const angleMod = 0.72 + 0.38 * Math.abs(Math.sin(angle - CALLIGRAPHIC_ANGLE));
          // Speed modulation: slower = more ink deposit, faster = slight taper
          const speedMod = 1.12 - 0.32 * normSpeed;
          // Stylus pressure modulation if available
          const pressMod = hasPressure ? 0.4 + 1.2 * pressure : 1.0;
          w = baseWidth * angleMod * speedMod * pressMod;
          break;
        }

        case 'ballpoint': {
          // Subtle organic velocity damping, very consistent core
          const speedMod = 1.05 - 0.16 * normSpeed;
          const pressMod = hasPressure ? 0.65 + 0.7 * pressure : 1.0;
          w = baseWidth * speedMod * pressMod;
          break;
        }

        case 'marker': {
          // Bold, solid, consistent width with round ends
          w = baseWidth * 1.02;
          break;
        }

        case 'pencil': {
          // Subtle organic modulation
          const pressMod = hasPressure ? 0.5 + 0.8 * pressure : 0.85 + 0.25 * (1 - normSpeed);
          w = baseWidth * pressMod;
          break;
        }

        case 'fine': {
          // Uniform ultra-fine technical pen
          w = Math.max(baseWidth * 0.9, 1.2);
          break;
        }

        case 'highlighter': {
          w = Math.max(baseWidth * 3.5, 20);
          break;
        }

        default:
          w = baseWidth;
      }

      // Smooth taper at beginning and ending of strokes (mimics pen touch-down and lift-off)
      if (penStyle !== 'highlighter' && penStyle !== 'marker' && n > 6) {
        if (i < 3) {
          const taperStart = 0.45 + 0.55 * (i / 3);
          w *= taperStart;
        } else if (i >= n - 3) {
          const taperEnd = 0.45 + 0.55 * ((n - 1 - i) / 3);
          w *= taperEnd;
        }
      }

      widths[i] = Math.max(w, 1.0);
    }

    // 2. Smooth widths along the stroke with 3-tap moving average
    const smoothedWidths = new Array(n);
    smoothedWidths[0] = widths[0];
    smoothedWidths[n - 1] = widths[n - 1];

    for (let i = 1; i < n - 1; i++) {
      smoothedWidths[i] = 0.25 * widths[i - 1] + 0.5 * widths[i] + 0.25 * widths[i + 1];
    }

    return smoothedWidths;
  }

  /**
   * Catmull-Rom spline control points with adaptive corner preservation
   */
  static getCurveControlPoints(
    p0: Point,
    p1: Point,
    p2: Point,
    p3: Point,
    baseTension = 0.44
  ): { cp1: Point; cp2: Point } {
    const v1x = p1.x - p0.x;
    const v1y = p1.y - p0.y;
    const v2x = p2.x - p1.x;
    const v2y = p2.y - p1.y;
    const d1 = Math.hypot(v1x, v1y);
    const d2 = Math.hypot(v2x, v2y);

    let tension = baseTension;
    if (d1 > 1.2 && d2 > 1.2) {
      const cosAngle = (v1x * v2x + v1y * v2y) / (d1 * d2);
      if (cosAngle < -0.2) {
        tension = Math.max(0.06, baseTension * Math.max(0, (cosAngle + 1) * 0.65));
      }
    }

    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3;

    return {
      cp1: { x: cp1x, y: cp1y },
      cp2: { x: cp2x, y: cp2y },
    };
  }

  /**
   * Renders a variable-width dynamic ribbon contour
   * Creates seamless, organic handwriting with zero gaps, crisp edges, and round caps.
   */
  static renderVariableRibbon(
    ctx: CanvasRenderingContext2D,
    points: Point[],
    widths: number[],
    color: string,
    opacity = 1
  ) {
    const n = points.length;
    if (n < 2) return;

    // Calculate left and right offset points along the normal of each segment
    const leftPts: Point[] = new Array(n);
    const rightPts: Point[] = new Array(n);

    for (let i = 0; i < n; i++) {
      const p = points[i];
      const prev = points[Math.max(0, i - 1)];
      const next = points[Math.min(n - 1, i + 1)];

      let dx = next.x - prev.x;
      let dy = next.y - prev.y;
      let len = Math.hypot(dx, dy);

      if (len < 0.001) {
        dx = 1;
        dy = 0;
        len = 1;
      }

      // Unit normal perpendicular to direction
      const nx = -dy / len;
      const ny = dx / len;
      const halfW = widths[i] / 2;

      leftPts[i] = { x: p.x + nx * halfW, y: p.y + ny * halfW };
      rightPts[i] = { x: p.x - nx * halfW, y: p.y - ny * halfW };
    }

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.beginPath();

    // 1. Move to start left point
    ctx.moveTo(leftPts[0].x, leftPts[0].y);

    // 2. Forward along left contour using Catmull-Rom spline curves
    for (let i = 0; i < n - 1; i++) {
      const p0 = i === 0 ? leftPts[0] : leftPts[i - 1];
      const p1 = leftPts[i];
      const p2 = leftPts[i + 1];
      const p3 = i + 2 < n ? leftPts[i + 2] : leftPts[i + 1];
      const { cp1, cp2 } = this.getCurveControlPoints(p0, p1, p2, p3, 0.35);
      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
    }

    // 3. Round end cap at the tip
    const endP = points[n - 1];
    const endRadius = widths[n - 1] / 2;
    const endAngleLeft = Math.atan2(leftPts[n - 1].y - endP.y, leftPts[n - 1].x - endP.x);
    const endAngleRight = Math.atan2(rightPts[n - 1].y - endP.y, rightPts[n - 1].x - endP.x);
    ctx.arc(endP.x, endP.y, endRadius, endAngleLeft, endAngleRight, false);

    // 4. Backward along right contour
    for (let i = n - 1; i > 0; i--) {
      const p0 = i === n - 1 ? rightPts[n - 1] : rightPts[i + 1];
      const p1 = rightPts[i];
      const p2 = rightPts[i - 1];
      const p3 = i - 2 >= 0 ? rightPts[i - 2] : rightPts[i - 1];
      const { cp1, cp2 } = this.getCurveControlPoints(p0, p1, p2, p3, 0.35);
      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
    }

    // 5. Round start cap
    const startP = points[0];
    const startRadius = widths[0] / 2;
    const startAngleRight = Math.atan2(rightPts[0].y - startP.y, rightPts[0].x - startP.x);
    const startAngleLeft = Math.atan2(leftPts[0].y - startP.y, leftPts[0].x - startP.x);
    ctx.arc(startP.x, startP.y, startRadius, startAngleRight, startAngleLeft, false);

    ctx.closePath();
    ctx.fill();

    // Add crisp micro-outline stroke to ensure anti-aliased edge perfection
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Main Stroke Renderer
   * Renders freehand handwriting with natural ink feel, variable thickness, and style nuances.
   */
  static renderStroke(
    ctx: CanvasRenderingContext2D,
    element: WhiteboardElement,
    smoothingMode: SmoothingMode = 'smooth'
  ) {
    let rawPoints = element.points;
    if (!rawPoints || rawPoints.length === 0) return;

    // Apply beautification if enabled
    if (element.beautify || smoothingMode === 'beautify') {
      rawPoints = this.beautifyPoints(rawPoints, 1);
    }

    const n = rawPoints.length;
    const strokeWidth = element.strokeWidth || 3;
    const penStyle = (element.penStyle || (element.type === 'highlighter' ? 'highlighter' : element.type === 'pencil' ? 'pencil' : 'fountain')) as PenStyle;
    const isHighlighter = penStyle === 'highlighter' || element.type === 'highlighter';

    ctx.save();

    // 1. Single point dot
    if (n === 1) {
      const p = rawPoints[0];
      const r = Math.max(strokeWidth / 2, 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = element.strokeColor;
      ctx.globalAlpha = isHighlighter ? Math.min(element.opacity || 0.35, 0.45) : (element.opacity ?? 1);
      ctx.fill();
      ctx.restore();
      return;
    }

    // 2. Highlighter: Render as continuous translucent chisel ribbon
    if (isHighlighter) {
      ctx.globalAlpha = Math.min(element.opacity || 0.35, 0.45);
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      ctx.strokeStyle = element.strokeColor;
      ctx.lineWidth = Math.max(strokeWidth * 3.2, 18);

      ctx.beginPath();
      ctx.moveTo(rawPoints[0].x, rawPoints[0].y);
      for (let i = 0; i < n - 1; i++) {
        const p0 = i === 0 ? rawPoints[0] : rawPoints[i - 1];
        const p1 = rawPoints[i];
        const p2 = rawPoints[i + 1];
        const p3 = i + 2 < n ? rawPoints[i + 2] : rawPoints[i + 1];
        const { cp1, cp2 } = this.getCurveControlPoints(p0, p1, p2, p3, 0.32);
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
      }
      ctx.stroke();
      ctx.restore();
      return;
    }

    // 3. Pencil: Soft graphite texture with subtle organic modulation
    if (penStyle === 'pencil') {
      ctx.globalAlpha = Math.min((element.opacity ?? 1) * 0.88, 0.95);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = element.strokeColor;
      ctx.lineWidth = strokeWidth;

      // Draw primary spline
      ctx.beginPath();
      ctx.moveTo(rawPoints[0].x, rawPoints[0].y);
      for (let i = 0; i < n - 1; i++) {
        const p0 = i === 0 ? rawPoints[0] : rawPoints[i - 1];
        const p1 = rawPoints[i];
        const p2 = rawPoints[i + 1];
        const p3 = i + 2 < n ? rawPoints[i + 2] : rawPoints[i + 1];
        const { cp1, cp2 } = this.getCurveControlPoints(p0, p1, p2, p3, 0.28);
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
      }
      ctx.stroke();

      // Subtle pencil core stipple
      ctx.globalAlpha = Math.min((element.opacity ?? 1) * 0.45, 0.6);
      ctx.lineWidth = Math.max(strokeWidth * 0.5, 0.8);
      ctx.stroke();

      ctx.restore();
      return;
    }

    // 4. Natural Ink (Fountain Pen, Ballpoint, Marker, Fine Pen):
    // Use dynamic variable-width ribbon contour for authentic handwriting aesthetics!
    const widths = this.computeStrokeWidths(rawPoints, strokeWidth, penStyle);
    this.renderVariableRibbon(
      ctx,
      rawPoints,
      widths,
      element.strokeColor,
      element.opacity ?? 1
    );

    ctx.restore();
  }

  /**
   * Computes the bounding box for a freehand stroke
   */
  static getStrokeBounds(
    element: WhiteboardElement
  ): { x: number; y: number; width: number; height: number } {
    const points = element.points;
    const padding = (element.strokeWidth || 3) * 2 + 2;

    if (!points || points.length === 0) {
      return {
        x: element.x - padding,
        y: element.y - padding,
        width: Math.max(element.width, 2) + padding * 2,
        height: Math.max(element.height, 2) + padding * 2,
      };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    return {
      x: minX - padding,
      y: minY - padding,
      width: Math.max(maxX - minX + padding * 2, 8),
      height: Math.max(maxY - minY + padding * 2, 8),
    };
  }

  /**
   * Smart Shape Recognition
   * Analyzes a freehand stroke to recognize circles, rectangles, triangles, and straight lines.
   */
  static recognizeShape(points: Point[]): RecognizedShape | null {
    if (points.length < 8) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let pathLength = 0;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
      if (i > 0) {
        pathLength += Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
      }
    }

    const width = maxX - minX;
    const height = maxY - minY;
    if (width < 12 && height < 12) return null;

    const startP = points[0];
    const endP = points[points.length - 1];
    const closureDist = Math.hypot(endP.x - startP.x, endP.y - startP.y);
    const isClosed = closureDist < Math.max(width, height) * 0.35 || closureDist < 35;

    const straightDist = Math.hypot(endP.x - startP.x, endP.y - startP.y);

    // 1. Straight Line Check
    if (!isClosed && pathLength > 30) {
      const straightnessRatio = straightDist / pathLength;
      if (straightnessRatio > 0.91) {
        return {
          type: 'line',
          confidence: straightnessRatio,
          bounds: { x: minX, y: minY, width, height },
          points: [startP, endP],
        };
      }
    }

    // 2. Closed Shapes (Circle, Rectangle, Triangle)
    if (isClosed) {
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const rExpected = (width + height) / 4;

      // Circle test: variance of distance from center
      let distVariance = 0;
      for (const p of points) {
        const d = Math.hypot(p.x - cx, p.y - cy);
        distVariance += Math.abs(d - rExpected);
      }
      distVariance /= points.length;
      const circleFit = 1 - distVariance / rExpected;

      const aspectRatio = Math.min(width, height) / Math.max(width, height);

      if (circleFit > 0.72 && aspectRatio > 0.65) {
        return {
          type: 'circle',
          confidence: circleFit,
          bounds: { x: minX, y: minY, width, height },
        };
      }

      // Rectangle test: count sharp turns near 90 degrees
      let sharpTurns = 0;
      for (let i = 2; i < points.length - 2; i++) {
        const v1x = points[i].x - points[i - 2].x;
        const v1y = points[i].y - points[i - 2].y;
        const v2x = points[i + 2].x - points[i].x;
        const v2y = points[i + 2].y - points[i].y;
        const dot = (v1x * v2x + v1y * v2y) / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y) || 1);
        if (dot < 0.25) {
          sharpTurns++;
          i += 3; // Skip nearby points
        }
      }

      if (sharpTurns === 4 || sharpTurns === 5) {
        return {
          type: 'rectangle',
          confidence: 0.85,
          bounds: { x: minX, y: minY, width, height },
        };
      }

      if (sharpTurns === 3) {
        return {
          type: 'triangle',
          confidence: 0.82,
          bounds: { x: minX, y: minY, width, height },
        };
      }
    }

    return null;
  }

  /**
   * Distance from point P to segment [A, B]
   */
  static distToSegment(p: Point, a: Point, b: Point): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  /**
   * Fast hit check whether a stroke intersects an eraser capsule
   */
  static isStrokeHitByEraser(
    element: WhiteboardElement,
    p1: Point,
    p2: Point,
    eraserRadius: number
  ): boolean {
    if (!element.points || element.points.length === 0) return false;
    const strokeWidth = element.strokeWidth || 3;
    const effectiveRadius = eraserRadius + strokeWidth / 2;

    // Fast AABB check
    const sweepMinX = Math.min(p1.x, p2.x) - effectiveRadius;
    const sweepMaxX = Math.max(p1.x, p2.x) + effectiveRadius;
    const sweepMinY = Math.min(p1.y, p2.y) - effectiveRadius;
    const sweepMaxY = Math.max(p1.y, p2.y) + effectiveRadius;

    if (
      element.x + element.width < sweepMinX ||
      element.x > sweepMaxX ||
      element.y + element.height < sweepMinY ||
      element.y > sweepMaxY
    ) {
      return false;
    }

    const pts = element.points;
    if (pts.length === 1) {
      return this.distToSegment(pts[0], p1, p2) <= effectiveRadius;
    }

    for (let i = 0; i < pts.length; i++) {
      if (this.distToSegment(pts[i], p1, p2) <= effectiveRadius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Precise Vector Ink Eraser with Segment Splitting:
   * Erases only the touched portion of a freehand stroke, splitting it into
   * surviving connected sub-strokes while preserving untouched segments.
   *
   * Returns:
   * - null: Stroke was NOT hit (no change)
   * - []: Stroke was completely erased (should be removed from board)
   * - WhiteboardElement[]: One or more surviving sub-stroke segments
   */
  static eraseStrokeSegment(
    element: WhiteboardElement,
    p1: Point,
    p2: Point,
    eraserRadius: number
  ): WhiteboardElement[] | null {
    if (!element.points || element.points.length === 0) return null;

    const strokeWidth = element.strokeWidth || 3;
    const effectiveRadius = eraserRadius + Math.min(strokeWidth / 2, 8);

    // Fast AABB rejection
    const sweepMinX = Math.min(p1.x, p2.x) - effectiveRadius;
    const sweepMaxX = Math.max(p1.x, p2.x) + effectiveRadius;
    const sweepMinY = Math.min(p1.y, p2.y) - effectiveRadius;
    const sweepMaxY = Math.max(p1.y, p2.y) + effectiveRadius;

    if (
      element.x + element.width < sweepMinX ||
      element.x > sweepMaxX ||
      element.y + element.height < sweepMinY ||
      element.y > sweepMaxY
    ) {
      return null;
    }

    // Densify points along large steps so eraser cuts through fast straight movements smoothly
    const densePoints: Point[] = [];
    const raw = element.points;
    for (let i = 0; i < raw.length; i++) {
      densePoints.push(raw[i]);
      if (i < raw.length - 1) {
        const next = raw[i + 1];
        const segDist = Math.hypot(next.x - raw[i].x, next.y - raw[i].y);
        if (segDist > 3.5) {
          const stepCount = Math.min(Math.floor(segDist / 2.5), 15);
          for (let k = 1; k <= stepCount; k++) {
            const frac = k / (stepCount + 1);
            densePoints.push({
              x: raw[i].x + (next.x - raw[i].x) * frac,
              y: raw[i].y + (next.y - raw[i].y) * frac,
              pressure: (raw[i].pressure ?? 0.5) * (1 - frac) + (next.pressure ?? 0.5) * frac,
              time: (raw[i].time ?? 0) * (1 - frac) + (next.time ?? 0) * frac,
            });
          }
        }
      }
    }

    // Mark erased points
    let anyErased = false;
    let anyKept = false;
    const isPointErased: boolean[] = new Array(densePoints.length);

    for (let i = 0; i < densePoints.length; i++) {
      const d = this.distToSegment(densePoints[i], p1, p2);
      if (d <= effectiveRadius) {
        isPointErased[i] = true;
        anyErased = true;
      } else {
        isPointErased[i] = false;
        anyKept = true;
      }
    }

    // If nothing touched, return null (unmodified)
    if (!anyErased) return null;

    // If everything erased, return empty array (deleted)
    if (!anyKept) return [];

    // Group contiguous kept points into surviving runs
    const runs: Point[][] = [];
    let currentRun: Point[] = [];

    for (let i = 0; i < densePoints.length; i++) {
      if (!isPointErased[i]) {
        currentRun.push(densePoints[i]);
      } else {
        if (currentRun.length > 0) {
          runs.push(currentRun);
          currentRun = [];
        }
      }
    }
    if (currentRun.length > 0) {
      runs.push(currentRun);
    }

    // Filter out runs that are too tiny (micro specks < 1.5px total length)
    const validRuns: Point[][] = [];
    for (const run of runs) {
      if (run.length >= 2) {
        let totalLen = 0;
        for (let j = 0; j < run.length - 1; j++) {
          totalLen += Math.hypot(run[j + 1].x - run[j].x, run[j + 1].y - run[j].y);
        }
        if (totalLen >= 1.5) {
          validRuns.push(this.filterPoints(run, 1.5));
        }
      }
    }

    if (validRuns.length === 0) return [];

    // Convert surviving runs into WhiteboardElements
    const survivingElements: WhiteboardElement[] = [];

    validRuns.forEach((pts, idx) => {
      const bounds = this.getStrokeBounds({ ...element, points: pts });
      if (idx === 0) {
        // First run preserves original ID
        survivingElements.push({
          ...element,
          points: pts,
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        });
      } else {
        // Subsequent segments get new unique ID
        survivingElements.push({
          ...element,
          id: `el_split_${Date.now()}_${Math.random().toString(36).substr(2, 4)}_${idx}`,
          points: pts,
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        });
      }
    });

    return survivingElements;
  }
}
