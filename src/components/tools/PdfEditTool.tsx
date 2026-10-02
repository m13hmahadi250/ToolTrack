import React, { useState } from 'react';
import {
  Edit3,
  Bookmark,
  FileDigit,
  ShieldAlert,
  Download,
  CheckCircle2,
  PenTool
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { addWatermark, addPageNumbers, redactPdfRectangles } from '../../lib/pdfUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

export const PdfEditTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [activeTab, setActiveTab] = useState<'watermark' | 'page-numbers' | 'redact'>('watermark');
  const [file, setFile] = useState<File | null>(null);

  // Watermark options
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [watermarkFontSize, setWatermarkFontSize] = useState(48);

  // Page Numbers options
  const [pageNumberFormat, setPageNumberFormat] = useState<'page_x' | 'page_x_of_y' | 'x'>('page_x_of_y');
  const [pageNumberPos, setPageNumberPos] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');

  // Redact options
  const [redactPage, setRedactPage] = useState(1);

  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');

  const handleFilesSelected = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setResultBlob(null);
  };

  const handleApply = async () => {
    if (!file) return;
    setProcessing(true);

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const outName = `${baseName}-${activeTab}.pdf`;
    setResultFileName(outName);

    const jobId = addJob({
      fileName: file.name,
      fileSize: file.size,
      toolId: 'pdf-edit',
      toolName: `PDF Edit (${activeTab})`,
      status: 'processing',
      progress: 0.3,
      outputFileName: outName,
    });

    try {
      const buffer = await file.arrayBuffer();
      let modifiedBytes: Uint8Array;

      if (activeTab === 'watermark') {
        modifiedBytes = await addWatermark(
          buffer,
          watermarkText,
          watermarkOpacity,
          watermarkFontSize
        );
      } else if (activeTab === 'page-numbers') {
        modifiedBytes = await addPageNumbers(buffer, pageNumberFormat, pageNumberPos);
      } else {
        // Redact box (blackout sample rectangle on chosen page)
        modifiedBytes = await redactPdfRectangles(buffer, [
          { pageIndex: Math.max(0, redactPage - 1), x: 50, y: 700, width: 250, height: 25 },
        ]);
      }

      const blob = new Blob([new Uint8Array(modifiedBytes)], { type: 'application/pdf' });
      setResultBlob(blob);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: blob,
        outputSize: blob.size,
      });

      addRecentActivity('pdf-edit', `PDF Edit (${activeTab})`, file.name, 'completed');
    } catch (err: unknown) {
      console.error(err);
      updateJob(jobId, {
        status: 'failed',
        errorMessage: 'Editing failed: ' + String(err),
      });
      addRecentActivity('pdf-edit', `PDF Edit (${activeTab})`, file.name, 'failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFileName || 'edited-document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          PDF Edit & Annotation
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Stamp diagonal text watermarks, insert dynamic page numbers, and apply blackout redaction boxes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-4">
        {[
          { id: 'watermark', label: 'Add Watermark', icon: Bookmark },
          { id: 'page-numbers', label: 'Add Page Numbers', icon: FileDigit },
          { id: 'redact', label: 'Permanent Redaction', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as typeof activeTab);
                setResultBlob(null);
              }}
              className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 font-bold text-xs sm:text-sm transition cursor-pointer ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {!file ? (
        <FileUploader
          acceptedFormats={['.pdf']}
          multiple={false}
          onFilesSelected={handleFilesSelected}
          title="Select PDF file to edit"
          description={`Configure ${activeTab.replace('-', ' ')}`}
        />
      ) : (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-md">
                {file.name}
              </span>
              <button
                onClick={() => {
                  setFile(null);
                  setResultBlob(null);
                }}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Change File
              </button>
            </div>

            {/* Watermark controls */}
            {activeTab === 'watermark' && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Watermark Text
                  </label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="mt-1 w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      <span>Opacity: {Math.round(watermarkOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.8"
                      step="0.05"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      <span>Font Size: {watermarkFontSize} pt</span>
                    </div>
                    <input
                      type="range"
                      min="24"
                      max="80"
                      step="2"
                      value={watermarkFontSize}
                      onChange={(e) => setWatermarkFontSize(parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Page numbers controls */}
            {activeTab === 'page-numbers' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Number Format
                  </label>
                  <select
                    value={pageNumberFormat}
                    onChange={(e) => setPageNumberFormat(e.target.value as typeof pageNumberFormat)}
                    className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="page_x_of_y">Page X of Y</option>
                    <option value="page_x">Page X</option>
                    <option value="x">X (Number only)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Position
                  </label>
                  <select
                    value={pageNumberPos}
                    onChange={(e) => setPageNumberPos(e.target.value as typeof pageNumberPos)}
                    className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="top-right">Top Right</option>
                  </select>
                </div>
              </div>
            )}

            {/* Redaction controls */}
            {activeTab === 'redact' && (
              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-bold">Permanent Redaction Notice</p>
                  <p className="mt-1">
                    Redaction stamps an opaque black box onto the PDF layer, permanently blocking sensitive information from view.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Page to apply header blackout box:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={redactPage}
                    onChange={(e) => setRedactPage(Math.max(1, Number(e.target.value)))}
                    className="mt-1 w-32 p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Result Card */}
          {resultBlob && (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-base text-slate-900 dark:text-white">
                    Modifications Applied!
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to download: {resultFileName}
                </p>
              </div>

              <button
                onClick={handleDownload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Edited PDF</span>
              </button>
            </div>
          )}

          {/* Action button */}
          {!resultBlob && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Ready to apply
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Vector precision rendering.</p>
              </div>

              <button
                onClick={handleApply}
                disabled={processing}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    <span>Apply Modifications</span>
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
