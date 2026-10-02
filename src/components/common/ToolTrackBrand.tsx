import React from 'react';

interface ToolTrackIconProps {
  className?: string;
  size?: number | string;
}

/**
 * Pixel-perfect SVG vector representation of the ToolTrack Brand Icon
 * based on the exact visual reference:
 * - Gradient squircle document (Purple #7c3aed -> Blue #2563eb -> Cyan #38bdf8)
 * - Folded top-right corner with soft drop shadow
 * - Inner midnight-blue document canvas
 * - Angled chrome/white wrench with round base
 * - Two 4-pointed sparkle stars
 */
export const ToolTrackIcon: React.FC<ToolTrackIconProps> = ({
  className = 'w-10 h-10',
}) => {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Outer Squircle Document Gradient: Purple -> Blue -> Cyan */}
        <linearGradient id="brandOuterGrad" x1="0.1" y1="0.95" x2="0.9" y2="0.05">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="22%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="78%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        {/* Top-Right Dog-Ear Fold Gradient */}
        <linearGradient id="brandFoldGrad" x1="0.1" y1="0.9" x2="0.85" y2="0.15">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>

        {/* Inner Dark Canvas Gradient with Deep Luminous Depth */}
        <linearGradient id="brandInnerBg" x1="0.15" y1="0.1" x2="0.85" y2="0.95">
          <stop offset="0%" stopColor="#10255c" />
          <stop offset="45%" stopColor="#0a173d" />
          <stop offset="100%" stopColor="#04091c" />
        </linearGradient>

        {/* Drop Shadow for Fold */}
        <filter id="brandFoldShadow" x="-20%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="-4" dy="8" stdDeviation="10" floodColor="#020817" floodOpacity="0.55" />
        </filter>
      </defs>

      {/* Outer Squircle Document Shape with Fold Cutout */}
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
        fill="url(#brandOuterGrad)"
      />

      {/* Inner Dark Document Window */}
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
        fill="url(#brandInnerBg)"
        className="transition-all duration-500 group-hover:brightness-125"
      />

      {/* Top-Right Fold Flap */}
      <path
        d="M 326 48
           C 328 130 334 186 334 186
           L 464 186
           C 464 150 440 90 410 72
           L 326 48 Z"
        fill="url(#brandFoldGrad)"
        filter="url(#brandFoldShadow)"
      />

      {/* Centered & Angled Wrench Tool (tilted at ~45 degrees) */}
      <g transform="translate(242, 268) rotate(-45)">
        {/* Wrench Shaft / Handle */}
        <path
          d="M -18 30
             L -14 135
             C -14 148 14 148 14 135
             L 18 30
             Z"
          fill="#ffffff"
        />
        {/* Rounded Base Loop */}
        <circle cx="0" cy="132" r="16" fill="#ffffff" />
        <circle cx="0" cy="132" r="7" fill="#0d1b3e" />

        {/* Wrench Head */}
        <path
          d="M -38 32
             C -46 -2 -24 -36 0 -42
             C 24 -36 46 -2 38 32
             C 30 46 16 48 0 48
             C -16 48 -30 46 -38 32 Z"
          fill="#ffffff"
        />
        {/* Wrench Jaws Opening */}
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

      {/* Sparkle Star 1: Upper Right */}
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

      {/* Sparkle Star 2: Lower Right */}
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
    </svg>
  );
};

interface ToolTrackBrandProps {
  className?: string;
  iconClassName?: string;
  showTextOnMobile?: boolean;
}

/**
 * Official ToolTrack Brand Logo & Wordmark
 * Displays:
 * [ToolTrack Icon]  ToolTrack
 *                   DOCUMENT SUITE
 * Automatically shows only the iconic brand mark on mobile for compact header presence.
 */
export const ToolTrackBrand: React.FC<ToolTrackBrandProps> = ({
  className = '',
  iconClassName = 'w-10 h-10',
  showTextOnMobile = false,
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon */}
      <div className="shrink-0 drop-shadow-xs group-hover:scale-105 group-hover:rotate-[-2deg] transition-all duration-300">
        <ToolTrackIcon className={iconClassName} />
      </div>

      {/* Brand Wordmark (Tool + Track) & Subtitle (Document Suite) */}
      <div className={`flex-col ${showTextOnMobile ? 'flex' : 'hidden sm:flex'}`}>
        <div className="flex items-center font-black text-[22px] tracking-tight leading-none group-hover:scale-[1.02] transition-transform duration-300">
          <span className="text-slate-900 dark:text-white transition-colors duration-300">
            Tool
          </span>
          <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent animate-gradient-flow bg-[length:200%_auto] ml-0.5">
            Track
          </span>
        </div>
        <span className="text-[9.5px] font-bold tracking-[0.28em] text-slate-500 dark:text-slate-400 uppercase leading-none mt-1 transition-all duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:tracking-[0.32em]">
          Document Suite
        </span>
      </div>
    </div>
  );
};
