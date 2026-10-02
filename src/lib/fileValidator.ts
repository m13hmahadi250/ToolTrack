import { PDFDocument } from 'pdf-lib';
import type { ValidationResult } from '../types';

export async function validateFile(file: File): Promise<ValidationResult> {
  const maxSize = 150 * 1024 * 1024; // 150 MB client limit
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum browser limit is 150 MB.`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty (0 bytes). Please upload a valid document or image.',
    };
  }

  // Read first 16 bytes for magic bytes signature
  const slice = file.slice(0, 16);
  const buffer = await slice.arrayBuffer();
  const header = new Uint8Array(buffer);
  const headerString = String.fromCharCode(...header.slice(0, 8));

  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  // Check PDF signature
  if (ext === 'pdf' || headerString.startsWith('%PDF')) {
    if (!headerString.startsWith('%PDF')) {
      return {
        valid: false,
        error: 'Invalid PDF format: file does not contain a valid %PDF header signature.',
      };
    }

    try {
      const fullBuffer = await file.arrayBuffer();
      try {
        const pdf = await PDFDocument.load(fullBuffer, { ignoreEncryption: false });
        return {
          valid: true,
          mimeType: 'application/pdf',
          fileSignature: 'PDF Document',
          pageCount: pdf.getPageCount(),
          isEncrypted: false,
        };
      } catch (err: unknown) {
        const msg = String(err).toLowerCase();
        if (msg.includes('encrypt') || msg.includes('password')) {
          return {
            valid: true,
            mimeType: 'application/pdf',
            fileSignature: 'Encrypted PDF',
            isEncrypted: true,
            warning: 'This PDF is encrypted with a password.',
          };
        }
        return {
          valid: false,
          error: 'Unable to parse PDF. The file may be damaged or corrupted.',
        };
      }
    } catch {
      return {
        valid: false,
        error: 'Failed to read PDF file.',
      };
    }
  }

  // Check Image signatures
  const isJpeg = header[0] === 0xff && header[1] === 0xd8;
  const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
  const isWebp = headerString.slice(0, 4) === 'RIFF';
  const isBmp = header[0] === 0x42 && header[1] === 0x4d;

  const isImageFile =
    ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'svg'].includes(ext) ||
    file.type.startsWith('image/');

  if (isImageFile) {
    if (ext === 'png' && !isPng && header.length >= 4) {
      return { valid: false, error: 'PNG header signature mismatch. File might be corrupted.' };
    }
    if ((ext === 'jpg' || ext === 'jpeg') && !isJpeg && header.length >= 2) {
      return { valid: false, error: 'JPEG header signature mismatch. File might be corrupted.' };
    }
    return {
      valid: true,
      mimeType: file.type || (ext ? `image/${ext}` : 'image/png'),
      fileSignature: ext ? `${ext.toUpperCase()} Image` : 'Image',
    };
  }

  // Documents
  if (['docx', 'xlsx', 'csv', 'txt'].includes(ext)) {
    return {
      valid: true,
      mimeType: file.type || 'application/octet-stream',
      fileSignature: `${ext.toUpperCase()} Document`,
    };
  }

  return {
    valid: true,
    mimeType: file.type,
    fileSignature: ext ? ext.toUpperCase() : 'Unknown Format',
  };
}
