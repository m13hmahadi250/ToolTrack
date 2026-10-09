import React, { useState } from 'react';
import { Split, Download, Archive, CheckCircle2, RotateCcw } from 'lucide-react';
import JSZip from 'jszip';
import { FileUploader } from '../common/FileUploader';
import { splitEveryPage, splitPdfByRanges } from '../../lib/pdfUtils';
import { getPdfPagesInfo } from '../../lib/pdfRenderer';
import { useToolTrack } from '../../context/ToolTrackContext';

export const SplitPdfTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [splitMode, setSplitMode] = useState<'every' | 'ranges'>('ranges');
  const [rangeInput, setRangeInput] = useState('');

  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; bytes: Uint8Array }[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  const processingVersionRef = React.useRef(0);
  const hasSplitOnceRef = React.useRef(false);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setResults([]);
    setZipBlob(null);
    hasSplitOnceRef.current = false;

    try {
      const buffer = await f.arrayBuffer();
      const info = await getPdfPagesInfo(buffer);
      setPageCount(info.length);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSplitWithVersion = async (targetVersion: number) => {
    if (!file) return;
    if (processingVersionRef.current !== targetVersion) return;

    setProcessing(true);

    const jobId = addJob({
      fileName: file.name,
      fileSize: file.size,
      toolId: 'split-pdf',
      toolName: 'Split PDF',
      status: 'processing',
      progress: 0.2,
      outputFileName: `${file.name.replace(/\.[^/.]+$/, '')}-split.zip`,
    });

    try {
      const buffer = await file.arrayBuffer();
      if (processingVersionRef.current !== targetVersion) return;

      let generated: { name: string; bytes: Uint8Array }[] = [];

      if (splitMode === 'every') {
        generated = await splitEveryPage(buffer);
      } else {
        if (!rangeInput.trim()) {
          setProcessing(false);
          updateJob(jobId, {
            status: 'failed',
            errorMessage: 'Please enter page ranges to extract (e.g. 1-3, 5-8)',
          });
          return;
        }
        generated = await splitPdfByRanges(buffer, rangeInput);
      }

      if (processingVersionRef.current !== targetVersion) return;

      setResults(generated);

      if (generated.length > 1) {
        const zip = new JSZip();
        generated.forEach((item) => {
          zip.file(item.name, item.bytes);
        });
        const zBlob = await zip.generateAsync({ type: 'blob' });
        if (processingVersionRef.current === targetVersion) {
          setZipBlob(zBlob);

          updateJob(jobId, {
            status: 'completed',
            progress: 1.0,
            outputBlob: zBlob,
            outputSize: zBlob.size,
          });
        }
      } else if (generated.length === 1) {
        const singleBlob = new Blob([new Uint8Array(generated[0].bytes)], { type: 'application/pdf' });
        updateJob(jobId, {
          status: 'completed',
          progress: 1.0,
          outputBlob: singleBlob,
          outputSize: singleBlob.size,
        });
      }

      addRecentActivity('split-pdf', 'Split PDF', file.name, 'completed');
    } catch (err: unknown) {
      console.error(err);
      if (processingVersionRef.current === targetVersion) {
        updateJob(jobId, {
          status: 'failed',
          errorMessage: 'Splitting failed: ' + String(err),
        });
        addRecentActivity('split-pdf', 'Split PDF', file.name, 'failed');
      }
    } finally {
      if (processingVersionRef.current === targetVersion) {
        setProcessing(false);
      }
    }
  };

  const handleSplit = () => {
    hasSplitOnceRef.current = true;
    processingVersionRef.current += 1;
    handleSplitWithVersion(processingVersionRef.current);
  };

  // AUTOMATIC REPROCESSING ON SETTINGS CHANGE (FROM ORIGINAL PDF)
  React.useEffect(() => {
    if (!file || !hasSplitOnceRef.current) return;

    // Invalidate stale result immediately
    setResults([]);
    setZipBlob(null);
    setProcessing(true);

    processingVersionRef.current += 1;
    const currentVersion = processingVersionRef.current;

    const timer = setTimeout(() => {
      handleSplitWithVersion(currentVersion);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [splitMode, rangeInput]);

  const downloadSingle = (item: { name: string; bytes: Uint8Array }) => {
    const blob = new Blob([new Uint8Array(item.bytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadZip = () => {
    if (!zipBlob) return;
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.replace(/\.[^/.]+$/, '')}-split.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Split PDF Document
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Separate a PDF into individual page files or extract custom page ranges into a ZIP package.
        </p>
      </div>

      {!file ? (
        <FileUploader
          acceptedFormats={['.pdf']}
          multiple={false}
          onFilesSelected={handleFilesSelected}
          title="Select PDF to split"
          description="Choose whether to split every page or extract specific ranges"
        />
      ) : (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {file.name}
                </span>
                <span className="text-xs text-slate-400 ml-2">({pageCount} Total Pages)</span>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setResults([]);
                  setZipBlob(null);
                }}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Change File
              </button>
            </div>

            {/* Split options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setSplitMode('ranges')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  splitMode === 'ranges'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="text-sm font-bold">Split by Page Ranges</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  e.g. 1-3, 4-6, or specific page lists
                </div>
              </button>

              <button
                onClick={() => setSplitMode('every')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  splitMode === 'every'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="text-sm font-bold">Split Every Single Page</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Generate {pageCount} separate 1-page PDF files
                </div>
              </button>
            </div>

            {splitMode === 'ranges' && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Page Ranges (comma separated)
                </label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder="e.g. 1-3, 5, 7-10"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Valid page range: 1 to {pageCount}. Each comma-separated section generates a file.
                </p>
              </div>
            )}
          </div>

          {/* Results list */}
          {results.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Split Completed ({results.length} files generated)</span>
                </h4>
                {zipBlob && (
                  <button
                    onClick={downloadZip}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Download All (ZIP)</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                {results.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                    <button
                      onClick={() => downloadSingle(item)}
                      className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          {results.length === 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Ready to split
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Processes instantaneously in your browser.
                </p>
              </div>

              <button
                onClick={handleSplit}
                disabled={processing}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Splitting...</span>
                  </>
                ) : (
                  <>
                    <Split className="w-4 h-4" />
                    <span>Split PDF Now</span>
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
