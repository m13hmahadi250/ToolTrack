import React from 'react';
import { X, Keyboard, Sparkles } from 'lucide-react';

interface WhiteboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhiteboardShortcutsModal: React.FC<WhiteboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const SHORTCUT_GROUPS = [
    {
      title: 'Tools & Drawing',
      shortcuts: [
        { key: 'V', desc: 'Select Tool' },
        { key: 'Q', desc: 'Lasso Selection Tool' },
        { key: 'H', desc: 'Hand / Pan Tool' },
        { key: 'P', desc: 'Pen / Freehand Draw' },
        { key: 'B', desc: 'Toggle Beautify Ink' },
        { key: 'E', desc: 'Eraser Tool' },
        { key: 'T', desc: 'Text Tool' },
        { key: 'S', desc: 'Sticky Note' },
        { key: 'R', desc: 'Rectangle Shape' },
        { key: 'O', desc: 'Circle / Ellipse' },
        { key: 'L', desc: 'Line Tool' },
        { key: 'A', desc: 'Arrow Tool' },
        { key: 'C', desc: 'Connector Tool' },
        { key: 'F', desc: 'Frame / Section' },
      ],
    },
    {
      title: 'Navigation & Viewport',
      shortcuts: [
        { key: 'Space + Drag', desc: 'Pan canvas smoothly' },
        { key: 'Scroll Wheel', desc: 'Zoom in / out at cursor' },
        { key: 'Ctrl + / -', desc: 'Zoom in / out' },
        { key: 'Ctrl + 0', desc: 'Reset zoom to 100%' },
        { key: 'Shift + 1', desc: 'Fit all objects to screen' },
      ],
    },
    {
      title: 'Edit & Object Management',
      shortcuts: [
        { key: 'Ctrl + Z', desc: 'Undo last change' },
        { key: 'Ctrl + Shift + Z', desc: 'Redo change' },
        { key: 'Ctrl + C', desc: 'Copy selected objects' },
        { key: 'Ctrl + V', desc: 'Paste copied objects or clipboard image' },
        { key: 'Ctrl + X', desc: 'Cut selected objects' },
        { key: 'Ctrl + D', desc: 'Duplicate selected objects' },
        { key: 'Delete / Backspace', desc: 'Delete selection' },
        { key: 'Ctrl + A', desc: 'Select all objects' },
        { key: 'Shift + Click', desc: 'Toggle multi-selection' },
        { key: 'Double Click', desc: 'Edit text or sticky note' },
        { key: 'Escape', desc: 'Deselect / Cancel active tool' },
      ],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 id="shortcuts-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Whiteboard Keyboard Shortcuts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Speed up your teaching, diagramming, and brainstorming workflow.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SHORTCUT_GROUPS.map((group, gIdx) => (
            <div
              key={group.title}
              className={`space-y-3 ${gIdx === 2 ? 'md:col-span-2' : ''}`}
            >
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {group.title}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {group.shortcuts.map((sc) => (
                  <div
                    key={sc.key}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {sc.desc}
                    </span>
                    <kbd className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shadow-2xs">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Tip: Paste screenshots straight onto canvas with Ctrl+V</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
