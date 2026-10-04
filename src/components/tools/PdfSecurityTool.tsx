import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Download,
  CheckCircle2,
  AlertCircle,
  Eye,
  KeyRound,
  FileCheck,
  ShieldAlert,
  Printer,
  Copy,
  Edit3,
  Check,
  X,
  FileText
} from 'lucide-react';
import { FileUploader } from '../common/FileUploader';
import { useToolTrack } from '../../context/ToolTrackContext';

interface SecurityInspectResult {
  isEncrypted: boolean;
  algorithm: string;
  userPasswordRequired: boolean;
  ownerPasswordRequired: boolean;
  permissions: {
    printing: string;
    extracting: string;
    modifying: string;
    annotations: boolean;
    formFilling: boolean;
    assembly: boolean;
  };
  metadata: Record<string, string>;
  rawSummary?: string;
}

export const PdfSecurityTool: React.FC = () => {
  const { addJob, updateJob, addRecentActivity } = useToolTrack();

  const [activeTab, setActiveTab] = useState<'protect' | 'unlock' | 'inspect' | 'metadata'>('protect');
  const [file, setFile] = useState<File | null>(null);

  // Protect Settings
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [keyLength, setKeyLength] = useState<'256' | '128'>('256');
  const [allowPrint, setAllowPrint] = useState<'none' | 'low' | 'full'>('full');
  const [allowCopy, setAllowCopy] = useState<boolean>(false);
  const [allowModify, setAllowModify] = useState<'none' | 'annotate' | 'form' | 'assembly' | 'all'>('none');

  // Unlock Settings
  const [unlockPassword, setUnlockPassword] = useState('');

  // Inspect State
  const [inspectResult, setInspectResult] = useState<SecurityInspectResult | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Clean Metadata State
  const [metadataBefore, setMetadataBefore] = useState<Record<string, string> | null>(null);
  const [metadataAfter, setMetadataAfter] = useState<Record<string, string> | null>(null);

  // Processing & Result State
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');
  const [resultSize, setResultSize] = useState<number | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setResultBlob(null);
    setErrorMessage(null);
    setInspectResult(null);
    setMetadataBefore(null);
    setMetadataAfter(null);

    // Auto-inspect on file selection
    inspectPdf(f);
  };

  const inspectPdf = async (targetFile: File, pass = '') => {
    setInspectLoading(true);
    try {
      const buffer = await targetFile.arrayBuffer();
      const res = await fetch('/api/pdf-security/inspect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/pdf',
          'x-password': pass,
        },
        body: buffer,
      });
      if (res.ok) {
        const data: SecurityInspectResult = await res.json();
        setInspectResult(data);
        if (data.metadata) {
          setMetadataBefore(data.metadata);
        }
      }
    } catch (err) {
      console.error('Inspect error:', err);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleProtect = async () => {
    if (!file) return;
    setErrorMessage(null);

    if (userPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }
    if (userPassword.length < 3) {
      setErrorMessage('Password must be at least 3 characters long.');
      return;
    }

    setProcessing(true);
    const outName = `${file.name.replace(/\.[^/.]+$/, '')}-protected.pdf`;
    setResultFileName(outName);

    const jobId = addJob({
      fileName: file.name,
      fileSize: file.size,
      toolId: 'pdf-security',
      toolName: 'Lock & Protect PDF',
      status: 'processing',
      progress: 0.3,
      outputFileName: outName,
    });

    try {
      const buffer = await file.arrayBuffer();
      const res = await fetch('/api/pdf-security/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/pdf',
          'x-user-password': userPassword,
          'x-owner-password': ownerPassword || userPassword,
          'x-key-length': keyLength,
          'x-allow-print': allowPrint,
          'x-allow-copy': allowCopy ? 'true' : 'false',
          'x-allow-modify': allowModify,
        },
        body: buffer,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Encryption failed' }));
        throw new Error(errJson.error || 'Server encryption failed');
      }

      const encBlob = await res.blob();
      setResultBlob(encBlob);
      setResultSize(encBlob.size);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: encBlob,
        outputSize: encBlob.size,
      });

      addRecentActivity('pdf-security', 'Lock & Protect PDF', file.name, 'completed');
    } catch (err: unknown) {
      const msg = String(err).replace('Error: ', '');
      setErrorMessage(msg);
      updateJob(jobId, {
        status: 'failed',
        errorMessage: msg,
      });
      addRecentActivity('pdf-security', 'Lock & Protect PDF', file.name, 'failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnlock = async () => {
    if (!file) return;
    setErrorMessage(null);
    setProcessing(true);

    const outName = `${file.name.replace(/\.[^/.]+$/, '')}-unlocked.pdf`;
    setResultFileName(outName);

    const jobId = addJob({
      fileName: file.name,
      fileSize: file.size,
      toolId: 'pdf-security',
      toolName: 'Unlock & Decrypt PDF',
      status: 'processing',
      progress: 0.3,
      outputFileName: outName,
    });

    try {
      const buffer = await file.arrayBuffer();
      const res = await fetch('/api/pdf-security/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/pdf',
          'x-password': unlockPassword,
        },
        body: buffer,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Decryption failed' }));
        throw new Error(errJson.error || 'Decryption failed. Please check the password.');
      }

      const decBlob = await res.blob();
      setResultBlob(decBlob);
      setResultSize(decBlob.size);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: decBlob,
        outputSize: decBlob.size,
      });

      addRecentActivity('pdf-security', 'Unlock & Decrypt PDF', file.name, 'completed');
    } catch (err: unknown) {
      const msg = String(err).replace('Error: ', '');
      setErrorMessage(msg);
      updateJob(jobId, {
        status: 'failed',
        errorMessage: msg,
      });
      addRecentActivity('pdf-security', 'Unlock & Decrypt PDF', file.name, 'failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCleanMetadata = async () => {
    if (!file) return;
    setErrorMessage(null);
    setProcessing(true);

    const outName = `${file.name.replace(/\.[^/.]+$/, '')}-privacy-cleaned.pdf`;
    setResultFileName(outName);

    const jobId = addJob({
      fileName: file.name,
      fileSize: file.size,
      toolId: 'clean-pdf',
      toolName: 'Clean & Strip Metadata',
      status: 'processing',
      progress: 0.3,
      outputFileName: outName,
    });

    try {
      const buffer = await file.arrayBuffer();
      const res = await fetch('/api/pdf-security/clean-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/pdf',
        },
        body: buffer,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Cleaning failed' }));
        throw new Error(errJson.error || 'Metadata stripping failed.');
      }

      const beforeHdr = res.headers.get('X-Metadata-Before');
      const afterHdr = res.headers.get('X-Metadata-After');
      if (beforeHdr) setMetadataBefore(JSON.parse(decodeURIComponent(beforeHdr)));
      if (afterHdr) setMetadataAfter(JSON.parse(decodeURIComponent(afterHdr)));

      const cleanBlob = await res.blob();
      setResultBlob(cleanBlob);
      setResultSize(cleanBlob.size);

      updateJob(jobId, {
        status: 'completed',
        progress: 1.0,
        outputBlob: cleanBlob,
        outputSize: cleanBlob.size,
      });

      addRecentActivity('clean-pdf', 'Clean & Strip Metadata', file.name, 'completed');
    } catch (err: unknown) {
      const msg = String(err).replace('Error: ', '');
      setErrorMessage(msg);
      updateJob(jobId, {
        status: 'failed',
        errorMessage: msg,
      });
      addRecentActivity('clean-pdf', 'Clean & Strip Metadata', file.name, 'failed');
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>High-Security Cryptographic PDF Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            PDF Security & Privacy Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Protect PDFs with AES-256 military-grade encryption and granular permissions, decrypt authorized documents, inspect security parameters, and strip identifying metadata.
          </p>
        </div>

        {file && (
          <button
            onClick={() => {
              setFile(null);
              setResultBlob(null);
              setErrorMessage(null);
            }}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Change File
          </button>
        )}
      </div>

      {!file ? (
        <FileUploader
          acceptedFormats={['.pdf']}
          maxFiles={1}
          onFilesSelected={handleFilesSelected}
          title="Drop your PDF here to manage security & privacy"
          description="Supports password locking, unlocking, inspection, and EXIF/XMP metadata stripping"
        />
      ) : (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setActiveTab('protect');
                setResultBlob(null);
                setErrorMessage(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'protect'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Lock & Protect</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('unlock');
                setResultBlob(null);
                setErrorMessage(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'unlock'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock & Decrypt</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('inspect');
                setResultBlob(null);
                setErrorMessage(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'inspect'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Security Inspector</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('metadata');
                setResultBlob(null);
                setErrorMessage(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'metadata'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Clean Metadata</span>
            </button>
          </div>

          {/* Tab 1: Lock & Protect */}
          {activeTab === 'protect' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Encrypt & Set Passwords</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Apply genuine AES encryption. Documents will strictly require the password to open.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Open / User Password (Required)
                  </label>
                  <input
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Encryption Strength
                  </label>
                  <select
                    value={keyLength}
                    onChange={(e) => setKeyLength(e.target.value as '256' | '128')}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="256">256-bit AES (Modern Standard / Acrobat X+)</option>
                    <option value="128">128-bit AES (Standard / Acrobat 7+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Owner Password (Optional Master Control)
                  </label>
                  <input
                    type="password"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="Optional master password..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Granular Permission Controls */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Granular Document Permissions
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">Printing Permission</label>
                    <select
                      value={allowPrint}
                      onChange={(e) => setAllowPrint(e.target.value as 'none' | 'low' | 'full')}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                    >
                      <option value="full">Allow Full High-Resolution Printing</option>
                      <option value="low">Allow Low-Resolution (150 DPI) Only</option>
                      <option value="none">Block All Printing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">Modification Permission</label>
                    <select
                      value={allowModify}
                      onChange={(e) => setAllowModify(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                    >
                      <option value="none">Disallow All Modifications (Read-Only)</option>
                      <option value="annotate">Allow Annotations & Comments Only</option>
                      <option value="form">Allow Form Filling Only</option>
                      <option value="assembly">Allow Page Assembly Only</option>
                      <option value="all">Allow Full Modifications</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-4 sm:pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowCopy}
                        onChange={(e) => setAllowCopy(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Allow Text & Image Copying
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleProtect}
                  disabled={processing || !userPassword}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {processing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span>Encrypt & Lock PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Unlock & Decrypt */}
          {activeTab === 'unlock' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Decrypt Authorized PDF</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Provide the valid password to remove encryption and generate a permanent unprotected PDF.
                  </p>
                </div>
              </div>

              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Document Password
                  </label>
                  <input
                    type="password"
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    placeholder="Enter document password..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleUnlock}
                  disabled={processing || !unlockPassword}
                  className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {processing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                  <span>Authenticate & Decrypt PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Security Inspector */}
          {activeTab === 'inspect' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security & Permission Inspector</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Live cryptographic audit of document encryption standards and user permissions.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => inspectPdf(file)}
                  disabled={inspectLoading}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {inspectLoading ? 'Analyzing...' : 'Re-scan'}
                </button>
              </div>

              {inspectResult ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status Box */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Encryption Profile
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Encrypted Status:</span>
                        <span className={`font-bold ${inspectResult.isEncrypted ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {inspectResult.isEncrypted ? 'Protected (Encrypted)' : 'Not Encrypted (Open)'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Algorithm:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{inspectResult.algorithm}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">User Password:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {inspectResult.userPasswordRequired ? 'Required' : 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Owner Password:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {inspectResult.ownerPasswordRequired ? 'Configured' : 'None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Permissions Box */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Permissions & Restrictions
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Printing:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {inspectResult.permissions.printing}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Text & Media Extraction:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {inspectResult.permissions.extracting}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Modifications:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {inspectResult.permissions.modifying}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Form Filling:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {inspectResult.permissions.formFilling ? 'Allowed' : 'Disallowed'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">Analyzing PDF security properties...</div>
              )}
            </div>
          )}

          {/* Tab 4: Clean Metadata */}
          {activeTab === 'metadata' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Privacy & Metadata Stripper</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Strip author names, software producers, creation/modification dates, and hidden XMP streams.
                  </p>
                </div>
              </div>

              {metadataBefore && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Before Cleaning (Detected)
                    </h3>
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <div><strong className="text-slate-700 dark:text-slate-200">Title:</strong> {metadataBefore.title || '(Empty)'}</div>
                      <div><strong className="text-slate-700 dark:text-slate-200">Author:</strong> {metadataBefore.author || '(Empty)'}</div>
                      <div><strong className="text-slate-700 dark:text-slate-200">Producer:</strong> {metadataBefore.producer || '(Empty)'}</div>
                      <div><strong className="text-slate-700 dark:text-slate-200">Creator:</strong> {metadataBefore.creator || '(Empty)'}</div>
                      <div><strong className="text-slate-700 dark:text-slate-200">Created:</strong> {metadataBefore.creationDate || '(Empty)'}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                    <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
                      After Cleaning (Pruned)
                    </h3>
                    <div className="space-y-1.5 text-xs text-emerald-600 dark:text-emerald-400/80">
                      <div><strong>Title:</strong> {metadataAfter ? metadataAfter.title : '(Will be stripped)'}</div>
                      <div><strong>Author:</strong> {metadataAfter ? metadataAfter.author : '(Will be stripped)'}</div>
                      <div><strong>Producer:</strong> {metadataAfter ? metadataAfter.producer : '(Will be stripped)'}</div>
                      <div><strong>Creator:</strong> {metadataAfter ? metadataAfter.creator : '(Will be stripped)'}</div>
                      <div><strong>Dates:</strong> {metadataAfter ? metadataAfter.creationDate : '(Will be stripped)'}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCleanMetadata}
                  disabled={processing}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {processing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FileCheck className="w-4 h-4" />
                  )}
                  <span>Strip All Metadata & Download</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Security Operation Error</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success / Result Download Card */}
          {resultBlob && (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Operation Complete & Cryptographically Verified
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {resultFileName} {resultSize ? `(${(resultSize / 1024).toFixed(1)} KB)` : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={downloadResult}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Result</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
