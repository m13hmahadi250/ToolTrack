import React, { useState } from 'react';
import { ScanText, Download, CheckCircle2, Globe, FileText, AlertCircle } from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { performOcr, OCR_LANGUAGES, type OcrLanguage } from '../../lib/ocrUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

export const OcrPdfTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<OcrLanguage>('eng');

  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [confidence, setConfidence] = useState<number | undefined>(undefined);
  const [searchablePdfBlob, setSearchablePdfBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setExtractedText('');
    setSearchablePdfBlob(null);
    setErrorMessage(null);
  };

  const handleStartOcr = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0.1);
    setStatusMessage('Initializing OCR engine worker...');
    setErrorMessage(null);

    const jobId = addJob({
      fileName: file.name,
      fileSize: file.size,
      toolId: 'ocr-pdf',
      toolName: `OCR (${language})`,
      status: 'processing',
      progress: 0.1,
    });

    try {
      const result = await performOcr(file, language, (p) => {
        setStatusMessage(p.status);
        setProgress(p.progress);
        updateJob(jobId, { progress: p.progress });
      });

      setExtractedText(result.text);
      setConfidence(result.confidence);
      setSearchablePdfBlob(result.searchablePdfBlob || null);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: result.searchablePdfBlob,
        outputFileName: `${file.name.replace(/\.[^/.]+$/, '')}-ocr.pdf`,
        outputSize: result.searchablePdfBlob?.size,
      });

      addRecentActivity('ocr-pdf', `OCR (${language.toUpperCase()})`, file.name, 'completed');
    } catch (err: unknown) {
      console.error(err);
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const msg = isOffline
        ? `OCR language model (${language.toUpperCase()}) is not yet cached offline. Please connect to the internet once to load the language pack into your browser.`
        : 'OCR recognition failed: ' + String(err);
      setErrorMessage(msg);
      updateJob(jobId, {
        status: 'failed',
        errorMessage: msg,
      });
      addRecentActivity('ocr-pdf', `OCR (${language.toUpperCase()})`, file.name, 'failed');
    } finally {
      setProcessing(false);
    }
  };

  const downloadText = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.replace(/\.[^/.]+$/, '')}-ocr.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    if (!searchablePdfBlob) return;
    const url = URL.createObjectURL(searchablePdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.replace(/\.[^/.]+$/, '')}-searchable.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Optical Character Recognition (OCR)
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Recognize scanned documents and raster images into searchable text. Native Tesseract WebAssembly engine supporting English, Bengali, and Arabic.
        </p>
      </div>

      {!file ? (
        <FileUploader
          acceptedFormats={['.pdf', '.jpg', '.jpeg', '.png', '.webp']}
          multiple={false}
          onFilesSelected={handleFilesSelected}
          title="Select scanned PDF or image for OCR"
          description="High-precision OCR processed in your browser"
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
                  setExtractedText('');
                  setSearchablePdfBlob(null);
                }}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Change File
              </button>
            </div>

            {/* Language Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>Document Language</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {OCR_LANGUAGES.map((langItem) => (
                  <button
                    key={langItem.id}
                    onClick={() => setLanguage(langItem.id)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      language === langItem.id
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold">{langItem.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{langItem.nativeName}</div>
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Progress Banner */}
          {processing && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>{statusMessage || 'Recognizing text...'}</span>
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

          {/* Extracted Text Result Box */}
          {extractedText && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    OCR Recognition Successful
                  </span>
                  {confidence !== undefined && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      {confidence}% Confidence
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadText}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download .TXT</span>
                  </button>

                  {searchablePdfBlob && (
                    <button
                      onClick={downloadPdf}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Searchable PDF</span>
                    </button>
                  )}
                </div>
              </div>

              <textarea
                readOnly
                rows={10}
                value={extractedText}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono leading-relaxed"
              ></textarea>
            </div>
          )}

          {/* Action button */}
          {!extractedText && !processing && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Ready to run OCR
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Language model: {language.toUpperCase()}
                </p>
              </div>

              <button
                onClick={handleStartOcr}
                disabled={processing}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                <ScanText className="w-4 h-4" />
                <span>Start Text Recognition</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
