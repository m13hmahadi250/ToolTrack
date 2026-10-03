import fs from 'fs';
import path from 'path';
import { TOOLS_LIST } from '../src/data/toolsList';
import { getToolSeo, CATEGORIES_SEO, escapeXml } from '../src/data/seoRegistry';

/**
 * ToolTrack Sitemap Generator
 * Synchronizes public/sitemap.xml from the live TOOLS_LIST registry
 */
const BASE_URL = 'https://tooltracker.vercel.app';

// Set of internal / non-public tool IDs or patterns to exclude if any
const EXCLUDED_TOOL_IDS = new Set<string>([
  'admin',
  'debug',
  'test',
  'internal',
  'api',
  'preview',
]);

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
  sortRank: number;
  label: string;
}

export function generateStaticSitemap(): {
  xml: string;
  totalTools: number;
  totalUrls: number;
  excludedCount: number;
  entries: SitemapEntry[];
} {
  const currentDate = new Date().toISOString().split('T')[0];
  const entries: SitemapEntry[] = [];
  const seenLocs = new Set<string>();

  // 1. Root / Homepage
  const homeLoc = `${BASE_URL}/`;
  entries.push({
    loc: homeLoc,
    lastmod: currentDate,
    changefreq: 'daily',
    priority: '1.0',
    sortRank: 0,
    label: 'Home Page',
  });
  seenLocs.add(homeLoc);

  // 2. Public Category Hub Pages
  const categoryValues = Object.values(CATEGORIES_SEO);
  for (const cat of categoryValues) {
    const catLoc = `${BASE_URL}${cat.route}`;
    if (!seenLocs.has(catLoc)) {
      seenLocs.add(catLoc);
      entries.push({
        loc: catLoc,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: '0.9',
        sortRank: 10,
        label: `Category: ${cat.name}`,
      });
    }
  }

  // 3. Process TOOLS_LIST
  let excludedCount = 0;
  const verifiedTools = [];

  for (const tool of TOOLS_LIST) {
    // Verify tool ID and ensure it is non-empty and public
    if (!tool.id || typeof tool.id !== 'string' || tool.id.trim() === '') {
      console.warn(`[WARN] Skipping tool with missing or invalid ID:`, tool);
      continue;
    }

    // Exclude internal, test, or draft IDs
    if (EXCLUDED_TOOL_IDS.has(tool.id) || tool.id.startsWith('test-') || tool.id.startsWith('internal-')) {
      excludedCount++;
      continue;
    }

    const seo = getToolSeo(tool.id);
    const toolRoute = seo.route.startsWith('/') ? seo.route : `/${seo.route}`;
    const toolLoc = `${BASE_URL}${toolRoute}`;

    // Verify valid canonical format (no hash, no query params, HTTPS production base)
    if (!toolLoc.startsWith(`${BASE_URL}/`)) {
      console.warn(`[WARN] Tool ${tool.id} generated non-standard URL: ${toolLoc}`);
      continue;
    }

    if (!seenLocs.has(toolLoc)) {
      seenLocs.add(toolLoc);
      verifiedTools.push(tool);
      entries.push({
        loc: toolLoc,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: tool.popular ? '0.85' : '0.8',
        sortRank: tool.popular ? 20 : 30,
        label: `Tool: ${tool.name}`,
      });
    }
  }

  // 4. Sort entries logically:
  // - Level 0: Homepage (rank 0)
  // - Level 1: Categories (rank 10, sorted by route)
  // - Level 2: Popular Tools (rank 20, alphabetical by name)
  // - Level 3: Standard Tools (rank 30, alphabetical by name)
  entries.sort((a, b) => {
    if (a.sortRank !== b.sortRank) {
      return a.sortRank - b.sortRank;
    }
    return a.label.localeCompare(b.label);
  });

  // 5. Construct strict, formatted XML
  const xmlBody = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlBody}
</urlset>`;

  return {
    xml,
    totalTools: verifiedTools.length,
    totalUrls: entries.length,
    excludedCount,
    entries,
  };
}

/**
 * Main execution function for npm run build / build pipelines
 */
function main() {
  console.log('====================================================');
  console.log('  ToolTrack Dynamic XML Sitemap Build Generator');
  console.log('====================================================');

  const { xml, totalTools, totalUrls, excludedCount } = generateStaticSitemap();

  // Validate strict XML format
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    throw new Error('Malformed XML: Missing XML declaration header.');
  }
  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    throw new Error('Malformed XML: Missing standard sitemaps.org schema namespace.');
  }

  // Write to public/
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf-8');
  console.log(`[OK] Generated: ${sitemapPath} (${totalUrls} unique URLs)`);

  // Ensure public/robots.txt points to this sitemap
  const robotsPath = path.join(publicDir, 'robots.txt');
  const robotsTxt = `# ToolTrack Robots Configuration
# https://tooltracker.vercel.app/robots.txt

User-agent: *
Allow: /
Allow: /tools/
Allow: /category/
Allow: /assets/

User-agent: Googlebot
Allow: /
Allow: /tools/
Allow: /category/
Allow: /assets/

User-agent: Googlebot-Image
Allow: /assets/
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
  fs.writeFileSync(robotsPath, robotsTxt, 'utf-8');
  console.log(`[OK] Verified: ${robotsPath}`);

  // Also sync to dist/ if building
  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf-8');
    fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf-8');
    console.log(`[OK] Synchronized sitemap.xml and robots.txt to dist/`);
  }

  console.log('----------------------------------------------------');
  console.log(`  Summary:`);
  console.log(`  - Total public tools discovered: ${totalTools}`);
  console.log(`  - Total sitemap URLs indexed: ${totalUrls}`);
  console.log(`  - Excluded internal/private routes: ${excludedCount}`);
  console.log(`  - Base Production URL: ${BASE_URL}`);
  console.log('====================================================');
}

main();
