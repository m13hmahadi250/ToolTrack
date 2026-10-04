import React, { useState } from 'react';
import { Search, X, Type, StickyNote, Maximize, ArrowRight } from 'lucide-react';
import { WhiteboardElement } from '../../types/whiteboard';

interface WhiteboardSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: WhiteboardElement[];
  onFocusElement: (element: WhiteboardElement) => void;
}

export const WhiteboardSearchModal: React.FC<WhiteboardSearchModalProps> = ({
  isOpen,
  onClose,
  elements,
  onFocusElement,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  // Searchable text, stickies and frames
  const matches = elements.filter((el) => {
    if (!query.trim()) return false;
    const q = query.toLowerCase();
    if (el.type === 'text' && el.text) {
      return el.text.toLowerCase().includes(q);
    }
    if (el.type === 'sticky' && el.text) {
      return el.text.toLowerCase().includes(q);
    }
    if (el.type === 'frame' && el.frameTitle) {
      return el.frameTitle.toLowerCase().includes(q);
    }
    return false;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-dialog-title"
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden space-y-4">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 pt-4 gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Search className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search words, notes, equations, or frame titles..."
            autoFocus
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto px-4 pb-4 space-y-2 text-xs">
          {!query.trim() && (
            <p className="text-center py-6 text-slate-400">
              Type to search text notes, sticky ideas, and frames on this board.
            </p>
          )}

          {query.trim() && matches.length === 0 && (
            <p className="text-center py-6 text-slate-400">
              No matching notes or elements found for &quot;{query}&quot;.
            </p>
          )}

          {matches.map((el) => {
            const content = el.text || el.frameTitle || 'Object';
            return (
              <button
                key={el.id}
                onClick={() => {
                  onFocusElement(el);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 text-indigo-500 shrink-0">
                    {el.type === 'text' && <Type className="w-4 h-4" />}
                    {el.type === 'sticky' && <StickyNote className="w-4 h-4 text-amber-500" />}
                    {el.type === 'frame' && <Maximize className="w-4 h-4 text-cyan-500" />}
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {content}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {el.type.replace('_', ' ')} • Position ({Math.round(el.x)}, {Math.round(el.y)})
                    </span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
