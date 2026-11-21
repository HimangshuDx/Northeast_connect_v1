import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

export const NE_EASE = [0.16, 1, 0.3, 1] as const;

export const NE_TRANSITION = {
  duration: 0.22,
  ease: NE_EASE,
} as const;

export const NE_FAST_TRANSITION = {
  duration: 0.16,
  ease: NE_EASE,
} as const;

interface PageTransitionProps {
  children: React.ReactNode;
  routeKey: string;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  routeKey,
  className = '',
}) => (
  <motion.div
    key={routeKey}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: NE_EASE }}
    className={className}
  >
    {children}
  </motion.div>
);

interface ViewCrossfadeProps {
  children: React.ReactNode;
  viewKey: string;
  className?: string;
}

export const ViewCrossfade: React.FC<ViewCrossfadeProps> = ({
  children,
  viewKey,
  className = '',
}) => (
  <AnimatePresence mode="wait" initial={false}>
    <motion.div
      key={viewKey}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={NE_FAST_TRANSITION}
      className={className}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

export interface SegmentedTabItem<T extends string> {
  key: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SegmentedTabsProps<T extends string> {
  items: readonly SegmentedTabItem<T>[];
  value: T;
  onChange: (next: T) => void;
  layoutId: string;
  ariaLabel?: string;
  tone?: 'blue' | 'emerald' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  layoutId,
  ariaLabel,
  tone = 'neutral',
  size = 'sm',
  className = '',
}: SegmentedTabsProps<T>) {
  const pillStyle =
    tone === 'emerald'
      ? 'bg-emerald-600 shadow-xs'
      : tone === 'blue'
      ? 'bg-blue-600 shadow-xs'
      : 'bg-white shadow-xs ring-1 ring-slate-200/80 dark:bg-[#101b2e] dark:ring-[#2d456b]';

  const activeTextStyle =
    tone === 'neutral'
      ? 'text-slate-900 dark:text-[#e6edf7]'
      : 'text-white';

  const inactiveTextStyle =
    'text-slate-600 hover:text-slate-900 dark:text-[#94a7c4] dark:hover:text-[#e6edf7]';

  const heightClass = size === 'md' ? 'min-h-[44px] px-3.5 py-2' : 'min-h-[44px] px-3 py-1.5';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex max-w-full flex-wrap items-center gap-1 rounded-xl border border-[#dce4f0] bg-[#edf2f8] p-1 dark:border-[#1f3250] dark:bg-[#0d1728] ${className}`}
    >
      {items.map((item) => {
        const active = item.key === value;
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={`relative inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ne-btn-press ${heightClass} ${
              active ? activeTextStyle : inactiveTextStyle
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                className={`absolute inset-0 rounded-lg ${pillStyle}`}
                aria-hidden="true"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              <span>{item.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface AnimatedRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const AnimatedReveal: React.FC<AnimatedRevealProps> = ({
  children,
  delay = 0,
  className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22, delay, ease: NE_EASE }}
    className={className}
  >
    {children}
  </motion.div>
);
