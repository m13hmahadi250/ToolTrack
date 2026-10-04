export type ToolCategory =
  | 'organize'
  | 'page-tools'
  | 'optimize'
  | 'convert-to-pdf'
  | 'convert-from-pdf'
  | 'image-tools'
  | 'design-tools'
  | 'student-tools'
  | 'document-tools'
  | 'security'
  | 'ocr'
  | 'inspector';

export type ToolOfflineCapability = 'offline' | 'partial' | 'online_only';

export interface ToolItem {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  badge?: string;
  iconName: string;
  acceptedFormats: string[];
  maxFiles?: number;
  popular?: boolean;
  keywords?: string[];
  synonyms?: string[];
  inputFormats?: string[];
  outputFormats?: string[];
  route?: string;
  offlineCapability?: ToolOfflineCapability;
}

export type PageStandardSize =
  | 'A4'
  | 'A3'
  | 'A5'
  | 'Letter'
  | 'Legal'
  | 'Tabloid'
  | 'Custom'
  | 'FirstPage'
  | 'LargestPage'
  | 'SmallestPage';

export type PageOrientation = 'portrait' | 'landscape' | 'auto';

export type ScaleMode =
  | 'fit'
  | 'fill'
  | 'original'
  | 'proportional'
  | 'crop';

export type AlignmentMode = 'center' | 'top' | 'bottom' | 'left' | 'right';

export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PageSizeNormalizerOptions {
  targetSize: PageStandardSize;
  customWidthMm: number;
  customHeightMm: number;
  orientation: PageOrientation;
  scaleMode: ScaleMode;
  alignment: AlignmentMode;
  margins: Margins;
  allowDistortion: boolean;
}

export interface DetectedPageInfo {
  pageNumber: number;
  widthPt: number;
  heightPt: number;
  widthMm: number;
  heightMm: number;
  orientation: 'portrait' | 'landscape' | 'square';
  detectedStandard: string;
}

export interface ProcessingJob {
  id: string;
  fileName: string;
  fileSize: number;
  toolId: string;
  toolName: string;
  status: 'waiting' | 'analyzing' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime: number;
  endTime?: number;
  outputFileName?: string;
  outputBlob?: Blob;
  outputSize?: number;
  errorMessage?: string;
  warningMessage?: string;
}

export interface RecentActivityItem {
  id: string;
  toolId: string;
  toolName: string;
  fileName: string;
  timestamp: number;
  status: 'completed' | 'failed';
}

export interface ValidationResult {
  valid: boolean;
  mimeType?: string;
  fileSignature?: string;
  error?: string;
  warning?: string;
  isEncrypted?: boolean;
  pageCount?: number;
}
