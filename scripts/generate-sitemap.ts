import fs from 'fs';
import path from 'path';
import { generateSitemapXml, runSeoAudit, SITE_CONFIG } from '../src/data/seoRegistry';
import { TOOLS_LIST } from '../src/data/toolsList';

/**
 * ToolTrack Build-Time Sitemap & SEO Validator
 * Synchronizes the physical sitemap.xml and robots.txt with the live Tool Registry
 */
function buildSitemap() {
  console.log('--- ToolTrack Technical SEO & Sitemap Build ---');
  console.log(`Target Production Domain: ${SITE_CONFIG.url}`);
  console.log(`Total Tools in Registry: ${TOOLS_LIST.length}`);

  // Run SEO Audit
  const audit = runSeoAudit();
  console.log(`SEO Audit Status: ${audit.status.toUpperCase()}`);
  console.log(`Passed: ${audit.passedTools}/${audit.totalTools} tools`);

  if (audit.failedTools > 0) {
    console.warn(`[WARNING] ${audit.failedTools} tools had SEO issues:`);
    audit.reports
      .filter((r) => r.issues.length > 0)
      .forEach((r) => {
        console.warn(`  - ${r.name} (${r.toolId}): ${r.issues.join(', ')}`);
      });
  }

  // Generate strict sitemap XML
  const sitemapXml = generateSitemapXml();

  // Validate XML formatting
  if (!sitemapXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    throw new Error('Sitemap XML must start with standard XML declaration.');
  }

  if (!sitemapXml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    throw new Error('Sitemap XML missing correct urlset xmlns attribute.');
  }

  // Extract all <loc> to check for duplicates and count
  const locMatches = Array.from(sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)).map((m) => m[1]);
  const uniqueLocs = new Set(locMatches);

  // Check that every loc starts with the production HTTPS url
  for (const loc of locMatches) {
    if (!loc.startsWith(SITE_CONFIG.url)) {
      throw new Error(`Sitemap location "${loc}" does not start with production URL "${SITE_CONFIG.url}"`);
    }
    if (loc.includes('localhost') || loc.includes('ais-') || loc.startsWith('http://')) {
      throw new Error(`Sitemap location "${loc}" is not a valid HTTPS production URL!`);
    }
  }

  if (locMatches.length !== uniqueLocs.size) {
    throw new Error(`Sitemap contains duplicate URLs! Found ${locMatches.length} loc entries but only ${uniqueLocs.size} unique.`);
  }

  console.log(`Total URLs in generated Sitemap: ${locMatches.length} (all unique)`);

  // Write to public/ directory
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const publicSitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(publicSitemapPath, sitemapXml, 'utf-8');
  console.log(`Successfully written: ${publicSitemapPath}`);

  // Ensure robots.txt is present and valid
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

Sitemap: ${SITE_CONFIG.url}/sitemap.xml
`;
  const publicRobotsPath = path.join(publicDir, 'robots.txt');
  fs.writeFileSync(publicRobotsPath, robotsTxt, 'utf-8');
  console.log(`Successfully written: ${publicRobotsPath}`);

  // Also write to dist/ if dist exists
  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf-8');
    fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf-8');
    console.log(`Synced to dist/ directory as well.`);
  }

  console.log('--- Sitemap generation complete with ZERO errors ---');
}

buildSitemap();
