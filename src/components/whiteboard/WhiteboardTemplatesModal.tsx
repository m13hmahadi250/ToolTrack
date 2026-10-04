import React, { useState } from 'react';
import { X, Sparkles, Plus, Check } from 'lucide-react';
import { WHITEBOARD_TEMPLATES, BoardTemplate } from '../../lib/whiteboardTemplates';
import { WhiteboardBoard } from '../../types/whiteboard';

interface WhiteboardTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: BoardTemplate) => void;
}

export const WhiteboardTemplatesModal: React.FC<WhiteboardTemplatesModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = WHITEBOARD_TEMPLATES.filter((tpl) => {
    if (selectedCategory === 'all') return true;
    return tpl.category === selectedCategory;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="templates-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="templates-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Whiteboard Starter Templates
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kickstart your brainstorming, lectures, flowcharts, or system diagrams.
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

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Templates' },
            { id: 'education', label: 'Education & Classes' },
            { id: 'engineering', label: 'Flowcharts & Systems' },
            { id: 'planning', label: 'Mind Maps & Planning' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 hover:border-indigo-500/50 hover:shadow-lg transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {tpl.name}
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    {tpl.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onApplyTemplate(tpl);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Use This Template</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
