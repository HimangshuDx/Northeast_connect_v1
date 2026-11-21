import React, { lazy, Suspense, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  Clock,
  FileWarning,
  HandHeart,
  HeartHandshake,
  Inbox,
  LifeBuoy,
  PhoneCall,
  Search,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CorridorCard } from '../components/CorridorCard';
import { EmergencyStrip } from '../components/EmergencyStrip';
import { EmptyState } from '../components/EmptyState';
import { IncidentCard } from '../components/IncidentCard';
import { SegmentedTabs } from '../components/MotionPrimitives';
import { OfflineBanner } from '../components/OfflineBanner';
import { RainfallIndicator } from '../components/RainfallIndicator';
import { ResourceCard } from '../components/ResourceCard';
import { SeverityBadge } from '../components/SeverityBadge';
import { SkeletonCard } from '../components/SkeletonCard';
import { StatusPill } from '../components/StatusPill';
import { DemoDataNoticeBadge, TrustBadge } from '../components/TrustBadge';
import { useApp } from '../context/AppContext';
import { NORTHEAST_DISTRICTS } from '../data/sampleData';
import { formatRelativeAge, formatTimestamp, isItemStale } from '../utils/formatters';

const InteractiveMap = lazy(() =>
  import('../components/InteractiveMap').then((m) => ({ default: m.InteractiveMap }))
);

type CorridorFilter = 'all' | 'blocked' | 'caution' | 'passable';
type ReportFilter = 'all' | 'HELP_REQUEST' | 'HAZARD';

export const SituationBoardPage: React.FC = () => {
  const {
    selectedDistrictId,
    setSelectedDistrictId,
    setExperienceMode,
    setIsOutboxOpen,
    advisories,
    corridors,
    reports,
    resources,
    outbox,
    ngoAssignments,
    confirmedReportIds,
    toggleConfirmReport,
    isLoading,
    loadError,
    refreshData,
    t,
  } = useApp();

  const [corridorFilter, setCorridorFilter] = useState<CorridorFilter>('all');
  const [corridorSearch, setCorridorSearch] = useState('');
  const [reportFilter, setReportFilter] = useState<ReportFilter>('all');
  const [reportSearch, setReportSearch] = useState('');

  const activeDistrict = useMemo(
    () => NORTHEAST_DISTRICTS.find((d) => d.id === selectedDistrictId) ?? NORTHEAST_DISTRICTS[0],
    [selectedDistrictId]
  );

  const filteredAdvisories = useMemo(() => {
    const base =
      selectedDistrictId === 'all'
        ? advisories
        : advisories.filter((a) => a.districtId === selectedDistrictId);
    return [...base].sort((a, b) => {
      const aVerified = a.verificationStatus === 'VERIFIED' ? 0 : 1;
      const bVerified = b.verificationStatus === 'VERIFIED' ? 0 : 1;
      if (aVerified !== bVerified) return aVerified - bVerified;
      const aStale = isItemStale(a.issuedAt, a.isStale, a.expiresAt) ? 1 : 0;
      const bStale = isItemStale(b.issuedAt, b.isStale, b.expiresAt) ? 1 : 0;
      return aStale - bStale;
    });
  }, [advisories, selectedDistrictId]);

  const districtCorridors = useMemo(
    () =>
      selectedDistrictId === 'all'
        ? corridors
        : corridors.filter((c) => c.districtId === selectedDistrictId),
    [corridors, selectedDistrictId]
  );

  const filteredCorridors = useMemo(() => {
    return districtCorridors.filter((c) => {
      if (corridorFilter === 'blocked') {
        if (
          c.status !== 'LANDSLIDE_BLOCKED' &&
          c.status !== 'SUBMERGED' &&
          c.status !== 'CLOSED'
        ) {
          return false;
        }
      } else if (corridorFilter === 'caution') {
        if (c.status !== 'SINGLE_LANE' && c.status !== 'UNKNOWN') return false;
      } else if (corridorFilter === 'passable') {
        if (c.status !== 'PASSABLE') return false;
      }

      if (corridorSearch.trim()) {
        const q = corridorSearch.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.districtName.toLowerCase().includes(q) ||
          c.advisoryNote.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [districtCorridors, corridorFilter, corridorSearch]);

  const districtReports = useMemo(
    () =>
      reports.filter(
        (r) =>
          !r.mergedIntoId &&
          (selectedDistrictId === 'all' || r.districtId === selectedDistrictId)
      ),
    [reports, selectedDistrictId]
  );

  const filteredReports = useMemo(() => {
    return districtReports.filter((r) => {
      if (reportFilter !== 'all' && r.mode !== reportFilter) return false;
      if (reportSearch.trim()) {
        const q = reportSearch.toLowerCase();
        return (
          r.locality.toLowerCase().includes(q) ||
          r.corridorOrBlock.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [districtReports, reportFilter, reportSearch]);

  const districtResources = useMemo(
    () =>
      selectedDistrictId === 'all'
        ? resources
        : resources.filter((r) => r.districtId === selectedDistrictId),
    [resources, selectedDistrictId]
  );

  const previewResources = useMemo(() => {
    const rank: Record<string, number> = {
      OPEN_AVAILABLE: 0,
      NEAR_CAPACITY: 1,
      FULL: 2,
      TEMPORARILY_CLOSED: 3,
      UNKNOWN: 4,
    };
    return [...districtResources]
      .sort((a, b) => (rank[a.capacityStatus] ?? 9) - (rank[b.capacityStatus] ?? 9))
      .slice(0, 4);
  }, [districtResources]);

  const queuedCount = outbox.filter(
    (item) => item.syncStatus === 'PENDING' || item.syncStatus === 'FAILED'
  ).length;

  const stats = useMemo(() => {
    const activeAdvCount = filteredAdvisories.filter(
      (a) => !isItemStale(a.issuedAt, a.isStale, a.expiresAt)
    ).length;
    const blockedCount = districtCorridors.filter(
      (c) =>
        c.status === 'LANDSLIDE_BLOCKED' ||
        c.status === 'SUBMERGED' ||
        c.status === 'CLOSED'
    ).length;
    const openHelpCount = districtReports.filter(
      (r) => r.mode === 'HELP_REQUEST' && r.assistanceStatus !== 'RESOLVED'
    ).length;
    const verifiedHelpCount = districtReports.filter(
      (r) =>
        r.mode === 'HELP_REQUEST' &&
        r.assistanceStatus !== 'RESOLVED' &&
        r.verificationStatus === 'VERIFIED'
    ).length;
    const availableResCount = districtResources.filter(
      (r) => r.capacityStatus === 'OPEN_AVAILABLE' || r.capacityStatus === 'NEAR_CAPACITY'
    ).length;

    return {
      activeAdvCount,
      blockedCount,
      openHelpCount,
      verifiedHelpCount,
      availableResCount,
    };
  }, [filteredAdvisories, districtCorridors, districtReports, districtResources]);

  const corridorTabItems = [
    { key: 'all', label: t.situationBoard.all },
    { key: 'blocked', label: t.situationBoard.blockedClosed },
    { key: 'caution', label: t.situationBoard.cautionUnknown },
    { key: 'passable', label: t.situationBoard.passable },
  ] as const;

  const reportTabItems = [
    { key: 'all', label: t.situationBoard.allReports },
    { key: 'HELP_REQUEST', label: t.situationBoard.helpRequestsOnly },
    { key: 'HAZARD', label: t.situationBoard.hazardsOnly },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Page Title & District Mobile Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            {t.tagline}
          </p>
          <h2 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-[#102341] dark:text-[#eef2f7] text-balance">
            {t.situationBoard.heading}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#9cb0cc]">
            {t.situationBoard.focusArea}:{' '}
            <span className="font-medium text-slate-900 dark:text-[#e6edf7]">
              {activeDistrict.id === 'all' ? t.controls.allNeDistricts : activeDistrict.name}
            </span>
            {activeDistrict.id !== 'all' ? `, ${activeDistrict.state}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="md:hidden w-full sm:w-auto">
            <label htmlFor="mobile-district-select" className="sr-only">
              Filter by District
            </label>
            <select
              id="mobile-district-select"
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(e.target.value)}
              className="ne-input h-10 w-full rounded-lg border px-3 text-xs font-medium"
            >
              {NORTHEAST_DISTRICTS.map((dist) => (
                <option key={dist.id} value={dist.id}>
                  {dist.id === 'all' ? t.controls.allNeDistricts : `${dist.name}, ${dist.state}`}
                </option>
              ))}
            </select>
          </div>
          <DemoDataNoticeBadge />
        </div>
      </div>

      {/* 1. Permanent 112 Emergency Strip */}
      <EmergencyStrip />

      {/* Offline Banner */}
      <OfflineBanner />

      {/* Error State */}
      {loadError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-500/35 dark:bg-red-500/12 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={() => void refreshData()}
            className="ne-btn-press rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Retry Load
          </button>
        </div>
      )}

      {/* 2. Emergency Actions & Dual Audience Entry Gateway FIRST */}
      <section aria-label="Emergency Actions and Mode Selection" className="grid gap-4 lg:grid-cols-12">
        {/* Citizen Mode: I NEED HELP */}
        <div className="ne-surface lg:col-span-7 flex flex-col justify-between rounded-xl border border-red-200/90 p-5 dark:border-red-500/30">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white shadow-xs">
                <LifeBuoy className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                  {t.experience.needHelp}
                </p>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-[#eef2f7]">
                  {t.experience.citizenMode}
                </h3>
              </div>
            </div>
            <p className="mt-2.5 text-sm text-slate-600 dark:text-[#b7c6dc]">
              {t.experience.needHelpSub}. Works offline via local Outbox and SMS sharing.
            </p>
          </div>

          <div className="mt-4 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/report?mode=sos"
                onClick={() => setExperienceMode('citizen')}
                className="ne-btn-press inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-red-700 whitespace-nowrap"
              >
                <HeartHandshake className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.experience.quickSos}</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>

              <Link
                to="/report?mode=hazard"
                onClick={() => setExperienceMode('citizen')}
                className="ne-btn-press inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-[#c2cfe2] bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152] whitespace-nowrap shrink-0"
              >
                <FileWarning className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
                <span>{t.situationBoard.reportHazardBtn}</span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link
                to="/resources"
                className="ne-btn-press inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#dce4f0] bg-[#f8fafd] px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-[#edf2f8] dark:border-[#1f3250] dark:bg-[#142239] dark:text-[#b7c6dc] dark:hover:bg-[#1e3152] whitespace-nowrap"
              >
                <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                <span>Nearby Shelters &amp; Safety Guides</span>
              </Link>
              <Link
                to="/resources#helplines"
                className="ne-btn-press inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#dce4f0] bg-[#f8fafd] px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-[#edf2f8] dark:border-[#1f3250] dark:bg-[#142239] dark:text-[#b7c6dc] dark:hover:bg-[#1e3152] whitespace-nowrap"
              >
                <PhoneCall className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                <span>Emergency Contacts</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsOutboxOpen(true)}
                className="ne-btn-press inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#dce4f0] bg-[#f8fafd] px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-[#edf2f8] dark:border-[#1f3250] dark:bg-[#142239] dark:text-[#b7c6dc] dark:hover:bg-[#1e3152] whitespace-nowrap"
              >
                <Inbox className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
                <span>
                  {t.nav.myOutbox} ({queuedCount})
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* NGO / Volunteer Mode: I WANT TO HELP */}
        <div className="ne-surface lg:col-span-5 flex flex-col justify-between rounded-xl border border-emerald-200/90 p-5 dark:border-emerald-500/30">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <HandHeart className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  {t.experience.wantHelp}
                </p>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-[#eef2f7]">
                  {t.experience.ngoMode}
                </h3>
              </div>
            </div>

            <p className="mt-2.5 text-sm text-slate-600 dark:text-[#b7c6dc]">
              {t.experience.wantHelpSub}.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-[#9cb0cc]">
              <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-[#e6edf7]">
                {stats.verifiedHelpCount} verified requests
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {stats.openHelpCount} open needs
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {ngoAssignments.length} volunteer pledges
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Link
              to="/ngo"
              onClick={() => setExperienceMode('ngo')}
              className="ne-btn-press inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 whitespace-nowrap"
            >
              <HandHeart className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Open {t.experience.reliefOps}</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
            <p className="text-[11px] text-slate-500 dark:text-[#8295b3]">
              Coordinates volunteer pledges separately from Coordinator Desk &amp; 112 dispatch.
            </p>
          </div>
        </div>
      </section>

      {/* Situation Overview: 4 Stat Cards */}
      <section aria-label="Situation Overview">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard lines={1} />
            <SkeletonCard lines={1} />
            <SkeletonCard lines={1} />
            <SkeletonCard lines={1} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="ne-surface ne-card-hover rounded-xl border p-4">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-[#9cb0cc]">
                <span>{t.situationBoard.activeAdvisories}</span>
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-[#eef2f7]">
                {stats.activeAdvCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-[#8295b3]">
                {t.situationBoard.activeAdvisoriesSub}
              </p>
            </div>

            <div className="ne-surface ne-card-hover rounded-xl border p-4">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-[#9cb0cc]">
                <span>{t.situationBoard.blockedCorridors}</span>
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-[#eef2f7]">
                {stats.blockedCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-[#8295b3]">
                {t.situationBoard.blockedCorridorsSub}
              </p>
            </div>

            <div className="ne-surface ne-card-hover rounded-xl border p-4">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-[#9cb0cc]">
                <span>{t.situationBoard.openHelpRequests}</span>
                <HeartHandshake className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-[#eef2f7]">
                {stats.openHelpCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-[#8295b3]">
                {t.situationBoard.openHelpRequestsSub}
              </p>
            </div>

            <div className="ne-surface ne-card-hover rounded-xl border p-4">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-[#9cb0cc]">
                <span>{t.situationBoard.availableResources}</span>
                <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-[#eef2f7]">
                {stats.availableResCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-[#8295b3]">
                {t.situationBoard.availableResourcesSub}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Open-Meteo 3-Day Rainfall Indicator */}
      <RainfallIndicator />

      {/* 3. Regional Disaster Map */}
      <Suspense fallback={<SkeletonCard lines={4} />}>
        <InteractiveMap
          corridors={districtCorridors}
          reports={districtReports}
          resources={districtResources}
        />
      </Suspense>

      {/* 4. Active Verified Advisories */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-[#eef2f7]">
              {t.situationBoard.advisoriesTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#8295b3]">
              {t.situationBoard.advisoriesSub}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredAdvisories.length === 0 ? (
          <EmptyState
            title="No active sample advisories for this district"
            description="Select All Districts above to view regional advisories across Northeast India."
            actionLabel="Show All Districts"
            onAction={() => setSelectedDistrictId('all')}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredAdvisories.map((adv) => {
              const stale = isItemStale(adv.issuedAt, adv.isStale, adv.expiresAt);
              const borderBySeverity =
                adv.severity === 'CRITICAL'
                  ? 'border-red-300/90 dark:border-red-500/35'
                  : adv.severity === 'WARNING'
                  ? 'border-orange-300/90 dark:border-orange-500/35'
                  : 'border-amber-300/90 dark:border-amber-500/30';

              return (
                <article
                  key={adv.id}
                  className={`ne-surface ne-card-hover flex flex-col justify-between rounded-xl border p-5 ${borderBySeverity}`}
                >
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-[#8295b3]">
                          {adv.districtName}
                          <span aria-hidden="true"> · </span>
                          <span>{adv.source}</span>
                        </p>
                        <h3 className="mt-1 font-display text-base font-semibold text-slate-900 dark:text-[#eef2f7]">
                          {adv.title}
                        </h3>
                      </div>
                      <SeverityBadge severity={adv.severity} />
                    </div>

                    <p className="mt-2.5 text-sm leading-relaxed text-slate-700 dark:text-[#b7c6dc]">
                      {adv.instructions}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2.5 border-t border-[#dce4f0] pt-3.5 dark:border-[#1f3250]">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-slate-500 tabular-nums dark:text-[#8295b3]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {t.situationBoard.issuedLabel}: {formatTimestamp(adv.issuedAt)}
                      </span>
                      <span>
                        {t.situationBoard.expiresLabel}: {formatTimestamp(adv.expiresAt)}
                      </span>
                    </div>

                    <TrustBadge
                      status={adv.verificationStatus}
                      isDemo={adv.isDemo}
                      isStale={stale}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Road and Corridor Conditions */}
      <section className="ne-surface overflow-hidden rounded-xl border">
        <div className="flex flex-col gap-3 border-b border-[#dce4f0] px-5 py-4 dark:border-[#1f3250] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-[#eef2f7]">
              {t.situationBoard.corridorsTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#8295b3]">
              {t.situationBoard.corridorsSub}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-[#8295b3]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={corridorSearch}
                onChange={(e) => setCorridorSearch(e.target.value)}
                placeholder={t.situationBoard.searchCorridorsPlaceholder}
                aria-label="Search lifeline corridors"
                className="ne-input h-9 w-48 rounded-lg border pl-8 pr-3 text-xs"
              />
            </div>

            <SegmentedTabs
              items={corridorTabItems}
              value={corridorFilter}
              onChange={setCorridorFilter}
              layoutId="corridor-filter-tabs"
              ariaLabel="Filter corridors by status"
            />
          </div>
        </div>

        {filteredCorridors.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No matching lifeline corridors"
              description="Try clearing the corridor search or status filter."
              actionLabel="Reset Filters"
              onAction={() => {
                setCorridorFilter('all');
                setCorridorSearch('');
              }}
            />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#dce4f0] bg-[#f8fafd] text-xs font-semibold text-slate-600 dark:border-[#1f3250] dark:bg-[#0d1728] dark:text-[#8295b3]">
                  <tr>
                    <th className="px-5 py-3">{t.situationBoard.tableCorridor}</th>
                    <th className="px-4 py-3">{t.situationBoard.tableDistrict}</th>
                    <th className="px-4 py-3">{t.situationBoard.tablePassability}</th>
                    <th className="px-4 py-3">{t.situationBoard.tableAdvisory}</th>
                    <th className="px-4 py-3">{t.situationBoard.tableLastConfirmed}</th>
                    <th className="px-5 py-3">{t.situationBoard.tableTrust}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce4f0] dark:divide-[#1f3250]">
                  {filteredCorridors.map((cor) => (
                    <tr
                      key={cor.id}
                      className="transition-colors hover:bg-[#f8fafd] dark:hover:bg-[#142239]/70"
                    >
                      <td className="px-5 py-3.5 align-top">
                        <p className="font-medium text-slate-900 dark:text-[#e6edf7]">
                          {cor.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-[#8295b3]">
                          {cor.corridorType}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-top text-xs text-slate-700 dark:text-[#b7c6dc] whitespace-nowrap">
                        {cor.districtName}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <StatusPill kind="corridor" value={cor.status} />
                      </td>
                      <td className="px-4 py-3.5 align-top text-xs leading-relaxed text-slate-600 dark:text-[#b7c6dc] max-w-sm">
                        {cor.advisoryNote}
                      </td>
                      <td className="px-4 py-3.5 align-top font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap dark:text-[#8295b3]">
                        <span title={formatTimestamp(cor.lastConfirmedAt)}>
                          {formatRelativeAge(cor.lastConfirmedAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        <TrustBadge
                          status={cor.verificationStatus}
                          isDemo={cor.isDemo}
                          isStale={isItemStale(cor.lastConfirmedAt, cor.isStale)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 p-4 md:hidden">
              {filteredCorridors.map((cor) => (
                <CorridorCard key={cor.id} corridor={cor} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* 6. Community Assistance Requests & Hazards */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-[#eef2f7]">
              {t.situationBoard.reportsTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#8295b3]">
              {t.situationBoard.reportsSub}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-[#8295b3]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder={t.situationBoard.searchReportsPlaceholder}
                aria-label="Search community reports"
                className="ne-input h-9 w-48 rounded-lg border pl-8 pr-3 text-xs"
              />
            </div>

            <SegmentedTabs
              items={reportTabItems}
              value={reportFilter}
              onChange={setReportFilter}
              layoutId="report-filter-tabs"
              ariaLabel="Filter community reports"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredReports.length === 0 ? (
          <EmptyState
            title="No community reports match your filters"
            description="Adjust your search query or submit a new hazard report or help request."
            icon={Wrench}
            actionLabel="Submit Report"
            onAction={() => {
              setReportFilter('all');
              setReportSearch('');
            }}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredReports.map((rep) => (
              <IncidentCard
                key={rep.id}
                report={rep}
                isConfirmedByUser={confirmedReportIds.includes(rep.id)}
                onToggleConfirm={(id) => void toggleConfirmReport(id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 7. Resource Availability Preview & Safety Guides */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-[#eef2f7]">
              {t.resourcesPage.directoryTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#8295b3]">
              {t.resourcesPage.directorySub}
            </p>
          </div>
          <Link
            to="/resources"
            className="ne-btn-press inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#c2cfe2] bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#142239] dark:text-[#e6edf7] dark:hover:bg-[#1e3152] whitespace-nowrap shrink-0"
          >
            <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>All Shelters, Helplines &amp; Safety Guides</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {previewResources.length === 0 ? (
          <EmptyState
            title="No resource centers listed in this district"
            description="View all districts to browse nearby relief camps, medical posts, and boat rescue points."
            actionLabel="Open Full Directory"
            onAction={() => setSelectedDistrictId('all')}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {previewResources.map((res) => (
              <ResourceCard key={res.id} resource={res} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
