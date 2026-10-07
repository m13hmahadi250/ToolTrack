/**
 * Professional Whiteboard Pen & Tool Cursors
 * Provides hardware-accelerated SVG data-URI cursors with sub-pixel aligned hotspots (2, 2).
 * Ensures zero-latency cursor tracking aligned with the actual ink deposition point.
 */

export type PenCursorChoice = 'auto' | 'fountain' | 'ballpoint' | 'stylus' | 'pencil' | 'precision';

export interface CursorConfig {
  tool: string;
  penStyle?: string;
  cursorChoice?: PenCursorChoice;
  strokeColor?: string;
  strokeWidth?: number;
  eraserSize?: number;
  isDarkBackground?: boolean;
}

// Helper to escape SVG for CSS data URI
function svgToDataUri(svg: string): string {
  const cleaned = svg
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'")
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E');
  return `data:image/svg+xml;utf8,${cleaned}`;
}

/**
 * 1. Classic Fountain Pen Nib (Hotspot 2, 2)
 * Features an authentic angled metallic nib with ink slit, breather hole, and active ink accent.
 */
function getFountainPenSvg(color = '#6366f1'): string {
  return `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0.5" dy="1" stdDeviation="0.75" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
    <linearGradient id="nibMetal" x1="2" y1="2" x2="16" y2="16" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#cbd5e1"/>
      <stop offset="70%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <linearGradient id="nibBody" x1="10" y1="10" x2="26" y2="26" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>

  <g filter="url(#shadow)">
    <!-- Pen Barrel -->
    <path d="M15 11 L25 21 C26.5 22.5 26.5 24.5 25 26 C23.5 27.5 21.5 27.5 20 26 L11 17 Z" fill="url(#nibBody)" stroke="#334155" stroke-width="0.8"/>
    <!-- Gold/Silver Collar Accent -->
    <path d="M13.5 9.5 L18.5 14.5 L16.5 16.5 L11.5 11.5 Z" fill="#f59e0b" stroke="#b45309" stroke-width="0.5"/>

    <!-- Metallic Nib Silhouette -->
    <path d="M2 2 L9 4.5 C12 6 14 8 15 11 L11 15 C8 14 6 12 4.5 9 Z" fill="url(#nibMetal)" stroke="#0f172a" stroke-width="0.9" stroke-linejoin="round"/>

    <!-- Active Ink Accent in Reservoir Breather Hole -->
    <circle cx="8" cy="8" r="1.4" fill="${color}" stroke="#0f172a" stroke-width="0.5"/>

    <!-- Precision Nib Slit -->
    <path d="M2.5 2.5 L7 7" stroke="#0f172a" stroke-width="0.8" stroke-linecap="round"/>

    <!-- Extreme Nib Tip Indicator -->
    <circle cx="2" cy="2" r="0.8" fill="${color}"/>
  </g>
</svg>`.trim();
}

/**
 * 2. Ballpoint / Technical Pen (Hotspot 2, 2)
 * Sleek metallic taper with precision ball tip and active color band.
 */
function getBallpointSvg(color = '#6366f1'): string {
  return `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="bpShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0.5" dy="1" stdDeviation="0.75" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
    <linearGradient id="coneMetal" x1="2" y1="2" x2="12" y2="12" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="50%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <linearGradient id="bpBarrel" x1="10" y1="10" x2="26" y2="26" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>

  <g filter="url(#bpShadow)">
    <!-- Pen Barrel -->
    <path d="M12 8 L24 20 C25.5 21.5 25.5 23.5 24 25 C22.5 26.5 20.5 26.5 19 25 L8 14 Z" fill="url(#bpBarrel)" stroke="#1e3a8a" stroke-width="0.8"/>
    
    <!-- Active Color Grip Ring -->
    <path d="M10 6 L14 10 L12.5 11.5 L8.5 7.5 Z" fill="${color}" stroke="#0f172a" stroke-width="0.6"/>

    <!-- Metallic Nose Cone -->
    <path d="M2.5 2.5 L8.5 4.5 L10.5 6.5 L6.5 10.5 L4.5 8.5 Z" fill="url(#coneMetal)" stroke="#0f172a" stroke-width="0.8" stroke-linejoin="round"/>

    <!-- Micro Tungsten Ball Tip -->
    <circle cx="2" cy="2" r="1.1" fill="${color}" stroke="#0f172a" stroke-width="0.6"/>
  </g>
</svg>`.trim();
}

/**
 * 3. Digital Stylus / Apple Pencil (Hotspot 2, 2)
 * Clean modern minimalist white stylus with active tip indicator.
 */
function getStylusSvg(color = '#6366f1'): string {
  return `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="stylusShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0.5" dy="1" stdDeviation="0.75" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <g filter="url(#stylusShadow)">
    <!-- Stylus Body -->
    <path d="M10 6 L24 20 C25 21 25 22.5 24 23.5 C23 24.5 21.5 24.5 20.5 23.5 L6.5 9.5 Z" fill="#ffffff" stroke="#94a3b8" stroke-width="0.8"/>
    
    <!-- Silicone Tip Cone -->
    <path d="M2 2 L8 4 L10 6 L6 10 L4 8 Z" fill="#f1f5f9" stroke="#64748b" stroke-width="0.8" stroke-linejoin="round"/>

    <!-- Subtle Accent Band -->
    <path d="M9.5 5.5 L12.5 8.5 L11.5 9.5 L8.5 6.5 Z" fill="${color}" opacity="0.85"/>

    <!-- Responsive Tip Dot -->
    <circle cx="2" cy="2" r="1" fill="${color}" stroke="#334155" stroke-width="0.5"/>
  </g>
</svg>`.trim();
}

/**
 * 4. Classic Wood Pencil (Hotspot 2, 2)
 * Natural sharpened wood cone with graphite lead point.
 */
function getPencilSvg(color = '#6366f1'): string {
  return `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="pencilShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0.5" dy="1" stdDeviation="0.75" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>

  <g filter="url(#pencilShadow)">
    <!-- Yellow Hexagonal Shaft -->
    <path d="M11 7 L24 20 C25 21 25 22.5 24 23.5 C23 24.5 21.5 24.5 20.5 23.5 L7 11 Z" fill="#f59e0b" stroke="#b45309" stroke-width="0.8"/>
    <!-- Pencil Stripe -->
    <path d="M9 9 L22 22" stroke="#d97706" stroke-width="1.2"/>

    <!-- Cedar Wood Cone -->
    <path d="M2 2 L9 5 L11 7 L7 11 L5 9 Z" fill="#fed7aa" stroke="#78350f" stroke-width="0.8" stroke-linejoin="round"/>

    <!-- Graphite Lead Tip -->
    <path d="M2 2 L5 3.2 L3.2 5 Z" fill="${color === '#ffffff' ? '#334155' : color}" stroke="#1e293b" stroke-width="0.5"/>
  </g>
</svg>`.trim();
}

/**
 * 5. Highlighter Chisel Tip (Hotspot 2, 2)
 * Angled translucent chisel tip showing broad highlight edge.
 */
function getHighlighterSvg(color = '#eab308'): string {
  return `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="hlShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0.5" dy="1" stdDeviation="0.75" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>

  <g filter="url(#hlShadow)">
    <!-- Bold Marker Barrel -->
    <path d="M12 8 L23 19 C24.5 20.5 24.5 22.5 23 24 C21.5 25.5 19.5 25.5 18 24 L7 13 Z" fill="#1e293b" stroke="#475569" stroke-width="0.9"/>
    
    <!-- Fluorescent Barrel Ring -->
    <path d="M10 6 L14 10 L12.5 11.5 L8.5 7.5 Z" fill="${color}"/>

    <!-- Chisel Tip Guide -->
    <path d="M2 2 L7 3 L9 5 L5 9 L3 7 Z" fill="#334155" stroke="#0f172a" stroke-width="0.7"/>

    <!-- Chisel Felt Tip (Slanted angle) -->
    <polygon points="2,2 8,3 6,7 1.5,4" fill="${color}" stroke="#0f172a" stroke-width="0.6"/>
  </g>
</svg>`.trim();
}

/**
 * 6. Precision Eraser Target Ring Cursor
 * Circular boundary indicating erase contact zone with center target dot,
 * dynamically scaled to match active eraser size.
 */
function getEraserSvg(size = 24): { svg: string; hotspot: number } {
  const diameter = Math.max(16, Math.min(Math.round(size), 48));
  const radius = Math.max(4, (diameter - 6) / 2);
  const center = diameter / 2;
  const svg = `
<svg width="${diameter}" height="${diameter}" viewBox="0 0 ${diameter} ${diameter}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="erShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <g filter="url(#erShadow)">
    <!-- White High-Contrast Outer Ring -->
    <circle cx="${center}" cy="${center}" r="${radius}" stroke="#ffffff" stroke-width="2" fill="none"/>
    <!-- Rose Crimson Active Target Ring -->
    <circle cx="${center}" cy="${center}" r="${radius}" stroke="#f43f5e" stroke-width="1.3" fill="rgba(244, 63, 94, 0.16)"/>

    <!-- Center Precision Target Dot -->
    <circle cx="${center}" cy="${center}" r="2" fill="#ffffff"/>
    <circle cx="${center}" cy="${center}" r="1.2" fill="#f43f5e"/>

    <!-- Cardinal Alignment Ticks -->
    <line x1="${center}" y1="1" x2="${center}" y2="3.5" stroke="#ffffff" stroke-width="1.8"/>
    <line x1="${center}" y1="1" x2="${center}" y2="3.5" stroke="#f43f5e" stroke-width="1"/>
    <line x1="${center}" y1="${diameter - 3.5}" x2="${center}" y2="${diameter - 1}" stroke="#ffffff" stroke-width="1.8"/>
    <line x1="${center}" y1="${diameter - 3.5}" x2="${center}" y2="${diameter - 1}" stroke="#f43f5e" stroke-width="1"/>
    <line x1="1" y1="${center}" x2="3.5" y2="${center}" stroke="#ffffff" stroke-width="1.8"/>
    <line x1="1" y1="${center}" x2="3.5" y2="${center}" stroke="#f43f5e" stroke-width="1"/>
    <line x1="${diameter - 3.5}" y1="${center}" x2="${diameter - 1}" y2="${center}" stroke="#ffffff" stroke-width="1.8"/>
    <line x1="${diameter - 3.5}" y1="${center}" x2="${diameter - 1}" y2="${center}" stroke="#f43f5e" stroke-width="1"/>
  </g>
</svg>`.trim();
  return { svg, hotspot: Math.round(center) };
}

/**
 * 7. Precision Needle Dot / Technical Pen (Hotspot 2, 2)
 */
function getPrecisionDotSvg(color = '#6366f1'): string {
  return `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="pDotShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>
  <g filter="url(#pDotShadow)">
    <circle cx="2" cy="2" r="3.2" stroke="#ffffff" stroke-width="1.6" fill="none"/>
    <circle cx="2" cy="2" r="2.2" stroke="#0f172a" stroke-width="1" fill="${color}"/>
    <!-- Micro Crosshair lines extending outward -->
    <line x1="7" y1="2" x2="13" y2="2" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="2" y1="7" x2="2" y2="13" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>
  </g>
</svg>`.trim();
}

/**
 * 8. Lasso Tool Cursor (Hotspot 2, 2)
 */
function getLassoSvg(): string {
  return `
<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="lassoShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0.5" dy="1" stdDeviation="0.75" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <g filter="url(#lassoShadow)">
    <!-- Lasso Loop Outline -->
    <path d="M12 4 C6 4 3 8 3 13 C3 18 8 21 13 21 C18 21 22 17 22 12 C22 7 17 4 12 4 Z" 
      stroke="#ffffff" stroke-width="3" stroke-dasharray="3 2" fill="none"/>
    <path d="M12 4 C6 4 3 8 3 13 C3 18 8 21 13 21 C18 21 22 17 22 12 C22 7 17 4 12 4 Z" 
      stroke="#6366f1" stroke-width="1.8" stroke-dasharray="3 2" fill="rgba(99, 102, 241, 0.15)"/>
    <!-- Lasso Knot & Tip -->
    <circle cx="2" cy="2" r="1.5" fill="#6366f1" stroke="#ffffff" stroke-width="1"/>
    <path d="M2 2 L6 6" stroke="#6366f1" stroke-width="1.8" stroke-linecap="round"/>
  </g>
</svg>`.trim();
}

/**
 * Generates the complete CSS cursor declaration string
 * with exact hotspot alignment and fallback cursors.
 */
export function getWhiteboardCursorStyle(config: CursorConfig): string {
  const { tool, penStyle = 'fountain', cursorChoice = 'auto', strokeColor = '#6366f1' } = config;

  if (tool === 'eraser') {
    const { svg, hotspot } = getEraserSvg(config.eraserSize || 24);
    const uri = svgToDataUri(svg);
    return `url("${uri}") ${hotspot} ${hotspot}, crosshair`;
  }

  if (tool === 'lasso') {
    const svg = getLassoSvg();
    const uri = svgToDataUri(svg);
    return `url("${uri}") 2 2, crosshair`;
  }

  if (tool === 'highlighter' || penStyle === 'highlighter') {
    const svg = getHighlighterSvg(strokeColor);
    const uri = svgToDataUri(svg);
    return `url("${uri}") 2 2, crosshair`;
  }

  if (tool === 'pencil' || penStyle === 'pencil') {
    const svg = getPencilSvg(strokeColor);
    const uri = svgToDataUri(svg);
    return `url("${uri}") 2 2, crosshair`;
  }

  // If specific cursor style override is chosen
  if (cursorChoice === 'precision') {
    const svg = getPrecisionDotSvg(strokeColor);
    return `url("${svgToDataUri(svg)}") 2 2, crosshair`;
  }
  if (cursorChoice === 'ballpoint') {
    const svg = getBallpointSvg(strokeColor);
    return `url("${svgToDataUri(svg)}") 2 2, crosshair`;
  }
  if (cursorChoice === 'stylus') {
    const svg = getStylusSvg(strokeColor);
    return `url("${svgToDataUri(svg)}") 2 2, crosshair`;
  }
  if (cursorChoice === 'pencil') {
    const svg = getPencilSvg(strokeColor);
    return `url("${svgToDataUri(svg)}") 2 2, crosshair`;
  }

  // Default / Auto based on pen style
  if (penStyle === 'ballpoint' || penStyle === 'fine') {
    const svg = getBallpointSvg(strokeColor);
    return `url("${svgToDataUri(svg)}") 2 2, crosshair`;
  }

  if (penStyle === 'marker') {
    const svg = getStylusSvg(strokeColor);
    return `url("${svgToDataUri(svg)}") 2 2, crosshair`;
  }

  // Default pen is the elegant Fountain Pen Nib
  const svg = getFountainPenSvg(strokeColor);
  return `url("${svgToDataUri(svg)}") 2 2, crosshair`;
}
