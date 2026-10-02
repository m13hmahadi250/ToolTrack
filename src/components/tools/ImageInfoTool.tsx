import React, { useState } from 'react';
import {
  Info,
  Maximize2,
  FileImage,
  Calculator,
  Printer,
  Palette,
  Eye,
  Check
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { inspectImage, ImageDetails, getSimplifiedAspectRatio } from '../../lib/imageUtils';

export const ImageInfoTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [details, setDetails] = useState<ImageDetails | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Aspect ratio calculator state
  const [calcW1, setCalcW1] = useState<number>(1920);
  const [calcH1, setCalcH1] = useState<number>(1080);
  const [calcTargetW, setCalcTargetW] = useState<number>(1280);
  const [calcTargetH, setCalcTargetH] = useState<number>(720);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    const info = await inspectImage(selected);
    setDetails(info);

    setCalcW1(info.width);
    setCalcH1(info.height);
    setCalcTargetW(Math.round(info.width / 2));
    setCalcTargetH(Math.round(info.height / 2));

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  };

  const handleTargetWChange = (val: number) => {
    setCalcTargetW(val);
    if (calcW1 > 0 && calcH1 > 0) {
      setCalcTargetH(Math.round((val * calcH1) / calcW1));
    }
  };

  const handleTargetHChange = (val: number) => {
    setCalcTargetH(val);
    if (calcW1 > 0 && calcH1 > 0) {
      setCalcTargetW(Math.round((val * calcW1) / calcH1));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
            <Info className="w-3.5 h-3.5" />
            <span>EXIF, Dimensions, Aspect Ratio & Print DPI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Image Information & Dimension Checker
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Inspect exact image dimensions, simplified aspect ratios, megapixels, file sizes, transparency, and calculate proportional scaling.
          </p>
        </div>

        {file && (
          <button
            onClick={() => {
              setFile(null);
              setDetails(null);
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Inspect Another Image
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
            title="Upload image to inspect technical specs"
            description="Examines resolution, aspect ratio, print dimensions, and color palette."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Inspection Grid (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visual Preview */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>{details?.fileName}</span>
                <span className="text-xs text-slate-500 font-normal">
                  {(details?.sizeBytes || 0) / 1024 > 1024
                    ? `${((details?.sizeBytes || 0) / (1024 * 1024)).toFixed(2)} MB`
                    : `${((details?.sizeBytes || 0) / 1024).toFixed(1)} KB`}
                </span>
              </h3>

              <div className="max-h-[400px] overflow-hidden rounded-2xl bg-slate-900 flex items-center justify-center p-4">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Inspection preview"
                    className="max-h-[360px] max-w-full rounded-xl shadow-lg object-contain"
                  />
                )}
              </div>
            </div>

            {/* Spec Metric Cards */}
            {details && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Width & Height</span>
                  <p className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
                    {details.width} × {details.height}
                  </p>
                  <span className="text-[11px] text-slate-400">Total Pixels</span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Aspect Ratio</span>
                  <p className="text-lg font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                    {details.aspectRatio}
                  </p>
                  <span className="text-[11px] text-slate-400">({details.aspectRatioValue.toFixed(2)}:1)</span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Resolution</span>
                  <p className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
                    {details.megapixels} MP
                  </p>
                  <span className="text-[11px] text-slate-400">Megapixels</span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Transparency</span>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {details.hasTransparency ? 'Alpha Channel' : 'Opaque'}
                  </p>
                  <span className="text-[11px] text-slate-400">{details.hasTransparency ? 'Transparent PNG/WEBP' : 'Solid pixels'}</span>
                </div>
              </div>
            )}

            {/* Print Dimensions at DPI */}
            {details && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Printer className="w-4 h-4 text-indigo-600" />
                  <span>Physical Print Dimensions at Various DPIs</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 block">300 DPI (Magazine / High-Res)</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {((details.width / 300) * 2.54).toFixed(1)} × {((details.height / 300) * 2.54).toFixed(1)} cm
                    </p>
                    <span className="text-slate-400 text-[11px]">
                      {(details.width / 300).toFixed(1)}″ × {(details.height / 300).toFixed(1)}″
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 block">150 DPI (Good Newspaper / Poster)</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {((details.width / 150) * 2.54).toFixed(1)} × {((details.height / 150) * 2.54).toFixed(1)} cm
                    </p>
                    <span className="text-slate-400 text-[11px]">
                      {(details.width / 150).toFixed(1)}″ × {(details.height / 150).toFixed(1)}″
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 block">72 DPI (Standard Web / Screen)</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {((details.width / 72) * 2.54).toFixed(1)} × {((details.height / 72) * 2.54).toFixed(1)} cm
                    </p>
                    <span className="text-slate-400 text-[11px]">
                      {(details.width / 72).toFixed(1)}″ × {(details.height / 72).toFixed(1)}″
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Aspect Ratio Calculator (1 col) */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>Aspect Ratio Scaling Calculator</span>
              </h3>

              <p className="text-slate-500 leading-relaxed">
                Calculate proportional dimensions to prevent stretching or squishing.
              </p>

              <div className="space-y-3">
                <div>
                  <span className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Base Ratio (W : H):</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={calcW1}
                      onChange={(e) => setCalcW1(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                    <span className="font-bold">:</span>
                    <input
                      type="number"
                      value={calcH1}
                      onChange={(e) => setCalcH1(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold block mt-1">
                    Simplified: {getSimplifiedAspectRatio(calcW1, calcH1)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="font-bold block text-slate-700 dark:text-slate-300">Target Scale Dimensions:</span>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Target Width:</label>
                    <input
                      type="number"
                      value={calcTargetW}
                      onChange={(e) => handleTargetWChange(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Calculated Height:</label>
                    <input
                      type="number"
                      value={calcTargetH}
                      onChange={(e) => handleTargetHChange(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
