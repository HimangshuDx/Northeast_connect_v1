import React from 'react';
import { CheckCircle2, Clock, HelpCircle, ShieldAlert, XCircle, FlaskConical } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TrustStatus } from '../types';

interface TrustBadgeProps {
  status: TrustStatus;
  isDemo?: boolean;
  isStale?: boolean;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ status, isDemo, isStale }) => {
  const { t } = useApp();

  const statusConfig: Record<
    TrustStatus,
    { label: string; Icon: React.ComponentType<{ className?: string }>; classes: string }
  > = {
    VERIFIED: {
      label: t.badges.verified,
      Icon: CheckCircle2,
      classes:
        'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
    },
    UNDER_REVIEW: {
      label: t.badges.underReview,
      Icon: Clock,
      classes:
        'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80',
    },
    UNVERIFIED: {
      label: t.badges.unverified,
      Icon: HelpCircle,
      classes:
        'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
    },
    REJECTED: {
      label: t.badges.rejected,
      Icon: XCircle,
      classes:
        'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    },
  };

  const cfg = statusConfig[status];
  const Icon = cfg.Icon;

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${cfg.classes}`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{cfg.label}</span>
      </span>

      {isStale && (
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/60 dark:text-amber-200 whitespace-nowrap shrink-0">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{t.badges.staleData}</span>
        </span>
      )}

      {isDemo && (
        <span
          title="Sample demonstration record for prototype testing — not a live government feed"
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300 whitespace-nowrap shrink-0"
        >
          <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{t.badges.sampleDemo}</span>
        </span>
      )}
    </span>
  );
};

export const DemoDataNoticeBadge: React.FC = () => {
  const { t } = useApp();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300/80 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 dark:border-amber-700/70 dark:bg-amber-950/50 dark:text-amber-200 whitespace-nowrap shrink-0">
      <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{t.badges.sampleDemoMode}</span>
    </span>
  );
};
