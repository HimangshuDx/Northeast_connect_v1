import React from 'react';
import { AlertOctagon, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { AdvisorySeverity, IncidentSeverity } from '../types';

type SeverityLevel = AdvisorySeverity | IncidentSeverity;

interface SeverityBadgeProps {
  severity: SeverityLevel;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const map: Record<
    SeverityLevel,
    { label: string; Icon: React.ComponentType<{ className?: string }>; classes: string }
  > = {
    CRITICAL: {
      label: 'Critical',
      Icon: AlertOctagon,
      classes:
        'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800/80',
    },
    HIGH: {
      label: 'High Severity',
      Icon: ShieldAlert,
      classes:
        'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800/80',
    },
    WARNING: {
      label: 'Warning',
      Icon: AlertTriangle,
      classes:
        'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800/80',
    },
    MODERATE: {
      label: 'Moderate',
      Icon: AlertTriangle,
      classes:
        'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80',
    },
    WATCH: {
      label: 'Watch',
      Icon: Info,
      classes:
        'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80',
    },
    LOW: {
      label: 'Low',
      Icon: Info,
      classes:
        'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    },
  };

  const cfg = map[severity];
  const Icon = cfg.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap shrink-0 ${cfg.classes}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{cfg.label}</span>
    </span>
  );
};
