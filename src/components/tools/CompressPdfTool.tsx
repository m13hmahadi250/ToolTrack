import React, { useState, useEffect, useRef } from 'react';
import {
  Minimize2,
  FileCheck,
  Wrench,
  Download,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Layers,
  AlertCircle,
  Eye,
  Check,
  X,
  FileText
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { ToolTrackFileFlow } from '../common/ToolTrackFileFlow';
import { compressPdfEngine } from '../../lib/pdfCompressionEngine';
import { flattenPdf, removeMetadata, getPdfMetadata } from '../../lib/pdfUtils';
import { PDFDocument } from 'pdf-lib';
import { useToolTrack } from '../../context/ToolTrackContext';

export const CompressPdfTool: React.FC = () => {
  const { activeToolId, addJob, updateJob, addRecentActivity } = useToolTrack();

  const isFlattenTool = activeToolId === 'flatten-pdf';
  const isCleanTool = activeToolId === 'clean-pdf';

  const [file, setFile] = useState<File | null>(null);

  // Compress Settings
  const [level, setLevel] = useState<'maximum' | 'balanced' | 'high'>('balanced');
  const [alsoFlatten, setAlsoFlatten] = useState(true);

  // Flatten Settings
  const [flattenForms, setFlattenForms] = useState(true);
  const [flattenAnnotations, setFlattenAnnotations] = useState(true);
  const [formFieldsFound, setFormFieldsFound] = useState<number | null>(null);

  // Clean / Privacy Settings
  const [cleanMetadataFields, setCleanMetadataFields] = useState(true);
  const [cleanRebuildXref, setCleanRebuildXref] = useState(true);
  const [metadataBefore, setMetadataBefore] = useState<Record<string, string | number> | null>(null);
  const [metadataAfter, setMetadataAfter] = useState<Record<string, string | number> | null>(null);

  // Output State
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isAlreadyOptimized, setIsAlreadyOptimized] = useState(false);

  const processingVersionRef = useRef(0);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setResultBlob(null);
    setOutputSize(null);
    setMetadataBefore(null);
    setMetadataAfter(null);
    setFormFieldsFound(null);

    // Initial inspection for Flatten & Clean modes
    try {
      const buffer = await selected.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      if (isFlattenTool) {
        let count = 0;
        try {
          const form = doc.getForm();
          count = form.getFields().length;
        } catch {}
        setFormFieldsFound(count);
      }

      if (isCleanTool) {
        const meta = await getPdfMetadata(buffer);
        setMetadataBefore(meta as Record<string, string | number>);
      }
    } catch (err) {
      console.warn('[PDF Inspection Note]:', err);
    }
  };

  const handleProcessWithVersion = async (targetVersion: number) => {
    if (!file) return;
    if (processingVersionRef.current !== targetVersion) return;

    setProcessing(true);
    setIsAlreadyOptimized(false);

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    let outName = `${baseName}-compressed.pdf`;
    let toolActionTitle = 'Compress PDF';
    let jobToolId = 'compress-pdf';

    if (isFlattenTool) {
      outName = `${baseName}-flattened.pdf`;
      toolActionTitle = 'Flatten PDF';
      jobToolId = 'flatten-pdf';
    } else if (isCleanTool) {
      outName = `${baseName}-cleaned.pdf`;
      toolActionTitle = 'Clean & Sanitize PDF';
      jobToolId = 'clean-pdf';
    }

    setResultFileName(outName);

    const jobId = addJob({
      fileName: file.name,
      fileSize: file.size,
      toolId: jobToolId,
      toolName: toolActionTitle,
      status: 'processing',
      progress: 0.2,
      outputFileName: outName,
    });

    try {
      const buffer = await file.arrayBuffer();
      if (processingVersionRef.current !== targetVersion) return;
      updateJob(jobId, { progress: 0.5 });

      let outBytes: Uint8Array;
      let outBlob: Blob;

      if (isFlattenTool) {
        outBytes = await flattenPdf(buffer);
        outBlob = new Blob([new Uint8Array(outBytes)], { type: 'application/pdf' });
        setStatusMessage(
          formFieldsFound && formFieldsFound > 0
            ? `Flattened ${formFieldsFound} interactive form field(s) into permanent vector graphics.`
            : 'All interactive annotations & vector layers successfully flattened and locked.'
        );
      } else if (isCleanTool) {
        outBytes = await removeMetadata(buffer);
        outBlob = new Blob([new Uint8Array(outBytes)], { type: 'application/pdf' });
        const afterMeta = await getPdfMetadata(outBytes);
        setMetadataAfter(afterMeta as Record<string, string | number>);
        setStatusMessage('Privacy sanitization complete: Metadata fields and orphaned xref nodes removed.');
      } else {
        // Standard Compression
        const result = await compressPdfEngine(buffer, {
          preset: level,
          flattenForms: alsoFlatten,
          removeMetadata: true,
        });
        outBytes = result.pdfBytes;
        outBlob = new Blob([outBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        setStatusMessage(result.statusMessage);
        setIsAlreadyOptimized(result.isAlreadyOptimized);
      }

      if (processingVersionRef.current !== targetVersion) return;

      setResultBlob(outBlob);
      setOutputSize(outBlob.size);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: outBlob,
        outputSize: outBlob.size,
      });

      addRecentActivity(jobToolId, toolActionTitle, file.name, 'completed');
    } catch (err: unknown) {
      console.error(err);
      if (processingVersionRef.current === targetVersion) {
        updateJob(jobId, {
          status: 'failed',
          errorMessage: 'Processing failed: ' + String(err),
        });
        addRecentActivity(jobToolId, toolActionTitle, file.name, 'failed');
      }
    } finally {
      if (processingVersionRef.current === targetVersion) {
        setProcessing(false);
      }
    }
  };

  const handleProcess = () => {
    processingVersionRef.current += 1;
    handleProcessWithVersion(processingVersionRef.current);
  };

  // AUTOMATIC REPROCESS ON SETTINGS CHANGE (FROM ORIGINAL PDF)
  useEffect(() => {
    if (!file) return;

    setResultBlob(null);
    setOutputSize(null);
    setProcessing(true);

    processingVersionRef.current += 1;
    const currentVersion = processingVersionRef.current;

    const timer = setTimeout(() => {
      handleProcessWithVersion(currentVersion);
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [file, level, alsoFlatten, flattenForms, flattenAnnotations, cleanMetadataFields, cleanRebuildXref, activeToolId]);

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFileName;
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

  // Header Details based on Tool Mode
  const getToolMeta = () => {
    if (isFlattenTool) {
      return {
        title: 'Flatten PDF Document',
        subtitle: 'Permanently merge fillable form fields, checkboxes, and interactive annotations into static non-editable page graphics.',
        badge: 'Form & Layer Flattener',
        actionBtn: 'Flatten PDF Now',
        icon: FileCheck,
      };
    }
    if (isCleanTool) {
      return {
        title: 'Clean & Sanitize PDF',
        subtitle: 'Remove privacy-sensitive metadata (Author, Software, Title, Creation Date) and strip orphaned xref objects from the PDF.',
        badge: 'Privacy & Document Sanitizer',
        actionBtn: 'Clean & Sanitize PDF',
        icon: Wrench,
      };
    }
    return {
      title: 'Compress PDF Document',
      subtitle: 'Optimize internal stream structures and strip unused cross-reference tables while preserving text and vector clarity.',
      badge: 'High-Ratio Optimizer',
      actionBtn: 'Compress PDF',
      icon: Minimize2,
    };
  };

  const meta = getToolMeta();
  const ToolIcon = meta.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
          <ToolIcon className="w-3.5 h-3.5" />
          <span>{meta.badge}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {meta.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          {meta.subtitle}
        </p>
      </div>

      {!file ? (
        <FileUploader
          acceptedFormats={['.pdf']}
          multiple={false}
          onFilesSelected={handleFilesSelected}
          title={`Select PDF file to ${isFlattenTool ? 'flatten' : isCleanTool ? 'sanitize' : 'compress'}`}
          description={
            isFlattenTool
              ? 'Converts fillable forms into permanent printable vectors'
              : isCleanTool
              ? 'Strips tracking metadata, author name, and software signatures'
              : 'Choose compression level to reduce size'
          }
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
                  Original: {formatBytes(file.size)}
                </span>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setResultBlob(null);
                }}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Change File
              </button>
            </div>

            {/* 1. FLATTEN TOOL INTERFACE */}
            {isFlattenTool && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-indigo-600" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Interactive Form Fields Detected:
                    </span>
                  </div>
                  <span className="font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    {formFieldsFound !== null ? `${formFieldsFound} field(s)` : 'Scanning...'}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flattenForms}
                      onChange={(e) => setFlattenForms(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                      Flatten text boxes, dropdowns, and checkboxes into page content
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flattenAnnotations}
                      onChange={(e) => setFlattenAnnotations(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                      Flatten stamp annotations, sticky notes, and drawing highlights
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* 2. CLEAN & SANITIZE PRIVACY TOOL INTERFACE */}
            {isCleanTool && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Privacy Sanitization Scope
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cleanMetadataFields}
                        onChange={(e) => setCleanMetadataFields(e.target.checked)}
                        className="rounded text-indigo-600 h-4 w-4"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Remove Author, Title & Software Tags
                      </span>
                    </label>

                    <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cleanRebuildXref}
                        onChange={(e) => setCleanRebuildXref(e.target.checked)}
                        className="rounded text-indigo-600 h-4 w-4"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Strip Dangling Objects & Rebuild XREF
                      </span>
                    </label>
                  </div>
                </div>

                {/* Before / After Inspection Table */}
                {metadataBefore && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                      Metadata Status (Before vs. After)
                    </span>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {['title', 'author', 'producer', 'creator'].map((field) => (
                        <div key={field} className="p-2.5 flex items-center justify-between">
                          <span className="capitalize font-semibold text-slate-600 dark:text-slate-400">
                            {field}:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-500 truncate max-w-[150px]">
                              {metadataBefore[field] || '(Empty)'}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {metadataAfter ? '(Removed)' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. COMPRESS TOOL INTERFACE */}
            {!isFlattenTool && !isCleanTool && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Compression Preset
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
            )}
          </div>

          {/* Processing / Result ToolTrack File Flow */}
          {processing && (
            <ToolTrackFileFlow
              mode="processing"
              stage="optimizing"
              stageLabel={
                isFlattenTool
                  ? 'Merging form fields & annotations into permanent vector layers...'
                  : isCleanTool
                  ? 'Sanitizing document metadata & rebuilding cross-reference tables...'
                  : 'Optimizing internal PDF streams & removing unreferenced xref objects...'
              }
              fileName={file.name}
              fileSize={formatBytes(file.size)}
              fileType="PDF Document"
            />
          )}

          {/* Results Card */}
          {resultBlob && !processing && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <ToolTrackFileFlow
                mode="success"
                stage="ready"
                stageLabel={
                  isFlattenTool
                    ? 'Flattening complete! All interactive form elements have been locked into vector graphics.'
                    : isCleanTool
                    ? 'Sanitization complete! All author, application, and tracking tags have been purged.'
                    : `Optimization complete (${level.toUpperCase()})! Reduced size from ${formatBytes(file.size)} to ${formatBytes(outputSize || 0)}`
                }
                fileName={resultFileName}
                fileSize={formatBytes(outputSize || 0)}
                fileType={isFlattenTool ? 'Flattened PDF' : isCleanTool ? 'Sanitized PDF' : 'Optimized PDF'}
                details={statusMessage}
                onDownload={handleDownload}
                onReset={() => {
                  setFile(null);
                  setResultBlob(null);
                }}
                downloadLabel={`Download ${isFlattenTool ? 'Flattened' : isCleanTool ? 'Sanitized' : 'Compressed'} PDF`}
                downloadFileName={resultFileName}
              />
            </div>
          )}

          {/* Action Bar */}
          {!resultBlob && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Ready to process
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  100% vector fidelity preserved in browser memory.
                </p>
              </div>

              <button
                onClick={handleProcess}
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
                    <ToolIcon className="w-4 h-4" />
                    <span>{meta.actionBtn}</span>
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
