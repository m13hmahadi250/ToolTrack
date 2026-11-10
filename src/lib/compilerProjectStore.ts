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

export const COMPILER_TEMPLATES: CodeTemplate[] = [
  {
    id: 'py-pandas-matplotlib',
    name: 'Pandas & Matplotlib Analytics',
    language: 'python',
    category: 'Data Science',
    description: 'DataFrame aggregation, missing value imputation, and high-DPI Matplotlib bar & line subplots.',
    fileName: 'main.py',
    code: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# 1. Create the Product Sales DataFrame
data = {
    "Product": ["Pen", "Book", "Bag", "Pencil", "Notebook"],
    "Sales": [120, 300, 500, 100, 250],
    "Quantity": [10, 15, 8, 20, 12]
}

df = pd.DataFrame(data)
df["Revenue"] = df["Sales"] * df["Quantity"]

print("Full Product DataFrame:")
print(df)

print("\\nFirst 3 rows:")
print(df.head(3))

average_sales = df["Sales"].mean()
print(f"\\nAverage Sales: {average_sales:.2f}")

highest_index = df["Sales"].idxmax()
print("Product with highest Sales:", df.loc[highest_index, "Product"])

# 2. Plot Product vs Sales Bar Chart
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5))

colors = ["#2563eb", "#3b82f6", "#1d4ed8", "#60a5fa", "#1e40af"]
ax1.bar(df["Product"], df["Sales"], color=colors, edgecolor="#1e293b", linewidth=0.8)
ax1.axhline(average_sales, color="#ef4444", linestyle="--", label=f"Mean ({average_sales:.0f})")
ax1.set_xlabel("Product")
ax1.set_ylabel("Sales ($)")
ax1.set_title("Product vs Sales")
ax1.legend()
ax1.grid(axis="y", alpha=0.25)

ax2.plot(df["Product"], df["Revenue"], marker="o", linewidth=2.2, color="#059669")
ax2.set_xlabel("Product")
ax2.set_ylabel("Total Revenue ($)")
ax2.set_title("Total Revenue by Product")
ax2.grid(True, alpha=0.25)

plt.tight_layout()
plt.show()
`
  },
  {
    id: 'py-data-cleaning',
    name: 'Data Cleaning & Imputation',
    language: 'python',
    category: 'Data Science',
    description: 'Clean missing values (NaN), normalize text casing, and compute summary statistics with Pandas.',
    fileName: 'main.py',
    code: `import pandas as pd

# Create sample dataset with missing values and inconsistent casing
data = {
    "Name": ["Alice", "Bob", "Charlie", "Diana", "Evan"],
    "Age": [20, 21, None, 22, 21],
    "City": ["Dhaka", "dhaka", "Chittagong", "Dhaka", "Chittagong"],
    "Score": [82, 75, 90, None, 85]
}

df = pd.DataFrame(data)

print("1. Missing values per column:")
print(df.isnull().sum())

# Replace missing Age & Score with column mean, normalize City names
df["Age"] = df["Age"].fillna(df["Age"].mean())
df["Score"] = df["Score"].fillna(df["Score"].mean())
df["City"] = df["City"].str.title()

print("\\n2. Cleaned DataFrame:")
print(df)

print("\\n3. Average Score by City:")
city_summary = df.groupby("City", as_index=False)[["Age", "Score"]].mean()
print(city_summary)
`
  },
  {
    id: 'py-sklearn-ml',
    name: 'Scikit-Learn ML Pipeline',
    language: 'python',
    category: 'Machine Learning',
    description: 'Feature scaling with StandardScaler, train/test split, LinearRegression, and decision visualization.',
    fileName: 'main.py',
    code: `import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

# 1. StandardScaler Verification
X_raw = [[10.0, 200.0], [20.0, 300.0], [30.0, 400.0], [40.0, 500.0]]
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_raw)
print("StandardScaler Output:")
print(np.round(X_scaled, 4))

# 2. Synthetic Regression Dataset
np.random.seed(42)
hours = np.linspace(1, 10, 40).reshape(-1, 1)
scores = 45 + 5.2 * hours.flatten() + np.random.normal(0, 3.0, size=40)

X_train, X_test, y_train, y_test = train_test_split(hours, scores, test_size=0.25, random_state=42)

model = LinearRegression()
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

print(f"\\nModel Slope: {model.coef_[0]:.3f}, Intercept: {model.intercept_:.3f}")
print(f"R2 Score: {r2_score(y_test, y_pred):.4f}, RMSE: {np.sqrt(mean_squared_error(y_test, y_pred)):.3f}")

# 3. Plot Regression Fit
plt.figure(figsize=(7, 4.2))
plt.scatter(X_train, y_train, color="#2563eb", alpha=0.75, label="Training Data")
plt.scatter(X_test, y_test, color="#f59e0b", s=55, label="Test Data")
plt.plot(hours, model.predict(hours), color="#dc2626", linewidth=2, label="Regression Line")
plt.title("Study Hours vs Exam Score (Linear Regression)")
plt.xlabel("Study Hours")
plt.ylabel("Exam Score")
plt.legend()
plt.grid(True, alpha=0.25)
plt.tight_layout()
plt.show()
`
  },
  {
    id: 'py-interactive-stdin',
    name: 'Interactive CLI & Algorithms',
    language: 'python',
    category: 'Core Python',
    description: 'Demonstrates sequential input() prompts, list comprehensions, and sorting.',
    fileName: 'main.py',
    defaultStdin: 'Ada Lovelace\n5\n12 45 7 89 23\n',
    code: `# Interactive Input & Algorithm Demo
name = input("Enter your name: ")
n = int(input("How many numbers? "))
numbers = list(map(int, input("Enter numbers separated by space: ").split()))

print(f"\\nHello, {name}!")
print(f"Original numbers ({n}):", numbers)
print("Sorted ascending:", sorted(numbers))
print("Sum:", sum(numbers), "| Max:", max(numbers), "| Min:", min(numbers))
`
  },
  {
    id: 'cpp-stl-algorithms',
    name: 'C++20 STL & Algorithms',
    language: 'cpp',
    category: 'C++20',
    description: 'Uses std::vector, std::sort, std::map, structured loops, and fast I/O.',
    fileName: 'main.cpp',
    defaultStdin: '5\n42 15 8 99 23\n',
    code: `#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
#include <map>

using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    int a = 0, b = 1;
    for (int i = 2; i <= n; ++i) {
        int next = a + b;
        a = b;
        b = next;
    }
    return b;
}

int main() {
    int n = 5;
    if (!(cin >> n)) {
        n = 5;
    }

    vector<int> nums;
    for (int i = 0; i < n; ++i) {
        int val;
        if (cin >> val) nums.push_back(val);
    }

    if (nums.empty()) {
        nums = {42, 15, 8, 99, 23};
    }

    sort(nums.begin(), nums.end());

    cout << "Sorted Vector (" << nums.size() << " elements): ";
    for (int x : nums) {
        cout << x << " ";
    }
    cout << "\\n";

    int total = 0;
    for (int x : nums) total += x;
    cout << "Sum: " << total << " | Min: " << nums.front() << " | Max: " << nums.back() << "\\n";

    cout << "First 8 Fibonacci numbers: ";
    for (int i = 0; i < 8; ++i) {
        cout << fibonacci(i) << (i + 1 < 8 ? ", " : "\\n");
    }

    return 0;
}
`
  },
  {
    id: 'cpp-competitive',
    name: 'Competitive Programming Template',
    language: 'cpp',
    category: 'C++20',
    description: 'Multi-testcase competitive programming setup with priority_queue and custom helper functions.',
    fileName: 'main.cpp',
    defaultStdin: '3\n10 20\n7 8\n100 250\n',
    code: `#include <iostream>
#include <vector>
#include <algorithm>
#include <queue>

using namespace std;

void solve(int tc) {
    long long a = 0, b = 0;
    if (!(cin >> a >> b)) return;
    cout << "Case #" << tc << ": " << a << " + " << b << " = " << (a + b)
         << " | GCD-like diff = " << abs(a - b) << "\\n";
}

int main() {
    int t = 1;
    if (cin >> t) {
        for (int tc = 1; tc <= t; ++tc) {
            solve(tc);
        }
    }
    return 0;
}
`
  },
  {
    id: 'c-systems-structs',
    name: 'C17 Structs, Arrays & Math',
    language: 'c',
    category: 'C17',
    description: 'Standard C17 program using structs, formatted printf tables, math.h, and standard input.',
    fileName: 'main.c',
    defaultStdin: '6\n',
    code: `#include <stdio.h>
#include <stdlib.h>
#include <math.h>

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main(void) {
    int n = 5;
    if (scanf("%d", &n) != 1) {
        n = 5;
    }

    printf("=== ToolTrack C17 Execution Engine ===\\n");
    printf("Input N = %d\\n", n);
    printf("Factorial(%d) = %d\\n", n, factorial(n));
    printf("Square Root(%d) = %.4f\\n\\n", n, sqrt((double)n));

    int scores[5] = {88, 92, 79, 95, 84};
    int sum = 0;
    for (int i = 0; i < 5; i++) {
        sum += scores[i];
        printf("Student #%d Score: %d\\n", i + 1, scores[i]);
    }
    printf("Average Score: %.2f\\n", sum / 5.0);

    return 0;
}
`
  }
];

export function getDefaultFileName(language: CompilerLanguage): string {
  if (language === 'python') return 'main.py';
  if (language === 'cpp') return 'main.cpp';
  return 'main.c';
}

export function getDefaultTemplateForLanguage(language: CompilerLanguage): CodeTemplate {
  return (
    COMPILER_TEMPLATES.find((t) => t.language === language) ||
    COMPILER_TEMPLATES[0]
  );
}

export function getDefaultNotebookCells(): NotebookCellData[] {
  return [
    {
      id: 'cell-md-1',
      type: 'markdown',
      content: '# ToolTrack Interactive Python Notebook\nRun scientific Python cells with shared kernel state, inline Matplotlib figures, and live Pandas DataFrame tables.'
    },
    {
      id: 'cell-code-1',
      type: 'code',
      content: `import pandas as pd
import numpy as np

data = {
    "Product": ["Pen", "Book", "Bag", "Pencil", "Notebook"],
    "Sales": [120, 300, 500, 100, 250],
    "Quantity": [10, 15, 8, 20, 12]
}
df = pd.DataFrame(data)
df["Total"] = df["Sales"] * df["Quantity"]
print("Summary Mean Sales:", df["Sales"].mean())
print(df)`,
      status: 'idle'
    },
    {
      id: 'cell-code-2',
      type: 'code',
      content: `import matplotlib.pyplot as plt

plt.figure(figsize=(7, 4))
plt.bar(df["Product"], df["Sales"], color="#2563eb")
plt.title("Product vs Sales (Shared Notebook State)")
plt.xlabel("Product")
plt.ylabel("Sales")
plt.grid(axis="y", alpha=0.3)
plt.show()`,
      status: 'idle'
    }
  ];
}

export function loadCompilerProjects(): CompilerProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse error
  }

  // Migrate legacy code if present or create default projects for each language
  const legacyLang = (localStorage.getItem('compiler_lang') as CompilerLanguage) || 'python';
  const legacyCode = localStorage.getItem('compiler_code');
  const now = Date.now();

  const pyTemplate = getDefaultTemplateForLanguage('python');
  const cppTemplate = getDefaultTemplateForLanguage('cpp');
  const cTemplate = getDefaultTemplateForLanguage('c');

  const defaultProjects: CompilerProject[] = [
    {
      id: 'proj-python-default',
      name: 'Data Science & Plotting',
      language: 'python',
      activeFileName: 'main.py',
      stdin: pyTemplate.defaultStdin || '',
      files: [
        {
          name: 'main.py',
          content: legacyLang === 'python' && legacyCode ? legacyCode : pyTemplate.code,
          updatedAt: now
        },
        {
          name: 'helpers.py',
          content: `# Helper module importable from main.py\ndef summarize_series(name: str, values: list[float]) -> str:\n    if not values:\n        return f"{name}: empty"\n    avg = sum(values) / len(values)\n    return f"{name} -> count={len(values)}, mean={avg:.2f}, max={max(values)}"\n`,
          updatedAt: now
        },
        {
          name: 'sales_sample.csv',
          content: `Product,Region,Sales,Quantity\nPen,North,120,10\nBook,South,300,15\nBag,East,500,8\nPencil,West,100,20\nNotebook,North,250,12\n`,
          updatedAt: now
        }
      ],
      notebookCells: getDefaultNotebookCells(),
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'proj-cpp-default',
      name: 'C++20 STL Workspace',
      language: 'cpp',
      activeFileName: 'main.cpp',
      stdin: cppTemplate.defaultStdin || '5\n42 15 8 99 23\n',
      files: [
        {
          name: 'main.cpp',
          content: legacyLang === 'cpp' && legacyCode ? legacyCode : cppTemplate.code,
          updatedAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'proj-c-default',
      name: 'C17 Systems Workspace',
      language: 'c',
      activeFileName: 'main.c',
      stdin: cTemplate.defaultStdin || '6\n',
      files: [
        {
          name: 'main.c',
          content: legacyLang === 'c' && legacyCode ? legacyCode : cTemplate.code,
          updatedAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    }
  ];

  saveCompilerProjects(defaultProjects);
  return defaultProjects;
}

export function saveCompilerProjects(projects: CompilerProject[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Ignore quota errors
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
        name: 'python3'
      },
      language_info: {
        name: 'python',
        version: '3.12.0'
      }
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
                      text: cell.stdout.split('\n').map((l) => `${l}\n`)
                    }
                  ]
                : []),
              ...(cell.stderr
                ? [
                    {
                      output_type: 'stream',
                      name: 'stderr',
                      text: cell.stderr.split('\n').map((l) => `${l}\n`)
                    }
                  ]
                : []),
              ...(cell.plots || []).map((b64) => ({
                output_type: 'display_data',
                data: { 'image/png': b64 },
                metadata: {}
              }))
            ]
          }
        : {})
    }))
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
      status: 'idle'
    };
  });
}
