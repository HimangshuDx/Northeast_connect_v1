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
    <article className="ne-surface ne-card-hover flex flex-col justify-between rounded-xl border p-5">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-[#8295b3]">
              {resource.category}
              <span aria-hidden="true"> · </span>
              <span>{resource.districtName}</span>
            </p>
            <h3 className="mt-1 font-display text-base font-semibold text-slate-900 dark:text-[#e6edf7]">
              {resource.name}
            </h3>
          </div>
          <StatusPill kind="capacity" value={resource.capacityStatus} />
        </div>

        <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600 dark:text-[#9cb0cc]">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-[#6f83a3]" aria-hidden="true" />
          <span>
            {resource.area} — {resource.landmark}
          </span>
        </p>

        <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-700 dark:text-[#b7c6dc]">
          <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-[#6f83a3]" aria-hidden="true" />
          <span>Available: {resource.availableSupplies.join(' · ')}</span>
        </div>
      </div>

      <div className="mt-4 space-y-3 border-t border-[#dce4f0] pt-3.5 dark:border-[#1f3250]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TrustBadge
            status={resource.verificationStatus}
            isDemo={resource.isDemo}
            isStale={resource.isStale}
          />
          <span
            className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums dark:text-[#8295b3]"
            title={formatTimestamp(resource.lastConfirmedAt)}
          >
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{formatRelativeAge(resource.lastConfirmedAt)}</span>
          </span>
        </div>

        <a
          href={`tel:${resource.contactPhone.replace(/[^+\d]/g, '')}`}
          className="ne-btn-press inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border border-[#c2cfe2] bg-[#f8fafd] px-4 py-2 text-sm font-medium text-slate-900 hover:bg-[#edf2f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
        >
          <PhoneCall className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span>Call Post</span>
          <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-[#8295b3]">
            ({resource.contactPhone})
          </span>
        </a>
      </div>
    </article>
  );
};
