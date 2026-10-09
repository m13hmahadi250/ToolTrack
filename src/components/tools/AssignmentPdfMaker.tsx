import React, { useState } from 'react';
import {
  GraduationCap,
  ArrowUp,
  ArrowDown,
  Trash2,
  RotateCw,
  Download,
  FileCheck,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Sliders,
  Layers,
  BookOpen
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { safeDrawText, safeWidthOfTextAtSize } from '../../lib/pdfTextSanitizer';
import { FileUploader } from '../common/FileUploader';
import { fileToImage } from '../../lib/imageUtils';
import { MM_TO_PT } from '../../lib/pdfRenderer';
import { useToolTrack } from '../../context/ToolTrackContext';

interface AssignmentPage {
  id: string;
  file: File;
  previewUrl: string;
  rotation: number; // 0, 90, 180, 270
}

export const AssignmentPdfMaker: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [pages, setPages] = useState<AssignmentPage[]>([]);

  // Academic Banner Metadata
  const [includeBanner, setIncludeBanner] = useState(true);
  const [courseName, setCourseName] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [studentName, setStudentName] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('tt_assignment_student_name') || '' : '';
  });
  const [studentId, setStudentId] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('tt_assignment_student_id') || '' : '';
  });
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tt_assignment_student_name', studentName);
    }
  }, [studentName]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tt_assignment_student_id', studentId);
    }
  }, [studentId]);

  // Page formatting
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
  const [marginOption, setMarginOption] = useState<'normal' | 'narrow' | 'none'>('normal');
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [compressImages, setCompressImages] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);

  const handleFilesSelected = (files: File[]) => {
    const newPages: AssignmentPage[] = files.map((f, i) => ({
      id: `${Date.now()}-${i}-${Math.random()}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      rotation: 0,
    }));
    setPages((prev) => [...prev, ...newPages]);
    setGeneratedPdfBlob(null);
  };

  const movePage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= pages.length) return;
    setPages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, item);
      return copy;
    });
  };

  const rotatePage = (idx: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const removePage = (idx: number) => {
    setPages((prev) => {
      const item = prev[idx];
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleGeneratePdf = async () => {
    if (pages.length === 0) return;
    setGenerating(true);

    const totalSize = pages.reduce((acc, p) => acc + p.file.size, 0);
    const jobId = addJob({
      fileName: `${assignmentTitle || 'Assignment'}.pdf`,
      fileSize: totalSize,
      toolId: 'assignment-pdf-maker',
      toolName: 'Assignment PDF Maker',
      status: 'processing',
      progress: 0.1,
    });

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Dimensions in pt (A4: 595.28 x 841.89)
      const pageW = pageSize === 'A4' ? 595.28 : 612.0;
      const pageH = pageSize === 'A4' ? 841.89 : 792.0;

      let marginMm = 15;
      if (marginOption === 'narrow') marginMm = 8;
      if (marginOption === 'none') marginMm = 0;
      const marginPt = marginMm * MM_TO_PT;

      const totalPages = pages.length;

      for (let i = 0; i < pages.length; i++) {
        const pageItem = pages[i];
        const page = pdfDoc.addPage([pageW, pageH]);

        let topBannerHeight = 0;
        // Draw Academic Header Banner on Page 1 if requested
        if (includeBanner && i === 0) {
          topBannerHeight = 90;
          // Banner background
          page.drawRectangle({
            x: marginPt,
            y: pageH - marginPt - topBannerHeight,
            width: pageW - marginPt * 2,
            height: topBannerHeight,
            color: rgb(0.95, 0.96, 0.98),
            borderColor: rgb(0.8, 0.84, 0.9),
            borderWidth: 1,
          });

          // Course and Assignment title
          safeDrawText(page, courseName || 'Assignment Submission', {
            x: marginPt + 15,
            y: pageH - marginPt - 24,
            size: 13,
            font: fontBold,
            color: rgb(0.1, 0.15, 0.3),
          });

          safeDrawText(page, assignmentTitle || 'Assignment', {
            x: marginPt + 15,
            y: pageH - marginPt - 42,
            size: 11,
            font,
            color: rgb(0.3, 0.35, 0.45),
          });

          // Student Details on right
          const rightX = pageW - marginPt - 180;
          if (studentName) {
            safeDrawText(page, `Name: ${studentName}`, {
              x: rightX,
              y: pageH - marginPt - 24,
              size: 10,
              font: fontBold,
              color: rgb(0.1, 0.15, 0.3),
            });
          }
          if (studentId) {
            safeDrawText(page, `ID: ${studentId}`, {
              x: rightX,
              y: pageH - marginPt - 42,
              size: 10,
              font,
              color: rgb(0.2, 0.25, 0.35),
            });
          }
          safeDrawText(page, `Date: ${submissionDate}`, {
            x: rightX,
            y: pageH - marginPt - 60,
            size: 9,
            font,
            color: rgb(0.4, 0.45, 0.55),
          });
        }

        // Process image page (compress or rotate onto canvas)
        const img = await fileToImage(pageItem.file);
        const canvas = document.createElement('canvas');
        const rot = pageItem.rotation;
        const isRot90or270 = rot === 90 || rot === 270;

        canvas.width = isRot90or270 ? img.naturalHeight : img.naturalWidth;
        canvas.height = isRot90or270 ? img.naturalWidth : img.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rot * Math.PI) / 180);
          ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        }

        // Compress image to JPEG to keep PDF small for submission portals
        const quality = compressImages ? 0.82 : 0.95;
        const imgBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', quality));
        const imgBuffer = await imgBlob.arrayBuffer();
        const embeddedImg = await pdfDoc.embedJpg(imgBuffer);

        // Usable dimensions
        const bottomReserved = includePageNumbers ? 25 : 0;
        const bannerSpacing = topBannerHeight > 0 ? topBannerHeight + 10 : 0;

        const usableW = pageW - marginPt * 2;
        const usableH = pageH - marginPt * 2 - bannerSpacing - bottomReserved;

        const scale = Math.min(usableW / canvas.width, usableH / canvas.height, 1);
        const drawW = canvas.width * scale;
        const drawH = canvas.height * scale;

        const drawX = marginPt + (usableW - drawW) / 2;
        const drawY = marginPt + bottomReserved + (usableH - drawH) / 2;

        page.drawImage(embeddedImg, {
          x: drawX,
          y: drawY,
          width: drawW,
          height: drawH,
        });

        // Page Number at bottom center
        if (includePageNumbers) {
          const pageNumStr = `Page ${i + 1} of ${totalPages}`;
          const numW = safeWidthOfTextAtSize(font, pageNumStr, 9);
          safeDrawText(page, pageNumStr, {
            x: (pageW - numW) / 2,
            y: marginPt > 0 ? marginPt / 2 : 12,
            size: 9,
            font,
            color: rgb(0.4, 0.45, 0.55),
          });
        }

        updateJob(jobId, { progress: (i + 1) / totalPages });
      }

      const pdfBytes = await pdfDoc.save();
      const outBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      setGeneratedPdfBlob(outBlob);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: outBlob,
        outputFileName: `${assignmentTitle.trim() || 'assignment'}.pdf`,
        outputSize: outBlob.size,
      });

      addRecentActivity(
        'assignment-pdf-maker',
        'Assignment PDF Maker',
        `${pages.length} pages`,
        'completed'
      );
    } catch (err: unknown) {
      console.error(err);
      updateJob(jobId, { status: 'failed', errorMessage: String(err) });
    } finally {
      setGenerating(false);
    }
  };

  const downloadAssignmentPdf = () => {
    if (!generatedPdfBlob) return;
    const url = URL.createObjectURL(generatedPdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assignmentTitle.trim().replace(/\s+/g, '_') || 'Assignment'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Academic Submission Specialist</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Assignment PDF Maker
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Combine photos and scans of handwritten homework into a standard academic A4 PDF with student cover banners, page numbers, and portal compression.
          </p>
        </div>

        {pages.length > 0 && (
          <button
            onClick={() => {
              setPages([]);
              setGeneratedPdfBlob(null);
            }}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Clear All Pages
          </button>
        )}
      </div>

      {pages.length === 0 ? (
        <div className="max-w-2xl mx-auto space-y-4">
          <FileUploader
            acceptedFormats={['.png', '.jpg', '.jpeg', '.webp']}
            multiple={true}
            maxFiles={50}
            onFilesSelected={handleFilesSelected}
            title="Upload assignment pages (photos or scans)"
            description="Drag and drop all pages at once. You can reorder, rotate, and add your name/ID."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Academic Metadata & Format (1 col) */}
          <div className="space-y-6">
            {/* Student Cover Banner Box */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 text-xs transition-all hover:shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Academic Cover Banner</span>
                </h3>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeBanner}
                    onChange={(e) => setIncludeBanner(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600 relative"></div>
                  <span className={`font-bold transition-colors ${includeBanner ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                    Include
                  </span>
                </label>
              </div>

              {includeBanner && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Course / Subject:</label>
                    <input
                      type="text"
                      placeholder="e.g. Physics 101, Math 204"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs text-slate-900 dark:text-white outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Assignment Title:</label>
                      <input
                        type="text"
                        placeholder="e.g. Homework 3, Problem Set"
                        value={assignmentTitle}
                        onChange={(e) => setAssignmentTitle(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs text-slate-900 dark:text-white outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Student Name:</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs text-slate-900 dark:text-white outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Student ID / Roll:</label>
                      <input
                        type="text"
                        placeholder="ID-99214"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs text-slate-900 dark:text-white outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Submission Date:</label>
                    <input
                      type="date"
                      value={submissionDate}
                      onChange={(e) => setSubmissionDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs text-slate-900 dark:text-white outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Document Layout Settings */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Layout & Paper Size</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="font-bold block mb-1.5">Standard Academic Paper:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPageSize('A4')}
                      className={`p-2.5 rounded-xl border font-bold text-center transition cursor-pointer ${
                        pageSize === 'A4'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      A4 (Standard Academic)
                    </button>
                    <button
                      onClick={() => setPageSize('Letter')}
                      className={`p-2.5 rounded-xl border font-bold text-center transition cursor-pointer ${
                        pageSize === 'Letter'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      US Letter
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1.5">Margins:</label>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    {(['normal', 'narrow', 'none'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMarginOption(m)}
                        className={`py-2 px-1 rounded-xl border font-bold capitalize transition cursor-pointer ${
                          marginOption === m
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePageNumbers}
                      onChange={(e) => setIncludePageNumbers(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="font-bold">Add "Page X of Y" Footer</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={compressImages}
                      onChange={(e) => setCompressImages(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="font-bold">Compress for Portal Upload (Moodle / Canvas)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleGeneratePdf}
              disabled={generating || pages.length === 0}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FileCheck className="w-5 h-5" />
              <span>Create Assignment PDF ({pages.length} Pages)</span>
            </button>

            {generatedPdfBlob && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-3 text-xs">
                <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>PDF Ready</span>
                  </div>
                  <span className="font-mono">
                    {(generatedPdfBlob.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  onClick={downloadAssignmentPdf}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Assignment PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Visual Page Reordering Grid (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Pages Sequence ({pages.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Use Up/Down arrows to reorder pages. Rotate if scanned sideways.
                  </p>
                </div>

                <label className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 cursor-pointer">
                  <span>+ Add More Pages</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {pages.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 space-y-2 relative group"
                  >
                    {/* Header badge */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 shadow-xs">
                        Page {idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => movePage(idx, idx - 1)}
                          disabled={idx === 0}
                          className="p-1 rounded bg-white dark:bg-slate-800 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => movePage(idx, idx + 1)}
                          disabled={idx === pages.length - 1}
                          className="p-1 rounded bg-white dark:bg-slate-800 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => rotatePage(idx)}
                          className="p-1 rounded bg-white dark:bg-slate-800 hover:text-indigo-600 cursor-pointer"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removePage(idx)}
                          className="p-1 rounded bg-white dark:bg-slate-800 hover:text-rose-600 cursor-pointer"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Preview Thumbnail */}
                    <div className="h-44 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      <img
                        src={p.previewUrl}
                        alt={`Page ${idx + 1}`}
                        className="max-h-full max-w-full object-contain transition-transform duration-300"
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                      />
                    </div>

                    <div className="text-[11px] text-slate-500 truncate text-center">
                      {p.file.name}
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
