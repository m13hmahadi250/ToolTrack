import React from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Trash2,
  Archive,
  Layers,
  FileCheck
} from 'lucide-react';
import JSZip from 'jszip';
import { useToolTrack } from '../../context/ToolTrackContext';

export const ProcessingQueueModal: React.FC = () => {
  const { isQueueOpen, setIsQueueOpen, jobs, clearCompletedJobs } = useToolTrack();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isQueueOpen) {
        setIsQueueOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQueueOpen, setIsQueueOpen]);

  if (!isQueueOpen) return null;

  const completedJobs = jobs.filter((j) => j.status === 'completed' && j.outputBlob);

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
    if (completedJobs.length === 0) return;

    if (completedJobs.length === 1 && completedJobs[0].outputBlob) {
      downloadBlob(completedJobs[0].outputBlob, completedJobs[0].outputFileName || 'processed-file');
      return;
    }

    const zip = new JSZip();
    completedJobs.forEach((job, idx) => {
      if (job.outputBlob) {
        const name = job.outputFileName || `file-${idx + 1}`;
        zip.file(name, job.outputBlob);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    downloadBlob(content, `ToolTrack-Batch-${Date.now()}.zip`);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 cursor-pointer"
      onClick={() => setIsQueueOpen(false)}
    >
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[90vh] flex flex-col cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Batch Processing Queue
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {jobs.length} total tasks • {completedJobs.length} completed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {completedJobs.length > 0 && (
              <button
                onClick={clearCompletedJobs}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Finished</span>
              </button>
            )}
            <button
              onClick={() => setIsQueueOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Job List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {jobs.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <FileCheck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Queue is currently empty
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Upload files to any tool to automatically monitor progress and batch download results.
              </p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {job.fileName}
                      </span>
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                        {job.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{job.toolName}</span>
                      <span>•</span>
                      <span>{formatBytes(job.fileSize)}</span>
                      {job.outputSize && (
                        <>
                          <span>→</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatBytes(job.outputSize)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status badge & action */}
                  <div className="flex items-center gap-2 shrink-0">
                    {job.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    )}

                    {job.status === 'processing' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg">
                        <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing</span>
                      </span>
                    )}

                    {job.status === 'failed' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2.5 py-1 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Failed</span>
                      </span>
                    )}

                    {job.outputBlob && (
                      <button
                        onClick={() =>
                          downloadBlob(job.outputBlob!, job.outputFileName || 'processed-file')
                        }
                        className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {(job.status === 'processing' || job.status === 'analyzing') && (
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(job.progress * 100)}%` }}
                    ></div>
                  </div>
                )}

                {job.errorMessage && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {job.errorMessage}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {completedJobs.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Ready to download {completedJobs.length} processed file{completedJobs.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={handleDownloadAllZip}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-sm"
            >
              <Archive className="w-4 h-4" />
              <span>Download All as ZIP</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
