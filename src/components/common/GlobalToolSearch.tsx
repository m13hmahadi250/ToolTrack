import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ArrowRight, CornerDownLeft, Sparkles, AlertCircle } from 'lucide-react';
import { searchTools, getHighlightedText, getCategoryLabel, SearchResult } from '../../lib/searchEngine';
import { getIconComponent } from './MegaMenu';
import { useToolTrack } from '../../context/ToolTrackContext';
import type { ToolItem } from '../../types';

export interface GlobalToolSearchProps {
  variant?: 'header' | 'home' | 'mobile';
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  onSelectTool?: (toolId: string) => void;
  onQueryChange?: (query: string) => void;
  initialQuery?: string;
  autoFocus?: boolean;
}

export const GlobalToolSearch: React.FC<GlobalToolSearchProps> = ({
  variant = 'header',
  placeholder,
  className = '',
  inputClassName = '',
  onSelectTool,
  onQueryChange,
  initialQuery = '',
  autoFocus = false,
}) => {
  const { setActiveToolId, t } = useToolTrack();
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // Floating coordinates for portal overlay
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  }>({ top: 0, left: 0, width: 320, maxHeight: 400 });

  // Compute search results live on every keystroke
  const searchResults: SearchResult[] = searchTools(query, variant === 'home' ? 12 : 8);

  const defaultPlaceholder =
    placeholder ||
    (variant === 'home'
      ? t.searchPlaceholder || 'Search 60+ tools (e.g., PDF to Word, compress, resize, background)...'
      : variant === 'header'
      ? 'Search tools (Ctrl+K)...'
      : 'Search all document, image & utility tools...');

  // Update query state if initialQuery changes from outside
  useEffect(() => {
    if (initialQuery !== undefined && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Click outside listener that checks both container and portal panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInsideContainer = containerRef.current && containerRef.current.contains(target);
      const clickedInsidePanel = panelRef.current && panelRef.current.contains(target);
      if (!clickedInsideContainer && !clickedInsidePanel) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut listener: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing if user is typing inside a text editor / textarea
      const targetEl = e.target as HTMLElement;
      if (
        targetEl &&
        (targetEl.tagName === 'TEXTAREA' ||
          (targetEl.tagName === 'INPUT' && targetEl.getAttribute('data-tooltrack-search') !== variant))
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        // If on homepage, variant === 'home' should handle the search
        const hasHomeSearchOnPage = Boolean(
          document.querySelector('input[data-tooltrack-search="home"]')
        );

        if (variant === 'home') {
          e.preventDefault();
          e.stopPropagation();
          inputRef.current?.focus();
          inputRef.current?.select();
          setIsOpen(true);
        } else if (variant === 'header' && !hasHomeSearchOnPage) {
          e.preventDefault();
          e.stopPropagation();
          inputRef.current?.focus();
          inputRef.current?.select();
          setIsOpen(true);
        }
      }
    };

    const handleCustomTrigger = () => {
      const hasHomeSearchOnPage = Boolean(
        document.querySelector('input[data-tooltrack-search="home"]')
      );

      if (variant === 'home') {
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
      } else if (variant === 'header' && !hasHomeSearchOnPage) {
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('tooltrack:trigger-search', handleCustomTrigger);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('tooltrack:trigger-search', handleCustomTrigger);
    };
  }, [variant]);

  // Recalculate portal coordinates directly below active search input
  const updateCoords = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const margin = 12;

    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    let computedTop: number;
    let computedMaxHeight: number;

    if (spaceBelow < 200 && spaceAbove > spaceBelow) {
      computedMaxHeight = Math.max(160, Math.min(460, spaceAbove - 8));
      computedTop = Math.max(margin, rect.top - computedMaxHeight - 8);
    } else {
      computedTop = rect.bottom + 8;
      computedMaxHeight = Math.max(160, Math.min(480, spaceBelow));
    }

    if (variant === 'home') {
      const w = Math.min(rect.width, window.innerWidth - margin * 2);
      let l = rect.left;
      if (l < margin) l = margin;
      if (l + w > window.innerWidth - margin) l = window.innerWidth - w - margin;
      setCoords({
        top: computedTop,
        left: l,
        width: w,
        maxHeight: computedMaxHeight,
      });
    } else if (variant === 'header') {
      const w = Math.min(520, window.innerWidth - margin * 2);
      let l = rect.right - w;
      if (l < margin) l = margin;
      if (l + w > window.innerWidth - margin) l = window.innerWidth - w - margin;
      setCoords({
        top: computedTop,
        left: l,
        width: w,
        maxHeight: computedMaxHeight,
      });
    } else {
      // mobile drawer
      const w = window.innerWidth - margin * 2;
      const l = margin;
      setCoords({
        top: computedTop,
        left: l,
        width: w,
        maxHeight: Math.min(computedMaxHeight, 400),
      });
    }
  }, [variant]);

  useEffect(() => {
    if (!isOpen) return;
    updateCoords();

    const handleResizeOrScroll = () => {
      updateCoords();
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll);
    };
  }, [isOpen, updateCoords, searchResults.length]);

  // Auto-scroll active item into view during keyboard navigation
  useEffect(() => {
    if (selectedIndex >= 0 && panelRef.current) {
      const activeEl = panelRef.current.querySelector(
        `#tooltrack-search-item-${searchResults[selectedIndex]?.tool.id}`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, searchResults]);

  const handleSelect = (tool: ToolItem) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    setQuery('');
    onQueryChange?.('');
    if (onSelectTool) {
      onSelectTool(tool.id);
    } else {
      setActiveToolId(tool.id);
    }
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setSelectedIndex(0);
        return;
      }
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setSelectedIndex(searchResults.length - 1);
        return;
      }
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      if (searchResults.length > 0) {
        e.preventDefault();
        const target =
          selectedIndex >= 0 && selectedIndex < searchResults.length
            ? searchResults[selectedIndex].tool
            : searchResults[0].tool;
        handleSelect(target);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSelectedIndex(-1);
      if (query) {
        setQuery('');
        onQueryChange?.('');
      }
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery('');
    onQueryChange?.('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    setSelectedIndex(0);
    onQueryChange?.(val);
  };

  const isQueryEmpty = query.trim() === '';
  const isHome = variant === 'home';
  const isHeader = variant === 'header';
  const isMobile = variant === 'mobile';

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left ${isOpen ? 'z-50' : 'z-20'} ${isHeader ? 'max-w-xs md:max-w-sm' : ''} ${className}`}
    >
      {/* Search Input Container */}
      <div className="relative flex items-center">
        {isHome ? (
          <Search className="w-5 h-5 absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
        ) : (
          <Search className="w-4 h-4 absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
        )}

        <input
          ref={inputRef}
          type="text"
          data-tooltrack-search={variant}
          autoFocus={autoFocus}
          value={query}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={defaultPlaceholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            selectedIndex >= 0 && searchResults[selectedIndex]
              ? `tooltrack-search-item-${searchResults[selectedIndex].tool.id}`
              : undefined
          }
          className={
            inputClassName ||
            (isHome
              ? 'w-full pl-12 pr-11 py-3.5 rounded-2xl bg-white dark:bg-[#111C2E] text-[#101828] dark:text-[#F2F4F7] placeholder:text-[#667085] dark:placeholder:text-[#8292A9] border border-[#DCE3EF] dark:border-[#1E2D47] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm sm:text-base transition font-medium'
              : isHeader
              ? 'w-full pl-8 sm:pl-9 pr-14 py-1.5 text-xs sm:text-sm rounded-xl bg-[#EAF1FF]/80 hover:bg-[#EAF1FF] dark:bg-[#172338]/90 dark:hover:bg-[#172338] text-[#101828] dark:text-[#F2F4F7] placeholder:text-[#667085] dark:placeholder:text-[#8292A9] border border-[#DCE3EF] dark:border-[#1E2D47] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-2 focus:ring-[#2563EB]/20 focus:bg-white dark:focus:bg-[#111C2E] transition-all font-medium h-9'
              : 'w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-white dark:bg-[#111C2E] text-[#101828] dark:text-[#F2F4F7] placeholder:text-[#667085] dark:placeholder:text-[#8292A9] border border-[#DCE3EF] dark:border-[#1E2D47] focus:outline-none focus:ring-2 focus:ring-[#2563EB] font-medium')
          }
        />

        {/* Clear or Keyboard Shortcut badge */}
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className={`absolute ${
              isHome ? 'right-3.5' : 'right-2'
            } p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition`}
            aria-label="Clear search query"
            title="Clear search"
          >
            <X className={isHome ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          </button>
        ) : isHeader ? (
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-700/60 border border-slate-300/60 dark:border-slate-600/60 pointer-events-none select-none">
            ⌘K
          </kbd>
        ) : isHome ? (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-700/80 text-slate-400 dark:text-slate-400 pointer-events-none border border-slate-200/80 dark:border-slate-700">
            <kbd className="font-sans font-medium">Ctrl+K</kbd>
          </span>
        ) : null}
      </div>

      {/* Autocomplete Suggestions Dropdown Panel */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Subtle backdrop overlay so click outside is immediate and non-interfering */}
            <div
              className="fixed inset-0 z-[9998] bg-slate-900/10 dark:bg-slate-900/25 backdrop-blur-[0.5px] cursor-pointer"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            <div
              ref={panelRef}
              id={listboxId}
              role="listbox"
              style={{
                position: 'fixed',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                maxHeight: `${coords.maxHeight}px`,
              }}
              className="bg-white dark:bg-[#111C2E] rounded-2xl shadow-2xl border border-[#DCE3EF] dark:border-[#1E2D47] overflow-hidden z-[9999] animate-popover flex flex-col"
            >
            {/* Header indicator bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#DCE3EF] dark:border-[#1E2D47] bg-[#F5F8FF] dark:bg-[#172338] text-xs font-bold text-[#344054] dark:text-[#B8C4D6]">
              <span className="flex items-center gap-1.5">
                {isQueryEmpty ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Popular High-Utility Tools</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
                    <span>Matching Tools ({searchResults.length})</span>
                  </>
                )}
              </span>
              <span className="hidden sm:inline text-[11px] font-normal text-[#667085] dark:text-[#8292A9]">
                Navigate with ↑ ↓ • Press Enter to open
              </span>
            </div>

            {/* Results List */}
            <div className="overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
              {searchResults.length > 0 ? (
                searchResults.map(({ tool }, idx) => {
                  const Icon = getIconComponent(tool.iconName);
                  const isSelected = selectedIndex === idx;
                  const nameChunks = getHighlightedText(tool.name, query);

                  return (
                    <button
                      key={tool.id}
                      id={`tooltrack-search-item-${tool.id}`}
                      role="option"
                      aria-selected={isSelected}
                      type="button"
                      onMouseDown={(e) => {
                        // Prevent blur before click executes
                        e.preventDefault();
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={() => handleSelect(tool)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-start justify-between p-3 sm:p-3.5 rounded-xl text-left transition group cursor-pointer border ${
                        isSelected
                          ? 'bg-[#EAF1FF] dark:bg-[#172338] border-[#2563EB]/40 dark:border-[#3B82F6]/40 text-[#101828] dark:text-[#F2F4F7] shadow-2xs'
                          : 'border-transparent hover:bg-[#F5F8FF] dark:hover:bg-[#172338]/70 hover:border-[#DCE3EF] dark:hover:border-[#1E2D47] text-[#344054] dark:text-[#B8C4D6]'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Tool Icon */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all mt-0.5 shadow-2xs ${
                            isSelected
                              ? 'bg-[#2563EB] text-white shadow-sm'
                              : 'bg-[#EAF1FF] dark:bg-[#172338] text-[#2563EB] dark:text-[#3B82F6] group-hover:bg-[#2563EB] group-hover:text-white dark:group-hover:bg-[#2563EB] dark:group-hover:text-white'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Tool Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug break-words">
                              {nameChunks.map((chunk, cIdx) =>
                                chunk.isMatch ? (
                                  <mark
                                    key={cIdx}
                                    className="bg-amber-300 dark:bg-amber-400 text-slate-950 rounded-xs px-1 py-0.5 font-extrabold not-italic"
                                  >
                                    {chunk.text}
                                  </mark>
                                ) : (
                                  <span key={cIdx}>{chunk.text}</span>
                                )
                              )}
                            </p>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                                isSelected
                                  ? 'bg-[#EAF1FF] dark:bg-[#172338] text-[#2563EB] dark:text-[#3B82F6]'
                                  : 'bg-[#EAF1FF]/60 dark:bg-[#172338]/80 text-[#344054] dark:text-[#B8C4D6] border border-[#DCE3EF] dark:border-[#1E2D47]'
                              }`}
                            >
                              {getCategoryLabel(tool.category)}
                            </span>
                            {tool.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#EAF1FF] dark:bg-[#172338] text-[#2563EB] dark:text-[#3B82F6] border border-[#DCE3EF] dark:border-[#1E2D47] shrink-0">
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#667085] dark:text-[#8292A9] line-clamp-2 mt-1 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </div>

                      {/* Action Icon */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-3 mt-1">
                        {isSelected && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] dark:text-[#3B82F6]">
                            <span>Open</span>
                            <CornerDownLeft className="w-3 h-3" />
                          </span>
                        )}
                        <ArrowRight
                          className={`w-4 h-4 transition-transform ${
                            isSelected
                              ? 'text-[#2563EB] dark:text-[#3B82F6] translate-x-0.5'
                              : 'text-[#667085] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })
              ) : (
                // Empty search results state
                <div className="p-6 text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">
                      No tools found matching "{query}"
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Try searching for common terms like PDF, Image, Word, Compress, Resize, OCR, QR, or Calculator.
                    </p>
                  </div>

                  {/* Quick suggestion chips */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                    {['PDF', 'Image', 'Compress', 'Word', 'Calculator', 'QR Code', 'Resize', 'OCR'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          setQuery(chip);
                          onQueryChange?.(chip);
                          inputRef.current?.focus();
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer bar */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-medium">Client-side instant search</span>
              <span>Press Escape to close</span>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
