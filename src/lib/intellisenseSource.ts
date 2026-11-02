/**
 * ToolTrack IntelliSense Autocomplete Source
 * Provides context-aware completion items for CodeMirror's autocompletion popup dropdown.
 */

import { CompletionContext, CompletionResult, autocompletion } from '@codemirror/autocomplete';
import { Extension } from '@codemirror/state';
import { analyzeContext } from './autocompleteEngine';

export function createIntelliSenseCompletionSource(language: 'python' | 'cpp' | 'c') {
  return async (context: CompletionContext): Promise<CompletionResult | null> => {
    const word = context.matchBefore(/[\w_.]*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const fullCode = context.state.doc.toString();
    const info = analyzeContext(fullCode, context.pos, language);

    const options: Array<{
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
      if (word.text.startsWith('pd.') || info.linePrefix.includes('pd.')) {
        options.push(
          { label: 'read_csv', type: 'function', detail: 'pd.read_csv(filepath)', apply: 'read_csv("")', info: 'Read CSV into DataFrame' },
          { label: 'DataFrame', type: 'class', detail: 'pd.DataFrame(data)', apply: 'DataFrame()', info: 'Two-dimensional tabular structure' },
          { label: 'Series', type: 'class', detail: 'pd.Series(data)', apply: 'Series()', info: 'One-dimensional labeled array' },
          { label: 'concat', type: 'function', detail: 'pd.concat([df1, df2])', apply: 'concat([])' },
          { label: 'merge', type: 'function', detail: 'pd.merge(df1, df2, on=...)', apply: 'merge()' }
        );
      }

      // NumPy completions
      if (word.text.startsWith('np.') || info.linePrefix.includes('np.')) {
        options.push(
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
      if (word.text.startsWith('plt.') || info.linePrefix.includes('plt.')) {
        options.push(
          { label: 'plot', type: 'function', detail: 'plt.plot(x, y)', apply: 'plot(x, y)' },
          { label: 'scatter', type: 'function', detail: 'plt.scatter(x, y)', apply: 'scatter(x, y)' },
          { label: 'bar', type: 'function', detail: 'plt.bar(x, height)', apply: 'bar(x, y)' },
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
      if (info.linePrefix.includes('sklearn') || info.linePrefix.includes('model.')) {
        options.push(
          { label: 'train_test_split', type: 'function', detail: 'train_test_split(X, y)', apply: 'train_test_split(X, y, test_size=0.2, random_state=42)' },
          { label: 'fit', type: 'method', detail: 'model.fit(X_train, y_train)', apply: 'fit(X_train, y_train)' },
          { label: 'predict', type: 'method', detail: 'model.predict(X_test)', apply: 'predict(X_test)' },
          { label: 'score', type: 'method', detail: 'model.score(X_test, y_test)', apply: 'score(X_test, y_test)' }
        );
      }

      // Declared Variables
      for (const v of info.declaredVariables) {
        options.push({
          label: v,
          type: 'variable',
          detail: 'Local variable',
          boost: 3,
        });
      }
    } else {
      // C / C++ Completions
      if (word.text.startsWith('std::') || info.linePrefix.includes('std::')) {
        options.push(
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
        options.push({
          label: v,
          type: 'variable',
          detail: 'Local variable',
          boost: 3,
        });
      }
    }

    if (options.length === 0) return null;

    return {
      from: word.from,
      options,
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
