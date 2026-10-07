import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Download,
  Grid,
  Palette,
  Play,
  HelpCircle,
  Search,
  Plus,
  FolderOpen,
  Copy,
  Trash2,
  Check,
  FileDown,
  FileCode,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { WhiteboardBoard, GridType } from '../../types/whiteboard';
import { ExportFormat, ExportQuality } from '../../lib/whiteboardExport';

interface WhiteboardHeaderProps {
  board: WhiteboardBoard;
  allBoards: WhiteboardBoard[];
  onRenameBoard: (newTitle: string) => void;
  onSelectBoard: (id: string) => void;
  onCreateNewBoard: () => void;
  onDuplicateBoard: () => void;
  onDeleteBoard: () => void;
  onChangeGridType: (type: GridType) => void;
  onToggleGridSnap: () => void;
  onChangeBackgroundColor: (color: string) => void;
  onExport: (format: ExportFormat, quality: ExportQuality, includeBg: boolean) => void;
  onOpenTemplates: () => void;
  onOpenSearch: () => void;
  onOpenHelp: () => void;
  onTogglePresentationMode: () => void;
  onBackToHome: () => void;
  saveStatus: 'saved' | 'saving' | 'error';
  lastSavedTime: string | null;
  isPresentationMode?: boolean;
  isDrawingActive?: boolean;
  hasPdfDocuments?: boolean;
  onExportAnnotatedPdf?: () => void;
}

export const WhiteboardHeader: React.FC<WhiteboardHeaderProps> = ({
  board,
  allBoards,
  onRenameBoard,
  onSelectBoard,
  onCreateNewBoard,
  onDuplicateBoard,
  onDeleteBoard,
  onChangeGridType,
  onToggleGridSnap,
  onChangeBackgroundColor,
  onExport,
  onOpenTemplates,
  onOpenSearch,
  onOpenHelp,
  onTogglePresentationMode,
  onBackToHome,
  saveStatus,
  lastSavedTime,
  isPresentationMode = false,
  isDrawingActive = false,
  hasPdfDocuments = false,
  onExportAnnotatedPdf,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(board.title);
  const [boardsDropdownOpen, setBoardsDropdownOpen] = useState(false);
  const [canvasMenuOpen, setCanvasMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const [exportQuality, setExportQuality] = useState<ExportQuality>('high');
  const [includeBg, setIncludeBg] = useState(true);

  const boardsMenuRef = useRef<HTMLDivElement>(null);
  const canvasMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitleInput(board.title);
  }, [board.title]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (boardsMenuRef.current && !boardsMenuRef.current.contains(e.target as Node)) {
        setBoardsDropdownOpen(false);
      }
      if (canvasMenuRef.current && !canvasMenuRef.current.contains(e.target as Node)) {
        setCanvasMenuOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleFinishTitle = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onRenameBoard(titleInput.trim());
    } else {
      setTitleInput(board.title);
    }
  };

  if (isPresentationMode) {
    return (
      <header className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={onTogglePresentationMode}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 text-white font-semibold text-xs border border-slate-700/80 shadow-2xl hover:bg-slate-800 transition cursor-pointer"
        >
          <span>Exit Presentation Mode</span>
        </button>
      </header>
    );
  }

  return (
    <header
      className={`fixed top-3 left-4 right-4 z-40 flex items-center justify-between gap-3 pointer-events-none transition-all duration-300 ease-out ${
        isDrawingActive
          ? 'opacity-0 -translate-y-4 pointer-events-none'
          : 'opacity-100 translate-y-0'
      }`}
    >
      {/* Left Block: Back, Brand, Title & Board Manager */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-md text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Back to ToolTrack"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to ToolTrack</span>
        </button>

        {/* Board Title & Switcher Dropdown */}
        <div className="relative" ref={boardsMenuRef}>
          <div className="flex items-center px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-md">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleFinishTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishTitle();
                  if (e.key === 'Escape') {
                    setTitleInput(board.title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white bg-transparent border-0 outline-none w-36 sm:w-48"
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 max-w-[120px] sm:max-w-[200px] truncate text-left cursor-text"
                title="Click to Rename Board"
              >
                {board.title}
              </button>
            )}

            <button
              onClick={() => setBoardsDropdownOpen((p) => !p)}
              className="p-1 ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              title="My Boards"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Boards Dropdown */}
          {boardsDropdownOpen && (
            <div className="absolute top-full mt-2 left-0 w-64 p-2 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 shadow-2xl text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 px-1">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                  My Boards ({allBoards.length})
                </span>
                <button
                  onClick={() => {
                    onCreateNewBoard();
                    setBoardsDropdownOpen(false);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Board</span>
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1">
                {allBoards.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      onSelectBoard(b.id);
                      setBoardsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition cursor-pointer ${
                      b.id === board.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{b.title}</span>
                    {b.id === board.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-1 text-slate-500">
                <button
                  onClick={() => {
                    onDuplicateBoard();
                    setBoardsDropdownOpen(false);
                  }}
                  className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  title="Duplicate current board"
                >
                  <Copy className="w-3 h-3" />
                  <span>Duplicate</span>
                </button>
                {allBoards.length > 1 && (
                  <button
                    onClick={() => {
                      onDeleteBoard();
                      setBoardsDropdownOpen(false);
                    }}
                    className="flex items-center gap-1 text-red-500 hover:text-red-600 cursor-pointer"
                    title="Delete current board"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Subtle Save Error Indicator (only shown if an actual storage error occurs) */}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] text-red-400 font-semibold shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span>Save error</span>
          </div>
        )}
      </div>

      {/* Right Block: Canvas settings, Templates, Search, Export & Presentation */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        {/* Templates Modal Button */}
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-md text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
          title="Board Templates"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span className="hidden md:inline">Templates</span>
        </button>

        {/* Board Search */}
        <button
          onClick={onOpenSearch}
          className="p-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-md text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
          title="Search Board Text"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Canvas Options Dropdown (Grid & Background) */}
        <div className="relative" ref={canvasMenuRef}>
          <button
            onClick={() => setCanvasMenuOpen((p) => !p)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-md text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Grid & Background Options"
          >
            <Grid className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">Canvas</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {canvasMenuOpen && (
            <div className="absolute top-full mt-2 right-0 w-60 p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 shadow-2xl text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
              {/* Grid Types */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600 dark:text-slate-400 block">Grid Style</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['none', 'dot', 'square', 'ruled'] as GridType[]).map((gt) => (
                    <button
                      key={gt}
                      onClick={() => onChangeGridType(gt)}
                      className={`py-1.5 rounded-lg border text-center capitalize font-medium transition cursor-pointer ${
                        board.gridType === gt
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {gt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Snap to grid */}
              <div className="flex items-center justify-between pt-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Snap to Grid</label>
                <input
                  type="checkbox"
                  checked={board.gridSnap}
                  onChange={onToggleGridSnap}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Background Color */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="font-semibold text-slate-600 dark:text-slate-400 block">Canvas Background</label>
                <div className="flex items-center gap-2">
                  {[
                    { label: 'Dark Slate', value: '#0f172a' },
                    { label: 'Navy Slate', value: '#1e293b' },
                    { label: 'Pure White', value: '#ffffff' },
                    { label: 'Light Slate', value: '#f8fafc' },
                    { label: 'Paper Cream', value: '#fefce8' },
                  ].map((bg) => (
                    <button
                      key={bg.value}
                      onClick={() => onChangeBackgroundColor(bg.value)}
                      className={`w-6 h-6 rounded-lg border transition cursor-pointer ${
                        board.backgroundColor === bg.value
                          ? 'border-indigo-500 ring-2 ring-indigo-500/40 scale-110'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                      style={{ backgroundColor: bg.value }}
                      title={bg.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export Dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setExportMenuOpen((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md text-xs font-semibold transition cursor-pointer"
            title="Export Whiteboard"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-3 h-3 text-indigo-200" />
          </button>

          {exportMenuOpen && (
            <div className="absolute top-full mt-2 right-0 w-64 p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 shadow-2xl text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
              {/* Quality selector */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600 dark:text-slate-400 block">Export Quality</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['standard', 'high', 'ultra'] as ExportQuality[]).map((q) => (
                    <button
                      key={q}
                      onClick={() => setExportQuality(q)}
                      className={`py-1 rounded-lg border text-center capitalize font-medium transition cursor-pointer ${
                        exportQuality === q
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Include background checkbox */}
              <div className="flex items-center justify-between">
                <label className="text-slate-600 dark:text-slate-400">Include Background</label>
                <input
                  type="checkbox"
                  checked={includeBg}
                  onChange={(e) => setIncludeBg(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Export Formats */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <button
                  onClick={() => {
                    onExport('png', exportQuality, includeBg);
                    setExportMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">Export as PNG Image</span>
                </button>

                <button
                  onClick={() => {
                    onExport('jpg', exportQuality, true);
                    setExportMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">Export as JPG Image</span>
                </button>

                <button
                  onClick={() => {
                    onExport('pdf', exportQuality, includeBg);
                    setExportMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-red-500" />
                  <span className="font-medium">Export as PDF Document</span>
                </button>

                {hasPdfDocuments && onExportAnnotatedPdf && (
                  <button
                    onClick={() => {
                      onExportAnnotatedPdf();
                      setExportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold transition cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-rose-500" />
                    <span>Export Annotated PDF</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onExport('svg', exportQuality, includeBg);
                    setExportMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-cyan-500" />
                  <span className="font-medium">Export as Scalable SVG</span>
                </button>

                <button
                  onClick={() => {
                    onExport('json', exportQuality, includeBg);
                    setExportMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium">Save Editable Project (.json)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Presentation Mode Button */}
        <button
          onClick={onTogglePresentationMode}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 dark:bg-slate-800/90 text-white border border-slate-700/80 shadow-md text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
          title="Enter Presentation / Teaching Mode"
        >
          <Play className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden lg:inline">Present</span>
        </button>

        {/* Shortcuts / Help */}
        <button
          onClick={onOpenHelp}
          className="p-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-md text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
          title="Keyboard Shortcuts & Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
