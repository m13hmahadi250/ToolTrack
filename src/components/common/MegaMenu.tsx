import React from 'react';
import {
  Maximize2,
  Layers,
  Combine,
  Split,
  RotateCw,
  Minimize2,
  FileCheck,
  Wrench,
  Image as ImageIcon,
  FileText,
  Table,
  AlignLeft,
  FileImage,
  FileSpreadsheet,
  AlignJustify,
  Sliders,
  Move,
  Crop,
  RefreshCw,
  ShieldCheck,
  Edit3,
  Lock,
  ScanText,
  Info,
  GitCompare,
  Sparkles,
  Palette,
  GraduationCap,
  Pipette,
  Type,
  X
} from 'lucide-react';
import { TOOLS_LIST } from '../../data/toolsList';
import { useToolTrack } from '../../context/ToolTrackContext';
import type { ToolCategory } from '../../types';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  'page-tools': 'Page Tools & Sizing',
  'organize': 'Organize PDF',
  'optimize': 'PDF Optimization',
  'convert-to-pdf': 'Convert to PDF',
  'convert-from-pdf': 'Convert from PDF',
  'image-tools': 'Advanced Image Tools',
  'design-tools': 'Design Utilities',
  'student-tools': 'Student & Academic Tools',
  'document-tools': 'Document Tools',
  'security': 'Security & Privacy',
  'ocr': 'OCR Recognition',
  'inspector': 'Analysis & Compare',
};

const CATEGORY_ORDER: ToolCategory[] = [
  'image-tools',
  'design-tools',
  'student-tools',
  'page-tools',
  'organize',
  'optimize',
  'convert-to-pdf',
  'convert-from-pdf',
  'security',
  'ocr',
  'inspector',
];

export const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Maximize2': return Maximize2;
    case 'Layers': return Layers;
    case 'Combine': return Combine;
    case 'Split': return Split;
    case 'RotateCw': return RotateCw;
    case 'Minimize2': return Minimize2;
    case 'FileCheck': return FileCheck;
    case 'Wrench': return Wrench;
    case 'Image': return ImageIcon;
    case 'FileText': return FileText;
    case 'Table': return Table;
    case 'AlignLeft': return AlignLeft;
    case 'FileImage': return FileImage;
    case 'FileSpreadsheet': return FileSpreadsheet;
    case 'AlignJustify': return AlignJustify;
    case 'Sliders': return Sliders;
    case 'Move': return Move;
    case 'Crop': return Crop;
    case 'RefreshCw': return RefreshCw;
    case 'ShieldCheck': return ShieldCheck;
    case 'Edit3': return Edit3;
    case 'Lock': return Lock;
    case 'ScanText': return ScanText;
    case 'Info': return Info;
    case 'GitCompare': return GitCompare;
    case 'Sparkles': return Sparkles;
    case 'Palette': return Palette;
    case 'GraduationCap': return GraduationCap;
    case 'Pipette': return Pipette;
    case 'Type': return Type;
    default: return FileText;
  }
};

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose }) => {
  const { setActiveToolId } = useToolTrack();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-3 sm:p-6 animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 my-auto max-h-[92vh] overflow-y-auto cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              All ToolTrack Utilities
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select any file, document, image, whiteboard, or OCR utility to process locally and safely.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          {CATEGORY_ORDER.map((cat) => {
            const tools = TOOLS_LIST.filter((t) => t.category === cat);
            if (tools.length === 0) return null;

            return (
              <div key={cat} className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  {CATEGORY_LABELS[cat] || cat}
                </h3>
                <div className="space-y-1.5">
                  {tools.map((tool) => {
                    const Icon = getIconComponent(tool.iconName);
                    return (
                      <button
                        key={tool.id}
                        onClick={() => {
                          setActiveToolId(tool.id);
                          onClose();
                        }}
                        className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-left transition group border border-transparent hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
                              {tool.name}
                            </span>
                            {tool.badge && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-200 shrink-0">
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                            {tool.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
