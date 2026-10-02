import React from 'react';

interface ToolTrackIconProps {
  className?: string;
  size?: number | string;
}

/**
 * Minimalist, Modern, High-Precision Vector Icon for ToolTrack
 * Clean geometric mark combining:
 * - Refined dark obsidian rounded squircle
 * - Dual-layer precision geometric "T" monogram & document track
 * - High-contrast electric indigo & ice-cyan minimalist accents
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
        {/* Subtle Obsidian Background Gradient */}
        <linearGradient id="ttBgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#090d16" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        {/* Minimalist Electric Indigo to Sky Gradient */}
        <linearGradient id="ttPrimaryGrad" x1="120" y1="120" x2="390" y2="390" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        {/* Cyan / Ice Accent Gradient */}
        <linearGradient id="ttAccentGrad" x1="260" y1="120" x2="400" y2="260" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>

        {/* Crisp Border Rim Gradient */}
        <linearGradient id="ttRimGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="40%" stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
        </linearGradient>

        {/* Subtle glow filter */}
        <filter id="ttGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="12" floodColor="#4f46e5" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Base Rounded Squircle with Subtle Rim */}
      <rect
        x="32"
        y="32"
        width="448"
        height="448"
        rx="112"
        fill="url(#ttBgGrad)"
        stroke="url(#ttRimGrad)"
        strokeWidth="3.5"
      />

      {/* Background Micro Precision Grid Lines */}
      <g opacity="0.08" stroke="#ffffff" strokeWidth="2">
        <line x1="128" y1="32" x2="128" y2="480" />
        <line x1="256" y1="32" x2="256" y2="480" />
        <line x1="384" y1="32" x2="384" y2="480" />
        <line x1="32" y1="128" x2="480" y2="128" />
        <line x1="32" y1="256" x2="480" y2="256" />
        <line x1="32" y1="384" x2="480" y2="384" />
      </g>

      {/* Main Glyph: Modern Geometric Monogram "T" with Precision File Track */}
      <g filter="url(#ttGlow)">
        {/* Horizontal Top Bar - Left Segment */}
        <path
          d="M 140 148
             C 140 134.745 150.745 124 164 124
             L 246 124
             L 246 196
             L 164 196
             C 150.745 196 140 185.255 140 172
             Z"
          fill="url(#ttPrimaryGrad)"
        />

        {/* Horizontal Top Bar - Right Segment (Fold Accent) */}
        <path
          d="M 266 124
             L 348 124
             C 361.255 124 372 134.745 372 148
             L 372 172
             C 372 185.255 361.255 196 348 196
             L 266 196
             Z"
          fill="url(#ttAccentGrad)"
        />

        {/* Vertical Track Pillar (Center Column) */}
        <path
          d="M 220 216
             L 292 216
             L 292 344
             C 292 357.255 281.255 368 268 368
             L 244 368
             C 230.745 368 220 357.255 220 344
             Z"
          fill="url(#ttPrimaryGrad)"
        />

        {/* Precision Geometric File-Track Chevrons / Fast Track Dots */}
        <path
          d="M 330 252
             L 358 280
             L 330 308"
          stroke="#38bdf8"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Left Companion Precision Dot */}
        <circle cx="168" cy="280" r="10" fill="#6366f1" />
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
 * Clean, minimalistic, and professional SaaS typography
 */
export const ToolTrackBrand: React.FC<ToolTrackBrandProps> = ({
  className = '',
  iconClassName = 'w-9 h-9',
  showTextOnMobile = false,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Minimalist Brand Icon */}
      <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
        <ToolTrackIcon className={iconClassName} />
      </div>

      {/* Brand Wordmark (ToolTrack + Minimal Tag) */}
      <div className={`flex-col justify-center ${showTextOnMobile ? 'flex' : 'hidden sm:flex'}`}>
        <div className="flex items-center text-[20px] tracking-tight leading-tight">
          <span className="font-bold text-slate-900 dark:text-white">
            Tool
          </span>
          <span className="font-extrabold text-indigo-600 dark:text-indigo-400 ml-0.5">
            Track
          </span>
        </div>
        <span className="text-[9.5px] font-medium tracking-[0.22em] text-slate-500 dark:text-slate-400 uppercase leading-none mt-0.5">
          Workspace
        </span>
      </div>
    </div>
  );
};
