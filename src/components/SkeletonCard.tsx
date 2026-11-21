import React from 'react';

interface SkeletonCardProps {
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ lines = 3 }) => {
  return (
    <div
      aria-busy="true"
      aria-label="Loading content"
      className="rounded-xl border ne-surface p-5"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="h-4 w-2/5 rounded ne-skeleton-bar" />
          <div className="h-4 w-20 rounded ne-skeleton-bar" />
        </div>
        <div className="h-5 w-3/4 rounded ne-skeleton-bar" />
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className={`h-3.5 rounded ne-skeleton-bar ${
              idx === lines - 1 ? 'w-4/6' : 'w-full'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
