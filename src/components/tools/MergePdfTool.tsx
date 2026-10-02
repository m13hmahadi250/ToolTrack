import React, { useState } from 'react';
import { Combine, ArrowUp, ArrowDown, Trash2, Download, Plus, CheckCircle2 } from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { ToolTrackFileFlow } from '../common/ToolTrackFileFlow';
import { mergePdfs } from '../../lib/pdfUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

export const MergePdfTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [files, setFiles] = useState<File[]>([]);
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(-1);
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');
  const [outputSize, setOutputSize] = useState<number | null>(null);

  // Keyboard navigation for file selection menu
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (files.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedFileIdx((prev) => (prev < files.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedFileIdx((prev) => (prev > 0 ? prev - 1 : files.length - 1));
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedFileIdx >= 0 && selectedFileIdx < files.length) {
          e.preventDefault();
          removeFile(selectedFileIdx);
          setSelectedFileIdx((prev) => (prev >= files.length - 1 ? files.length - 2 : prev));
        }
      } else if (e.key === 'Escape') {
        if (selectedFileIdx >= 0) {
          e.preventDefault();
          setSelectedFileIdx(-1);
        } else {
          // Exit file selection menu and return to upload view
          setFiles([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files, selectedFileIdx]);

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setResultBlob(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true);

    const outName = `merged-document-${Date.now()}.pdf`;
    setResultFileName(outName);

    const totalInputSize = files.reduce((acc, f) => acc + f.size, 0);
    const jobId = addJob({
      fileName: `${files.length} PDF files`,
      fileSize: totalInputSize,
      toolId: 'merge-pdf',
      toolName: 'Merge PDF',
      status: 'processing',
      progress: 0.3,
      outputFileName: outName,
    });

    try {
      const buffers: ArrayBuffer[] = [];
      for (const f of files) {
        buffers.push(await f.arrayBuffer());
      }

      updateJob(jobId, { progress: 0.6 });
      const mergedBytes = await mergePdfs(buffers);
      const blob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' });

      setResultBlob(blob);
      setOutputSize(blob.size);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: blob,
        outputSize: blob.size,
      });

      addRecentActivity('merge-pdf', 'Merge PDF', `${files.length} documents`, 'completed');
    } catch (err: unknown) {
      console.error(err);
      updateJob(jobId, {
        status: 'failed',
        errorMessage: 'Failed to merge PDFs: ' + String(err),
      });
      addRecentActivity('merge-pdf', 'Merge PDF', `${files.length} documents`, 'failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFileName || 'merged-document.pdf';
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Merge PDF Files
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Combine multiple PDF files into a single unified document in any order you choose.
        </p>
      </div>

      {files.length === 0 ? (
        <FileUploader
          acceptedFormats={['.pdf']}
          multiple={true}
          maxFiles={20}
          onFilesSelected={handleFilesSelected}
          title="Select or drop multiple PDF files to merge"
          description="Drag to reorder after uploading"
        />
      ) : (
        <div className="space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Files to Merge ({files.length})
                </h3>
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                  <span>Navigate: <kbd className="font-mono text-[10px] font-bold">↑</kbd> <kbd className="font-mono text-[10px] font-bold">↓</kbd></span>
                  <span>•</span>
                  <span>Exit: <kbd className="font-mono text-[10px] font-bold">Esc</kbd></span>
                </div>
              </div>
              <button
                onClick={() => setFiles([])}
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2" role="listbox" aria-label="Selected files to merge">
              {files.map((file, idx) => {
                const isSelected = selectedFileIdx === idx;
                return (
                  <div
                    key={`${file.name}-${idx}`}
                    onClick={() => setSelectedFileIdx(idx)}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/50'
                        : 'border-slate-200 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-slate-100/60 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === files.length - 1}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFile(idx)}
                        className="p-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition ml-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                <Plus className="w-3.5 h-3.5" />
                <span>Add More PDFs</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                  }}
                />
              </label>
            </div>
          </div>

          {/* Processing / Result Flow */}
          {processing && (
            <ToolTrackFileFlow
              mode="processing"
              stage="processing"
              stageLabel={`Combining ${files.length} documents into unified page stream...`}
              details={`${files.length} PDFs queued`}
            />
          )}

          {resultBlob && (
            <ToolTrackFileFlow
              mode="success"
              stage="ready"
              stageLabel={`Successfully combined ${files.length} PDF documents!`}
              fileName={resultFileName}
              fileSize={formatBytes(outputSize || 0)}
              fileType="Merged PDF Document"
              details={`${files.length} files combined`}
              onDownload={handleDownload}
              onReset={() => {
                setFiles([]);
                setResultBlob(null);
              }}
              downloadLabel="Download Merged PDF"
              downloadFileName={resultFileName}
            />
          )}

          {/* Action Bar */}
          {!resultBlob && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {files.length < 2
                    ? 'Add at least 2 files to merge'
                    : `Ready to combine ${files.length} PDFs`}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Output will maintain the exact order shown above.
                </p>
              </div>

              <button
                onClick={handleMerge}
                disabled={processing || files.length < 2}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Merging PDFs...</span>
                  </>
                ) : (
                  <>
                    <Combine className="w-4 h-4" />
                    <span>Merge PDFs</span>
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
