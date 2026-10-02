import React from 'react';
import {
  ShieldCheck,
  FileCheck2,
  Cpu,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  HardDrive,
  FileText,
} from 'lucide-react';
import { getToolGuide } from '../../data/toolGuides';
import { TOOLS_LIST } from '../../data/toolsList';
import { useToolTrack } from '../../context/ToolTrackContext';
import { getIconComponent } from './MegaMenu';

interface ToolGuideSectionProps {
  toolId: string;
  toolName: string;
  category: string;
}

export const ToolGuideSection: React.FC<ToolGuideSectionProps> = ({
  toolId,
  toolName,
  category,
}) => {
  const { setActiveToolId } = useToolTrack();
  const guide = getToolGuide(toolId, category, toolName);

  const relatedTools = guide.relatedToolIds
    .map((id) => TOOLS_LIST.find((t) => t.id === id))
    .filter((t): t is typeof TOOLS_LIST[number] => Boolean(t))
    .slice(0, 4);

  const handleSelectRelatedTool = (id: string) => {
    setActiveToolId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="w-full mt-12 pt-10 border-t border-slate-200 dark:border-slate-800 space-y-12 animate-in fade-in duration-300">
      {/* 1. How It Works - Numbered Steps */}
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              How It Works
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Simple 4-step workflow for {toolName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {guide.howItWorks.map((step) => (
            <div
              key={step.step}
              className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-colors flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200/60 dark:border-indigo-800">
                  {step.step}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Step {step.step}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                  {step.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Technical Specifications & Privacy Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Specs & Capabilities */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <FileCheck2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Tool Specifications & File Lifecycle
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 dark:text-slate-500 font-medium">Supported Input Formats</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{guide.specs.supportedFormats}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 dark:text-slate-500 font-medium">Deliverable Output Format</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{guide.specs.outputFormat}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 dark:text-slate-500 font-medium">Batch & File Size Limit</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{guide.specs.maxLimit}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 dark:text-slate-500 font-medium">Processing Engine</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{guide.specs.processingType}</p>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Privacy & Security Guarantee: </span>
              <span>{guide.specs.privacyNote}</span>
            </div>
          </div>
        </div>

        {/* Good To Know / Practical Tips */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Good to Know
            </h4>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            {guide.goodToKnow.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3. Related Tools */}
      {relatedTools.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-base text-slate-900 dark:text-white">
              Related Tools
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Continue your file workflow
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedTools.map((relTool) => {
              const IconComp = getIconComponent(relTool.iconName);
              return (
                <button
                  key={relTool.id}
                  onClick={() => handleSelectRelatedTool(relTool.id)}
                  className="group text-left p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {relTool.name}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {relTool.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
