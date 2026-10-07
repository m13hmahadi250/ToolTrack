import React from 'react';
import {
  WhiteboardElement,
  WhiteboardTool,
  StrokeStyle,
  PenStyle,
  SmoothingMode,
  PenCursorChoice,
} from '../../types/whiteboard';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  Lock,
  Unlock,
  ChevronsUp,
  ChevronUp,
  ChevronDown,
  ChevronsDown,
  Layers,
  Sparkles,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  Feather,
  PenTool,
  Pencil,
  Highlighter,
  Minus,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface WhiteboardPropertiesPanelProps {
  activeTool: WhiteboardTool;
  selectedElements: WhiteboardElement[];
  onUpdateSelected: (updates: Partial<WhiteboardElement>) => void;
  // Defaults for new drawing
  currentStrokeColor: string;
  onChangeStrokeColor: (color: string) => void;
  currentFillColor: string;
  onChangeFillColor: (color: string) => void;
  currentStrokeWidth: number;
  onChangeStrokeWidth: (width: number) => void;
  currentStrokeStyle: StrokeStyle;
  onChangeStrokeStyle: (style: StrokeStyle) => void;
  currentOpacity: number;
  onChangeOpacity: (opacity: number) => void;
  // Pen-specific properties
  currentPenStyle?: PenStyle;
  onChangePenStyle?: (style: PenStyle) => void;
  penCursorChoice?: PenCursorChoice;
  onChangePenCursorChoice?: (choice: PenCursorChoice) => void;
  smoothingMode?: SmoothingMode;
  onChangeSmoothingMode?: (mode: SmoothingMode) => void;
  isBeautifyEnabled?: boolean;
  onToggleBeautify?: () => void;
  // Actions
  onDuplicate: () => void;
  onDelete: () => void;
  onLockToggle: () => void;
  onLayerChange: (action: 'front' | 'forward' | 'backward' | 'back') => void;
  onGroupToggle: () => void;
  onAlign: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onDistribute: (axis: 'h' | 'v') => void;
  // Eraser properties
  eraserSize?: number;
  onChangeEraserSize?: (size: number) => void;
  eraserMode?: 'precision' | 'stroke';
  onChangeEraserMode?: (mode: 'precision' | 'stroke') => void;
  onClearAllInk?: () => void;
  isDrawingActive?: boolean;
  // PDF-specific actions
  onRotatePdfPage?: (pageEl: WhiteboardElement) => void;
  onDuplicatePdfPage?: (pageEl: WhiteboardElement) => void;
  onDeletePdfPage?: (pageEl: WhiteboardElement) => void;
  onMovePdfPage?: (pageEl: WhiteboardElement, direction: 'up' | 'down') => void;
  onNavigatePdfPage?: (docId: string, currentNum: number, dir: 'prev' | 'next') => void;
  onRemovePdfDocument?: (docId: string) => void;
  onExportAnnotatedPdf?: (docId: string) => void;
}

const COLOR_SWATCHES = [
  { label: 'Black', value: '#0f172a' },
  { label: 'White', value: '#ffffff' },
  { label: 'Slate', value: '#94a3b8' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Green', value: '#10b981' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Pink', value: '#ec4899' },
];

const STICKY_COLORS = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Sky Blue', value: '#bae6fd' },
  { label: 'Mint Green', value: '#bbf7d0' },
  { label: 'Peach Orange', value: '#fed7aa' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'Lavender', value: '#e9d5ff' },
];

const STROKE_WIDTHS = [1, 2, 4, 8, 12, 20];

export const WhiteboardPropertiesPanel: React.FC<WhiteboardPropertiesPanelProps> = ({
  activeTool,
  selectedElements,
  onUpdateSelected,
  currentStrokeColor,
  onChangeStrokeColor,
  currentFillColor,
  onChangeFillColor,
  currentStrokeWidth,
  onChangeStrokeWidth,
  currentStrokeStyle,
  onChangeStrokeStyle,
  currentOpacity,
  onChangeOpacity,
  currentPenStyle = 'fountain',
  onChangePenStyle,
  penCursorChoice = 'auto',
  onChangePenCursorChoice,
  smoothingMode = 'smooth',
  onChangeSmoothingMode,
  isBeautifyEnabled = false,
  onToggleBeautify,
  onDuplicate,
  onDelete,
  onLockToggle,
  onLayerChange,
  onGroupToggle,
  onAlign,
  onDistribute,
  eraserSize = 24,
  onChangeEraserSize,
  eraserMode = 'precision',
  onChangeEraserMode,
  onClearAllInk,
  isDrawingActive = false,
  onRotatePdfPage,
  onDuplicatePdfPage,
  onDeletePdfPage,
  onMovePdfPage,
  onNavigatePdfPage,
  onRemovePdfDocument,
  onExportAnnotatedPdf,
}) => {
  const hasSelection = selectedElements.length > 0;
  const singleElement = hasSelection && selectedElements.length === 1 ? selectedElements[0] : null;

  // Active values based on selection or fallback to current state
  const strokeColor = singleElement ? singleElement.strokeColor : currentStrokeColor;
  const strokeWidth = singleElement ? singleElement.strokeWidth : currentStrokeWidth;
  const strokeStyle = singleElement ? (singleElement.strokeStyle || 'solid') : currentStrokeStyle;
  const fillColor = singleElement ? (singleElement.fillColor || 'transparent') : currentFillColor;
  const opacity = singleElement ? (singleElement.opacity ?? 1) : currentOpacity;
  const isLocked = singleElement?.locked || false;
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const isTextElement = singleElement?.type === 'text';
  const isStickyElement = singleElement?.type === 'sticky';
  const isFreehandElement =
    (singleElement && ['pencil', 'pen', 'highlighter'].includes(singleElement.type)) ||
    (!hasSelection && ['pencil', 'pen', 'highlighter'].includes(activeTool));
  const isShapeOrLine =
    singleElement &&
    [
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
      'connector',
    ].includes(singleElement.type);

  // If no elements are selected and active tool is select, lasso, hand, or laser, hide property panel to keep screen minimal
  if (!hasSelection && ['select', 'lasso', 'hand', 'laser'].includes(activeTool)) {
    return null;
  }

  const handleColorChange = (newColor: string) => {
    if (hasSelection) {
      onUpdateSelected({ strokeColor: newColor });
    }
    onChangeStrokeColor(newColor);
  };

  const handleFillChange = (newFill: string) => {
    if (hasSelection) {
      onUpdateSelected({ fillColor: newFill });
    }
    onChangeFillColor(newFill);
  };

  const handleWidthChange = (w: number) => {
    if (hasSelection) {
      onUpdateSelected({ strokeWidth: w });
    }
    onChangeStrokeWidth(w);
  };

  const handleStyleChange = (s: StrokeStyle) => {
    if (hasSelection) {
      onUpdateSelected({ strokeStyle: s });
    }
    onChangeStrokeStyle(s);
  };

  const handleOpacityChange = (val: number) => {
    if (hasSelection) {
      onUpdateSelected({ opacity: val });
    }
    onChangeOpacity(val);
  };

  return (
    <aside
      aria-label="Whiteboard Properties"
      className={`fixed top-20 left-4 z-30 max-h-[82vh] overflow-y-auto w-64 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-2xl text-slate-800 dark:text-slate-100 space-y-4 text-xs select-none transition-all duration-300 ease-out ${
        isDrawingActive
          ? 'opacity-0 -translate-x-6 pointer-events-none'
          : 'opacity-100 translate-x-0'
      } ${
        isCollapsed ? 'space-y-0' : ''
      }`}
    >
      {/* Header bar / Title */}
      <div className={`flex items-center justify-between ${isCollapsed ? '' : 'pb-2 border-b border-slate-200 dark:border-slate-800'}`}>
        <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          {hasSelection
            ? selectedElements.length > 1
              ? `${selectedElements.length} Objects Selected`
              : `${singleElement?.type?.replace('_', ' ') || 'Object'} Properties`
            : `${activeTool.replace('_', ' ')} Settings`}
        </span>

        <div className="flex items-center gap-1">
          {hasSelection && (
            <>
              <button
                onClick={onLockToggle}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  isLocked
                    ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
                }`}
                title={isLocked ? 'Unlock Object' : 'Lock Object'}
              >
                {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onDuplicate}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer"
                title="Duplicate (Ctrl+D)"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition cursor-pointer"
                title="Delete (Backspace)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed((p) => !p)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            title={isCollapsed ? 'Expand properties' : 'Minimize properties'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* PDF Document & Page Controls */}
          {singleElement?.type === 'image' && Boolean(singleElement.pdfDocumentId) && (
            <div className="space-y-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate max-w-[150px]">
                  <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="truncate">{singleElement.pdfDocTitle || 'PDF Document'}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Page {singleElement.pdfPageNumber} of {singleElement.pdfTotalPages}
                </span>
              </div>

              {/* Page Navigation */}
              {onNavigatePdfPage && singleElement.pdfDocumentId && (
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => onNavigatePdfPage(singleElement.pdfDocumentId!, singleElement.pdfPageNumber || 1, 'prev')}
                    disabled={(singleElement.pdfPageNumber || 1) <= 1}
                    className="flex-1 py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer text-[11px]"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev Page</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigatePdfPage(singleElement.pdfDocumentId!, singleElement.pdfPageNumber || 1, 'next')}
                    disabled={(singleElement.pdfPageNumber || 1) >= (singleElement.pdfTotalPages || 1)}
                    className="flex-1 py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer text-[11px]"
                  >
                    <span>Next Page</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Individual Page Actions */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Page Actions
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {onRotatePdfPage && (
                    <button
                      type="button"
                      onClick={() => onRotatePdfPage(singleElement)}
                      className="py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium cursor-pointer text-[11px]"
                      title="Rotate Page 90° Clockwise"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Rotate 90°</span>
                    </button>
                  )}
                  {onDuplicatePdfPage && (
                    <button
                      type="button"
                      onClick={() => onDuplicatePdfPage(singleElement)}
                      className="py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium cursor-pointer text-[11px]"
                      title="Duplicate Page"
                    >
                      <Copy className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Duplicate</span>
                    </button>
                  )}
                </div>
                {onMovePdfPage && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onMovePdfPage(singleElement, 'up')}
                      disabled={(singleElement.pdfPageNumber || 1) <= 1}
                      className="py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium cursor-pointer text-[11px]"
                      title="Move Page Up in Document"
                    >
                      <ArrowUp className="w-3.5 h-3.5 text-sky-500" />
                      <span>Move Up</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onMovePdfPage(singleElement, 'down')}
                      disabled={(singleElement.pdfPageNumber || 1) >= (singleElement.pdfTotalPages || 1)}
                      className="py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium cursor-pointer text-[11px]"
                      title="Move Page Down in Document"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-sky-500" />
                      <span>Move Down</span>
                    </button>
                  </div>
                )}
                {onDeletePdfPage && (
                  <button
                    type="button"
                    onClick={() => onDeletePdfPage(singleElement)}
                    className="w-full mt-1 py-1.5 px-2 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                    title="Delete Page from Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Page</span>
                  </button>
                )}
              </div>

              {/* Document Actions */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Document Actions
                </span>
                {onExportAnnotatedPdf && (
                  <button
                    type="button"
                    onClick={() => onExportAnnotatedPdf(singleElement.pdfDocumentId!)}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer text-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Annotated PDF</span>
                  </button>
                )}
                {onRemovePdfDocument && (
                  <button
                    type="button"
                    onClick={() => onRemovePdfDocument(singleElement.pdfDocumentId!)}
                    className="w-full py-1.5 px-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-medium flex items-center justify-center gap-1.5 cursor-pointer text-[11px] transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Entire PDF</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Dedicated Eraser Tool Controls */}
          {activeTool === 'eraser' && !hasSelection && (
            <div className="space-y-4">
              {/* Eraser Size Preset Buttons */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Eraser Size</label>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{eraserSize}px</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Small', size: 12 },
                    { label: 'Medium', size: 24 },
                    { label: 'Large', size: 48 },
                  ].map((p) => (
                    <button
                      key={p.size}
                      onClick={() => onChangeEraserSize && onChangeEraserSize(p.size)}
                      className={`py-1.5 px-2 rounded-xl border text-center font-medium transition cursor-pointer ${
                        eraserSize === p.size
                          ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-bold ring-1 ring-rose-500/30'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Slider */}
                <div className="pt-1.5">
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

                {/* Live Size Preview Circle */}
                <div className="flex items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <div
                    className="rounded-full border-2 border-rose-500 bg-rose-500/15 transition-all duration-100"
                    style={{ width: `${Math.max(8, eraserSize)}px`, height: `${Math.max(8, eraserSize)}px` }}
                  />
                </div>
              </div>

              {/* Eraser Mode Selection */}
              <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Eraser Precision</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onChangeEraserMode && onChangeEraserMode('precision')}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                      eraserMode === 'precision'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-[11px] font-bold">Split & Trim</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
                      Erases crossed ink only
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeEraserMode && onChangeEraserMode('stroke')}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                      eraserMode === 'stroke'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-[11px] font-bold">Whole Stroke</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
                      Removes touched stroke
                    </div>
                  </button>
                </div>
              </div>

              {/* Protection Notice */}
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <span className="font-bold text-xs mt-0.5">🛡️</span>
                <div>
                  <span className="font-bold block">Images & Objects Protected</span>
                  <span className="text-[10px] opacity-90 leading-tight block mt-0.5">
                    The ink eraser only removes freehand drawings. Uploaded images, text, and shapes will never be deleted.
                  </span>
                </div>
              </div>

              {/* Clear All Ink Quick Action */}
              {onClearAllInk && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={onClearAllInk}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-semibold transition cursor-pointer text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Ink Annotations</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Standard Element / Creation Property Controls */}
          {!(activeTool === 'eraser' && !hasSelection) && (
            <>
          {/* Sticky Note Color Palette */}
      {isStickyElement && (
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-600 dark:text-slate-400">Sticky Color</label>
          <div className="flex flex-wrap gap-1.5">
            {STICKY_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => onUpdateSelected({ stickyColor: c.value })}
                className={`w-7 h-7 rounded-xl border transition cursor-pointer ${
                  singleElement?.stickyColor === c.value
                    ? 'border-indigo-500 ring-2 ring-indigo-500/40 scale-110'
                    : 'border-black/20 hover:scale-105'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stroke Color Palette */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-slate-600 dark:text-slate-400">
            {isTextElement ? 'Text Color' : 'Stroke Color'}
          </label>
          <input
            type="color"
            value={strokeColor.startsWith('#') ? strokeColor : '#6366f1'}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            title="Custom Color Picker"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch.value}
              onClick={() => handleColorChange(swatch.value)}
              className={`w-5 h-5 rounded-lg border transition cursor-pointer ${
                strokeColor === swatch.value
                  ? 'border-indigo-500 ring-2 ring-indigo-500/40 scale-115'
                  : 'border-slate-300 dark:border-slate-700 hover:scale-105'
              }`}
              style={{ backgroundColor: swatch.value }}
              title={swatch.label}
            />
          ))}
        </div>
      </div>

      {/* Fill Color Palette (for shapes) */}
      {(isShapeOrLine || ['rectangle', 'circle', 'diamond', 'triangle', 'polygon', 'star'].includes(activeTool)) && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-600 dark:text-slate-400">Fill Color</label>
            <button
              onClick={() => handleFillChange('transparent')}
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded cursor-pointer ${
                fillColor === 'transparent'
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              None
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_SWATCHES.slice(1, 11).map((swatch) => (
              <button
                key={swatch.value}
                onClick={() => handleFillChange(swatch.value + '33')} // 20% alpha fill
                className={`w-5 h-5 rounded-lg border transition cursor-pointer ${
                  fillColor.includes(swatch.value)
                    ? 'border-indigo-500 ring-2 ring-indigo-500/40 scale-115'
                    : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                }`}
                style={{ backgroundColor: swatch.value + '55' }}
                title={`Filled ${swatch.label}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pen Style & Ink Controls for Freehand Strokes */}
      {isFreehandElement && (
        <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
          <label className="font-semibold text-slate-600 dark:text-slate-400 block text-[11px] uppercase tracking-wider">
            Pen & Ink Style
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'fountain', label: 'Fountain', icon: <Feather className="w-3.5 h-3.5" /> },
              { id: 'ballpoint', label: 'Ballpoint', icon: <PenTool className="w-3.5 h-3.5" /> },
              { id: 'marker', label: 'Marker', icon: <PenTool className="w-3.5 h-3.5" /> },
              { id: 'pencil', label: 'Pencil', icon: <Pencil className="w-3.5 h-3.5" /> },
              { id: 'fine', label: 'Fine', icon: <Minus className="w-3.5 h-3.5" /> },
              { id: 'highlighter', label: 'Highlight', icon: <Highlighter className="w-3.5 h-3.5" /> },
            ].map((pStyle) => {
              const activeStyle = singleElement ? singleElement.penStyle || 'fountain' : currentPenStyle;
              const isSelected = activeStyle === pStyle.id;
              return (
                <button
                  key={pStyle.id}
                  onClick={() => {
                    if (hasSelection) {
                      onUpdateSelected({ penStyle: pStyle.id as PenStyle });
                    }
                    if (onChangePenStyle) onChangePenStyle(pStyle.id as PenStyle);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {pStyle.icon}
                  <span>{pStyle.label}</span>
                </button>
              );
            })}
          </div>

          {/* Beautify Ink Toggle */}
          {onToggleBeautify && (
            <button
              onClick={() => {
                if (hasSelection) {
                  onUpdateSelected({ beautify: !singleElement?.beautify });
                }
                onToggleBeautify();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
                (singleElement ? singleElement.beautify : isBeautifyEnabled)
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Beautify Ink</span>
              </span>
              <span className="text-[10px] font-bold">
                {(singleElement ? singleElement.beautify : isBeautifyEnabled) ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {/* Smoothing Level Selector */}
          {onChangeSmoothingMode && (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-500 block">Smoothing Level</label>
              <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[10px]">
                {(['off', 'low', 'medium', 'high'] as SmoothingMode[]).map((mode) => {
                  const currentMode = singleElement ? singleElement.smoothingMode || 'smooth' : smoothingMode;
                  const isActive =
                    currentMode === mode ||
                    (mode === 'low' && currentMode === 'natural') ||
                    (mode === 'medium' && currentMode === 'smooth') ||
                    (mode === 'high' && currentMode === 'beautify');
                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        if (hasSelection) {
                          onUpdateSelected({ smoothingMode: mode });
                        }
                        onChangeSmoothingMode(mode);
                      }}
                      className={`py-1 px-1 rounded-lg font-medium transition cursor-pointer text-center capitalize ${
                        isActive
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stroke Width Selector */}
      {!isTextElement && !isStickyElement && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-600 dark:text-slate-400">Stroke Width</label>
            <span className="font-mono text-slate-500">{strokeWidth}px</span>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w}
                onClick={() => handleWidthChange(w)}
                className={`py-1 rounded-lg border text-center font-mono font-medium transition cursor-pointer ${
                  strokeWidth === w
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Line Style (Solid, Dashed, Dotted) */}
      {!isTextElement && !isStickyElement && (
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-600 dark:text-slate-400">Stroke Style</label>
          <div className="grid grid-cols-3 gap-1">
            {(['solid', 'dashed', 'dotted'] as StrokeStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => handleStyleChange(style)}
                className={`py-1 rounded-lg border text-center capitalize transition cursor-pointer ${
                  strokeStyle === style
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Opacity Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-slate-600 dark:text-slate-400">Opacity</label>
          <span className="font-mono text-slate-500">{Math.round(opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={opacity}
          onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
          className="w-full accent-indigo-600 cursor-pointer"
        />
      </div>

      {/* Text formatting controls */}
      {isTextElement && (
        <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
          <label className="font-semibold text-slate-600 dark:text-slate-400">Typography</label>
          {/* Font Size & Align */}
          <div className="flex items-center gap-1.5">
            <select
              value={singleElement?.fontSize || 20}
              onChange={(e) => onUpdateSelected({ fontSize: parseInt(e.target.value, 10) })}
              className="flex-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 font-medium cursor-pointer"
            >
              <option value="14">14px Small</option>
              <option value="18">18px Medium</option>
              <option value="24">24px Large</option>
              <option value="32">32px Title</option>
              <option value="48">48px Heading</option>
              <option value="64">64px Hero</option>
            </select>

            <button
              onClick={() => onUpdateSelected({ bold: !singleElement?.bold })}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                singleElement?.bold
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateSelected({ italic: !singleElement?.italic })}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                singleElement?.italic
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateSelected({ underline: !singleElement?.underline })}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                singleElement?.underline
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              title="Underline"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alignment */}
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => onUpdateSelected({ textAlign: 'left' })}
              className={`py-1 rounded-lg border flex justify-center cursor-pointer ${
                singleElement?.textAlign === 'left' || !singleElement?.textAlign
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateSelected({ textAlign: 'center' })}
              className={`py-1 rounded-lg border flex justify-center cursor-pointer ${
                singleElement?.textAlign === 'center'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateSelected({ textAlign: 'right' })}
              className={`py-1 rounded-lg border flex justify-center cursor-pointer ${
                singleElement?.textAlign === 'right'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Object Layers (Ordering) */}
      {hasSelection && (
        <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
          <label className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Layer Order</span>
          </label>
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => onLayerChange('front')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-center cursor-pointer text-slate-600 dark:text-slate-300"
              title="Bring to Front"
            >
              <ChevronsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onLayerChange('forward')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-center cursor-pointer text-slate-600 dark:text-slate-300"
              title="Bring Forward"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onLayerChange('backward')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-center cursor-pointer text-slate-600 dark:text-slate-300"
              title="Send Backward"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onLayerChange('back')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-center cursor-pointer text-slate-600 dark:text-slate-300"
              title="Send to Back"
            >
              <ChevronsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Multi-selection Alignment */}
      {selectedElements.length > 1 && (
        <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
          <label className="font-semibold text-slate-600 dark:text-slate-400">Align & Distribute</label>
          <div className="grid grid-cols-6 gap-1">
            <button
              onClick={() => onAlign('left')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-center cursor-pointer"
              title="Align Left"
            >
              <AlignStartVertical className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAlign('center')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-center cursor-pointer"
              title="Align Center"
            >
              <AlignCenterVertical className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAlign('right')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-center cursor-pointer"
              title="Align Right"
            >
              <AlignEndVertical className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAlign('top')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-center cursor-pointer"
              title="Align Top"
            >
              <AlignStartHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAlign('middle')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-center cursor-pointer"
              title="Align Middle"
            >
              <AlignCenterHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAlign('bottom')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-center cursor-pointer"
              title="Align Bottom"
            >
              <AlignEndHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => onDistribute('h')}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-semibold text-center cursor-pointer"
            >
              Distribute H
            </button>
            <button
              onClick={() => onDistribute('v')}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-semibold text-center cursor-pointer"
            >
              Distribute V
            </button>
          </div>

          <button
            onClick={onGroupToggle}
            className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-semibold text-center cursor-pointer"
          >
            {selectedElements.some((e) => e.groupId) ? 'Ungroup' : 'Group Selection'}
          </button>
        </div>
      )}
            </>
          )}
        </>
      )}
    </aside>
  );
};
