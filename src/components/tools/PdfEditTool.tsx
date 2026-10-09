import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Edit3,
  Bookmark,
  FileDigit,
  ShieldAlert,
  Download,
  CheckCircle2,
  PenTool,
  Type,
  Highlighter,
  Square,
  Minus,
  RotateCw,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sliders,
  Sparkles,
  Layers,
  ArrowRight,
  FileCheck
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { loadPdfDocument, renderPageToCanvas, getPdfPagesInfo, MM_TO_PT } from '../../lib/pdfRenderer';
import { sanitizePdfText, safeDrawText, safeWidthOfTextAtSize } from '../../lib/pdfTextSanitizer';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { useToolTrack } from '../../context/ToolTrackContext';
import type { DetectedPageInfo } from '../../types';

interface PdfTextAnnotation {
  id: string;
  pageIndex: number;
  text: string;
  xPt: number;
  yPt: number;
  fontSize: number;
  color: string;
}

interface PdfDrawingStroke {
  id: string;
  pageIndex: number;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

interface PdfRectAnnotation {
  id: string;
  pageIndex: number;
  type: 'redact' | 'highlight' | 'rectangle';
  xPt: number;
  yPt: number;
  widthPt: number;
  heightPt: number;
  color: string;
  opacity?: number;
}

interface PageAction {
  rotationAdd: number; // 0, 90, 180, 270
  isDeleted: boolean;
  duplicatedTimes: number;
}

export const PdfEditTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [file, setFile] = useState<File | null>(null);
  const [pagesInfo, setPagesInfo] = useState<DetectedPageInfo[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Active Tool Mode
  const [activeEditorTool, setActiveEditorTool] = useState<'text' | 'draw' | 'redact' | 'highlight' | 'watermark' | 'page-numbers' | 'pages'>('text');

  // Annotation Collections
  const [textAnnotations, setTextAnnotations] = useState<PdfTextAnnotation[]>([]);
  const [drawingStrokes, setDrawingStrokes] = useState<PdfDrawingStroke[]>([]);
  const [rectAnnotations, setRectAnnotations] = useState<PdfRectAnnotation[]>([]);
  const [pageActions, setPageActions] = useState<Record<number, PageAction>>({});

  // Tool Specific Options
  // Text Options
  const [inputText, setInputText] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [textColor, setTextColor] = useState('#2563eb');

  // Draw Options
  const [penColor, setPenColor] = useState('#0f172a');
  const [penWidth, setPenWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStrokePoints, setCurrentStrokePoints] = useState<{ x: number; y: number }[]>([]);

  // Watermark Options
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.2);
  const [watermarkFontSize, setWatermarkFontSize] = useState(48);

  // Page Numbers Options
  const [pageNumbersEnabled, setPageNumbersEnabled] = useState(false);
  const [pageNumberFormat, setPageNumberFormat] = useState<'page_x_of_y' | 'page_x' | 'x'>('page_x_of_y');
  const [pageNumberPos, setPageNumberPos] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');

  // Processing & Result State
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');
  const [outputSize, setOutputSize] = useState<number | null>(null);

  // Canvas Refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocProxyRef = useRef<any>(null);

  // Load and inspect PDF
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setResultBlob(null);
    setTextAnnotations([]);
    setDrawingStrokes([]);
    setRectAnnotations([]);
    setPageActions({});
    setCurrentPage(1);
    setPreviewLoading(true);

    try {
      const buffer = await selected.arrayBuffer();
      const doc = await loadPdfDocument(buffer);
      pdfDocProxyRef.current = doc;
      const pInfo = await getPdfPagesInfo(doc);
      setPagesInfo(pInfo);
    } catch (err) {
      console.error('[PdfEditTool] Error loading PDF:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Render current PDF page onto previewCanvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDocProxyRef.current || pagesInfo.length === 0) return;
    setPreviewLoading(true);
    try {
      const p = Math.min(Math.max(1, currentPage), pagesInfo.length);
      if (previewCanvasRef.current) {
        await renderPageToCanvas(pdfDocProxyRef.current, p, previewCanvasRef.current, 560);
      }
    } catch (err) {
      console.warn('[PdfEditTool] Render error:', err);
    } finally {
      setPreviewLoading(false);
    }
  }, [currentPage, pagesInfo]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // Sync drawing canvas overlay with rendered preview canvas dimensions
  useEffect(() => {
    const mainCanvas = previewCanvasRef.current;
    const overlayCanvas = drawingCanvasRef.current;
    if (mainCanvas && overlayCanvas) {
      overlayCanvas.width = mainCanvas.width;
      overlayCanvas.height = mainCanvas.height;
      drawOverlayAnnotations();
    }
  }, [currentPage, textAnnotations, drawingStrokes, rectAnnotations, currentStrokePoints, previewLoading]);

  // Draw overlay annotations (text, strokes, rectangles) on overlay canvas
  const drawOverlayAnnotations = () => {
    const canvas = drawingCanvasRef.current;
    const mainCanvas = previewCanvasRef.current;
    if (!canvas || !mainCanvas || pagesInfo.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageIdx = currentPage - 1;
    const pInfo = pagesInfo[pageIdx];
    if (!pInfo) return;

    const scaleX = canvas.width / pInfo.widthPt;
    const scaleY = canvas.height / pInfo.heightPt;

    // 1. Draw Rectangles / Redactions / Highlights for this page
    rectAnnotations
      .filter((r) => r.pageIndex === pageIdx)
      .forEach((r) => {
        ctx.save();
        const rx = r.xPt * scaleX;
        const ry = (pInfo.heightPt - r.yPt - r.heightPt) * scaleY;
        const rw = r.widthPt * scaleX;
        const rh = r.heightPt * scaleY;

        if (r.type === 'redact') {
          ctx.fillStyle = '#000000';
          ctx.fillRect(rx, ry, rw, rh);
        } else if (r.type === 'highlight') {
          ctx.fillStyle = r.color || 'rgba(250, 204, 21, 0.4)';
          ctx.fillRect(rx, ry, rw, rh);
        } else {
          ctx.strokeStyle = r.color || '#2563eb';
          ctx.lineWidth = 2;
          ctx.strokeRect(rx, ry, rw, rh);
        }
        ctx.restore();
      });

    // 2. Draw Finished Drawing Strokes for this page
    drawingStrokes
      .filter((s) => s.pageIndex === pageIdx)
      .forEach((s) => {
        if (s.points.length < 2) return;
        ctx.save();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width * scaleX;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(s.points[0].x * canvas.width, s.points[0].y * canvas.height);
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x * canvas.width, s.points[i].y * canvas.height);
        }
        ctx.stroke();
        ctx.restore();
      });

    // 3. Draw In-progress stroke
    if (currentStrokePoints.length > 1) {
      ctx.save();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth * scaleX;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentStrokePoints[0].x * canvas.width, currentStrokePoints[0].y * canvas.height);
      for (let i = 1; i < currentStrokePoints.length; i++) {
        ctx.lineTo(currentStrokePoints[i].x * canvas.width, currentStrokePoints[i].y * canvas.height);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw Text Annotations for this page
    textAnnotations
      .filter((t) => t.pageIndex === pageIdx)
      .forEach((t) => {
        ctx.save();
        const tx = t.xPt * scaleX;
        const ty = (pInfo.heightPt - t.yPt) * scaleY;
        ctx.font = `bold ${Math.round(t.fontSize * scaleX)}px sans-serif`;
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, tx, ty);
        ctx.restore();
      });
  };

  // Canvas Click / Drawing Event Handlers
  const handleOverlayPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas || pagesInfo.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const normX = clickX / rect.width;
    const normY = clickY / rect.height;

    const pageIdx = currentPage - 1;
    const pInfo = pagesInfo[pageIdx];
    if (!pInfo) return;

    // Convert pixel coordinate back to PDF points
    const xPt = normX * pInfo.widthPt;
    const yPt = (1 - normY) * pInfo.heightPt;

    if (activeEditorTool === 'text') {
      if (!inputText.trim()) return;
      const newAnno: PdfTextAnnotation = {
        id: `txt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        pageIndex: pageIdx,
        text: inputText,
        xPt: Math.round(xPt),
        yPt: Math.round(yPt),
        fontSize,
        color: textColor,
      };
      setTextAnnotations((prev) => [...prev, newAnno]);
    } else if (activeEditorTool === 'redact') {
      // Add blackout box centered at click
      const wPt = 160;
      const hPt = 24;
      const newRect: PdfRectAnnotation = {
        id: `red_${Date.now()}`,
        pageIndex: pageIdx,
        type: 'redact',
        xPt: Math.max(0, Math.round(xPt - wPt / 2)),
        yPt: Math.max(0, Math.round(yPt - hPt / 2)),
        widthPt: wPt,
        heightPt: hPt,
        color: '#000000',
      };
      setRectAnnotations((prev) => [...prev, newRect]);
    } else if (activeEditorTool === 'highlight') {
      const wPt = 140;
      const hPt = 18;
      const newRect: PdfRectAnnotation = {
        id: `hl_${Date.now()}`,
        pageIndex: pageIdx,
        type: 'highlight',
        xPt: Math.max(0, Math.round(xPt - wPt / 2)),
        yPt: Math.max(0, Math.round(yPt - hPt / 2)),
        widthPt: wPt,
        heightPt: hPt,
        color: 'rgba(250, 204, 21, 0.4)',
      };
      setRectAnnotations((prev) => [...prev, newRect]);
    } else if (activeEditorTool === 'draw') {
      setIsDrawing(true);
      setCurrentStrokePoints([{ x: normX, y: normY }]);
    }
  };

  const handleOverlayPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeEditorTool !== 'draw') return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;
    setCurrentStrokePoints((prev) => [...prev, { x: normX, y: normY }]);
  };

  const handleOverlayPointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStrokePoints.length > 1) {
      const newStroke: PdfDrawingStroke = {
        id: `drw_${Date.now()}`,
        pageIndex: currentPage - 1,
        points: currentStrokePoints,
        color: penColor,
        width: penWidth,
      };
      setDrawingStrokes((prev) => [...prev, newStroke]);
    }
    setCurrentStrokePoints([]);
  };

  // Page Action Modifiers
  const rotateCurrentPage = () => {
    setPageActions((prev) => {
      const current = prev[currentPage - 1] || { rotationAdd: 0, isDeleted: false, duplicatedTimes: 0 };
      return {
        ...prev,
        [currentPage - 1]: { ...current, rotationAdd: (current.rotationAdd + 90) % 360 },
      };
    });
  };

  const duplicateCurrentPage = () => {
    setPageActions((prev) => {
      const current = prev[currentPage - 1] || { rotationAdd: 0, isDeleted: false, duplicatedTimes: 0 };
      return {
        ...prev,
        [currentPage - 1]: { ...current, duplicatedTimes: current.duplicatedTimes + 1 },
      };
    });
  };

  const deleteCurrentPage = () => {
    setPageActions((prev) => {
      const current = prev[currentPage - 1] || { rotationAdd: 0, isDeleted: false, duplicatedTimes: 0 };
      return {
        ...prev,
        [currentPage - 1]: { ...current, isDeleted: true },
      };
    });
  };

  // Clear annotations on current page
  const clearCurrentPageAnnotations = () => {
    const pageIdx = currentPage - 1;
    setTextAnnotations((prev) => prev.filter((t) => t.pageIndex !== pageIdx));
    setDrawingStrokes((prev) => prev.filter((s) => s.pageIndex !== pageIdx));
    setRectAnnotations((prev) => prev.filter((r) => r.pageIndex !== pageIdx));
  };

  // APPLY ALL MODIFICATIONS & EXPORT REAL PDF
  const handleApplyAndExport = async () => {
    if (!file) return;
    setProcessing(true);

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const outName = `${baseName}-edited.pdf`;
    setResultFileName(outName);

    const jobId = addJob({
      fileName: file.name,
      fileSize: file.size,
      toolId: 'pdf-edit',
      toolName: 'Edit & Annotate PDF',
      status: 'processing',
      progress: 0.15,
      outputFileName: outName,
    });

    try {
      const buffer = await file.arrayBuffer();
      const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      const font = await newDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await newDoc.embedFont(StandardFonts.HelveticaBold);

      const totalSourcePages = sourceDoc.getPageCount();

      // 1. Process Page Actions (Delete, Rotate, Duplicate) & Copy Pages
      const mappedPages: { newPageIndex: number; origPageIndex: number; page: any }[] = [];

      for (let origIdx = 0; origIdx < totalSourcePages; origIdx++) {
        const action = pageActions[origIdx] || { rotationAdd: 0, isDeleted: false, duplicatedTimes: 0 };
        if (action.isDeleted) continue;

        // Base page copy
        const copies = 1 + action.duplicatedTimes;
        for (let c = 0; c < copies; c++) {
          const [copiedPage] = await newDoc.copyPages(sourceDoc, [origIdx]);
          if (action.rotationAdd !== 0) {
            const currentRot = copiedPage.getRotation().angle;
            copiedPage.setRotation(degrees((currentRot + action.rotationAdd) % 360));
          }
          newDoc.addPage(copiedPage);
          mappedPages.push({
            newPageIndex: newDoc.getPageCount() - 1,
            origPageIndex: origIdx,
            page: copiedPage,
          });
        }
      }

      updateJob(jobId, { progress: 0.45 });

      // 2. Apply Page-Specific Annotations (Text, Drawing, Redactions, Highlights)
      for (const item of mappedPages) {
        const { page, origPageIndex } = item;
        const { width: pWidth, height: pHeight } = page.getSize();

        // A. Draw Redactions & Highlights
        const rects = rectAnnotations.filter((r) => r.pageIndex === origPageIndex);
        for (const r of rects) {
          if (r.type === 'redact') {
            page.drawRectangle({
              x: r.xPt,
              y: r.yPt,
              width: r.widthPt,
              height: r.heightPt,
              color: rgb(0, 0, 0),
            });
          } else if (r.type === 'highlight') {
            page.drawRectangle({
              x: r.xPt,
              y: r.yPt,
              width: r.widthPt,
              height: r.heightPt,
              color: rgb(0.98, 0.85, 0.15),
              opacity: 0.4,
            });
          }
        }

        // B. Draw Freehand Drawing Strokes / Signatures
        const strokes = drawingStrokes.filter((s) => s.pageIndex === origPageIndex);
        for (const s of strokes) {
          if (s.points.length < 2) continue;
          // Parse hex color
          let r = 0.1, g = 0.1, b = 0.1;
          if (s.color.startsWith('#') && s.color.length === 7) {
            r = parseInt(s.color.substr(1, 2), 16) / 255;
            g = parseInt(s.color.substr(3, 2), 16) / 255;
            b = parseInt(s.color.substr(5, 2), 16) / 255;
          }

          for (let i = 0; i < s.points.length - 1; i++) {
            const p1 = s.points[i];
            const p2 = s.points[i + 1];
            page.drawLine({
              start: { x: p1.x * pWidth, y: (1 - p1.y) * pHeight },
              end: { x: p2.x * pWidth, y: (1 - p2.y) * pHeight },
              thickness: s.width,
              color: rgb(r, g, b),
            });
          }
        }

        // C. Draw Text Annotations
        const texts = textAnnotations.filter((t) => t.pageIndex === origPageIndex);
        for (const t of texts) {
          let r = 0.1, g = 0.1, b = 0.1;
          if (t.color.startsWith('#') && t.color.length === 7) {
            r = parseInt(t.color.substr(1, 2), 16) / 255;
            g = parseInt(t.color.substr(3, 2), 16) / 255;
            b = parseInt(t.color.substr(5, 2), 16) / 255;
          }
          safeDrawText(page, t.text, {
            x: t.xPt,
            y: t.yPt,
            size: t.fontSize,
            font: fontBold,
            color: rgb(r, g, b),
          });
        }

        // D. Apply Watermark if enabled
        if (watermarkEnabled && watermarkText.trim()) {
          const cleanText = sanitizePdfText(watermarkText);
          const textWidth = safeWidthOfTextAtSize(fontBold, cleanText, watermarkFontSize);
          const textHeight = fontBold.heightAtSize(watermarkFontSize);

          safeDrawText(page, cleanText, {
            x: pWidth / 2 - textWidth / 2,
            y: pHeight / 2 - textHeight / 2,
            size: watermarkFontSize,
            font: fontBold,
            color: rgb(0.8, 0.1, 0.1),
            opacity: watermarkOpacity,
            rotate: degrees(45),
          });
        }
      }

      // 3. Apply Page Numbers if enabled
      if (pageNumbersEnabled) {
        const totalNewPages = newDoc.getPageCount();
        const pages = newDoc.getPages();
        pages.forEach((page, idx) => {
          const curNum = idx + 1;
          let label = `${curNum}`;
          if (pageNumberFormat === 'page_x_of_y') label = `Page ${curNum} of ${totalNewPages}`;
          else if (pageNumberFormat === 'page_x') label = `Page ${curNum}`;

          const { width, height } = page.getSize();
          const tWidth = safeWidthOfTextAtSize(font, label, 10);
          let px = width / 2 - tWidth / 2;
          let py = 24;

          if (pageNumberPos === 'bottom-right') px = width - tWidth - 36;
          else if (pageNumberPos === 'top-right') {
            px = width - tWidth - 36;
            py = height - 28;
          }

          safeDrawText(page, label, {
            x: px,
            y: py,
            size: 10,
            font,
            color: rgb(0.35, 0.35, 0.35),
          });
        });
      }

      updateJob(jobId, { progress: 0.85 });

      const pdfBytes = await newDoc.save({ useObjectStreams: true });
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

      setResultBlob(blob);
      setOutputSize(blob.size);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: blob,
        outputSize: blob.size,
      });

      addRecentActivity('pdf-edit', 'Edit & Annotate PDF', file.name, 'completed');
    } catch (err: unknown) {
      console.error('[PdfEditTool] Error exporting edited PDF:', err);
      updateJob(jobId, {
        status: 'failed',
        errorMessage: 'Editing failed: ' + String(err),
      });
      addRecentActivity('pdf-edit', 'Edit & Annotate PDF', file.name, 'failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFileName || 'document-edited.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
          <Edit3 className="w-3.5 h-3.5" />
          <span>Full Interactive PDF Studio</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Edit & Annotate PDF
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Add vector text, draw signatures, stamp blackout redactions, highlight content, rotate pages, and insert watermarks directly onto PDF pages.
        </p>
      </div>

      {!file ? (
        <FileUploader
          acceptedFormats={['.pdf']}
          multiple={false}
          onFilesSelected={handleFilesSelected}
          title="Select PDF document to edit"
          description="Interactive multi-page canvas studio"
        />
      ) : (
        <div className="space-y-6">
          {/* Top Bar with File Name and Change File */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-sm">
                {file.name}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({pagesInfo.length} Total Pages)
              </span>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setResultBlob(null);
                pdfDocProxyRef.current = null;
              }}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Change File
            </button>
          </div>

          {/* Main Studio Grid: Toolbar / Settings (Left 4 cols) + Interactive Canvas View (Right 8 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Control Panel (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Tool Mode Tabs */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Select Action
                </span>

                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'text', label: 'Add Text', icon: Type },
                    { id: 'draw', label: 'Signature / Pen', icon: PenTool },
                    { id: 'redact', label: 'Blackout Redact', icon: ShieldAlert },
                    { id: 'highlight', label: 'Highlight', icon: Highlighter },
                    { id: 'watermark', label: 'Watermark', icon: Bookmark },
                    { id: 'pages', label: 'Page Actions', icon: Layers },
                  ].map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveEditorTool(t.id as any)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center font-bold transition cursor-pointer ${
                          activeEditorTool === t.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px]">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tool Specific Config Box */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
                {activeEditorTool === 'text' && (
                  <div className="space-y-3">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Text Annotation Configuration
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      Enter your text, then click anywhere on the page to place it.
                    </p>

                    <div>
                      <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Text Content
                      </label>
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type text..."
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          Font Size ({fontSize} pt)
                        </label>
                        <input
                          type="range"
                          min="8"
                          max="48"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          Text Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                            {textColor}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeEditorTool === 'draw' && (
                  <div className="space-y-3">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Freehand Pen & Signature
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      Draw your signature or sketch annotations directly over the PDF document.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          Pen Thickness ({penWidth}px)
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          value={penWidth}
                          onChange={(e) => setPenWidth(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          Ink Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={penColor}
                            onChange={(e) => setPenColor(e.target.value)}
                            className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                            {penColor}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeEditorTool === 'redact' && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Permanent Blackout Redaction
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      Click anywhere on the document to stamp an opaque vector blackout rectangle over private numbers, names, or addresses.
                    </p>
                  </div>
                )}

                {activeEditorTool === 'highlight' && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Highlighter Box
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      Click anywhere to place a translucent yellow highlight box over important passages.
                    </p>
                  </div>
                )}

                {activeEditorTool === 'watermark' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Diagonal Document Watermark
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={watermarkEnabled}
                          onChange={(e) => setWatermarkEnabled(e.target.checked)}
                          className="rounded text-indigo-600 h-4 w-4"
                        />
                        <span className="font-bold">{watermarkEnabled ? 'Active' : 'Off'}</span>
                      </label>
                    </div>

                    {watermarkEnabled && (
                      <>
                        <div>
                          <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                            Watermark Text
                          </label>
                          <input
                            type="text"
                            value={watermarkText}
                            onChange={(e) => setWatermarkText(e.target.value)}
                            placeholder="e.g. CONFIDENTIAL, DRAFT..."
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 placeholder-slate-400 text-slate-900 dark:text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                            Opacity ({Math.round(watermarkOpacity * 100)}%)
                          </label>
                          <input
                            type="range"
                            min="0.05"
                            max="0.6"
                            step="0.05"
                            value={watermarkOpacity}
                            onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeEditorTool === 'pages' && (
                  <div className="space-y-3">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Page Operations for Page {currentPage}
                    </span>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={rotateCurrentPage}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center gap-1 font-semibold cursor-pointer"
                      >
                        <RotateCw className="w-4 h-4 text-indigo-600" />
                        <span>Rotate 90°</span>
                      </button>

                      <button
                        onClick={duplicateCurrentPage}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Copy className="w-4 h-4 text-emerald-600" />
                        <span>Duplicate</span>
                      </button>

                      <button
                        onClick={deleteCurrentPage}
                        className="p-2.5 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 flex flex-col items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Page</span>
                      </button>
                    </div>

                    {pageActions[currentPage - 1]?.isDeleted && (
                      <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 text-xs font-semibold">
                        This page is scheduled to be removed upon export.
                      </div>
                    )}
                  </div>
                )}

                {/* Page Annotations Quick Clear */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Modifications on Page {currentPage}:{' '}
                    {textAnnotations.filter((t) => t.pageIndex === currentPage - 1).length +
                      drawingStrokes.filter((s) => s.pageIndex === currentPage - 1).length +
                      rectAnnotations.filter((r) => r.pageIndex === currentPage - 1).length}
                  </span>
                  <button
                    onClick={clearCurrentPageAnnotations}
                    className="text-slate-500 hover:text-red-500 font-semibold cursor-pointer"
                  >
                    Clear Page Marks
                  </button>
                </div>
              </div>

              {/* Export Action Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <button
                  onClick={handleApplyAndExport}
                  disabled={processing}
                  className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Embedding Modifications & Building PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Apply & Export PDF</span>
                    </>
                  )}
                </button>

                {resultBlob && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>PDF Ready!</span>
                      </div>
                      <span className="font-mono">
                        {outputSize ? `${(outputSize / 1024).toFixed(1)} KB` : ''}
                      </span>
                    </div>

                    <button
                      onClick={handleDownload}
                      className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Edited PDF</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Interactive Page Viewer (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
                {/* Page Navigation Header */}
                <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Page {currentPage} of {pagesInfo.length}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pagesInfo.length, p + 1))}
                      disabled={currentPage >= pagesInfo.length}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-slate-400 font-mono text-[11px]">
                    {pagesInfo[currentPage - 1]
                      ? `${pagesInfo[currentPage - 1].widthMm} × ${pagesInfo[currentPage - 1].heightMm} mm (${pagesInfo[currentPage - 1].detectedStandard})`
                      : ''}
                  </span>
                </div>

                {/* Canvas Display with Drawing / Click Overlay */}
                <div className="relative p-2 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center min-h-[460px] w-full overflow-hidden select-none">
                  {previewLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 z-20 rounded-xl">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {/* Base PDF Canvas */}
                  <canvas
                    ref={previewCanvasRef}
                    className="shadow-md rounded border border-slate-200 dark:border-slate-700 bg-white max-w-full block"
                  />

                  {/* Transparent Interactive Annotation Overlay Canvas */}
                  <canvas
                    ref={drawingCanvasRef}
                    onPointerDown={handleOverlayPointerDown}
                    onPointerMove={handleOverlayPointerMove}
                    onPointerUp={handleOverlayPointerUp}
                    className={`absolute inset-0 m-auto cursor-${
                      activeEditorTool === 'draw' ? 'crosshair' : activeEditorTool === 'text' ? 'text' : 'pointer'
                    }`}
                  />
                </div>

                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  Click on document to stamp {activeEditorTool.toUpperCase()}. Vector precision rendered into exported PDF.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
