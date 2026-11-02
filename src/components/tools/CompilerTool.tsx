import React, { useState, useEffect, useRef, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  Play,
  Square,
  RotateCcw,
  Download,
  Upload,
  Copy,
  Trash2,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  Wifi,
  WifiOff,
  Sliders,
  Sparkles,
  BarChart3,
  Layers,
  Database,
  Terminal,
  BookOpen,
  Info,
  Maximize2,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  FolderOpen,
  Plus
} from 'lucide-react';
import { useToolTrack } from '../../context/ToolTrackContext';
import { COMPILER_TEMPLATES, type CodeTemplate } from '../../data/compilerTemplates';
import {
  inspectCompilerCache,
  downloadFullDataScienceBundle,
  downloadPythonPackage,
  clearCompilerCache,
  PYTHON_PACKAGES,
  type CacheCheckStatus
} from '../../lib/offlineCompilerCache';
import { runClientCpp } from '../../lib/clientCppRunner';

export type SupportedLanguage = 'python' | 'cpp' | 'c';

export const CompilerTool: React.FC = () => {
  const { darkMode, showToast, addRecentActivity } = useToolTrack();

  // Selected Language & State
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tt_compiler_lang');
      if (saved === 'python' || saved === 'cpp' || saved === 'c') return saved;
    }
    return 'python';
  });

  // Source code state for each language
  const [codeMap, setCodeMap] = useState<Record<SupportedLanguage, string>>(() => {
    const defaults: Record<SupportedLanguage, string> = {
      python: COMPILER_TEMPLATES.find((t) => t.id === 'py-data-science')?.code || '',
      cpp: COMPILER_TEMPLATES.find((t) => t.id === 'cpp-stdcxx')?.code || '',
      c: COMPILER_TEMPLATES.find((t) => t.id === 'c-stdio')?.code || '',
    };
    if (typeof window !== 'undefined') {
      try {
        const savedPy = localStorage.getItem('tt_code_python');
        const savedCpp = localStorage.getItem('tt_code_cpp');
        const savedC = localStorage.getItem('tt_code_c');
        if (savedPy) defaults.python = savedPy;
        if (savedCpp) defaults.cpp = savedCpp;
        if (savedC) defaults.c = savedC;
      } catch {}
    }
    return defaults;
  });

  // Editor settings
  const [fontSize, setFontSize] = useState<number>(14);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(darkMode ? 'dark' : 'light');

  useEffect(() => {
    setThemeMode(darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Standard I/O State
  const [stdinText, setStdinText] = useState<string>('');
  const [stdoutText, setStdoutText] = useState<string>('');
  const [stderrText, setStderrText] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionStats, setExecutionStats] = useState<{
    durationMs?: number;
    exitCode?: number;
    compilerUsed?: string;
  } | null>(null);

  // Active right pane tab
  const [activeTab, setActiveTab] = useState<'console' | 'stdin' | 'plots' | 'datasets' | 'packages' | 'offline'>('console');

  // Matplotlib plots
  const [generatedPlots, setGeneratedPlots] = useState<string[]>([]);

  // Virtual datasets
  const [virtualFiles, setVirtualFiles] = useState<{ name: string; size: number }[]>([]);

  // Connectivity
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Offline cache status
  const [cacheStatus, setCacheStatus] = useState<CacheCheckStatus | null>(null);
  const [isDownloadingBundle, setIsDownloadingBundle] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    loaded: number;
    total: number;
    currentFile: string;
    percent: number;
  } | null>(null);

  // Python worker reference
  const pythonWorkerRef = useRef<Worker | null>(null);
  const activeJobIdRef = useRef<number>(0);

  // Custom micropip package input
  const [customPackageName, setCustomPackageName] = useState('');
  const [isInstallingCustomPkg, setIsInstallingCustomPkg] = useState(false);

  // Save drafts on code change
  const currentCode = codeMap[language];
  const updateCode = (newVal: string) => {
    setCodeMap((prev) => {
      const updated = { ...prev, [language]: newVal };
      try {
        localStorage.setItem(`tt_code_${language}`, newVal);
      } catch {}
      return updated;
    });
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('tt_compiler_lang', newLang);
    } catch {}
  };

  // Online / Offline window listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Inspect offline cache on load
  const refreshCacheInfo = useCallback(async () => {
    const status = await inspectCompilerCache();
    setCacheStatus(status);
  }, []);

  useEffect(() => {
    refreshCacheInfo();
  }, [refreshCacheInfo]);

  // Initialize Pyodide Web Worker
  useEffect(() => {
    const worker = new Worker(new URL('../../workers/pythonWorker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (e: MessageEvent) => {
      const { type, text, message, plots, executionTimeMs, success, files, package: pkg, error } = e.data;

      if (type === 'stdout') {
        setStdoutText((prev) => prev + text);
      } else if (type === 'stderr') {
        setStderrText((prev) => prev + text);
      } else if (type === 'status') {
        // Ephemeral progress
      } else if (type === 'runComplete') {
        setIsExecuting(false);
        if (plots && Array.isArray(plots) && plots.length > 0) {
          setGeneratedPlots(plots);
          setActiveTab('plots');
        }
        setExecutionStats({
          durationMs: executionTimeMs,
          exitCode: success ? 0 : 1,
          compilerUsed: 'Pyodide WebAssembly (Python 3.12)',
        });
      } else if (type === 'fileList') {
        if (files) {
          setVirtualFiles(files.map((name: string) => ({ name, size: 0 })));
        }
      } else if (type === 'fileUploaded') {
        showToast('success', `Dataset ${e.data.name} mounted into virtual filesystem at ${e.data.path}`);
        // Refresh list
        worker.postMessage({ action: 'listFiles', id: Date.now() });
      } else if (type === 'micropipSuccess') {
        setIsInstallingCustomPkg(false);
        showToast('success', `Python package '${pkg}' installed successfully.`);
        refreshCacheInfo();
      } else if (type === 'micropipError') {
        setIsInstallingCustomPkg(false);
        showToast('error', `Package '${pkg}' installation failed: ${error}`);
      }
    };

    worker.postMessage({ action: 'init' });
    worker.postMessage({ action: 'listFiles', id: Date.now() });
    pythonWorkerRef.current = worker;

    return () => {
      worker.terminate();
      pythonWorkerRef.current = null;
    };
  }, [showToast, refreshCacheInfo]);

  // Execute Code Action (Ctrl+Enter or Run Click)
  const handleRunCode = async () => {
    if (isExecuting) return;

    setIsExecuting(true);
    setStdoutText('');
    setStderrText('');
    setExecutionStats(null);
    setActiveTab('console');

    const codeToRun = codeMap[language];
    const jobId = Date.now();
    activeJobIdRef.current = jobId;

    addRecentActivity('compiler', `${language.toUpperCase()} Execution`, `${language}-source`, 'completed');

    if (language === 'python') {
      // Execute in Web Worker via Pyodide
      if (pythonWorkerRef.current) {
        pythonWorkerRef.current.postMessage({
          action: 'runCode',
          id: jobId,
          payload: {
            code: codeToRun,
            stdin: stdinText,
          },
        });
      } else {
        setStderrText('Python runtime worker is unavailable. Please refresh.');
        setIsExecuting(false);
      }
    } else {
      // C or C++: Try native server compiler if online, otherwise in-browser engine
      if (isOnline) {
        try {
          const res = await fetch('/api/compile-run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language,
              code: codeToRun,
              stdin: stdinText,
              standard: language === 'cpp' ? 'c++20' : 'c17',
            }),
          });

          if (res.ok) {
            const data = await res.json();
            setStdoutText(data.stdout || '');
            setStderrText(data.stderr || '');
            setExecutionStats({
              durationMs: data.executionTimeMs,
              exitCode: data.exitCode,
              compilerUsed: data.compiler || (language === 'cpp' ? 'G++ 12 (Linux)' : 'GCC 12 (Linux)'),
            });
            setIsExecuting(false);
            return;
          }
        } catch (serverErr) {
          console.warn('[CompilerTool] Server compile error, switching to in-browser engine:', serverErr);
        }
      }

      // Offline In-Browser C/C++ Engine fallback
      const localResult = runClientCpp(codeToRun, stdinText, language);
      setStdoutText(localResult.stdout);
      setStderrText(localResult.stderr);
      setExecutionStats({
        durationMs: localResult.executionTimeMs,
        exitCode: localResult.exitCode,
        compilerUsed: localResult.compiler,
      });
      setIsExecuting(false);
    }
  };

  // Stop Execution
  const handleStop = () => {
    if (!isExecuting) return;
    if (language === 'python' && pythonWorkerRef.current) {
      pythonWorkerRef.current.terminate();
      // Restart fresh worker
      const worker = new Worker(new URL('../../workers/pythonWorker.ts', import.meta.url), {
        type: 'module',
      });
      worker.postMessage({ action: 'init' });
      pythonWorkerRef.current = worker;
    }
    setIsExecuting(false);
    setStderrText((prev) => prev + '\n[Execution aborted by user]\n');
    showToast('info', 'Execution stopped.');
  };

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter to Run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [codeMap, language, stdinText, isOnline]);

  // Download Source Code
  const handleDownloadCode = () => {
    const ext = language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'c';
    const blob = new Blob([codeMap[language]], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `main.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', `Saved as main.${ext}`);
  };

  // Open / Upload Local File
  const handleOpenFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        updateCode(content);
        showToast('success', `Loaded ${file.name}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Upload Dataset File into Python Virtual Filesystem
  const handleDatasetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pythonWorkerRef.current) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (data) {
        pythonWorkerRef.current?.postMessage({
          action: 'uploadFile',
          payload: {
            name: file.name,
            data,
            isBinary: file.name.endsWith('.xlsx') || file.name.endsWith('.parquet'),
          },
        });
      }
    };
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.parquet')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  // Apply Starter Template
  const handleApplyTemplate = (tmpl: CodeTemplate) => {
    updateCode(tmpl.code);
    if (tmpl.defaultStdin !== undefined) {
      setStdinText(tmpl.defaultStdin);
    }
    showToast('info', `Applied template: ${tmpl.name}`);
  };

  // Download Offline Data Science Bundle
  const handleDownloadOfflineBundle = async () => {
    if (isDownloadingBundle) return;
    setIsDownloadingBundle(true);
    setDownloadProgress(null);

    try {
      await downloadFullDataScienceBundle((prog) => {
        setDownloadProgress(prog);
      });
      showToast('success', 'Python Data Science bundle cached! 100% Offline execution ready.');
      await refreshCacheInfo();
    } catch (err: any) {
      showToast('error', `Failed to download offline cache: ${err.message}`);
    } finally {
      setIsDownloadingBundle(false);
    }
  };

  // Download individual Python package
  const handleDownloadSinglePackage = async (packageId: string) => {
    try {
      showToast('info', `Downloading ${packageId} for offline use...`);
      await downloadPythonPackage(packageId);
      showToast('success', `${packageId} is now available offline!`);
      await refreshCacheInfo();
    } catch (err: any) {
      showToast('error', `Could not cache ${packageId}: ${err.message}`);
    }
  };

  // Install custom package via micropip
  const handleInstallMicropip = () => {
    if (!customPackageName.trim() || !pythonWorkerRef.current) return;
    setIsInstallingCustomPkg(true);
    pythonWorkerRef.current.postMessage({
      action: 'installMicropip',
      payload: { package: customPackageName.trim() },
    });
  };

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast('success', `${label} copied to clipboard!`);
  };

  // CodeMirror language extension
  const getLanguageExtension = () => {
    if (language === 'python') return [python()];
    return [cpp()];
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Compiler Header & Connectivity */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>ToolTrack Compiler</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  IDE Studio
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Run Python 3 with Pandas, NumPy, Matplotlib & Scikit-learn, plus real C and C++ (GCC 12) with full offline PWA support.
              </p>
            </div>
          </div>
        </div>

        {/* Connectivity & Offline Runtime Badge */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Online/Offline status */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              isOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-850 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-850 text-amber-700 dark:text-amber-300'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-500" /> : <WifiOff className="w-3.5 h-3.5 text-amber-500" />}
            <span>{isOnline ? 'Connected (Online)' : 'Offline Mode (Local WebAssembly)'}</span>
          </div>

          {/* Offline Bundle Button */}
          <button
            onClick={() => setActiveTab('offline')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              cacheStatus?.hasCore
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
            <span>{cacheStatus?.hasCore ? 'Offline Ready (Cached)' : 'Download Offline Runtimes'}</span>
          </button>
        </div>
      </div>

      {/* Language Switcher Tabs & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Languages: Python 3, C++, C */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          {[
            { id: 'python', label: 'Python 3', badge: 'Data Science' },
            { id: 'cpp', label: 'C++ 20', badge: 'G++ 12' },
            { id: 'c', label: 'C 17', badge: 'GCC 12' },
          ].map((langItem) => (
            <button
              key={langItem.id}
              onClick={() => handleLanguageChange(langItem.id as SupportedLanguage)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                language === langItem.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{langItem.label}</span>
              <span className={`text-[10px] font-mono px-1 rounded ${
                language === langItem.id ? 'bg-white/20 text-white' : 'text-slate-400'
              }`}>
                {langItem.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Templates Dropdown & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Templates Select */}
          <div className="relative">
            <select
              onChange={(e) => {
                const tmpl = COMPILER_TEMPLATES.find((t) => t.id === e.target.value);
                if (tmpl) handleApplyTemplate(tmpl);
              }}
              value=""
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" disabled>
                Starter Templates...
              </option>
              {COMPILER_TEMPLATES.filter((t) => t.language === language).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Open local file */}
          <label className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition" title="Open local source file">
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".py,.cpp,.c,.h,.hpp,.txt" onChange={handleOpenFile} className="hidden" />
          </label>

          {/* Download Code */}
          <button
            onClick={handleDownloadCode}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
            title="Download source code"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Copy Code */}
          <button
            onClick={() => copyToClipboard(currentCode, 'Code')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
            title="Copy source code"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Clear Code */}
          <button
            onClick={() => updateCode('')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 cursor-pointer transition"
            title="Clear editor"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Font size toggle */}
          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
            {[12, 14, 16].map((sz) => (
              <button
                key={sz}
                onClick={() => setFontSize(sz)}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                  fontSize === sz
                    ? 'bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {sz}px
              </button>
            ))}
          </div>

          {/* Run button */}
          <button
            onClick={handleRunCode}
            disabled={isExecuting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run (Ctrl+Enter)</span>
              </>
            )}
          </button>

          {/* Stop button */}
          {isExecuting && (
            <button
              onClick={handleStop}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
              title="Stop execution"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Grid: Editor (Left 7 Cols) + I/O & Panels (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: CodeMirror Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col min-h-[560px]">
            {/* Editor Header Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-slate-600 dark:text-slate-400 font-bold ml-2">
                  main.{language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'c'}
                </span>
              </div>

              <div className="text-[11px] text-slate-400">
                {currentCode.split('\n').length} lines · {currentCode.length} chars
              </div>
            </div>

            {/* CodeMirror Surface */}
            <div className="flex-1 overflow-auto text-sm" style={{ fontSize: `${fontSize}px` }}>
              <CodeMirror
                value={currentCode}
                height="510px"
                theme={themeMode === 'dark' ? oneDark : 'light'}
                extensions={getLanguageExtension()}
                onChange={(value) => updateCode(value)}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  highlightSpecialChars: true,
                  history: true,
                  foldGutter: true,
                  drawSelection: true,
                  dropCursor: true,
                  allowMultipleSelections: true,
                  indentOnInput: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  rectangularSelection: true,
                  crosshairCursor: true,
                  highlightActiveLine: true,
                  highlightSelectionMatches: true,
                  closeBracketsKeymap: true,
                  searchKeymap: true,
                  foldKeymap: true,
                  completionKeymap: true,
                  lintKeymap: true,
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Multi-tab Output & Tools Studio (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col min-h-[560px]">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-2 pt-2 gap-1 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveTab('console')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl font-bold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'console'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Output Console</span>
              </button>

              <button
                onClick={() => setActiveTab('stdin')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl font-bold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'stdin'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Input (stdin)</span>
                {stdinText.trim() && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </button>

              {language === 'python' && (
                <>
                  <button
                    onClick={() => setActiveTab('plots')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl font-bold transition cursor-pointer whitespace-nowrap ${
                      activeTab === 'plots'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Plots ({generatedPlots.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('datasets')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl font-bold transition cursor-pointer whitespace-nowrap ${
                      activeTab === 'datasets'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Datasets ({virtualFiles.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('packages')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl font-bold transition cursor-pointer whitespace-nowrap ${
                      activeTab === 'packages'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Libraries</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setActiveTab('offline')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl font-bold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'offline'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Offline PWA</span>
              </button>
            </div>

            {/* Tab 1: Terminal Output Console */}
            {activeTab === 'console' && (
              <div className="flex-1 flex flex-col p-4 space-y-3">
                {/* Console Actions Bar */}
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {executionStats ? (
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Finished in {executionStats.durationMs}ms</span>
                        <span className="text-slate-400 font-normal">
                          (Exit {executionStats.exitCode})
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Console Output</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(stdoutText + '\n' + stderrText, 'Output')}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                      title="Copy console output"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        setStdoutText('');
                        setStderrText('');
                        setExecutionStats(null);
                      }}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                      title="Clear console"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Console Text Area */}
                <div className="flex-1 rounded-xl bg-slate-950 p-3.5 font-mono text-xs text-slate-100 overflow-auto min-h-[420px] max-h-[460px] whitespace-pre-wrap select-text leading-relaxed">
                  {stdoutText && <span className="text-emerald-300">{stdoutText}</span>}
                  {stderrText && <span className="text-rose-400 font-semibold">{stderrText}</span>}
                  {!stdoutText && !stderrText && (
                    <span className="text-slate-500 italic">
                      Click 'Run' or press Ctrl+Enter to execute program...
                    </span>
                  )}
                </div>

                {executionStats?.compilerUsed && (
                  <div className="text-[11px] text-slate-400 font-mono text-right">
                    Engine: {executionStats.compilerUsed}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Standard Input (stdin) */}
            {activeTab === 'stdin' && (
              <div className="flex-1 flex flex-col p-4 space-y-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                    Standard Input (stdin)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Values supplied to Python <code className="font-mono">input()</code>, C <code className="font-mono">scanf()</code>, or C++ <code className="font-mono">cin</code>. Multiple lines supported.
                  </p>
                </div>

                <textarea
                  value={stdinText}
                  onChange={(e) => setStdinText(e.target.value)}
                  placeholder="Enter input values here..."
                  className="flex-1 w-full rounded-xl p-3.5 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none min-h-[380px]"
                />

                <div className="flex justify-between items-center text-xs">
                  <button
                    onClick={() => setStdinText('')}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Clear Input
                  </button>
                  <button
                    onClick={handleRunCode}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold cursor-pointer"
                  >
                    Run with this Input
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Matplotlib Generated Plots */}
            {activeTab === 'plots' && (
              <div className="flex-1 flex flex-col p-4 space-y-4 overflow-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      <span>Matplotlib Visualizations</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Plots captured from <code className="font-mono">plt.show()</code> rendered in crisp high-DPI.
                    </p>
                  </div>
                </div>

                {generatedPlots.length > 0 ? (
                  <div className="space-y-4">
                    {generatedPlots.map((plotBase64, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Figure #{idx + 1}
                          </span>
                          <a
                            href={`data:image/png;base64,${plotBase64}`}
                            download={`tooltrack-plot-${idx + 1}.png`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 cursor-pointer text-xs"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download PNG</span>
                          </a>
                        </div>
                        <img
                          src={`data:image/png;base64,${plotBase64}`}
                          alt={`Matplotlib Figure ${idx + 1}`}
                          className="w-full rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-inner"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2 min-h-[300px]">
                    <BarChart3 className="w-10 h-10 stroke-1 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-semibold">No Matplotlib plots generated yet.</p>
                    <p className="text-[11px] max-w-xs">
                      Try the <span className="font-bold text-indigo-500">Matplotlib Data Visualization</span> template from the dropdown to see graphs rendered here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Virtual Datasets */}
            {activeTab === 'datasets' && (
              <div className="flex-1 flex flex-col p-4 space-y-4 overflow-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-emerald-600" />
                      <span>Dataset Filesystem</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Upload CSV/TXT files to use with <code className="font-mono">pd.read_csv('filename')</code>
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload CSV</span>
                    <input
                      type="file"
                      accept=".csv,.txt,.json,.tsv,.parquet,.xlsx"
                      onChange={handleDatasetUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {virtualFiles.length > 0 ? (
                  <div className="space-y-2">
                    {virtualFiles.map((f, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-emerald-500" />
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            /{f.name}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            updateCode(
                              `import pandas as pd\n\n# Loaded from ToolTrack virtual filesystem\ndf = pd.read_csv("${f.name}")\nprint(df.head())\nprint(df.info())\n`
                            );
                            showToast('info', `Snippet for ${f.name} added to editor`);
                          }}
                          className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          Use in Python
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2 min-h-[300px]">
                    <Database className="w-10 h-10 stroke-1 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-semibold">No datasets uploaded yet.</p>
                    <p className="text-[11px] max-w-xs">
                      Upload any CSV or tabular file to read it directly into your Python scripts without uploading to external servers.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Python Libraries & Package Manager */}
            {activeTab === 'packages' && (
              <div className="flex-1 flex flex-col p-4 space-y-4 overflow-auto">
                <div className="space-y-1">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Scientific Python Libraries</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Official Pyodide WebAssembly package distribution. Real execution in browser.
                  </p>
                </div>

                {/* Pre-configured major libraries list */}
                <div className="space-y-2.5">
                  {PYTHON_PACKAGES.map((pkg) => {
                    const isCached = cacheStatus?.packages[pkg.id];
                    return (
                      <div
                        key={pkg.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                            <span>{pkg.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 font-normal">
                              (~{pkg.sizeEstimateMb} MB)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight">
                            {pkg.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isCached
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isCached ? 'Offline Ready' : 'Online Auto-fetch'}
                          </span>

                          {!isCached && (
                            <button
                              onClick={() => handleDownloadSinglePackage(pkg.id)}
                              className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold cursor-pointer"
                              title="Download package for offline use"
                            >
                              Cache
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Micropip custom install */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Install Package via Micropip (Online)
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customPackageName}
                      onChange={(e) => setCustomPackageName(e.target.value)}
                      placeholder="e.g. networkx, statsmodels..."
                      className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                    />
                    <button
                      onClick={handleInstallMicropip}
                      disabled={isInstallingCustomPkg || !customPackageName.trim()}
                      className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
                    >
                      {isInstallingCustomPkg ? 'Installing...' : 'Install'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 6: Offline PWA & Cache Management */}
            {activeTab === 'offline' && (
              <div className="flex-1 flex flex-col p-4 space-y-4 overflow-auto">
                <div className="space-y-1">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-indigo-600" />
                    <span>Complete Offline PWA Runtime Manager</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pre-cache Pyodide WebAssembly runtime and scientific wheels once, then disconnect from the internet and run programs offline.
                  </p>
                </div>

                {/* Status overview card */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 dark:text-indigo-200">
                      Core Pyodide WebAssembly
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      cacheStatus?.hasCore
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    }`}>
                      {cacheStatus?.hasCore ? 'Cached (Offline Ready)' : 'Not Yet Cached'}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                    <div className="flex justify-between">
                      <span>Total Cached Compiler Assets:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {cacheStatus?.totalCachedFiles || 0} Files
                      </span>
                    </div>
                    {cacheStatus?.storageQuota && (
                      <div className="flex justify-between">
                        <span>Browser Storage Used:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {(cacheStatus.storageQuota.usageBytes / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                    )}
                  </div>

                  {downloadProgress && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                        <span>Downloading: {downloadProgress.currentFile}</span>
                        <span>{downloadProgress.percent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${downloadProgress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleDownloadOfflineBundle}
                    disabled={isDownloadingBundle}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDownloadingBundle ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Caching Offline Assets...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Full Offline Bundle (~45 MB)</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Clear cached runtimes to free space:
                  </span>
                  <button
                    onClick={async () => {
                      await clearCompilerCache();
                      await refreshCacheInfo();
                      showToast('info', 'Offline cache cleared.');
                    }}
                    className="text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Clear Cache
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comprehensive How to Use Guidance */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            How to Use ToolTrack Compiler
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-400">
          {/* Python 3 Guide */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Python 3 with Data Science</span>
            </h3>
            <ul className="space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Genuine WebAssembly Python running in a background Web Worker.</li>
              <li>Supports <code className="font-mono text-indigo-500 font-bold">pandas</code>, <code className="font-mono text-indigo-500 font-bold">numpy</code>, <code className="font-mono text-indigo-500 font-bold">scikit-learn</code>, and <code className="font-mono text-indigo-500 font-bold">scipy</code>.</li>
              <li>Generated plots using <code className="font-mono">plt.show()</code> automatically export into the <strong>Plots</strong> tab with full PNG downloads.</li>
              <li>Upload CSV files to access them directly in Python with <code className="font-mono">pd.read_csv('filename')</code>.</li>
            </ul>
          </div>

          {/* C++ 20 Guide */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>C++ 20 (GCC/G++ 12)</span>
            </h3>
            <ul className="space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Full competitive programming support with <code className="font-mono text-blue-500 font-bold">&lt;bits/stdc++.h&gt;</code> and modern STL.</li>
              <li>Provide input values inside the <strong>Input (stdin)</strong> tab for <code className="font-mono">cin</code> reading.</li>
              <li>Compiles natively with <code className="font-mono">-O2 -std=c++20</code> with process isolation and timeout protection.</li>
              <li>Falls back to the in-browser C++ runner when disconnected from the network.</li>
            </ul>
          </div>

          {/* C 17 Guide */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>C 17 (GCC 12)</span>
            </h3>
            <ul className="space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Standard C runtime supporting <code className="font-mono text-emerald-500 font-bold">&lt;stdio.h&gt;</code>, <code className="font-mono">&lt;stdlib.h&gt;</code>, <code className="font-mono">&lt;math.h&gt;</code>, and pointers.</li>
              <li>Accepts formatted input for <code className="font-mono">scanf()</code> via the Input panel.</li>
              <li>Shows detailed compiler error diagnostics with exact line and column numbers.</li>
              <li>Zero server storage—source code and executions remain private.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
