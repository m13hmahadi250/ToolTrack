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
  QrCode,
  ScanLine,
  Calculator,
  ArrowRightLeft,
  Percent,
  Calendar,
  Clock,
  Timer,
  Code2,
  FileCode,
  Binary,
  Fingerprint,
  Hash,
  KeyRound,
  Dices,
  FileSearch,
  PenTool,
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
  'utilities': 'Everyday Utilities',
  'image-tools': 'Advanced Image Tools',
  'design-tools': 'Design Utilities',
  'student-tools': 'Student & Academic Tools',
  'page-tools': 'Page Tools & Sizing',
  'organize': 'Organize PDF',
  'optimize': 'PDF Optimization',
  'convert-to-pdf': 'Convert to PDF',
  'convert-from-pdf': 'Convert from PDF',
  'document-tools': 'Document Tools',
  'security': 'Security & Privacy',
  'ocr': 'OCR Recognition',
  'inspector': 'Analysis & Compare',
};

const CATEGORY_ORDER: ToolCategory[] = [
  'utilities',
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
    case 'QrCode': return QrCode;
    case 'ScanLine': return ScanLine;
    case 'Calculator': return Calculator;
    case 'ArrowRightLeft': return ArrowRightLeft;
    case 'Percent': return Percent;
    case 'Calendar': return Calendar;
    case 'Clock': return Clock;
    case 'Timer': return Timer;
    case 'Code2': return Code2;
    case 'FileCode': return FileCode;
    case 'Binary': return Binary;
    case 'Fingerprint': return Fingerprint;
    case 'Hash': return Hash;
    case 'KeyRound': return KeyRound;
    case 'Dices': return Dices;
    case 'FileSearch': return FileSearch;
    case 'PenTool': return PenTool;
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
      className="fixed inset-0 z-50 overflow-y-auto bg-[#101828]/60 backdrop-blur-xs flex justify-center p-3 sm:p-6 animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl bg-white dark:bg-[#111C2E] rounded-2xl shadow-2xl border border-[#DCE3EF] dark:border-[#1E2D47] p-6 md:p-8 my-auto max-h-[92vh] overflow-y-auto cursor-default animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-5 border-b border-[#DCE3EF] dark:border-[#1E2D47]">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#101828] dark:text-[#F2F4F7] tracking-tight">
              All ToolTrack Utilities
            </h2>
            <p className="text-sm text-[#667085] dark:text-[#8292A9] mt-1">
              Select any file, document, image, whiteboard, or OCR utility to process locally and safely.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#667085] hover:text-[#101828] dark:hover:text-[#F2F4F7] hover:bg-[#EAF1FF] dark:hover:bg-[#172338] transition cursor-pointer"
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
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#2563EB] dark:text-[#3B82F6]">
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
                        className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#EAF1FF] dark:hover:bg-[#172338] text-left transition group border border-transparent hover:border-[#DCE3EF] dark:hover:border-[#1E2D47] cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-[#EAF1FF] dark:bg-[#172338] text-[#2563EB] dark:text-[#3B82F6] group-hover:bg-[#2563EB] group-hover:text-white dark:group-hover:bg-[#2563EB] dark:group-hover:text-white transition-colors shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-[#101828] dark:text-[#F2F4F7] group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition leading-snug break-words">
                              {tool.name}
                            </span>
                            {tool.badge && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#EAF1FF] text-[#2563EB] dark:bg-[#172338] dark:text-[#3B82F6] border border-[#DCE3EF] dark:border-[#1E2D47] shrink-0">
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#667085] dark:text-[#8292A9] line-clamp-2 mt-0.5 leading-relaxed">
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
