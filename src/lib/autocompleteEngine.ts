/**
 * ToolTrack Smart Offline Code Autocomplete & Pattern Engine
 * Context-aware code completion and ghost-text prediction for Python, C, and C++.
 * Includes built-in knowledge base for Data Science (Pandas, NumPy, Matplotlib, Scikit-learn),
 * STL, standard algorithms, university programming patterns, and adaptive local learning.
 */

export interface CompletionSuggestion {
  text: string;           // The exact full completion snippet or rest-of-line string
  displayText: string;    // Human readable display label
  kind: 'function' | 'method' | 'variable' | 'keyword' | 'snippet' | 'import' | 'pattern';
  detail?: string;        // Short type or module description (e.g., 'pd.DataFrame method')
  documentation?: string; // Extended docstring or explanation
  insertText?: string;    // Override insert text if different from text
  boost?: number;         // Priority ranking score
}

// Memory of accepted completions for local adaptive learning
const LOCAL_STORAGE_KEY = 'tt_accepted_suggestions_v1';

function getAcceptedWeights(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function recordAcceptedSuggestion(text: string): void {
  try {
    const weights = getAcceptedWeights();
    const key = text.trim();
    weights[key] = (weights[key] || 0) + 1;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(weights));
  } catch {}
}

// --- KNOWLEDGE BASE PATTERNS & SNIPPETS ---

// Python Data Science & Core Knowledge Base
const PYTHON_PATTERNS: Array<{
  trigger: RegExp;
  getCompletions: (context: ContextInfo) => CompletionSuggestion[];
}> = [
  // Import statements
  {
    trigger: /^imp?o?r?t?\s*$/i,
    getCompletions: () => [
      { text: 'import pandas as pd', displayText: 'import pandas as pd', kind: 'import', detail: 'Data analysis & DataFrames', boost: 10 },
      { text: 'import numpy as np', displayText: 'import numpy as np', kind: 'import', detail: 'Multi-dimensional arrays & math', boost: 10 },
      { text: 'import matplotlib.pyplot as plt', displayText: 'import matplotlib.pyplot as plt', kind: 'import', detail: 'Plotting & visualization', boost: 10 },
      { text: 'import os, sys', displayText: 'import os, sys', kind: 'import', detail: 'System & OS utilities', boost: 8 },
      { text: 'import math', displayText: 'import math', kind: 'import', detail: 'Mathematical functions', boost: 8 },
      { text: 'import json', displayText: 'import json', kind: 'import', detail: 'JSON encoder and decoder', boost: 7 },
      { text: 'import random', displayText: 'import random', kind: 'import', detail: 'Random number generation', boost: 7 },
      { text: 'import time', displayText: 'import time', kind: 'import', detail: 'Time access and conversions', boost: 7 },
    ],
  },
  {
    trigger: /^from\s*$/i,
    getCompletions: () => [
      { text: 'from sklearn.model_selection import train_test_split', displayText: 'from sklearn.model_selection import train_test_split', kind: 'import', detail: 'Split arrays into train/test subsets', boost: 10 },
      { text: 'from sklearn.linear_model import LinearRegression', displayText: 'from sklearn.linear_model import LinearRegression', kind: 'import', detail: 'Ordinary least squares Linear Regression', boost: 9 },
      { text: 'from sklearn.ensemble import RandomForestClassifier', displayText: 'from sklearn.ensemble import RandomForestClassifier', kind: 'import', detail: 'Random Forest Classifier', boost: 9 },
      { text: 'from sklearn.metrics import accuracy_score, classification_report', displayText: 'from sklearn.metrics import accuracy_score...', kind: 'import', detail: 'Model evaluation metrics', boost: 9 },
      { text: 'from sklearn.preprocessing import StandardScaler', displayText: 'from sklearn.preprocessing import StandardScaler', kind: 'import', detail: 'Feature scaling', boost: 8 },
    ],
  },

  // Pandas Methods (when typing `pd.` or `df.`)
  {
    trigger: /\bpd\.$/i,
    getCompletions: () => [
      { text: 'read_csv("dataset.csv")', displayText: 'read_csv(filepath)', kind: 'method', detail: 'pd.read_csv', documentation: 'Read a comma-separated values (csv) file into DataFrame.' },
      { text: 'DataFrame(data)', displayText: 'DataFrame(data)', kind: 'method', detail: 'pd.DataFrame', documentation: 'Two-dimensional, size-mutable, potentially heterogeneous tabular data.' },
      { text: 'Series(data)', displayText: 'Series(data)', kind: 'method', detail: 'pd.Series', documentation: 'One-dimensional ndarray with axis labels.' },
      { text: 'date_range(start="2024-01-01", periods=10)', displayText: 'date_range(...)', kind: 'method', detail: 'pd.date_range' },
      { text: 'concat([df1, df2], axis=0)', displayText: 'concat([df1, df2])', kind: 'method', detail: 'pd.concat' },
      { text: 'merge(df1, df2, on="key")', displayText: 'merge(df1, df2, on=...)', kind: 'method', detail: 'pd.merge' },
    ],
  },
  {
    trigger: /\b(?:df|data|dataset|frame)\.$/i,
    getCompletions: () => [
      { text: 'head()', displayText: 'head(n=5)', kind: 'method', detail: 'df.head()', documentation: 'Return the first n rows.' },
      { text: 'tail()', displayText: 'tail(n=5)', kind: 'method', detail: 'df.tail()', documentation: 'Return the last n rows.' },
      { text: 'info()', displayText: 'info()', kind: 'method', detail: 'df.info()', documentation: 'Print a concise summary of a DataFrame.' },
      { text: 'describe()', displayText: 'describe()', kind: 'method', detail: 'df.describe()', documentation: 'Generate descriptive statistics.' },
      { text: 'isnull().sum()', displayText: 'isnull().sum()', kind: 'method', detail: 'df.isnull().sum()', documentation: 'Count missing values per column.' },
      { text: 'dropna()', displayText: 'dropna()', kind: 'method', detail: 'df.dropna()', documentation: 'Remove missing values.' },
      { text: 'fillna(0)', displayText: 'fillna(value)', kind: 'method', detail: 'df.fillna()', documentation: 'Fill NA/NaN values using specified method.' },
      { text: 'groupby("column").mean()', displayText: 'groupby("col").mean()', kind: 'method', detail: 'df.groupby()' },
      { text: 'sort_values(by="column", ascending=False)', displayText: 'sort_values(by=...)', kind: 'method', detail: 'df.sort_values()' },
      { text: 'to_csv("output.csv", index=False)', displayText: 'to_csv(filepath)', kind: 'method', detail: 'df.to_csv()' },
      { text: 'columns', displayText: 'columns', kind: 'variable', detail: 'df.columns' },
      { text: 'shape', displayText: 'shape', kind: 'variable', detail: 'df.shape' },
    ],
  },

  // NumPy Methods (when typing `np.`)
  {
    trigger: /\bnp\.$/i,
    getCompletions: () => [
      { text: 'array([1, 2, 3, 4, 5])', displayText: 'array(object)', kind: 'method', detail: 'np.array' },
      { text: 'linspace(0, 10, 100)', displayText: 'linspace(start, stop, num)', kind: 'method', detail: 'np.linspace' },
      { text: 'arange(0, 10, 1)', displayText: 'arange(start, stop, step)', kind: 'method', detail: 'np.arange' },
      { text: 'zeros((3, 3))', displayText: 'zeros(shape)', kind: 'method', detail: 'np.zeros' },
      { text: 'ones((3, 3))', displayText: 'ones(shape)', kind: 'method', detail: 'np.ones' },
      { text: 'mean(data)', displayText: 'mean(a)', kind: 'method', detail: 'np.mean' },
      { text: 'std(data)', displayText: 'std(a)', kind: 'method', detail: 'np.std' },
      { text: 'random.rand(5)', displayText: 'random.rand(d0, d1...)', kind: 'method', detail: 'np.random.rand' },
      { text: 'random.randn(100)', displayText: 'random.randn(d0, d1...)', kind: 'method', detail: 'np.random.randn' },
      { text: 'dot(a, b)', displayText: 'dot(a, b)', kind: 'method', detail: 'np.dot' },
    ],
  },

  // Matplotlib Methods (when typing `plt.`)
  {
    trigger: /\bplt\.$/i,
    getCompletions: () => [
      { text: 'plot(x, y, label="Data")', displayText: 'plot(x, y, ...)', kind: 'method', detail: 'plt.plot' },
      { text: 'scatter(x, y, color="blue")', displayText: 'scatter(x, y)', kind: 'method', detail: 'plt.scatter' },
      { text: 'bar(categories, values)', displayText: 'bar(x, height)', kind: 'method', detail: 'plt.bar' },
      { text: 'hist(data, bins=20)', displayText: 'hist(x, bins=...)', kind: 'method', detail: 'plt.hist' },
      { text: 'title("Graph Title")', displayText: 'title(label)', kind: 'method', detail: 'plt.title' },
      { text: 'xlabel("X Axis")', displayText: 'xlabel(xlabel)', kind: 'method', detail: 'plt.xlabel' },
      { text: 'ylabel("Y Axis")', displayText: 'ylabel(ylabel)', kind: 'method', detail: 'plt.ylabel' },
      { text: 'grid(True)', displayText: 'grid(b=True)', kind: 'method', detail: 'plt.grid' },
      { text: 'legend()', displayText: 'legend()', kind: 'method', detail: 'plt.legend' },
      { text: 'figure(figsize=(8, 5))', displayText: 'figure(figsize=...)', kind: 'method', detail: 'plt.figure' },
      { text: 'show()', displayText: 'show()', kind: 'method', detail: 'plt.show()' },
    ],
  },

  // Scikit-Learn Model & Evaluation
  {
    trigger: /\b(?:model|clf|reg|estimator)\.$/i,
    getCompletions: () => [
      { text: 'fit(X_train, y_train)', displayText: 'fit(X, y)', kind: 'method', detail: 'Fit model to training data' },
      { text: 'predict(X_test)', displayText: 'predict(X)', kind: 'method', detail: 'Predict class/values for X' },
      { text: 'score(X_test, y_test)', displayText: 'score(X, y)', kind: 'method', detail: 'Return mean accuracy / R^2' },
      { text: 'predict_proba(X_test)', displayText: 'predict_proba(X)', kind: 'method', detail: 'Probability estimates' },
    ],
  },

  // Common Control Flow & Python Structures
  {
    trigger: /^for\s*$/i,
    getCompletions: () => [
      { text: 'i in range(n):', displayText: 'for i in range(n):', kind: 'snippet', detail: 'Standard indexed loop' },
      { text: 'item in sequence:', displayText: 'for item in sequence:', kind: 'snippet', detail: 'Sequence iteration' },
      { text: 'idx, val in enumerate(items):', displayText: 'for idx, val in enumerate(items):', kind: 'snippet', detail: 'Enumerate loop' },
      { text: 'key, value in data.items():', displayText: 'for key, value in dict.items():', kind: 'snippet', detail: 'Dictionary key-value iteration' },
    ],
  },
  {
    trigger: /^def\s*$/i,
    getCompletions: () => [
      { text: 'main():\n    pass', displayText: 'def main():', kind: 'snippet', detail: 'Main function definition' },
      { text: 'process_data(df):\n    return df', displayText: 'def process_data(df):', kind: 'snippet', detail: 'Data processing function' },
      { text: 'calculate_stats(numbers):\n    total = sum(numbers)\n    return total / len(numbers)', displayText: 'def calculate_stats(numbers):', kind: 'snippet', detail: 'Statistical calculation function' },
    ],
  },
  {
    trigger: /^if\s*$/i,
    getCompletions: () => [
      { text: '__name__ == "__main__":\n    main()', displayText: 'if __name__ == "__main__":', kind: 'snippet', detail: 'Python script entry point' },
      { text: 'condition:\n    pass', displayText: 'if condition:', kind: 'snippet', detail: 'Basic conditional statement' },
    ],
  },
  {
    trigger: /^try\s*$/i,
    getCompletions: () => [
      { text: ':\n    # Code block\n    pass\nexcept Exception as e:\n    print(f"Error: {e}")', displayText: 'try: ... except Exception as e:', kind: 'snippet', detail: 'Error handling block' },
    ],
  },
  {
    trigger: /^with\s*$/i,
    getCompletions: () => [
      { text: 'open("file.txt", "r") as f:\n    content = f.read()', displayText: 'with open(...) as f:', kind: 'snippet', detail: 'File reader block' },
      { text: 'open("output.txt", "w") as f:\n    f.write("data")', displayText: 'with open(..., "w") as f:', kind: 'snippet', detail: 'File writer block' },
    ],
  },
];

// C / C++ Knowledge Base
const CPP_PATTERNS: Array<{
  trigger: RegExp;
  getCompletions: (context: ContextInfo) => CompletionSuggestion[];
}> = [
  {
    trigger: /^#inc?l?u?d?e?\s*$/i,
    getCompletions: () => [
      { text: '#include <iostream>', displayText: '#include <iostream>', kind: 'import', detail: 'Standard C++ I/O stream' },
      { text: '#include <vector>', displayText: '#include <vector>', kind: 'import', detail: 'Dynamic array container' },
      { text: '#include <string>', displayText: '#include <string>', kind: 'import', detail: 'Std::string class' },
      { text: '#include <algorithm>', displayText: '#include <algorithm>', kind: 'import', detail: 'STL algorithms (sort, find)' },
      { text: '#include <map>', displayText: '#include <map>', kind: 'import', detail: 'Ordered associative container' },
      { text: '#include <set>', displayText: '#include <set>', kind: 'import', detail: 'Unique elements container' },
      { text: '#include <queue>', displayText: '#include <queue>', kind: 'import', detail: 'FIFO Queue container' },
      { text: '#include <bits/stdc++.h>', displayText: '#include <bits/stdc++.h>', kind: 'import', detail: 'Competitive programming header' },
      { text: '#include <stdio.h>', displayText: '#include <stdio.h>', kind: 'import', detail: 'Standard C I/O' },
      { text: '#include <stdlib.h>', displayText: '#include <stdlib.h>', kind: 'import', detail: 'C standard library (malloc, free)' },
      { text: '#include <math.h>', displayText: '#include <math.h>', kind: 'import', detail: 'C math functions' },
    ],
  },
  {
    trigger: /^int\s*$/i,
    getCompletions: () => [
      { text: 'int main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}', displayText: 'int main() { ... }', kind: 'snippet', detail: 'Main entry function' },
      { text: 'int main(int argc, char* argv[]) {\n    return 0;\n}', displayText: 'int main(argc, argv)', kind: 'snippet', detail: 'Command-line main function' },
    ],
  },
  {
    trigger: /^for\s*$/i,
    getCompletions: () => [
      { text: 'for (int i = 0; i < n; i++) {\n    // Code\n}', displayText: 'for (int i = 0; i < n; i++)', kind: 'snippet', detail: 'Indexed loop' },
      { text: 'for (const auto& item : container) {\n    // Code\n}', displayText: 'for (const auto& item : container)', kind: 'snippet', detail: 'Range-based for loop' },
    ],
  },
  {
    trigger: /^std::$/i,
    getCompletions: () => [
      { text: 'cout << ', displayText: 'std::cout <<', kind: 'method', detail: 'Output stream' },
      { text: 'cin >> ', displayText: 'std::cin >>', kind: 'method', detail: 'Input stream' },
      { text: 'vector<int> ', displayText: 'std::vector<T>', kind: 'keyword', detail: 'Dynamic array' },
      { text: 'string ', displayText: 'std::string', kind: 'keyword', detail: 'String' },
      { text: 'sort(', displayText: 'std::sort(first, last)', kind: 'function', detail: 'Sort elements' },
      { text: 'endl', displayText: 'std::endl', kind: 'keyword', detail: 'Newline and flush' },
      { text: 'max(', displayText: 'std::max(a, b)', kind: 'function', detail: 'Maximum value' },
      { text: 'min(', displayText: 'std::min(a, b)', kind: 'function', detail: 'Minimum value' },
    ],
  },
  {
    trigger: /\b(?:v|vec|arr|container)\.$/i,
    getCompletions: () => [
      { text: 'push_back(val)', displayText: 'push_back(value)', kind: 'method', detail: 'Add element to end' },
      { text: 'size()', displayText: 'size()', kind: 'method', detail: 'Return element count' },
      { text: 'empty()', displayText: 'empty()', kind: 'method', detail: 'Check if empty' },
      { text: 'clear()', displayText: 'clear()', kind: 'method', detail: 'Remove all elements' },
      { text: 'begin()', displayText: 'begin()', kind: 'method', detail: 'Iterator to beginning' },
      { text: 'end()', displayText: 'end()', kind: 'method', detail: 'Iterator to end' },
    ],
  },
];

export interface ContextInfo {
  language: 'python' | 'cpp' | 'c';
  fullCode: string;
  currentLineText: string;
  linePrefix: string;
  cursorOffset: number;
  importedModules: string[];
  declaredVariables: string[];
}

export function analyzeContext(
  fullCode: string,
  cursorOffset: number,
  language: 'python' | 'cpp' | 'c'
): ContextInfo {
  const linePrefix = fullCode.slice(0, cursorOffset).split('\n').pop() || '';
  const currentLineText = fullCode.slice(0, cursorOffset).split('\n').pop() || '';

  const importedModules: string[] = [];
  const declaredVariables: string[] = [];

  const lines = fullCode.split('\n');

  if (language === 'python') {
    for (const l of lines) {
      const trimmed = l.trim();
      if (trimmed.startsWith('import ')) {
        const mod = trimmed.replace('import ', '').split(' as ')[0].trim();
        importedModules.push(mod);
      } else if (trimmed.startsWith('from ')) {
        const parts = trimmed.split(' import ');
        if (parts[0]) importedModules.push(parts[0].replace('from ', '').trim());
      }

      // Variable assignment detection: var_name = ...
      const varMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*/);
      if (varMatch && !['if', 'elif', 'while', 'for', 'def', 'class', 'import'].includes(varMatch[1])) {
        if (!declaredVariables.includes(varMatch[1])) {
          declaredVariables.push(varMatch[1]);
        }
      }
    }
  } else {
    for (const l of lines) {
      const trimmed = l.trim();
      if (trimmed.startsWith('#include')) {
        importedModules.push(trimmed);
      }
      const cppVarMatch = trimmed.match(/(?:int|double|float|std::string|char|auto|std::vector<[^>]+>)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (cppVarMatch && cppVarMatch[1]) {
        declaredVariables.push(cppVarMatch[1]);
      }
    }
  }

  return {
    language,
    fullCode,
    currentLineText,
    linePrefix,
    cursorOffset,
    importedModules,
    declaredVariables,
  };
}

/**
 * Predicts the next ghost text completion string based on context & local knowledge base.
 * Returns null if no high-confidence suggestion is available.
 */
export function predictGhostText(context: ContextInfo): { textToInsert: string; fullSuggestion: string; kind: string } | null {
  const linePrefix = context.linePrefix;
  const trimmedPrefix = linePrefix.trimStart();

  if (!trimmedPrefix) return null;

  const weights = getAcceptedWeights();

  // 1. Check knowledge base patterns for language
  const patterns = context.language === 'python' ? PYTHON_PATTERNS : CPP_PATTERNS;

  let candidates: CompletionSuggestion[] = [];

  for (const pat of patterns) {
    if (pat.trigger.test(trimmedPrefix)) {
      candidates.push(...pat.getCompletions(context));
    }
  }

  // 2. Variable-based dynamic completions (e.g. typing `df` -> suggest `.head()`)
  if (context.language === 'python') {
    for (const v of context.declaredVariables) {
      if (trimmedPrefix.endsWith(`${v}.`)) {
        candidates.push(
          { text: 'head()', displayText: `${v}.head()`, kind: 'method', detail: 'DataFrame preview' },
          { text: 'describe()', displayText: `${v}.describe()`, kind: 'method', detail: 'DataFrame summary' },
          { text: 'info()', displayText: `${v}.info()`, kind: 'method', detail: 'DataFrame metadata' },
          { text: 'isnull().sum()', displayText: `${v}.isnull().sum()`, kind: 'method', detail: 'Count nulls' }
        );
      }
    }
  }

  // 3. Prefix matching against declared variables & keywords
  const lastWordMatch = trimmedPrefix.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);
  if (lastWordMatch && lastWordMatch[1].length >= 2) {
    const word = lastWordMatch[1];
    // Match against variables
    for (const v of context.declaredVariables) {
      if (v.startsWith(word) && v !== word) {
        candidates.push({
          text: v.slice(word.length),
          displayText: v,
          kind: 'variable',
          detail: 'Declared variable',
          boost: 5,
        });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Rank candidates by adaptive local weight & boost score
  candidates.sort((a, b) => {
    const weightA = weights[a.text.trim()] || 0;
    const weightB = weights[b.text.trim()] || 0;
    if (weightA !== weightB) return weightB - weightA;
    return (b.boost || 0) - (a.boost || 0);
  });

  const best = candidates[0];
  if (!best) return null;

  let textToInsert = best.text;

  // Adjust textToInsert if trimmedPrefix overlaps with suggestion
  if (best.text.startsWith(trimmedPrefix)) {
    textToInsert = best.text.slice(trimmedPrefix.length);
  }

  if (!textToInsert) return null;

  return {
    textToInsert,
    fullSuggestion: best.displayText || best.text,
    kind: best.kind,
  };
}
