import React, { useState, useRef, useEffect } from 'react';
import {
  Pipette,
  Copy,
  Check,
  Palette,
  Sparkles,
  Layers,
  ZoomIn
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { inspectImage, ImageDetails } from '../../lib/imageUtils';

export const ColorPickerTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [details, setDetails] = useState<ImageDetails | null>(null);

  const [currentColor, setCurrentColor] = useState<{
    hex: string;
    rgb: string;
    hsl: string;
    r: number;
    g: number;
    b: number;
  }>({
    hex: '#4F46E5',
    rgb: 'rgb(79, 70, 229)',
    hsl: 'hsl(243, 75%, 59%)',
    r: 79,
    g: 70,
    b: 229,
  });

  const [pickedHistory, setPickedHistory] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Loupe magnifier state
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    const info = await inspectImage(selected);
    setDetails(info);

    const img = new Image();
    img.src = URL.createObjectURL(selected);
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) ctx.drawImage(img, 0, 0);
    };
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  const sampleColorAt = (e: React.MouseEvent<HTMLCanvasElement>, saveToHistory = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const px = Math.floor((e.clientX - rect.left) * scaleX);
    const py = Math.floor((e.clientY - rect.top) * scaleY);

    if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const pixel = ctx.getImageData(px, py, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];

    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    const rgb = `rgb(${r}, ${g}, ${b})`;
    const hsl = rgbToHsl(r, g, b);

    setCurrentColor({ hex, rgb, hsl, r, g, b });

    if (saveToHistory) {
      setPickedHistory((prev) => [hex, ...prev.filter((c) => c !== hex).slice(0, 11)]);
    }

    // Update 5x Loupe Magnifier
    const loupe = loupeCanvasRef.current;
    if (loupe) {
      loupe.width = 120;
      loupe.height = 120;
      const lCtx = loupe.getContext('2d');
      if (lCtx) {
        lCtx.imageSmoothingEnabled = false;
        lCtx.clearRect(0, 0, 120, 120);

        // Draw 15x15 pixel region scaled up
        const sampleSize = 15;
        lCtx.drawImage(
          canvas,
          px - Math.floor(sampleSize / 2),
          py - Math.floor(sampleSize / 2),
          sampleSize,
          sampleSize,
          0,
          0,
          120,
          120
        );

        // Center reticle
        lCtx.strokeStyle = '#ffffff';
        lCtx.lineWidth = 2;
        lCtx.strokeRect(56, 56, 8, 8);
        lCtx.strokeStyle = '#000000';
        lCtx.lineWidth = 1;
        lCtx.strokeRect(55, 55, 10, 10);
      }
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
            <Pipette className="w-3.5 h-3.5" />
            <span>5x Zoom Eyedropper & Palette Extractor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Image Color Picker
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Sample precise pixel colors from any uploaded image with real-time loupe magnification. One-click copy HEX, RGB, and HSL values.
          </p>
        </div>

        {file && (
          <button
            onClick={() => {
              setFile(null);
              setPickedHistory([]);
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
            acceptedFormats={['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.svg']}
            multiple={false}
            maxFiles={1}
            onFilesSelected={handleFileSelect}
            title="Upload photo to pick colors"
            description="Hover and click any pixel to sample its color code."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interactive Image Viewport (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Pipette className="w-4 h-4 text-emerald-600" />
                <span>Move cursor to sample, click to save swatch</span>
              </span>
              {details && (
                <span className="font-mono text-slate-500">
                  {details.width} × {details.height} px
                </span>
              )}
            </div>

            <div className="relative min-h-[440px] max-h-[620px] overflow-auto rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-slate-900 flex items-center justify-center p-4">
              <canvas
                ref={canvasRef}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onMouseMove={(e) => {
                  setCursorPos({ x: e.clientX, y: e.clientY });
                  sampleColorAt(e, false);
                }}
                onClick={(e) => sampleColorAt(e, true)}
                className="max-w-full h-auto block cursor-crosshair rounded-xl shadow-2xl"
              />
            </div>
          </div>

          {/* Right: Color Inspector & Palette (1 col) */}
          <div className="space-y-6">
            {/* Color Swatch Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl shadow-md border-2 border-slate-200 dark:border-slate-700 shrink-0"
                  style={{ backgroundColor: currentColor.hex }}
                />
                <div>
                  <h3 className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
                    {currentColor.hex}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Active Sample</p>
                </div>
              </div>

              {/* 5x Magnifier Loupe */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <canvas
                  ref={loupeCanvasRef}
                  className="w-20 h-20 rounded-xl shadow-inner border border-slate-300 dark:border-slate-600 block shrink-0"
                />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5 text-emerald-600" />
                    <span>5x Pixel Loupe</span>
                  </span>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Shows individual pixel grid around the pointer for microscopic accuracy.
                  </p>
                </div>
              </div>

              {/* Format copy list */}
              <div className="space-y-2 text-xs">
                {[
                  { key: 'hex', label: 'HEX', val: currentColor.hex },
                  { key: 'rgb', label: 'RGB', val: currentColor.rgb },
                  { key: 'hsl', label: 'HSL', val: currentColor.hsl },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => copyToClipboard(item.val, item.key)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between group hover:border-emerald-500 cursor-pointer transition"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">{item.label}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {item.val}
                      </span>
                    </div>
                    <button className="p-1.5 rounded-lg text-slate-400 group-hover:text-emerald-600 transition">
                      {copiedKey === item.key ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Dominant Image Palette */}
            {details && details.dominantColors.length > 0 && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  <span>Dominant Colors</span>
                </h3>
                <div className="grid grid-cols-6 gap-2">
                  {details.dominantColors.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => copyToClipboard(color, `dom-${i}`)}
                      className="h-10 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 hover:scale-110 transition cursor-pointer relative group"
                      style={{ backgroundColor: color }}
                      title={`Click to copy ${color}`}
                    >
                      <span className="sr-only">{color}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clicked History */}
            {pickedHistory.length > 0 && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Picked History ({pickedHistory.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pickedHistory.map((col, idx) => (
                    <button
                      key={idx}
                      onClick={() => copyToClipboard(col, `hist-${idx}`)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold hover:border-emerald-500 cursor-pointer"
                    >
                      <span className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: col }} />
                      <span>{col}</span>
                    </button>
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
