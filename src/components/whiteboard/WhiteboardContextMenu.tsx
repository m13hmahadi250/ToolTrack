import React, { useEffect, useRef } from 'react';
import {
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Lock,
  Unlock,
  ChevronsUp,
  ChevronsDown,
  Maximize2,
  Type,
  StickyNote,
  Edit3,
} from 'lucide-react';
import { WhiteboardElement } from '../../types/whiteboard';

interface WhiteboardContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  selectedElements: WhiteboardElement[];
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onLockToggle: () => void;
  onLayerChange: (action: 'front' | 'back') => void;
  onGroupToggle: () => void;
  onSelectAll: () => void;
  onFitToContent: () => void;
  onAddTextAtCursor: () => void;
  onAddStickyAtCursor: () => void;
  onEditText?: () => void;
}

export const WhiteboardContextMenu: React.FC<WhiteboardContextMenuProps> = ({
  x,
  y,
  onClose,
  selectedElements,
  onCut,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onLockToggle,
  onLayerChange,
  onGroupToggle,
  onSelectAll,
  onFitToContent,
  onAddTextAtCursor,
  onAddStickyAtCursor,
  onEditText,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const hasSelection = selectedElements.length > 0;
  const single = hasSelection && selectedElements.length === 1 ? selectedElements[0] : null;
  const isLocked = single?.locked || false;
  const isTextOrSticky = single?.type === 'text' || single?.type === 'sticky';

  // Adjust menu coordinates so it doesn't overflow the viewport
  const menuW = 200;
  const menuH = hasSelection ? 300 : 200;
  const adjustedX = Math.min(x, window.innerWidth - menuW - 12);
  const adjustedY = Math.min(y, window.innerHeight - menuH - 12);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{ left: adjustedX, top: adjustedY }}
      className="fixed z-50 w-52 p-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100 select-none text-slate-700 dark:text-slate-200"
    >
      {hasSelection ? (
        <>
          {isTextOrSticky && onEditText && (
            <button
              onClick={() => {
                onEditText();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Edit Content</span>
              </span>
            </button>
          )}

          <button
            onClick={() => {
              onDuplicate();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </span>
            <kbd className="text-[10px] text-slate-400 font-mono">Ctrl+D</kbd>
          </button>

          <button
            onClick={() => {
              onCopy();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </span>
            <kbd className="text-[10px] text-slate-400 font-mono">Ctrl+C</kbd>
          </button>

          <button
            onClick={() => {
              onCut();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5" />
              <span>Cut</span>
            </span>
            <kbd className="text-[10px] text-slate-400 font-mono">Ctrl+X</kbd>
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          <button
            onClick={() => {
              onLayerChange('front');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <ChevronsUp className="w-3.5 h-3.5" />
            <span>Bring to Front</span>
          </button>

          <button
            onClick={() => {
              onLayerChange('back');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <ChevronsDown className="w-3.5 h-3.5" />
            <span>Send to Back</span>
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          {selectedElements.length > 1 && (
            <button
              onClick={() => {
                onGroupToggle();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
            >
              <span>{selectedElements.some((e) => e.groupId) ? 'Ungroup' : 'Group Selection'}</span>
            </button>
          )}

          <button
            onClick={() => {
              onLockToggle();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isLocked ? 'Unlock Object' : 'Lock Object'}</span>
          </button>

          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 text-left transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </span>
            <kbd className="text-[10px] text-red-400 font-mono">Del</kbd>
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => {
              onPaste();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste</span>
            </span>
            <kbd className="text-[10px] text-slate-400 font-mono">Ctrl+V</kbd>
          </button>

          <button
            onClick={() => {
              onSelectAll();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <span>Select All</span>
            <kbd className="text-[10px] text-slate-400 font-mono">Ctrl+A</kbd>
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          <button
            onClick={() => {
              onAddStickyAtCursor();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-500" />
            <span>Add Sticky Note Here</span>
          </button>

          <button
            onClick={() => {
              onAddTextAtCursor();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <Type className="w-3.5 h-3.5 text-indigo-500" />
            <span>Add Text Here</span>
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          <button
            onClick={() => {
              onFitToContent();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fit All to Viewport</span>
          </button>
        </>
      )}
    </div>
  );
};
