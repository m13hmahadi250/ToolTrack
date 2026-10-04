import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  Trash2,
  Copy,
  Plus,
  ArrowLeft,
  ArrowRight,
  Download,
  CheckCircle2,
  Layers,
  FileCheck,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  CheckSquare,
  Square,
  FilePlus,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { loadPdfDocument, renderPageToImageDataUrl } from '../../lib/pdfRenderer';
import { organizeAndModifyPdf, PagePlanItem } from '../../lib/pdfUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

interface PageItem {
  id: string;
  originalIndex: number;
  rotation: number;
  isBlank?: boolean;
}

export const OrganizePdfTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultSize, setResultSize] = useState<number | null>(null);

  const processingVersionRef = useRef(0);

  // Escape key handler to deselect or exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape' && file) {
        if (selectedIndices.length > 0) {
          e.preventDefault();
          setSelectedIndices([]);
        } else {
          e.preventDefault();
          setFile(null);
          setPages([]);
          setThumbnails([]);
          setResultBlob(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, selectedIndices]);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setResultBlob(null);
    setSelectedIndices([]);
    setLoadingThumbnails(true);

    try {
      const buffer = await f.arrayBuffer();
      const pdf = await loadPdfDocument(buffer);
      const count = pdf.numPages;

      const pageList: PageItem[] = Array.from({ length: count }, (_, i) => ({
        id: `page-${i}-${Date.now()}`,
        originalIndex: i,
        rotation: 0,
      }));
      setPages(pageList);

      const thumbs: string[] = [];
      for (let i = 1; i <= count; i++) {
        const thumb = await renderPageToImageDataUrl(pdf, i, 220);
        thumbs.push(thumb);
      }
      setThumbnails(thumbs);
    } catch (e) {
      console.error('Error loading PDF thumbnails:', e);
    } finally {
      setLoadingThumbnails(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const selectAll = () => {
    setSelectedIndices(pages.map((_, i) => i));
  };

  const deselectAll = () => {
    setSelectedIndices([]);
  };

  const rotatePage = (index: number, deg = 90) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, rotation: (p.rotation + deg) % 360 } : p))
    );
  };

  const movePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    setPages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, item);
      return copy;
    });
  };

  const moveToFirst = (index: number) => {
    movePage(index, 0);
  };

  const moveToLast = (index: number) => {
    movePage(index, pages.length - 1);
  };

  const reverseOrder = () => {
    setPages((prev) => [...prev].reverse());
    setSelectedIndices([]);
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndices((prev) => prev.filter((i) => i !== index));
  };

  const duplicatePage = (index: number) => {
    setPages((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, {
        ...copy[index],
        id: `page-dup-${Date.now()}-${Math.random()}`,
      });
      return copy;
    });
  };

  const insertBlankPageAfter = (index: number) => {
    setPages((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, {
        id: `blank-${Date.now()}-${Math.random()}`,
        originalIndex: -1,
        rotation: 0,
        isBlank: true,
      });
      return copy;
    });
  };

  const deleteSelected = () => {
    if (selectedIndices.length === 0 || pages.length - selectedIndices.length < 1) return;
    setPages((prev) => prev.filter((_, i) => !selectedIndices.includes(i)));
    setSelectedIndices([]);
  };

  const rotateSelected = (deg = 90) => {
    setPages((prev) =>
      prev.map((p, i) =>
        selectedIndices.includes(i) ? { ...p, rotation: (p.rotation + deg) % 360 } : p
      )
    );
  };

  const handleExportWithVersion = async (targetVersion: number) => {
    if (!file || pages.length === 0) return;
    if (processingVersionRef.current !== targetVersion) return;

    setProcessing(true);

    const outName = `${file.name.replace(/\.[^/.]+$/, '')}-organized.pdf`;
    const jobId = addJob({
      fileName: file.name,
      fileSize: file.size,
      toolId: 'organize-pdf',
      toolName: 'Organize PDF',
      status: 'processing',
      progress: 0.3,
      outputFileName: outName,
    });

    try {
      const buffer = await file.arrayBuffer();
      if (processingVersionRef.current !== targetVersion) return;

      const pagePlan: PagePlanItem[] = pages.map((p) => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation,
        isBlank: p.isBlank,
      }));

      const modifiedBytes = await organizeAndModifyPdf(buffer, {
        pagePlan,
      });

      if (processingVersionRef.current !== targetVersion) return;

      const blob = new Blob([new Uint8Array(modifiedBytes)], { type: 'application/pdf' });
      setResultBlob(blob);
      setResultSize(blob.size);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: blob,
        outputSize: blob.size,
      });

      addRecentActivity('organize-pdf', 'Organize PDF', file.name, 'completed');
    } catch (err: unknown) {
      console.error(err);
      if (processingVersionRef.current === targetVersion) {
        updateJob(jobId, {
          status: 'failed',
          errorMessage: 'Organizing failed: ' + String(err),
        });
        addRecentActivity('organize-pdf', 'Organize PDF', file.name, 'failed');
      }
    } finally {
      if (processingVersionRef.current === targetVersion) {
        setProcessing(false);
      }
    }
  };

  // Auto re-process when pages configuration changes
  useEffect(() => {
    if (!file || pages.length === 0) return;

    setResultBlob(null);
    setResultSize(null);
    setProcessing(true);

    processingVersionRef.current += 1;
    const currentVersion = processingVersionRef.current;

    const timer = setTimeout(() => {
      handleExportWithVersion(currentVersion);
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [file, pages]);

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace(/\.[^/.]+$/, '')}-organized.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExtractSelectedAsPdf = async () => {
    if (!file || selectedIndices.length === 0) return;
    try {
      const buffer = await file.arrayBuffer();
      const selectedPlan: PagePlanItem[] = selectedIndices.map((idx) => ({
        originalIndex: pages[idx].originalIndex,
        rotation: pages[idx].rotation,
        isBlank: pages[idx].isBlank,
      }));

      const extractedBytes = await organizeAndModifyPdf(buffer, { pagePlan: selectedPlan });
      const blob = new Blob([new Uint8Array(extractedBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.[^/.]+$/, '')}-extracted-${selectedIndices.length}pages.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Extract error:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Visual Page Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Organize & Reorder PDF
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Reorder, duplicate, delete, rotate, reverse page sequences, insert blank sheets, or extract selected pages. Live visual preview with exact PDF geometry fidelity.
          </p>
        </div>

        {file && (
          <button
            onClick={() => {
              setFile(null);
              setPages([]);
              setThumbnails([]);
              setResultBlob(null);
            }}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Change File
          </button>
        )}
      </div>

      {!file ? (
        <FileUploader
          acceptedFormats={['.pdf']}
          maxFiles={1}
          onFilesSelected={handleFilesSelected}
          title="Drop your PDF here to organize pages"
          description="Visual page organizer, rotation, deletion, and extraction"
        />
      ) : (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
                Selection ({selectedIndices.length}/{pages.length}):
              </span>

              {selectedIndices.length === pages.length ? (
                <button
                  onClick={deselectAll}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Deselect All</span>
                </button>
              ) : (
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Select All</span>
                </button>
              )}

              {selectedIndices.length > 0 && (
                <>
                  <button
                    onClick={() => rotateSelected(90)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate Selected (+90°)</span>
                  </button>

                  <button
                    onClick={deleteSelected}
                    disabled={pages.length - selectedIndices.length < 1}
                    className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/60 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedIndices.length})</span>
                  </button>

                  <button
                    onClick={handleExtractSelectedAsPdf}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Extract to New PDF</span>
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={reverseOrder}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Reverse Order</span>
              </button>
            </div>
          </div>

          {/* Grid of Pages */}
          {loadingThumbnails ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Generating high-fidelity page previews...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {pages.map((p, idx) => {
                const thumb = p.isBlank ? null : thumbnails[p.originalIndex];
                const isSelected = selectedIndices.includes(idx);

                return (
                  <div
                    key={p.id}
                    onClick={() => toggleSelect(idx)}
                    className={`relative group bg-white dark:bg-slate-900 rounded-xl border-2 transition-all p-3 flex flex-col items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 shadow-md shadow-indigo-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Header Tag */}
                    <div className="w-full flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Page {idx + 1}
                      </span>
                      {p.rotation !== 0 && (
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          {p.rotation}°
                        </span>
                      )}
                    </div>

                    {/* Thumbnail Display */}
                    <div className="w-full aspect-[1/1.4] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner">
                      {p.isBlank ? (
                        <div className="text-center p-2 text-slate-400">
                          <FilePlus className="w-8 h-8 mx-auto opacity-40 mb-1" />
                          <span className="text-[10px] font-bold uppercase">Blank Sheet</span>
                        </div>
                      ) : thumb ? (
                        <img
                          src={thumb}
                          alt={`Page ${idx + 1}`}
                          style={{ transform: `rotate(${p.rotation}deg)` }}
                          className="w-full h-full object-contain transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      )}

                      {/* Selection Checkmark */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Quick Page Action Toolbar */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="w-full grid grid-cols-4 gap-1 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80"
                    >
                      <button
                        title="Move Left / Earlier"
                        disabled={idx === 0}
                        onClick={() => movePage(idx, idx - 1)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-20 flex items-center justify-center"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>

                      <button
                        title="Rotate 90°"
                        onClick={() => rotatePage(idx, 90)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        title="Duplicate Page"
                        onClick={() => duplicatePage(idx)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        title="Delete Page"
                        disabled={pages.length <= 1}
                        onClick={() => deletePage(idx)}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 disabled:opacity-20 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Extended actions */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="w-full flex items-center justify-between gap-1 mt-1 text-[9px] text-slate-400"
                    >
                      <button
                        onClick={() => moveToFirst(idx)}
                        disabled={idx === 0}
                        className="hover:text-indigo-500 disabled:opacity-20"
                      >
                        First
                      </button>
                      <button
                        onClick={() => insertBlankPageAfter(idx)}
                        className="hover:text-indigo-500"
                        title="Insert blank page after this"
                      >
                        +Blank
                      </button>
                      <button
                        onClick={() => moveToLast(idx)}
                        disabled={idx === pages.length - 1}
                        className="hover:text-indigo-500 disabled:opacity-20"
                      >
                        Last
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Download & Completion Footer */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-500" />
                <span>Ready to Download Organized PDF</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Total Pages: {pages.length} {resultSize ? `• ${(resultSize / 1024).toFixed(1)} KB` : ''}
              </p>
            </div>

            <button
              onClick={handleDownload}
              disabled={processing || !resultBlob}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {processing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download Organized PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
