import JSZip from 'jszip';

export type CompilerLanguage = 'python' | 'cpp' | 'c';

export interface ProjectFile {
  name: string;
  content: string;
  isBinary?: boolean;
  mimeType?: string;
  size?: number;
  updatedAt: number;
}

export interface NotebookCellData {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  executionCount?: number | null;
  stdout?: string;
  stderr?: string;
  plots?: string[];
  dataframes?: Array<{
    name: string;
    rows: number;
    cols: number;
    columns: string[];
    dtypes: Record<string, string>;
    previewRows: Record<string, any>[];
    csvContent: string;
  }>;
  executionTimeMs?: number;
  status?: 'idle' | 'running' | 'completed' | 'error';
}

export interface CompilerProject {
  id: string;
  name: string;
  language: CompilerLanguage;
  files: ProjectFile[];
  activeFileName: string;
  stdin: string;
  notebookCells?: NotebookCellData[];
  createdAt: number;
  updatedAt: number;
}

export interface CodeTemplate {
  id: string;
  name: string;
  language: CompilerLanguage;
  category: string;
  description: string;
  fileName: string;
  code: string;
  defaultStdin?: string;
  sampleFiles?: Array<{ name: string; content: string }>;
}

const PROJECTS_STORAGE_KEY = 'tooltrack_compiler_projects_v2';
const ACTIVE_PROJECT_ID_KEY = 'tooltrack_compiler_active_project_v2';
const LANGUAGE_DRAFT_KEY_PREFIX = 'tooltrack_compiler_lang_draft_';
const IDB_PROJECTS_DB = 'tooltrack_compiler_projects_idb_v1';
const IDB_PROJECTS_STORE = 'projects';

/**
 * Minimal clean starter code for new files and default projects.
 * No predefined scientific bloat, CSV files, or helper scripts.
 */
export const MINIMAL_HELLO_WORLD: Record<CompilerLanguage, string> = {
  python: `print("Hello, World!")\n`,
  cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n`,
  c: `#include <stdio.h>\n\nint main(void) {\n    printf("Hello, World!\\n");\n    return 0;\n}\n`,
};

/**
 * Optional examples accessible ONLY when the user explicitly selects one from the Examples menu.
 */
export const COMPILER_TEMPLATES: CodeTemplate[] = [
  {
    id: 'py-hello',
    name: 'Hello World (Minimal)',
    language: 'python',
    category: 'Starter',
    description: 'Clean minimal Python 3 program.',
    fileName: 'main.py',
    code: MINIMAL_HELLO_WORLD.python,
  },
  {
    id: 'py-pandas-matplotlib',
    name: 'Pandas & Matplotlib Sales Chart',
    language: 'python',
    category: 'Data Science',
    description: 'DataFrame creation, mean calculation, and Matplotlib bar chart.',
    fileName: 'main.py',
    code: `import pandas as pd
import matplotlib.pyplot as plt

data = {
    "Product": ["Pen", "Book", "Bag"],
    "Sales": [120, 300, 500]
}

df = pd.DataFrame(data)

print(df)
print("Average:", df["Sales"].mean())

plt.bar(df["Product"], df["Sales"], color="#2563eb")
plt.title("Product Sales")
plt.xlabel("Product")
plt.ylabel("Sales")
plt.show()
`,
  },
  {
    id: 'py-data-cleaning',
    name: 'Pandas Missing Data Imputation',
    language: 'python',
    category: 'Data Science',
    description: 'Inspect null values and impute missing numeric columns with column means.',
    fileName: 'main.py',
    code: `import pandas as pd

data = {
    "Name": ["Alice", "Bob", "Charlie", "Diana", "Evan"],
    "Age": [20, 21, None, 22, 21],
    "City": ["Dhaka", "Dhaka", "Chittagong", "Dhaka", "Chittagong"],
    "Score": [82, 75, 90, None, 85]
}

df = pd.DataFrame(data)
print("Missing values per column:")
print(df.isnull().sum())

df["Age"] = df["Age"].fillna(df["Age"].mean())
df["Score"] = df["Score"].fillna(df["Score"].mean())

print("\\nCleaned DataFrame:")
print(df)
`,
  },
  {
    id: 'py-sklearn-regression',
    name: 'Scikit-Learn Linear Regression & Scaling',
    language: 'python',
    category: 'Machine Learning',
    description: 'Train/test split, StandardScaler normalization, and LinearRegression R2 evaluation.',
    fileName: 'main.py',
    code: `import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

np.random.seed(42)
X = np.linspace(1, 20, 40).reshape(-1, 1)
y = 3.5 * X.squeeze() + 7.0 + np.random.normal(0, 2.0, size=40)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = LinearRegression()
model.fit(X_train_scaled, y_train)
preds = model.predict(X_test_scaled)

print(f"Learned Coefficient: {model.coef_[0]:.4f}")
print(f"Intercept:           {model.intercept_:.4f}")
print(f"Test MSE:            {mean_squared_error(y_test, preds):.4f}")
print(f"Test R2 Score:       {r2_score(y_test, preds):.4f}")
`,
  },
  {
    id: 'cpp-hello',
    name: 'Hello World (C++20)',
    language: 'cpp',
    category: 'Starter',
    description: 'Clean minimal C++20 starter program.',
    fileName: 'main.cpp',
    code: MINIMAL_HELLO_WORLD.cpp,
  },
  {
    id: 'cpp-stl-algorithms',
    name: 'C++20 STL Vector & Sorting',
    language: 'cpp',
    category: 'Algorithms',
    description: 'Demonstrates std::vector, std::sort, and standard input.',
    fileName: 'main.cpp',
    defaultStdin: '5\n42 15 8 99 23\n',
    code: `#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

int main() {
    int n = 5;
    if (!(std::cin >> n) || n <= 0) {
        n = 5;
    }

    std::vector<int> nums(n);
    for (int i = 0; i < n; ++i) {
        if (!(std::cin >> nums[i])) {
            nums[i] = (i + 1) * 10;
        }
    }

    std::sort(nums.begin(), nums.end());
    long long total = std::accumulate(nums.begin(), nums.end(), 0LL);

    std::cout << "Sorted (" << n << " elements): ";
    for (int x : nums) std::cout << x << " ";
    std::cout << "\\nSum: " << total << std::endl;
    return 0;
}
`,
  },
  {
    id: 'c-hello',
    name: 'Hello World (C17)',
    language: 'c',
    category: 'Starter',
    description: 'Clean minimal C17 starter program.',
    fileName: 'main.c',
    code: MINIMAL_HELLO_WORLD.c,
  },
  {
    id: 'c-pointers-structs',
    name: 'C17 Recursion & Array Analytics',
    language: 'c',
    category: 'Systems',
    description: 'Factorial recursion and array average in standard C17.',
    fileName: 'main.c',
    defaultStdin: '6\n',
    code: `#include <stdio.h>

long long factorial(int n) {
    if (n <= 1) return 1;
    return (long long)n * factorial(n - 1);
}

int main(void) {
    int n = 6;
    if (scanf("%d", &n) != 1) {
        n = 6;
    }
    printf("Factorial of %d = %lld\\n", n, factorial(n));
    return 0;
}
`,
  },
];

export function getDefaultFileName(language: CompilerLanguage): string {
  if (language === 'python') return 'main.py';
  if (language === 'cpp') return 'main.cpp';
  return 'main.c';
}

export function getDefaultTemplateForLanguage(language: CompilerLanguage): CodeTemplate {
  return (
    COMPILER_TEMPLATES.find((t) => t.language === language && t.category === 'Starter') ||
    COMPILER_TEMPLATES.find((t) => t.language === language) ||
    COMPILER_TEMPLATES[0]
  );
}

export function getDefaultNotebookCells(): NotebookCellData[] {
  return [
    {
      id: 'cell-code-1',
      type: 'code',
      content: `print("Hello, World!")`,
      status: 'idle',
    },
  ];
}

/**
 * Detect whether a stored project file is untouched legacy demo bloat from earlier versions
 * so we can replace it with clean Hello World while preserving genuine user-written code.
 */
function isUntouchedLegacyDemoCode(code: string): boolean {
  const trimmed = code.trim();
  if (
    trimmed.includes('# 1. Create the Product Sales DataFrame') &&
    trimmed.includes('# 2. Plot Product vs Sales Bar Chart')
  ) {
    return true;
  }
  if (
    trimmed.includes('C++20 STL Vector & Algorithms Demo') &&
    trimmed.includes('std::accumulate(nums.begin(), nums.end(), 0LL)')
  ) {
    return true;
  }
  if (
    trimmed.includes('C17 Standard Library Demo') &&
    trimmed.includes('Student #%d Score: %d')
  ) {
    return true;
  }
  return false;
}

export function loadCompilerProjects(): CompilerProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let migrated = false;
        const cleaned = parsed.map((proj: CompilerProject) => {
          const updatedFiles = (proj.files || [])
            .filter((f) => {
              // Remove automatically generated demo bloat files from the default project
              if (
                proj.id === 'proj-python-default' &&
                (f.name === 'helpers.py' || f.name === 'sales_sample.csv') &&
                (f.content.includes('def summarize_series') ||
                  f.content.includes('Product,Region,Sales,Quantity'))
              ) {
                migrated = true;
                return false;
              }
              return true;
            })
            .map((f) => {
              if (isUntouchedLegacyDemoCode(f.content)) {
                migrated = true;
                return {
                  ...f,
                  content: MINIMAL_HELLO_WORLD[proj.language] || MINIMAL_HELLO_WORLD.python,
                };
              }
              return f;
            });

          return {
            ...proj,
            name:
              proj.id === 'proj-python-default' && proj.name === 'Data Science & Plotting'
                ? 'Python Workspace'
                : proj.name,
            files:
              updatedFiles.length > 0
                ? updatedFiles
                : [
                    {
                      name: getDefaultFileName(proj.language),
                      content: MINIMAL_HELLO_WORLD[proj.language] || MINIMAL_HELLO_WORLD.python,
                      updatedAt: Date.now(),
                    },
                  ],
          };
        });

        if (migrated) {
          saveCompilerProjects(cleaned);
        }
        return cleaned;
      }
    }
  } catch {
    // Ignore parse error
  }

  const legacyLang = (localStorage.getItem('compiler_lang') as CompilerLanguage) || 'python';
  const legacyCode = localStorage.getItem('compiler_code');
  const now = Date.now();

  const defaultProjects: CompilerProject[] = [
    {
      id: 'proj-python-default',
      name: 'Python Workspace',
      language: 'python',
      activeFileName: 'main.py',
      stdin: '',
      files: [
        {
          name: 'main.py',
          content:
            legacyLang === 'python' && legacyCode && !isUntouchedLegacyDemoCode(legacyCode)
              ? legacyCode
              : MINIMAL_HELLO_WORLD.python,
          updatedAt: now,
        },
      ],
      notebookCells: getDefaultNotebookCells(),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'proj-cpp-default',
      name: 'C++ Workspace',
      language: 'cpp',
      activeFileName: 'main.cpp',
      stdin: '',
      files: [
        {
          name: 'main.cpp',
          content:
            legacyLang === 'cpp' && legacyCode && !isUntouchedLegacyDemoCode(legacyCode)
              ? legacyCode
              : MINIMAL_HELLO_WORLD.cpp,
          updatedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'proj-c-default',
      name: 'C Workspace',
      language: 'c',
      activeFileName: 'main.c',
      stdin: '',
      files: [
        {
          name: 'main.c',
          content:
            legacyLang === 'c' && legacyCode && !isUntouchedLegacyDemoCode(legacyCode)
              ? legacyCode
              : MINIMAL_HELLO_WORLD.c,
          updatedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];

  saveCompilerProjects(defaultProjects);
  return defaultProjects;
}

/**
 * Persist projects to both localStorage (synchronous fast load) and IndexedDB (large datasets)
 */
export function saveCompilerProjects(projects: CompilerProject[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Ignore quota errors on localStorage
  }

  // Mirror to IndexedDB asynchronously for resilience with larger uploaded files
  if (typeof indexedDB !== 'undefined') {
    try {
      const req = indexedDB.open(IDB_PROJECTS_DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_PROJECTS_STORE)) {
          db.createObjectStore(IDB_PROJECTS_STORE);
        }
      };
      req.onsuccess = () => {
        try {
          const db = req.result;
          const tx = db.transaction(IDB_PROJECTS_STORE, 'readwrite');
          tx.objectStore(IDB_PROJECTS_STORE).put(projects, 'all_projects');
          tx.oncomplete = () => db.close();
          tx.onerror = () => db.close();
        } catch {}
      };
    } catch {}
  }
}

/**
 * Save larger dataset files to Origin Private File System (OPFS) when supported
 */
export async function saveDatasetToOpfs(fileName: string, content: string | ArrayBuffer): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage || !(navigator.storage as any).getDirectory) {
      return false;
    }
    const root = await (navigator.storage as any).getDirectory();
    const dir = await root.getDirectoryHandle('tooltrack_datasets', { create: true });
    const fileHandle = await dir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

export function getActiveProjectId(projects: CompilerProject[]): string {
  try {
    const savedId = localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
    if (savedId && projects.some((p) => p.id === savedId)) {
      return savedId;
    }
  } catch {
    // Ignore
  }
  return projects[0]?.id || 'proj-python-default';
}

export function setActiveProjectId(projectId: string): void {
  try {
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, projectId);
  } catch {
    // Ignore
  }
}

export function saveLanguageDraft(language: CompilerLanguage, code: string, stdin: string): void {
  try {
    localStorage.setItem(
      `${LANGUAGE_DRAFT_KEY_PREFIX}${language}`,
      JSON.stringify({ code, stdin, updatedAt: Date.now() })
    );
  } catch {
    // Ignore
  }
}

export function loadLanguageDraft(language: CompilerLanguage): { code: string; stdin: string } | null {
  try {
    const raw = localStorage.getItem(`${LANGUAGE_DRAFT_KEY_PREFIX}${language}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function exportProjectAsZip(project: CompilerProject): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder(project.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'project') || zip;

  for (const file of project.files) {
    if (file.isBinary) {
      folder.file(file.name, file.content, { base64: true });
    } else {
      folder.file(file.name, file.content);
    }
  }

  if (project.stdin.trim()) {
    folder.file('stdin.txt', project.stdin);
  }

  if (project.notebookCells && project.notebookCells.length > 0 && project.language === 'python') {
    folder.file('notebook.ipynb', exportNotebookToIpynb(project.notebookCells));
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function exportNotebookToIpynb(cells: NotebookCellData[]): string {
  const ipynb = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        display_name: 'Python 3 (Pyodide)',
        language: 'python',
        name: 'python3',
      },
      language_info: {
        name: 'python',
        version: '3.12.0',
      },
    },
    cells: cells.map((cell) => ({
      id: cell.id,
      cell_type: cell.type,
      metadata: {},
      source: cell.content.split('\n').map((line, i, arr) => (i < arr.length - 1 ? `${line}\n` : line)),
      ...(cell.type === 'code'
        ? {
            execution_count: cell.executionCount || null,
            outputs: [
              ...(cell.stdout
                ? [
                    {
                      output_type: 'stream',
                      name: 'stdout',
                      text: cell.stdout.split('\n').map((l) => `${l}\n`),
                    },
                  ]
                : []),
              ...(cell.stderr
                ? [
                    {
                      output_type: 'stream',
                      name: 'stderr',
                      text: cell.stderr.split('\n').map((l) => `${l}\n`),
                    },
                  ]
                : []),
              ...(cell.plots || []).map((b64) => ({
                output_type: 'display_data',
                data: { 'image/png': b64 },
                metadata: {},
              })),
            ],
          }
        : {}),
    })),
  };
  return JSON.stringify(ipynb, null, 2);
}

export function parseIpynbToCells(jsonString: string): NotebookCellData[] {
  const parsed = JSON.parse(jsonString);
  if (!parsed || !Array.isArray(parsed.cells)) {
    throw new Error('Invalid .ipynb file structure.');
  }
  return parsed.cells.map((c: any, idx: number) => {
    const source = Array.isArray(c.source) ? c.source.join('') : String(c.source || '');
    return {
      id: c.id || `cell-imported-${Date.now()}-${idx}`,
      type: c.cell_type === 'markdown' ? 'markdown' : 'code',
      content: source,
      executionCount: c.execution_count ?? null,
      status: 'idle',
    };
  });
}
