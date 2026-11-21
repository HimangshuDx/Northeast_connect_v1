import React from 'react';
import { MapPin, ThumbsUp, Users, HandHeart, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CommunityReport } from '../types';
import { formatRelativeAge, formatTimestamp } from '../utils/formatters';
import { SeverityBadge } from './SeverityBadge';
import { StatusPill } from './StatusPill';
import { TrustBadge } from './TrustBadge';

interface IncidentCardProps {
  report: CommunityReport;
  isConfirmedByUser: boolean;
  onToggleConfirm: (reportId: string) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  report,
  isConfirmedByUser,
  onToggleConfirm,
}) => {
  const { t } = useApp();
  return (
    <article className="ne-surface ne-card-hover flex flex-col justify-between rounded-xl border p-5">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-[#8295b3]">
              {report.mode === 'HELP_REQUEST' ? 'Urgent Help Request' : 'Community Hazard Report'}
              <span aria-hidden="true"> · </span>
              <span>{report.category}</span>
              <span aria-hidden="true"> · </span>
              <span className="font-mono tabular-nums" title={formatTimestamp(report.createdAt)}>
                {formatRelativeAge(report.createdAt)}
              </span>
            </p>
            <h3 className="mt-1 font-display text-base font-semibold text-slate-900 dark:text-[#e6edf7]">
              {report.locality}
            </h3>
          </div>
          <SeverityBadge severity={report.severity} />
        </div>

        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-[#9cb0cc]">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-[#6f83a3]" aria-hidden="true" />
          <span>
            {report.corridorOrBlock} · {report.districtName}
          </span>
        </p>

        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-[#b7c6dc]">
          {report.description}
        </p>

        {/* Unboxed metadata rows */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-[#9cb0cc]">
          <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
            <Users className="h-3.5 w-3.5 text-slate-400 dark:text-[#6f83a3]" aria-hidden="true" />
            <span>{report.affectedPeopleCount} affected</span>
          </span>

          {report.assistanceNeeds.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <HandHeart className="h-3.5 w-3.5 text-slate-400 dark:text-[#6f83a3]" aria-hidden="true" />
              <span>Needs: {report.assistanceNeeds.join(', ')}</span>
            </span>
          )}

          {report.vulnerabilityTags.length > 0 && (
            <span className="font-medium text-amber-700 dark:text-amber-300">
              Priority: {report.vulnerabilityTags.join(' · ')}
            </span>
          )}
        </div>

        {report.assignedUnit && (
          <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Assigned: {report.assignedUnit}</span>
          </p>
        )}
      </div>

      {/* Footer status & +1 Confirm */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#dce4f0] pt-3.5 dark:border-[#1f3250]">
        <div className="flex flex-wrap items-center gap-2">
          <TrustBadge
            status={report.verificationStatus}
            isDemo={report.isDemo}
            isStale={report.isStale}
          />
          <StatusPill kind="assistance" value={report.assistanceStatus} />
        </div>

        <button
          type="button"
          onClick={() => onToggleConfirm(report.id)}
          aria-pressed={isConfirmedByUser}
          className={`ne-btn-press inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 whitespace-nowrap shrink-0 ${
            isConfirmedByUser
              ? 'border-blue-600 bg-blue-600 text-white shadow-xs hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500'
              : 'border-[#c2cfe2] bg-[#f8fafd] text-slate-800 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]'
          }`}
        >
          <ThumbsUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{isConfirmedByUser ? t.badges.confirmed : t.badges.confirmPlusOne}</span>
          <span className="font-mono tabular-nums">({report.confirmations})</span>
        </button>
      </div>
    </article>
  );
};
