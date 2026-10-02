import React from 'react';
import { ToolTrackProvider, useToolTrack } from './context/ToolTrackContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { ProcessingQueueModal } from './components/common/ProcessingQueueModal';
import { RecentActivityModal } from './components/common/RecentActivityModal';
import { HomePage } from './components/home/HomePage';

// Specialized tool components
import { PageSizeNormalizer } from './components/tools/PageSizeNormalizer';
import { MergePdfTool } from './components/tools/MergePdfTool';
import { SplitPdfTool } from './components/tools/SplitPdfTool';
import { OrganizePdfTool } from './components/tools/OrganizePdfTool';
import { CompressPdfTool } from './components/tools/CompressPdfTool';
import { ConvertToPdfTool } from './components/tools/ConvertToPdfTool';
import { ConvertFromPdfTool } from './components/tools/ConvertFromPdfTool';
import { PdfToWordTool } from './components/tools/PdfToWordTool';
import { ImageTools } from './components/tools/ImageTools';
import { BackgroundRemoverTool } from './components/tools/BackgroundRemoverTool';
import { BackgroundChangerTool } from './components/tools/BackgroundChangerTool';
import { ImageFormatConverterTool } from './components/tools/ImageFormatConverterTool';
import { ImageWatermarkTool } from './components/tools/ImageWatermarkTool';
import { ImageTextTool } from './components/tools/ImageTextTool';
import { ImageCropResizeTool } from './components/tools/ImageCropResizeTool';
import { ColorPickerTool } from './components/tools/ColorPickerTool';
import { ImageInfoTool } from './components/tools/ImageInfoTool';
import { BatchImageProcessor } from './components/tools/BatchImageProcessor';
import { AssignmentPdfMaker } from './components/tools/AssignmentPdfMaker';
import { NotesToPdfTool } from './components/tools/NotesToPdfTool';
import { PdfSubmissionCompressor } from './components/tools/PdfSubmissionCompressor';
import { ImageSubmissionCompressor } from './components/tools/ImageSubmissionCompressor';
import { PdfEditTool } from './components/tools/PdfEditTool';
import { PdfSecurityTool } from './components/tools/PdfSecurityTool';
import { OcrPdfTool } from './components/tools/OcrPdfTool';
import { PdfInspectorTool } from './components/tools/PdfInspectorTool';
import { PdfCompareTool } from './components/tools/PdfCompareTool';
import { ChevronRight, Home } from 'lucide-react';
import { TOOLS_LIST } from './data/toolsList';

function MainContent() {
  const { activeToolId, setActiveToolId } = useToolTrack();

  const currentTool = activeToolId
    ? TOOLS_LIST.find((t) => t.id === activeToolId)
    : null;

  const renderActiveTool = () => {
    switch (activeToolId) {
      case 'normalize-pdf-page-size':
        return <PageSizeNormalizer />;
      case 'merge-pdf':
        return <MergePdfTool />;
      case 'split-pdf':
        return <SplitPdfTool />;
      case 'organize-pdf':
      case 'rotate-pdf':
        return <OrganizePdfTool />;
      case 'compress-pdf':
      case 'flatten-pdf':
      case 'clean-pdf':
        return <CompressPdfTool />;
      case 'images-to-pdf':
      case 'word-to-pdf':
      case 'excel-to-pdf':
      case 'text-to-pdf':
        return <ConvertToPdfTool />;
      case 'pdf-to-word':
        return <PdfToWordTool />;
      case 'pdf-to-images':
      case 'pdf-to-excel':
      case 'pdf-to-text':
        return <ConvertFromPdfTool />;
      case 'image-background-remover':
        return <BackgroundRemoverTool />;
      case 'image-background-changer':
        return <BackgroundChangerTool />;
      case 'image-converter':
        return <ImageFormatConverterTool />;
      case 'image-watermark':
        return <ImageWatermarkTool />;
      case 'image-text':
        return <ImageTextTool />;
      case 'image-cropper':
        return <ImageCropResizeTool />;
      case 'image-color-picker':
        return <ColorPickerTool />;
      case 'image-info':
        return <ImageInfoTool />;
      case 'batch-image-processor':
        return <BatchImageProcessor />;
      case 'assignment-pdf-maker':
        return <AssignmentPdfMaker />;
      case 'notes-to-pdf':
        return <NotesToPdfTool />;
      case 'pdf-submission-compressor':
        return <PdfSubmissionCompressor />;
      case 'image-submission-compressor':
        return <ImageSubmissionCompressor />;
      case 'image-compressor':
      case 'image-resizer':
      case 'image-metadata-remover':
        return <ImageTools />;
      case 'pdf-edit':
        return <PdfEditTool />;
      case 'pdf-security':
        return <PdfSecurityTool />;
      case 'ocr-pdf':
        return <OcrPdfTool />;
      case 'pdf-inspector':
        return <PdfInspectorTool />;
      case 'pdf-compare':
        return <PdfCompareTool />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb navigation if on tool page */}
        {activeToolId && (
          <nav className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-6 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveToolId(null)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>All Tools</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              {currentTool?.category && (
                <>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {currentTool.category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </>
              )}
              <span className="text-slate-900 dark:text-slate-100 font-bold truncate max-w-xs sm:max-w-md">
                {currentTool?.name || 'Tool'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50/80 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-900/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>100% In-Browser Safe</span>
            </div>
          </nav>
        )}

        {renderActiveTool()}
      </main>

      <Footer />
      <ProcessingQueueModal />
      <RecentActivityModal />
    </div>
  );
}

export default function App() {
  return (
    <ToolTrackProvider>
      <MainContent />
    </ToolTrackProvider>
  );
}
