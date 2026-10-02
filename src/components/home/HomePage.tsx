import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  ArrowRight,
  Maximize2,
  X,
  FileQuestion,
  GraduationCap,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Lock,
  ShieldCheck,
  Sparkles,
  FileText,
  Clock,
  Trash2,
  Star,
} from 'lucide-react';
import { useToolTrack } from '../../context/ToolTrackContext';
import { TOOLS_LIST } from '../../data/toolsList';
import { POPULAR_TOOL_IDS } from '../../data/categoryRegistry';
import { getIconComponent } from '../common/MegaMenu';
import { GlobalToolSearch } from '../common/GlobalToolSearch';
import { searchTools, getCategoryLabel } from '../../lib/searchEngine';

export const HomePage: React.FC = () => {
  const {
    setActiveToolId,
    t,
    recentToolIds,
    clearRecentTools,
    favoriteToolIds,
    toggleFavoriteTool,
    isFavoriteTool,
    clearFavoriteTools,
  } = useToolTrack();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Derive recently accessed tools list
  const recentTools = useMemo(() => {
    return (recentToolIds || [])
      .map((id) => TOOLS_LIST.find((t) => t.id === id))
      .filter(Boolean) as typeof TOOLS_LIST;
  }, [recentToolIds]);

  // Derive favorite tools list
  const favoriteTools = useMemo(() => {
    return (favoriteToolIds || [])
      .map((id) => TOOLS_LIST.find((t) => t.id === id))
      .filter(Boolean) as typeof TOOLS_LIST;
  }, [favoriteToolIds]);

  // Listen for category selection events (e.g. from header dropdown "View All")
  useEffect(() => {
    const handleSelectCategory = (e: Event) => {
      const customEvent = e as CustomEvent<{ categoryId: string }>;
      if (customEvent.detail && customEvent.detail.categoryId) {
        setActiveCategory(customEvent.detail.categoryId);
      }
    };

    window.addEventListener('tooltrack:select-category', handleSelectCategory);
    return () => {
      window.removeEventListener('tooltrack:select-category', handleSelectCategory);
    };
  }, []);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Tools' },
    { id: 'image-tools', label: 'Image Tools' },
    { id: 'design-tools', label: 'Design Utilities' },
    { id: 'student-tools', label: 'Student Tools' },
    { id: 'page-tools', label: 'Page Tools' },
    { id: 'organize', label: 'Organize PDF' },
    { id: 'optimize', label: 'Optimize & Compress' },
    { id: 'convert-to-pdf', label: 'Convert to PDF' },
    { id: 'convert-from-pdf', label: 'Convert from PDF' },
    { id: 'security', label: 'Security' },
    { id: 'ocr', label: 'OCR' },
  ];

  const popularTools = useMemo(() => {
    return POPULAR_TOOL_IDS.map((id) => TOOLS_LIST.find((t) => t.id === id)).filter(Boolean) as typeof TOOLS_LIST;
  }, []);

  const displayedTools = useMemo(() => {
    if (!searchQuery.trim()) {
      return activeCategory === 'all'
        ? TOOLS_LIST
        : TOOLS_LIST.filter((tool) => tool.category === activeCategory);
    }
    const scoredResults = searchTools(searchQuery, 40);
    const scoredTools = scoredResults.map((s) => s.tool);
    return activeCategory === 'all'
      ? scoredTools
      : scoredTools.filter((tool) => tool.category === activeCategory);
  }, [searchQuery, activeCategory]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (displayedTools.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSearchIndex((prev) => (prev < displayedTools.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSearchIndex((prev) => (prev > 0 ? prev - 1 : displayedTools.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSearchIndex >= 0 && selectedSearchIndex < displayedTools.length) {
        setActiveToolId(displayedTools[selectedSearchIndex].id);
      } else if (displayedTools.length > 0) {
        setActiveToolId(displayedTools[0].id);
      }
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      setSelectedSearchIndex(-1);
    }
  };

  const faqs = [
    {
      q: 'Is my file stored or uploaded to a remote server?',
      a: 'No. ToolTrack processes all documents, images, and spreadsheets locally inside your browser memory using WebAssembly and client-side HTML5 APIs. No document contents are permanently stored or uploaded to external clouds.',
    },
    {
      q: 'Can I use ToolTrack on mobile phones and tablets?',
      a: 'Yes. Every tool interface is fully responsive and designed for smartphones, iPads, tablets, laptops, and desktops, with full touch and drag-and-drop support.',
    },
    {
      q: 'How does PDF compression work without losing text clarity?',
      a: 'ToolTrack strips unreferenced PDF dictionary streams, optimizes internal fonts, and optionally scales raster images while preserving vector text and line art with 100% sharpness.',
    },
    {
      q: 'Can I convert PDF to Word with diagrams, tables, and borders preserved?',
      a: 'Yes. ToolTrack uses a layout-aware hybrid conversion engine that reconstructs question badges, headings, callout boxes, and tables into native Word elements, while embedding complex vector diagrams (like the Food Pyramid) as crisp high-resolution images at exact page coordinates.',
    },
    {
      q: 'Does OCR support Bengali and Arabic?',
      a: 'Yes. The integrated Tesseract WebAssembly engine includes dedicated language models for English, Bengali (বাংলা), and Arabic (العربية), generating searchable PDFs and extractable text.',
    },
    {
      q: 'Can I process multiple files in batch?',
      a: 'Yes. Tools like Image Compressor, Image Converter, Merge PDF, and Images to PDF support batch uploading and processing with convenient ZIP download options.',
    },
    {
      q: 'What happens to uploaded files when I finish?',
      a: 'As soon as you download your file, click "Start Again", or close your browser tab, all temporary object URLs and in-memory byte buffers are immediately garbage-collected and destroyed.',
    },
  ];

  return (
    <div className="space-y-16 py-6 sm:py-10 animate-in fade-in duration-300">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6 px-4">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>100% In-Browser & Client-Side Privacy — Zero Server Uploads</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {t.heroTitle}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t.heroSubtitle}
        </p>

        {/* Search Input with Live Autocomplete & Dropdown */}
        <div className="max-w-xl mx-auto pt-1">
          <GlobalToolSearch
            variant="home"
            initialQuery={searchQuery}
            onQueryChange={(q) => {
              setSearchQuery(q);
              setSelectedSearchIndex(0);
            }}
          />

          {/* Quick Access Popular Tools */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Popular:</span>
            {[
              { id: 'pdf-to-word', label: 'PDF to Word' },
              { id: 'compress-pdf', label: 'Compress PDF' },
              { id: 'normalize-pdf-page-size', label: 'Normalize Size' },
              { id: 'image-background-remover', label: 'Remove Background' },
              { id: 'merge-pdf', label: 'Merge PDF' },
              { id: 'ocr-pdf', label: 'OCR Scan' },
            ].map((quick) => (
              <button
                key={quick.id}
                onClick={() => setActiveToolId(quick.id)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-600 border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer text-[11px] font-medium"
              >
                {quick.label}
              </button>
            ))}
          </div>
        </div>

        {/* Public Trust Proof Bar */}
        <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">100% Client-Side</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Zero cloud storage</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">WebAssembly Engine</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Instant offline speed</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">35+ Full Tools</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">PDF, images & OCR</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Zero Watermarks</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">No account required</div>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship Feature Spotlight Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-10 text-white shadow-xl border border-indigo-700/40">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Flagship Utility</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Normalize PDF Page Size & Proportions
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Tired of PDFs with inconsistent page dimensions (A4, US Letter, A5, and rotated scans)? ToolTrack inspects every page stream and standardizes the entire document into uniform dimensions without vector distortion or text clipping.
              </p>

              {/* Supported standard formats */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
                <span className="font-semibold text-slate-400">Supported Standards:</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-200 font-mono text-[11px]">A4 (210×297mm)</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-200 font-mono text-[11px]">US Letter</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-200 font-mono text-[11px]">US Legal</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-200 font-mono text-[11px]">A3 & Custom</span>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setActiveToolId('normalize-pdf-page-size')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-indigo-50 transition shadow-md cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4 text-indigo-600" />
                  <span>Launch Page Normalizer</span>
                  <ArrowRight className="w-4 h-4 ml-1 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Visual representation */}
            <div className="hidden lg:flex items-center justify-center p-6 bg-slate-800/40 rounded-2xl border border-slate-700/60 shrink-0">
              <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
                <div className="space-y-2 text-center">
                  <div className="text-[11px] text-slate-400">Mixed Pages</div>
                  <div className="flex items-end gap-1.5 h-24 justify-center">
                    <div className="w-8 h-16 bg-slate-700 border border-slate-500 rounded-sm flex items-center justify-center text-[9px]">A5</div>
                    <div className="w-12 h-20 bg-slate-700 border border-slate-500 rounded-sm flex items-center justify-center text-[9px]">Letter</div>
                    <div className="w-14 h-12 bg-slate-700 border border-slate-500 rounded-sm flex items-center justify-center text-[9px]">Land</div>
                  </div>
                </div>

                <div className="text-indigo-400 font-bold text-lg">→</div>

                <div className="space-y-2 text-center">
                  <div className="text-[11px] text-emerald-400 font-semibold">Uniform Output</div>
                  <div className="flex items-end gap-1.5 h-24 justify-center">
                    <div className="w-10 h-22 bg-indigo-600/60 border border-indigo-400 rounded-sm flex items-center justify-center text-[9px] text-white">A4</div>
                    <div className="w-10 h-22 bg-indigo-600/60 border border-indigo-400 rounded-sm flex items-center justify-center text-[9px] text-white">A4</div>
                    <div className="w-10 h-22 bg-indigo-600/60 border border-indigo-400 rounded-sm flex items-center justify-center text-[9px] text-white">A4</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Favorite Tools Section */}
      {!searchQuery && favoriteTools.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Favorite Tools</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                    {favoriteTools.length}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Your starred shortcuts for rapid access
                </p>
              </div>
            </div>

            <button
              onClick={clearFavoriteTools}
              className="text-xs font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
              title="Clear favorite tools"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Favorites</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {favoriteTools.map((tool) => {
              const Icon = getIconComponent(tool.iconName);
              const isFav = isFavoriteTool(tool.id);

              return (
                <div
                  key={tool.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveToolId(tool.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveToolId(tool.id);
                    }
                  }}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200/70 dark:border-amber-900/40 hover:border-amber-400 dark:hover:border-amber-500 shadow-xs hover:shadow-md transition-all text-left group flex flex-col justify-between h-44 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteTool(tool.id);
                        }}
                        className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition cursor-pointer"
                        title="Remove from favorites"
                        aria-label="Remove from favorites"
                      >
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      </button>
                    </div>

                    <div>
                      <div className="text-[11px] font-medium text-slate-400 dark:text-slate-400 mb-0.5">
                        {getCategoryLabel(tool.category)}
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 leading-snug">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span>Launch Tool</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recently Used Tools Section */}
      {!searchQuery && recentTools.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{t.recentlyUsed}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                    {recentTools.length}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  {t.recentlyUsedSubtitle}
                </p>
              </div>
            </div>

            <button
              onClick={clearRecentTools}
              className="text-xs font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
              title="Clear recently used history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearHistory || 'Clear History'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {recentTools.map((tool) => {
              const Icon = getIconComponent(tool.iconName);
              return (
                <div
                  key={tool.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveToolId(tool.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveToolId(tool.id);
                    }
                  }}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-indigo-100/80 dark:border-indigo-950/60 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-xs hover:shadow-md transition-all text-left group flex flex-col justify-between h-44 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        <span>Recent</span>
                      </span>
                    </div>

                    <div>
                      <div className="text-[11px] font-medium text-slate-400 dark:text-slate-400 mb-0.5">
                        {getCategoryLabel(tool.category)}
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 leading-snug">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                    <span>Resume Tool</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Popular Tools Grid */}
      {!searchQuery && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t.popularTools}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                The most frequently used document utilities
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {popularTools.map((tool) => {
              const Icon = getIconComponent(tool.iconName);
              return (
                <div
                  key={tool.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveToolId(tool.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveToolId(tool.id);
                    }
                  }}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-xs hover:shadow-md transition-all text-left group flex flex-col justify-between h-44 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {tool.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                            {tool.badge}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteTool(tool.id);
                          }}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            isFavoriteTool(tool.id)
                              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/60'
                              : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                          title={isFavoriteTool(tool.id) ? 'Remove favorite' : 'Add to favorites'}
                          aria-label={isFavoriteTool(tool.id) ? 'Remove favorite' : 'Add to favorites'}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              isFavoriteTool(tool.id) ? 'fill-amber-400 text-amber-500' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-slate-400 dark:text-slate-400 mb-0.5">
                        {getCategoryLabel(tool.category)}
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 leading-snug">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                    <span>Open Tool</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Categorized Tools Directory */}
      <section id="tools-directory" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {searchQuery ? `Search Results (${displayedTools.length})` : 'All Document Utilities'}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {displayedTools.length} Tools Available
            </span>
          </div>

          {/* Category Filter Segmented Control (hidden during specific search query) */}
          {!searchQuery && (
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex items-center gap-1 overflow-x-auto scrollbar-none border border-slate-200/60 dark:border-slate-700/60" role="tablist">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                  role="tab"
                  aria-selected={activeCategory === cat.id}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tools Grid or "No Tools Found" state */}
        {displayedTools.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <FileQuestion className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                No tools found for "{searchQuery}"
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Try searching for general keywords like "compress", "word", "page size", or "image".
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setSearchQuery('compress')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer"
              >
                Compress Tools
              </button>
              <button
                onClick={() => setSearchQuery('word')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer"
              >
                Word Tools
              </button>
              <button
                onClick={() => setSearchQuery('page size')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer"
              >
                Page Size Tools
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedTools.map((tool, idx) => {
              const Icon = getIconComponent(tool.iconName);
              const isSelected = selectedSearchIndex === idx;

              return (
                <div
                  key={tool.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveToolId(tool.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveToolId(tool.id);
                    }
                  }}
                  className={`p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all text-left group flex flex-col justify-between h-44 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 group-hover:text-indigo-600 transition flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {tool.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {tool.badge}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteTool(tool.id);
                          }}
                          className={`p-1 rounded-md transition cursor-pointer ${
                            isFavoriteTool(tool.id)
                              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/60'
                              : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                          title={isFavoriteTool(tool.id) ? 'Remove favorite' : 'Add to favorites'}
                          aria-label={isFavoriteTool(tool.id) ? 'Remove favorite' : 'Add to favorites'}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              isFavoriteTool(tool.id) ? 'fill-amber-400 text-amber-500' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-slate-400 dark:text-slate-400 mb-0.5">
                        {getCategoryLabel(tool.category)}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    <span>Use Tool</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* How ToolTrack Works Section */}
      {!searchQuery && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How ToolTrack Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Three simple steps with 100% private, client-side browser execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-extrabold text-base flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Select Any File</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Drag and drop your PDF, image, spreadsheet, or document. Files load directly into secure browser memory.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-extrabold text-base flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Configure & Process</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Adjust page size, compression level, or target formats. WebAssembly algorithms run high-fidelity transforms instantly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-extrabold text-base flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Download Clean File</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Download your converted or compressed document immediately. No waiting queues, watermarks, or account limits.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Student & Academic Workflow Section */}
      {!searchQuery && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4" />
                  <span>Student & Educator Workflows</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  Built for Fast Academic Work
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
                Streamline homework submissions, lecture note conversions, thesis formatting, and portal file size requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveToolId('assignment-pdf-maker')}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left transition group cursor-pointer"
              >
                <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center justify-between">
                  <span>Make Assignment PDF</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Combine photos of handwritten assignment sheets with cover details & A4 layout.
                </p>
              </button>

              <button
                onClick={() => setActiveToolId('pdf-submission-compressor')}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left transition group cursor-pointer"
              >
                <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center justify-between">
                  <span>Compress PDF for Submission</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Shrink PDFs down to meet 1MB, 2MB, or 5MB university portal upload limits.
                </p>
              </button>

              <button
                onClick={() => setActiveToolId('pdf-to-word')}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left transition group cursor-pointer"
              >
                <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center justify-between">
                  <span>Convert PDF to Word</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Reconstruct locked slides and lecture sheets into editable Word DOCX.
                </p>
              </button>

              <button
                onClick={() => setActiveToolId('ocr-pdf')}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left transition group cursor-pointer"
              >
                <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center justify-between">
                  <span>Scan Notes with OCR</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Extract text from scanned textbooks, handwritten notes, and photos.
                </p>
              </button>

              <button
                onClick={() => setActiveToolId('image-cropper')}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left transition group cursor-pointer"
              >
                <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center justify-between">
                  <span>Resize Image</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Resize dimensions by exact pixels, percentage, or crop presets.
                </p>
              </button>

              <button
                onClick={() => setActiveToolId('image-background-remover')}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left transition group cursor-pointer"
              >
                <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center justify-between">
                  <span>Remove Image Background</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Extract transparent PNG cutouts with true alpha channel & edge refinement.
                </p>
              </button>

              <button
                onClick={() => setActiveToolId('image-converter')}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left transition group cursor-pointer"
              >
                <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center justify-between">
                  <span>Convert Image Format</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Convert between JPG, PNG, WEBP, and BMP with quality protection.
                </p>
              </button>

              <button
                onClick={() => setActiveToolId('notes-to-pdf')}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left transition group cursor-pointer"
              >
                <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center justify-between">
                  <span>Notes to PDF Scanner</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Auto-enhance whiteboard and handwritten notes into uniform A4 study sheets.
                </p>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Frequently Asked Questions (FAQ) */}
      {!searchQuery && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Clear, transparent answers on privacy, conversion fidelity, and file limits.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
