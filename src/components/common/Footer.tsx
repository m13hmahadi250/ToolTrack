import React, { useState } from 'react';
import { ShieldCheck, Cpu, HardDrive } from 'lucide-react';
import { useToolTrack } from '../../context/ToolTrackContext';
import { InfoModal, type InfoModalType } from './InfoModal';

export const Footer: React.FC = () => {
  const { setActiveToolId, activeInfoModal, setActiveInfoModal } = useToolTrack();

  return (
    <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-12 pb-8 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Privacy & Engine Guarantees */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 mb-12">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">100% Client-Side Privacy</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Documents are processed securely within your browser memory streams. No document data is stored on remote servers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">High-Fidelity Vector Engine</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Pages, vector shapes, diagrams, and formatting are preserved accurately during document conversion and resizing.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Batch & Memory Efficient</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Job queue and automated memory cleanup keep your system fast and responsive even with large multi-page files.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Navigation Directory */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Core PDF Tools
            </h5>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button
                  onClick={() => setActiveToolId('normalize-pdf-page-size')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Normalize PDF Page Size
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('organize-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Organize & Reorder Pages
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('rotate-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Rotate PDF Pages
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-edit')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Edit & Annotate PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-security')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Protect & Secure PDF
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Organize & Optimize
            </h5>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button
                  onClick={() => setActiveToolId('merge-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Merge PDF Files
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('split-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Split & Extract Pages
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('compress-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Compress PDF Size
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('flatten-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Flatten Fillable Forms
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('clean-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Clean & Repair PDF
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Conversion Suite
            </h5>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-to-word')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  PDF to Word (.docx)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('images-to-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Images to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('word-to-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Word (.docx) to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-to-images')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  PDF to JPG / PNG
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('excel-to-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Excel (.xlsx) to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-to-excel')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  PDF to Excel Table
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Image, OCR & Inspection
            </h5>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button
                  onClick={() => setActiveToolId('ocr-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  OCR Text Recognition (EN/BN/AR)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('image-compressor')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Batch Image Compressor
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('image-resizer')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Image Dimensions Resizer
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-inspector')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  PDF Structure Inspector
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveToolId('pdf-compare')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Compare Two PDF Versions
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Global Footer Navigation Links */}
        <div className="py-6 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <button
              onClick={() => setActiveToolId(null)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => {
                setActiveToolId(null);
                setTimeout(() => {
                  const el = document.getElementById('tools-directory');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              All Tools
            </button>
            <button
              onClick={() => setActiveToolId('normalize-pdf-page-size')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              PDF Tools
            </button>
            <button
              onClick={() => setActiveToolId('image-compressor')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              Image Tools
            </button>
            <button
              onClick={() => setActiveToolId('ocr-pdf')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              OCR
            </button>
            <button
              onClick={() => setActiveInfoModal('privacy')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveInfoModal('terms')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => setActiveInfoModal('contact')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              Contact & Feedback
            </button>
          </div>

          <div className="text-slate-500 dark:text-slate-400 text-xs">
            ToolTrack • All Your File Tools in One Place
          </div>
        </div>

        {/* Bottom copyright and animated developer credit */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
          <p>© {new Date().getFullYear()} ToolTrack. Production-ready PDF, image, and document processing.</p>
          <div className="group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:shadow-indigo-500/10 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800/95 animate-pulse-subtle transition-all duration-300 cursor-default select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 dark:bg-indigo-400"></span>
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors duration-300">
              Build and Design by
            </span>
            <span className="font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 group-hover:from-purple-500 group-hover:via-pink-500 group-hover:to-amber-500 bg-clip-text text-transparent animate-gradient-flow group-hover:scale-105 transition-all duration-300 inline-block">
              Mohammed Mahadi Hossain
            </span>
          </div>
        </div>
      </div>

      {/* Functional Info Modal */}
      <InfoModal type={activeInfoModal} onClose={() => setActiveInfoModal(null)} />
    </footer>
  );
};
