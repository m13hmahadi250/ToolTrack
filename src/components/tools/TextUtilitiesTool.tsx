import React, { useState, useMemo, useRef } from 'react';
import {
  Type,
  Copy,
  Check,
  RotateCcw,
  Download,
  FileText,
  AlignLeft,
  Sparkles,
  ArrowRight,
  GitCompare,
  Code2,
  Trash2,
  Search,
  Replace,
  Clock,
  BookOpen,
} from 'lucide-react';

export type TextUtilityTab =
  | 'counter'
  | 'case'
  | 'cleaner'
  | 'diff'
  | 'markdown'
  | 'slug';

interface TextUtilitiesToolProps {
  initialTab?: TextUtilityTab;
}

export const TextUtilitiesTool: React.FC<TextUtilitiesToolProps> = ({ initialTab = 'counter' }) => {
  const [activeTab, setActiveTab] = useState<TextUtilityTab>(initialTab);
  const [copied, setCopied] = useState(false);

  // Common Text input
  const [text, setText] = useState('');

  // Text Cleaner & Transform options
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [replaceMessage, setReplaceMessage] = useState('');

  // Diff Checker state
  const [diffOriginal, setDiffOriginal] = useState('');
  const [diffModified, setDiffModified] = useState('');

  // Markdown Editor state
  const [markdownText, setMarkdownText] = useState('');
  const [markdownViewMode, setMarkdownViewMode] = useState<'split' | 'edit' | 'preview'>('split');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy helper
  const handleCopy = (contentToCopy: string) => {
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download helper
  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // File Upload helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'text' | 'markdown') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (target === 'text') setText(result);
      else setMarkdownText(result);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Comprehensive Text Statistics
  const stats = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        words: 0,
        characters: 0,
        charsNoSpaces: 0,
        lines: 0,
        paragraphs: 0,
        sentences: 0,
        readingTime: '0 sec',
        speakingTime: '0 sec',
      };
    }

    const wordsArray = trimmed.match(/\S+/g) || [];
    const words = wordsArray.length;
    const characters = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const lines = text.split(/\r\n|\r|\n/).length;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || 1;
    const sentences = (text.match(/[^.!?]+[.!?]+/g) || []).length || (words > 0 ? 1 : 0);

    // Reading time: 200 words per minute
    const readMinutes = Math.floor(words / 200);
    const readSeconds = Math.round(((words % 200) / 200) * 60);
    const readingTime =
      readMinutes > 0 ? `${readMinutes} min ${readSeconds} sec` : `${readSeconds} sec`;

    // Speaking time: 130 words per minute
    const speakMinutes = Math.floor(words / 130);
    const speakSeconds = Math.round(((words % 130) / 130) * 60);
    const speakingTime =
      speakMinutes > 0 ? `${speakMinutes} min ${speakSeconds} sec` : `${speakSeconds} sec`;

    return {
      words,
      characters,
      charsNoSpaces,
      lines,
      paragraphs,
      sentences,
      readingTime,
      speakingTime,
    };
  }, [text]);

  // Case transforms
  const applyCaseTransform = (
    mode:
      | 'upper'
      | 'lower'
      | 'title'
      | 'sentence'
      | 'camel'
      | 'kebab'
      | 'snake'
      | 'pascal'
      | 'alternating'
  ) => {
    if (!text) return;
    let result = text;

    switch (mode) {
      case 'upper':
        result = text.toUpperCase();
        break;
      case 'lower':
        result = text.toLowerCase();
        break;
      case 'title':
        result = text.replace(
          /\w\S*/g,
          (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
        );
        break;
      case 'sentence':
        result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
        break;
      case 'camel':
        result = text
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
          .replace(/^./, (chr) => chr.toLowerCase());
        break;
      case 'pascal':
        result = text
          .toLowerCase()
          .replace(/(?:^|[^a-zA-Z0-9]+)(.)/g, (_, chr) => chr.toUpperCase());
        break;
      case 'kebab':
        result = text
          .trim()
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        break;
      case 'snake':
        result = text
          .trim()
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        break;
      case 'alternating':
        result = text
          .split('')
          .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
          .join('');
        break;
    }

    setText(result);
  };

  // Line & Spacing cleaning operations
  const applyCleaning = (action: 'dedup' | 'sort-asc' | 'sort-desc' | 'spaces' | 'empty' | 'slug') => {
    if (!text) return;

    if (action === 'slug') {
      const slug = text
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setText(slug);
      return;
    }

    const lines = text.split(/\r\n|\r|\n/);

    if (action === 'dedup') {
      const seen = new Set<string>();
      const unique = lines.filter((line) => {
        if (seen.has(line)) return false;
        seen.add(line);
        return true;
      });
      setText(unique.join('\n'));
    } else if (action === 'sort-asc') {
      const sorted = [...lines].sort((a, b) => a.localeCompare(b));
      setText(sorted.join('\n'));
    } else if (action === 'sort-desc') {
      const sorted = [...lines].sort((a, b) => b.localeCompare(a));
      setText(sorted.join('\n'));
    } else if (action === 'spaces') {
      // Collapse multiple spaces and trim lines
      const cleaned = lines.map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n');
      setText(cleaned);
    } else if (action === 'empty') {
      const nonEmpty = lines.filter((l) => l.trim().length > 0);
      setText(nonEmpty.join('\n'));
    }
  };

  // Find & Replace
  const handleFindReplace = (replaceAll: boolean) => {
    if (!findText) {
      setReplaceMessage('Please specify text to find.');
      return;
    }

    try {
      let count = 0;
      let newText = text;

      if (useRegex) {
        const flags = (matchCase ? '' : 'i') + (replaceAll ? 'g' : '');
        const regex = new RegExp(findText, flags);
        const matches = text.match(regex);
        count = matches ? matches.length : 0;
        newText = text.replace(regex, replaceText);
      } else {
        if (replaceAll) {
          const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escaped, matchCase ? 'g' : 'gi');
          const matches = text.match(regex);
          count = matches ? matches.length : 0;
          newText = text.replace(regex, replaceText);
        } else {
          const idx = matchCase
            ? text.indexOf(findText)
            : text.toLowerCase().indexOf(findText.toLowerCase());
          if (idx !== -1) {
            count = 1;
            newText = text.slice(0, idx) + replaceText + text.slice(idx + findText.length);
          }
        }
      }

      setText(newText);
      setReplaceMessage(count > 0 ? `Replaced ${count} occurrence${count > 1 ? 's' : ''}.` : 'No matches found.');
      setTimeout(() => setReplaceMessage(''), 3000);
    } catch (err: any) {
      setReplaceMessage(`Regex error: ${err.message || 'Invalid pattern'}`);
    }
  };

  // Simple, robust Line-by-Line Diff computation
  const diffResults = useMemo(() => {
    const lines1 = diffOriginal.split(/\r\n|\r|\n/);
    const lines2 = diffModified.split(/\r\n|\r|\n/);

    const maxLen = Math.max(lines1.length, lines2.length);
    const result: Array<{ type: 'same' | 'added' | 'removed' | 'modified'; lineA?: string; lineB?: string; lineNum: number }> = [];

    for (let i = 0; i < maxLen; i++) {
      const a = lines1[i];
      const b = lines2[i];

      if (a === undefined && b !== undefined) {
        result.push({ type: 'added', lineB: b, lineNum: i + 1 });
      } else if (a !== undefined && b === undefined) {
        result.push({ type: 'removed', lineA: a, lineNum: i + 1 });
      } else if (a === b) {
        result.push({ type: 'same', lineA: a, lineB: b, lineNum: i + 1 });
      } else {
        result.push({ type: 'modified', lineA: a, lineB: b, lineNum: i + 1 });
      }
    }

    return result;
  }, [diffOriginal, diffModified]);

  // Render Markdown safely into HTML preview
  const renderedMarkdownHtml = useMemo(() => {
    // Clean, lightweight browser markdown renderer (handles headers, bold, italics, code, lists, quotes, links)
    let raw = markdownText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks ```code```
    raw = raw.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs my-3 font-mono"><code>$1</code></pre>');

    // Inline code `code`
    raw = raw.replace(/`([^`]+)`/g, '<code class="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-indigo-600 dark:text-indigo-400">$1</code>');

    // Headers #, ##, ###
    raw = raw.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold mt-4 mb-1 text-slate-900 dark:text-white">$1</h3>');
    raw = raw.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-5 mb-2 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1">$1</h2>');
    raw = raw.replace(/^# (.*$)/gim, '<h1 class="text-xl font-extrabold mt-6 mb-2 text-slate-900 dark:text-white">$1</h1>');

    // Blockquote >
    raw = raw.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-indigo-500 pl-3 italic text-slate-600 dark:text-slate-300 my-2">$1</blockquote>');

    // Bold **text**
    raw = raw.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');

    // Italic *text*
    raw = raw.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Unordered lists -
    raw = raw.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-700 dark:text-slate-300 text-sm">$1</li>');

    // Paragraph breaks
    raw = raw.replace(/\n{2,}/g, '</p><p class="my-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">');

    return `<div class="prose dark:prose-invert max-w-none"><p class="my-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">${raw}</p></div>`;
  }, [markdownText]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Type className="w-5 h-5" />
            </div>
            <span>Text Studio & Utilities</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Count words, transform cases, remove duplicates, check text diffs, format markdown & clean strings locally.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(activeTab === 'markdown' ? markdownText : text)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>

          <button
            onClick={() =>
              handleDownload(
                activeTab === 'markdown' ? 'document.md' : 'text-output.txt',
                activeTab === 'markdown' ? markdownText : text
              )
            }
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 scrollbar-none">
        {[
          { id: 'counter', label: 'Word & Stat Counter', icon: FileText },
          { id: 'case', label: 'Case Converter', icon: Type },
          { id: 'cleaner', label: 'Cleaner & Find/Replace', icon: AlignLeft },
          { id: 'diff', label: 'Difference Checker', icon: GitCompare },
          { id: 'markdown', label: 'Markdown Editor', icon: Code2 },
          { id: 'slug', label: 'URL Slug Generator', icon: ArrowRight },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TextUtilityTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Word & Character Counter */}
      {activeTab === 'counter' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Words</div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{stats.words}</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Characters</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.characters}</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">No Spaces</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.charsNoSpaces}</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Lines</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.lines}</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-500" />
                <span>Reading Time</span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-2">{stats.readingTime}</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-emerald-500" />
                <span>Speaking Time</span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-2">{stats.speakingTime}</div>
            </div>
          </div>

          {/* Text Area */}
          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Input Text</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setText('')}
                  className="text-slate-400 hover:text-red-500 transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type text here to analyze..."
              rows={10}
              className="w-full p-4 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-y font-sans leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* TAB 2: Text Case Converter */}
      {activeTab === 'case' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'upper', label: 'UPPERCASE' },
              { id: 'lower', label: 'lowercase' },
              { id: 'title', label: 'Title Case' },
              { id: 'sentence', label: 'Sentence case' },
              { id: 'camel', label: 'camelCase' },
              { id: 'pascal', label: 'PascalCase' },
              { id: 'kebab', label: 'kebab-case' },
              { id: 'snake', label: 'snake_case' },
              { id: 'alternating', label: 'aLtErNaTiNg' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => applyCaseTransform(btn.id as any)}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer shadow-2xs"
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden shadow-xs">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder="Enter text to convert case..."
              className="w-full p-4 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-y leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* TAB 3: Cleaner & Find/Replace */}
      {activeTab === 'cleaner' && (
        <div className="space-y-6">
          {/* Quick Cleaning Buttons */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Quick Line & Space Tools</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyCleaning('dedup')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                Remove Duplicate Lines
              </button>
              <button
                onClick={() => applyCleaning('sort-asc')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                Sort Lines (A → Z)
              </button>
              <button
                onClick={() => applyCleaning('sort-desc')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                Sort Lines (Z → A)
              </button>
              <button
                onClick={() => applyCleaning('spaces')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                Remove Extra Spaces & Trim
              </button>
              <button
                onClick={() => applyCleaning('empty')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                Remove Empty Lines
              </button>
            </div>
          </div>

          {/* Find and Replace Box */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Find and Replace</span>
              {replaceMessage && (
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">
                  {replaceMessage}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  placeholder="Find..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="relative">
                <Replace className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="Replace with..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={matchCase}
                    onChange={(e) => setMatchCase(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Match Case</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useRegex}
                    onChange={(e) => setUseRegex(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Use RegEx</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFindReplace(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  Replace First
                </button>
                <button
                  onClick={() => handleFindReplace(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Replace All
                </button>
              </div>
            </div>
          </div>

          {/* Text Area */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden shadow-xs">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder="Enter text to clean or find/replace..."
              className="w-full p-4 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-y leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* TAB 4: Text Difference Checker */}
      {activeTab === 'diff' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Original Text</div>
              <textarea
                value={diffOriginal}
                onChange={(e) => setDiffOriginal(e.target.value)}
                rows={8}
                placeholder="Paste original text here..."
                className="w-full p-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 resize-y"
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Modified Text</div>
              <textarea
                value={diffModified}
                onChange={(e) => setDiffModified(e.target.value)}
                rows={8}
                placeholder="Paste modified text here..."
                className="w-full p-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 resize-y"
              />
            </div>
          </div>

          {/* Diff Output Viewer */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden shadow-xs space-y-2 p-4">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
              <span>Comparison Results (Line by Line)</span>
              <span className="text-[11px] font-normal text-slate-500">
                <span className="text-emerald-600 font-semibold">+ Added</span> ·{' '}
                <span className="text-rose-600 font-semibold">- Removed</span> ·{' '}
                <span className="text-amber-600 font-semibold">~ Changed</span>
              </span>
            </div>

            <div className="space-y-1 font-mono text-xs max-h-80 overflow-y-auto pr-1">
              {diffResults.map((item, idx) => {
                if (item.type === 'same') {
                  return (
                    <div key={idx} className="flex items-start gap-3 px-2 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded">
                      <span className="text-[10px] text-slate-400 select-none w-6 text-right shrink-0">{item.lineNum}</span>
                      <span className="text-slate-400 select-none w-4 text-center"> </span>
                      <span className="break-all">{item.lineA}</span>
                    </div>
                  );
                } else if (item.type === 'added') {
                  return (
                    <div key={idx} className="flex items-start gap-3 px-2 py-1 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded border-l-2 border-emerald-500">
                      <span className="text-[10px] text-emerald-500 select-none w-6 text-right shrink-0">{item.lineNum}</span>
                      <span className="font-bold select-none w-4 text-center">+</span>
                      <span className="break-all">{item.lineB}</span>
                    </div>
                  );
                } else if (item.type === 'removed') {
                  return (
                    <div key={idx} className="flex items-start gap-3 px-2 py-1 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded border-l-2 border-rose-500">
                      <span className="text-[10px] text-rose-500 select-none w-6 text-right shrink-0">{item.lineNum}</span>
                      <span className="font-bold select-none w-4 text-center">-</span>
                      <span className="break-all">{item.lineA}</span>
                    </div>
                  );
                } else {
                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex items-start gap-3 px-2 py-1 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded">
                        <span className="text-[10px] text-rose-500 select-none w-6 text-right shrink-0">{item.lineNum}</span>
                        <span className="font-bold select-none w-4 text-center">-</span>
                        <span className="break-all">{item.lineA}</span>
                      </div>
                      <div className="flex items-start gap-3 px-2 py-1 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded">
                        <span className="text-[10px] text-emerald-500 select-none w-6 text-right shrink-0">{item.lineNum}</span>
                        <span className="font-bold select-none w-4 text-center">+</span>
                        <span className="break-all">{item.lineB}</span>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Markdown Editor & Live Preview */}
      {activeTab === 'markdown' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setMarkdownViewMode('split')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  markdownViewMode === 'split' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setMarkdownViewMode('edit')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  markdownViewMode === 'edit' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Editor Only
              </button>
              <button
                onClick={() => setMarkdownViewMode('preview')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  markdownViewMode === 'preview' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Preview Only
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".md,.markdown,.txt"
                onChange={(e) => handleFileUpload(e, 'markdown')}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Open .md File
              </button>
            </div>
          </div>

          <div className={`grid gap-4 ${markdownViewMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {(markdownViewMode === 'split' || markdownViewMode === 'edit') && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                  Markdown Source
                </div>
                <textarea
                  value={markdownText}
                  onChange={(e) => setMarkdownText(e.target.value)}
                  rows={16}
                  placeholder="# Enter markdown..."
                  className="w-full p-4 bg-transparent text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-y leading-relaxed"
                />
              </div>
            )}

            {(markdownViewMode === 'split' || markdownViewMode === 'preview') && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden shadow-xs flex flex-col">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                  Formatted Live Preview
                </div>
                <div
                  className="p-5 overflow-y-auto flex-1 min-h-[300px]"
                  dangerouslySetInnerHTML={{ __html: renderedMarkdownHtml }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: URL Slug Generator */}
      {activeTab === 'slug' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Convert Any Title into a Clean URL Slug</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Strips special characters, accents, and punctuation, replacing spaces with dashes for clean SEO URLs.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Original Title / String</label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. 10 Essential Productivity Tools for 2026!"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => applyCleaning('slug')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate URL Slug</span>
                </button>
              </div>

              <div className="pt-3">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Generated Slug</label>
                <div className="p-3 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between font-mono text-sm text-indigo-600 dark:text-indigo-400">
                  <span className="truncate mr-2">
                    {text
                      .trim()
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '') || 'your-slug-will-appear-here'}
                  </span>
                  <button
                    onClick={() => {
                      const slug = text
                        .trim()
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '');
                      handleCopy(slug);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition cursor-pointer shrink-0"
                    title="Copy Slug"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
