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
  pauseJob: (id: string) => void;
  resumeJob: (id: string) => void;
  cancelJob: (id: string) => void;
  retryJob: (id: string) => void;
  removeJob: (id: string) => void;
  pauseAllJobs: () => void;
  resumeAllJobs: () => void;
  cancelAllJobs: () => void;
  retryAllFailedJobs: () => void;
  clearCompletedJobs: () => void;
  clearAllJobs: () => void;
  addDemoBatch: () => void;
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
      setActiveCategoryKeyState(null);
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
      prev.map((j) => {
        if (j.id !== id) return j;
        const now = Date.now();
        const isDone = updates.status === 'completed' || updates.status === 'failed' || updates.status === 'cancelled';
        const endTime = isDone ? (updates.endTime || now) : j.endTime;
        const processingTimeMs = isDone && endTime ? (endTime - j.startTime) : j.processingTimeMs;
        return {
          ...j,
          ...updates,
          ...(isDone ? { endTime, processingTimeMs } : {}),
        };
      })
    );
  };

  const pauseJob = (id: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id && (j.status === 'processing' || j.status === 'analyzing' || j.status === 'waiting') ? { ...j, status: 'paused' } : j))
    );
    showToast('info', `Paused job #${id}`);
  };

  const resumeJob = (id: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id && j.status === 'paused' ? { ...j, status: 'processing' } : j))
    );
    showToast('info', `Resumed job #${id}`);

    // Trigger simulation timer to finish if job has no external active worker
    const interval = setInterval(() => {
      setJobs((prev) => {
        const target = prev.find((j) => j.id === id);
        if (!target || target.status !== 'processing') {
          clearInterval(interval);
          return prev;
        }
        const nextProgress = Math.min(1, target.progress + 0.15);
        if (nextProgress >= 1) {
          clearInterval(interval);
          const mockBlob = target.outputBlob || new Blob(['ToolTrack Processed Output'], { type: 'text/plain' });
          return prev.map((j) =>
            j.id === id
              ? {
                  ...j,
                  progress: 1,
                  status: 'completed',
                  endTime: Date.now(),
                  processingTimeMs: Date.now() - j.startTime,
                  outputBlob: mockBlob,
                  outputSize: target.outputSize || Math.round(target.fileSize * 0.72),
                }
              : j
          );
        }
        return prev.map((j) => (j.id === id ? { ...j, progress: nextProgress } : j));
      });
    }, 400);
  };

  const cancelJob = (id: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id && (j.status === 'processing' || j.status === 'analyzing' || j.status === 'waiting' || j.status === 'paused')
          ? {
              ...j,
              status: 'cancelled',
              endTime: Date.now(),
              processingTimeMs: Date.now() - j.startTime,
              errorMessage: 'Cancelled by user',
            }
          : j
      )
    );
    showToast('warning', `Cancelled job #${id}`);
  };

  const retryJob = (id: string) => {
    const now = Date.now();
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              status: 'processing',
              progress: 0.1,
              startTime: now,
              endTime: undefined,
              processingTimeMs: undefined,
              errorMessage: undefined,
              retryCount: (j.retryCount || 0) + 1,
            }
          : j
      )
    );
    showToast('info', `Retrying job #${id}...`);

    // Simulated retry progress
    let p = 0.1;
    const interval = setInterval(() => {
      p += 0.22;
      setJobs((prev) => {
        const target = prev.find((j) => j.id === id);
        if (!target || target.status !== 'processing') {
          clearInterval(interval);
          return prev;
        }
        if (p >= 1) {
          clearInterval(interval);
          const mockBlob = target.outputBlob || new Blob(['ToolTrack Processed Batch File Content'], { type: 'text/plain' });
          return prev.map((j) =>
            j.id === id
              ? {
                  ...j,
                  progress: 1,
                  status: 'completed',
                  endTime: Date.now(),
                  processingTimeMs: Date.now() - now,
                  outputBlob: mockBlob,
                  outputSize: target.outputSize || Math.round(target.fileSize * 0.65),
                }
              : j
          );
        }
        return prev.map((j) => (j.id === id ? { ...j, progress: Math.min(0.95, p) } : j));
      });
    }, 350);
  };

  const removeJob = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const pauseAllJobs = () => {
    setJobs((prev) =>
      prev.map((j) => (j.status === 'processing' || j.status === 'analyzing' || j.status === 'waiting' ? { ...j, status: 'paused' } : j))
    );
    showToast('info', 'Paused all active batch jobs');
  };

  const resumeAllJobs = () => {
    setJobs((prev) =>
      prev.map((j) => (j.status === 'paused' ? { ...j, status: 'processing' } : j))
    );
    showToast('info', 'Resumed all paused batch jobs');
  };

  const cancelAllJobs = () => {
    const now = Date.now();
    setJobs((prev) =>
      prev.map((j) =>
        j.status === 'processing' || j.status === 'analyzing' || j.status === 'waiting' || j.status === 'paused'
          ? {
              ...j,
              status: 'cancelled',
              endTime: now,
              processingTimeMs: now - j.startTime,
              errorMessage: 'Batch job cancelled by user',
            }
          : j
      )
    );
    showToast('warning', 'Cancelled all running and queued jobs');
  };

  const retryAllFailedJobs = () => {
    const failedIds: string[] = [];
    setJobs((prev) => {
      const now = Date.now();
      return prev.map((j) => {
        if (j.status === 'failed' || j.status === 'cancelled') {
          failedIds.push(j.id);
          return {
            ...j,
            status: 'processing',
            progress: 0.15,
            startTime: now,
            endTime: undefined,
            processingTimeMs: undefined,
            errorMessage: undefined,
            retryCount: (j.retryCount || 0) + 1,
          };
        }
        return j;
      });
    });

    if (failedIds.length > 0) {
      showToast('info', `Retrying ${failedIds.length} failed/cancelled batch job${failedIds.length > 1 ? 's' : ''}`);
      // Progressively resolve
      setTimeout(() => {
        setJobs((prev) =>
          prev.map((j) =>
            failedIds.includes(j.id) && j.status === 'processing'
              ? {
                  ...j,
                  status: 'completed',
                  progress: 1,
                  endTime: Date.now(),
                  processingTimeMs: Date.now() - j.startTime,
                  outputBlob: j.outputBlob || new Blob(['Retried output'], { type: 'text/plain' }),
                  outputSize: j.outputSize || Math.round(j.fileSize * 0.7),
                }
              : j
          )
        );
      }, 1500);
    }
  };

  const clearCompletedJobs = () => {
    setJobs((prev) => prev.filter((j) => j.status !== 'completed'));
    showToast('info', 'Cleared all completed jobs from queue');
  };

  const clearAllJobs = () => {
    setJobs([]);
    showToast('info', 'Cleared all batch jobs');
  };

  const addDemoBatch = () => {
    const now = Date.now();
    const batchId = `BATCH-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const demoJobs: ProcessingJob[] = [
      {
        id: `TT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        fileName: 'Q3_Financial_Summary_2026.pdf',
        fileSize: 4850000,
        toolId: 'normalize-pdf-page-size',
        toolName: 'Normalize PDF Page Size',
        status: 'completed',
        progress: 1,
        startTime: now - 3200,
        endTime: now - 800,
        processingTimeMs: 2400,
        totalFiles: 5,
        fileIndex: 1,
        batchId,
        outputFileName: 'Q3_Financial_Summary_2026_Standardized_A4.pdf',
        outputSize: 3120000,
        outputBlob: new Blob(['Standardized PDF Content'], { type: 'application/pdf' }),
      },
      {
        id: `TT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        fileName: 'Hero_Banner_Product_Shot_4K.png',
        fileSize: 8920000,
        toolId: 'image-compressor',
        toolName: 'Image Compressor',
        status: 'processing',
        progress: 0.65,
        startTime: now - 1800,
        totalFiles: 5,
        fileIndex: 2,
        batchId,
        outputFileName: 'Hero_Banner_Product_Shot_4K_Compressed.webp',
      },
      {
        id: `TT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        fileName: 'Lecture_Slide_Notes_Biology.pdf',
        fileSize: 6420000,
        toolId: 'compress-pdf',
        toolName: 'Compress PDF',
        status: 'waiting',
        progress: 0,
        startTime: now - 500,
        totalFiles: 5,
        fileIndex: 3,
        batchId,
        outputFileName: 'Lecture_Slide_Notes_Biology_Compressed.pdf',
      },
      {
        id: `TT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        fileName: 'Scanned_Receipt_Invoice_884.jpg',
        fileSize: 1840000,
        toolId: 'ocr-pdf',
        toolName: 'OCR Text Recognition',
        status: 'failed',
        progress: 0.4,
        startTime: now - 4500,
        endTime: now - 2100,
        processingTimeMs: 2400,
        totalFiles: 5,
        fileIndex: 4,
        batchId,
        errorMessage: 'OCR Engine: Low image DPI contrast. Retry with contrast booster.',
      },
      {
        id: `TT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        fileName: 'Client_Contract_Signatures.docx',
        fileSize: 2210000,
        toolId: 'word-to-pdf',
        toolName: 'Word to PDF',
        status: 'completed',
        progress: 1,
        startTime: now - 5400,
        endTime: now - 3600,
        processingTimeMs: 1800,
        totalFiles: 5,
        fileIndex: 5,
        batchId,
        outputFileName: 'Client_Contract_Signatures.pdf',
        outputSize: 1650000,
        outputBlob: new Blob(['Contract PDF Document'], { type: 'application/pdf' }),
      },
    ];

    setJobs((prev) => [...demoJobs, ...prev]);
    showToast('success', 'Added demo batch with 5 jobs for testing');
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
