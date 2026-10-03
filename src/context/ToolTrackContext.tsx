import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SupportedLanguage } from '../lib/i18n';
import { TRANSLATIONS } from '../lib/i18n';
import type { ProcessingJob, RecentActivityItem } from '../types';
import type { InfoModalType } from '../components/common/InfoModal';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import {
  SITE_CONFIG,
  TOOLS_SEO,
  CATEGORIES_SEO,
  resolveSeoRoute,
  updateDocumentSeo,
  generateToolJsonLd,
  generateCategoryJsonLd,
} from '../data/seoRegistry';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
}

interface ToolTrackContextType {
  activeToolId: string | null;
  setActiveToolId: (id: string | null) => void;
  activeCategoryKey: string | null;
  setActiveCategoryKey: (key: string | null) => void;
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
  favoriteToolIds: string[];
  toggleFavoriteTool: (toolId: string) => void;
  isFavoriteTool: (toolId: string) => boolean;
  clearFavoriteTools: () => void;
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
  const [activeToolId, setActiveToolIdState] = useState<string | null>(null);
  const [activeCategoryKey, setActiveCategoryKeyState] = useState<string | null>(null);

  // Initialize clean route from current URL path or hash on startup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const routeInfo = resolveSeoRoute(window.location.pathname, window.location.hash);
      if (routeInfo.type === 'tool' && routeInfo.tool) {
        setActiveToolIdState(routeInfo.tool.toolId);
        setActiveCategoryKeyState(null);
        if (window.location.hash || window.location.pathname !== routeInfo.tool.route) {
          history.replaceState('', document.title, routeInfo.tool.route);
        }
        updateDocumentSeo({
          title: routeInfo.tool.seoTitle,
          description: routeInfo.tool.seoDescription,
          canonicalUrl: routeInfo.canonicalUrl,
          jsonLd: generateToolJsonLd(routeInfo.tool),
        });
      } else if (routeInfo.type === 'category' && routeInfo.category) {
        setActiveCategoryKeyState(routeInfo.category.key);
        setActiveToolIdState(null);
        if (window.location.hash || window.location.pathname !== routeInfo.category.route) {
          history.replaceState('', document.title, routeInfo.category.route);
        }
        updateDocumentSeo({
          title: routeInfo.category.seoTitle,
          description: routeInfo.category.seoDescription,
          canonicalUrl: routeInfo.canonicalUrl,
          jsonLd: generateCategoryJsonLd(routeInfo.category),
        });
      } else {
        setActiveToolIdState(null);
        setActiveCategoryKeyState(null);
        if (window.location.hash === '#normalize-pdf-page-size' || window.location.hash === '#/' || window.location.hash === '#') {
          history.replaceState('', document.title, '/');
        }
        updateDocumentSeo({
          title: SITE_CONFIG.defaultTitle,
          description: SITE_CONFIG.defaultDescription,
          canonicalUrl: `${SITE_CONFIG.url}/`,
        });
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
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed : [];
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
      localStorage.setItem('tt_recent_tools', JSON.stringify([]));
    } catch {}
  };

  const [favoriteToolIds, setFavoriteToolIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tt_favorite_tools');
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed : [];
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  const toggleFavoriteTool = (toolId: string) => {
    if (!toolId) return;
    setFavoriteToolIds((prev) => {
      const isFav = prev.includes(toolId);
      const updated = isFav ? prev.filter((id) => id !== toolId) : [...prev, toolId];
      try {
        localStorage.setItem('tt_favorite_tools', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const isFavoriteTool = (toolId: string) => favoriteToolIds.includes(toolId);

  const clearFavoriteTools = () => {
    setFavoriteToolIds([]);
    try {
      localStorage.setItem('tt_favorite_tools', JSON.stringify([]));
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

  // Sync hash and SEO routing
  const setActiveToolId = (id: string | null) => {
    setActiveToolIdState(id);
    if (id) {
      trackAccessedTool(id);
      setActiveCategoryKeyState(null);
      const toolDef = TOOLS_SEO[id];
      if (typeof window !== 'undefined') {
        const route = toolDef ? toolDef.route : `#${id}`;
        history.pushState('', document.title, route);
        if (toolDef) {
          updateDocumentSeo({
            title: toolDef.seoTitle,
            description: toolDef.seoDescription,
            canonicalUrl: `${SITE_CONFIG.url}${toolDef.route}`,
            jsonLd: generateToolJsonLd(toolDef),
          });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      if (typeof window !== 'undefined') {
        history.pushState('', document.title, '/');
        updateDocumentSeo({
          title: SITE_CONFIG.defaultTitle,
          description: SITE_CONFIG.defaultDescription,
          canonicalUrl: `${SITE_CONFIG.url}/`,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const setActiveCategoryKey = (key: string | null) => {
    setActiveCategoryKeyState(key);
    if (key) {
      setActiveToolIdState(null);
      const catDef = CATEGORIES_SEO[key];
      if (typeof window !== 'undefined') {
        const route = catDef ? catDef.route : '/';
        history.pushState('', document.title, route);
        if (catDef) {
          updateDocumentSeo({
            title: catDef.seoTitle,
            description: catDef.seoDescription,
            canonicalUrl: `${SITE_CONFIG.url}${catDef.route}`,
            jsonLd: generateCategoryJsonLd(catDef),
          });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      if (typeof window !== 'undefined') {
        history.pushState('', document.title, '/');
        updateDocumentSeo({
          title: SITE_CONFIG.defaultTitle,
          description: SITE_CONFIG.defaultDescription,
          canonicalUrl: `${SITE_CONFIG.url}/`,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    const handleNavigation = () => {
      const routeInfo = resolveSeoRoute(window.location.pathname, window.location.hash);
      if (routeInfo.type === 'tool' && routeInfo.tool) {
        setActiveToolIdState(routeInfo.tool.toolId);
        setActiveCategoryKeyState(null);
        trackAccessedTool(routeInfo.tool.toolId);
      } else if (routeInfo.type === 'category' && routeInfo.category) {
        setActiveCategoryKeyState(routeInfo.category.key);
        setActiveToolIdState(null);
      } else {
        const hash = window.location.hash.replace('#', '');
        setActiveToolIdState(hash || null);
        setActiveCategoryKeyState(null);
        if (hash) {
          trackAccessedTool(hash);
        }
      }
    };
    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);
    return () => {
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
    };
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
        activeCategoryKey,
        setActiveCategoryKey,
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
        favoriteToolIds,
        toggleFavoriteTool,
        isFavoriteTool,
        clearFavoriteTools,
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
