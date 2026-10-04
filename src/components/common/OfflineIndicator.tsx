import React from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, wasOffline } = useOnlineStatus();

  // Show "Back Online" temporary pill when connection returns
  if (isOnline && wasOffline) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Connected — Online features restored</span>
      </div>
    );
  }

  // If online and not recently offline, don't show anything
  if (isOnline) {
    return null;
  }

  // Small, professional, non-intrusive offline badge
  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/95 dark:bg-slate-900/95 border border-amber-500/40 text-amber-300 text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </span>
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>Offline Mode — Browser tools & Whiteboard remain active</span>
    </div>
  );
};
