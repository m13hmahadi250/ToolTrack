import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  RotateCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  FileCheck,
  Zap,
  Sliders
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { FileUploader } from '../common/FileUploader';
import { fileToImage } from '../../lib/imageUtils';
import { MM_TO_PT } from '../../lib/pdfRenderer';
import { useToolTrack } from '../../context/ToolTrackContext';

interface NoteItem {
  id: string;
  file: File;
  previewUrl: string;
  rotation: number;
}

export const NotesToPdfTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [enhancePaper, setEnhancePaper] = useState(true);
  const [colorMode, setColorMode] = useState<'clean-color' | 'high-contrast-bw' | 'original'>('clean-color');
  const [documentTitle, setDocumentTitle] = useState('Lecture Notes');

  const [processing, setProcessing] = useState(false);
  const [outputPdfBlob, setOutputPdfBlob] = useState<Blob | null>(null);

  const handleFiles = (files: File[]) => {
    const items: NoteItem[] = files.map((f, i) => ({
      id: `${Date.now()}-${i}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      rotation: 0,
    }));
    setNotes((prev) => [...prev, ...items]);
    setOutputPdfBlob(null);
  };

  const handleRotate = (idx: number) => {
    setNotes((prev) =>
      prev.map((n, i) => (i === idx ? { ...n, rotation: (n.rotation + 90) % 360 } : n))
    );
  };

  const handleRemove = (idx: number) => {
    setNotes((prev) => {
      const item = prev[idx];
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleCreatePdf = async () => {
    if (notes.length === 0) return;
    setProcessing(true);

    const totalSize = notes.reduce((acc, n) => acc + n.file.size, 0);
    const jobId = addJob({
      fileName: `${documentTitle || 'Notes'}.pdf`,
      fileSize: totalSize,
      toolId: 'notes-to-pdf',
      toolName: 'Notes to PDF',
      status: 'processing',
      progress: 0.1,
    });

    try {
      const pdfDoc = await PDFDocument.create();

      // Standard A4 dimensions
      const pageW = 595.28;
      const pageH = 841.89;
      const marginPt = 10 * MM_TO_PT; // 10mm

      for (let i = 0; i < notes.length; i++) {
        const item = notes[i];
        const img = await fileToImage(item.file);

        const canvas = document.createElement('canvas');
        const rot = item.rotation;
        const isRot = rot === 90 || rot === 270;
        canvas.width = isRot ? img.naturalHeight : img.naturalWidth;
        canvas.height = isRot ? img.naturalWidth : img.naturalHeight;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) continue;

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

        // Smart Paper Enhancement
        if (enhancePaper && colorMode !== 'original') {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          for (let p = 0; p < data.length; p += 4) {
            const r = data[p];
            const g = data[p + 1];
            const b = data[p + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (colorMode === 'high-contrast-bw') {
              // Thresholding for blackboard / whiteboard scan
              const val = lum > 140 ? 255 : Math.max(0, lum * 0.7);
              data[p] = val;
              data[p + 1] = val;
              data[p + 2] = val;
            } else if (colorMode === 'clean-color') {
              // Levels contrast stretch to make yellow paper bright and ink crisp
              const factor = 1.25;
              data[p] = Math.min(255, Math.max(0, (r - 128) * factor + 128 + 15));
              data[p + 1] = Math.min(255, Math.max(0, (g - 128) * factor + 128 + 15));
              data[p + 2] = Math.min(255, Math.max(0, (b - 128) * factor + 128 + 15));
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.88));
        const buf = await blob.arrayBuffer();
        const embeddedImg = await pdfDoc.embedJpg(buf);

        const page = pdfDoc.addPage([pageW, pageH]);
        const usableW = pageW - marginPt * 2;
        const usableH = pageH - marginPt * 2;

        const scale = Math.min(usableW / canvas.width, usableH / canvas.height, 1);
        const drawW = canvas.width * scale;
        const drawH = canvas.height * scale;

        page.drawImage(embeddedImg, {
          x: marginPt + (usableW - drawW) / 2,
          y: marginPt + (usableH - drawH) / 2,
          width: drawW,
          height: drawH,
        });

        updateJob(jobId, { progress: (i + 1) / notes.length });
      }

      const bytes = await pdfDoc.save();
      const out = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      setOutputPdfBlob(out);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: out,
        outputFileName: `${documentTitle || 'Notes'}.pdf`,
        outputSize: out.size,
      });

      addRecentActivity('notes-to-pdf', 'Notes to PDF', `${notes.length} pages`, 'completed');
    } catch (err: unknown) {
      console.error(err);
      updateJob(jobId, { status: 'failed', errorMessage: String(err) });
    } finally {
      setProcessing(false);
    }
  };

  const downloadPdf = () => {
    if (!outputPdfBlob) return;
    const url = URL.createObjectURL(outputPdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle.replace(/\s+/g, '_') || 'Notes'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>Smart Whiteboard & Note Enhancement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Notes to PDF Scanner
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Clean up notebook photos, whiteboard lectures, and textbook snapshots into uniform, high-contrast A4 study PDFs.
          </p>
        </div>

        {notes.length > 0 && (
          <button
            onClick={() => {
              setNotes([]);
              setOutputPdfBlob(null);
            }}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Clear All Notes
          </button>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="max-w-2xl mx-auto space-y-4">
          <FileUploader
            acceptedFormats={['.png', '.jpg', '.jpeg', '.webp']}
            multiple={true}
            maxFiles={50}
            onFilesSelected={handleFiles}
            title="Upload lecture notes, whiteboard photos, or paper scans"
            description="Drag and drop your photos. Auto-enhancement cleans shadow gradients."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Sidebar */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Paper Clean & Contrast Mode</span>
              </h3>

              <div className="space-y-2">
                {[
                  { id: 'clean-color', label: 'Clean Paper (Color Enhanced)', desc: 'Whitens dingy paper while keeping highlighter/ink colors vivid.' },
                  { id: 'high-contrast-bw', label: 'Crisp High-Contrast B&W', desc: 'Converts to monochrome photocopy style for maximum legibility.' },
                  { id: 'original', label: 'Original Photos', desc: 'Preserves camera capture without alteration.' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setColorMode(m.id as any)}
                    className={`w-full p-3 rounded-xl border text-left transition cursor-pointer ${
                      colorMode === m.id
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>{m.label}</div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>

              <div>
                <label className="font-bold block mb-1">Document Title:</label>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>
            </div>

            <button
              onClick={handleCreatePdf}
              disabled={processing || notes.length === 0}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FileCheck className="w-5 h-5" />
              <span>Generate Clean PDF ({notes.length} Pages)</span>
            </button>

            {outputPdfBlob && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-3 text-xs">
                <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Notes PDF Generated</span>
                  </div>
                  <span className="font-mono">
                    {(outputPdfBlob.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  onClick={downloadPdf}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Clean PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Notes Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Notes Pages ({notes.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {notes.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        Page {idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRotate(idx)}
                          className="p-1 rounded bg-white dark:bg-slate-800 hover:text-emerald-600 cursor-pointer"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemove(idx)}
                          className="p-1 rounded bg-white dark:bg-slate-800 hover:text-rose-600 cursor-pointer"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="h-44 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                      <img
                        src={item.previewUrl}
                        alt={`Note ${idx + 1}`}
                        className="max-h-full max-w-full object-contain"
                        style={{ transform: `rotate(${item.rotation}deg)` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
