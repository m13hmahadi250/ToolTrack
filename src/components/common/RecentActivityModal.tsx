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
      className="fixed inset-0 z-50 overflow-y-auto bg-[#101828]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 cursor-pointer"
      onClick={() => setIsActivityOpen(false)}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-[#111C2E] rounded-2xl shadow-2xl border border-[#DCE3EF] dark:border-[#1E2D47] p-6 max-h-[85vh] flex flex-col cursor-default animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DCE3EF] dark:border-[#1E2D47]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EAF1FF] dark:bg-[#172338] text-[#2563EB] dark:text-[#3B82F6]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#101828] dark:text-[#F2F4F7]">Recent Activity</h3>
              <p className="text-xs text-[#667085] dark:text-[#8292A9]">
                Log of tools and files processed in this session. No file content is retained.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {recentActivity.length > 0 && (
              <button
                onClick={clearRecentActivity}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
            <button
              onClick={() => setIsActivityOpen(false)}
              className="p-1.5 rounded-lg text-[#667085] hover:text-[#101828] dark:hover:text-[#F2F4F7] hover:bg-[#EAF1FF] dark:hover:bg-[#172338] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
          {recentActivity.length === 0 ? (
            <div className="text-center py-10 text-[#667085] dark:text-[#8292A9] text-sm">
              <Clock className="w-8 h-8 mx-auto text-[#667085] dark:text-[#8292A9] mb-2" />
              <p>No recent activity recorded yet.</p>
            </div>
          ) : (
            recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border border-[#DCE3EF] dark:border-[#1E2D47] bg-[#F5F8FF] dark:bg-[#172338]/60 hover:bg-[#EAF1FF] dark:hover:bg-[#172338] transition group"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-[#101828] dark:text-[#F2F4F7] truncate">
                      {item.fileName}
                    </span>
                    {item.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#667085] dark:text-[#8292A9] mt-0.5">
                    <span className="text-[#2563EB] dark:text-[#3B82F6] font-medium">
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
                  className="flex items-center gap-1 text-xs font-semibold text-[#344054] dark:text-[#B8C4D6] group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#111C2E] transition"
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
