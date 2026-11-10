/**
 * ToolTrack IntelliSense Autocomplete Source
 * Provides context-aware completion items with fuzzy matching for CodeMirror's autocompletion popup dropdown.
 */

import { CompletionContext, CompletionResult, autocompletion } from '@codemirror/autocomplete';
import { Extension } from '@codemirror/state';
import { analyzeContext, fuzzyMatchScore } from './autocompleteEngine';

export function createIntelliSenseCompletionSource(language: 'python' | 'cpp' | 'c') {
  return async (context: CompletionContext): Promise<CompletionResult | null> => {
    const word = context.matchBefore(/[\w_.]*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const fullCode = context.state.doc.toString();
    const info = analyzeContext(fullCode, context.pos, language);

    const typedText = word.text.includes('.') ? word.text.split('.').pop() || '' : word.text;

    const candidateOptions: Array<{
      label: string;
      type?: string;
      detail?: string;
      apply?: string;
      boost?: number;
      info?: string;
    }> = [];

    const hasDot = word.text.includes('.');

    if (language === 'python') {
      // Pandas module completions (pd.)
      if (word.text.startsWith('pd.') || info.linePrefix.endsWith('pd.')) {
        candidateOptions.push(
          { label: 'DataFrame', type: 'class', detail: 'pd.DataFrame(data, columns=...)', apply: 'DataFrame(data)', info: 'Two-dimensional size-mutable tabular structure with labeled axes.' },
          { label: 'Series', type: 'class', detail: 'pd.Series(data, index=...)', apply: 'Series()', info: 'One-dimensional ndarray with axis labels.' },
          { label: 'read_csv', type: 'function', detail: 'pd.read_csv(filepath_or_buffer)', apply: 'read_csv("sales_sample.csv")', info: 'Read a comma-separated values (csv) file into DataFrame.' },
          { label: 'read_excel', type: 'function', detail: 'pd.read_excel(io)', apply: 'read_excel("data.xlsx")', info: 'Read an Excel file into a pandas DataFrame.' },
          { label: 'read_json', type: 'function', detail: 'pd.read_json(path_or_buf)', apply: 'read_json("data.json")', info: 'Convert a JSON string or file to pandas object.' },
          { label: 'concat', type: 'function', detail: 'pd.concat(objs, axis=0)', apply: 'concat([df1, df2], ignore_index=True)', info: 'Concatenate pandas objects along a particular axis.' },
          { label: 'merge', type: 'function', detail: 'pd.merge(left, right, on=...)', apply: 'merge(df1, df2, on="id")', info: 'Merge DataFrame or named Series objects with a database-style join.' },
          { label: 'date_range', type: 'function', detail: 'pd.date_range(start, periods=...)', apply: 'date_range("2025-01-01", periods=10)', info: 'Return a fixed frequency DatetimeIndex.' },
          { label: 'to_numeric', type: 'function', detail: 'pd.to_numeric(arg)', apply: 'to_numeric(df["col"], errors="coerce")', info: 'Convert argument to a numeric type.' }
        );
      }

      // DataFrame / Series instance method completions (df., data., etc.)
      if (/\b(?:df|data|dataset|frame|series|table)\.[a-zA-Z0-9_]*$/.test(word.text) || /\]\.[a-zA-Z0-9_]*$/.test(info.linePrefix)) {
        candidateOptions.push(
          { label: 'head', type: 'method', detail: 'df.head(n=5)', apply: 'head(3)', info: 'Return the first n rows.' },
          { label: 'tail', type: 'method', detail: 'df.tail(n=5)', apply: 'tail(3)', info: 'Return the last n rows.' },
          { label: 'isnull', type: 'method', detail: 'df.isnull()', apply: 'isnull().sum()', info: 'Detect missing values across columns.' },
          { label: 'isna', type: 'method', detail: 'df.isna()', apply: 'isna().sum()', info: 'Detect missing values.' },
          { label: 'fillna', type: 'method', detail: 'df.fillna(value)', apply: 'fillna(0)', info: 'Fill NA/NaN values using the specified value or method.' },
          { label: 'dropna', type: 'method', detail: 'df.dropna()', apply: 'dropna()', info: 'Remove missing values.' },
          { label: 'mean', type: 'method', detail: 'df.mean(numeric_only=True)', apply: 'mean()', info: 'Return the mean of the values over the requested axis.' },
          { label: 'median', type: 'method', detail: 'df.median()', apply: 'median()', info: 'Return the median of the values.' },
          { label: 'sum', type: 'method', detail: 'df.sum()', apply: 'sum()', info: 'Return the sum of the values.' },
          { label: 'idxmax', type: 'method', detail: 'df.idxmax()', apply: 'idxmax()', info: 'Return index of first occurrence of maximum over requested axis.' },
          { label: 'idxmin', type: 'method', detail: 'df.idxmin()', apply: 'idxmin()', info: 'Return index of first occurrence of minimum over requested axis.' },
          { label: 'describe', type: 'method', detail: 'df.describe()', apply: 'describe()', info: 'Generate descriptive statistics.' },
          { label: 'info', type: 'method', detail: 'df.info()', apply: 'info()', info: 'Print a concise summary of a DataFrame.' },
          { label: 'groupby', type: 'method', detail: 'df.groupby(by)', apply: 'groupby("City").mean(numeric_only=True)', info: 'Group DataFrame using a mapper or by a Series of columns.' },
          { label: 'sort_values', type: 'method', detail: 'df.sort_values(by, ascending=True)', apply: 'sort_values(by="Sales", ascending=False)', info: 'Sort by the values along either axis.' },
          { label: 'value_counts', type: 'method', detail: 's.value_counts()', apply: 'value_counts()', info: 'Return a Series containing counts of unique values.' },
          { label: 'to_csv', type: 'method', detail: 'df.to_csv(path, index=False)', apply: 'to_csv("output.csv", index=False)', info: 'Write object to a comma-separated values (csv) file.' },
          { label: 'loc', type: 'property', detail: 'df.loc[row_indexer, col_indexer]', apply: 'loc[highest_index, "Product"]', info: 'Access a group of rows and columns by label(s).' },
          { label: 'iloc', type: 'property', detail: 'df.iloc[row_idx, col_idx]', apply: 'iloc[0:3]', info: 'Purely integer-location based indexing for selection by position.' }
        );
      }

      // NumPy completions (np.)
      if (word.text.startsWith('np.') || info.linePrefix.endsWith('np.')) {
        candidateOptions.push(
          { label: 'array', type: 'function', detail: 'np.array(object)', apply: 'array([1, 2, 3, 4])', info: 'Create an ndarray.' },
          { label: 'arange', type: 'function', detail: 'np.arange([start,] stop[, step])', apply: 'arange(0, 10, 1)', info: 'Return evenly spaced values within a given interval.' },
          { label: 'linspace', type: 'function', detail: 'np.linspace(start, stop, num=50)', apply: 'linspace(0, 10, 100)', info: 'Return evenly spaced numbers over a specified interval.' },
          { label: 'zeros', type: 'function', detail: 'np.zeros(shape)', apply: 'zeros((3, 3))', info: 'Return a new array of given shape and type, filled with zeros.' },
          { label: 'ones', type: 'function', detail: 'np.ones(shape)', apply: 'ones((3, 3))', info: 'Return a new array of given shape and type, filled with ones.' },
          { label: 'mean', type: 'function', detail: 'np.mean(a)', apply: 'mean(arr)', info: 'Compute the arithmetic mean along the specified axis.' },
          { label: 'std', type: 'function', detail: 'np.std(a)', apply: 'std(arr)', info: 'Compute the standard deviation along the specified axis.' },
          { label: 'median', type: 'function', detail: 'np.median(a)', apply: 'median(arr)', info: 'Compute the median along the specified axis.' },
          { label: 'dot', type: 'function', detail: 'np.dot(a, b)', apply: 'dot(a, b)', info: 'Dot product of two arrays.' },
          { label: 'reshape', type: 'function', detail: 'np.reshape(a, newshape)', apply: 'reshape(-1, 1)', info: 'Gives a new shape to an array without changing its data.' },
          { label: 'random.seed', type: 'function', detail: 'np.random.seed(42)', apply: 'random.seed(42)', info: 'Seed the random number generator.' },
          { label: 'random.normal', type: 'function', detail: 'np.random.normal(loc, scale, size)', apply: 'random.normal(0, 1, size=50)', info: 'Draw random samples from a normal (Gaussian) distribution.' }
        );
      }

      // Matplotlib completions (plt.)
      if (word.text.startsWith('plt.') || info.linePrefix.endsWith('plt.')) {
        candidateOptions.push(
          { label: 'figure', type: 'function', detail: 'plt.figure(figsize=(8, 5))', apply: 'figure(figsize=(8, 4.5))', info: 'Create a new figure, or activate an existing figure.' },
          { label: 'subplots', type: 'function', detail: 'plt.subplots(nrows, ncols)', apply: 'subplots(1, 2, figsize=(10, 4))', info: 'Create a figure and a set of subplots.' },
          { label: 'bar', type: 'function', detail: 'plt.bar(x, height)', apply: 'bar(df["Product"], df["Sales"])', info: 'Make a bar plot.' },
          { label: 'plot', type: 'function', detail: 'plt.plot(x, y)', apply: 'plot(x, y, marker="o")', info: 'Plot y versus x as lines and/or markers.' },
          { label: 'scatter', type: 'function', detail: 'plt.scatter(x, y)', apply: 'scatter(x, y)', info: 'A scatter plot of y vs. x.' },
          { label: 'hist', type: 'function', detail: 'plt.hist(x, bins=20)', apply: 'hist(x, bins=20)', info: 'Compute and plot a histogram.' },
          { label: 'xlabel', type: 'function', detail: 'plt.xlabel(xlabel)', apply: 'xlabel("Product")', info: 'Set the label for the x-axis.' },
          { label: 'ylabel', type: 'function', detail: 'plt.ylabel(ylabel)', apply: 'ylabel("Sales")', info: 'Set the label for the y-axis.' },
          { label: 'title', type: 'function', detail: 'plt.title(label)', apply: 'title("Product vs Sales")', info: 'Set a title for the Axes.' },
          { label: 'legend', type: 'function', detail: 'plt.legend()', apply: 'legend()', info: 'Place a legend on the Axes.' },
          { label: 'grid', type: 'function', detail: 'plt.grid(True)', apply: 'grid(True, alpha=0.3)', info: 'Configure the grid lines.' },
          { label: 'tight_layout', type: 'function', detail: 'plt.tight_layout()', apply: 'tight_layout()', info: 'Adjust the padding between and around subplots.' },
          { label: 'savefig', type: 'function', detail: 'plt.savefig(fname)', apply: 'savefig("chart.png", dpi=150)', info: 'Save the current figure.' },
          { label: 'show', type: 'function', detail: 'plt.show()', apply: 'show()', info: 'Render all open figures to the ToolTrack Plots viewer.' }
        );
      }

      // Scikit-Learn instance or top-level completions
      if (info.linePrefix.includes('sklearn') || info.linePrefix.includes('model.') || info.linePrefix.includes('scaler.')) {
        candidateOptions.push(
          { label: 'StandardScaler', type: 'class', detail: 'StandardScaler()', apply: 'StandardScaler()', info: 'Standardize features by removing the mean and scaling to unit variance.' },
          { label: 'train_test_split', type: 'function', detail: 'train_test_split(X, y, test_size=0.25)', apply: 'train_test_split(X, y, test_size=0.25, random_state=42)', info: 'Split arrays or matrices into random train and test subsets.' },
          { label: 'LinearRegression', type: 'class', detail: 'LinearRegression()', apply: 'LinearRegression()', info: 'Ordinary least squares Linear Regression.' },
          { label: 'LogisticRegression', type: 'class', detail: 'LogisticRegression()', apply: 'LogisticRegression()', info: 'Logistic Regression classifier.' },
          { label: 'RandomForestClassifier', type: 'class', detail: 'RandomForestClassifier(n_estimators=100)', apply: 'RandomForestClassifier(random_state=42)', info: 'A random forest classifier.' },
          { label: 'fit_transform', type: 'method', detail: 'scaler.fit_transform(X)', apply: 'fit_transform(X)', info: 'Fit to data, then transform it.' },
          { label: 'transform', type: 'method', detail: 'scaler.transform(X)', apply: 'transform(X_test)', info: 'Perform standardization by centering and scaling.' },
          { label: 'fit', type: 'method', detail: 'model.fit(X_train, y_train)', apply: 'fit(X_train, y_train)', info: 'Fit the model according to the given training data.' },
          { label: 'predict', type: 'method', detail: 'model.predict(X_test)', apply: 'predict(X_test)', info: 'Predict using the trained estimator.' },
          { label: 'score', type: 'method', detail: 'model.score(X_test, y_test)', apply: 'score(X_test, y_test)', info: 'Return the coefficient of determination or accuracy.' }
        );
      }

      // Top-level Python builtins, keywords, and scientific imports when not after a dot
      if (!hasDot) {
        candidateOptions.push(
          { label: 'print', type: 'function', detail: 'print(*values)', apply: 'print()', boost: 8 },
          { label: 'input', type: 'function', detail: 'input(prompt="")', apply: 'input("")', boost: 8 },
          { label: 'range', type: 'function', detail: 'range(start, stop[, step])', apply: 'range()', boost: 6 },
          { label: 'len', type: 'function', detail: 'len(obj)', apply: 'len()', boost: 6 },
          { label: 'enumerate', type: 'function', detail: 'enumerate(iterable)', apply: 'enumerate()', boost: 6 },
          { label: 'sorted', type: 'function', detail: 'sorted(iterable)', apply: 'sorted()', boost: 6 },
          { label: 'sum', type: 'function', detail: 'sum(iterable)', apply: 'sum()', boost: 6 },
          { label: 'min', type: 'function', detail: 'min(iterable)', apply: 'min()', boost: 5 },
          { label: 'max', type: 'function', detail: 'max(iterable)', apply: 'max()', boost: 5 },
          { label: 'DataFrame', type: 'class', detail: 'pd.DataFrame(data)', apply: 'pd.DataFrame(data)', boost: 7 },
          { label: 'StandardScaler', type: 'class', detail: 'sklearn.preprocessing.StandardScaler', apply: 'StandardScaler()', boost: 7 },
          { label: 'train_test_split', type: 'function', detail: 'sklearn.model_selection.train_test_split', apply: 'train_test_split(X, y, test_size=0.25, random_state=42)', boost: 7 },
          { label: 'import pandas as pd', type: 'keyword', detail: 'Pandas DataFrame library', apply: 'import pandas as pd', boost: 5 },
          { label: 'import numpy as np', type: 'keyword', detail: 'NumPy scientific computing', apply: 'import numpy as np', boost: 5 },
          { label: 'import matplotlib.pyplot as plt', type: 'keyword', detail: 'Matplotlib plotting', apply: 'import matplotlib.pyplot as plt', boost: 5 }
        );

        for (const fn of info.declaredFunctions) {
          candidateOptions.push({
            label: fn,
            type: 'function',
            detail: 'User function',
            apply: `${fn}()`,
            boost: 12,
          });
        }

        for (const v of info.declaredVariables) {
          candidateOptions.push({
            label: v,
            type: 'variable',
            detail: 'Workspace variable',
            boost: 10,
          });
        }
      }
    } else {
      // C / C++ Completions
      if (word.text.includes('std::') || info.linePrefix.includes('std::')) {
        candidateOptions.push(
          { label: 'cout', type: 'keyword', detail: 'std::cout <<', apply: 'cout << ' },
          { label: 'cin', type: 'keyword', detail: 'std::cin >>', apply: 'cin >> ' },
          { label: 'vector', type: 'type', detail: 'std::vector<T>', apply: 'vector<int> ' },
          { label: 'string', type: 'type', detail: 'std::string', apply: 'string ' },
          { label: 'sort', type: 'function', detail: 'std::sort(first, last)', apply: 'sort(v.begin(), v.end())' },
          { label: 'reverse', type: 'function', detail: 'std::reverse(first, last)', apply: 'reverse(v.begin(), v.end())' },
          { label: 'endl', type: 'keyword', detail: 'std::endl', apply: 'endl' },
          { label: 'map', type: 'type', detail: 'std::map<Key, Value>', apply: 'map<int, int> ' },
          { label: 'set', type: 'type', detail: 'std::set<Key>', apply: 'set<int> ' },
          { label: 'priority_queue', type: 'type', detail: 'std::priority_queue<T>', apply: 'priority_queue<int> ' },
          { label: 'pair', type: 'type', detail: 'std::pair<T1, T2>', apply: 'pair<int, int> ' }
        );
      }

      if (!hasDot) {
        if (language === 'cpp') {
          candidateOptions.push(
            { label: 'cout', type: 'keyword', detail: 'std::cout << ...', apply: 'cout << ', boost: 8 },
            { label: 'cin', type: 'keyword', detail: 'std::cin >> ...', apply: 'cin >> ', boost: 8 },
            { label: 'vector', type: 'type', detail: 'vector<T>', apply: 'vector<int> ', boost: 8 },
            { label: 'sort', type: 'function', detail: 'sort(begin, end)', apply: 'sort(nums.begin(), nums.end());', boost: 8 },
            { label: 'push_back', type: 'method', detail: 'v.push_back(val)', apply: 'push_back()', boost: 6 },
            { label: 'string', type: 'type', detail: 'std::string', apply: 'string ', boost: 6 },
            { label: 'map', type: 'type', detail: 'std::map<K, V>', apply: 'map<string, int> ', boost: 6 },
            { label: 'priority_queue', type: 'type', detail: 'std::priority_queue<T>', apply: 'priority_queue<int> ', boost: 5 }
          );
        }
        candidateOptions.push(
          { label: 'printf', type: 'function', detail: 'printf(format, ...)', apply: 'printf("\\n");', boost: 8 },
          { label: 'scanf', type: 'function', detail: 'scanf(format, &var)', apply: 'scanf("%d", &n);', boost: 8 },
          { label: 'sqrt', type: 'function', detail: 'double sqrt(double x)', apply: 'sqrt()', boost: 6 },
          { label: 'pow', type: 'function', detail: 'double pow(double x, double y)', apply: 'pow()', boost: 5 },
          { label: 'malloc', type: 'function', detail: 'void* malloc(size_t size)', apply: 'malloc(sizeof(int) * n)', boost: 5 },
          { label: 'free', type: 'function', detail: 'void free(void* ptr)', apply: 'free()', boost: 5 },
          { label: 'return 0;', type: 'keyword', detail: 'Exit main with success', apply: 'return 0;', boost: 5 }
        );

        for (const fn of info.declaredFunctions) {
          candidateOptions.push({
            label: fn,
            type: 'function',
            detail: 'Declared function',
            apply: `${fn}()`,
            boost: 10,
          });
        }

        for (const v of info.declaredVariables) {
          candidateOptions.push({
            label: v,
            type: 'variable',
            detail: 'Local variable',
            boost: 10,
          });
        }
      }
    }

    if (candidateOptions.length === 0) return null;

    // Deduplicate options by label
    const seenLabels = new Set<string>();
    const uniqueCandidates = candidateOptions.filter((opt) => {
      if (seenLabels.has(opt.label)) return false;
      seenLabels.add(opt.label);
      return true;
    });

    // Apply fuzzy matching score if user has typed text
    const scoredOptions = uniqueCandidates
      .map((opt) => {
        const score = typedText ? fuzzyMatchScore(typedText, opt.label) : 50;
        return {
          ...opt,
          boost: (opt.boost || 0) + score,
          score,
        };
      })
      .filter((opt) => !typedText || opt.score > 0);

    if (scoredOptions.length === 0) return null;

    // Calculate replaced prefix starting position
    const lastDotIndex = word.text.lastIndexOf('.');
    const fromPos = lastDotIndex !== -1 ? word.from + lastDotIndex + 1 : word.from;

    return {
      from: fromPos,
      options: scoredOptions,
    };
  };
}

export function intelliSenseExtension(language: 'python' | 'cpp' | 'c'): Extension {
  return autocompletion({
    override: [createIntelliSenseCompletionSource(language)],
    defaultKeymap: true,
    icons: true,
  });
}
