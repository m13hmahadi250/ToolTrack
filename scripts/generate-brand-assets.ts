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
    <!-- Outer Squircle Document with Fold Cut -->
    <!-- Path starts top-left (rounded), runs down left, rounded bottom-left, across bottom, rounded bottom-right, up right to fold cut, across to top fold cut, rounded top-left -->
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

    <!-- Inner Dark Document Window -->
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

    <!-- Top-Right Fold Flap with Shadow -->
    <path
      d="M 326 48
         C 326 48 332 186 332 186
         C 332 186 464 186 464 186
         L 326 48 Z"
      fill="url(#ttFoldGrad)"
      filter="url(#ttFoldShadow)"
    />
    <!-- Fold flap rounded outer edge -->
    <path
      d="M 326 48
         C 328 130 334 186 334 186
         L 464 186
         C 464 150 440 90 410 72
         L 326 48 Z"
      fill="url(#ttFoldGrad)"
    />

    <!-- Inside Page: Wrench / Spanner Tool -->
    <!-- Centered & angled at 45 degrees -->
    <g transform="translate(242, 268) rotate(-45)">
      <!-- Wrench Handle -->
      <path
        d="M -18 30
           L -14 135
           C -14 148 14 148 14 135
           L 18 30
           Z"
        fill="#ffffff"
      />
      <!-- Wrench Rounded Bottom Loop -->
      <circle cx="0" cy="132" r="16" fill="#ffffff" />
      <circle cx="0" cy="132" r="7" fill="#0d1b3e" />

      <!-- Wrench Open Head -->
      <path
        d="M -38 32
           C -46 -2 -24 -36 0 -42
           C 24 -36 46 -2 38 32
           C 30 46 16 48 0 48
           C -16 48 -30 46 -38 32 Z"
        fill="#ffffff"
      />
      <!-- Wrench Jaws Cutout -->
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

    <!-- Sparkle Stars -->
    <!-- 1. Large Sparkle Star (upper right of tool) -->
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

    <!-- 2. Small Sparkle Star (lower right of tool) -->
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

  <!-- Scaled Icon on Left (150x150 in 180h viewport) -->
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

  <!-- Wordmark: ToolTrack -->
  <text x="185" y="102" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="82" font-weight="800" letter-spacing="-1.5">
    <tspan fill="#ffffff">Tool</tspan><tspan fill="url(#ttTrackGradFull)">Track</tspan>
  </text>

  <!-- Subtitle: Document Suite -->
  <text x="190" y="145" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="28" font-weight="500" letter-spacing="9" fill="#94a3b8">
    DOCUMENT SUITE
  </text>
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
    const filename = s === 180 ? 'apple-touch-icon.png' : s === 192 ? 'icon-192.png' : s === 512 ? 'icon-512.png' : `favicon-${s}x${s}.png`;
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

  // 3. Write PWA Web App Manifest
  const manifest = {
    name: "ToolTrack Document Suite",
    short_name: "ToolTrack",
    description: "All-in-one PDF, image, and document processing platform with real client-side utilities.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a1128",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
  fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
  console.log('Generated site.webmanifest');
}

main().catch(console.error);
