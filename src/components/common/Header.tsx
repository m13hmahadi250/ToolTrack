import React, { useState, useEffect } from 'react';
import {
  Clock,
  Menu,
  X,
  ChevronDown,
  Layers,
  Sparkles,
  PenTool,
} from 'lucide-react';
import { useToolTrack } from '../../context/ToolTrackContext';
import { MegaMenu, getIconComponent } from './MegaMenu';
import { GlobalToolSearch } from './GlobalToolSearch';
import { HeaderCategoryDropdown } from './HeaderCategoryDropdown';
import { ToolTrackBrand } from './ToolTrackBrand';
import { PWAInstallButton } from './PWAInstallButton';
import { HEADER_CATEGORIES, getToolsForHeaderCategory } from '../../data/categoryRegistry';
import { TOOLS_LIST } from '../../data/toolsList';

export const Header: React.FC = () => {
  const {
    activeToolId,
    setActiveToolId,
    jobs,
    setIsQueueOpen,
    setIsActivityOpen,
    isMegaMenuOpen,
    setIsMegaMenuOpen,
  } = useToolTrack();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdownCatId, setActiveDropdownCatId] = useState<string | null>(null);
  const [expandedMobileCat, setExpandedMobileCat] = useState<string | null>(null);

  const activeJobsCount = jobs.filter((j) => j.status === 'processing' || j.status === 'analyzing').length;
  const completedJobsCount = jobs.filter((j) => j.status === 'completed').length;

  // Respond to global escape events for menus
  useEffect(() => {
    const handleEscapeEvent = () => {
      if (activeDropdownCatId) {
        setActiveDropdownCatId(null);
      } else if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('tooltrack:escape', handleEscapeEvent);
    return () => {
      window.removeEventListener('tooltrack:escape', handleEscapeEvent);
    };
  }, [activeDropdownCatId, isMobileMenuOpen]);

  const isToolInCat = (toolId: string | null, catConfigId: string) => {
    if (!toolId) return false;
    const catConfig = HEADER_CATEGORIES.find((c) => c.id === catConfigId);
    if (!catConfig) return false;
    const tool = TOOLS_LIST.find((t) => t.id === toolId);
    if (!tool) return false;
    return catConfig.categories.includes(tool.category);
  };

  const handleViewAllCategory = (homepageCatId: string) => {
    setActiveToolId(null);
    window.dispatchEvent(
      new CustomEvent('tooltrack:select-category', { detail: { categoryId: homepageCatId } })
    );
    setTimeout(() => {
      const el = document.getElementById('tools-directory');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 flex-nowrap">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-5 min-w-0 flex-nowrap shrink-0">
            <button
              onClick={() => {
                setActiveToolId(null);
                setActiveDropdownCatId(null);
              }}
              className="group text-left cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none shrink-0 whitespace-nowrap"
              aria-label="ToolTrack Home"
            >
              <ToolTrackBrand iconClassName="w-9 h-9 sm:w-10 sm:h-10" />
            </button>

            {/* Desktop Navigation Hierarchy: Home -> Whiteboard -> All ▾ -> Image ▾ -> Student ▾ -> Design ▾ -> PDF ▾ */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 relative flex-nowrap shrink-0 whitespace-nowrap" aria-label="Main Navigation">
              {/* 1. Home */}
              <button
                onClick={() => {
                  setActiveToolId(null);
                  setActiveDropdownCatId(null);
                }}
                className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition cursor-pointer shrink-0 whitespace-nowrap ${
                  activeToolId === null && !activeDropdownCatId
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                }`}
              >
                Home
              </button>

              {/* 2. Whiteboard (Promoted directly after Home as a premium feature) */}
              <button
                onClick={() => {
                  setActiveToolId('whiteboard');
                  setActiveDropdownCatId(null);
                }}
                className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm transition cursor-pointer shrink-0 whitespace-nowrap ${
                  activeToolId === 'whiteboard'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 font-medium'
                }`}
                title="Interactive Infinite Whiteboard"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Whiteboard</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                  activeToolId === 'whiteboard'
                    ? 'bg-white/20 text-white'
                    : 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50'
                }`}>
                  PRO
                </span>
              </button>

              {/* 3. Category Dropdowns: All ▾, Image ▾, Student ▾, Design ▾, PDF ▾ */}
              {HEADER_CATEGORIES.map((cat) => {
                const isOpen = activeDropdownCatId === cat.id;
                const isActiveCat = isToolInCat(activeToolId, cat.id);

                return (
                  <div key={cat.id} className="relative shrink-0">
                    <button
                      onClick={() => {
                        if (cat.id === 'all-tools') {
                          setIsMegaMenuOpen((prev) => !prev);
                          setActiveDropdownCatId(null);
                        } else {
                          setActiveDropdownCatId((prev) => (prev === cat.id ? null : cat.id));
                        }
                      }}
                      className={`flex items-center gap-1 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition cursor-pointer group shrink-0 whitespace-nowrap ${
                        isOpen || isActiveCat
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                      }`}
                      aria-expanded={isOpen}
                      aria-haspopup="menu"
                    >
                      <span>{cat.shortName}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 shrink-0 ${
                          isOpen
                            ? 'rotate-180 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        }`}
                      />
                    </button>

                    {cat.id !== 'all-tools' && (
                      <HeaderCategoryDropdown
                        config={cat}
                        isOpen={isOpen}
                        onClose={() => setActiveDropdownCatId(null)}
                        onSelectTool={(toolId) => {
                          setActiveToolId(toolId);
                          setActiveDropdownCatId(null);
                        }}
                        onViewAllCategory={handleViewAllCategory}
                      />
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Center Search Input with Unified Live Autocomplete */}
          <div className="flex-1 max-w-xs md:max-w-sm hidden sm:block">
            <GlobalToolSearch variant="header" />
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* In-App PWA Install Prompt */}
            <PWAInstallButton className="hidden sm:flex" />

            {/* Queue Button */}
            <button
              onClick={() => setIsQueueOpen(true)}
              className="relative p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Processing Queue"
              aria-label="Processing Queue"
            >
              <Layers className="w-5 h-5" />
              {activeJobsCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-600 text-white text-[10px] font-bold items-center justify-center">
                    {activeJobsCount}
                  </span>
                </span>
              ) : completedJobsCount > 0 ? (
                <span className="absolute -top-1 -right-1 inline-flex rounded-full h-4 w-4 bg-emerald-600 text-white text-[10px] font-bold items-center justify-center">
                  {completedJobsCount}
                </span>
              ) : null}
            </button>

            {/* History Button */}
            <button
              onClick={() => setIsActivityOpen(true)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Recent Activity"
              aria-label="Recent Activity"
            >
              <Clock className="w-5 h-5" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition lg:hidden cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 top-16 z-30 bg-slate-900/50 backdrop-blur-xs cursor-pointer lg:hidden animate-in fade-in duration-150"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative z-40 lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-xl max-h-[85vh] overflow-y-auto">
              {/* Mobile Search */}
              <div className="w-full">
                <GlobalToolSearch
                  variant="mobile"
                  onSelectTool={(toolId) => {
                    setActiveToolId(toolId);
                    setIsMobileMenuOpen(false);
                  }}
                />
              </div>

              <div className="space-y-2.5 pt-1">
                {/* Primary Quick Links */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setActiveToolId(null);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold cursor-pointer transition ${
                      activeToolId === null
                        ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    Home
                  </button>

                  <button
                    onClick={() => {
                      setActiveToolId('whiteboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                      activeToolId === 'whiteboard'
                        ? 'border-indigo-600 bg-indigo-600 text-white font-bold shadow-xs'
                        : 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Whiteboard</span>
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/20">
                      PRO
                    </span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsMegaMenuOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-left text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between cursor-pointer transition"
                >
                  <span>All Tools Directory</span>
                  <span className="text-[10px] font-semibold text-slate-400">38+ tools →</span>
                </button>

                <div className="pt-1">
                  <PWAInstallButton variant="full" className="w-full justify-center py-2" />
                </div>

                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 pt-2">
                  Tool Categories
                </div>

                {HEADER_CATEGORIES.filter((cat) => cat.id !== 'all-tools').map((cat) => {
                  const isExpanded = expandedMobileCat === cat.id;
                  const catTools = getToolsForHeaderCategory(cat);

                  return (
                    <div
                      key={cat.id}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-850/50"
                    >
                      <button
                        onClick={() => setExpandedMobileCat(isExpanded ? null : cat.id)}
                        className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span>{cat.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                            {catTools.length}
                          </span>
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${
                            isExpanded ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 gap-1 animate-in slide-in-from-top-1 duration-150">
                          {catTools.map((t) => {
                            const Icon = getIconComponent(t.iconName);
                            return (
                              <button
                                key={t.id}
                                onClick={() => {
                                  setActiveToolId(t.id);
                                  setIsMobileMenuOpen(false);
                                }}
                                className="p-2 rounded-lg text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 flex items-center gap-2.5 cursor-pointer text-xs transition"
                              >
                                <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {t.name}
                                </span>
                              </button>
                            );
                          })}
                          <button
                            onClick={() => {
                              if (cat.homepageCategoryId) handleViewAllCategory(cat.homepageCategoryId);
                              setIsMobileMenuOpen(false);
                            }}
                            className="p-2 rounded-lg text-left text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
                          >
                            <span>View All {cat.name} →</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </header>

      {/* MegaMenu Modal */}
      <MegaMenu isOpen={isMegaMenuOpen} onClose={() => setIsMegaMenuOpen(false)} />
    </>
  );
};
