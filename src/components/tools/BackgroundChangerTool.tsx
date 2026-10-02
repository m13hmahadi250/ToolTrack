import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Sparkles,
  Download,
  Image as ImageIcon,
  Move,
  Maximize2,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { removeImageBackground, renderWithBackground } from '../../lib/backgroundRemover';
import { inspectImage } from '../../lib/imageUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

export const BackgroundChangerTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [file, setFile] = useState<File | null>(null);
  const [subjectImageData, setSubjectImageData] = useState<ImageData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  // Background Options
  const [bgMode, setBgMode] = useState<'gradient' | 'color' | 'image' | 'transparent'>('gradient');
  const [solidColor, setSolidColor] = useState('#4f46e5');
  const [gradientPreset, setGradientPreset] = useState({ from: '#1e1b4b', to: '#4338ca', name: 'Deep Indigo' });
  const [bgImageEl, setBgImageEl] = useState<HTMLImageElement | null>(null);

  // Subject transforms
  const [subjectScale, setSubjectScale] = useState(1.0);
  const [subjectOffsetX, setSubjectOffsetX] = useState(0);
  const [subjectOffsetY, setSubjectOffsetY] = useState(0);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Export
  const [exportFormat, setExportFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [exportQuality, setExportQuality] = useState(0.92);
  const [downloading, setDownloading] = useState(false);

  const GRADIENTS = [
    { from: '#4f46e5', to: '#ec4899', name: 'Sunset Glow' },
    { from: '#06b6d4', to: '#3b82f6', name: 'Cyan Wave' },
    { from: '#10b981', to: '#059669', name: 'Emerald Forest' },
    { from: '#8b5cf6', to: '#6366f1', name: 'Violet Studio' },
    { from: '#1e293b', to: '#0f172a', name: 'Dark Pro' },
    { from: '#f8fafc', to: '#cbd5e1', name: 'Studio Gray' },
    { from: '#f59e0b', to: '#ef4444', name: 'Warm Amber' },
    { from: '#0f172a', to: '#334155', name: 'Minimal Slate' },
  ];

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setProcessing(true);
    setProgressMsg('Extracting subject...');

    const jobId = addJob({
      fileName: selected.name,
      fileSize: selected.size,
      toolId: 'image-background-changer',
      toolName: 'Change Background',
      status: 'processing',
      progress: 0.2,
    });

    try {
      const result = await removeImageBackground(selected, {
        sensitivity: 36,
        onProgress: (p: number, stage: string) => {
          setProgressMsg(stage);
          updateJob(jobId, { progress: p });
        },
      });

      setSubjectImageData(result.imageData);
      setSubjectScale(1.0);
      setSubjectOffsetX(0);
      setSubjectOffsetY(0);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
      });
      addRecentActivity('image-background-changer', 'Change Background', selected.name, 'completed');
    } catch (err) {
      console.error(err);
      updateJob(jobId, { status: 'failed', errorMessage: String(err) });
    } finally {
      setProcessing(false);
    }
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !subjectImageData) return;

    const width = subjectImageData.width;
    const height = subjectImageData.height;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background
    if (bgMode === 'color') {
      ctx.fillStyle = solidColor;
      ctx.fillRect(0, 0, width, height);
    } else if (bgMode === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, gradientPreset.from);
      grad.addColorStop(1, gradientPreset.to);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (bgMode === 'image' && bgImageEl) {
      ctx.drawImage(bgImageEl, 0, 0, width, height);
    }

    // 2. Draw Subject with scale and translation
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(subjectImageData, 0, 0);

      ctx.save();
      ctx.translate(width / 2 + subjectOffsetX, height / 2 + subjectOffsetY);
      ctx.scale(subjectScale, subjectScale);
      ctx.drawImage(tempCanvas, -width / 2, -height / 2);
      ctx.restore();
    }
  }, [subjectImageData, bgMode, solidColor, gradientPreset, bgImageEl, subjectScale, subjectOffsetX, subjectOffsetY]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - subjectOffsetX, y: e.clientY - subjectOffsetY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    setSubjectOffsetX(e.clientX - dragStart.current.x);
    setSubjectOffsetY(e.clientY - dragStart.current.y);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleExport = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !file) return;
    setDownloading(true);

    try {
      const blob = await new Promise<Blob>((res) => {
        canvas.toBlob((b) => res(b || new Blob()), exportFormat, exportQuality);
      });

      let ext = 'png';
      if (exportFormat === 'image/jpeg') ext = 'jpg';
      if (exportFormat === 'image/webp') ext = 'webp';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.[^/.]+$/, '')}-newbg.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-xs font-bold mb-2">
            <Palette className="w-3.5 h-3.5" />
            <span>Design Studio • Instant Backdrop Switcher</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Image Background Changer
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Replace the background of any image with vibrant gradients, studio solid colors, or custom backdrops. Reposition and scale subjects with ease.
          </p>
        </div>

        {file && (
          <button
            onClick={() => {
              setFile(null);
              setSubjectImageData(null);
            }}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Select Different Image
          </button>
        )}
      </div>

      {!file && (
        <div className="max-w-2xl mx-auto">
          <FileUploader
            acceptedFormats={['.png', '.jpg', '.jpeg', '.webp', '.bmp']}
            multiple={false}
            maxFiles={1}
            onFilesSelected={handleFiles}
            title="Upload photo to change background"
            description="ToolTrack isolates your subject and places it over your chosen background."
          />
        </div>
      )}

      {file && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Canvas Viewport (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="relative min-h-[460px] max-h-[640px] overflow-auto rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-slate-900 flex items-center justify-center p-4">
              {processing && (
                <div className="absolute inset-0 z-30 bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3">
                  <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                  <p className="font-bold text-sm">{progressMsg}</p>
                </div>
              )}

              <div className="checkerboard-bg rounded-2xl shadow-2xl overflow-hidden border border-slate-700 select-none">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className="max-w-full h-auto block cursor-move"
                  title="Click and drag to reposition subject"
                />
              </div>
            </div>

            {/* Transform Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Move className="w-3.5 h-3.5 text-purple-600" />
                  <span>Subject Scale:</span>
                </span>
                <input
                  type="range"
                  min="0.3"
                  max="2.0"
                  step="0.05"
                  value={subjectScale}
                  onChange={(e) => setSubjectScale(Number(e.target.value))}
                  className="w-36 accent-purple-600 cursor-pointer"
                />
                <span className="font-mono font-bold">{Math.round(subjectScale * 100)}%</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSubjectOffsetX(0);
                    setSubjectOffsetY(0);
                    setSubjectScale(1.0);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition cursor-pointer"
                >
                  Reset Position
                </button>
              </div>
            </div>
          </div>

          {/* Right Control Sidebar */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Choose Backdrop</span>
              </h3>

              {/* Mode switch */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setBgMode('gradient')}
                  className={`p-2.5 rounded-xl font-bold border transition cursor-pointer text-left ${
                    bgMode === 'gradient'
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>Gradient</span>
                </button>
                <button
                  onClick={() => setBgMode('color')}
                  className={`p-2.5 rounded-xl font-bold border transition cursor-pointer text-left ${
                    bgMode === 'color'
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>Solid Color</span>
                </button>
                <button
                  onClick={() => setBgMode('image')}
                  className={`p-2.5 rounded-xl font-bold border transition cursor-pointer text-left ${
                    bgMode === 'image'
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>Custom Image</span>
                </button>
                <button
                  onClick={() => setBgMode('transparent')}
                  className={`p-2.5 rounded-xl font-bold border transition cursor-pointer text-left ${
                    bgMode === 'transparent'
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>Transparent</span>
                </button>
              </div>

              {bgMode === 'gradient' && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {GRADIENTS.map((g, idx) => (
                    <button
                      key={idx}
                      onClick={() => setGradientPreset(g)}
                      className={`p-2 rounded-xl text-left border shadow-xs transition hover:scale-102 cursor-pointer ${
                        gradientPreset.name === g.name
                          ? 'ring-2 ring-purple-600 border-transparent'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div
                        className="h-8 rounded-lg mb-1"
                        style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                      />
                      <span className="text-[11px] font-bold block truncate">{g.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {bgMode === 'color' && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap gap-2">
                    {['#ffffff', '#000000', '#1e293b', '#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setSolidColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${
                          solidColor === c ? 'border-purple-600 scale-110 shadow-sm' : 'border-slate-300 dark:border-slate-700'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Pick:</span>
                    <input
                      type="color"
                      value={solidColor}
                      onChange={(e) => setSolidColor(e.target.value)}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <span className="font-mono font-bold">{solidColor}</span>
                  </div>
                </div>
              )}

              {bgMode === 'image' && (
                <div className="pt-2 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const img = new Image();
                        img.src = URL.createObjectURL(f);
                        img.onload = () => setBgImageEl(img);
                      }
                    }}
                    className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500">
                    Upload an office, studio backdrop, or outdoor background image.
                  </p>
                </div>
              )}
            </div>

            {/* Export box */}
            <div className="p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Export Composite
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Format:
                  </label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="image/png">PNG (Lossless High Quality)</option>
                    <option value="image/jpeg">JPG (Standard Photo)</option>
                    <option value="image/webp">WEBP (Compact Web)</option>
                  </select>
                </div>

                <button
                  onClick={handleExport}
                  disabled={downloading || !subjectImageData}
                  className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Image</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
