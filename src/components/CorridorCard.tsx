import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { LifelineCorridor } from '../types';
import { formatRelativeAge, formatTimestamp } from '../utils/formatters';
import { StatusPill } from './StatusPill';
import { TrustBadge } from './TrustBadge';

interface CorridorCardProps {
  corridor: LifelineCorridor;
}

export const CorridorCard: React.FC<CorridorCardProps> = ({ corridor }) => {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {corridor.corridorType}
            <span aria-hidden="true"> · </span>
            <span>{corridor.districtName}</span>
          </p>
          <h3 className="mt-0.5 font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
            {corridor.name}
          </h3>
        </div>
        <StatusPill kind="corridor" value={corridor.status} />
      </div>

      <p className="mt-2.5 text-sm text-slate-700 dark:text-slate-300">{corridor.advisoryNote}</p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <TrustBadge
          status={corridor.verificationStatus}
          isDemo={corridor.isDemo}
          isStale={corridor.isStale}
        />
        <span
          className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400"
          title={formatTimestamp(corridor.lastConfirmedAt)}
        >
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Confirmed {formatRelativeAge(corridor.lastConfirmedAt)}</span>
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-1 font-mono text-[11px] text-slate-400 tabular-nums">
        <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span>
          {corridor.lat.toFixed(4)}, {corridor.lng.toFixed(4)}
        </span>
      </div>
    </article>
  );
};
