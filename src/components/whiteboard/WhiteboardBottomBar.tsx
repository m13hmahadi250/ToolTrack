import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { FrameItem } from '../../types/whiteboard';

interface WhiteboardBottomBarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToContent: () => void;
  frames: FrameItem[];
  activeFrameIndex: number;
  onNavigateFrame: (direction: 'prev' | 'next') => void;
  onSelectFrame: (index: number) => void;
}

export const WhiteboardBottomBar: React.FC<WhiteboardBottomBarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToContent,
  frames,
  activeFrameIndex,
  onNavigateFrame,
  onSelectFrame,
}) => {
  const zoomPct = Math.round(zoom * 100);

  return (
    <aside
      aria-label="Whiteboard Viewport Navigation"
      className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-30 flex items-center gap-2 pointer-events-auto"
    >
      {/* Frames Navigation (if frames exist) */}
      {frames && frames.length > 0 && (
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-xl text-xs text-slate-700 dark:text-slate-200">
          <Layers className="w-3.5 h-3.5 text-indigo-500 mr-1" />
          <button
            onClick={() => onNavigateFrame('prev')}
            disabled={activeFrameIndex <= 0}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            title="Previous Frame"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="font-medium text-[11px] px-1 truncate max-w-[100px]">
            {frames[activeFrameIndex]?.title || `Frame ${activeFrameIndex + 1}`} ({activeFrameIndex + 1}/{frames.length})
          </span>

          <button
            onClick={() => onNavigateFrame('next')}
            disabled={activeFrameIndex >= frames.length - 1}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            title="Next Frame"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-xl text-xs text-slate-700 dark:text-slate-200">
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          title="Zoom Out (Ctrl -)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={onResetZoom}
          className="px-2 py-1 rounded-lg font-mono font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Reset Zoom to 100%"
        >
          {zoomPct}%
        </button>

        <button
          onClick={onZoomIn}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          title="Zoom In (Ctrl +)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        <button
          onClick={onFitToContent}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          title="Fit All Content to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
