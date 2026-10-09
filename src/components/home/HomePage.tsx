import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ArrowRight,
  Maximize2,
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
  PenTool,
  Image as ImageIcon,
  FileSpreadsheet,
  ScanText,
  Palette,
  QrCode,
  Calculator,
  KeyRound,
  Code2,
  Sliders,
  Layers,
  ArrowRightLeft,
  Percent,
  Calendar,
  Binary,
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
    { id: 'utilities', label: 'Everyday Utilities' },
    { id: 'pdf', label: 'PDF Tools' },
    { id: 'convert', label: 'Convert & Office' },
    { id: 'image-tools', label: 'Image Studio' },
    { id: 'ocr', label: 'OCR & Scanner' },
    { id: 'student-tools', label: 'Student Suite' },
    { id: 'design-tools', label: 'Design & Canvas' },
    { id: 'security', label: 'Security' },
  ];

  // Frequently used quick actions (curated to 8 high-value, commonly used tools)
  const quickActionTools = useMemo(() => {
    const curatedIds = [
      'compress-pdf',
      'pdf-to-word',
      'merge-pdf',
      'image-background-remover',
      'whiteboard',
      'word-counter',
      'qr-code-generator',
      'calculator',
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

    if (!searchQuery.trim()) {
      return baseList;
    }

    const scoredResults = searchTools(searchQuery, 40);
    const scoredIds = new Set(scoredResults.map((s) => s.tool.id));
    return baseList.filter((tool) => scoredIds.has(tool.id));
  }, [searchQuery, activeCategory]);

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
      a: 'Yes. Every tool interface is fully responsive and optimized for smartphones, iPads, Android tablets, laptops, and Windows touch screens.',
    },
    {
      q: 'How are my favorites and recent tools stored?',
      a: 'Your favorites and recent history are saved solely inside your local browser storage (localStorage) as simple tool identifiers. No private document text, files, or passwords are ever stored.',
    },
  ];

  return (
    <div className="space-y-12 py-6 sm:py-8 animate-in fade-in duration-300">
      {/* 1. COMPACT HERO SECTION & VALUE PROPOSITION */}
      <section className="text-center max-w-4xl mx-auto space-y-4 px-4">
        {/* Anti-Slop Unboxed Trust Header */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% In-Browser Privacy
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span>Zero Server Uploads</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span>60+ Built-In Utilities</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span>Free & Offline Ready</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          All Your Files & Productivity Tools in One Place
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          PDF, Word, Excel, Images, OCR, Whiteboard, Everyday Calculators & Developer Utilities. Fast, client-side, and simple to use.
        </p>

        {/* 2. PROMINENT SEARCH BAR */}
        <div className="max-w-xl mx-auto pt-2 space-y-2.5">
          <GlobalToolSearch
            variant="home"
            initialQuery={searchQuery}
            onQueryChange={(q) => setSearchQuery(q)}
          />

          {/* Quick Keywords Filter Line */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Quick suggestions:</span>
            {[
              { id: 'compress-pdf', label: 'Compress PDF' },
              { id: 'pdf-to-word', label: 'PDF to Word' },
              { id: 'image-background-remover', label: 'Remove BG' },
              { id: 'whiteboard', label: 'Whiteboard' },
              { id: 'qr-code-generator', label: 'QR Generator' },
              { id: 'word-counter', label: 'Word Count' },
              { id: 'password-generator', label: 'Passwords' },
              { id: 'calculator', label: 'Calculator' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveToolId(s.id)}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer text-[11px]"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FREQUENTLY USED TOOLS (QUICK ACTIONS) */}
      {!searchQuery && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
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
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All 60+ Tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {quickActionTools.map((tool) => {
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
                  className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all text-left group cursor-pointer flex flex-col justify-between min-h-[148px] relative"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
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
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition leading-snug break-words">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Open tool</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. EVERYDAY UTILITIES SHOWCASE SECTION */}
      {!searchQuery && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5" />
                <span>Everyday Utilities Category</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                Practical Daily Digital Tools
              </h2>
            </div>
            <button
              onClick={() => {
                setActiveCategory('utilities');
                const el = document.getElementById('tools-directory');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Explore All Utilities →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* 1. Text Tools */}
            <div
              onClick={() => setActiveToolId('text-utilities')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all text-left cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    Text Tools
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Word counter, case changer, text diff checker & markdown preview.
                  </p>
                </div>
              </div>
              <div className="pt-3 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <span>Word & Diff Studio</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* 2. QR Code Tools */}
            <div
              onClick={() => setActiveToolId('qr-code-generator')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all text-left cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    QR Code Studio
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Generate color QR codes for Wi-Fi & URLs, or scan with camera.
                  </p>
                </div>
              </div>
              <div className="pt-3 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>Create & Scan QR</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* 3. Calculators & Date */}
            <div
              onClick={() => setActiveToolId('calculator')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 transition-all text-left cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                    Calculators & Units
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Standard calculator, 8-category unit converter, percentages & dates.
                  </p>
                </div>
              </div>
              <div className="pt-3 text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <span>Calc & Convert</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* 4. Developer & Data */}
            <div
              onClick={() => setActiveToolId('json-formatter')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all text-left cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    Developer & Data
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Prettify JSON, convert CSV, encode Base64, generate UUIDs & hashes.
                  </p>
                </div>
              </div>
              <div className="pt-3 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <span>JSON & Data Tools</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* 5. Privacy & Security */}
            <div
              onClick={() => setActiveToolId('password-generator')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 transition-all text-left cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                    Privacy & Passwords
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Crypto-random password generator, entropy meter & dice picker.
                  </p>
                </div>
              </div>
              <div className="pt-3 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span>Secure Passwords</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. FAVORITES & RECENTLY USED (PROGRESSIVE DISCLOSURE) */}
      {!searchQuery && (favoriteTools.length > 0 || recentTools.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Favorite Tools */}
          {favoriteTools.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>Favorite Shortcuts ({favoriteTools.length})</span>
                </h3>
                <button
                  onClick={clearFavoriteTools}
                  className="text-[11px] text-slate-400 hover:text-red-500 cursor-pointer flex items-center gap-1"
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
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {t.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Tools */}
          {recentTools.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>Recently Used ({recentTools.length})</span>
                </h3>
                <button
                  onClick={clearRecentTools}
                  className="text-[11px] text-slate-400 hover:text-red-500 cursor-pointer flex items-center gap-1"
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
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
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

      {/* 6. MAIN TOOL CATEGORIES DIRECTORY (WITH CLEAN SEGMENTED CONTROL) */}
      <section id="tools-directory" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {searchQuery ? `Search Results (${displayedTools.length})` : 'All Tool Categories'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Browse by domain or filter instantly with keyword search
            </p>
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            {displayedTools.length} Tools Available
          </span>
        </div>

        {/* Category Segmented Tabs (Functional Buttons) */}
        {!searchQuery && (
          <div
            className="p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-center gap-1 overflow-x-auto scrollbar-none border border-slate-200/60 dark:border-slate-700/60"
            role="tablist"
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
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

        {/* Tools Grid */}
        {displayedTools.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                No tools found for "{searchQuery}"
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Try searching for "pdf", "qr", "word count", "compress", or "calculator".
              </p>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {displayedTools.map((tool) => {
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
                  className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all text-left group flex flex-col justify-between h-40 cursor-pointer relative"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950 group-hover:text-indigo-600 transition flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {tool.badge && (
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            {tool.badge}
                          </span>
                        )}
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
                    </div>

                    <div>
                      {/* Zero-Pill Unboxed Category Label */}
                      <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-0.5">
                        {getCategoryLabel(tool.category)}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-snug">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1 transition">
                    <span>Use Tool</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 7. COMPACT FAQ ACCORDION */}
      {!searchQuery && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 pt-4">
          <div className="text-center space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clear answers regarding privacy, file limits, and offline capabilities
            </p>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-3.5 text-left font-semibold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-3.5 pb-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2.5">
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
