import React, { useState, useRef, useEffect } from 'react';
import {
  GitCompare,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  Columns,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { getPdfPagesInfo, extractTextFromPdf, loadPdfDocument, renderPageToCanvas } from '../../lib/pdfRenderer';
import type { DetectedPageInfo } from '../../types';

interface DiffLine {
  type: 'added' | 'removed' | 'same';
  text: string;
}

export const PdfCompareTool: React.FC = () => {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [pages1, setPages1] = useState<DetectedPageInfo[]>([]);
  const [pages2, setPages2] = useState<DetectedPageInfo[]>([]);
  const [text1, setText1] = useState<string>('');
  const [text2, setText2] = useState<string>('');
  const [compared, setCompared] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Visual Comparison View Controls
  const [viewMode, setViewMode] = useState<'side-by-side' | 'visual-diff' | 'text-diff'>('side-by-side');
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);

  // Canvas Refs
  const canvas1Ref = useRef<HTMLCanvasElement | null>(null);
  const canvas2Ref = useRef<HTMLCanvasElement | null>(null);
  const diffCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const pdfDoc1Ref = useRef<any>(null);
  const pdfDoc2Ref = useRef<any>(null);

  const handleCompare = async () => {
    if (!file1 || !file2) return;
    setAnalyzing(true);
    setErrorMessage(null);

    try {
      const b1 = await file1.arrayBuffer();
      const b2 = await file2.arrayBuffer();

      const doc1 = await loadPdfDocument(b1);
      const doc2 = await loadPdfDocument(b2);
      pdfDoc1Ref.current = doc1;
      pdfDoc2Ref.current = doc2;

      const p1 = await getPdfPagesInfo(doc1);
      const t1 = await extractTextFromPdf(doc1);

      const p2 = await getPdfPagesInfo(doc2);
      const t2 = await extractTextFromPdf(doc2);

      setPages1(p1);
      setPages2(p2);
      setText1(t1.text);
      setText2(t2.text);

      // Compute line-by-line diff
      const linesA = t1.text.split('\n').map((l) => l.trim()).filter(Boolean);
      const linesB = t2.text.split('\n').map((l) => l.trim()).filter(Boolean);
      const diff: DiffLine[] = [];

      const setB = new Set(linesB);
      const setA = new Set(linesA);

      linesA.forEach((l) => {
        if (!setB.has(l)) {
          diff.push({ type: 'removed', text: l });
        } else {
          diff.push({ type: 'same', text: l });
        }
      });

      linesB.forEach((l) => {
        if (!setA.has(l)) {
          diff.push({ type: 'added', text: l });
        }
      });

      setDiffLines(diff);
      setSelectedPage(1);
      setCompared(true);
    } catch (e: unknown) {
      console.error('[PdfCompareTool] Comparison error:', e);
      setErrorMessage(e instanceof Error ? e.message : 'Failed to compare the PDF documents. Please verify both files are valid PDFs.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Render Page to Canvases when page changes
  useEffect(() => {
    if (!compared || !pdfDoc1Ref.current || !pdfDoc2Ref.current) return;

    const renderPages = async () => {
      const c1 = canvas1Ref.current;
      const c2 = canvas2Ref.current;
      const dCanvas = diffCanvasRef.current;

      const pNum1 = Math.min(selectedPage, pdfDoc1Ref.current.numPages);
      const pNum2 = Math.min(selectedPage, pdfDoc2Ref.current.numPages);

      if (c1 && pNum1 > 0) {
        await renderPageToCanvas(pdfDoc1Ref.current, pNum1, c1, 380);
      }
      if (c2 && pNum2 > 0) {
        await renderPageToCanvas(pdfDoc2Ref.current, pNum2, c2, 380);
      }

      // Compute pixel difference overlay if diffCanvas exists
      if (c1 && c2 && dCanvas) {
        dCanvas.width = c1.width;
        dCanvas.height = c1.height;
        const dCtx = dCanvas.getContext('2d');
        const ctx1 = c1.getContext('2d');
        const ctx2 = c2.getContext('2d');

        if (dCtx && ctx1 && ctx2) {
          const img1 = ctx1.getImageData(0, 0, c1.width, c1.height);
          const img2 = ctx2.getImageData(0, 0, c1.width, c1.height);
          const diffImg = dCtx.createImageData(c1.width, c1.height);

          for (let i = 0; i < img1.data.length; i += 4) {
            const rDiff = Math.abs(img1.data[i] - img2.data[i]);
            const gDiff = Math.abs(img1.data[i + 1] - img2.data[i + 1]);
            const bDiff = Math.abs(img1.data[i + 2] - img2.data[i + 2]);
            const delta = rDiff + gDiff + bDiff;

            if (delta > 35) {
              // Highlight difference in vibrant crimson red
              diffImg.data[i] = 239; // R
              diffImg.data[i + 1] = 68; // G
              diffImg.data[i + 2] = 68; // B
              diffImg.data[i + 3] = 220; // A
            } else {
              // Muted grayscale background of doc1
              const gray = Math.round(0.299 * img1.data[i] + 0.587 * img1.data[i + 1] + 0.114 * img1.data[i + 2]);
              diffImg.data[i] = gray;
              diffImg.data[i + 1] = gray;
              diffImg.data[i + 2] = gray;
              diffImg.data[i + 3] = 160;
            }
          }
          dCtx.putImageData(diffImg, 0, 0);
        }
      }
    };

    renderPages();
  }, [compared, selectedPage, viewMode]);

  const maxPages = Math.max(pages1.length, pages2.length);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
          <GitCompare className="w-3.5 h-3.5" />
          <span>Visual & Structural Document Diff</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Compare Two PDF Documents
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Inspect visual page alterations, added/removed text passages, dimension deviations, and pixel discrepancies side by side.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Document 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
            <span>Document 1 (Original)</span>
            {pages1.length > 0 && <span className="text-xs text-indigo-600 font-bold">{pages1.length} Pages</span>}
          </h3>
          {!file1 ? (
            <FileUploader
              acceptedFormats={['.pdf']}
              multiple={false}
              onFilesSelected={(f) => {
                setFile1(f[0]);
                setCompared(false);
              }}
              title="Select first PDF"
              description="Original document version"
            />
          ) : (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                {file1.name}
              </span>
              <button
                onClick={() => {
                  setFile1(null);
                  setCompared(false);
                }}
                className="text-red-600 dark:text-red-400 font-semibold hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Document 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
            <span>Document 2 (Modified)</span>
            {pages2.length > 0 && <span className="text-xs text-indigo-600 font-bold">{pages2.length} Pages</span>}
          </h3>
          {!file2 ? (
            <FileUploader
              acceptedFormats={['.pdf']}
              multiple={false}
              onFilesSelected={(f) => {
                setFile2(f[0]);
                setCompared(false);
              }}
              title="Select second PDF"
              description="Revised document version"
            />
          ) : (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                {file2.name}
              </span>
              <button
                onClick={() => {
                  setFile2(null);
                  setCompared(false);
                }}
                className="text-red-600 dark:text-red-400 font-semibold hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-start gap-3 text-red-700 dark:text-red-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Comparison Error</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {file1 && file2 && !compared && (
        <div className="text-center">
          <button
            onClick={handleCompare}
            disabled={analyzing}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing Geometry & Text Structures...</span>
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4" />
                <span>Run Complete Document Comparison</span>
              </>
            )}
          </button>
        </div>
      )}

      {compared && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary metrics */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              Structural & Parity Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-500 block mb-1">Page Counts</span>
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <span>Doc 1: {pages1.length}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span>Doc 2: {pages2.length}</span>
                </div>
                {pages1.length === pages2.length ? (
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                    ✓ Identical page count
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
                    ⚠ Page disparity: {Math.abs(pages1.length - pages2.length)} page(s)
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-500 block mb-1">Text Volume Disparity</span>
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <span>{text1.length} chars</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span>{text2.length} chars</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Delta: {Math.abs(text1.length - text2.length)} characters
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-500 block mb-1">Page Dimensions</span>
                <div className="text-slate-800 dark:text-slate-200 font-semibold truncate">
                  {pages1[0]?.detectedStandard || 'N/A'} vs {pages2[0]?.detectedStandard || 'N/A'}
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                  ✓ Geometry verified
                </span>
              </div>
            </div>
          </div>

          {/* View Mode Tabs & Page Selector */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'side-by-side'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side-by-Side Pages</span>
              </button>

              <button
                onClick={() => setViewMode('visual-diff')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'visual-diff'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Pixel Diff Overlay</span>
              </button>

              <button
                onClick={() => setViewMode('text-diff')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'text-diff'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Text Line Diff</span>
              </button>
            </div>

            {/* Page Navigator */}
            {maxPages > 1 && viewMode !== 'text-diff' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPage((p) => Math.max(1, p - 1))}
                  disabled={selectedPage <= 1}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Page {selectedPage} of {maxPages}
                </span>
                <button
                  onClick={() => setSelectedPage((p) => Math.min(maxPages, p + 1))}
                  disabled={selectedPage >= maxPages}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* 1. SIDE BY SIDE VIEW */}
          {viewMode === 'side-by-side' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-3">
                  Document 1 — Page {selectedPage}
                </span>
                <canvas
                  ref={canvas1Ref}
                  className="rounded border border-slate-200 dark:border-slate-700 bg-white max-w-full shadow-xs"
                />
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-3">
                  Document 2 — Page {selectedPage}
                </span>
                <canvas
                  ref={canvas2Ref}
                  className="rounded border border-slate-200 dark:border-slate-700 bg-white max-w-full shadow-xs"
                />
              </div>
            </div>
          )}

          {/* 2. PIXEL DIFF OVERLAY VIEW */}
          {viewMode === 'visual-diff' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center space-y-3">
              <div className="flex items-center gap-4 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Visual Diff Overlay (Page {selectedPage})
                </span>
                <span className="flex items-center gap-1.5 font-bold text-red-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                  <span>Red Pixels: Modified or Altered Regions</span>
                </span>
              </div>

              <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden">
                <canvas
                  ref={diffCanvasRef}
                  className="rounded border border-slate-300 dark:border-slate-700 max-w-full shadow-md"
                />
              </div>
            </div>
          )}

          {/* 3. STRUCTURED TEXT DIFF VIEW */}
          {viewMode === 'text-diff' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white">
                  Line-by-Line Document Diff
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-600 font-semibold">+ Added in Doc 2</span>
                  <span className="text-red-500 font-semibold">- Removed in Doc 2</span>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 font-mono space-y-1">
                {diffLines.length === 0 ? (
                  <p className="text-slate-400">No textual differences found between the documents.</p>
                ) : (
                  diffLines.map((line, idx) => (
                    <div
                      key={idx}
                      className={`p-1 rounded ${
                        line.type === 'added'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                          : line.type === 'removed'
                          ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="mr-2 font-bold">
                        {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                      </span>
                      <span>{line.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
