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
  // 1. Imports & Aliases
  {
    trigger: /^import\s+pandas\s*$/i,
    getCompletions: () => [
      { text: ' as pd', displayText: 'import pandas as pd', kind: 'import', detail: 'Pandas alias', boost: 20 },
    ],
  },
  {
    trigger: /^import\s+numpy\s*$/i,
    getCompletions: () => [
      { text: ' as np', displayText: 'import numpy as np', kind: 'import', detail: 'NumPy alias', boost: 20 },
    ],
  },
  {
    trigger: /^import\s+matplotlib\s*$/i,
    getCompletions: () => [
      { text: '.pyplot as plt', displayText: 'import matplotlib.pyplot as plt', kind: 'import', detail: 'Pyplot alias', boost: 20 },
    ],
  },
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
    trigger: /^from\s+sklearn\.\s*$/i,
    getCompletions: () => [
      { text: 'model_selection import train_test_split', displayText: 'model_selection import train_test_split', kind: 'import', detail: 'Train/test split', boost: 20 },
      { text: 'preprocessing import StandardScaler', displayText: 'preprocessing import StandardScaler', kind: 'import', detail: 'Feature scaling', boost: 20 },
      { text: 'linear_model import LogisticRegression, LinearRegression', displayText: 'linear_model import LinearRegression...', kind: 'import', detail: 'Linear models', boost: 18 },
      { text: 'ensemble import RandomForestClassifier', displayText: 'ensemble import RandomForestClassifier', kind: 'import', detail: 'Random forest', boost: 18 },
      { text: 'metrics import accuracy_score, classification_report', displayText: 'metrics import accuracy_score...', kind: 'import', detail: 'Evaluation metrics', boost: 18 },
    ],
  },
  {
    trigger: /^from\s*$/i,
    getCompletions: () => [
      { text: 'from sklearn.model_selection import train_test_split', displayText: 'from sklearn.model_selection import train_test_split', kind: 'import', detail: 'Split arrays into train/test subsets', boost: 10 },
      { text: 'from sklearn.preprocessing import StandardScaler', displayText: 'from sklearn.preprocessing import StandardScaler', kind: 'import', detail: 'Feature scaling', boost: 10 },
      { text: 'from sklearn.linear_model import LinearRegression', displayText: 'from sklearn.linear_model import LinearRegression', kind: 'import', detail: 'Ordinary least squares Linear Regression', boost: 9 },
      { text: 'from sklearn.ensemble import RandomForestClassifier', displayText: 'from sklearn.ensemble import RandomForestClassifier', kind: 'import', detail: 'Random Forest Classifier', boost: 9 },
    ],
  },

  // 2. Pandas Methods (`pd.` or `df.`)
  {
    trigger: /\bpd\.$/i,
    getCompletions: () => [
      { text: 'DataFrame(data)', displayText: 'DataFrame(data)', kind: 'method', detail: 'pd.DataFrame', documentation: 'Two-dimensional, size-mutable, potentially heterogeneous tabular data.' },
      { text: 'read_csv("dataset.csv")', displayText: 'read_csv(filepath)', kind: 'method', detail: 'pd.read_csv', documentation: 'Read a comma-separated values (csv) file into DataFrame.' },
      { text: 'Series(data)', displayText: 'Series(data)', kind: 'method', detail: 'pd.Series' },
      { text: 'concat([df1, df2], axis=0)', displayText: 'concat([df1, df2])', kind: 'method', detail: 'pd.concat' },
      { text: 'merge(df1, df2, on="key")', displayText: 'merge(df1, df2, on=...)', kind: 'method', detail: 'pd.merge' },
    ],
  },
  {
    trigger: /\b(?:df|data|dataset|frame)\.(?:he?|hea?d?)$/i,
    getCompletions: () => [
      { text: 'head(3)', displayText: 'df.head(3)', kind: 'method', detail: 'First 3 rows', boost: 25 },
      { text: 'head()', displayText: 'df.head()', kind: 'method', detail: 'First 5 rows', boost: 20 },
    ],
  },
  {
    trigger: /\b(?:df|data|dataset|frame)\.(?:is?|isn?u?l?l?)$/i,
    getCompletions: () => [
      { text: 'isnull().sum()', displayText: 'df.isnull().sum()', kind: 'method', detail: 'Count null values per column', boost: 25 },
      { text: 'isnull()', displayText: 'df.isnull()', kind: 'method', detail: 'Missing value boolean mask', boost: 20 },
    ],
  },
  {
    trigger: /\b(?:df|data|dataset|frame)\.(?:id?|idx?m?a?x?)$/i,
    getCompletions: () => [
      { text: 'idxmax()', displayText: 'df.idxmax()', kind: 'method', detail: 'Index of maximum value', boost: 25 },
    ],
  },
  {
    trigger: /\b(?:df|data|dataset|frame)\["[^"]+"\]\.(?:fi?|fil?l?n?a?)$/i,
    getCompletions: (ctx) => {
      const match = ctx.linePrefix.match(/\b(?:df|data|dataset|frame)\["([^"]+)"\]/);
      const col = match ? match[1] : 'col';
      return [
        { text: `fillna(df["${col}"].mean())`, displayText: `fillna(df["${col}"].mean())`, kind: 'method', detail: 'Impute missing values with column mean', boost: 30 },
        { text: 'fillna(0)', displayText: 'fillna(0)', kind: 'method', detail: 'Fill missing with 0', boost: 20 },
      ];
    },
  },
  {
    trigger: /\b(?:df|data|dataset|frame)\["[^"]+"\]\.(?:st?|str?\.)/i,
    getCompletions: () => [
      { text: 'strip().str.title()', displayText: 'str.strip().str.title()', kind: 'method', detail: 'Clean whitespace & capitalize title case', boost: 30 },
      { text: 'lower()', displayText: 'str.lower()', kind: 'method', detail: 'Convert to lowercase', boost: 20 },
      { text: 'upper()', displayText: 'str.upper()', kind: 'method', detail: 'Convert to uppercase', boost: 20 },
    ],
  },
  {
    trigger: /\b(?:df|data|dataset|frame)\.$/i,
    getCompletions: () => [
      { text: 'head(3)', displayText: 'head(3)', kind: 'method', detail: 'df.head(3)', documentation: 'Return first n rows.' },
      { text: 'isnull().sum()', displayText: 'isnull().sum()', kind: 'method', detail: 'df.isnull().sum()', documentation: 'Count missing values per column.' },
      { text: 'describe()', displayText: 'describe()', kind: 'method', detail: 'df.describe()', documentation: 'Generate descriptive statistics.' },
      { text: 'info()', displayText: 'info()', kind: 'method', detail: 'df.info()', documentation: 'Print concise summary of DataFrame.' },
      { text: 'loc[0]', displayText: 'loc[row_indexer, col_indexer]', kind: 'method', detail: 'df.loc[]' },
      { text: 'iloc[0]', displayText: 'iloc[row_index, col_index]', kind: 'method', detail: 'df.iloc[]' },
      { text: 'dropna()', displayText: 'dropna()', kind: 'method', detail: 'df.dropna()' },
      { text: 'groupby("column").mean()', displayText: 'groupby("col").mean()', kind: 'method', detail: 'df.groupby()' },
      { text: 'to_csv("output.csv", index=False)', displayText: 'to_csv(filepath)', kind: 'method', detail: 'df.to_csv()' },
    ],
  },

  // 3. Matplotlib Methods (`plt.`)
  {
    trigger: /\bplt\.(?:ba?|bar?)$/i,
    getCompletions: (ctx) => {
      const hasDf = ctx.declaredVariables.includes('df');
      return [
        {
          text: hasDf ? 'bar(df["Product"], df["Sales"])' : 'bar(x, y)',
          displayText: 'bar(df["Product"], df["Sales"])',
          kind: 'method',
          detail: 'Vertical bar chart',
          boost: 30,
        },
      ];
    },
  },
  {
    trigger: /\bplt\.(?:xl?|xla?b?e?l?)$/i,
    getCompletions: () => [
      { text: 'xlabel("Product")', displayText: 'xlabel("Product")', kind: 'method', detail: 'Set X-axis label', boost: 25 },
      { text: 'xlabel("X Axis")', displayText: 'xlabel("X Axis")', kind: 'method', detail: 'Set X-axis label', boost: 20 },
    ],
  },
  {
    trigger: /\bplt\.(?:yl?|yla?b?e?l?)$/i,
    getCompletions: () => [
      { text: 'ylabel("Sales")', displayText: 'ylabel("Sales")', kind: 'method', detail: 'Set Y-axis label', boost: 25 },
      { text: 'ylabel("Y Axis")', displayText: 'ylabel("Y Axis")', kind: 'method', detail: 'Set Y-axis label', boost: 20 },
    ],
  },
  {
    trigger: /\bplt\.(?:ti?|tit?l?e?)$/i,
    getCompletions: () => [
      { text: 'title("Product vs Sales")', displayText: 'title("Product vs Sales")', kind: 'method', detail: 'Set chart title', boost: 25 },
      { text: 'title("Title")', displayText: 'title("Title")', kind: 'method', detail: 'Set chart title', boost: 20 },
    ],
  },
  {
    trigger: /\bplt\.(?:sh?|sho?w?)$/i,
    getCompletions: () => [
      { text: 'show()', displayText: 'show()', kind: 'method', detail: 'Display figure', boost: 30 },
    ],
  },
  {
    trigger: /\bplt\.$/i,
    getCompletions: () => [
      { text: 'plot(x, y)', displayText: 'plot(x, y)', kind: 'method', detail: 'plt.plot' },
      { text: 'bar(x, y)', displayText: 'bar(x, y)', kind: 'method', detail: 'plt.bar' },
      { text: 'scatter(x, y)', displayText: 'scatter(x, y)', kind: 'method', detail: 'plt.scatter' },
      { text: 'title("Title")', displayText: 'title(label)', kind: 'method', detail: 'plt.title' },
      { text: 'xlabel("X Axis")', displayText: 'xlabel(label)', kind: 'method', detail: 'plt.xlabel' },
      { text: 'ylabel("Y Axis")', displayText: 'ylabel(label)', kind: 'method', detail: 'plt.ylabel' },
      { text: 'grid(True)', displayText: 'grid(True)', kind: 'method', detail: 'plt.grid' },
      { text: 'legend()', displayText: 'legend()', kind: 'method', detail: 'plt.legend' },
      { text: 'show()', displayText: 'show()', kind: 'method', detail: 'plt.show()' },
    ],
  },

  // 4. Scikit-Learn Model Preprocessing & Training
  {
    trigger: /\btrain_test_split\($/i,
    getCompletions: () => [
      {
        text: 'X, y, test_size=0.25, random_state=42)',
        displayText: 'X, y, test_size=0.25, random_state=42)',
        kind: 'snippet',
        detail: 'Standard train/test split parameters',
        boost: 30,
      },
    ],
  },
  {
    trigger: /\bscaler\.(?:fi?|fit?_?t?r?a?n?s?f?o?r?m?)$/i,
    getCompletions: () => [
      { text: 'fit_transform(X_train)', displayText: 'fit_transform(X_train)', kind: 'method', detail: 'Fit to X_train and transform', boost: 30 },
      { text: 'fit_transform(X)', displayText: 'fit_transform(X)', kind: 'method', detail: 'Fit and transform X', boost: 25 },
    ],
  },
  {
    trigger: /\bscaler\.(?:tr?|tra?n?s?f?o?r?m?)$/i,
    getCompletions: () => [
      { text: 'transform(X_test)', displayText: 'transform(X_test)', kind: 'method', detail: 'Transform test set using fitted mean & std', boost: 30 },
    ],
  },
  {
    trigger: /^scaler\s*=\s*$/i,
    getCompletions: () => [
      { text: 'StandardScaler()', displayText: 'StandardScaler()', kind: 'snippet', detail: 'Instantiate StandardScaler', boost: 30 },
    ],
  },
  {
    trigger: /^model\s*=\s*$/i,
    getCompletions: () => [
      { text: 'LogisticRegression()', displayText: 'LogisticRegression()', kind: 'snippet', detail: 'Instantiate LogisticRegression classifier', boost: 25 },
      { text: 'LinearRegression()', displayText: 'LinearRegression()', kind: 'snippet', detail: 'Instantiate LinearRegression model', boost: 25 },
      { text: 'RandomForestClassifier()', displayText: 'RandomForestClassifier()', kind: 'snippet', detail: 'Instantiate RandomForestClassifier', boost: 20 },
    ],
  },
  {
    trigger: /\bmodel\.(?:fi?|fit?)$/i,
    getCompletions: () => [
      { text: 'fit(X_train_scaled, y_train)', displayText: 'fit(X_train_scaled, y_train)', kind: 'method', detail: 'Fit model on scaled training data', boost: 30 },
      { text: 'fit(X_train, y_train)', displayText: 'fit(X_train, y_train)', kind: 'method', detail: 'Fit model on training data', boost: 25 },
    ],
  },
  {
    trigger: /\bmodel\.(?:pr?|pre?d?i?c?t?)$/i,
    getCompletions: () => [
      { text: 'predict(X_test_scaled)', displayText: 'predict(X_test_scaled)', kind: 'method', detail: 'Predict class/target on scaled test set', boost: 30 },
      { text: 'predict(X_test)', displayText: 'predict(X_test)', kind: 'method', detail: 'Predict class/target on test set', boost: 25 },
    ],
  },

  // 5. Signature Help & Function Continuation (`print(`)
  {
    trigger: /^print\($/i,
    getCompletions: (ctx) => {
      const candidates: CompletionSuggestion[] = [];
      if (ctx.fullCode.includes('average_sales')) {
        candidates.push({ text: '"Average Sales:", average_sales)', displayText: '"Average Sales:", average_sales)', kind: 'snippet', boost: 25 });
      }
      if (ctx.fullCode.includes('X_train')) {
        candidates.push({ text: '"\nX_train shape:", X_train.shape)', displayText: '"X_train shape:", X_train.shape)', kind: 'snippet', boost: 25 });
      }
      if (ctx.declaredVariables.includes('df')) {
        candidates.push({ text: 'df.head(3))', displayText: 'df.head(3))', kind: 'snippet', boost: 20 });
        candidates.push({ text: 'df)', displayText: 'df)', kind: 'snippet', boost: 18 });
      }
      candidates.push({ text: 'f"Result: {val}")', displayText: 'f"Result: {val}")', kind: 'snippet', boost: 10 });
      return candidates;
    },
  },

  // 6. Multiline Next-Line Prediction (High Confidence Continuation)
  {
    trigger: /^scaler\s*=\s*StandardScaler\(\)\s*$/i,
    getCompletions: () => [
      {
        text: '\n\nX_train_scaled = scaler.fit_transform(X_train)\nX_test_scaled = scaler.transform(X_test)',
        displayText: '→ Next: X_train_scaled = scaler.fit_transform(X_train) ...',
        kind: 'pattern',
        detail: 'StandardScaler pipeline continuation',
        boost: 35,
      },
    ],
  },
  {
    trigger: /^model\s*=\s*(?:LogisticRegression|LinearRegression|RandomForestClassifier)\(\)\s*$/i,
    getCompletions: () => [
      {
        text: '\nmodel.fit(X_train_scaled, y_train)\ny_pred = model.predict(X_test_scaled)',
        displayText: '→ Next: model.fit(...) & y_pred = model.predict(...)',
        kind: 'pattern',
        detail: 'Model training and prediction pipeline',
        boost: 35,
      },
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
      { text: '#include <stdio.h>', displayText: '#include <stdio.h>', kind: 'import', detail: 'Standard C I/O' },
    ],
  },
  {
    trigger: /^int\s*$/i,
    getCompletions: () => [
      { text: 'int main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}', displayText: 'int main() { ... }', kind: 'snippet', detail: 'Main entry function' },
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
      { text: 'sort(v.begin(), v.end());', displayText: 'std::sort(first, last)', kind: 'function', detail: 'Sort elements' },
      { text: 'endl', displayText: 'std::endl', kind: 'keyword', detail: 'Newline and flush' },
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
    if (pat.trigger.test(trimmedPrefix) || pat.trigger.test(linePrefix)) {
      candidates.push(...pat.getCompletions(context));
    }
  }

  // 2. Variable-based dynamic completions (e.g. typing `df` -> suggest `.head(3)`)
  if (context.language === 'python') {
    for (const v of context.declaredVariables) {
      if (trimmedPrefix === `${v}.` || trimmedPrefix.endsWith(` ${v}.`)) {
        candidates.push(
          { text: 'head(3)', displayText: `${v}.head(3)`, kind: 'method', detail: 'DataFrame preview', boost: 15 },
          { text: 'describe()', displayText: `${v}.describe()`, kind: 'method', detail: 'DataFrame summary', boost: 12 },
          { text: 'info()', displayText: `${v}.info()`, kind: 'method', detail: 'DataFrame metadata', boost: 12 },
          { text: 'isnull().sum()', displayText: `${v}.isnull().sum()`, kind: 'method', detail: 'Count nulls', boost: 15 }
        );
      }
    }
  }

  // 3. Prefix matching against declared variables & keywords
  const lastWordMatch = trimmedPrefix.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);
  if (lastWordMatch && lastWordMatch[1].length >= 2) {
    const word = lastWordMatch[1];
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
