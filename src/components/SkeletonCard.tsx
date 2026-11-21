import React from 'react';

interface SkeletonCardProps {
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ lines = 3 }) => {
  return (
    <div
      aria-busy="true"
      aria-label="Loading content"
      className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="animate-pulse space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="h-4 w-2/5 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className={`h-3.5 rounded bg-slate-200 dark:bg-slate-800 ${
              idx === lines - 1 ? 'w-4/6' : 'w-full'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
