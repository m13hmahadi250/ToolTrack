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
  PenTool,
  Image as ImageIcon,
  FileSpreadsheet,
  ScanText,
  Palette,
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
    { id: 'pdf', label: 'PDF Tools' },
    { id: 'convert', label: 'Convert & Office' },
    { id: 'image-tools', label: 'Image Studio' },
    { id: 'ocr', label: 'OCR & Scanner' },
    { id: 'student-tools', label: 'Student Suite' },
    { id: 'design-tools', label: 'Design & Canvas' },
    { id: 'security', label: 'Security' },
  ];

  const popularTools = useMemo(() => {
    return POPULAR_TOOL_IDS.map((id) => TOOLS_LIST.find((t) => t.id === id)).filter(Boolean) as typeof TOOLS_LIST;
  }, []);

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
      } else {
        baseList = TOOLS_LIST.filter((tool) =>
          tool.category === activeCategory ||
          (activeCategory === 'page-tools' && tool.category === 'page-tools') ||
          (activeCategory === 'organize' && tool.category === 'organize') ||
          (activeCategory === 'optimize' && tool.category === 'optimize')
        );
      }
    }

    if (!searchQuery.trim()) {
      return baseList;
    }
    const scoredResults = searchTools(searchQuery, 40);
    const scoredIds = new Set(scoredResults.map((s) => s.tool.id));
    return baseList.filter((tool) => scoredIds.has(tool.id));
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
      q: 'What is the Whiteboard tool and do I need an account to use it?',
      a: 'The ToolTrack Whiteboard is an infinite collaborative canvas for sketching, teaching, diagramming, sticky notes, and annotating PDFs and images. It runs 100% locally in your browser with zero logins required and instant export to PNG, SVG, PDF, or JSON.',
    },
    {
      q: 'Can I use ToolTrack on mobile phones and tablets?',
      a: 'Yes. Every tool interface is fully responsive and designed for smartphones, iPads, tablets, laptops, and desktops, with full touch and stylus drag-and-drop support.',
    },
    {
      q: 'How does PDF compression work without losing text clarity?',
      a: 'ToolTrack strips unreferenced PDF dictionary streams, optimizes internal fonts, and optionally scales raster images while preserving vector text and line art with 100% sharpness.',
    },
    {
      q: 'Can I convert PDF to Word with diagrams, tables, and borders preserved?',
      a: 'Yes. ToolTrack uses a layout-aware hybrid conversion engine that reconstructs question badges, headings, callout boxes, and tables into native Word elements, while embedding complex vector diagrams as crisp high-resolution images at exact page coordinates.',
    },
    {
      q: 'Can I convert Excel spreadsheets and CSV to PDF?',
      a: 'Yes. The Excel to PDF converter handles multi-sheet workbooks, cell formatting, numbers, tables, and headers with custom paper sizes (A4, Letter, Landscape) and instant previews.',
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
              { id: 'image-background-remover', label: 'Remove BG' },
              { id: 'whiteboard', label: 'Whiteboard Canvas' },
              { id: 'compress-pdf', label: 'Compress PDF' },
              { id: 'excel-to-pdf', label: 'Excel to PDF' },
              { id: 'ocr-pdf', label: 'OCR Scan' },
              { id: 'normalize-pdf-page-size', label: 'Normalize Size' },
              { id: 'assignment-pdf-maker', label: 'Assignment Maker' },
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
              <div className="text-xs font-bold text-slate-900 dark:text-white">38+ Full Utilities</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">PDF, image, OCR & board</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Free & Private</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">No account required</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Core Pillars Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Comprehensive Productivity Suite</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Everything You Need in One Unified Platform
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Switch effortlessly between document editing, high-resolution image processing, OCR extraction, and interactive visual ideation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Pillar 1: PDF & Documents */}
          <div
            onClick={() => {
              setActiveCategory('pdf');
              const el = document.getElementById('tools-directory');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-xs hover:shadow-lg transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                PDF & Documents
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Normalize page proportions, merge, split, compress, edit annotations, and protect documents with military-grade encryption.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Normalize Size', 'Merge & Split', 'Compress PDF', 'Protect & Lock'].map((tag) => (
                  <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Explore PDF Tools</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Pillar 2: Conversion & Office */}
          <div
            onClick={() => {
              setActiveCategory('convert');
              const el = document.getElementById('tools-directory');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-xs hover:shadow-lg transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Office & Conversion
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Bidirectional conversion for Word DOCX, Excel spreadsheets (.xlsx, .csv), and high-resolution images with formatting preservation.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['PDF to Word', 'Word to PDF', 'Excel to PDF', 'Images to PDF'].map((tag) => (
                  <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              <span>Explore Converters</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Pillar 3: Image Studio & AI */}
          <div
            onClick={() => {
              setActiveCategory('image-tools');
              const el = document.getElementById('tools-directory');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-xs hover:shadow-lg transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Image Studio
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Remove backgrounds with alpha transparency, batch compress images, resize dimensions, watermark, and convert JPG/PNG/WebP.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Remove Background', 'Batch Compress', 'Crop & Resize', 'Watermark'].map((tag) => (
                  <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Explore Image Studio</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Pillar 4: Interactive Whiteboard */}
          <div
            onClick={() => setActiveToolId('whiteboard')}
            className="p-6 rounded-2xl bg-linear-to-br from-indigo-50/70 via-white to-purple-50/70 dark:from-slate-850 dark:via-slate-850 dark:to-indigo-950/40 border border-indigo-300 dark:border-indigo-800/80 hover:border-indigo-500 dark:hover:border-indigo-400 shadow-xs hover:shadow-lg transition-all text-left group cursor-pointer flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-3 right-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                PRO CANVAS
              </span>
            </div>
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <PenTool className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Interactive Whiteboard
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Infinite vector canvas for freehand drawing, diagramming, sticky notes, classroom teaching, PDF slide markup, and 4K vector export.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Infinite Zoom', 'Sticky Notes', 'PDF Annotation', 'SVG/PNG Export'].map((tag) => (
                  <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Launch Whiteboard Studio</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Pillar 5: OCR & Scanner */}
          <div
            onClick={() => {
              setActiveCategory('ocr');
              const el = document.getElementById('tools-directory');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 shadow-xs hover:shadow-lg transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ScanText className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                OCR & Text Scanner
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Recognize and extract text from scanned documents, textbook snapshots, receipts, and images with multi-language models (EN, BN, AR).
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['OCR Scan', 'Text Extract', 'Notes to PDF', 'Multilingual'].map((tag) => (
                  <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>Explore OCR Tools</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Pillar 6: Student & Academic Suite */}
          <div
            onClick={() => {
              setActiveCategory('student-tools');
              const el = document.getElementById('tools-directory');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 shadow-xs hover:shadow-lg transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Student & Academic Suite
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Build assignment PDFs with academic covers, enhance handwritten notes, and compress documents under strict portal size quotas (1MB, 2MB, 5MB).
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Assignment Maker', 'Portal Compressor', 'Notes Scanner', 'Study Sheets'].map((tag) => (
                  <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Explore Academic Tools</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Whiteboard Spotlight Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 sm:p-10 text-white shadow-xl border border-indigo-700/50">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                <PenTool className="w-3.5 h-3.5" />
                <span>Featured Standalone Studio</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Interactive Infinite Whiteboard — Sketch, Annotate & Ideate
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Whether you're teaching a class, sketching system architectures, brainstorming with sticky notes, or annotating multi-page PDFs, ToolTrack's built-in whiteboard provides a fluid, infinite workspace without requiring any account or login.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                  <div className="font-bold text-indigo-400">Infinite Canvas</div>
                  <div className="text-[11px] text-slate-400">Smooth zoom & pan</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                  <div className="font-bold text-indigo-400">PDF Markup</div>
                  <div className="text-[11px] text-slate-400">Annotate documents</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                  <div className="font-bold text-indigo-400">Smart Shapes</div>
                  <div className="text-[11px] text-slate-400">Flowcharts & notes</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                  <div className="font-bold text-indigo-400">Vector Export</div>
                  <div className="text-[11px] text-slate-400">PNG, SVG & PDF</div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setActiveToolId('whiteboard')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-lg shadow-indigo-900/40 cursor-pointer"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Launch Interactive Whiteboard</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
                <span className="text-xs text-slate-400">Zero setup · 100% private in your browser</span>
              </div>
            </div>

            {/* Visual Whiteboard Preview illustration */}
            <div className="hidden lg:flex flex-col items-center justify-center p-6 bg-slate-900/90 rounded-2xl border border-indigo-500/30 shrink-0 w-80 space-y-3 shadow-inner">
              <div className="w-full flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                <span className="font-mono flex items-center gap-1.5 text-indigo-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Canvas
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">100% Zoom</span>
              </div>
              <div className="w-full h-36 relative bg-slate-950/70 rounded-xl border border-dashed border-slate-800 flex items-center justify-center overflow-hidden">
                <div className="absolute top-3 left-4 p-2 rounded-lg bg-amber-400/90 text-slate-950 text-[10px] font-bold shadow-md transform -rotate-3">
                  📝 Brainstorm Note
                </div>
                <div className="absolute bottom-3 right-4 p-2 rounded-lg bg-indigo-600/90 text-white text-[10px] font-bold shadow-md transform rotate-2">
                  ⚡ Diagram Node
                </div>
                <div className="w-20 h-20 rounded-full border-2 border-indigo-400/60 flex items-center justify-center text-[10px] text-indigo-300 font-mono">
                  Vector Pen
                </div>
              </div>
              <div className="w-full flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>✦ Fountain Pen</span>
                <span>✦ Eraser</span>
                <span>✦ Sticky Notes</span>
                <span>✦ Shapes</span>
              </div>
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
                The most popular file, document, image, and whiteboard tools
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
              {searchQuery ? `Search Results (${displayedTools.length})` : 'All Productivity & File Utilities'}
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
