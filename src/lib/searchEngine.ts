import { TOOLS_LIST } from '../data/toolsList';
import type { ToolItem } from '../types';

export interface SearchResult {
  tool: ToolItem;
  score: number;
  matchType: 'exact' | 'prefix' | 'keyword' | 'synonym' | 'format' | 'description' | 'fuzzy';
  matchedSnippet?: string;
}

// Common typo corrections and synonym aliases
const SYNONYM_MAP: Record<string, string[]> = {
  // Typos & abbreviations
  img: ['image', 'photo', 'picture'],
  imag: ['image'],
  imgs: ['images'],
  pic: ['image', 'photo'],
  pics: ['images', 'photos'],
  photo: ['image'],
  photos: ['images'],
  picture: ['image'],
  pictures: ['images'],
  pdff: ['pdf'],
  pfd: ['pdf'],
  dpf: ['pdf'],
  comress: ['compress', 'compression'],
  compres: ['compress'],
  copress: ['compress'],
  resiz: ['resize'],
  resizer: ['resize'],
  dim: ['dimensions', 'resize'],
  convet: ['convert'],
  convrter: ['converter'],
  conv: ['convert'],
  backgroud: ['background'],
  backg: ['background'],
  bg: ['background', 'remove bg', 'background remover'],
  nobg: ['remove background', 'transparent'],
  wrod: ['word'],
  doc: ['word', 'docx'],
  docs: ['word', 'docx'],
  sheet: ['excel', 'spreadsheet'],
  sheets: ['excel', 'spreadsheet'],
  xls: ['excel'],
  xlsx: ['excel'],
  combine: ['merge'],
  join: ['merge'],
  cut: ['split', 'crop'],
  shrink: ['compress', 'reduce'],
  small: ['compress', 'reduce'],
  reduce: ['compress'],
  trans: ['transparent', 'alpha'],
  transparent: ['alpha', 'remove background'],
  alpha: ['transparent', 'remove background'],
  homework: ['assignment'],
  study: ['notes'],
  pass: ['password', 'security', 'password generator'],
  pwd: ['password', 'security', 'password generator'],
  lock: ['security', 'protect'],
  qr: ['qr code', 'qr generator', 'qr scanner'],
  qrcode: ['qr code', 'qr generator', 'qr scanner'],
  calc: ['calculator', 'percentage', 'unit converter'],
  calculator: ['standard calculator', 'percentage', 'unit converter'],
  math: ['calculator', 'percentage'],
  timer: ['timer', 'stopwatch', 'countdown'],
  stopwatch: ['timer', 'stopwatch'],
  clock: ['timer', 'stopwatch'],
  json: ['json formatter', 'csv json converter'],
  csv: ['csv json converter', 'excel to pdf'],
  b64: ['base64 converter'],
  base64: ['base64 converter'],
  hash: ['hash generator', 'sha256', 'md5'],
  sha: ['hash generator', 'sha256'],
  uuid: ['uuid generator', 'guid'],
  guid: ['uuid generator'],
  count: ['word counter', 'character counter'],
  counter: ['word counter', 'character counter'],
  words: ['word counter', 'text utilities'],
  chars: ['character counter', 'word counter'],
  diff: ['text diff checker', 'compare'],
  markdown: ['markdown editor', 'notes'],
  md: ['markdown editor'],
  case: ['text case converter', 'uppercase', 'lowercase'],
  slug: ['url slug generator', 'kebab case'],
};

// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

/**
 * Normalizes user queries by trimming, removing excessive punctuation, and lowercasing
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s.-]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Smart Search Engine for ToolTrack
 * Implements token-aware, prefix, synonym, format, and fuzzy ranking.
 */
export function searchTools(query: string, maxResults = 10): SearchResult[] {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return getPopularTools().map((t) => ({
      tool: t,
      score: t.popular ? 100 : 50,
      matchType: 'exact',
    }));
  }

  const queryTokens = normalized.split(/\s+/).filter(Boolean);
  const results: SearchResult[] = [];

  // Expanded query terms including synonyms/aliases
  const expandedTokens = new Set<string>(queryTokens);
  queryTokens.forEach((token) => {
    if (SYNONYM_MAP[token]) {
      SYNONYM_MAP[token].forEach((syn) => expandedTokens.add(syn));
    }
  });

  for (const tool of TOOLS_LIST) {
    let score = 0;
    let matchType: SearchResult['matchType'] = 'fuzzy';
    const toolNameLower = tool.name.toLowerCase();
    const descLower = tool.description.toLowerCase();
    const catLower = tool.category.toLowerCase();
    const keywords = (tool.keywords || []).map((k) => k.toLowerCase());
    const synonyms = (tool.synonyms || []).map((s) => s.toLowerCase());
    const inputFormats = (tool.inputFormats || []).map((f) => f.toLowerCase());
    const outputFormats = (tool.outputFormats || []).map((f) => f.toLowerCase());
    const acceptedFormats = (tool.acceptedFormats || []).map((f) => f.replace('.', '').toLowerCase());

    // 1. Exact Full Query Matches
    if (toolNameLower === normalized) {
      score += 2000;
      matchType = 'exact';
    } else if (toolNameLower.startsWith(normalized)) {
      score += 1200;
      matchType = 'prefix';
    } else if (toolNameLower.includes(normalized)) {
      score += 800;
      matchType = 'prefix';
    }

    // 2. Exact Synonym or Full Keyword Match
    if (synonyms.includes(normalized)) {
      score += 1000;
      matchType = 'synonym';
    } else if (synonyms.some((s) => s.startsWith(normalized))) {
      score += 650;
      matchType = 'synonym';
    } else if (synonyms.some((s) => s.includes(normalized))) {
      score += 450;
      matchType = 'synonym';
    }

    if (keywords.includes(normalized)) {
      score += 600;
      if (score < 800) matchType = 'keyword';
    } else if (keywords.some((k) => k.startsWith(normalized))) {
      score += 400;
      if (score < 800) matchType = 'keyword';
    } else if (keywords.some((k) => k.includes(normalized))) {
      score += 250;
      if (score < 800) matchType = 'keyword';
    }

    // 3. Format Matches (e.g. "jpg", "png", "docx", "pdf", "xlsx", "webp")
    if (
      inputFormats.includes(normalized) ||
      outputFormats.includes(normalized) ||
      acceptedFormats.includes(normalized)
    ) {
      score += 350;
      if (score < 600) matchType = 'format';
    }

    // 4. Token-by-token evaluation
    let matchedTokenCount = 0;
    for (const token of queryTokens) {
      let tokenMatched = false;

      // Tool name word boundary match
      const toolWords = toolNameLower.split(/[\s\-().,/]+/);
      for (const w of toolWords) {
        if (w === token) {
          score += 300;
          tokenMatched = true;
        } else if (w.startsWith(token)) {
          score += 180;
          tokenMatched = true;
        } else if (w.includes(token) && token.length >= 2) {
          score += 90;
          tokenMatched = true;
        }
      }

      // Keyword & Synonym token match
      if (!tokenMatched) {
        for (const kw of keywords) {
          if (kw === token) {
            score += 150;
            tokenMatched = true;
            break;
          } else if (kw.startsWith(token)) {
            score += 90;
            tokenMatched = true;
            break;
          } else if (kw.includes(token) && token.length >= 3) {
            score += 40;
            tokenMatched = true;
            break;
          }
        }
      }

      // Format token match
      if (
        inputFormats.includes(token) ||
        outputFormats.includes(token) ||
        acceptedFormats.includes(token)
      ) {
        score += 120;
        tokenMatched = true;
      }

      // Description token match
      if (descLower.includes(token) && token.length >= 2) {
        score += 60;
        tokenMatched = true;
      }

      // Category match
      if (catLower.includes(token)) {
        score += 80;
        tokenMatched = true;
      }

      // Synonym expansion match
      if (!tokenMatched) {
        for (const exp of expandedTokens) {
          if (toolNameLower.includes(exp)) {
            score += 160;
            tokenMatched = true;
            break;
          }
          if (keywords.some((k) => k.includes(exp))) {
            score += 90;
            tokenMatched = true;
            break;
          }
          if (synonyms.some((s) => s.includes(exp))) {
            score += 110;
            tokenMatched = true;
            break;
          }
        }
      }

      // Fuzzy typo match (only for words with 4+ characters)
      if (!tokenMatched && token.length >= 4) {
        for (const w of toolWords) {
          if (Math.abs(w.length - token.length) <= 1) {
            const dist = levenshtein(w, token);
            if (dist === 1) {
              score += 110;
              tokenMatched = true;
              break;
            } else if (dist === 2 && token.length >= 6) {
              score += 60;
              tokenMatched = true;
              break;
            }
          }
        }
      }

      if (tokenMatched) matchedTokenCount++;
    }

    // Heavy boost if ALL query tokens matched
    if (queryTokens.length > 1 && matchedTokenCount === queryTokens.length) {
      score += 400;
    }

    // Special intent boosts:
    // "pdf to word" / "word to pdf"
    if (normalized.includes('pdf') && normalized.includes('word')) {
      if (normalized.indexOf('pdf') < normalized.indexOf('word')) {
        if (tool.id === 'pdf-to-word') score += 1500;
      } else {
        if (tool.id === 'word-to-pdf') score += 1500;
      }
    }

    // "pdf to image" / "image to pdf"
    if (
      (normalized.includes('pdf') && normalized.includes('image')) ||
      (normalized.includes('pdf') && normalized.includes('jpg')) ||
      (normalized.includes('pdf') && normalized.includes('png'))
    ) {
      if (normalized.startsWith('pdf')) {
        if (tool.id === 'pdf-to-images') score += 1500;
      } else {
        if (tool.id === 'images-to-pdf') score += 1500;
      }
    }

    // "compress" queries
    if (normalized.startsWith('compress')) {
      if (normalized.includes('pdf') && tool.id === 'compress-pdf') score += 1000;
      if (normalized.includes('image') && tool.id === 'image-compressor') score += 1000;
      if (tool.id === 'compress-pdf' || tool.id === 'image-compressor') score += 300;
    }

    // "background" / "bg" queries
    if (normalized.includes('background') || normalized.includes('bg')) {
      if (tool.id === 'image-background-remover') score += 800;
      if (tool.id === 'image-background-changer') score += 600;
    }

    // "resize" queries
    if (normalized.includes('resize') || normalized.includes('page size')) {
      if (tool.id === 'normalize-pdf-page-size') score += 700;
      if (tool.id === 'image-resizer') score += 600;
      if (tool.id === 'image-cropper') score += 400;
    }

    // Popular tool slight bonus
    if (tool.popular) {
      score += 25;
    }

    if (score > 40) {
      results.push({
        tool,
        score,
        matchType,
      });
    }
  }

  // Sort descending by calculated score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, maxResults);
}

/**
 * Returns default recommended tools for empty search state
 */
export function getPopularTools(): ToolItem[] {
  const priorityIds = [
    'pdf-to-word',
    'compress-pdf',
    'image-compressor',
    'images-to-pdf',
    'image-background-remover',
    'ocr-pdf',
    'normalize-pdf-page-size',
    'image-converter',
  ];

  const tools: ToolItem[] = [];
  for (const id of priorityIds) {
    const found = TOOLS_LIST.find((t) => t.id === id);
    if (found) tools.push(found);
  }
  return tools;
}

/**
 * Segments text into matching and non-matching chunks for highlight rendering
 */
export function getHighlightedText(
  text: string,
  query: string
): { text: string; isMatch: boolean }[] {
  const normQuery = normalizeQuery(query);
  if (!normQuery) {
    return [{ text, isMatch: false }];
  }

  const queryWords = normQuery.split(/\s+/).filter((w) => w.length > 0);
  if (queryWords.length === 0) {
    return [{ text, isMatch: false }];
  }

  // Build regex matching any query words
  const escaped = queryWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${escaped})`, 'gi');

  const parts = text.split(regex);
  return parts
    .filter((p) => p.length > 0)
    .map((part) => ({
      text: part,
      isMatch: queryWords.some((w) => part.toLowerCase() === w.toLowerCase()),
    }));
}

/**
 * Formats categories into user-friendly group labels
 */
export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'page-tools':
    case 'organize':
      return 'PDF Tools';
    case 'optimize':
      return 'Compression & Optimize';
    case 'convert-to-pdf':
      return 'Convert to PDF';
    case 'convert-from-pdf':
      return 'Convert from PDF';
    case 'image-tools':
      return 'Image Tools';
    case 'design-tools':
      return 'Design Utilities';
    case 'student-tools':
      return 'Student Tools';
    case 'security':
      return 'Security & Privacy';
    case 'ocr':
      return 'OCR Recognition';
    case 'inspector':
      return 'Inspection & Compare';
    case 'utilities':
      return 'Everyday Utilities';
    default:
      return 'Tools';
  }
}
