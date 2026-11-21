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

const GREEN =
  'bg-emerald-50 text-emerald-800 border-emerald-200/90 dark:bg-emerald-500/12 dark:text-emerald-300 dark:border-emerald-500/30';
const AMBER =
  'bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-500/12 dark:text-amber-300 dark:border-amber-500/30';
const RED =
  'bg-red-50 text-red-800 border-red-200/90 dark:bg-red-500/14 dark:text-red-300 dark:border-red-500/35';
const BLUE =
  'bg-blue-50 text-blue-800 border-blue-200/90 dark:bg-blue-500/14 dark:text-blue-300 dark:border-blue-500/35';
const NEUTRAL =
  'bg-slate-100 text-slate-700 border-slate-300 dark:bg-[#172742] dark:text-[#b7c6dc] dark:border-[#2d456b]';

const CORRIDOR_MAP: Record<CorridorPassability, StatusStyle> = {
  PASSABLE: { label: 'Passable', Icon: CheckCircle2, classes: GREEN },
  SINGLE_LANE: { label: 'Single Lane', Icon: AlertTriangle, classes: AMBER },
  LANDSLIDE_BLOCKED: { label: 'Landslide Blocked', Icon: Mountain, classes: RED },
  SUBMERGED: { label: 'Submerged', Icon: Waves, classes: RED },
  CLOSED: { label: 'Closed', Icon: Ban, classes: RED },
  UNKNOWN: { label: 'Unknown', Icon: HelpCircle, classes: NEUTRAL },
};

const ASSISTANCE_MAP: Record<AssistanceStatus, StatusStyle> = {
  SUBMITTED: { label: 'Help: Submitted', Icon: Clock, classes: NEUTRAL },
  ACCEPTED: { label: 'Help: Accepted', Icon: Send, classes: BLUE },
  DISPATCHED: { label: 'Help: Dispatched', Icon: Truck, classes: AMBER },
  RESOLVED: { label: 'Help: Resolved', Icon: CheckCircle2, classes: GREEN },
};

const CAPACITY_MAP: Record<CapacityStatus, StatusStyle> = {
  OPEN_AVAILABLE: { label: 'Open Available', Icon: CheckCircle2, classes: GREEN },
  NEAR_CAPACITY: { label: 'Near Capacity', Icon: AlertTriangle, classes: AMBER },
  FULL: { label: 'Full', Icon: Ban, classes: RED },
  TEMPORARILY_CLOSED: { label: 'Temporarily Closed', Icon: XCircle, classes: RED },
  UNKNOWN: { label: 'Unknown', Icon: HelpCircle, classes: NEUTRAL },
};

const OUTBOX_MAP: Record<OutboxSyncStatus, StatusStyle> = {
  PENDING: { label: 'Pending (Saved Locally)', Icon: Clock, classes: AMBER },
  SYNCING: { label: 'Syncing', Icon: Loader2, classes: BLUE, spin: true },
  SYNCED: { label: 'Synced', Icon: CheckCircle2, classes: GREEN },
  FAILED: { label: 'Sync Failed', Icon: XCircle, classes: RED },
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
