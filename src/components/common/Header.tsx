import React, { useState, useEffect } from 'react';
import {
  Clock,
  Menu,
  X,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { useToolTrack } from '../../context/ToolTrackContext';
import { MegaMenu, getIconComponent } from './MegaMenu';
import { GlobalToolSearch } from './GlobalToolSearch';
import { HeaderCategoryDropdown } from './HeaderCategoryDropdown';
import { ToolTrackBrand } from './ToolTrackBrand';
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
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                setActiveToolId(null);
                setActiveDropdownCatId(null);
              }}
              className="group text-left cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              aria-label="ToolTrack Home"
            >
              <ToolTrackBrand iconClassName="w-10 h-10" />
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 relative" aria-label="Main Navigation">
              <button
                onClick={() => {
                  setActiveToolId(null);
                  setActiveDropdownCatId(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                  activeToolId === null && !activeDropdownCatId
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Home
              </button>

              {HEADER_CATEGORIES.map((cat) => {
                const isOpen = activeDropdownCatId === cat.id;
                const isActiveCat = isToolInCat(activeToolId, cat.id);

                return (
                  <div key={cat.id} className="relative">
                    <button
                      onClick={() => {
                        if (cat.id === 'all-tools') {
                          setIsMegaMenuOpen((prev) => !prev);
                          setActiveDropdownCatId(null);
                        } else {
                          setActiveDropdownCatId((prev) => (prev === cat.id ? null : cat.id));
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                        isOpen || isActiveCat
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      aria-expanded={isOpen}
                      aria-haspopup="menu"
                    >
                      <span>{cat.shortName}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
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

          {/* Center Search Input with Live Autocomplete & Keyboard Support */}
          <div className="flex-1 max-w-xs md:max-w-sm hidden sm:block">
            <GlobalToolSearch variant="header" />
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
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

            {/* Mobile Menu Button */}
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
            <div className="relative z-40 lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-xl">
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setActiveToolId(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-left text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    setIsMegaMenuOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer"
                >
                  All Tools Directory
                </button>
              </div>

              <div className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 pt-2">
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
                      className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span>{cat.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                          {catTools.length}
                        </span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
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
