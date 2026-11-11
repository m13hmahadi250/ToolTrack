import fs from 'fs';
import path from 'path';
import { TOOLS_LIST } from '../src/data/toolsList';
import {
  SITE_CONFIG,
  getToolSeo,
  CATEGORIES_SEO,
  escapeXml,
  injectSeoIntoHtml,
} from '../src/data/seoRegistry';

/**
 * ToolTrack Sitemap, Robots.txt & Static Route Metadata Prerenderer
 * 1. Synchronizes public/sitemap.xml and public/robots.txt from the live TOOLS_LIST registry.
 * 2. When dist/index.html exists (post-vite build), prerenders route-specific static HTML
 *    files with initial Open Graph, Twitter Card, Canonical, and Schema.org metadata so
 *    social crawlers (WhatsApp, Telegram, LinkedIn, Discord, X) receive accurate previews
 *    without executing client-side JavaScript.
 */
const BASE_URL = SITE_CONFIG.url;

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
  routePath: string;
  lastmod: string;
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
  const entries: SitemapEntry[] = [];
  const seenLocs = new Set<string>();

  // 1. Root / Homepage
  const homeLoc = `${BASE_URL}/`;
  entries.push({
    loc: homeLoc,
    routePath: '/',
    lastmod: SITE_CONFIG.lastModifiedUpdated,
    sortRank: 0,
    label: 'Home Page',
  });
  seenLocs.add(homeLoc);

  // 2. Primary Flagship Routes (/compiler and /whiteboard)
  const flagshipIds = ['compiler', 'whiteboard'];
  for (const fid of flagshipIds) {
    const seo = getToolSeo(fid);
    const routePath = seo.route.startsWith('/') ? seo.route : `/${seo.route}`;
    const loc = `${BASE_URL}${routePath}`;
    if (!seenLocs.has(loc)) {
      seenLocs.add(loc);
      entries.push({
        loc,
        routePath,
        lastmod: SITE_CONFIG.lastModifiedUpdated,
        sortRank: 5,
        label: `Flagship: ${seo.name}`,
      });
    }
  }

  // 3. Public Category Hub Pages
  const categoryValues = Object.values(CATEGORIES_SEO);
  for (const cat of categoryValues) {
    const catLoc = `${BASE_URL}${cat.route}`;
    if (!seenLocs.has(catLoc)) {
      seenLocs.add(catLoc);
      entries.push({
        loc: catLoc,
        routePath: cat.route,
        lastmod: cat.key === 'utilities' ? SITE_CONFIG.lastModifiedUpdated : SITE_CONFIG.lastModifiedDefault,
        sortRank: 10,
        label: `Category: ${cat.name}`,
      });
    }
  }

  // 4. Process TOOLS_LIST
  let excludedCount = 0;
  const verifiedTools = [];

  for (const tool of TOOLS_LIST) {
    if (!tool.id || typeof tool.id !== 'string' || tool.id.trim() === '') {
      console.warn(`[WARN] Skipping tool with missing or invalid ID:`, tool);
      continue;
    }

    if (
      EXCLUDED_TOOL_IDS.has(tool.id) ||
      tool.id.startsWith('test-') ||
      tool.id.startsWith('internal-')
    ) {
      excludedCount++;
      continue;
    }

    const seo = getToolSeo(tool.id);
    const toolRoute = seo.route.startsWith('/') ? seo.route : `/${seo.route}`;
    const toolLoc = `${BASE_URL}${toolRoute}`;

    if (!toolLoc.startsWith(`${BASE_URL}/`)) {
      console.warn(`[WARN] Tool ${tool.id} generated non-standard URL: ${toolLoc}`);
      continue;
    }

    verifiedTools.push(tool);

    if (!seenLocs.has(toolLoc)) {
      seenLocs.add(toolLoc);
      entries.push({
        loc: toolLoc,
        routePath: toolRoute,
        lastmod:
          tool.id === 'compiler' || tool.id === 'whiteboard'
            ? SITE_CONFIG.lastModifiedUpdated
            : SITE_CONFIG.lastModifiedDefault,
        sortRank: tool.popular ? 20 : 30,
        label: `Tool: ${tool.name}`,
      });
    }
  }

  // 5. Sort entries logically
  entries.sort((a, b) => {
    if (a.sortRank !== b.sortRank) {
      return a.sortRank - b.sortRank;
    }
    return a.label.localeCompare(b.label);
  });

  // 6. Construct strict, valid XML without fabricated priority/changefreq values
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
 * Prerenders static route HTML files into dist/ so social preview crawlers
 * receive route-specific Open Graph & Twitter tags in the initial HTTP response.
 */
function prerenderDistRouteHtmlFiles(distDir: string, entries: SitemapEntry[]) {
  const distIndexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(distIndexPath)) {
    return 0;
  }

  const baseTemplate = fs.readFileSync(distIndexPath, 'utf-8');
  // Ensure root dist/index.html also has homepage metadata injected cleanly
  fs.writeFileSync(distIndexPath, injectSeoIntoHtml(baseTemplate, '/'), 'utf-8');

  let prerenderedCount = 1;
  for (const entry of entries) {
    if (entry.routePath === '/') continue;
    const relativeRoute = entry.routePath.replace(/^\/+/, '').replace(/\/+$/, '');
    if (!relativeRoute) continue;

    const routeHtml = injectSeoIntoHtml(baseTemplate, entry.routePath);

    // Write dist/<route>/index.html
    const routeDir = path.join(distDir, relativeRoute);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(path.join(routeDir, 'index.html'), routeHtml, 'utf-8');

    // Also write dist/<route>.html for cleanUrls compatibility
    const parentDir = path.dirname(path.join(distDir, `${relativeRoute}.html`));
    fs.mkdirSync(parentDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, `${relativeRoute}.html`), routeHtml, 'utf-8');

    prerenderedCount++;
  }

  return prerenderedCount;
}

function main() {
  console.log('====================================================');
  console.log('  ToolTrack Sitemap & Static SEO Prerender Pipeline');
  console.log('====================================================');

  const { xml, totalTools, totalUrls, excludedCount, entries } = generateStaticSitemap();

  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    throw new Error('Malformed XML: Missing XML declaration header.');
  }
  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    throw new Error('Malformed XML: Missing standard sitemaps.org schema namespace.');
  }

  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf-8');
  console.log(`[OK] Generated: ${sitemapPath} (${totalUrls} unique URLs)`);

  const robotsPath = path.join(publicDir, 'robots.txt');
  const robotsTxt = `# ToolTrack Robots Configuration
# https://tooltracker.vercel.app/robots.txt

User-agent: *
Allow: /
Allow: /compiler
Allow: /whiteboard
Allow: /tools/
Allow: /category/
Allow: /og/
Allow: /assets/
Disallow: /api/

User-agent: Googlebot
Allow: /
Allow: /compiler
Allow: /whiteboard
Allow: /tools/
Allow: /category/
Allow: /og/
Allow: /assets/
Disallow: /api/

User-agent: Googlebot-Image
Allow: /og/
Allow: /og/tooltrack-social-preview-v3.png
Allow: /og/tooltrack-compiler-preview-v3.png
Allow: /og-tooltrack.png
Allow: /og-compiler.png
Allow: /assets/
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
  fs.writeFileSync(robotsPath, robotsTxt, 'utf-8');
  console.log(`[OK] Verified: ${robotsPath}`);

  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf-8');
    fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf-8');
    const prerenderedCount = prerenderDistRouteHtmlFiles(distDir, entries);
    console.log(
      `[OK] Synchronized sitemap.xml, robots.txt, and prerendered ${prerenderedCount} route HTML files in dist/`
    );
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
