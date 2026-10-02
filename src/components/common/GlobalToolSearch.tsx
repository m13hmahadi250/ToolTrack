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
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // Compute search results live on every keystroke
  const searchResults: SearchResult[] = searchTools(query, variant === 'home' ? 12 : 8);

  const defaultPlaceholder =
    placeholder ||
    (variant === 'home'
      ? t.searchPlaceholder || 'Search 35+ tools (e.g., PDF to Word, compress, resize, background)...'
      : variant === 'header'
      ? 'Search tools (Ctrl+K)...'
      : 'Search all document & image tools...');

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
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        // Only target desktop/matching variant
        if (variant !== 'mobile') {
          e.preventDefault();
          inputRef.current?.focus();
          inputRef.current?.select();
          setIsOpen(true);
        }
      }
    };

    const handleCustomTrigger = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('tooltrack:trigger-search', handleCustomTrigger);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('tooltrack:trigger-search', handleCustomTrigger);
    };
  }, [variant]);

  const handleSelect = (tool: ToolItem) => {
    setIsOpen(false);
    setSelectedIndex(-1);
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
        const target = selectedIndex >= 0 && selectedIndex < searchResults.length
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

  // Classes customized for variant
  const isHome = variant === 'home';
  const isHeader = variant === 'header';
  const isMobile = variant === 'mobile';

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isHeader ? 'max-w-xs md:max-w-sm' : ''} ${className}`}
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
              ? 'w-full pl-12 pr-11 py-3.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base transition'
              : isHeader
              ? 'w-full pl-9 pr-8 py-1.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 transition'
              : 'w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500')
          }
        />

        {/* Clear or Keyboard Shortcut badge */}
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className={`absolute ${
              isHome ? 'right-3.5' : 'right-2.5'
            } p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition`}
            aria-label="Clear search query"
            title="Clear search"
          >
            <X className={isHome ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          </button>
        ) : isHeader ? (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400 pointer-events-none">
            Ctrl+K
          </span>
        ) : isHome ? (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-700/80 text-slate-400 dark:text-slate-400 pointer-events-none border border-slate-200/80 dark:border-slate-700">
            <kbd className="font-sans font-medium">Ctrl+K</kbd>
          </span>
        ) : null}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className={`absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-700/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 ${
            isHome ? 'max-h-[460px]' : 'max-h-[380px]'
          } flex flex-col`}
        >
          {/* Header indicator bar */}
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              {isQueryEmpty ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Popular Tools</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5 text-indigo-500" />
                  <span>
                    Matching Tools ({searchResults.length})
                  </span>
                </>
              )}
            </span>
            <span className="hidden sm:inline text-[10px] font-normal text-slate-400">
              Navigate with ↑ ↓ • Press Enter to open
            </span>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
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
                    onClick={() => handleSelect(tool)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-left transition group cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-100'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Tool Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                          isSelected
                            ? 'bg-indigo-600 text-white scale-105 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 group-hover:scale-105'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Tool Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold truncate">
                            {nameChunks.map((chunk, cIdx) =>
                              chunk.isMatch ? (
                                <mark
                                  key={cIdx}
                                  className="bg-amber-200 dark:bg-amber-500/30 text-slate-900 dark:text-amber-200 rounded-xs px-0.5 font-extrabold"
                                >
                                  {chunk.text}
                                </mark>
                              ) : (
                                <span key={cIdx}>{chunk.text}</span>
                              )
                            )}
                          </p>
                          <span
                            className={`hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                              isSelected
                                ? 'bg-indigo-200/70 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {getCategoryLabel(tool.category)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Icon */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {isSelected && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
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
                    Try searching for common terms like PDF, Image, Word, Compress, Resize, OCR, or Convert.
                  </p>
                </div>

                {/* Quick suggestion chips */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                  {['Image', 'PDF', 'Word', 'Compress', 'Resize', 'OCR', 'Background'].map((chip) => (
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
          <div className="px-3.5 py-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between text-[10px] text-slate-400">
            <span>ToolTrack Search Engine</span>
            <span>Escape to close</span>
          </div>
        </div>
      )}
    </div>
  );
};
