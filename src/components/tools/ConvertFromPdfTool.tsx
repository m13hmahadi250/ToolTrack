import React, { useState } from 'react';
import {
  FileImage,
  FileText,
  FileSpreadsheet,
  AlignJustify,
  Download,
  Archive,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import JSZip from 'jszip';
import { FileUploader } from '../common/FileUploader';
import { loadPdfDocument, renderPageToCanvas, extractTextFromPdf } from '../../lib/pdfRenderer';
import { pdfToDocx, pdfToExcel } from '../../lib/docUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

export const ConvertFromPdfTool: React.FC = () => {
  const { activeToolId, addJob, updateJob, addRecentActivity } = useToolTrack();

  const [activeTab, setActiveTab] = useState<'images' | 'word' | 'excel' | 'text'>('images');
  const [file, setFile] = useState<File | null>(null);

  // Sync activeTab when opened directly from header or mega menu
  React.useEffect(() => {
    if (activeToolId === 'pdf-to-images') setActiveTab('images');
    else if (activeToolId === 'pdf-to-excel') setActiveTab('excel');
    else if (activeToolId === 'pdf-to-text') setActiveTab('text');
  }, [activeToolId]);

  // Image options
  const [imgFormat, setImgFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [renderScale, setRenderScale] = useState(1.5); // 1.5x gives crisp high-res images

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');
  const [isZip, setIsZip] = useState(false);
  const [excelPreviewRows, setExcelPreviewRows] = useState<string[][]>([]);

  const processingVersionRef = React.useRef(0);
  const hasConvertedOnceRef = React.useRef(false);

  const handleFilesSelected = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setResultBlob(null);
    setExcelPreviewRows([]);
    hasConvertedOnceRef.current = false;
  };

  const handleConvertWithVersion = async (targetVersion: number) => {
    if (!file) return;
    if (processingVersionRef.current !== targetVersion) return;

    setProcessing(true);
    setProgress(0.1);
    setExcelPreviewRows([]);

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const jobId = addJob({
      fileName: file.name,
      fileSize: file.size,
      toolId: 'convert-from-pdf',
      toolName: `PDF to ${activeTab.toUpperCase()}`,
      status: 'processing',
      progress: 0.1,
    });

    try {
      const buffer = await file.arrayBuffer();
      if (processingVersionRef.current !== targetVersion) return;

      if (activeTab === 'images') {
        const pdf = await loadPdfDocument(buffer);
        if (processingVersionRef.current !== targetVersion) return;

        const count = pdf.numPages;
        const zip = new JSZip();

        for (let p = 1; p <= count; p++) {
          if (processingVersionRef.current !== targetVersion) return;

          setProgress(0.1 + (p / count) * 0.8);
          updateJob(jobId, { progress: 0.1 + (p / count) * 0.8 });

          const canvas = document.createElement('canvas');
          await renderPageToCanvas(pdf, p, canvas, Math.round(1200 * (renderScale / 1.5)));

          const mime = `image/${imgFormat}`;
          const ext = imgFormat === 'jpeg' ? 'jpg' : imgFormat;
          const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), mime, 0.9));
          zip.file(`page-${p}.${ext}`, blob);
        }

        if (processingVersionRef.current !== targetVersion) return;

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const outName = `${baseName}-images.zip`;
        setResultBlob(zipBlob);
        setResultFileName(outName);
        setIsZip(true);

        updateJob(jobId, {
          status: 'completed',
          progress: 1.0,
          outputBlob: zipBlob,
          outputFileName: outName,
          outputSize: zipBlob.size,
        });
      } else if (activeTab === 'word') {
        setProgress(0.5);
        const { blob: docxBlob } = await pdfToDocx(buffer, {
          mode: 'layout-preserved',
          preserveBoxes: true,
          preserveFonts: true,
          reconstructTables: true,
        });
        if (processingVersionRef.current !== targetVersion) return;

        const outName = `${baseName}.docx`;
        setResultBlob(docxBlob);
        setResultFileName(outName);
        setIsZip(false);

        updateJob(jobId, {
          status: 'completed',
          progress: 1.0,
          outputBlob: docxBlob,
          outputFileName: outName,
          outputSize: docxBlob.size,
        });
      } else if (activeTab === 'excel') {
        setProgress(0.5);
        const excelRes = await pdfToExcel(buffer);
        if (processingVersionRef.current !== targetVersion) return;

        const outName = `${baseName}.xlsx`;
        setResultBlob(excelRes.blob);
        setResultFileName(outName);
        setIsZip(false);
        setExcelPreviewRows(excelRes.previewRows || []);

        updateJob(jobId, {
          status: 'completed',
          progress: 1.0,
          outputBlob: excelRes.blob,
          outputFileName: outName,
          outputSize: excelRes.blob.size,
        });
      } else {
        // text
        setProgress(0.5);
        const { text } = await extractTextFromPdf(buffer);
        if (processingVersionRef.current !== targetVersion) return;

        const txtBlob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const outName = `${baseName}.txt`;
        setResultBlob(txtBlob);
        setResultFileName(outName);
        setIsZip(false);

        updateJob(jobId, {
          status: 'completed',
          progress: 1.0,
          outputBlob: txtBlob,
          outputFileName: outName,
          outputSize: txtBlob.size,
        });
      }

      addRecentActivity('convert-from-pdf', `PDF to ${activeTab.toUpperCase()}`, file.name, 'completed');
    } catch (err: unknown) {
      console.error(err);
      if (processingVersionRef.current === targetVersion) {
        updateJob(jobId, {
          status: 'failed',
          errorMessage: 'Conversion failed: ' + String(err),
        });
        addRecentActivity('convert-from-pdf', `PDF to ${activeTab.toUpperCase()}`, file.name, 'failed');
      }
    } finally {
      if (processingVersionRef.current === targetVersion) {
        setProcessing(false);
      }
    }
  };

  const handleConvert = () => {
    hasConvertedOnceRef.current = true;
    processingVersionRef.current += 1;
    handleConvertWithVersion(processingVersionRef.current);
  };

  // AUTOMATIC REPROCESSING ON SETTINGS CHANGE (FROM ORIGINAL PDF)
  React.useEffect(() => {
    if (!file || !hasConvertedOnceRef.current) return;

    // Invalidate stale result immediately
    setResultBlob(null);
    setProcessing(true);

    processingVersionRef.current += 1;
    const currentVersion = processingVersionRef.current;

    const timer = setTimeout(() => {
      handleConvertWithVersion(currentVersion);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [file, activeTab, imgFormat, renderScale]);

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFileName || 'converted-file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Convert from PDF
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Extract high-resolution images, editable Word documents (.docx), Excel spreadsheets, or plain text from your PDF.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-4">
        {[
          { id: 'images', label: 'PDF to JPG / PNG', icon: FileImage },
          { id: 'word', label: 'PDF to Word (.docx)', icon: FileText },
          { id: 'excel', label: 'PDF to Excel (.xlsx)', icon: FileSpreadsheet },
          { id: 'text', label: 'PDF to Plain Text', icon: AlignJustify },
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
          title="Select PDF file to extract"
          description={`Convert to ${activeTab.toUpperCase()}`}
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

            {/* Image conversion settings */}
            {activeTab === 'images' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Output Image Format
                  </label>
                  <select
                    value={imgFormat}
                    onChange={(e) => setImgFormat(e.target.value as typeof imgFormat)}
                    className="mt-1 w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="jpeg">JPG (Standard Image)</option>
                    <option value="png">PNG (Lossless Quality)</option>
                    <option value="webp">WEBP (Modern Web Format)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Resolution / Quality
                  </label>
                  <select
                    value={renderScale}
                    onChange={(e) => setRenderScale(Number(e.target.value))}
                    className="mt-1 w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value={1}>Standard Screen (72 - 96 DPI)</option>
                    <option value={1.5}>High Resolution (150 DPI)</option>
                    <option value={2}>Ultra Print Crisp (300 DPI)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Extracted Excel Table Preview */}
          {resultBlob && activeTab === 'excel' && excelPreviewRows.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Spreadsheet Extraction Preview (First {excelPreviewRows.length} Rows)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Rows detected & formatted
                </span>
              </div>

              <div className="max-h-72 overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 text-xs font-mono">
                <table className="w-full border-collapse">
                  <tbody>
                    {excelPreviewRows.map((row, rIdx) => {
                      const isHeader = rIdx === 0 || row[0]?.startsWith('[');
                      return (
                        <tr
                          key={rIdx}
                          className={
                            isHeader
                              ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                              : rIdx % 2 === 0
                              ? 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                              : 'bg-slate-50/80 dark:bg-slate-850 text-slate-700 dark:text-slate-300'
                          }
                        >
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className="px-3 py-2 border border-slate-200 dark:border-slate-800 whitespace-nowrap"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
                    Extraction Complete!
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
                {isZip ? <Archive className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                <span>Download {isZip ? 'Images (ZIP)' : 'Result'}</span>
              </button>
            </div>
          )}

          {/* Action button */}
          {!resultBlob && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Ready to Extract
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  100% Client-side conversion.
                </p>
              </div>

              <button
                onClick={handleConvert}
                disabled={processing}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing ({Math.round(progress * 100)}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Convert Now</span>
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
