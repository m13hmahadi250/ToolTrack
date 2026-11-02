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

    // Python completions
    if (language === 'python') {
      // Pandas completions
      if (word.text.includes('pd.') || info.linePrefix.includes('pd.')) {
        candidateOptions.push(
          { label: 'read_csv', type: 'function', detail: 'pd.read_csv(filepath)', apply: 'read_csv("")', info: 'Read CSV into DataFrame' },
          { label: 'DataFrame', type: 'class', detail: 'pd.DataFrame(data)', apply: 'DataFrame()', info: 'Two-dimensional tabular structure' },
          { label: 'Series', type: 'class', detail: 'pd.Series(data)', apply: 'Series()', info: 'One-dimensional labeled array' },
          { label: 'concat', type: 'function', detail: 'pd.concat([df1, df2])', apply: 'concat([])' },
          { label: 'merge', type: 'function', detail: 'pd.merge(df1, df2, on=...)', apply: 'merge()' }
        );
      }

      // DataFrame method completions
      if (word.text.includes('df.') || info.linePrefix.includes('df.')) {
        candidateOptions.push(
          { label: 'head', type: 'method', detail: 'df.head(3)', apply: 'head(3)' },
          { label: 'isnull', type: 'method', detail: 'df.isnull().sum()', apply: 'isnull().sum()' },
          { label: 'idxmax', type: 'method', detail: 'df.idxmax()', apply: 'idxmax()' },
          { label: 'describe', type: 'method', detail: 'df.describe()', apply: 'describe()' },
          { label: 'info', type: 'method', detail: 'df.info()', apply: 'info()' },
          { label: 'fillna', type: 'method', detail: 'df.fillna(value)', apply: 'fillna(0)' },
          { label: 'dropna', type: 'method', detail: 'df.dropna()', apply: 'dropna()' },
          { label: 'groupby', type: 'method', detail: 'df.groupby(by)', apply: 'groupby("")' },
          { label: 'to_csv', type: 'method', detail: 'df.to_csv(filepath)', apply: 'to_csv("output.csv", index=False)' }
        );
      }

      // NumPy completions
      if (word.text.includes('np.') || info.linePrefix.includes('np.')) {
        candidateOptions.push(
          { label: 'array', type: 'function', detail: 'np.array(object)', apply: 'array([])' },
          { label: 'linspace', type: 'function', detail: 'np.linspace(start, stop, num)', apply: 'linspace(0, 10, 100)' },
          { label: 'arange', type: 'function', detail: 'np.arange(start, stop, step)', apply: 'arange(0, 10, 1)' },
          { label: 'zeros', type: 'function', detail: 'np.zeros(shape)', apply: 'zeros((3, 3))' },
          { label: 'ones', type: 'function', detail: 'np.ones(shape)', apply: 'ones((3, 3))' },
          { label: 'mean', type: 'function', detail: 'np.mean(a)', apply: 'mean()' },
          { label: 'std', type: 'function', detail: 'np.std(a)', apply: 'std()' },
          { label: 'random.rand', type: 'function', detail: 'np.random.rand(...)', apply: 'random.rand()' }
        );
      }

      // Matplotlib completions
      if (word.text.includes('plt.') || info.linePrefix.includes('plt.')) {
        candidateOptions.push(
          { label: 'bar', type: 'function', detail: 'plt.bar(x, y)', apply: 'bar(x, y)' },
          { label: 'plot', type: 'function', detail: 'plt.plot(x, y)', apply: 'plot(x, y)' },
          { label: 'scatter', type: 'function', detail: 'plt.scatter(x, y)', apply: 'scatter(x, y)' },
          { label: 'hist', type: 'function', detail: 'plt.hist(x, bins=...)', apply: 'hist(x, bins=20)' },
          { label: 'title', type: 'function', detail: 'plt.title(label)', apply: 'title("")' },
          { label: 'xlabel', type: 'function', detail: 'plt.xlabel(label)', apply: 'xlabel("")' },
          { label: 'ylabel', type: 'function', detail: 'plt.ylabel(label)', apply: 'ylabel("")' },
          { label: 'grid', type: 'function', detail: 'plt.grid(True)', apply: 'grid(True)' },
          { label: 'legend', type: 'function', detail: 'plt.legend()', apply: 'legend()' },
          { label: 'show', type: 'function', detail: 'plt.show()', apply: 'show()' }
        );
      }

      // Scikit-learn completions
      if (info.linePrefix.includes('sklearn') || info.linePrefix.includes('model.') || info.linePrefix.includes('scaler.')) {
        candidateOptions.push(
          { label: 'train_test_split', type: 'function', detail: 'train_test_split(X, y)', apply: 'train_test_split(X, y, test_size=0.25, random_state=42)' },
          { label: 'StandardScaler', type: 'class', detail: 'StandardScaler()', apply: 'StandardScaler()' },
          { label: 'fit_transform', type: 'method', detail: 'scaler.fit_transform(X)', apply: 'fit_transform(X_train)' },
          { label: 'transform', type: 'method', detail: 'scaler.transform(X)', apply: 'transform(X_test)' },
          { label: 'fit', type: 'method', detail: 'model.fit(X_train, y_train)', apply: 'fit(X_train_scaled, y_train)' },
          { label: 'predict', type: 'method', detail: 'model.predict(X_test)', apply: 'predict(X_test_scaled)' },
          { label: 'score', type: 'method', detail: 'model.score(X_test, y_test)', apply: 'score(X_test_scaled, y_test)' }
        );
      }

      // Declared Variables
      for (const v of info.declaredVariables) {
        candidateOptions.push({
          label: v,
          type: 'variable',
          detail: 'Local variable',
          boost: 5,
        });
      }
    } else {
      // C / C++ Completions
      if (word.text.includes('std::') || info.linePrefix.includes('std::')) {
        candidateOptions.push(
          { label: 'cout', type: 'keyword', detail: 'std::cout <<', apply: 'cout << ' },
          { label: 'cin', type: 'keyword', detail: 'std::cin >>', apply: 'cin >> ' },
          { label: 'vector', type: 'type', detail: 'std::vector<T>', apply: 'vector<' },
          { label: 'string', type: 'type', detail: 'std::string', apply: 'string ' },
          { label: 'sort', type: 'function', detail: 'std::sort(first, last)', apply: 'sort(v.begin(), v.end())' },
          { label: 'endl', type: 'keyword', detail: 'std::endl', apply: 'endl' },
          { label: 'map', type: 'type', detail: 'std::map<Key, Value>', apply: 'map<' }
        );
      }

      for (const v of info.declaredVariables) {
        candidateOptions.push({
          label: v,
          type: 'variable',
          detail: 'Local variable',
          boost: 5,
        });
      }
    }

    if (candidateOptions.length === 0) return null;

    // Apply fuzzy matching score if user has typed text
    const scoredOptions = candidateOptions
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
