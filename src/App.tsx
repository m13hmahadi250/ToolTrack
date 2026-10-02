import React, { useEffect } from 'react';
import { ToolTrackProvider, useToolTrack } from './context/ToolTrackContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { ProcessingQueueModal } from './components/common/ProcessingQueueModal';
import { RecentActivityModal } from './components/common/RecentActivityModal';
import { HomePage } from './components/home/HomePage';
import { ToolGuideSection } from './components/common/ToolGuideSection';
import { NotFoundPage } from './components/common/NotFoundPage';

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
import { ChevronRight, Home, Star } from 'lucide-react';
import { TOOLS_LIST } from './data/toolsList';

function MainContent() {
  const { activeToolId, setActiveToolId, toggleFavoriteTool, isFavoriteTool } = useToolTrack();

  const currentTool = activeToolId
    ? TOOLS_LIST.find((t) => t.id === activeToolId) ||
      // Handle aliases
      (activeToolId === 'remove-background' ? TOOLS_LIST.find((t) => t.id === 'image-background-remover') : null) ||
      (activeToolId === 'convert-to-pdf' ? TOOLS_LIST.find((t) => t.id === 'images-to-pdf') : null) ||
      (activeToolId === 'convert-from-pdf' ? TOOLS_LIST.find((t) => t.id === 'pdf-to-word') : null) ||
      (activeToolId === 'image-tools' ? TOOLS_LIST.find((t) => t.id === 'image-compressor') : null)
    : null;

  // Dynamic document title and meta tag update for SEO and browser tabs
  useEffect(() => {
    if (currentTool) {
      document.title = `${currentTool.name} — Free Online ToolTrack Suite`;
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      document.title = 'ToolTrack — Free Online PDF, Image & Document Processing Suite';
    }
  }, [activeToolId, currentTool]);

  const renderActiveTool = () => {
    if (!activeToolId) {
      return <HomePage />;
    }

    let toolComponent: React.ReactNode = null;

    switch (activeToolId) {
      case 'normalize-pdf-page-size':
        toolComponent = <PageSizeNormalizer />;
        break;
      case 'merge-pdf':
        toolComponent = <MergePdfTool />;
        break;
      case 'split-pdf':
        toolComponent = <SplitPdfTool />;
        break;
      case 'organize-pdf':
      case 'rotate-pdf':
        toolComponent = <OrganizePdfTool />;
        break;
      case 'compress-pdf':
      case 'flatten-pdf':
      case 'clean-pdf':
        toolComponent = <CompressPdfTool />;
        break;
      case 'images-to-pdf':
      case 'word-to-pdf':
      case 'excel-to-pdf':
      case 'text-to-pdf':
      case 'convert-to-pdf':
        toolComponent = <ConvertToPdfTool />;
        break;
      case 'pdf-to-word':
        toolComponent = <PdfToWordTool />;
        break;
      case 'pdf-to-images':
      case 'pdf-to-excel':
      case 'pdf-to-text':
      case 'convert-from-pdf':
        toolComponent = <ConvertFromPdfTool />;
        break;
      case 'image-background-remover':
      case 'remove-background':
        toolComponent = <BackgroundRemoverTool />;
        break;
      case 'image-background-changer':
        toolComponent = <BackgroundChangerTool />;
        break;
      case 'image-converter':
        toolComponent = <ImageFormatConverterTool />;
        break;
      case 'image-watermark':
        toolComponent = <ImageWatermarkTool />;
        break;
      case 'image-text':
        toolComponent = <ImageTextTool />;
        break;
      case 'image-cropper':
        toolComponent = <ImageCropResizeTool />;
        break;
      case 'image-color-picker':
        toolComponent = <ColorPickerTool />;
        break;
      case 'image-info':
        toolComponent = <ImageInfoTool />;
        break;
      case 'batch-image-processor':
        toolComponent = <BatchImageProcessor />;
        break;
      case 'assignment-pdf-maker':
        toolComponent = <AssignmentPdfMaker />;
        break;
      case 'notes-to-pdf':
        toolComponent = <NotesToPdfTool />;
        break;
      case 'pdf-submission-compressor':
        toolComponent = <PdfSubmissionCompressor />;
        break;
      case 'image-submission-compressor':
        toolComponent = <ImageSubmissionCompressor />;
        break;
      case 'image-compressor':
      case 'image-resizer':
      case 'image-metadata-remover':
      case 'image-tools':
        toolComponent = <ImageTools />;
        break;
      case 'pdf-edit':
        toolComponent = <PdfEditTool />;
        break;
      case 'pdf-security':
        toolComponent = <PdfSecurityTool />;
        break;
      case 'ocr-pdf':
        toolComponent = <OcrPdfTool />;
        break;
      case 'pdf-inspector':
        toolComponent = <PdfInspectorTool />;
        break;
      case 'pdf-compare':
        toolComponent = <PdfCompareTool />;
        break;
      default:
        return <NotFoundPage />;
    }

    return (
      <div className="space-y-6">
        {toolComponent}
        {currentTool && (
          <ToolGuideSection
            toolId={currentTool.id}
            toolName={currentTool.name}
            category={currentTool.category}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb navigation if on tool page */}
        {activeToolId && currentTool && (
          <nav className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-6 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveToolId(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>All Tools</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              {currentTool.category && (
                <>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {currentTool.category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </>
              )}
              <span className="text-slate-900 dark:text-slate-100 font-bold truncate max-w-xs sm:max-w-md">
                {currentTool.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleFavoriteTool(currentTool.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                  isFavoriteTool(currentTool.id)
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700/60'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-amber-500'
                }`}
                title={isFavoriteTool(currentTool.id) ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={isFavoriteTool(currentTool.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    isFavoriteTool(currentTool.id) ? 'fill-amber-400 text-amber-500' : ''
                  }`}
                />
                <span className="hidden sm:inline">
                  {isFavoriteTool(currentTool.id) ? 'Favorited' : 'Favorite'}
                </span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50/80 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-900/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>100% In-Browser Safe</span>
              </div>
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
