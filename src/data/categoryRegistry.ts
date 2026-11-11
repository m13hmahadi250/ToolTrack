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
    id: 'pdf-tools',
    name: 'PDF Tools',
    shortName: 'PDF',
    description: 'Normalize, merge, split, compress, edit, organize, and protect PDF files.',
    homepageCategoryId: 'pdf',
    categories: ['page-tools', 'organize', 'optimize', 'security', 'inspector'],
  },
  {
    id: 'convert-tools',
    name: 'Convert & Office',
    shortName: 'Convert',
    description: 'Word DOCX, Excel spreadsheets, images, and document format conversions.',
    homepageCategoryId: 'convert',
    categories: ['convert-to-pdf', 'convert-from-pdf'],
  },
  {
    id: 'image-tools',
    name: 'Image Tools',
    shortName: 'Images',
    description: 'Compress, convert, resize, crop, watermark, and remove backgrounds.',
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
    id: 'utilities-tools',
    name: 'Everyday Utilities',
    shortName: 'Utilities',
    description: 'Python/C/C++ compiler, calculators, QR codes, password generators, unit converters & dev tools.',
    homepageCategoryId: 'utilities',
    categories: ['utilities'],
  },
  {
    id: 'all-tools',
    name: 'All Tools',
    shortName: 'All Tools',
    description: 'Complete directory of 60+ PDF, document, image, coding, Whiteboard, and productivity tools.',
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
      'utilities',
    ],
  },
];

export const POPULAR_TOOL_IDS = [
  'compiler',
  'pdf-to-word',
  'image-background-remover',
  'whiteboard',
  'compress-pdf',
  'qr-code-generator',
  'word-counter',
  'password-generator',
  'calculator',
  'normalize-pdf-page-size',
  'excel-to-pdf',
  'ocr-pdf',
];

export function getToolsForHeaderCategory(config: CategoryHeaderConfig): ToolItem[] {
  if (config.id === 'all-tools') {
    return TOOLS_LIST;
  }
  return TOOLS_LIST.filter((tool) => config.categories.includes(tool.category));
}
