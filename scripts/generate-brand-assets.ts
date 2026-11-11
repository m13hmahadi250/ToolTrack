import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Exact ToolTrack Icon SVG
export const TOOLTRACK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <!-- Outer Document Ribbon Gradient (Purple -> Blue -> Cyan) -->
    <linearGradient id="ttOuterGrad" x1="0.1" y1="0.95" x2="0.9" y2="0.05">
      <stop offset="0%" stop-color="#7c3aed" />
      <stop offset="22%" stop-color="#6366f1" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="78%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>

    <!-- Top-Right Fold Flap Gradient -->
    <linearGradient id="ttFoldGrad" x1="0.1" y1="0.9" x2="0.85" y2="0.15">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="45%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#7dd3fc" />
    </linearGradient>

    <!-- Inner Dark Page Gradient -->
    <linearGradient id="ttInnerBg" x1="0.2" y1="0.1" x2="0.8" y2="0.9">
      <stop offset="0%" stop-color="#0d1b3e" />
      <stop offset="100%" stop-color="#070c1e" />
    </linearGradient>

    <!-- Drop Shadow for Fold -->
    <filter id="ttFoldShadow" x="-20%" y="-20%" width="160%" height="160%">
      <feDropShadow dx="-4" dy="8" stdDeviation="10" flood-color="#020817" flood-opacity="0.55" />
    </filter>

    <!-- Soft Glow Filter for Icon -->
    <filter id="ttIconGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#2563eb" flood-opacity="0.3" />
    </filter>

    <!-- Wordmark Track Gradient -->
    <linearGradient id="ttTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0ea5e9" />
      <stop offset="35%" stop-color="#3b82f6" />
      <stop offset="75%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#a855f7" />
    </linearGradient>
  </defs>

  <g filter="url(#ttIconGlow)">
    <path
      d="M 148 48
         L 326 48
         L 464 186
         L 464 364
         C 464 419.23 419.23 464 364 464
         L 148 464
         C 92.77 464 48 419.23 48 364
         L 48 148
         C 48 92.77 92.77 48 148 48 Z"
      fill="url(#ttOuterGrad)"
    />

    <path
      d="M 148 76
         L 306 76
         L 436 206
         L 436 364
         C 436 403.76 403.76 436 364 436
         L 148 436
         C 108.24 436 76 403.76 76 364
         L 76 148
         C 76 108.24 108.24 76 148 76 Z"
      fill="url(#ttInnerBg)"
    />

    <path
      d="M 326 48
         C 326 48 332 186 332 186
         C 332 186 464 186 464 186
         L 326 48 Z"
      fill="url(#ttFoldGrad)"
      filter="url(#ttFoldShadow)"
    />
    <path
      d="M 326 48
         C 328 130 334 186 334 186
         L 464 186
         C 464 150 440 90 410 72
         L 326 48 Z"
      fill="url(#ttFoldGrad)"
    />

    <g transform="translate(242, 268) rotate(-45)">
      <path
        d="M -18 30
           L -14 135
           C -14 148 14 148 14 135
           L 18 30
           Z"
        fill="#ffffff"
      />
      <circle cx="0" cy="132" r="16" fill="#ffffff" />
      <circle cx="0" cy="132" r="7" fill="#0d1b3e" />

      <path
        d="M -38 32
           C -46 -2 -24 -36 0 -42
           C 24 -36 46 -2 38 32
           C 30 46 16 48 0 48
           C -16 48 -30 46 -38 32 Z"
        fill="#ffffff"
      />
      <path
        d="M -16 -46
           L -16 -12
           L 16 -12
           L 16 -46
           L 0 -54
           Z"
        fill="#0d1b3e"
      />
    </g>

    <g transform="translate(345, 275)">
      <path
        d="M 0 -24
           Q 0 0 24 0
           Q 0 0 0 24
           Q 0 0 -24 0
           Q 0 0 0 -24 Z"
        fill="#ffffff"
      />
    </g>

    <g transform="translate(295, 340)">
      <path
        d="M 0 -15
           Q 0 0 15 0
           Q 0 0 0 15
           Q 0 0 -15 0
           Q 0 0 0 -15 Z"
        fill="#ffffff"
      />
    </g>
  </g>
</svg>`;

// Full ToolTrack Horizontal Brand Logo SVG (Dark Theme variant)
export const TOOLTRACK_FULL_LOGO_DARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 180" fill="none">
  <defs>
    <linearGradient id="ttOuterGradFull" x1="0.1" y1="0.95" x2="0.9" y2="0.05">
      <stop offset="0%" stop-color="#7c3aed" />
      <stop offset="22%" stop-color="#6366f1" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="78%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>

    <linearGradient id="ttFoldGradFull" x1="0.1" y1="0.9" x2="0.85" y2="0.15">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="45%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#7dd3fc" />
    </linearGradient>

    <linearGradient id="ttInnerBgFull" x1="0.2" y1="0.1" x2="0.8" y2="0.9">
      <stop offset="0%" stop-color="#0d1b3e" />
      <stop offset="100%" stop-color="#070c1e" />
    </linearGradient>

    <linearGradient id="ttTrackGradFull" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0ea5e9" />
      <stop offset="30%" stop-color="#3b82f6" />
      <stop offset="75%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#a855f7" />
    </linearGradient>
  </defs>

  <g transform="translate(15, 15) scale(0.293)">
    <path
      d="M 148 48 L 326 48 L 464 186 L 464 364 C 464 419.23 419.23 464 364 464 L 148 464 C 92.77 464 48 419.23 48 364 L 48 148 C 48 92.77 92.77 48 148 48 Z"
      fill="url(#ttOuterGradFull)"
    />
    <path
      d="M 148 76 L 306 76 L 436 206 L 436 364 C 436 403.76 403.76 436 364 436 L 148 436 C 108.24 436 76 403.76 76 364 L 76 148 C 76 108.24 108.24 76 148 76 Z"
      fill="url(#ttInnerBgFull)"
    />
    <path
      d="M 326 48 C 328 130 334 186 334 186 L 464 186 C 464 150 440 90 410 72 L 326 48 Z"
      fill="url(#ttFoldGradFull)"
    />
    <g transform="translate(242, 268) rotate(-45)">
      <path d="M -18 30 L -14 135 C -14 148 14 148 14 135 L 18 30 Z" fill="#ffffff" />
      <circle cx="0" cy="132" r="16" fill="#ffffff" />
      <circle cx="0" cy="132" r="7" fill="#0d1b3e" />
      <path d="M -38 32 C -46 -2 -24 -36 0 -42 C 24 -36 46 -2 38 32 C 30 46 16 48 0 48 C -16 48 -30 46 -38 32 Z" fill="#ffffff" />
      <path d="M -16 -46 L -16 -12 L 16 -12 L 16 -46 L 0 -54 Z" fill="#0d1b3e" />
    </g>
    <g transform="translate(345, 275)">
      <path d="M 0 -24 Q 0 0 24 0 Q 0 0 0 24 Q 0 0 -24 0 Q 0 0 0 -24 Z" fill="#ffffff" />
    </g>
    <g transform="translate(295, 340)">
      <path d="M 0 -15 Q 0 0 15 0 Q 0 0 0 15 Q 0 0 -15 0 Q 0 0 0 -15 Z" fill="#ffffff" />
    </g>
  </g>

  <text x="185" y="102" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="82" font-weight="800" letter-spacing="-1.5">
    <tspan fill="#ffffff">Tool</tspan><tspan fill="url(#ttTrackGradFull)">Track</tspan>
  </text>

  <text x="190" y="145" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="23" font-weight="600" letter-spacing="5" fill="#94a3b8">
    FILES • CODING • PRODUCTIVITY
  </text>
</svg>`;

/**
 * 1. Homepage / Platform Open Graph Social Preview Image (1200 x 630)
 */
export const OG_HOMEPAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#070B14" />
      <stop offset="45%" stop-color="#0B1220" />
      <stop offset="100%" stop-color="#111C33" />
    </linearGradient>
    <radialGradient id="glowBlue" cx="0.2" cy="0.25" r="0.55">
      <stop offset="0%" stop-color="#2563EB" stop-opacity="0.28" />
      <stop offset="100%" stop-color="#2563EB" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glowCyan" cx="0.82" cy="0.7" r="0.5">
      <stop offset="0%" stop-color="#0EA5E9" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#0EA5E9" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="brandBlue" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#1D4ED8" />
    </linearGradient>
    <linearGradient id="brandCyan" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="50%" stop-color="#60A5FA" />
      <stop offset="100%" stop-color="#818CF8" />
    </linearGradient>
    <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#152238" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />
  <rect width="1200" height="630" fill="url(#glowBlue)" />
  <rect width="1200" height="630" fill="url(#glowCyan)" />

  <!-- Subtle Grid -->
  <g stroke="#1E293B" stroke-width="1" opacity="0.55">
    <line x1="0" y1="105" x2="1200" y2="105" />
    <line x1="0" y1="210" x2="1200" y2="210" />
    <line x1="0" y1="315" x2="1200" y2="315" />
    <line x1="0" y1="420" x2="1200" y2="420" />
    <line x1="0" y1="525" x2="1200" y2="525" />
    <line x1="200" y1="0" x2="200" y2="630" />
    <line x1="400" y1="0" x2="400" y2="630" />
    <line x1="600" y1="0" x2="600" y2="630" />
    <line x1="800" y1="0" x2="800" y2="630" />
    <line x1="1000" y1="0" x2="1000" y2="630" />
  </g>

  <!-- Outer Frame Border -->
  <rect x="28" y="28" width="1144" height="574" rx="28" fill="none" stroke="#1E293B" stroke-width="2" />

  <!-- LEFT COLUMN: Brand Logo, Headline & Core Positioning -->
  <g transform="translate(76, 86)">
    <!-- ToolTrack Geometric Mark -->
    <rect x="0" y="0" width="76" height="76" rx="20" fill="#0F172A" stroke="#3B82F6" stroke-width="2" />
    <rect x="18" y="18" width="18" height="12" rx="4" fill="#3B82F6" />
    <rect x="40" y="18" width="18" height="12" rx="4" fill="#38BDF8" />
    <rect x="31" y="34" width="14" height="24" rx="4" fill="#2563EB" />
    <path d="M 52 41 L 58 47 L 52 53" stroke="#38BDF8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="22" cy="47" r="2.5" fill="#3B82F6" />

    <!-- Wordmark -->
    <text x="94" y="48" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#F8FAFC" letter-spacing="-1">
      Tool<tspan fill="#3B82F6">Track</tspan>
    </text>
    <text x="96" y="70" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#38BDF8" letter-spacing="3.5">
      ALL-IN-ONE WORKSPACE
    </text>

    <!-- Main Headline -->
    <text x="0" y="156" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="52" font-weight="800" fill="#FFFFFF" letter-spacing="-1.2">
      All Your Files, Coding &amp;
    </text>
    <text x="0" y="218" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="52" font-weight="800" fill="url(#brandCyan)" letter-spacing="-1.2">
      Productivity Tools
    </text>

    <!-- Supporting Capability Line -->
    <rect x="0" y="252" width="560" height="44" rx="12" fill="#132038" stroke="#2563EB" stroke-opacity="0.45" stroke-width="1.5" />
    <text x="20" y="280" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="19" font-weight="700" fill="#E2E8F0">
      PDF  •  Images  •  Compiler  •  Whiteboard  •  Productivity
    </text>

    <!-- Concise Subtitle -->
    <text x="0" y="342" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="500" fill="#94A3B8">
      Convert, compress, and edit documents &amp; images. Write and run
    </text>
    <text x="0" y="372" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="500" fill="#94A3B8">
      Python, C &amp; C++ online or offline directly in your browser.
    </text>

    <!-- Domain Footer Pill -->
    <rect x="0" y="412" width="270" height="38" rx="10" fill="#0F172A" stroke="#334155" stroke-width="1.5" />
    <circle cx="22" cy="431" r="5" fill="#10B981" />
    <text x="38" y="437" font-family="monospace" font-size="16" font-weight="700" fill="#CBD5E1">
      tooltracker.vercel.app
    </text>
  </g>

  <!-- RIGHT COLUMN: 2x2 Visual Capability Grid -->
  <g transform="translate(684, 86)">
    <!-- Card 1: PDF & Documents -->
    <g transform="translate(0, 0)">
      <rect width="212" height="212" rx="22" fill="url(#cardBg)" stroke="#1E293B" stroke-width="2" />
      <rect x="22" y="22" width="48" height="48" rx="14" fill="#1E3A8A" fill-opacity="0.55" stroke="#3B82F6" stroke-width="1.5" />
      <text x="33" y="52" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="#60A5FA">PDF</text>
      <text x="22" y="106" font-family="system-ui, sans-serif" font-size="22" font-weight="800" fill="#F8FAFC">PDF &amp; Office</text>
      <text x="22" y="134" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="#94A3B8">Merge, Split, Compress</text>
      <text x="22" y="156" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="#94A3B8">Word, Excel &amp; OCR</text>
      <rect x="22" y="174" width="96" height="18" rx="5" fill="#1E293B" />
      <rect x="22" y="174" width="68" height="18" rx="5" fill="#3B82F6" />
    </g>

    <!-- Card 2: Compiler IDE -->
    <g transform="translate(230, 0)">
      <rect width="212" height="212" rx="22" fill="url(#cardBg)" stroke="#2563EB" stroke-width="2" />
      <rect x="22" y="22" width="48" height="48" rx="14" fill="#064E3B" fill-opacity="0.6" stroke="#10B981" stroke-width="1.5" />
      <text x="31" y="52" font-family="monospace" font-size="18" font-weight="800" fill="#34D399">&lt;/&gt;</text>
      <text x="22" y="106" font-family="system-ui, sans-serif" font-size="22" font-weight="800" fill="#F8FAFC">Compiler IDE</text>
      <text x="22" y="134" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="#94A3B8">Python 3, C &amp; C++20</text>
      <text x="22" y="156" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="#94A3B8">NumPy, Pandas &amp; Plots</text>
      <rect x="22" y="174" width="134" height="20" rx="6" fill="#064E3B" />
      <text x="32" y="188" font-family="monospace" font-size="11" font-weight="700" fill="#6EE7B7">ONLINE &amp; OFFLINE</text>
    </g>

    <!-- Card 3: Image Studio -->
    <g transform="translate(0, 230)">
      <rect width="212" height="212" rx="22" fill="url(#cardBg)" stroke="#1E293B" stroke-width="2" />
      <rect x="22" y="22" width="48" height="48" rx="14" fill="#311042" fill-opacity="0.6" stroke="#A855F7" stroke-width="1.5" />
      <text x="31" y="52" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="#C084FC">IMG</text>
      <text x="22" y="106" font-family="system-ui, sans-serif" font-size="22" font-weight="800" fill="#F8FAFC">Image Studio</text>
      <text x="22" y="134" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="#94A3B8">Compress, Resize, Crop</text>
      <text x="22" y="156" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="#94A3B8">Remove BG &amp; Convert</text>
      <rect x="22" y="174" width="112" height="18" rx="5" fill="#1E293B" />
      <rect x="22" y="174" width="84" height="18" rx="5" fill="#A855F7" />
    </g>

    <!-- Card 4: Whiteboard & Utilities -->
    <g transform="translate(230, 230)">
      <rect width="212" height="212" rx="22" fill="url(#cardBg)" stroke="#1E293B" stroke-width="2" />
      <rect x="22" y="22" width="48" height="48" rx="14" fill="#0C4A6E" fill-opacity="0.6" stroke="#38BDF8" stroke-width="1.5" />
      <text x="31" y="52" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="#38BDF8">PRO</text>
      <text x="22" y="106" font-family="system-ui, sans-serif" font-size="22" font-weight="800" fill="#F8FAFC">Whiteboard</text>
      <text x="22" y="134" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="#94A3B8">Infinite Vector Canvas</text>
      <text x="22" y="156" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="#94A3B8">&amp; 60+ Daily Utilities</text>
      <rect x="22" y="174" width="112" height="18" rx="5" fill="#1E293B" />
      <rect x="22" y="174" width="90" height="18" rx="5" fill="#38BDF8" />
    </g>
  </g>
</svg>`;

/**
 * 2. Compiler Open Graph Social Preview Image (1200 x 630)
 */
export const OG_COMPILER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
  <defs>
    <linearGradient id="compBgGrad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#060A12" />
      <stop offset="50%" stop-color="#0B1324" />
      <stop offset="100%" stop-color="#0F1D36" />
    </linearGradient>
    <radialGradient id="compGlowLeft" cx="0.22" cy="0.3" r="0.55">
      <stop offset="0%" stop-color="#2563EB" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#2563EB" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="compGlowRight" cx="0.8" cy="0.65" r="0.5">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#10B981" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="compTitleGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="50%" stop-color="#60A5FA" />
      <stop offset="100%" stop-color="#34D399" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#compBgGrad)" />
  <rect width="1200" height="630" fill="url(#compGlowLeft)" />
  <rect width="1200" height="630" fill="url(#compGlowRight)" />

  <!-- Subtle Grid -->
  <g stroke="#1E293B" stroke-width="1" opacity="0.5">
    <line x1="0" y1="105" x2="1200" y2="105" />
    <line x1="0" y1="210" x2="1200" y2="210" />
    <line x1="0" y1="315" x2="1200" y2="315" />
    <line x1="0" y1="420" x2="1200" y2="420" />
    <line x1="0" y1="525" x2="1200" y2="525" />
    <line x1="200" y1="0" x2="200" y2="630" />
    <line x1="400" y1="0" x2="400" y2="630" />
    <line x1="600" y1="0" x2="600" y2="630" />
    <line x1="800" y1="0" x2="800" y2="630" />
    <line x1="1000" y1="0" x2="1000" y2="630" />
  </g>

  <!-- Frame -->
  <rect x="28" y="28" width="1144" height="574" rx="28" fill="none" stroke="#1E293B" stroke-width="2" />

  <!-- LEFT COLUMN -->
  <g transform="translate(76, 88)">
    <!-- ToolTrack Brand Header -->
    <rect x="0" y="0" width="72" height="72" rx="18" fill="#0F172A" stroke="#3B82F6" stroke-width="2" />
    <rect x="17" y="17" width="17" height="11" rx="3.5" fill="#3B82F6" />
    <rect x="38" y="17" width="17" height="11" rx="3.5" fill="#38BDF8" />
    <rect x="29" y="32" width="14" height="23" rx="3.5" fill="#2563EB" />
    <path d="M 49 39 L 55 45 L 49 51" stroke="#38BDF8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="21" cy="45" r="2.5" fill="#3B82F6" />

    <text x="90" y="45" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="800" fill="#F8FAFC" letter-spacing="-0.8">
      Tool<tspan fill="#3B82F6">Track</tspan>
    </text>
    <text x="92" y="66" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#34D399" letter-spacing="3.5">
      ONLINE &amp; OFFLINE IDE
    </text>

    <!-- Main Title -->
    <text x="0" y="158" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="56" font-weight="800" fill="#FFFFFF" letter-spacing="-1.2">
      ToolTrack
    </text>
    <text x="0" y="222" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="56" font-weight="800" fill="url(#compTitleGrad)" letter-spacing="-1.2">
      Compiler
    </text>

    <!-- Language Pill Strip -->
    <rect x="0" y="254" width="350" height="46" rx="12" fill="#132238" stroke="#38BDF8" stroke-opacity="0.5" stroke-width="1.5" />
    <text x="24" y="284" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="#F8FAFC">
      Python  •  C  •  C++
    </text>

    <!-- Feature summary -->
    <text x="0" y="344" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="500" fill="#94A3B8">
      Code editor, STDIN/STDOUT console, supported
    </text>
    <text x="0" y="372" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="500" fill="#94A3B8">
      scientific Python libraries, plots &amp; offline mode.
    </text>

    <!-- URL Badge -->
    <rect x="0" y="410" width="356" height="38" rx="10" fill="#0F172A" stroke="#334155" stroke-width="1.5" />
    <circle cx="22" cy="429" r="5" fill="#38BDF8" />
    <text x="38" y="435" font-family="monospace" font-size="16" font-weight="700" fill="#CBD5E1">
      tooltracker.vercel.app/compiler
    </text>
  </g>

  <!-- RIGHT COLUMN: Lightweight Code Editor & Plot Visual -->
  <g transform="translate(590, 82)">
    <!-- Editor Window Shell -->
    <rect width="534" height="466" rx="22" fill="#0B111E" stroke="#1E293B" stroke-width="2" />
    <!-- Top Window Bar -->
    <rect x="2" y="2" width="530" height="44" rx="20" fill="#111827" />
    <circle cx="26" cy="24" r="6" fill="#EF4444" />
    <circle cx="46" cy="24" r="6" fill="#F59E0B" />
    <circle cx="66" cy="24" r="6" fill="#10B981" />
    <rect x="92" y="11" width="110" height="26" rx="7" fill="#1E293B" />
    <text x="110" y="28" font-family="monospace" font-size="13" font-weight="700" fill="#60A5FA">main.py</text>
    <rect x="210" y="11" width="110" height="26" rx="7" fill="#0F172A" />
    <text x="228" y="28" font-family="monospace" font-size="13" font-weight="600" fill="#64748B">main.cpp</text>
    <rect x="424" y="11" width="90" height="26" rx="7" fill="#059669" />
    <text x="446" y="28" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#FFFFFF">▶ Run</text>

    <!-- Code Lines -->
    <g transform="translate(24, 72)" font-family="monospace" font-size="16" font-weight="600">
      <text x="0" y="0" fill="#475569">1</text>
      <text x="32" y="0" fill="#C084FC">import</text>
      <text x="100" y="0" fill="#E2E8F0">numpy</text>
      <text x="158" y="0" fill="#C084FC">as</text>
      <text x="188" y="0" fill="#38BDF8">np</text>

      <text x="0" y="30" fill="#475569">2</text>
      <text x="32" y="30" fill="#C084FC">import</text>
      <text x="100" y="30" fill="#E2E8F0">matplotlib.pyplot</text>
      <text x="280" y="30" fill="#C084FC">as</text>
      <text x="310" y="30" fill="#38BDF8">plt</text>

      <text x="0" y="66" fill="#475569">3</text>
      <text x="32" y="66" fill="#E2E8F0">x = np.linspace(</text>
      <text x="192" y="66" fill="#FBBF24">0</text>
      <text x="204" y="66" fill="#E2E8F0">, </text>
      <text x="222" y="66" fill="#FBBF24">10</text>
      <text x="244" y="66" fill="#E2E8F0">, </text>
      <text x="262" y="66" fill="#FBBF24">100</text>
      <text x="294" y="66" fill="#E2E8F0">)</text>

      <text x="0" y="96" fill="#475569">4</text>
      <text x="32" y="96" fill="#E2E8F0">plt.plot(x, np.sin(x))</text>

      <text x="0" y="126" fill="#475569">5</text>
      <text x="32" y="126" fill="#38BDF8">print</text>
      <text x="82" y="126" fill="#E2E8F0">(</text>
      <text x="94" y="126" fill="#34D399">"Ready to execute!"</text>
      <text x="284" y="126" fill="#E2E8F0">)</text>
    </g>

    <!-- Bottom Split: Console Output & Visual Plot Card -->
    <line x1="2" y1="236" x2="532" y2="236" stroke="#1E293B" stroke-width="2" />

    <!-- Console Output Panel -->
    <g transform="translate(22, 256)">
      <rect width="236" height="186" rx="14" fill="#0F172A" stroke="#1E293B" stroke-width="1.5" />
      <text x="16" y="28" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#64748B" letter-spacing="1.5">CONSOLE OUTPUT</text>
      <text x="16" y="62" font-family="monospace" font-size="14" font-weight="700" fill="#34D399">$ python3 main.py</text>
      <text x="16" y="90" font-family="monospace" font-size="14" font-weight="600" fill="#F8FAFC">Ready to execute!</text>
      <rect x="16" y="138" width="154" height="28" rx="7" fill="#064E3B" />
      <text x="28" y="157" font-family="monospace" font-size="12" font-weight="700" fill="#6EE7B7">✓ Exit Code: 0</text>
    </g>

    <!-- Visual Plot Preview Card -->
    <g transform="translate(274, 256)">
      <rect width="236" height="186" rx="14" fill="#0F172A" stroke="#1E293B" stroke-width="1.5" />
      <text x="16" y="28" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#64748B" letter-spacing="1.5">MATPLOTLIB FIGURE</text>
      <!-- Mini bar + curve graphic -->
      <rect x="28" y="118" width="22" height="44" rx="4" fill="#1E3A8A" />
      <rect x="62" y="96" width="22" height="66" rx="4" fill="#2563EB" />
      <rect x="96" y="72" width="22" height="90" rx="4" fill="#3B82F6" />
      <rect x="130" y="86" width="22" height="76" rx="4" fill="#38BDF8" />
      <rect x="164" y="54" width="22" height="108" rx="4" fill="#10B981" />
      <path d="M 32 108 Q 75 56, 112 78 T 192 48" stroke="#FBBF24" stroke-width="3.5" fill="none" stroke-linecap="round" />
    </g>
  </g>
</svg>`;

async function main() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write SVG assets
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), TOOLTRACK_ICON_SVG);
  fs.writeFileSync(path.join(publicDir, 'tooltrack-icon.svg'), TOOLTRACK_ICON_SVG);
  fs.writeFileSync(path.join(publicDir, 'tooltrack-logo.svg'), TOOLTRACK_FULL_LOGO_DARK_SVG);

  // 2. Generate PNG Favicons
  const sizes = [16, 32, 48, 180, 192, 512];
  for (const s of sizes) {
    const filename =
      s === 180
        ? 'apple-touch-icon.png'
        : s === 192
        ? 'icon-192.png'
        : s === 512
        ? 'icon-512.png'
        : `favicon-${s}x${s}.png`;
    await sharp(Buffer.from(TOOLTRACK_ICON_SVG))
      .resize(s, s)
      .png()
      .toFile(path.join(publicDir, filename));
    console.log(`Generated ${filename}`);
  }

  // Generate 32x32 favicon.ico as PNG for browser compatibility
  await sharp(Buffer.from(TOOLTRACK_ICON_SVG))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  // 3. Generate 1200x630 Social Preview Images (Open Graph & Twitter Cards)
  await sharp(Buffer.from(OG_HOMEPAGE_SVG))
    .resize(1200, 630)
    .png({ compressionLevel: 9, palette: true, quality: 92 })
    .toFile(path.join(publicDir, 'og-tooltrack.png'));
  console.log('Generated og-tooltrack.png (1200x630)');

  await sharp(Buffer.from(OG_COMPILER_SVG))
    .resize(1200, 630)
    .png({ compressionLevel: 9, palette: true, quality: 92 })
    .toFile(path.join(publicDir, 'og-compiler.png'));
  console.log('Generated og-compiler.png (1200x630)');

  // 4. Write PWA Web App Manifest
  const manifest = {
    id: '/',
    name: 'ToolTrack — All Your Files, Coding & Productivity Tools in One Place',
    short_name: 'ToolTrack',
    description:
      'Convert, compress, edit, and organize PDFs, documents, and images. Write and run Python, C, and C++ with our online/offline compiler, and explore Whiteboard, OCR, and everyday productivity tools.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0B1220',
    theme_color: '#2563EB',
    categories: ['productivity', 'utilities', 'developer', 'education'],
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
  fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
  console.log('Generated site.webmanifest');
}

main().catch(console.error);
