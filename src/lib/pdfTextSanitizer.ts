import type { PDFPage, PDFFont, RGB, Color } from 'pdf-lib';

/**
 * Windows-1252 / WinAnsi code points supported by pdf-lib standard fonts (Helvetica, Times, Courier)
 * Standard ASCII: 0x20 to 0x7E, plus tab (0x09), newline (0x0A), carriage return (0x0D)
 * Latin-1 Supplement: 0xA0 to 0xFF
 * Additional Windows-1252 characters mapped into WinAnsi:
 */
const WIN_ANSI_EXTRA_CODES = new Set([
  0x20AC, // Euro (€)
  0x201A, // Single low-9 quotation mark (‚)
  0x0192, // Latin small letter f with hook (ƒ)
  0x201E, // Double low-9 quotation mark („)
  0x2026, // Horizontal ellipsis (…)
  0x2020, // Dagger (†)
  0x2021, // Double dagger (‡)
  0x02C6, // Modifier letter circumflex accent (ˆ)
  0x2030, // Per mille sign (‰)
  0x0160, // Latin capital letter S with caron (Š)
  0x2039, // Single left-pointing angle quotation mark (‹)
  0x0152, // Latin capital ligature OE (Œ)
  0x017D, // Latin capital letter Z with caron (Ž)
  0x2018, // Left single quotation mark (‘)
  0x2019, // Right single quotation mark (’)
  0x201C, // Left double quotation mark (“)
  0x201D, // Right double quotation mark (”)
  0x2022, // Bullet (•)
  0x2013, // En dash (–)
  0x2014, // Em dash (—)
  0x02DC, // Small tilde (˜)
  0x2122, // Trade mark sign (™)
  0x0161, // Latin small letter s with caron (š)
  0x203A, // Single right-pointing angle quotation mark (›)
  0x0153, // Latin small ligature oe (œ)
  0x017E, // Latin small letter z with caron (ž)
  0x0178, // Latin capital letter Y with diaeresis (Ÿ)
]);

/**
 * Tests whether a Unicode code point can be safely encoded by pdf-lib's WinAnsi encoder.
 */
export function isWinAnsiCodePoint(code: number): boolean {
  if (code >= 0x20 && code <= 0x7e) return true; // Standard ASCII printable
  if (code >= 0xa0 && code <= 0xff) return true; // Latin-1 Supplement
  if (code === 0x09 || code === 0x0a || code === 0x0d) return true; // Standard whitespace
  return WIN_ANSI_EXTRA_CODES.has(code);
}

/**
 * Sanitizes any text string to guarantee that pdf-lib will NEVER throw:
 * "WinAnsi cannot encode ..." (e.g. 0x1f4de telephone emoji 📞, etc.)
 *
 * 1. Converts known communication, status, and document emojis into clean textual representations.
 * 2. Normalizes non-ASCII punctuation (curly quotes, dashes, bullets).
 * 3. Strips zero-width formatting characters.
 * 4. Filters out any remaining unencodable Unicode code points safely.
 */
export function sanitizePdfText(input: string | null | undefined): string {
  if (!input) return '';

  let str = String(input);

  // 1. Convert common emojis to clean readable text labels
  str = str
    // Telephone & Mobile (including 0x1f4de 📞)
    .replace(/[\u{1F4DE}\u{260E}\u{2706}]/gu, '[Tel] ')
    .replace(/[\u{1F4F1}\u{1F4F2}]/gu, '[Mobile] ')
    .replace(/[\u{1F4DF}]/gu, '[Pager] ')
    .replace(/[\u{1F4E0}]/gu, '[Fax] ')

    // Email & Messaging
    .replace(/[\u{2709}\u{1F4E7}\u{1F4E8}\u{1F4E9}\u{1F582}\u{1F583}]/gu, '[Email] ')
    .replace(/[\u{1F4AC}\u{1F4AD}\u{1F5E8}]/gu, '[Msg] ')

    // Web & Links
    .replace(/[\u{1F310}\u{1F517}]/gu, '[Web] ')

    // Personal & Academic & Office
    .replace(/[\u{1F464}\u{1F465}]/gu, '[User] ')
    .replace(/[\u{1F393}]/gu, '[Edu] ')
    .replace(/[\u{1F4C4}\u{1F4DD}\u{1F4CB}\u{1F5CE}]/gu, '[Doc] ')
    .replace(/[\u{1F4C1}\u{1F4C2}]/gu, '[Folder] ')
    .replace(/[\u{1F4CA}\u{1F4C8}\u{1F4C9}]/gu, '[Chart] ')
    .replace(/[\u{1F4C5}\u{1F4C6}\u{1F5D3}]/gu, '[Date] ')
    .replace(/[\u{23F0}\u{231A}\u{23F3}\u{231B}]/gu, '[Time] ')
    .replace(/[\u{1F4CD}\u{1F4CC}]/gu, '[Location] ')
    .replace(/[\u{1F3E0}\u{1F3E2}]/gu, '[Address] ')

    // Checkmarks, Warnings & Status
    .replace(/[\u{2705}\u{2714}\u{2713}]/gu, '[OK] ')
    .replace(/[\u{274C}\u{274E}\u{2716}\u{2715}]/gu, '[X] ')
    .replace(/[\u{26A0}\u{26A1}]/gu, '[!] ')
    .replace(/[\u{2139}]/gu, '[i] ')
    .replace(/[\u{2B50}\u{2B51}\u{2605}\u{2606}\u{2728}]/gu, '* ')
    .replace(/[\u{1F44D}]/gu, '[+1] ')
    .replace(/[\u{1F44E}]/gu, '[-1] ')

    // Math & Arrows
    .replace(/[\u{2264}]/gu, '<=')
    .replace(/[\u{2265}]/gu, '>=')
    .replace(/[\u{2260}]/gu, '!=')
    .replace(/[\u{2192}\u{279C}\u{2794}]/gu, '->')
    .replace(/[\u{2190}]/gu, '<-')
    .replace(/[\u{2194}]/gu, '<->')
    .replace(/[\u{25AA}\u{25AB}\u{25CF}\u{25CB}\u{25B6}\u{25C0}]/gu, '• ')

    // Strip zero-width and invisible control characters
    .replace(/[\u{200B}-\u{200F}\u{202A}-\u{202E}\u{FEFF}\u{FFF9}-\u{FFFF}]/gu, '');

  // 2. Character-by-character validation against WinAnsi code points
  let sanitized = '';
  for (const char of str) {
    const code = char.codePointAt(0);
    if (code !== undefined && isWinAnsiCodePoint(code)) {
      sanitized += char;
    } else {
      // If code point cannot be encoded in WinAnsi, substitute with space
      sanitized += ' ';
    }
  }

  return sanitized;
}

/**
 * Safely calculates text width using a pdf-lib font without crashing on unencodable characters.
 */
export function safeWidthOfTextAtSize(font: PDFFont, text: string, size: number): number {
  const clean = sanitizePdfText(text);
  try {
    return font.widthOfTextAtSize(clean, size);
  } catch {
    // Ultimate fallback: calculate using ASCII-only representation
    const ascii = clean.replace(/[^\x20-\x7E]/g, ' ');
    return font.widthOfTextAtSize(ascii, size);
  }
}

/**
 * Safely draws text onto a pdf-lib PDFPage, automatically sanitizing any emojis
 * or unencodable Unicode characters to prevent "WinAnsi cannot encode" errors.
 */
export function safeDrawText(
  page: PDFPage,
  text: string,
  options: {
    x?: number;
    y?: number;
    size?: number;
    font?: PDFFont;
    color?: Color | RGB;
    opacity?: number;
    rotate?: any;
    xScale?: number;
    yScale?: number;
    lineHeight?: number;
    maxWidth?: number;
    wordBreaks?: string[];
  }
): void {
  const cleanText = sanitizePdfText(text);
  try {
    page.drawText(cleanText, options);
  } catch (err) {
    // If standard font still rejects a character, strip all non-ASCII printable chars
    const pureAscii = cleanText.replace(/[^\x20-\x7E\t\n\r]/g, ' ');
    try {
      page.drawText(pureAscii, options);
    } catch {
      // Graceful failover to prevent whole document generation failure
      console.warn('[PDF Text Sanitizer] Failed to draw text segment:', text, err);
    }
  }
}
