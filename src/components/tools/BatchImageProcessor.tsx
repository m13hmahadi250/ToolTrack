import React, { useState } from 'react';
import {
  Layers,
  Archive,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Move,
  Type,
  ShieldCheck
} from 'lucide-react';
import JSZip from 'jszip';
import { FileUploader } from '../common/FileUploader';
import { applyWatermarkToImage, inspectImage, SupportedImageFormat } from '../../lib/imageUtils';
import { compressImage, convertImage } from '../../lib/compressionEngine';
import { useToolTrack } from '../../context/ToolTrackContext';

interface BatchFileItem {
  id: string;
  file: File;
  status: 'waiting' | 'processing' | 'completed' | 'failed';
  originalSize: number;
  outputSize?: number;
  outputBlob?: Blob;
  outputName?: string;
  errorMessage?: string;
}

export const BatchImageProcessor: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [items, setItems] = useState<BatchFileItem[]>([]);
  const [batchAction, setBatchAction] = useState<'compress' | 'resize' | 'convert' | 'watermark' | 'exif'>('compress');

  // Operation parameters
  const [quality, setQuality] = useState<number>(0.85);
  const [resizePercent, setResizePercent] = useState<number>(75);
  const [targetFormat, setTargetFormat] = useState<SupportedImageFormat>('image/webp');
  const [watermarkText, setWatermarkText] = useState('TOOLTRACK PRO');

  const [processing, setProcessing] = useState(false);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  const handleFiles = (files: File[]) => {
    const list: BatchFileItem[] = files.map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      file: f,
      status: 'waiting',
      originalSize: f.size,
    }));
    setItems(list);
    setZipBlob(null);
  };

  const runBatchProcessing = async () => {
    if (items.length === 0) return;
    setProcessing(true);

    const totalSize = items.reduce((acc, it) => acc + it.file.size, 0);
    const jobId = addJob({
      fileName: `${items.length} Batch Images`,
      fileSize: totalSize,
      toolId: 'batch-image-processor',
      toolName: `Batch ${batchAction.toUpperCase()}`,
      status: 'processing',
      progress: 0.1,
    });

    const zip = new JSZip();
    const updated = [...items];

    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      item.status = 'processing';
      setItems([...updated]);

      try {
        let outBlob: Blob;
        let ext = item.file.type.split('/')[1] || 'jpg';
        if (ext === 'jpeg') ext = 'jpg';

        if (batchAction === 'compress') {
          const res = await compressImage(item.file, {
            quality,
            format: 'same',
          });
          outBlob = res.blob;
        } else if (batchAction === 'resize') {
          const details = await inspectImage(item.file);
          const targetW = Math.max(1, Math.round(details.width * (resizePercent / 100)));
          const targetH = Math.max(1, Math.round(details.height * (resizePercent / 100)));

          const res = await compressImage(item.file, {
            maxWidth: targetW,
            maxHeight: targetH,
            quality: 0.92,
            format: 'same',
          });
          outBlob = res.blob;
        } else if (batchAction === 'convert') {
          ext = targetFormat.split('/')[1];
          if (ext === 'jpeg') ext = 'jpg';
          const res = await convertImage(item.file, {
            targetFormat: targetFormat as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp',
            quality: 0.92,
          });
          outBlob = res.blob;
        } else if (batchAction === 'watermark') {
          outBlob = await applyWatermarkToImage(item.file, {
            type: 'text',
            text: watermarkText,
            position: 'tile',
            opacity: 0.45,
            rotation: -25,
            fontSize: 36,
          });
          ext = 'png';
        } else {
          // EXIF removal
          const res = await compressImage(item.file, {
            format: 'same',
            removeMetadata: true,
            quality: 0.95,
          });
          outBlob = res.blob;
        }

        const outName = `${item.file.name.replace(/\.[^/.]+$/, '')}-${batchAction}.${ext}`;
        item.status = 'completed';
        item.outputBlob = outBlob;
        item.outputSize = outBlob.size;
        item.outputName = outName;

        zip.file(outName, outBlob);
      } catch (err) {
        console.error(err);
        item.status = 'failed';
        item.errorMessage = String(err);
      }

      setItems([...updated]);
      updateJob(jobId, { progress: (i + 1) / updated.length });
    }

    try {
      const z = await zip.generateAsync({ type: 'blob' });
      setZipBlob(z);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: z,
        outputFileName: `batch-${batchAction}-images.zip`,
        outputSize: z.size,
      });

      addRecentActivity(
        'batch-image-processor',
        `Batch ${batchAction.toUpperCase()}`,
        `${items.length} images`,
        'completed'
      );
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const downloadFile = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
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
            <Layers className="w-3.5 h-3.5" />
            <span>High-Throughput Batch Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Batch Image Processor
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Process dozens of images simultaneously. Compress, resize, convert formats, watermark, or strip camera EXIF in one single operation with ZIP export.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => {
              setItems([]);
              setZipBlob(null);
            }}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Clear Queue
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="max-w-2xl mx-auto space-y-4">
          <FileUploader
            acceptedFormats={['.png', '.jpg', '.jpeg', '.webp', '.bmp']}
            multiple={true}
            maxFiles={50}
            onFilesSelected={handleFiles}
            title="Upload multiple images for batch processing"
            description="Supports PNG, JPG, WEBP, and BMP. Batch convert, compress, or watermark."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Operations & Settings Sidebar (1 Col) */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Batch Operation</h3>

              <div className="space-y-2">
                {[
                  { id: 'compress', label: 'Batch Compress', icon: Sliders, desc: 'Reduce file size with quality slider' },
                  { id: 'resize', label: 'Batch Resize', icon: Move, desc: 'Scale dimensions by percentage' },
                  { id: 'convert', label: 'Batch Convert', icon: RefreshCw, desc: 'Switch format to PNG, WEBP, or JPG' },
                  { id: 'watermark', label: 'Batch Watermark', icon: Type, desc: 'Tile copyright text across all images' },
                  { id: 'exif', label: 'Strip EXIF / Privacy', icon: ShieldCheck, desc: 'Remove camera and GPS tracking metadata' },
                ].map((op) => {
                  const Icon = op.icon;
                  return (
                    <button
                      key={op.id}
                      onClick={() => setBatchAction(op.id as any)}
                      className={`w-full p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                        batchAction === op.id
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <div>{op.label}</div>
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5">{op.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action-specific controls */}
              {batchAction === 'compress' && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>Quality Level:</span>
                    <span className="font-mono">{Math.round(quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1.0"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              )}

              {batchAction === 'resize' && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>Scaling Percentage:</span>
                    <span className="font-mono">{resizePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    step="5"
                    value={resizePercent}
                    onChange={(e) => setResizePercent(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              )}

              {batchAction === 'convert' && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="font-bold block mb-1">Target Format:</label>
                  <select
                    value={targetFormat}
                    onChange={(e) => setTargetFormat(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="image/webp">WEBP (Compact Modern Web)</option>
                    <option value="image/png">PNG (Lossless & Alpha)</option>
                    <option value="image/jpeg">JPG (Standard Photo)</option>
                  </select>
                </div>
              )}

              {batchAction === 'watermark' && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="font-bold block mb-1">Watermark Text:</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              )}
            </div>

            <button
              onClick={runBatchProcessing}
              disabled={processing}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${processing ? 'animate-spin' : ''}`} />
              <span>Process All {items.length} Files</span>
            </button>
          </div>

          {/* Files Table (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Batch Queue ({items.length} Files)
                </h3>

                {zipBlob && (
                  <button
                    onClick={() => downloadFile(zipBlob, `batch-${batchAction}-results.zip`)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Download All (ZIP)</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {items.map((it) => (
                  <div key={it.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {it.file.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>Original: {(it.originalSize / 1024).toFixed(1)} KB</span>
                        {it.outputSize && (
                          <>
                            <span>→</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {(it.outputSize / 1024).toFixed(1)} KB
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {it.status === 'completed' && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Done</span>
                          </span>
                          {it.outputBlob && it.outputName && (
                            <button
                              onClick={() => downloadFile(it.outputBlob!, it.outputName!)}
                              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 cursor-pointer"
                              title="Download Individual File"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}

                      {it.status === 'processing' && (
                        <span className="inline-flex items-center gap-1 text-indigo-600 font-bold text-xs">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </span>
                      )}

                      {it.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-xs">
                          <AlertCircle className="w-4 h-4" />
                          <span>Failed</span>
                        </span>
                      )}

                      {it.status === 'waiting' && (
                        <span className="text-slate-400 font-semibold text-xs">Waiting</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
