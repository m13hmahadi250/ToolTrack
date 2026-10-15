import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, File as FileIcon, AlertCircle, Shield, X } from 'lucide-react';
import { validateFile } from '../../lib/fileValidator';
import type { ValidationResult } from '../../types';

interface FileUploaderProps {
  acceptedFormats: string[];
  multiple?: boolean;
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  title?: string;
  description?: string;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  acceptedFormats,
  multiple = false,
  maxFiles = 10,
  onFilesSelected,
  title = 'Drop your files here',
  description = 'or browse from your device',
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [validating, setValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard paste support
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const files = Array.from(e.clipboardData.files);
        await processAndValidateFiles(files);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [acceptedFormats, multiple, maxFiles]);

  // Escape key handler to clear errors or cancel file selection state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (errorMessage || warningMessage) {
          setErrorMessage(null);
          setWarningMessage(null);
        }
        if (isDragging) {
          setIsDragging(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [errorMessage, warningMessage, isDragging]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await processAndValidateFiles(files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await processAndValidateFiles(files);
      // Reset input value to allow re-uploading the same file if needed
      e.target.value = '';
    }
  };

  const processAndValidateFiles = async (files: File[]) => {
    setErrorMessage(null);
    setWarningMessage(null);
    setValidating(true);

    try {
      let targetFiles = files;
      if (!multiple && targetFiles.length > 1) {
        targetFiles = [targetFiles[0]];
      } else if (targetFiles.length > maxFiles) {
        setWarningMessage(`Maximum ${maxFiles} files allowed. Only first ${maxFiles} were selected.`);
        targetFiles = targetFiles.slice(0, maxFiles);
      }

      const validFiles: File[] = [];

      for (let file of targetFiles) {
        // If file has no extension (e.g. pasted blob), assign an appropriate extension based on MIME type
        const hasExt = file.name.includes('.');
        let ext = hasExt ? `.${file.name.split('.').pop()?.toLowerCase()}` : '';
        const mime = file.type?.toLowerCase() || '';

        if (!hasExt && mime.startsWith('image/')) {
          const sub = mime.split('/')[1]?.toLowerCase() || 'png';
          ext = `.${sub === 'jpeg' ? 'jpg' : sub}`;
          file = new File([file], `image-${Date.now()}${ext}`, { type: file.type });
        }

        const isImage = mime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.svg'].includes(ext);
        const acceptsImages = acceptedFormats.some((f) =>
          ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.svg'].includes(f.toLowerCase())
        );

        const isExtMatch =
          acceptedFormats.includes(ext) ||
          acceptedFormats.includes('*') ||
          (ext === '.jpeg' && acceptedFormats.includes('.jpg')) ||
          (isImage && acceptsImages);

        if (!isExtMatch) {
          setErrorMessage(
            `"${file.name}" has an unsupported format. Supported: ${acceptedFormats.join(', ')}`
          );
          setValidating(false);
          return;
        }

        const validation: ValidationResult = await validateFile(file);

        if (!validation.valid) {
          setErrorMessage(`"${file.name}": ${validation.error || 'Validation failed'}`);
          setValidating(false);
          return;
        }

        if (validation.warning) {
          setWarningMessage(validation.warning);
        }

        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    } catch {
      setErrorMessage('An unexpected error occurred while reading the file.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files area. Drag and drop or press Enter to browse files."
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none ${
          isDragging
            ? 'border-[#2563EB] bg-[#EAF1FF]/80 dark:bg-[#172338]/90 scale-[1.01]'
            : 'border-[#DCE3EF] dark:border-[#1E2D47] hover:border-[#2563EB] dark:hover:border-[#3B82F6] bg-white dark:bg-[#111C2E] hover:bg-[#F5F8FF]/80 dark:hover:bg-[#172338]/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedFormats.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          aria-hidden="true"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isDragging
                ? 'bg-[#2563EB] text-white shadow-xl shadow-[#2563EB]/40 scale-110 ring-4 ring-[#2563EB]/30'
                : 'bg-[#EAF1FF] dark:bg-[#172338] text-[#2563EB] dark:text-[#3B82F6] group-hover:scale-105 group-hover:bg-[#2563EB] group-hover:text-white dark:group-hover:bg-[#2563EB] dark:group-hover:text-white'
            }`}
          >
            {validating ? (
              <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <UploadCloud className={`w-8 h-8 transition-transform duration-300 ${isDragging ? '-translate-y-1' : ''}`} />
            )}
          </div>

          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-base sm:text-lg font-bold text-[#101828] dark:text-[#F2F4F7] tracking-tight">
              {isDragging ? 'Drop your file right here' : title}
            </h3>
            <p className="text-xs sm:text-sm text-[#344054] dark:text-[#B8C4D6]">
              <span className="font-semibold text-[#2563EB] dark:text-[#3B82F6] underline underline-offset-2">
                Browse Files
              </span>{' '}
              {description}
            </p>
            <div className="pt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#667085] dark:text-[#8292A9]">
                <span>or paste with</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-[#EAF1FF] dark:bg-[#172338] border border-[#DCE3EF] dark:border-[#1E2D47] rounded text-[#344054] dark:text-[#B8C4D6]">
                  Ctrl + V
                </kbd>
              </span>
            </div>
          </div>

          {/* Formats badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
            {acceptedFormats.map((fmt) => (
              <span
                key={fmt}
                className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#EAF1FF] dark:bg-[#172338] text-[#101828] dark:text-[#F2F4F7] border border-[#DCE3EF] dark:border-[#1E2D47]"
              >
                {fmt.replace('.', '')}
              </span>
            ))}
            <span className="text-[11px] font-medium text-[#667085] dark:text-[#8292A9] px-1">
              (Up to 150 MB{multiple ? `, max ${maxFiles} files` : ''})
            </span>
          </div>
        </div>
      </div>

      {/* Security notice banner */}
      <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-[#344054] dark:text-[#B8C4D6]">
        <Shield className="w-3.5 h-3.5 text-[#15803D] dark:text-emerald-400 shrink-0" />
        <span>Your files are processed locally in your browser. Complete privacy guaranteed.</span>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mt-4 p-4 rounded-2xl bg-rose-50/95 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900/60 shadow-sm flex items-start justify-between gap-3.5 text-rose-900 dark:text-rose-200 text-xs sm:text-sm animate-in fade-in duration-150">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-xs uppercase tracking-wide text-rose-800 dark:text-rose-300">Upload Issue</p>
              <p className="font-medium text-rose-700 dark:text-rose-200 text-xs sm:text-sm leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer transition shrink-0"
            aria-label="Dismiss error"
            title="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Warning Banner */}
      {warningMessage && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 flex items-start justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs sm:text-sm animate-in fade-in duration-150">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span className="font-medium">{warningMessage}</span>
          </div>
          <button
            onClick={() => setWarningMessage(null)}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 p-0.5 cursor-pointer"
            aria-label="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
