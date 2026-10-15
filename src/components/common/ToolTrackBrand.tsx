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
        {/* Deep Navy Background Gradient */}
        <linearGradient id="ttBgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#101828" />
          <stop offset="50%" stopColor="#0B1220" />
          <stop offset="100%" stopColor="#070B14" />
        </linearGradient>

        {/* Primary Electric Blue Gradient */}
        <linearGradient id="ttPrimaryGrad" x1="120" y1="120" x2="390" y2="390" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        {/* Cyan / Ice Accent Gradient */}
        <linearGradient id="ttAccentGrad" x1="260" y1="120" x2="400" y2="260" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>

        {/* Crisp Border Rim Gradient */}
        <linearGradient id="ttRimGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="40%" stopColor="#2563EB" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.08" />
        </linearGradient>

        {/* Subtle glow filter */}
        <filter id="ttGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="12" floodColor="#2563EB" floodOpacity="0.35" />
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
        <g className="transition-transform duration-200 ease-out group-hover:translate-x-2">
          <path
            d="M 330 252
               L 358 280
               L 330 308"
            stroke="#38bdf8"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Left Companion Precision Dot */}
        <circle cx="168" cy="280" r="10" fill="#2563EB" className="transition-transform duration-200 ease-out group-hover:scale-125" style={{ transformOrigin: '168px 280px' }} />
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
 * Clean, minimalistic, and professional SaaS typography with subtle reveal & hover micro-interactions
 */
export const ToolTrackBrand: React.FC<ToolTrackBrandProps> = ({
  className = '',
  iconClassName = 'w-9 h-9',
  showTextOnMobile = false,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Minimalist Brand Icon with initial reveal & restrained hover micro-lift */}
      <div className="shrink-0 animate-brand-reveal transition-all duration-200 ease-out group-hover:scale-[1.04] group-hover:drop-shadow-[0_4px_12px_rgba(99,102,241,0.22)]">
        <ToolTrackIcon className={iconClassName} />
      </div>

      {/* Brand Wordmark (ToolTrack + Minimal Tag) */}
      <div className={`flex-col justify-center animate-brand-reveal ${showTextOnMobile ? 'flex' : 'hidden sm:flex'}`}>
        <div className="flex items-center text-[20px] tracking-tight leading-tight">
          <span className="font-bold text-[#101828] dark:text-[#F2F4F7] transition-colors duration-160">
            Tool
          </span>
          <span className="font-extrabold text-[#2563EB] dark:text-[#3B82F6] ml-0.5 transition-colors duration-160 group-hover:text-[#1D4ED8] dark:group-hover:text-[#60A5FA]">
            Track
          </span>
        </div>
        <span className="text-[9px] font-bold tracking-[0.16em] group-hover:tracking-[0.18em] text-[#2563EB] dark:text-[#3B82F6] uppercase leading-none mt-0.5 transition-all duration-160">
          Productivity Toolkit
        </span>
      </div>
    </div>
  );
};
