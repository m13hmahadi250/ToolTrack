/**
 * ToolTrack CodeMirror 6 VS Code-Style Ghost Text Extension
 * Renders inline gray ghost text at cursor position.
 * Pressing 'Tab' accepts the predicted ghost text suggestion.
 * Pressing 'Esc' dismisses it.
 */

import {
  Extension,
  StateField,
  StateEffect,
  Prec,
  EditorState,
} from '@codemirror/state';
import {
  EditorView,
  Decoration,
  DecorationSet,
  WidgetType,
  keymap,
} from '@codemirror/view';
import {
  analyzeContext,
  predictGhostText,
  recordAcceptedSuggestion,
} from './autocompleteEngine';

export interface GhostTextState {
  ghostText: string | null;
  pos: number;
  kind?: string;
}

// Effects to update or clear ghost text
export const setGhostTextEffect = StateEffect.define<GhostTextState>();
export const clearGhostTextEffect = StateEffect.define<void>();

// Inline Widget for rendering gray ghost text right after cursor
class GhostTextWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-ghost-text opacity-50 font-mono text-indigo-500 dark:text-indigo-400 italic pointer-events-none select-none ml-0.5 border-b border-indigo-500/30';
    span.textContent = this.text;
    span.title = 'Press Tab to accept suggestion, Esc to dismiss';
    return span;
  }

  eq(other: GhostTextWidget): boolean {
    return other.text === this.text;
  }
}

// StateField managing ghost text state and decorations
export const ghostTextStateField = StateField.define<GhostTextState>({
  create() {
    return { ghostText: null, pos: -1 };
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setGhostTextEffect)) {
        return effect.value;
      }
      if (effect.is(clearGhostTextEffect)) {
        return { ghostText: null, pos: -1 };
      }
    }

    // Clear ghost text if selection or document changes without effect
    if (tr.docChanged || tr.selection) {
      return { ghostText: null, pos: -1 };
    }

    return value;
  },
});

// ViewPlugin to display ghost text decorations in CodeMirror
export const ghostTextPlugin = EditorView.decorations.compute(
  [ghostTextStateField],
  (state) => {
    const { ghostText, pos } = state.field(ghostTextStateField);
    if (!ghostText || pos < 0 || pos > state.doc.length) {
      return Decoration.none;
    }

    const widget = Decoration.widget({
      widget: new GhostTextWidget(ghostText),
      side: 1,
    });

    return Decoration.set([widget.range(pos)]);
  }
);

// Listener to recompute ghost text predictions on user typing
export function ghostTextPredictorListener(language: 'python' | 'cpp' | 'c') {
  return EditorView.updateListener.of((update) => {
    if (!update.docChanged && !update.selectionSet) return;

    const state = update.state;
    const sel = state.selection.main;

    // Only suggest ghost text when cursor is single point (no multi-selection)
    if (!sel.empty) {
      if (state.field(ghostTextStateField).ghostText) {
        update.view.dispatch({ effects: clearGhostTextEffect.of() });
      }
      return;
    }

    const pos = sel.head;
    const docText = state.doc.toString();

    // Analyze surrounding context
    const context = analyzeContext(docText, pos, language);
    const prediction = predictGhostText(context);

    if (prediction && prediction.textToInsert) {
      update.view.dispatch({
        effects: setGhostTextEffect.of({
          ghostText: prediction.textToInsert,
          pos,
          kind: prediction.kind,
        }),
      });
    } else {
      if (state.field(ghostTextStateField).ghostText) {
        update.view.dispatch({ effects: clearGhostTextEffect.of() });
      }
    }
  });
}

// Keyboard shortcuts for accepting (Tab) and dismissing (Esc) ghost text
export function createGhostTextKeymap() {
  return Prec.highest(
    keymap.of([
      {
        key: 'Tab',
        run: (view: EditorView) => {
          const { ghostText, pos } = view.state.field(ghostTextStateField);

          if (ghostText && pos === view.state.selection.main.head) {
            // Record accepted completion for local adaptive learning
            recordAcceptedSuggestion(ghostText);

            // Insert predicted ghost text into document
            view.dispatch({
              changes: { from: pos, insert: ghostText },
              selection: { anchor: pos + ghostText.length },
              effects: clearGhostTextEffect.of(),
            });
            return true; // Key handled
          }
          return false; // Fallthrough to standard tab / indent
        },
      },
      {
        key: 'Escape',
        run: (view: EditorView) => {
          const { ghostText } = view.state.field(ghostTextStateField);
          if (ghostText) {
            view.dispatch({ effects: clearGhostTextEffect.of() });
            return true; // Key handled
          }
          return false;
        },
      },
    ])
  );
}

// Complete Ghost Text Extension Bundle
export function ghostTextExtension(language: 'python' | 'cpp' | 'c'): Extension {
  return [
    ghostTextStateField,
    ghostTextPlugin,
    ghostTextPredictorListener(language),
    createGhostTextKeymap(),
  ];
}
