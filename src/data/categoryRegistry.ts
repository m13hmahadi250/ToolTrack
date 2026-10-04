import { TOOLS_LIST } from './toolsList';
import type { ToolItem, ToolCategory } from '../types';

export interface CategoryHeaderConfig {
  id: string;
  name: string;
  shortName: string;
  description: string;
  categories: ToolCategory[];
  homepageCategoryId?: string;
}

export const HEADER_CATEGORIES: CategoryHeaderConfig[] = [
  {
    id: 'all-tools',
    name: 'All Tools',
    shortName: 'All',
    description: 'Complete directory of document, image, PDF, and academic utilities.',
    homepageCategoryId: 'all',
    categories: [
      'page-tools',
      'organize',
      'optimize',
      'convert-to-pdf',
      'convert-from-pdf',
      'image-tools',
      'design-tools',
      'student-tools',
      'security',
      'ocr',
      'inspector',
    ],
  },
  {
    id: 'image-tools',
    name: 'Image Tools',
    shortName: 'Image',
    description: 'Compress, convert, resize, crop, watermark, and extract backgrounds.',
    homepageCategoryId: 'image-tools',
    categories: ['image-tools'],
  },
  {
    id: 'student-tools',
    name: 'Student Tools',
    shortName: 'Student',
    description: 'Academic utilities for assignments, scan cleanup, and strict upload limits.',
    homepageCategoryId: 'student-tools',
    categories: ['student-tools'],
  },
  {
    id: 'design-tools',
    name: 'Design Utilities',
    shortName: 'Design',
    description: 'Studio tools for watermarking, backdrops, typography, and color sampling.',
    homepageCategoryId: 'design-tools',
    categories: ['design-tools'],
  },
  {
    id: 'pdf-tools',
    name: 'PDF Tools',
    shortName: 'PDF',
    description: 'Normalize, merge, split, compress, edit, convert, protect, and OCR PDF files.',
    homepageCategoryId: 'page-tools',
    categories: [
      'page-tools',
      'organize',
      'optimize',
      'convert-to-pdf',
      'convert-from-pdf',
      'security',
      'ocr',
      'inspector',
    ],
  },
];

export const POPULAR_TOOL_IDS = [
  'image-background-remover',
  'merge-pdf',
  'compress-pdf',
  'pdf-to-word',
  'image-compressor',
  'image-resizer',
  'ocr-pdf',
  'images-to-pdf',
];

export function getToolsForHeaderCategory(config: CategoryHeaderConfig): ToolItem[] {
  if (config.id === 'all-tools') {
    return TOOLS_LIST;
  }
  return TOOLS_LIST.filter((tool) => config.categories.includes(tool.category));
}
