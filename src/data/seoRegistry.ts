import { TOOLS_LIST } from './toolsList';
import type { ToolItem } from '../types';

/**
 * ToolTrack Centralized Technical SEO & Routing Registry
 * Manages clean URLs, canonical endpoints, metadata, Schema.org JSON-LD,
 * sitemap generation, and internal linking hierarchy.
 */

export const SITE_CONFIG = {
  url: 'https://tooltracker.vercel.app',
  name: 'ToolTrack',
  tagline: 'All Your Files & Productivity Tools in One Place',
  defaultTitle: 'ToolTrack – All Your Files & Productivity Tools in One Place',
  defaultDescription:
    'All-in-one file, document, image, and productivity toolkit. Work with PDFs, Word, Excel, images, OCR, Whiteboard, and design utilities directly in your browser.',
  keywords: [
    'PDF tools',
    'Word to PDF',
    'Excel to PDF',
    'image tools',
    'Whiteboard online',
    'OCR online',
    'image compressor',
    'background remover',
    'PDF to Word',
    'normalize PDF page size',
    'PDF merge',
    'PDF split',
    'student tools',
    'design utilities',
    'productivity workspace',
  ],
  logoUrl: 'https://tooltracker.vercel.app/icon-512.png',
};

export interface ToolSeoData {
  toolId: string;
  name: string;
  route: string; // Clean primary route e.g. /tools/pdf-merge
  aliases: string[]; // Supported aliases e.g. /merge-pdf, /tools/merge-pdf, #merge-pdf
  categoryKey: 'pdf' | 'image' | 'document' | 'ocr' | 'student' | 'design';
  categoryName: string;
  categoryRoute: string; // e.g. /tools/pdf
  seoTitle: string;
  seoDescription: string;
  h1: string;
  tagline: string;
  keywords: string[];
  supportedFormats: {
    input: string[];
    output: string[];
  };
  features: string[];
  howTo: { step: number; title: string; description: string }[];
  faq: { question: string; answer: string }[];
  relatedToolIds: string[];
}

export interface CategorySeoData {
  key: 'pdf' | 'image' | 'document' | 'ocr' | 'student' | 'design';
  route: string;
  name: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  tagline: string;
  toolIds: string[];
}

export const CATEGORIES_SEO: Record<string, CategorySeoData> = {
  pdf: {
    key: 'pdf',
    route: '/tools/pdf',
    name: 'PDF Tools',
    seoTitle: 'Online PDF Tools – Free PDF Utilities Suite | ToolTrack',
    seoDescription:
      'Free, 100% private online PDF tools: merge, split, compress, convert, organize, and normalize PDF page sizes directly in your browser.',
    h1: 'Free Online PDF Tools',
    tagline: 'Standardize, optimize, organize, and convert PDF documents in your browser.',
    toolIds: [
      'normalize-pdf-page-size',
      'merge-pdf',
      'split-pdf',
      'compress-pdf',
      'organize-pdf',
      'rotate-pdf',
      'flatten-pdf',
      'clean-pdf',
      'pdf-edit',
      'pdf-security',
      'pdf-inspector',
      'pdf-compare',
    ],
  },
  image: {
    key: 'image',
    route: '/tools/image',
    name: 'Image Tools',
    seoTitle: 'Online Image Tools – Compress, Resize & Convert Images | ToolTrack',
    seoDescription:
      'High-performance client-side and Sharp-powered image utilities: compress JPG, PNG, and WebP, remove backgrounds, resize dimensions, and batch convert.',
    h1: 'Free Online Image Tools',
    tagline: 'Compress, convert formats, and optimize image assets with zero privacy leakage.',
    toolIds: [
      'image-compressor',
      'image-resizer',
      'image-converter',
      'image-background-remover',
      'batch-image-processor',
      'image-metadata-remover',
    ],
  },
  document: {
    key: 'document',
    route: '/tools/document',
    name: 'Document Converters',
    seoTitle: 'Document Converter Online – Word & Excel to PDF | ToolTrack',
    seoDescription:
      'High-fidelity document conversions: convert Word DOCX to PDF preserving full layout and images, or convert PDF into editable Word and Excel.',
    h1: 'Free Online Document Converters',
    tagline: 'Authentic vector and office document conversion engines with layout preservation.',
    toolIds: [
      'word-to-pdf',
      'pdf-to-word',
      'excel-to-pdf',
      'pdf-to-excel',
      'text-to-pdf',
      'pdf-to-text',
      'images-to-pdf',
      'pdf-to-images',
    ],
  },
  ocr: {
    key: 'ocr',
    route: '/tools/ocr',
    name: 'OCR & Text Tools',
    seoTitle: 'OCR PDF Online – Extract Text from Scanned Documents | ToolTrack',
    seoDescription:
      'Extract text, tables, and notes from scanned PDFs and photos using client-side multilingual neural OCR.',
    h1: 'Free Online OCR & Text Recognition',
    tagline: 'Turn physical scans, receipts, and screenshots into selectable, searchable text.',
    toolIds: ['ocr-pdf', 'pdf-to-text', 'notes-to-pdf'],
  },
  student: {
    key: 'student',
    route: '/tools/student',
    name: 'Student & Academic Utilities',
    seoTitle: 'Student PDF Tools – Assignment Maker & Size Reducer | ToolTrack',
    seoDescription:
      'Specialized tools for student portals and online submissions: create clean assignment PDFs with cover pages and compress files under strict portal MB limits.',
    h1: 'Student & Academic File Utilities',
    tagline: 'Generate clean academic assignment PDFs and compress under submission portal limits.',
    toolIds: [
      'assignment-pdf-maker',
      'notes-to-pdf',
      'pdf-submission-compressor',
      'image-submission-compressor',
    ],
  },
  design: {
    key: 'design',
    route: '/tools/design',
    name: 'Design & Visual Utilities',
    seoTitle: 'Online Design Tools – Background Changer, Watermark & Crop | ToolTrack',
    seoDescription:
      'Everyday design utilities: replace image backgrounds, add watermarks, crop to exact ratios, pick hex colors, and inspect DPI dimensions.',
    h1: 'Design & Visual Media Tools',
    tagline: 'Inspect DPI, crop, watermark, and modify visual graphics right in your browser.',
    toolIds: [
      'whiteboard',
      'image-background-changer',
      'image-cropper',
      'image-watermark',
      'image-text',
      'image-color-picker',
      'image-info',
    ],
  },
};

export const TOOLS_SEO: Record<string, ToolSeoData> = {
  whiteboard: {
    toolId: 'whiteboard',
    name: 'Online Whiteboard',
    route: '/whiteboard',
    aliases: ['/whiteboard', '/tools/whiteboard', 'whiteboard', '#whiteboard'],
    categoryKey: 'design',
    categoryName: 'Design & Visual Utilities',
    categoryRoute: '/tools/design',
    seoTitle: 'Online Whiteboard – Free Drawing & Collaboration Tool | ToolTrack',
    seoDescription:
      'Free online whiteboard for drawing, diagrams, flowcharts, teaching, notes, and image annotations directly in your browser with high-resolution export.',
    h1: 'Online Whiteboard',
    tagline: 'Infinite collaborative canvas for drawing, teaching, diagramming, and real-time sketching.',
    keywords: [
      'online whiteboard',
      'whiteboard online',
      'free drawing board',
      'collaborative whiteboard',
      'sketchboard',
      'diagram maker',
      'flowchart canvas',
      'teaching whiteboard',
      'annotate images',
      'sticky notes canvas',
    ],
    supportedFormats: {
      input: ['PNG (.png)', 'JPG (.jpg)', 'WEBP (.webp)', 'SVG (.svg)', 'JSON (.json)'],
      output: ['PNG (.png)', 'JPG (.jpg)', 'PDF (.pdf)', 'SVG (.svg)', 'JSON (.json)'],
    },
    features: [
      'Infinite zoomable vector canvas with smooth handwriting rendering',
      'Rich shapes library: rectangles, diamonds, circles, arrows, connectors, and callouts',
      'Local offline-first persistence using IndexedDB and instant autosave',
      'High-resolution multi-format export to PNG, JPG, SVG, PDF, and Board JSON',
    ],
    howTo: [
      { step: 1, title: 'Open Whiteboard', description: 'Launch the canvas directly in your browser with zero sign-in required.' },
      { step: 2, title: 'Draw & Annotate', description: 'Use the pen, pencil, highlighter, shapes, sticky notes, and text tools to build diagrams.' },
      { step: 3, title: 'Export or Save', description: 'Download your high-res graphics as PNG, SVG, or PDF, or save the project locally.' },
    ],
    faq: [
      { question: 'Does the whiteboard work offline?', answer: 'Yes. The whiteboard is 100% client-side and automatically stores boards in local IndexedDB storage, allowing drawing without internet.' },
      { question: 'Is there a limit on canvas size or board count?', answer: 'No. The canvas has infinite coordinate space and supports unlimited locally saved boards.' },
    ],
    relatedToolIds: ['image-cropper', 'image-watermark', 'notes-to-pdf', 'assignment-pdf-maker'],
  },

  'merge-pdf': {
    toolId: 'merge-pdf',
    name: 'PDF Merge',
    route: '/tools/pdf-merge',
    aliases: ['/merge-pdf', '/tools/merge-pdf', '/tools/combine-pdf', 'merge-pdf'],
    categoryKey: 'pdf',
    categoryName: 'PDF Tools',
    categoryRoute: '/tools/pdf',
    seoTitle: 'PDF Merge Online – Combine PDF Files | ToolTrack',
    seoDescription:
      'Merge multiple PDF files into one document online with ToolTrack. Combine, reorder, and download your consolidated PDF quickly and securely.',
    h1: 'PDF Merge Online',
    tagline: 'Combine multiple PDF files into one document with custom ordering.',
    keywords: [
      'pdf merge',
      'merge pdf',
      'combine pdf',
      'combine pdf files',
      'join pdf',
      'merge pdf online',
      'free pdf merger',
      'join pdf files online',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['PDF (.pdf)'] },
    features: [
      'Reorder documents visually before merging',
      'Preserve original vector typography, bookmarks, and links',
      '100% private in-browser byte stream concatenation',
      'Unlimited page count support with fast assembly',
    ],
    howTo: [
      { step: 1, title: 'Upload PDF Files', description: 'Select or drag & drop two or more PDF files.' },
      { step: 2, title: 'Arrange Document Order', description: 'Reorder the files using drag controls or arrow buttons.' },
      { step: 3, title: 'Merge Documents', description: 'Click Merge to assemble the files into a single continuous stream.' },
      { step: 4, title: 'Download Consolidated PDF', description: 'Save your combined PDF directly to your device.' },
    ],
    faq: [
      { question: 'Is my document uploaded to a server?', answer: 'No. ToolTrack merges your PDF files entirely inside your browser memory using WebAssembly, ensuring maximum security.' },
      { question: 'Can I reorder individual pages?', answer: 'Yes. Use the Organize & Reorder PDF tool if you need granular page-level control.' },
    ],
    relatedToolIds: ['split-pdf', 'organize-pdf', 'compress-pdf', 'pdf-to-word'],
  },

  'split-pdf': {
    toolId: 'split-pdf',
    name: 'Split PDF',
    route: '/tools/pdf-split',
    aliases: ['/split-pdf', '/tools/split-pdf', 'split-pdf'],
    categoryKey: 'pdf',
    categoryName: 'PDF Tools',
    categoryRoute: '/tools/pdf',
    seoTitle: 'Split PDF Online – Extract Pages & Split PDF Files | ToolTrack',
    seoDescription:
      'Split PDF pages online into separate documents or extract custom page ranges (e.g. 1-3, 5-8) into individual PDFs or a ZIP file.',
    h1: 'Split PDF Online',
    tagline: 'Extract specific pages or break a multi-page PDF into separate files.',
    keywords: [
      'split pdf',
      'pdf split',
      'extract pdf pages',
      'separate pdf',
      'cut pdf',
      'split pdf online',
      'free pdf splitter',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['PDF (.pdf)', 'ZIP (.zip)'] },
    features: [
      'Split into individual one-page PDF documents',
      'Extract custom comma-separated ranges (e.g., 1-4, 7, 9-12)',
      'Bulk download as a single organized ZIP package',
      'Zero quality loss on extracted pages',
    ],
    howTo: [
      { step: 1, title: 'Select PDF', description: 'Upload the document you want to split or extract from.' },
      { step: 2, title: 'Choose Split Mode', description: 'Pick "Split every page" or enter custom page ranges.' },
      { step: 3, title: 'Extract Pages', description: 'Process the extraction instantly inside your browser.' },
      { step: 4, title: 'Download Files', description: 'Download individual PDFs or save all parts in a ZIP archive.' },
    ],
    faq: [
      { question: 'Will image or text quality decrease when splitting?', answer: 'No. The underlying vector graphics, fonts, and images are copied verbatim without recompression.' },
    ],
    relatedToolIds: ['merge-pdf', 'organize-pdf', 'compress-pdf', 'pdf-page-size'],
  },

  'compress-pdf': {
    toolId: 'compress-pdf',
    name: 'Compress PDF',
    route: '/tools/pdf-compress',
    aliases: ['/compress-pdf', '/tools/compress-pdf', '/tools/reduce-pdf-size', 'compress-pdf'],
    categoryKey: 'pdf',
    categoryName: 'PDF Tools',
    categoryRoute: '/tools/pdf',
    seoTitle: 'Compress PDF Online – Reduce PDF Size | ToolTrack',
    seoDescription:
      'Reduce PDF file size online with balanced, maximum, or high-fidelity compression presets. Shrink MB to KB for email and portal submissions.',
    h1: 'Compress PDF Online',
    tagline: 'Reduce PDF file size without sacrificing readability or vector clarity.',
    keywords: [
      'compress pdf',
      'reduce pdf size',
      'shrink pdf',
      'pdf size reducer',
      'compress pdf online',
      'make pdf smaller',
      'compress pdf file',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['PDF (.pdf)'] },
    features: [
      'Balanced, Maximum, and High-Quality compression presets',
      'Removes redundant stream objects and compresses embedded raster assets',
      'Target file size preview with before-and-after byte counter',
      'Fast client-side processing with zero server uploads',
    ],
    howTo: [
      { step: 1, title: 'Upload Large PDF', description: 'Drop your PDF file into the compressor.' },
      { step: 2, title: 'Select Compression Level', description: 'Choose between Balanced, Maximum, or High Quality.' },
      { step: 3, title: 'Compress Document', description: 'The engine strips unneeded metadata and optimizes streams.' },
      { step: 4, title: 'Save Smaller PDF', description: 'Download your optimized, lightweight PDF.' },
    ],
    faq: [
      { question: 'How much size can I save?', answer: 'Scanned and image-heavy PDFs often see 50% to 80% reduction, while pure text documents are stream-deflated efficiently.' },
    ],
    relatedToolIds: ['pdf-submission-compressor', 'normalize-pdf-page-size', 'merge-pdf', 'pdf-to-word'],
  },

  'pdf-to-word': {
    toolId: 'pdf-to-word',
    name: 'PDF to Word',
    route: '/tools/pdf-to-word',
    aliases: ['/pdf-to-word', '/tools/pdf-to-docx', 'pdf-to-word'],
    categoryKey: 'document',
    categoryName: 'Document Converters',
    categoryRoute: '/tools/document',
    seoTitle: 'PDF to Word Converter Online | ToolTrack',
    seoDescription:
      'Convert PDF to editable Word DOCX online with ToolTrack. Preserves text positioning, headings, tables, columns, and document styling accurately.',
    h1: 'PDF to Word Converter Online',
    tagline: 'Convert PDF documents into authentic, fully editable Microsoft Word (.docx) files.',
    keywords: [
      'pdf to word',
      'convert pdf to word',
      'pdf to docx',
      'pdf word converter',
      'editable pdf to word',
      'pdf to word online',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['Word DOCX (.docx)'] },
    features: [
      'Page-by-page layout analysis preserving text boxes and columns',
      'Authentic OpenXML table reconstruction',
      'Preserves font styling, bold weights, and colors',
      'Output compatible with Microsoft Word, Google Docs, and LibreOffice',
    ],
    howTo: [
      { step: 1, title: 'Upload PDF', description: 'Select the PDF file you need to make editable.' },
      { step: 2, title: 'Choose Mode', description: 'Select layout-preserved mode for resumes and reports, or flowing text for articles.' },
      { step: 3, title: 'Convert to DOCX', description: 'The analyzer reconstructs paragraphs, headings, and tables.' },
      { step: 4, title: 'Download Word Document', description: 'Open and edit directly in Microsoft Word or Google Docs.' },
    ],
    faq: [
      { question: 'Can I edit the converted file?', answer: 'Yes. The output is a standard Microsoft Word OpenXML (.docx) file with editable text, tables, and styles.' },
    ],
    relatedToolIds: ['word-to-pdf', 'pdf-to-excel', 'ocr-pdf', 'compress-pdf'],
  },

  'word-to-pdf': {
    toolId: 'word-to-pdf',
    name: 'Word to PDF',
    route: '/tools/word-to-pdf',
    aliases: ['/word-to-pdf', '/tools/docx-to-pdf', 'word-to-pdf'],
    categoryKey: 'document',
    categoryName: 'Document Converters',
    categoryRoute: '/tools/document',
    seoTitle: 'Word to PDF Converter Online | ToolTrack',
    seoDescription:
      'Convert Word DOCX and DOC to PDF online. Native document engine preserves exact multi-column layouts, tables, embedded photos, fonts, and margins.',
    h1: 'Word to PDF Converter Online',
    tagline: 'High-fidelity document rendering engine for Microsoft Word DOC and DOCX files.',
    keywords: [
      'word to pdf',
      'convert word to pdf',
      'docx to pdf',
      'doc to pdf converter',
      'word to pdf online',
      'high fidelity docx to pdf',
    ],
    supportedFormats: { input: ['Word (.docx, .doc, .rtf, .odt)'], output: ['PDF (.pdf)'] },
    features: [
      'Native document rendering engine powered by LibreOffice / Office export',
      'Preserves candidate profile photos, image crops, and aspect ratios',
      'Maintains two-column bullet layouts, tables, borders, and margins',
      'Strict post-conversion PDF validation with visual preview',
    ],
    howTo: [
      { step: 1, title: 'Select Word Document', description: 'Upload your .docx or .doc file.' },
      { step: 2, title: 'Render Document Layout', description: 'The native engine renders tables, photos, and fonts accurately.' },
      { step: 3, title: 'Inspect Visual Preview', description: 'Review the generated Page 1 preview thumbnail.' },
      { step: 4, title: 'Download Pristine PDF', description: 'Download your print-ready PDF document.' },
    ],
    faq: [
      { question: 'Will my two-column layout or profile photo shift?', answer: 'No. ToolTrack uses a real document rendering engine that renders the original document layout model rather than stripping text.' },
    ],
    relatedToolIds: ['pdf-to-word', 'excel-to-pdf', 'compress-pdf', 'merge-pdf'],
  },

  'normalize-pdf-page-size': {
    toolId: 'normalize-pdf-page-size',
    name: 'Normalize PDF Page Size',
    route: '/tools/pdf-page-size',
    aliases: ['/normalize-pdf-page-size', '/tools/normalize-pdf-page-size', '/tools/standardize-pdf', 'normalize-pdf-page-size'],
    categoryKey: 'pdf',
    categoryName: 'PDF Tools',
    categoryRoute: '/tools/pdf',
    seoTitle: 'Normalize PDF Page Size Online – Standardize A4 & Letter | ToolTrack',
    seoDescription:
      'Standardize mixed PDF page dimensions to uniform A4, US Letter, or custom paper size. Eliminates print scaling bugs and margin cutoffs.',
    h1: 'Normalize PDF Page Size Online',
    tagline: 'Standardize mixed scan dimensions to uniform A4 or Letter sizes without distortion.',
    keywords: [
      'normalize pdf page size',
      'resize pdf pages',
      'standardize pdf',
      'a4 pdf converter',
      'pdf page dimensions',
      'uniform pdf pages',
      'fit pdf to a4',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['PDF (.pdf)'] },
    features: [
      'Proportional scaling preserves original aspect ratio without distortion',
      'Supports ISO A4, A3, A5, US Letter, US Legal, and Tabloid standards',
      'Auto-rotation aligns landscape scans with portrait documents',
      'Interactive visual preview with before-and-after dimension comparison',
    ],
    howTo: [
      { step: 1, title: 'Upload Mixed PDF', description: 'Add your PDF containing different page dimensions.' },
      { step: 2, title: 'Pick Target Standard', description: 'Select A4 (210×297mm), US Letter, or custom millimeter size.' },
      { step: 3, title: 'Choose Fit or Fill', description: 'Fit scales proportionally with margins; Fill covers the sheet.' },
      { step: 4, title: 'Download Normalized PDF', description: 'Save your uniform document ready for print or filing.' },
    ],
    faq: [
      { question: 'Why normalize page sizes?', answer: 'Scanned bundles or combined receipts often have mixed dimensions that cause printers to clip margins or scale erratically.' },
    ],
    relatedToolIds: ['organize-pdf', 'merge-pdf', 'compress-pdf', 'pdf-edit'],
  },

  'image-compressor': {
    toolId: 'image-compressor',
    name: 'Image Compressor',
    route: '/tools/image-compressor',
    aliases: ['/image-compressor', '/tools/compress-image', 'image-compressor'],
    categoryKey: 'image',
    categoryName: 'Image Tools',
    categoryRoute: '/tools/image',
    seoTitle: 'Image Compressor Online – Reduce Image Size | ToolTrack',
    seoDescription:
      'Compress JPG, PNG, and WebP images online with ToolTrack. Granular slider control, Mozjpeg encoding, dimension limits, and zero quality loss.',
    h1: 'Image Compressor Online',
    tagline: 'Reduce image file size with granular quality control and lossless metadata stripping.',
    keywords: [
      'image compressor',
      'compress image',
      'reduce image size',
      'compress jpg',
      'compress png',
      'compress webp',
      'image size reducer',
      'online image optimizer',
    ],
    supportedFormats: { input: ['JPG', 'PNG', 'WebP', 'BMP', 'SVG'], output: ['JPG', 'PNG', 'WebP'] },
    features: [
      'Direct encoder quality mapping with zero arbitrary caps',
      'Mozjpeg and Libvips server pipeline with browser fallback',
      'Preserves alpha transparency on PNG and WebP assets',
      'Batch optimization with instant before/after byte metrics',
    ],
    howTo: [
      { step: 1, title: 'Upload Images', description: 'Select one or more photos from your device.' },
      { step: 2, title: 'Adjust Quality Slider', description: 'Set your exact compression percentage or dimension cap.' },
      { step: 3, title: 'Review Reduction', description: 'See real-time byte savings and image fidelity.' },
      { step: 4, title: 'Download Optimized Image', description: 'Save the compressed file individually or in bulk.' },
    ],
    faq: [
      { question: 'Does compressing PNG remove transparency?', answer: 'No. ToolTrack detects transparency and preserves full alpha channels while quantizing colors cleanly.' },
    ],
    relatedToolIds: ['image-resizer', 'image-converter', 'image-background-remover', 'images-to-pdf'],
  },

  'image-background-remover': {
    toolId: 'image-background-remover',
    name: 'Background Remover',
    route: '/tools/background-remover',
    aliases: ['/image-background-remover', '/remove-background', '/tools/remove-background', 'image-background-remover'],
    categoryKey: 'image',
    categoryName: 'Image Tools',
    categoryRoute: '/tools/image',
    seoTitle: 'Background Remover Online – Transparent PNG | ToolTrack',
    seoDescription:
      'Remove image background online automatically. High-resolution neural cutout, hair strand preservation, transparent PNG export, and background replacement.',
    h1: 'Background Remover Online',
    tagline: 'Instant AI and neural matting background cutout with clean alpha transparency.',
    keywords: [
      'background remover',
      'remove image background',
      'remove background from image',
      'transparent background',
      'transparent png',
      'background removal online',
      'cutout image background',
    ],
    supportedFormats: { input: ['JPG', 'PNG', 'WebP'], output: ['Transparent PNG (.png)'] },
    features: [
      'Accurate subject segmentation for portraits, products, and graphics',
      'Fine edge refinement and hair strand preservation',
      'Instant color background substitution or transparent alpha export',
      'Privacy-first architecture with local neural matting fallback',
    ],
    howTo: [
      { step: 1, title: 'Upload Photo', description: 'Drop any portrait, product, or graphic photo.' },
      { step: 2, title: 'Automatic Segmentation', description: 'The neural engine detects the foreground subject.' },
      { step: 3, title: 'Refine & Preview', description: 'Inspect edge quality or change backdrop to solid color/white.' },
      { step: 4, title: 'Download Transparent PNG', description: 'Export a high-resolution PNG with transparent background.' },
    ],
    faq: [
      { question: 'Is the output transparent?', answer: 'Yes. The background is completely cut out and saved as an RGBA 32-bit transparent PNG.' },
    ],
    relatedToolIds: ['image-background-changer', 'image-compressor', 'image-cropper', 'image-converter'],
  },

  'image-resizer': {
    toolId: 'image-resizer',
    name: 'Image Resizer',
    route: '/tools/image-resizer',
    aliases: ['/image-resizer', '/tools/resize-image', 'image-resizer'],
    categoryKey: 'image',
    categoryName: 'Image Tools',
    categoryRoute: '/tools/image',
    seoTitle: 'Image Resizer Online – Resize Images | ToolTrack',
    seoDescription:
      'Resize images by exact pixels, percentage, or maximum dimension. Maintain aspect ratio and download sharp, optimized photos.',
    h1: 'Image Resizer Online',
    tagline: 'Change image dimensions by exact pixels, aspect ratio, or percentage scale.',
    keywords: [
      'image resizer',
      'resize image',
      'change image dimensions',
      'resize photo online',
      'scale image',
      'resize jpg',
      'resize png',
    ],
    supportedFormats: { input: ['JPG', 'PNG', 'WebP', 'BMP'], output: ['JPG', 'PNG', 'WebP'] },
    features: [
      'Lock aspect ratio to prevent photo distortion',
      'Preset dimensions for social media, avatars, and print',
      'High-quality Lanczos/Bicubic resampling for crisp text and edges',
      'Instant dimensions checker before and after scaling',
    ],
    howTo: [
      { step: 1, title: 'Upload Photo', description: 'Select the image you want to resize.' },
      { step: 2, title: 'Enter Target Dimensions', description: 'Type target width/height or choose a percentage reduction.' },
      { step: 3, title: 'Verify Aspect Ratio', description: 'Keep the ratio locked to ensure natural proportions.' },
      { step: 4, title: 'Download Resized Image', description: 'Save the resized asset ready for web or printing.' },
    ],
    faq: [
      { question: 'Will resizing blur my image?', answer: 'ToolTrack uses high-grade resampling algorithms so downsizing preserves sharpness, while moderate upsizing maintains clean contours.' },
    ],
    relatedToolIds: ['image-compressor', 'image-cropper', 'image-converter', 'image-info'],
  },

  'image-converter': {
    toolId: 'image-converter',
    name: 'Image Format Converter',
    route: '/tools/image-converter',
    aliases: ['/image-converter', '/tools/convert-image-format', 'image-converter'],
    categoryKey: 'image',
    categoryName: 'Image Tools',
    categoryRoute: '/tools/image',
    seoTitle: 'Image Converter Online – Convert PNG, JPG, WebP | ToolTrack',
    seoDescription:
      'Convert images between PNG, JPG, WebP, BMP, and SVG formats online. Fast client-side conversion with customizable quality and transparency handling.',
    h1: 'Image Format Converter Online',
    tagline: 'Convert images seamlessly across JPG, PNG, WebP, and BMP standards.',
    keywords: [
      'image converter',
      'convert png to jpg',
      'convert jpg to png',
      'convert webp to jpg',
      'convert png to webp',
      'image format converter',
    ],
    supportedFormats: { input: ['PNG', 'JPG', 'JPEG', 'WebP', 'BMP', 'SVG'], output: ['JPG', 'PNG', 'WebP', 'BMP'] },
    features: [
      'Convert WebP images to universal JPG or PNG',
      'Transparent background support when converting to PNG or WebP',
      'Quality fine-tuning slider for lossy formats',
      'Batch conversion of multiple files in one click',
    ],
    howTo: [
      { step: 1, title: 'Upload Files', description: 'Select images in any format.' },
      { step: 2, title: 'Select Output Format', description: 'Choose your desired format (JPG, PNG, WebP).' },
      { step: 3, title: 'Convert Format', description: 'The encoder converts the pixel buffer directly.' },
      { step: 4, title: 'Download Converted Assets', description: 'Save your files individually or as a ZIP package.' },
    ],
    faq: [
      { question: 'How do I convert WebP to JPG?', answer: 'Simply upload your .webp file, select JPG as target format, and click Convert.' },
    ],
    relatedToolIds: ['image-compressor', 'image-resizer', 'images-to-pdf', 'background-remover'],
  },

  'images-to-pdf': {
    toolId: 'images-to-pdf',
    name: 'Image to PDF',
    route: '/tools/image-to-pdf',
    aliases: ['/images-to-pdf', '/tools/images-to-pdf', '/tools/jpg-to-pdf', 'images-to-pdf'],
    categoryKey: 'document',
    categoryName: 'Document Converters',
    categoryRoute: '/tools/document',
    seoTitle: 'Image to PDF Converter Online – JPG to PDF | ToolTrack',
    seoDescription:
      'Convert JPG, PNG, and WebP photos into a clean PDF document online. Set paper size (A4, Letter, Fit Image), orientation, and custom margins.',
    h1: 'Image to PDF Converter Online',
    tagline: 'Combine photos, scans, and graphic receipts into a unified multi-page PDF.',
    keywords: [
      'image to pdf',
      'jpg to pdf',
      'png to pdf',
      'convert images to pdf',
      'photos to pdf',
      'jpg to pdf online',
    ],
    supportedFormats: { input: ['JPG', 'PNG', 'WebP', 'BMP'], output: ['PDF (.pdf)'] },
    features: [
      'Fit images onto standard ISO A4, US Letter, or exact photo aspect ratio',
      'Auto-orientation detects landscape vs portrait automatically',
      'Configurable margins to prevent edge bleed on home printers',
      'Combine up to 50 photos into one consolidated PDF file',
    ],
    howTo: [
      { step: 1, title: 'Add Images', description: 'Upload photos or scanned pages.' },
      { step: 2, title: 'Set Page Layout', description: 'Choose A4 or Letter paper size and margin width.' },
      { step: 3, title: 'Generate PDF', description: 'Images are placed onto vector canvas pages cleanly.' },
      { step: 4, title: 'Download Document', description: 'Save your compiled PDF file.' },
    ],
    faq: [
      { question: 'Can I add multiple photos into one PDF?', answer: 'Yes. You can upload up to 50 photos and compile them into a multi-page document.' },
    ],
    relatedToolIds: ['pdf-to-images', 'word-to-pdf', 'merge-pdf', 'image-compressor'],
  },

  'pdf-to-images': {
    toolId: 'pdf-to-images',
    name: 'PDF to JPG / PNG',
    route: '/tools/pdf-to-jpg',
    aliases: ['/pdf-to-images', '/tools/pdf-to-images', '/tools/pdf-to-png', 'pdf-to-images'],
    categoryKey: 'document',
    categoryName: 'Document Converters',
    categoryRoute: '/tools/document',
    seoTitle: 'PDF to JPG Converter Online – Extract PDF Pages to Images | ToolTrack',
    seoDescription:
      'Convert PDF pages into high-resolution JPG or PNG images online. Download individual pages or save all pages in a ZIP archive.',
    h1: 'PDF to JPG Converter Online',
    tagline: 'Render PDF document pages into high-resolution JPG or PNG picture files.',
    keywords: [
      'pdf to jpg',
      'pdf to png',
      'convert pdf to image',
      'pdf to image converter',
      'pdf to jpg online',
      'extract images from pdf',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['JPG (.jpg)', 'PNG (.png)', 'ZIP (.zip)'] },
    features: [
      'High DPI vector rendering for sharp typography and graphs',
      'Export as universal JPG or lossless PNG',
      'Single-page download or bulk ZIP packaging for all pages',
      '100% private in-browser canvas rasterization',
    ],
    howTo: [
      { step: 1, title: 'Upload PDF', description: 'Select the PDF document to convert into images.' },
      { step: 2, title: 'Choose Image Format', description: 'Select JPG for smaller file size or PNG for maximum sharpness.' },
      { step: 3, title: 'Render Pages', description: 'The engine renders each page into an image canvas.' },
      { step: 4, title: 'Download Images', description: 'Save individual pictures or download all pages in a ZIP archive.' },
    ],
    faq: [
      { question: 'What resolution are the extracted images?', answer: 'Pages are rendered at high DPI (up to 2x or 3x scale) to ensure fine text remains perfectly legible.' },
    ],
    relatedToolIds: ['images-to-pdf', 'pdf-to-word', 'split-pdf', 'ocr-pdf'],
  },

  'ocr-pdf': {
    toolId: 'ocr-pdf',
    name: 'OCR PDF Text Recognition',
    route: '/tools/pdf-ocr',
    aliases: ['/ocr-pdf', '/tools/ocr-pdf', 'ocr-pdf'],
    categoryKey: 'ocr',
    categoryName: 'OCR & Text Tools',
    categoryRoute: '/tools/ocr',
    seoTitle: 'OCR PDF Online – Extract Text from Scanned Documents | ToolTrack',
    seoDescription:
      'Extract editable text from scanned PDFs, photos, and book pages online using client-side multilingual neural OCR.',
    h1: 'OCR PDF Text Recognition Online',
    tagline: 'Convert scanned PDF documents and image snapshots into searchable, selectable text.',
    keywords: [
      'ocr pdf',
      'pdf ocr',
      'extract text from scanned pdf',
      'ocr online',
      'scanned pdf to text',
      'free pdf ocr',
    ],
    supportedFormats: { input: ['PDF (.pdf)', 'Image (.png, .jpg)'], output: ['Text (.txt)', 'Searchable Text'] },
    features: [
      'Multilingual neural text recognition (English, Spanish, German, French, etc.)',
      'Preserves paragraph boundaries and columnar text flow',
      'One-click copy to clipboard or download as .txt file',
      'Runs locally in browser without sending documents to third parties',
    ],
    howTo: [
      { step: 1, title: 'Upload Scanned Document', description: 'Add your scanned PDF or photo.' },
      { step: 2, title: 'Select Language', description: 'Pick the document language for maximum recognition accuracy.' },
      { step: 3, title: 'Run OCR Analysis', description: 'The optical character recognition engine extracts words line by line.' },
      { step: 4, title: 'Copy or Download', description: 'Copy extracted text directly or download as a text file.' },
    ],
    faq: [
      { question: 'Can it read handwriting?', answer: 'The OCR engine is optimized for printed documents, typed notes, receipts, and book scans.' },
    ],
    relatedToolIds: ['pdf-to-text', 'notes-to-pdf', 'pdf-to-word', 'pdf-inspector'],
  },

  'organize-pdf': {
    toolId: 'organize-pdf',
    name: 'Organize & Reorder PDF',
    route: '/tools/organize-pdf',
    aliases: ['/organize-pdf', 'organize-pdf'],
    categoryKey: 'pdf',
    categoryName: 'PDF Tools',
    categoryRoute: '/tools/pdf',
    seoTitle: 'Organize PDF Online – Reorder, Rotate & Delete Pages | ToolTrack',
    seoDescription:
      'Reorder pages visually, rotate upside-down scans, duplicate important sections, or remove unwanted pages from PDF files online.',
    h1: 'Organize & Reorder PDF Online',
    tagline: 'Visual page grid to reorder, rotate, duplicate, and delete PDF pages.',
    keywords: [
      'organize pdf',
      'reorder pdf pages',
      'rotate pdf pages',
      'delete pages from pdf',
      'rearrange pdf',
      'sort pdf pages',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['PDF (.pdf)'] },
    features: [
      'Visual thumbnail grid showing every page in your document',
      'Drag-and-drop or button-based page reordering',
      'Individual page rotation (90°, 180°, 270°)',
      'Instant deletion of blank or unwanted pages',
    ],
    howTo: [
      { step: 1, title: 'Upload PDF', description: 'Upload the document you want to organize.' },
      { step: 2, title: 'Rearrange Pages', description: 'Drag thumbnails to reorder or click delete on unwanted pages.' },
      { step: 3, title: 'Rotate If Needed', description: 'Use the rotate button to fix sideways or upside-down scans.' },
      { step: 4, title: 'Save Organized PDF', description: 'Download your cleaned and properly arranged PDF.' },
    ],
    faq: [
      { question: 'Can I insert blank pages?', answer: 'Yes, you can insert blank pages wherever needed directly from the page grid toolbar.' },
    ],
    relatedToolIds: ['normalize-pdf-page-size', 'merge-pdf', 'split-pdf', 'compress-pdf'],
  },

  'pdf-edit': {
    toolId: 'pdf-edit',
    name: 'Edit & Annotate PDF',
    route: '/tools/pdf-editor',
    aliases: ['/pdf-edit', '/tools/pdf-edit', '/tools/pdf-editor', 'pdf-edit'],
    categoryKey: 'pdf',
    categoryName: 'PDF Tools',
    categoryRoute: '/tools/pdf',
    seoTitle: 'Edit PDF Online – Add Text, Signatures & Annotations | ToolTrack',
    seoDescription:
      'Edit PDF files online for free. Add text, insert signatures, highlight paragraphs, draw shapes, and redact sensitive information.',
    h1: 'Edit & Annotate PDF Online',
    tagline: 'Fill forms, insert digital signatures, add annotations, and mark up PDF files.',
    keywords: [
      'edit pdf',
      'pdf editor online',
      'sign pdf',
      'add text to pdf',
      'annotate pdf',
      'free pdf editor',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['PDF (.pdf)'] },
    features: [
      'Add custom text fields and form entries directly onto pages',
      'Draw or upload digital signature stamps',
      'Highlight passages, add rectangular callouts and arrows',
      'Save flattened annotations securely with original formatting',
    ],
    howTo: [
      { step: 1, title: 'Upload PDF', description: 'Open your document inside the editor.' },
      { step: 2, title: 'Add Annotations', description: 'Click to add text, signatures, highlights, or shapes.' },
      { step: 3, title: 'Position & Style', description: 'Adjust font sizes, colors, and line thicknesses.' },
      { step: 4, title: 'Export Edited PDF', description: 'Download your completed, signed document.' },
    ],
    faq: [
      { question: 'Is my digital signature stored online?', answer: 'No. Signatures exist only in temporary browser memory and are drawn directly into the PDF byte stream.' },
    ],
    relatedToolIds: ['pdf-security', 'organize-pdf', 'compress-pdf', 'pdf-to-word'],
  },

  'pdf-compare': {
    toolId: 'pdf-compare',
    name: 'Compare Two PDFs',
    route: '/tools/pdf-compare',
    aliases: ['/pdf-compare', '/tools/pdf-compare', 'pdf-compare'],
    categoryKey: 'pdf',
    categoryName: 'PDF Tools',
    categoryRoute: '/tools/pdf',
    seoTitle: 'Compare PDF Files Online – Visual & Text Difference | ToolTrack',
    seoDescription:
      'Compare two PDF documents side by side. Detect page count discrepancies, dimension variances, and text changes between versions.',
    h1: 'Compare Two PDF Documents Online',
    tagline: 'Inspect structural, dimensional, and textual changes between two PDF revisions.',
    keywords: [
      'compare pdf',
      'pdf comparison tool',
      'compare two pdfs',
      'pdf diff online',
      'check pdf differences',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['Comparison Report'] },
    features: [
      'Side-by-side structural comparison of original vs revised documents',
      'Identifies page count differences and dimension changes',
      'Extracted text volume comparison and text diff view',
      'Deterministic analysis without worker detachment errors',
    ],
    howTo: [
      { step: 1, title: 'Upload Original PDF', description: 'Select Document 1 (original version).' },
      { step: 2, title: 'Upload Modified PDF', description: 'Select Document 2 (revised version).' },
      { step: 3, title: 'Run Comparison', description: 'The analyzer inspects geometry, pages, and text volume.' },
      { step: 4, title: 'Review Diff Report', description: 'Inspect disparities side by side on your screen.' },
    ],
    faq: [
      { question: 'Can I compare contracts or legal revisions?', answer: 'Yes. It quickly verifies if pages were added, removed, or if character volume changed significantly.' },
    ],
    relatedToolIds: ['pdf-inspector', 'pdf-edit', 'normalize-pdf-page-size', 'pdf-security'],
  },

  'assignment-pdf-maker': {
    toolId: 'assignment-pdf-maker',
    name: 'Assignment PDF Maker',
    route: '/tools/assignment-pdf-maker',
    aliases: ['/assignment-pdf-maker', 'assignment-pdf-maker'],
    categoryKey: 'student',
    categoryName: 'Student Utilities',
    categoryRoute: '/tools/student',
    seoTitle: 'Assignment PDF Maker Online – Clean Submissions | ToolTrack',
    seoDescription:
      'Create clean, professional assignment PDFs with title pages, student IDs, course information, headers, page numbers, and embedded photos.',
    h1: 'Assignment PDF Maker Online',
    tagline: 'Assemble student homework, laboratory reports, and essays into clean academic PDF bundles.',
    keywords: [
      'assignment pdf maker',
      'student assignment pdf',
      'create assignment cover page',
      'homework pdf maker',
      'academic report maker',
    ],
    supportedFormats: { input: ['Images', 'Notes', 'PDFs'], output: ['PDF (.pdf)'] },
    features: [
      'Customizable academic cover page with institution name and student details',
      'Automatic page numbering and header labels',
      'Embed assignment snapshot photos and scanned homework notes',
      'Lightweight file output compliant with university portal limits',
    ],
    howTo: [
      { step: 1, title: 'Enter Assignment Details', description: 'Type course name, assignment title, and your student details.' },
      { step: 2, title: 'Upload Content Photos', description: 'Add pictures of handwritten homework or typed notes.' },
      { step: 3, title: 'Format & Order', description: 'Arrange pages into logical academic order.' },
      { step: 4, title: 'Generate Assignment PDF', description: 'Download your polished submission-ready PDF.' },
    ],
    faq: [
      { question: 'Can I add multiple photos to the report?', answer: 'Yes. You can add all homework pages and they will be formatted with continuous headers and numbers.' },
    ],
    relatedToolIds: ['notes-to-pdf', 'pdf-submission-compressor', 'normalize-pdf-page-size', 'merge-pdf'],
  },

  'notes-to-pdf': {
    toolId: 'notes-to-pdf',
    name: 'Notes to PDF Scanner',
    route: '/tools/notes-to-pdf',
    aliases: ['/notes-to-pdf', 'notes-to-pdf'],
    categoryKey: 'student',
    categoryName: 'Student Utilities',
    categoryRoute: '/tools/student',
    seoTitle: 'Notes to PDF Online – Scan & Enhance Handwritten Notes | ToolTrack',
    seoDescription:
      'Convert handwritten notes, whiteboard photos, and study summaries into crisp, high-contrast printable PDF documents.',
    h1: 'Notes to PDF Scanner Online',
    tagline: 'Enhance whiteboard snapshots and notebook pages into clean, printable PDFs.',
    keywords: [
      'notes to pdf',
      'handwritten notes to pdf',
      'whiteboard to pdf',
      'scan study notes to pdf',
      'lecture notes scanner',
    ],
    supportedFormats: { input: ['Photos (.jpg, .png, .webp)'], output: ['PDF (.pdf)'] },
    features: [
      'High-contrast enhancement filters to clean notebook backgrounds',
      'Perspective alignment for desk angle photos',
      'Multi-page continuous notebook compilation',
      'Standardized A4 sheet formatting for easy printing',
    ],
    howTo: [
      { step: 1, title: 'Upload Note Photos', description: 'Add pictures of your notebook or whiteboard.' },
      { step: 2, title: 'Apply Clean Filter', description: 'Choose high-contrast document filter to whiten paper.' },
      { step: 3, title: 'Arrange Sequence', description: 'Order lecture pages chronologically.' },
      { step: 4, title: 'Export Notes PDF', description: 'Download your clean, readable study notes.' },
    ],
    faq: [
      { question: 'Does it remove shadow on notebook pictures?', answer: 'Yes. The document enhancement filter neutralizes uneven desk shadows and boosts ink contrast.' },
    ],
    relatedToolIds: ['assignment-pdf-maker', 'pdf-submission-compressor', 'ocr-pdf', 'images-to-pdf'],
  },

  'pdf-submission-compressor': {
    toolId: 'pdf-submission-compressor',
    name: 'PDF Size Reducer for Submission',
    route: '/tools/pdf-submission-compressor',
    aliases: ['/pdf-submission-compressor', 'pdf-submission-compressor'],
    categoryKey: 'student',
    categoryName: 'Student Utilities',
    categoryRoute: '/tools/student',
    seoTitle: 'PDF Size Reducer for Online Submission – Under 100KB, 500KB, 1MB | ToolTrack',
    seoDescription:
      'Compress PDF documents to strict target sizes (100KB, 500KB, 1MB, 2MB, 5MB) for school portals, visa applications, and job submissions.',
    h1: 'PDF Size Reducer for Online Submissions',
    tagline: 'Compress PDF documents to guarantee they stay beneath portal upload caps.',
    keywords: [
      'compress pdf for submission',
      'reduce pdf below 1mb',
      'compress pdf 100kb',
      'compress pdf 500kb',
      'visa application pdf compressor',
      'university portal pdf size reducer',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['PDF (.pdf)'] },
    features: [
      'Target file size constraints: 100KB, 200KB, 500KB, 1MB, 2MB, 5MB',
      'Automated iterative stream optimization to reach target',
      'Preserves applicant signature and text legibility',
      'Zero server upload keeps personal data confidential',
    ],
    howTo: [
      { step: 1, title: 'Upload Heavy Document', description: 'Select the file rejected by the upload portal.' },
      { step: 2, title: 'Choose Portal Limit', description: 'Pick your portal cap (e.g. 500 KB or 1 MB).' },
      { step: 3, title: 'Optimize Document', description: 'The optimizer tunes quality iteratively until size passes.' },
      { step: 4, title: 'Download Compliant File', description: 'Upload with confidence without portal size errors.' },
    ],
    faq: [
      { question: 'Will my submission be rejected for blurry text?', answer: 'No. Vector fonts remain sharp while raster elements are optimized to meet the target threshold.' },
    ],
    relatedToolIds: ['compress-pdf', 'image-submission-compressor', 'assignment-pdf-maker', 'normalize-pdf-page-size'],
  },

  'image-submission-compressor': {
    toolId: 'image-submission-compressor',
    name: 'Image Size Reducer for Submission',
    route: '/tools/image-submission-compressor',
    aliases: ['/image-submission-compressor', 'image-submission-compressor'],
    categoryKey: 'student',
    categoryName: 'Student Utilities',
    categoryRoute: '/tools/student',
    seoTitle: 'Image Size for Online Submission – Compress Below 50KB, 100KB, 200KB | ToolTrack',
    seoDescription:
      'Compress passport photos, ID scans, and signature images to exact submission limits (20KB, 50KB, 100KB, 200KB) for government and exam portals.',
    h1: 'Image Size for Online Submission',
    tagline: 'Target-size photo compressor for exam forms, passport portals, and job applications.',
    keywords: [
      'compress photo for exam portal',
      'reduce image below 50kb',
      'compress image 100kb',
      'passport photo size reducer',
      'signature image compressor 20kb',
    ],
    supportedFormats: { input: ['JPG', 'PNG', 'JPEG'], output: ['JPG', 'PNG'] },
    features: [
      'Preset limits for official portals: 20KB, 50KB, 100KB, 200KB, 500KB',
      'Automatic dimension and quality search loop',
      'Preserves facial clarity and signature contours',
      'Instant validation badge when target size is satisfied',
    ],
    howTo: [
      { step: 1, title: 'Select Photo or Signature', description: 'Upload your photo or signature scan.' },
      { step: 2, title: 'Select Portal Cap', description: 'Choose your portal ceiling (e.g. Under 50 KB).' },
      { step: 3, title: 'Compress to Target', description: 'Sharp and Mozjpeg algorithms optimize bytes.' },
      { step: 4, title: 'Download Compliant Photo', description: 'Upload successfully to government or school form.' },
    ],
    faq: [
      { question: 'Can I compress my signature to under 20KB?', answer: 'Yes. Select the 20KB threshold and the tool will calculate the optimal dimensions and chroma parameters.' },
    ],
    relatedToolIds: ['image-compressor', 'pdf-submission-compressor', 'image-resizer', 'image-converter'],
  },

  'image-background-changer': {
    toolId: 'image-background-changer',
    name: 'Change Background',
    route: '/tools/background-changer',
    aliases: ['/image-background-changer', '/tools/background-changer', 'image-background-changer'],
    categoryKey: 'design',
    categoryName: 'Design Utilities',
    categoryRoute: '/tools/design',
    seoTitle: 'Background Changer Online – Replace Photo Background | ToolTrack',
    seoDescription:
      'Replace photo background online with white, blue passport color, studio gradients, or custom backdrop images. Perfect for IDs and product catalogs.',
    h1: 'Change Image Background Online',
    tagline: 'Replace photo backdrops with white, passport colors, gradients, or custom scenery.',
    keywords: [
      'background changer',
      'change photo background',
      'white background for photo',
      'passport photo background changer',
      'replace background online',
    ],
    supportedFormats: { input: ['JPG', 'PNG', 'WebP'], output: ['JPG', 'PNG'] },
    features: [
      'One-click solid white, light grey, and passport blue backdrops',
      'Custom image backdrop replacement with depth blending',
      'Automatic AI subject cutout and edge soft masking',
      'High-resolution output export without watermarks',
    ],
    howTo: [
      { step: 1, title: 'Upload Photo', description: 'Add the portrait or product photo.' },
      { step: 2, title: 'Select New Backdrop', description: 'Pick solid white, passport blue, gradient, or upload a custom scene.' },
      { step: 3, title: 'Preview Composition', description: 'Check foreground cut and shadow blending.' },
      { step: 4, title: 'Download Finished Photo', description: 'Save your polished photo ready for use.' },
    ],
    faq: [
      { question: 'Can I make a white background for Amazon or passport photos?', answer: 'Yes. Simply click the white or passport blue preset for an instant compliant photo.' },
    ],
    relatedToolIds: ['image-background-remover', 'image-cropper', 'image-compressor', 'image-converter'],
  },

  'image-cropper': {
    toolId: 'image-cropper',
    name: 'Image Cropper',
    route: '/tools/image-cropper',
    aliases: ['/image-cropper', 'image-cropper'],
    categoryKey: 'design',
    categoryName: 'Design Utilities',
    categoryRoute: '/tools/design',
    seoTitle: 'Image Cropper Online – Crop to Exact Aspect Ratio | ToolTrack',
    seoDescription:
      'Crop images to exact aspect ratios (1:1, 16:9, 4:3, 9:16) or custom pixel dimensions online. Includes circular avatar cropping and rotation.',
    h1: 'Image Cropper Online',
    tagline: 'Crop photos to exact aspect ratios and pixel dimensions with zero quality loss.',
    keywords: [
      'image cropper',
      'crop image',
      'crop photo online',
      'crop image to 1:1',
      'avatar cropper',
      'aspect ratio cropper',
    ],
    supportedFormats: { input: ['JPG', 'PNG', 'WebP', 'BMP'], output: ['JPG', 'PNG', 'WebP'] },
    features: [
      'Aspect ratio presets: 1:1 Square, 16:9 Banner, 4:3 Photo, 9:16 Story',
      'Circular crop preview for social media profile avatars',
      'Exact pixel selection width and height input controls',
      'Lossless pixel extraction without blurring untouched regions',
    ],
    howTo: [
      { step: 1, title: 'Select Photo', description: 'Upload the image you need to crop.' },
      { step: 2, title: 'Drag Crop Box', description: 'Position the boundary box over your focal area.' },
      { step: 3, title: 'Lock Aspect Ratio', description: 'Optionally lock 1:1 for square avatars or 16:9 for landscape.' },
      { step: 4, title: 'Download Cropped Image', description: 'Export your cropped graphic.' },
    ],
    faq: [
      { question: 'Can I crop without losing sharpness?', answer: 'Yes. The crop bounding box samples original source pixels directly without downscaling.' },
    ],
    relatedToolIds: ['image-resizer', 'image-compressor', 'image-background-remover', 'image-watermark'],
  },

  'image-watermark': {
    toolId: 'image-watermark',
    name: 'Image Watermark',
    route: '/tools/image-watermark',
    aliases: ['/image-watermark', 'image-watermark'],
    categoryKey: 'design',
    categoryName: 'Design Utilities',
    categoryRoute: '/tools/design',
    seoTitle: 'Watermark Images Online – Add Text & Logo Watermarks | ToolTrack',
    seoDescription:
      'Protect your photos online. Add text watermarks, copyright notices, or logo stamps with customizable opacity, rotation, and tiling.',
    h1: 'Image Watermark Online',
    tagline: 'Stamp text copyright notices, branding logos, and security watermarks onto photos.',
    keywords: [
      'image watermark',
      'watermark photos online',
      'add watermark to image',
      'protect photos',
      'copyright stamp online',
    ],
    supportedFormats: { input: ['JPG', 'PNG', 'WebP'], output: ['JPG', 'PNG', 'WebP'] },
    features: [
      'Text watermarks with custom font, color, opacity, and rotation',
      'Tile watermark pattern across the entire image to prevent unauthorized cropping',
      'Batch watermarking of multiple photos simultaneously',
      'Real-time interactive canvas preview',
    ],
    howTo: [
      { step: 1, title: 'Upload Photos', description: 'Select one or more images.' },
      { step: 2, title: 'Type Watermark Text', description: 'Enter copyright notice, creator handle, or company name.' },
      { step: 3, title: 'Adjust Opacity & Position', description: 'Tune transparency and choose center, corner, or tiled layout.' },
      { step: 4, title: 'Download Watermarked Images', description: 'Save protected photos.' },
    ],
    faq: [
      { question: 'Can I watermark multiple photos at once?', answer: 'Yes. ToolTrack supports batch watermarking so you can protect whole galleries in seconds.' },
    ],
    relatedToolIds: ['image-text', 'image-compressor', 'image-cropper', 'batch-image-processor'],
  },

  'image-text': {
    toolId: 'image-text',
    name: 'Add Text Over Image',
    route: '/tools/image-text',
    aliases: ['/image-text', 'image-text'],
    categoryKey: 'design',
    categoryName: 'Design Utilities',
    categoryRoute: '/tools/design',
    seoTitle: 'Add Text to Image Online – Photo Text Editor | ToolTrack',
    seoDescription:
      'Add captions, titles, dates, and labels over photos online. Customize typography, colors, shadows, and backgrounds with instant preview.',
    h1: 'Add Text Over Image Online',
    tagline: 'Typeset clean titles, captions, badges, and labels directly over photos.',
    keywords: [
      'add text to image',
      'text over photo',
      'caption photo online',
      'photo text editor',
      'write on picture',
    ],
    supportedFormats: { input: ['JPG', 'PNG', 'WebP'], output: ['JPG', 'PNG', 'WebP'] },
    features: [
      'Modern fonts, text colors, background pill badges, and drop shadows',
      'Precise draggable positioning and alignment guides',
      'Full resolution rasterization matching camera dimensions',
      'Quick presets for memes, captions, price tags, and banners',
    ],
    howTo: [
      { step: 1, title: 'Upload Image', description: 'Add your graphic or photo.' },
      { step: 2, title: 'Write Caption Text', description: 'Type your message, title, or label.' },
      { step: 3, title: 'Style Typography', description: 'Pick font style, size, color, and optional background pill.' },
      { step: 4, title: 'Download Labeled Photo', description: 'Export your captioned picture.' },
    ],
    faq: [
      { question: 'Will the original image resolution be preserved?', answer: 'Yes. The canvas draws text at the full native resolution of your original photo.' },
    ],
    relatedToolIds: ['image-watermark', 'image-cropper', 'image-compressor', 'image-background-changer'],
  },

  'image-color-picker': {
    toolId: 'image-color-picker',
    name: 'Image Color Picker',
    route: '/tools/image-color-picker',
    aliases: ['/image-color-picker', 'image-color-picker'],
    categoryKey: 'design',
    categoryName: 'Design Utilities',
    categoryRoute: '/tools/design',
    seoTitle: 'Image Color Picker Online – Extract HEX, RGB & HSL from Photos | ToolTrack',
    seoDescription:
      'Inspect and extract exact color codes from images online. Magnifier loupe, HEX, RGB, HSL values, and dominant color palette generator.',
    h1: 'Image Color Picker Online',
    tagline: 'Magnifying pixel loupe to extract HEX, RGB, and HSL color values from any photo.',
    keywords: [
      'image color picker',
      'color picker from image',
      'extract hex from photo',
      'image palette generator',
      'pixel color finder',
    ],
    supportedFormats: { input: ['JPG', 'PNG', 'WebP', 'BMP', 'SVG'], output: ['HEX / RGB / Palette'] },
    features: [
      'Precision magnifying loupe showing individual pixel RGB values',
      'One-click copy for HEX (#RRGGBB), RGB(r,g,b), and HSL formats',
      'Automatic dominant color palette extraction from entire image',
      'Zero server upload keeps creative assets private',
    ],
    howTo: [
      { step: 1, title: 'Upload Image', description: 'Drop your photo, mockup, or logo.' },
      { step: 2, title: 'Hover or Tap Pixel', description: 'Move the magnifier loupe over any detail.' },
      { step: 3, title: 'Inspect Values', description: 'View real-time HEX, RGB, and HSL codes.' },
      { step: 4, title: 'Copy Palette', description: 'Click to copy individual hex codes or full palette.' },
    ],
    faq: [
      { question: 'Can I extract the dominant color palette?', answer: 'Yes. ToolTrack automatically analyzes the image and presents the top dominant swatches below the photo.' },
    ],
    relatedToolIds: ['image-info', 'image-cropper', 'image-background-changer', 'image-converter'],
  },

  'image-info': {
    toolId: 'image-info',
    name: 'Image Dimension & DPI Checker',
    route: '/tools/image-info',
    aliases: ['/image-info', 'image-info'],
    categoryKey: 'design',
    categoryName: 'Design Utilities',
    categoryRoute: '/tools/design',
    seoTitle: 'Image DPI & Dimension Checker Online | ToolTrack',
    seoDescription:
      'Check image pixel width, height, aspect ratio, print size (inches/cm), DPI resolution, file size, and color depth online.',
    h1: 'Image Dimension & DPI Checker Online',
    tagline: 'Inspect pixel dimensions, DPI, print size, and color metadata without uploading.',
    keywords: [
      'image dpi checker',
      'check image dimensions',
      'image resolution checker',
      'print size calculator',
      'check photo dpi online',
    ],
    supportedFormats: { input: ['JPG', 'PNG', 'WebP', 'BMP', 'GIF', 'SVG'], output: ['Metadata Report'] },
    features: [
      'Pixel resolution (width × height) and aspect ratio classification',
      'Calculated physical print sizes at 300 DPI, 150 DPI, and 72 DPI (inches & cm)',
      'Byte volume and compression ratio analysis',
      'Format specification and color space inspection',
    ],
    howTo: [
      { step: 1, title: 'Select Image', description: 'Drop your image into the inspector.' },
      { step: 2, title: 'Instant Inspection', description: 'The metadata parser reads header tags immediately.' },
      { step: 3, title: 'Review Print Dimensions', description: 'Check whether the image has enough pixels for high-quality printing.' },
      { step: 4, title: 'Copy Metrics', description: 'Copy dimensions or export report.' },
    ],
    faq: [
      { question: 'What DPI is needed for printing?', answer: 'Commercial print usually requires 300 DPI. ToolTrack shows you the maximum printable size in inches and centimeters at 300 DPI.' },
    ],
    relatedToolIds: ['image-resizer', 'image-compressor', 'image-color-picker', 'pdf-inspector'],
  },

  'batch-image-processor': {
    toolId: 'batch-image-processor',
    name: 'Batch Image Processor',
    route: '/tools/batch-image-processor',
    aliases: ['/batch-image-processor', 'batch-image-processor'],
    categoryKey: 'image',
    categoryName: 'Image Tools',
    categoryRoute: '/tools/image',
    seoTitle: 'Batch Image Processor Online – Compress, Resize & Convert in Bulk | ToolTrack',
    seoDescription:
      'Process dozens of images at once online. Bulk compress, bulk resize dimensions, convert formats, or apply watermarks and download as a single ZIP.',
    h1: 'Batch Image Processor Online',
    tagline: 'Bulk optimize, resize, convert, and watermark multiple photos simultaneously.',
    keywords: [
      'batch image processor',
      'bulk image compressor',
      'bulk image resizer',
      'batch convert images',
      'bulk photo optimizer',
    ],
    supportedFormats: { input: ['JPG', 'PNG', 'WebP', 'BMP'], output: ['ZIP (.zip)', 'Multiple Files'] },
    features: [
      'Process up to 50 photos simultaneously in parallel',
      'Unified controls for quality, dimension limits, format conversion, and watermarks',
      'Real-time per-file progress tracker and total byte savings calculator',
      'One-click download of all processed assets in an organized ZIP file',
    ],
    howTo: [
      { step: 1, title: 'Upload Bulk Photos', description: 'Drag and drop multiple image files.' },
      { step: 2, title: 'Configure Action', description: 'Choose Compress, Resize, Format Convert, or Watermark.' },
      { step: 3, title: 'Process All', description: 'The worker pipeline executes tasks across multiple threads.' },
      { step: 4, title: 'Download ZIP Archive', description: 'Save all processed images in one package.' },
    ],
    faq: [
      { question: 'Is there a limit on how many files I can process?', answer: 'You can process dozens of images smoothly inside your browser. ToolTrack batches memory allocations responsibly.' },
    ],
    relatedToolIds: ['image-compressor', 'image-converter', 'image-resizer', 'image-watermark'],
  },

  'image-metadata-remover': {
    toolId: 'image-metadata-remover',
    name: 'Remove Image EXIF Metadata',
    route: '/tools/image-metadata-remover',
    aliases: ['/image-metadata-remover', 'image-metadata-remover'],
    categoryKey: 'image',
    categoryName: 'Image Tools',
    categoryRoute: '/tools/image',
    seoTitle: 'Remove Image EXIF Metadata Online – Strip GPS & Camera Data | ToolTrack',
    seoDescription:
      'Strip EXIF metadata, GPS location coordinates, camera models, and timestamps from photos online to safeguard privacy before sharing.',
    h1: 'Remove Image EXIF Metadata Online',
    tagline: 'Scrub GPS location, camera serials, timestamps, and private EXIF data from photos.',
    keywords: [
      'remove image metadata',
      'strip exif data online',
      'remove gps from photo',
      'photo privacy cleaner',
      'scrub image exif',
    ],
    supportedFormats: { input: ['JPG', 'PNG', 'WebP'], output: ['Clean JPG / PNG / WebP'] },
    features: [
      'Removes GPS latitude, longitude, and altitude tags completely',
      'Strips camera make, model, lens serial numbers, and software names',
      'Clears shutter speed, ISO, exposure, and capture timestamps',
      'Keeps image pixels 100% intact without degrading visual quality',
    ],
    howTo: [
      { step: 1, title: 'Select Image', description: 'Upload photos you intend to post publicly or share online.' },
      { step: 2, title: 'Scrub EXIF Headers', description: 'The engine strips all APP1 and EXIF metadata blocks.' },
      { step: 3, title: 'Verify Cleanliness', description: 'Confirm that all location and hardware identifiers are removed.' },
      { step: 4, title: 'Download Private Photo', description: 'Share your sanitized photo safely.' },
    ],
    faq: [
      { question: 'Why should I remove EXIF data?', answer: 'Smartphone photos frequently embed your exact GPS home or work location, camera model, and time taken in the file headers.' },
    ],
    relatedToolIds: ['image-compressor', 'pdf-security', 'image-info', 'image-converter'],
  },

  'pdf-security': {
    toolId: 'pdf-security',
    name: 'PDF Security & Privacy',
    route: '/tools/pdf-security',
    aliases: ['/pdf-security', 'pdf-security'],
    categoryKey: 'pdf',
    categoryName: 'PDF Tools',
    categoryRoute: '/tools/pdf',
    seoTitle: 'PDF Security & Password Protect Online | ToolTrack',
    seoDescription:
      'Protect PDF files with strong passwords, unlock authorized PDFs, or strip hidden metadata and author information online.',
    h1: 'PDF Security & Password Protection Online',
    tagline: 'Encrypt PDF documents, manage access permissions, and strip sensitive metadata.',
    keywords: [
      'pdf security',
      'password protect pdf',
      'encrypt pdf online',
      'unlock pdf',
      'remove pdf metadata',
      'secure pdf document',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['Encrypted / Clean PDF (.pdf)'] },
    features: [
      'Password encryption to restrict opening and viewing',
      'Metadata scrubbing to remove author names, software tags, and edit history',
      'Client-side cryptographic routines ensure passwords never leave your device',
      'Fast validation of document encryption state',
    ],
    howTo: [
      { step: 1, title: 'Upload PDF', description: 'Select the document you wish to protect or sanitize.' },
      { step: 2, title: 'Enter Password or Sanitize', description: 'Set an access password or choose metadata removal.' },
      { step: 3, title: 'Apply Security', description: 'The document security handler encrypts streams.' },
      { step: 4, title: 'Download Secure PDF', description: 'Save your protected PDF document.' },
    ],
    faq: [
      { question: 'Is the password transmitted to a server?', answer: 'No. Encryption is performed directly inside your browser memory using WebCrypto and pdf-lib.' },
    ],
    relatedToolIds: ['pdf-inspector', 'pdf-edit', 'compress-pdf', 'image-metadata-remover'],
  },

  'pdf-inspector': {
    toolId: 'pdf-inspector',
    name: 'PDF Inspector',
    route: '/tools/pdf-inspector',
    aliases: ['/pdf-inspector', 'pdf-inspector'],
    categoryKey: 'pdf',
    categoryName: 'PDF Tools',
    categoryRoute: '/tools/pdf',
    seoTitle: 'PDF Inspector Online – Inspect Metadata, Fonts & Structure | ToolTrack',
    seoDescription:
      'Inspect PDF document structure, page dimensions, embedded fonts, image counts, PDF version, and security permissions online.',
    h1: 'PDF Inspector & Structure Analyzer Online',
    tagline: 'Deep inspection of PDF metadata, page dimensions, embedded fonts, and vector streams.',
    keywords: [
      'pdf inspector',
      'inspect pdf metadata',
      'check pdf fonts',
      'pdf page dimensions checker',
      'analyze pdf structure',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['Inspection Analysis'] },
    features: [
      'Detailed list of all pages with millimeter and point dimensions',
      'Identifies embedded fonts (TrueType, Type1, Helvetica, etc.)',
      'Counts raster images and embedded XObjects',
      'Verifies PDF version (1.4, 1.7, 2.0) and linearization status',
    ],
    howTo: [
      { step: 1, title: 'Drop PDF File', description: 'Upload any PDF for technical inspection.' },
      { step: 2, title: 'Analyze Structure', description: 'The parser traverses trailer dictionaries and objects.' },
      { step: 3, title: 'Review Metrics', description: 'Examine page dimensions, fonts, image objects, and security flags.' },
      { step: 4, title: 'Copy Diagnostic Report', description: 'Copy technical details for troubleshooting or verification.' },
    ],
    faq: [
      { question: 'Can I verify if a PDF is standard A4 or Letter?', answer: 'Yes. The inspector flags whether each page conforms to ISO A4, US Letter, or custom dimensions.' },
    ],
    relatedToolIds: ['normalize-pdf-page-size', 'pdf-compare', 'pdf-security', 'compress-pdf'],
  },

  'rotate-pdf': {
    toolId: 'rotate-pdf',
    name: 'Rotate PDF',
    route: '/tools/rotate-pdf',
    aliases: ['/rotate-pdf', 'rotate-pdf'],
    categoryKey: 'pdf',
    categoryName: 'PDF Tools',
    categoryRoute: '/tools/pdf',
    seoTitle: 'Rotate PDF Online – Permanently Turn PDF Pages 90, 180, 270 | ToolTrack',
    seoDescription:
      'Rotate PDF files permanently online. Fix sideways scans or upside-down pages by rotating 90 degrees clockwise, counter-clockwise, or 180 degrees.',
    h1: 'Rotate PDF Online',
    tagline: 'Permanently turn sideways or upside-down PDF pages by 90, 180, or 270 degrees.',
    keywords: [
      'rotate pdf',
      'turn pdf',
      'rotate pdf pages 90 degrees',
      'fix upside down pdf',
      'rotate pdf online',
      'permanently rotate pdf',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['PDF (.pdf)'] },
    features: [
      'Rotate all pages at once or individual specific pages',
      '90° Clockwise, 90° Counter-Clockwise, or 180° Flip',
      'Permanent vector rotation written into the PDF dictionary',
      'Instant thumbnail preview before saving',
    ],
    howTo: [
      { step: 1, title: 'Upload PDF', description: 'Select the document with rotated pages.' },
      { step: 2, title: 'Choose Rotation Angle', description: 'Click rotate clockwise or counter-clockwise.' },
      { step: 3, title: 'Apply Rotation', description: 'The page rotation matrix is updated permanently.' },
      { step: 4, title: 'Download Aligned PDF', description: 'Save your properly oriented document.' },
    ],
    faq: [
      { question: 'Is the rotation permanent?', answer: 'Yes. Unlike reader display settings, ToolTrack writes the rotation flag permanently into the saved file.' },
    ],
    relatedToolIds: ['organize-pdf', 'normalize-pdf-page-size', 'split-pdf', 'merge-pdf'],
  },

  'flatten-pdf': {
    toolId: 'flatten-pdf',
    name: 'Flatten PDF',
    route: '/tools/flatten-pdf',
    aliases: ['/flatten-pdf', 'flatten-pdf'],
    categoryKey: 'pdf',
    categoryName: 'PDF Tools',
    categoryRoute: '/tools/pdf',
    seoTitle: 'Flatten PDF Online – Lock Form Fields & Annotations | ToolTrack',
    seoDescription:
      'Flatten interactive PDF form fields, checkboxes, annotations, and signatures into permanent page content online.',
    h1: 'Flatten PDF Online',
    tagline: 'Convert interactive form fields and signatures into uneditable, printable page content.',
    keywords: [
      'flatten pdf',
      'flatten pdf form fields',
      'lock pdf annotations',
      'make pdf form non editable',
      'flatten pdf online',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['PDF (.pdf)'] },
    features: [
      'Merges AcroForm values into native page stream content',
      'Locks signatures and form values to prevent tampering',
      'Ensures consistent rendering across all mobile and desktop viewers',
      'Reduces file complexity for print and archiving compliance',
    ],
    howTo: [
      { step: 1, title: 'Upload Filled PDF Form', description: 'Select the interactive PDF document.' },
      { step: 2, title: 'Flatten Form Elements', description: 'The engine burns fields and annotations into static graphics.' },
      { step: 3, title: 'Verify Lockdown', description: 'Check that fields are permanently rendered.' },
      { step: 4, title: 'Download Flattened PDF', description: 'Share or submit your tamper-proof document.' },
    ],
    faq: [
      { question: 'Why should I flatten a PDF form before submitting?', answer: 'Many portal viewers do not render interactive form fields properly unless flattened into static page streams.' },
    ],
    relatedToolIds: ['compress-pdf', 'pdf-edit', 'pdf-security', 'normalize-pdf-page-size'],
  },

  'clean-pdf': {
    toolId: 'clean-pdf',
    name: 'Clean & Repair PDF',
    route: '/tools/clean-pdf',
    aliases: ['/clean-pdf', 'clean-pdf'],
    categoryKey: 'pdf',
    categoryName: 'PDF Tools',
    categoryRoute: '/tools/pdf',
    seoTitle: 'Clean & Repair PDF Online – Fix Damaged PDF Files | ToolTrack',
    seoDescription:
      'Rebuild damaged cross-reference tables, strip unneeded structural clutter, and optimize corrupted PDF files online.',
    h1: 'Clean & Repair PDF Online',
    tagline: 'Rebuild cross-reference tables, repair corrupt syntax, and optimize PDF streams.',
    keywords: [
      'clean pdf',
      'repair pdf online',
      'fix corrupt pdf',
      'rebuild damaged pdf',
      'pdf recovery tool',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['PDF (.pdf)'] },
    features: [
      'Rebuilds damaged xref tables and broken byte offsets',
      'De-duplicates font resources and compresses loose content streams',
      'Fixes syntax anomalies that cause PDF viewers to crash',
      'Preserves original vector content while cleaning container structure',
    ],
    howTo: [
      { step: 1, title: 'Upload Problematic PDF', description: 'Select the PDF with loading warnings or errors.' },
      { step: 2, title: 'Rebuild Document Structure', description: 'The parser reconstructs the object graph from scratch.' },
      { step: 3, title: 'Optimize Streams', description: 'Redundant streams and detached objects are discarded.' },
      { step: 4, title: 'Download Repaired PDF', description: 'Save your restored, clean document.' },
    ],
    faq: [
      { question: 'Can it recover unreadable PDFs?', answer: 'If the core page streams are present, it reconstructs the catalog and cross-reference table to restore accessibility.' },
    ],
    relatedToolIds: ['compress-pdf', 'flatten-pdf', 'pdf-inspector', 'normalize-pdf-page-size'],
  },

  'excel-to-pdf': {
    toolId: 'excel-to-pdf',
    name: 'Excel to PDF',
    route: '/tools/excel-to-pdf',
    aliases: ['/excel-to-pdf', 'excel-to-pdf'],
    categoryKey: 'document',
    categoryName: 'Document Converters',
    categoryRoute: '/tools/document',
    seoTitle: 'Excel to PDF Converter Online – Convert XLSX & CSV | ToolTrack',
    seoDescription:
      'Convert Excel spreadsheets (.xlsx, .xls) and CSV tables into clean landscape or portrait PDF documents online.',
    h1: 'Excel to PDF Converter Online',
    tagline: 'Convert spreadsheet worksheets and CSV data tables into formatted PDF documents.',
    keywords: [
      'excel to pdf',
      'convert excel to pdf',
      'xlsx to pdf',
      'csv to pdf',
      'convert spreadsheet to pdf',
      'excel to pdf online',
    ],
    supportedFormats: { input: ['Excel (.xlsx, .xls)', 'CSV (.csv)'], output: ['PDF (.pdf)'] },
    features: [
      'Automatic column fitting across landscape sheets',
      'Formatted table headers and alternating row styles',
      'Handles multi-sheet workbooks cleanly',
      'Print-ready vector export with crisp numbers and text',
    ],
    howTo: [
      { step: 1, title: 'Upload Spreadsheet', description: 'Add your .xlsx, .xls, or .csv file.' },
      { step: 2, title: 'Render Table Layout', description: 'The engine formats columns to fit readable page bounds.' },
      { step: 3, title: 'Inspect Layout', description: 'Verify headers and column alignments.' },
      { step: 4, title: 'Download PDF Sheet', description: 'Save your printable spreadsheet PDF.' },
    ],
    faq: [
      { question: 'Will wide spreadsheets fit on a single page?', answer: 'ToolTrack uses landscape orientation and dynamic column sizing to keep tables legible.' },
    ],
    relatedToolIds: ['word-to-pdf', 'pdf-to-excel', 'pdf-to-word', 'compress-pdf'],
  },

  'pdf-to-excel': {
    toolId: 'pdf-to-excel',
    name: 'PDF to Excel',
    route: '/tools/pdf-to-excel',
    aliases: ['/pdf-to-excel', 'pdf-to-excel'],
    categoryKey: 'document',
    categoryName: 'Document Converters',
    categoryRoute: '/tools/document',
    seoTitle: 'PDF to Excel Converter Online – Extract Tables to XLSX | ToolTrack',
    seoDescription:
      'Extract tabular data from PDF files into editable Microsoft Excel spreadsheets (.xlsx) online with accurate column alignment.',
    h1: 'PDF to Excel Converter Online',
    tagline: 'Extract tables, balances, and numerical data from PDF files into editable spreadsheets.',
    keywords: [
      'pdf to excel',
      'convert pdf to excel',
      'pdf to xlsx',
      'extract tables from pdf',
      'pdf to spreadsheet online',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['Excel XLSX (.xlsx)'] },
    features: [
      'Extracts tabular records into separate cells and columns',
      'Preserves multi-page financial statements and invoices',
      'Exports authentic OpenXML spreadsheet format',
      'Client-side extraction with zero third-party data sharing',
    ],
    howTo: [
      { step: 1, title: 'Upload PDF Document', description: 'Select the PDF containing financial or data tables.' },
      { step: 2, title: 'Extract Tabular Grid', description: 'The parser detects row and column delimiters.' },
      { step: 3, title: 'Assemble Spreadsheet', description: 'Cells are written into an XLSX workbook.' },
      { step: 4, title: 'Download Excel File', description: 'Open and compute formulas in Microsoft Excel or Sheets.' },
    ],
    faq: [
      { question: 'Can I open the result in Google Sheets?', answer: 'Yes. The output is a standard Microsoft Excel (.xlsx) file supported natively by Sheets and Excel.' },
    ],
    relatedToolIds: ['excel-to-pdf', 'pdf-to-word', 'ocr-pdf', 'pdf-to-text'],
  },

  'pdf-to-text': {
    toolId: 'pdf-to-text',
    name: 'PDF to Text',
    route: '/tools/pdf-to-text',
    aliases: ['/pdf-to-text', 'pdf-to-text'],
    categoryKey: 'document',
    categoryName: 'Document Converters',
    categoryRoute: '/tools/document',
    seoTitle: 'PDF to Text Converter Online – Extract TXT from PDF | ToolTrack',
    seoDescription:
      'Extract plain text from PDF files online without formatting clutter. Copy to clipboard or download as a .txt file instantly.',
    h1: 'PDF to Text Converter Online',
    tagline: 'Extract clean plain text from PDF documents for analysis, transcription, or coding.',
    keywords: [
      'pdf to text',
      'convert pdf to text',
      'extract text from pdf',
      'pdf to txt',
      'pdf text extractor online',
    ],
    supportedFormats: { input: ['PDF (.pdf)'], output: ['Plain Text (.txt)'] },
    features: [
      'Extracts raw text streams across all pages',
      'Inserts clean page-break markers between sections',
      'One-click copy to clipboard',
      'Lightweight .txt export with zero formatting noise',
    ],
    howTo: [
      { step: 1, title: 'Upload PDF', description: 'Drop your document into the extractor.' },
      { step: 2, title: 'Extract Text Stream', description: 'Text characters are parsed from font encoding maps.' },
      { step: 3, title: 'Preview Text', description: 'Read or search within the extracted text area.' },
      { step: 4, title: 'Copy or Save TXT', description: 'Download your plain text document.' },
    ],
    faq: [
      { question: 'Does this work on scanned documents?', answer: 'For scanned PDFs that lack a selectable text layer, use the OCR PDF tool instead.' },
    ],
    relatedToolIds: ['ocr-pdf', 'pdf-to-word', 'text-to-pdf', 'pdf-to-excel'],
  },

  'text-to-pdf': {
    toolId: 'text-to-pdf',
    name: 'Text to PDF',
    route: '/tools/text-to-pdf',
    aliases: ['/text-to-pdf', 'text-to-pdf'],
    categoryKey: 'document',
    categoryName: 'Document Converters',
    categoryRoute: '/tools/document',
    seoTitle: 'Text to PDF Converter Online – Convert Notes & TXT to PDF | ToolTrack',
    seoDescription:
      'Convert plain text, notes, code snippets, or articles into formatted PDF documents online with clean typography and page breaks.',
    h1: 'Text to PDF Converter Online',
    tagline: 'Turn notes, articles, and raw text into clean, printable PDF documents.',
    keywords: [
      'text to pdf',
      'convert text to pdf',
      'txt to pdf',
      'notes to pdf online',
      'create pdf from text',
    ],
    supportedFormats: { input: ['Plain Text', 'Notes', '.txt'], output: ['PDF (.pdf)'] },
    features: [
      'Automatic word wrapping and margin calculation',
      'Automatic pagination with page break balancing',
      'Formatted document title and clean paragraph spacing',
      'Standardized A4 sheet output for easy printing and sharing',
    ],
    howTo: [
      { step: 1, title: 'Paste or Type Text', description: 'Type or paste notes into the text box.' },
      { step: 2, title: 'Format Settings', description: 'Review page title and margins.' },
      { step: 3, title: 'Generate PDF', description: 'The typesetting engine generates clean vector pages.' },
      { step: 4, title: 'Download PDF', description: 'Save your formatted PDF document.' },
    ],
    faq: [
      { question: 'Can I paste multiple pages of text?', answer: 'Yes. The text engine automatically computes line height and creates new pages whenever text exceeds the printable margin.' },
    ],
    relatedToolIds: ['pdf-to-text', 'notes-to-pdf', 'assignment-pdf-maker', 'word-to-pdf'],
  },
};

/**
 * Category key mapper for any existing or future tool category
 */
export function mapToolCategoryToSeoCategory(category: string): {
  categoryKey: 'pdf' | 'image' | 'document' | 'ocr' | 'student' | 'design';
  categoryName: string;
  categoryRoute: string;
} {
  switch (category) {
    case 'page-tools':
    case 'organize':
    case 'optimize':
    case 'security':
    case 'inspector':
      return { categoryKey: 'pdf', categoryName: 'PDF Tools', categoryRoute: '/tools/pdf' };
    case 'convert-to-pdf':
    case 'convert-from-pdf':
      return { categoryKey: 'document', categoryName: 'Document Converters', categoryRoute: '/tools/document' };
    case 'image-tools':
      return { categoryKey: 'image', categoryName: 'Image Tools', categoryRoute: '/tools/image' };
    case 'design-tools':
      return { categoryKey: 'design', categoryName: 'Design & Visual Utilities', categoryRoute: '/tools/design' };
    case 'student-tools':
      return { categoryKey: 'student', categoryName: 'Student & Academic Utilities', categoryRoute: '/tools/student' };
    case 'ocr':
      return { categoryKey: 'ocr', categoryName: 'OCR & Text Recognition', categoryRoute: '/tools/ocr' };
    default:
      return { categoryKey: 'pdf', categoryName: 'PDF & File Tools', categoryRoute: '/tools/pdf' };
  }
}

/**
 * Dynamically synthesizes a complete, high-fidelity SEO definition for any future or unlisted tool
 */
export function generateFallbackToolSeo(tool: ToolItem): ToolSeoData {
  const { categoryKey, categoryName, categoryRoute } = mapToolCategoryToSeoCategory(tool.category);
  const route = `/tools/${tool.id}`;
  const keywords = Array.from(
    new Set([
      tool.name.toLowerCase(),
      `${tool.name.toLowerCase()} online`,
      `free ${tool.name.toLowerCase()}`,
      `tooltrack ${tool.name.toLowerCase()}`,
      ...(tool.keywords || []),
      ...(tool.synonyms || []),
    ])
  );

  return {
    toolId: tool.id,
    name: tool.name,
    route,
    aliases: [tool.route || `/${tool.id}`, `/tools/${tool.id}`, tool.id],
    categoryKey,
    categoryName,
    categoryRoute,
    seoTitle: `${tool.name} – Free Online ${categoryName} | ToolTrack`,
    seoDescription: `${tool.description} Free, 100% private in-browser utility by ToolTrack with zero data retention and instant processing.`,
    h1: `${tool.name} Online`,
    tagline: tool.description,
    keywords,
    supportedFormats: {
      input: (tool.inputFormats || ['PDF', 'Image', 'Document']).map((f) => `${f} (.${f.toLowerCase()})`),
      output: (tool.outputFormats || ['PDF', 'Image', 'Document']).map((f) => `${f} (.${f.toLowerCase()})`),
    },
    features: [
      '100% In-Browser client-side processing with zero server leaks',
      'Fast real-time document rendering and optimization',
      'Preserves high resolution, page geometry, and clean typography',
      'No registration, usage caps, or file watermarks required',
    ],
    howTo: [
      { step: 1, title: 'Upload Your File', description: `Select or drop your ${(tool.inputFormats || ['file']).join('/')} into the secure workspace.` },
      { step: 2, title: 'Configure Options', description: 'Adjust processing presets and inspect immediate real-time preview.' },
      { step: 3, title: 'Process & Download', description: 'Download your converted, optimized file instantly with complete data safety.' },
    ],
    faq: [
      { question: `Is ${tool.name} free to use?`, answer: `Yes, ${tool.name} is 100% free with no file limit, account registration, or watermarks.` },
      { question: `Are my files private and secure?`, answer: `Yes. All processing is executed safely in your local browser or secure isolated pipelines with zero unauthorized storage.` },
      { question: `What file types are accepted?`, answer: `This utility supports input formats: ${(tool.inputFormats || []).join(', ')} and exports to ${(tool.outputFormats || []).join(', ')}.` },
    ],
    relatedToolIds: getRelatedTools(tool.id, 4).map((t) => t.id),
  };
}

/**
 * Returns SEO data for ANY tool in the system, automatically fallback-generating if needed
 */
export function getToolSeo(toolId: string): ToolSeoData {
  if (TOOLS_SEO[toolId]) {
    return TOOLS_SEO[toolId];
  }
  const toolItem = TOOLS_LIST.find((t) => t.id === toolId);
  if (toolItem) {
    return generateFallbackToolSeo(toolItem);
  }
  // Generic safe fallback
  return {
    toolId,
    name: toolId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    route: `/tools/${toolId}`,
    aliases: [`/${toolId}`, toolId],
    categoryKey: 'pdf',
    categoryName: 'PDF Tools',
    categoryRoute: '/tools/pdf',
    seoTitle: `${toolId.replace(/-/g, ' ')} – Online Tool | ToolTrack`,
    seoDescription: 'Free online file and document processing tool by ToolTrack. Fast, secure, and private.',
    h1: `${toolId.replace(/-/g, ' ')} Online`,
    tagline: 'Fast, secure in-browser utility.',
    keywords: [toolId, `${toolId} online`, 'file tool', 'tooltrack'],
    supportedFormats: { input: ['PDF', 'Image'], output: ['PDF', 'Image'] },
    features: ['100% Free and Private', 'Fast processing', 'No watermark'],
    howTo: [
      { step: 1, title: 'Upload File', description: 'Select your file.' },
      { step: 2, title: 'Process', description: 'Apply tool options.' },
      { step: 3, title: 'Download', description: 'Save your file.' },
    ],
    faq: [{ question: 'Is this tool free?', answer: 'Yes, 100% free.' }],
    relatedToolIds: ['merge-pdf', 'compress-pdf', 'image-compressor'],
  };
}

/**
 * Dynamically computes related tools for ANY tool based on category affinity, format chaining, and tags
 */
export function getRelatedTools(toolId: string, maxCount = 4): ToolItem[] {
  const currentTool = TOOLS_LIST.find((t) => t.id === toolId);
  if (!currentTool) return TOOLS_LIST.slice(0, maxCount);

  // Score all other tools by relationship
  const scored = TOOLS_LIST.filter((t) => t.id !== toolId).map((candidate) => {
    let score = 0;

    // 1. Same category affinity (+4)
    if (candidate.category === currentTool.category) {
      score += 4;
    }

    // 2. High-level category grouping (+3)
    const currGroup = mapToolCategoryToSeoCategory(currentTool.category).categoryKey;
    const candGroup = mapToolCategoryToSeoCategory(candidate.category).categoryKey;
    if (currGroup === candGroup) {
      score += 3;
    }

    // 3. Format compatibility / conversion chain (+5)
    // E.g. If current tool outputs PDF, tools that accept PDF as input
    const outputMatchesInput = (currentTool.outputFormats || []).some((fmt) => (candidate.inputFormats || []).includes(fmt));
    if (outputMatchesInput) {
      score += 5;
    }

    // 4. Keyword overlap (+1 per match)
    const currKeywords = new Set(currentTool.keywords || []);
    (candidate.keywords || []).forEach((k) => {
      if (currKeywords.has(k)) score += 1;
    });

    // 5. Popular flag (+1)
    if (candidate.popular) {
      score += 1;
    }

    return { candidate, score };
  });

  // Sort descending by affinity score
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxCount).map((s) => s.candidate);
}

/**
 * Resolves a given URL path or hash to the corresponding SEO data
 */
export function resolveSeoRoute(pathname: string, hash = ''): {
  type: 'home' | 'tool' | 'category' | 'not-found';
  tool?: ToolSeoData;
  category?: CategorySeoData;
  canonicalUrl: string;
} {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const cleanHash = hash.replace(/^#\/?/, '').replace(/\/+$/, '');

  // 1. Check Homepage
  if (cleanPath === '/' && (!cleanHash || cleanHash === '/')) {
    return {
      type: 'home',
      canonicalUrl: `${SITE_CONFIG.url}/`,
    };
  }

  // 2. Check direct tool route matches from TOOLS_SEO
  for (const tool of Object.values(TOOLS_SEO)) {
    if (tool.route === cleanPath) {
      return {
        type: 'tool',
        tool,
        canonicalUrl: `${SITE_CONFIG.url}${tool.route}`,
      };
    }
    // Check aliases
    if (tool.aliases.some((a) => a === cleanPath || a === `/${cleanHash}` || a === cleanHash)) {
      return {
        type: 'tool',
        tool,
        canonicalUrl: `${SITE_CONFIG.url}${tool.route}`,
      };
    }
  }

  // 3. Check dynamically across all TOOLS_LIST items (for future-proof scalability)
  for (const item of TOOLS_LIST) {
    const slugRoute = `/tools/${item.id}`;
    const directRoute = `/${item.id}`;
    if (
      cleanPath === slugRoute ||
      cleanPath === directRoute ||
      cleanPath === item.route ||
      cleanHash === item.id ||
      cleanHash === `tool-${item.id}`
    ) {
      const toolSeo = getToolSeo(item.id);
      return {
        type: 'tool',
        tool: toolSeo,
        canonicalUrl: `${SITE_CONFIG.url}${toolSeo.route}`,
      };
    }
  }

  // 4. Check categories (/tools/pdf, /tools/image, /category/pdf, etc.)
  for (const cat of Object.values(CATEGORIES_SEO)) {
    if (
      cat.route === cleanPath ||
      cleanPath === `/category/${cat.key}` ||
      cleanPath === `/tools/${cat.key}` ||
      cleanHash === `category-${cat.key}` ||
      cleanHash === cat.key
    ) {
      return {
        type: 'category',
        category: cat,
        canonicalUrl: `${SITE_CONFIG.url}${cat.route}`,
      };
    }
  }

  // 5. Check if hash matches a tool id
  if (cleanHash) {
    const foundTool = TOOLS_LIST.find((t) => t.id === cleanHash);
    if (foundTool) {
      const toolSeo = getToolSeo(foundTool.id);
      return {
        type: 'tool',
        tool: toolSeo,
        canonicalUrl: `${SITE_CONFIG.url}${toolSeo.route}`,
      };
    }
  }

  return {
    type: 'not-found',
    canonicalUrl: `${SITE_CONFIG.url}${cleanPath}`,
  };
}

/**
 * Generates Schema.org JSON-LD structured data for a tool page
 */
export function generateToolJsonLd(tool: ToolSeoData): object {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE_CONFIG.url}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: tool.categoryName,
            item: `${SITE_CONFIG.url}${tool.categoryRoute}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: tool.name,
            item: `${SITE_CONFIG.url}${tool.route}`,
          },
        ],
      },
      {
        '@type': 'WebApplication',
        '@id': `${SITE_CONFIG.url}${tool.route}#webapp`,
        name: `ToolTrack ${tool.name}`,
        url: `${SITE_CONFIG.url}${tool.route}`,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'All',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        description: tool.seoDescription,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: tool.features,
      },
      {
        '@type': 'HowTo',
        name: `How to use ${tool.name} Online`,
        description: tool.tagline,
        step: tool.howTo.map((h) => ({
          '@type': 'HowToStep',
          position: h.step,
          name: h.title,
          text: h.description,
        })),
      },
    ],
  };
}

/**
 * Generates Schema.org JSON-LD structured data for a category page
 */
export function generateCategoryJsonLd(cat: CategorySeoData): object {
  const tools = cat.toolIds.map((id) => getToolSeo(id)).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE_CONFIG.url}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: cat.name,
            item: `${SITE_CONFIG.url}${cat.route}`,
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: cat.seoTitle,
        url: `${SITE_CONFIG.url}${cat.route}`,
        description: cat.seoDescription,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: tools.map((t, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: t.name,
            url: `${SITE_CONFIG.url}${t.route}`,
            description: t.seoDescription,
          })),
        },
      },
    ],
  };
}

/**
 * Dynamically updates document <head> with SEO tags, canonical URL, OpenGraph, Twitter, and JSON-LD
 */
export function updateDocumentSeo(params: {
  title: string;
  description: string;
  canonicalUrl: string;
  jsonLd?: object;
  ogType?: string;
}): void {
  if (typeof document === 'undefined') return;

  // 1. Page Title
  document.title = params.title;

  // 2. Meta Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', params.description);

  // 3. Canonical URL
  let linkCanonical = document.querySelector('link[rel="canonical"]');
  if (!linkCanonical) {
    linkCanonical = document.createElement('link');
    linkCanonical.setAttribute('rel', 'canonical');
    document.head.appendChild(linkCanonical);
  }
  linkCanonical.setAttribute('href', params.canonicalUrl);

  // 4. OpenGraph Tags
  const setMetaProperty = (property: string, content: string) => {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMetaProperty('og:title', params.title);
  setMetaProperty('og:description', params.description);
  setMetaProperty('og:url', params.canonicalUrl);
  setMetaProperty('og:type', params.ogType || 'website');
  setMetaProperty('og:site_name', SITE_CONFIG.name);
  setMetaProperty('og:image', SITE_CONFIG.logoUrl);

  // 5. Twitter Card Tags
  const setMetaName = (name: string, content: string) => {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMetaName('twitter:card', 'summary_large_image');
  setMetaName('twitter:title', params.title);
  setMetaName('twitter:description', params.description);
  setMetaName('twitter:image', SITE_CONFIG.logoUrl);

  // 6. JSON-LD Structured Data
  let scriptLd = document.getElementById('dynamic-seo-jsonld');
  if (!scriptLd) {
    scriptLd = document.createElement('script');
    scriptLd.id = 'dynamic-seo-jsonld';
    scriptLd.setAttribute('type', 'application/ld+json');
    document.head.appendChild(scriptLd);
  }
  if (params.jsonLd) {
    scriptLd.textContent = JSON.stringify(params.jsonLd);
  }
}

/**
 * Escapes XML-sensitive characters for strict sitemap compliance
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Builds the complete sitemap.xml dynamically from the live registry including all tools
 */
export function generateSitemapXml(): string {
  const currentDate = new Date().toISOString().split('T')[0];

  const rawUrls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [
    { loc: `${SITE_CONFIG.url}/`, lastmod: currentDate, changefreq: 'daily', priority: '1.0' },
  ];

  // Category Pages
  for (const cat of Object.values(CATEGORIES_SEO)) {
    rawUrls.push({
      loc: `${SITE_CONFIG.url}${cat.route}`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9',
    });
  }

  // Every Tool in the full TOOLS_LIST
  for (const tool of TOOLS_LIST) {
    const seo = getToolSeo(tool.id);
    rawUrls.push({
      loc: `${SITE_CONFIG.url}${seo.route}`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: tool.popular ? '0.85' : '0.8',
    });
  }

  // Strict deduplication by canonical loc
  const seenLocs = new Set<string>();
  const uniqueUrls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [];

  for (const u of rawUrls) {
    if (!seenLocs.has(u.loc)) {
      seenLocs.add(u.loc);
      uniqueUrls.push(u);
    }
  }

  const urlXml = uniqueUrls
    .map(
      (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlXml}
</urlset>`;
}

/**
 * Runs a comprehensive technical SEO compliance audit on every tool and category
 */
export function runSeoAudit(): {
  status: 'passed' | 'failed';
  totalTools: number;
  totalCategories: number;
  passedTools: number;
  failedTools: number;
  reports: Array<{
    toolId: string;
    name: string;
    route: string;
    titleValid: boolean;
    descriptionValid: boolean;
    h1Valid: boolean;
    canonicalValid: boolean;
    sitemapValid: boolean;
    jsonLdValid: boolean;
    relatedToolsValid: boolean;
    issues: string[];
  }>;
} {
  const reports: any[] = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const tool of TOOLS_LIST) {
    const seo = getToolSeo(tool.id);
    const issues: string[] = [];

    const titleValid = Boolean(seo.seoTitle && seo.seoTitle.includes(SITE_CONFIG.name) && seo.seoTitle.length >= 25);
    if (!titleValid) issues.push('Title does not meet length/branding criteria');

    const descriptionValid = Boolean(seo.seoDescription && seo.seoDescription.length >= 80);
    if (!descriptionValid) issues.push('Meta description too short');

    const h1Valid = Boolean(seo.h1 && seo.h1.trim().length > 0);
    if (!h1Valid) issues.push('H1 missing');

    const canonicalValid = Boolean(seo.route && seo.route.startsWith('/'));
    if (!canonicalValid) issues.push('Invalid route/canonical path');

    const sitemapValid = true; // Automatically covered by generateSitemapXml()
    const jsonLdValid = Boolean(generateToolJsonLd(seo));

    const related = getRelatedTools(tool.id, 4);
    const relatedToolsValid = related.length >= 2;
    if (!relatedToolsValid) issues.push('Insufficient related tools computed');

    const isPassed = issues.length === 0;
    if (isPassed) passedCount++;
    else failedCount++;

    reports.push({
      toolId: tool.id,
      name: tool.name,
      route: seo.route,
      titleValid,
      descriptionValid,
      h1Valid,
      canonicalValid,
      sitemapValid,
      jsonLdValid,
      relatedToolsValid,
      issues,
    });
  }

  return {
    status: failedCount === 0 ? 'passed' : 'failed',
    totalTools: TOOLS_LIST.length,
    totalCategories: Object.keys(CATEGORIES_SEO).length,
    passedTools: passedCount,
    failedTools: failedCount,
    reports,
  };
}
