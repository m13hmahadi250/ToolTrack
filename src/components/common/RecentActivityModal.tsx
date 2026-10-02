import React from 'react';
import { X, Clock, Trash2, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToolTrack } from '../../context/ToolTrackContext';

export const RecentActivityModal: React.FC = () => {
  const { isActivityOpen, setIsActivityOpen, recentActivity, clearRecentActivity, setActiveToolId } = useToolTrack();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActivityOpen) {
        setIsActivityOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActivityOpen, setIsActivityOpen]);

  if (!isActivityOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 cursor-pointer"
      onClick={() => setIsActivityOpen(false)}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[85vh] flex flex-col cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recent Activity</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log of tools and files processed in this session. No file content is retained.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {recentActivity.length > 0 && (
              <button
                onClick={clearRecentActivity}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
            <button
              onClick={() => setIsActivityOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
          {recentActivity.length === 0 ? (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm">
              <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p>No recent activity recorded yet.</p>
            </div>
          ) : (
            recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition group"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {item.fileName}
                    </span>
                    {item.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {item.toolName}
                    </span>
                    <span>•</span>
                    <span>{formatDate(item.timestamp)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveToolId(item.toolId);
                    setIsActivityOpen(false);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition"
                  title="Open this tool"
                >
                  <span>Open</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
