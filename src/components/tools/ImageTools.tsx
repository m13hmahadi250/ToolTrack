import React, { useState } from 'react';
import {
  Sliders,
  Move,
  RefreshCw,
  ShieldCheck,
  Download,
  Archive,
  CheckCircle2,
  Eye,
  X,
  Sparkles,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import JSZip from 'jszip';
import { FileUploader } from '../common/FileUploader';
import { compressImage, convertImage, ImageCompressionPreset } from '../../lib/compressionEngine';
import { inspectImage } from '../../lib/imageUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

interface ProcessedResultItem {
  name: string;
  blob: Blob;
  originalSize: number;
  outputSize: number;
  savedBytes: number;
  savedPercent: number;
  originalWidth?: number;
  originalHeight?: number;
  outputWidth?: number;
  outputHeight?: number;
  statusMessage?: string;
  appliedQuality?: number;
  previewUrl?: string;
  originalPreviewUrl?: string;
}

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

  // Compression Settings
  const [compressionPreset, setCompressionPreset] = useState<ImageCompressionPreset>('balanced');
  const [quality, setQuality] = useState<number>(0.75); // User's direct quality (0.05 to 1.0)
  const [targetSizeKb, setTargetSizeKb] = useState<number | ''>('');
  const [dimensionConstraint, setDimensionConstraint] = useState<'auto' | 'original' | '1080p' | '2k' | '4k'>('auto');
  const [compressionFormat, setCompressionFormat] = useState<'same' | 'image/webp' | 'image/jpeg' | 'image/png'>('same');

  // Resize Settings
  const [resizePercent, setResizePercent] = useState<number>(100);

  // Convert Settings
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');

  const [processing, setProcessing] = useState(false);
  const [processedResults, setProcessedResults] = useState<ProcessedResultItem[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  // Preview Modal
  const [previewItem, setPreviewItem] = useState<ProcessedResultItem | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
    // Revoke previous URLs to prevent memory leaks
    processedResults.forEach((r) => {
      if (r.previewUrl) URL.revokeObjectURL(r.previewUrl);
      if (r.originalPreviewUrl) URL.revokeObjectURL(r.originalPreviewUrl);
    });
    setFiles(newFiles);
    setProcessedResults([]);
    setZipBlob(null);
    setPreviewItem(null);
  };

  const handlePresetSelect = (preset: ImageCompressionPreset) => {
    setCompressionPreset(preset);
    if (preset === 'high') {
      setQuality(0.90);
    } else if (preset === 'balanced') {
      setQuality(0.75);
    } else if (preset === 'strong') {
      setQuality(0.55);
    } else if (preset === 'maximum') {
      setQuality(0.25);
    }
  };

  const handleQualityChange = (val: number) => {
    setQuality(val);
    if (val <= 0.35) {
      setCompressionPreset('maximum');
    } else if (val <= 0.65) {
      setCompressionPreset('strong');
    } else if (val <= 0.85) {
      setCompressionPreset('balanced');
    } else {
      setCompressionPreset('high');
    }
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
      const results: ProcessedResultItem[] = [];
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        let targetFmt = outputFormat;
        let ext = outputFormat.split('/')[1];
        if (ext === 'jpeg') ext = 'jpg';

        if (activeTab === 'compress') {
          if (compressionFormat === 'same') {
            ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg';
          } else {
            ext = compressionFormat.split('/')[1] === 'jpeg' ? 'jpg' : compressionFormat.split('/')[1];
          }
        } else if (activeTab === 'exif') {
          targetFmt = 'image/jpeg';
          ext = 'jpg';
        }

        const outFileName = `${baseName}-${activeTab}.${ext}`;

        let blob: Blob;
        let savedBytes = 0;
        let savedPercent = 0;
        let originalWidth = 0;
        let originalHeight = 0;
        let outputWidth = 0;
        let outputHeight = 0;
        let statusMessage = '';
        let appliedQuality = quality;

        if (activeTab === 'compress') {
          let maxDimVal: number | undefined = undefined;
          if (dimensionConstraint === '1080p') maxDimVal = 1920;
          else if (dimensionConstraint === '2k') maxDimVal = 2560;
          else if (dimensionConstraint === '4k') maxDimVal = 3840;

          const compResult = await compressImage(file, {
            preset: compressionPreset,
            quality, // EXACT USER QUALITY (e.g. 0.10)
            targetSizeKb:
              compressionPreset === 'target' || (typeof targetSizeKb === 'number' && targetSizeKb > 0)
                ? Number(targetSizeKb)
                : undefined,
            format: compressionFormat,
            maxDimension: maxDimVal,
            preserveDimensions: dimensionConstraint === 'original',
            allowWebpConversion: compressionFormat === 'image/webp',
          });

          blob = compResult.blob;
          savedBytes = compResult.savedBytes;
          savedPercent = compResult.savedPercent;
          originalWidth = compResult.originalWidth;
          originalHeight = compResult.originalHeight;
          outputWidth = compResult.outputWidth;
          outputHeight = compResult.outputHeight;
          statusMessage = compResult.statusMessage;
          appliedQuality = compResult.appliedQuality;
        } else if (activeTab === 'convert') {
          const convResult = await convertImage(file, {
            targetFormat: outputFormat,
            quality,
          });
          blob = convResult.blob;
          savedBytes = convResult.savedBytes;
          savedPercent = convResult.savedPercent;
          originalWidth = convResult.originalWidth;
          originalHeight = convResult.originalHeight;
          outputWidth = convResult.outputWidth;
          outputHeight = convResult.outputHeight;
          statusMessage = convResult.statusMessage;
        } else if (activeTab === 'resize') {
          const info = await inspectImage(file);
          const targetW = Math.round(info.width * (resizePercent / 100));
          const targetH = Math.round(info.height * (resizePercent / 100));

          const compResult = await compressImage(file, {
            format: 'same',
            quality: 0.85,
            maxWidth: targetW,
            maxHeight: targetH,
          });
          blob = compResult.blob;
          savedBytes = compResult.savedBytes;
          savedPercent = compResult.savedPercent;
          originalWidth = compResult.originalWidth;
          originalHeight = compResult.originalHeight;
          outputWidth = compResult.outputWidth;
          outputHeight = compResult.outputHeight;
          statusMessage = `Rescaled to ${resizePercent}% of original dimensions.`;
        } else {
          // EXIF removal
          const compResult = await compressImage(file, {
            format: 'same',
            quality: 0.90,
            removeMetadata: true,
            preserveDimensions: true,
          });
          blob = compResult.blob;
          savedBytes = compResult.savedBytes;
          savedPercent = compResult.savedPercent;
          originalWidth = compResult.originalWidth;
          originalHeight = compResult.originalHeight;
          outputWidth = compResult.outputWidth;
          outputHeight = compResult.outputHeight;
          statusMessage = 'Stripped camera EXIF, GPS location, and device metadata.';
        }

        const previewUrl = URL.createObjectURL(blob);
        const originalPreviewUrl = URL.createObjectURL(file);

        results.push({
          name: outFileName,
          blob,
          originalSize: file.size,
          outputSize: blob.size,
          savedBytes,
          savedPercent,
          originalWidth,
          originalHeight,
          outputWidth,
          outputHeight,
          statusMessage,
          appliedQuality,
          previewUrl,
          originalPreviewUrl,
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

  const downloadSingle = (item: ProcessedResultItem) => {
    const a = document.createElement('a');
    a.href = item.previewUrl || URL.createObjectURL(item.blob);
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadZip = () => {
    if (!zipBlob) return;
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tooltrack-compressed-images.zip';
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

  const totalInputBytes = processedResults.reduce((acc, r) => acc + r.originalSize, 0);
  const totalOutputBytes = processedResults.reduce((acc, r) => acc + r.outputSize, 0);
  const totalSavedBytes = Math.max(0, totalInputBytes - totalOutputBytes);
  const totalSavedPercent = totalInputBytes > 0 ? Math.round((totalSavedBytes / totalInputBytes) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Image Processing Studio
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          High-performance, format-aware client-side image compression, conversion, resizing, and EXIF stripping.
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
                setPreviewItem(null);
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
          description="Supports single or batch processing (up to 30 images). 100% private in-browser execution."
        />
      ) : (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {files.length} Image{files.length > 1 ? 's' : ''} Selected ({formatBytes(files.reduce((a, b) => a + b.size, 0))})
              </span>
              <button
                onClick={() => {
                  setFiles([]);
                  setProcessedResults([]);
                  setZipBlob(null);
                  setPreviewItem(null);
                }}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Change Files
              </button>
            </div>

            {/* TAB: COMPRESS */}
            {activeTab === 'compress' && (
              <div className="space-y-6 pt-1">
                {/* Mode Selection Presets */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Compression Preset</span>
                    </label>
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      Active: {compressionPreset.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'high', label: 'High Quality', desc: 'Minimal loss (~90% Q)', q: 0.90 },
                      { id: 'balanced', label: 'Balanced', desc: 'Optimal ratio (~75% Q)', q: 0.75 },
                      { id: 'strong', label: 'Strong', desc: 'Smaller file (~55% Q)', q: 0.55 },
                      { id: 'maximum', label: 'Maximum', desc: 'Aggressive (~25% Q)', q: 0.25 },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePresetSelect(p.id as ImageCompressionPreset)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          compressionPreset === p.id
                            ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="font-bold text-xs">{p.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Slider */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-750 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Quality Level: {Math.round(quality * 100)}%</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      encoder quality = {quality.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={quality}
                    onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>5% (Smallest file)</span>
                    <span>50%</span>
                    <span>100% (Near lossless)</span>
                  </div>
                </div>

                {/* Target File Size & Dimension Constraints */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Target KB */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Target File Size (Optional KB)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={targetSizeKb}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : '';
                        setTargetSizeKb(val);
                        if (typeof val === 'number' && val > 0) {
                          setCompressionPreset('target');
                        }
                      }}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <div className="flex gap-1.5 pt-1">
                      {[100, 200, 500, 1024].map((kb) => (
                        <button
                          key={kb}
                          type="button"
                          onClick={() => {
                            setTargetSizeKb(kb);
                            setCompressionPreset('target');
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-mono border transition cursor-pointer ${
                            targetSizeKb === kb
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {kb >= 1024 ? '1 MB' : `${kb} KB`}
                        </button>
                      ))}
                      {targetSizeKb !== '' && (
                        <button
                          type="button"
                          onClick={() => setTargetSizeKb('')}
                          className="text-[10px] px-2 py-0.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dimensions & Resolution Strategy */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Dimension Optimization
                    </label>
                    <select
                      value={dimensionConstraint}
                      onChange={(e) => setDimensionConstraint(e.target.value as typeof dimensionConstraint)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="auto">Auto-optimize for chosen preset (Recommended)</option>
                      <option value="original">Preserve 100% original dimensions</option>
                      <option value="1080p">Cap at Full HD (Max 1920px edge)</option>
                      <option value="2k">Cap at 2K (Max 2560px edge)</option>
                      <option value="4k">Cap at 4K (Max 3840px edge)</option>
                    </select>
                    <p className="text-[10px] text-slate-400">
                      Maintains exact aspect ratio. Never upscales smaller images.
                    </p>
                  </div>
                </div>

                {/* Output Format Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Output Format
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'same', label: 'Original Format', hint: 'Preserves JPEG/PNG' },
                      { id: 'image/webp', label: 'WebP (Recommended)', hint: '70-85% smaller + alpha' },
                      { id: 'image/jpeg', label: 'JPEG (.jpg)', hint: 'Universal compatibility' },
                      { id: 'image/png', label: 'PNG (.png)', hint: 'Lossless graphic' },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setCompressionFormat(fmt.id as typeof compressionFormat)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          compressionFormat === fmt.id
                            ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="font-bold text-xs">{fmt.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{fmt.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: RESIZE */}
            {activeTab === 'resize' && (
              <div className="space-y-3 pt-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Scale Percentage
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setResizePercent(pct)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        resizePercent === pct
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: CONVERT */}
            {activeTab === 'convert' && (
              <div className="space-y-3 pt-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
                      type="button"
                      onClick={() => setOutputFormat(fmt.id as typeof outputFormat)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        outputFormat === fmt.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: EXIF */}
            {activeTab === 'exif' && (
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5 border border-indigo-200/50 dark:border-indigo-800/40">
                <ShieldCheck className="w-5 h-5 shrink-0 text-indigo-600 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Privacy EXIF Stripping</div>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                    Re-encodes image pixels directly into a clean buffer stream. Thoroughly removes GPS coordinates, camera manufacturer, lens aperture, serial numbers, and device timestamps without altering visual fidelity.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RESULTS CARD */}
          {processedResults.length > 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              {/* Header with stats banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>Processing Complete ({processedResults.length} file{processedResults.length > 1 ? 's' : ''})</span>
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>Total: {formatBytes(totalInputBytes)} → {formatBytes(totalOutputBytes)}</span>
                    {totalSavedBytes > 0 && (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        Saved {formatBytes(totalSavedBytes)} (-{totalSavedPercent}%)
                      </span>
                    )}
                  </div>
                </div>

                {zipBlob && (
                  <button
                    onClick={downloadZip}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Download All (ZIP)</span>
                  </button>
                )}
              </div>

              {/* Individual File Results List */}
              <div className="space-y-3">
                {processedResults.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{item.name}</span>
                        {item.savedPercent > 0 ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                            -{item.savedPercent}%
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            Already Optimized
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>
                          <strong className="text-slate-700 dark:text-slate-300">Size:</strong> {formatBytes(item.originalSize)} → {formatBytes(item.outputSize)}
                        </span>
                        {item.originalWidth && item.outputWidth && (
                          <span>
                            <strong className="text-slate-700 dark:text-slate-300">Dimensions:</strong> {item.originalWidth}×{item.originalHeight} → {item.outputWidth}×{item.outputHeight}
                          </span>
                        )}
                      </div>

                      {item.statusMessage && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                          {item.statusMessage}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadSingle(item)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTION BUTTON */}
          {processedResults.length === 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Ready to process {files.length} image{files.length > 1 ? 's' : ''}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeTab === 'compress'
                    ? `Mode: ${compressionPreset.toUpperCase()} • Direct Quality: ${Math.round(quality * 100)}%`
                    : '100% private in-browser canvas execution.'}
                </p>
              </div>

              <button
                onClick={handleProcess}
                disabled={processing}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing Images...</span>
                  </>
                ) : (
                  <>
                    <Sliders className="w-4 h-4" />
                    <span>Run {activeTab === 'compress' ? 'Compression' : 'Processing'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* BEFORE / AFTER PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {previewItem.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatBytes(previewItem.originalSize)} → {formatBytes(previewItem.outputSize)} (-{previewItem.savedPercent}%)
                </p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-center">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Original Image</span>
                <div className="h-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden p-2">
                  {previewItem.originalPreviewUrl && (
                    <img
                      src={previewItem.originalPreviewUrl}
                      alt="Original"
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  {formatBytes(previewItem.originalSize)}
                  {previewItem.originalWidth && ` • ${previewItem.originalWidth}×${previewItem.originalHeight}`}
                </div>
              </div>

              <div className="space-y-1.5 text-center">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Compressed Output</span>
                <div className="h-64 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden p-2">
                  {previewItem.previewUrl && (
                    <img
                      src={previewItem.previewUrl}
                      alt="Compressed"
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                  )}
                </div>
                <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                  {formatBytes(previewItem.outputSize)} (-{previewItem.savedPercent}%)
                  {previewItem.outputWidth && ` • ${previewItem.outputWidth}×${previewItem.outputHeight}`}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadSingle(previewItem);
                  setPreviewItem(null);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Download Compressed File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
