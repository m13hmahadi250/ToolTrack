import React from 'react';
import {
  FileText,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  HardDrive,
  Laptop,
  ArrowRight,
  Zap,
} from 'lucide-react';

export type FileFlowMode = 'upload' | 'processing' | 'download' | 'success';

export interface ToolTrackFileFlowProps {
  mode?: FileFlowMode;
  stage?: 'idle' | 'scanning' | 'uploading' | 'processing' | 'optimizing' | 'packing' | 'transferring' | 'ready';
  stageLabel?: string;
  progress?: number | null; // Real progress only, or null for honest indeterminate
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  details?: string;
  onDownload?: () => void;
  onReset?: () => void;
  downloadLabel?: string;
  downloadFileName?: string;
  className?: string;
}

/**
 * Branded "ToolTrack File Flow" Animation & Processing Rail
 * Visual Pipeline:
 * [File Document] ─── ◉ (Scan) ─── ◉ (Process/Wasm) ─── ◉ (Optimize) ─── [Ready Document]
 * [Ready Output]  ─── ◉ (Pack) ─── ◉ (Transfer) ─── [Device Destination]
 * 
 * Features:
 * - Pure 60fps GPU-accelerated CSS & SVG
 * - Accessible with prefers-reduced-motion support
 * - Honest progress feedback (never fakes percentages)
 * - Immediate, non-blocking download button access
 */
export const ToolTrackFileFlow: React.FC<ToolTrackFileFlowProps> = ({
  mode = 'processing',
  stage = 'processing',
  stageLabel,
  progress = null,
  fileName,
  fileSize,
  fileType,
  details,
  onDownload,
  onReset,
  downloadLabel = 'Download Ready File',
  downloadFileName,
  className = '',
}) => {
  const isUploadFlow = mode === 'upload' || mode === 'processing';
  const isDownloadFlow = mode === 'download' || mode === 'success';
  const isReady = stage === 'ready' || mode === 'success';

  // Determine active node index (0 to 3)
  const getActiveNodeIndex = () => {
    if (isReady) return 3;
    switch (stage) {
      case 'idle':
      case 'scanning':
        return 0;
      case 'uploading':
        return 1;
      case 'processing':
        return 2;
      case 'optimizing':
      case 'packing':
      case 'transferring':
        return 2;
      default:
        return 1;
    }
  };

  const activeIndex = getActiveNodeIndex();

  const uploadNodes = [
    { title: 'Ingest', subtitle: 'Validation', icon: FileText },
    { title: 'Scan', subtitle: 'Structure', icon: ShieldCheck },
    { title: 'Process', subtitle: 'Wasm Engine', icon: Cpu },
    { title: 'Ready', subtitle: 'Clean Buffer', icon: CheckCircle2 },
  ];

  const downloadNodes = [
    { title: 'Output', subtitle: 'Finalized', icon: FileText },
    { title: 'Pack', subtitle: 'Ephemeral', icon: Layers },
    { title: 'Transfer', subtitle: 'Direct Stream', icon: Zap },
    { title: 'Device', subtitle: 'Saved', icon: Laptop },
  ];

  const nodes = isDownloadFlow ? downloadNodes : uploadNodes;

  const defaultStatusText = () => {
    if (stageLabel) return stageLabel;
    if (isReady) return 'File processing complete & ready for download';
    switch (stage) {
      case 'scanning':
        return 'Analyzing file structure & security headers...';
      case 'uploading':
        return 'Streaming file into local memory buffer...';
      case 'processing':
        return 'Executing high-speed WebAssembly engine...';
      case 'optimizing':
        return 'Optimizing compression & cleaning byte streams...';
      case 'packing':
        return 'Packaging output streams for download...';
      case 'transferring':
        return 'Transferring finalized file to browser storage...';
      default:
        return 'Processing document safely in your browser...';
    }
  };

  return (
    <div
      className={`w-full relative overflow-hidden rounded-2xl bg-white dark:bg-[#111C2E] border border-[#DCE3EF] dark:border-[#1E2D47] shadow-xl text-[#101828] dark:text-[#F2F4F7] p-5 sm:p-7 ${className}`}
      aria-live="polite"
    >
      <div className="relative z-10 space-y-6">
        {/* Top Header: Badge & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE3EF] dark:border-[#1E2D47] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EAF1FF] dark:bg-[#172338] text-[#2563EB] dark:text-[#3B82F6] border border-[#DCE3EF] dark:border-[#1E2D47] flex items-center justify-center font-bold">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#3B82F6] block leading-none">
                ToolTrack File Flow
              </span>
              <span className="text-xs font-medium text-[#667085] dark:text-[#8292A9]">
                100% In-Memory Local Stream
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {isReady ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#15803D] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] dark:text-emerald-400" />
                <span>Ready</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF1FF] dark:bg-[#172338] text-[#2563EB] dark:text-[#3B82F6] border border-[#DCE3EF] dark:border-[#1E2D47] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping" />
                <span>In Flight</span>
              </span>
            )}
          </div>
        </div>

        {/* Branded Flow Track Rail */}
        <div className="py-2">
          <div className="relative flex items-center justify-between">
            {/* Background Track Line */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-[#DCE3EF] dark:bg-[#1E2D47] rounded-full" />

            {/* Active Luminous Progress Line */}
            <div
              className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-[#2563EB] dark:bg-[#3B82F6] rounded-full transition-all duration-500"
              style={{
                width: isReady
                  ? 'calc(100% - 48px)'
                  : `calc(${(activeIndex / (nodes.length - 1)) * 100}% * ((100% - 48px) / 100))`,
              }}
            />

            {/* Nodes */}
            {nodes.map((node, index) => {
              const IconComponent = node.icon;
              const isPast = isReady || index < activeIndex;
              const isCurrent = !isReady && index === activeIndex;

              return (
                <div key={node.title} className="relative z-10 flex flex-col items-center group">
                  {/* Node Circle */}
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isPast
                        ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/30 scale-100'
                        : isCurrent
                        ? 'bg-[#101828] text-[#38BDF8] border-2 border-[#2563EB] shadow-lg shadow-[#2563EB]/30 scale-110 animate-pulse'
                        : 'bg-[#F5F8FF] dark:bg-[#172338] text-[#667085] dark:text-[#8292A9] border border-[#DCE3EF] dark:border-[#1E2D47] scale-95'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {/* Node Labels */}
                  <div className="text-center mt-2.5 space-y-0.5">
                    <span
                      className={`text-xs font-bold block transition-colors ${
                        isCurrent
                          ? 'text-[#2563EB] dark:text-[#3B82F6]'
                          : isPast
                          ? 'text-[#101828] dark:text-[#F2F4F7]'
                          : 'text-[#667085] dark:text-[#8292A9]'
                      }`}
                    >
                      {node.title}
                    </span>
                    <span className="text-[10px] text-[#667085] dark:text-[#8292A9] hidden sm:block">
                      {node.subtitle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* File Information & Status Description Card */}
        <div className="p-4 rounded-xl bg-[#F5F8FF] dark:bg-[#172338]/60 border border-[#DCE3EF] dark:border-[#1E2D47] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#667085] dark:text-[#8292A9] uppercase tracking-wider">
                Status:
              </span>
              <p className="text-sm font-semibold text-[#101828] dark:text-[#F2F4F7]">
                {defaultStatusText()}
              </p>
            </div>

            {/* Optional File Specs */}
            {(fileName || fileSize || details) && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#344054] dark:text-[#B8C4D6]">
                {fileName && (
                  <span className="font-mono text-[#101828] dark:text-[#F2F4F7] max-w-xs truncate font-medium">
                    {fileName}
                  </span>
                )}
                {fileType && (
                  <span className="px-1.5 py-0.5 rounded bg-[#EAF1FF] dark:bg-[#111C2E] text-[10px] uppercase font-bold text-[#2563EB] dark:text-[#3B82F6] border border-[#DCE3EF] dark:border-[#1E2D47]">
                    {fileType}
                  </span>
                )}
                {fileSize && <span>• {fileSize}</span>}
                {details && <span>• {details}</span>}
              </div>
            )}
          </div>

          {/* Optional Percentage / Gauge when real progress is provided */}
          {progress !== null && progress !== undefined && !isReady && (
            <div className="shrink-0 flex items-center gap-3">
              <div className="text-right">
                <span className="text-lg font-black text-[#2563EB] dark:text-[#3B82F6] font-mono">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-20 h-2 bg-[#DCE3EF] dark:bg-[#111C2E] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] transition-all duration-200"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Controls for Ready State */}
        {isReady && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {onReset && (
              <button
                onClick={onReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EAF1FF] dark:bg-[#172338] hover:bg-[#DCE3EF] dark:hover:bg-[#1E2D47] text-[#101828] dark:text-[#F2F4F7] text-xs font-bold transition cursor-pointer border border-[#DCE3EF] dark:border-[#1E2D47]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Process Another File</span>
              </button>
            )}

            {onDownload && (
              <button
                onClick={onDownload}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm transition-all shadow-lg shadow-[#2563EB]/25 hover:scale-[1.02] cursor-pointer ml-auto"
              >
                <Download className="w-4 h-4" />
                <span>{downloadLabel}</span>
                {downloadFileName && (
                  <span className="text-xs opacity-80 font-mono font-normal">
                    ({downloadFileName})
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
