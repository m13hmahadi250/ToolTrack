import React, { useState, useMemo, useRef } from 'react';
import {
  Sliders,
  FileSearch,
  Maximize,
  Palette,
  Copy,
  Check,
  Upload,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export type ProductivityTab = 'file-info' | 'aspect-ratio' | 'color-converter';

interface ProductivityUtilitiesToolProps {
  initialTab?: ProductivityTab;
}

export const ProductivityUtilitiesTool: React.FC<ProductivityUtilitiesToolProps> = ({
  initialTab = 'file-info',
}) => {
  const [activeTab, setActiveTab] = useState<ProductivityTab>(initialTab);
  const [copied, setCopied] = useState(false);

  const copyVal = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ----------------------------------------------------
  // 1. FILE INFORMATION INSPECTOR STATE
  // ----------------------------------------------------
  interface FileMetadata {
    name: string;
    sizeBytes: number;
    sizeFormatted: string;
    type: string;
    lastModified: string;
    sha256: string;
    imageDimensions?: { width: number; height: number };
  }

  const [inspectedFile, setInspectedFile] = useState<FileMetadata | null>(null);
  const [hashingFile, setHashingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleInspectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHashingFile(true);

    let dimensions: { width: number; height: number } | undefined = undefined;
    if (file.type.startsWith('image/')) {
      dimensions = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve(undefined);
        img.src = URL.createObjectURL(file);
      });
    }

    // Compute SHA-256 via Web Crypto
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      setInspectedFile({
        name: file.name,
        sizeBytes: file.size,
        sizeFormatted: formatFileSize(file.size),
        type: file.type || 'application/octet-stream',
        lastModified: new Date(file.lastModified).toLocaleString(),
        sha256,
        imageDimensions: dimensions,
      });
    } catch (err) {
      console.error('File inspection error:', err);
    } finally {
      setHashingFile(false);
    }

    e.target.value = '';
  };

  // ----------------------------------------------------
  // 2. ASPECT RATIO CALCULATOR STATE
  // ----------------------------------------------------
  const [ratioWidth, setRatioWidth] = useState<string>('');
  const [ratioHeight, setRatioHeight] = useState<string>('');
  const [targetWidth, setTargetWidth] = useState<string>('');

  // GCD helper
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

  const simplifiedRatio = useMemo(() => {
    const w = parseInt(ratioWidth, 10);
    const h = parseInt(ratioHeight, 10);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return '—';
    const divisor = gcd(w, h);
    return `${w / divisor}:${h / divisor}`;
  }, [ratioWidth, ratioHeight]);

  const calculatedTargetHeight = useMemo(() => {
    const w = parseInt(ratioWidth, 10);
    const h = parseInt(ratioHeight, 10);
    const tw = parseInt(targetWidth, 10);
    if (isNaN(w) || isNaN(h) || isNaN(tw) || w <= 0 || h <= 0 || tw <= 0) return '—';
    return `${Math.round((tw / w) * h)} px`;
  }, [ratioWidth, ratioHeight, targetWidth]);

  // ----------------------------------------------------
  // 3. COLOR CONVERTER STATE
  // ----------------------------------------------------
  const [hexColor, setHexColor] = useState('#4f46e5');

  // Hex to RGB
  const rgbColor = useMemo(() => {
    const clean = hexColor.replace('#', '');
    if (clean.length !== 6) return { r: 79, g: 70, b: 229 };
    const r = parseInt(clean.substring(0, 2), 16) || 0;
    const g = parseInt(clean.substring(2, 4), 16) || 0;
    const b = parseInt(clean.substring(4, 6), 16) || 0;
    return { r, g, b };
  }, [hexColor]);

  // RGB to HSL
  const hslColor = useMemo(() => {
    const r = rgbColor.r / 255;
    const g = rgbColor.g / 255;
    const b = rgbColor.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }, [rgbColor]);

  // Relative luminance for contrast
  const luminance = useMemo(() => {
    const a = [rgbColor.r, rgbColor.g, rgbColor.b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }, [rgbColor]);

  const contrastWithWhite = (1 + 0.05) / (luminance + 0.05);
  const contrastWithBlack = (luminance + 0.05) / (0 + 0.05);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <span>Productivity Utilities</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Inspect file sizes and SHA checksums, calculate responsive aspect ratios, and convert color models.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 scrollbar-none">
        {[
          { id: 'file-info', label: 'File Info Inspector', icon: FileSearch },
          { id: 'aspect-ratio', label: 'Aspect Ratio Calculator', icon: Maximize },
          { id: 'color-converter', label: 'Color Converter', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ProductivityTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: FILE INFO INSPECTOR */}
      {activeTab === 'file-info' && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-5 text-center shadow-xs">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleInspectFile}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-2xl cursor-pointer transition flex flex-col items-center justify-center space-y-3 bg-slate-50/50 dark:bg-slate-900/40"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Select Any File to Inspect
                </div>
                <div className="text-xs text-slate-500">
                  Read exact byte size, MIME headers, image dimensions & SHA-256 hash locally.
                </div>
              </div>
            </div>

            {hashingFile && (
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">
                Inspecting file & computing checksum...
              </div>
            )}

            {inspectedFile && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-4">
                <div className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
                  <span className="truncate mr-2">{inspectedFile.name}</span>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                    {inspectedFile.sizeFormatted}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Exact Bytes:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                      {inspectedFile.sizeBytes.toLocaleString()} bytes
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">MIME Type:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {inspectedFile.type}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Last Modified:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {inspectedFile.lastModified}
                    </span>
                  </div>

                  {inspectedFile.imageDimensions && (
                    <div>
                      <span className="text-slate-400 font-medium block">Image Resolution:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                        {inspectedFile.imageDimensions.width} × {inspectedFile.imageDimensions.height} px
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold">SHA-256 Cryptographic Checksum:</span>
                    <button
                      onClick={() => copyVal(inspectedFile.sha256)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Copy Checksum
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all select-all">
                    {inspectedFile.sha256}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ASPECT RATIO CALCULATOR */}
      {activeTab === 'aspect-ratio' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
            {/* Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Common Presets</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '16:9 (Widescreen)', w: 1920, h: 1080 },
                  { label: '4:3 (Standard)', w: 1024, h: 768 },
                  { label: '1:1 (Square / Avatar)', w: 1080, h: 1080 },
                  { label: '9:16 (Vertical / Reels)', w: 1080, h: 1920 },
                  { label: '21:9 (Ultrawide)', w: 2560, h: 1080 },
                  { label: '3:2 (Photography)', w: 1500, h: 1000 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setRatioWidth(String(p.w));
                      setRatioHeight(String(p.h));
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Base Ratio Dimension Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Base Width (px)</label>
                <input
                  type="number"
                  value={ratioWidth}
                  onChange={(e) => setRatioWidth(e.target.value)}
                  placeholder="e.g. 1920"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Base Height (px)</label>
                <input
                  type="number"
                  value={ratioHeight}
                  onChange={(e) => setRatioHeight(e.target.value)}
                  placeholder="e.g. 1080"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Ratio Result Badge */}
            <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-indigo-900 dark:text-indigo-200 font-semibold">
                Simplified Mathematical Ratio:
              </span>
              <span className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">
                {simplifiedRatio}
              </span>
            </div>

            {/* Target Calculator */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Scale to New Dimensions</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Target Width</label>
                  <input
                    type="number"
                    value={targetWidth}
                    onChange={(e) => setTargetWidth(e.target.value)}
                    placeholder="e.g. 1280"
                    className="w-full p-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Calculated Height</label>
                  <div className="w-full p-2.5 bg-slate-200/60 dark:bg-slate-800 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {calculatedTargetHeight}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COLOR CONVERTER */}
      {activeTab === 'color-converter' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
            {/* Swatch & Picker */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div
                className="w-24 h-24 rounded-2xl shadow-md border-4 border-white dark:border-slate-800 shrink-0"
                style={{ backgroundColor: hexColor }}
              />

              <div className="space-y-3 flex-1 w-full">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={hexColor}
                    onChange={(e) => setHexColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer p-0 border border-slate-300"
                  />
                  <input
                    type="text"
                    value={hexColor}
                    onChange={(e) => setHexColor(e.target.value)}
                    className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white uppercase focus:outline-none w-36"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  Pick any color or type hexadecimal code to convert between HEX, RGB, and HSL.
                </div>
              </div>
            </div>

            {/* Formats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>HEX</span>
                  <button
                    onClick={() => copyVal(hexColor)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-white uppercase">
                  {hexColor}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>RGB</span>
                  <button
                    onClick={() => copyVal(`rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  rgb({rgbColor.r}, {rgbColor.g}, {rgbColor.b})
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>HSL</span>
                  <button
                    onClick={() => copyVal(`hsl(${hslColor.h}, ${hslColor.s}%, ${hslColor.l}%)`)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  hsl({hslColor.h}, {hslColor.s}%, {hslColor.l}%)
                </div>
              </div>
            </div>

            {/* Accessibility Contrast Checker */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                WCAG Contrast Accessibility Check
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                  <span className="text-slate-500">Against White (#FFF):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {contrastWithWhite >= 4.5 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                    <span>{contrastWithWhite.toFixed(2)}:1</span>
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                  <span className="text-slate-500">Against Black (#000):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {contrastWithBlack >= 4.5 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                    <span>{contrastWithBlack.toFixed(2)}:1</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
