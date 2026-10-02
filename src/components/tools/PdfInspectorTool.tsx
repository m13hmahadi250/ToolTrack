import React, { useState } from 'react';
import { Info, Layers, ShieldCheck, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { getPdfPagesInfo } from '../../lib/pdfRenderer';
import { getPdfMetadata } from '../../lib/pdfUtils';
import type { DetectedPageInfo } from '../../types';

export const PdfInspectorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [pagesInfo, setPagesInfo] = useState<DetectedPageInfo[]>([]);
  const [metadata, setMetadata] = useState<Record<string, string> | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setAnalyzing(true);

    try {
      const buffer = await f.arrayBuffer();
      const pInfo = await getPdfPagesInfo(buffer);
      setPagesInfo(pInfo);

      const mInfo = await getPdfMetadata(buffer);
      setMetadata(mInfo as unknown as Record<string, string>);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
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
          PDF Inspector
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Examine internal PDF structures, detailed page dimensions, orientation breakdowns, fonts, and embedded metadata.
        </p>
      </div>

      {!file ? (
        <FileUploader
          acceptedFormats={['.pdf']}
          multiple={false}
          onFilesSelected={handleFilesSelected}
          title="Select PDF document to inspect"
          description="Detailed structural breakdown & metadata inspection"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="font-bold text-base text-slate-900 dark:text-white">
              {file.name}
            </span>
            <button
              onClick={() => {
                setFile(null);
                setPagesInfo([]);
                setMetadata(null);
              }}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Change File
            </button>
          </div>

          {analyzing ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Inspecting PDF metadata and geometry...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Metadata */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>Document Information</span>
                </h3>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">File Size</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Total Pages</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {pagesInfo.length}
                    </span>
                  </div>
                  {metadata &&
                    Object.entries(metadata).map(([k, v]) => (
                      <div key={k} className="py-2 flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400 capitalize">{k}</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 truncate max-w-xs">
                          {String(v) || 'None'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Page Dimensions Breakdown */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Page Dimensions Matrix</span>
                </h3>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {pagesInfo.map((p) => (
                    <div key={p.pageNumber} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Page {p.pageNumber}
                        </span>
                        <span className="text-slate-400 ml-2">({p.orientation})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {p.widthMm} × {p.heightMm} mm
                        </span>
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          {p.detectedStandard}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
