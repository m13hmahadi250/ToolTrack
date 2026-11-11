import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Exact ToolTrack Icon SVG (used ONLY for favicons & PWA icons, never as the landscape OG banner)
export const TOOLTRACK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="ttOuterGrad" x1="0.1" y1="0.95" x2="0.9" y2="0.05">
      <stop offset="0%" stop-color="#7c3aed" />
      <stop offset="22%" stop-color="#6366f1" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="78%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>

    <linearGradient id="ttFoldGrad" x1="0.1" y1="0.9" x2="0.85" y2="0.15">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="45%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#7dd3fc" />
    </linearGradient>

    <linearGradient id="ttInnerBg" x1="0.2" y1="0.1" x2="0.8" y2="0.9">
      <stop offset="0%" stop-color="#0d1b3e" />
      <stop offset="100%" stop-color="#070c1e" />
    </linearGradient>

    <filter id="ttFoldShadow" x="-20%" y="-20%" width="160%" height="160%">
      <feDropShadow dx="-4" dy="8" stdDeviation="10" flood-color="#020817" flood-opacity="0.55" />
    </filter>

    <filter id="ttIconGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#2563eb" flood-opacity="0.3" />
    </filter>
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
 * Designed for WhatsApp, Telegram, Messenger, LinkedIn, Twitter/X, and Discord:
 * - Left section: Small ToolTrack logo + wordmark, strong headline ("Your All-in-One Productivity Workspace"),
 *   clear capability bar ("PDF • Images • Compiler • Whiteboard • Documents"), concise copy & URL badge.
 * - Right section: 2x2 product-interface cards with visual UI illustrations for PDF Tools, Compiler IDE,
 *   Image Studio, and Interactive Whiteboard.
 */
export const OG_HOMEPAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#060A14" />
      <stop offset="48%" stop-color="#0B1220" />
      <stop offset="100%" stop-color="#111C35" />
    </linearGradient>
    <radialGradient id="glowBlue" cx="0.18" cy="0.24" r="0.55">
      <stop offset="0%" stop-color="#2563EB" stop-opacity="0.32" />
      <stop offset="100%" stop-color="#2563EB" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glowViolet" cx="0.82" cy="0.72" r="0.52">
      <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.24" />
      <stop offset="100%" stop-color="#7C3AED" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="headlineGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="50%" stop-color="#60A5FA" />
      <stop offset="100%" stop-color="#A78BFA" />
    </linearGradient>
    <linearGradient id="cardSurface" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#152238" />
      <stop offset="100%" stop-color="#0D1627" />
    </linearGradient>
  </defs>

  <!-- Deep Navy Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />
  <rect width="1200" height="630" fill="url(#glowBlue)" />
  <rect width="1200" height="630" fill="url(#glowViolet)" />

  <!-- Subtle Architectural Grid -->
  <g stroke="#1E293B" stroke-width="1" opacity="0.45">
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

  <!-- Outer Precision Border Frame -->
  <rect x="28" y="28" width="1144" height="574" rx="28" fill="none" stroke="#1E293B" stroke-width="2" />

  <!-- ======================================================================= -->
  <!-- LEFT SECTION: Small Brand Mark, Strong Headline & Supporting Subtitle    -->
  <!-- ======================================================================= -->
  <g transform="translate(68, 76)">
    <!-- Small ToolTrack Logo & Wordmark -->
    <rect x="0" y="0" width="56" height="56" rx="15" fill="#0F172A" stroke="#3B82F6" stroke-width="2" />
    <rect x="13" y="13" width="13" height="9" rx="3" fill="#3B82F6" />
    <rect x="30" y="13" width="13" height="9" rx="3" fill="#38BDF8" />
    <rect x="22.5" y="25" width="11" height="18" rx="3" fill="#2563EB" />
    <path d="M 39 30.5 L 44 35 L 39 39.5" stroke="#38BDF8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="16.5" cy="35" r="2" fill="#3B82F6" />

    <text x="72" y="36" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="34" font-weight="800" fill="#F8FAFC" letter-spacing="-0.8">
      Tool<tspan fill="#3B82F6">Track</tspan>
    </text>
    <text x="74" y="53" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="700" fill="#38BDF8" letter-spacing="2.8">
      FILES • CODING • STUDIO
    </text>

    <!-- Strong, Readable Headline -->
    <text x="0" y="138" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="48" font-weight="800" fill="#FFFFFF" letter-spacing="-1.1">
      Your All-in-One
    </text>
    <text x="0" y="198" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="48" font-weight="800" fill="url(#headlineGrad)" letter-spacing="-1.1">
      Productivity
    </text>
    <text x="0" y="258" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="48" font-weight="800" fill="#FFFFFF" letter-spacing="-1.1">
      Workspace
    </text>

    <!-- Supporting Capability Subtitle Bar -->
    <rect x="0" y="288" width="526" height="44" rx="12" fill="#132038" stroke="#3B82F6" stroke-opacity="0.5" stroke-width="1.5" />
    <text x="18" y="316" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="18.5" font-weight="700" fill="#F1F5F9">
      PDF  •  Images  •  Compiler  •  Whiteboard  •  Documents
    </text>

    <!-- Short Supporting Tagline -->
    <text x="0" y="372" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="18.5" font-weight="500" fill="#94A3B8">
      Convert, compress &amp; edit files, or run Python, C &amp; C++
    </text>
    <text x="0" y="400" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="18.5" font-weight="500" fill="#94A3B8">
      online and offline directly in your browser.
    </text>

    <!-- Domain & Privacy Pill -->
    <rect x="0" y="432" width="256" height="38" rx="10" fill="#0F172A" stroke="#334155" stroke-width="1.5" />
    <circle cx="20" cy="451" r="5" fill="#10B981" />
    <text x="35" y="457" font-family="monospace" font-size="15.5" font-weight="700" fill="#E2E8F0">
      tooltracker.vercel.app
    </text>

    <rect x="270" y="432" width="196" height="38" rx="10" fill="#0F172A" stroke="#1E293B" stroke-width="1.5" />
    <text x="288" y="456" font-family="system-ui, -apple-system, sans-serif" font-size="13.5" font-weight="700" fill="#38BDF8">
      60+ Built-In Tools
    </text>
  </g>

  <!-- ======================================================================= -->
  <!-- RIGHT SECTION: 4 Product-Interface Preview Cards (2x2 Grid)              -->
  <!-- ======================================================================= -->
  <g transform="translate(632, 68)">
    <!-- CARD 1: PDF & Documents UI Preview (Top-Left) -->
    <g transform="translate(0, 0)">
      <rect width="242" height="236" rx="22" fill="url(#cardSurface)" stroke="#1E3A8A" stroke-width="2" />
      <!-- Mini UI Preview Box -->
      <rect x="16" y="16" width="210" height="114" rx="14" fill="#09101D" stroke="#1E293B" stroke-width="1.5" />
      <!-- Vector PDF Document Sheet Icon -->
      <g transform="translate(30, 30)">
        <rect x="0" y="0" width="52" height="68" rx="7" fill="#1E293B" stroke="#3B82F6" stroke-width="1.5" />
        <path d="M 36 0 L 52 16 L 36 16 Z" fill="#60A5FA" />
        <rect x="8" y="24" width="36" height="16" rx="4" fill="#2563EB" />
        <text x="13" y="36" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#FFFFFF">PDF</text>
        <rect x="8" y="47" width="34" height="4" rx="2" fill="#475569" />
        <rect x="8" y="55" width="24" height="4" rx="2" fill="#475569" />
      </g>
      <!-- Mini Action Pills inside PDF UI -->
      <g transform="translate(92, 30)">
        <rect x="0" y="0" width="118" height="24" rx="6" fill="#172554" stroke="#2563EB" stroke-opacity="0.5" />
        <text x="12" y="16" font-family="system-ui, sans-serif" font-size="11.5" font-weight="700" fill="#93C5FD">PDF → Word</text>
        <rect x="0" y="31" width="118" height="24" rx="6" fill="#0F172A" stroke="#1E293B" />
        <text x="12" y="47" font-family="system-ui, sans-serif" font-size="11.5" font-weight="700" fill="#CBD5E1">Merge &amp; Split</text>
        <rect x="0" y="62" width="118" height="22" rx="6" fill="#064E3B" />
        <text x="10" y="77" font-family="monospace" font-size="10.5" font-weight="700" fill="#6EE7B7">-68% Compressed</text>
      </g>
      <!-- Card Label -->
      <text x="20" y="164" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#F8FAFC">PDF &amp; Documents</text>
      <text x="20" y="190" font-family="system-ui, -apple-system, sans-serif" font-size="13.5" font-weight="500" fill="#94A3B8">Merge, Split, Compress</text>
      <text x="20" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="13.5" font-weight="500" fill="#94A3B8">Word, Excel &amp; OCR</text>
    </g>

    <!-- CARD 2: Python, C, C++ Compiler IDE Preview (Top-Right) -->
    <g transform="translate(260, 0)">
      <rect width="242" height="236" rx="22" fill="url(#cardSurface)" stroke="#2563EB" stroke-width="2" />
      <!-- Mini Code Editor Window -->
      <rect x="16" y="16" width="210" height="114" rx="14" fill="#070B14" stroke="#1E293B" stroke-width="1.5" />
      <!-- Editor Top Bar -->
      <rect x="17" y="17" width="208" height="26" rx="12" fill="#0F172A" />
      <circle cx="31" cy="30" r="4" fill="#EF4444" />
      <circle cx="43" cy="30" r="4" fill="#F59E0B" />
      <circle cx="55" cy="30" r="4" fill="#10B981" />
      <text x="72" y="34" font-family="monospace" font-size="11" font-weight="700" fill="#60A5FA">main.py</text>
      <rect x="172" y="21" width="44" height="18" rx="5" fill="#059669" />
      <text x="180" y="33" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="#FFFFFF">▶ Run</text>
      <!-- Code Lines with explicit x positions so spaces never collapse -->
      <g font-family="monospace" font-size="12" font-weight="700">
        <text x="28" y="62" fill="#C084FC">import</text>
        <text x="78" y="62" fill="#E2E8F0">numpy</text>
        <text x="122" y="62" fill="#C084FC">as</text>
        <text x="144" y="62" fill="#38BDF8">np</text>
        <text x="28" y="82" fill="#38BDF8">print</text>
        <text x="65" y="82" fill="#E2E8F0">(</text>
        <text x="73" y="82" fill="#34D399">"Mean: 95.0"</text>
        <text x="160" y="82" fill="#E2E8F0">)</text>
      </g>
      <rect x="28" y="94" width="186" height="24" rx="6" fill="#064E3B" fill-opacity="0.75" />
      <text x="38" y="110" font-family="monospace" font-size="11" font-weight="700" fill="#6EE7B7">&gt; Mean: 95.0 (12ms)</text>
      <!-- Card Label -->
      <text x="20" y="164" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#F8FAFC">Compiler IDE</text>
      <text x="20" y="190" font-family="system-ui, -apple-system, sans-serif" font-size="13.5" font-weight="500" fill="#94A3B8">Python, C &amp; C++</text>
      <text x="20" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="13.5" font-weight="600" fill="#34D399">Online &amp; Offline Ready</text>
    </g>

    <!-- CARD 3: Image Studio Preview (Bottom-Left) -->
    <g transform="translate(0, 254)">
      <rect width="242" height="236" rx="22" fill="url(#cardSurface)" stroke="#4C1D95" stroke-width="2" />
      <!-- Mini Image Editor Canvas -->
      <rect x="16" y="16" width="210" height="114" rx="14" fill="#09101D" stroke="#1E293B" stroke-width="1.5" />
      <!-- Left half: Original Photo Frame with Mountain & Sun -->
      <rect x="28" y="28" width="88" height="88" rx="10" fill="#1E1B4B" stroke="#8B5CF6" stroke-width="1.5" />
      <circle cx="52" cy="50" r="9" fill="#FBBF24" />
      <path d="M 32 108 L 58 72 L 78 94 L 92 78 L 112 108 Z" fill="#6366F1" />
      <!-- Split Slider Line -->
      <line x1="116" y1="24" x2="116" y2="120" stroke="#C084FC" stroke-width="2.5" />
      <circle cx="116" cy="72" r="8" fill="#A855F7" stroke="#FFFFFF" stroke-width="2" />
      <!-- Right half: BG Removed & Format Pills -->
      <g transform="translate(128, 30)">
        <rect x="0" y="0" width="88" height="24" rx="6" fill="#2E1065" stroke="#A855F7" stroke-opacity="0.5" />
        <text x="10" y="16" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#E9D5FF">Remove BG</text>
        <rect x="0" y="31" width="88" height="24" rx="6" fill="#0F172A" stroke="#1E293B" />
        <text x="8" y="47" font-family="system-ui, sans-serif" font-size="10.5" font-weight="700" fill="#CBD5E1">Crop / Resize</text>
        <rect x="0" y="62" width="88" height="22" rx="6" fill="#1E293B" />
        <text x="10" y="77" font-family="monospace" font-size="10.5" font-weight="700" fill="#38BDF8">PNG • WEBP</text>
      </g>
      <!-- Card Label -->
      <text x="20" y="164" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#F8FAFC">Image Tools</text>
      <text x="20" y="190" font-family="system-ui, -apple-system, sans-serif" font-size="13.5" font-weight="500" fill="#94A3B8">Compress, Resize, Crop</text>
      <text x="20" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="13.5" font-weight="500" fill="#94A3B8">BG Remover &amp; Convert</text>
    </g>

    <!-- CARD 4: Whiteboard & Canvas Preview (Bottom-Right) -->
    <g transform="translate(260, 254)">
      <rect width="242" height="236" rx="22" fill="url(#cardSurface)" stroke="#0369A1" stroke-width="2" />
      <!-- Mini Infinite Canvas Preview -->
      <rect x="16" y="16" width="210" height="114" rx="14" fill="#09101D" stroke="#1E293B" stroke-width="1.5" />
      <!-- Flowchart Nodes & Freehand Vector Curve -->
      <rect x="30" y="34" width="64" height="32" rx="8" fill="#0C4A6E" stroke="#38BDF8" stroke-width="1.5" />
      <text x="45" y="54" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#E0F2FE">Idea</text>
      <path d="M 94 50 C 116 50, 118 82, 140 82" stroke="#38BDF8" stroke-width="2.5" fill="none" stroke-dasharray="4 3" />
      <rect x="140" y="66" width="72" height="32" rx="8" fill="#064E3B" stroke="#10B981" stroke-width="1.5" />
      <text x="155" y="86" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#D1FAE5">Sketch</text>
      <!-- Highlight Stroke -->
      <path d="M 34 102 Q 68 82, 106 104" stroke="#FBBF24" stroke-width="3.5" fill="none" stroke-linecap="round" />
      <!-- Card Label -->
      <text x="20" y="164" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#F8FAFC">Whiteboard</text>
      <text x="20" y="190" font-family="system-ui, -apple-system, sans-serif" font-size="13.5" font-weight="500" fill="#94A3B8">Infinite Vector Canvas</text>
      <text x="20" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="13.5" font-weight="500" fill="#94A3B8">Diagrams &amp; PDF Markup</text>
    </g>
  </g>
</svg>`;

/**
 * 2. Compiler Open Graph Social Preview Image (1200 x 630)
 * Dedicated preview for https://tooltracker.vercel.app/compiler
 * - Left: "ToolTrack Compiler", "Python • C • C++", concise capabilities & URL.
 * - Right: Clean VS Code-style code editor interface with console output & Matplotlib plot card.
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
  <g transform="translate(72, 82)">
    <!-- Small ToolTrack Brand Header -->
    <rect x="0" y="0" width="58" height="58" rx="15" fill="#0F172A" stroke="#3B82F6" stroke-width="2" />
    <rect x="13" y="13" width="14" height="9" rx="3" fill="#3B82F6" />
    <rect x="31" y="13" width="14" height="9" rx="3" fill="#38BDF8" />
    <rect x="23" y="25" width="12" height="19" rx="3" fill="#2563EB" />
    <path d="M 40 31 L 45 36 L 40 41" stroke="#38BDF8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="17" cy="36" r="2.2" fill="#3B82F6" />

    <text x="74" y="37" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="800" fill="#F8FAFC" letter-spacing="-0.8">
      Tool<tspan fill="#3B82F6">Track</tspan>
    </text>
    <text x="76" y="54" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="700" fill="#34D399" letter-spacing="3">
      ONLINE &amp; OFFLINE IDE
    </text>

    <!-- Main Title -->
    <text x="0" y="152" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="56" font-weight="800" fill="#FFFFFF" letter-spacing="-1.2">
      ToolTrack
    </text>
    <text x="0" y="216" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="56" font-weight="800" fill="url(#compTitleGrad)" letter-spacing="-1.2">
      Compiler
    </text>

    <!-- Language Pill Strip -->
    <rect x="0" y="248" width="350" height="46" rx="12" fill="#132238" stroke="#38BDF8" stroke-opacity="0.5" stroke-width="1.5" />
    <text x="24" y="278" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="#F8FAFC">
      Python  •  C  •  C++
    </text>

    <!-- Feature summary -->
    <text x="0" y="340" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="500" fill="#94A3B8">
      Code editor, STDIN/STDOUT console, supported
    </text>
    <text x="0" y="368" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="500" fill="#94A3B8">
      scientific Python libraries, plots &amp; offline mode.
    </text>

    <!-- URL Badge -->
    <rect x="0" y="414" width="356" height="38" rx="10" fill="#0F172A" stroke="#334155" stroke-width="1.5" />
    <circle cx="22" cy="433" r="5" fill="#38BDF8" />
    <text x="38" y="439" font-family="monospace" font-size="16" font-weight="700" fill="#CBD5E1">
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
  const ogDir = path.join(publicDir, 'og');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(ogDir)) {
    fs.mkdirSync(ogDir, { recursive: true });
  }

  // 1. Write SVG assets
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), TOOLTRACK_ICON_SVG);
  fs.writeFileSync(path.join(publicDir, 'tooltrack-icon.svg'), TOOLTRACK_ICON_SVG);
  fs.writeFileSync(path.join(publicDir, 'tooltrack-logo.svg'), TOOLTRACK_FULL_LOGO_DARK_SVG);

  // 2. Generate PNG Favicons & PWA App Icons (strictly separated from social preview banners)
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

  await sharp(Buffer.from(TOOLTRACK_ICON_SVG))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  // 3. Generate 1200x630 Landscape Social Preview Images in PNG, WebP, and JPEG
  const homeSvgBuf = Buffer.from(OG_HOMEPAGE_SVG);
  await sharp(homeSvgBuf)
    .resize(1200, 630)
    .png({ compressionLevel: 9, palette: true, quality: 95 })
    .toFile(path.join(ogDir, 'tooltrack-social-preview-v3.png'));
  await sharp(homeSvgBuf)
    .resize(1200, 630)
    .webp({ quality: 92 })
    .toFile(path.join(ogDir, 'tooltrack-social-preview.webp'));
  await sharp(homeSvgBuf)
    .resize(1200, 630)
    .jpeg({ quality: 92, progressive: true })
    .toFile(path.join(ogDir, 'tooltrack-social-preview.jpg'));
  await sharp(homeSvgBuf)
    .resize(1200, 630)
    .png({ compressionLevel: 9, palette: true, quality: 95 })
    .toFile(path.join(publicDir, 'og-tooltrack.png'));
  console.log('Generated Homepage 1200x630 OG banners in /og/ and /og-tooltrack.png');

  const compilerSvgBuf = Buffer.from(OG_COMPILER_SVG);
  await sharp(compilerSvgBuf)
    .resize(1200, 630)
    .png({ compressionLevel: 9, palette: true, quality: 95 })
    .toFile(path.join(ogDir, 'tooltrack-compiler-preview-v3.png'));
  await sharp(compilerSvgBuf)
    .resize(1200, 630)
    .webp({ quality: 92 })
    .toFile(path.join(ogDir, 'tooltrack-compiler-preview.webp'));
  await sharp(compilerSvgBuf)
    .resize(1200, 630)
    .jpeg({ quality: 92, progressive: true })
    .toFile(path.join(ogDir, 'tooltrack-compiler-preview.jpg'));
  await sharp(compilerSvgBuf)
    .resize(1200, 630)
    .png({ compressionLevel: 9, palette: true, quality: 95 })
    .toFile(path.join(publicDir, 'og-compiler.png'));
  console.log('Generated Compiler 1200x630 OG banners in /og/ and /og-compiler.png');

  // 4. Write PWA Web App Manifest
  const manifest = {
    id: '/',
    name: 'ToolTrack | PDF, Compiler, Image & Productivity Tools',
    short_name: 'ToolTrack',
    description:
      'All-in-one PDF, image and document tools, Python/C/C++ compiler, Whiteboard and more.',
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
