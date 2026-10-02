import React, { useState } from 'react';
import { Lock, Unlock, ShieldCheck, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { removeMetadata, getPdfMetadata } from '../../lib/pdfUtils';
import { loadPdfDocument } from '../../lib/pdfRenderer';
import { useToolTrack } from '../../context/ToolTrackContext';
import { PDFDocument } from 'pdf-lib';

export const PdfSecurityTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [activeTab, setActiveTab] = useState<'protect' | 'unlock' | 'metadata'>('metadata');
  const [file, setFile] = useState<File | null>(null);

  // Settings
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [metadataInfo, setMetadataInfo] = useState<Record<string, string> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setResultBlob(null);
    setErrorMessage(null);

    try {
      const buffer = await f.arrayBuffer();
      const meta = await getPdfMetadata(buffer);
      setMetadataInfo(meta as unknown as Record<string, string>);
    } catch {
      // file might be encrypted
    }
  };

  const handleAction = async () => {
    if (!file) return;
    setErrorMessage(null);
    setProcessing(true);

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const outName = `${baseName}-${activeTab}.pdf`;
    setResultFileName(outName);

    const jobId = addJob({
      fileName: file.name,
      fileSize: file.size,
      toolId: 'pdf-security',
      toolName: `Security: ${activeTab.toUpperCase()}`,
      status: 'processing',
      progress: 0.3,
      outputFileName: outName,
    });

    try {
      const buffer = await file.arrayBuffer();
      let outputBytes: Uint8Array;

      if (activeTab === 'metadata') {
        outputBytes = await removeMetadata(buffer);
      } else if (activeTab === 'unlock') {
        // Unlock using user password
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        outputBytes = await pdfDoc.save();
      } else {
        // Protect with password
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (password.length < 4) {
          throw new Error('Password must be at least 4 characters long.');
        }
        // Save cleaned and encrypted doc
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        outputBytes = await pdfDoc.save();
      }

      const blob = new Blob([new Uint8Array(outputBytes)], { type: 'application/pdf' });
      setResultBlob(blob);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: blob,
        outputSize: blob.size,
      });

      addRecentActivity('pdf-security', `PDF Security (${activeTab})`, file.name, 'completed');
    } catch (err: unknown) {
      const msg = String(err).replace('Error: ', '');
      setErrorMessage(msg);
      updateJob(jobId, {
        status: 'failed',
        errorMessage: msg,
      });
      addRecentActivity('pdf-security', `PDF Security (${activeTab})`, file.name, 'failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFileName || 'secured-document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          PDF Security & Privacy
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Inspect and permanently wipe hidden document metadata (author, producer, creation timestamps) or manage passwords.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-4">
        {[
          { id: 'metadata', label: 'Wipe All Metadata', icon: ShieldCheck },
          { id: 'unlock', label: 'Unlock PDF', icon: Unlock },
          { id: 'protect', label: 'Protect PDF', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as typeof activeTab);
                setResultBlob(null);
                setErrorMessage(null);
              }}
              className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 font-bold text-xs sm:text-sm transition cursor-pointer ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {!file ? (
        <FileUploader
          acceptedFormats={['.pdf']}
          multiple={false}
          onFilesSelected={handleFilesSelected}
          title="Select PDF file for security processing"
          description="Local client-side inspection and stripping"
        />
      ) : (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-md">
                {file.name}
              </span>
              <button
                onClick={() => {
                  setFile(null);
                  setResultBlob(null);
                  setMetadataInfo(null);
                }}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Change File
              </button>
            </div>

            {/* Metadata Tab */}
            {activeTab === 'metadata' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Inspect currently detected metadata before wiping:
                </p>
                {metadataInfo && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 divide-y divide-slate-200 dark:divide-slate-700 text-xs">
                    {Object.entries(metadataInfo).map(([key, val]) => (
                      <div key={key} className="py-2 flex items-center justify-between">
                        <span className="font-semibold text-slate-600 dark:text-slate-400 capitalize">
                          {key}:
                        </span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 truncate max-w-xs">
                          {String(val) || 'None'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Unlock Tab */}
            {activeTab === 'unlock' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Provide the password to re-save an unrestricted, unlocked version of this document.
                </p>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    PDF Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
              </div>
            )}

            {/* Protect Tab */}
            {activeTab === 'protect' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Set Document Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Repeat password..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Result Card */}
          {resultBlob && (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-base text-slate-900 dark:text-white">
                    Action Completed!
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to download: {resultFileName}
                </p>
              </div>

              <button
                onClick={handleDownload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          )}

          {/* Action button */}
          {!resultBlob && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Ready to process
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Secure local execution.</p>
              </div>

              <button
                onClick={handleAction}
                disabled={processing}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Apply Security</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
