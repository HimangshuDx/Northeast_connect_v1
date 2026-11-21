import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Clock,
  FileWarning,
  HeartHandshake,
  Search,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CorridorCard } from '../components/CorridorCard';
import { EmergencyStrip } from '../components/EmergencyStrip';
import { EmptyState } from '../components/EmptyState';
import { IncidentCard } from '../components/IncidentCard';
import { InteractiveMap } from '../components/InteractiveMap';
import { OfflineBanner } from '../components/OfflineBanner';
import { SeverityBadge } from '../components/SeverityBadge';
import { SkeletonCard } from '../components/SkeletonCard';
import { StatusPill } from '../components/StatusPill';
import { DemoDataNoticeBadge, TrustBadge } from '../components/TrustBadge';
import { useApp } from '../context/AppContext';
import { NORTHEAST_DISTRICTS } from '../data/sampleData';
import { formatRelativeAge, formatTimestamp, isItemStale } from '../utils/formatters';

type CorridorFilter = 'all' | 'blocked' | 'caution' | 'passable';
type ReportFilter = 'all' | 'HELP_REQUEST' | 'HAZARD';

export const SituationBoardPage: React.FC = () => {
  const {
    selectedDistrictId,
    setSelectedDistrictId,
    advisories,
    corridors,
    reports,
    resources,
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

  const filteredAdvisories = useMemo(
    () =>
      selectedDistrictId === 'all'
        ? advisories
        : advisories.filter((a) => a.districtId === selectedDistrictId),
    [advisories, selectedDistrictId]
  );

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
    const availableResCount = districtResources.filter(
      (r) => r.capacityStatus === 'OPEN_AVAILABLE' || r.capacityStatus === 'NEAR_CAPACITY'
    ).length;

    return {
      activeAdvCount,
      blockedCount,
      openHelpCount,
      availableResCount,
    };
  }, [filteredAdvisories, districtCorridors, districtReports, districtResources]);

  return (
    <div className="space-y-6">
      {/* Page Title & District Mobile Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
            {t.tagline}
          </p>
          <h2 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
            {t.situationBoard.heading}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t.situationBoard.focusArea}:{' '}
            <span className="font-medium text-slate-900 dark:text-slate-200">
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
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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

      {/* Permanent 112 Emergency Strip */}
      <EmergencyStrip />

      {/* Offline Banner */}
      <OfflineBanner />

      {/* Error State */}
      {loadError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={() => void refreshData()}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Retry Load
          </button>
        </div>
      )}

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
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>{t.situationBoard.activeAdvisories}</span>
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-slate-100">
                {stats.activeAdvCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t.situationBoard.activeAdvisoriesSub}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>{t.situationBoard.blockedCorridors}</span>
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-slate-100">
                {stats.blockedCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t.situationBoard.blockedCorridorsSub}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>{t.situationBoard.openHelpRequests}</span>
                <HeartHandshake className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-slate-100">
                {stats.openHelpCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t.situationBoard.openHelpRequestsSub}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>{t.situationBoard.availableResources}</span>
                <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-slate-100">
                {stats.availableResCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t.situationBoard.availableResourcesSub}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Prominent Request Help CTA */}
      <section
        aria-label="Emergency Assistance Actions"
        className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/70 dark:bg-blue-950/35"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              {t.situationBoard.ctaHeadline}
            </h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              {t.situationBoard.ctaSub}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/report?mode=help"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 whitespace-nowrap shrink-0"
            >
              <span>{t.emergencyStrip.requestUrgentHelp}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/report?mode=hazard"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <FileWarning className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>{t.situationBoard.reportHazardBtn}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Disaster Advisories */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t.situationBoard.advisoriesTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
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
                  ? 'border-red-300 dark:border-red-900/80'
                  : adv.severity === 'WARNING'
                  ? 'border-orange-300 dark:border-orange-900/80'
                  : 'border-amber-300 dark:border-amber-900/80';

              return (
                <article
                  key={adv.id}
                  className={`flex flex-col justify-between rounded-xl border bg-white p-5 dark:bg-slate-900 ${borderBySeverity}`}
                >
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {adv.districtName}
                          <span aria-hidden="true"> · </span>
                          <span>{adv.source}</span>
                        </p>
                        <h3 className="mt-1 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                          {adv.title}
                        </h3>
                      </div>
                      <SeverityBadge severity={adv.severity} />
                    </div>

                    <p className="mt-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {adv.instructions}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3.5 dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
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

      {/* Lifeline Corridor Board */}
      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t.situationBoard.corridorsTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.situationBoard.corridorsSub}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={corridorSearch}
                onChange={(e) => setCorridorSearch(e.target.value)}
                placeholder={t.situationBoard.searchCorridorsPlaceholder}
                aria-label="Search lifeline corridors"
                className="h-9 w-48 rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {(
                [
                  ['all', t.situationBoard.all],
                  ['blocked', t.situationBoard.blockedClosed],
                  ['caution', t.situationBoard.cautionUnknown],
                  ['passable', t.situationBoard.passable],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCorridorFilter(key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    corridorFilter === key
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
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
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3">{t.situationBoard.tableCorridor}</th>
                    <th className="px-4 py-3">{t.situationBoard.tableDistrict}</th>
                    <th className="px-4 py-3">{t.situationBoard.tablePassability}</th>
                    <th className="px-4 py-3">{t.situationBoard.tableAdvisory}</th>
                    <th className="px-4 py-3">{t.situationBoard.tableLastConfirmed}</th>
                    <th className="px-5 py-3">{t.situationBoard.tableTrust}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCorridors.map((cor) => (
                    <tr
                      key={cor.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 align-top">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {cor.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {cor.corridorType}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-top text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {cor.districtName}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <StatusPill kind="corridor" value={cor.status} />
                      </td>
                      <td className="px-4 py-3.5 align-top text-xs leading-relaxed text-slate-600 dark:text-slate-300 max-w-sm">
                        {cor.advisoryNote}
                      </td>
                      <td className="px-4 py-3.5 align-top font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap dark:text-slate-400">
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

      {/* Interactive Leaflet Map */}
      <InteractiveMap
        corridors={districtCorridors}
        reports={districtReports}
        resources={districtResources}
      />

      {/* Community Reports */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t.situationBoard.reportsTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.situationBoard.reportsSub}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder={t.situationBoard.searchReportsPlaceholder}
                aria-label="Search community reports"
                className="h-9 w-48 rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {(
                [
                  ['all', t.situationBoard.allReports],
                  ['HELP_REQUEST', t.situationBoard.helpRequestsOnly],
                  ['HAZARD', t.situationBoard.hazardsOnly],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setReportFilter(key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    reportFilter === key
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
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
    </div>
  );
};
