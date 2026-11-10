import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import {
  Play,
  Square,
  RotateCcw,
  Trash2,
  Download,
  Copy,
  Check,
  Terminal,
  Code2,
  FileCode,
  RefreshCw,
  Maximize2,
  Minimize2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  Wifi,
  WifiOff,
  HardDriveDownload,
  Package,
  WrapText,
  FolderOpen,
  FilePlus,
  Upload,
  Table as TableIcon,
  BookOpen,
  FileArchive,
  ZoomIn,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  Database,
  Cpu,
  GraduationCap,
  Share2,
} from 'lucide-react';

import {
  CompilerLanguage,
  CompilerProject,
  ProjectFile,
  COMPILER_TEMPLATES,
  MINIMAL_HELLO_WORLD,
  getDefaultFileName,
  loadCompilerProjects,
  saveCompilerProjects,
  getActiveProjectId,
  setActiveProjectId,
  exportProjectAsZip,
  saveDatasetToOpfs,
} from '../../lib/compilerProjectStore';
import {
  PYTHON_PACKAGES,
  CacheCheckStatus,
  SetupPreferenceMode,
  PackageCategory,
  inspectCompilerCache,
  downloadCoreRuntime,
  downloadPythonPackage,
  downloadDataSciencePreset,
  downloadFullDataScienceBundle,
  removeCachedPackage,
  clearCompilerCache,
  getSetupPreferenceMode,
  setSetupPreferenceMode,
} from '../../lib/offlineCompilerCache';
import { runClientCpp, validateSyntax } from '../../lib/clientCppRunner';
import { analyzeContext, fuzzyMatchScore, predictGhostText } from '../../lib/autocompleteEngine';

interface CapturedDataFrame {
  name: string;
  rows: number;
  cols: number;
  columns: string[];
  dtypes: Record<string, string>;
  previewRows: Record<string, any>[];
  csvContent: string;
}

interface ExecutionHistoryItem {
  id: string;
  timestamp: string;
  language: CompilerLanguage;
  fileName: string;
  durationMs: number;
  engine: string;
  status: 'completed' | 'failed' | 'cancelled';
}

type JobLifecycleState = 'idle' | 'preparing' | 'running' | 'completed' | 'failed' | 'cancelled';
type OutputTab = 'console' | 'plots' | 'dataframes' | 'stdin';
type MaximizedPanel = 'none' | 'editor' | 'output';

interface ActiveClassroomAssignment {
  id: string;
  title: string;
  description: string;
  language: CompilerLanguage;
  starterCode: string;
  sampleInput: string;
  sampleOutput: string;
  durationMinutes?: number;
  totalTestCasesCount: number;
  hiddenTestCasesCount: number;
  sampleTestCases: Array<{ id: string; input: string; expectedOutput: string }>;
}

function getStudentErrorHint(stderrText: string): { line?: number; hint?: string } {
  if (!stderrText) return {};
  let line: number | undefined;
  const pyMatches = [...stderrText.matchAll(/File\s+"(?:<exec>|main\.py|script\.py|[^"]*)",\s+line\s+(\d+)/g)];
  if (pyMatches.length > 0) {
    line = Number(pyMatches[pyMatches.length - 1][1]);
  } else {
    const cppMatch = stderrText.match(/(?:main\.(?:cpp|c)|<source>):(\d+):(?:\d+:)?\s*error:/i);
    if (cppMatch) {
      line = Number(cppMatch[1]);
    }
  }

  let hint: string | undefined;
  if (/EOFError:\s*EOF when reading a line/i.test(stderrText)) {
    hint = 'Your program called input(), but no more input lines were available. Open the "Input (STDIN)" tab and enter one value per line before clicking Run.';
  } else if (/IndentationError:/i.test(stderrText)) {
    hint = 'Check your indentation (spaces/tabs) at the highlighted line — blocks inside if, for, while, and def must be indented consistently.';
  } else if (/SyntaxError:/i.test(stderrText)) {
    hint = 'Check for missing colons (:), unclosed parentheses/quotes, or typos on or right before the reported line.';
  } else if (/NameError:\s*name\s+'([^']+)'\s+is not defined/i.test(stderrText)) {
    const m = stderrText.match(/NameError:\s*name\s+'([^']+)'\s+is not defined/i);
    hint = `Variable or function '${m ? m[1] : ''}' was used before being assigned or imported. Check spelling and capitalization.`;
  } else if (/ZeroDivisionError:/i.test(stderrText)) {
    hint = 'A division or modulo operation attempted to divide by 0. Check your denominator values.';
  } else if (/expected\s+';'/i.test(stderrText)) {
    hint = 'C/C++ statement is missing a semicolon (;) at the end of the preceding line.';
  }
  return { line, hint };
}

export function CompilerTool() {
  // 1. Projects & Active File State
  const [projects, setProjects] = useState<CompilerProject[]>(() => loadCompilerProjects());
  const [activeProjectId, setActiveProjIdState] = useState<string>(() =>
    getActiveProjectId(loadCompilerProjects())
  );

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0];
  }, [projects, activeProjectId]);

  const activeFile = useMemo(() => {
    if (!activeProject) return { name: 'main.py', content: MINIMAL_HELLO_WORLD.python, updatedAt: Date.now() };
    return (
      activeProject.files.find((f) => f.name === activeProject.activeFileName) ||
      activeProject.files[0] || {
        name: getDefaultFileName(activeProject.language),
        content: MINIMAL_HELLO_WORLD[activeProject.language],
        updatedAt: Date.now(),
      }
    );
  }, [activeProject]);

  // 2. Spacious Layout State (Sidebar collapsed by default for maximum editor space)
  const [showExplorer, setShowExplorer] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tooltrack_compiler_explorer_open') === 'true';
    } catch {
      return false;
    }
  });
  const [editorWidthPct, setEditorWidthPct] = useState<number>(63);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [maximizedPanel, setMaximizedPanel] = useState<MaximizedPanel>('none');
  const [wordWrap, setWordWrap] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(14);
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');

  // Menus & Modals
  const [showExamplesMenu, setShowExamplesMenu] = useState<boolean>(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);
  const [newFileModalOpen, setNewFileModalOpen] = useState<boolean>(false);
  const [newFileNameInput, setNewFileNameInput] = useState<string>('');
  const [zoomedPlot, setZoomedPlot] = useState<string | null>(null);

  // 3. Execution & Output State
  const [activeTab, setActiveTab] = useState<OutputTab>('console');
  const [jobState, setJobState] = useState<JobLifecycleState>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [stdout, setStdout] = useState<string>('');
  const [stderr, setStderr] = useState<string>('');
  const [plots, setPlots] = useState<string[]>([]);
  const [dataframes, setDataframes] = useState<CapturedDataFrame[]>([]);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [runtimeInitMs, setRuntimeInitMs] = useState<number | null>(null);
  const [activeEngineUsed, setActiveEngineUsed] = useState<string>('Ready');
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistoryItem[]>([]);
  const [copiedOutput, setCopiedOutput] = useState<boolean>(false);

  // DataFrame Interactive Viewer State
  const [selectedDfIndex, setSelectedDfIndex] = useState<number>(0);
  const [dfSortColumn, setDfSortColumn] = useState<string | null>(null);
  const [dfSortAsc, setDfSortAsc] = useState<boolean>(true);
  const [dfSearchQuery, setDfSearchQuery] = useState<string>('');

  // 4. Runtime & Offline Cache State
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pyodideReady, setPyodideReady] = useState<boolean>(false);
  const [pyodideLoading, setPyodideLoading] = useState<boolean>(false);
  const [loadedSessionPackages, setLoadedSessionPackages] = useState<string[]>([]);
  const [cacheStatus, setCacheStatus] = useState<CacheCheckStatus | null>(null);
  const [setupMode, setSetupModeState] = useState<SetupPreferenceMode>(() => getSetupPreferenceMode());
  const [downloadingOffline, setDownloadingOffline] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    percent: number;
    label: string;
  } | null>(null);
  const [pkgCategoryFilter, setPkgCategoryFilter] = useState<PackageCategory | 'All'>('All');
  const [pkgSearchQuery, setPkgSearchQuery] = useState<string>('');
  const [customPipInput, setCustomPipInput] = useState<string>('');
  const [installingPkgId, setInstallingPkgId] = useState<string | null>(null);

  // Refs
  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const activeJobIdRef = useRef<string | null>(null);
  const pendingPromisesRef = useRef<
    Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>
  >(new Map());
  const fileUploadInputRef = useRef<HTMLInputElement | null>(null);
  const autoSetupTriggeredRef = useRef<boolean>(false);

  // Classroom & Exercise Sharing State
  const [showClassroomModal, setShowClassroomModal] = useState<boolean>(false);
  const [classroomTab, setClassroomTab] = useState<'student' | 'teacher'>('student');
  const [activeAssignment, setActiveAssignment] = useState<ActiveClassroomAssignment | null>(null);
  const [assignmentLookupId, setAssignmentLookupId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [studentIdInput, setStudentIdInput] = useState<string>('');
  const [submittingSolution, setSubmittingSolution] = useState<boolean>(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<any | null>(null);
  const [submissionError, setSubmissionError] = useState<string>('');
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);

  // Teacher Assignment Creator & Submissions Viewer State
  const [teacherTitle, setTeacherTitle] = useState<string>('');
  const [teacherDesc, setTeacherDesc] = useState<string>('');
  const [teacherLang, setTeacherLang] = useState<CompilerLanguage>('python');
  const [teacherStarterCode, setTeacherStarterCode] = useState<string>(MINIMAL_HELLO_WORLD.python);
  const [teacherSampleIn, setTeacherSampleIn] = useState<string>('');
  const [teacherSampleOut, setTeacherSampleOut] = useState<string>('');
  const [teacherHiddenIn, setTeacherHiddenIn] = useState<string>('');
  const [teacherHiddenOut, setTeacherHiddenOut] = useState<string>('');
  const [createdAssignmentInfo, setCreatedAssignmentInfo] = useState<{
    assignmentId: string;
    teacherKey: string;
  } | null>(null);
  const [teacherReviewAsgnId, setTeacherReviewAsgnId] = useState<string>('');
  const [teacherReviewKey, setTeacherReviewKey] = useState<string>('');
  const [teacherSubmissionsList, setTeacherSubmissionsList] = useState<any[] | null>(null);
  const [teacherStatusMsg, setTeacherStatusMsg] = useState<string>('');

  const projectsRef = useRef<CompilerProject[]>(projects);
  projectsRef.current = projects;

  const isRunning = jobState === 'preparing' || jobState === 'running';

  // Persist explorer open/closed state
  useEffect(() => {
    try {
      localStorage.setItem('tooltrack_compiler_explorer_open', String(showExplorer));
    } catch {}
  }, [showExplorer]);

  // Debounced autosave (avoids synchronous storage writes on every keystroke or during code execution)
  useEffect(() => {
    if (isRunning) return;
    const timer = setTimeout(() => {
      saveCompilerProjects(projects);
    }, 350);
    return () => clearTimeout(timer);
  }, [projects, isRunning]);

  // Immediate flush on page unload/refresh so students never lose work during exams or labs
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCompilerProjects(projectsRef.current);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Load shared exercise or classroom assignment from URL query parameters (?assignment=... or ?exercise=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const asgnParam = params.get('assignment');
    const exerciseParam = params.get('exercise');

    if (asgnParam) {
      setAssignmentLookupId(asgnParam);
      fetch(`/api/classroom/assignments/${encodeURIComponent(asgnParam)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && data.id) {
            setActiveAssignment(data);
          }
        })
        .catch(() => {});
    } else if (exerciseParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(exerciseParam)));
        if (decoded && decoded.code && decoded.language) {
          const lang: CompilerLanguage =
            decoded.language === 'cpp' || decoded.language === 'c' ? decoded.language : 'python';
          const fileName = getDefaultFileName(lang);
          const sharedProjId = `proj-shared-${Date.now()}`;
          const newProj: CompilerProject = {
            id: sharedProjId,
            name: decoded.title || 'Shared Exercise',
            language: lang,
            activeFileName: fileName,
            stdin: String(decoded.stdin || ''),
            files: [{ name: fileName, content: String(decoded.code), updatedAt: Date.now() }],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setProjects((prev) => [newProj, ...prev]);
          setActiveProjIdState(sharedProjId);
        }
      } catch {}
    }
  }, []);

  // Online / Offline listener
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

  // Inspect offline cache on mount
  const refreshCacheStatus = useCallback(async () => {
    const status = await inspectCompilerCache();
    setCacheStatus(status);
    return status;
  }, []);

  useEffect(() => {
    refreshCacheStatus().then((status) => {
      // Automatic progressive background setup if user selected Data Science or Complete mode
      // and is online on a non-metered connection
      if (
        !autoSetupTriggeredRef.current &&
        navigator.onLine &&
        !status.isMeteredConnection
      ) {
        autoSetupTriggeredRef.current = true;
        if (status.setupMode === 'datascience' && !status.isDataScienceReady) {
          downloadDataSciencePreset().then(() => refreshCacheStatus()).catch(() => {});
        } else if (status.setupMode === 'complete' && !status.allPackagesReady) {
          downloadFullDataScienceBundle().then(() => refreshCacheStatus()).catch(() => {});
        }
      }
    });
  }, [refreshCacheStatus]);

  // Initialize / get Pyodide Web Worker
  const ensurePythonWorker = useCallback((): Worker => {
    if (workerRef.current) {
      return workerRef.current;
    }

    const worker = new Worker(new URL('../../workers/pythonWorker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data || {};
      const { type, id, text, message, state, installed, installedPackages, runtimeInitMs: initMs } = data;

      if (typeof initMs === 'number' && initMs > 0) {
        setRuntimeInitMs(initMs);
      }

      if (Array.isArray(installedPackages)) {
        setLoadedSessionPackages(installedPackages);
      } else if (Array.isArray(installed)) {
        setLoadedSessionPackages(installed);
      }

      if (type === 'STATUS' || type === 'status') {
        setStatusMessage(message || '');
        if (state === 'ready') {
          setPyodideReady(true);
          setPyodideLoading(false);
        }
        return;
      }

      if (type === 'INIT_COMPLETE' || type === 'initialized') {
        setPyodideReady(true);
        setPyodideLoading(false);
        setStatusMessage('');
        refreshCacheStatus();
        if (id && pendingPromisesRef.current.has(id)) {
          pendingPromisesRef.current.get(id)!.resolve(data);
          pendingPromisesRef.current.delete(id);
        }
        return;
      }

      if (type === 'STDOUT' || type === 'stdout') {
        if (typeof text === 'string') {
          setStdout((prev) => (prev.length > 350000 ? prev.slice(-300000) + text : prev + text));
        }
        return;
      }

      if (type === 'STDERR' || type === 'stderr') {
        if (typeof text === 'string') {
          setStderr((prev) => (prev.length > 350000 ? prev.slice(-300000) + text : prev + text));
        }
        return;
      }

      if (type === 'RESULT' || type === 'ERROR') {
        if (id && pendingPromisesRef.current.has(id)) {
          const handler = pendingPromisesRef.current.get(id)!;
          pendingPromisesRef.current.delete(id);
          if (type === 'ERROR') {
            handler.reject(data);
          } else {
            handler.resolve(data);
          }
        }
        return;
      }
    };

    worker.onerror = (err) => {
      setPyodideLoading(false);
      setStatusMessage('');
      pendingPromisesRef.current.forEach(({ reject }) => {
        reject(new Error(err.message || 'Python Web Worker encountered a fatal error.'));
      });
      pendingPromisesRef.current.clear();
    };

    workerRef.current = worker;
    return worker;
  }, [refreshCacheStatus]);

  // Warm up lightweight core Python runtime in background when Python is active
  useEffect(() => {
    if (activeProject?.language === 'python' && !pyodideReady && !pyodideLoading) {
      setPyodideLoading(true);
      const worker = ensurePythonWorker();
      const initId = `init-${Date.now()}`;
      worker.postMessage({ type: 'INIT', id: initId });
    }
  }, [activeProject?.language, pyodideReady, pyodideLoading, ensurePythonWorker]);

  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Resizable Split Pane Dragging
  useEffect(() => {
    if (!isDraggingSplit) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const pct = Math.max(35, Math.min(78, (relX / Math.max(1, rect.width)) * 100));
      setEditorWidthPct(Math.round(pct * 10) / 10);
    };

    const handleMouseUp = () => {
      setIsDraggingSplit(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplit]);

  // Update active file content
  const updateActiveFileContent = useCallback(
    (newContent: string) => {
      setProjects((prev) =>
        prev.map((proj) => {
          if (proj.id !== activeProject.id) return proj;
          const exists = proj.files.some((f) => f.name === activeFile.name);
          const updatedFiles = exists
            ? proj.files.map((f) =>
                f.name === activeFile.name
                  ? { ...f, content: newContent, updatedAt: Date.now() }
                  : f
              )
            : [
                ...proj.files,
                { name: activeFile.name, content: newContent, updatedAt: Date.now() },
              ];
          return {
            ...proj,
            files: updatedFiles,
            updatedAt: Date.now(),
          };
        })
      );
    },
    [activeProject?.id, activeFile?.name]
  );

  // Update STDIN
  const updateStdin = useCallback(
    (newStdin: string) => {
      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === activeProject.id ? { ...proj, stdin: newStdin, updatedAt: Date.now() } : proj
        )
      );
    },
    [activeProject?.id]
  );

  // Switch language workspace
  const handleSelectLanguage = useCallback(
    (lang: CompilerLanguage) => {
      const targetProj = projects.find((p) => p.language === lang);
      if (targetProj) {
        setActiveProjIdState(targetProj.id);
        setActiveProjectId(targetProj.id);
      } else {
        const newProj: CompilerProject = {
          id: `proj-${lang}-${Date.now()}`,
          name: `${lang.toUpperCase()} Workspace`,
          language: lang,
          activeFileName: getDefaultFileName(lang),
          stdin: '',
          files: [
            {
              name: getDefaultFileName(lang),
              content: MINIMAL_HELLO_WORLD[lang],
              updatedAt: Date.now(),
            },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setProjects((prev) => [...prev, newProj]);
        setActiveProjIdState(newProj.id);
        setActiveProjectId(newProj.id);
      }
      setStdout('');
      setStderr('');
      setPlots([]);
      setDataframes([]);
    },
    [projects]
  );

  // Stop currently running job and recover Worker cleanly
  const handleStopExecution = useCallback(() => {
    activeJobIdRef.current = null;
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    pendingPromisesRef.current.clear();
    setPyodideReady(false);
    setPyodideLoading(false);
    setJobState('cancelled');
    setStatusMessage('');
    setStderr((prev) =>
      prev ? `${prev}\n[Execution stopped by user]` : '[Execution stopped by user]'
    );

    // Immediately warm up a fresh replacement worker if in Python mode
    if (activeProject?.language === 'python') {
      setTimeout(() => {
        setPyodideLoading(true);
        const w = ensurePythonWorker();
        w.postMessage({ type: 'INIT', id: `init-${Date.now()}` });
      }, 80);
    }
  }, [activeProject?.language, ensurePythonWorker]);

  // Restart Python Runtime Session
  const handleRestartRuntime = useCallback(async () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    pendingPromisesRef.current.clear();
    setPyodideReady(false);
    setPyodideLoading(true);
    setLoadedSessionPackages([]);
    setJobState('idle');
    setStatusMessage('Restarting Python 3.12 runtime...');
    const worker = ensurePythonWorker();
    worker.postMessage({ type: 'INIT', id: `restart-${Date.now()}` });
  }, [ensurePythonWorker]);

  // Clear editor decorations
  const clearEditorErrorMarkers = useCallback(() => {
    if (!monacoRef.current || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (model) {
      monacoRef.current.editor.setModelMarkers(model, 'compiler-diagnostics', []);
    }
  }, []);

  // Highlight error line in Monaco Editor
  const highlightEditorErrorLine = useCallback((line: number, message: string) => {
    if (!monacoRef.current || !editorRef.current || !line || line < 1) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    const maxLine = model.getLineCount();
    const safeLine = Math.min(line, maxLine);
    monacoRef.current.editor.setModelMarkers(model, 'compiler-diagnostics', [
      {
        startLineNumber: safeLine,
        startColumn: 1,
        endLineNumber: safeLine,
        endColumn: model.getLineMaxColumn(safeLine),
        message,
        severity: monacoRef.current.MarkerSeverity.Error,
      },
    ]);
  }, []);

  // Main Run Code Handler
  const handleRunCode = useCallback(async () => {
    if (!activeProject || !activeFile) return;

    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    activeJobIdRef.current = jobId;

    setJobState('preparing');
    setStdout('');
    setStderr('');
    setPlots([]);
    setDataframes([]);
    setExecutionTimeMs(null);
    setStatusMessage('Preparing execution...');
    clearEditorErrorMarkers();

    if (activeTab === 'plots' || activeTab === 'dataframes') {
      setActiveTab('console');
    }

    const code = activeFile.content;
    const stdin = activeProject.stdin || '';
    const lang = activeProject.language;
    const startWall = performance.now();

    try {
      if (lang === 'python') {
        const needsDataScienceOrPackages =
          /\b(numpy|pandas|matplotlib|pyplot|plt|sklearn|scipy|sympy|PIL|pillow|bs4|beautifulsoup4|statsmodels|seaborn|openpyxl|networkx|yaml|regex|sqlite3)\b/.test(
            code
          );

        const hasMultipleFiles = activeProject.files.length > 1;

        // Fast-path: If Pyodide is still downloading on a cold start, user is online,
        // and the program is a simple standard-library script (like Hello World) without extra virtual files,
        // run via the backend fast Python runner so the user gets instant (<40ms) output while Pyodide finishes warming up.
        if (!pyodideReady && isOnline && !needsDataScienceOrPackages && !hasMultipleFiles) {
          try {
            setJobState('running');
            setStatusMessage('Running Python 3...');
            const resp = await fetch('/api/compile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                language: 'python',
                code,
                stdin,
                files: activeProject.files,
              }),
            });
            if (activeJobIdRef.current !== jobId) return;

            if (resp.ok) {
              const resJson = await resp.json();
              if (!resJson.fallbackToWasm) {
                const elapsed = resJson.executionTimeMs || Math.round(performance.now() - startWall);
                setStdout(resJson.stdout || '');
                setStderr(resJson.stderr || '');
                setPlots(resJson.plots || []);
                setExecutionTimeMs(elapsed);
                setActiveEngineUsed('Python 3.11 Fast Engine');
                const finalStatus = resJson.success ? 'completed' : 'failed';
                setJobState(finalStatus);
                setStatusMessage('');
                setExecutionHistory((prev) => [
                  {
                    id: jobId,
                    timestamp: new Date().toLocaleTimeString(),
                    language: 'python',
                    fileName: activeFile.name,
                    durationMs: elapsed,
                    engine: 'Python 3.11 Fast Engine',
                    status: finalStatus,
                  },
                  ...prev.slice(0, 19),
                ]);
                return;
              }
            }
          } catch {
            // Fall through to Pyodide WebAssembly Worker
          }
        }

        // Execute in persistent Pyodide 3.12 WebAssembly Worker
        const worker = ensurePythonWorker();
        setJobState('running');
        setStatusMessage(
          pyodideReady ? 'Executing in Python 3.12 Worker...' : 'Initializing Python 3.12 runtime...'
        );

        const workerResult: any = await new Promise((resolve, reject) => {
          pendingPromisesRef.current.set(jobId, { resolve, reject });
          worker.postMessage({
            type: 'RUN',
            id: jobId,
            code,
            stdin,
            files: activeProject.files,
          });
        });

        if (activeJobIdRef.current !== jobId) return;

        const elapsed = workerResult.executionTimeMs ?? Math.round(performance.now() - startWall);
        setExecutionTimeMs(elapsed);
        setActiveEngineUsed('Python 3.12 WebAssembly (Local Worker)');

        if (typeof workerResult.stdout === 'string' && workerResult.stdout.length > 0) {
          setStdout(workerResult.stdout);
        }
        if (typeof workerResult.stderr === 'string' && workerResult.stderr.length > 0) {
          setStderr(workerResult.stderr);
        }
        if (Array.isArray(workerResult.plots) && workerResult.plots.length > 0) {
          setPlots(workerResult.plots);
          setActiveTab('plots');
        }
        if (Array.isArray(workerResult.dataframes) && workerResult.dataframes.length > 0) {
          setDataframes(workerResult.dataframes);
          setSelectedDfIndex(0);
          if (!workerResult.plots || workerResult.plots.length === 0) {
            // Keep console visible so print(df) output is immediately seen, while DataFrames tab shows badge
          }
        }

        setJobState('completed');
        setStatusMessage('');
        refreshCacheStatus();
        setExecutionHistory((prev) => [
          {
            id: jobId,
            timestamp: new Date().toLocaleTimeString(),
            language: 'python',
            fileName: activeFile.name,
            durationMs: elapsed,
            engine: 'Python 3.12 Wasm Worker',
            status: 'completed',
          },
          ...prev.slice(0, 19),
        ]);
        return;
      }

      // C and C++ Compilation & Execution
      setJobState('running');
      setStatusMessage(`Compiling ${lang === 'cpp' ? 'C++20' : 'C17'}...`);

      // Check local syntax diagnostics first
      const syntaxDiagnostics = validateSyntax(code, lang);
      const fatalDiag = syntaxDiagnostics.find((d) => d.severity === 'error');
      if (fatalDiag) {
        highlightEditorErrorLine(fatalDiag.line, fatalDiag.message);
      }

      if (isOnline) {
        try {
          const resp = await fetch('/api/compile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language: lang,
              code,
              stdin,
              files: activeProject.files,
            }),
          });

          if (activeJobIdRef.current !== jobId) return;

          if (resp.ok) {
            const data = await resp.json();
            const elapsed = data.executionTimeMs ?? Math.round(performance.now() - startWall);
            setStdout(data.stdout || '');
            setStderr(data.stderr || '');
            setExecutionTimeMs(elapsed);
            const engineLabel = data.compiler || (lang === 'cpp' ? 'GCC C++20' : 'GCC C17');
            setActiveEngineUsed(engineLabel);

            if (Array.isArray(data.diagnostics) && data.diagnostics.length > 0) {
              const firstErr = data.diagnostics[0];
              if (firstErr?.line) {
                highlightEditorErrorLine(firstErr.line, firstErr.message || 'Compiler error');
              }
            }

            const finalState = data.success ? 'completed' : 'failed';
            setJobState(finalState);
            setStatusMessage('');
            setExecutionHistory((prev) => [
              {
                id: jobId,
                timestamp: new Date().toLocaleTimeString(),
                language: lang,
                fileName: activeFile.name,
                durationMs: elapsed,
                engine: engineLabel,
                status: finalState,
              },
              ...prev.slice(0, 19),
            ]);
            return;
          }
        } catch {
          // Offline or network unreachable — fall through to client-side C/C++ runtime
        }
      }

      // Offline / Local Client C/C++ Engine
      const localRes = await runClientCpp(code, stdin, lang);
      if (activeJobIdRef.current !== jobId) return;

      const elapsed = Math.round(performance.now() - startWall);
      setStdout(localRes.stdout || '');
      setStderr(localRes.stderr || '');
      setExecutionTimeMs(elapsed);
      const localEngine = localRes.compiler || (lang === 'cpp' ? 'Local C++20 AST Runtime' : 'Local C17 AST Runtime');
      setActiveEngineUsed(localEngine);
      const finalState = localRes.success ? 'completed' : 'failed';
      setJobState(finalState);
      setStatusMessage('');
      setExecutionHistory((prev) => [
        {
          id: jobId,
          timestamp: new Date().toLocaleTimeString(),
          language: lang,
          fileName: activeFile.name,
          durationMs: elapsed,
          engine: localEngine,
          status: finalState,
        },
        ...prev.slice(0, 19),
      ]);
    } catch (err: any) {
      if (activeJobIdRef.current !== jobId) return;
      const elapsed = Math.round(performance.now() - startWall);
      setExecutionTimeMs(elapsed);

      if (err && typeof err === 'object' && ('stdout' in err || 'stderr' in err)) {
        if (err.stdout) setStdout(err.stdout);
        if (err.stderr) setStderr(err.stderr);
        if (Array.isArray(err.plots) && err.plots.length > 0) {
          setPlots(err.plots);
        }
        if (Array.isArray(err.dataframes) && err.dataframes.length > 0) {
          setDataframes(err.dataframes);
        }
        if (err.errorLine) {
          highlightEditorErrorLine(err.errorLine, 'Python exception on this line');
        }
      } else {
        const msg = err?.message || String(err);
        setStderr((prev) => (prev ? `${prev}\n${msg}` : msg));
      }
      setJobState('failed');
      setStatusMessage('');
      setExecutionHistory((prev) => [
        {
          id: jobId,
          timestamp: new Date().toLocaleTimeString(),
          language: lang,
          fileName: activeFile.name,
          durationMs: elapsed,
          engine: lang === 'python' ? 'Python 3.12 Wasm Worker' : 'C/C++ Engine',
          status: 'failed',
        },
        ...prev.slice(0, 19),
      ]);
    }
  }, [
    activeProject,
    activeFile,
    activeTab,
    pyodideReady,
    isOnline,
    ensurePythonWorker,
    clearEditorErrorMarkers,
    highlightEditorErrorLine,
    refreshCacheStatus,
  ]);

  // Configure Monaco Editor on Mount (Autocomplete, Auto-Closing Brackets, Ctrl+Enter shortcut)
  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      const pyCompletionsCatalog = [
        { label: 'import pandas as pd', insertText: 'import pandas as pd', detail: 'Pandas DataFrame library', kind: 'module' },
        { label: 'import numpy as np', insertText: 'import numpy as np', detail: 'NumPy numerical library', kind: 'module' },
        { label: 'import matplotlib.pyplot as plt', insertText: 'import matplotlib.pyplot as plt', detail: 'Matplotlib plotting library', kind: 'module' },
        { label: 'from sklearn.model_selection import train_test_split', insertText: 'from sklearn.model_selection import train_test_split', detail: 'Scikit-Learn train/test split', kind: 'module' },
        { label: 'from sklearn.preprocessing import StandardScaler', insertText: 'from sklearn.preprocessing import StandardScaler', detail: 'Scikit-Learn feature scaling', kind: 'module' },
        { label: 'from sklearn.linear_model import LinearRegression', insertText: 'from sklearn.linear_model import LinearRegression', detail: 'Scikit-Learn linear regression', kind: 'module' },
        { label: 'pd.DataFrame', insertText: 'pd.DataFrame(data)', detail: 'Create Pandas DataFrame', kind: 'function' },
        { label: 'pd.read_csv', insertText: 'pd.read_csv("data.csv")', detail: 'Read CSV into DataFrame', kind: 'function' },
        { label: 'pd.read_excel', insertText: 'pd.read_excel("data.xlsx")', detail: 'Read Excel into DataFrame', kind: 'function' },
        { label: 'df.head', insertText: 'df.head(5)', detail: 'Display first n rows', kind: 'method' },
        { label: 'df.describe', insertText: 'df.describe()', detail: 'Summary statistics', kind: 'method' },
        { label: 'df.isnull().sum()', insertText: 'df.isnull().sum()', detail: 'Count missing values per column', kind: 'method' },
        { label: 'df.fillna', insertText: 'df.fillna(df.mean(numeric_only=True))', detail: 'Fill missing values', kind: 'method' },
        { label: 'df.groupby', insertText: 'df.groupby("column").mean(numeric_only=True)', detail: 'Group by column and aggregate', kind: 'method' },
        { label: 'plt.figure', insertText: 'plt.figure(figsize=(8, 4.5))', detail: 'Create Matplotlib figure', kind: 'function' },
        { label: 'plt.bar', insertText: 'plt.bar(df["Product"], df["Sales"])', detail: 'Plot bar chart', kind: 'function' },
        { label: 'plt.plot', insertText: 'plt.plot(x, y)', detail: 'Plot line chart', kind: 'function' },
        { label: 'plt.scatter', insertText: 'plt.scatter(x, y)', detail: 'Plot scatter chart', kind: 'function' },
        { label: 'plt.title', insertText: 'plt.title("Chart Title")', detail: 'Set chart title', kind: 'function' },
        { label: 'plt.xlabel', insertText: 'plt.xlabel("X Axis")', detail: 'Set X axis label', kind: 'function' },
        { label: 'plt.ylabel', insertText: 'plt.ylabel("Y Axis")', detail: 'Set Y axis label', kind: 'function' },
        { label: 'plt.show', insertText: 'plt.show()', detail: 'Render figure to Plots panel', kind: 'function' },
        { label: 'np.array', insertText: 'np.array([1, 2, 3])', detail: 'Create NumPy ndarray', kind: 'function' },
        { label: 'np.linspace', insertText: 'np.linspace(0, 10, 50)', detail: 'Evenly spaced numbers', kind: 'function' },
      ];

      const completionDisposable = monaco.languages.registerCompletionItemProvider('python', {
        triggerCharacters: ['.', '(', '"', "'", '['],
        provideCompletionItems: (
          model: Monaco.editor.ITextModel,
          position: Monaco.Position
        ) => {
          const wordInfo = model.getWordUntilPosition(position);
          const range: Monaco.IRange = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: wordInfo.startColumn,
            endColumn: wordInfo.endColumn,
          };

          const fullCode = model.getValue();
          const offset = model.getOffsetAt(position);
          const ctx = analyzeContext(fullCode, offset, 'python');
          const linePrefix = model
            .getLineContent(position.lineNumber)
            .slice(0, position.column - 1);
          const dotMatch = linePrefix.match(/([a-zA-Z_]\w*)\.(\w*)$/);
          const query = dotMatch ? `${dotMatch[1]}.${dotMatch[2]}` : wordInfo.word;

          const suggestions: Monaco.languages.CompletionItem[] = [];

          for (const item of pyCompletionsCatalog) {
            if (query.length > 0) {
              const score = Math.max(
                fuzzyMatchScore(query, item.label),
                fuzzyMatchScore(query, item.insertText)
              );
              if (score <= 0) continue;
            }
            suggestions.push({
              label: item.label,
              kind:
                item.kind === 'function' || item.kind === 'method'
                  ? monaco.languages.CompletionItemKind.Function
                  : monaco.languages.CompletionItemKind.Module,
              detail: item.detail,
              insertText:
                dotMatch && item.insertText.startsWith(`${dotMatch[1]}.`)
                  ? item.insertText.slice(dotMatch[1].length + 1)
                  : item.insertText,
              range,
            });
          }

          for (const v of ctx.declaredVariables) {
            if (!query || fuzzyMatchScore(query, v) > 0) {
              suggestions.push({
                label: v,
                kind: monaco.languages.CompletionItemKind.Variable,
                detail: 'Declared variable',
                insertText: v,
                range,
              });
            }
          }

          return { suggestions: suggestions.slice(0, 40) };
        },
      });

      const inlineDisposable = monaco.languages.registerInlineCompletionsProvider('python', {
        provideInlineCompletions: (
          model: Monaco.editor.ITextModel,
          position: Monaco.Position
        ) => {
          const fullCode = model.getValue();
          const offset = model.getOffsetAt(position);
          const ctx = analyzeContext(fullCode, offset, 'python');
          const prediction = predictGhostText(ctx);
          if (!prediction || !prediction.textToInsert) {
            return { items: [] };
          }
          return {
            items: [
              {
                insertText: prediction.textToInsert,
                range: new monaco.Range(
                  position.lineNumber,
                  position.column,
                  position.lineNumber,
                  position.column
                ),
              },
            ],
          };
        },
        freeInlineCompletions: () => {},
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        handleRunCode();
      });

      return () => {
        completionDisposable.dispose();
        inlineDisposable.dispose();
      };
    },
    [handleRunCode]
  );

  // Keyboard shortcut listener for Ctrl+Enter / Cmd+Enter outside Monaco focus
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isRunning) {
          handleRunCode();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleRunCode, isRunning]);

  // Create a new clean file (always minimal Hello World for source files)
  const handleCreateNewFile = useCallback(() => {
    const trimmed = newFileNameInput.trim();
    if (!trimmed || !activeProject) return;

    const isPy = trimmed.endsWith('.py');
    const isCpp = trimmed.endsWith('.cpp') || trimmed.endsWith('.hpp');
    const isC = trimmed.endsWith('.c') || trimmed.endsWith('.h');
    const starterContent = isPy
      ? MINIMAL_HELLO_WORLD.python
      : isCpp
      ? MINIMAL_HELLO_WORLD.cpp
      : isC
      ? MINIMAL_HELLO_WORLD.c
      : '';

    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== activeProject.id) return proj;
        if (proj.files.some((f) => f.name === trimmed)) {
          return { ...proj, activeFileName: trimmed };
        }
        return {
          ...proj,
          activeFileName: trimmed,
          files: [
            ...proj.files,
            {
              name: trimmed,
              content: starterContent,
              updatedAt: Date.now(),
            },
          ],
          updatedAt: Date.now(),
        };
      })
    );
    setNewFileNameInput('');
    setNewFileModalOpen(false);
  }, [newFileNameInput, activeProject]);

  // Delete a project file
  const handleDeleteFile = useCallback(
    (fileName: string) => {
      if (!activeProject || activeProject.files.length <= 1) return;
      setProjects((prev) =>
        prev.map((proj) => {
          if (proj.id !== activeProject.id) return proj;
          const remaining = proj.files.filter((f) => f.name !== fileName);
          return {
            ...proj,
            files: remaining,
            activeFileName:
              proj.activeFileName === fileName ? remaining[0].name : proj.activeFileName,
            updatedAt: Date.now(),
          };
        })
      );
      if (workerRef.current && activeProject.language === 'python') {
        workerRef.current.postMessage({
          type: 'DELETE_FILE',
          payload: { name: fileName },
        });
      }
    },
    [activeProject]
  );

  // Upload local dataset or source file into virtual filesystem
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0 || !activeProject) return;

      Array.from(files).forEach((file) => {
        const isBin = /\.(xlsx|xls|parquet|png|jpg|jpeg|webp|pdf|zip|sqlite|db)$/i.test(file.name);
        const reader = new FileReader();

        reader.onload = () => {
          let contentStr = '';
          if (isBin && reader.result instanceof ArrayBuffer) {
            const bytes = new Uint8Array(reader.result);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            contentStr = btoa(binary);
            // Persist larger binary datasets to OPFS when supported
            saveDatasetToOpfs(file.name, reader.result);
          } else {
            contentStr = String(reader.result || '');
            saveDatasetToOpfs(file.name, contentStr);
          }

          const newFile: ProjectFile = {
            name: file.name,
            content: contentStr,
            isBinary: isBin,
            size: file.size,
            updatedAt: Date.now(),
          };

          setProjects((prev) =>
            prev.map((proj) => {
              if (proj.id !== activeProject.id) return proj;
              const filtered = proj.files.filter((f) => f.name !== file.name);
              return {
                ...proj,
                files: [...filtered, newFile],
                activeFileName: isBin ? proj.activeFileName : file.name,
                updatedAt: Date.now(),
              };
            })
          );

          // Sync immediately to active Python worker virtual filesystem
          if (workerRef.current && activeProject.language === 'python') {
            workerRef.current.postMessage({
              type: 'UPLOAD_FILE',
              payload: {
                name: file.name,
                data: contentStr,
                isBinary: isBin,
              },
            });
          }
        };

        if (isBin) {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsText(file);
        }
      });

      e.target.value = '';
    },
    [activeProject]
  );

  // Download active file or ZIP project
  const handleDownloadActiveFile = useCallback(() => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeFile]);

  const handleExportZip = useCallback(async () => {
    if (!activeProject) return;
    const zipBlob = await exportProjectAsZip(activeProject);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeProject]);

  // Setup Mode & Offline Package Manager Actions
  const handleChangeSetupMode = useCallback((mode: SetupPreferenceMode) => {
    setSetupModeState(mode);
    setSetupPreferenceMode(mode);
  }, []);

  const handleDownloadOfflinePreset = useCallback(
    async (preset: 'core' | 'datascience' | 'complete') => {
      if (downloadingOffline) return;
      setDownloadingOffline(true);
      setDownloadProgress({ percent: 0, label: 'Starting download...' });
      try {
        const progressCb = (p: { currentFile: string; percent: number }) => {
          setDownloadProgress({
            percent: p.percent,
            label: p.currentFile === 'Complete' ? 'Verifying cache...' : `Caching ${p.currentFile}...`,
          });
        };
        if (preset === 'core') {
          await downloadCoreRuntime(progressCb);
        } else if (preset === 'datascience') {
          await downloadDataSciencePreset(progressCb);
        } else {
          await downloadFullDataScienceBundle(progressCb);
        }
        await refreshCacheStatus();
      } catch (err: any) {
        setStderr((prev) =>
          prev
            ? `${prev}\n[Offline Setup Error]: ${err.message || String(err)}`
            : `[Offline Setup Error]: ${err.message || String(err)}`
        );
      } finally {
        setDownloadingOffline(false);
        setDownloadProgress(null);
      }
    },
    [downloadingOffline, refreshCacheStatus]
  );

  const handleDownloadSinglePackage = useCallback(
    async (pkgId: string) => {
      setInstallingPkgId(pkgId);
      try {
        await downloadPythonPackage(pkgId, (p) => {
          setDownloadProgress({
            percent: p.percent,
            label: `Caching ${pkgId}: ${p.currentFile}`,
          });
        });
        await refreshCacheStatus();
      } catch (err: any) {
        setStderr((prev) => `${prev}\n[Package Cache Error]: ${err.message || String(err)}`);
      } finally {
        setInstallingPkgId(null);
        setDownloadProgress(null);
      }
    },
    [refreshCacheStatus]
  );

  const handleLoadPackageIntoSession = useCallback(
    async (pkgName: string) => {
      const trimmed = pkgName.trim();
      if (!trimmed) return;
      setInstallingPkgId(trimmed);
      try {
        const worker = ensurePythonWorker();
        const reqId = `pkg-${Date.now()}`;
        await new Promise((resolve, reject) => {
          pendingPromisesRef.current.set(reqId, { resolve, reject });
          worker.postMessage({
            type: 'INSTALL_PACKAGE',
            id: reqId,
            packageName: trimmed,
          });
        });
        await refreshCacheStatus();
        setCustomPipInput('');
      } catch (err: any) {
        setStderr(
          (prev) => `${prev}\n[Package Load Error]: ${err?.stderr || err?.message || String(err)}`
        );
      } finally {
        setInstallingPkgId(null);
      }
    },
    [ensurePythonWorker, refreshCacheStatus]
  );

  const handleRemoveCachedPkg = useCallback(
    async (pkgId: string) => {
      await removeCachedPackage(pkgId);
      await refreshCacheStatus();
    },
    [refreshCacheStatus]
  );

  // Filtered packages for the Package Manager modal
  const filteredCatalogPackages = useMemo(() => {
    return PYTHON_PACKAGES.filter((pkg) => {
      if (pkgCategoryFilter !== 'All' && pkg.category !== pkgCategoryFilter) return false;
      if (!pkgSearchQuery.trim()) return true;
      const q = pkgSearchQuery.toLowerCase();
      return (
        pkg.name.toLowerCase().includes(q) ||
        pkg.importName.toLowerCase().includes(q) ||
        pkg.description.toLowerCase().includes(q)
      );
    });
  }, [pkgCategoryFilter, pkgSearchQuery]);

  // Active DataFrame sorting & filtering
  const activeDataFrame = dataframes[selectedDfIndex] || dataframes[0] || null;
  const displayedDfRows = useMemo(() => {
    if (!activeDataFrame) return [];
    let rows = [...activeDataFrame.previewRows];
    if (dfSearchQuery.trim()) {
      const q = dfSearchQuery.toLowerCase();
      rows = rows.filter((r) =>
        Object.values(r).some((v) => v !== null && String(v).toLowerCase().includes(q))
      );
    }
    if (dfSortColumn) {
      rows.sort((a, b) => {
        const va = a[dfSortColumn];
        const vb = b[dfSortColumn];
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        const na = Number(va);
        const nb = Number(vb);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) {
          return dfSortAsc ? na - nb : nb - na;
        }
        return dfSortAsc
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va));
      });
    }
    return rows;
  }, [activeDataFrame, dfSearchQuery, dfSortColumn, dfSortAsc]);

  const monacoLanguage =
    activeProject?.language === 'python'
      ? 'python'
      : activeProject?.language === 'cpp'
      ? 'cpp'
      : 'c';

  // Detect if current code expects standard input while STDIN is empty
  const codeReadsInput = useMemo(() => {
    const src = activeFile?.content || '';
    if (!src) return false;
    if (activeProject?.language === 'python') {
      return /\binput\s*\(|\bsys\.stdin\b/.test(src);
    }
    return /\bcin\s*>>|\bgetline\s*\(|\bscanf\s*\(|\bfgets\s*\(/.test(src);
  }, [activeFile?.content, activeProject?.language]);

  const errorDiagnostic = useMemo(() => getStudentErrorHint(stderr), [stderr]);

  const jumpToEditorLine = useCallback((line: number) => {
    if (!editorRef.current || !line || line < 1) return;
    editorRef.current.revealLineInCenter(line);
    editorRef.current.setPosition({ lineNumber: line, column: 1 });
    editorRef.current.focus();
  }, []);

  // Copy self-contained shareable exercise URL
  const handleCopyExerciseShareLink = useCallback(() => {
    if (!activeProject || !activeFile) return;
    const payload = {
      title: activeProject.name,
      language: activeProject.language,
      code: activeFile.content,
      stdin: activeProject.stdin || '',
    };
    const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
    const shareUrl = `${window.location.origin}/compiler?exercise=${encoded}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  }, [activeProject, activeFile]);

  // Classroom Mode Handlers
  const handleLoadAssignmentById = useCallback(async (idToLoad: string) => {
    const cleanId = idToLoad.trim();
    if (!cleanId) return;
    setSubmissionError('');
    try {
      const res = await fetch(`/api/classroom/assignments/${encodeURIComponent(cleanId)}`);
      const data = await res.json();
      if (!res.ok) {
        setSubmissionError(data.error || 'Assignment not found.');
        return;
      }
      setActiveAssignment(data);
      setSubmissionReceipt(null);
      if (data.starterCode) {
        handleSelectLanguage(data.language);
        setTimeout(() => {
          updateActiveFileContent(data.starterCode);
          if (data.sampleInput) updateStdin(data.sampleInput);
        }, 50);
      }
    } catch (err: any) {
      setSubmissionError(err.message || 'Could not load assignment.');
    }
  }, [handleSelectLanguage, updateActiveFileContent, updateStdin]);

  const handleStudentSubmitAssignment = useCallback(async () => {
    if (!activeAssignment || !activeFile) return;
    if (!studentName.trim()) {
      setSubmissionError('Please enter your name before submitting.');
      return;
    }
    setSubmittingSolution(true);
    setSubmissionError('');
    setSubmissionReceipt(null);
    try {
      const res = await fetch(
        `/api/classroom/assignments/${encodeURIComponent(activeAssignment.id)}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: studentName.trim(),
            studentId: studentIdInput.trim(),
            language: activeProject?.language || activeAssignment.language,
            code: activeFile.content,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.confirmed) {
        setSubmissionError(data.error || 'Submission could not be confirmed by server.');
        return;
      }
      setSubmissionReceipt(data.submission);
    } catch (err: any) {
      setSubmissionError(
        'Network error: Submission was not confirmed. Your code is safely saved locally — please retry when connected.'
      );
    } finally {
      setSubmittingSolution(false);
    }
  }, [activeAssignment, activeFile, activeProject?.language, studentName, studentIdInput]);

  const handleTeacherCreateAssignment = useCallback(async () => {
    if (!teacherTitle.trim()) {
      setTeacherStatusMsg('Please provide a question title.');
      return;
    }
    setTeacherStatusMsg('Creating assignment...');
    try {
      const testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }> = [];
      if (teacherSampleOut.trim()) {
        testCases.push({
          input: teacherSampleIn,
          expectedOutput: teacherSampleOut,
          isHidden: false,
        });
      }
      if (teacherHiddenOut.trim()) {
        testCases.push({
          input: teacherHiddenIn,
          expectedOutput: teacherHiddenOut,
          isHidden: true,
        });
      }

      const res = await fetch('/api/classroom/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: teacherTitle.trim(),
          description: teacherDesc.trim(),
          language: teacherLang,
          starterCode: teacherStarterCode,
          sampleInput: teacherSampleIn,
          sampleOutput: teacherSampleOut,
          testCases,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTeacherStatusMsg(data.error || 'Failed to create assignment.');
        return;
      }
      setCreatedAssignmentInfo({
        assignmentId: data.assignmentId,
        teacherKey: data.teacherKey,
      });
      setTeacherReviewAsgnId(data.assignmentId);
      setTeacherReviewKey(data.teacherKey);
      setTeacherStatusMsg('Assignment created and ready to share.');
    } catch (err: any) {
      setTeacherStatusMsg(err.message || 'Network error.');
    }
  }, [
    teacherTitle,
    teacherDesc,
    teacherLang,
    teacherStarterCode,
    teacherSampleIn,
    teacherSampleOut,
    teacherHiddenIn,
    teacherHiddenOut,
  ]);

  const handleTeacherFetchSubmissions = useCallback(async () => {
    if (!teacherReviewAsgnId.trim() || !teacherReviewKey.trim()) {
      setTeacherStatusMsg('Enter both Assignment ID and Teacher Access Key.');
      return;
    }
    setTeacherStatusMsg('Loading submissions...');
    try {
      const res = await fetch(
        `/api/classroom/assignments/${encodeURIComponent(
          teacherReviewAsgnId.trim()
        )}/submissions?teacherKey=${encodeURIComponent(teacherReviewKey.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setTeacherStatusMsg(data.error || 'Could not load submissions.');
        return;
      }
      setTeacherSubmissionsList(data.submissions || []);
      setTeacherStatusMsg(`Loaded ${data.totalSubmissions || 0} student submission(s).`);
    } catch (err: any) {
      setTeacherStatusMsg(err.message || 'Network error.');
    }
  }, [teacherReviewAsgnId, teacherReviewKey]);

  return (
    <div className="w-full h-[calc(100vh-115px)] min-h-[680px] flex flex-col bg-[#0F172A] text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden select-none">
      {/* Hidden file input for dataset & script uploads */}
      <input
        ref={fileUploadInputRef}
        type="file"
        multiple
        accept=".py,.cpp,.c,.h,.hpp,.csv,.xlsx,.json,.txt,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* TOP IDE TOOLBAR — Single-row, spacious, high-clarity controls */}
      <div className="h-12 px-3 bg-[#1E293B] border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
        {/* Left Zone: Sidebar toggle + Language tabs + Active File */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setShowExplorer((v) => !v)}
            title={showExplorer ? 'Hide Project Files' : 'Show Project Files & Datasets'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
              showExplorer
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {showExplorer ? (
              <PanelLeftClose className="w-3.5 h-3.5" />
            ) : (
              <PanelLeftOpen className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Files</span>
            <span className="text-[11px] text-slate-400 font-mono">
              ({activeProject?.files.length || 1})
            </span>
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 shrink-0">
            {(
              [
                { id: 'python', label: 'Python 3.12' },
                { id: 'cpp', label: 'C++20' },
                { id: 'c', label: 'C17' },
              ] as const
            ).map((item) => {
              const active = activeProject?.language === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectLanguage(item.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Examples Dropdown (Optional — never forced into editor) */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setShowExamplesMenu((v) => !v);
                setShowSettingsMenu(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Examples</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showExamplesMenu && (
              <div className="absolute left-0 mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                  Load Starter or Scientific Example ({activeProject?.language.toUpperCase()})
                </div>
                {COMPILER_TEMPLATES.filter((t) => t.language === activeProject?.language).map(
                  (tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        updateActiveFileContent(tpl.code);
                        if (tpl.defaultStdin !== undefined) {
                          updateStdin(tpl.defaultStdin);
                        }
                        setShowExamplesMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 transition flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="text-xs font-semibold text-slate-200">{tpl.name}</span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">
                        {tpl.description}
                      </span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center Zone: Primary Run / Stop / Restart Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {!isRunning ? (
            <button
              onClick={handleRunCode}
              title="Run Code (Ctrl+Enter)"
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition cursor-pointer whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Code</span>
              <span className="hidden lg:inline text-[10px] font-mono opacity-80">Ctrl+↵</span>
            </button>
          ) : (
            <button
              onClick={handleStopExecution}
              title="Stop Running Execution"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-sm transition cursor-pointer whitespace-nowrap"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          )}

          {activeProject?.language === 'python' && (
            <button
              onClick={handleRestartRuntime}
              title="Restart Python Runtime Session"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden xl:inline">Restart Kernel</span>
            </button>
          )}
        </div>

        {/* Right Zone: Runtime Status, Package & Offline Manager, Upload, Editor Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Genuine Verified Runtime / Offline Readiness Status Button */}
          <button
            onClick={() => setShowOfflineModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer whitespace-nowrap"
            title="Manage Python Packages & Offline Readiness"
          >
            <Package className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">
              {cacheStatus?.isDataScienceReady
                ? 'Offline Data Science Ready'
                : cacheStatus?.hasCore
                ? 'Core Cached · Packages'
                : pyodideReady
                ? 'Python 3.12 Ready'
                : pyodideLoading
                ? 'Warming Runtime...'
                : 'Packages & Offline'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              · {isOnline ? 'Online' : 'Offline'}
            </span>
          </button>

          {/* Upload Dataset / File */}
          <button
            onClick={() => fileUploadInputRef.current?.click()}
            title="Upload CSV, Excel, JSON, or Code File into Workspace"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden lg:inline">Upload Dataset</span>
          </button>

          {/* Classroom & Exercise Sharing Button */}
          <button
            onClick={() => setShowClassroomModal(true)}
            title="Classroom Assignments, Auto-Grading & Exercise Sharing"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeAssignment
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">
              {activeAssignment ? 'Active Assignment' : 'Classroom'}
            </span>
          </button>

          {/* Editor Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSettingsMenu((v) => !v);
                setShowExamplesMenu(false);
              }}
              title="Editor Settings & Export"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 space-y-3 text-xs">
                <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5">
                  Editor Preferences
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Font Size</span>
                  <div className="flex items-center gap-1">
                    {[13, 14, 16, 18].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setFontSize(sz)}
                        className={`px-2 py-0.5 rounded font-mono cursor-pointer ${
                          fontSize === sz
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Word Wrap</span>
                  <button
                    onClick={() => setWordWrap((w) => !w)}
                    className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                      wordWrap ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {wordWrap ? 'Enabled' : 'Off'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Theme</span>
                  <button
                    onClick={() =>
                      setEditorTheme((t) => (t === 'vs-dark' ? 'light' : 'vs-dark'))
                    }
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
                  >
                    {editorTheme === 'vs-dark' ? 'VS Dark' : 'VS Light'}
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
                  <button
                    onClick={() => {
                      handleDownloadActiveFile();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Download {activeFile?.name}</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExportZip();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    <FileArchive className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export Project (.zip)</span>
                  </button>
                  <button
                    onClick={() => {
                      handleCopyExerciseShareLink();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{copiedShareLink ? 'Copied Share Link!' : 'Copy Shareable Exercise Link'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACTIVE CLASSROOM ASSIGNMENT BAR (Only shown when a student loads an assignment) */}
      {activeAssignment && (
        <div className="px-3 py-2 bg-amber-950/30 border-b border-amber-800/50 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold text-amber-200 truncate">
              Assignment: {activeAssignment.title}
            </span>
            <span className="text-slate-400 hidden md:inline truncate">
              — {activeAssignment.description}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activeAssignment.sampleInput && (
              <button
                onClick={() => {
                  updateStdin(activeAssignment.sampleInput);
                  setActiveTab('stdin');
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
              >
                Use Sample Input
              </button>
            )}
            <button
              onClick={() => {
                setClassroomTab('student');
                setShowClassroomModal(true);
              }}
              className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer"
            >
              View Details & Submit Solution
            </button>
            <button
              onClick={() => setActiveAssignment(null)}
              title="Close Assignment Banner"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN IDE WORKSPACE — Collapsible Sidebar + Resizable 2-Panel Split (Editor ~63% / Console ~37%) */}
      <div
        ref={splitContainerRef}
        className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative"
      >
        {/* 1. COLLAPSIBLE PROJECT & DATASET EXPLORER SIDEBAR */}
        {showExplorer && (
          <aside className="w-full lg:w-60 bg-[#111827] border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col shrink-0 max-h-56 lg:max-h-none">
            <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Workspace Files
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setNewFileModalOpen(true)}
                  title="New File"
                  className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => fileUploadInputRef.current?.click()}
                  title="Upload CSV / XLSX / File"
                  className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {activeProject?.files.map((file) => {
                const isSelected = file.name === activeFile?.name;
                return (
                  <div
                    key={file.name}
                    onClick={() => {
                      if (!file.isBinary) {
                        setProjects((prev) =>
                          prev.map((p) =>
                            p.id === activeProject.id ? { ...p, activeFileName: file.name } : p
                          )
                        );
                      }
                    }}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30'
                        : 'text-slate-300 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-mono">{file.name}</span>
                    </div>
                    {activeProject.files.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.name);
                        }}
                        title={`Delete ${file.name}`}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Active Session Loaded Libraries Summary */}
            {activeProject?.language === 'python' && (
              <div className="p-2.5 border-t border-slate-800 bg-slate-900/60 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Active Session Packages</span>
                  <span className="font-mono text-slate-300">{loadedSessionPackages.length}</span>
                </div>
                {loadedSessionPackages.length > 0 ? (
                  <div className="text-slate-300 font-mono truncate">
                    {loadedSessionPackages.join(' · ')}
                  </div>
                ) : (
                  <div className="text-slate-500">
                    Core Python 3.12 · Libraries load automatically on import
                  </div>
                )}
              </div>
            )}
          </aside>
        )}

        {/* 2. PRIMARY MONACO CODE EDITOR PANEL (~63% Desktop Width) */}
        {maximizedPanel !== 'output' && (
          <div
            style={{
              width:
                maximizedPanel === 'editor'
                  ? '100%'
                  : typeof window !== 'undefined' && window.innerWidth >= 1024
                  ? `${editorWidthPct}%`
                  : '100%',
            }}
            className="flex-1 lg:flex-none flex flex-col min-w-0 min-h-[340px] lg:min-h-0 bg-[#0F172A]"
          >
            {/* File Tab Bar */}
            <div className="h-9 px-2 bg-[#111827] border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {activeProject?.files
                  .filter((f) => !f.isBinary)
                  .map((file) => {
                    const active = file.name === activeFile?.name;
                    return (
                      <button
                        key={file.name}
                        onClick={() =>
                          setProjects((prev) =>
                            prev.map((p) =>
                              p.id === activeProject.id ? { ...p, activeFileName: file.name } : p
                            )
                          )
                        }
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-t-md text-xs font-mono transition cursor-pointer whitespace-nowrap border-b-2 ${
                          active
                            ? 'bg-[#1E293B] text-white border-blue-500 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 border-transparent'
                        }`}
                      >
                        <Code2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>{file.name}</span>
                      </button>
                    );
                  })}
                <button
                  onClick={() => setNewFileModalOpen(true)}
                  title="Create New File"
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
                <button
                  onClick={() =>
                    updateActiveFileContent(
                      MINIMAL_HELLO_WORLD[activeProject?.language || 'python']
                    )
                  }
                  title="Reset File to Minimal Hello World"
                  className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer whitespace-nowrap"
                >
                  Reset to Hello World
                </button>
                <button
                  onClick={() =>
                    setMaximizedPanel((m) => (m === 'editor' ? 'none' : 'editor'))
                  }
                  title={maximizedPanel === 'editor' ? 'Restore Split Layout' : 'Maximize Editor'}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {maximizedPanel === 'editor' ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 min-h-0 relative">
              <Editor
                height="100%"
                language={monacoLanguage}
                theme={editorTheme}
                value={activeFile?.content || ''}
                onChange={(val) => updateActiveFileContent(val ?? '')}
                onMount={handleEditorDidMount}
                options={{
                  fontSize,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: wordWrap ? 'on' : 'off',
                  automaticLayout: true,
                  tabSize: 4,
                  insertSpaces: true,
                  autoClosingBrackets: 'always',
                  autoClosingQuotes: 'always',
                  autoIndent: 'full',
                  formatOnPaste: true,
                  bracketPairColorization: { enabled: true },
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: { other: true, comments: false, strings: true },
                  padding: { top: 14, bottom: 14 },
                  lineNumbersMinChars: 3,
                  renderLineHighlight: 'all',
                }}
              />
            </div>
          </div>
        )}

        {/* DRAGGABLE SPLITTER HANDLE (Desktop) */}
        {maximizedPanel === 'none' && (
          <div
            onMouseDown={() => setIsDraggingSplit(true)}
            title="Drag to resize Editor and Output panels"
            className={`hidden lg:flex w-1.5 cursor-col-resize items-center justify-center bg-slate-900 hover:bg-blue-600/60 transition shrink-0 ${
              isDraggingSplit ? 'bg-blue-500' : ''
            }`}
          >
            <div className="w-0.5 h-8 bg-slate-600 rounded-full" />
          </div>
        )}

        {/* 3. CONSOLE, PLOTS, DATAFRAMES & INPUT PANEL (~37% Desktop Width) */}
        {maximizedPanel !== 'editor' && (
          <div className="flex-1 flex flex-col min-w-0 min-h-[280px] lg:min-h-0 bg-[#0B1120] border-t lg:border-t-0 border-slate-800">
            {/* Output Panel Header Tabs */}
            <div className="h-9 px-2 bg-[#111827] border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab('console')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'console'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Console</span>
                </button>

                <button
                  onClick={() => setActiveTab('plots')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'plots'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Plots</span>
                  {plots.length > 0 && (
                    <span className="font-mono text-[11px] text-blue-400">({plots.length})</span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('dataframes')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'dataframes'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>DataFrames</span>
                  {dataframes.length > 0 && (
                    <span className="font-mono text-[11px] text-amber-400">
                      ({dataframes.length})
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('stdin')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'stdin'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Input (STDIN)</span>
                  {activeProject?.stdin.trim() && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                </button>
              </div>

              {/* Console Utility Controls */}
              <div className="flex items-center gap-1 shrink-0">
                {executionTimeMs !== null && (
                  <span className="text-[11px] font-mono tabular-nums text-slate-400 px-1.5">
                    {executionTimeMs}ms
                  </span>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${stdout}${stderr ? '\n' + stderr : ''}`);
                    setCopiedOutput(true);
                    setTimeout(() => setCopiedOutput(false), 1500);
                  }}
                  title="Copy Console Output"
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {copiedOutput ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setStdout('');
                    setStderr('');
                    setPlots([]);
                    setDataframes([]);
                    setExecutionTimeMs(null);
                    setJobState('idle');
                  }}
                  title="Clear Output"
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    setMaximizedPanel((m) => (m === 'output' ? 'none' : 'output'))
                  }
                  title={maximizedPanel === 'output' ? 'Restore Split Layout' : 'Maximize Output'}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {maximizedPanel === 'output' ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Active Output Body */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs select-text">
              {/* TAB 1: CONSOLE */}
              {activeTab === 'console' && (
                <div className="space-y-3 h-full flex flex-col">
                  {isRunning && (
                    <div className="flex items-center gap-2 text-blue-400 bg-blue-950/40 border border-blue-800/50 rounded-lg px-3 py-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>{statusMessage || 'Executing program...'}</span>
                    </div>
                  )}

                  {!isRunning && !stdout && !stderr && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-12">
                      <Terminal className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-xs text-slate-400 font-sans">
                        Press <strong className="text-slate-200">Run Code</strong> or{' '}
                        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                          Ctrl+Enter
                        </kbd>{' '}
                        to execute <span className="font-mono text-slate-300">{activeFile?.name}</span>
                      </p>
                    </div>
                  )}

                  {/* Beginner-friendly Input Reminder when code uses input()/cin/scanf and STDIN is empty */}
                  {codeReadsInput && !activeProject?.stdin.trim() && !isRunning && (
                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-950/30 border border-amber-800/50 text-amber-200 font-sans text-xs">
                      <span>
                        Your code reads standard input (<code className="font-mono">input()</code> /{' '}
                        <code className="font-mono">cin</code> / <code className="font-mono">scanf</code>), but the Input (STDIN) box is empty.
                      </span>
                      <button
                        onClick={() => setActiveTab('stdin')}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium shrink-0 cursor-pointer"
                      >
                        Add Input Values →
                      </button>
                    </div>
                  )}

                  {stdout && (
                    <pre className="whitespace-pre-wrap break-words text-slate-100 leading-relaxed font-mono">
                      {stdout}
                    </pre>
                  )}

                  {stderr && (
                    <div className="space-y-2">
                      <pre className="whitespace-pre-wrap break-words text-rose-400 bg-rose-950/30 border border-rose-900/50 rounded-lg p-3 leading-relaxed font-mono">
                        {stderr}
                      </pre>
                      {(errorDiagnostic.line || errorDiagnostic.hint) && (
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 font-sans text-xs text-slate-300">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>
                              {errorDiagnostic.hint || 'Diagnostic detected in your program.'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {errorDiagnostic.line && (
                              <button
                                onClick={() => jumpToEditorLine(errorDiagnostic.line!)}
                                className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-mono text-[11px] cursor-pointer whitespace-nowrap"
                              >
                                Jump to Line {errorDiagnostic.line}
                              </button>
                            )}
                            {/EOFError/i.test(stderr) && (
                              <button
                                onClick={() => setActiveTab('stdin')}
                                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium text-[11px] cursor-pointer whitespace-nowrap"
                              >
                                Open Input (STDIN)
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {plots.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-sans text-blue-400">
                      <span>{plots.length} Matplotlib figure(s) captured.</span>
                      <button
                        onClick={() => setActiveTab('plots')}
                        className="underline hover:text-blue-300 cursor-pointer"
                      >
                        View in Plots tab →
                      </button>
                    </div>
                  )}

                  {dataframes.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-sans text-amber-400">
                      <span>
                        {dataframes.length} pandas DataFrame(s) captured (
                        {dataframes.map((d) => `${d.name} [${d.rows}×${d.cols}]`).join(', ')}).
                      </span>
                      <button
                        onClick={() => setActiveTab('dataframes')}
                        className="underline hover:text-amber-300 cursor-pointer"
                      >
                        Explore interactive table →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MATPLOTLIB PLOTS */}
              {activeTab === 'plots' && (
                <div className="space-y-4 font-sans">
                  {plots.length === 0 ? (
                    <div className="text-center text-slate-500 py-12">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs text-slate-400">
                        Figures generated via <code className="text-slate-300">plt.show()</code> or{' '}
                        <code className="text-slate-300">plt.savefig()</code> will render here.
                      </p>
                    </div>
                  ) : (
                    plots.map((b64, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
                      >
                        <div className="px-3 py-1.5 bg-slate-800/70 flex items-center justify-between text-xs text-slate-300">
                          <span className="font-medium">Figure #{idx + 1}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setZoomedPlot(b64)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer"
                            >
                              <ZoomIn className="w-3 h-3" />
                              <span>Zoom</span>
                            </button>
                            <a
                              href={`data:image/png;base64,${b64}`}
                              download={`figure_${idx + 1}.png`}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white"
                            >
                              <Download className="w-3 h-3" />
                              <span>PNG</span>
                            </a>
                          </div>
                        </div>
                        <div className="p-3 bg-white flex items-center justify-center">
                          <img
                            src={`data:image/png;base64,${b64}`}
                            alt={`Matplotlib Figure ${idx + 1}`}
                            className="max-w-full h-auto rounded"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: INTERACTIVE PANDAS DATAFRAMES */}
              {activeTab === 'dataframes' && (
                <div className="space-y-3 font-sans h-full flex flex-col">
                  {dataframes.length === 0 ? (
                    <div className="text-center text-slate-500 py-12">
                      <TableIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs text-slate-400">
                        Any <code className="text-slate-300">pandas.DataFrame</code> variable in your
                        Python script is automatically captured here for sorting, filtering, and CSV
                        export.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {dataframes.map((df, idx) => (
                            <button
                              key={df.name}
                              onClick={() => {
                                setSelectedDfIndex(idx);
                                setDfSortColumn(null);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono cursor-pointer ${
                                idx === selectedDfIndex
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {df.name} ({df.rows}×{df.cols})
                            </button>
                          ))}
                        </div>

                        {activeDataFrame && (
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={dfSearchQuery}
                                onChange={(e) => setDfSearchQuery(e.target.value)}
                                placeholder="Filter rows..."
                                className="pl-6 pr-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-36"
                              />
                            </div>
                            <button
                              onClick={() => {
                                const blob = new Blob([activeDataFrame.csvContent], {
                                  type: 'text/csv;charset=utf-8',
                                });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${activeDataFrame.name}.csv`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                              <span>CSV</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {activeDataFrame && (
                        <div className="flex-1 overflow-auto border border-slate-800 rounded-lg">
                          <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                            <thead className="bg-slate-900 sticky top-0 z-10 border-b border-slate-800">
                              <tr>
                                <th className="py-2 px-2.5 text-slate-500 font-semibold border-r border-slate-800 w-12">
                                  #
                                </th>
                                {activeDataFrame.columns.map((col) => (
                                  <th
                                    key={col}
                                    onClick={() => {
                                      if (dfSortColumn === col) {
                                        setDfSortAsc((a) => !a);
                                      } else {
                                        setDfSortColumn(col);
                                        setDfSortAsc(true);
                                      }
                                    }}
                                    className="py-2 px-3 text-slate-200 font-semibold border-r border-slate-800 cursor-pointer hover:bg-slate-800/70 select-none whitespace-nowrap"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span>{col}</span>
                                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-normal">
                                      {activeDataFrame.dtypes?.[col] || ''}
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/70">
                              {displayedDfRows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-800/40">
                                  <td className="py-1.5 px-2.5 text-slate-500 border-r border-slate-800">
                                    {row.__index__ ?? rIdx}
                                  </td>
                                  {activeDataFrame.columns.map((col) => {
                                    const val = row[col];
                                    const isNull = val === null || val === undefined;
                                    return (
                                      <td
                                        key={col}
                                        className="py-1.5 px-3 border-r border-slate-800/60 whitespace-nowrap"
                                      >
                                        {isNull ? (
                                          <span className="text-amber-400/80 italic">NaN</span>
                                        ) : (
                                          <span className="text-slate-200">{String(val)}</span>
                                        )}
                                      </td>
                                    );
                                  })}
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

              {/* TAB 4: STANDARD INPUT (STDIN) */}
              {activeTab === 'stdin' && (
                <div className="space-y-2 h-full flex flex-col font-sans">
                  <div className="text-xs text-slate-400">
                    Provide line-by-line input values for <code className="text-slate-200">input()</code>,{' '}
                    <code className="text-slate-200">sys.stdin</code>, <code className="text-slate-200">std::cin</code>, or{' '}
                    <code className="text-slate-200">scanf()</code>:
                  </div>
                  <textarea
                    value={activeProject?.stdin || ''}
                    onChange={(e) => updateStdin(e.target.value)}
                    placeholder="Enter each input value on a new line..."
                    className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              )}
            </div>

            {/* Bottom Execution Status Bar (Genuine Metrics Only) */}
            <div className="h-7 px-3 bg-[#111827] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
              <div className="flex items-center gap-2 truncate">
                <span>Engine: {activeEngineUsed}</span>
                {runtimeInitMs !== null && activeProject?.language === 'python' && (
                  <span className="font-mono tabular-nums text-slate-500">
                    · Init {runtimeInitMs}ms
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                {jobState === 'completed' && (
                  <span className="text-emerald-400">Completed</span>
                )}
                {jobState === 'failed' && <span className="text-rose-400">Error</span>}
                {jobState === 'cancelled' && <span className="text-amber-400">Stopped</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PACKAGE MANAGER & OFFLINE SETUP MODAL */}
      {showOfflineModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Python Runtime, Package Manager & Offline Setup
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pinned Pyodide {cacheStatus?.runtimeVersion || 'v0.26.4'} (CPython 3.12 WebAssembly) · Verified CacheStorage & IndexedDB Manifest
                </p>
              </div>
              <button
                onClick={() => setShowOfflineModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* 1. Automatic First-Run Setup Preferences */}
              <div className="space-y-2">
                <div className="font-semibold text-slate-200">
                  Automatic Setup Preference (Remembered Across Sessions)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(
                    [
                      {
                        id: 'standard',
                        title: 'Standard Setup',
                        desc: 'Core Python 3.12 only (~11 MB). Scientific libraries load on demand when imported.',
                      },
                      {
                        id: 'datascience',
                        title: 'Data Science Setup',
                        desc: 'Core Python + NumPy, pandas, Matplotlib, and scikit-learn ready for offline use.',
                      },
                      {
                        id: 'complete',
                        title: 'Complete Offline Setup',
                        desc: 'Caches all 17 verified scientific, ML, Excel, and utility packages (~72 MB).',
                      },
                    ] as const
                  ).map((opt) => {
                    const active = setupMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleChangeSetupMode(opt.id)}
                        className={`text-left p-3 rounded-xl border transition cursor-pointer ${
                          active
                            ? 'bg-blue-600/15 border-blue-500 text-white'
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold mb-1">
                          <span>{opt.title}</span>
                          {active && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Verified Readiness Summary Strip */}
              <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-slate-200 font-semibold">
                    Verified Local Availability Status
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300">
                    <span>
                      Python Core:{' '}
                      <strong className={cacheStatus?.hasCore ? 'text-emerald-400' : 'text-amber-400'}>
                        {cacheStatus?.hasCore ? 'Ready' : 'Not Cached'}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      NumPy:{' '}
                      <strong
                        className={
                          cacheStatus?.packages['numpy'] ? 'text-emerald-400' : 'text-slate-400'
                        }
                      >
                        {cacheStatus?.packages['numpy'] ? 'Ready' : 'On Demand'}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      pandas:{' '}
                      <strong
                        className={
                          cacheStatus?.packages['pandas'] ? 'text-emerald-400' : 'text-slate-400'
                        }
                      >
                        {cacheStatus?.packages['pandas'] ? 'Ready' : 'On Demand'}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      Matplotlib:{' '}
                      <strong
                        className={
                          cacheStatus?.packages['matplotlib']
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }
                      >
                        {cacheStatus?.packages['matplotlib'] ? 'Ready' : 'On Demand'}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      scikit-learn:{' '}
                      <strong
                        className={
                          cacheStatus?.packages['scikit-learn']
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }
                      >
                        {cacheStatus?.packages['scikit-learn'] ? 'Ready' : 'On Demand'}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    disabled={downloadingOffline || !isOnline}
                    onClick={() => handleDownloadOfflinePreset('core')}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium cursor-pointer"
                  >
                    Cache Core Only
                  </button>
                  <button
                    disabled={downloadingOffline || !isOnline}
                    onClick={() => handleDownloadOfflinePreset('datascience')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold cursor-pointer"
                  >
                    Cache Data Science Bundle
                  </button>
                  <button
                    disabled={downloadingOffline || !isOnline}
                    onClick={() => handleDownloadOfflinePreset('complete')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold cursor-pointer"
                  >
                    Cache All Offline Packages
                  </button>
                </div>
              </div>

              {/* Progress Bar if downloading */}
              {downloadProgress && (
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-blue-300">
                    <span>{downloadProgress.label}</span>
                    <span className="font-mono tabular-nums">{downloadProgress.percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-200"
                      style={{ width: `${downloadProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Custom Pure-Python Wheel Installer via micropip */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">
                    Install Pure-Python Package Into Active Session (micropip)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Standard-library modules (csv, json, math, os, re, datetime, pathlib, zipfile) are already built in.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customPipInput}
                    onChange={(e) => setCustomPipInput(e.target.value)}
                    placeholder="e.g. seaborn or tabulate"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 w-48 font-mono"
                  />
                  <button
                    disabled={!customPipInput.trim() || Boolean(installingPkgId)}
                    onClick={() => handleLoadPackageIntoSession(customPipInput)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold cursor-pointer"
                  >
                    {installingPkgId === customPipInput.trim() ? 'Loading...' : 'Load in Session'}
                  </button>
                </div>
              </div>

              {/* 3. Supported Package Catalog with Category Filter & Search */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1">
                    {(
                      [
                        'All',
                        'Numerical Computing',
                        'Data Analysis',
                        'Data Visualization',
                        'Machine Learning',
                        'Image Processing',
                        'File & Document',
                        'Utilities & Web',
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setPkgCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition ${
                          pkgCategoryFilter === cat
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={pkgSearchQuery}
                      onChange={(e) => setPkgSearchQuery(e.target.value)}
                      placeholder="Search packages..."
                      className="pl-8 pr-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 w-48"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {filteredCatalogPackages.map((pkg) => {
                    const isCached = Boolean(cacheStatus?.packages[pkg.id]);
                    const isLoaded =
                      loadedSessionPackages.includes(pkg.id) ||
                      loadedSessionPackages.includes(pkg.importName);
                    const isBusy = installingPkgId === pkg.id;

                    return (
                      <div
                        key={pkg.id}
                        className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-slate-100">
                              {pkg.name}{' '}
                              <span className="font-mono text-[11px] text-slate-400">
                                v{pkg.version}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400">
                              ~{pkg.sizeEstimateMb} MB
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {pkg.category} · <code className="text-slate-300">import {pkg.importName}</code>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {pkg.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <div className="text-[11px]">
                            {isLoaded ? (
                              <span className="text-emerald-400 font-medium">
                                Loaded in Session
                              </span>
                            ) : isCached ? (
                              <span className="text-blue-400 font-medium">Cached Offline</span>
                            ) : (
                              <span className="text-slate-500">Available Online</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {!isLoaded && (
                              <button
                                disabled={isBusy}
                                onClick={() => handleLoadPackageIntoSession(pkg.id)}
                                className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] cursor-pointer"
                              >
                                {isBusy ? 'Loading...' : 'Load Now'}
                              </button>
                            )}
                            {!isCached ? (
                              <button
                                disabled={isBusy || !isOnline}
                                onClick={() => handleDownloadSinglePackage(pkg.id)}
                                className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] cursor-pointer"
                              >
                                Cache Offline
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRemoveCachedPkg(pkg.id)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 text-[11px] cursor-pointer"
                              >
                                Remove Cache
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-800/80 border-t border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div>
                Cached Files: <strong className="text-slate-200 font-mono">{cacheStatus?.totalCachedFiles || 0}</strong>
                {cacheStatus?.storageQuota && (
                  <span>
                    {' '}
                    · Browser Storage Used:{' '}
                    <strong className="text-slate-200 font-mono">
                      {(cacheStatus.storageQuota.usageBytes / (1024 * 1024)).toFixed(1)} MB
                    </strong>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    await clearCompilerCache();
                    await refreshCacheStatus();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 cursor-pointer"
                >
                  Clear All Cached Binaries
                </button>
                <button
                  onClick={() => setShowOfflineModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW FILE MODAL */}
      {newFileModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 w-full max-w-sm space-y-3">
            <div className="text-sm font-bold text-white">Create New File</div>
            <input
              type="text"
              value={newFileNameInput}
              onChange={(e) => setNewFileNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNewFile();
              }}
              placeholder={
                activeProject?.language === 'python'
                  ? 'e.g. script.py or data.csv'
                  : 'e.g. solution.cpp'
              }
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNewFileModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewFile}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLOT LIGHTBOX ZOOM MODAL */}
      {zoomedPlot && (
        <div
          onClick={() => setZoomedPlot(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl p-4 max-w-4xl max-h-[90vh] overflow-auto relative"
          >
            <button
              onClick={() => setZoomedPlot(null)}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={`data:image/png;base64,${zoomedPlot}`}
              alt="Zoomed Matplotlib Plot"
              className="max-w-full h-auto"
            />
          </div>
        </div>
      )}

      {/* CLASSROOM & CODING ASSESSMENT MODAL */}
      {showClassroomModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-xs">
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Classroom Exercises & Coding Assessments
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Share exercises via link or run server-verified coding assignments with auto-grading
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowClassroomModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setClassroomTab('student')}
                  className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition ${
                    classroomTab === 'student'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Student Workspace & Submit
                </button>
                <button
                  onClick={() => setClassroomTab('teacher')}
                  className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition ${
                    classroomTab === 'teacher'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Teacher: Create & View Submissions
                </button>
              </div>

              <button
                onClick={handleCopyExerciseShareLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-medium cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedShareLink ? 'Copied Link!' : 'Share Current Code as Exercise Link'}</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {classroomTab === 'student' ? (
                <div className="space-y-4">
                  {/* Lookup Assignment by ID */}
                  <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-200">Load Classroom Assignment</div>
                      <div className="text-[11px] text-slate-400">
                        Enter the Assignment ID shared by your teacher (e.g. <code className="text-slate-300">asgn-...</code>)
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={assignmentLookupId}
                        onChange={(e) => setAssignmentLookupId(e.target.value)}
                        placeholder="asgn-..."
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono w-48 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => handleLoadAssignmentById(assignmentLookupId)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                      >
                        Load Assignment
                      </button>
                    </div>
                  </div>

                  {submissionError && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300">
                      {submissionError}
                    </div>
                  )}

                  {activeAssignment ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">{activeAssignment.title}</h4>
                          <span className="font-mono text-[11px] text-amber-400">
                            Language: {activeAssignment.language.toUpperCase()} · {activeAssignment.totalTestCasesCount} Test Case(s)
                          </span>
                        </div>
                        {activeAssignment.description && (
                          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {activeAssignment.description}
                          </p>
                        )}
                        {(activeAssignment.sampleInput || activeAssignment.sampleOutput) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                              <div className="text-[11px] text-slate-400 mb-1">Sample Input</div>
                              <pre className="font-mono text-slate-200 whitespace-pre-wrap">
                                {activeAssignment.sampleInput || '(none)'}
                              </pre>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                              <div className="text-[11px] text-slate-400 mb-1">Expected Output</div>
                              <pre className="font-mono text-emerald-300 whitespace-pre-wrap">
                                {activeAssignment.sampleOutput || '(none)'}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Student Submission Form */}
                      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                        <div className="font-semibold text-slate-200">
                          Submit Current Editor Code ({activeFile?.name})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Student Name *
                            </label>
                            <input
                              type="text"
                              value={studentName}
                              onChange={(e) => setStudentName(e.target.value)}
                              placeholder="Your full name"
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Student / Roll ID (Optional)
                            </label>
                            <input
                              type="text"
                              value={studentIdInput}
                              onChange={(e) => setStudentIdInput(e.target.value)}
                              placeholder="e.g. 2026-CS-104"
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-400">
                            Submissions are verified and graded on the server before confirmation.
                          </span>
                          <button
                            disabled={submittingSolution}
                            onClick={handleStudentSubmitAssignment}
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold cursor-pointer"
                          >
                            {submittingSolution ? 'Grading & Submitting...' : 'Submit Solution'}
                          </button>
                        </div>
                      </div>

                      {/* Verified Server Submission Receipt */}
                      {submissionReceipt && (
                        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-700/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-300">
                              Submission Confirmed (Receipt #{submissionReceipt.submissionId})
                            </span>
                            <span className="font-mono font-bold text-white">
                              Score: {submissionReceipt.passedCount}/{submissionReceipt.totalCount} (
                              {submissionReceipt.scorePercent}%)
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300">
                            Status: <strong className="uppercase">{submissionReceipt.status}</strong> · Recorded at{' '}
                            {new Date(submissionReceipt.submittedAt).toLocaleTimeString()}
                          </div>
                          {Array.isArray(submissionReceipt.testResults) && (
                            <div className="space-y-1.5 pt-2">
                              {submissionReceipt.testResults.map((tr: any, idx: number) => (
                                <div
                                  key={tr.testCaseId || idx}
                                  className="px-3 py-1.5 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between font-mono text-[11px]"
                                >
                                  <span>
                                    Test Case #{idx + 1} {tr.isHidden ? '(Hidden Grading Case)' : '(Sample Case)'}
                                  </span>
                                  <span className={tr.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                    {tr.passed ? 'PASSED' : 'FAILED'} ({tr.executionTimeMs}ms)
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-8">
                      No classroom assignment loaded. Enter an Assignment ID above, or switch to the Teacher tab to create one.
                    </div>
                  )}
                </div>
              ) : (
                /* TEACHER TAB: Create Assignment & View Submissions */
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-3">
                    <div className="font-semibold text-white">
                      Create New Classroom Coding Assignment
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-400 mb-1">Question Title *</label>
                        <input
                          type="text"
                          value={teacherTitle}
                          onChange={(e) => setTeacherTitle(e.target.value)}
                          placeholder="e.g. Lab 1: Sum of Array Elements"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Language</label>
                        <select
                          value={teacherLang}
                          onChange={(e) => {
                            const l = e.target.value as CompilerLanguage;
                            setTeacherLang(l);
                            setTeacherStarterCode(MINIMAL_HELLO_WORLD[l]);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                        >
                          <option value="python">Python 3.12</option>
                          <option value="cpp">C++20</option>
                          <option value="c">C17</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Problem Description & Instructions
                      </label>
                      <textarea
                        rows={2}
                        value={teacherDesc}
                        onChange={(e) => setTeacherDesc(e.target.value)}
                        placeholder="Write clear instructions for students..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Visible Sample Input (STDIN)
                        </label>
                        <textarea
                          rows={2}
                          value={teacherSampleIn}
                          onChange={(e) => setTeacherSampleIn(e.target.value)}
                          placeholder="e.g. 5&#10;10 20 30 40 50"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Visible Sample Expected Output
                        </label>
                        <textarea
                          rows={2}
                          value={teacherSampleOut}
                          onChange={(e) => setTeacherSampleOut(e.target.value)}
                          placeholder="e.g. 150"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Hidden Grading Test Input (Optional — hidden from students)
                        </label>
                        <textarea
                          rows={2}
                          value={teacherHiddenIn}
                          onChange={(e) => setTeacherHiddenIn(e.target.value)}
                          placeholder="Hidden input..."
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Hidden Grading Expected Output (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={teacherHiddenOut}
                          onChange={(e) => setTeacherHiddenOut(e.target.value)}
                          placeholder="Hidden expected output..."
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">{teacherStatusMsg}</span>
                      <button
                        onClick={handleTeacherCreateAssignment}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                      >
                        Create Assignment Link
                      </button>
                    </div>

                    {createdAssignmentInfo && (
                      <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 space-y-1.5 font-mono text-[11px]">
                        <div className="flex items-center justify-between text-blue-200">
                          <span>
                            Student Assignment ID: <strong>{createdAssignmentInfo.assignmentId}</strong>
                          </span>
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}/compiler?assignment=${createdAssignmentInfo.assignmentId}`;
                              navigator.clipboard.writeText(url);
                              setTeacherStatusMsg('Student assignment link copied!');
                            }}
                            className="px-2 py-0.5 rounded bg-blue-600 text-white font-sans cursor-pointer"
                          >
                            Copy Student Link
                          </button>
                        </div>
                        <div className="text-amber-300">
                          Teacher Access Key (Save this to view submissions):{' '}
                          <strong>{createdAssignmentInfo.teacherKey}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Teacher Submissions Viewer */}
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-3">
                    <div className="font-semibold text-white">View Student Submissions & Results</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={teacherReviewAsgnId}
                        onChange={(e) => setTeacherReviewAsgnId(e.target.value)}
                        placeholder="Assignment ID (asgn-...)"
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono w-48"
                      />
                      <input
                        type="text"
                        value={teacherReviewKey}
                        onChange={(e) => setTeacherReviewKey(e.target.value)}
                        placeholder="Teacher Key (tkey-...)"
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono w-48"
                      />
                      <button
                        onClick={handleTeacherFetchSubmissions}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                      >
                        Load Submissions
                      </button>
                    </div>

                    {teacherSubmissionsList && (
                      <div className="space-y-2 pt-2">
                        {teacherSubmissionsList.length === 0 ? (
                          <div className="text-slate-400 py-4 text-center">
                            No submissions received yet for this assignment.
                          </div>
                        ) : (
                          teacherSubmissionsList.map((sub: any) => (
                            <div
                              key={sub.submissionId}
                              className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2"
                            >
                              <div>
                                <div className="font-semibold text-white">
                                  {sub.studentName}{' '}
                                  {sub.studentId && (
                                    <span className="text-slate-400 font-mono">({sub.studentId})</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {new Date(sub.submittedAt).toLocaleTimeString()} · {sub.language.toUpperCase()} · Status:{' '}
                                  <span className="uppercase text-slate-200">{sub.status}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-emerald-400">
                                  {sub.passedCount}/{sub.totalCount} ({sub.scorePercent}%)
                                </span>
                                <button
                                  onClick={() => {
                                    updateActiveFileContent(sub.code);
                                    setShowClassroomModal(false);
                                  }}
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 cursor-pointer"
                                >
                                  Inspect Code in Editor
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompilerTool;
