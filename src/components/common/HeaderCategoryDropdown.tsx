import React, { useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Layers } from 'lucide-react';
import type { CategoryHeaderConfig } from '../../data/categoryRegistry';
import { getToolsForHeaderCategory } from '../../data/categoryRegistry';
import { getIconComponent } from './MegaMenu';

interface HeaderCategoryDropdownProps {
  config: CategoryHeaderConfig;
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (toolId: string) => void;
  onViewAllCategory: (homepageCatId: string) => void;
}

export const HeaderCategoryDropdown: React.FC<HeaderCategoryDropdownProps> = ({
  config,
  isOpen,
  onClose,
  onSelectTool,
  onViewAllCategory,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tools = getToolsForHeaderCategory(config);

  // Close on outside click & Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay for closing when clicking on blank side space or blurred area */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/10 dark:bg-slate-900/25 backdrop-blur-[1px] animate-in fade-in duration-100 cursor-pointer"
        onClick={onClose}
      />

      <div
        ref={containerRef}
        role="menu"
        aria-label={`${config.name} category dropdown`}
        className="absolute top-full mt-2 left-0 w-[540px] md:w-[620px] lg:w-[680px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
      {/* Category Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {config.name}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {tools.length} Tools
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            {config.description}
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        {tools.map((tool) => {
          const Icon = getIconComponent(tool.iconName);

          return (
            <button
              key={tool.id}
              onClick={() => {
                onSelectTool(tool.id);
                onClose();
              }}
              role="menuitem"
              className="p-2.5 rounded-xl flex items-start gap-3 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/50 hover:border-indigo-200 dark:hover:border-indigo-800/80 border border-transparent transition-all group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform mt-0.5">
                <Icon className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {tool.name}
                  </span>
                  {tool.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 leading-tight">
                  {tool.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer "View All" Action */}
      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          Ready for local & browser-safe processing
        </span>
        <button
          onClick={() => {
            if (config.homepageCategoryId) {
              onViewAllCategory(config.homepageCategoryId);
            }
            onClose();
          }}
          className="inline-flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition cursor-pointer"
        >
          <span>View All {config.shortName} →</span>
        </button>
      </div>
    </div>
  </>
);
};
