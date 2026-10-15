import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Trash2,
  Star,
  PenTool,
  Image as ImageIcon,
  FileSpreadsheet,
  Layers,
  ArrowRightLeft,
  X,
  FileQuestion,
  FileCode2,
  Wand2,
  Scissors,
  Minimize2,
  LayoutGrid,
} from 'lucide-react';
import { useToolTrack } from '../../context/ToolTrackContext';
import { TOOLS_LIST } from '../../data/toolsList';
import { getIconComponent } from '../common/MegaMenu';
import { GlobalToolSearch } from '../common/GlobalToolSearch';
import { searchTools, getCategoryLabel } from '../../lib/searchEngine';
import { ToolCardSkeletonGrid } from '../common/SkeletonLoader';

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
  const [isSwitchingCategory, setIsSwitchingCategory] = useState(false);
  const [directoryFilter, setDirectoryFilter] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

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

  const handleCategorySelect = (categoryId: string) => {
    if (categoryId === activeCategory) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      setIsSwitchingCategory(true);
      setTimeout(() => {
        setIsSwitchingCategory(false);
      }, 140);
    }
    setActiveCategory(categoryId);
  };

  // Listen for category selection events (e.g. from header dropdown "View All")
  useEffect(() => {
    const handleSelectCategory = (e: Event) => {
      const customEvent = e as CustomEvent<{ categoryId: string }>;
      if (customEvent.detail && customEvent.detail.categoryId) {
        const catId = customEvent.detail.categoryId;
        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          setIsSwitchingCategory(true);
          setTimeout(() => {
            setIsSwitchingCategory(false);
          }, 140);
        }
        setActiveCategory(catId);
      }
    };

    window.addEventListener('tooltrack:select-category', handleSelectCategory);
    return () => {
      window.removeEventListener('tooltrack:select-category', handleSelectCategory);
    };
  }, []);

  const categories: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'All Tools', count: TOOLS_LIST.length },
    {
      id: 'pdf',
      label: 'PDF & Documents',
      count: TOOLS_LIST.filter((t) =>
        ['page-tools', 'organize', 'optimize', 'security', 'inspector'].includes(t.category)
      ).length,
    },
    {
      id: 'convert',
      label: 'Office & Convert',
      count: TOOLS_LIST.filter((t) =>
        ['convert-to-pdf', 'convert-from-pdf'].includes(t.category)
      ).length,
    },
    {
      id: 'image-tools',
      label: 'Image Studio',
      count: TOOLS_LIST.filter((t) => t.category === 'image-tools').length,
    },
    {
      id: 'ocr',
      label: 'OCR & Scanner',
      count: TOOLS_LIST.filter((t) => t.category === 'ocr').length,
    },
    {
      id: 'student-tools',
      label: 'Student Suite',
      count: TOOLS_LIST.filter((t) => t.category === 'student-tools').length,
    },
    {
      id: 'design-tools',
      label: 'Design & Canvas',
      count: TOOLS_LIST.filter((t) => t.category === 'design-tools').length,
    },
    {
      id: 'utilities',
      label: 'Everyday Utilities',
      count: TOOLS_LIST.filter((t) => t.category === 'utilities').length,
    },
    {
      id: 'security',
      label: 'Security',
      count: TOOLS_LIST.filter((t) => t.category === 'security').length,
    },
  ];

  // Exactly 8 high-utility quick action tools near the top
  const popularTools = useMemo(() => {
    const curatedIds = [
      'compress-pdf',
      'merge-pdf',
      'pdf-to-word',
      'images-to-pdf',
      'image-background-remover',
      'image-compressor',
      'image-resizer',
      'whiteboard',
    ];
    return curatedIds.map((id) => TOOLS_LIST.find((t) => t.id === id)).filter(Boolean) as typeof TOOLS_LIST;
  }, []);

  // Filtered tools directory
  const displayedTools = useMemo(() => {
    let baseList = TOOLS_LIST;

    if (activeCategory !== 'all') {
      if (activeCategory === 'pdf') {
        baseList = TOOLS_LIST.filter((tool) =>
          ['page-tools', 'organize', 'optimize', 'security', 'inspector'].includes(tool.category)
        );
      } else if (activeCategory === 'convert') {
        baseList = TOOLS_LIST.filter((tool) =>
          ['convert-to-pdf', 'convert-from-pdf'].includes(tool.category)
        );
      } else if (activeCategory === 'ocr') {
        baseList = TOOLS_LIST.filter((tool) => tool.category === 'ocr');
      } else if (activeCategory === 'utilities') {
        baseList = TOOLS_LIST.filter((tool) => tool.category === 'utilities');
      } else {
        baseList = TOOLS_LIST.filter((tool) => tool.category === activeCategory);
      }
    }

    if (!directoryFilter.trim()) {
      return baseList;
    }

    const scoredResults = searchTools(directoryFilter, 40);
    const scoredIds = new Set(scoredResults.map((s) => s.tool.id));
    return baseList.filter((tool) => scoredIds.has(tool.id));
  }, [directoryFilter, activeCategory]);

  const faqs = [
    {
      q: 'Are my files uploaded or stored on any server?',
      a: 'No. ToolTrack processes all documents, images, and text locally in your browser memory using WebAssembly and HTML5 APIs. Nothing is uploaded to a remote server or cloud database.',
    },
    {
      q: 'Do tools like calculators, password generators, and QR codes work offline?',
      a: 'Yes. Once loaded, ToolTrack functions as a Progressive Web App (PWA). All text tools, QR generators, calculators, and offline PDF tools continue working even without an active internet connection.',
    },
    {
      q: 'How does the Whiteboard tool work and do I need to register?',
      a: 'The Whiteboard is an infinite vector canvas for drawing, diagramming, classroom presentations, and PDF annotations. No login, account, or credit card is ever required.',
    },
    {
      q: 'Can I use ToolTrack on mobile phones and tablets?',
      a: 'Yes. Every tool interface is fully responsive and optimized for smartphones, iPads, Android tablets, laptops, and touch screens.',
    },
    {
      q: 'How are my favorites and recent tools stored?',
      a: 'Your favorites and recent history are saved solely inside your local browser storage (localStorage) as simple tool identifiers. No private document text, files, or passwords are ever stored.',
    },
  ];

  return (
    <div className="space-y-14 sm:space-y-16 pb-12 animate-fade-in">
      {/* ========================================================================= */}
      {/* 1. DISTINCTIVE CENTERED HERO EXPERIENCE                                   */}
      {/* ========================================================================= */}
      <section className="relative pt-4 pb-2 sm:pt-8 sm:pb-4 max-w-3xl mx-auto text-center space-y-6">
        {/* Subtle decorative glow element in background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-[#2563EB]/10 via-[#7C3AED]/5 to-transparent blur-3xl -z-10"
        />

        {/* Primary Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#101828] dark:text-[#F2F4F7] tracking-tight leading-[1.08] text-balance">
            Every file. Every task.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#7C3AED] dark:from-[#3B82F6] dark:via-[#60A5FA] dark:to-[#8B5CF6]">
              One workspace.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-[#344054] dark:text-[#B8C4D6] leading-relaxed max-w-2xl mx-auto text-balance font-normal">
            Convert, organize, optimize, and work with PDFs, documents, images, and more — all in one place. Fast, client-side, and 100% private.
          </p>
        </div>

        {/* Prominent Search Field with Isolated Command Bar */}
        <div className="pt-2 max-w-2xl mx-auto space-y-3.5">
          <GlobalToolSearch
            variant="home"
            placeholder="Search 60+ tools (e.g., PDF to Word, compress, resize, background)..."
          />

          {/* Quick Jump Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-[#667085] dark:text-[#8292A9]">
            <span className="font-semibold text-[#344054] dark:text-[#B8C4D6] shrink-0">Popular:</span>
            {[
              { id: 'compress-pdf', label: 'Compress PDF' },
              { id: 'pdf-to-word', label: 'PDF to Word' },
              { id: 'image-background-remover', label: 'Remove BG' },
              { id: 'whiteboard', label: 'Whiteboard' },
              { id: 'qr-code-generator', label: 'QR Generator' },
              { id: 'word-counter', label: 'Word Count' },
              { id: 'calculator', label: 'Calculator' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveToolId(s.id)}
                className="px-2.5 py-1 rounded-lg bg-[#EAF1FF] hover:bg-[#DCE3EF] dark:bg-[#172338] dark:hover:bg-[#1E2D47] text-[#101828] dark:text-[#F2F4F7] transition cursor-pointer text-[11px] font-medium border border-[#DCE3EF] dark:border-[#1E2D47]"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Core Value Props Guarantee Strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-[#667085] dark:text-[#8292A9] pt-4 border-t border-[#DCE3EF]/80 dark:border-[#1E2D47]/80">
          <div className="flex items-center gap-1.5 text-[#344054] dark:text-[#B8C4D6]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Zero Server Uploads</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#344054] dark:text-[#B8C4D6]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6] shrink-0" />
            <span>60+ Built-In Utilities</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#344054] dark:text-[#B8C4D6]">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span>Free & Offline-Ready</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FREQUENTLY USED TOOLS (COMPACT, HIGH-VALUE CURATED 8 TOOLS)             */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Frequently Used Tools
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct access to high-utility file converters, calculators, and media editors
            </p>
          </div>
          <button
            onClick={() => {
              setActiveCategory('all');
              const el = document.getElementById('tools-directory');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All {TOOLS_LIST.length} Tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {popularTools.map((tool) => {
            const Icon = getIconComponent(tool.iconName);
            const isFav = isFavoriteTool(tool.id);

            return (
              <div
                key={tool.id}
                onClick={() => setActiveToolId(tool.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveToolId(tool.id);
                  }
                }}
                className="p-4 rounded-2xl bg-white dark:bg-[#111C2E] border border-[#DCE3EF] dark:border-[#1E2D47] hover:border-indigo-400 dark:hover:border-[#2563EB] hover:shadow-md tool-card-interactive text-left group cursor-pointer flex flex-col justify-between min-h-[148px] relative"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-[#2563EB] dark:text-[#3B82F6] flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                      <Icon className="w-4.5 h-4.5" />
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteTool(tool.id);
                      }}
                      className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-amber-500 transition cursor-pointer"
                      title={isFav ? 'Remove favorite' : 'Add to favorites'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>
                  </div>

                  <div>
                    {tool.id === 'whiteboard' && (
                      <div className="text-[10px] font-bold text-[#2563EB] dark:text-[#3B82F6] mb-0.5">
                        Flagship Canvas
                      </div>
                    )}
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition leading-snug break-words">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Open tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FEATURED FLAGSHIP: INTERACTIVE WHITEBOARD                               */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#101828] via-[#172338] to-[#0B1220] border border-[#1E2D47] p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-[#93C5FD] border border-[#2563EB]/30">
                <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
                Flagship Workspace
              </span>
              <span className="text-xs text-slate-400">· 100% Client-Side Vector Canvas</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Interactive Infinite Whiteboard & PDF Annotation
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Sketch diagrams, brainstorm workflows, import and annotate PDF lecture slides, and draw with precision tools. Instant launch with zero lag, hardware-accelerated rendering, and export to vector PDF, PNG, or SVG.
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Infinite Pan & Zoom
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                PDF & Image Markup
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Smart Shapes & Connectors
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Vector PDF & SVG Export
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveToolId('whiteboard')}
              className="px-5 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-[#2563EB]/25 transition cursor-pointer"
            >
              <PenTool className="w-4 h-4" />
              <span>Launch Whiteboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('design-tools');
                const el = document.getElementById('tools-directory');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-white/10"
            >
              <span>Explore Design & Canvas Tools</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MAIN TOOL CATEGORIES DIRECTORY & DEDICATED DIRECTORY FILTER            */}
      {/* ========================================================================= */}
      <section id="tools-directory" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#101828] dark:text-[#F2F4F7] tracking-tight">
              All Tool Categories
            </h2>
            <p className="text-xs text-[#667085] dark:text-[#8292A9]">
              Browse by domain or filter instantly with keyword search
            </p>
          </div>

          {/* Dedicated Directory Filter Bar */}
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#667085] dark:text-[#8292A9]" />
              <input
                type="text"
                value={directoryFilter}
                onChange={(e) => setDirectoryFilter(e.target.value)}
                placeholder="Filter tools..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white dark:bg-[#111C2E] text-xs text-[#101828] dark:text-[#F2F4F7] border border-[#DCE3EF] dark:border-[#1E2D47] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              {directoryFilter && (
                <button
                  onClick={() => setDirectoryFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#101828] dark:hover:text-[#F2F4F7]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className="text-xs text-[#667085] dark:text-[#8292A9] font-semibold whitespace-nowrap">
              {displayedTools.length} {displayedTools.length === 1 ? 'Tool' : 'Tools'}
            </span>
          </div>
        </div>

        {/* Category Segmented Tabs */}
        <div
          className="p-1 bg-[#EAF1FF] dark:bg-[#111C2E] rounded-xl flex items-center gap-1 overflow-x-auto scrollbar-none border border-[#DCE3EF] dark:border-[#1E2D47]"
          role="tablist"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? 'bg-white dark:bg-[#172338] text-[#101828] dark:text-[#F2F4F7] shadow-2xs font-bold border border-[#DCE3EF] dark:border-[#1E2D47]'
                  : 'text-[#344054] dark:text-[#B8C4D6] hover:text-[#101828] dark:hover:text-[#F2F4F7] hover:bg-white/60 dark:hover:bg-[#172338]/60'
              }`}
              role="tab"
              aria-selected={activeCategory === cat.id}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeCategory === cat.id
                  ? 'bg-[#EAF1FF] dark:bg-[#111C2E] text-[#2563EB] dark:text-[#3B82F6] font-bold'
                  : 'bg-[#DCE3EF]/60 dark:bg-[#172338] text-[#667085] dark:text-[#8292A9]'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        {isSwitchingCategory ? (
          <ToolCardSkeletonGrid count={8} />
        ) : displayedTools.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111C2E] border border-[#DCE3EF] dark:border-[#1E2D47] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF1FF] dark:bg-[#172338] text-[#2563EB] dark:text-[#3B82F6] flex items-center justify-center mx-auto">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#101828] dark:text-[#F2F4F7]">
                No tools found for "{directoryFilter}"
              </h3>
              <p className="text-xs text-[#667085] dark:text-[#8292A9] mt-1 max-w-sm mx-auto">
                Try searching for common tools like PDF, Image, Word, Compress, Resize, OCR, QR, or Calculator.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDirectoryFilter('')}
                className="px-3.5 py-2 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                Clear Filter & Show All Tools
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {displayedTools.map((tool, index) => {
              const Icon = getIconComponent(tool.iconName);
              const isFav = isFavoriteTool(tool.id);
              const staggerDelayClass = `stagger-delay-${Math.min(index, 15)}`;

              return (
                <div
                  key={tool.id}
                  onClick={() => setActiveToolId(tool.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveToolId(tool.id);
                    }
                  }}
                  className={`p-4 rounded-2xl bg-white dark:bg-[#111C2E] border border-[#DCE3EF] dark:border-[#1E2D47] hover:border-[#2563EB] dark:hover:border-[#3B82F6] hover:shadow-md tool-card-interactive text-left group flex flex-col justify-between h-40 cursor-pointer relative stagger-card-enter ${staggerDelayClass}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-[#EAF1FF] dark:bg-[#172338] text-[#2563EB] dark:text-[#3B82F6] group-hover:bg-[#2563EB] group-hover:text-white dark:group-hover:bg-[#2563EB] dark:group-hover:text-white transition-colors flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {tool.badge && (
                          <span className="text-[10px] font-bold text-[#2563EB] dark:text-[#3B82F6]">
                            {tool.badge}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteTool(tool.id);
                          }}
                          className="p-1 rounded-md text-[#667085] dark:text-[#8292A9] hover:text-amber-500 transition cursor-pointer"
                          title={isFav ? 'Remove favorite' : 'Add to favorites'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold text-[#667085] dark:text-[#8292A9] mb-0.5">
                        {getCategoryLabel(tool.category)}
                      </div>
                      <h3 className="font-bold text-sm text-[#101828] dark:text-[#F2F4F7] group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition truncate">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-[#667085] dark:text-[#8292A9] line-clamp-2 mt-1 leading-snug">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-[#667085] dark:text-[#8292A9] group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] flex items-center gap-1 transition">
                    <span>Use Tool</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 5. FAVORITES & RECENTLY USED                                              */}
      {/* ========================================================================= */}
      {(favoriteTools.length > 0 || recentTools.length > 0) && (
        <section className="space-y-6 pt-2">
          {favoriteTools.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#101828] dark:text-[#F2F4F7] flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>Favorite Shortcuts ({favoriteTools.length})</span>
                </h3>
                <button
                  onClick={clearFavoriteTools}
                  className="text-[11px] text-[#667085] hover:text-[#DC2626] cursor-pointer flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {favoriteTools.map((t) => {
                  const Icon = getIconComponent(t.iconName);
                  return (
                    <div
                      key={t.id}
                      onClick={() => setActiveToolId(t.id)}
                      className="p-2.5 rounded-xl bg-white dark:bg-[#111C2E] border border-[#DCE3EF] dark:border-[#1E2D47] hover:border-amber-400 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-xs font-semibold text-[#101828] dark:text-[#F2F4F7] truncate">
                        {t.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {recentTools.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#101828] dark:text-[#F2F4F7] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
                  <span>Recently Used ({recentTools.length})</span>
                </h3>
                <button
                  onClick={clearRecentTools}
                  className="text-[11px] text-[#667085] hover:text-[#DC2626] cursor-pointer flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear History</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {recentTools.map((t) => {
                  const Icon = getIconComponent(t.iconName);
                  return (
                    <div
                      key={t.id}
                      onClick={() => setActiveToolId(t.id)}
                      className="p-2.5 rounded-xl bg-white dark:bg-[#111C2E] border border-[#DCE3EF] dark:border-[#1E2D47] hover:border-[#2563EB] dark:hover:border-[#3B82F6] transition flex items-center gap-2 cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6] shrink-0" />
                      <span className="text-xs font-semibold text-[#101828] dark:text-[#F2F4F7] truncate">
                        {t.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. COMPACT FAQ ACCORDION                                                  */}
      {/* ========================================================================= */}
      <section className="max-w-3xl mx-auto space-y-4 pt-4">
        <div className="text-center space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-[#101828] dark:text-[#F2F4F7] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-[#667085] dark:text-[#8292A9]">
            Clear answers regarding privacy, file limits, and offline capabilities
          </p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-[#DCE3EF] dark:border-[#1E2D47] bg-white dark:bg-[#111C2E] overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-3.5 text-left font-semibold text-xs sm:text-sm text-[#101828] dark:text-[#F2F4F7] flex items-center justify-between gap-3 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#667085] shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-3.5 pb-3.5 text-xs text-[#344054] dark:text-[#B8C4D6] leading-relaxed border-t border-[#DCE3EF] dark:border-[#1E2D47] pt-2.5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
