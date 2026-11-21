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
        'bg-emerald-50 text-emerald-800 border-emerald-200/90 dark:bg-emerald-500/12 dark:text-emerald-300 dark:border-emerald-500/30',
    },
    UNDER_REVIEW: {
      label: t.badges.underReview,
      Icon: Clock,
      classes:
        'bg-blue-50 text-blue-800 border-blue-200/90 dark:bg-blue-500/12 dark:text-blue-300 dark:border-blue-500/30',
    },
    UNVERIFIED: {
      label: t.badges.unverified,
      Icon: HelpCircle,
      classes:
        'bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-500/12 dark:text-amber-300 dark:border-amber-500/30',
    },
    REJECTED: {
      label: t.badges.rejected,
      Icon: XCircle,
      classes:
        'bg-slate-100 text-slate-700 border-slate-300 dark:bg-[#172742] dark:text-[#9cb0cc] dark:border-[#2d456b]',
    },
  };

  const cfg = statusConfig[status];
  const Icon = cfg.Icon;

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${cfg.classes}`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{cfg.label}</span>
      </span>

      {isStale && (
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/90 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-200 whitespace-nowrap shrink-0">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{t.badges.staleData}</span>
        </span>
      )}

      {isDemo && (
        <span
          title="Sample demonstration record for prototype testing — not a live government feed"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-[#8295b3] whitespace-nowrap shrink-0"
        >
          <FlaskConical className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{t.badges.sampleDemo}</span>
        </span>
      )}
    </span>
  );
};

export const DemoDataNoticeBadge: React.FC = () => {
  const { t } = useApp();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/90 bg-amber-50/90 px-2.5 py-1 text-xs font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-200 whitespace-nowrap shrink-0">
      <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{t.badges.sampleDemoMode}</span>
    </span>
  );
};
