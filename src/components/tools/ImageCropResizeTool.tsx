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
  Maximize2,
  Sparkles,
  Zap,
  Printer,
  Check,
  RefreshCw,
  Palette
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { cropAndTransformImage, inspectImage, ImageDetails, SupportedImageFormat } from '../../lib/imageUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

export const ImageCropResizeTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [file, setFile] = useState<File | null>(null);
  const [details, setDetails] = useState<ImageDetails | null>(null);

  // Active sub-mode
  const [activeMode, setActiveMode] = useState<'resize' | 'crop' | 'transform'>('resize');

  // Resize Settings
  const [aspectLocked, setAspectLocked] = useState(true);
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [scalePercent, setScalePercent] = useState<number>(100);
  const [dpi, setDpi] = useState<number>(300);

  // Crop Preset & Coordinates
  const [cropPreset, setCropPreset] = useState<string>('free');
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Transformations
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [sharpen, setSharpen] = useState<'none' | 'mild' | 'medium' | 'strong'>('none');

  // Export Settings
  const [exportFormat, setExportFormat] = useState<SupportedImageFormat>('image/png');
  const [exportQuality, setExportQuality] = useState(0.92);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');

  // Result & Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [actualDimensions, setActualDimensions] = useState<{ width: number; height: number } | null>(null);
  const [processing, setProcessing] = useState(false);

  const processingVersionRef = useRef(0);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setOutputBlob(null);
    setOutputSize(null);
    setActualDimensions(null);

    const info = await inspectImage(selected);
    setDetails(info);
    setTargetWidth(info.width);
    setTargetHeight(info.height);
    setScalePercent(100);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCropPreset('free');
    setCropBox({ x: 0, y: 0, width: info.width, height: info.height });

    // Detect format default
    if (info.format.includes('png')) setExportFormat('image/png');
    else if (info.format.includes('webp')) setExportFormat('image/webp');
    else setExportFormat('image/jpeg');
  };

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (aspectLocked && details && details.aspectRatioValue > 0) {
      setTargetHeight(Math.max(1, Math.round(val / details.aspectRatioValue)));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (aspectLocked && details && details.aspectRatioValue > 0) {
      setTargetWidth(Math.max(1, Math.round(val * details.aspectRatioValue)));
    }
  };

  const handlePercentPreset = (pct: number) => {
    if (!details) return;
    setScalePercent(pct);
    const w = Math.max(1, Math.round((details.width * pct) / 100));
    const h = Math.max(1, Math.round((details.height * pct) / 100));
    setTargetWidth(w);
    setTargetHeight(h);
  };

  const handleDimensionPreset = (w: number, h?: number) => {
    if (!details) return;
    if (h) {
      setTargetWidth(w);
      setTargetHeight(h);
    } else {
      setTargetWidth(w);
      if (aspectLocked) {
        setTargetHeight(Math.max(1, Math.round(w / details.aspectRatioValue)));
      }
    }
  };

  const applyCropPreset = (preset: string) => {
    if (!details) return;
    setCropPreset(preset);

    let targetRatio = details.aspectRatioValue;
    if (preset === '1:1') targetRatio = 1;
    else if (preset === '4:3') targetRatio = 4 / 3;
    else if (preset === '16:9') targetRatio = 16 / 9;
    else if (preset === '3:4') targetRatio = 3 / 4;
    else if (preset === '9:16') targetRatio = 9 / 16;
    else if (preset === '3:2') targetRatio = 3 / 2;
    else if (preset === '2:3') targetRatio = 2 / 3;
    else if (preset === 'a4') targetRatio = 1 / 1.4142;
    else if (preset === 'youtube-thumb') targetRatio = 16 / 9;
    else if (preset === 'ig-story') targetRatio = 9 / 16;
    else if (preset === 'fb-cover') targetRatio = 820 / 312;

    if (preset !== 'free') {
      const origW = details.width;
      const origH = details.height;
      let newW = origW;
      let newH = Math.round(origW / targetRatio);

      if (newH > origH) {
        newH = origH;
        newW = Math.round(origH * targetRatio);
      }

      const x = Math.round((origW - newW) / 2);
      const y = Math.round((origH - newH) / 2);

      setCropBox({ x, y, width: newW, height: newH });
      setTargetWidth(newW);
      setTargetHeight(newH);
    } else {
      setCropBox({ x: 0, y: 0, width: details.width, height: details.height });
      setTargetWidth(details.width);
      setTargetHeight(details.height);
    }
  };

  // Reprocess from original file whenever any parameter changes
  useEffect(() => {
    if (!file || targetWidth <= 0 || targetHeight <= 0) return;

    setProcessing(true);
    processingVersionRef.current += 1;
    const currentVersion = processingVersionRef.current;

    const timer = setTimeout(async () => {
      try {
        const { blob, width, height } = await cropAndTransformImage(file, {
          cropArea: cropBox.width > 0 ? cropBox : undefined,
          targetWidth,
          targetHeight,
          rotation,
          flipH,
          flipV,
          sharpen,
          dpi,
          format: exportFormat,
          quality: exportQuality,
          backgroundColor,
        });

        if (processingVersionRef.current === currentVersion) {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          const newUrl = URL.createObjectURL(blob);
          setPreviewUrl(newUrl);
          setOutputBlob(blob);
          setOutputSize(blob.size);
          setActualDimensions({ width, height });
          setProcessing(false);
        }
      } catch (err) {
        console.error(err);
        if (processingVersionRef.current === currentVersion) {
          setProcessing(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [
    file,
    targetWidth,
    targetHeight,
    cropBox,
    rotation,
    flipH,
    flipV,
    sharpen,
    dpi,
    exportFormat,
    exportQuality,
    backgroundColor,
  ]);

  const handleDownload = () => {
    if (!file || !outputBlob) return;

    let ext = 'png';
    if (exportFormat === 'image/jpeg') ext = 'jpg';
    if (exportFormat === 'image/webp') ext = 'webp';
    if (exportFormat === 'image/bmp') ext = 'bmp';

    const width = actualDimensions?.width || targetWidth;
    const height = actualDimensions?.height || targetHeight;
    const fileName = `${file.name.replace(/\.[^/.]+$/, '')}-${width}x${height}.${ext}`;

    const url = URL.createObjectURL(outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addRecentActivity('image-cropper', 'Crop & Resize Image', file.name, 'completed');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
            <Crop className="w-3.5 h-3.5" />
            <span>Precision Geometry & Format Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Image Crop & Resize Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Resize by exact pixels, percentage, or social presets with locked aspect ratio. Crop, rotate, flip, adjust DPI resolution, apply sharpening, and export to PNG, JPEG, or WebP.
          </p>
        </div>

        {file && (
          <button
            onClick={() => {
              setFile(null);
              setPreviewUrl(null);
              setOutputBlob(null);
            }}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Change Image
          </button>
        )}
      </div>

      {!file ? (
        <FileUploader
          acceptedFormats={['.png', '.jpg', '.jpeg', '.webp', '.bmp']}
          maxFiles={1}
          onFilesSelected={handleFileSelect}
          title="Drop image here to crop & resize"
          description="Supports PNG, JPG, JPEG, WEBP, BMP"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Controls Panel */}
          <div className="lg:col-span-6 space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            {/* Sub-mode Navigation */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setActiveMode('resize')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  activeMode === 'resize' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Resize & Scaling
              </button>
              <button
                onClick={() => setActiveMode('crop')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  activeMode === 'crop' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Crop & Presets
              </button>
              <button
                onClick={() => setActiveMode('transform')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  activeMode === 'transform' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Transform & Filters
              </button>
            </div>

            {/* Mode 1: Resize & Scaling */}
            {activeMode === 'resize' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Target Dimensions (Pixels)
                  </span>
                  <button
                    onClick={() => setAspectLocked(!aspectLocked)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      aspectLocked
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {aspectLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{aspectLocked ? 'Aspect Ratio Locked' : 'Unlocked'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Width (px)</label>
                    <input
                      type="number"
                      value={targetWidth || ''}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Height (px)</label>
                    <input
                      type="number"
                      value={targetHeight || ''}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold"
                    />
                  </div>
                </div>

                {/* Percentage Quick Scaling */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Percentage Scaling: {scalePercent}%
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[25, 50, 75, 100, 150].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => handlePercentPreset(pct)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                          scalePercent === pct
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Standard Dimension Presets */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Standard Presets
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'HD 720p', w: 1280, h: 720 },
                      { label: 'FHD 1080p', w: 1920, h: 1080 },
                      { label: '2K 1440p', w: 2560, h: 1440 },
                      { label: '4K UHD', w: 3840, h: 2160 },
                      { label: 'Avatar 500px', w: 500, h: 500 },
                      { label: 'Thumb 640px', w: 640 },
                      { label: 'Web 1080px', w: 1080 },
                      { label: 'Print 2048px', w: 2048 },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleDimensionPreset(p.w, p.h)}
                        className="py-1.5 px-2 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 truncate text-center"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Crop & Presets */}
            {activeMode === 'crop' && (
              <div className="space-y-5">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Aspect Ratio & Platform Presets
                </span>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'free', label: 'Free / Full' },
                    { id: '1:1', label: '1:1 Square' },
                    { id: '16:9', label: '16:9 Landscape' },
                    { id: '4:3', label: '4:3 Standard' },
                    { id: '3:2', label: '3:2 Classic' },
                    { id: '9:16', label: '9:16 Reel/Story' },
                    { id: '3:4', label: '3:4 Portrait' },
                    { id: 'a4', label: 'A4 Document' },
                    { id: 'youtube-thumb', label: 'YouTube (16:9)' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyCropPreset(preset.id)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition ${
                        cropPreset === preset.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex justify-between">
                  <span>Crop Box:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {cropBox.width} × {cropBox.height} px (Offset: X={cropBox.x}, Y={cropBox.y})
                  </span>
                </div>
              </div>
            )}

            {/* Mode 3: Transform & Filters */}
            {activeMode === 'transform' && (
              <div className="space-y-5">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Rotation & Pixel Orientation
                </span>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    <RotateCw className="w-4 h-4 text-indigo-500" />
                    <span>Rotate +90°</span>
                  </button>

                  <button
                    onClick={() => setRotation((r) => (r + 180) % 360)}
                    className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    <RefreshCw className="w-4 h-4 text-indigo-500" />
                    <span>Rotate 180°</span>
                  </button>

                  <button
                    onClick={() => setFlipH(!flipH)}
                    className={`py-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition ${
                      flipH
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FlipHorizontal className="w-4 h-4" />
                    <span>Flip Horizontal</span>
                  </button>

                  <button
                    onClick={() => setFlipV(!flipV)}
                    className={`py-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition ${
                      flipV
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FlipVertical className="w-4 h-4" />
                    <span>Flip Vertical</span>
                  </button>
                </div>

                {/* Sharpening */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Sharpening & Resampling Filter
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['none', 'mild', 'medium', 'strong'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setSharpen(lvl)}
                        className={`py-2 text-xs font-bold rounded-xl border capitalize transition ${
                          sharpen === lvl
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DPI Setting */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Print DPI / Resolution Metadata
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[72, 96, 150, 300].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDpi(d)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                          dpi === d
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {d} DPI
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Export Format & Quality */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Export Format & Encoder Quality
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'image/png', label: 'PNG (Lossless)' },
                  { id: 'image/jpeg', label: 'JPEG (Photo)' },
                  { id: 'image/webp', label: 'WebP (Modern)' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setExportFormat(fmt.id as SupportedImageFormat)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition ${
                      exportFormat === fmt.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              {exportFormat !== 'image/png' && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Quality:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.round(exportQuality * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={exportQuality}
                    onChange={(e) => setExportQuality(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              )}

              {exportFormat === 'image/jpeg' && details?.hasTransparency && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2 text-xs">
                  <p className="text-amber-800 dark:text-amber-300 font-semibold">
                    JPEG does not support transparency. Select background matte:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <span className="text-slate-600 dark:text-slate-400 font-mono">{backgroundColor}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Live Preview Panel */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Live Processed Output
                </span>
                {processing && (
                  <span className="text-xs text-indigo-500 flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                )}
              </div>

              {/* Preview Container */}
              <div className="w-full aspect-[4/3] bg-slate-900/10 dark:bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-2 relative shadow-inner">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Processed Preview"
                    className="max-w-full max-h-full object-contain rounded shadow transition-all duration-200"
                  />
                ) : (
                  <div className="text-center text-slate-400 text-xs">Rendering preview...</div>
                )}
              </div>

              {/* Comparison Stats Bar */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Original File:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {details?.width} × {details?.height} px
                  </p>
                  <p className="text-slate-500">{details ? `${(details.sizeBytes / 1024).toFixed(1)} KB` : ''}</p>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Output File:</span>
                  <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {actualDimensions ? `${actualDimensions.width} × ${actualDimensions.height} px` : `${targetWidth} × ${targetHeight} px`}
                  </p>
                  <p className="text-slate-500">{outputSize ? `${(outputSize / 1024).toFixed(1)} KB` : 'Calculating...'}</p>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={processing || !outputBlob}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Processed Image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
