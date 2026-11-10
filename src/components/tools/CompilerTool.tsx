import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Trash2,
  Download,
  Copy,
  Check,
  Terminal,
  Code2,
  Cpu,
  Sparkles,
  FileCode,
  RefreshCw,
  Maximize2,
  Minimize2,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  Layers,
  Image as ImageIcon,
  Wand2,
  Keyboard,
  Wifi,
  WifiOff,
  HardDriveDownload,
  Package,
  Search,
  WrapText,
  FolderOpen,
  FilePlus,
  Upload,
  Table as TableIcon,
  BookOpen,
  Plus,
  ArrowUp,
  ArrowDown,
  Square,
  RotateCcw,
  FileArchive,
  ZoomIn,
  X,
  FileSpreadsheet,
  Edit3,
  FolderPlus,
} from 'lucide-react';

// CodeMirror 6 imports
import { EditorState, Compartment } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  indentOnInput,
  indentUnit,
  bracketMatching,
  foldGutter,
  foldKeymap,
  syntaxHighlighting,
  defaultHighlightStyle,
} from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches, openSearchPanel } from '@codemirror/search';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';

import { ghostTextExtension } from '../../lib/ghostTextExtension';
import { intelliSenseExtension } from '../../lib/intellisenseSource';
import {
  inspectCompilerCache,
  downloadFullDataScienceBundle,
  clearCompilerCache,
  CacheCheckStatus,
  PYTHON_PACKAGES,
} from '../../lib/offlineCompilerCache';
import {
  runClientCpp,
  validateSyntax,
  CompilerDiagnostic,
} from '../../lib/clientCppRunner';
import {
  CompilerLanguage,
  CompilerProject,
  ProjectFile,
  NotebookCellData,
  COMPILER_TEMPLATES,
  loadCompilerProjects,
  saveCompilerProjects,
  getActiveProjectId,
  setActiveProjectId,
  exportProjectAsZip,
  exportNotebookToIpynb,
  parseIpynbToCells,
  getDefaultNotebookCells,
} from '../../lib/compilerProjectStore';

type RuntimeLifecycleState =
  | 'not_initialized'
  | 'downloading_runtime'
  | 'initializing'
  | 'loading_packages'
  | 'ready'
  | 'running'
  | 'stopping'
  | 'completed'
  | 'failed';

interface ExtractedDataFrame {
  name: string;
  rows: number;
  cols: number;
  columns: string[];
  dtypes: Record<string, string>;
  previewRows: Record<string, any>[];
  csvContent: string;
}

type StudioTab = 'console' | 'stdin' | 'plots' | 'dataframes' | 'problems' | 'packages';

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function CompilerTool() {
  // --- Projects & Multi-File State ---
  const [projects, setProjects] = useState<CompilerProject[]>(() => loadCompilerProjects());
  const [activeProjectId, setActiveProjectIdState] = useState<string>(() =>
    getActiveProjectId(loadCompilerProjects())
  );

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  const language: CompilerLanguage = activeProject?.language || 'python';
  const activeFileName = activeProject?.activeFileName || 'main.py';
  const activeFile = useMemo(
    () =>
      activeProject?.files.find((f) => f.name === activeFileName) ||
      activeProject?.files[0] || { name: 'main.py', content: '', updatedAt: Date.now() },
    [activeProject, activeFileName]
  );

  const code = activeFile.content;
  const stdin = activeProject?.stdin || '';

  // --- Workspace Mode: 'editor' (VS Code style) or 'notebook' (Colab style for Python) ---
  const [workspaceMode, setWorkspaceMode] = useState<'editor' | 'notebook'>('editor');
  const [showExplorer, setShowExplorer] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // --- Project Management UI State ---
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectLang, setNewProjectLang] = useState<CompilerLanguage>('python');
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameProjectText, setRenameProjectText] = useState('');
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<string | null>(null);

  // --- File Management UI State ---
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const fileUploadInputRef = useRef<HTMLInputElement | null>(null);
  const ipynbInputRef = useRef<HTMLInputElement | null>(null);

  // --- Execution & Output State ---
  const [runtimeState, setRuntimeState] = useState<RuntimeLifecycleState>('not_initialized');
  const [runtimeStatusText, setRuntimeStatusText] = useState<string>('Python 3.12 Worker Idle');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stdout, setStdout] = useState<string>('');
  const [stderr, setStderr] = useState<string>('');
  const [plots, setPlots] = useState<string[]>([]);
  const [dataframes, setDataframes] = useState<ExtractedDataFrame[]>([]);
  const [selectedDfIndex, setSelectedDfIndex] = useState<number>(0);
  const [dfSearchQuery, setDfSearchQuery] = useState<string>('');
  const [diagnostics, setDiagnostics] = useState<CompilerDiagnostic[]>([]);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [execTimeMs, setExecTimeMs] = useState<number | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [compilerUsed, setCompilerUsed] = useState<string>('');
  const [activeTab, setActiveTab] = useState<StudioTab>('console');
  const [copiedOutput, setCopiedOutput] = useState<boolean>(false);
  const [plotDarkBg, setPlotDarkBg] = useState<boolean>(false);
  const [zoomedPlotIndex, setZoomedPlotIndex] = useState<number | null>(null);

  // --- Editor Preferences ---
  const [fontSize, setFontSize] = useState<number>(14);
  const [tabSize, setTabSize] = useState<number>(4);
  const [wordWrap, setWordWrap] = useState<boolean>(true);
  const [editorTheme, setEditorTheme] = useState<'dark' | 'light'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'dark'
  );
  const [preferredEngine, setPreferredEngine] = useState<'auto' | 'cloud' | 'wasm'>('auto');
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [goToLineOpen, setGoToLineOpen] = useState<boolean>(false);
  const [goToLineInput, setGoToLineInput] = useState<string>('');
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });

  // --- Offline & Package State ---
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [cacheStatus, setCacheStatus] = useState<CacheCheckStatus | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{
    loaded: number;
    total: number;
    currentFile: string;
    percent: number;
  } | null>(null);
  const [isDownloadingOffline, setIsDownloadingOffline] = useState<boolean>(false);
  const [loadedPyPackages, setLoadedPyPackages] = useState<string[]>([]);
  const [customPackageName, setCustomPackageName] = useState<string>('');
  const [isInstallingPackage, setIsInstallingPackage] = useState<boolean>(false);
  const [packageInstallMessage, setPackageInstallMessage] = useState<string | null>(null);

  // --- Refs ---
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const languageCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const wrapCompartment = useRef(new Compartment());
  const tabSizeCompartment = useRef(new Compartment());
  const pyWorkerRef = useRef<Worker | null>(null);
  const pendingWorkerCallbacks = useRef<Map<string, (msg: any) => void>>(new Map());
  const runCodeRef = useRef<() => void>(() => {});

  // --- Persist Projects whenever updated ---
  useEffect(() => {
    saveCompilerProjects(projects);
  }, [projects]);

  useEffect(() => {
    if (activeProjectId) {
      setActiveProjectId(activeProjectId);
    }
  }, [activeProjectId]);

  // --- Online / Offline Detection & Cache Inspection ---
  const refreshOfflineStatus = useCallback(async () => {
    try {
      const status = await inspectCompilerCache();
      setCacheStatus(status);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    refreshOfflineStatus();
    const handleOnline = () => {
      setIsOnline(true);
      refreshOfflineStatus();
    };
    const handleOffline = () => {
      setIsOnline(false);
      refreshOfflineStatus();
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshOfflineStatus]);

  // --- Helper to update current project ---
  const updateActiveProject = useCallback(
    (updater: (proj: CompilerProject) => CompilerProject) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === activeProject.id ? { ...updater(p), updatedAt: Date.now() } : p))
      );
    },
    [activeProject.id]
  );

  const setCode = useCallback(
    (newCode: string) => {
      updateActiveProject((proj) => ({
        ...proj,
        files: proj.files.map((f) =>
          f.name === proj.activeFileName ? { ...f, content: newCode, updatedAt: Date.now() } : f
        ),
      }));
    },
    [updateActiveProject]
  );

  const setStdin = useCallback(
    (newStdin: string) => {
      updateActiveProject((proj) => ({
        ...proj,
        stdin: newStdin,
      }));
    },
    [updateActiveProject]
  );

  // --- Initialize and Manage Persistent Pyodide 3.12 Web Worker ---
  const createOrGetPythonWorker = useCallback(() => {
    if (pyWorkerRef.current) {
      return pyWorkerRef.current;
    }
    const worker = new Worker(new URL('../../workers/pythonWorker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'STATUS') {
        setRuntimeStatusText(data.status || 'Initializing Python 3.12...');
        if (data.lifecycle) {
          setRuntimeState(data.lifecycle as RuntimeLifecycleState);
        }
        return;
      }

      if (data.type === 'INIT_DONE') {
        setRuntimeState('ready');
        setRuntimeStatusText('Python 3.12 Ready');
        if (Array.isArray(data.loadedPackages)) {
          setLoadedPyPackages(data.loadedPackages);
        }
        refreshOfflineStatus();
      }

      if (data.id && pendingWorkerCallbacks.current.has(data.id)) {
        const cb = pendingWorkerCallbacks.current.get(data.id)!;
        pendingWorkerCallbacks.current.delete(data.id);
        cb(data);
      }
    };

    worker.onerror = (err) => {
      setRuntimeState('failed');
      setRuntimeStatusText('Python Worker Error');
      setIsRunning(false);
      setStderr((prev) => `${prev}\nWorker Runtime Error: ${err.message || 'Unknown worker error'}`.trim());
    };

    pyWorkerRef.current = worker;
    return worker;
  }, [refreshOfflineStatus]);

  // Pre-warm Python Worker when language is Python
  useEffect(() => {
    if (language === 'python' && runtimeState === 'not_initialized') {
      const worker = createOrGetPythonWorker();
      const initId = `init-${Date.now()}`;
      worker.postMessage({ type: 'INIT', id: initId });
    }
  }, [language, runtimeState, createOrGetPythonWorker]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (pyWorkerRef.current) {
        pyWorkerRef.current.terminate();
        pyWorkerRef.current = null;
      }
    };
  }, []);

  // --- Switch Language Handler (Preserves per-language project state) ---
  const handleSelectLanguage = (targetLang: CompilerLanguage) => {
    if (targetLang === language) return;
    if (targetLang !== 'python' && workspaceMode === 'notebook') {
      setWorkspaceMode('editor');
    }
    // Find most recently updated project for targetLang
    const existingProj = [...projects]
      .filter((p) => p.language === targetLang)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];

    if (existingProj) {
      setActiveProjectIdState(existingProj.id);
    } else {
      const tpl = COMPILER_TEMPLATES.find((t) => t.language === targetLang) || COMPILER_TEMPLATES[0];
      const now = Date.now();
      const newProj: CompilerProject = {
        id: `proj-${targetLang}-${now}`,
        name: `${targetLang.toUpperCase()} Workspace`,
        language: targetLang,
        activeFileName: tpl.fileName,
        stdin: tpl.defaultStdin || '',
        files: [{ name: tpl.fileName, content: tpl.code, updatedAt: now }],
        notebookCells: targetLang === 'python' ? getDefaultNotebookCells() : undefined,
        createdAt: now,
        updatedAt: now,
      };
      setProjects((prev) => [newProj, ...prev]);
      setActiveProjectIdState(newProj.id);
    }
    setDiagnostics([]);
    setErrorLine(null);
  };

  // --- Stop / Interrupt Execution ---
  const handleStopExecution = () => {
    if (!isRunning) return;
    setRuntimeState('stopping');
    setRuntimeStatusText('Stopping execution...');
    if (pyWorkerRef.current) {
      pyWorkerRef.current.terminate();
      pyWorkerRef.current = null;
      pendingWorkerCallbacks.current.clear();
    }
    setIsRunning(false);
    setRuntimeState('not_initialized');
    setRuntimeStatusText('Execution interrupted by user. Kernel reset.');
    setStderr((prev) => (prev ? `${prev}\n[KeyboardInterrupt: Execution stopped by user]` : '[KeyboardInterrupt: Execution stopped by user]'));
  };

  // --- Reset Python Kernel ---
  const handleResetKernel = () => {
    if (pyWorkerRef.current) {
      const worker = pyWorkerRef.current;
      const resetId = `reset-${Date.now()}`;
      pendingWorkerCallbacks.current.set(resetId, () => {
        setRuntimeState('ready');
        setRuntimeStatusText('Python Kernel Reset');
        setDataframes([]);
      });
      worker.postMessage({ type: 'RESET_KERNEL', id: resetId });
    }
  };

  // --- Execute Python Code in Persistent Pyodide Worker ---
  const executePythonInWorker = useCallback(
    async (
      sourceCode: string,
      inputStdin: string,
      resetGlobals: boolean
    ): Promise<{
      success: boolean;
      stdout: string;
      stderr: string;
      plots: string[];
      dataframes: ExtractedDataFrame[];
      errorLine: number | null;
      executionTimeMs: number;
    }> => {
      const worker = createOrGetPythonWorker();
      const runId = `py-run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const syncFiles = activeProject.files
        .filter((f) => f.name !== activeProject.activeFileName || workspaceMode === 'notebook')
        .map((f) => ({
          name: f.name,
          content: f.content,
          encoding: f.isBinary ? ('base64' as const) : ('utf8' as const),
        }));

      return new Promise((resolve) => {
        pendingWorkerCallbacks.current.set(runId, (data: any) => {
          if (Array.isArray(data.loadedPackages)) {
            setLoadedPyPackages(data.loadedPackages);
          }

          // Sync any newly generated files from /home/pyodide back to project explorer
          if (Array.isArray(data.workspaceFiles) && data.workspaceFiles.length > 0) {
            updateActiveProject((proj) => {
              const updatedFiles = [...proj.files];
              for (const wf of data.workspaceFiles) {
                const existingIdx = updatedFiles.findIndex((f) => f.name === wf.name);
                const newFileObj: ProjectFile = {
                  name: wf.name,
                  content: wf.content,
                  isBinary: wf.isBinary,
                  size: wf.size,
                  updatedAt: Date.now(),
                };
                if (existingIdx >= 0) {
                  updatedFiles[existingIdx] = newFileObj;
                } else {
                  updatedFiles.push(newFileObj);
                }
              }
              return { ...proj, files: updatedFiles };
            });
          }

          refreshOfflineStatus();

          if (data.type === 'RESULT') {
            resolve({
              success: true,
              stdout: data.stdout || '',
              stderr: data.stderr || '',
              plots: data.plots || [],
              dataframes: data.dataframes || [],
              errorLine: data.errorLine || null,
              executionTimeMs: data.executionTimeMs || 0,
            });
          } else {
            resolve({
              success: false,
              stdout: data.stdout || '',
              stderr: data.stderr || data.error || 'Python execution failed.',
              plots: data.plots || [],
              dataframes: data.dataframes || [],
              errorLine: data.errorLine || null,
              executionTimeMs: data.executionTimeMs || 0,
            });
          }
        });

        worker.postMessage({
          type: 'RUN',
          id: runId,
          code: sourceCode,
          stdin: inputStdin,
          files: syncFiles,
          resetGlobals,
        });
      });
    },
    [activeProject, workspaceMode, createOrGetPythonWorker, updateActiveProject, refreshOfflineStatus]
  );

  // --- Primary Run Handler (Editor Mode) ---
  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStdout('');
    setStderr('');
    setPlots([]);
    setDataframes([]);
    setDiagnostics([]);
    setErrorLine(null);
    setExecTimeMs(null);
    setExitCode(null);

    const startTime = performance.now();

    try {
      // Pre-validate syntax for immediate feedback
      const localDiags = validateSyntax(code, language);
      const hasFatalSyntax = localDiags.some((d) => d.severity === 'error');
      if (localDiags.length > 0) {
        setDiagnostics(localDiags);
      }

      if (language === 'python') {
        // Use Pyodide 3.12 WebAssembly Worker as primary engine for full scientific stack support
        // Only use cloud first if user explicitly forced 'cloud' and is online
        if (preferredEngine === 'cloud' && isOnline) {
          const response = await fetch('/api/compile-run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language: 'python',
              code,
              stdin,
              files: activeProject.files.filter((f) => f.name !== activeFileName),
            }),
          });
          const data = await response.json();
          if (!data.fallbackToWasm) {
            setStdout(data.stdout || '');
            setStderr(data.stderr || '');
            setPlots(data.plots || []);
            setExitCode(data.exitCode ?? (data.success ? 0 : 1));
            setExecTimeMs(data.executionTimeMs ?? Math.round(performance.now() - startTime));
            setCompilerUsed(data.compiler || 'Python 3.11 Server Engine');
            if (data.plots && data.plots.length > 0) {
              setActiveTab('plots');
            } else {
              setActiveTab('console');
            }
            setIsRunning(false);
            return;
          }
        }

        setCompilerUsed(
          isOnline
            ? 'Python 3.12 (Pyodide WebAssembly Worker)'
            : 'Python 3.12 (Offline Cached WebAssembly)'
        );
        const res = await executePythonInWorker(code, stdin, true);
        setStdout(res.stdout);
        setStderr(res.stderr);
        setPlots(res.plots);
        setDataframes(res.dataframes);
        setSelectedDfIndex(0);
        setErrorLine(res.errorLine);

        if (res.errorLine) {
          setDiagnostics((prev) => [
            ...prev,
            {
              line: res.errorLine!,
              column: 1,
              severity: 'error',
              message: res.stderr.split('\n').filter(Boolean).pop() || 'Python Runtime Exception',
            },
          ]);
        }

        setExitCode(res.success ? 0 : 1);
        setExecTimeMs(res.executionTimeMs || Math.round(performance.now() - startTime));

        if (res.plots.length > 0) {
          setActiveTab('plots');
        } else if (res.dataframes.length > 0 && !res.stdout.trim() && res.success) {
          setActiveTab('dataframes');
        } else {
          setActiveTab('console');
        }
        setIsRunning(false);
        return;
      }

      // C and C++ Execution
      const shouldTryCloud = preferredEngine !== 'wasm' && isOnline && !hasFatalSyntax;
      if (shouldTryCloud) {
        try {
          const response = await fetch('/api/compile-run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language,
              code,
              stdin,
              standard: language === 'cpp' ? 'c++20' : 'c17',
            }),
          });
          if (response.ok) {
            const data = await response.json();
            setStdout(data.stdout || '');
            setStderr(data.stderr || '');
            if (Array.isArray(data.diagnostics) && data.diagnostics.length > 0) {
              setDiagnostics(data.diagnostics);
              setErrorLine(data.diagnostics[0].line);
            }
            setExitCode(data.exitCode ?? (data.success ? 0 : 1));
            setExecTimeMs(data.executionTimeMs ?? Math.round(performance.now() - startTime));
            setCompilerUsed(data.compiler || (language === 'cpp' ? 'GCC C++20' : 'GCC C17'));
            setActiveTab('console');
            setIsRunning(false);
            return;
          }
        } catch {
          // Network unreachable — fall through to built-in AST compiler
        }
      }

      // Offline / Browser C17 & C++20 AST Compiler
      const localResult = await runClientCpp(code, stdin, language);
      setStdout(localResult.stdout);
      setStderr(localResult.stderr);
      if (localResult.diagnostics.length > 0) {
        setDiagnostics(localResult.diagnostics);
        setErrorLine(localResult.diagnostics[0].line);
      }
      setExitCode(localResult.exitCode);
      setExecTimeMs(Math.round(performance.now() - startTime));
      setCompilerUsed(localResult.compiler);
      setActiveTab('console');
    } catch (err: any) {
      setStderr(`Execution Error: ${err?.message || String(err)}`);
      setExitCode(1);
    } finally {
      setIsRunning(false);
    }
  };

  runCodeRef.current = handleRunCode;

  // --- Notebook Mode Execution Handlers ---
  const notebookCells = useMemo(
    () => activeProject.notebookCells || getDefaultNotebookCells(),
    [activeProject.notebookCells]
  );

  const updateNotebookCells = useCallback(
    (updater: (cells: NotebookCellData[]) => NotebookCellData[]) => {
      updateActiveProject((proj) => ({
        ...proj,
        notebookCells: updater(proj.notebookCells || getDefaultNotebookCells()),
      }));
    },
    [updateActiveProject]
  );

  const handleRunNotebookCell = async (cellId: string) => {
    const targetCell = notebookCells.find((c) => c.id === cellId);
    if (!targetCell || targetCell.type !== 'code' || isRunning) return;

    setIsRunning(true);
    updateNotebookCells((cells) =>
      cells.map((c) => (c.id === cellId ? { ...c, status: 'running', stdout: '', stderr: '', plots: [] } : c))
    );

    const res = await executePythonInWorker(targetCell.content, stdin, false);

    updateNotebookCells((cells) => {
      const maxCount = cells.reduce((acc, c) => Math.max(acc, c.executionCount || 0), 0);
      return cells.map((c) =>
        c.id === cellId
          ? {
              ...c,
              status: res.success ? 'completed' : 'error',
              executionCount: maxCount + 1,
              stdout: res.stdout,
              stderr: res.stderr,
              plots: res.plots,
              dataframes: res.dataframes,
              executionTimeMs: res.executionTimeMs,
            }
          : c
      );
    });

    if (res.plots.length > 0) {
      setPlots((prev) => [...prev, ...res.plots]);
    }
    if (res.dataframes.length > 0) {
      setDataframes(res.dataframes);
    }
    setIsRunning(false);
  };

  const handleRunAllNotebookCells = async () => {
    if (isRunning) return;
    for (const cell of notebookCells) {
      if (cell.type === 'code') {
        await handleRunNotebookCell(cell.id);
      }
    }
  };

  // --- CodeMirror 6 Setup & Synchronization ---
  useEffect(() => {
    if (!editorContainerRef.current || workspaceMode !== 'editor') return;

    const getLangExt = (lang: CompilerLanguage) => (lang === 'python' ? python() : cpp());

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const currentDoc = update.state.doc.toString();
        setCode(currentDoc);
      }
      if (update.selectionSet || update.docChanged) {
        const pos = update.state.selection.main.head;
        const lineObj = update.state.doc.lineAt(pos);
        setCursorPos({
          line: lineObj.number,
          col: pos - lineObj.from + 1,
        });
      }
    });

    const runShortcutKeymap = keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          runCodeRef.current();
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        rectangularSelection(),
        crosshairCursor(),
        highlightSelectionMatches(),
        runShortcutKeymap,
        ghostTextExtension(language),
        intelliSenseExtension(language),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          indentWithTab,
        ]),
        languageCompartment.current.of(getLangExt(language)),
        themeCompartment.current.of(editorTheme === 'dark' ? oneDark : []),
        wrapCompartment.current.of(wordWrap ? EditorView.lineWrapping : []),
        tabSizeCompartment.current.of([
          EditorState.tabSize.of(tabSize),
          indentUnit.of(' '.repeat(tabSize)),
        ]),
        updateListener,
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: `${fontSize}px`,
            fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, Consolas, monospace',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, Consolas, monospace',
            lineHeight: '1.6',
          },
          '.cm-content': {
            padding: '12px 0',
          },
          '.cm-gutters': {
            borderRight: '1px solid rgba(148, 163, 184, 0.12)',
            backgroundColor: 'transparent',
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
    // Re-create editor when switching workspaceMode, activeProjectId, activeFileName, language, fontSize, editorTheme
  }, [workspaceMode, activeProjectId, activeFileName, language, fontSize, editorTheme]);

  // Sync external code changes (like template load) into CodeMirror
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;
    const currentText = view.state.doc.toString();
    if (currentText !== code) {
      view.dispatch({
        changes: { from: 0, to: currentText.length, insert: code },
      });
    }
  }, [code]);

  // Sync wordWrap & tabSize compartments
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;
    view.dispatch({
      effects: wrapCompartment.current.reconfigure(wordWrap ? EditorView.lineWrapping : []),
    });
  }, [wordWrap]);

  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;
    view.dispatch({
      effects: tabSizeCompartment.current.reconfigure([
        EditorState.tabSize.of(tabSize),
        indentUnit.of(' '.repeat(tabSize)),
      ]),
    });
  }, [tabSize]);

  // --- Editor Utility Actions ---
  const handleJumpToLine = (lineNum: number) => {
    const view = editorViewRef.current;
    if (!view) return;
    const clampedLine = Math.max(1, Math.min(lineNum, view.state.doc.lines));
    const lineInfo = view.state.doc.line(clampedLine);
    view.dispatch({
      selection: { anchor: lineInfo.from },
      effects: EditorView.scrollIntoView(lineInfo.from, { y: 'center' }),
    });
    view.focus();
  };

  const handleFormatCode = () => {
    const lines = code.split('\n');
    let formatted: string[] = [];
    if (language === 'python') {
      formatted = lines.map((line) => line.replace(/\s+$/, '').replace(/\t/g, ' '.repeat(tabSize)));
    } else {
      let indentLevel = 0;
      for (const rawLine of lines) {
        const trimmed = rawLine.trim();
        if (!trimmed) {
          formatted.push('');
          continue;
        }
        if (trimmed.startsWith('}') || trimmed.startsWith('};')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        const pad = trimmed.startsWith('#') ? '' : ' '.repeat(indentLevel * tabSize);
        formatted.push(pad + trimmed);
        if (trimmed.endsWith('{')) {
          indentLevel++;
        }
      }
    }
    setCode(formatted.join('\n'));
  };

  // --- Offline Download & Package Management Handlers ---
  const handleDownloadOfflineBundle = async () => {
    if (isDownloadingOffline) return;
    setIsDownloadingOffline(true);
    try {
      await downloadFullDataScienceBundle((progress) => {
        setDownloadProgress(progress);
      });
      const status = await inspectCompilerCache();
      setCacheStatus(status);
    } catch (err: any) {
      setStderr(`Offline bundle download failed: ${err?.message || String(err)}`);
    } finally {
      setIsDownloadingOffline(false);
    }
  };

  const handleClearOfflineCache = async () => {
    await clearCompilerCache();
    await refreshOfflineStatus();
    setDownloadProgress(null);
  };

  const handleInstallCustomPackage = async (pkgToInstall?: string) => {
    const pkg = (pkgToInstall || customPackageName).trim();
    if (!pkg || isInstallingPackage) return;
    setIsInstallingPackage(true);
    setPackageInstallMessage(`Installing '${pkg}' via micropip...`);

    const worker = createOrGetPythonWorker();
    const msgId = `pkg-${Date.now()}`;
    pendingWorkerCallbacks.current.set(msgId, (data: any) => {
      setIsInstallingPackage(false);
      if (Array.isArray(data.loadedPackages)) {
        setLoadedPyPackages(data.loadedPackages);
      }
      if (data.type === 'PACKAGE_INSTALLED') {
        setPackageInstallMessage(`Successfully installed '${pkg}' in Python 3.12 environment.`);
        setCustomPackageName('');
        refreshOfflineStatus();
      } else {
        setPackageInstallMessage(`Failed to install '${pkg}': ${data.error || 'Unknown error'}`);
      }
    });

    worker.postMessage({
      type: 'INSTALL_PACKAGE',
      id: msgId,
      packageName: pkg,
    });
  };

  // --- Project & File Operations ---
  const handleCreateProject = () => {
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    const tpl = COMPILER_TEMPLATES.find((t) => t.language === newProjectLang) || COMPILER_TEMPLATES[0];
    const now = Date.now();
    const newProj: CompilerProject = {
      id: `proj-${newProjectLang}-${now}`,
      name: trimmed,
      language: newProjectLang,
      activeFileName: tpl.fileName,
      stdin: tpl.defaultStdin || '',
      files: [{ name: tpl.fileName, content: tpl.code, updatedAt: now }],
      notebookCells: newProjectLang === 'python' ? getDefaultNotebookCells() : undefined,
      createdAt: now,
      updatedAt: now,
    };
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectIdState(newProj.id);
    setNewProjectName('');
    setIsCreatingProject(false);
  };

  const handleDeleteProject = (projId: string) => {
    if (projects.length <= 1) return;
    const remaining = projects.filter((p) => p.id !== projId);
    setProjects(remaining);
    if (activeProjectId === projId) {
      setActiveProjectIdState(remaining[0].id);
    }
    setConfirmDeleteProjectId(null);
  };

  const handleCreateNewFile = () => {
    const rawName = newFileName.trim();
    if (!rawName) return;
    const defaultExt = language === 'python' ? '.py' : language === 'cpp' ? '.cpp' : '.c';
    const finalName = rawName.includes('.') ? rawName : `${rawName}${defaultExt}`;

    updateActiveProject((proj) => {
      if (proj.files.some((f) => f.name === finalName)) {
        return { ...proj, activeFileName: finalName };
      }
      return {
        ...proj,
        activeFileName: finalName,
        files: [
          ...proj.files,
          {
            name: finalName,
            content: finalName.endsWith('.py')
              ? `# ${finalName}\n`
              : finalName.endsWith('.cpp') || finalName.endsWith('.c')
              ? `// ${finalName}\n`
              : '',
            updatedAt: Date.now(),
          },
        ],
      };
    });
    setNewFileName('');
    setIsCreatingFile(false);
  };

  const handleDeleteFile = (fileName: string) => {
    if (activeProject.files.length <= 1) return;
    updateActiveProject((proj) => {
      const nextFiles = proj.files.filter((f) => f.name !== fileName);
      return {
        ...proj,
        files: nextFiles,
        activeFileName:
          proj.activeFileName === fileName ? nextFiles[0].name : proj.activeFileName,
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    for (const file of Array.from(fileList)) {
      if (file.name.endsWith('.ipynb')) {
        const text = await file.text();
        try {
          const cells = parseIpynbToCells(text);
          updateActiveProject((proj) => ({ ...proj, notebookCells: cells }));
          setWorkspaceMode('notebook');
        } catch (err: any) {
          setStderr(`Invalid .ipynb file: ${err?.message}`);
        }
        continue;
      }

      const isBinary = /\.(xlsx|xls|png|jpg|jpeg|pdf|zip|sqlite|db)$/i.test(file.name);
      if (isBinary) {
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binary);
        updateActiveProject((proj) => {
          const filtered = proj.files.filter((f) => f.name !== file.name);
          return {
            ...proj,
            files: [
              ...filtered,
              { name: file.name, content: b64, isBinary: true, size: file.size, updatedAt: Date.now() },
            ],
          };
        });
      } else {
        const text = await file.text();
        updateActiveProject((proj) => {
          const filtered = proj.files.filter((f) => f.name !== file.name);
          const isCodeFile = /\.(py|cpp|c|h|hpp)$/i.test(file.name);
          return {
            ...proj,
            activeFileName: isCodeFile ? file.name : proj.activeFileName,
            files: [
              ...filtered,
              { name: file.name, content: text, isBinary: false, size: file.size, updatedAt: Date.now() },
            ],
          };
        });
      }
    }
    e.target.value = '';
  };

  const handleDownloadFile = (file: ProjectFile) => {
    let blob: Blob;
    if (file.isBinary) {
      const binStr = atob(file.content);
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) {
        bytes[i] = binStr.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: 'application/octet-stream' });
    } else {
      blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportProjectZip = async () => {
    const zipBlob = await exportProjectAsZip(activeProject);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'tooltrack_project'}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportIpynb = () => {
    const content = exportNotebookToIpynb(notebookCells);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.ipynb`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPlot = (base64Png: string, index: number) => {
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${base64Png}`;
    a.download = `tooltrack_figure_${index + 1}.png`;
    a.click();
  };

  const handleDownloadDataFrameCsv = (df: ExtractedDataFrame) => {
    const blob = new Blob([df.csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${df.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeDataFrame = dataframes[selectedDfIndex] || dataframes[0] || null;
  const filteredDfRows = useMemo(() => {
    if (!activeDataFrame) return [];
    if (!dfSearchQuery.trim()) return activeDataFrame.previewRows;
    const q = dfSearchQuery.toLowerCase();
    return activeDataFrame.previewRows.filter((row) =>
      Object.values(row).some((val) => String(val ?? '').toLowerCase().includes(q))
    );
  }, [activeDataFrame, dfSearchQuery]);

  return (
    <div
      className={`flex flex-col bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen'
          : 'rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xl overflow-hidden min-h-[780px]'
      }`}
    >
      {/* Hidden File Inputs */}
      <input
        ref={fileUploadInputRef}
        type="file"
        multiple
        accept=".py,.cpp,.c,.h,.hpp,.csv,.xlsx,.xls,.json,.txt,.ipynb"
        className="hidden"
        onChange={handleFileUpload}
      />
      <input
        ref={ipynbInputRef}
        type="file"
        accept=".ipynb"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* TOP IDE COMMAND HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800">
        {/* Left: Explorer toggle, Brand, Language Switcher, Mode Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowExplorer((v) => !v)}
            title="Toggle Workspace Explorer"
            className={`p-2 rounded-lg border transition-colors ${
              showExplorer
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-400'
                : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
          </button>

          {/* Language Selector */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/70">
            {(
              [
                { id: 'python', label: 'Python 3.12' },
                { id: 'cpp', label: 'C++20' },
                { id: 'c', label: 'C17' },
              ] as const
            ).map((langItem) => (
              <button
                key={langItem.id}
                onClick={() => handleSelectLanguage(langItem.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  language === langItem.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {langItem.label}
              </button>
            ))}
          </div>

          {/* Editor vs Notebook Mode Toggle (for Python) */}
          {language === 'python' && (
            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/70">
              <button
                onClick={() => setWorkspaceMode('editor')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  workspaceMode === 'editor'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Editor
              </button>
              <button
                onClick={() => setWorkspaceMode('notebook')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  workspaceMode === 'notebook'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Notebook
              </button>
            </div>
          )}

          {/* Online / Offline & Runtime Badge */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isOnline ? 'Online' : 'Offline Mode'}
            </span>

            {cacheStatus?.isDataScienceReady ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Offline Ready
              </span>
            ) : (
              <button
                onClick={() => {
                  setActiveTab('packages');
                  handleDownloadOfflineBundle();
                }}
                disabled={isDownloadingOffline}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <HardDriveDownload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isDownloadingOffline
                  ? `Caching ${downloadProgress?.percent || 0}%...`
                  : 'Enable Offline Mode'}
              </button>
            )}
          </div>
        </div>

        {/* Right: Primary Run / Stop / Format / Settings / Fullscreen Controls */}
        <div className="flex items-center gap-2">
          {workspaceMode === 'editor' ? (
            <>
              {isRunning ? (
                <button
                  onClick={handleStopExecution}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleRunCode}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Code
                  <span className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-blue-700/80 rounded text-blue-100 font-mono">
                    Ctrl+Enter
                  </span>
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleRunAllNotebookCells}
                disabled={isRunning}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Run All Cells
              </button>
              <button
                onClick={handleResetKernel}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                title="Reset Python Kernel Globals"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Kernel
              </button>
            </div>
          )}

          {workspaceMode === 'editor' && (
            <button
              onClick={handleFormatCode}
              title="Format Code"
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Wand2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleExportProjectZip}
            title="Export Project as ZIP"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <FileArchive className="w-4 h-4" />
          </button>

          {/* Editor Settings Popover Button */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu((v) => !v)}
              title="IDE Settings & Engine Preferences"
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Sliders className="w-4 h-4" />
            </button>
            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 space-y-3 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span>IDE & Runtime Settings</span>
                  <button
                    onClick={() => setShowSettingsMenu(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Editor Theme</span>
                  <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                    <button
                      onClick={() => setEditorTheme('dark')}
                      className={`px-2.5 py-1 rounded-md ${
                        editorTheme === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Dark
                    </button>
                    <button
                      onClick={() => setEditorTheme('light')}
                      className={`px-2.5 py-1 rounded-md ${
                        editorTheme === 'light' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Light
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Font Size</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setFontSize((s) => Math.max(12, s - 1))}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800"
                    >
                      -
                    </button>
                    <span className="font-mono tabular-nums w-10 text-center">{fontSize}px</span>
                    <button
                      onClick={() => setFontSize((s) => Math.min(20, s + 1))}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Tab Indentation</span>
                  <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                    {[2, 4].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setTabSize(sz)}
                        className={`px-2.5 py-1 rounded-md font-mono tabular-nums ${
                          tabSize === sz ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {sz} spaces
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Word Wrap</span>
                  <button
                    onClick={() => setWordWrap((w) => !w)}
                    className={`px-2.5 py-1 rounded-md font-medium ${
                      wordWrap
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {wordWrap ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-slate-600 dark:text-slate-400 mb-1.5">
                    Execution Engine Priority
                  </label>
                  <select
                    value={preferredEngine}
                    onChange={(e) => setPreferredEngine(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <option value="auto">Auto (Pyodide 3.12 + GCC Sandbox / Offline AST)</option>
                    <option value="wasm">Local Browser Only (100% Offline WebAssembly / AST)</option>
                    <option value="cloud">Server Sandbox First</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowShortcutsModal(true)}
            title="Keyboard Shortcuts"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen((f) => !f)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen IDE'}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MAIN IDE BODY: Left Explorer + Center Editor/Notebook + Right Output Studio */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* 1. LEFT WORKSPACE EXPLORER SIDEBAR */}
        {showExplorer && (
          <aside className="w-full lg:w-64 shrink-0 bg-slate-50/90 dark:bg-[#0F172A] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col max-h-72 lg:max-h-none overflow-y-auto">
            {/* Active Project Selector & Actions */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Projects
                </span>
                <button
                  onClick={() => {
                    setNewProjectLang(language);
                    setIsCreatingProject((v) => !v);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  New
                </button>
              </div>

              {isCreatingProject && (
                <div className="mb-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Project name..."
                    className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  />
                  <div className="flex items-center justify-between gap-1">
                    <select
                      value={newProjectLang}
                      onChange={(e) => setNewProjectLang(e.target.value as CompilerLanguage)}
                      className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="python">Python 3.12</option>
                      <option value="cpp">C++20</option>
                      <option value="c">C17</option>
                    </select>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setIsCreatingProject(false)}
                        className="px-2 py-1 text-xs text-slate-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateProject}
                        className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {projects.map((proj) => {
                  const isCurrent = proj.id === activeProject.id;
                  return (
                    <div
                      key={proj.id}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                      }`}
                      onClick={() => setActiveProjectIdState(proj.id)}
                    >
                      {renamingProjectId === proj.id ? (
                        <input
                          type="text"
                          value={renameProjectText}
                          onChange={(e) => setRenameProjectText(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setProjects((prev) =>
                                prev.map((p) =>
                                  p.id === proj.id
                                    ? { ...p, name: renameProjectText.trim() || p.name }
                                    : p
                                )
                              );
                              setRenamingProjectId(null);
                            }
                          }}
                          onBlur={() => setRenamingProjectId(null)}
                          autoFocus
                          className="w-full px-1.5 py-0.5 text-xs bg-white dark:bg-slate-900 border border-blue-500 rounded"
                        />
                      ) : (
                        <>
                          <div className="flex items-center gap-2 truncate">
                            <span className="uppercase text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {proj.language}
                            </span>
                            <span className="truncate">{proj.name}</span>
                          </div>
                          <div
                            className="hidden group-hover:flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setRenamingProjectId(proj.id);
                                setRenameProjectText(proj.name);
                              }}
                              title="Rename Project"
                              className="p-0.5 hover:text-blue-600"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            {projects.length > 1 && (
                              <button
                                onClick={() => setConfirmDeleteProjectId(proj.id)}
                                title="Delete Project"
                                className="p-0.5 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {confirmDeleteProjectId && (
                <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs">
                  <p className="text-red-700 dark:text-red-300 mb-1.5">Delete this project?</p>
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setConfirmDeleteProjectId(null)}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteProject(confirmDeleteProjectId)}
                      className="px-2 py-0.5 rounded bg-red-600 text-white font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Project Files & Virtual FS Datasets */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Workspace Files
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsCreatingFile((v) => !v)}
                    title="New File"
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => fileUploadInputRef.current?.click()}
                    title="Upload Code or Dataset (.csv, .xlsx, .json, .py, .cpp)"
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isCreatingFile && (
                <div className="mb-2 flex items-center gap-1">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder={language === 'python' ? 'module.py or data.csv' : 'utils.h'}
                    className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateNewFile()}
                    autoFocus
                  />
                  <button
                    onClick={handleCreateNewFile}
                    className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded"
                  >
                    Add
                  </button>
                </div>
              )}

              <div className="space-y-1">
                {activeProject.files.map((file) => {
                  const isActive = file.name === activeFileName && workspaceMode === 'editor';
                  const isDataset = /\.(csv|xlsx|xls|json|txt)$/i.test(file.name);
                  return (
                    <div
                      key={file.name}
                      onClick={() => {
                        if (!file.isBinary) {
                          updateActiveProject((p) => ({ ...p, activeFileName: file.name }));
                          setWorkspaceMode('editor');
                        }
                      }}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-medium'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isDataset ? (
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <FileCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        )}
                        <span className="truncate font-mono">{file.name}</span>
                      </div>
                      <div
                        className="hidden group-hover:flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleDownloadFile(file)}
                          title="Download File"
                          className="p-0.5 hover:text-blue-600"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        {activeProject.files.length > 1 && (
                          <button
                            onClick={() => handleDeleteFile(file.name)}
                            title="Delete File"
                            className="p-0.5 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Starter Templates Section */}
            <div className="p-3">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Starter Templates
              </span>
              <div className="space-y-1.5">
                {COMPILER_TEMPLATES.filter((t) => t.language === language).map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => {
                      updateActiveProject((proj) => ({
                        ...proj,
                        activeFileName: tpl.fileName,
                        stdin: tpl.defaultStdin ?? proj.stdin,
                        files: proj.files.some((f) => f.name === tpl.fileName)
                          ? proj.files.map((f) =>
                              f.name === tpl.fileName
                                ? { ...f, content: tpl.code, updatedAt: Date.now() }
                                : f
                            )
                          : [
                              ...proj.files,
                              { name: tpl.fileName, content: tpl.code, updatedAt: Date.now() },
                            ],
                      }));
                      setWorkspaceMode('editor');
                    }}
                    className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-900/70 hover:bg-blue-50/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors"
                  >
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {tpl.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {tpl.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* 2. CENTER CODE EDITOR OR NOTEBOOK WORKSPACE */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0D1117] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
          {workspaceMode === 'editor' ? (
            <>
              {/* File Tabs & Editor Action Sub-bar */}
              <div className="flex items-center justify-between px-2 bg-slate-100/80 dark:bg-[#161B22] border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                <div className="flex items-center">
                  {activeProject.files
                    .filter((f) => !f.isBinary)
                    .map((file) => {
                      const active = file.name === activeFileName;
                      return (
                        <button
                          key={file.name}
                          onClick={() =>
                            updateActiveProject((p) => ({ ...p, activeFileName: file.name }))
                          }
                          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono border-r border-slate-200 dark:border-slate-800 transition-colors ${
                            active
                              ? 'bg-white dark:bg-[#0D1117] text-blue-600 dark:text-blue-400 font-semibold border-t-2 border-t-blue-600'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          <span>{file.name}</span>
                        </button>
                      );
                    })}
                </div>

                {/* Quick Search / Go to Line Bar */}
                <div className="flex items-center gap-1.5 py-1 pr-2">
                  {goToLineOpen ? (
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-blue-500 rounded-md px-2 py-0.5">
                      <span className="text-[11px] text-slate-400">Line:</span>
                      <input
                        type="number"
                        value={goToLineInput}
                        onChange={(e) => setGoToLineInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const num = parseInt(goToLineInput, 10);
                            if (!isNaN(num)) handleJumpToLine(num);
                            setGoToLineOpen(false);
                            setGoToLineInput('');
                          } else if (e.key === 'Escape') {
                            setGoToLineOpen(false);
                          }
                        }}
                        className="w-14 text-xs font-mono bg-transparent focus:outline-none tabular-nums"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setGoToLineOpen(true)}
                      className="px-2 py-1 rounded text-[11px] font-mono tabular-nums text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800"
                      title="Go to Line"
                    >
                      Ln {cursorPos.line}, Col {cursorPos.col}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (editorViewRef.current) {
                        openSearchPanel(editorViewRef.current);
                      }
                    }}
                    title="Find & Replace (Ctrl+F)"
                    className="p-1 rounded text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Error Line Diagnostic Banner (if active) */}
              {errorLine && (
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
                  <div className="flex items-center gap-2 truncate">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                    <span className="font-medium truncate">
                      Diagnostic reported on Line {errorLine}
                    </span>
                  </div>
                  <button
                    onClick={() => handleJumpToLine(errorLine)}
                    className="px-2.5 py-0.5 rounded bg-red-600 text-white font-semibold text-[11px] shrink-0 hover:bg-red-700"
                  >
                    Jump to Line {errorLine}
                  </button>
                </div>
              )}

              {/* CodeMirror 6 Mount Container */}
              <div
                ref={editorContainerRef}
                className="flex-1 min-h-[380px] overflow-hidden relative"
              />

              {/* Editor Status Footer */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-[#161B22] border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        runtimeState === 'ready' || runtimeState === 'completed'
                          ? 'bg-emerald-500'
                          : runtimeState === 'running'
                          ? 'bg-blue-500 animate-pulse'
                          : runtimeState === 'failed'
                          ? 'bg-red-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    {language === 'python'
                      ? runtimeStatusText
                      : language === 'cpp'
                      ? 'GCC C++20 / AST Ready'
                      : 'GCC C17 / AST Ready'}
                  </span>
                  <span className="hidden sm:inline">Tab: Accept Ghost Text</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>UTF-8</span>
                  <span>Spaces: {tabSize}</span>
                  <span>
                    Ln {cursorPos.line}, Col {cursorPos.col}
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* COLAB-STYLE PYTHON NOTEBOOK WORKSPACE */
            <div className="flex-1 flex flex-col min-h-[420px] overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-[#0B0F17]">
              {/* Notebook Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateNotebookCells((cells) => [
                        ...cells,
                        {
                          id: `cell-code-${Date.now()}`,
                          type: 'code',
                          content: '# New Python cell\n',
                          status: 'idle',
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Code Cell
                  </button>
                  <button
                    onClick={() =>
                      updateNotebookCells((cells) => [
                        ...cells,
                        {
                          id: `cell-md-${Date.now()}`,
                          type: 'markdown',
                          content: '### Documentation Note\nDescribe your analysis step here.',
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Markdown Cell
                  </button>
                  <button
                    onClick={() =>
                      updateNotebookCells((cells) =>
                        cells.map((c) => ({
                          ...c,
                          stdout: '',
                          stderr: '',
                          plots: [],
                          dataframes: [],
                          status: 'idle',
                          executionCount: null,
                        }))
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Clear Outputs
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => ipynbInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import .ipynb
                  </button>
                  <button
                    onClick={handleExportIpynb}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export .ipynb
                  </button>
                </div>
              </div>

              {/* Notebook Cells List */}
              {notebookCells.map((cell, idx) => (
                <div
                  key={cell.id}
                  className="rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden"
                >
                  {/* Cell Header */}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-[#161B22] border-b border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      {cell.type === 'code' ? (
                        <button
                          onClick={() => handleRunNotebookCell(cell.id)}
                          disabled={isRunning}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Run
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          Markdown
                        </span>
                      )}
                      {cell.type === 'code' && (
                        <span className="font-mono text-slate-400 tabular-nums">
                          [{cell.status === 'running' ? '*' : cell.executionCount || ' '}]
                        </span>
                      )}
                      {cell.executionTimeMs !== undefined && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                          {cell.executionTimeMs}ms
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() =>
                          updateNotebookCells((cells) => {
                            const copy = [...cells];
                            [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                            return copy;
                          })
                        }
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={idx === notebookCells.length - 1}
                        onClick={() =>
                          updateNotebookCells((cells) => {
                            const copy = [...cells];
                            [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
                            return copy;
                          })
                        }
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      {notebookCells.length > 1 && (
                        <button
                          onClick={() =>
                            updateNotebookCells((cells) => cells.filter((c) => c.id !== cell.id))
                          }
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cell Content Editor */}
                  <div className="p-3">
                    <textarea
                      value={cell.content}
                      onChange={(e) =>
                        updateNotebookCells((cells) =>
                          cells.map((c) =>
                            c.id === cell.id ? { ...c, content: e.target.value } : c
                          )
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.shiftKey && cell.type === 'code') {
                          e.preventDefault();
                          handleRunNotebookCell(cell.id);
                        }
                      }}
                      rows={Math.max(3, cell.content.split('\n').length)}
                      className="w-full font-mono text-xs bg-slate-50 dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 p-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 resize-y"
                      placeholder={
                        cell.type === 'code'
                          ? 'Write Python code... (Press Shift+Enter to run cell)'
                          : 'Write Markdown notes...'
                      }
                    />
                  </div>

                  {/* Cell Execution Output */}
                  {cell.type === 'code' &&
                    (cell.stdout ||
                      cell.stderr ||
                      (cell.plots && cell.plots.length > 0) ||
                      (cell.dataframes && cell.dataframes.length > 0)) && (
                      <div className="px-4 py-3 bg-slate-950 text-slate-100 border-t border-slate-800 space-y-3 text-xs font-mono">
                        {cell.stdout && (
                          <pre className="whitespace-pre-wrap text-emerald-300 leading-relaxed">
                            {cell.stdout}
                          </pre>
                        )}
                        {cell.stderr && (
                          <pre className="whitespace-pre-wrap text-red-400 leading-relaxed">
                            {cell.stderr}
                          </pre>
                        )}
                        {cell.plots && cell.plots.length > 0 && (
                          <div className="grid grid-cols-1 gap-3 pt-2">
                            {cell.plots.map((b64, pIdx) => (
                              <div
                                key={pIdx}
                                className="bg-white p-3 rounded-lg inline-block max-w-full"
                              >
                                <img
                                  src={`data:image/png;base64,${b64}`}
                                  alt={`Cell Plot ${pIdx + 1}`}
                                  className="max-h-80 w-auto object-contain mx-auto"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. RIGHT / BOTTOM OUTPUT, PLOTS, DATAFRAMES & PACKAGES STUDIO */}
        <div className="w-full lg:w-[44%] xl:w-[45%] shrink-0 flex flex-col bg-white dark:bg-[#0F172A] min-h-[360px]">
          {/* Studio Navigation Tabs */}
          <div className="flex items-center justify-between px-2 bg-slate-100/90 dark:bg-[#161B22] border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
            <div className="flex items-center">
              {(
                [
                  { id: 'console', label: 'Console', icon: Terminal, badge: null },
                  {
                    id: 'stdin',
                    label: 'Input (stdin)',
                    icon: Code2,
                    badge: stdin.trim() ? stdin.trim().split('\n').length : null,
                  },
                  {
                    id: 'plots',
                    label: 'Plots',
                    icon: ImageIcon,
                    badge: plots.length > 0 ? plots.length : null,
                  },
                  {
                    id: 'dataframes',
                    label: 'DataFrames',
                    icon: TableIcon,
                    badge: dataframes.length > 0 ? dataframes.length : null,
                  },
                  {
                    id: 'problems',
                    label: 'Problems',
                    icon: AlertCircle,
                    badge: diagnostics.length > 0 ? diagnostics.length : null,
                  },
                  {
                    id: 'packages',
                    label: 'Offline & Packages',
                    icon: Package,
                    badge: null,
                  },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#0F172A]'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge !== null && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                          tab.id === 'problems'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Studio Tab Content Area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* TAB 1: CONSOLE OUTPUT */}
            {activeTab === 'console' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Console Status Header */}
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {exitCode !== null && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] tabular-nums ${
                          exitCode === 0
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                        }`}
                      >
                        {exitCode === 0 ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        Exit: {exitCode}
                      </span>
                    )}
                    {execTimeMs !== null && (
                      <span className="inline-flex items-center gap-1 text-slate-500 font-mono text-[11px] tabular-nums">
                        <Clock className="w-3 h-3" />
                        {execTimeMs} ms
                      </span>
                    )}
                    {compilerUsed && (
                      <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {compilerUsed}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${stdout}\n${stderr}`.trim());
                        setCopiedOutput(true);
                        setTimeout(() => setCopiedOutput(false), 1500);
                      }}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                      title="Copy Console Output"
                    >
                      {copiedOutput ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setStdout('');
                        setStderr('');
                        setExitCode(null);
                        setExecTimeMs(null);
                      }}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                      title="Clear Console"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Console Body */}
                <div className="flex-1 p-4 overflow-y-auto font-mono text-xs bg-[#0B0F17] text-slate-100 space-y-3">
                  {isRunning && (
                    <div className="flex items-center gap-2.5 text-blue-400 py-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>
                        {language === 'python'
                          ? runtimeStatusText || 'Executing Python 3.12 code...'
                          : `Compiling & executing ${language.toUpperCase()}...`}
                      </span>
                    </div>
                  )}

                  {!isRunning && !stdout && !stderr && (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-500">
                      <Terminal className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-xs font-sans">
                        Click <strong className="text-slate-300">Run Code</strong> or press{' '}
                        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                          Ctrl+Enter
                        </kbd>{' '}
                        to execute.
                      </p>
                      {/\b(input\s*\(|cin\s*>>|scanf\s*\()/.test(code) && (
                        <button
                          onClick={() => setActiveTab('stdin')}
                          className="mt-3 px-3 py-1.5 rounded-lg bg-blue-950/60 border border-blue-800/70 text-blue-300 text-[11px] font-sans hover:bg-blue-900/60"
                        >
                          Program uses standard input — Configure Stdin ({stdin.trim() ? 'Provided' : 'Empty'})
                        </button>
                      )}
                    </div>
                  )}

                  {stdout && (
                    <pre className="whitespace-pre-wrap break-words leading-relaxed text-slate-100">
                      {stdout}
                    </pre>
                  )}

                  {stderr && (
                    <pre className="whitespace-pre-wrap break-words leading-relaxed text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3">
                      {stderr}
                    </pre>
                  )}

                  {plots.length > 0 && (
                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setActiveTab('plots')}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-sans hover:bg-blue-600/30"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        View {plots.length} Generated Matplotlib {plots.length === 1 ? 'Figure' : 'Figures'}
                      </button>
                    </div>
                  )}

                  {dataframes.length > 0 && (
                    <div className="pt-1">
                      <button
                        onClick={() => setActiveTab('dataframes')}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-sans hover:bg-emerald-600/30"
                      >
                        <TableIcon className="w-3.5 h-3.5" />
                        Inspect {dataframes.length} Pandas {dataframes.length === 1 ? 'DataFrame' : 'DataFrames'} in Table Viewer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: STANDARD INPUT (STDIN) */}
            {activeTab === 'stdin' && (
              <div className="flex-1 flex flex-col p-4 space-y-3 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Standard Input Stream (stdin)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Enter each input value on a new line for Python <code>input()</code>, C++{' '}
                      <code>cin</code>, or C <code>scanf()</code>.
                    </p>
                  </div>
                  <button
                    onClick={() => setStdin('')}
                    className="px-2.5 py-1 rounded text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Clear
                  </button>
                </div>

                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder={'Line 1 for first input()\nLine 2 for second input()\n...'}
                  className="flex-1 min-h-[220px] w-full p-3 rounded-xl font-mono text-xs bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            )}

            {/* TAB 3: MATPLOTLIB PLOTS VIEWER */}
            {activeTab === 'plots' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                    {plots.length} {plots.length === 1 ? 'Figure' : 'Figures'} Rendered (Agg High-DPI PNG)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPlotDarkBg((v) => !v)}
                      className="px-2.5 py-1 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                    >
                      {plotDarkBg ? 'Light Canvas' : 'Dark Canvas'}
                    </button>
                    {plots.length > 0 && (
                      <button
                        onClick={() => setPlots([])}
                        className="px-2.5 py-1 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px]"
                      >
                        Clear Plots
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {plots.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
                      <ImageIcon className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-xs">
                        No Matplotlib figures generated yet. Call <code>plt.plot()</code>,{' '}
                        <code>plt.bar()</code>, and <code>plt.show()</code> in Python.
                      </p>
                    </div>
                  ) : (
                    plots.map((b64, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
                      >
                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                            Figure {idx + 1}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setZoomedPlotIndex(idx)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px]"
                            >
                              <ZoomIn className="w-3 h-3" />
                              Zoom
                            </button>
                            <button
                              onClick={() => handleDownloadPlot(b64, idx)}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-600 text-white font-medium text-[11px]"
                            >
                              <Download className="w-3 h-3" />
                              PNG
                            </button>
                          </div>
                        </div>
                        <div
                          className={`p-4 flex items-center justify-center ${
                            plotDarkBg ? 'bg-slate-950' : 'bg-white'
                          }`}
                        >
                          <img
                            src={`data:image/png;base64,${b64}`}
                            alt={`Matplotlib Figure ${idx + 1}`}
                            className="max-w-full h-auto object-contain rounded"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: PANDAS DATAFRAMES TABLE VIEWER */}
            {activeTab === 'dataframes' && (
              <div className="flex-1 flex flex-col min-h-0">
                {dataframes.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <TableIcon className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-xs">
                      Any Pandas <code>DataFrame</code> variables created in your Python script
                      automatically appear here for interactive tabular inspection and CSV export.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* DataFrame Variable Selector & Export Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5">
                        {dataframes.map((df, idx) => (
                          <button
                            key={df.name}
                            onClick={() => setSelectedDfIndex(idx)}
                            className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors ${
                              selectedDfIndex === idx
                                ? 'bg-blue-600 text-white font-semibold'
                                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {df.name}{' '}
                            <span className="opacity-80 text-[10px] tabular-nums">
                              ({df.rows}×{df.cols})
                            </span>
                          </button>
                        ))}
                      </div>

                      {activeDataFrame && (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={dfSearchQuery}
                            onChange={(e) => setDfSearchQuery(e.target.value)}
                            placeholder="Filter rows..."
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs w-32"
                          />
                          <button
                            onClick={() => handleDownloadDataFrameCsv(activeDataFrame)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs"
                          >
                            <Download className="w-3 h-3" />
                            Export CSV
                          </button>
                        </div>
                      )}
                    </div>

                    {/* DataFrame Table */}
                    {activeDataFrame && (
                      <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                          <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-10">
                            <tr>
                              <th className="px-3 py-2 border-b border-r border-slate-200 dark:border-slate-800 text-slate-400 w-10">
                                #
                              </th>
                              {activeDataFrame.columns.map((col) => (
                                <th
                                  key={col}
                                  className="px-3 py-2 border-b border-r border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200"
                                >
                                  <div>{col}</div>
                                  <div className="text-[10px] font-normal text-slate-400">
                                    {activeDataFrame.dtypes[col] || 'object'}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                            {filteredDfRows.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40"
                              >
                                <td className="px-3 py-1.5 border-r border-slate-200 dark:border-slate-800 text-slate-400">
                                  {rIdx}
                                </td>
                                {activeDataFrame.columns.map((col) => (
                                  <td
                                    key={col}
                                    className="px-3 py-1.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap"
                                  >
                                    {row[col] === null || row[col] === undefined ? (
                                      <span className="text-amber-500 italic">NaN</span>
                                    ) : (
                                      String(row[col])
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB 5: PROBLEMS & COMPILER DIAGNOSTICS */}
            {activeTab === 'problems' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-2">
                {diagnostics.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500 opacity-60" />
                    <p className="text-xs">No syntax or compiler diagnostics detected.</p>
                  </div>
                ) : (
                  diagnostics.map((diag, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleJumpToLine(diag.line)}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 flex items-start gap-3 transition-colors"
                    >
                      <AlertCircle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          diag.severity === 'error' ? 'text-red-500' : 'text-amber-500'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                          <span className="uppercase text-[10px] tracking-wider">
                            {diag.severity}
                          </span>
                          <span className="font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                            Line {diag.line}, Col {diag.column}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-1 break-words">
                          {diag.message}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* TAB 6: OFFLINE RUNTIME & SCIENTIFIC PYTHON PACKAGES */}
            {activeTab === 'packages' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                {/* Offline Runtime Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        Offline WebAssembly Runtime & Scientific Wheels
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Caches Python 3.12 (Pyodide), NumPy, Pandas, Matplotlib, Scikit-Learn, and
                        C/C++ AST runtimes in browser CacheStorage.
                      </p>
                    </div>
                    {cacheStatus?.isDataScienceReady ? (
                      <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold shrink-0">
                        Offline Ready
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                        {cacheStatus ? `${cacheStatus.totalCachedFiles} files cached` : 'Checking...'}
                      </span>
                    )}
                  </div>

                  {downloadProgress && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono tabular-nums">
                        <span>{downloadProgress.currentFile}</span>
                        <span>{downloadProgress.percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-200"
                          style={{ width: `${downloadProgress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                      Cached Storage: {formatBytes(cacheStatus?.totalCachedBytes || 0)}
                    </span>
                    <div className="flex items-center gap-2">
                      {cacheStatus && cacheStatus.totalCachedFiles > 0 && (
                        <button
                          onClick={handleClearOfflineCache}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Clear Cache
                        </button>
                      )}
                      <button
                        onClick={handleDownloadOfflineBundle}
                        disabled={isDownloadingOffline}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold"
                      >
                        <HardDriveDownload className="w-3.5 h-3.5" />
                        {isDownloadingOffline
                          ? 'Downloading...'
                          : cacheStatus?.isDataScienceReady
                          ? 'Verify & Refresh Cache'
                          : 'Download Full Offline Bundle'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom Micropip Package Installer */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    Install Pure-Python PyPI Package (micropip)
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customPackageName}
                      onChange={(e) => setCustomPackageName(e.target.value)}
                      placeholder="e.g. seaborn, openpyxl, tabulate..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      onKeyDown={(e) => e.key === 'Enter' && handleInstallCustomPackage()}
                    />
                    <button
                      onClick={() => handleInstallCustomPackage()}
                      disabled={isInstallingPackage || !customPackageName.trim()}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold"
                    >
                      {isInstallingPackage ? 'Installing...' : 'Install'}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] text-slate-400">Quick install:</span>
                    {['seaborn', 'openpyxl', 'tabulate'].map((pkg) => (
                      <button
                        key={pkg}
                        onClick={() => handleInstallCustomPackage(pkg)}
                        className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] hover:bg-blue-100 dark:hover:bg-blue-950"
                      >
                        + {pkg}
                      </button>
                    ))}
                  </div>
                  {packageInstallMessage && (
                    <p className="text-[11px] font-mono text-blue-600 dark:text-blue-400 pt-1">
                      {packageInstallMessage}
                    </p>
                  )}
                </div>

                {/* Pre-configured Scientific Packages List */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    Scientific & Standard Library Packages
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PYTHON_PACKAGES.map((pkg) => {
                      const isLoaded = loadedPyPackages.includes(pkg.id);
                      const isCached = Boolean(cacheStatus?.packages[pkg.id]);
                      return (
                        <div
                          key={pkg.id}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {pkg.name}{' '}
                              <span className="text-[10px] font-mono text-slate-400">
                                v{pkg.version}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">{pkg.description}</div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                              isLoaded
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : isCached
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {isLoaded ? 'Active' : isCached ? 'Cached' : 'Auto-Load'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ZOOMED PLOT MODAL */}
      {zoomedPlotIndex !== null && plots[zoomedPlotIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setZoomedPlotIndex(null)}
        >
          <div
            className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-sm">Figure {zoomedPlotIndex + 1}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPlot(plots[zoomedPlotIndex], zoomedPlotIndex)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PNG
                </button>
                <button
                  onClick={() => setZoomedPlotIndex(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 bg-white flex justify-center">
              <img
                src={`data:image/png;base64,${plots[zoomedPlotIndex]}`}
                alt="Zoomed Plot"
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS MODAL */}
      {showShortcutsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowShortcutsModal(false)}
        >
          <div
            className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm">IDE Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcutsModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                ['Run Code / Script', 'Ctrl + Enter / Cmd + Enter'],
                ['Run Notebook Cell', 'Shift + Enter'],
                ['Accept Inline Ghost Suggestion', 'Tab'],
                ['Dismiss Ghost Suggestion', 'Esc'],
                ['Trigger IntelliSense Popup', 'Ctrl + Space'],
                ['Find & Replace in Editor', 'Ctrl + F / Cmd + F'],
                ['Toggle Line Comment', 'Ctrl + /'],
              ].map(([desc, keys]) => (
                <div key={desc} className="flex items-center justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-300">{desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                    {keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompilerTool;
