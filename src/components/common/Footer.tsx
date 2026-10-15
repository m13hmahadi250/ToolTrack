import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  ChevronUp,
  Lock,
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
  Command,
  FileCheck2,
} from 'lucide-react';
import { useToolTrack } from '../../context/ToolTrackContext';
import { InfoModal } from './InfoModal';
import { ToolTrackBrand } from './ToolTrackBrand';

export const Footer: React.FC = () => {
  const { activeToolId, setActiveToolId, activeInfoModal, setActiveInfoModal } = useToolTrack();

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

  const renderToolLink = (toolId: string, label: string, badge?: string) => {
    const isActive = activeToolId === toolId;
    return (
      <li>
        <button
          onClick={() => {
            setActiveToolId(toolId);
            scrollToTop();
          }}
          className={`group flex items-center gap-1.5 transition-all cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3B82F6] rounded-sm py-0.5 ${
            isActive
              ? 'text-[#3B82F6] font-bold'
              : 'text-[#B8C4D6] hover:text-[#3B82F6] font-normal hover:translate-x-0.5'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${
              isActive
                ? 'bg-[#3B82F6] scale-100'
                : 'bg-transparent group-hover:bg-[#3B82F6]/60 scale-0 group-hover:scale-100'
            }`}
          />
          <span className="truncate">{label}</span>
          {badge && (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#EAF1FF] text-[#2563EB] dark:bg-[#172338] dark:text-[#3B82F6] border border-[#DCE3EF] dark:border-[#1E2D47] ml-auto shrink-0">
              {badge}
            </span>
          )}
        </button>
      </li>
    );
  };

  const renderModalLink = (modalType: 'about' | 'privacy' | 'terms' | 'contact' | 'faq', label: string) => {
    const isActive = activeInfoModal === modalType;
    return (
      <li>
        <button
          onClick={() => setActiveInfoModal(modalType)}
          className={`group flex items-center gap-1.5 transition-all cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3B82F6] rounded-sm py-0.5 ${
            isActive
              ? 'text-[#3B82F6] font-bold'
              : 'text-[#B8C4D6] hover:text-[#3B82F6] font-normal hover:translate-x-0.5'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${
              isActive
                ? 'bg-[#3B82F6] scale-100'
                : 'bg-transparent group-hover:bg-[#3B82F6]/60 scale-0 group-hover:scale-100'
            }`}
          />
          <span>{label}</span>
        </button>
      </li>
    );
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
            <ul className="space-y-1.5 text-xs text-[#B8C4D6]">
              {renderToolLink('normalize-pdf-page-size', 'Normalize Page Size')}
              {renderToolLink('organize-pdf', 'Organize & Reorder')}
              {renderToolLink('merge-pdf', 'Merge PDF Files')}
              {renderToolLink('split-pdf', 'Split & Extract Pages')}
              {renderToolLink('compress-pdf', 'Compress PDF Size')}
              {renderToolLink('pdf-edit', 'Edit & Annotate')}
              {renderToolLink('pdf-security', 'Protect & Secure')}
            </ul>
          </div>

          {/* Convert & Office Column */}
          <div className="col-span-1 lg:col-span-2 space-y-3">
            <h5 className="text-xs font-bold text-[#F2F4F7] uppercase tracking-wider">
              Convert & Office
            </h5>
            <ul className="space-y-1.5 text-xs text-[#B8C4D6]">
              {renderToolLink('pdf-to-word', 'PDF to Word (.docx)')}
              {renderToolLink('word-to-pdf', 'Word (.docx) to PDF')}
              {renderToolLink('excel-to-pdf', 'Excel (.xlsx) to PDF')}
              {renderToolLink('pdf-to-excel', 'PDF to Excel Table')}
              {renderToolLink('images-to-pdf', 'Images to PDF')}
              {renderToolLink('pdf-to-images', 'PDF to JPG / PNG')}
              {renderToolLink('image-converter', 'Image Converter')}
            </ul>
          </div>

          {/* Image & Design Column */}
          <div className="col-span-1 lg:col-span-2 space-y-3">
            <h5 className="text-xs font-bold text-[#F2F4F7] uppercase tracking-wider">
              Image & Design
            </h5>
            <ul className="space-y-1.5 text-xs text-[#B8C4D6]">
              {renderToolLink('image-background-remover', 'Remove Background')}
              {renderToolLink('image-background-changer', 'Change Background')}
              {renderToolLink('image-compressor', 'Batch Image Compressor')}
              {renderToolLink('image-cropper', 'Resize & Crop Image')}
              {renderToolLink('image-watermark', 'Watermark Image')}
              {renderToolLink('image-color-picker', 'Color Palette Picker')}
              {renderToolLink('image-text', 'Add Text to Image')}
            </ul>
          </div>

          {/* Productivity & Whiteboard Column */}
          <div className="col-span-1 lg:col-span-1 space-y-3">
            <h5 className="text-xs font-bold text-[#F2F4F7] uppercase tracking-wider">
              Productivity
            </h5>
            <ul className="space-y-1.5 text-xs text-[#B8C4D6]">
              {renderToolLink('whiteboard', 'Whiteboard', 'PRO')}
              {renderToolLink('ocr-pdf', 'OCR Text Scan')}
              {renderToolLink('assignment-pdf-maker', 'Assignment Maker')}
              {renderToolLink('notes-to-pdf', 'Notes to PDF')}
              {renderToolLink('pdf-submission-compressor', 'Portal Compressor')}
              {renderToolLink('pdf-compare', 'Compare PDFs')}
            </ul>
          </div>

          {/* Legal & Platform Column */}
          <div className="col-span-2 md:col-span-1 lg:col-span-2 space-y-3">
            <h5 className="text-xs font-bold text-[#F2F4F7] uppercase tracking-wider">
              Trust & Legal
            </h5>
            <ul className="space-y-1.5 text-xs text-[#B8C4D6]">
              {renderModalLink('about', 'About ToolTrack')}
              {renderModalLink('privacy', 'Privacy Policy')}
              {renderModalLink('terms', 'Terms of Service')}
              {renderModalLink('contact', 'Contact & Feedback')}
              {renderModalLink('faq', 'Frequently Asked Questions')}
              <li>
                <button
                  onClick={navigateToDirectory}
                  className="group flex items-center gap-1.5 transition-all cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3B82F6] rounded-sm py-0.5 text-[#B8C4D6] hover:text-[#3B82F6] hover:translate-x-0.5 font-medium"
                >
                  <span>All 38+ Tools Directory</span>
                </button>
              </li>
              <li className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono bg-[#172338] border border-[#1E2D47] text-[#B8C4D6]">
                  <Command className="w-3 h-3 text-[#3B82F6]" />
                  <span>K for Quick Search</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Global Footer Sub-bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#8292A9]">
          {/* Copyright & Core Statement */}
          <div className="flex flex-wrap items-center gap-2 text-center md:text-left">
            <span>© {new Date().getFullYear()} ToolTrack. All Your Files & Productivity Tools in One Place.</span>
          </div>

          {/* Actions & Designer Credit */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Premium Developer Attribution Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111C2E] border border-[#1E2D47] text-xs shadow-xs transition-all hover:border-[#3B82F6]/60">
              <span className="text-[#8292A9] font-medium">Build and Design by</span>
              <a
                href="https://www.facebook.com/m13hmahadi250/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit Mohammad Mahadi Hossain on Facebook"
                className="group/dev inline-flex items-center gap-1 font-bold text-[#3B82F6] hover:text-[#60A5FA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-1 focus-visible:ring-offset-[#101828] rounded-md px-1 py-0.5 -my-0.5 cursor-pointer"
              >
                <span className="tracking-tight hover:underline underline-offset-4 decoration-[#3B82F6]/60">
                  Mohammad Mahadi Hossain
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#3B82F6] group-hover/dev:text-[#60A5FA] group-hover/dev:translate-x-0.5 group-hover/dev:-translate-y-0.5 transition-transform shrink-0" />
              </a>
            </div>

            {/* Back to top button */}
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[#B8C4D6] hover:text-white hover:bg-[#172338] border border-[#1E2D47] transition cursor-pointer text-xs font-medium"
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

