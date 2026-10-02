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
