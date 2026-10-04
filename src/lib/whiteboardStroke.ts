import { Point, WhiteboardElement } from '../types/whiteboard';

/**
 * High-performance stroke smoothing and path generation utility
 * Uses Catmull-Rom spline interpolation and distance-filtered sampling
 * for silky-smooth, low-latency freehand drawing.
 */

export interface SmoothedPoint extends Point {
  width?: number;
}

export class WhiteboardStroke {
  /**
   * Filters out redundant points that are too close (< minDistance px)
   * to eliminate hand trembling, micro-jitter, and mouse quantization steps.
   */
  static filterPoints(rawPoints: Point[], minDistance = 1.8): Point[] {
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
   * Calculates Catmull-Rom spline control points between four points
   * with adaptive corner preservation and continuous C1 curvature.
   */
  static getCurveControlPoints(
    p0: Point,
    p1: Point,
    p2: Point,
    p3: Point,
    baseTension = 0.45
  ): { cp1: Point; cp2: Point } {
    // Detect sharp corners at p1: if direction change is sharp, preserve the vertex
    const v1x = p1.x - p0.x;
    const v1y = p1.y - p0.y;
    const v2x = p2.x - p1.x;
    const v2y = p2.y - p1.y;
    const d1 = Math.hypot(v1x, v1y);
    const d2 = Math.hypot(v2x, v2y);

    let tension = baseTension;
    if (d1 > 1 && d2 > 1) {
      const cosAngle = (v1x * v2x + v1y * v2y) / (d1 * d2);
      // If angle change is sharp (e.g. sharp handwriting corner in A, M, N, Z), clamp tension
      if (cosAngle < -0.3) {
        tension = Math.max(0.08, baseTension * Math.max(0, (cosAngle + 1) * 0.7));
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
   * Renders a freehand stroke with adaptive Catmull-Rom spline smoothing,
   * phantom endpoint continuity, and precise stroke thickness.
   */
  static renderStroke(
    ctx: CanvasRenderingContext2D,
    element: WhiteboardElement,
    smoothingMode: 'smooth' | 'natural' = 'smooth'
  ) {
    const rawPoints = element.points;
    if (!rawPoints || rawPoints.length === 0) return;

    const isHighlighter = element.type === 'highlighter';
    const isPencil = element.type === 'pencil';
    const strokeWidth = element.strokeWidth || 3;

    ctx.save();

    if (isHighlighter) {
      // Highlighter: semi-transparent, flat overlay
      ctx.globalAlpha = Math.min(element.opacity || 0.35, 0.45);
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
    } else {
      ctx.globalAlpha = element.opacity ?? 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    ctx.strokeStyle = element.strokeColor;
    ctx.lineWidth = strokeWidth;

    // Single point: render crisp round dot
    if (rawPoints.length === 1) {
      ctx.beginPath();
      const p = rawPoints[0];
      const r = Math.max(strokeWidth / 2, 1);
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = element.strokeColor;
      ctx.fill();
      ctx.restore();
      return;
    }

    // Two points: simple crisp line
    if (rawPoints.length === 2) {
      ctx.beginPath();
      ctx.moveTo(rawPoints[0].x, rawPoints[0].y);
      ctx.lineTo(rawPoints[1].x, rawPoints[1].y);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Catmull-Rom Spline Interpolation with continuous C1 tangents
    // and phantom endpoint extrapolation for complete curvature fidelity
    ctx.beginPath();
    ctx.moveTo(rawPoints[0].x, rawPoints[0].y);

    const n = rawPoints.length;
    // Base tension: Smooth mode uses 0.44 for fluid handwriting; Natural mode uses 0.28
    const baseTension = isHighlighter ? 0.32 : smoothingMode === 'natural' ? 0.28 : 0.44;

    for (let i = 0; i < n - 1; i++) {
      // Phantom point extrapolation for smooth endpoints
      const p0 = i === 0 ? { x: 2 * rawPoints[0].x - rawPoints[1].x, y: 2 * rawPoints[0].y - rawPoints[1].y } : rawPoints[i - 1];
      const p1 = rawPoints[i];
      const p2 = rawPoints[i + 1];
      const p3 = i + 2 < n ? rawPoints[i + 2] : { x: 2 * p2.x - p1.x, y: 2 * p2.y - p1.y };

      const { cp1, cp2 } = this.getCurveControlPoints(p0, p1, p2, p3, baseTension);
      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
    }

    ctx.stroke();
    ctx.restore();
  }

  /**
   * Computes the tight bounding box for a freehand stroke
   * taking into account stroke thickness and all control points
   */
  static getStrokeBounds(
    element: WhiteboardElement
  ): { x: number; y: number; width: number; height: number } {
    const points = element.points;
    const padding = (element.strokeWidth || 3) / 2 + 1;

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
}
