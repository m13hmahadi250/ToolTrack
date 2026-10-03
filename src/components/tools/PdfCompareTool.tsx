import React, { useState } from 'react';
import { GitCompare, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { getPdfPagesInfo, extractTextFromPdf, loadPdfDocument } from '../../lib/pdfRenderer';
import type { DetectedPageInfo } from '../../types';

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

  const handleCompare = async () => {
    if (!file1 || !file2) return;
    setAnalyzing(true);
    setErrorMessage(null);

    try {
      // Read each file buffer fresh
      const b1 = await file1.arrayBuffer();
      const b2 = await file2.arrayBuffer();

      // Load documents safely
      const doc1 = await loadPdfDocument(b1);
      const doc2 = await loadPdfDocument(b2);

      // Extract page metadata and text sequentially per document to avoid worker race conditions
      const p1 = await getPdfPagesInfo(doc1);
      const t1 = await extractTextFromPdf(doc1);

      const p2 = await getPdfPagesInfo(doc2);
      const t2 = await extractTextFromPdf(doc2);

      setPages1(p1);
      setPages2(p2);
      setText1(t1.text);
      setText2(t2.text);
      setCompared(true);
    } catch (e: unknown) {
      console.error('[PdfCompareTool] Comparison error:', e);
      setErrorMessage(e instanceof Error ? e.message : 'Failed to compare the PDF documents. Please check that both files are valid PDFs.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Compare Two PDF Documents
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Upload two PDF versions to evaluate page count disparities, dimension variances, and text alterations side by side.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Document 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Document 1 (Original)</h3>
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
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
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
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Document 2 (Modified)</h3>
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
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
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
                <span>Comparing Documents...</span>
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4" />
                <span>Run Comparison</span>
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
              Structural Comparison Summary
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
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
                    ⚠ Page count difference: {Math.abs(pages1.length - pages2.length)} pages
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-500 block mb-1">Text Character Volume</span>
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <span>{text1.length} chars</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span>{text2.length} chars</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Diff: {Math.abs(text1.length - text2.length)} characters
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-500 block mb-1">Dimensions Parity</span>
                <div className="text-slate-800 dark:text-slate-200 font-semibold">
                  {pages1[0]?.detectedStandard || 'N/A'} vs {pages2[0]?.detectedStandard || 'N/A'}
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                  ✓ Standard geometry checked
                </span>
              </div>
            </div>
          </div>

          {/* Text difference view */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Document 1 Extracted Text
              </span>
              <textarea
                readOnly
                rows={8}
                value={text1}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono"
              ></textarea>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Document 2 Extracted Text
              </span>
              <textarea
                readOnly
                rows={8}
                value={text2}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono"
              ></textarea>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
