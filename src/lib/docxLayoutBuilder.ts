import JSZip from 'jszip';
import type {
  DocumentLayoutAnalysis,
  AnalyzedPageLayout,
  VisualBlock,
  AnalyzedTextElement,
} from './pdfLayoutAnalyzer';

export type DocxConversionMode = 'layout-preserved' | 'exact-visual' | 'editable';

export interface DocxBuildOptions {
  mode: DocxConversionMode;
  preserveBoxes: boolean;
  preserveFonts: boolean;
  reconstructTables: boolean;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Builds an authentic, layout-preserved Microsoft Word (.docx) document
 * preserving exact visual structure, question badges, headings, callout boxes,
 * tables, diagrams (Food Pyramid), and page dimensions.
 */
export async function buildHighFidelityDocx(
  analysis: DocumentLayoutAnalysis,
  options: DocxBuildOptions = {
    mode: 'layout-preserved',
    preserveBoxes: true,
    preserveFonts: true,
    reconstructTables: true,
  }
): Promise<Blob> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // 3. word/styles.xml
  zip.folder('word')?.file(
    'styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:color w:val="0F172A"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:before="60" w:after="80" w:line="260" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
</w:styles>`
  );

  // 4. word/settings.xml
  zip.folder('word')?.file(
    'settings.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
</w:settings>`
  );

  // Document relationships
  const docRels: string[] = [
    `<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`,
    `<Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>`,
  ];

  let mediaCount = 0;
  const wordMediaFolder = zip.folder('word')?.folder('media');
  const bodyXmlParts: string[] = [];

  for (let pIdx = 0; pIdx < analysis.pages.length; pIdx++) {
    const page = analysis.pages[pIdx];

    // Page dimensions in twips (1 pt = 20 dxa)
    const pageW_dxa = Math.round(page.widthPt * 20);
    const pageH_dxa = Math.round(page.heightPt * 20);
    const isLandscape = page.orientation === 'landscape';

    // Exact Visual Mode: render entire page as pixel-perfect image
    if (options.mode === 'exact-visual' && page.pagePreviewUrl) {
      mediaCount++;
      const rId = `rIdImg${mediaCount}`;
      const imgFileName = `image_${mediaCount}.png`;

      const base64Data = page.pagePreviewUrl.split(',')[1];
      wordMediaFolder?.file(imgFileName, base64Data, { base64: true });

      docRels.push(
        `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${imgFileName}"/>`
      );

      const emuW = Math.round(page.widthPt * 12700);
      const emuH = Math.round(page.heightPt * 12700);

      bodyXmlParts.push(`
<w:p>
  <w:pPr>
    <w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>
    <w:jc w:val="center"/>
  </w:pPr>
  <w:r>
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="${emuW}" cy="${emuH}"/>
        <wp:docPr id="${mediaCount}" name="Page ${page.pageNumber}"/>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:nvPicPr>
                <pic:cNvPr id="${mediaCount}" name="Page ${page.pageNumber}"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rId}"/>
                <a:stretch><a:fillRect/></a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm><a:off x="0" y="0"/><a:ext cx="${emuW}" cy="${emuH}"/></a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>`);
    } else {
      // HYBRID LAYOUT-PRESERVED MODE:
      // Sequential rendering of visual blocks in exact top-to-bottom reading order!
      for (const block of page.visualBlocks) {
        if (block.type === 'heading_with_badge') {
          // Render badge + heading on the same line using a borderless badge table
          const badgeBg = block.badge?.bgColor || '2563EB';
          const badgeText = escapeXml(block.badge?.text || 'Q01');
          const headingText = escapeXml(block.headingText || '');
          const headingColor = block.headingColor || '0F172A';
          const headingHalfPts = Math.round((block.headingFontSize || 14) * 2);
          const headingFont = block.headingFontFamily || 'Arial';

          bodyXmlParts.push(`
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="0" w:type="auto"/>
    <w:tblBorders>
      <w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/>
      <w:insideH w:val="none"/><w:insideV w:val="none"/>
    </w:tblBorders>
    <w:tblCellMar>
      <w:top w:w="60" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/>
      <w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/>
    </w:tblCellMar>
  </w:tblPr>
  <w:tblGrid>
    <w:gridCol w:w="900"/>
    <w:gridCol w:w="${Math.round((page.widthPt - 120) * 20)}"/>
  </w:tblGrid>
  <w:tr>
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="900" w:type="dxa"/>
        <w:shd w:val="clear" w:color="auto" w:fill="${badgeBg}"/>
        <w:vAlign w:val="center"/>
      </w:tcPr>
      <w:p>
        <w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
            <w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="FFFFFF"/>
          </w:rPr>
          <w:t>${badgeText}</w:t>
        </w:r>
      </w:p>
    </w:tc>
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="${Math.round((page.widthPt - 120) * 20)}" w:type="dxa"/>
        <w:vAlign w:val="center"/>
      </w:tcPr>
      <w:p>
        <w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="${headingFont}" w:hAnsi="${headingFont}"/>
            <w:b/><w:sz w:val="${headingHalfPts}"/><w:szCs w:val="${headingHalfPts}"/>
            <w:color w:val="${headingColor}"/>
          </w:rPr>
          <w:t xml:space="preserve"> ${headingText}</w:t>
        </w:r>
      </w:p>
    </w:tc>
  </w:tr>
</w:tbl>
<w:p><w:pPr><w:spacing w:before="40" w:after="60"/></w:pPr></w:p>`);
        } else if (block.type === 'heading') {
          const headingText = escapeXml(block.headingText || '');
          const headingHalfPts = Math.round((block.headingFontSize || 14) * 2);
          const headingColor = block.headingColor || '0F172A';
          const headingFont = block.headingFontFamily || 'Arial';

          bodyXmlParts.push(`
<w:p>
  <w:pPr>
    <w:spacing w:before="120" w:after="60"/>
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:rFonts w:ascii="${headingFont}" w:hAnsi="${headingFont}"/>
      <w:b/><w:sz w:val="${headingHalfPts}"/><w:szCs w:val="${headingHalfPts}"/>
      <w:color w:val="${headingColor}"/>
    </w:rPr>
    <w:t>${headingText}</w:t>
  </w:r>
</w:p>`);
        } else if (block.type === 'callout_box' && block.box) {
          // Render callout box (e.g. Examples box) at its exact place in the flow
          const box = block.box;
          const boxWidthDxa = Math.min(
            Math.round(page.widthPt * 20 - 1440),
            Math.max(3000, Math.round(box.width * 20))
          );
          const borderColor = box.strokeColor || '93C5FD';
          const fillColor = box.fillColor || 'EFF6FF';

          // Format paragraphs inside the box
          let innerContent = '';
          if (box.enclosedTexts.length > 0) {
            // Group enclosed texts into lines
            const boxLines: AnalyzedTextElement[][] = [];
            const sortedBoxTexts = [...box.enclosedTexts].sort((a, b) => a.y - b.y || a.x - b.x);

            for (const t of sortedBoxTexts) {
              const lastLine = boxLines[boxLines.length - 1];
              if (!lastLine || Math.abs(t.y - lastLine[0].y) > 6) {
                boxLines.push([t]);
              } else {
                lastLine.push(t);
                lastLine.sort((a, b) => a.x - b.x);
              }
            }

            innerContent = boxLines
              .map((lineItems) => {
                const runsXml = lineItems
                  .map((t) => {
                    const sz = Math.round(t.fontSize * 2);
                    const isExampleLead = /^(examples?:|note:|caution:)/i.test(t.text.trim());
                    return `
<w:r>
  <w:rPr>
    <w:rFonts w:ascii="${t.fontFamily}" w:hAnsi="${t.fontFamily}"/>
    ${t.isBold || isExampleLead ? '<w:b/>' : ''}
    ${t.isItalic ? '<w:i/>' : ''}
    <w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>
    <w:color w:val="${t.color || '1E293B'}"/>
  </w:rPr>
  <w:t xml:space="preserve">${escapeXml(t.text)} </w:t>
</w:r>`;
                  })
                  .join('');

                return `
<w:p>
  <w:pPr><w:spacing w:before="40" w:after="40" w:line="240" w:lineRule="auto"/></w:pPr>
  ${runsXml}
</w:p>`;
              })
              .join('');
          } else {
            innerContent = `<w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:t> </w:t></w:r></w:p>`;
          }

          bodyXmlParts.push(`
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="${boxWidthDxa}" w:type="dxa"/>
    <w:tblBorders>
      <w:top w:val="single" w:sz="12" w:space="0" w:color="${borderColor}"/>
      <w:left w:val="single" w:sz="12" w:space="0" w:color="${borderColor}"/>
      <w:bottom w:val="single" w:sz="12" w:space="0" w:color="${borderColor}"/>
      <w:right w:val="single" w:sz="12" w:space="0" w:color="${borderColor}"/>
    </w:tblBorders>
    <w:tblCellMar>
      <w:top w:w="140" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/>
      <w:left w:w="180" w:type="dxa"/><w:right w:w="180" w:type="dxa"/>
    </w:tblCellMar>
  </w:tblPr>
  <w:tblGrid><w:gridCol w:w="${boxWidthDxa}"/></w:tblGrid>
  <w:tr>
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="${boxWidthDxa}" w:type="dxa"/>
        <w:shd w:val="clear" w:color="auto" w:fill="${fillColor}"/>
      </w:tcPr>
      ${innerContent}
    </w:tc>
  </w:tr>
</w:tbl>
<w:p><w:pPr><w:spacing w:before="60" w:after="80"/></w:pPr></w:p>`);
        } else if (block.type === 'diagram' && block.diagram) {
          // Embed the detected high-res diagram (e.g. Food Pyramid) directly at this location
          mediaCount++;
          const rId = `rIdImg${mediaCount}`;
          const imgFileName = `diagram_${mediaCount}.png`;

          const base64Data = block.diagram.dataUrl.split(',')[1];
          wordMediaFolder?.file(imgFileName, base64Data, { base64: true });

          docRels.push(
            `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${imgFileName}"/>`
          );

          const emuW = Math.round(block.diagram.width * 12700);
          const emuH = Math.round(block.diagram.height * 12700);

          bodyXmlParts.push(`
<w:p>
  <w:pPr>
    <w:spacing w:before="120" w:after="120"/>
    <w:jc w:val="center"/>
  </w:pPr>
  <w:r>
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="${emuW}" cy="${emuH}"/>
        <wp:docPr id="${mediaCount}" name="${escapeXml(block.diagram.title || 'Diagram')}"/>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:nvPicPr>
                <pic:cNvPr id="${mediaCount}" name="${escapeXml(block.diagram.title || 'Diagram')}"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rId}"/>
                <a:stretch><a:fillRect/></a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm><a:off x="0" y="0"/><a:ext cx="${emuW}" cy="${emuH}"/></a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>`);
        } else if (block.type === 'list' && block.lines) {
          // Render formatted list item
          for (const line of block.lines) {
            const lineText = line.text;
            const match = lineText.match(/^(\d+[\.\)]|[•\-\*])\s+(.*)$/);
            const marker = match ? match[1] : '•';
            const content = match ? match[2] : lineText;

            // Check if there is a bold title prefix (e.g. "Balanced Diet:")
            const colonMatch = content.match(/^([^:]+:)\s*(.*)$/);
            const leadBold = colonMatch ? colonMatch[1] : '';
            const restText = colonMatch ? colonMatch[2] : content;

            bodyXmlParts.push(`
<w:p>
  <w:pPr>
    <w:spacing w:before="40" w:after="40" w:line="260" w:lineRule="auto"/>
    <w:ind w:left="420" w:hanging="280"/>
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:b/><w:color w:val="2563EB"/>
    </w:rPr>
    <w:t xml:space="preserve">${escapeXml(marker)} </w:t>
  </w:r>
  ${
    leadBold
      ? `<w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t xml:space="preserve">${escapeXml(leadBold)} </w:t></w:r>`
      : ''
  }
  <w:r>
    <w:rPr>
      <w:color w:val="${line.color || '334155'}"/>
    </w:rPr>
    <w:t xml:space="preserve">${escapeXml(restText)}</w:t>
  </w:r>
</w:p>`);
          }
        } else if (block.lines) {
          // Regular paragraph
          for (const line of block.lines) {
            const runsXml = line.items
              .map((t) => {
                const sz = Math.round(t.fontSize * 2);
                return `
<w:r>
  <w:rPr>
    <w:rFonts w:ascii="${t.fontFamily}" w:hAnsi="${t.fontFamily}"/>
    ${t.isBold ? '<w:b/>' : ''}
    ${t.isItalic ? '<w:i/>' : ''}
    <w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>
    <w:color w:val="${t.color || '1E293B'}"/>
  </w:rPr>
  <w:t xml:space="preserve">${escapeXml(t.text)} </w:t>
</w:r>`;
              })
              .join('');

            bodyXmlParts.push(`
<w:p>
  <w:pPr>
    <w:jc w:val="${line.align || 'left'}"/>
    <w:spacing w:before="40" w:after="50" w:line="260" w:lineRule="auto"/>
  </w:pPr>
  ${runsXml}
</w:p>`);
          }
        }
      }
    }

    // Section properties (<w:sectPr>) for exact page size and orientation
    const isLastPage = pIdx === analysis.pages.length - 1;
    const topMarginDxa = Math.round(page.margins.top * 20);
    const bottomMarginDxa = Math.round(page.margins.bottom * 20);
    const leftMarginDxa = Math.round(page.margins.left * 20);
    const rightMarginDxa = Math.round(page.margins.right * 20);

    const sectPrXml = `
<w:sectPr>
  <w:pgSz w:w="${pageW_dxa}" w:h="${pageH_dxa}" w:orient="${isLandscape ? 'landscape' : 'portrait'}"/>
  <w:pgMar w:top="${topMarginDxa}" w:right="${rightMarginDxa}" w:bottom="${bottomMarginDxa}" w:left="${leftMarginDxa}" w:header="360" w:footer="360" w:gutter="0"/>
</w:sectPr>`;

    if (!isLastPage) {
      bodyXmlParts.push(`<w:p><w:pPr>${sectPrXml}</w:pPr></w:p>`);
    } else {
      bodyXmlParts.push(sectPrXml);
    }
  }

  // 5. Build word/document.xml
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${bodyXmlParts.join('\n')}
  </w:body>
</w:document>`;

  zip.folder('word')?.file('document.xml', documentXml);

  // 6. word/_rels/document.xml.rels
  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${docRels.join('\n  ')}
</Relationships>`;

  zip.folder('word')?.folder('_rels')?.file('document.xml.rels', relsXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
}
