import React, { useState } from 'react';
import {
  RefreshCw,
  Download,
  AlertTriangle,
  Archive,
  CheckCircle2,
  FileCheck,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';
import JSZip from 'jszip';
import { FileUploader } from '../common/FileUploader';
import { processImage, inspectImage, ImageDetails, SupportedImageFormat } from '../../lib/imageUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

export const ImageFormatConverterTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [files, setFiles] = useState<File[]>([]);
  const [fileDetails, setFileDetails] = useState<ImageDetails[]>([]);
  const [targetFormat, setTargetFormat] = useState<SupportedImageFormat>('image/png');
  const [qualityPreset, setQualityPreset] = useState<'lossless' | 'high' | 'balanced' | 'small'>('lossless');
  const [jpgBgColor, setJpgBgColor] = useState('#ffffff');

  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<
    { name: string; blob: Blob; origSize: number; outSize: number; width: number; height: number }[]
  >([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  const handleFilesSelected = async (newFiles: File[]) => {
    setFiles(newFiles);
    setResults([]);
    setZipBlob(null);

    const details = await Promise.all(newFiles.map((f) => inspectImage(f)));
    setFileDetails(details);
  };

  const getQualityValue = () => {
    switch (qualityPreset) {
      case 'lossless': return 1.0;
      case 'high': return 0.92;
      case 'balanced': return 0.82;
      case 'small': return 0.65;
    }
  };

  const hasAnyTransparency = fileDetails.some((d) => d.hasTransparency);
  const isConvertingToJpg = targetFormat === 'image/jpeg';

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);

    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    const jobId = addJob({
      fileName: files.length === 1 ? files[0].name : `${files.length} Images`,
      fileSize: totalSize,
      toolId: 'image-converter',
      toolName: 'Format Converter',
      status: 'processing',
      progress: 0.1,
    });

    try {
      const converted: { name: string; blob: Blob; origSize: number; outSize: number; width: number; height: number }[] = [];
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        let ext = 'png';
        if (targetFormat === 'image/jpeg') ext = 'jpg';
        if (targetFormat === 'image/webp') ext = 'webp';
        if (targetFormat === 'image/bmp') ext = 'bmp';

        const outName = `${baseName}.${ext}`;

        const res = await processImage(file, {
          format: targetFormat,
          quality: getQualityValue(),
          backgroundColor: jpgBgColor,
        });

        converted.push({
          name: outName,
          blob: res.blob,
          origSize: file.size,
          outSize: res.blob.size,
          width: res.width,
          height: res.height,
        });

        zip.file(outName, res.blob);
        updateJob(jobId, { progress: (i + 1) / files.length });
      }

      setResults(converted);

      if (converted.length > 1) {
        const z = await zip.generateAsync({ type: 'blob' });
        setZipBlob(z);
        updateJob(jobId, {
          status: 'completed',
          progress: 1.0,
          outputBlob: z,
          outputFileName: 'converted-images.zip',
          outputSize: z.size,
        });
      } else {
        updateJob(jobId, {
          status: 'completed',
          progress: 1.0,
          outputBlob: converted[0].blob,
          outputFileName: converted[0].name,
          outputSize: converted[0].blob.size,
        });
      }

      addRecentActivity('image-converter', 'Format Converter', `${files.length} images`, 'completed');
    } catch (err: unknown) {
      console.error(err);
      updateJob(jobId, { status: 'failed', errorMessage: String(err) });
    } finally {
      setProcessing(false);
    }
  };

  const downloadItem = (blob: Blob, name: string) => {
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
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Lossless & Pro-Quality Format Conversion</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Image Format Converter
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Convert seamlessly between JPG, PNG, WEBP, and BMP with strict quality protection. Preserves original resolution and handles transparency safely.
          </p>
        </div>

        {files.length > 0 && (
          <button
            onClick={() => {
              setFiles([]);
              setResults([]);
              setZipBlob(null);
            }}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Clear Selection
          </button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="max-w-2xl mx-auto space-y-4">
          <FileUploader
            acceptedFormats={['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.svg']}
            multiple={true}
            maxFiles={30}
            onFilesSelected={handleFilesSelected}
            title="Upload images to convert format"
            description="Supports PNG, JPG, WEBP, BMP, and SVG. Batch upload supported."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Settings (1 col) */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Target Format</span>
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'image/png', label: 'PNG', note: 'Lossless & Transparency' },
                  { id: 'image/jpeg', label: 'JPG / JPEG', note: 'Photographic & Small' },
                  { id: 'image/webp', label: 'WEBP', note: 'Modern Web Standard' },
                  { id: 'image/bmp', label: 'BMP', note: 'Uncompressed Bitmap' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setTargetFormat(fmt.id as SupportedImageFormat)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      targetFormat === fmt.id
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="block text-sm">{fmt.label}</span>
                    <span className="block text-[10px] text-slate-500 font-normal mt-0.5">{fmt.note}</span>
                  </button>
                ))}
              </div>

              {/* Transparency Warning when converting PNG to JPG */}
              {isConvertingToJpg && hasAnyTransparency && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Transparency Alert</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    JPG format does not support transparency. Transparent areas will be replaced with your chosen background color below:
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="font-semibold text-[11px]">Fill Color:</span>
                    <input
                      type="color"
                      value={jpgBgColor}
                      onChange={(e) => setJpgBgColor(e.target.value)}
                      className="w-7 h-7 rounded border cursor-pointer"
                    />
                    <span className="font-mono text-[11px] font-bold">{jpgBgColor}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quality Presets */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Quality & Compression Mode</span>
              </h3>

              <div className="space-y-2 text-xs">
                {[
                  { id: 'lossless', label: 'Lossless / Maximum Quality', desc: '100% pixel fidelity with zero visual compression artifacts.' },
                  { id: 'high', label: 'High Quality (Default)', desc: '92% quality with invisible compression and clean lines.' },
                  { id: 'balanced', label: 'Balanced', desc: '82% quality balancing file size with visual sharpness.' },
                  { id: 'small', label: 'Small File', desc: '65% quality for quick email or instant message sharing.' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setQualityPreset(preset.id as any)}
                    className={`w-full p-3 rounded-xl border text-left transition cursor-pointer ${
                      qualityPreset === preset.id
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">{preset.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action */}
            <button
              onClick={handleConvert}
              disabled={processing}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${processing ? 'animate-spin' : ''}`} />
              <span>Convert {files.length} {files.length === 1 ? 'Image' : 'Images'}</span>
            </button>
          </div>

          {/* Right: Files Table & Results (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Queued Files ({files.length})
                </h3>
                {zipBlob && (
                  <button
                    onClick={() => downloadItem(zipBlob, 'converted-images.zip')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Download All (ZIP)</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {files.map((file, idx) => {
                  const details = fileDetails[idx];
                  const res = results[idx];

                  return (
                    <div key={idx} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {file.name}
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
                          {details && (
                            <>
                              <span>{details.width} × {details.height} px</span>
                              <span>•</span>
                              <span>{(file.size / 1024).toFixed(1)} KB</span>
                              <span>•</span>
                              <span className="uppercase">{file.type.split('/')[1] || 'img'}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {res ? (
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                              {(res.outSize / 1024).toFixed(1)} KB
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {res.width} × {res.height} px
                            </span>
                          </div>
                          <button
                            onClick={() => downloadItem(res.blob, res.name)}
                            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 cursor-pointer"
                            title="Download Converted Image"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] shrink-0">Ready</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
