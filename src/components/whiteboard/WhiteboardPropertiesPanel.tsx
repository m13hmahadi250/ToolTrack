import React from 'react';
import {
  WhiteboardElement,
  WhiteboardTool,
  StrokeStyle,
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
  // Actions
  onDuplicate: () => void;
  onDelete: () => void;
  onLockToggle: () => void;
  onLayerChange: (action: 'front' | 'forward' | 'backward' | 'back') => void;
  onGroupToggle: () => void;
  onAlign: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onDistribute: (axis: 'h' | 'v') => void;
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
  onDuplicate,
  onDelete,
  onLockToggle,
  onLayerChange,
  onGroupToggle,
  onAlign,
  onDistribute,
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

  // If no elements are selected and active tool is select, hand, laser, or eraser, hide property panel to keep screen minimal
  if (!hasSelection && ['select', 'hand', 'laser', 'eraser'].includes(activeTool)) {
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
      className={`fixed top-20 left-4 z-30 max-h-[82vh] overflow-y-auto w-64 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-2xl text-slate-800 dark:text-slate-100 space-y-4 text-xs select-none transition-all duration-200 ${
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
    </aside>
  );
};
