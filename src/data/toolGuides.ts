export interface ToolGuideData {
  howItWorks: {
    step: number;
    title: string;
    description: string;
  }[];
  specs: {
    supportedFormats: string;
    outputFormat: string;
    maxLimit: string;
    processingType: string;
    privacyNote: string;
  };
  goodToKnow: string[];
  relatedToolIds: string[];
}

export const TOOL_GUIDES: Record<string, ToolGuideData> = {
  'normalize-pdf-page-size': {
    howItWorks: [
      { step: 1, title: 'Upload PDF', description: 'Select or drag & drop any PDF with mixed or irregular page sizes.' },
      { step: 2, title: 'Choose Target Standard', description: 'Pick your desired standard (A4, US Letter, Legal, A3) and fit/fill orientation.' },
      { step: 3, title: 'Inspect & Standardize', description: 'The local engine rescales pages proportionally without clipping or vector distortion.' },
      { step: 4, title: 'Download Unified PDF', description: 'Save your clean, uniform PDF ready for printing, submission, or archiving.' },
    ],
    specs: {
      supportedFormats: 'PDF (.pdf)',
      outputFormat: 'Standardized PDF (.pdf)',
      maxLimit: 'Up to 100MB per file',
      processingType: 'In-Browser WebAssembly (PDF-Lib vector engine)',
      privacyNote: '100% Client-Side. Files remain exclusively inside local browser memory.',
    },
    goodToKnow: [
      'Proportional scaling preserves original margins and vector typography without stretching text.',
      'Auto-rotation aligns landscape scans with portrait documents automatically when selected.',
      'Ideal for academic assignments, legal filings, and print-ready bundles with mixed scan dimensions.',
    ],
    relatedToolIds: ['organize-pdf', 'merge-pdf', 'compress-pdf', 'pdf-edit'],
  },

  'merge-pdf': {
    howItWorks: [
      { step: 1, title: 'Add Multiple PDFs', description: 'Upload two or more PDF files from your device.' },
      { step: 2, title: 'Reorder Files', description: 'Drag or use arrow controls to arrange documents into your preferred sequence.' },
      { step: 3, title: 'Merge Documents', description: 'The engine combines all page streams into one consolidated PDF.' },
      { step: 4, title: 'Download Result', description: 'Instantly download your unified multi-page PDF document.' },
    ],
    specs: {
      supportedFormats: 'PDF (.pdf)',
      outputFormat: 'Merged PDF (.pdf)',
      maxLimit: 'Up to 20 files / 100MB total',
      processingType: 'Client-Side PDF Byte Stream Concatenation',
      privacyNote: 'Local in-memory assembly. Zero server file uploads.',
    },
    goodToKnow: [
      'Original bookmarks and internal page references are cleanly reconciled.',
      'Combine assignments, receipts, report chapters, and contracts into a single deliverable.',
    ],
    relatedToolIds: ['split-pdf', 'organize-pdf', 'normalize-pdf-page-size', 'compress-pdf'],
  },

  'split-pdf': {
    howItWorks: [
      { step: 1, title: 'Upload Document', description: 'Drop the PDF file you want to split or extract pages from.' },
      { step: 2, title: 'Select Range or Mode', description: 'Extract custom page ranges (e.g. 1-3, 5) or split every single page.' },
      { step: 3, title: 'Extract Pages', description: 'The client-side engine isolates selected page objects.' },
      { step: 4, title: 'Download Files', description: 'Save as individual PDF files or download a consolidated ZIP package.' },
    ],
    specs: {
      supportedFormats: 'PDF (.pdf)',
      outputFormat: 'PDF (.pdf) or ZIP archive',
      maxLimit: 'Up to 100MB per file',
      processingType: 'In-Browser PDF Sub-stream Extractor',
      privacyNote: 'Processed entirely in ephemeral browser memory.',
    },
    goodToKnow: [
      'Custom range syntax supports commas and dashes (e.g. "1, 3-5, 8-10").',
      'Extracted pages retain 100% of their original vector quality, embedded images, and fonts.',
    ],
    relatedToolIds: ['merge-pdf', 'organize-pdf', 'compress-pdf', 'pdf-to-word'],
  },

  'organize-pdf': {
    howItWorks: [
      { step: 1, title: 'Upload PDF', description: 'Load your multi-page PDF document.' },
      { step: 2, title: 'Arrange Visually', description: 'Drag to reorder thumbnails, rotate individual pages, duplicate, or delete unwanted sheets.' },
      { step: 3, title: 'Apply Changes', description: 'The engine rebuilds the PDF page hierarchy.' },
      { step: 4, title: 'Save Organized PDF', description: 'Download your finalized, cleaned-up document.' },
    ],
    specs: {
      supportedFormats: 'PDF (.pdf)',
      outputFormat: 'Reorganized PDF (.pdf)',
      maxLimit: 'Up to 100MB / 200 pages',
      processingType: 'Client-Side PDF-Lib Tree Mutation',
      privacyNote: 'Zero cloud interaction. Runs 100% locally.',
    },
    goodToKnow: [
      'Rotated pages retain permanent orientation flags in the output PDF metadata.',
      'You can insert blank note pages or duplicate key sheets directly within the canvas.',
    ],
    relatedToolIds: ['normalize-pdf-page-size', 'merge-pdf', 'split-pdf', 'pdf-edit'],
  },

  'rotate-pdf': {
    howItWorks: [
      { step: 1, title: 'Upload PDF', description: 'Select the PDF with incorrect page orientations.' },
      { step: 2, title: 'Choose Rotation Angle', description: 'Rotate all pages or specific pages by 90°, 180°, or 270° clockwise.' },
      { step: 3, title: 'Re-encode Orientation', description: 'The engine updates page dictionary rotation entries.' },
      { step: 4, title: 'Download PDF', description: 'Download your correctly oriented PDF document.' },
    ],
    specs: {
      supportedFormats: 'PDF (.pdf)',
      outputFormat: 'Rotated PDF (.pdf)',
      maxLimit: 'Up to 100MB per file',
      processingType: 'In-Browser PDF Matrix Transformation',
      privacyNote: 'Processed locally in browser memory.',
    },
    goodToKnow: [
      'Rotation preserves all vector text and annotations without rasterizing pages.',
    ],
    relatedToolIds: ['organize-pdf', 'normalize-pdf-page-size', 'pdf-edit'],
  },

  'compress-pdf': {
    howItWorks: [
      { step: 1, title: 'Upload File', description: 'Drop your PDF file needing size reduction.' },
      { step: 2, title: 'Choose Preset', description: 'Select between Balanced (recommended), Extreme, or Light compression.' },
      { step: 3, title: 'Optimize Streams', description: 'The engine strips redundant objects and optimizes internal assets.' },
      { step: 4, title: 'Download Smaller PDF', description: 'View file size savings percentage and download your optimized document.' },
    ],
    specs: {
      supportedFormats: 'PDF (.pdf)',
      outputFormat: 'Compressed PDF (.pdf)',
      maxLimit: 'Up to 100MB per file',
      processingType: 'In-Browser Stream Compression & Font Optimization',
      privacyNote: '100% In-Browser. No document data leaves your device.',
    },
    goodToKnow: [
      'Vector typography and mathematical equations remain razor sharp across all presets.',
      'Unreferenced fonts and metadata bloat are automatically pruned to minimize footprint.',
    ],
    relatedToolIds: ['pdf-submission-compressor', 'image-compressor', 'pdf-to-word', 'flatten-pdf'],
  },

  'pdf-to-word': {
    howItWorks: [
      { step: 1, title: 'Upload PDF', description: 'Select the PDF document you want to edit in Microsoft Word.' },
      { step: 2, title: 'Analyze Geometry', description: 'The engine detects headings, multi-column blocks, callouts, and table cells.' },
      { step: 3, title: 'Generate DOCX', description: 'Structured OpenXML elements are built while preserving vector diagrams.' },
      { step: 4, title: 'Download Word File', description: 'Download the editable .docx file ready for Microsoft Word or Google Docs.' },
    ],
    specs: {
      supportedFormats: 'PDF (.pdf)',
      outputFormat: 'Microsoft Word Document (.docx)',
      maxLimit: 'Up to 50MB per file',
      processingType: 'High-Fidelity Layout-Aware OpenXML Generator',
      privacyNote: 'Processed securely in-browser with zero cloud logging.',
    },
    goodToKnow: [
      'Complex PDFs containing scanned text without embedded fonts benefit from running PDF OCR first.',
      'Multi-column tables and question boxes are reconstructed as native editable Word components.',
    ],
    relatedToolIds: ['word-to-pdf', 'ocr-pdf', 'pdf-to-excel', 'pdf-to-images'],
  },

  'word-to-pdf': {
    howItWorks: [
      { step: 1, title: 'Select Word File', description: 'Upload your .docx or .doc file.' },
      { step: 2, title: 'Parse Document', description: 'Document formatting, styles, headings, and images are processed.' },
      { step: 3, title: 'Render to PDF', description: 'High-resolution vector layout is rendered into a standard PDF structure.' },
      { step: 4, title: 'Download PDF', description: 'Save your print-ready, cross-platform PDF.' },
    ],
    specs: {
      supportedFormats: 'Microsoft Word (.docx, .doc)',
      outputFormat: 'PDF Document (.pdf)',
      maxLimit: 'Up to 50MB per file',
      processingType: 'Client-Side Document Parser & PDF Renderer',
      privacyNote: '100% Private local execution.',
    },
    goodToKnow: [
      'Standard fonts (Calibri, Arial, Times New Roman, Plus Jakarta Sans) render with exact styling.',
    ],
    relatedToolIds: ['pdf-to-word', 'images-to-pdf', 'excel-to-pdf', 'normalize-pdf-page-size'],
  },

  'images-to-pdf': {
    howItWorks: [
      { step: 1, title: 'Select Images', description: 'Upload one or multiple JPG, PNG, WEBP, or GIF images.' },
      { step: 2, title: 'Configure Page Layout', description: 'Adjust page orientation, margins, and target paper size (A4, Letter, Auto-Fit).' },
      { step: 3, title: 'Compile PDF', description: 'Images are placed onto uniform vector pages.' },
      { step: 4, title: 'Download PDF', description: 'Download your assembled multi-page PDF.' },
    ],
    specs: {
      supportedFormats: 'JPG, PNG, WEBP, GIF, BMP',
      outputFormat: 'PDF Document (.pdf)',
      maxLimit: 'Up to 50 images per session',
      processingType: 'High-Resolution Canvas & PDF-Lib Assembly',
      privacyNote: 'Zero server uploads. Processed locally.',
    },
    goodToKnow: [
      'Great for compiling photos of written notes, homework sheets, whiteboard snapshots, and receipts.',
    ],
    relatedToolIds: ['pdf-to-images', 'notes-to-pdf', 'assignment-pdf-maker', 'image-compressor'],
  },

  'pdf-to-images': {
    howItWorks: [
      { step: 1, title: 'Upload PDF', description: 'Select the PDF document to extract pages as images.' },
      { step: 2, title: 'Choose Format & DPI', description: 'Select JPG, PNG, or WEBP at standard (150 DPI) or high resolution (300 DPI).' },
      { step: 3, title: 'Render Page Canvases', description: 'Each page is rendered at high pixel fidelity.' },
      { step: 4, title: 'Download Images', description: 'Download individual images or a single ZIP containing all pages.' },
    ],
    specs: {
      supportedFormats: 'PDF (.pdf)',
      outputFormat: 'PNG, JPG, WEBP, or ZIP archive',
      maxLimit: 'Up to 100MB per file',
      processingType: 'High-DPI PDF.js Canvas Rendering Engine',
      privacyNote: 'Local browser canvas rendering.',
    },
    goodToKnow: [
      'Choose PNG for diagrams and text clarity; choose JPG/WEBP for smaller image file sizes.',
    ],
    relatedToolIds: ['images-to-pdf', 'pdf-to-word', 'pdf-to-excel', 'image-converter'],
  },

  'excel-to-pdf': {
    howItWorks: [
      { step: 1, title: 'Upload Spreadsheet', description: 'Select your Excel workbook (.xlsx, .xls, .csv).' },
      { step: 2, title: 'Select Sheet & Fit', description: 'Preview table gridlines, column widths, and fit-to-page options.' },
      { step: 3, title: 'Generate PDF Table', description: 'Structured tabular data is converted into clean vector PDF pages.' },
      { step: 4, title: 'Download PDF', description: 'Save your print-ready spreadsheet document.' },
    ],
    specs: {
      supportedFormats: 'Excel (.xlsx, .xls, .csv)',
      outputFormat: 'PDF Document (.pdf)',
      maxLimit: 'Up to 25MB per file',
      processingType: 'SheetJS In-Memory Parser & PDF Table Builder',
      privacyNote: 'Local spreadsheet processing.',
    },
    goodToKnow: [
      'Supports formulas, numeric formatting, multi-sheet workbooks, and custom table headers.',
    ],
    relatedToolIds: ['pdf-to-excel', 'word-to-pdf', 'normalize-pdf-page-size'],
  },

  'pdf-to-excel': {
    howItWorks: [
      { step: 1, title: 'Upload PDF', description: 'Select a PDF containing financial reports, schedules, or data tables.' },
      { step: 2, title: 'Detect Table Grid', description: 'The layout engine detects cell boundaries and column alignments.' },
      { step: 3, title: 'Extract Tabular Data', description: 'Rows and columns are mapped into standard Excel cells.' },
      { step: 4, title: 'Download Spreadsheet', description: 'Download the editable .xlsx workbook.' },
    ],
    specs: {
      supportedFormats: 'PDF (.pdf)',
      outputFormat: 'Microsoft Excel (.xlsx)',
      maxLimit: 'Up to 50MB per file',
      processingType: 'Spatial Boundary Table Detection Engine',
      privacyNote: 'Zero server logging. 100% Client-Side.',
    },
    goodToKnow: [
      'Works best on digitally generated PDFs with clear table columns and row borders.',
    ],
    relatedToolIds: ['excel-to-pdf', 'pdf-to-word', 'ocr-pdf'],
  },

  'image-background-remover': {
    howItWorks: [
      { step: 1, title: 'Upload Photo', description: 'Drop any photo with people, products, animals, or objects.' },
      { step: 2, title: 'Neural Segmentation', description: 'The AI segmentation model isolates the primary foreground subject.' },
      { step: 3, title: 'Refine & Inspect', description: 'Preview side-by-side or use the split slider to verify edge transparency.' },
      { step: 4, title: 'Download Transparent PNG', description: 'Save your clean cutout with alpha channel transparency.' },
    ],
    specs: {
      supportedFormats: 'PNG, JPG, JPEG, WEBP',
      outputFormat: 'Transparent PNG (.png)',
      maxLimit: 'Up to 25MB per image',
      processingType: 'Neural Matting Engine (WebGPU/Wasm accelerated)',
      privacyNote: 'Ephemeral in-browser processing. Zero photo retention.',
    },
    goodToKnow: [
      'High-contrast photos with distinct subject boundaries yield the cleanest edges.',
      'Output is saved as an RGBA PNG with real 8-bit alpha transparency.',
    ],
    relatedToolIds: ['image-compressor', 'image-converter', 'image-resizer', 'image-background-changer'],
  },

  'image-compressor': {
    howItWorks: [
      { step: 1, title: 'Upload Images', description: 'Select one or more JPG, PNG, or WEBP images.' },
      { step: 2, title: 'Adjust Quality Slider', description: 'Select visual quality level and preview real-time file size savings.' },
      { step: 3, title: 'Compress', description: 'Canvas quantizers optimize pixel data and strip unnecessary EXIF metadata.' },
      { step: 4, title: 'Download Compressed Files', description: 'Save individual files or a combined ZIP archive.' },
    ],
    specs: {
      supportedFormats: 'JPG, JPEG, PNG, WEBP',
      outputFormat: 'Optimized JPG, PNG, WEBP, or ZIP',
      maxLimit: 'Up to 30 images per batch / 25MB per file',
      processingType: 'Client-Side Canvas Lossy/Lossless Quantizer',
      privacyNote: 'Processed locally in your browser.',
    },
    goodToKnow: [
      'PNG compression uses smart color indexing; JPG compression uses discrete cosine transform optimization.',
      'Achieve 40% to 80% size reduction with negligible visual difference.',
    ],
    relatedToolIds: ['image-resizer', 'image-converter', 'image-background-remover', 'compress-pdf'],
  },

  'image-resizer': {
    howItWorks: [
      { step: 1, title: 'Upload Image', description: 'Select the image you want to resize.' },
      { step: 2, title: 'Set Dimensions', description: 'Enter target pixel dimensions, percentage, or pick social media presets.' },
      { step: 3, title: 'Maintain Aspect Ratio', description: 'Lock aspect ratio to prevent stretching or choose custom crop bounds.' },
      { step: 4, title: 'Download Resized Image', description: 'Download your crisp resized image file.' },
    ],
    specs: {
      supportedFormats: 'PNG, JPG, WEBP, GIF, BMP',
      outputFormat: 'PNG, JPG, WEBP',
      maxLimit: 'Up to 25MB per image',
      processingType: 'High-Quality Bicubic Canvas Resampler',
      privacyNote: '100% Client-Side execution.',
    },
    goodToKnow: [
      'Bicubic interpolation ensures smooth diagonals and crisp text when downscaling.',
    ],
    relatedToolIds: ['image-compressor', 'image-converter', 'image-cropper'],
  },

  'image-converter': {
    howItWorks: [
      { step: 1, title: 'Upload Images', description: 'Drop images in any format (PNG, JPG, WEBP, BMP, GIF, SVG).' },
      { step: 2, title: 'Choose Target Format', description: 'Select output format (e.g. convert WEBP to JPG or SVG to PNG).' },
      { step: 3, title: 'Convert Batch', description: 'Images are decoded and re-encoded in the selected container.' },
      { step: 4, title: 'Download Converted Files', description: 'Download your files individually or as a ZIP package.' },
    ],
    specs: {
      supportedFormats: 'JPG, PNG, WEBP, BMP, GIF, SVG',
      outputFormat: 'Selected Target Image Format',
      maxLimit: 'Up to 20 images per batch',
      processingType: 'In-Browser Format Transcoder',
      privacyNote: 'Local browser transcoding.',
    },
    goodToKnow: [
      'When converting PNG to JPG, transparent areas are automatically rendered on a clean white background.',
    ],
    relatedToolIds: ['image-compressor', 'image-resizer', 'image-background-remover'],
  },

  'ocr-pdf': {
    howItWorks: [
      { step: 1, title: 'Upload Scanned Document', description: 'Select scanned PDF pages or document photos.' },
      { step: 2, title: 'Select Recognition Languages', description: 'Choose from English, Bengali, Arabic, Spanish, French, and more.' },
      { step: 3, title: 'Run Neural OCR', description: 'Tesseract OCR parses character shapes and line geometry.' },
      { step: 4, title: 'Copy Text or Download', description: 'Copy extracted text with one click or download as TXT / Searchable PDF.' },
    ],
    specs: {
      supportedFormats: 'PDF (.pdf), PNG, JPG, WEBP',
      outputFormat: 'Plain Text (.txt), Word (.docx), or Clipboard',
      maxLimit: 'Up to 30 pages per session',
      processingType: 'Tesseract.js WebAssembly OCR Engine',
      privacyNote: 'Zero cloud recognition. Runs 100% in your browser.',
    },
    goodToKnow: [
      'Higher contrast scans (300 DPI) produce significantly higher text recognition accuracy.',
      'Supports multilingual documents with mixed Latin, Bengali, and Arabic scripts.',
    ],
    relatedToolIds: ['pdf-to-word', 'pdf-inspector', 'compress-pdf', 'clean-pdf'],
  },

  'pdf-edit': {
    howItWorks: [
      { step: 1, title: 'Load PDF', description: 'Open the PDF you want to annotate or markup.' },
      { step: 2, title: 'Add Annotations', description: 'Insert text notes, signatures, highlights, stamps, and shapes directly on pages.' },
      { step: 3, title: 'Position & Style', description: 'Adjust font sizes, colors, opacity, and positioning with interactive drag handles.' },
      { step: 4, title: 'Export Annotated PDF', description: 'Download your finalized PDF with embedded annotations.' },
    ],
    specs: {
      supportedFormats: 'PDF (.pdf)',
      outputFormat: 'Annotated PDF (.pdf)',
      maxLimit: 'Up to 100MB per file',
      processingType: 'Vector PDF Overlay & Annotation Stream Builder',
      privacyNote: 'Local browser memory streams.',
    },
    goodToKnow: [
      'Annotations are written as standard PDF compliance objects readable by Acrobat, Preview, and browsers.',
    ],
    relatedToolIds: ['flatten-pdf', 'pdf-security', 'organize-pdf', 'normalize-pdf-page-size'],
  },

  'pdf-security': {
    howItWorks: [
      { step: 1, title: 'Upload Document', description: 'Select the PDF to protect with a password or unlock.' },
      { step: 2, title: 'Set Security Permissions', description: 'Configure 128-bit/256-bit encryption password, printing, and copying permissions.' },
      { step: 3, title: 'Apply Cryptography', description: 'The engine encrypts PDF dictionary streams with your key.' },
      { step: 4, title: 'Download Secure PDF', description: 'Save your protected PDF document.' },
    ],
    specs: {
      supportedFormats: 'PDF (.pdf)',
      outputFormat: 'Encrypted or Decrypted PDF (.pdf)',
      maxLimit: 'Up to 100MB per file',
      processingType: 'Standard PDF AES / RC4 Cryptographic Engine',
      privacyNote: 'Passwords are never transmitted over network or stored.',
    },
    goodToKnow: [
      'Protected PDFs require the entered password to view or modify according to configured permission flags.',
    ],
    relatedToolIds: ['pdf-edit', 'flatten-pdf', 'pdf-inspector'],
  },

  'pdf-inspector': {
    howItWorks: [
      { step: 1, title: 'Upload PDF', description: 'Select any PDF to inspect its internal structure.' },
      { step: 2, title: 'Parse Metadata & Streams', description: 'The engine inspects PDF version, fonts, images, dimensions, and compression.' },
      { step: 3, title: 'Review Diagnostics', description: 'Examine detailed page metrics, color spaces, security flags, and object trees.' },
      { step: 4, title: 'Export Audit Report', description: 'Copy diagnostic summaries or download an audit log for technical troubleshooting.' },
    ],
    specs: {
      supportedFormats: 'PDF (.pdf)',
      outputFormat: 'Interactive Diagnostic Tree & JSON/Text Audit',
      maxLimit: 'Up to 100MB per file',
      processingType: 'Deep Object Cross-Reference Tree Parser',
      privacyNote: '100% In-Browser Inspection.',
    },
    goodToKnow: [
      'Useful for checking why a PDF is failing to print or identifying mixed page dimensions.',
    ],
    relatedToolIds: ['normalize-pdf-page-size', 'clean-pdf', 'pdf-compare', 'ocr-pdf'],
  },

  'pdf-compare': {
    howItWorks: [
      { step: 1, title: 'Upload Two PDFs', description: 'Select the original version and the modified version of a document.' },
      { step: 2, title: 'Compare Pages', description: 'The visual engine scans pages pixel-by-pixel to highlight added, removed, or moved text.' },
      { step: 3, title: 'Review Diff Overlays', description: 'Switch between side-by-side view, diff heatmaps, and highlight overlays.' },
      { step: 4, title: 'Download Diff Report', description: 'Export a visual comparison report showing all alterations.' },
    ],
    specs: {
      supportedFormats: 'Two PDF Documents (.pdf)',
      outputFormat: 'Visual Difference Map & Comparison Report',
      maxLimit: 'Up to 50MB per file',
      processingType: 'Pixel-Level Vector Difference Analyzer',
      privacyNote: 'Local browser diffing.',
    },
    goodToKnow: [
      'Diff overlays highlight deletions in red and additions in green for instant spot-checking.',
    ],
    relatedToolIds: ['pdf-inspector', 'pdf-edit', 'organize-pdf'],
  },

  'clean-pdf': {
    howItWorks: [
      { step: 1, title: 'Upload Damaged or Bloated PDF', description: 'Select any PDF with corruption warnings or slow rendering.' },
      { step: 2, title: 'Rebuild Cross-Reference Table', description: 'The engine reconstructs xref tables and strips dangling objects.' },
      { step: 3, title: 'Repair Page Streams', description: 'Unreferenced font bytes and broken streams are fixed.' },
      { step: 4, title: 'Download Repaired PDF', description: 'Save a clean, compliant PDF document.' },
    ],
    specs: {
      supportedFormats: 'PDF (.pdf)',
      outputFormat: 'Cleaned & Repaired PDF (.pdf)',
      maxLimit: 'Up to 100MB per file',
      processingType: 'In-Browser PDF Structure Sanitizer',
      privacyNote: '100% Client-Side memory streams.',
    },
    goodToKnow: [
      'Repairs common PDF viewing errors caused by incomplete downloads or improper exports.',
    ],
    relatedToolIds: ['compress-pdf', 'pdf-inspector', 'flatten-pdf'],
  },

  'flatten-pdf': {
    howItWorks: [
      { step: 1, title: 'Upload PDF with Forms', description: 'Select a PDF containing interactive form fields, checkboxes, or annotations.' },
      { step: 2, title: 'Flatten Form Fields', description: 'Interactive elements are rendered permanently onto the underlying page canvas.' },
      { step: 3, title: 'Lock Content', description: 'Form values become uneditable static page elements.' },
      { step: 4, title: 'Download Flattened PDF', description: 'Save your tamper-resistant, secure PDF.' },
    ],
    specs: {
      supportedFormats: 'PDF (.pdf)',
      outputFormat: 'Flattened PDF (.pdf)',
      maxLimit: 'Up to 100MB per file',
      processingType: 'AcroForm & Annotation Geometry Baking',
      privacyNote: 'Processed locally in browser memory.',
    },
    goodToKnow: [
      'Flattening prevents form entries from being modified and ensures identical display across all PDF viewers.',
    ],
    relatedToolIds: ['pdf-security', 'compress-pdf', 'clean-pdf', 'pdf-edit'],
  },

  'assignment-pdf-maker': {
    howItWorks: [
      { step: 1, title: 'Add Cover & Pages', description: 'Enter assignment title, student name, course details, and upload work pages.' },
      { step: 2, title: 'Select Cover Template', description: 'Choose a formal university or modern collegiate cover page layout.' },
      { step: 3, title: 'Standardize & Number', description: 'All pages are formatted to A4 with sequential page numbering.' },
      { step: 4, title: 'Download Assignment PDF', description: 'Download your submission-ready PDF package.' },
    ],
    specs: {
      supportedFormats: 'PDF, JPG, PNG, DOCX',
      outputFormat: 'Formal Assignment PDF (.pdf)',
      maxLimit: 'Up to 30 pages per assignment',
      processingType: 'Academic Template Engine & Vector Page Assembly',
      privacyNote: '100% Private local processing.',
    },
    goodToKnow: [
      'Includes university-compliant cover pages with automatic institution and submission metadata formatting.',
    ],
    relatedToolIds: ['notes-to-pdf', 'normalize-pdf-page-size', 'pdf-submission-compressor', 'merge-pdf'],
  },

  'notes-to-pdf': {
    howItWorks: [
      { step: 1, title: 'Capture or Upload Notes', description: 'Upload photos of handwritten lecture notes, whiteboard sketches, or textbook pages.' },
      { step: 2, title: 'Enhance Legibility', description: 'Apply smart contrast filters to whiten paper backgrounds and darken ink.' },
      { step: 3, title: 'Order & Format', description: 'Arrange notes in lecture order and select margin sizes.' },
      { step: 4, title: 'Generate PDF', description: 'Save a clean, printable PDF booklet.' },
    ],
    specs: {
      supportedFormats: 'JPG, PNG, WEBP, HEIC',
      outputFormat: 'High-Contrast Notes PDF (.pdf)',
      maxLimit: 'Up to 40 photos per session',
      processingType: 'Adaptive Document Thresholding & Canvas Enhancement',
      privacyNote: '100% In-Browser processing.',
    },
    goodToKnow: [
      'Adaptive thresholding removes shadows and yellow lighting from handwritten notes for laser-clear printing.',
    ],
    relatedToolIds: ['assignment-pdf-maker', 'images-to-pdf', 'ocr-pdf', 'pdf-submission-compressor'],
  },

  'pdf-submission-compressor': {
    howItWorks: [
      { step: 1, title: 'Upload Assignment PDF', description: 'Drop your assignment or project PDF.' },
      { step: 2, title: 'Set Portal Limit Target', description: 'Pick target threshold (e.g. Under 2MB, Under 5MB, Under 10MB) for portal submission.' },
      { step: 3, title: 'Adaptive Compression', description: 'The engine adjusts compression factors until the document meets portal size.' },
      { step: 4, title: 'Download Ready File', description: 'Download your verified submission-ready PDF.' },
    ],
    specs: {
      supportedFormats: 'PDF (.pdf)',
      outputFormat: 'Target-Sized PDF (.pdf)',
      maxLimit: 'Up to 100MB original file',
      processingType: 'Adaptive Iterative Stream Quantization',
      privacyNote: 'Processed locally in browser memory.',
    },
    goodToKnow: [
      'Guarantees your file will upload smoothly on Canvas, Google Classroom, Blackboard, and Moodle portals.',
    ],
    relatedToolIds: ['compress-pdf', 'assignment-pdf-maker', 'image-submission-compressor'],
  },

  'image-submission-compressor': {
    howItWorks: [
      { step: 1, title: 'Upload Photos', description: 'Select assignment photos or scanned paperwork.' },
      { step: 2, title: 'Set Target Size', description: 'Choose your portal size cap (e.g. < 1MB or < 500KB per image).' },
      { step: 3, title: 'Optimize', description: 'The engine balances resolution and compression to fit under the limit.' },
      { step: 4, title: 'Download', description: 'Download compressed images ready for upload.' },
    ],
    specs: {
      supportedFormats: 'JPG, PNG, WEBP',
      outputFormat: 'Compressed Image (.jpg / .png)',
      maxLimit: 'Up to 20 images per batch',
      processingType: 'Iterative Canvas Quantizer',
      privacyNote: 'Zero server uploads.',
    },
    goodToKnow: [
      'Preserves text readability on homework submissions while drastically reducing byte size.',
    ],
    relatedToolIds: ['image-compressor', 'pdf-submission-compressor', 'notes-to-pdf'],
  },

  'text-to-pdf': {
    howItWorks: [
      { step: 1, title: "Input or Paste Text", description: "Enter plain text, notes, code snippets, or upload a .txt document." },
      { step: 2, title: "Configure Typography", description: "Customize font family, size, line spacing, margins, and paper orientation." },
      { step: 3, title: "Generate Layout", description: "The vector engine paginates text cleanly with proper word wrapping and margins." },
      { step: 4, title: "Download PDF", description: "Export a clean, fully searchable vector PDF with crisp selectable text." },
    ],
    specs: {
      supportedFormats: "Plain text, .txt files",
      outputFormat: "Searchable Vector PDF (.pdf)",
      maxLimit: "Up to 500,000 characters per document",
      processingType: "In-Browser Vector PDF Layout Engine",
      privacyNote: "100% Client-Side. Text never leaves local browser memory.",
    },
    goodToKnow: [
      "Preserves character spacing and font glyphs for laser-crisp printing and search indexing.",
      "Selectable text allows readers to highlight, search, and copy quotes from the output PDF.",
    ],
    relatedToolIds: ['word-to-pdf', 'pdf-to-text', 'notes-to-pdf', 'compress-pdf'],
  },

  'pdf-to-text': {
    howItWorks: [
      { step: 1, title: "Upload PDF Document", description: "Select any multi-page PDF document containing digital text." },
      { step: 2, title: "Extract Text Content", description: "The parser reads font encodings, character streams, and structural paragraphs." },
      { step: 3, title: "Inspect & Edit", description: "Review the extracted plain text in the live interactive editor." },
      { step: 4, title: "Download or Copy", description: "Save as a clean .txt file or copy directly to your clipboard." },
    ],
    specs: {
      supportedFormats: "PDF (.pdf)",
      outputFormat: "Plain Text (.txt) or Clipboard",
      maxLimit: "Up to 100MB / 500 pages",
      processingType: "Client-Side PDF Font & Stream Extractor",
      privacyNote: "Zero server uploads. Runs entirely in browser memory.",
    },
    goodToKnow: [
      "Extracts true digital text streams while stripping formatting clutter for clean analysis.",
      "For scanned paperwork or photos without selectable text, use the OCR PDF tool instead.",
    ],
    relatedToolIds: ['ocr-pdf', 'text-to-pdf', 'pdf-to-word', 'word-counter'],
  },

  'batch-image-processor': {
    howItWorks: [
      { step: 1, title: "Upload Image Collection", description: "Add up to 50 photos or graphic assets simultaneously." },
      { step: 2, title: "Choose Batch Operation", description: "Select bulk resize, format conversion, watermarking, or quality compression." },
      { step: 3, title: "Configure Parameters", description: "Set common dimensions, quality percentage, or watermark placement for all files." },
      { step: 4, title: "Download Batch ZIP", description: "The parallel engine processes all images concurrently and bundles them into a ZIP." },
    ],
    specs: {
      supportedFormats: "JPG, PNG, WEBP, BMP, SVG",
      outputFormat: "ZIP Archive or Individual Images",
      maxLimit: "Up to 50 images per batch",
      processingType: "Multi-Threaded In-Browser Web Worker Engine",
      privacyNote: "100% Client-Side. Images remain local to your device.",
    },
    goodToKnow: [
      "Processes images in parallel threads without freezing the main browser interface.",
      "Saves immense time when preparing product photos, photo albums, or web asset bundles.",
    ],
    relatedToolIds: ['image-compressor', 'image-resizer', 'image-converter', 'image-watermark'],
  },

  'image-metadata-remover': {
    howItWorks: [
      { step: 1, title: "Upload Photographs", description: "Select photos containing sensitive camera, GPS, or date metadata." },
      { step: 2, title: "Inspect Detected Tags", description: "Review detected EXIF tags including camera model, GPS coordinates, and exposure info." },
      { step: 3, title: "Strip Metadata", description: "Re-encodes the raw pixel buffer into clean containers without any metadata segments." },
      { step: 4, title: "Download Clean Images", description: "Save sanitized photos that are completely safe for social media and online sharing." },
    ],
    specs: {
      supportedFormats: "JPG, JPEG, PNG, WEBP",
      outputFormat: "Sanitized Image (.jpg / .png)",
      maxLimit: "Up to 30 images per session",
      processingType: "In-Browser Binary EXIF/IPTC Stripper",
      privacyNote: "Complete privacy. Removes geolocation coordinates and device fingerprints.",
    },
    goodToKnow: [
      "Removes GPS coordinates, device serial numbers, and shooting timestamps permanently.",
      "Essential before publishing photos of your home, family, or confidential items online.",
    ],
    relatedToolIds: ['image-compressor', 'image-info', 'batch-image-processor'],
  },

  'image-background-changer': {
    howItWorks: [
      { step: 1, title: "Upload Portrait or Product", description: "Select an image featuring people, animals, vehicles, or product items." },
      { step: 2, title: "Neural Subject Isolation", description: "The on-device AI segmenter isolates foreground contours with hair-level accuracy." },
      { step: 3, title: "Select New Backdrop", description: "Choose solid studio colors, professional gradients, or upload your own background image." },
      { step: 4, title: "Export Composite", description: "Download your finalized high-resolution composite ready for marketing or profiles." },
    ],
    specs: {
      supportedFormats: "JPG, PNG, WEBP",
      outputFormat: "PNG (.png) or JPG (.jpg)",
      maxLimit: "Up to 25MB per image",
      processingType: "Client-Side Neural Segmentation & Canvas Compositor",
      privacyNote: "Processed entirely on your device with local AI inference.",
    },
    goodToKnow: [
      "Perfect for creating professional e-commerce product photos on clean white backdrops.",
      "Easily swap messy backgrounds for professional office, studio, or aesthetic scenes.",
    ],
    relatedToolIds: ['image-background-remover', 'image-cropper', 'image-text', 'image-color-picker'],
  },

  'image-cropper': {
    howItWorks: [
      { step: 1, title: "Upload Image", description: "Select the photograph or graphic asset you wish to frame." },
      { step: 2, title: "Choose Aspect Ratio", description: "Select standard ratios (1:1 Square, 16:9 Landscape, 4:5 Portrait, 9:16 Story) or freeform." },
      { step: 3, title: "Position & Scale", description: "Drag and zoom the crop boundary to compose your subject perfectly." },
      { step: 4, title: "Export Cropped Image", description: "Save the cropped image at full native pixel resolution without quality loss." },
    ],
    specs: {
      supportedFormats: "JPG, PNG, WEBP, BMP",
      outputFormat: "Cropped Image (.png / .jpg / .webp)",
      maxLimit: "Up to 50MB per image",
      processingType: "High-Precision HTML5 Canvas Sub-Region Extractor",
      privacyNote: "100% In-Browser. No image data is transmitted to external servers.",
    },
    goodToKnow: [
      "Pixel-perfect presets match exact requirements for Instagram, YouTube, LinkedIn, and Twitter.",
      "Preserves original color profiles and high-resolution details within the cropped area.",
    ],
    relatedToolIds: ['image-resizer', 'aspect-ratio-calculator', 'image-compressor', 'image-converter'],
  },

  'image-watermark': {
    howItWorks: [
      { step: 1, title: "Upload Pictures", description: "Select one or more images you want to protect with copyright markings." },
      { step: 2, title: "Design Watermark", description: "Type custom copyright text or upload a transparent brand logo." },
      { step: 3, title: "Adjust Styling", description: "Customize opacity, angle, font, color, and choose corner or repeating tile positioning." },
      { step: 4, title: "Download Protected Photos", description: "Export protected images with permanent, unalterable visual attribution." },
    ],
    specs: {
      supportedFormats: "JPG, PNG, WEBP",
      outputFormat: "Watermarked Image (.jpg / .png)",
      maxLimit: "Up to 25 images per batch",
      processingType: "In-Browser Alpha Compositing Engine",
      privacyNote: "Local canvas rendering with zero server storage.",
    },
    goodToKnow: [
      "Tiled watermarks offer maximum defense against unauthorized scraping and image theft.",
      "Adjustable opacity ensures your branding remains noticeable without obscuring the art.",
    ],
    relatedToolIds: ['batch-image-processor', 'image-text', 'image-compressor'],
  },

  'image-text': {
    howItWorks: [
      { step: 1, title: "Upload Graphic Asset", description: "Select the image, banner, meme template, or thumbnail you want to caption." },
      { step: 2, title: "Add Typography", description: "Type custom text, choose font styles, font sizes, colors, outlines, and drop shadows." },
      { step: 3, title: "Position On Canvas", description: "Drag the text layer anywhere on the image with live snap alignment guides." },
      { step: 4, title: "Download Image", description: "Export a crisp, high-resolution graphic with vector-sharp rendered typography." },
    ],
    specs: {
      supportedFormats: "JPG, PNG, WEBP",
      outputFormat: "Composite Graphic (.png / .jpg)",
      maxLimit: "Up to 30MB per image",
      processingType: "Vector Font Canvas Compositor",
      privacyNote: "100% Client-Side. Zero server interaction.",
    },
    goodToKnow: [
      "High-contrast text stroke options ensure words remain legible over busy backgrounds.",
      "Great for creating social media banners, blog featured graphics, and promo callouts.",
    ],
    relatedToolIds: ['image-watermark', 'image-cropper', 'whiteboard', 'image-color-picker'],
  },

  'image-color-picker': {
    howItWorks: [
      { step: 1, title: "Upload Image or Design", description: "Load any photo, website screenshot, illustration, or brand mockup." },
      { step: 2, title: "Pick Pixel or Extract Palette", description: "Click any pixel with the precision zoom loupe or extract the top 6 dominant colors." },
      { step: 3, title: "Inspect Color Formats", description: "Instantly view HEX, RGB, HSL, and CMYK color codes with luminance metrics." },
      { step: 4, title: "Copy Values", description: "Click any color code to copy to your clipboard for CSS, Tailwind, or Figma." },
    ],
    specs: {
      supportedFormats: "JPG, PNG, WEBP, SVG",
      outputFormat: "HEX, RGB, HSL, CSS Palette Codes",
      maxLimit: "Up to 40MB per image",
      processingType: "Client-Side Canvas Pixel Buffer Analyzer",
      privacyNote: "Processed entirely inside browser memory.",
    },
    goodToKnow: [
      "The precision loupe magnifies pixels 8x so you can sample exact 1px lines and borders.",
      "Harmonious dominant palette extraction speeds up UI styling and graphic branding.",
    ],
    relatedToolIds: ['color-converter', 'image-info', 'aspect-ratio-calculator'],
  },

  'image-info': {
    howItWorks: [
      { step: 1, title: "Upload Image File", description: "Select any image file for deep technical diagnostics." },
      { step: 2, title: "Extract Header & Dimensions", description: "Inspect exact pixel dimensions, aspect ratio, color space, and MIME type." },
      { step: 3, title: "Decode EXIF Metadata", description: "View camera make/model, ISO, aperture, focal length, date, and lens specifications." },
      { step: 4, title: "Review Report", description: "Copy structured diagnostic metrics or verify file integrity before publication." },
    ],
    specs: {
      supportedFormats: "JPG, PNG, WEBP, GIF, SVG, BMP",
      outputFormat: "Technical Diagnostic Report",
      maxLimit: "Up to 100MB per file",
      processingType: "In-Browser Binary Header & EXIF Tag Parser",
      privacyNote: "100% Client-Side. No file is ever transmitted over the network.",
    },
    goodToKnow: [
      "Confirms whether an image contains embedded color profiles or hidden location tags.",
      "Identifies mismatched file extensions and corrupt container headers instantly.",
    ],
    relatedToolIds: ['image-metadata-remover', 'file-info-inspector', 'aspect-ratio-calculator'],
  },

  'whiteboard': {
    howItWorks: [
      { step: 1, title: "Open Infinite Canvas", description: "Launch the vector drawing studio with hardware-accelerated 60fps rendering." },
      { step: 2, title: "Draw & Annotate", description: "Use dynamic pressure pens, highlighters, geometric shapes, text boxes, and arrows." },
      { step: 3, title: "Import PDFs & Images", description: "Drop multi-page PDF documents to review, mark up, and annotate page-by-page." },
      { step: 4, title: "Export & Auto-Save", description: "Export high-res PNG, vector SVG, or annotated PDF with automatic local IndexedDB backup." },
    ],
    specs: {
      supportedFormats: "Vector strokes, Shapes, Text, Images (PNG/JPG), PDF documents",
      outputFormat: "PNG, SVG, Annotated PDF, JSON Board Archive",
      maxLimit: "Infinite canvas coordinate space / Offline persistent",
      processingType: "HTML5 2D Canvas Matrix Pipeline + IndexedDB Cache",
      privacyNote: "100% Client-Side & Offline. Boards are stored locally on your device.",
    },
    goodToKnow: [
      "All drawings, shapes, and PDF markups persist locally across browser restarts.",
      "Focus Mode removes all navigation and toolbars for distraction-free presentations and classes.",
      "Supports smooth stylus pen pressure, touch gestures, and mouse input seamlessly.",
    ],
    relatedToolIds: ['pdf-edit', 'notes-to-pdf', 'assignment-pdf-maker', 'image-text'],
  },

  'text-utilities': {
    howItWorks: [
      { step: 1, title: "Enter Text Content", description: "Paste articles, code, essays, notes, or creative writing into the workspace." },
      { step: 2, title: "Choose Specialized Tab", description: "Switch between Word Counter, Case Converter, Diff Checker, or Markdown Preview." },
      { step: 3, title: "Inspect Real-Time Results", description: "View live character stats, side-by-side text comparisons, or styled Markdown." },
      { step: 4, title: "Copy Formatted Text", description: "Copy the transformed text or export deliverables with one click." },
    ],
    specs: {
      supportedFormats: "Plain Text, Markdown, HTML, Code",
      outputFormat: "Transformed Text / Visual Diff / HTML",
      maxLimit: "Unlimited client memory stream",
      processingType: "Client-Side JavaScript Text Engine",
      privacyNote: "100% Private. Text is processed in ephemeral memory and never saved.",
    },
    goodToKnow: [
      "Unified hub for everyday text editing, proofreading, formatting, and diffing tasks.",
      "Works completely offline without requiring any network connection.",
    ],
    relatedToolIds: ['word-counter', 'text-case-converter', 'text-diff-checker', 'markdown-editor'],
  },

  'word-counter': {
    howItWorks: [
      { step: 1, title: "Paste or Type Text", description: "Input your essay, speech, blog post, or translation into the text editor." },
      { step: 2, title: "Real-Time Word Analysis", description: "Calculates total words, characters with/without spaces, sentences, and paragraphs." },
      { step: 3, title: "Reading & Speaking Duration", description: "Computes estimated reading time and oral speaking duration based on standard WPM rates." },
      { step: 4, title: "Inspect Keyword Frequency", description: "Review top keyword occurrences and keyword density for SEO or academic compliance." },
    ],
    specs: {
      supportedFormats: "Plain Text, Markdown, Formatted Prose",
      outputFormat: "Detailed Statistical Summary",
      maxLimit: "Up to 1,000,000 words",
      processingType: "Client-Side Unicode Tokenizer & NLP Metrics",
      privacyNote: "Processed locally in browser memory with zero telemetry.",
    },
    goodToKnow: [
      "Accurately respects word limits for university assignments, tweets, and ad copy.",
      "Keyword density analyzer helps identify repetitive words and optimize search copy.",
    ],
    relatedToolIds: ['text-case-converter', 'text-diff-checker', 'markdown-editor', 'pdf-to-text'],
  },

  'text-case-converter': {
    howItWorks: [
      { step: 1, title: "Enter Text", description: "Paste sentences, headlines, code variables, or lists with inconsistent casing." },
      { step: 2, title: "Choose Target Case", description: "Select UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, or kebab-case." },
      { step: 3, title: "Instant Transformation", description: "The formatting engine applies grammar and programmer casing conventions immediately." },
      { step: 4, title: "Copy Result", description: "One-click copy the perfectly cased text to your clipboard." },
    ],
    specs: {
      supportedFormats: "Plain Text, Code Strings",
      outputFormat: "Re-cased Text String",
      maxLimit: "Up to 500,000 characters",
      processingType: "Instant Client-Side String Formatter",
      privacyNote: "100% Private local processing.",
    },
    goodToKnow: [
      "Title Case automatically keeps minor articles and prepositions (a, an, the, in, on) in lowercase.",
      "Programmer cases (camelCase, snake_case, kebab-case) make formatting database keys effortless.",
    ],
    relatedToolIds: ['word-counter', 'text-utilities', 'json-formatter'],
  },

  'text-diff-checker': {
    howItWorks: [
      { step: 1, title: "Paste Original Version", description: "Enter the initial version of your text, contract clause, or code snippet." },
      { step: 2, title: "Paste Modified Version", description: "Enter the updated, edited, or revised draft in the second pane." },
      { step: 3, title: "Compare Differences", description: "The Myers diff algorithm isolates added, deleted, and modified words and lines." },
      { step: 4, title: "Inspect Side-by-Side", description: "Review visual green additions and red deletions in side-by-side or unified inline view." },
    ],
    specs: {
      supportedFormats: "Plain Text, Code, Markdown, Configs",
      outputFormat: "Visual Diff Highlighting & Summary",
      maxLimit: "Up to 250,000 characters per side",
      processingType: "In-Browser Myers Diff & LCS Algorithm",
      privacyNote: "100% Client-Side. Sensitive contracts and code remain secure.",
    },
    goodToKnow: [
      "Granular word-level highlighting spots punctuation tweaks, spelling edits, and subtle rewrites.",
      "Ideal for legal contracts, code review comparisons, essays, and editorial revisions.",
    ],
    relatedToolIds: ['pdf-compare', 'text-utilities', 'word-counter'],
  },

  'markdown-editor': {
    howItWorks: [
      { step: 1, title: "Write Markdown", description: "Type standard CommonMark and GitHub Flavored Markdown in the code editor." },
      { step: 2, title: "Use Formatting Toolbar", description: "Insert headings, bold text, italics, code blocks, tables, and blockquotes with ease." },
      { step: 3, title: "Live Split-Screen Preview", description: "Inspect styled typography, formatted tables, and syntax-highlighted code in real time." },
      { step: 4, title: "Export .MD or HTML", description: "Download your finalized .md file or copy clean HTML markup for websites." },
    ],
    specs: {
      supportedFormats: "Markdown (.md, .markdown), Plain Text",
      outputFormat: "Markdown (.md) or Rendered HTML",
      maxLimit: "No artificial file size limit",
      processingType: "Client-Side AST Markdown Parser",
      privacyNote: "100% Client-Side. Notes are stored only in your local browser.",
    },
    goodToKnow: [
      "Supports tables, task lists, code block syntax highlighting, and inline math notations.",
      "Synchronized scrolling keeps your editor and preview perfectly aligned as you write.",
    ],
    relatedToolIds: ['text-utilities', 'word-counter', 'text-to-pdf'],
  },

  'qr-code-generator': {
    howItWorks: [
      { step: 1, title: "Choose Content Type", description: "Select Website URL, Plain Text, Wi-Fi Network, Email, or Contact Card (vCard)." },
      { step: 2, title: "Enter Information", description: "Fill in your link, Wi-Fi network SSID/password, or message details." },
      { step: 3, title: "Customize Visual Style", description: "Pick custom foreground and background colors, pixel resolution, and error correction." },
      { step: 4, title: "Download QR Code", description: "Export crisp vector SVG or high-resolution PNG ready for print menus, posters, and flyers." },
    ],
    specs: {
      supportedFormats: "URL, Text, Wi-Fi, Email, Phone, vCard",
      outputFormat: "High-Res PNG (.png) or Vector SVG (.svg)",
      maxLimit: "Up to 2,953 alphanumeric characters per code",
      processingType: "Client-Side Reed-Solomon QR Matrix Generator",
      privacyNote: "100% In-Browser. Sensitive Wi-Fi passwords and links are never sent to a server.",
    },
    goodToKnow: [
      "High error correction (Level H) ensures the QR code remains scannable even if 30% is damaged or branded.",
      "Wi-Fi QR codes allow guests to connect to wireless networks instantly without typing passwords.",
    ],
    relatedToolIds: ['qr-code-scanner', 'url-encoder', 'image-watermark'],
  },

  'qr-code-scanner': {
    howItWorks: [
      { step: 1, title: "Select Scanner Input", description: "Use your live device camera or upload an image file containing a QR barcode." },
      { step: 2, title: "Auto-Detect Matrix", description: "Computer vision algorithms locate the alignment markers and binarize the pattern." },
      { step: 3, title: "Decode Information", description: "Instantly view the extracted URL, Wi-Fi credentials, contact card, or plain text." },
      { step: 4, title: "Open or Copy", description: "Click to open verified web links directly or copy text payloads to your clipboard." },
    ],
    specs: {
      supportedFormats: "Camera Stream, JPG, PNG, WEBP, BMP",
      outputFormat: "Decoded URL, Text, Wi-Fi or vCard payload",
      maxLimit: "Up to 4K resolution camera input / 25MB image file",
      processingType: "In-Browser Barcode & Computer Vision Detector",
      privacyNote: "100% Local. Camera stream is processed in-memory and never recorded.",
    },
    goodToKnow: [
      "Supports scanning QR codes directly from screenshots or downloaded photos without a camera.",
      "Safely previews web addresses before you choose to navigate to them.",
    ],
    relatedToolIds: ['qr-code-generator', 'url-encoder', 'base64-converter'],
  },

  'calculator': {
    howItWorks: [
      { step: 1, title: "Input Numbers & Operators", description: "Use the responsive on-screen buttons or your keyboard number pad." },
      { step: 2, title: "Perform Calculations", description: "Execute addition, subtraction, multiplication, division, percentages, and powers." },
      { step: 3, title: "Scientific Math Functions", description: "Access trigonometry (sin, cos, tan), logarithms, square roots, and parentheses." },
      { step: 4, title: "Recall History & Copy", description: "Inspect previous calculation history and copy exact decimal answers with one click." },
    ],
    specs: {
      supportedFormats: "Arithmetic & Scientific expressions",
      outputFormat: "Formatted Decimal / Integer / History",
      maxLimit: "Standard 64-bit floating point precision",
      processingType: "Instant Client-Side Mathematical Evaluator",
      privacyNote: "100% Private local calculation.",
    },
    goodToKnow: [
      "Supports full keyboard navigation: type numbers, +, -, *, /, and press Enter to evaluate.",
      "Equation history log prevents losing multi-step tallies and accounting calculations.",
    ],
    relatedToolIds: ['unit-converter', 'percentage-calculator', 'date-calculator'],
  },

  'unit-converter': {
    howItWorks: [
      { step: 1, title: "Select Measurement Category", description: "Choose Length, Weight/Mass, Temperature, Area, Volume, Speed, Time, or Digital Data." },
      { step: 2, title: "Input Source Value", description: "Enter the numerical quantity you want to convert." },
      { step: 3, title: "Select Units", description: "Pick origin and destination units (e.g. Kilograms to Pounds, Celsius to Fahrenheit)." },
      { step: 4, title: "View Accurate Conversion", description: "Instantly view the converted result with full decimal precision and formula breakdown." },
    ],
    specs: {
      supportedFormats: "8 Measurement Categories / 60+ International Units",
      outputFormat: "Converted Quantity with Formula",
      maxLimit: "High precision scientific decimal values",
      processingType: "Instant Client-Side Conversion Table Engine",
      privacyNote: "100% Local calculation.",
    },
    goodToKnow: [
      "Supports both Metric (SI) and Imperial / US Customary standards across all categories.",
      "Digital data category converts seamlessly between Bits, Bytes, KB, MB, GB, and TB.",
    ],
    relatedToolIds: ['calculator', 'percentage-calculator', 'aspect-ratio-calculator'],
  },

  'percentage-calculator': {
    howItWorks: [
      { step: 1, title: "Select Calculation Mode", description: "Choose What is X% of Y, X is what % of Y, Percentage Increase, or Percentage Decrease." },
      { step: 2, title: "Enter Values", description: "Fill in your base amount and percentage rate in the labeled fields." },
      { step: 3, title: "Instant Evaluation", description: "The math engine calculates the exact percentage, difference, and final sum." },
      { step: 4, title: "View Step-by-Step Breakdown", description: "Review the mathematical formula used for retail discounts, tips, margins, or tax." },
    ],
    specs: {
      supportedFormats: "Numerical inputs",
      outputFormat: "Percentage Value, Difference, and Final Amount",
      maxLimit: "Unlimited numerical range",
      processingType: "Instant In-Browser Arithmetic Engine",
      privacyNote: "100% Private local calculation.",
    },
    goodToKnow: [
      "Great for shopping discounts, restaurant tips, sales tax, profit margins, and exam grades.",
      "Shows both the added/subtracted difference and the finalized total in one clear view.",
    ],
    relatedToolIds: ['calculator', 'unit-converter', 'aspect-ratio-calculator'],
  },

  'date-calculator': {
    howItWorks: [
      { step: 1, title: "Choose Mode", description: "Calculate the duration between two dates, or add/subtract days from a start date." },
      { step: 2, title: "Pick Dates", description: "Select your starting and ending dates using the interactive calendar picker." },
      { step: 3, title: "Compute Time Span", description: "Instantly view the span in exact years, months, weeks, total days, and business days." },
      { step: 4, title: "Copy Summary", description: "Copy the duration summary for project milestones, visa deadlines, or anniversary tracking." },
    ],
    specs: {
      supportedFormats: "Gregorian Calendar Dates",
      outputFormat: "Duration breakdown (Years, Months, Weeks, Days, Business Days)",
      maxLimit: "Full historical and future calendar ranges",
      processingType: "Client-Side ISO Calendar & Leap-Year Engine",
      privacyNote: "100% Local calculation.",
    },
    goodToKnow: [
      "Business day calculation excludes weekends for accurate workplace and project scheduling.",
      "Leap years and varying month lengths are calculated with 100% calendar accuracy.",
    ],
    relatedToolIds: ['timer-stopwatch', 'calculator', 'percentage-calculator'],
  },

  'timer-stopwatch': {
    howItWorks: [
      { step: 1, title: "Select Tool Mode", description: "Switch between the precision Stopwatch or the customizable Countdown Timer." },
      { step: 2, title: "Set Duration or Start", description: "Configure countdown hours/minutes/seconds, or tap Start on the stopwatch." },
      { step: 3, title: "Track Laps", description: "Record split times and lap intervals with millisecond accuracy while running." },
      { step: 4, title: "Audio Alert & Notification", description: "A pleasant audio chime alerts you the second your countdown timer reaches zero." },
    ],
    specs: {
      supportedFormats: "Real-time clock tracking",
      outputFormat: "Hours, Minutes, Seconds, Milliseconds + Lap Records",
      maxLimit: "High-precision performance.now() timer",
      processingType: "Browser RequestAnimationFrame / Web Audio API",
      privacyNote: "100% Client-Side. No telemetry or server pings.",
    },
    goodToKnow: [
      "Continues keeping accurate time even if you switch tabs or minimize the browser.",
      "Lap table calculates fastest lap, slowest lap, and total cumulative intervals.",
    ],
    relatedToolIds: ['date-calculator', 'calculator', 'whiteboard'],
  },

  'json-formatter': {
    howItWorks: [
      { step: 1, title: "Paste JSON Text", description: "Input raw, minified, or unformatted JSON text from an API or config file." },
      { step: 2, title: "Validate & Indent", description: "The parser validates syntax, highlights parse errors, and formats with clean 2 or 4 space indentation." },
      { step: 3, title: "Inspect Tree View", description: "Expand and collapse objects and arrays in the interactive visual tree explorer." },
      { step: 4, title: "Copy or Download", description: "Save as a .json file or copy the beautified/minified string to your clipboard." },
    ],
    specs: {
      supportedFormats: "JSON (.json), Raw JSON text",
      outputFormat: "Beautified JSON, Minified JSON, or .json file",
      maxLimit: "Up to 25MB JSON string",
      processingType: "In-Browser V8 JSON Engine & Syntax Highlighter",
      privacyNote: "100% Client-Side. Proprietary database keys and API payloads are safe.",
    },
    goodToKnow: [
      "Identifies missing commas, unquoted keys, and trailing syntax errors with line numbers.",
      "Minification strips all whitespace to create ultra-compact payloads for production APIs.",
    ],
    relatedToolIds: ['csv-json-converter', 'base64-converter', 'url-encoder'],
  },

  'csv-json-converter': {
    howItWorks: [
      { step: 1, title: "Select Conversion Direction", description: "Choose CSV to JSON or JSON to CSV." },
      { step: 2, title: "Paste or Upload Data", description: "Enter spreadsheet CSV text or paste a JSON array of objects." },
      { step: 3, title: "Configure Delimiters", description: "Select comma, tab, or semicolon delimiters and toggle column header detection." },
      { step: 4, title: "Download Converted File", description: "Export your converted .json file or clean RFC-compliant .csv spreadsheet." },
    ],
    specs: {
      supportedFormats: "CSV (.csv), TSV (.tsv), JSON (.json)",
      outputFormat: "JSON Array (.json) or CSV Table (.csv)",
      maxLimit: "Up to 50MB tabular data",
      processingType: "RFC 4180 Compliant Client-Side Parser",
      privacyNote: "100% Private local processing. Zero cloud data storage.",
    },
    goodToKnow: [
      "Properly escapes nested commas, quotes, and multiline values inside spreadsheet cells.",
      "Seamless bridge between Excel/Sheets exports and modern web application databases.",
    ],
    relatedToolIds: ['json-formatter', 'excel-to-pdf', 'base64-converter'],
  },

  'base64-converter': {
    howItWorks: [
      { step: 1, title: "Choose Mode", description: "Select Encode to Base64 or Decode from Base64." },
      { step: 2, title: "Enter Text or Upload File", description: "Paste plain text or drop an image/document to generate an inline Data URL." },
      { step: 3, title: "Convert Binary Streams", description: "The binary engine converts bytes to standard ASCII Base64 notation." },
      { step: 4, title: "Copy Base64 String", description: "Copy the encoded payload, Data URI prefix, or decoded text with one click." },
    ],
    specs: {
      supportedFormats: "Plain Text, Images, PDF, Binary Files",
      outputFormat: "Base64 String, Data URI, or Decoded Binary",
      maxLimit: "Up to 30MB file size",
      processingType: "Client-Side Binary Stream & FileReader API",
      privacyNote: "100% In-Browser. No data is transmitted across the internet.",
    },
    goodToKnow: [
      "Data URL mode includes the correct MIME type header ready to paste directly into HTML <img> tags or CSS.",
      "UTF-8 safe encoding ensures accented and international characters are never mangled.",
    ],
    relatedToolIds: ['url-encoder', 'hash-generator', 'json-formatter'],
  },

  'url-encoder': {
    howItWorks: [
      { step: 1, title: "Paste URL or Parameters", description: "Enter website addresses, query parameters, or strings with special characters." },
      { step: 2, title: "Select Action", description: "Choose Encode (percent-encoding for web safety) or Decode (human-readable text)." },
      { step: 3, title: "Sanitize Characters", description: "Safely converts spaces, ampersands, slashes, and unicode symbols into percent notation." },
      { step: 4, title: "Copy Sanitized Link", description: "Copy the URL string ready for API endpoints, redirect links, or query parameters." },
    ],
    specs: {
      supportedFormats: "URL strings, URI components, Query parameters",
      outputFormat: "Percent-encoded or Decoded URL string",
      maxLimit: "Unlimited string length",
      processingType: "Standard RFC 3986 In-Browser URI Encoder",
      privacyNote: "100% Local execution in browser memory.",
    },
    goodToKnow: [
      "Prevents broken API queries and 400 Bad Request errors caused by unencoded query strings.",
      "Supports full URI encoding as well as granular encodeURIComponent component mode.",
    ],
    relatedToolIds: ['base64-converter', 'qr-code-generator', 'json-formatter'],
  },

  'uuid-generator': {
    howItWorks: [
      { step: 1, title: "Select Identifier Type", description: "Choose RFC 4122 UUID v4 (cryptographically random) or short alphanumeric tokens." },
      { step: 2, title: "Set Batch Quantity", description: "Select how many unique IDs to generate (from 1 to 100 in a single click)." },
      { step: 3, title: "Format Output", description: "Toggle uppercase/lowercase letters, hyphens, or wrap IDs in quotes for SQL/JSON." },
      { step: 4, title: "Copy UUIDs", description: "Copy individual IDs or copy the entire batch list for database seeding and testing." },
    ],
    specs: {
      supportedFormats: "Configurable format options (Hyphens, Uppercase, Quotes)",
      outputFormat: "UUID v4 (36-character hexadecimal string) or Short ID",
      maxLimit: "Up to 500 IDs per generation",
      processingType: "Web Crypto API crypto.getRandomValues()",
      privacyNote: "Hardware-backed cryptographically secure pseudo-randomness.",
    },
    goodToKnow: [
      "Uses cryptographically secure hardware entropy for near-zero probability of UUID collision.",
      "Ideal for primary keys in PostgreSQL, MongoDB, distributed systems, and API tracking tokens.",
    ],
    relatedToolIds: ['password-generator', 'hash-generator', 'random-number-generator'],
  },

  'hash-generator': {
    howItWorks: [
      { step: 1, title: "Enter Text or Upload File", description: "Input any string, password, message, or select a file from your device." },
      { step: 2, title: "Select Algorithm", description: "Choose SHA-256, SHA-512, SHA-1, or MD5 cryptographic hashing." },
      { step: 3, title: "Compute Digest", description: "The cryptographic engine calculates the unique, one-way deterministic checksum." },
      { step: 4, title: "Copy Checksum", description: "Copy the hexadecimal hash string for file verification, security audits, and integrity checks." },
    ],
    specs: {
      supportedFormats: "Plain text, Passwords, Any file format",
      outputFormat: "Hexadecimal Hash Digest (SHA-256, SHA-512, SHA-1, MD5)",
      maxLimit: "Up to 100MB file verification",
      processingType: "Web Crypto Subtitle API & In-Browser Hash Engine",
      privacyNote: "100% Client-Side. Passwords and file contents are never transmitted.",
    },
    goodToKnow: [
      "Verify that downloaded files match the author's published SHA-256 checksum to guarantee safety.",
      "Cryptographic hashes are one-way functions: the original plaintext cannot be reverse-engineered.",
    ],
    relatedToolIds: ['password-generator', 'file-info-inspector', 'uuid-generator'],
  },

  'password-generator': {
    howItWorks: [
      { step: 1, title: "Choose Character Length", description: "Select your target password length from 8 to 64 characters (16+ recommended)." },
      { step: 2, title: "Configure Character Pools", description: "Toggle Uppercase (A-Z), Lowercase (a-z), Numbers (0-9), and Symbols (!@#$%^&*)." },
      { step: 3, title: "Exclude Ambiguous Chars", description: "Optionally exclude lookalike characters (such as 1, l, I, 0, O) to prevent typing mistakes." },
      { step: 4, title: "Generate & Copy", description: "Generate high-entropy passwords using hardware cryptographic randomness and copy with one click." },
    ],
    specs: {
      supportedFormats: "Configurable character pools & rules",
      outputFormat: "Cryptographically Secure Password String",
      maxLimit: "Length from 6 to 128 characters",
      processingType: "Web Crypto API crypto.getRandomValues()",
      privacyNote: "100% Client-Side. Generated passwords are never logged, cached, or uploaded.",
    },
    goodToKnow: [
      "Generates over 100 bits of entropy on 16+ character passwords for uncrackable defense.",
      "Copying is secured with auto-clearing clipboard feedback to protect sensitive credentials.",
    ],
    relatedToolIds: ['password-strength', 'hash-generator', 'uuid-generator'],
  },

  'password-strength': {
    howItWorks: [
      { step: 1, title: "Enter Password", description: "Type or paste the password into the private, client-side evaluation field." },
      { step: 2, title: "Calculate Entropy", description: "The security engine measures total bits of entropy, character pool size, and length." },
      { step: 3, title: "Estimate Crack Time", description: "Simulates brute-force cracking durations across standard PCs and modern GPU clusters." },
      { step: 4, title: "Review Recommendations", description: "Inspect actionable suggestions to patch vulnerabilities and improve password resilience." },
    ],
    specs: {
      supportedFormats: "Password strings",
      outputFormat: "Entropy score, Crack duration estimate, Security checklist",
      maxLimit: "Any password length",
      processingType: "Client-Side Shannon Entropy & Pattern Analyzer",
      privacyNote: "100% Private local calculation. Passwords never leave your device.",
    },
    goodToKnow: [
      "Detects common dictionary patterns, repeated sequences (123456), and dictionary substitutions.",
      "Helps you verify master passwords for password managers before committing to them.",
    ],
    relatedToolIds: ['password-generator', 'hash-generator', 'security-utilities'],
  },

  'random-number-generator': {
    howItWorks: [
      { step: 1, title: "Define Range", description: "Set your minimum and maximum values (e.g. 1 to 100, or any custom range)." },
      { step: 2, title: "Choose Count & Uniqueness", description: "Pick how many numbers to generate and toggle unique (no duplicates) mode." },
      { step: 3, title: "Generate Random Numbers", description: "Uses hardware cryptographic entropy to ensure true, unbiased uniform distribution." },
      { step: 4, title: "Sort or Copy", description: "Sort numbers ascending/descending, copy the formatted list, or re-roll instantly." },
    ],
    specs: {
      supportedFormats: "Integer and decimal range boundaries",
      outputFormat: "Single Number or Formatted List",
      maxLimit: "Up to 1,000 numbers per roll",
      processingType: "Web Crypto API crypto.getRandomValues()",
      privacyNote: "100% Client-Side hardware entropy.",
    },
    goodToKnow: [
      "Eliminates the pseudo-random mathematical bias found in standard Math.random() calls.",
      "Perfect for lotteries, classroom draws, randomized experiments, and giveaway selections.",
    ],
    relatedToolIds: ['password-generator', 'calculator', 'uuid-generator'],
  },

  'file-info-inspector': {
    howItWorks: [
      { step: 1, title: "Upload Any File", description: "Select any document, image, audio, video, archive, or code file from your device." },
      { step: 2, title: "Inspect Technical Attributes", description: "View exact byte size, detected MIME type, file extension, and modification date." },
      { step: 3, title: "Generate SHA-256 Checksum", description: "Calculates the cryptographic SHA-256 integrity hash directly in your browser." },
      { step: 4, title: "Verify Magic Numbers", description: "Inspects binary header magic numbers to identify the true underlying file format." },
    ],
    specs: {
      supportedFormats: "Any file format (PDF, Images, Zip, Office, Media, Executables)",
      outputFormat: "Technical Metadata Breakdown & SHA-256 Hash",
      maxLimit: "Up to 200MB file size",
      processingType: "In-Browser File API & Binary Magic Byte Analyzer",
      privacyNote: "100% Client-Side. Files are inspected locally without network transmission.",
    },
    goodToKnow: [
      "Exposes disguised file extensions (e.g. an executable renamed to .jpg) via magic byte checking.",
      "Calculates SHA-256 hashes to verify that downloaded archives have not been tampered with.",
    ],
    relatedToolIds: ['pdf-inspector', 'image-info', 'hash-generator'],
  },

  'aspect-ratio-calculator': {
    howItWorks: [
      { step: 1, title: "Enter Original Dimensions", description: "Input your original width and height in pixels, centimeters, or inches." },
      { step: 2, title: "Detect Simplified Ratio", description: "The math engine calculates the greatest common divisor to display standard ratios (16:9, 4:3, 1:1)." },
      { step: 3, title: "Calculate Scaled Dimensions", description: "Type a new target width to find the proportional height, or enter height to find width." },
      { step: 4, title: "Copy Proportions", description: "Copy the scaled pixel dimensions for web responsive design, video encoding, or banner design." },
    ],
    specs: {
      supportedFormats: "Pixel and measurement dimensions",
      outputFormat: "Simplified Aspect Ratio (W:H) and Scaled Dimensions",
      maxLimit: "Unlimited numerical dimensions",
      processingType: "In-Browser Euclidean GCD Math Engine",
      privacyNote: "100% Private local calculation.",
    },
    goodToKnow: [
      "Prevents squashed or stretched visuals when resizing images and video containers for web displays.",
      "Includes quick presets for 16:9 HD video, 4:3 standard, 21:9 ultrawide, and 9:16 mobile stories.",
    ],
    relatedToolIds: ['image-cropper', 'image-resizer', 'unit-converter'],
  },

  'color-converter': {
    howItWorks: [
      { step: 1, title: "Input Color", description: "Enter any color code in HEX (#4f46e5), RGB, HSL, or standard CSS color name." },
      { step: 2, title: "Simultaneous Conversion", description: "The color engine computes corresponding values across HEX, RGB, HSL, HSV, and CMYK." },
      { step: 3, title: "Inspect Visual Swatch", description: "Preview the color swatch, contrast readability score against white/black, and complementary tones." },
      { step: 4, title: "Copy Code", description: "One-click copy the color in your preferred format for CSS stylesheets, Tailwind, or Figma." },
    ],
    specs: {
      supportedFormats: "HEX, RGB, RGBA, HSL, HSLA, HSV, CMYK, CSS Color Names",
      outputFormat: "Multi-format color codes and WCAG contrast ratio",
      maxLimit: "Full 16.7M sRGB color gamut",
      processingType: "Client-Side Colorimetric Transformation Engine",
      privacyNote: "100% Local calculation.",
    },
    goodToKnow: [
      "Calculates WCAG contrast ratios to ensure your text colors meet AA/AAA accessibility standards.",
      "Generates matching shades, tints, and complementary colors automatically for palette design.",
    ],
    relatedToolIds: ['image-color-picker', 'image-text', 'whiteboard'],
  },
};

/**
 * Fallback generic guide for any specialized tool not individually listed above
 */
export function getToolGuide(toolId: string, toolCategory: string, toolName: string): ToolGuideData {
  if (TOOL_GUIDES[toolId]) {
    return TOOL_GUIDES[toolId];
  }

  return {
    howItWorks: [
      { step: 1, title: 'Upload File', description: `Select or drop your file to begin using ${toolName}.` },
      { step: 2, title: 'Configure Options', description: 'Adjust processing settings and preferences to match your requirements.' },
      { step: 3, title: 'Process Locally', description: 'The local engine processes your file directly inside your browser.' },
      { step: 4, title: 'Save Result', description: 'Download your finalized file with zero server retention.' },
    ],
    specs: {
      supportedFormats: 'PDF, Images, Documents',
      outputFormat: 'Processed Deliverable',
      maxLimit: 'Up to 100MB per file',
      processingType: 'In-Browser WebAssembly / HTML5 Canvas Engine',
      privacyNote: '100% Client-Side. Files remain strictly inside local browser memory streams.',
    },
    goodToKnow: [
      'All processing runs locally on your device for instant speed and complete privacy.',
      'No data is uploaded or permanently retained on remote servers.',
    ],
    relatedToolIds: ['normalize-pdf-page-size', 'merge-pdf', 'compress-pdf', 'pdf-to-word'],
  };
}
