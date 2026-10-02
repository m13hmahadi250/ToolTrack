import React, { useState, useEffect } from 'react';
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
  FileCheck
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { loadPdfDocument, renderPageToImageDataUrl } from '../../lib/pdfRenderer';
import { organizeAndModifyPdf } from '../../lib/pdfUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

interface PageItem {
  originalIndex: number;
  rotation: number;
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

  // Escape key handler to deselect or exit page organizing
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
        originalIndex: i,
        rotation: 0,
      }));
      setPages(pageList);

      const thumbs: string[] = [];
      for (let i = 1; i <= count; i++) {
        const thumb = await renderPageToImageDataUrl(pdf, i, 200);
        thumbs.push(thumb);
      }
      setThumbnails(thumbs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingThumbnails(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const rotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
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

  const deletePage = (index: number) => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndices((prev) => prev.filter((i) => i !== index));
  };

  const duplicatePage = (index: number) => {
    setPages((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, { ...copy[index] });
      return copy;
    });
  };

  const deleteSelected = () => {
    if (selectedIndices.length === 0 || pages.length - selectedIndices.length < 1) return;
    setPages((prev) => prev.filter((_, i) => !selectedIndices.includes(i)));
    setSelectedIndices([]);
  };

  const rotateSelected = () => {
    setPages((prev) =>
      prev.map((p, i) =>
        selectedIndices.includes(i) ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  const handleExport = async () => {
    if (!file || pages.length === 0) return;
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
      const pageOrder = pages.map((p) => p.originalIndex);
      const rotations: Record<number, number> = {};

      pages.forEach((p, idx) => {
        if (p.rotation !== 0) {
          rotations[p.originalIndex] = p.rotation;
        }
      });

      const modifiedBytes = await organizeAndModifyPdf(buffer, {
        pageOrder,
        rotations,
      });

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
      updateJob(jobId, {
        status: 'failed',
        errorMessage: 'Organizing failed: ' + String(err),
      });
      addRecentActivity('organize-pdf', 'Organize PDF', file.name, 'failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.replace(/\.[^/.]+$/, '')}-organized.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Organize & Reorder PDF Pages
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Visually arrange, rotate, duplicate, and delete pages before saving a brand new document.
        </p>
      </div>

      {!file ? (
        <FileUploader
          acceptedFormats={['.pdf']}
          multiple={false}
          onFilesSelected={handleFilesSelected}
          title="Upload PDF to arrange pages"
          description="Interactive visual page organizer"
        />
      ) : (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {pages.length} Pages
              </span>
              {selectedIndices.length > 0 && (
                <span className="text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-md">
                  {selectedIndices.length} Selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedIndices.length > 0 && (
                <>
                  <button
                    onClick={rotateSelected}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate Selected</span>
                  </button>

                  <button
                    onClick={deleteSelected}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected</span>
                  </button>
                </>
              )}

              <button
                onClick={() =>
                  setSelectedIndices(
                    selectedIndices.length === pages.length
                    ? []
                    : Array.from({ length: pages.length }, (_, i) => i)
                  )
                }
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {selectedIndices.length === pages.length ? 'Deselect All' : 'Select All'}
              </button>

              <button
                onClick={() => {
                  setFile(null);
                  setPages([]);
                  setThumbnails([]);
                  setResultBlob(null);
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Thumbnails Grid */}
          {loadingThumbnails ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Generating page thumbnails...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pages.map((p, idx) => {
                const thumb = thumbnails[p.originalIndex];
                const isSelected = selectedIndices.includes(idx);

                return (
                  <div
                    key={`${p.originalIndex}-${idx}`}
                    className={`relative rounded-xl border p-2 transition group flex flex-col items-center bg-white dark:bg-slate-850 ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                    }`}
                  >
                    {/* Page Index Badge */}
                    <div className="w-full flex items-center justify-between pb-1.5 px-1">
                      <span className="text-[11px] font-bold text-slate-500">#{idx + 1}</span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(idx)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                      />
                    </div>

                    {/* Thumbnail Image */}
                    <div
                      onClick={() => toggleSelect(idx)}
                      className="cursor-pointer overflow-hidden rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center h-44 w-full"
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={`Page ${idx + 1}`}
                          className="max-h-full max-w-full object-contain shadow-xs transition-transform duration-200"
                          style={{ transform: `rotate(${p.rotation}deg)` }}
                        />
                      ) : (
                        <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>

                    {/* Per-page Action Buttons */}
                    <div className="w-full flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => movePage(idx, idx - 1)}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                          title="Move Left"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => movePage(idx, idx + 1)}
                          disabled={idx === pages.length - 1}
                          className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                          title="Move Right"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => rotatePage(idx)}
                          className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => duplicatePage(idx)}
                          className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                          title="Duplicate Page"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deletePage(idx)}
                          disabled={pages.length <= 1}
                          className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-20 cursor-pointer"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Export Action Bar */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Export Reordered PDF
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Will create a clean PDF with the current sequence and rotations applied.
              </p>
            </div>

            {!resultBlob ? (
              <button
                onClick={handleExport}
                disabled={processing || pages.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Save & Download PDF</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Organized PDF</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
