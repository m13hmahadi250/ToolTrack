import React, { useState, useRef, useEffect } from 'react';
import {
  MousePointer,
  LassoSelect,
  Hand,
  Pencil,
  PenTool,
  Highlighter,
  Eraser,
  Minus,
  ArrowRight,
  MoveHorizontal,
  Square,
  Sparkles,
  Circle,
  Diamond,
  Triangle,
  Hexagon,
  Star,
  Type,
  StickyNote,
  GitCommit,
  Maximize,
  Image as ImageIcon,
  Flame,
  Ruler,
  ChevronDown,
  ChevronUp,
  Undo2,
  Redo2,
  Feather,
  Wand2,
  Shapes,
} from 'lucide-react';
import {
  WhiteboardTool,
  PenStyle,
  SmoothingMode,
  PenCursorChoice,
} from '../../types/whiteboard';

const getActiveToolIcon = (tool: WhiteboardTool) => {
  switch (tool) {
    case 'select':
      return <MousePointer className="w-4 h-4" />;
    case 'lasso':
      return <LassoSelect className="w-4 h-4" />;
    case 'hand':
      return <Hand className="w-4 h-4" />;
    case 'pencil':
      return <Pencil className="w-4 h-4" />;
    case 'pen':
      return <PenTool className="w-4 h-4" />;
    case 'highlighter':
      return <Highlighter className="w-4 h-4" />;
    case 'eraser':
      return <Eraser className="w-4 h-4" />;
    case 'rectangle':
      return <Square className="w-4 h-4" />;
    case 'rounded_rectangle':
      return <Sparkles className="w-4 h-4" />;
    case 'circle':
      return <Circle className="w-4 h-4" />;
    case 'diamond':
      return <Diamond className="w-4 h-4" />;
    case 'triangle':
      return <Triangle className="w-4 h-4" />;
    case 'polygon':
      return <Hexagon className="w-4 h-4" />;
    case 'star':
      return <Star className="w-4 h-4" />;
    case 'line':
      return <Minus className="w-4 h-4" />;
    case 'arrow':
      return <ArrowRight className="w-4 h-4" />;
    case 'double_arrow':
      return <MoveHorizontal className="w-4 h-4" />;
    case 'text':
      return <Type className="w-4 h-4" />;
    case 'sticky':
      return <StickyNote className="w-4 h-4" />;
    case 'connector':
      return <GitCommit className="w-4 h-4" />;
    case 'image':
      return <ImageIcon className="w-4 h-4" />;
    case 'frame':
      return <Maximize className="w-4 h-4" />;
    case 'laser':
      return <Flame className="w-4 h-4" />;
    case 'measure':
      return <Ruler className="w-4 h-4" />;
    default:
      return <PenTool className="w-4 h-4" />;
  }
};

interface WhiteboardToolbarProps {
  activeTool: WhiteboardTool;
  onSelectTool: (tool: WhiteboardTool) => void;
  onUploadImageClick: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isPresentationMode?: boolean;
  currentStrokeWidth?: number;
  onChangeStrokeWidth?: (w: number) => void;
  currentPenStyle?: PenStyle;
  onChangePenStyle?: (style: PenStyle) => void;
  penCursorChoice?: PenCursorChoice;
  onChangePenCursorChoice?: (choice: PenCursorChoice) => void;
  smoothingMode?: SmoothingMode;
  onChangeSmoothingMode?: (m: SmoothingMode) => void;
  isBeautifyEnabled?: boolean;
  onToggleBeautify?: () => void;
  isSmartShapeEnabled?: boolean;
  onToggleSmartShape?: () => void;
  // Eraser properties
  eraserSize?: number;
  onChangeEraserSize?: (size: number) => void;
  eraserMode?: 'precision' | 'stroke';
  onChangeEraserMode?: (mode: 'precision' | 'stroke') => void;
}

export const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  activeTool,
  onSelectTool,
  onUploadImageClick,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isPresentationMode = false,
  currentStrokeWidth = 3,
  onChangeStrokeWidth,
  currentPenStyle = 'fountain',
  onChangePenStyle,
  penCursorChoice = 'auto',
  onChangePenCursorChoice,
  smoothingMode = 'smooth',
  onChangeSmoothingMode,
  isBeautifyEnabled = false,
  onToggleBeautify,
  isSmartShapeEnabled = false,
  onToggleSmartShape,
  eraserSize = 24,
  onChangeEraserSize,
  eraserMode = 'precision',
  onChangeEraserMode,
}) => {
  const [shapesMenuOpen, setShapesMenuOpen] = useState(false);
  const [drawMenuOpen, setDrawMenuOpen] = useState(false);
  const [eraserMenuOpen, setEraserMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tooltrack_whiteboard_toolbar_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const toggleMinimized = () => {
    setIsMinimized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('tooltrack_whiteboard_toolbar_minimized', String(next));
      } catch {}
      return next;
    });
  };

  const shapesMenuRef = useRef<HTMLDivElement>(null);
  const drawMenuRef = useRef<HTMLDivElement>(null);
  const eraserMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click reliably
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (shapesMenuRef.current && !shapesMenuRef.current.contains(target)) {
        setShapesMenuOpen(false);
      }
      if (drawMenuRef.current && !drawMenuRef.current.contains(target)) {
        setDrawMenuOpen(false);
      }
      if (eraserMenuRef.current && !eraserMenuRef.current.contains(target)) {
        setEraserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Keyboard shortcut: 'M' or 'm' toggles toolbar minimize/expand
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
          return;
        }
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          setIsMinimized((p) => {
            const next = !p;
            try {
              localStorage.setItem('tooltrack_whiteboard_toolbar_minimized', String(next));
            } catch {}
            return next;
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isShapeTool = [
    'rectangle',
    'rounded_rectangle',
    'circle',
    'diamond',
    'triangle',
    'polygon',
    'star',
    'line',
    'arrow',
    'double_arrow',
  ].includes(activeTool);

  const isFreehandTool = ['pencil', 'pen', 'highlighter'].includes(activeTool);

  // In presentation mode, only show laser, pen, eraser, hand and select
  if (isPresentationMode) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl text-white">
        <button
          onClick={() => onSelectTool('laser')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTool === 'laser'
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-inner'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="Laser Pointer"
        >
          <Flame className="w-4 h-4 text-red-400 animate-pulse" />
          <span>Laser</span>
        </button>

        <button
          onClick={() => onSelectTool('pen')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTool === 'pen'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="Annotate Pen"
        >
          <PenTool className="w-4 h-4" />
          <span>Pen</span>
        </button>

        <button
          onClick={() => onSelectTool('eraser')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTool === 'eraser'
              ? 'bg-rose-600 text-white shadow-md'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="Eraser (E)"
        >
          <Eraser className="w-4 h-4" />
          <span>Eraser</span>
        </button>

        <button
          onClick={() => onSelectTool('select')}
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'select' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="Select (V)"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSelectTool('hand')}
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'hand' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="Pan (H)"
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 cursor-pointer"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Minimized compact floating toolbar pill
  if (isMinimized) {
    return (
      <aside
        aria-label="Whiteboard Toolbar"
        className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-200"
      >
        <div
          onClick={toggleMinimized}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-2xl text-slate-800 dark:text-slate-100 hover:border-indigo-500 hover:shadow-indigo-500/10 transition-all cursor-pointer group select-none"
          title="Expand Toolbar (M)"
        >
          <span className="p-1 rounded-full bg-indigo-600 text-white shadow-xs flex items-center justify-center">
            {getActiveToolIcon(activeTool)}
          </span>
          <span className="text-xs font-semibold capitalize text-slate-700 dark:text-slate-200">
            {activeTool.replace('_', ' ')}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">
            (Click to expand)
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimized();
            }}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition"
            title="Expand Toolbar (M)"
          >
            <ChevronUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Whiteboard Toolbar"
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[98vw] overflow-visible transition-all duration-200"
    >
      <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-2xl text-slate-800 dark:text-slate-100">
        {/* 1. Selection & Pan */}
        <button
          onClick={() => onSelectTool('select')}
          className={`p-2 rounded-xl transition cursor-pointer relative group ${
            activeTool === 'select'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="Select (V)"
        >
          <MousePointer className="w-4 h-4" />
          <span className="sr-only">Select</span>
        </button>

        <button
          onClick={() => onSelectTool('lasso')}
          className={`p-2 rounded-xl transition cursor-pointer relative group ${
            activeTool === 'lasso'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="Lasso Selection (Q) – Freehand loop select"
        >
          <LassoSelect className="w-4 h-4" />
          <span className="sr-only">Lasso</span>
        </button>

        <button
          onClick={() => onSelectTool('hand')}
          className={`p-2 rounded-xl transition cursor-pointer relative group ${
            activeTool === 'hand'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="Hand / Pan (H)"
        >
          <Hand className="w-4 h-4" />
          <span className="sr-only">Hand</span>
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* 2. Freehand / Draw Tools Dropdown */}
        <div className="relative" ref={drawMenuRef}>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (isFreehandTool) {
                  setDrawMenuOpen((p) => !p);
                } else {
                  onSelectTool('pen');
                  setDrawMenuOpen(true);
                }
                setShapesMenuOpen(false);
              }}
              className={`p-2 rounded-l-xl transition cursor-pointer ${
                isFreehandTool
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Drawing Tools (P)"
            >
              {activeTool === 'pencil' && <Pencil className="w-4 h-4" />}
              {activeTool === 'pen' && <PenTool className="w-4 h-4" />}
              {activeTool === 'highlighter' && <Highlighter className="w-4 h-4" />}
              {!isFreehandTool && <PenTool className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDrawMenuOpen((p) => !p);
                setShapesMenuOpen(false);
              }}
              className={`p-1.5 px-1 rounded-r-xl transition cursor-pointer flex items-center justify-center ${
                isFreehandTool
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-l border-indigo-500/40'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              } ${drawMenuOpen ? 'ring-2 ring-indigo-500/50' : ''}`}
              title="Select Drawing Mode & Pen Styles"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${drawMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Draw Submenu */}
          {drawMenuOpen && (
            <div className="absolute bottom-full mb-3 left-0 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3.5 min-w-[280px] max-w-[340px] z-50 text-slate-800 dark:text-slate-100">
              {/* Pen Styles Grid */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                  Pen & Ink Style
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'fountain', label: 'Fountain', tool: 'pen', icon: <Feather className="w-3.5 h-3.5" /> },
                    { id: 'ballpoint', label: 'Ballpoint', tool: 'pen', icon: <PenTool className="w-3.5 h-3.5" /> },
                    { id: 'marker', label: 'Marker', tool: 'pen', icon: <PenTool className="w-3.5 h-3.5" /> },
                    { id: 'pencil', label: 'Pencil', tool: 'pencil', icon: <Pencil className="w-3.5 h-3.5" /> },
                    { id: 'fine', label: 'Fine Pen', tool: 'pen', icon: <Minus className="w-3.5 h-3.5" /> },
                    { id: 'highlighter', label: 'Highlight', tool: 'highlighter', icon: <Highlighter className="w-3.5 h-3.5" /> },
                  ].map((item) => {
                    const isSelected =
                      (activeTool === item.tool && (currentPenStyle === item.id || (!currentPenStyle && item.id === 'fountain'))) ||
                      (activeTool === 'highlighter' && item.id === 'highlighter') ||
                      (activeTool === 'pencil' && item.id === 'pencil');
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          onSelectTool(item.tool as WhiteboardTool);
                          if (onChangePenStyle) onChangePenStyle(item.id as PenStyle);
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-medium transition cursor-pointer border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {item.icon}
                        <span className="mt-1 font-semibold">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stroke Width Selector */}
              {onChangeStrokeWidth && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Pen Size
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {currentStrokeWidth}px
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {[1, 2, 3, 5, 8, 14, 20].map((w) => (
                      <button
                        type="button"
                        key={w}
                        onClick={() => onChangeStrokeWidth(w)}
                        className={`py-1 rounded-lg text-center font-mono text-[11px] font-bold transition cursor-pointer border ${
                          currentStrokeWidth === w
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                        title={`${w}px stroke width`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pen-Style Cursor Choice */}
              {onChangePenCursorChoice && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                    Pen Cursor Style
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[10px]">
                    {[
                      { id: 'auto', label: 'Auto' },
                      { id: 'fountain', label: 'Fountain' },
                      { id: 'ballpoint', label: 'Ballpoint' },
                      { id: 'stylus', label: 'Stylus' },
                      { id: 'pencil', label: 'Pencil' },
                      { id: 'precision', label: 'Precision' },
                    ].map((cur) => (
                      <button
                        type="button"
                        key={cur.id}
                        onClick={() => onChangePenCursorChoice(cur.id as PenCursorChoice)}
                        className={`py-1 px-1 rounded-lg font-medium transition cursor-pointer text-center ${
                          penCursorChoice === cur.id
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {cur.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Beautify Ink & Smart Shapes Features */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {onToggleBeautify && (
                  <button
                    type="button"
                    onClick={onToggleBeautify}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                      isBeautifyEnabled
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Beautify Ink (Auto-Smooth)</span>
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isBeautifyEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}>
                      {isBeautifyEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}

                {onToggleSmartShape && (
                  <button
                    type="button"
                    onClick={onToggleSmartShape}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                      isSmartShapeEnabled
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Shapes className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Smart Shape Recognition</span>
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSmartShapeEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}>
                      {isSmartShapeEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}
              </div>

              {/* Smoothing Engine Mode Toggle */}
              {onChangeSmoothingMode && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                    Ink Smoothing Level
                  </span>
                  <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[10px]">
                    {(['off', 'natural', 'smooth', 'beautify'] as SmoothingMode[]).map((mode) => (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => onChangeSmoothingMode(mode)}
                        className={`py-1 px-1 rounded-lg font-medium transition cursor-pointer text-center capitalize ${
                          smoothingMode === mode
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2.5 Dedicated Eraser Tool Dropdown */}
        <div className="relative" ref={eraserMenuRef}>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (activeTool === 'eraser') {
                  setEraserMenuOpen((p) => !p);
                } else {
                  onSelectTool('eraser');
                }
                setDrawMenuOpen(false);
                setShapesMenuOpen(false);
              }}
              className={`p-2 rounded-l-xl transition cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Eraser (E) – Erase ink & annotations (Images protected)"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEraserMenuOpen((p) => !p);
                setDrawMenuOpen(false);
                setShapesMenuOpen(false);
              }}
              className={`p-1.5 px-1 rounded-r-xl transition cursor-pointer flex items-center justify-center ${
                activeTool === 'eraser'
                  ? 'bg-rose-600 text-white hover:bg-rose-700 border-l border-rose-500/40'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              } ${eraserMenuOpen ? 'ring-2 ring-rose-500/50' : ''}`}
              title="Eraser Size & Mode Settings"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${eraserMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Eraser Submenu Popover */}
          {eraserMenuOpen && (
            <div className="absolute bottom-full mb-3 left-0 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 min-w-[260px] z-50 text-slate-800 dark:text-slate-100">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Eraser Size
                  </span>
                  <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                    {eraserSize}px
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Small', size: 12 },
                    { label: 'Medium', size: 24 },
                    { label: 'Large', size: 48 },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.size}
                      onClick={() => onChangeEraserSize && onChangeEraserSize(p.size)}
                      className={`py-1.5 px-2 rounded-xl border text-center text-xs font-semibold transition cursor-pointer ${
                        eraserSize === p.size
                          ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <input
                    type="range"
                    min="6"
                    max="80"
                    step="2"
                    value={eraserSize}
                    onChange={(e) => onChangeEraserSize && onChangeEraserSize(parseInt(e.target.value, 10))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Eraser Mode */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                  Erasing Behavior
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onChangeEraserMode && onChangeEraserMode('precision')}
                    className={`p-2 rounded-xl border text-left text-xs transition cursor-pointer ${
                      eraserMode === 'precision'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 font-bold ring-1 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-[11px]">Precision Split</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 leading-tight">
                      Cuts only touched ink
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeEraserMode && onChangeEraserMode('stroke')}
                    className={`p-2 rounded-xl border text-left text-xs transition cursor-pointer ${
                      eraserMode === 'stroke'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 font-bold ring-1 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-[11px]">Whole Stroke</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 leading-tight">
                      Deletes full stroke
                    </div>
                  </button>
                </div>
              </div>

              {/* Protection hint */}
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Images, text & shapes are protected</span>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* 3. Shapes & Connectors Dropdown */}
        <div className="relative" ref={shapesMenuRef}>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (isShapeTool) {
                  setShapesMenuOpen((p) => !p);
                } else {
                  onSelectTool('rectangle');
                  setShapesMenuOpen(true);
                }
                setDrawMenuOpen(false);
              }}
              className={`p-2 rounded-l-xl transition cursor-pointer ${
                isShapeTool
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Geometric Shapes (R)"
            >
              {activeTool === 'rectangle' && <Square className="w-4 h-4" />}
              {activeTool === 'rounded_rectangle' && <Sparkles className="w-4 h-4" />}
              {activeTool === 'circle' && <Circle className="w-4 h-4" />}
              {activeTool === 'diamond' && <Diamond className="w-4 h-4" />}
              {activeTool === 'triangle' && <Triangle className="w-4 h-4" />}
              {activeTool === 'polygon' && <Hexagon className="w-4 h-4" />}
              {activeTool === 'star' && <Star className="w-4 h-4" />}
              {activeTool === 'line' && <Minus className="w-4 h-4" />}
              {activeTool === 'arrow' && <ArrowRight className="w-4 h-4" />}
              {activeTool === 'double_arrow' && <MoveHorizontal className="w-4 h-4" />}
              {!isShapeTool && <Square className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShapesMenuOpen((p) => !p);
                setDrawMenuOpen(false);
              }}
              className={`p-1.5 px-1 rounded-r-xl transition cursor-pointer flex items-center justify-center ${
                isShapeTool
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-l border-indigo-500/40'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              } ${shapesMenuOpen ? 'ring-2 ring-indigo-500/50' : ''}`}
              title="More Shapes"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${shapesMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Shapes Submenu */}
          {shapesMenuOpen && (
            <div className="absolute bottom-full mb-3 left-0 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl grid grid-cols-5 gap-1.5 w-[235px] z-50 text-slate-800 dark:text-slate-100">
              <button
                type="button"
                onClick={() => {
                  onSelectTool('rectangle');
                  setShapesMenuOpen(false);
                }}
                className={`p-2 rounded-xl flex items-center justify-center transition cursor-pointer ${
                  activeTool === 'rectangle'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                title="Rectangle (R)"
              >
                <Square className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTool('circle');
                  setShapesMenuOpen(false);
                }}
                className={`p-2 rounded-xl flex items-center justify-center transition cursor-pointer ${
                  activeTool === 'circle'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                title="Circle (O)"
              >
                <Circle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTool('rounded_rectangle');
                  setShapesMenuOpen(false);
                }}
                className={`p-2 rounded-xl flex items-center justify-center transition cursor-pointer ${
                  activeTool === 'rounded_rectangle'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                title="Rounded Rectangle"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTool('diamond');
                  setShapesMenuOpen(false);
                }}
                className={`p-2 rounded-xl flex items-center justify-center transition cursor-pointer ${
                  activeTool === 'diamond'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                title="Diamond"
              >
                <Diamond className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTool('triangle');
                  setShapesMenuOpen(false);
                }}
                className={`p-2 rounded-xl flex items-center justify-center transition cursor-pointer ${
                  activeTool === 'triangle'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                title="Triangle"
              >
                <Triangle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTool('polygon');
                  setShapesMenuOpen(false);
                }}
                className={`p-2 rounded-xl flex items-center justify-center transition cursor-pointer ${
                  activeTool === 'polygon'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                title="Hexagon"
              >
                <Hexagon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTool('star');
                  setShapesMenuOpen(false);
                }}
                className={`p-2 rounded-xl flex items-center justify-center transition cursor-pointer ${
                  activeTool === 'star'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                title="Star"
              >
                <Star className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTool('line');
                  setShapesMenuOpen(false);
                }}
                className={`p-2 rounded-xl flex items-center justify-center transition cursor-pointer ${
                  activeTool === 'line'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                title="Straight Line (L)"
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTool('arrow');
                  setShapesMenuOpen(false);
                }}
                className={`p-2 rounded-xl flex items-center justify-center transition cursor-pointer ${
                  activeTool === 'arrow'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                title="Arrow (A)"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTool('double_arrow');
                  setShapesMenuOpen(false);
                }}
                className={`p-2 rounded-xl flex items-center justify-center transition cursor-pointer ${
                  activeTool === 'double_arrow'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                title="Double Arrow"
              >
                <MoveHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* 4. Text Tool */}
        <button
          onClick={() => onSelectTool('text')}
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'text'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="Text Editor (T)"
        >
          <Type className="w-4 h-4" />
        </button>

        {/* 5. Sticky Note */}
        <button
          onClick={() => onSelectTool('sticky')}
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'sticky'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="Sticky Note (S)"
        >
          <StickyNote className="w-4 h-4" />
        </button>

        {/* 6. Dynamic Connector */}
        <button
          onClick={() => onSelectTool('connector')}
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'connector'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="Shape Connector (C)"
        >
          <GitCommit className="w-4 h-4" />
        </button>

        {/* 7. Image Upload / Paste */}
        <button
          onClick={onUploadImageClick}
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'image'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="Add / Paste Image (I)"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* 8. Frame (Presentation Slide Container) */}
        <button
          onClick={() => onSelectTool('frame')}
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'frame'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="Frame / Section (F)"
        >
          <Maximize className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* 9. Laser Pointer */}
        <button
          onClick={() => onSelectTool('laser')}
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'laser'
              ? 'bg-red-500 text-white shadow-md'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="Laser Pointer"
        >
          <Flame className="w-4 h-4 text-red-500 group-hover:text-red-400" />
        </button>

        {/* 10. Ruler / Measurement */}
        <button
          onClick={() => onSelectTool('measure')}
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'measure'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="Ruler / Measure Distance"
        >
          <Ruler className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* 11. Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 dark:text-slate-300 transition cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 dark:text-slate-300 transition cursor-pointer"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* 12. Minimize Toolbar */}
        <button
          type="button"
          onClick={toggleMinimized}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer flex items-center justify-center"
          title="Minimize Toolbar (M)"
        >
          <ChevronDown className="w-4 h-4" />
          <span className="sr-only">Minimize Toolbar (M)</span>
        </button>
      </div>
    </aside>
  );
};
