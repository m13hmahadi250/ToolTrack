import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Trash2,
  Archive,
  Layers,
  FileCheck,
  Pause,
  Play,
  RotateCcw,
  Ban,
  Search,
  PlusCircle,
  FileText,
  AlertTriangle,
  Zap,
  HardDrive,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';
import JSZip from 'jszip';
import { useToolTrack } from '../../context/ToolTrackContext';
import { ProcessingJob } from '../../types';

interface BatchProcessingDashboardProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const BatchProcessingDashboard: React.FC<BatchProcessingDashboardProps> = ({
  onClose,
  isModal = true,
}) => {
  const {
    jobs,
    pauseJob,
    resumeJob,
    cancelJob,
    retryJob,
    removeJob,
    pauseAllJobs,
    resumeAllJobs,
    cancelAllJobs,
    retryAllFailedJobs,
    clearCompletedJobs,
    clearAllJobs,
    addDemoBatch,
    showToast,
  } = useToolTrack();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<
    'all' | 'active' | 'waiting' | 'completed' | 'failed'
  >('all');
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Live timer tick for real-time elapsed time rendering on active jobs
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const hasActive = jobs.some(
      (j) => j.status === 'processing' || j.status === 'analyzing'
    );
    if (!hasActive) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 250);
    return () => clearInterval(interval);
  }, [jobs]);

  // Status-based job groupings
  const activeJobs = useMemo(
    () => jobs.filter((j) => j.status === 'processing' || j.status === 'analyzing'),
    [jobs]
  );
  const pausedJobs = useMemo(() => jobs.filter((j) => j.status === 'paused'), [jobs]);
  const waitingJobs = useMemo(() => jobs.filter((j) => j.status === 'waiting'), [jobs]);
  const completedJobs = useMemo(() => jobs.filter((j) => j.status === 'completed'), [jobs]);
  const failedJobs = useMemo(
    () => jobs.filter((j) => j.status === 'failed' || j.status === 'cancelled'),
    [jobs]
  );

  // Filtered jobs according to search and active tab
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Tab filtering
      if (selectedStatusTab === 'active') {
        if (job.status !== 'processing' && job.status !== 'analyzing' && job.status !== 'paused') {
          return false;
        }
      } else if (selectedStatusTab === 'waiting') {
        if (job.status !== 'waiting') return false;
      } else if (selectedStatusTab === 'completed') {
        if (job.status !== 'completed') return false;
      } else if (selectedStatusTab === 'failed') {
        if (job.status !== 'failed' && job.status !== 'cancelled') return false;
      }

      // 2. Search filtering
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        job.fileName.toLowerCase().includes(q) ||
        job.toolName.toLowerCase().includes(q) ||
        job.id.toLowerCase().includes(q) ||
        (job.batchId && job.batchId.toLowerCase().includes(q))
      );
    });
  }, [jobs, selectedStatusTab, searchQuery]);

  // Overall batch statistics
  const totalBytesProcessed = useMemo(() => {
    return completedJobs.reduce((acc, j) => acc + (j.outputSize || j.fileSize), 0);
  }, [completedJobs]);

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDuration = (ms?: number) => {
    if (ms === undefined || ms < 0) return '0s';
    if (ms < 1000) return `${ms}ms`;
    const sec = Math.floor(ms / 1000);
    const remainderMs = Math.floor((ms % 1000) / 100);
    if (sec < 60) return `${sec}.${remainderMs}s`;
    const min = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${min}m ${remSec}s`;
  };

  const getJobElapsed = (job: ProcessingJob) => {
    if (job.processingTimeMs) return formatDuration(job.processingTimeMs);
    if (job.endTime) return formatDuration(job.endTime - job.startTime);
    if (job.status === 'processing' || job.status === 'analyzing') {
      return formatDuration(currentTime - job.startTime);
    }
    return '--';
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    const downloadable = completedJobs.filter((j) => j.outputBlob);
    if (downloadable.length === 0) {
      showToast('warning', 'No completed files ready for download.');
      return;
    }

    if (downloadable.length === 1 && downloadable[0].outputBlob) {
      downloadBlob(downloadable[0].outputBlob, downloadable[0].outputFileName || 'processed-file');
      showToast('success', `Downloaded ${downloadable[0].outputFileName || 'file'}`);
      return;
    }

    try {
      setIsZipping(true);
      setZipProgress(10);
      const zip = new JSZip();

      downloadable.forEach((job, idx) => {
        if (job.outputBlob) {
          const name = job.outputFileName || `file_${idx + 1}_${job.fileName}`;
          zip.file(name, job.outputBlob);
        }
      });

      setZipProgress(45);
      const zipBlob = await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        (metadata) => {
          setZipProgress(Math.round(metadata.percent));
        }
      );

      setZipProgress(100);
      downloadBlob(zipBlob, `ToolTrack_Batch_${Date.now()}.zip`);
      showToast('success', `Downloaded ${downloadable.length} files as unified ZIP archive`);
    } catch (err) {
      showToast('error', 'Failed to generate ZIP archive.');
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 select-none">
      {/* 1. Header Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Batch Processing Dashboard
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                PRO ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time multi-file pipeline monitor, status controllers, and batch archiver
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={addDemoBatch}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Populate test batch jobs to test pause, retry, and zip download"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>Simulate Batch</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close Dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 p-4 sm:px-6 bg-slate-100/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
            Total Tasks
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
            {jobs.length}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">
            In Progress
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1.5">
            <span>{activeJobs.length + pausedJobs.length}</span>
            {activeJobs.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Queued
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">
            {waitingJobs.length}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">
            Completed
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {completedJobs.length}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500">
            Failed / Cancelled
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
            {failedJobs.length}
          </div>
        </div>
      </div>

      {/* 3. Global Action Controls & Search Toolbar */}
      <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
        {/* Search and Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search file name, tool ID, or batch..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setSelectedStatusTab('all')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedStatusTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({jobs.length})
            </button>
            <button
              onClick={() => setSelectedStatusTab('active')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedStatusTab === 'active'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Active ({activeJobs.length + pausedJobs.length})
            </button>
            <button
              onClick={() => setSelectedStatusTab('waiting')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedStatusTab === 'waiting'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Queued ({waitingJobs.length})
            </button>
            <button
              onClick={() => setSelectedStatusTab('completed')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedStatusTab === 'completed'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Done ({completedJobs.length})
            </button>
            <button
              onClick={() => setSelectedStatusTab('failed')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedStatusTab === 'failed'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Failed ({failedJobs.length})
            </button>
          </div>
        </div>

        {/* Global Batch Controls */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {activeJobs.length > 0 && (
            <button
              onClick={pauseAllJobs}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition cursor-pointer"
              title="Pause all running tasks"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause All</span>
            </button>
          )}

          {pausedJobs.length > 0 && (
            <button
              onClick={resumeAllJobs}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition cursor-pointer"
              title="Resume all paused tasks"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume All</span>
            </button>
          )}

          {(activeJobs.length > 0 || waitingJobs.length > 0 || pausedJobs.length > 0) && (
            <button
              onClick={cancelAllJobs}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold transition cursor-pointer"
              title="Cancel all active and queued tasks"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel Active</span>
            </button>
          )}

          {failedJobs.length > 0 && (
            <button
              onClick={retryAllFailedJobs}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition cursor-pointer"
              title="Retry all failed or cancelled jobs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Failed ({failedJobs.length})</span>
            </button>
          )}

          {completedJobs.length > 0 && (
            <button
              onClick={clearCompletedJobs}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Clear completed tasks from list"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Done</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Main Job List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 min-h-[250px]">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                {searchQuery ? 'No matching batch jobs found' : 'Queue is currently clear'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                {searchQuery
                  ? `No jobs match "${searchQuery}". Clear your search query or switch tabs.`
                  : 'Start batch processing in any tool or click "Simulate Batch" above to test the dashboard.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={addDemoBatch}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-xs cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate 5-Item Batch</span>
              </button>
            )}
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isRunning = job.status === 'processing' || job.status === 'analyzing';
            const isPaused = job.status === 'paused';
            const isCompleted = job.status === 'completed';
            const isFailed = job.status === 'failed';
            const isCancelled = job.status === 'cancelled';
            const isWaiting = job.status === 'waiting';

            return (
              <div
                key={job.id}
                className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 ${
                  isRunning
                    ? 'border-indigo-400/60 dark:border-indigo-600/60 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-xs'
                    : isPaused
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20'
                    : isFailed || isCancelled
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                    : isCompleted
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60'
                }`}
              >
                {/* Top Row: File details, badge, and status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : isRunning
                          ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                          : isPaused
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                          : isFailed || isCancelled
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                          {job.fileName}
                        </span>

                        {job.totalFiles && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {job.fileIndex ? `File ${job.fileIndex} of ${job.totalFiles}` : `${job.totalFiles} files`}
                          </span>
                        )}

                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {job.id}
                        </span>
                      </div>

                      {/* Tool and size metadata */}
                      <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {job.toolName}
                        </span>
                        <span>•</span>
                        <span>Input: {formatBytes(job.fileSize)}</span>
                        {job.outputSize && (
                          <>
                            <span>→</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              Output: {formatBytes(job.outputSize)}
                            </span>
                            {job.fileSize > job.outputSize && (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                                -{Math.round(((job.fileSize - job.outputSize) / job.fileSize) * 100)}%
                              </span>
                            )}
                          </>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{getJobElapsed(job)}</span>
                        </span>
                        {job.retryCount && job.retryCount > 0 && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            (Retry #{job.retryCount})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge and Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Status Badge */}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 px-2.5 py-1 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Completed</span>
                      </span>
                    )}

                    {isRunning && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/80 px-2.5 py-1 rounded-xl">
                        <div className="w-3 h-3 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>{Math.round((job.progress || 0) * 100)}%</span>
                      </span>
                    )}

                    {isPaused && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/80 px-2.5 py-1 rounded-xl">
                        <Pause className="w-3.5 h-3.5 text-amber-500" />
                        <span>Paused</span>
                      </span>
                    )}

                    {isWaiting && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded-xl">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Queued</span>
                      </span>
                    )}

                    {isFailed && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-950/80 px-2.5 py-1 rounded-xl">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Failed</span>
                      </span>
                    )}

                    {isCancelled && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded-xl">
                        <Ban className="w-3.5 h-3.5" />
                        <span>Cancelled</span>
                      </span>
                    )}

                    {/* Job Action Buttons */}
                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                      {isRunning && (
                        <button
                          onClick={() => pauseJob(job.id)}
                          className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition cursor-pointer"
                          title="Pause job"
                          aria-label="Pause job"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}

                      {isPaused && (
                        <button
                          onClick={() => resumeJob(job.id)}
                          className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition cursor-pointer"
                          title="Resume job"
                          aria-label="Resume job"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      )}

                      {(isRunning || isWaiting || isPaused) && (
                        <button
                          onClick={() => cancelJob(job.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                          title="Cancel job"
                          aria-label="Cancel job"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}

                      {(isFailed || isCancelled) && (
                        <button
                          onClick={() => retryJob(job.id)}
                          className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition cursor-pointer"
                          title="Retry failed job"
                          aria-label="Retry failed job"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}

                      {isCompleted && job.outputBlob && (
                        <button
                          onClick={() =>
                            downloadBlob(job.outputBlob!, job.outputFileName || 'processed-file')
                          }
                          className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
                          title="Download processed file"
                          aria-label="Download processed file"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => removeJob(job.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Dismiss job"
                        aria-label="Dismiss job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar for Active / Paused Jobs */}
                {(isRunning || isPaused || isWaiting) && (
                  <div className="space-y-1 pt-1">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isPaused
                            ? 'bg-amber-500'
                            : isWaiting
                            ? 'bg-slate-400'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.max(4, Math.round((job.progress || 0) * 100))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {isWaiting
                          ? 'Waiting in queue...'
                          : isPaused
                          ? 'Processing paused'
                          : 'Executing batch step...'}
                      </span>
                      <span className="font-mono font-semibold">
                        {Math.round((job.progress || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Error Banner if Job Failed */}
                {job.errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/80 flex items-start justify-between gap-3 text-xs text-rose-700 dark:text-rose-300">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{job.errorMessage}</span>
                    </div>
                    <button
                      onClick={() => retryJob(job.id)}
                      className="font-bold underline text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-white shrink-0 cursor-pointer"
                    >
                      Retry Now
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. Sticky Footer: Batch ZIP Archiver & Final Summary */}
      <div className="p-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {completedJobs.length} of {jobs.length} tasks ready
          </span>
          {completedJobs.length > 0 && (
            <span> • Total size: {formatBytes(totalBytesProcessed)}</span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {jobs.length > 0 && (
            <button
              onClick={clearAllJobs}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Clear All
            </button>
          )}

          <button
            onClick={handleDownloadAllZip}
            disabled={completedJobs.length === 0 || isZipping}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            {isZipping ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Zipping {zipProgress}%...</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                <span>Download All Completed as ZIP ({completedJobs.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
