import React, { useState } from 'react';
import {
  Sliders,
  Move,
  Crop,
  RefreshCw,
  ShieldCheck,
  Download,
  Archive,
  CheckCircle2,
  Lock,
  Unlock
} from 'lucide-react';
import JSZip from 'jszip';
import { FileUploader } from '../common/FileUploader';
import { processImage } from '../../lib/imageUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

export const ImageTools: React.FC = () => {
  const { activeToolId, addJob, updateJob, addRecentActivity } = useToolTrack();

  const [activeTab, setActiveTab] = useState<'compress' | 'resize' | 'convert' | 'exif'>('compress');
  const [files, setFiles] = useState<File[]>([]);

  // Sync activeTab when opened directly from header or mega menu
  React.useEffect(() => {
    if (activeToolId === 'image-resizer') setActiveTab('resize');
    else if (activeToolId === 'image-converter') setActiveTab('convert');
    else if (activeToolId === 'image-metadata-remover') setActiveTab('exif');
    else if (activeToolId === 'image-compressor') setActiveTab('compress');
  }, [activeToolId]);

  // Settings
  const [quality, setQuality] = useState(0.8);
  const [targetSizeKb, setTargetSizeKb] = useState<number | ''>('');
  const [resizePercent, setResizePercent] = useState<number>(100);
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');

  const [processing, setProcessing] = useState(false);
  const [processedResults, setProcessedResults] = useState<
    { name: string; blob: Blob; originalSize: number; savedBytes: number }[]
  >([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(newFiles);
    setProcessedResults([]);
    setZipBlob(null);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setProcessing(true);

    const totalInputSize = files.reduce((acc, f) => acc + f.size, 0);
    const jobId = addJob({
      fileName: files.length === 1 ? files[0].name : `${files.length} Images`,
      fileSize: totalInputSize,
      toolId: 'image-tools',
      toolName: `Image ${activeTab.toUpperCase()}`,
      status: 'processing',
      progress: 0.1,
    });

    try {
      const results: { name: string; blob: Blob; originalSize: number; savedBytes: number }[] = [];
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        let targetFmt = outputFormat;
        let ext = outputFormat.split('/')[1];
        if (ext === 'jpeg') ext = 'jpg';

        if (activeTab === 'compress') {
          targetFmt = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        } else if (activeTab === 'exif') {
          targetFmt = 'image/jpeg';
          ext = 'jpg';
        }

        const outFileName = `${baseName}-${activeTab}.${ext}`;

        const { blob, savedBytes } = await processImage(file, {
          format: targetFmt,
          quality: activeTab === 'compress' ? quality : 0.88,
          targetSizeKb: typeof targetSizeKb === 'number' && targetSizeKb > 0 ? targetSizeKb : undefined,
          maxWidth: resizePercent < 100 ? undefined : undefined,
          removeExif: true,
        });

        results.push({
          name: outFileName,
          blob,
          originalSize: file.size,
          savedBytes,
        });

        zip.file(outFileName, blob);
        updateJob(jobId, { progress: (i + 1) / files.length });
      }

      setProcessedResults(results);

      if (results.length > 1) {
        const z = await zip.generateAsync({ type: 'blob' });
        setZipBlob(z);
        updateJob(jobId, {
          status: 'completed',
          progress: 1.0,
          outputBlob: z,
          outputFileName: `processed-images.zip`,
          outputSize: z.size,
        });
      } else {
        updateJob(jobId, {
          status: 'completed',
          progress: 1.0,
          outputBlob: results[0].blob,
          outputFileName: results[0].name,
          outputSize: results[0].blob.size,
        });
      }

      addRecentActivity('image-tools', `Image ${activeTab.toUpperCase()}`, `${files.length} images`, 'completed');
    } catch (err: unknown) {
      console.error(err);
      updateJob(jobId, {
        status: 'failed',
        errorMessage: 'Image processing failed: ' + String(err),
      });
      addRecentActivity('image-tools', `Image ${activeTab.toUpperCase()}`, `${files.length} images`, 'failed');
    } finally {
      setProcessing(false);
    }
  };

  const downloadSingle = (item: { name: string; blob: Blob }) => {
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadZip = () => {
    if (!zipBlob) return;
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed-images.zip';
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
          Image Processing Studio
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Fast, batch client-side image compression, conversion, resizing, and EXIF metadata stripping.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-4">
        {[
          { id: 'compress', label: 'Image Compressor', icon: Sliders },
          { id: 'resize', label: 'Image Resizer', icon: Move },
          { id: 'convert', label: 'Format Converter', icon: RefreshCw },
          { id: 'exif', label: 'Strip EXIF Metadata', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as typeof activeTab);
                setProcessedResults([]);
                setZipBlob(null);
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

      {files.length === 0 ? (
        <FileUploader
          acceptedFormats={['.jpg', '.jpeg', '.png', '.webp', '.bmp']}
          multiple={true}
          maxFiles={30}
          onFilesSelected={handleFilesSelected}
          title={`Select images for ${activeTab.toUpperCase()}`}
          description="Supports single or batch processing (up to 30 images)"
        />
      ) : (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {files.length} Image{files.length > 1 ? 's' : ''} Selected
              </span>
              <button
                onClick={() => {
                  setFiles([]);
                  setProcessedResults([]);
                  setZipBlob(null);
                }}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Change Files
              </button>
            </div>

            {/* Options per tab */}
            {activeTab === 'compress' && (
              <div className="space-y-4 pt-1">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    <span>Quality Level: {Math.round(quality * 100)}%</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {quality > 0.8 ? 'High Quality' : quality > 0.5 ? 'Balanced' : 'Max Compression'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Optional: Compress to Target File Size (KB)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={targetSizeKb}
                      onChange={(e) =>
                        setTargetSizeKb(e.target.value ? Number(e.target.value) : '')
                      }
                      className="mt-1 w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'resize' && (
              <div className="space-y-3 pt-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Scale Percentage
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setResizePercent(pct)}
                      className={`p-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        resizePercent === pct
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'convert' && (
              <div className="space-y-3 pt-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Target Image Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'image/jpeg', label: 'JPEG (.jpg)' },
                    { id: 'image/png', label: 'PNG (.png)' },
                    { id: 'image/webp', label: 'WEBP (.webp)' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setOutputFormat(fmt.id as typeof outputFormat)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        outputFormat === fmt.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'exif' && (
              <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 text-xs text-indigo-800 dark:text-indigo-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                <span>
                  Re-encodes image pixels directly into a new canvas stream, thoroughly stripping camera manufacturer info, lens details, GPS location coords, and device timestamps.
                </span>
              </div>
            )}
          </div>

          {/* Results list */}
          {processedResults.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Processing Complete ({processedResults.length} files)</span>
                </h4>
                {zipBlob && (
                  <button
                    onClick={downloadZip}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Download All (ZIP)</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                {processedResults.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {item.name}
                      </span>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatBytes(item.originalSize)} → {formatBytes(item.blob.size)}
                        {item.savedBytes > 0 && (
                          <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            (-{Math.round((item.savedBytes / item.originalSize) * 100)}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => downloadSingle(item)}
                      className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action button */}
          {processedResults.length === 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Ready to process {files.length} image{files.length > 1 ? 's' : ''}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Instant browser canvas rendering.</p>
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
                    <Sliders className="w-4 h-4" />
                    <span>Process Images</span>
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
