import React, { useState, useRef, useEffect, useId } from 'react';
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

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  // Viewport bounds clamping for the results panel in all variants
  const [panelShift, setPanelShift] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const clampPanelToViewport = () => {
      const el = panelRef.current;
      if (!el) return;

      // Reset shift first to measure natural position
      el.style.transform = 'none';
      const rect = el.getBoundingClientRect();
      const margin = 12;

      let shift = 0;
      if (rect.left < margin) {
        shift = margin - rect.left;
      } else if (rect.right > window.innerWidth - margin) {
        shift = window.innerWidth - margin - rect.right;
      }

      setPanelShift(shift);
      el.style.transform = shift !== 0 ? `translateX(${shift}px)` : 'none';
    };

    clampPanelToViewport();
    window.addEventListener('resize', clampPanelToViewport);
    window.addEventListener('scroll', clampPanelToViewport, { passive: true });
    return () => {
      window.removeEventListener('resize', clampPanelToViewport);
      window.removeEventListener('scroll', clampPanelToViewport);
    };
  }, [isOpen, variant, searchResults.length]);

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
              ? 'w-full pl-12 pr-11 py-3.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base transition font-medium'
              : isHeader
              ? 'w-full pl-8 sm:pl-9 pr-14 py-1.5 text-xs sm:text-sm rounded-xl bg-slate-100/90 hover:bg-slate-100 dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200/90 dark:border-slate-700/80 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium h-9'
              : 'w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium')
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
      {isOpen && (
        <>
          {/* Subtle backdrop overlay so click outside is immediate and non-interfering */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/10 dark:bg-slate-900/25 backdrop-blur-[0.5px] animate-in fade-in duration-100 cursor-pointer"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            ref={panelRef}
            id={listboxId}
            role="listbox"
            style={
              panelShift !== 0
                ? { transform: `translateX(${panelShift}px)` }
                : undefined
            }
            className={`absolute top-full mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-700/80 overflow-hidden z-50 animate-popover flex flex-col ${
              isHeader
                ? 'w-[calc(100vw-2rem)] sm:w-[480px] md:w-[540px] right-0 left-auto max-w-[calc(100vw-2rem)]'
                : 'w-full left-0 right-0 max-w-[calc(100vw-2rem)]'
            } ${
              isHome
                ? 'max-h-[min(480px,calc(100vh-140px))]'
                : 'max-h-[min(440px,calc(100vh-140px))]'
            }`}
          >
            {/* Header indicator bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/70 text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                {isQueryEmpty ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Popular High-Utility Tools</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Matching Tools ({searchResults.length})</span>
                  </>
                )}
              </span>
              <span className="hidden sm:inline text-[11px] font-normal text-slate-400 dark:text-slate-500">
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
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-50 shadow-2xs'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:border-slate-200 dark:hover:border-slate-700/60 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Tool Icon */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all mt-0.5 shadow-2xs ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-600 dark:group-hover:text-white'
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
                                  ? 'bg-indigo-200/80 dark:bg-indigo-900/70 text-indigo-900 dark:text-indigo-200'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
                              }`}
                            >
                              {getCategoryLabel(tool.category)}
                            </span>
                            {tool.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 shrink-0">
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </div>

                      {/* Action Icon */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-3 mt-1">
                        {isSelected && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            <span>Open</span>
                            <CornerDownLeft className="w-3 h-3" />
                          </span>
                        )}
                        <ArrowRight
                          className={`w-4 h-4 transition-transform ${
                            isSelected
                              ? 'text-indigo-600 dark:text-indigo-400 translate-x-0.5'
                              : 'text-slate-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5'
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
        </>
      )}
    </div>
  );
};
