import React, { useState } from 'react';
import { Minimize2, Download, CheckCircle2, RotateCcw, Sliders, ShieldCheck } from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { compressPdf, flattenPdf } from '../../lib/pdfUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

export const CompressPdfTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<'maximum' | 'balanced' | 'high'>('balanced');
  const [alsoFlatten, setAlsoFlatten] = useState(true);

  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');
  const [outputSize, setOutputSize] = useState<number | null>(null);

  const handleFilesSelected = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setResultBlob(null);
  };

  const handleCompress = async () => {
    if (!file) return;
    setProcessing(true);

    const outName = `${file.name.replace(/\.[^/.]+$/, '')}-compressed.pdf`;
    setResultFileName(outName);

    const jobId = addJob({
      fileName: file.name,
      fileSize: file.size,
      toolId: 'compress-pdf',
      toolName: 'Compress PDF',
      status: 'processing',
      progress: 0.2,
      outputFileName: outName,
    });

    try {
      let buffer = await file.arrayBuffer();
      updateJob(jobId, { progress: 0.4 });

      if (alsoFlatten) {
        const flatBytes = await flattenPdf(buffer);
        buffer = flatBytes.buffer as ArrayBuffer;
      }

      updateJob(jobId, { progress: 0.7 });
      const compressedBytes = await compressPdf(buffer, level);
      const blob = new Blob([new Uint8Array(compressedBytes)], { type: 'application/pdf' });

      setResultBlob(blob);
      setOutputSize(blob.size);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: blob,
        outputSize: blob.size,
      });

      addRecentActivity('compress-pdf', 'Compress PDF', file.name, 'completed');
    } catch (err: unknown) {
      console.error(err);
      updateJob(jobId, {
        status: 'failed',
        errorMessage: 'Compression failed: ' + String(err),
      });
      addRecentActivity('compress-pdf', 'Compress PDF', file.name, 'failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFileName || 'compressed-document.pdf';
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

  const calculateSavedPercent = () => {
    if (!file || !outputSize) return 0;
    const saved = file.size - outputSize;
    if (saved <= 0) return 0;
    return Math.round((saved / file.size) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Compress PDF Document
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Optimize internal stream structures and strip unused cross-reference tables while preserving text and vector clarity.
        </p>
      </div>

      {!file ? (
        <FileUploader
          acceptedFormats={['.pdf']}
          multiple={false}
          onFilesSelected={handleFilesSelected}
          title="Select PDF file to compress"
          description="Choose compression level to reduce size"
        />
      ) : (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-sm">
                  {file.name}
                </span>
                <span className="text-xs text-slate-400 ml-2">
                  Original Size: {formatBytes(file.size)}
                </span>
              </div>
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

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Compression Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'maximum',
                    label: 'Maximum Compression',
                    desc: 'Smallest file size, strips all non-essential metadata',
                  },
                  {
                    id: 'balanced',
                    label: 'Balanced Optimization',
                    desc: 'Recommended: Great size reduction with intact formatting',
                  },
                  {
                    id: 'high',
                    label: 'High Quality',
                    desc: 'Mild compression, keeps all embedded metadata',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLevel(item.id as typeof level)}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      level === item.id
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Flatten Form Fields */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alsoFlatten}
                  onChange={(e) => setAlsoFlatten(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Flatten interactive form fields and annotations into static graphics
                </span>
              </label>
            </div>
          </div>

          {/* Results Card */}
          {resultBlob && (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-base text-slate-900 dark:text-white">
                    Compression Complete!
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {formatBytes(file.size)} →{' '}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatBytes(outputSize || 0)}
                  </span>
                  {calculateSavedPercent() > 0 && (
                    <span className="ml-2 font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[11px]">
                      Saved {calculateSavedPercent()}%
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={handleDownload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Compressed PDF</span>
              </button>
            </div>
          )}

          {/* Action Bar */}
          {!resultBlob && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Ready to optimize
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  100% processed in browser memory.
                </p>
              </div>

              <button
                onClick={handleCompress}
                disabled={processing}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Optimizing...</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    <span>Compress PDF</span>
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
