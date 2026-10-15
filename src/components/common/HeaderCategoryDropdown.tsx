import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CategoryHeaderConfig } from '../../data/categoryRegistry';
import { getToolsForHeaderCategory } from '../../data/categoryRegistry';
import { getIconComponent } from './MegaMenu';

interface HeaderCategoryDropdownProps {
  config: CategoryHeaderConfig;
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (toolId: string) => void;
  onViewAllCategory: (homepageCatId: string) => void;
  triggerElement?: HTMLElement | null;
}

export const HeaderCategoryDropdown: React.FC<HeaderCategoryDropdownProps> = ({
  config,
  isOpen,
  onClose,
  onSelectTool,
  onViewAllCategory,
  triggerElement,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tools = getToolsForHeaderCategory(config);

  const [position, setPosition] = useState<{ top: number; left: number; width: number }>({
    top: 64,
    left: 16,
    width: 580,
  });

  // Calculate clamped viewport position whenever opened, resized, or scrolled
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const dropdownWidth = Math.min(580, window.innerWidth - 32);
      let top = 64;
      let left = 16;

      if (triggerElement) {
        const rect = triggerElement.getBoundingClientRect();
        top = rect.bottom + 8;
        left = rect.left;

        // Prevent extending outside right edge of the viewport
        if (left + dropdownWidth > window.innerWidth - 16) {
          left = window.innerWidth - dropdownWidth - 16;
        }
        // Prevent extending outside left edge of the viewport
        if (left < 16) {
          left = 16;
        }
      } else {
        left = Math.max(16, (window.innerWidth - dropdownWidth) / 2);
      }

      setPosition({ top, left, width: dropdownWidth });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen, triggerElement]);

  // Close on outside click & Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        triggerElement &&
        !triggerElement.contains(e.target as Node)
      ) {
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
  }, [isOpen, onClose, triggerElement]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Backdrop overlay for closing when clicking on blank side space */}
      <div
        className="fixed inset-0 z-[9998] bg-slate-900/10 dark:bg-slate-900/30 backdrop-blur-[1px] animate-in fade-in duration-100 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={containerRef}
        role="menu"
        aria-label={`${config.name} category dropdown`}
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          maxWidth: 'calc(100vw - 32px)',
        }}
        className="bg-white dark:bg-[#111C2E] border border-[#DCE3EF] dark:border-[#1E2D47] rounded-2xl shadow-2xl p-4 sm:p-5 z-[9999] animate-popover cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Category Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DCE3EF] dark:border-[#1E2D47]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#3B82F6]">
                {config.name}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF1FF] dark:bg-[#172338] text-[#2563EB] dark:text-[#3B82F6] border border-[#DCE3EF] dark:border-[#1E2D47]">
                {tools.length} Tools
              </span>
            </div>
            <p className="text-xs text-[#667085] dark:text-[#8292A9] mt-0.5 leading-snug">
              {config.description}
            </p>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 max-h-[min(440px,calc(100vh-140px))] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
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
                className="p-2.5 sm:p-3 rounded-xl flex items-start gap-3 hover:bg-[#EAF1FF]/60 dark:hover:bg-[#172338]/80 transition-all group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] border border-transparent hover:border-[#DCE3EF] dark:hover:border-[#1E2D47]"
              >
                <div className="w-9 h-9 rounded-xl bg-[#EAF1FF] dark:bg-[#172338] text-[#2563EB] dark:text-[#3B82F6] group-hover:bg-[#2563EB] group-hover:text-white dark:group-hover:bg-[#2563EB] dark:group-hover:text-white flex items-center justify-center shrink-0 transition-colors mt-0.5 shadow-2xs">
                  <Icon className="w-4.5 h-4.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm text-[#101828] dark:text-[#F2F4F7] group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition-colors leading-snug break-words">
                      {tool.name}
                    </span>
                    {tool.badge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#EAF1FF] dark:bg-[#172338] text-[#2563EB] dark:text-[#3B82F6] border border-[#DCE3EF] dark:border-[#1E2D47] shrink-0">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#667085] dark:text-[#8292A9] line-clamp-2 mt-1 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer "View All" Action */}
        <div className="pt-3 mt-3 border-t border-[#DCE3EF] dark:border-[#1E2D47] flex items-center justify-between text-xs">
          <span className="text-[#667085] dark:text-[#8292A9] font-medium">
            Private, in-browser processing
          </span>
          <button
            onClick={() => {
              if (config.homepageCategoryId) {
                onViewAllCategory(config.homepageCategoryId);
              }
              onClose();
            }}
            className="inline-flex items-center gap-1.5 font-semibold text-[#2563EB] dark:text-[#3B82F6] hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] hover:underline transition cursor-pointer"
          >
            <span>View All {config.shortName} →</span>
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};
