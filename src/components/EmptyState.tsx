import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#c2cfe2] bg-[#f8fafd] px-6 py-10 text-center dark:border-[#2d456b] dark:bg-[#0e1829]">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[#dce4f0] bg-white text-slate-500 shadow-xs dark:border-[#2d456b] dark:bg-[#142239] dark:text-[#9cb0cc]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="font-display text-base font-semibold text-slate-900 dark:text-[#e6edf7]">
        {title}
      </h3>
      <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-[#9cb0cc]">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="ne-btn-press mt-4 inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
