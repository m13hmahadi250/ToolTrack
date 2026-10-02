import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Type,
  Image as ImageIcon,
  Download,
  Archive,
  RefreshCw,
  RotateCw,
  Grid,
  CheckCircle2
} from 'lucide-react';
import JSZip from 'jszip';
import { FileUploader } from '../common/FileUploader';
import { applyWatermarkToImage, WatermarkOptions } from '../../lib/imageUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

export const ImageWatermarkTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [files, setFiles] = useState<File[]>([]);
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');

  // Text settings
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  const [fontSize, setFontSize] = useState(48);
  const [textColor, setTextColor] = useState('#ffffff');

  // Image watermark settings
  const [logoImageEl, setLogoImageEl] = useState<HTMLImageElement | null>(null);
  const [logoScale, setLogoScale] = useState(0.2);

  // Common settings
  const [opacity, setOpacity] = useState(0.6);
  const [rotation, setRotation] = useState(-30);
  const [position, setPosition] = useState<WatermarkOptions['position']>('tile');
  const [margin, setMargin] = useState(30);

  // Preview & Processing
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; blob: Blob }[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(newFiles);
    setResults([]);
    setZipBlob(null);
  };

  // Generate live preview on primary image
  useEffect(() => {
    if (files.length === 0) return;

    let isMounted = true;
    const generatePreview = async () => {
      try {
        const blob = await applyWatermarkToImage(files[0], {
          type: watermarkType,
          text: watermarkText,
          fontFamily,
          fontSize,
          textColor,
          opacity,
          rotation,
          position,
          margin,
          watermarkImage: logoImageEl || undefined,
          watermarkScale: logoScale,
          format: 'image/jpeg',
          quality: 0.9,
        });

        if (isMounted) {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setPreviewUrl(URL.createObjectURL(blob));
        }
      } catch (err) {
        console.error(err);
      }
    };

    generatePreview();
    return () => {
      isMounted = false;
    };
  }, [
    files,
    watermarkType,
    watermarkText,
    fontFamily,
    fontSize,
    textColor,
    opacity,
    rotation,
    position,
    margin,
    logoImageEl,
    logoScale,
  ]);

  const handleProcessBatch = async () => {
    if (files.length === 0) return;
    setProcessing(true);

    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    const jobId = addJob({
      fileName: files.length === 1 ? files[0].name : `${files.length} Images`,
      fileSize: totalSize,
      toolId: 'image-watermark',
      toolName: 'Watermark Images',
      status: 'processing',
      progress: 0.1,
    });

    try {
      const outputList: { name: string; blob: Blob }[] = [];
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const outName = `${file.name.replace(/\.[^/.]+$/, '')}-watermarked.png`;

        const blob = await applyWatermarkToImage(file, {
          type: watermarkType,
          text: watermarkText,
          fontFamily,
          fontSize,
          textColor,
          opacity,
          rotation,
          position,
          margin,
          watermarkImage: logoImageEl || undefined,
          watermarkScale: logoScale,
          format: 'image/png',
          quality: 0.95,
        });

        outputList.push({ name: outName, blob });
        zip.file(outName, blob);
        updateJob(jobId, { progress: (i + 1) / files.length });
      }

      setResults(outputList);

      if (outputList.length > 1) {
        const z = await zip.generateAsync({ type: 'blob' });
        setZipBlob(z);
        updateJob(jobId, {
          status: 'completed',
          progress: 1.0,
          outputBlob: z,
          outputFileName: 'watermarked-images.zip',
          outputSize: z.size,
        });
      } else {
        updateJob(jobId, {
          status: 'completed',
          progress: 1.0,
          outputBlob: outputList[0].blob,
          outputFileName: outputList[0].name,
          outputSize: outputList[0].blob.size,
        });
      }

      addRecentActivity('image-watermark', 'Watermark Images', `${files.length} images`, 'completed');
    } catch (err: unknown) {
      console.error(err);
      updateJob(jobId, { status: 'failed', errorMessage: String(err) });
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
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Batch Copyright & Brand Protection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Image Watermark
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Stamp custom text or transparent logos onto single or batch images. Control opacity, rotation, tile patterns, and 9-point anchor positions.
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
        <div className="max-w-2xl mx-auto">
          <FileUploader
            acceptedFormats={['.png', '.jpg', '.jpeg', '.webp']}
            multiple={true}
            maxFiles={30}
            onFilesSelected={handleFilesSelected}
            title="Upload images to watermark"
            description="Supports single or batch image upload. Full preview provided."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls (1 Col) */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Watermark Mode</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setWatermarkType('text')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition cursor-pointer ${
                    watermarkType === 'text'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  <span>Text Watermark</span>
                </button>
                <button
                  onClick={() => setWatermarkType('image')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition cursor-pointer ${
                    watermarkType === 'image'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Logo / Image</span>
                </button>
              </div>

              {watermarkType === 'text' ? (
                <div className="space-y-3 text-xs pt-1">
                  <div>
                    <label className="font-bold block mb-1">Watermark Text:</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">Font Size:</label>
                      <input
                        type="number"
                        min="12"
                        max="200"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Color:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                        <span className="font-mono">{textColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs pt-1">
                  <div>
                    <label className="font-bold block mb-1">Upload Logo Image (PNG):</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const img = new Image();
                          img.src = URL.createObjectURL(f);
                          img.onload = () => setLogoImageEl(img);
                        }
                      }}
                      className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>Logo Scale:</span>
                      <span className="font-mono">{Math.round(logoScale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.8"
                      step="0.05"
                      value={logoScale}
                      onChange={(e) => setLogoScale(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Position & Opacity Box */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Placement & Style</h3>

              <div>
                <label className="font-bold block mb-2">Position Anchor:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'top-left', label: 'TL' },
                    { id: 'top-center', label: 'TC' },
                    { id: 'top-right', label: 'TR' },
                    { id: 'tile', label: 'Tile All' },
                    { id: 'center', label: 'Center' },
                    { id: 'bottom-left', label: 'BL' },
                    { id: 'bottom-center', label: 'BC' },
                    { id: 'bottom-right', label: 'BR' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPosition(p.id as any)}
                      className={`p-2 rounded-lg border text-center font-bold transition cursor-pointer ${
                        position === p.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>Opacity:</span>
                  <span className="font-mono">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>Rotation:</span>
                  <span className="font-mono">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleProcessBatch}
              disabled={processing}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${processing ? 'animate-spin' : ''}`} />
              <span>Apply to {files.length} {files.length === 1 ? 'Image' : 'Images'}</span>
            </button>
          </div>

          {/* Right: Live Preview & Batch Results (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>Real-Time Watermark Preview</span>
                <span className="text-xs text-slate-500 font-normal">{files[0]?.name}</span>
              </h3>

              <div className="min-h-[360px] max-h-[500px] overflow-auto rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 border border-slate-200 dark:border-slate-800">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Watermark preview"
                    className="max-w-full max-h-[460px] rounded-xl shadow-md object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400">Rendering preview...</span>
                )}
              </div>
            </div>

            {/* Completed Results List */}
            {results.length > 0 && (
              <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Watermark Completed ({results.length})</span>
                  </h3>

                  {zipBlob && (
                    <button
                      onClick={() => downloadFile(zipBlob, 'watermarked-images.zip')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Download All (ZIP)</span>
                    </button>
                  )}
                </div>

                <div className="divide-y divide-emerald-100 dark:divide-emerald-900/50 text-xs">
                  {results.map((res, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between gap-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {res.name}
                      </span>
                      <button
                        onClick={() => downloadFile(res.blob, res.name)}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                        title="Download Image"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
