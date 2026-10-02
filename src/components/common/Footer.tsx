import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  ChevronUp,
  Lock,
  ArrowRight,
  Sparkles,
  Command,
  FileCheck2,
} from 'lucide-react';
import { useToolTrack } from '../../context/ToolTrackContext';
import { InfoModal } from './InfoModal';
import { ToolTrackBrand } from './ToolTrackBrand';

export const Footer: React.FC = () => {
  const { setActiveToolId, activeInfoModal, setActiveInfoModal } = useToolTrack();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToDirectory = () => {
    setActiveToolId(null);
    setTimeout(() => {
      const el = document.getElementById('tools-directory');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        {/* Engineering Guarantees Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800/80 mb-14">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                100% In-Browser Privacy
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Your files never touch external servers. All rendering and conversions occur strictly inside your local browser memory streams.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                High-Fidelity Vector Engine
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Page geometry, vector paths, text layers, and embedded media are parsed with sub-pixel precision to prevent distortion or quality loss.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                Instant Batch Processing
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Asynchronous worker pipelines and automatic memory garbage-collection ensure fast, seamless execution even with heavy multi-page files.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Multi-Column Directory */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-200 dark:border-slate-800">
          {/* Brand & Overview Column */}
          <div className="lg:col-span-4 space-y-4 pr-0 lg:pr-6">
            <button
              onClick={() => {
                setActiveToolId(null);
                scrollToTop();
              }}
              className="group text-left cursor-pointer focus-visible:outline-none"
              aria-label="ToolTrack Home"
            >
              <ToolTrackBrand iconClassName="w-9 h-9" showTextOnMobile={true} />
            </button>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              The high-fidelity online document processing suite. Convert, resize, merge, split, compress, and edit PDFs and images with complete privacy and zero server storage.
            </p>

            {/* Quiet Status Indicator */}
            <div className="pt-2 flex flex-col gap-2 text-xs">
              <div className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Client Engine: Operational
                </span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                No telemetry · Zero retention · Browser sandbox
              </div>
            </div>
          </div>

          {/* Core PDF Column */}
          <div className="lg:col-span-2 col-span-1 space-y-3">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Core PDF
            </h5>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button
                  onClick={() => setActiveToolId('normalize-pdf-page-size')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Normalize Page Size
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('organize-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Organize & Reorder
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('merge-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Merge PDF Files
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('split-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Split & Extract Pages
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('rotate-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Rotate PDF Pages
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-edit')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Edit & Annotate
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-security')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Protect & Secure
                </button>
              </li>
            </ul>
          </div>

          {/* Conversion Suite Column */}
          <div className="lg:col-span-2 col-span-1 space-y-3">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Convert & Export
            </h5>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-to-word')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  PDF to Word (.docx)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('word-to-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Word (.docx) to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('images-to-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Images to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-to-images')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  PDF to JPG / PNG
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('excel-to-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Excel (.xlsx) to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-to-excel')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  PDF to Excel Table
                </button>
              </li>
            </ul>
          </div>

          {/* Optimization & AI Column */}
          <div className="lg:col-span-2 col-span-1 space-y-3">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Optimize & Image
            </h5>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button
                  onClick={() => setActiveToolId('image-background-remover')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Remove Background
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('compress-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Compress PDF Size
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('image-compressor')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Batch Image Compressor
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('image-resizer')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Image Dimensions Resizer
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('ocr-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  OCR Text Recognition
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('flatten-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Flatten Fillable Forms
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('clean-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Clean & Repair PDF
                </button>
              </li>
            </ul>
          </div>

          {/* Platform & Resources Column */}
          <div className="lg:col-span-2 col-span-1 space-y-3">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Legal & Support
            </h5>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button
                  onClick={() => setActiveInfoModal('about')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  About ToolTrack
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveInfoModal('privacy')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveInfoModal('terms')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveInfoModal('contact')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Contact & Feedback
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveInfoModal('faq')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button
                  onClick={navigateToDirectory}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-left"
                >
                  All 20+ Tools Directory
                </button>
              </li>
              <li className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <Command className="w-3 h-3" />
                  <span>K for Quick Search</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Global Footer Sub-bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          {/* Copyright & Core Statement */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-center md:text-left">
            <span>© {new Date().getFullYear()} ToolTrack Document Suite.</span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span>All document transformations run 100% client-side.</span>
          </div>

          {/* Actions & Designer Credit */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Developer Credit */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-default select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 dark:bg-indigo-400"></span>
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                Engineered by
              </span>
              <span className="text-[11px] font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent">
                Mohammed Mahadi Hossain
              </span>
            </div>

            {/* Back to top button */}
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-xs font-medium"
              aria-label="Scroll to top"
            >
              <span>Back to Top</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Functional Info Modal */}
      <InfoModal type={activeInfoModal} onClose={() => setActiveInfoModal(null)} />
    </footer>
  );
};

