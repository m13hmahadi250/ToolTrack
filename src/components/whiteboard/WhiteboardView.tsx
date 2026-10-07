import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  WhiteboardBoard,
  WhiteboardElement,
  WhiteboardTool,
  GridType,
  StrokeStyle,
  FrameItem,
  PenStyle,
  SmoothingMode,
  PenCursorChoice,
  WhiteboardPdfDocument,
} from '../../types/whiteboard';
import {
  convertPdfToWhiteboardElements,
  exportAnnotatedPdfDocument,
} from '../../lib/whiteboardPdf';
import {
  createDefaultBoard,
  saveBoardToStorage,
  getBoardFromStorage,
  getAllBoards,
  deleteBoardFromStorage,
  getActiveBoardId,
  setActiveBoardId,
} from '../../lib/whiteboardStorage';
import { WhiteboardRenderer, isDarkColor } from '../../lib/whiteboardRenderer';
import { exportWhiteboard, triggerFileDownload, ExportFormat, ExportQuality } from '../../lib/whiteboardExport';
import { BoardTemplate } from '../../lib/whiteboardTemplates';
import { WhiteboardCanvas } from './WhiteboardCanvas';
import { WhiteboardToolbar } from './WhiteboardToolbar';
import { WhiteboardHeader } from './WhiteboardHeader';
import { WhiteboardPropertiesPanel } from './WhiteboardPropertiesPanel';
import { WhiteboardBottomBar } from './WhiteboardBottomBar';
import { WhiteboardShortcutsModal } from './WhiteboardShortcutsModal';
import { WhiteboardTemplatesModal } from './WhiteboardTemplatesModal';
import { WhiteboardSearchModal } from './WhiteboardSearchModal';
import { WhiteboardContextMenu } from './WhiteboardContextMenu';
import { useToolTrack } from '../../context/ToolTrackContext';

export const WhiteboardView: React.FC = () => {
  const { setActiveToolId } = useToolTrack();

  // Active Board State
  const [board, setBoard] = useState<WhiteboardBoard>(() => createDefaultBoard());
  const [allBoards, setAllBoards] = useState<WhiteboardBoard[]>([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);

  // Undo / Redo History Stack (Max 30 states)
  const historyRef = useRef<{ past: WhiteboardBoard[]; future: WhiteboardBoard[] }>({
    past: [],
    future: [],
  });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Active Tool & Selection State
  const [activeTool, setActiveTool] = useState<WhiteboardTool>('select');
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [clipboardElements, setClipboardElements] = useState<WhiteboardElement[]>([]);

  // Current Creation Properties
  const [currentStrokeColor, setCurrentStrokeColor] = useState<string>('#ffffff');
  const [isAutoContrastColor, setIsAutoContrastColor] = useState<boolean>(true);
  const [currentFillColor, setCurrentFillColor] = useState<string>('transparent');
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState<number>(3);
  const [currentStrokeStyle, setCurrentStrokeStyle] = useState<StrokeStyle>('solid');
  const [currentOpacity, setCurrentOpacity] = useState<number>(1);
  const [currentPenStyle, setCurrentPenStyle] = useState<PenStyle>('fountain');
  const [penCursorChoice, setPenCursorChoice] = useState<PenCursorChoice>('auto');
  const [smoothingMode, setSmoothingMode] = useState<SmoothingMode>('smooth');
  const [isBeautifyEnabled, setIsBeautifyEnabled] = useState<boolean>(false);
  const [isSmartShapeEnabled, setIsSmartShapeEnabled] = useState<boolean>(false);
  const [eraserSize, setEraserSize] = useState<number>(24);
  const [eraserMode, setEraserMode] = useState<'precision' | 'stroke'>('precision');

  // Auto-hide UI during active drawing/erasing (distraction-free mode)
  const [isDrawingActive, setIsDrawingActive] = useState<boolean>(false);
  const drawingRestoreTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDrawingActiveChange = useCallback((active: boolean) => {
    if (active) {
      if (drawingRestoreTimerRef.current) {
        clearTimeout(drawingRestoreTimerRef.current);
        drawingRestoreTimerRef.current = null;
      }
      setIsDrawingActive(true);
    } else {
      if (drawingRestoreTimerRef.current) {
        clearTimeout(drawingRestoreTimerRef.current);
      }
      // Smooth restoration after 800ms idle following stroke completion
      drawingRestoreTimerRef.current = setTimeout(() => {
        setIsDrawingActive(false);
        drawingRestoreTimerRef.current = null;
      }, 800);
    }
  }, []);

  // Cleanup drawing restore timer on unmount
  useEffect(() => {
    return () => {
      if (drawingRestoreTimerRef.current) {
        clearTimeout(drawingRestoreTimerRef.current);
      }
    };
  }, []);

  // Smart reveal: If user moves cursor toward top header (< 68px) or bottom toolbar (> innerHeight - 84px),
  // immediately reveal controls
  useEffect(() => {
    if (!isDrawingActive) return;

    const handleProximityMove = (e: MouseEvent) => {
      if (e.clientY < 68 || e.clientY > window.innerHeight - 84) {
        if (drawingRestoreTimerRef.current) {
          clearTimeout(drawingRestoreTimerRef.current);
          drawingRestoreTimerRef.current = null;
        }
        setIsDrawingActive(false);
      }
    };

    window.addEventListener('pointermove', handleProximityMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleProximityMove);
  }, [isDrawingActive]);

  // Modals & Context Menus
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    worldX: number;
    worldY: number;
  } | null>(null);

  // Autosave State
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hidden file input for image upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // History Record Helper (Fast, Low-Memory Cloning)
  // -------------------------------------------------------------
  const recordHistory = useCallback(
    (newBoard: WhiteboardBoard) => {
      historyRef.current.past.push({
        ...board,
        viewport: { ...board.viewport },
        elements: board.elements.map((el) => ({ ...el })),
        frames: board.frames ? board.frames.map((f) => ({ ...f })) : [],
      });
      if (historyRef.current.past.length > 30) {
        historyRef.current.past.shift();
      }
      historyRef.current.future = [];
      setCanUndo(true);
      setCanRedo(false);
      setBoard(newBoard);
    },
    [board]
  );

  // -------------------------------------------------------------
  // Smart Pen Color Contrast Based on Canvas Background
  // -------------------------------------------------------------
  useEffect(() => {
    if (isAutoContrastColor) {
      const isDark = isDarkColor(board.backgroundColor);
      setCurrentStrokeColor(isDark ? '#ffffff' : '#0f172a');
    }
  }, [board.backgroundColor, isAutoContrastColor]);

  // -------------------------------------------------------------
  // Load Saved Boards on Mount
  // -------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    async function initBoards() {
      try {
        const storedBoards = await getAllBoards();
        if (!isMounted) return;

        if (storedBoards.length > 0) {
          setAllBoards(storedBoards);
          const activeId = getActiveBoardId();
          const target = storedBoards.find((b) => b.id === activeId) || storedBoards[0];
          setBoard(target);
        } else {
          // Initialize first default board
          const initial = createDefaultBoard('My First Whiteboard');
          setBoard(initial);
          setAllBoards([initial]);
          await saveBoardToStorage(initial);
        }
      } catch (err) {
        console.error('Failed to initialize boards:', err);
      }
    }
    initBoards();
    return () => {
      isMounted = false;
    };
  }, []);

  // -------------------------------------------------------------
  // Debounced Autosave to IndexedDB
  // -------------------------------------------------------------
  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    setSaveStatus('saving');
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        await saveBoardToStorage(board);
        setSaveStatus('saved');
        const now = new Date();
        setLastSavedTime(
          now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );

        // Update allBoards list in memory
        setAllBoards((prev) => {
          const idx = prev.findIndex((b) => b.id === board.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = board;
            return next;
          }
          return [board, ...prev];
        });
      } catch {
        setSaveStatus('error');
      }
    }, 600);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [board]);

  // -------------------------------------------------------------
  // Frame List Sync
  // -------------------------------------------------------------
  const frames: FrameItem[] = board.elements
    .filter((el) => el.type === 'frame')
    .map((el) => ({
      id: el.id,
      title: el.frameTitle || 'Frame',
      elementId: el.id,
    }));

  // -------------------------------------------------------------
  // Board Operations
  // -------------------------------------------------------------
  const handleCreateNewBoard = async () => {
    const newBoard = createDefaultBoard(`Whiteboard ${allBoards.length + 1}`);
    await saveBoardToStorage(newBoard);
    setActiveBoardId(newBoard.id);
    setBoard(newBoard);
    setAllBoards((prev) => [newBoard, ...prev]);
    setSelectedElementIds([]);
    historyRef.current = { past: [], future: [] };
    setCanUndo(false);
    setCanRedo(false);
  };

  const handleSelectBoard = async (id: string) => {
    const loaded = await getBoardFromStorage(id);
    if (loaded) {
      setActiveBoardId(loaded.id);
      setBoard(loaded);
      setSelectedElementIds([]);
      historyRef.current = { past: [], future: [] };
      setCanUndo(false);
      setCanRedo(false);
    }
  };

  const handleDuplicateBoard = async () => {
    const duplicated: WhiteboardBoard = {
      ...board,
      id: `board_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: `${board.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveBoardToStorage(duplicated);
    setBoard(duplicated);
    setAllBoards((prev) => [duplicated, ...prev]);
  };

  const handleDeleteBoard = async () => {
    if (allBoards.length <= 1) return;
    await deleteBoardFromStorage(board.id);
    const remaining = allBoards.filter((b) => b.id !== board.id);
    setAllBoards(remaining);
    if (remaining.length > 0) {
      await handleSelectBoard(remaining[0].id);
    }
  };

  const handleRenameBoard = (newTitle: string) => {
    setBoard((prev) => ({ ...prev, title: newTitle }));
  };

  // -------------------------------------------------------------
  // Undo & Redo Handlers
  // -------------------------------------------------------------
  const handleUndo = useCallback(() => {
    if (historyRef.current.past.length === 0) return;
    const prev = historyRef.current.past.pop()!;
    historyRef.current.future.push(JSON.parse(JSON.stringify(board)));
    setCanUndo(historyRef.current.past.length > 0);
    setCanRedo(true);
    setBoard(prev);
    setSelectedElementIds([]);
  }, [board]);

  const handleRedo = useCallback(() => {
    if (historyRef.current.future.length === 0) return;
    const next = historyRef.current.future.pop()!;
    historyRef.current.past.push(JSON.parse(JSON.stringify(board)));
    setCanUndo(true);
    setCanRedo(historyRef.current.future.length > 0);
    setBoard(next);
    setSelectedElementIds([]);
  }, [board]);

  // -------------------------------------------------------------
  // Element Manipulation
  // -------------------------------------------------------------
  const handleAddElement = useCallback(
    (el: WhiteboardElement) => {
      recordHistory({
        ...board,
        elements: [...board.elements, el],
      });
    },
    [board, recordHistory]
  );

  const handleUpdateElement = useCallback(
    (id: string, updates: Partial<WhiteboardElement>) => {
      setBoard((prev) => ({
        ...prev,
        elements: prev.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
      }));
    },
    []
  );

  const handleUpdateSelected = useCallback(
    (updates: Partial<WhiteboardElement>) => {
      recordHistory({
        ...board,
        elements: board.elements.map((el) =>
          selectedElementIds.includes(el.id) ? { ...el, ...updates } : el
        ),
      });
    },
    [board, selectedElementIds, recordHistory]
  );

  const handleDeleteElements = useCallback(
    (ids: string[]) => {
      recordHistory({
        ...board,
        elements: board.elements.filter((el) => !ids.includes(el.id)),
      });
      setSelectedElementIds((prev) => prev.filter((id) => !ids.includes(id)));
    },
    [board, recordHistory]
  );

  const handleCommitElements = useCallback(
    (newElements: WhiteboardElement[]) => {
      recordHistory({
        ...board,
        elements: newElements,
      });
      setSelectedElementIds((prev) => prev.filter((id) => newElements.some((el) => el.id === id)));
    },
    [board, recordHistory]
  );

  const handleClearAllInk = useCallback(() => {
    const nonInkElements = board.elements.filter((el) => !WhiteboardRenderer.isErasableElement(el));
    if (nonInkElements.length === board.elements.length) return;
    recordHistory({
      ...board,
      elements: nonInkElements,
    });
    setSelectedElementIds((prev) => prev.filter((id) => nonInkElements.some((el) => el.id === id)));
  }, [board, recordHistory]);

  const handleDuplicateSelected = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const targets = board.elements.filter((el) => selectedElementIds.includes(el.id));
    const newElements: WhiteboardElement[] = targets.map((el) => ({
      ...JSON.parse(JSON.stringify(el)),
      id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      x: el.x + 24,
      y: el.y + 24,
      zIndex: board.elements.length + 1,
    }));

    recordHistory({
      ...board,
      elements: [...board.elements, ...newElements],
    });
    setSelectedElementIds(newElements.map((e) => e.id));
  }, [board, selectedElementIds, recordHistory]);

  const handleCopySelected = useCallback(() => {
    const targets = board.elements.filter((el) => selectedElementIds.includes(el.id));
    if (targets.length > 0) {
      setClipboardElements(JSON.parse(JSON.stringify(targets)));
    }
  }, [board, selectedElementIds]);

  const handleCutSelected = useCallback(() => {
    handleCopySelected();
    handleDeleteElements(selectedElementIds);
  }, [handleCopySelected, handleDeleteElements, selectedElementIds]);

  const handlePaste = useCallback(() => {
    if (clipboardElements.length === 0) return;
    const pasted = clipboardElements.map((el) => ({
      ...JSON.parse(JSON.stringify(el)),
      id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      x: el.x + 30,
      y: el.y + 30,
      zIndex: board.elements.length + 1,
    }));

    recordHistory({
      ...board,
      elements: [...board.elements, ...pasted],
    });
    setSelectedElementIds(pasted.map((e) => e.id));
  }, [board, clipboardElements, recordHistory]);

  const handleLockToggle = useCallback(() => {
    const isLocked = board.elements.some((el) => selectedElementIds.includes(el.id) && el.locked);
    handleUpdateSelected({ locked: !isLocked });
  }, [board, selectedElementIds, handleUpdateSelected]);

  const handleLayerChange = useCallback(
    (action: 'front' | 'forward' | 'backward' | 'back') => {
      if (selectedElementIds.length === 0) return;
      const elements = [...board.elements];
      elements.sort((a, b) => a.zIndex - b.zIndex);

      const selectedIdxs = elements
        .map((el, i) => (selectedElementIds.includes(el.id) ? i : -1))
        .filter((i) => i !== -1);

      if (action === 'front') {
        let maxZ = Math.max(...elements.map((e) => e.zIndex), 0);
        for (const idx of selectedIdxs) {
          maxZ += 1;
          elements[idx].zIndex = maxZ;
        }
      } else if (action === 'back') {
        let minZ = Math.min(...elements.map((e) => e.zIndex), 0);
        for (const idx of selectedIdxs) {
          minZ -= 1;
          elements[idx].zIndex = minZ;
        }
      } else if (action === 'forward') {
        for (const idx of selectedIdxs) {
          elements[idx].zIndex += 1;
        }
      } else if (action === 'backward') {
        for (const idx of selectedIdxs) {
          elements[idx].zIndex -= 1;
        }
      }

      recordHistory({ ...board, elements });
    },
    [board, selectedElementIds, recordHistory]
  );

  const handleGroupToggle = useCallback(() => {
    if (selectedElementIds.length <= 1) return;
    const hasGroup = board.elements.some((el) => selectedElementIds.includes(el.id) && el.groupId);

    if (hasGroup) {
      // Ungroup
      handleUpdateSelected({ groupId: undefined });
    } else {
      // Group
      const newGroupId = `group_${Date.now()}`;
      handleUpdateSelected({ groupId: newGroupId });
    }
  }, [board, selectedElementIds, handleUpdateSelected]);

  const handleAlign = useCallback(
    (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      const selected = board.elements.filter((el) => selectedElementIds.includes(el.id));
      if (selected.length < 2) return;
      const bounds = WhiteboardRenderer.getSelectionBounds(selected);
      if (!bounds) return;

      const updated = board.elements.map((el) => {
        if (!selectedElementIds.includes(el.id)) return el;
        let newX = el.x;
        let newY = el.y;

        if (alignment === 'left') newX = bounds.x;
        if (alignment === 'center') newX = bounds.x + (bounds.width - el.width) / 2;
        if (alignment === 'right') newX = bounds.x + bounds.width - el.width;
        if (alignment === 'top') newY = bounds.y;
        if (alignment === 'middle') newY = bounds.y + (bounds.height - el.height) / 2;
        if (alignment === 'bottom') newY = bounds.y + bounds.height - el.height;

        return { ...el, x: Math.round(newX), y: Math.round(newY) };
      });

      recordHistory({ ...board, elements: updated });
    },
    [board, selectedElementIds, recordHistory]
  );

  const handleDistribute = useCallback(
    (axis: 'h' | 'v') => {
      const selected = board.elements.filter((el) => selectedElementIds.includes(el.id));
      if (selected.length < 3) return;

      if (axis === 'h') {
        const sorted = [...selected].sort((a, b) => a.x - b.x);
        const minX = sorted[0].x;
        const maxX = sorted[sorted.length - 1].x;
        const totalW = sorted.reduce((sum, el) => sum + el.width, 0) - sorted[sorted.length - 1].width;
        const space = (maxX - minX - totalW) / (sorted.length - 1);

        let currX = minX;
        const posMap = new Map<string, number>();
        for (const el of sorted) {
          posMap.set(el.id, currX);
          currX += el.width + space;
        }

        const updated = board.elements.map((el) => {
          if (posMap.has(el.id)) {
            return { ...el, x: Math.round(posMap.get(el.id)!) };
          }
          return el;
        });
        recordHistory({ ...board, elements: updated });
      } else {
        const sorted = [...selected].sort((a, b) => a.y - b.y);
        const minY = sorted[0].y;
        const maxY = sorted[sorted.length - 1].y;
        const totalH = sorted.reduce((sum, el) => sum + el.height, 0) - sorted[sorted.length - 1].height;
        const space = (maxY - minY - totalH) / (sorted.length - 1);

        let currY = minY;
        const posMap = new Map<string, number>();
        for (const el of sorted) {
          posMap.set(el.id, currY);
          currY += el.height + space;
        }

        const updated = board.elements.map((el) => {
          if (posMap.has(el.id)) {
            return { ...el, y: Math.round(posMap.get(el.id)!) };
          }
          return el;
        });
        recordHistory({ ...board, elements: updated });
      }
    },
    [board, selectedElementIds, recordHistory]
  );

  // -------------------------------------------------------------
  // Zoom & Viewport Controls
  // -------------------------------------------------------------
  const handleZoomIn = () => {
    setBoard((prev) => ({
      ...prev,
      viewport: {
        ...prev.viewport,
        zoom: Math.round(Math.min(prev.viewport.zoom * 1.25, 10.0) * 1000) / 1000,
      },
    }));
  };

  const handleZoomOut = () => {
    setBoard((prev) => ({
      ...prev,
      viewport: {
        ...prev.viewport,
        zoom: Math.round(Math.max(prev.viewport.zoom * 0.8, 0.05) * 1000) / 1000,
      },
    }));
  };

  const handleResetZoom = () => {
    setBoard((prev) => ({
      ...prev,
      viewport: { ...prev.viewport, zoom: 1 },
    }));
  };

  const handleFitToContent = () => {
    if (board.elements.length === 0) {
      setBoard((prev) => ({
        ...prev,
        viewport: { x: 0, y: 0, zoom: 1 },
      }));
      return;
    }

    const bounds = WhiteboardRenderer.getSelectionBounds(board.elements);
    if (!bounds) return;

    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const padding = 100;
    const scaleX = (winW - padding * 2) / bounds.width;
    const scaleY = (winH - padding * 2) / bounds.height;
    const zoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.2), 2.0);

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    setBoard((prev) => ({
      ...prev,
      viewport: {
        x: winW / 2 - centerX * zoom,
        y: winH / 2 - centerY * zoom,
        zoom,
      },
    }));
  };

  const handleFocusElement = (el: WhiteboardElement) => {
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const zoom = Math.max(board.viewport.zoom, 1);
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;

    setBoard((prev) => ({
      ...prev,
      viewport: {
        x: winW / 2 - cx * zoom,
        y: winH / 2 - cy * zoom,
        zoom,
      },
    }));
    setSelectedElementIds([el.id]);
  };

  const handleNavigateFrame = (direction: 'prev' | 'next') => {
    if (frames.length === 0) return;
    const newIdx = direction === 'next' ? activeFrameIndex + 1 : activeFrameIndex - 1;
    if (newIdx >= 0 && newIdx < frames.length) {
      setActiveFrameIndex(newIdx);
      const frameEl = board.elements.find((el) => el.id === frames[newIdx].elementId);
      if (frameEl) {
        handleFocusElement(frameEl);
      }
    }
  };

  // -------------------------------------------------------------
  // Navigation Back to ToolTrack
  // -------------------------------------------------------------
  const handleBackToToolTrack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
    setActiveToolId(null);
  };

  // -------------------------------------------------------------
  // PDF Document Import & Management Handlers
  // -------------------------------------------------------------
  const handlePdfUpload = useCallback(
    async (file: File | Blob, position?: { startX?: number; startY?: number }) => {
      try {
        setSaveStatus('saving');
        const fileName = file instanceof File ? file.name : 'Document.pdf';

        const existingPdfPages = board.elements.filter((el) => el.type === 'image' && el.pdfDocumentId);
        let startX = position?.startX;
        let startY = position?.startY;

        if (startX === undefined || startY === undefined) {
          if (existingPdfPages.length > 0) {
            // Place next to existing PDF so multiple documents sit side-by-side cleanly
            const maxRight = Math.max(...existingPdfPages.map((p) => p.x + p.width));
            startX = maxRight + 80;
            startY = 80;
          } else {
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            const targetW = 740;
            startX = Math.round((-board.viewport.x + winW / 2) / board.viewport.zoom - targetW / 2);
            startY = Math.round((-board.viewport.y + winH / 2) / board.viewport.zoom - 300);
          }
        }

        const result = await convertPdfToWhiteboardElements(file, {
          name: fileName,
          startX,
          startY,
          existingElementCount: board.elements.length,
          pageWidth: 740,
          pageGap: 40,
        });

        const newDoc: WhiteboardPdfDocument = {
          id: result.documentId,
          title: result.documentTitle,
          totalPages: result.totalPages,
          pageElementIds: result.elements.map((e) => e.id),
          createdAt: Date.now(),
        };

        const updatedElements = [...board.elements, ...result.elements];
        const updatedDocs = [...(board.pdfDocuments || []), newDoc];

        const nextBoard: WhiteboardBoard = {
          ...board,
          elements: updatedElements,
          pdfDocuments: updatedDocs,
        };

        recordHistory(nextBoard);
        setBoard(nextBoard);
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

        if (result.elements.length > 0) {
          setSelectedElementIds([result.elements[0].id]);
        }
      } catch (err) {
        console.error('Failed to parse or render PDF:', err);
        setSaveStatus('error');
      }
    },
    [board, recordHistory]
  );

  const insertPastedText = useCallback(
    (text: string) => {
      const centerWorldX = (-board.viewport.x + window.innerWidth / 2) / board.viewport.zoom - 100;
      const centerWorldY = (-board.viewport.y + window.innerHeight / 2) / board.viewport.zoom - 20;

      const lines = text.split('\n');
      const maxLineLen = Math.max(...lines.map((l) => l.length), 1);
      const estWidth = Math.max(140, Math.min(maxLineLen * 11 + 24, 700));
      const estHeight = Math.max(36, lines.length * 26 + 10);

      const newEl: WhiteboardElement = {
        id: `el_txt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'text',
        x: Math.round(centerWorldX),
        y: Math.round(centerWorldY),
        width: estWidth,
        height: estHeight,
        strokeColor: currentStrokeColor,
        strokeWidth: 1,
        opacity: 1,
        zIndex: board.elements.length + 1,
        text,
      };

      handleAddElement(newEl);
    },
    [board.viewport, board.elements.length, currentStrokeColor, handleAddElement]
  );

  const handleRotatePdfPage = useCallback(
    (pageEl: WhiteboardElement) => {
      const nextRot = ((pageEl.rotation || 0) + 90) % 360;
      handleUpdateElement(pageEl.id, { rotation: nextRot });
    },
    [handleUpdateElement]
  );

  const handleDuplicatePdfPage = useCallback(
    (pageEl: WhiteboardElement) => {
      if (!pageEl.pdfDocumentId) return;
      const docId = pageEl.pdfDocumentId;
      const curNum = pageEl.pdfPageNumber || 1;
      const shiftY = pageEl.height + 40;

      const updated = board.elements.map((el) => {
        if (el.pdfDocumentId === docId && (el.pdfPageNumber || 0) > curNum) {
          return {
            ...el,
            y: el.y + shiftY,
            pdfPageNumber: (el.pdfPageNumber || 0) + 1,
            pdfTotalPages: (el.pdfTotalPages || 1) + 1,
          };
        }
        if (el.pdfDocumentId === docId) {
          return { ...el, pdfTotalPages: (el.pdfTotalPages || 1) + 1 };
        }
        return el;
      });

      const copyPage: WhiteboardElement = {
        ...pageEl,
        id: `el_pdf_${docId}_p${curNum}_copy_${Date.now()}`,
        y: pageEl.y + shiftY,
        pdfPageNumber: curNum + 1,
        pdfTotalPages: (pageEl.pdfTotalPages || 1) + 1,
        zIndex: board.elements.length + 1,
      };

      updated.push(copyPage);
      const nextBoard: WhiteboardBoard = { ...board, elements: updated };
      recordHistory(nextBoard);
      setBoard(nextBoard);
      setSelectedElementIds([copyPage.id]);
    },
    [board, recordHistory]
  );

  const handleDeletePdfPage = useCallback(
    (pageEl: WhiteboardElement) => {
      if (!pageEl.pdfDocumentId) {
        handleDeleteElements([pageEl.id]);
        return;
      }
      const docId = pageEl.pdfDocumentId;
      const curNum = pageEl.pdfPageNumber || 1;
      const shiftY = pageEl.height + 40;

      const updated = board.elements
        .filter((el) => el.id !== pageEl.id)
        .map((el) => {
          if (el.pdfDocumentId === docId && (el.pdfPageNumber || 0) > curNum) {
            return {
              ...el,
              y: Math.max(10, el.y - shiftY),
              pdfPageNumber: (el.pdfPageNumber || 0) - 1,
              pdfTotalPages: Math.max(1, (el.pdfTotalPages || 1) - 1),
            };
          }
          if (el.pdfDocumentId === docId) {
            return {
              ...el,
              pdfTotalPages: Math.max(1, (el.pdfTotalPages || 1) - 1),
            };
          }
          return el;
        });

      const nextBoard: WhiteboardBoard = { ...board, elements: updated };
      recordHistory(nextBoard);
      setBoard(nextBoard);
      setSelectedElementIds([]);
    },
    [board, handleDeleteElements, recordHistory]
  );

  const handleMovePdfPage = useCallback(
    (pageEl: WhiteboardElement, direction: 'up' | 'down') => {
      if (!pageEl.pdfDocumentId) return;
      const docId = pageEl.pdfDocumentId;
      const curNum = pageEl.pdfPageNumber || 1;
      const targetNum = direction === 'up' ? curNum - 1 : curNum + 1;

      const targetSibling = board.elements.find(
        (el) => el.pdfDocumentId === docId && el.pdfPageNumber === targetNum
      );
      if (!targetSibling) return;

      const curY = pageEl.y;
      const siblingY = targetSibling.y;

      const updated = board.elements.map((el) => {
        if (el.id === pageEl.id) {
          return { ...el, y: siblingY, pdfPageNumber: targetNum };
        }
        if (el.id === targetSibling.id) {
          return { ...el, y: curY, pdfPageNumber: curNum };
        }
        return el;
      });

      const nextBoard: WhiteboardBoard = { ...board, elements: updated };
      recordHistory(nextBoard);
      setBoard(nextBoard);
    },
    [board, recordHistory]
  );

  const handleNavigatePdfPage = useCallback(
    (docId: string, currentNum: number, dir: 'prev' | 'next') => {
      const targetNum = dir === 'next' ? currentNum + 1 : currentNum - 1;
      const targetPage = board.elements.find(
        (el) => el.pdfDocumentId === docId && el.pdfPageNumber === targetNum
      );
      if (targetPage) {
        handleFocusElement(targetPage);
      }
    },
    [board.elements, handleFocusElement]
  );

  const handleRemovePdfDocument = useCallback(
    (docId: string) => {
      const docPages = board.elements.filter((el) => el.pdfDocumentId === docId);
      if (docPages.length === 0) return;

      const pageBoundsList = docPages.map((p) => ({
        x: p.x,
        y: p.y,
        r: p.x + p.width,
        b: p.y + p.height,
        z: p.zIndex,
      }));

      const isOverDoc = (el: WhiteboardElement) => {
        if (el.pdfDocumentId === docId) return true;
        const b = WhiteboardRenderer.getSelectionBounds([el]);
        if (!b) return false;
        return pageBoundsList.some(
          (pb) =>
            el.zIndex > pb.z &&
            b.x + b.width > pb.x &&
            b.x < pb.r &&
            b.y + b.height > pb.y &&
            b.y < pb.b
        );
      };

      const remaining = board.elements.filter((el) => !isOverDoc(el));
      const remainingDocs = (board.pdfDocuments || []).filter((d) => d.id !== docId);

      const nextBoard: WhiteboardBoard = {
        ...board,
        elements: remaining,
        pdfDocuments: remainingDocs,
      };

      recordHistory(nextBoard);
      setBoard(nextBoard);
      setSelectedElementIds([]);
    },
    [board, recordHistory]
  );

  const handleExportAnnotatedPdf = useCallback(
    async (targetDocId?: string) => {
      const allPdfPages = board.elements.filter((el) => el.type === 'image' && el.pdfDocumentId);
      if (allPdfPages.length === 0) return;

      const docIdToExport = targetDocId || allPdfPages[0].pdfDocumentId!;
      try {
        setSaveStatus('saving');
        const { blob, fileName } = await exportAnnotatedPdfDocument(
          docIdToExport,
          board.elements,
          board.backgroundColor
        );

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to export annotated PDF:', err);
        setSaveStatus('error');
      }
    },
    [board.elements, board.backgroundColor]
  );

  // -------------------------------------------------------------
  // Clipboard Paste (Images, PDFs, Text, and Elements)
  // -------------------------------------------------------------
  const insertImageUrl = useCallback(
    (dataUrl: string) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800; // High resolution
        let w = img.naturalWidth || 400;
        let h = img.naturalHeight || 300;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        // Place near center of viewport
        const centerWorldX = (-board.viewport.x + window.innerWidth / 2) / board.viewport.zoom - w / 2;
        const centerWorldY = (-board.viewport.y + window.innerHeight / 2) / board.viewport.zoom - h / 2;

        const newEl: WhiteboardElement = {
          id: `el_img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          type: 'image',
          x: Math.round(centerWorldX),
          y: Math.round(centerWorldY),
          width: w,
          height: h,
          strokeColor: '#6366f1',
          strokeWidth: 0,
          opacity: 1,
          zIndex: board.elements.length + 1,
          imageUrl: dataUrl,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        };

        handleAddElement(newEl);
        // Pasted images remain unselected by default
      };
      img.onerror = () => {
        console.error('Failed to decode pasted image data');
      };
      img.src = dataUrl;
    },
    [board.viewport, board.elements.length, handleAddElement]
  );

  const insertImageBlob = useCallback(
    (blob: Blob | File) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const dataUrl = loadEvt.target?.result as string;
        if (dataUrl) {
          insertImageUrl(dataUrl);
        }
      };
      reader.readAsDataURL(blob);
    },
    [insertImageUrl]
  );

  useEffect(() => {
    const handlePasteEvent = async (e: ClipboardEvent) => {
      // Don't intercept if editing inside a text input or textarea
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      // 1. Check for PDF in clipboard files / items
      let pdfFile: File | null = null;
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          const file = e.clipboardData.files[i];
          if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            pdfFile = file;
            break;
          }
        }
      }
      if (!pdfFile && e.clipboardData?.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type === 'application/pdf') {
            const f = item.getAsFile();
            if (f) {
              pdfFile = f;
              break;
            }
          }
        }
      }

      if (pdfFile) {
        e.preventDefault();
        handlePdfUpload(pdfFile);
        return;
      }

      // 2. Check for image files / clipboard images
      let imageBlob: Blob | File | null = null;
      if (e.clipboardData?.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              imageBlob = file;
              break;
            }
          }
        }
      }

      if (!imageBlob && e.clipboardData?.files && e.clipboardData.files.length > 0) {
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          const file = e.clipboardData.files[i];
          if (file.type.startsWith('image/')) {
            imageBlob = file;
            break;
          }
        }
      }

      if (imageBlob) {
        e.preventDefault();
        insertImageBlob(imageBlob);
        return;
      }

      // 3. Check if html contains <img src="..."> tag
      const html = e.clipboardData?.getData('text/html');
      if (html) {
        const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (match && match[1] && (match[1].startsWith('data:image/') || match[1].startsWith('http') || match[1].startsWith('blob:'))) {
          e.preventDefault();
          insertImageUrl(match[1]);
          return;
        }
      }

      // 4. Check if we have internal copied board elements
      if (clipboardElements.length > 0) {
        e.preventDefault();
        handlePaste();
        return;
      }

      // 5. Check if clipboard contains plain text and paste as text element
      const plainText = e.clipboardData?.getData('text/plain');
      if (plainText && plainText.trim()) {
        e.preventDefault();
        insertPastedText(plainText.trim());
        return;
      }
    };

    window.addEventListener('paste', handlePasteEvent);
    return () => window.removeEventListener('paste', handlePasteEvent);
  }, [insertImageBlob, insertImageUrl, clipboardElements, handlePaste, handlePdfUpload, insertPastedText]);

  // -------------------------------------------------------------
  // Keyboard Shortcuts (Undo, Redo, Copy, Delete, Tools)
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger tools if typing in input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
          return;
        }
        if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          handleRedo();
          return;
        }
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          handleCopySelected();
          return;
        }
        if (e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          handleCutSelected();
          return;
        }
        if (e.key === 'v' || e.key === 'V') {
          // Do NOT preventDefault! Allow native paste event to fire for image and clipboard handling!
          return;
        }
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          handleDuplicateSelected();
          return;
        }
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          setSelectedElementIds(board.elements.map((el) => el.id));
          return;
        }
        if (e.key === '0') {
          e.preventDefault();
          handleResetZoom();
          return;
        }
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoomIn();
          return;
        }
        if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
          return;
        }
      }

      // Single Key Tool Shortcuts
      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 'h':
          setActiveTool('hand');
          break;
        case 'p':
          setActiveTool('pen');
          break;
        case 'e':
          setActiveTool('eraser');
          break;
        case 't':
          setActiveTool('text');
          break;
        case 's':
          setActiveTool('sticky');
          break;
        case 'r':
          setActiveTool('rectangle');
          break;
        case 'o':
          setActiveTool('circle');
          break;
        case 'l':
          setActiveTool('line');
          break;
        case 'a':
          setActiveTool('arrow');
          break;
        case 'c':
          setActiveTool('connector');
          break;
        case 'f':
          setActiveTool('frame');
          break;
        case 'delete':
        case 'backspace':
          if (selectedElementIds.length > 0) {
            e.preventDefault();
            handleDeleteElements(selectedElementIds);
          }
          break;
        case 'escape':
          setSelectedElementIds([]);
          setContextMenu(null);
          setIsShortcutsOpen(false);
          setIsTemplatesOpen(false);
          setIsSearchOpen(false);
          if (isPresentationMode) setIsPresentationMode(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    board.elements,
    selectedElementIds,
    handleUndo,
    handleRedo,
    handleCopySelected,
    handleCutSelected,
    handlePaste,
    handleDuplicateSelected,
    handleDeleteElements,
    isPresentationMode,
  ]);

  // -------------------------------------------------------------
  // Image Upload File Input Handler
  // -------------------------------------------------------------
  const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 500;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const centerWorldX = (-board.viewport.x + window.innerWidth / 2) / board.viewport.zoom - w / 2;
        const centerWorldY = (-board.viewport.y + window.innerHeight / 2) / board.viewport.zoom - h / 2;

        const newEl: WhiteboardElement = {
          id: `el_img_${Date.now()}`,
          type: 'image',
          x: Math.round(centerWorldX),
          y: Math.round(centerWorldY),
          width: w,
          height: h,
          strokeColor: '#6366f1',
          strokeWidth: 0,
          opacity: 1,
          zIndex: board.elements.length + 1,
          imageUrl: dataUrl,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        };

        handleAddElement(newEl);
        // Uploaded images remain unselected by default
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // -------------------------------------------------------------
  // Export Handler
  // -------------------------------------------------------------
  const handleExport = async (format: ExportFormat, quality: ExportQuality, includeBg: boolean) => {
    try {
      const { blob, fileName } = await exportWhiteboard(board, {
        format,
        quality,
        includeBackground: includeBg,
      });
      triggerFileDownload(blob, fileName);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // -------------------------------------------------------------
  // Templates Chooser Handler
  // -------------------------------------------------------------
  const handleApplyTemplate = (tpl: BoardTemplate) => {
    const newBoard = tpl.createBoard();
    recordHistory(newBoard);
    setSelectedElementIds([]);
    handleFitToContent();
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-slate-900 select-none">
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileSelected}
        className="hidden"
      />

      {/* Top Header Floating Controls */}
      <WhiteboardHeader
        board={board}
        allBoards={allBoards}
        onRenameBoard={handleRenameBoard}
        onSelectBoard={handleSelectBoard}
        onCreateNewBoard={handleCreateNewBoard}
        onDuplicateBoard={handleDuplicateBoard}
        onDeleteBoard={handleDeleteBoard}
        onChangeGridType={(gridType) => setBoard((prev) => ({ ...prev, gridType }))}
        onToggleGridSnap={() => setBoard((prev) => ({ ...prev, gridSnap: !prev.gridSnap }))}
        onChangeBackgroundColor={(color) => setBoard((prev) => ({ ...prev, backgroundColor: color }))}
        onExport={handleExport}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenHelp={() => setIsShortcutsOpen(true)}
        onTogglePresentationMode={() => setIsPresentationMode((p) => !p)}
        onBackToHome={handleBackToToolTrack}
        saveStatus={saveStatus}
        lastSavedTime={lastSavedTime}
        isPresentationMode={isPresentationMode}
        isDrawingActive={isDrawingActive}
      />

      {/* Main Interactive Canvas Area */}
      <WhiteboardCanvas
        board={board}
        activeTool={activeTool}
        selectedElementIds={selectedElementIds}
        onSelectElements={setSelectedElementIds}
        onUpdateElement={handleUpdateElement}
        onAddElement={handleAddElement}
        onDeleteElements={handleDeleteElements}
        onViewportChange={(viewport) => setBoard((prev) => ({ ...prev, viewport }))}
        currentStrokeColor={currentStrokeColor}
        currentFillColor={currentFillColor}
        currentStrokeWidth={currentStrokeWidth}
        currentStrokeStyle={currentStrokeStyle}
        currentOpacity={currentOpacity}
        currentPenStyle={currentPenStyle}
        penCursorChoice={penCursorChoice}
        smoothingMode={smoothingMode}
        isBeautifyEnabled={isBeautifyEnabled}
        isSmartShapeEnabled={isSmartShapeEnabled}
        onOpenContextMenu={(coords) => setContextMenu(coords)}
        editingElementId={editingElementId}
        onStartEditing={(id) => setEditingElementId(id)}
        onFinishEditing={(id, newText) => {
          if (!newText || !newText.trim()) {
            handleDeleteElements([id]);
          } else {
            const lines = newText.split('\n');
            const maxLineLen = Math.max(...lines.map((l) => l.length), 1);
            const estWidth = Math.max(120, Math.min(maxLineLen * 11 + 24, 800));
            const estHeight = Math.max(36, lines.length * 26 + 10);
            handleUpdateElement(id, { text: newText, width: estWidth, height: estHeight });
          }
          setEditingElementId(null);
        }}
        eraserSize={eraserSize}
        eraserMode={eraserMode}
        onCommitElements={handleCommitElements}
        onDrawingActiveChange={handleDrawingActiveChange}
      />

      {/* Left-Side Contextual Properties Panel */}
      {!isPresentationMode && (
        <WhiteboardPropertiesPanel
          activeTool={activeTool}
          selectedElements={board.elements.filter((el) => selectedElementIds.includes(el.id))}
          onUpdateSelected={handleUpdateSelected}
          currentStrokeColor={currentStrokeColor}
          onChangeStrokeColor={setCurrentStrokeColor}
          currentFillColor={currentFillColor}
          onChangeFillColor={setCurrentFillColor}
          currentStrokeWidth={currentStrokeWidth}
          onChangeStrokeWidth={setCurrentStrokeWidth}
          currentStrokeStyle={currentStrokeStyle}
          onChangeStrokeStyle={setCurrentStrokeStyle}
          currentOpacity={currentOpacity}
          onChangeOpacity={setCurrentOpacity}
          currentPenStyle={currentPenStyle}
          onChangePenStyle={setCurrentPenStyle}
          penCursorChoice={penCursorChoice}
          onChangePenCursorChoice={setPenCursorChoice}
          smoothingMode={smoothingMode}
          onChangeSmoothingMode={setSmoothingMode}
          isBeautifyEnabled={isBeautifyEnabled}
          onToggleBeautify={() => setIsBeautifyEnabled((p) => !p)}
          onDuplicate={handleDuplicateSelected}
          onDelete={() => handleDeleteElements(selectedElementIds)}
          onLockToggle={handleLockToggle}
          onLayerChange={handleLayerChange}
          onGroupToggle={handleGroupToggle}
          onAlign={handleAlign}
          onDistribute={handleDistribute}
          eraserSize={eraserSize}
          onChangeEraserSize={setEraserSize}
          eraserMode={eraserMode}
          onChangeEraserMode={setEraserMode}
          onClearAllInk={handleClearAllInk}
          isDrawingActive={isDrawingActive}
        />
      )}

      {/* Bottom Floating Primary Toolbar */}
      <WhiteboardToolbar
        activeTool={activeTool}
        onSelectTool={(tool) => setActiveTool(tool)}
        onUploadImageClick={() => fileInputRef.current?.click()}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        isPresentationMode={isPresentationMode}
        currentStrokeWidth={currentStrokeWidth}
        onChangeStrokeWidth={setCurrentStrokeWidth}
        currentPenStyle={currentPenStyle}
        onChangePenStyle={setCurrentPenStyle}
        penCursorChoice={penCursorChoice}
        onChangePenCursorChoice={setPenCursorChoice}
        smoothingMode={smoothingMode}
        onChangeSmoothingMode={setSmoothingMode}
        isBeautifyEnabled={isBeautifyEnabled}
        onToggleBeautify={() => setIsBeautifyEnabled((p) => !p)}
        isSmartShapeEnabled={isSmartShapeEnabled}
        onToggleSmartShape={() => setIsSmartShapeEnabled((p) => !p)}
        eraserSize={eraserSize}
        onChangeEraserSize={setEraserSize}
        eraserMode={eraserMode}
        onChangeEraserMode={setEraserMode}
        isDrawingActive={isDrawingActive}
      />

      {/* Bottom-Right Zoom & Frame Navigation Bar */}
      {!isPresentationMode && (
        <WhiteboardBottomBar
          zoom={board.viewport.zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onFitToContent={handleFitToContent}
          frames={frames}
          activeFrameIndex={activeFrameIndex}
          onNavigateFrame={handleNavigateFrame}
          onSelectFrame={(idx) => {
            setActiveFrameIndex(idx);
            const frameEl = board.elements.find((el) => el.id === frames[idx]?.elementId);
            if (frameEl) handleFocusElement(frameEl);
          }}
          isDrawingActive={isDrawingActive}
        />
      )}

      {/* Right-Click Floating Context Menu */}
      {contextMenu && (
        <WhiteboardContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          selectedElements={board.elements.filter((el) => selectedElementIds.includes(el.id))}
          onCut={handleCutSelected}
          onCopy={handleCopySelected}
          onPaste={handlePaste}
          onDuplicate={handleDuplicateSelected}
          onDelete={() => handleDeleteElements(selectedElementIds)}
          onLockToggle={handleLockToggle}
          onLayerChange={(action) => handleLayerChange(action)}
          onGroupToggle={handleGroupToggle}
          onSelectAll={() => setSelectedElementIds(board.elements.map((el) => el.id))}
          onFitToContent={handleFitToContent}
          onAddTextAtCursor={() => {
            const newEl: WhiteboardElement = {
              id: `el_txt_${Date.now()}`,
              type: 'text',
              x: contextMenu.worldX,
              y: contextMenu.worldY,
              width: 180,
              height: 36,
              strokeColor: currentStrokeColor,
              strokeWidth: 1,
              opacity: 1,
              zIndex: board.elements.length + 1,
              text: '',
            };
            handleAddElement(newEl);
            setEditingElementId(newEl.id);
          }}
          onAddStickyAtCursor={() => {
            const newEl: WhiteboardElement = {
              id: `el_sticky_${Date.now()}`,
              type: 'sticky',
              x: contextMenu.worldX,
              y: contextMenu.worldY,
              width: 200,
              height: 180,
              strokeColor: '#ca8a04',
              strokeWidth: 1,
              opacity: 1,
              zIndex: board.elements.length + 1,
              stickyColor: '#fef08a',
              text: 'Idea...',
            };
            handleAddElement(newEl);
            setEditingElementId(newEl.id);
          }}
          onEditText={() => {
            if (selectedElementIds.length === 1) {
              setEditingElementId(selectedElementIds[0]);
            }
          }}
        />
      )}

      {/* Shortcuts & Help Modal */}
      <WhiteboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Templates Modal */}
      <WhiteboardTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* Board Search Modal */}
      <WhiteboardSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        elements={board.elements}
        onFocusElement={handleFocusElement}
      />
    </div>
  );
};
