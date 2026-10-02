import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Table,
  AlignLeft,
  Download,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { imagesToPdf } from '../../lib/imageUtils';
import { docxToPdf, excelToPdf, textToPdf } from '../../lib/docUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

export const ConvertToPdfTool: React.FC = () => {
  const { activeToolId, addJob, updateJob, addRecentActivity } = useToolTrack();

  const [activeTab, setActiveTab] = useState<'images' | 'word' | 'excel' | 'text'>('images');
  const [files, setFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState('');

  // Sync activeTab if user navigated directly to specific conversion tool
  React.useEffect(() => {
    if (activeToolId === 'word-to-pdf') setActiveTab('word');
    else if (activeToolId === 'excel-to-pdf') setActiveTab('excel');
    else if (activeToolId === 'text-to-pdf') setActiveTab('text');
    else if (activeToolId === 'images-to-pdf') setActiveTab('images');
  }, [activeToolId]);

  // Image options
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'FitImage'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'auto'>('auto');
  const [marginMm, setMarginMm] = useState(10);

  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');
  const [outputSize, setOutputSize] = useState<number | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(newFiles);
    setResultBlob(null);
  };

  const handleConvert = async () => {
    setProcessing(true);
    let outName = 'document.pdf';
    let inputSize = 0;

    if (activeTab === 'text') {
      outName = 'text-document.pdf';
      inputSize = new Blob([textInput]).size;
    } else if (files.length > 0) {
      const base = files[0].name.replace(/\.[^/.]+$/, '');
      outName = `${base}.pdf`;
      inputSize = files.reduce((acc, f) => acc + f.size, 0);
    }
    setResultFileName(outName);

    const jobId = addJob({
      fileName: files.length > 0 ? files[0].name : 'Text Document',
      fileSize: inputSize,
      toolId: 'convert-to-pdf',
      toolName: `Convert to PDF (${activeTab})`,
      status: 'processing',
      progress: 0.3,
      outputFileName: outName,
    });

    try {
      let pdfBytes: Uint8Array;

      if (activeTab === 'images') {
        pdfBytes = await imagesToPdf(files, { pageSize, orientation, marginMm });
      } else if (activeTab === 'word') {
        const buffer = await files[0].arrayBuffer();
        pdfBytes = await docxToPdf(buffer);
      } else if (activeTab === 'excel') {
        const buffer = await files[0].arrayBuffer();
        pdfBytes = await excelToPdf(buffer);
      } else {
        // text
        pdfBytes = await textToPdf(textInput, 'Text Document');
      }

      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      setResultBlob(blob);
      setOutputSize(blob.size);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: blob,
        outputSize: blob.size,
      });

      addRecentActivity('convert-to-pdf', 'Convert to PDF', outName, 'completed');
    } catch (err: unknown) {
      console.error(err);
      updateJob(jobId, {
        status: 'failed',
        errorMessage: 'Conversion failed: ' + String(err),
      });
      addRecentActivity('convert-to-pdf', 'Convert to PDF', outName, 'failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFileName || 'converted-document.pdf';
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
          Convert to PDF
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Transform images, Microsoft Word documents, Excel spreadsheets, or plain text into standard PDF documents.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 sm:space-x-4">
        {[
          { id: 'images', label: 'Images to PDF', icon: ImageIcon },
          { id: 'word', label: 'Word (.docx)', icon: FileText },
          { id: 'excel', label: 'Excel (.xlsx, .csv)', icon: Table },
          { id: 'text', label: 'Text / Notes', icon: AlignLeft },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as typeof activeTab);
                setFiles([]);
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

      {/* Main Upload / Input */}
      {activeTab === 'text' ? (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Type or paste your text content:
          </label>
          <textarea
            rows={10}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste raw text, articles, logs, or notes here to generate a formatted PDF..."
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>
      ) : files.length === 0 ? (
        <FileUploader
          acceptedFormats={
            activeTab === 'images'
              ? ['.jpg', '.jpeg', '.png', '.webp', '.bmp']
              : activeTab === 'word'
              ? ['.docx']
              : ['.xlsx', '.xls', '.csv']
          }
          multiple={activeTab === 'images'}
          maxFiles={activeTab === 'images' ? 50 : 1}
          onFilesSelected={handleFilesSelected}
          title={`Select ${activeTab.toUpperCase()} to convert to PDF`}
          description="Drag & drop or browse from your device"
        />
      ) : (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {files.length} File{files.length > 1 ? 's' : ''} Selected
                </span>
                <span className="text-xs text-slate-400 ml-2">
                  ({formatBytes(files.reduce((a, b) => a + b.size, 0))})
                </span>
              </div>
              <button
                onClick={() => {
                  setFiles([]);
                  setResultBlob(null);
                }}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Change Files
              </button>
            </div>

            {/* Images layout options */}
            {activeTab === 'images' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    PDF Page Size
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as typeof pageSize)}
                    className="mt-1 w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="A4">A4 (210 × 297 mm)</option>
                    <option value="Letter">US Letter</option>
                    <option value="FitImage">Fit Exact Image Dimensions</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Orientation
                  </label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as typeof orientation)}
                    className="mt-1 w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="auto">Auto (Match Image Ratio)</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Margins (mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={marginMm}
                    onChange={(e) => setMarginMm(Math.max(0, Number(e.target.value)))}
                    className="mt-1 w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Result Card */}
      {resultBlob && (
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-base text-slate-900 dark:text-white">
                Converted Successfully!
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Output PDF file: {formatBytes(outputSize || 0)}
            </p>
          </div>

          <button
            onClick={handleDownload}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Document</span>
          </button>
        </div>
      )}

      {/* Action button */}
      {!resultBlob && (files.length > 0 || (activeTab === 'text' && textInput.trim().length > 0)) && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white">
              Ready to generate PDF
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">High-fidelity vector formatting.</p>
          </div>

          <button
            onClick={handleConvert}
            disabled={processing}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Converting...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Convert to PDF</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
