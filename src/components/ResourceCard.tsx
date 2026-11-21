import React from 'react';
import { Clock, MapPin, Package, PhoneCall } from 'lucide-react';
import { EmergencyResource } from '../types';
import { formatRelativeAge, formatTimestamp } from '../utils/formatters';
import { StatusPill } from './StatusPill';
import { TrustBadge } from './TrustBadge';

interface ResourceCardProps {
  resource: EmergencyResource;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  return (
    <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {resource.category}
              <span aria-hidden="true"> · </span>
              <span>{resource.districtName}</span>
            </p>
            <h3 className="mt-1 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              {resource.name}
            </h3>
          </div>
          <StatusPill kind="capacity" value={resource.capacityStatus} />
        </div>

        <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600 dark:text-slate-400">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span>
            {resource.area} — {resource.landmark}
          </span>
        </p>

        <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
          <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span>Available: {resource.availableSupplies.join(' · ')}</span>
        </div>
      </div>

      <div className="mt-4 space-y-3 border-t border-slate-100 pt-3.5 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TrustBadge
            status={resource.verificationStatus}
            isDemo={resource.isDemo}
            isStale={resource.isStale}
          />
          <span
            className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400"
            title={formatTimestamp(resource.lastConfirmedAt)}
          >
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{formatRelativeAge(resource.lastConfirmedAt)}</span>
          </span>
        </div>

        <a
          href={`tel:${resource.contactPhone.replace(/[^+\d]/g, '')}`}
          className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          <PhoneCall className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span>Call Post</span>
          <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
            ({resource.contactPhone})
          </span>
        </a>
      </div>
    </article>
  );
};
