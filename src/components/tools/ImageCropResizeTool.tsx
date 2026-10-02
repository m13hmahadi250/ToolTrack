import React, { useState, useRef, useEffect } from 'react';
import {
  Crop,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Download,
  Lock,
  Unlock,
  Move,
  CheckCircle2,
  Sliders,
  Maximize2
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { cropAndTransformImage, inspectImage, ImageDetails, SupportedImageFormat } from '../../lib/imageUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

export const ImageCropResizeTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [file, setFile] = useState<File | null>(null);
  const [details, setDetails] = useState<ImageDetails | null>(null);

  // Resize Settings
  const [aspectLocked, setAspectLocked] = useState(true);
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [scalePercent, setScalePercent] = useState<number>(100);

  // Crop Preset
  const [cropPreset, setCropPreset] = useState<'free' | '1:1' | '4:3' | '16:9' | '3:4' | '9:16' | 'a4'>('free');

  // Transformations
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Export
  const [exportFormat, setExportFormat] = useState<SupportedImageFormat>('image/png');
  const [exportQuality, setExportQuality] = useState(0.92);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);

    const info = await inspectImage(selected);
    setDetails(info);
    setTargetWidth(info.width);
    setTargetHeight(info.height);
    setScalePercent(100);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (aspectLocked && details) {
      setTargetHeight(Math.round(val / details.aspectRatioValue));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (aspectLocked && details) {
      setTargetWidth(Math.round(val * details.aspectRatioValue));
    }
  };

  const handlePercentPreset = (pct: number) => {
    if (!details) return;
    setScalePercent(pct);
    setTargetWidth(Math.round((details.width * pct) / 100));
    setTargetHeight(Math.round((details.height * pct) / 100));
  };

  const applyCropPreset = (preset: typeof cropPreset) => {
    if (!details) return;
    setCropPreset(preset);

    let targetRatio = details.aspectRatioValue;
    if (preset === '1:1') targetRatio = 1;
    if (preset === '4:3') targetRatio = 4 / 3;
    if (preset === '16:9') targetRatio = 16 / 9;
    if (preset === '3:4') targetRatio = 3 / 4;
    if (preset === '9:16') targetRatio = 9 / 16;
    if (preset === 'a4') targetRatio = 1 / 1.4142;

    if (preset !== 'free') {
      const w = details.width;
      const h = Math.round(w / targetRatio);
      setTargetWidth(w);
      setTargetHeight(h);
    }
  };

  // Live preview update
  useEffect(() => {
    if (!file || targetWidth <= 0 || targetHeight <= 0) return;

    let isMounted = true;
    const updatePreview = async () => {
      try {
        const { blob } = await cropAndTransformImage(file, {
          targetWidth,
          targetHeight,
          rotation,
          flipH,
          flipV,
          format: exportFormat,
          quality: exportQuality,
        });

        if (isMounted) {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setPreviewUrl(URL.createObjectURL(blob));
        }
      } catch (err) {
        console.error(err);
      }
    };

    updatePreview();
    return () => {
      isMounted = false;
    };
  }, [file, targetWidth, targetHeight, rotation, flipH, flipV, exportFormat, exportQuality]);

  const handleDownload = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const { blob, width, height } = await cropAndTransformImage(file, {
        targetWidth,
        targetHeight,
        rotation,
        flipH,
        flipV,
        format: exportFormat,
        quality: exportQuality,
      });

      let ext = 'png';
      if (exportFormat === 'image/jpeg') ext = 'jpg';
      if (exportFormat === 'image/webp') ext = 'webp';

      const fileName = `${file.name.replace(/\.[^/.]+$/, '')}-${width}x${height}.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addRecentActivity('image-cropper', 'Crop & Resize Image', file.name, 'completed');
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
            <Crop className="w-3.5 h-3.5" />
            <span>Precision Geometry & Aspect Ratio Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Image Crop & Resize
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Resize by exact pixels or percentages with aspect ratio lock. Crop to social & academic presets (1:1, 16:9, 4:3, A4), rotate, and flip.
          </p>
        </div>

        {file && (
          <button
            onClick={() => {
              setFile(null);
              setPreviewUrl(null);
            }}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Change Image
          </button>
        )}
      </div>

      {!file ? (
        <div className="max-w-2xl mx-auto">
          <FileUploader
            acceptedFormats={['.png', '.jpg', '.jpeg', '.webp', '.bmp']}
            multiple={false}
            maxFiles={1}
            onFilesSelected={handleFileSelect}
            title="Upload photo to crop or resize"
            description="Supports PNG, JPG, WEBP, and BMP. High-fidelity interpolation."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Sidebar (1 col) */}
          <div className="space-y-6">
            {/* Dimensions Control */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Output Dimensions</h3>
                <button
                  onClick={() => setAspectLocked(!aspectLocked)}
                  className={`p-1.5 rounded-lg border flex items-center gap-1 font-bold transition cursor-pointer ${
                    aspectLocked
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                  title="Lock Aspect Ratio"
                >
                  {aspectLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{aspectLocked ? 'Locked' : 'Free'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Width (px):</label>
                  <input
                    type="number"
                    value={targetWidth}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Height (px):</label>
                  <input
                    type="number"
                    value={targetHeight}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Percentage Scaling shortcuts */}
              <div>
                <label className="font-bold block mb-1.5 text-slate-500">Quick Scale %:</label>
                <div className="grid grid-cols-5 gap-1 text-[11px] font-bold">
                  {[25, 50, 75, 100, 150].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handlePercentPreset(pct)}
                      className={`py-1 rounded-lg border transition cursor-pointer ${
                        scalePercent === pct
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Presets Box */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Aspect Ratio Presets</h3>
              <div className="grid grid-cols-3 gap-2 font-bold">
                {[
                  { id: 'free', label: 'Original' },
                  { id: '1:1', label: '1:1 Square' },
                  { id: '16:9', label: '16:9 Landscape' },
                  { id: '4:3', label: '4:3 Standard' },
                  { id: '9:16', label: '9:16 Story/Reel' },
                  { id: 'a4', label: 'A4 Document' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyCropPreset(p.id as any)}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      cropPreset === p.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation & Rotate */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Rotate & Flip</h3>
              <div className="grid grid-cols-4 gap-2 font-bold">
                <button
                  onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center gap-1 cursor-pointer"
                  title="Rotate Counter-Clockwise"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-[10px]">-90°</span>
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center gap-1 cursor-pointer"
                  title="Rotate Clockwise"
                >
                  <RotateCw className="w-4 h-4" />
                  <span className="text-[10px]">+90°</span>
                </button>
                <button
                  onClick={() => setFlipH(!flipH)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition ${
                    flipH ? 'bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700'
                  }`}
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span className="text-[10px]">Flip H</span>
                </button>
                <button
                  onClick={() => setFlipV(!flipV)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition ${
                    flipV ? 'bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700'
                  }`}
                  title="Flip Vertical"
                >
                  <FlipVertical className="w-4 h-4" />
                  <span className="text-[10px]">Flip V</span>
                </button>
              </div>
            </div>

            {/* Export box */}
            <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3 text-xs">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Export Resized Image</h3>
              <div className="grid grid-cols-3 gap-2">
                {(['image/png', 'image/jpeg', 'image/webp'] as SupportedImageFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`p-2 rounded-xl font-bold uppercase text-[11px] border transition cursor-pointer text-center ${
                      exportFormat === fmt
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {fmt.split('/')[1]}
                  </button>
                ))}
              </div>

              <button
                onClick={handleDownload}
                disabled={processing}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download ({targetWidth} × {targetHeight}px)</span>
              </button>
            </div>
          </div>

          {/* Canvas Preview (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">Transformed Preview</span>
                {details && (
                  <span className="text-slate-500 font-mono">
                    Original: {details.width} × {details.height} → Output: {targetWidth} × {targetHeight}
                  </span>
                )}
              </div>

              <div className="min-h-[460px] max-h-[640px] overflow-auto rounded-2xl bg-slate-900 flex items-center justify-center p-4">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Transformed preview"
                    className="max-w-full max-h-[560px] rounded-xl shadow-2xl object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400">Rendering preview...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
