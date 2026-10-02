import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize2,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Eye,
  Sliders,
  Check
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { getPdfPagesInfo, loadPdfDocument, renderPageToCanvas, STANDARD_SIZES_MM, MM_TO_PT } from '../../lib/pdfRenderer';
import { normalizePdfPageSizes } from '../../lib/pdfUtils';
import { useToolTrack } from '../../context/ToolTrackContext';
import type { DetectedPageInfo, PageSizeNormalizerOptions, PageStandardSize, PageOrientation, ScaleMode, AlignmentMode } from '../../types';

export const PageSizeNormalizer: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [pagesInfo, setPagesInfo] = useState<DetectedPageInfo[]>([]);
  const [hasMixedSizes, setHasMixedSizes] = useState(false);

  // Normalizer options
  const [targetSize, setTargetSize] = useState<PageStandardSize>('A4');
  const [customWidthMm, setCustomWidthMm] = useState(210);
  const [customHeightMm, setCustomHeightMm] = useState(297);
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [scaleMode, setScaleMode] = useState<ScaleMode>('fit');
  const [alignment, setAlignment] = useState<AlignmentMode>('center');
  const [margins, setMargins] = useState({ top: 10, bottom: 10, left: 10, right: 10 });
  const [allowDistortion, setAllowDistortion] = useState(false);

  // Preview state
  const [previewPageNumber, setPreviewPageNumber] = useState(1);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Processing & result state
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');
  const [outputSize, setOutputSize] = useState<number | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setResultBlob(null);
    setAnalyzing(true);

    try {
      const buffer = await selected.arrayBuffer();
      const detected = await getPdfPagesInfo(buffer);
      setPagesInfo(detected);

      // Check if there are mixed page sizes
      const firstStandard = detected[0]?.detectedStandard;
      const isMixed = detected.some((p) => p.detectedStandard !== firstStandard);
      setHasMixedSizes(isMixed);
      setPreviewPageNumber(1);
    } catch (err) {
      console.error('Error analyzing PDF:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Escape key listener to exit file selection menu back to uploader
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'Escape' && file && !processing) {
        setFile(null);
        setPagesInfo([]);
        setResultBlob(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, processing]);

  // Render live preview on canvas
  useEffect(() => {
    let active = true;
    const renderPreview = async () => {
      if (!file || pagesInfo.length === 0) return;
      setPreviewLoading(true);

      try {
        const buffer = await file.arrayBuffer();
        const pdfDoc = await loadPdfDocument(buffer);

        if (!active || !previewCanvasRef.current) return;
        await renderPageToCanvas(pdfDoc, previewPageNumber, previewCanvasRef.current, 280);
      } catch {
        // Preview generation cancelled or skipped
      } finally {
        if (active) setPreviewLoading(false);
      }
    };

    renderPreview();
    return () => {
      active = false;
    };
  }, [file, previewPageNumber, pagesInfo]);

  const handleNormalize = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(0.15);

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const outName = `${baseName}-normalized-${targetSize.toLowerCase()}.pdf`;
    setResultFileName(outName);

    const jobId = addJob({
      fileName: file.name,
      fileSize: file.size,
      toolId: 'normalize-pdf-page-size',
      toolName: 'Normalize PDF Page Size',
      status: 'processing',
      progress: 0.2,
      outputFileName: outName,
    });

    try {
      const buffer = await file.arrayBuffer();
      setProgress(0.45);
      updateJob(jobId, { progress: 0.45 });

      const options: PageSizeNormalizerOptions = {
        targetSize,
        customWidthMm,
        customHeightMm,
        orientation,
        scaleMode,
        alignment,
        margins,
        allowDistortion,
      };

      const normalizedBytes = await normalizePdfPageSizes(buffer, options);
      setProgress(0.9);
      updateJob(jobId, { progress: 0.9 });

      const blob = new Blob([new Uint8Array(normalizedBytes)], { type: 'application/pdf' });
      setResultBlob(blob);
      setOutputSize(blob.size);
      setProgress(1.0);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: blob,
        outputSize: blob.size,
      });

      addRecentActivity('normalize-pdf-page-size', 'Normalize PDF Page Size', file.name, 'completed');
    } catch (err: unknown) {
      console.error(err);
      updateJob(jobId, {
        status: 'failed',
        errorMessage: 'Normalization failed: ' + String(err),
      });
      addRecentActivity('normalize-pdf-page-size', 'Normalize PDF Page Size', file.name, 'failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFileName || 'document-normalized.pdf';
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
      {/* Tool Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800">
            Flagship Engineering Tool
          </span>
          <span className="text-xs font-medium text-slate-400">100% Vector Preserved</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Normalize PDF Page Size
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
          Detect mixed or irregular page dimensions in scanned, merged, or legacy documents and standardize all pages to a consistent target standard (A4, Letter, A3, etc.) without content distortion.
        </p>
      </div>

      {!file ? (
        <FileUploader
          acceptedFormats={['.pdf']}
          multiple={false}
          onFilesSelected={handleFilesSelected}
          title="Upload PDF to analyze page sizes"
          description="Drag & drop or browse to inspect dimensions and normalize"
        />
      ) : (
        <div className="space-y-6">
          {/* Analysis Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-base text-slate-900 dark:text-white truncate max-w-md">
                  {file.name}
                </span>
                <span className="text-xs text-slate-400">({formatBytes(file.size)})</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {pagesInfo.length} Total Pages Analyzed
                {hasMixedSizes ? (
                  <span className="ml-2 font-semibold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Mixed page dimensions detected!
                  </span>
                ) : (
                  <span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Uniform dimensions
                  </span>
                )}
              </p>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setPagesInfo([]);
                setResultBlob(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5"
            >
              <span>Choose Different File</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">Esc</kbd>
            </button>
          </div>

          {/* Main Workspace Grid: Controls + Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Configuration Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Presets & Target Size */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Target Standard Page Size</span>
                </h3>

                {/* Quick Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['A4', 'Letter', 'A3', 'A5'] as PageStandardSize[]).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setTargetSize(sz)}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        targetSize === sz
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold'
                      }`}
                    >
                      <div>{sz}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {STANDARD_SIZES_MM[sz]?.width} × {STANDARD_SIZES_MM[sz]?.height} mm
                      </div>
                    </button>
                  ))}
                </div>

                {/* Additional Smart Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => setTargetSize('FirstPage')}
                    className={`p-2 rounded-lg text-xs font-semibold border transition ${
                      targetSize === 'FirstPage'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Match 1st Page
                  </button>
                  <button
                    onClick={() => setTargetSize('LargestPage')}
                    className={`p-2 rounded-lg text-xs font-semibold border transition ${
                      targetSize === 'LargestPage'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Match Largest Page
                  </button>
                  <button
                    onClick={() => setTargetSize('SmallestPage')}
                    className={`p-2 rounded-lg text-xs font-semibold border transition ${
                      targetSize === 'SmallestPage'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Match Smallest Page
                  </button>
                </div>

                {/* Custom dimensions if selected */}
                {targetSize === 'Custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Width (mm)
                      </label>
                      <input
                        type="number"
                        value={customWidthMm}
                        onChange={(e) => setCustomWidthMm(Number(e.target.value))}
                        className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Height (mm)
                      </label>
                      <input
                        type="number"
                        value={customHeightMm}
                        onChange={(e) => setCustomHeightMm(Number(e.target.value))}
                        className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Orientation & Scaling Rules */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Orientation & Scaling
                </h3>

                {/* Orientation options */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Target Orientation
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['portrait', 'landscape', 'auto'] as PageOrientation[]).map((ori) => (
                      <button
                        key={ori}
                        onClick={() => setOrientation(ori)}
                        className={`p-2 rounded-lg text-xs font-semibold capitalize border transition ${
                          orientation === ori
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {ori}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scaling mode */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Content Scaling Mode
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        { id: 'fit', label: 'Fit Content', desc: 'Preserves aspect ratio' },
                        { id: 'fill', label: 'Fill Page', desc: 'Covers whole page' },
                        { id: 'original', label: 'Keep 1:1', desc: 'No scale modification' },
                        { id: 'proportional', label: 'Proportional', desc: 'Within margins' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setScaleMode(m.id)}
                        className={`p-2 rounded-lg text-left border transition ${
                          scaleMode === m.id
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-xs font-semibold">{m.label}</div>
                        <div className="text-[10px] text-slate-400">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alignment */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Alignment
                  </label>
                  <div className="flex gap-2">
                    {(['center', 'top', 'bottom', 'left', 'right'] as AlignmentMode[]).map((al) => (
                      <button
                        key={al}
                        onClick={() => setAlignment(al)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition ${
                          alignment === al
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {al}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Margins */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Page Margins (mm)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['top', 'bottom', 'left', 'right'].map((m) => (
                      <div key={m}>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{m}</span>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={margins[m as keyof typeof margins]}
                          onChange={(e) =>
                            setMargins({ ...margins, [m]: Math.max(0, Number(e.target.value)) })
                          }
                          className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Distortion checkbox */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowDistortion}
                      onChange={(e) => setAllowDistortion(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Force stretch content (Warning: may distort aspect ratio)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Live Page Preview & Dimensions Table (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Live Preview Panel */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
                <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Page Preview
                    </span>
                  </div>

                  {pagesInfo.length > 1 && (
                    <div className="flex items-center gap-2">
                      <select
                        value={previewPageNumber}
                        onChange={(e) => setPreviewPageNumber(Number(e.target.value))}
                        className="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                      >
                        {pagesInfo.map((p) => (
                          <option key={p.pageNumber} value={p.pageNumber}>
                            Page {p.pageNumber} ({p.detectedStandard})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Canvas Container with drop shadow & target border mockup */}
                <div className="relative p-4 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-center justify-center min-h-[300px] w-full">
                  {previewLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 z-10 rounded-xl">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <canvas
                    ref={previewCanvasRef}
                    className="shadow-md rounded border border-slate-300 dark:border-slate-600 max-h-[260px] object-contain bg-white"
                  />
                </div>

                <div className="w-full mt-3 text-center">
                  <p className="text-[11px] text-slate-400">
                    Source: {pagesInfo[previewPageNumber - 1]?.widthMm} ×{' '}
                    {pagesInfo[previewPageNumber - 1]?.heightMm} mm ({pagesInfo[previewPageNumber - 1]?.detectedStandard})
                  </p>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    Target: {targetSize} ({orientation}) with {scaleMode} scaling
                  </p>
                </div>
              </div>

              {/* Detected Page Sizes Breakdown */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Analyzed Page Dimensions</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {pagesInfo.length} Pages
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {pagesInfo.map((p) => (
                    <div key={p.pageNumber} className="py-2 flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Page {p.pageNumber}
                      </span>
                      <span className="font-mono text-slate-500">
                        {p.widthMm} × {p.heightMm} mm
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {p.detectedStandard} ({p.orientation})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action & Result Section */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Ready to Normalize All Pages
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every page will be adapted to {targetSize} standard dimensions without vector loss.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!resultBlob ? (
                <button
                  onClick={handleNormalize}
                  disabled={processing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing ({Math.round(progress * 100)}%)...</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4" />
                      <span>Normalize All Pages</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleDownload}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Normalized PDF ({formatBytes(outputSize || 0)})</span>
                  </button>

                  <button
                    onClick={() => setResultBlob(null)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Change settings and re-process"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
