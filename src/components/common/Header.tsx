import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Menu,
  X,
  ChevronDown,
  Layers,
  PenTool,
  Code2,
  Search,
  Sun,
  Moon,
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
    darkMode,
    setDarkMode,
  } = useToolTrack();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdownCatId, setActiveDropdownCatId] = useState<string | null>(null);
  const [expandedMobileCat, setExpandedMobileCat] = useState<string | null>(null);
  const triggerButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#1E293B] transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 flex-nowrap">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-5 min-w-0 flex-nowrap shrink-0">
            <button
              onClick={() => {
                setActiveToolId(null);
                setActiveDropdownCatId(null);
              }}
              className="group text-left cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none shrink-0 whitespace-nowrap"
              aria-label="ToolTrack Home"
            >
              <ToolTrackBrand iconClassName="w-9 h-9 sm:w-10 sm:h-10" />
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-0.5 2xl:gap-1 relative flex-nowrap shrink-0 whitespace-nowrap" aria-label="Main Navigation">
              {/* 1. Home */}
              <button
                onClick={() => {
                  setActiveToolId(null);
                  setActiveDropdownCatId(null);
                }}
                className={`px-2.5 2xl:px-3 py-1.5 rounded-lg text-xs 2xl:text-sm font-medium transition cursor-pointer shrink-0 whitespace-nowrap ${
                  activeToolId === null && !activeDropdownCatId
                    ? 'bg-[#EFF6FF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#3B82F6] font-semibold'
                    : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]/70'
                }`}
              >
                Home
              </button>

              {/* 2. Whiteboard */}
              <button
                onClick={() => {
                  setActiveToolId('whiteboard');
                  setActiveDropdownCatId(null);
                }}
                className={`flex items-center gap-1.5 px-2.5 2xl:px-3 py-1.5 rounded-lg text-xs 2xl:text-sm transition cursor-pointer shrink-0 whitespace-nowrap ${
                  activeToolId === 'whiteboard'
                    ? 'bg-[#2563EB] text-white font-semibold shadow-2xs'
                    : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563EB] dark:hover:text-[#3B82F6] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]/70 font-medium'
                }`}
                title="Interactive Infinite Whiteboard"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Whiteboard</span>
              </button>

              {/* 3. Compiler */}
              <button
                onClick={() => {
                  setActiveToolId('compiler');
                  setActiveDropdownCatId(null);
                }}
                className={`flex items-center gap-1.5 px-2.5 2xl:px-3 py-1.5 rounded-lg text-xs 2xl:text-sm transition cursor-pointer shrink-0 whitespace-nowrap ${
                  activeToolId === 'compiler'
                    ? 'bg-[#2563EB] text-white font-semibold shadow-2xs'
                    : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563EB] dark:hover:text-[#3B82F6] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]/70 font-medium'
                }`}
                title="Online & Offline Compiler (Python 3, C++, C)"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Compiler</span>
              </button>

              {/* 4. Category Dropdowns: PDF ▾, Convert ▾, Images ▾, Student ▾, Design ▾, Utilities ▾, All Tools ▾ */}
              {HEADER_CATEGORIES.map((cat) => {
                const isOpen = activeDropdownCatId === cat.id;
                const isActiveCat = isToolInCat(activeToolId, cat.id);

                return (
                  <div key={cat.id} className="relative shrink-0">
                    <button
                      ref={(el) => {
                        triggerButtonRefs.current[cat.id] = el;
                      }}
                      onClick={() => {
                        if (cat.id === 'all-tools') {
                          setIsMegaMenuOpen((prev) => !prev);
                          setActiveDropdownCatId(null);
                        } else {
                          setActiveDropdownCatId((prev) => (prev === cat.id ? null : cat.id));
                        }
                      }}
                      className={`flex items-center gap-1 px-2.5 2xl:px-3 py-1.5 rounded-lg text-xs 2xl:text-sm font-medium transition cursor-pointer group shrink-0 whitespace-nowrap ${
                        isOpen || isActiveCat
                          ? 'bg-[#EFF6FF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#3B82F6] font-semibold'
                          : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]/70'
                      }`}
                      aria-expanded={isOpen}
                      aria-haspopup="menu"
                    >
                      <span>{cat.shortName}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 shrink-0 ${
                          isOpen
                            ? 'rotate-180 text-[#2563EB] dark:text-[#3B82F6]'
                            : 'text-[#64748B] group-hover:text-[#0F172A] dark:group-hover:text-[#F8FAFC]'
                        }`}
                      />
                    </button>

                    {cat.id !== 'all-tools' && (
                      <HeaderCategoryDropdown
                        config={cat}
                        isOpen={isOpen}
                        triggerElement={triggerButtonRefs.current[cat.id]}
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
            {/* Mobile Search Icon Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl text-[#475569] dark:text-[#CBD5E1] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition active:scale-95 sm:hidden cursor-pointer"
              title="Search Tools"
              aria-label="Search Tools"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* In-App PWA Install Prompt */}
            <PWAInstallButton className="hidden sm:flex" />

            {/* Light / Dark Mode Theme Switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-[#475569] dark:text-[#CBD5E1] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#1E293B] transition active:scale-95 cursor-pointer"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-[#475569]" />
              )}
            </button>

            {/* Queue Button */}
            <button
              onClick={() => setIsQueueOpen(true)}
              className="relative p-2 rounded-xl text-[#475569] dark:text-[#CBD5E1] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#1E293B] transition active:scale-95 cursor-pointer"
              title="Processing Queue"
              aria-label="Processing Queue"
            >
              <Layers className="w-4.5 h-4.5" />
              {activeJobsCount > 0 ? (
                <span className="absolute -top-1 -right-1 inline-flex rounded-full h-4 w-4 bg-[#2563EB] text-white text-[10px] font-bold tabular-nums items-center justify-center">
                  {activeJobsCount}
                </span>
              ) : completedJobsCount > 0 ? (
                <span className="absolute -top-1 -right-1 inline-flex rounded-full h-4 w-4 bg-[#16A34A] text-white text-[10px] font-bold tabular-nums items-center justify-center">
                  {completedJobsCount}
                </span>
              ) : null}
            </button>

            {/* History Button */}
            <button
              onClick={() => setIsActivityOpen(true)}
              className="p-2 rounded-xl text-[#475569] dark:text-[#CBD5E1] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#1E293B] transition active:scale-95 cursor-pointer"
              title="Recent Activity"
              aria-label="Recent Activity"
            >
              <Clock className="w-4.5 h-4.5" />
            </button>

            {/* Mobile / Tablet Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-[#475569] dark:text-[#CBD5E1] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#1E293B] transition active:scale-95 xl:hidden cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Drawer */}
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 top-16 z-30 bg-[#0F172A]/60 backdrop-blur-xs cursor-pointer xl:hidden animate-fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative z-40 xl:hidden border-t border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] px-4 py-4 space-y-3 animate-fade-slide-down shadow-xl max-h-[85vh] overflow-y-auto">
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
                        ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#3B82F6] font-bold'
                        : 'border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#1E293B]/50 text-[#0F172A] dark:text-[#F8FAFC]'
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
                        ? 'border-[#2563EB] bg-[#2563EB] text-white font-bold shadow-xs'
                        : 'border-[#E2E8F0] dark:border-[#1E293B] bg-[#EFF6FF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#3B82F6]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Whiteboard</span>
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveToolId('compiler');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition col-span-2 ${
                      activeToolId === 'compiler'
                        ? 'border-[#2563EB] bg-[#2563EB] text-white font-bold shadow-xs'
                        : 'border-[#E2E8F0] dark:border-[#1E293B] bg-[#EFF6FF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#3B82F6]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Compiler & IDE (Python, C++, C)</span>
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsMegaMenuOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#1E293B]/50 hover:bg-[#EFF6FF] dark:hover:bg-[#1E293B] text-left text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center justify-between cursor-pointer transition"
                  >
                    <span>All Tools</span>
                    <span className="text-[10px] font-semibold text-[#2563EB] dark:text-[#3B82F6] tabular-nums">{TOOLS_LIST.length} →</span>
                  </button>

                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#1E293B]/50 hover:bg-[#EFF6FF] dark:hover:bg-[#1E293B] text-left text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center justify-between cursor-pointer transition"
                  >
                    <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
                    {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[#475569]" />}
                  </button>
                </div>

                <div className="pt-1">
                  <PWAInstallButton variant="full" className="w-full justify-center py-2" />
                </div>

                <div className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider px-1 pt-2">
                  Tool Categories
                </div>

                {HEADER_CATEGORIES.filter((cat) => cat.id !== 'all-tools').map((cat) => {
                  const isExpanded = expandedMobileCat === cat.id;
                  const catTools = getToolsForHeaderCategory(cat);

                  return (
                    <div
                      key={cat.id}
                      className="border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl overflow-hidden bg-[#F8FAFC] dark:bg-[#1E293B]/40"
                    >
                      <button
                        onClick={() => setExpandedMobileCat(isExpanded ? null : cat.id)}
                        className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] hover:bg-[#EFF6FF] dark:hover:bg-[#1E293B] transition cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{cat.name}</span>
                          <span className="text-[#64748B] dark:text-[#94A3B8] font-normal tabular-nums">
                            · {catTools.length}
                          </span>
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#64748B] dark:text-[#94A3B8] transition-transform duration-150 ${
                            isExpanded ? 'rotate-180 text-[#2563EB] dark:text-[#3B82F6]' : ''
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="p-2 bg-white dark:bg-[#111827] border-t border-[#E2E8F0] dark:border-[#1E293B] grid grid-cols-1 gap-1 animate-in slide-in-from-top-1 duration-150">
                          {catTools.map((t) => {
                            const Icon = getIconComponent(t.iconName);
                            return (
                              <button
                                key={t.id}
                                onClick={() => {
                                  setActiveToolId(t.id);
                                  setIsMobileMenuOpen(false);
                                }}
                                className="p-2 rounded-lg text-left hover:bg-[#EFF6FF] dark:hover:bg-[#1E293B] flex items-center gap-2.5 cursor-pointer text-xs transition"
                              >
                                <Icon className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6] shrink-0" />
                                <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate">
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
                            className="p-2 rounded-lg text-left text-xs font-bold text-[#2563EB] dark:text-[#3B82F6] hover:underline flex items-center gap-1 cursor-pointer pt-1"
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
