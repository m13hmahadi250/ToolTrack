import React, { useEffect } from 'react';
import { useToolTrack } from '../../context/ToolTrackContext';
import { BatchProcessingDashboard } from '../batch/BatchProcessingDashboard';

export const ProcessingQueueModal: React.FC = () => {
  const { isQueueOpen, setIsQueueOpen } = useToolTrack();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isQueueOpen) {
        setIsQueueOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQueueOpen, setIsQueueOpen]);

  if (!isQueueOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200 cursor-pointer"
      onClick={() => setIsQueueOpen(false)}
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col cursor-default animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <BatchProcessingDashboard isModal={true} onClose={() => setIsQueueOpen(false)} />
      </div>
    </div>
  );
};
