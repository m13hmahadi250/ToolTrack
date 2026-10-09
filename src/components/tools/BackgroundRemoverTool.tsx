import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Download,
  Eye,
  Columns,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Paintbrush,
  Eraser,
  Wand2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Palette,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import {
  removeImageBackground,
  applyBrush,
  applyMagicWand,
  renderWithBackground,
  prewarmEngine,
} from '../../lib/backgroundRemover';
import { inspectImage, ImageDetails } from '../../lib/imageUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

export const BackgroundRemoverTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [file, setFile] = useState<File | null>(null);
  const [imageDetails, setImageDetails] = useState<ImageDetails | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressVal, setProgressVal] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelQuality, setModelQuality] = useState<'medium' | 'small' | 'large'>('medium');
  const [executionStats, setExecutionStats] = useState<{
    durationMs: number;
    engineUsed: string;
    provider: string;
  } | null>(null);

  // Pre-warm engine on load
  useEffect(() => {
    prewarmEngine();
  }, []);

  // Segmentation state
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [workingImageData, setWorkingImageData] = useState<ImageData | null>(null);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [methodUsed, setMethodUsed] = useState<'neural-model' | 'edge-saliency' | 'server-gpu' | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side' | 'result'>('split');
  const [splitPos, setSplitPos] = useState(50);
  const [zoom, setZoom] = useState(1);

  // Background options for preview/export
  const [bgType, setBgType] = useState<'transparent' | 'color' | 'gradient' | 'image'>('transparent');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgGradient, setBgGradient] = useState<{ from: string; to: string }>({ from: '#4f46e5', to: '#ec4899' });
  const [bgImageEl, setBgImageEl] = useState<HTMLImageElement | null>(null);

  // Interactive Touch-Up Studio
  const [activeTool, setActiveTool] = useState<'none' | 'brush' | 'eraser' | 'wand'>('none');
  const [brushRadius, setBrushRadius] = useState(20);
  const [wandTolerance, setWandTolerance] = useState(32);
  const [sensitivity, setSensitivity] = useState(36);
  const [edgeFeather, setEdgeFeather] = useState(2);

  // Export Settings
  const [exportFormat, setExportFormat] = useState<'image/png' | 'image/webp' | 'image/jpeg'>('image/png');
  const [exportQuality, setExportQuality] = useState(0.95);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [exporting, setExporting] = useState(false);

  // Canvases
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const origCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDragging = useRef(false);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setWorkingImageData(null);
    setOriginalImageData(null);
    setUndoStack([]);
    setExportedBlob(null);

    const details = await inspectImage(selected);
    setImageDetails(details);
    runAutoSegmentation(selected, sensitivity, edgeFeather);
  };

  const runAutoSegmentation = async (targetFile: File, sens: number, feather: number) => {
    setProcessing(true);
    setProgressVal(0.15);
    setProgressMsg('Analyzing subject & segmenting...');

    const jobId = addJob({
      fileName: targetFile.name,
      fileSize: targetFile.size,
      toolId: 'image-background-remover',
      toolName: 'Remove Background',
      status: 'processing',
      progress: 0.15,
    });

    try {
      // Create original image data
      const img = new Image();
      const url = URL.createObjectURL(targetFile);
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = rej;
        img.src = url;
      });
      URL.revokeObjectURL(url);

      const offCanvas = document.createElement('canvas');
      offCanvas.width = img.naturalWidth;
      offCanvas.height = img.naturalHeight;
      const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
      if (!offCtx) throw new Error('Canvas not supported');
      offCtx.drawImage(img, 0, 0);
      const origData = offCtx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
      setOriginalImageData(origData);

      const result = await removeImageBackground(targetFile, {
        modelQuality,
        sensitivity: sens,
        edgeFeather: feather,
        onProgress: (p: number, stage: string) => {
          setProgressVal(p);
          setProgressMsg(stage);
          updateJob(jobId, { progress: p });
        },
      });

      setWorkingImageData(result.imageData);
      setMethodUsed(result.methodUsed);
      setExecutionStats({
        durationMs: result.durationMs,
        engineUsed: result.engineUsed,
        provider: result.provider,
      });

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputFileName: targetFile.name.replace(/\.[^/.]+$/, '') + '-transparent.png',
        outputBlob: result.transparentBlob,
        outputSize: result.transparentBlob.size,
      });

      addRecentActivity(
        'image-background-remover',
        'Remove Background',
        targetFile.name,
        'completed'
      );
    } catch (err: unknown) {
      console.error('Segmentation error:', err);
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const msg = isOffline
        ? 'Background removal neural models could not load while offline. Connect to the internet once to cache the model weights in your browser for offline use.'
        : `Background removal failed: ${String(err)}`;
      setErrorMessage(msg);
      updateJob(jobId, {
        status: 'failed',
        errorMessage: msg,
      });
    } finally {
      setProcessing(false);
    }
  };

  // Render working ImageData to canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !workingImageData) return;

    canvas.width = workingImageData.width;
    canvas.height = workingImageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If a background other than transparent is selected, draw it
    if (bgType === 'color') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (bgType === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, bgGradient.from);
      grad.addColorStop(1, bgGradient.to);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (bgType === 'image' && bgImageEl) {
      ctx.drawImage(bgImageEl, 0, 0, canvas.width, canvas.height);
    }

    // Put transparent subject
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = workingImageData.width;
    tempCanvas.height = workingImageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(workingImageData, 0, 0);
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }, [workingImageData, bgType, bgColor, bgGradient, bgImageEl]);

  // Render original canvas for split view and side-by-side view
  const renderOriginalCanvas = useCallback(() => {
    const canvas = origCanvasRef.current;
    if (!canvas || !originalImageData) return;
    canvas.width = originalImageData.width;
    canvas.height = originalImageData.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(originalImageData, 0, 0);
    }
  }, [originalImageData]);

  // Keep both canvases rendered and synchronized across all view modes (split, side-by-side, result)
  useEffect(() => {
    renderCanvas();
    renderOriginalCanvas();

    const raf = requestAnimationFrame(() => {
      renderCanvas();
      renderOriginalCanvas();
    });
    return () => cancelAnimationFrame(raf);
  }, [viewMode, renderCanvas, renderOriginalCanvas]);

  // Interactive brush & wand
  const saveUndoState = () => {
    if (!workingImageData) return;
    const copy = new ImageData(
      new Uint8ClampedArray(workingImageData.data),
      workingImageData.width,
      workingImageData.height
    );
    setUndoStack((prev) => [...prev.slice(-9), copy]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((old) => old.slice(0, old.length - 1));
    setWorkingImageData(prev);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'none' || !workingImageData || !originalImageData) return;
    saveUndoState();
    isDragging.current = true;
    handleCanvasStroke(e);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current || activeTool === 'none' || activeTool === 'wand') return;
    handleCanvasStroke(e);
  };

  const handleCanvasMouseUp = () => {
    isDragging.current = false;
  };

  const handleCanvasStroke = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !workingImageData || !originalImageData) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return;

    if (activeTool === 'eraser') {
      applyBrush(workingImageData, originalImageData, x, y, brushRadius, 'erase');
      renderCanvas();
    } else if (activeTool === 'brush') {
      applyBrush(workingImageData, originalImageData, x, y, brushRadius, 'restore');
      renderCanvas();
    } else if (activeTool === 'wand') {
      applyMagicWand(workingImageData, x, y, wandTolerance);
      renderCanvas();
    }
  };

  const handleExport = async () => {
    if (!workingImageData || !file) return;
    setExporting(true);

    try {
      const blob = await renderWithBackground(
        workingImageData,
        {
          type: bgType,
          color: bgColor,
          gradient: bgGradient,
          imageElement: bgImageEl || undefined,
        },
        exportFormat,
        exportQuality
      );

      setExportedBlob(blob);

      let ext = 'png';
      if (exportFormat === 'image/webp') ext = 'webp';
      if (exportFormat === 'image/jpeg') ext = 'jpg';

      const fileName = file.name.replace(/\.[^/.]+$/, '') + `-nobg.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Remove Image Background
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Automatically detect subjects and extract genuine transparent PNGs with full alpha channel. Never flattens or bakes fake backgrounds.
          </p>
        </div>

        {file && (
          <button
            onClick={() => {
              setFile(null);
              setWorkingImageData(null);
              setOriginalImageData(null);
              setExportedBlob(null);
            }}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Upload Different Image
          </button>
        )}
      </div>

      {!file && (
        <div className="max-w-2xl mx-auto space-y-4">
          <FileUploader
            acceptedFormats={['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.svg']}
            multiple={false}
            maxFiles={1}
            onFilesSelected={handleFileSelect}
            title="Upload any photo, portrait, logo, or product image"
            description="Supports PNG, JPG, WEBP, and BMP. High-fidelity subject extraction with zero quality compromise."
          />
        </div>
      )}

      {file && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Canvas View (3 Cols on Desktop) */}
          <div className="lg:col-span-3 space-y-4">
            {/* View Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs">
              {/* View Mode Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    viewMode === 'split'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/60'
                  }`}
                  aria-pressed={viewMode === 'split'}
                  title="Interactive Before / After Split Slider"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Before / After Split</span>
                </button>
                <button
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    viewMode === 'side-by-side'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/60'
                  }`}
                  aria-pressed={viewMode === 'side-by-side'}
                  title="Side-by-Side Comparison View"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Side-by-Side</span>
                </button>
                <button
                  onClick={() => setViewMode('result')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    viewMode === 'result'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/60'
                  }`}
                  aria-pressed={viewMode === 'result'}
                  title="Isolated Result View"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Result Only</span>
                </button>
              </div>

              {/* Speed Benchmark Metric */}
              {executionStats && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-850 text-emerald-700 dark:text-emerald-300 font-semibold text-xs animate-in fade-in duration-200">
                  <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                  <span>{(executionStats.durationMs / 1000).toFixed(2)}s • {executionStats.provider}</span>
                </div>
              )}

              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Fit to Screen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Canvas Viewport */}
            <div className="relative min-h-[460px] max-h-[640px] overflow-auto rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
              {errorMessage && !processing && (
                <div className="absolute inset-x-6 top-6 z-20 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 backdrop-blur-md">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-200">Processing Notice</p>
                    <p className="leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              {processing && (
                <div className="absolute inset-0 z-30 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3.5 px-6 text-center animate-in fade-in duration-200">
                  <div className="relative">
                    <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-sm tracking-wide">{progressMsg}</p>
                    <p className="text-xs text-slate-300">Processing image, please wait...</p>
                  </div>

                  <div className="w-52 bg-slate-700/80 h-2 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300"
                      style={{ width: `${Math.round(progressVal * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* View Modes */}
              {viewMode === 'split' && (
                <div
                  className="relative select-none max-w-full"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                >
                  {/* Result Canvas over genuine checkerboard */}
                  <div className="checkerboard-bg rounded-2xl shadow-xl overflow-hidden border border-slate-300 dark:border-slate-700">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      className={`max-w-full h-auto block ${
                        activeTool !== 'none' ? 'cursor-crosshair' : 'cursor-default'
                      }`}
                    />
                  </div>

                  {/* Original Image Clipped overlay */}
                  <div
                    className="absolute top-0 left-0 h-full overflow-hidden rounded-2xl pointer-events-none"
                    style={{ width: `${splitPos}%`, borderRight: '2px solid #6366f1' }}
                  >
                    <canvas ref={origCanvasRef} className="max-w-none h-full block" />
                  </div>

                  {/* Split Draggable Slider */}
                  <div
                    className="absolute top-0 bottom-0 z-20 w-8 -ml-4 flex items-center justify-center cursor-ew-resize"
                    style={{ left: `${splitPos}%` }}
                    onMouseDown={(e) => {
                      const startX = e.clientX;
                      const initialPos = splitPos;
                      const parent = (e.currentTarget.parentElement as HTMLElement)?.getBoundingClientRect();
                      const onMove = (moveEvt: MouseEvent) => {
                        if (!parent) return;
                        const delta = moveEvt.clientX - startX;
                        const newPercent = Math.max(5, Math.min(95, initialPos + (delta / parent.width) * 100));
                        setSplitPos(newPercent);
                      };
                      const onUp = () => {
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                      };
                      window.addEventListener('mousemove', onMove);
                      window.addEventListener('mouseup', onUp);
                    }}
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center text-[10px] font-bold">
                      ↔
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'side-by-side' && (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-full w-full"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                >
                  <div className="space-y-1.5 text-center">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Original Image
                    </span>
                    <div className="rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md p-1">
                      <canvas ref={origCanvasRef} className="max-w-full h-auto block mx-auto rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-center">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                      Extracted Cutout (Transparent)
                    </span>
                    <div className="checkerboard-bg rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-md p-1">
                      <canvas
                        ref={canvasRef}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        className={`max-w-full h-auto block mx-auto rounded-xl ${
                          activeTool !== 'none' ? 'cursor-crosshair' : 'cursor-default'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'result' && (
                <div
                  className="checkerboard-bg rounded-2xl shadow-xl overflow-hidden border border-slate-300 dark:border-slate-700 max-w-full p-1"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                >
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    className={`max-w-full h-auto block mx-auto rounded-xl ${
                      activeTool !== 'none' ? 'cursor-crosshair' : 'cursor-default'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Manual Refine Studio Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Refine Tools:</span>
                  <button
                    onClick={() => setActiveTool(activeTool === 'brush' ? 'none' : 'brush')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      activeTool === 'brush'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Paintbrush className="w-3.5 h-3.5" />
                    <span>Restore Brush</span>
                  </button>
                  <button
                    onClick={() => setActiveTool(activeTool === 'eraser' ? 'none' : 'eraser')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      activeTool === 'eraser'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Eraser</span>
                  </button>
                  <button
                    onClick={() => setActiveTool(activeTool === 'wand' ? 'none' : 'wand')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      activeTool === 'wand'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Magic Wand</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </button>
                  <button
                    onClick={() => {
                      if (file) runAutoSegmentation(file, sensitivity, edgeFeather);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-detect</span>
                  </button>
                </div>
              </div>

              {/* Sliders when tools are active */}
              {(activeTool === 'brush' || activeTool === 'eraser') && (
                <div className="flex items-center gap-4 text-xs pt-1">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Brush Size:</span>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={brushRadius}
                    onChange={(e) => setBrushRadius(Number(e.target.value))}
                    className="flex-1 accent-indigo-600 cursor-pointer"
                  />
                  <span className="font-mono font-bold w-10 text-right">{brushRadius}px</span>
                </div>
              )}

              {activeTool === 'wand' && (
                <div className="flex items-center gap-4 text-xs pt-1">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Wand Tolerance:</span>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={wandTolerance}
                    onChange={(e) => setWandTolerance(Number(e.target.value))}
                    className="flex-1 accent-amber-600 cursor-pointer"
                  />
                  <span className="font-mono font-bold w-10 text-right">{wandTolerance}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Settings & Export (1 Col on Desktop) */}
          <div className="space-y-6">
            {/* Speed & AI Quality Mode */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Processing Speed & Engine</span>
                </h3>
                {executionStats && (
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {(executionStats.durationMs / 1000).toFixed(2)}s
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  onClick={() => {
                    setModelQuality('small');
                    if (file) runAutoSegmentation(file, sensitivity, edgeFeather);
                  }}
                  className={`p-2 rounded-xl text-center border font-bold transition cursor-pointer ${
                    modelQuality === 'small'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="block text-[11px]">Instant</span>
                  <span className="block text-[9px] text-slate-500 font-normal">&lt; 1 sec</span>
                </button>
                <button
                  onClick={() => {
                    setModelQuality('medium');
                    if (file) runAutoSegmentation(file, sensitivity, edgeFeather);
                  }}
                  className={`p-2 rounded-xl text-center border font-bold transition cursor-pointer ${
                    modelQuality === 'medium'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="block text-[11px]">Balanced</span>
                  <span className="block text-[9px] text-slate-500 font-normal">~1-2s (Default)</span>
                </button>
                <button
                  onClick={() => {
                    setModelQuality('large');
                    if (file) runAutoSegmentation(file, sensitivity, edgeFeather);
                  }}
                  className={`p-2 rounded-xl text-center border font-bold transition cursor-pointer ${
                    modelQuality === 'large'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="block text-[11px]">Studio Hair</span>
                  <span className="block text-[9px] text-slate-500 font-normal">Deep Matting</span>
                </button>
              </div>
            </div>

            {/* Background Selector */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                <span>Background Choice</span>
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setBgType('transparent')}
                  className={`p-2.5 rounded-xl font-bold border transition cursor-pointer text-left ${
                    bgType === 'transparent'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>Transparent</span>
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">True Alpha PNG</span>
                </button>
                <button
                  onClick={() => setBgType('color')}
                  className={`p-2.5 rounded-xl font-bold border transition cursor-pointer text-left ${
                    bgType === 'color'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>Solid Color</span>
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">White, Black, etc.</span>
                </button>
                <button
                  onClick={() => setBgType('gradient')}
                  className={`p-2.5 rounded-xl font-bold border transition cursor-pointer text-left ${
                    bgType === 'gradient'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>Gradient</span>
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Modern multi-color</span>
                </button>
                <button
                  onClick={() => setBgType('image')}
                  className={`p-2.5 rounded-xl font-bold border transition cursor-pointer text-left ${
                    bgType === 'image'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>Custom Image</span>
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Studio backdrop</span>
                </button>
              </div>

              {bgType === 'color' && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    {['#ffffff', '#000000', '#f1f5f9', '#4f46e5', '#10b981', '#f59e0b', '#ec4899'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setBgColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${
                          bgColor === c ? 'border-indigo-600 scale-110 shadow-sm' : 'border-slate-300 dark:border-slate-700'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Custom:</span>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{bgColor}</span>
                  </div>
                </div>
              )}

              {bgType === 'gradient' && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[
                    { from: '#4f46e5', to: '#ec4899', name: 'Sunset' },
                    { from: '#06b6d4', to: '#3b82f6', name: 'Ocean' },
                    { from: '#10b981', to: '#059669', name: 'Emerald' },
                    { from: '#8b5cf6', to: '#6366f1', name: 'Violet' },
                    { from: '#1e293b', to: '#0f172a', name: 'Dark Pro' },
                    { from: '#f8fafc', to: '#e2e8f0', name: 'Clean Light' },
                  ].map((grad, i) => (
                    <button
                      key={i}
                      onClick={() => setBgGradient({ from: grad.from, to: grad.to })}
                      className="h-10 rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs hover:scale-105 transition cursor-pointer"
                      style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
                      title={grad.name}
                    />
                  ))}
                </div>
              )}

              {bgType === 'image' && (
                <div className="pt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const bgF = e.target.files?.[0];
                      if (bgF) {
                        const img = new Image();
                        img.src = URL.createObjectURL(bgF);
                        img.onload = () => setBgImageEl(img);
                      }
                    }}
                    className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Quality & Detection Options */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Detection & Contours</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                    <span>Color Sensitivity:</span>
                    <span className="font-mono">{sensitivity}</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="80"
                    value={sensitivity}
                    onChange={(e) => setSensitivity(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer mt-1"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                    <span>Edge Feathering:</span>
                    <span className="font-mono">{edgeFeather}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    value={edgeFeather}
                    onChange={(e) => setEdgeFeather(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer mt-1"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Smooths alpha transition to prevent jagged edges.
                  </span>
                </div>
              </div>
            </div>

            {/* Image Specs */}
            {imageDetails && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Dimensions:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {imageDetails.width} × {imageDetails.height} px
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Aspect Ratio:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {imageDetails.aspectRatio}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Original Size:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {(imageDetails.sizeBytes / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Engine Used:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {methodUsed === 'neural-model' ? 'AI Neural Mask' : 'Edge-Saliency'}
                  </span>
                </div>
              </div>
            )}

            {/* Export & Download Box */}
            <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Export Result
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Output Format:
                  </label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="image/png">PNG (Preserves Genuine Transparency)</option>
                    <option value="image/webp">WEBP (Transparent & Modern)</option>
                    <option value="image/jpeg">JPG (No Transparency - Fills Background)</option>
                  </select>
                </div>

                {exportFormat === 'image/jpeg' && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <span>JPG cannot store transparency. The background will be filled with your selected color.</span>
                  </div>
                )}

                <button
                  onClick={handleExport}
                  disabled={exporting || !workingImageData}
                  className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {exportFormat.split('/')[1].toUpperCase()}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
