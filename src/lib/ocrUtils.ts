import { createWorker } from 'tesseract.js';
import { loadPdfDocument, renderPageToImageDataUrl } from './pdfRenderer';
import { textToPdf } from './docUtils';

export type OcrLanguage = 'eng' | 'ben' | 'ara';

export const OCR_LANGUAGES: { id: OcrLanguage; name: string; nativeName: string }[] = [
  { id: 'eng', name: 'English', nativeName: 'English' },
  { id: 'ben', name: 'Bengali', nativeName: 'বাংলা' },
  { id: 'ara', name: 'Arabic', nativeName: 'العربية' },
];

export interface OcrProgress {
  status: string;
  progress: number; // 0 to 1
  currentPage: number;
  totalPages: number;
}

export async function performOcr(
  file: File | Blob,
  language: OcrLanguage = 'eng',
  onProgress?: (progress: OcrProgress) => void
): Promise<{ text: string; confidence?: number; searchablePdfBlob?: Blob }> {
  const isPdf =
    file.type === 'application/pdf' ||
    ('name' in file && typeof file.name === 'string' && file.name.toLowerCase().endsWith('.pdf'));

  const worker = await createWorker(language, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress({
          status: 'Recognizing text...',
          progress: m.progress,
          currentPage: 1,
          totalPages: 1,
        });
      }
    },
  });

  try {
    let fullText = '';
    let totalConfidence = 0;
    let confidenceCount = 0;

    if (isPdf) {
      const buffer = await file.arrayBuffer();
      const pdf = await loadPdfDocument(buffer);
      const numPages = pdf.numPages;

      for (let p = 1; p <= numPages; p++) {
        if (onProgress) {
          onProgress({
            status: `Rendering page ${p} of ${numPages}...`,
            progress: (p - 1) / numPages,
            currentPage: p,
            totalPages: numPages,
          });
        }

        const dataUrl = await renderPageToImageDataUrl(pdf, p, 1600);
        const { data } = await worker.recognize(dataUrl);

        fullText += `\n--- Page ${p} ---\n` + data.text + '\n';
        if (typeof data.confidence === 'number') {
          totalConfidence += data.confidence;
          confidenceCount++;
        }
      }
    } else {
      if (onProgress) {
        onProgress({
          status: 'Analyzing image...',
          progress: 0.2,
          currentPage: 1,
          totalPages: 1,
        });
      }

      const { data } = await worker.recognize(file);
      fullText = data.text;
      if (typeof data.confidence === 'number') {
        totalConfidence = data.confidence;
        confidenceCount = 1;
      }
    }

    const avgConfidence = confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : undefined;
    const pdfBytes = await textToPdf(fullText, 'OCR Extracted Document');
    const searchablePdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

    return {
      text: fullText.trim(),
      confidence: avgConfidence,
      searchablePdfBlob,
    };
  } finally {
    await worker.terminate();
  }
}
