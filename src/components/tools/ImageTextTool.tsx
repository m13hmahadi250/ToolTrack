import React, { useState, useRef, useEffect } from 'react';
import {
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Download,
  Plus,
  Trash2,
  Move,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { addTextToImage, TextLayerOptions, SupportedImageFormat } from '../../lib/imageUtils';
import { useToolTrack } from '../../context/ToolTrackContext';

export const ImageTextTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [file, setFile] = useState<File | null>(null);
  const [layers, setLayers] = useState<TextLayerOptions[]>([
    {
      text: '',
      fontFamily: 'Inter, sans-serif',
      fontSize: 48,
      color: '#ffffff',
      bold: true,
      italic: false,
      alignment: 'center',
      xPercent: 50,
      yPercent: 45,
      opacity: 1.0,
      hasShadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.75)',
      hasBackgroundBox: false,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
  ]);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<SupportedImageFormat>('image/png');
  const [exportQuality, setExportQuality] = useState(0.92);
  const [exporting, setExporting] = useState(false);

  const handleFileSelect = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
  };

  const activeLayer = layers[activeLayerIndex] || layers[0];

  const updateActiveLayer = (updates: Partial<TextLayerOptions>) => {
    setLayers((prev) =>
      prev.map((layer, idx) => (idx === activeLayerIndex ? { ...layer, ...updates } : layer))
    );
  };

  const addLayer = () => {
    const newL: TextLayerOptions = {
      text: 'Subtitle or description text',
      fontFamily: 'Inter, sans-serif',
      fontSize: 28,
      color: '#f8fafc',
      bold: false,
      italic: false,
      alignment: 'center',
      xPercent: 50,
      yPercent: 58,
      opacity: 0.95,
      hasShadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.75)',
      hasBackgroundBox: false,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    };
    setLayers((prev) => [...prev, newL]);
    setActiveLayerIndex(layers.length);
  };

  const removeLayer = (idx: number) => {
    if (layers.length <= 1) return;
    setLayers((prev) => prev.filter((_, i) => i !== idx));
    setActiveLayerIndex(0);
  };

  // Live preview update
  useEffect(() => {
    if (!file) return;

    let isMounted = true;
    const updatePreview = async () => {
      try {
        const blob = await addTextToImage(file, layers, exportFormat, exportQuality);
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
  }, [file, layers, exportFormat, exportQuality]);

  const handleDownload = async () => {
    if (!file) return;
    setExporting(true);

    try {
      const blob = await addTextToImage(file, layers, exportFormat, exportQuality);
      let ext = 'png';
      if (exportFormat === 'image/jpeg') ext = 'jpg';
      if (exportFormat === 'image/webp') ext = 'webp';

      const fileName = `${file.name.replace(/\.[^/.]+$/, '')}-captioned.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addRecentActivity('image-text', 'Add Text to Image', file.name, 'completed');
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
            <Type className="w-3.5 h-3.5" />
            <span>Typography & Caption Designer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Add Text Over Image
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Place customizable typography, headlines, subtitles, and badges over photos with font, shadow, and position controls.
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
            acceptedFormats={['.png', '.jpg', '.jpeg', '.webp']}
            multiple={false}
            maxFiles={1}
            onFilesSelected={handleFileSelect}
            title="Upload photo to add text"
            description="Supports PNG, JPG, and WEBP. Add multiple styled text layers."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Controls (1 col) */}
          <div className="space-y-6">
            {/* Layers tabs */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Text Layers</span>
                <button
                  onClick={addLayer}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Layer</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {layers.map((l, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      activeLayerIndex === idx
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                    onClick={() => setActiveLayerIndex(idx)}
                  >
                    <span>Layer {idx + 1}</span>
                    {layers.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLayer(idx);
                        }}
                        className="text-slate-400 hover:text-rose-500 ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Active Layer Settings */}
            {activeLayer && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                <div>
                  <label className="font-bold block mb-1">Text Content:</label>
                  <textarea
                    rows={2}
                    value={activeLayer.text}
                    onChange={(e) => updateActiveLayer({ text: e.target.value })}
                    placeholder="Enter text to overlay on image..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 placeholder-slate-400 font-bold text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">Font Family:</label>
                    <select
                      value={activeLayer.fontFamily}
                      onChange={(e) => updateActiveLayer({ fontFamily: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    >
                      <option value="Inter, sans-serif">Inter (Modern Clean)</option>
                      <option value="serif">Merriweather (Classic Serif)</option>
                      <option value="'JetBrains Mono', monospace">JetBrains Mono (Tech)</option>
                      <option value="cursive">Brush Script (Handwritten)</option>
                      <option value="Impact, sans-serif">Impact (Bold Poster)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Font Size:</label>
                    <input
                      type="number"
                      min="12"
                      max="200"
                      value={activeLayer.fontSize}
                      onChange={(e) => updateActiveLayer({ fontSize: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Styling Bar */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateActiveLayer({ bold: !activeLayer.bold })}
                      className={`p-2 rounded-lg border font-bold transition cursor-pointer ${
                        activeLayer.bold ? 'bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateActiveLayer({ italic: !activeLayer.italic })}
                      className={`p-2 rounded-lg border font-bold transition cursor-pointer ${
                        activeLayer.italic ? 'bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Alignment */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateActiveLayer({ alignment: 'left' })}
                      className={`p-2 rounded-lg border font-bold transition cursor-pointer ${
                        activeLayer.alignment === 'left' ? 'bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateActiveLayer({ alignment: 'center' })}
                      className={`p-2 rounded-lg border font-bold transition cursor-pointer ${
                        activeLayer.alignment === 'center' ? 'bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateActiveLayer({ alignment: 'right' })}
                      className={`p-2 rounded-lg border font-bold transition cursor-pointer ${
                        activeLayer.alignment === 'right' ? 'bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Color */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={activeLayer.color}
                      onChange={(e) => updateActiveLayer({ color: e.target.value })}
                      className="w-7 h-7 rounded border cursor-pointer"
                    />
                  </div>
                </div>

                {/* Position sliders */}
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>Horizontal Position (X):</span>
                      <span className="font-mono">{activeLayer.xPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={activeLayer.xPercent}
                      onChange={(e) => updateActiveLayer({ xPercent: Number(e.target.value) })}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>Vertical Position (Y):</span>
                      <span className="font-mono">{activeLayer.yPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={activeLayer.yPercent}
                      onChange={(e) => updateActiveLayer({ yPercent: Number(e.target.value) })}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Shadow & Box toggles */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeLayer.hasShadow}
                      onChange={(e) => updateActiveLayer({ hasShadow: e.target.checked })}
                      className="rounded accent-indigo-600"
                    />
                    <span className="font-bold">Text Drop Shadow</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeLayer.hasBackgroundBox}
                      onChange={(e) => updateActiveLayer({ hasBackgroundBox: e.target.checked })}
                      className="rounded accent-indigo-600"
                    />
                    <span className="font-bold">Background Highlight Banner</span>
                  </label>
                </div>
              </div>
            )}

            {/* Export box */}
            <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3 text-xs">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Export Image</h3>
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
                disabled={exporting}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Captioned Image</span>
              </button>
            </div>
          </div>

          {/* Right Live Preview (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Live Canvas Preview</h3>
              <div className="min-h-[460px] max-h-[640px] overflow-auto rounded-2xl bg-slate-900 flex items-center justify-center p-4">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Text overlay preview"
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
