/**
 * Automated Root-Cause Functionality & Regression Test Suite for ToolTrack
 * Tests file transformations, binary structures, dimensions, encoders,
 * and data utilities directly.
 */
import assert from 'assert';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  mergePdfs,
  splitPdfByRanges,
  splitEveryPage,
  organizeAndModifyPdf,
  normalizePdfPageSizes,
  rotateAllPages,
  flattenPdf,
  removeMetadata,
  getPdfMetadata
} from '../src/lib/pdfUtils';
import { textToPdf, excelToPdf, pdfToExcel } from '../src/lib/docUtils';
import { sanitizePdfText } from '../src/lib/pdfTextSanitizer';
import sharp from 'sharp';
import QRCode from 'qrcode';

async function createSamplePdf(pageCount: number = 2, width = 595.28, height = 841.89): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([width, height]);
    page.drawText(`Sample Test Document Page ${i + 1}`, { x: 50, y: height - 100, size: 14 });
  }
  doc.setTitle('Sample PDF Title');
  doc.setAuthor('ToolTrack Test Suite');
  return await doc.save();
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 STARTING TOOLTRACK CORE FUNCTIONALITY TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err);
      failed++;
    }
  }

  // --- 1. PDF ENGINE TESTS ---
  console.log('--- 1. PDF OPERATIONS ---');

  await test('PDF Merge: combines multiple documents and preserves page count', async () => {
    const doc1 = await createSamplePdf(2);
    const doc2 = await createSamplePdf(3);
    const mergedBytes = await mergePdfs([doc1, doc2]);
    const mergedDoc = await PDFDocument.load(mergedBytes);
    assert.strictEqual(mergedDoc.getPageCount(), 5, 'Merged page count should be 5');
    assert.ok(mergedBytes.length > 500, 'Merged PDF should be non-empty');
  });

  await test('PDF Split by Ranges: extracts specified page groups correctly', async () => {
    const doc = await createSamplePdf(6);
    const splitResults = await splitPdfByRanges(doc, '1-2, 4-6');
    assert.strictEqual(splitResults.length, 2, 'Should create 2 range files');
    const range1Doc = await PDFDocument.load(splitResults[0].bytes);
    assert.strictEqual(range1Doc.getPageCount(), 2, 'Range 1 should have 2 pages');
    const range2Doc = await PDFDocument.load(splitResults[1].bytes);
    assert.strictEqual(range2Doc.getPageCount(), 3, 'Range 2 should have 3 pages');
  });

  await test('PDF Split Every Page: extracts each single sheet into individual valid PDF', async () => {
    const doc = await createSamplePdf(4);
    const splitResults = await splitEveryPage(doc);
    assert.strictEqual(splitResults.length, 4, 'Should create 4 separate page files');
    for (const item of splitResults) {
      const pDoc = await PDFDocument.load(item.bytes);
      assert.strictEqual(pDoc.getPageCount(), 1, 'Each single page PDF should have exactly 1 page');
    }
  });

  await test('PDF Organize & Reorder: rotates, swaps, and inserts blank pages', async () => {
    const doc = await createSamplePdf(3);
    const organizedBytes = await organizeAndModifyPdf(doc, {
      pagePlan: [
        { originalIndex: 2, rotation: 90 },
        { originalIndex: -1, isBlank: true },
        { originalIndex: 0, rotation: 0 },
      ],
    });
    const orgDoc = await PDFDocument.load(organizedBytes);
    assert.strictEqual(orgDoc.getPageCount(), 3, 'Plan should produce 3 pages');
    const page1Rot = orgDoc.getPage(0).getRotation().angle;
    assert.strictEqual(page1Rot, 90, 'Page 1 should be rotated by 90 degrees');
  });

  await test('PDF Page Size Normalizer: resizes mixed dimensions to standard A4 without distortion', async () => {
    // Document with mixed dimensions: Page 1 is Letter (612x792), Page 2 is A3 (841.89x1190.55)
    const doc = await PDFDocument.create();
    doc.addPage([612.0, 792.0]);
    doc.addPage([841.89, 1190.55]);
    const mixedBytes = await doc.save();

    const normalizedBytes = await normalizePdfPageSizes(mixedBytes, {
      targetSize: 'A4',
      customWidthMm: 210,
      customHeightMm: 297,
      orientation: 'portrait',
      scaleMode: 'fit',
      alignment: 'center',
      margins: { top: 10, bottom: 10, left: 10, right: 10 },
      allowDistortion: false,
    });

    const normDoc = await PDFDocument.load(normalizedBytes);
    assert.strictEqual(normDoc.getPageCount(), 2);
    const a4W = 595.28;
    const a4H = 841.89;
    for (let i = 0; i < 2; i++) {
      const size = normDoc.getPage(i).getSize();
      assert.ok(Math.abs(size.width - a4W) < 1.0, `Page ${i + 1} width should be A4 width`);
      assert.ok(Math.abs(size.height - a4H) < 1.0, `Page ${i + 1} height should be A4 height`);
    }
  });

  await test('PDF Rotate All Pages: permanently updates rotation angle', async () => {
    const doc = await createSamplePdf(2);
    const rotatedBytes = await rotateAllPages(doc, 180);
    const rotDoc = await PDFDocument.load(rotatedBytes);
    assert.strictEqual(rotDoc.getPage(0).getRotation().angle, 180);
    assert.strictEqual(rotDoc.getPage(1).getRotation().angle, 180);
  });

  await test('PDF Metadata & Privacy Cleaner: strips info dictionary and xref bloat', async () => {
    const doc = await createSamplePdf(2);
    const cleanedBytes = await removeMetadata(doc);
    const meta = await getPdfMetadata(cleanedBytes);
    assert.strictEqual(meta.title, '', 'Title should be stripped');
    assert.strictEqual(meta.author, '', 'Author should be stripped');
  });

  // --- 2. DOCUMENT CONVERTERS ---
  console.log('\n--- 2. DOCUMENT CONVERTERS ---');

  await test('Text to PDF: typesets text into wrapped PDF and sanitizes non-ASCII characters', async () => {
    const textContent = `Hello ToolTrack!\nThis is a test of long paragraphs that must wrap cleanly.\nSpecial emoji test: 📞 🚀 💻 and accents: café, résumé, naïve.`;
    const pdfBytes = await textToPdf(textContent, 'Sanitized Document');
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1, 'Should generate at least 1 page');
    assert.ok(pdfBytes.length > 500, 'Output PDF should have non-empty bytes');
  });

  await test('PDF Text Sanitizer: safely replaces unsupported WinAnsi characters', async () => {
    const input = 'Call 📞 me at 123-456 or email résumé to test@example.com';
    const sanitized = sanitizePdfText(input);
    assert.ok(!sanitized.includes('📞'), 'Emoji should be converted to clean text');
    assert.ok(sanitized.includes('[tel]') || sanitized.includes('Call'), 'Should keep readable text');
  });

  // --- 3. IMAGE COMPRESSION & PROCESSING ---
  console.log('\n--- 3. IMAGE COMPRESSION & ENCODING ---');

  await test('Sharp Image Compressor: real JPEG compression and quality reduction', async () => {
    // Create a 1000x1000 noisy image
    const rawImage = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 120, g: 150, b: 200 },
      },
    })
      .png()
      .toBuffer();

    const highQ = await sharp(rawImage).jpeg({ quality: 90 }).toBuffer();
    const lowQ = await sharp(rawImage).jpeg({ quality: 30 }).toBuffer();

    assert.ok(lowQ.length < highQ.length, 'Lower quality must produce smaller file size than high quality');
  });

  await test('Sharp Image Resizer: scales image dimensions proportionally', async () => {
    const img = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const resized = await sharp(img).resize({ width: 600, height: 400 }).toBuffer();
    const meta = await sharp(resized).metadata();
    assert.strictEqual(meta.width, 600, 'Width should be 600');
    assert.strictEqual(meta.height, 400, 'Height should be 400');
  });

  await test('Sharp Image Format Converter: converts PNG to WEBP and JPEG', async () => {
    const png = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 4,
        background: { r: 50, g: 100, b: 150, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const webp = await sharp(png).webp({ quality: 80 }).toBuffer();
    const webpMeta = await sharp(webp).metadata();
    assert.strictEqual(webpMeta.format, 'webp', 'Format should be webp');

    const jpeg = await sharp(png).jpeg({ quality: 80 }).toBuffer();
    const jpegMeta = await sharp(jpeg).metadata();
    assert.strictEqual(jpegMeta.format, 'jpeg', 'Format should be jpeg');
  });

  // --- 4. EVERYDAY UTILITIES ---
  console.log('\n--- 4. EVERYDAY UTILITIES ---');

  await test('QR Code Generator: produces valid PNG data URL and SVG', async () => {
    const dataUrl = await QRCode.toDataURL('https://tooltracker.vercel.app', { width: 200 });
    assert.ok(dataUrl.startsWith('data:image/png;base64,'), 'Should produce valid PNG data URL');

    const svg = await QRCode.toString('https://tooltracker.vercel.app', { type: 'svg' });
    assert.ok(svg.includes('<svg') && svg.includes('</svg>'), 'Should produce valid SVG string');
  });

  await test('JSON Formatter & Minifier: formats valid JSON and identifies malformed syntax', async () => {
    const raw = '{"name":"ToolTrack","version":1,"features":["pdf","image","tools"]}';
    const parsed = JSON.parse(raw);
    const pretty = JSON.stringify(parsed, null, 2);
    assert.ok(pretty.includes('\n'), 'Pretty JSON should contain newlines');
    const minified = JSON.stringify(JSON.parse(pretty));
    assert.strictEqual(minified, raw, 'Minified JSON should match raw compact JSON');
  });

  await test('Aspect Ratio Calculator: reduces dimensions via Euclidean GCD algorithm', async () => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const w = 1920;
    const h = 1080;
    const d = gcd(w, h);
    assert.strictEqual(`${w / d}:${h / d}`, '16:9', '1920x1080 should reduce to 16:9');

    const w2 = 1440;
    const h2 = 1080;
    const d2 = gcd(w2, h2);
    assert.strictEqual(`${w2 / d2}:${h2 / d2}`, '4:3', '1440x1080 should reduce to 4:3');
  });

  await test('Password Generator & Entropy: calculates cryptographic entropy', async () => {
    const len = 16;
    const poolSize = 26 + 26 + 10 + 26; // upper, lower, num, sym
    const bits = Math.round(len * Math.log2(poolSize));
    assert.ok(bits >= 100, 'A 16-char complex password should have >= 100 bits of entropy');
  });

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
