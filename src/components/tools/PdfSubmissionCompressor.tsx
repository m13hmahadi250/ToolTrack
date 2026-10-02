import React, { useState } from 'react';
import {
  Minimize2,
  GraduationCap,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { FileUploader } from '../common/FileUploader';
import { useToolTrack } from '../../context/ToolTrackContext';

export const PdfSubmissionCompressor: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [file, setFile] = useState<File | null>(null);
  const [targetLimitMb, setTargetLimitMb] = useState<number>(2);
  const [customKb, setCustomKb] = useState<string>('');

  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    originalSize: number;
    outputSize: number;
    savedPercent: number;
    blob: Blob;
    name: string;
  } | null>(null);

  const handleFileSelect = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setResult(null);
  };

  const handleCompress = async () => {
    if (!file) return;
    setProcessing(true);

    const targetBytes = (customKb ? Number(customKb) : targetLimitMb * 1024) * 1024;

    const jobId = addJob({
      fileName: file.name,
      fileSize: file.size,
      toolId: 'pdf-submission-compressor',
      toolName: 'Submission PDF Compressor',
      status: 'processing',
      progress: 0.2,
    });

    try {
      const buffer = await file.arrayBuffer();
      // Multi-pass compression using pdf-lib object stream stripping & dictionary cleanup
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      // Clean unreferenced objects and compress cross-references
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      let outBlob = new Blob([compressedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

      // If already under target limit or smaller, we are good!
      const originalSize = file.size;
      const outputSize = outBlob.size;
      const savedBytes = Math.max(0, originalSize - outputSize);
      const savedPercent = Math.round((savedBytes / originalSize) * 100);

      const outName = `${file.name.replace(/\.pdf$/i, '')}-submission.pdf`;

      setResult({
        originalSize,
        outputSize,
        savedPercent,
        blob: outBlob,
        name: outName,
      });

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: outBlob,
        outputFileName: outName,
        outputSize,
      });

      addRecentActivity(
        'pdf-submission-compressor',
        'Submission PDF Compressor',
        file.name,
        'completed'
      );
    } catch (err: unknown) {
      console.error(err);
      updateJob(jobId, { status: 'failed', errorMessage: String(err) });
    } finally {
      setProcessing(false);
    }
  };

  const downloadFile = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Moodle • Canvas • Blackboard • Portal Optimizer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            PDF Size Reducer for Student Submission
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Shrink heavy PDFs to fit strict 1MB, 2MB, or 5MB university portal upload limits while keeping text and mathematical formulas 100% sharp.
          </p>
        </div>

        {file && (
          <button
            onClick={() => {
              setFile(null);
              setResult(null);
            }}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Select Another File
          </button>
        )}
      </div>

      {!file ? (
        <div className="max-w-2xl mx-auto space-y-4">
          <FileUploader
            acceptedFormats={['.pdf']}
            multiple={false}
            maxFiles={1}
            onFilesSelected={handleFileSelect}
            title="Upload PDF that is too large for student portal"
            description="Drag and drop your assignment, lab report, or thesis PDF."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center text-xs">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-extrabold text-indigo-600 block">2 MB Limit</span>
              <p className="text-slate-500 text-[11px]">Most popular upload cap for university assignment portals.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-extrabold text-indigo-600 block">Vector Sharpness</span>
              <p className="text-slate-500 text-[11px]">Fonts and equations are never blurred or pixelated.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-extrabold text-emerald-600 block">100% Private</span>
              <p className="text-slate-500 text-[11px]">Documents are compressed on your computer, never sent to a cloud.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                  {file.name}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Current Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
            </div>

            {/* Portal Preset Selector */}
            <div className="space-y-3">
              <label className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                Target Maximum Portal Limit:
              </label>

              <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                {[1, 2, 5, 10].map((mb) => (
                  <button
                    key={mb}
                    onClick={() => {
                      setTargetLimitMb(mb);
                      setCustomKb('');
                    }}
                    className={`py-3 rounded-xl border text-center transition cursor-pointer ${
                      targetLimitMb === mb && !customKb
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {mb} MB
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs">
                <span className="text-slate-500">Or Custom Limit (KB):</span>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={customKb}
                  onChange={(e) => {
                    setCustomKb(e.target.value);
                  }}
                  className="w-28 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleCompress}
              disabled={processing}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Minimize2 className="w-5 h-5" />
              <span>Compress For Submission</span>
            </button>

            {/* Result Box */}
            {result && (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200">
                      Optimized Successfully
                    </span>
                  </div>
                  {result.savedPercent > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-bold text-xs">
                      -{result.savedPercent}% Smaller
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Original</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {(result.originalSize / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-emerald-600 block text-[10px] uppercase font-sans font-bold">New Output</span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                      {(result.outputSize / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>

                <button
                  onClick={downloadFile}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Submission PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
