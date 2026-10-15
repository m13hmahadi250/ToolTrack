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
    <footer className="w-full bg-[#101828] text-[#F2F4F7] border-t border-[#1E2D47] transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        {/* Engineering Guarantees Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-[#111C2E] border border-[#1E2D47] mb-14 shadow-lg">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-[#F2F4F7]">
                100% In-Browser Privacy
              </h4>
              <p className="text-xs text-[#B8C4D6] mt-1 leading-relaxed">
                Your files never touch external servers. All rendering and conversions occur strictly inside your local browser memory streams.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-950/70 border border-blue-800/60 text-[#3B82F6] shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-[#F2F4F7]">
                High-Fidelity Vector Engine
              </h4>
              <p className="text-xs text-[#B8C4D6] mt-1 leading-relaxed">
                Page geometry, vector paths, text layers, and embedded media are parsed with sub-pixel precision to prevent distortion or quality loss.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-950/70 border border-indigo-800/60 text-[#60A5FA] shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-[#F2F4F7]">
                Instant Batch Processing
              </h4>
              <p className="text-xs text-[#B8C4D6] mt-1 leading-relaxed">
                Asynchronous worker pipelines and automatic memory garbage-collection ensure fast, seamless execution even with heavy multi-page files.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Multi-Column Directory */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-8 lg:gap-8 pb-12 border-b border-[#1E2D47]">
          {/* Brand & Overview Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-3 space-y-4 pr-0 lg:pr-4">
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

            <p className="text-xs text-[#B8C4D6] leading-relaxed max-w-sm">
              All-in-one file, document, image and productivity toolkit. Work with PDFs, Word, Excel, images, OCR, notes and an interactive Whiteboard directly in your browser with complete privacy and zero server storage.
            </p>

            {/* Quiet Status Indicator */}
            <div className="pt-2 flex flex-col gap-2 text-xs">
              <div className="inline-flex items-center gap-2 text-[#B8C4D6]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-medium text-[#F2F4F7]">
                  Client Engine: Operational
                </span>
              </div>
              <div className="text-[11px] text-[#8292A9]">
                Zero server uploads · 100% private in-browser memory
              </div>
            </div>
          </div>

          {/* PDF & Documents Column */}
          <div className="col-span-1 lg:col-span-2 space-y-3">
            <h5 className="text-xs font-bold text-[#F2F4F7] uppercase tracking-wider">
              PDF & Documents
            </h5>
            <ul className="space-y-2 text-xs text-[#B8C4D6]">
              <li>
                <button
                  onClick={() => setActiveToolId('normalize-pdf-page-size')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Normalize Page Size
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('organize-pdf')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Organize & Reorder
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('merge-pdf')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Merge PDF Files
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('split-pdf')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Split & Extract Pages
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('compress-pdf')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Compress PDF Size
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-edit')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Edit & Annotate
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-security')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Protect & Secure
                </button>
              </li>
            </ul>
          </div>

          {/* Convert & Office Column */}
          <div className="col-span-1 lg:col-span-2 space-y-3">
            <h5 className="text-xs font-bold text-[#F2F4F7] uppercase tracking-wider">
              Convert & Office
            </h5>
            <ul className="space-y-2 text-xs text-[#B8C4D6]">
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-to-word')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  PDF to Word (.docx)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('word-to-pdf')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Word (.docx) to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('excel-to-pdf')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Excel (.xlsx) to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-to-excel')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  PDF to Excel Table
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('images-to-pdf')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Images to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-to-images')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  PDF to JPG / PNG
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('image-converter')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Image Format Converter
                </button>
              </li>
            </ul>
          </div>

          {/* Image & Design Column */}
          <div className="col-span-1 lg:col-span-2 space-y-3">
            <h5 className="text-xs font-bold text-[#F2F4F7] uppercase tracking-wider">
              Image & Design
            </h5>
            <ul className="space-y-2 text-xs text-[#B8C4D6]">
              <li>
                <button
                  onClick={() => setActiveToolId('image-background-remover')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Remove Background
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('image-background-changer')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Change Background
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('image-compressor')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Batch Image Compressor
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('image-cropper')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Resize & Crop Image
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('image-watermark')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Watermark Image
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('image-color-picker')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Color Palette Picker
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('image-text')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Add Text to Image
                </button>
              </li>
            </ul>
          </div>

          {/* Productivity & Whiteboard Column */}
          <div className="col-span-1 lg:col-span-1 space-y-3">
            <h5 className="text-xs font-bold text-[#F2F4F7] uppercase tracking-wider">
              Productivity
            </h5>
            <ul className="space-y-2 text-xs text-[#B8C4D6]">
              <li>
                <button
                  onClick={() => setActiveToolId('whiteboard')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left font-semibold text-indigo-600 dark:text-indigo-400"
                >
                  Whiteboard PRO
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('ocr-pdf')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  OCR Text Scan
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('assignment-pdf-maker')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Assignment Maker
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('notes-to-pdf')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Notes to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-submission-compressor')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Portal Compressor
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-compare')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Compare PDFs
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Platform Column */}
          <div className="col-span-2 md:col-span-1 lg:col-span-2 space-y-3">
            <h5 className="text-xs font-bold text-[#F2F4F7] uppercase tracking-wider">
              Trust & Legal
            </h5>
            <ul className="space-y-2 text-xs text-[#B8C4D6]">
              <li>
                <button
                  onClick={() => setActiveInfoModal('about')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  About ToolTrack
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveInfoModal('privacy')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveInfoModal('terms')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveInfoModal('contact')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Contact & Feedback
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveInfoModal('faq')}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left"
                >
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button
                  onClick={navigateToDirectory}
                  className="hover:text-[#3B82F6] transition cursor-pointer text-left font-medium"
                >
                  All 38+ Tools Directory
                </button>
              </li>
              <li className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-[#B8C4D6]">
                  <Command className="w-3 h-3" />
                  <span>K for Quick Search</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Global Footer Sub-bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#8292A9]">
          {/* Copyright & Core Statement */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-center md:text-left">
            <span>© {new Date().getFullYear()} ToolTrack. All Your Files & Productivity Tools in One Place.</span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span>Files never leave your device. 100% private in-browser processing.</span>
          </div>

          {/* Actions & Designer Credit */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Developer Credit */}
            <div className="inline-flex items-center gap-1.5 text-xs text-[#8292A9] font-normal select-none">
              <span>Build and Design by Muhammad Mahadi Hussain.</span>
            </div>

            {/* Back to top button */}
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[#B8C4D6] hover:text-white hover:bg-[#172338] border border-[#1E2D47] transition cursor-pointer text-xs font-medium"
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

