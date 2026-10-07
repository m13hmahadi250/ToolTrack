import React from 'react';
import {
  FileText,
  Layers,
  Cpu,
  CheckCircle2,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';

export interface PdfProgressDetails {
  page?: number;
  totalPages?: number;
  phase?: 'structure' | 'pages' | 'finalizing';
}

export interface PdfProgressIndicatorProps {
  fileName?: string;
  fileSize?: string;
  progress: number; // 0.0 to 1.0 (or 0 to 100)
  statusMessage?: string;
  details?: PdfProgressDetails;
  onCancel?: () => void;
  className?: string;
}

/**
 * Visual Progress Indicator for PDF Processing Tasks
 * Displays real-time progress percentages, page-by-page progress bars,
 * stage indicators, and responsive controls for large documents.
 */
export const PdfProgressIndicator: React.FC<PdfProgressIndicatorProps> = ({
  fileName,
  fileSize,
  progress,
  statusMessage = 'Optimizing PDF document...',
  details,
  onCancel,
  className = '',
}) => {
  // Normalize progress to 0-100 range
  const normalizedPct = Math.min(
    100,
    Math.max(0, progress <= 1 ? Math.round(progress * 100) : Math.round(progress))
  );

  const currentPage = details?.page ?? null;
  const totalPages = details?.totalPages ?? null;

  // Determine active visual phase
  const getPhaseIndex = () => {
    if (normalizedPct >= 95) return 2; // Finalizing
    if (details?.phase === 'pages' || normalizedPct > 20) return 1; // Page Compaction
    return 0; // Structure & Analysis
  };

  const phaseIndex = getPhaseIndex();

  const phases = [
    { title: 'Structure Scan', subtitle: 'Metadata & Streams', icon: FileText },
    { title: 'Page Compaction', subtitle: 'Raster & Resampling', icon: Cpu },
    { title: 'Anti-Bloat Check', subtitle: 'Lossless Verification', icon: CheckCircle2 },
  ];

  return (
    <div
      className={`w-full relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-white p-5 sm:p-7 ${className}`}
      aria-live="polite"
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-radial from-indigo-900/30 via-slate-900/80 to-slate-950 pointer-events-none" />
      <div className="absolute -top-10 right-10 w-64 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-64 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header: Document Info + Percentage + Cancel Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                  ToolTrack PDF Engine
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-bold text-indigo-300">
                  Client-Side Wasm
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-100 truncate max-w-xs sm:max-w-md">
                {fileName || 'PDF Document'}
              </h4>
              {fileSize && (
                <span className="text-xs text-slate-400 font-mono">
                  Original: {fileSize}
                  {totalPages ? ` • ${totalPages} page${totalPages > 1 ? 's' : ''}` : ''}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Percentage Badge */}
            <div className="text-right">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 font-mono tracking-tight">
                  {normalizedPct}
                </span>
                <span className="text-xs font-bold text-sky-400 font-mono">%</span>
              </div>
              <span className="text-[10px] text-slate-400 block -mt-1 font-medium">
                {normalizedPct < 30 ? 'Analyzing' : normalizedPct < 90 ? 'Compressing' : 'Verifying'}
              </span>
            </div>

            {/* Optional Abort/Cancel Button */}
            {onCancel && (
              <button
                onClick={onCancel}
                title="Cancel processing"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700/60 hover:border-rose-800/60 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Dual Progress Bar Track */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping shrink-0" />
              <span className="font-semibold text-slate-200 truncate max-w-xs sm:max-w-md">
                {statusMessage}
              </span>
            </div>

            {currentPage && totalPages && (
              <span className="shrink-0 font-mono font-bold text-xs text-sky-300 bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-800/50">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>

          {/* Main Animated Progress Bar */}
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/80 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-300 ease-out relative shadow-sm shadow-indigo-500/50"
              style={{ width: `${normalizedPct}%` }}
            >
              {/* Shimmer pulse effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Phase Pipeline Step Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
          {phases.map((phase, idx) => {
            const Icon = phase.icon;
            const isCompleted = idx < phaseIndex;
            const isActive = idx === phaseIndex;
            const isUpcoming = idx > phaseIndex;

            return (
              <div
                key={phase.title}
                className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center sm:items-start text-center sm:text-left ${
                  isActive
                    ? 'bg-slate-850 border-sky-500/50 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/20'
                    : isCompleted
                    ? 'bg-slate-900/60 border-emerald-500/30 text-slate-300'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider hidden sm:inline ${
                      isActive ? 'text-sky-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    Phase {idx + 1}
                  </span>
                </div>

                <div className="min-w-0">
                  <span
                    className={`text-xs font-bold block truncate ${
                      isActive ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {phase.title}
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:block truncate mt-0.5">
                    {phase.subtitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Guarantee Info */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Anti-Bloat Engine Active: Output will never exceed original size.</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Privacy Preserved: 100% In-Memory Local Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
};
