import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SupportedLanguage } from '../lib/i18n';
import { TRANSLATIONS } from '../lib/i18n';
import type { ProcessingJob, RecentActivityItem } from '../types';
import type { InfoModalType } from '../components/common/InfoModal';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
}

interface ToolTrackContextType {
  activeToolId: string | null;
  setActiveToolId: (id: string | null) => void;
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  t: typeof TRANSLATIONS.en;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  jobs: ProcessingJob[];
  addJob: (job: Omit<ProcessingJob, 'id' | 'startTime'>) => string;
  updateJob: (id: string, updates: Partial<ProcessingJob>) => void;
  clearCompletedJobs: () => void;
  recentActivity: RecentActivityItem[];
  addRecentActivity: (toolId: string, toolName: string, fileName: string, status: 'completed' | 'failed') => void;
  clearRecentActivity: () => void;
  recentToolIds: string[];
  trackAccessedTool: (toolId: string) => void;
  clearRecentTools: () => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  isActivityOpen: boolean;
  setIsActivityOpen: (open: boolean) => void;
  isMegaMenuOpen: boolean;
  setIsMegaMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  activeInfoModal: InfoModalType;
  setActiveInfoModal: (type: InfoModalType | ((prev: InfoModalType) => InfoModalType)) => void;
  triggerSearch: () => void;
  closeAllModals: () => void;
  toasts: ToastMessage[];
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToolTrackContext = createContext<ToolTrackContextType | undefined>(undefined);

export function ToolTrackProvider({ children }: { children: React.ReactNode }) {
  // Always start with home page (null)
  const [activeToolId, setActiveToolIdState] = useState<string | null>(null);

  // Clear any stale normalize-pdf-page-size hash on startup to ensure home page loads first
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#normalize-pdf-page-size' || window.location.hash === '#/' || window.location.hash === '#') {
        history.replaceState('', document.title, window.location.pathname + window.location.search);
        setActiveToolIdState(null);
      }
    }
  }, []);

  const [lang, setLangState] = useState<SupportedLanguage>('en');

  const [darkMode, setDarkMode] = useState<boolean>(true);

  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tt_recent');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [recentToolIds, setRecentToolIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tt_recent_tools');
        if (saved) return JSON.parse(saved);
        // Fallback: populate from recent activity history if available
        const activity = localStorage.getItem('tt_recent');
        if (activity) {
          const parsed = JSON.parse(activity);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const ids = Array.from(new Set(parsed.map((a: any) => a.toolId))).filter(Boolean) as string[];
            return ids.slice(0, 8);
          }
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  const trackAccessedTool = (toolId: string) => {
    if (!toolId) return;
    setRecentToolIds((prev) => {
      const filtered = prev.filter((id) => id !== toolId);
      const updated = [toolId, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('tt_recent_tools', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearRecentTools = () => {
    setRecentToolIds([]);
    try {
      localStorage.removeItem('tt_recent_tools');
    } catch {}
  };

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<InfoModalType>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const closeAllModals = () => {
    setIsQueueOpen(false);
    setIsActivityOpen(false);
    setIsMegaMenuOpen(false);
    setActiveInfoModal(null);
  };

  const triggerSearch = () => {
    closeAllModals();
    window.dispatchEvent(new CustomEvent('tooltrack:trigger-search'));
  };

  // Global Keyboard Shortcut Listener for Ctrl+K and Escape
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl+K or Cmd+K: Trigger search bar globally
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSearch();
        return;
      }

      // 2. Escape: Exit modals, exit search, or navigate/exit file selection menus
      if (e.key === 'Escape') {
        if (activeInfoModal) {
          e.preventDefault();
          setActiveInfoModal(null);
          return;
        }

        if (isQueueOpen) {
          e.preventDefault();
          setIsQueueOpen(false);
          return;
        }

        if (isActivityOpen) {
          e.preventDefault();
          setIsActivityOpen(false);
          return;
        }

        if (isMegaMenuOpen) {
          e.preventDefault();
          setIsMegaMenuOpen(false);
          return;
        }

        // Notify Header, search inputs, and file selection menus
        window.dispatchEvent(new CustomEvent('tooltrack:escape'));
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [activeInfoModal, isQueueOpen, isActivityOpen, isMegaMenuOpen]);

  // Sync hash routing
  const setActiveToolId = (id: string | null) => {
    setActiveToolIdState(id);
    if (id) {
      trackAccessedTool(id);
    }
    if (typeof window !== 'undefined') {
      if (id) {
        window.location.hash = id;
      } else {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setActiveToolIdState(hash || null);
      if (hash) {
        trackAccessedTool(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tt_dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tt_dark', 'false');
    }
  }, [darkMode]);

  // Sync language
  const setLang = (newLang: SupportedLanguage) => {
    setLangState(newLang);
    localStorage.setItem('tt_lang', newLang);
    document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
  };

  useEffect(() => {
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }, [lang]);

  const addJob = (job: Omit<ProcessingJob, 'id' | 'startTime'>): string => {
    const id = `TT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newJob: ProcessingJob = {
      ...job,
      id,
      startTime: Date.now(),
    };
    setJobs((prev) => [newJob, ...prev]);
    return id;
  };

  const updateJob = (id: string, updates: Partial<ProcessingJob>) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...updates, ...(updates.status === 'completed' || updates.status === 'failed' ? { endTime: Date.now() } : {}) } : j))
    );
  };

  const clearCompletedJobs = () => {
    setJobs((prev) => prev.filter((j) => j.status === 'processing' || j.status === 'analyzing' || j.status === 'waiting'));
  };

  const addRecentActivity = (toolId: string, toolName: string, fileName: string, status: 'completed' | 'failed') => {
    const item: RecentActivityItem = {
      id: Math.random().toString(36).substring(2, 9),
      toolId,
      toolName,
      fileName,
      timestamp: Date.now(),
      status,
    };
    setRecentActivity((prev) => {
      const updated = [item, ...prev.filter((i) => i.fileName !== fileName || i.toolId !== toolId)].slice(0, 20);
      try {
        localStorage.setItem('tt_recent', JSON.stringify(updated));
      } catch {
        // storage quota
      }
      return updated;
    });
  };

  const clearRecentActivity = () => {
    setRecentActivity([]);
    localStorage.removeItem('tt_recent');
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  return (
    <ToolTrackContext.Provider
      value={{
        activeToolId,
        setActiveToolId,
        lang,
        setLang,
        t,
        darkMode,
        setDarkMode,
        jobs,
        addJob,
        updateJob,
        clearCompletedJobs,
        recentActivity,
        addRecentActivity,
        clearRecentActivity,
        recentToolIds,
        trackAccessedTool,
        clearRecentTools,
        isQueueOpen,
        setIsQueueOpen,
        isActivityOpen,
        setIsActivityOpen,
        isMegaMenuOpen,
        setIsMegaMenuOpen,
        activeInfoModal,
        setActiveInfoModal,
        triggerSearch,
        closeAllModals,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}

      {/* Global Accessible Toast Notification Container */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          let Icon = CheckCircle2;
          let iconClass = 'text-emerald-500';
          let borderClass = 'border-emerald-500/40';

          if (toast.type === 'error') {
            Icon = AlertCircle;
            iconClass = 'text-red-500';
            borderClass = 'border-red-500/40';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            iconClass = 'text-amber-500';
            borderClass = 'border-amber-500/40';
          } else if (toast.type === 'info') {
            Icon = Info;
            iconClass = 'text-indigo-500';
            borderClass = 'border-indigo-500/40';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-xl border ${borderClass} bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xl flex items-start justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200`}
              role="alert"
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconClass}`} />
                <div className="space-y-0.5">
                  {toast.title && (
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                      {toast.title}
                    </h5>
                  )}
                  <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                    {toast.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToolTrackContext.Provider>
  );
}

export function useToolTrack() {
  const context = useContext(ToolTrackContext);
  if (!context) {
    throw new Error('useToolTrack must be used within a ToolTrackProvider');
  }
  return context;
}
