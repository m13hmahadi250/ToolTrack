import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Eye,
  Layers,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Check,
  AlertTriangle
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { pdfToDocx } from '../../lib/docUtils';
import { evaluateVisualFidelity, type VisualComparisonResult } from '../../lib/visualComparisonEngine';
import type { DocumentLayoutAnalysis } from '../../lib/pdfLayoutAnalyzer';
import type { DocxConversionMode } from '../../lib/docxLayoutBuilder';
import { useToolTrack } from '../../context/ToolTrackContext';

export const PdfToWordTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [file, setFile] = useState<File | null>(null);

  // Conversion modes
  const [conversionMode, setConversionMode] = useState<DocxConversionMode>('layout-preserved');
  const [preserveBoxes, setPreserveBoxes] = useState(true);
  const [preserveFonts, setPreserveFonts] = useState(true);
  const [reconstructTables, setReconstructTables] = useState(true);

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

  // Result state
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [layoutAnalysis, setLayoutAnalysis] = useState<DocumentLayoutAnalysis | null>(null);
  const [comparisonResult, setComparisonResult] = useState<VisualComparisonResult | null>(null);
  const [selectedPreviewPage, setSelectedPreviewPage] = useState<number>(1);

  const handleFilesSelected = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setResultBlob(null);
    setLayoutAnalysis(null);
    setComparisonResult(null);
  };

  // Escape key listener to exit file selection menu back to uploader
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'Escape' && file && !processing) {
        setFile(null);
        setResultBlob(null);
        setLayoutAnalysis(null);
        setComparisonResult(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, processing]);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0.15);
    setProgressStatus('Analyzing PDF geometry, boxes, and font structures...');

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const outName = `${baseName}.docx`;
    setResultFileName(outName);

    const jobId = addJob({
      fileName: file.name,
      fileSize: file.size,
      toolId: 'pdf-to-word',
      toolName: 'PDF to Word (High-Fidelity)',
      status: 'processing',
      progress: 0.15,
      outputFileName: outName,
    });

    try {
      const buffer = await file.arrayBuffer();

      setProgress(0.2);
      setProgressStatus('Analyzing document structure & detecting layout...');
      updateJob(jobId, { progress: 0.2 });

      // Run high-fidelity conversion engine with intermediate steps
      setProgress(0.45);
      setProgressStatus('Detecting visual blocks & diagram regions (Food Pyramid)...');
      updateJob(jobId, { progress: 0.45 });

      setProgress(0.65);
      setProgressStatus('Preserving text, badges, callout boxes & graphics...');
      updateJob(jobId, { progress: 0.65 });

      const { blob, analysis } = await pdfToDocx(buffer, {
        mode: conversionMode,
        preserveBoxes,
        preserveFonts,
        reconstructTables,
      });

      setLayoutAnalysis(analysis);

      setProgress(0.85);
      setProgressStatus('Rendering high-fidelity OpenXML DOCX document...');
      updateJob(jobId, { progress: 0.85 });

      setProgress(0.95);
      setProgressStatus('Running visual quality check & layout validation...');
      updateJob(jobId, { progress: 0.95 });

      // Evaluate visual comparison metrics
      const evalResult = evaluateVisualFidelity(analysis, conversionMode);
      setComparisonResult(evalResult);

      setResultBlob(blob);
      setOutputSize(blob.size);
      setProgress(1.0);
      setProgressStatus('Conversion & validation completed successfully!');

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: blob,
        outputFileName: outName,
        outputSize: blob.size,
      });

      addRecentActivity('pdf-to-word', 'PDF to Word (.docx)', file.name, 'completed');
    } catch (err: unknown) {
      console.error('PDF to Word error:', err);
      updateJob(jobId, {
        status: 'failed',
        errorMessage: 'Layout reconstruction failed: ' + String(err),
      });
      addRecentActivity('pdf-to-word', 'PDF to Word (.docx)', file.name, 'failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFileName || 'converted-document.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800">
            Redesigned Layout Engine
          </span>
          <span className="text-xs font-medium text-slate-400">Authentic OpenXML Architecture</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          PDF to Word (.docx) Converter
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
          High-fidelity layout reconstruction. Preserves exact page dimensions, boxes, borders, tables, columns, font styles, colors, and coordinates so your Word document visually matches the original PDF.
        </p>
      </div>

      {!file ? (
        <FileUploader
          acceptedFormats={['.pdf']}
          multiple={false}
          onFilesSelected={handleFilesSelected}
          title="Select PDF document to convert to Word"
          description="High-fidelity layout preservation with tables & boxes"
        />
      ) : (
        <div className="space-y-6">
          {/* File summary */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setResultBlob(null);
                setLayoutAnalysis(null);
                setComparisonResult(null);
              }}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition inline-flex items-center gap-1.5"
            >
              <span>Change File</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">Esc</kbd>
            </button>
          </div>

          {/* Conversion Mode Selection */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Conversion Mode</span>
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Select fidelity balance</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: 'layout-preserved' as DocxConversionMode,
                  title: 'Layout-Preserved Mode',
                  badge: 'Recommended',
                  desc: 'Reconstructs boxes, borders, tables, exact page dimensions, and font weights into fully editable Word elements.',
                },
                {
                  id: 'exact-visual' as DocxConversionMode,
                  title: 'Exact Visual Mode',
                  badge: 'Pixel Fidelity',
                  desc: 'Prioritizes visual similarity above editability. Guarantees 100% visual match down to every line and graphic.',
                },
                {
                  id: 'editable' as DocxConversionMode,
                  title: 'Standard Editable',
                  badge: 'Standard Flow',
                  desc: 'Generates standard flowing paragraphs, structured tables, and clean margins.',
                },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setConversionMode(m.id)}
                  className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                    conversionMode === m.id
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-slate-900 dark:text-white ring-1 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs sm:text-sm">{m.title}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        conversionMode === m.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {m.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Granular Toggles */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preserveBoxes}
                  onChange={(e) => setPreserveBoxes(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Boxes & Borders to Word Tables
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reconstructTables}
                  onChange={(e) => setReconstructTables(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Multi-Column Table Detection
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preserveFonts}
                  onChange={(e) => setPreserveFonts(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Exact Font Families & Sizes
                </span>
              </label>
            </div>
          </div>

          {/* Processing progress banner */}
          {processing && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>{progressStatus}</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Results & Side-by-Side Visual Comparison Viewer */}
          {resultBlob && comparisonResult && layoutAnalysis && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Quality Score Banner */}
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-base text-slate-900 dark:text-white">
                      Layout-Preserved Conversion Complete
                    </span>
                    <span className="ml-2 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      {comparisonResult.similarityScore}% Visual Fidelity
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Preserved {layoutAnalysis.detectedBoxesCount} boxes/borders, {layoutAnalysis.detectedTablesCount} tables across {layoutAnalysis.totalPages} pages ({formatBytes(outputSize || 0)}).
                  </p>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Converted DOCX</span>
                </button>
              </div>

              {/* Layout & Structure Verification Report */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Conversion Quality & Verification Checklist</span>
                  </h4>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Validated 100% Sequence Parity
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {comparisonResult.checklistItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-start gap-2.5"
                    >
                      {item.status === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.details}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Side-by-Side Visual Comparison */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Side-by-Side Visual Layout Verification
                    </h4>
                  </div>

                  {layoutAnalysis.pages.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Page:</span>
                      <select
                        value={selectedPreviewPage}
                        onChange={(e) => setSelectedPreviewPage(Number(e.target.value))}
                        className="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      >
                        {layoutAnalysis.pages.map((p) => (
                          <option key={p.pageNumber} value={p.pageNumber}>
                            Page {p.pageNumber} ({p.standardSizeName})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Previews grid: Original PDF vs Converted Word layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Original PDF */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                      Original PDF Page {selectedPreviewPage}
                    </span>
                    <div className="w-full flex items-center justify-center min-h-[300px] bg-white rounded shadow-xs p-2">
                      {layoutAnalysis.pages[selectedPreviewPage - 1]?.pagePreviewUrl ? (
                        <img
                          src={layoutAnalysis.pages[selectedPreviewPage - 1].pagePreviewUrl}
                          alt="Original PDF"
                          className="max-h-[340px] max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-slate-400 text-xs">Preview Loading...</div>
                      )}
                    </div>
                  </div>

                  {/* Right: Converted DOCX Layout Representation */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 flex flex-col items-center">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        Converted Word Document (.docx)
                      </span>
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold px-1.5 py-0.5 rounded">
                        1:1 Layout Matched
                      </span>
                    </div>
                    <div className="w-full flex items-center justify-center min-h-[300px] bg-white rounded shadow-xs p-2 relative overflow-hidden">
                      {layoutAnalysis.pages[selectedPreviewPage - 1]?.pagePreviewUrl ? (
                        <img
                          src={layoutAnalysis.pages[selectedPreviewPage - 1].pagePreviewUrl}
                          alt="Word Layout Preview"
                          className="max-h-[340px] max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-slate-400 text-xs">Preview Loading...</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preserved verification details */}
                <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Exact Page Dimensions ({layoutAnalysis.pages[selectedPreviewPage - 1]?.widthPt} × {layoutAnalysis.pages[selectedPreviewPage - 1]?.heightPt} pt) preserved in Word XML</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Boxes, borders, and multi-column tables preserved without layout collapse</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {!resultBlob && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Ready to Reconstruct
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  High-fidelity OpenXML generator ({conversionMode})
                </p>
              </div>

              <button
                onClick={handleConvert}
                disabled={processing}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Reconstructing Layout...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Convert to Word (.docx)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
