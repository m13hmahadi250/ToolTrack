import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  WhiteboardBoard,
  WhiteboardElement,
  WhiteboardTool,
  Point,
  LaserPoint,
  MeasureLine,
  ResizeHandle,
  SelectionBounds,
  StrokeStyle,
  PenStyle,
  SmoothingMode,
  PenCursorChoice,
} from '../../types/whiteboard';
import { WhiteboardRenderer, isDarkColor } from '../../lib/whiteboardRenderer';
import { WhiteboardStroke } from '../../lib/whiteboardStroke';
import { getWhiteboardCursorStyle } from '../../lib/whiteboardCursors';

interface WhiteboardCanvasProps {
  board: WhiteboardBoard;
  activeTool: WhiteboardTool;
  onToolUsed?: () => void;
  selectedElementIds: string[];
  onSelectElements: (ids: string[]) => void;
  onUpdateElement: (id: string, updates: Partial<WhiteboardElement>) => void;
  onAddElement: (element: WhiteboardElement) => void;
  onDeleteElements: (ids: string[]) => void;
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;
  // Current creation properties
  currentStrokeColor: string;
  currentFillColor: string;
  currentStrokeWidth: number;
  currentStrokeStyle: StrokeStyle;
  currentOpacity: number;
  currentPenStyle?: PenStyle;
  penCursorChoice?: PenCursorChoice;
  smoothingMode?: SmoothingMode;
  isBeautifyEnabled?: boolean;
  isSmartShapeEnabled?: boolean;
  onShapeRecognized?: (shape: string) => void;
  // Context Menu
  onOpenContextMenu: (coords: { x: number; y: number; worldX: number; worldY: number }) => void;
  // Double-click text editing
  editingElementId: string | null;
  onStartEditing: (id: string) => void;
  onFinishEditing: (id: string, newText: string) => void;
  // Eraser configuration
  eraserSize?: number;
  eraserMode?: 'precision' | 'stroke';
  onCommitElements?: (elements: WhiteboardElement[]) => void;
  onDrawingActiveChange?: (isActive: boolean) => void;
  onPdfFileDropped?: (file: File, worldCoords: Point) => void;
  onImageFileDropped?: (file: File, worldCoords: Point) => void;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  board,
  activeTool,
  onToolUsed,
  selectedElementIds,
  onSelectElements,
  onUpdateElement,
  onAddElement,
  onDeleteElements,
  onViewportChange,
  currentStrokeColor,
  currentFillColor,
  currentStrokeWidth,
  currentStrokeStyle,
  currentOpacity,
  currentPenStyle = 'fountain',
  penCursorChoice = 'auto',
  smoothingMode = 'smooth',
  isBeautifyEnabled = false,
  isSmartShapeEnabled = false,
  onShapeRecognized,
  onOpenContextMenu,
  editingElementId,
  onStartEditing,
  onFinishEditing,
  eraserSize = 24,
  eraserMode = 'precision',
  onCommitElements,
  onDrawingActiveChange,
  onPdfFileDropped,
  onImageFileDropped,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const requestBaseRef = useRef<number | null>(null);
  const requestActiveRef = useRef<number | null>(null);

  // Synchronized Viewport Refs for high-speed event handlers (60-120fps wheel/pinch)
  const viewportRef = useRef(board.viewport);
  useEffect(() => {
    viewportRef.current = board.viewport;
  }, [board.viewport]);

  const onViewportChangeRef = useRef(onViewportChange);
  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  // Interaction State
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  // Keep active drawing element in a ref to avoid re-rendering entire React tree on pointermove!
  const activeDrawingElementRef = useRef<WhiteboardElement | null>(null);
  const [marqueeBox, setMarqueeBox] = useState<{ start: Point; current: Point } | null>(null);
  const [lassoPoints, setLassoPoints] = useState<Point[] | null>(null);
  const lassoPointsRef = useRef<Point[] | null>(null);
  const [laserPoints, setLaserPoints] = useState<LaserPoint[]>([]);
  const [measureLine, setMeasureLine] = useState<MeasureLine | null>(null);

  // Dragging / Resizing / Rotating selected elements
  const interactionModeRef = useRef<
    | 'none'
    | 'pan'
    | 'draw'
    | 'move'
    | 'resize'
    | 'rotate'
    | 'marquee'
    | 'lasso'
    | 'laser'
    | 'measure'
    | 'erase'
    | 'pinch'
  >('none');
  const activeHandleRef = useRef<ResizeHandle | null>(null);
  const startPointerRef = useRef<Point>({ x: 0, y: 0 }); // World coords
  const startScreenRef = useRef<Point>({ x: 0, y: 0 }); // Screen coords
  const initialElementsSnapshotRef = useRef<{ id: string; x: number; y: number; width: number; height: number; rotation?: number }[]>([]);
  const initialBoundsRef = useRef<SelectionBounds | null>(null);

  // Multi-Touch Pinch Zoom tracking
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);
  const pinchCenterWorldRef = useRef<Point | null>(null);

  // High-performance Eraser Interaction State (Zero React state updates during active erasing)
  const eraserCursorPosRef = useRef<Point | null>(null);
  const workingElementsRef = useRef<WhiteboardElement[] | null>(null);
  const hasEraseChangedRef = useRef<boolean>(false);
  const lastEraserPointRef = useRef<Point | null>(null);

  // Inline Text Editor State
  const [editingText, setEditingText] = useState('');
  const editingElement = board.elements.find((el) => el.id === editingElementId) || null;

  useEffect(() => {
    if (editingElement) {
      setEditingText(editingElement.text || '');
    }
  }, [editingElement]);

  // When activeTool changes, cleanly finish any active inline text editing
  useEffect(() => {
    if (editingElementId) {
      onFinishEditing(editingElementId, editingText);
    }
  }, [activeTool]);

  // Convert screen coordinates (clientX, clientY) to world canvas coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point => {
      const canvas = activeCanvasRef.current || baseCanvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = (screenX - rect.left - board.viewport.x) / board.viewport.zoom;
      const y = (screenY - rect.top - board.viewport.y) / board.viewport.zoom;
      return { x, y };
    },
    [board.viewport]
  );

  // Convert world coordinates to screen pixel coordinates
  const worldToScreen = useCallback(
    (worldX: number, worldY: number): Point => {
      const canvas = activeCanvasRef.current || baseCanvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: rect.left + board.viewport.x + worldX * board.viewport.zoom,
        y: rect.top + board.viewport.y + worldY * board.viewport.zoom,
      };
    },
    [board.viewport]
  );

  // Selected elements objects
  const selectedElements = board.elements.filter((el) => selectedElementIds.includes(el.id));

  // Snap to grid helper
  const snap = useCallback(
    (val: number, step = 28): number => {
      if (!board.gridSnap) return val;
      return Math.round(val / step) * step;
    },
    [board.gridSnap]
  );

  // Base canvas render: background grid, committed board elements, selection box
  const renderBaseCanvas = useCallback(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rect = canvas.getBoundingClientRect();
    const elementsToRender = workingElementsRef.current || board.elements;
    const boardToRender = workingElementsRef.current ? { ...board, elements: elementsToRender } : board;

    WhiteboardRenderer.render(
      ctx,
      boardToRender,
      rect.width,
      rect.height,
      selectedElements,
      null, // Active drawing rendered exclusively on overlay activeCanvas!
      [],
      null,
      null,
      true,
      () => {
        if (requestBaseRef.current === null) {
          requestBaseRef.current = requestAnimationFrame(renderBaseCanvas);
        }
      },
      smoothingMode,
      null
    );

    requestBaseRef.current = null;
  }, [board, selectedElements, smoothingMode]);

  // Active overlay canvas render: instantaneous 0-latency ink, eraser target ring, transient lasso/marquee
  const renderActiveCanvas = useCallback(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    const isDark = isDarkColor(board.backgroundColor);
    const { viewport } = board;

    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // 1. Live Active Drawing Stroke or Shape
    if (activeDrawingElementRef.current) {
      WhiteboardRenderer.renderElement(
        ctx,
        activeDrawingElementRef.current,
        isDark,
        undefined,
        smoothingMode
      );
    }

    // 2. Precision circular eraser target ring
    if (activeTool === 'eraser' && eraserCursorPosRef.current) {
      const ePos = eraserCursorPosRef.current;
      const eraserRadius = (eraserSize || 24) / 2;
      ctx.beginPath();
      ctx.arc(ePos.x, ePos.y, eraserRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isPointerDown ? '#f43f5e' : 'rgba(244, 63, 94, 0.75)';
      ctx.lineWidth = 1.5 / viewport.zoom;
      ctx.fillStyle = isPointerDown ? 'rgba(244, 63, 94, 0.22)' : 'rgba(244, 63, 94, 0.08)';
      ctx.fill();
      ctx.stroke();
    }

    // 3. Laser Pointer trails
    if (laserPoints.length > 0) {
      WhiteboardRenderer.renderLaser(ctx, laserPoints);
    }

    // 4. Measure Line
    if (measureLine) {
      WhiteboardRenderer.renderMeasureLine(ctx, measureLine, isDark);
    }

    // 5. Selection Marquee Box
    if (marqueeBox) {
      WhiteboardRenderer.renderMarquee(ctx, marqueeBox);
    }

    // 6. Freehand Lasso Trail
    if (lassoPoints && lassoPoints.length > 1) {
      WhiteboardRenderer.renderLasso(ctx, lassoPoints);
    }

    ctx.restore();
    requestActiveRef.current = null;
  }, [board.backgroundColor, board.viewport, activeTool, isPointerDown, smoothingMode, eraserSize, laserPoints, measureLine, marqueeBox, lassoPoints]);

  // Combined render
  const renderCanvas = useCallback(() => {
    renderBaseCanvas();
    renderActiveCanvas();
  }, [renderBaseCanvas, renderActiveCanvas]);

  // Native non-passive wheel listener attached to container
  // Guarantees e.preventDefault() prevents browser page zoom during Ctrl/Cmd + Wheel
  // and implements professional cursor-anchored smooth zooming & smooth canvas panning!
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelNative = (e: WheelEvent) => {
      const isZoomGesture = e.ctrlKey || e.metaKey;

      if (isZoomGesture) {
        e.preventDefault();

        const rect = container.getBoundingClientRect();
        const cursorScreenX = e.clientX - rect.left;
        const cursorScreenY = e.clientY - rect.top;

        const currentViewport = viewportRef.current;
        const currentZoom = currentViewport.zoom;

        // Delta normalization: 1 = lines, 2 = pages, 0 = pixels
        const delta = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaMode === 2 ? e.deltaY * 300 : e.deltaY;
        const zoomMultiplier = Math.exp(-delta * 0.0025);
        const newZoom = Math.min(10.0, Math.max(0.05, currentZoom * zoomMultiplier));

        if (Math.abs(newZoom - currentZoom) < 0.0001) return;

        // Mathematical transform: preserve the world point under mouse cursor!
        const cursorWorldX = (cursorScreenX - currentViewport.x) / currentZoom;
        const cursorWorldY = (cursorScreenY - currentViewport.y) / currentZoom;
        const newViewportX = cursorScreenX - cursorWorldX * newZoom;
        const newViewportY = cursorScreenY - cursorWorldY * newZoom;

        onViewportChangeRef.current({
          x: Math.round(newViewportX * 100) / 100,
          y: Math.round(newViewportY * 100) / 100,
          zoom: Math.round(newZoom * 1000) / 1000,
        });
      } else {
        // Normal canvas pan on wheel / trackpad scroll
        e.preventDefault();
        const currentViewport = viewportRef.current;
        const dx = e.shiftKey ? e.deltaY : e.deltaX;
        const dy = e.shiftKey ? 0 : e.deltaY;

        onViewportChangeRef.current({
          ...currentViewport,
          x: Math.round((currentViewport.x - dx) * 100) / 100,
          y: Math.round((currentViewport.y - dy) * 100) / 100,
        });
      }
    };

    container.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelNative);
    };
  }, []);

  // Resize both canvases according to devicePixelRatio with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      const baseCanvas = baseCanvasRef.current;
      const activeCanvas = activeCanvasRef.current;
      if (!baseCanvas || !activeCanvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);

      let changed = false;
      if (baseCanvas.width !== w || baseCanvas.height !== h) {
        baseCanvas.width = w;
        baseCanvas.height = h;
        changed = true;
      }
      if (activeCanvas.width !== w || activeCanvas.height !== h) {
        activeCanvas.width = w;
        activeCanvas.height = h;
        changed = true;
      }

      if (changed) {
        renderBaseCanvas();
        renderActiveCanvas();
      }
    };

    handleResize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [renderBaseCanvas, renderActiveCanvas]);

  useEffect(() => {
    renderBaseCanvas();
  }, [renderBaseCanvas]);

  useEffect(() => {
    renderActiveCanvas();
  }, [renderActiveCanvas]);

  // Laser Pointer timer cleanup
  useEffect(() => {
    if (laserPoints.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      const filtered = laserPoints.filter((p) => now - p.timestamp <= 1200);
      setLaserPoints(filtered);
      renderActiveCanvas();
    }, 40);
    return () => clearInterval(timer);
  }, [laserPoints, renderCanvas]);

  // Spacebar tracking for Pan mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setIsSpacePressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // -------------------------------------------------------------
  // Pointer Event Handlers (Mouse & Touch)
  // -------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (editingElementId) {
      onFinishEditing(editingElementId, editingText);
    }

    if (e.button === 2) {
      // Right-click handled by onContextMenu
      return;
    }

    const worldPt = screenToWorld(e.clientX, e.clientY);
    startPointerRef.current = worldPt;
    startScreenRef.current = { x: e.clientX, y: e.clientY };
    setIsPointerDown(true);

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch 2-finger pinch gesture
    if (activePointersRef.current.size === 2) {
      activeDrawingElementRef.current = null;
      interactionModeRef.current = 'pinch';
      const pts = Array.from(activePointersRef.current.values());
      pinchStartDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStartZoomRef.current = board.viewport.zoom;
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      pinchCenterWorldRef.current = screenToWorld(midX, midY);
      return;
    }

    // 1. Pan / Hand Mode
    if (activeTool === 'hand' || isSpacePressed || e.button === 1) {
      interactionModeRef.current = 'pan';
      return;
    }

    // 2. Laser Mode
    if (activeTool === 'laser') {
      interactionModeRef.current = 'laser';
      setLaserPoints((prev) => [...prev, { x: worldPt.x, y: worldPt.y, timestamp: Date.now() }]);
      return;
    }

    // 3. Measure Mode
    if (activeTool === 'measure') {
      interactionModeRef.current = 'measure';
      setMeasureLine({ start: worldPt, end: worldPt });
      return;
    }

    // 4. Eraser Mode
    if (activeTool === 'eraser') {
      interactionModeRef.current = 'erase';
      if (onDrawingActiveChange) onDrawingActiveChange(true);
      hasEraseChangedRef.current = false;
      workingElementsRef.current = [...board.elements];
      lastEraserPointRef.current = worldPt;
      eraserCursorPosRef.current = worldPt;
      eraseAlongSegment(worldPt, worldPt);
      renderActiveCanvas();
      if (hasEraseChangedRef.current) {
        renderBaseCanvas();
      }
      return;
    }

    // 5. Select Tool: Check Handle click -> Move -> Marquee
    if (activeTool === 'select') {
      // Check if clicked on a selection handle
      if (selectedElements.length > 0) {
        const bounds = WhiteboardRenderer.getSelectionBounds(selectedElements);
        if (bounds) {
          const hitHandle = WhiteboardRenderer.getHandleAtPoint(bounds, worldPt, board.viewport.zoom);
          if (hitHandle) {
            activeHandleRef.current = hitHandle;
            initialBoundsRef.current = bounds;
            initialElementsSnapshotRef.current = selectedElements.map((el) => ({
              id: el.id,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              rotation: el.rotation || 0,
            }));
            interactionModeRef.current = hitHandle === 'rot' ? 'rotate' : 'resize';
            return;
          }
        }
      }

      // Check if clicked on an element
      const hitElement = [...board.elements]
        .reverse()
        .find((el) => WhiteboardRenderer.isPointInElement(worldPt, el));

      if (hitElement) {
        if (e.shiftKey) {
          // Toggle multi-select
          if (selectedElementIds.includes(hitElement.id)) {
            onSelectElements(selectedElementIds.filter((id) => id !== hitElement.id));
          } else {
            onSelectElements([...selectedElementIds, hitElement.id]);
          }
        } else {
          if (!selectedElementIds.includes(hitElement.id)) {
            onSelectElements([hitElement.id]);
          }
        }

        interactionModeRef.current = 'move';
        initialElementsSnapshotRef.current = (
          selectedElementIds.includes(hitElement.id) ? selectedElements : [hitElement]
        ).map((el) => ({
          id: el.id,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
        }));
        return;
      }

      // Clicked empty canvas -> Clear selection & Start Marquee drag
      if (!e.shiftKey) {
        onSelectElements([]);
      }
      interactionModeRef.current = 'marquee';
      setMarqueeBox({ start: worldPt, current: worldPt });
      return;
    }

    // 5.5. Lasso Tool: Freehand loop selection
    if (activeTool === 'lasso') {
      interactionModeRef.current = 'lasso';
      lassoPointsRef.current = [worldPt];
      setLassoPoints([worldPt]);
      return;
    }

    // 6. Freehand Drawing Tools (Pencil, Pen, Highlighter)
    if (['pencil', 'pen', 'highlighter'].includes(activeTool)) {
      interactionModeRef.current = 'draw';
      if (onDrawingActiveChange) onDrawingActiveChange(true);
      const actualWidth =
        activeTool === 'highlighter' || currentPenStyle === 'highlighter'
          ? Math.max(currentStrokeWidth * 3.5, 18)
          : currentStrokeWidth;

      const newEl: WhiteboardElement = {
        id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: activeTool as any,
        x: worldPt.x,
        y: worldPt.y,
        width: 0,
        height: 0,
        strokeColor: currentStrokeColor,
        strokeWidth: actualWidth,
        opacity: activeTool === 'highlighter' ? Math.min(currentOpacity, 0.45) : currentOpacity,
        zIndex: board.elements.length,
        penStyle: currentPenStyle,
        smoothingMode,
        beautify: isBeautifyEnabled,
        points: [
          {
            x: worldPt.x,
            y: worldPt.y,
            pressure: e.pressure && e.pressure > 0 ? e.pressure : 0.5,
            time: performance.now(),
          },
        ],
      };
      activeDrawingElementRef.current = newEl;
      renderCanvas();
      return;
    }

    // 7. Text Tool: Click to create & edit text without blue selection box
    if (activeTool === 'text') {
      // Check if user clicked an existing text element to edit it
      const hitElement = [...board.elements]
        .reverse()
        .find((el) => el.type === 'text' && WhiteboardRenderer.isPointInElement(worldPt, el));
      if (hitElement) {
        onStartEditing(hitElement.id);
        return;
      }

      // Create new text element directly at click point
      const newTextEl: WhiteboardElement = {
        id: `el_txt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'text',
        x: snap(worldPt.x),
        y: snap(worldPt.y),
        width: 180,
        height: 36,
        strokeColor: currentStrokeColor,
        strokeWidth: 1,
        opacity: currentOpacity,
        fontSize: 18,
        zIndex: board.elements.length,
        text: '',
      };
      onAddElement(newTextEl);
      onSelectElements([]); // Remains unselected!
      onStartEditing(newTextEl.id);
      setEditingText('');
      return;
    }

    // 8. Sticky Note Tool: Click to place sticky note without selection box
    if (activeTool === 'sticky') {
      const newStickyEl: WhiteboardElement = {
        id: `el_sticky_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'sticky',
        x: snap(worldPt.x) - 100,
        y: snap(worldPt.y) - 90,
        width: 200,
        height: 180,
        strokeColor: '#ca8a04',
        strokeWidth: 1,
        opacity: currentOpacity,
        stickyColor: '#fef08a',
        text: 'Idea note...',
        zIndex: board.elements.length,
      };
      onAddElement(newStickyEl);
      onSelectElements([]); // Remains unselected!
      return;
    }

    // 9. Shape Tools (Rectangle, Circle, Line, Arrow, Frame, etc.)
    interactionModeRef.current = 'draw';
    const newEl: WhiteboardElement = {
      id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: activeTool as any,
      x: snap(worldPt.x),
      y: snap(worldPt.y),
      width: 1,
      height: 1,
      strokeColor: currentStrokeColor,
      strokeWidth: currentStrokeWidth,
      strokeStyle: currentStrokeStyle,
      fillColor: currentFillColor,
      opacity: currentOpacity,
      zIndex: board.elements.length,
      ...(activeTool === 'frame' ? { frameTitle: `Frame ${board.frames?.length ? board.frames.length + 1 : 1}` } : {}),
    };
    activeDrawingElementRef.current = newEl;
    renderCanvas();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const worldPt = screenToWorld(e.clientX, e.clientY);

    // Multi-touch 2-finger pinch zoom
    if (interactionModeRef.current === 'pinch' && activePointersRef.current.size >= 2) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pts = Array.from(activePointersRef.current.values());
      const curDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchStartDistRef.current && curDist > 10 && pinchCenterWorldRef.current) {
        const scale = curDist / pinchStartDistRef.current;
        const newZoom = Math.min(10.0, Math.max(0.05, pinchStartZoomRef.current * scale));
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const container = containerRef.current;
        const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
        const cursorScreenX = midX - rect.left;
        const cursorScreenY = midY - rect.top;

        const newVx = cursorScreenX - pinchCenterWorldRef.current.x * newZoom;
        const newVy = cursorScreenY - pinchCenterWorldRef.current.y * newZoom;

        onViewportChangeRef.current({
          x: Math.round(newVx * 100) / 100,
          y: Math.round(newVy * 100) / 100,
          zoom: Math.round(newZoom * 1000) / 1000,
        });
      }
      return;
    }

    // Pan Mode
    if (interactionModeRef.current === 'pan') {
      const dx = e.clientX - startScreenRef.current.x;
      const dy = e.clientY - startScreenRef.current.y;
      onViewportChangeRef.current({
        ...board.viewport,
        x: board.viewport.x + dx,
        y: board.viewport.y + dy,
      });
      startScreenRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!isPointerDown) return;

    // Laser Mode
    if (interactionModeRef.current === 'laser') {
      setLaserPoints((prev) => [...prev, { x: worldPt.x, y: worldPt.y, timestamp: Date.now() }]);
      return;
    }

    // Measure Mode
    if (interactionModeRef.current === 'measure') {
      setMeasureLine({
        start: startPointerRef.current,
        end: worldPt,
      });
      return;
    }

    // Update eraser cursor position for hover / drag circle
    if (activeTool === 'eraser') {
      eraserCursorPosRef.current = worldPt;
      renderActiveCanvas();
    }

    // Eraser Mode
    if (interactionModeRef.current === 'erase') {
      const prev = lastEraserPointRef.current || worldPt;
      eraseAlongSegment(prev, worldPt);
      lastEraserPointRef.current = worldPt;
      renderActiveCanvas();
      if (hasEraseChangedRef.current) {
        renderBaseCanvas();
      }
      return;
    }

    // Marquee Mode
    if (interactionModeRef.current === 'marquee') {
      setMarqueeBox({
        start: startPointerRef.current,
        current: worldPt,
      });
      renderActiveCanvas();
      return;
    }

    // Lasso Mode
    if (interactionModeRef.current === 'lasso') {
      const prev = lassoPointsRef.current || [];
      const updated = [...prev, worldPt];
      lassoPointsRef.current = updated;
      setLassoPoints(updated);
      renderActiveCanvas();
      return;
    }

    // High-frequency Freehand Drawing & Shape Mode
    // Renders active stroke immediately on dedicated transparent activeCanvas overlay
    // Completely eliminates full canvas redraws and component re-renders during active writing!
    if (interactionModeRef.current === 'draw' && activeDrawingElementRef.current) {
      const el = activeDrawingElementRef.current;
      if (['pencil', 'pen', 'highlighter'].includes(el.type)) {
        const coalesced =
          typeof (e.nativeEvent as any).getCoalescedEvents === 'function'
            ? ((e.nativeEvent as any).getCoalescedEvents() as PointerEvent[])
            : [e.nativeEvent];

        const pts = el.points || [];
        let lastPt = pts[pts.length - 1];
        let hasNew = false;
        const now = performance.now();

        for (const ce of coalesced) {
          const cpt = screenToWorld(ce.clientX, ce.clientY);
          // Distance filter: discard micro-jitter (< 1.0 px)
          if (!lastPt || Math.hypot(cpt.x - lastPt.x, cpt.y - lastPt.y) >= 1.0) {
            const pressure = ce.pressure !== undefined && ce.pressure > 0 ? ce.pressure : 0.5;
            pts.push({ x: cpt.x, y: cpt.y, pressure, time: now });
            lastPt = cpt;
            hasNew = true;
          }
        }

        if (hasNew) {
          el.points = pts;
          renderActiveCanvas();
        }
      } else {
        // Shapes / Lines / Boxes
        const startX = startPointerRef.current.x;
        const startY = startPointerRef.current.y;
        let w = snap(worldPt.x) - startX;
        let h = snap(worldPt.y) - startY;

        // Holding Shift constrains 1:1 aspect ratio
        if (e.shiftKey && !['line', 'arrow', 'double_arrow', 'connector'].includes(el.type)) {
          const side = Math.max(Math.abs(w), Math.abs(h));
          w = w >= 0 ? side : -side;
          h = h >= 0 ? side : -side;
        }

        el.x = w < 0 ? startX + w : startX;
        el.y = h < 0 ? startY + h : startY;
        el.width = Math.abs(w);
        el.height = Math.abs(h);

        renderActiveCanvas();
      }
      return;
    }

    // Move Elements Mode
    if (interactionModeRef.current === 'move') {
      const dx = worldPt.x - startPointerRef.current.x;
      const dy = worldPt.y - startPointerRef.current.y;

      for (const snapEl of initialElementsSnapshotRef.current) {
        onUpdateElement(snapEl.id, {
          x: snap(snapEl.x + dx),
          y: snap(snapEl.y + dy),
        });
      }
      return;
    }

    // Resize Mode
    if (interactionModeRef.current === 'resize' && initialBoundsRef.current) {
      const initB = initialBoundsRef.current;
      const handle = activeHandleRef.current;
      const dx = worldPt.x - startPointerRef.current.x;
      const dy = worldPt.y - startPointerRef.current.y;

      let newW = initB.width;
      let newH = initB.height;
      let newX = initB.x;
      let newY = initB.y;

      if (handle?.includes('r')) newW = Math.max(20, initB.width + dx);
      if (handle?.includes('b')) newH = Math.max(20, initB.height + dy);
      if (handle?.includes('l')) {
        newW = Math.max(20, initB.width - dx);
        newX = initB.x + (initB.width - newW);
      }
      if (handle?.includes('t')) {
        newH = Math.max(20, initB.height - dy);
        newY = initB.y + (initB.height - newH);
      }

      // Scale factors
      const scaleX = newW / initB.width;
      const scaleY = newH / initB.height;

      for (const snapEl of initialElementsSnapshotRef.current) {
        const relX = (snapEl.x - initB.x) * scaleX;
        const relY = (snapEl.y - initB.y) * scaleY;
        onUpdateElement(snapEl.id, {
          x: newX + relX,
          y: newY + relY,
          width: Math.max(10, snapEl.width * scaleX),
          height: Math.max(10, snapEl.height * scaleY),
        });
      }
      return;
    }

    // Rotate Mode
    if (interactionModeRef.current === 'rotate' && initialBoundsRef.current) {
      const cx = initialBoundsRef.current.x + initialBoundsRef.current.width / 2;
      const cy = initialBoundsRef.current.y + initialBoundsRef.current.height / 2;
      const angleRad = Math.atan2(worldPt.y - cy, worldPt.x - cx);
      let angleDeg = Math.round((angleRad * 180) / Math.PI + 90);
      if (angleDeg < 0) angleDeg += 360;

      // Shift key snaps to 15 degrees increments
      if (e.shiftKey) {
        angleDeg = Math.round(angleDeg / 15) * 15;
      }

      for (const snapEl of initialElementsSnapshotRef.current) {
        onUpdateElement(snapEl.id, {
          rotation: angleDeg,
        });
      }
    }
  };

  const handlePointerUp = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    setIsPointerDown(false);

    if (e) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      activePointersRef.current.delete(e.pointerId);
    } else {
      activePointersRef.current.clear();
    }

    // Finalize drawing element
    if (interactionModeRef.current === 'draw' && activeDrawingElementRef.current) {
      const activeEl = activeDrawingElementRef.current;
      activeDrawingElementRef.current = null;

      if (['pencil', 'pen', 'highlighter'].includes(activeEl.type)) {
        if (activeEl.points && activeEl.points.length > 0) {
          activeEl.smoothingMode = smoothingMode;
          // Apply user-configured smoothing mode (off, low, medium, high)
          if (smoothingMode !== 'off') {
            activeEl.points = WhiteboardStroke.smoothPointsByMode(
              activeEl.points,
              isBeautifyEnabled ? 'high' : smoothingMode
            );
          }

          // Optional Smart Shape Recognition
          let convertedToShape = false;
          if (isSmartShapeEnabled && activeEl.points.length >= 8) {
            const recognized = WhiteboardStroke.recognizeShape(activeEl.points);
            if (recognized) {
              if (recognized.type === 'circle') {
                const shapeEl: WhiteboardElement = {
                  id: `el_shape_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                  type: 'circle',
                  x: recognized.bounds.x,
                  y: recognized.bounds.y,
                  width: Math.max(recognized.bounds.width, 14),
                  height: Math.max(recognized.bounds.height, 14),
                  strokeColor: activeEl.strokeColor,
                  strokeWidth: activeEl.strokeWidth,
                  fillColor: 'transparent',
                  opacity: activeEl.opacity,
                  zIndex: board.elements.length,
                };
                onAddElement(shapeEl);
                convertedToShape = true;
                if (onShapeRecognized) onShapeRecognized('circle');
              } else if (recognized.type === 'rectangle') {
                const shapeEl: WhiteboardElement = {
                  id: `el_shape_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                  type: 'rectangle',
                  x: recognized.bounds.x,
                  y: recognized.bounds.y,
                  width: Math.max(recognized.bounds.width, 14),
                  height: Math.max(recognized.bounds.height, 14),
                  strokeColor: activeEl.strokeColor,
                  strokeWidth: activeEl.strokeWidth,
                  fillColor: 'transparent',
                  opacity: activeEl.opacity,
                  zIndex: board.elements.length,
                };
                onAddElement(shapeEl);
                convertedToShape = true;
                if (onShapeRecognized) onShapeRecognized('rectangle');
              } else if (recognized.type === 'triangle') {
                const shapeEl: WhiteboardElement = {
                  id: `el_shape_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                  type: 'triangle',
                  x: recognized.bounds.x,
                  y: recognized.bounds.y,
                  width: Math.max(recognized.bounds.width, 14),
                  height: Math.max(recognized.bounds.height, 14),
                  strokeColor: activeEl.strokeColor,
                  strokeWidth: activeEl.strokeWidth,
                  fillColor: 'transparent',
                  opacity: activeEl.opacity,
                  zIndex: board.elements.length,
                };
                onAddElement(shapeEl);
                convertedToShape = true;
                if (onShapeRecognized) onShapeRecognized('triangle');
              } else if (recognized.type === 'line' && recognized.points) {
                const shapeEl: WhiteboardElement = {
                  id: `el_shape_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                  type: 'line',
                  x: recognized.points[0].x,
                  y: recognized.points[0].y,
                  width: recognized.points[1].x - recognized.points[0].x,
                  height: recognized.points[1].y - recognized.points[0].y,
                  strokeColor: activeEl.strokeColor,
                  strokeWidth: activeEl.strokeWidth,
                  opacity: activeEl.opacity,
                  zIndex: board.elements.length,
                };
                onAddElement(shapeEl);
                convertedToShape = true;
                if (onShapeRecognized) onShapeRecognized('line');
              }
            }
          }

          if (!convertedToShape) {
            const bounds = WhiteboardStroke.getStrokeBounds(activeEl);
            activeEl.x = bounds.x;
            activeEl.y = bounds.y;
            activeEl.width = bounds.width;
            activeEl.height = bounds.height;
            onAddElement(activeEl);
          }
        }
      } else {
        // Shapes / Lines / Arrows / Connectors / Frames
        const minSize = 4;
        if (Math.abs(activeEl.width) >= minSize || Math.abs(activeEl.height) >= minSize) {
          onAddElement(activeEl);
        }
      }
      renderCanvas();
      // NOTE: NEVER auto-select created drawings or shapes!
      // They remain unselected by default as expected in a professional whiteboard.
      if (onDrawingActiveChange) onDrawingActiveChange(false);
      if (onToolUsed) onToolUsed();
    }

    // Finalize Lasso Selection
    if (interactionModeRef.current === 'lasso' && lassoPointsRef.current) {
      const poly = lassoPointsRef.current;
      if (poly.length >= 3) {
        const captured = board.elements.filter((el) => {
          const b = WhiteboardRenderer.getSelectionBounds([el]);
          if (!b) return false;
          const center = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
          return (
            WhiteboardRenderer.isPointInPolygon(center, poly) ||
            WhiteboardRenderer.isPointInPolygon({ x: b.x, y: b.y }, poly) ||
            WhiteboardRenderer.isPointInPolygon({ x: b.x + b.width, y: b.y + b.height }, poly)
          );
        });
        onSelectElements(captured.map((e) => e.id));
      }
      lassoPointsRef.current = null;
      setLassoPoints(null);
      interactionModeRef.current = 'none';
      renderCanvas();
      if (onToolUsed) onToolUsed();
      return;
    }

    // Finalize Marquee Selection
    if (interactionModeRef.current === 'marquee' && marqueeBox) {
      const minX = Math.min(marqueeBox.start.x, marqueeBox.current.x);
      const maxX = Math.max(marqueeBox.start.x, marqueeBox.current.x);
      const minY = Math.min(marqueeBox.start.y, marqueeBox.current.y);
      const maxY = Math.max(marqueeBox.start.y, marqueeBox.current.y);

      const captured = board.elements.filter((el) => {
        const b = WhiteboardRenderer.getSelectionBounds([el]);
        if (!b) return false;
        return b.x >= minX && b.x + b.width <= maxX && b.y >= minY && b.y + b.height <= maxY;
      });

      onSelectElements(captured.map((e) => e.id));
      setMarqueeBox(null);
    }

    // Finalize Eraser Mode
    if (interactionModeRef.current === 'erase') {
      interactionModeRef.current = 'none';
      lastEraserPointRef.current = null;
      if (hasEraseChangedRef.current && workingElementsRef.current) {
        const finalElements = workingElementsRef.current;
        workingElementsRef.current = null;
        hasEraseChangedRef.current = false;
        if (onCommitElements) {
          onCommitElements(finalElements);
        } else {
          const currentIds = new Set(finalElements.map((e) => e.id));
          const deleted = board.elements.filter((e) => !currentIds.has(e.id)).map((e) => e.id);
          if (deleted.length > 0) onDeleteElements(deleted);
        }
      } else {
        workingElementsRef.current = null;
        hasEraseChangedRef.current = false;
      }
      renderCanvas();
      if (onDrawingActiveChange) onDrawingActiveChange(false);
      if (onToolUsed) onToolUsed();
      return;
    }

    interactionModeRef.current = 'none';
    activeHandleRef.current = null;
  };

  const eraseAlongSegment = useCallback(
    (p1: Point, p2: Point) => {
      if (!workingElementsRef.current) return;
      const currentElements = workingElementsRef.current;
      const eraserRadius = (eraserSize || 24) / 2;
      let modified = false;

      const nextElements: WhiteboardElement[] = [];

      for (const el of currentElements) {
        // Strict safety rule: Only unlocked freehand ink strokes are erasable.
        // Images, shapes, text, sticky notes, connectors, and frames MUST NEVER be deleted!
        if (!WhiteboardRenderer.isErasableElement(el)) {
          nextElements.push(el);
          continue;
        }

        if (eraserMode === 'stroke') {
          // Whole stroke erase mode
          if (WhiteboardStroke.isStrokeHitByEraser(el, p1, p2, eraserRadius)) {
            modified = true;
            // Stroke deleted
            continue;
          }
          nextElements.push(el);
        } else {
          // Precision segment-splitting mode
          const result = WhiteboardStroke.eraseStrokeSegment(el, p1, p2, eraserRadius);
          if (result === null) {
            // Stroke unaffected
            nextElements.push(el);
          } else {
            modified = true;
            for (const seg of result) {
              nextElements.push(seg);
            }
          }
        }
      }

      if (modified) {
        workingElementsRef.current = nextElements;
        hasEraseChangedRef.current = true;
      }
    },
    [eraserSize, eraserMode]
  );

  const handlePointerLeave = () => {
    eraserCursorPosRef.current = null;
    if (interactionModeRef.current === 'erase') {
      handlePointerUp();
    } else {
      renderCanvas();
    }
  };

  // -------------------------------------------------------------
  // Double Click: Edit Text or Sticky
  // -------------------------------------------------------------
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldPt = screenToWorld(e.clientX, e.clientY);
    const hitElement = [...board.elements]
      .reverse()
      .find((el) => WhiteboardRenderer.isPointInElement(worldPt, el));

    if (hitElement && (hitElement.type === 'text' || hitElement.type === 'sticky')) {
      onStartEditing(hitElement.id);
    } else if (!hitElement) {
      // Create new text element on double click
      const newEl: WhiteboardElement = {
        id: `el_txt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'text',
        x: snap(worldPt.x),
        y: snap(worldPt.y),
        width: 180,
        height: 36,
        strokeColor: currentStrokeColor,
        strokeWidth: 1,
        opacity: 1,
        zIndex: board.elements.length,
        text: '',
      };
      onAddElement(newEl);
      onSelectElements([]); // Remains unselected!
      onStartEditing(newEl.id);
      setEditingText('');
    }
  };

  // -------------------------------------------------------------
  // Context Menu Trigger
  // -------------------------------------------------------------
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const worldPt = screenToWorld(e.clientX, e.clientY);
    const hitElement = [...board.elements]
      .reverse()
      .find((el) => WhiteboardRenderer.isPointInElement(worldPt, el));

    if (hitElement && !selectedElementIds.includes(hitElement.id)) {
      onSelectElements([hitElement.id]);
    }

    onOpenContextMenu({
      x: e.clientX,
      y: e.clientY,
      worldX: worldPt.x,
      worldY: worldPt.y,
    });
  };

  // -------------------------------------------------------------
  // Drag & Drop Image directly onto Canvas
  // -------------------------------------------------------------
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const worldPt = screenToWorld(e.clientX, e.clientY);

    // 1. Check for PDF Files
    const pdfFiles = files.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (pdfFiles.length > 0 && onPdfFileDropped) {
      for (const pdf of pdfFiles) {
        onPdfFileDropped(pdf, worldPt);
      }
      return;
    }

    // 2. Check for Image Files
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      if (onImageFileDropped) {
        for (const img of imageFiles) {
          onImageFileDropped(img, worldPt);
        }
      } else {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            const dataUrl = loadEvent.target?.result as string;
            const img = new Image();
            img.onload = () => {
              const maxDim = 600;
              let w = img.naturalWidth;
              let h = img.naturalHeight;
              if (w > maxDim || h > maxDim) {
                const ratio = Math.min(maxDim / w, maxDim / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
              }

              const newEl: WhiteboardElement = {
                id: `el_img_${Date.now()}_${i}`,
                type: 'image',
                x: worldPt.x + i * 20,
                y: worldPt.y + i * 20,
                width: w,
                height: h,
                strokeColor: '#6366f1',
                strokeWidth: 0,
                opacity: 1,
                zIndex: board.elements.length + i,
                imageUrl: dataUrl,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
              };
              onAddElement(newEl);
            };
            img.src = dataUrl;
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // Calculate inline text editor position in screen space
  let editorStyle: React.CSSProperties | null = null;
  if (editingElement) {
    const screenPt = worldToScreen(editingElement.x, editingElement.y);
    editorStyle = {
      position: 'absolute',
      left: `${screenPt.x}px`,
      top: `${screenPt.y}px`,
      width: `${Math.max(editingElement.width * board.viewport.zoom, 180)}px`,
      minHeight: `${Math.max(editingElement.height * board.viewport.zoom, 40)}px`,
      transformOrigin: 'top left',
      zIndex: 60,
    };
  }

  // Cursor style based on active tool with professional Pen / Nib cursor
  let customCursorStyle: string | undefined = undefined;
  let cursorClass = 'cursor-default';

  if (activeTool === 'hand' || isSpacePressed) {
    cursorClass = isPointerDown ? 'cursor-grabbing' : 'cursor-grab';
  } else if (['pencil', 'pen', 'highlighter', 'eraser', 'lasso'].includes(activeTool)) {
    cursorClass = '';
    customCursorStyle = getWhiteboardCursorStyle({
      tool: activeTool,
      penStyle: currentPenStyle,
      cursorChoice: penCursorChoice,
      strokeColor: currentStrokeColor,
      strokeWidth: currentStrokeWidth,
      eraserSize: eraserSize,
      isDarkBackground: isDarkColor(board.backgroundColor),
    });
  } else if (activeTool === 'text') {
    cursorClass = 'cursor-text';
  } else if (['rectangle', 'circle', 'line', 'arrow', 'diamond', 'triangle', 'star', 'frame', 'measure'].includes(activeTool)) {
    cursorClass = 'cursor-crosshair';
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none touch-none bg-slate-900"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 1. Base Layer Canvas: Background grid, committed board elements, selection bounds */}
      <canvas
        ref={baseCanvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />

      {/* 2. Active Layer Canvas: Ultra-fast 0-latency ink, eraser target ring, transient overlays & pointer events */}
      <canvas
        ref={activeCanvasRef}
        className={`absolute inset-0 w-full h-full block ${cursorClass}`}
        style={customCursorStyle ? { cursor: customCursorStyle } : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      />

      {/* Floating Inline Text Editor */}
      {editingElement && editorStyle && (
        <div style={editorStyle}>
          <textarea
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onBlur={() => onFinishEditing(editingElement.id, editingText)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onFinishEditing(editingElement.id, editingText);
              }
            }}
            placeholder="Type text..."
            autoFocus
            className={`w-full h-full p-2 rounded-lg resize-none outline-none font-medium shadow-xl ${
              editingElement.type === 'sticky'
                ? 'bg-amber-100 text-slate-900 border-2 border-amber-400'
                : 'bg-slate-900/90 text-white border border-indigo-500/80 focus:ring-1 focus:ring-indigo-400'
            }`}
            style={{
              fontSize: `${Math.max(14, (editingElement.fontSize || 18) * board.viewport.zoom)}px`,
              lineHeight: 1.35,
            }}
          />
        </div>
      )}
    </div>
  );
};
