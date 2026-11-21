import React from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  Mountain,
  Send,
  Truck,
  Waves,
  XCircle,
} from 'lucide-react';
import {
  AssistanceStatus,
  CapacityStatus,
  CorridorPassability,
  OutboxSyncStatus,
} from '../types';

type StatusVariant =
  | { kind: 'corridor'; value: CorridorPassability }
  | { kind: 'assistance'; value: AssistanceStatus }
  | { kind: 'capacity'; value: CapacityStatus }
  | { kind: 'outbox'; value: OutboxSyncStatus };

interface StatusStyle {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  classes: string;
  spin?: boolean;
}

const CORRIDOR_MAP: Record<CorridorPassability, StatusStyle> = {
  PASSABLE: {
    label: 'Passable',
    Icon: CheckCircle2,
    classes:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
  },
  SINGLE_LANE: {
    label: 'Single Lane',
    Icon: AlertTriangle,
    classes:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
  },
  LANDSLIDE_BLOCKED: {
    label: 'Landslide Blocked',
    Icon: Mountain,
    classes:
      'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800/80',
  },
  SUBMERGED: {
    label: 'Submerged',
    Icon: Waves,
    classes:
      'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800/80',
  },
  CLOSED: {
    label: 'Closed',
    Icon: Ban,
    classes:
      'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800/80',
  },
  UNKNOWN: {
    label: 'Unknown',
    Icon: HelpCircle,
    classes:
      'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
};

const ASSISTANCE_MAP: Record<AssistanceStatus, StatusStyle> = {
  SUBMITTED: {
    label: 'Help: Submitted',
    Icon: Clock,
    classes:
      'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
  ACCEPTED: {
    label: 'Help: Accepted',
    Icon: Send,
    classes:
      'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80',
  },
  DISPATCHED: {
    label: 'Help: Dispatched',
    Icon: Truck,
    classes:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
  },
  RESOLVED: {
    label: 'Help: Resolved',
    Icon: CheckCircle2,
    classes:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
  },
};

const CAPACITY_MAP: Record<CapacityStatus, StatusStyle> = {
  OPEN_AVAILABLE: {
    label: 'Open Available',
    Icon: CheckCircle2,
    classes:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
  },
  NEAR_CAPACITY: {
    label: 'Near Capacity',
    Icon: AlertTriangle,
    classes:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
  },
  FULL: {
    label: 'Full',
    Icon: Ban,
    classes:
      'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800/80',
  },
  TEMPORARILY_CLOSED: {
    label: 'Temporarily Closed',
    Icon: XCircle,
    classes:
      'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800/80',
  },
  UNKNOWN: {
    label: 'Unknown',
    Icon: HelpCircle,
    classes:
      'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
};

const OUTBOX_MAP: Record<OutboxSyncStatus, StatusStyle> = {
  PENDING: {
    label: 'Pending (Saved Locally)',
    Icon: Clock,
    classes:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
  },
  SYNCING: {
    label: 'Syncing',
    Icon: Loader2,
    classes:
      'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80',
    spin: true,
  },
  SYNCED: {
    label: 'Synced',
    Icon: CheckCircle2,
    classes:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
  },
  FAILED: {
    label: 'Sync Failed',
    Icon: XCircle,
    classes:
      'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800/80',
  },
};

export const StatusPill: React.FC<StatusVariant> = (props) => {
  let style: StatusStyle;
  switch (props.kind) {
    case 'corridor':
      style = CORRIDOR_MAP[props.value];
      break;
    case 'assistance':
      style = ASSISTANCE_MAP[props.value];
      break;
    case 'capacity':
      style = CAPACITY_MAP[props.value];
      break;
    case 'outbox':
      style = OUTBOX_MAP[props.value];
      break;
  }

  const Icon = style.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${style.classes}`}
    >
      <Icon
        className={`h-3.5 w-3.5 shrink-0 ${style.spin ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      <span>{style.label}</span>
    </span>
  );
};
