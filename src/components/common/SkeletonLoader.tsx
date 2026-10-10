import React from 'react';

/**
 * Lightweight, shimmer-style skeleton loaders for ToolTrack.
 * Designed for 60fps GPU performance, non-blocking interaction,
 * and automatic accessibility with prefers-reduced-motion compliance.
 */

interface ToolCardSkeletonProps {
  className?: string;
}

export const ToolCardSkeleton: React.FC<ToolCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between h-40 overflow-hidden relative select-none pointer-events-none ${className}`}
    >
      <div className="space-y-3">
        {/* Top: Icon box & favorite star placeholder */}
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl animate-shimmer" />
          <div className="w-4 h-4 rounded-md animate-shimmer opacity-60" />
        </div>

        {/* Middle: Title & 2-line description */}
        <div className="space-y-2">
          <div className="h-4 w-3/5 rounded-md animate-shimmer" />
          <div className="space-y-1.5 pt-0.5">
            <div className="h-2.5 w-full rounded-md animate-shimmer opacity-75" />
            <div className="h-2.5 w-4/5 rounded-md animate-shimmer opacity-60" />
          </div>
        </div>
      </div>

      {/* Bottom: Action arrow link placeholder */}
      <div className="pt-2 flex items-center justify-between">
        <div className="h-3 w-16 rounded-md animate-shimmer opacity-70" />
        <div className="w-3.5 h-3.5 rounded-full animate-shimmer opacity-50" />
      </div>
    </div>
  );
};

interface ToolCardSkeletonGridProps {
  count?: number;
  className?: string;
}

export const ToolCardSkeletonGrid: React.FC<ToolCardSkeletonGridProps> = ({
  count = 8,
  className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading tools"
      className={className}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ToolCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading tools...</span>
    </div>
  );
};

/**
 * Lightweight, shimmer-style skeleton loader for tool-specific content areas.
 * Emulates the top action rail, main upload/workspace area, and settings panel.
 * Never blocks underlying interaction or navigation.
 */
interface ToolContentSkeletonProps {
  toolName?: string;
  categoryName?: string;
  className?: string;
}

export const ToolContentSkeleton: React.FC<ToolContentSkeletonProps> = ({
  toolName,
  categoryName,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={toolName ? `Loading ${toolName}...` : 'Loading tool...'}
      className={`space-y-6 max-w-5xl mx-auto w-full select-none ${className}`}
    >
      {/* 1. Header Card Skeleton */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl animate-shimmer" />
            <div className="space-y-1.5">
              <div className="h-5 w-44 sm:w-56 rounded-lg animate-shimmer" />
              <div className="h-3 w-28 rounded-md animate-shimmer opacity-70" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 rounded-full animate-shimmer opacity-75" />
            <div className="h-6 w-24 rounded-full animate-shimmer opacity-75" />
          </div>
        </div>

        {/* Description line placeholder */}
        <div className="space-y-1.5 pt-2 max-w-2xl">
          <div className="h-3.5 w-full rounded-md animate-shimmer opacity-80" />
          <div className="h-3.5 w-3/4 rounded-md animate-shimmer opacity-60" />
        </div>
      </div>

      {/* 2. Main Workspace / Dropzone Skeleton */}
      <div className="p-8 sm:p-12 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-850/60 min-h-[260px] flex flex-col items-center justify-center space-y-4 text-center relative overflow-hidden">
        {/* Upload cloud icon shimmer */}
        <div className="w-16 h-16 rounded-2xl animate-shimmer" />

        <div className="space-y-2 max-w-sm w-full flex flex-col items-center">
          <div className="h-4 w-48 rounded-lg animate-shimmer" />
          <div className="h-3 w-64 max-w-full rounded-md animate-shimmer opacity-70" />
        </div>

        {/* Action Button placeholder */}
        <div className="pt-2">
          <div className="h-10 w-40 rounded-xl animate-shimmer" />
        </div>
      </div>

      {/* 3. Settings / Controls Panel Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded-md animate-shimmer" />
              <div className="w-4 h-4 rounded-full animate-shimmer opacity-60" />
            </div>
            <div className="h-8 w-full rounded-xl animate-shimmer opacity-85" />
            <div className="h-2.5 w-4/5 rounded-md animate-shimmer opacity-60" />
          </div>
        ))}
      </div>

      <span className="sr-only">Loading tool workspace...</span>
    </div>
  );
};

/**
 * Lightweight shimmer placeholder for file list items or upload stages
 */
export const FileRowSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`p-3.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 overflow-hidden relative select-none pointer-events-none ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-lg animate-shimmer shrink-0" />
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="h-3.5 w-48 max-w-full rounded-md animate-shimmer" />
          <div className="h-2.5 w-24 rounded-md animate-shimmer opacity-65" />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-6 w-16 rounded-lg animate-shimmer opacity-80" />
        <div className="w-6 h-6 rounded-md animate-shimmer opacity-50" />
      </div>
    </div>
  );
};
