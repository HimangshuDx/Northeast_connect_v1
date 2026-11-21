import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  GitMerge,
  KeyRound,
  Lock,
  RotateCcw,
  Shield,
  Truck,
  Users,
} from 'lucide-react';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { EmptyState } from '../components/EmptyState';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusPill } from '../components/StatusPill';
import { DemoDataNoticeBadge, TrustBadge } from '../components/TrustBadge';
import { useApp } from '../context/AppContext';
import { NORTHEAST_DISTRICTS } from '../data/sampleData';
import {
  AssistanceStatus,
  CapacityStatus,
  CorridorPassability,
  TrustStatus,
} from '../types';
import { formatTimestamp } from '../utils/formatters';

const DEMO_PIN = '2468';
const AUTH_SESSION_KEY = 'ne_connect_coord_auth';

const RESPONSE_UNITS = [
  '',
  'SDRF Team Alpha (Boat Unit 3)',
  'NDRF Unit 12 (Search & Rescue)',
  'District Medical Rapid Team',
  'PWD Road Clearance Crew',
  'Local Civil Defence Volunteers',
];

type DeskTab = 'inbox' | 'corridors' | 'resources' | 'audit';

export const CoordinatorDeskPage: React.FC = () => {
  const {
    reports,
    corridors,
    resources,
    auditLogs,
    updateReportVerification,
    updateReportAssistance,
    assignReportUnit,
    addReportNote,
    mergeReports,
    updateCorridorStatus,
    updateResourceCapacity,
    resetDemoData,
    addToast,
    t,
  } = useApp();

  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(AUTH_SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [coordinatorName, setCoordinatorName] = useState('Duty Coordinator (Demo)');

  const [activeTab, setActiveTab] = useState<DeskTab>('inbox');

  // Inbox filters
  const [districtFilter, setDistrictFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'HAZARD' | 'HELP_REQUEST'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | TrustStatus>('all');

  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [noteInput, setNoteInput] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [confirmMergeOpen, setConfirmMergeOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Corridor editing draft state
  const [corridorDrafts, setCorridorDrafts] = useState<
    Record<
      string,
      { status: CorridorPassability; note: string; verification: 'VERIFIED' | 'UNVERIFIED' }
    >
  >({});

  // Resource editing draft state
  const [resourceDrafts, setResourceDrafts] = useState<
    Record<
      string,
      { capacity: CapacityStatus; suppliesText: string; verification: 'VERIFIED' | 'UNVERIFIED' }
    >
  >({});

  const visibleReports = useMemo(() => {
    return reports.filter((r) => {
      if (r.mergedIntoId) return false;
      if (districtFilter !== 'all' && r.districtId !== districtFilter) return false;
      if (typeFilter !== 'all' && r.mode !== typeFilter) return false;
      if (verificationFilter !== 'all' && r.verificationStatus !== verificationFilter) return false;
      return true;
    });
  }, [reports, districtFilter, typeFilter, verificationFilter]);

  useEffect(() => {
    if (!selectedReportId && visibleReports.length > 0) {
      setSelectedReportId(visibleReports[0].id);
    } else if (
      selectedReportId &&
      visibleReports.length > 0 &&
      !visibleReports.some((r) => r.id === selectedReportId)
    ) {
      setSelectedReportId(visibleReports[0].id);
    }
  }, [selectedReportId, visibleReports]);

  const selectedReport = useMemo(
    () => visibleReports.find((r) => r.id === selectedReportId) ?? null,
    [visibleReports, selectedReportId]
  );

  const mergeCandidates = useMemo(() => {
    if (!selectedReport) return [];
    return reports.filter(
      (r) =>
        r.id !== selectedReport.id &&
        !r.mergedIntoId &&
        r.districtId === selectedReport.districtId
    );
  }, [reports, selectedReport]);

  const deskStats = useMemo(() => {
    const active = reports.filter((r) => !r.mergedIntoId);
    return {
      pendingReview: active.filter(
        (r) => r.verificationStatus === 'UNVERIFIED' || r.verificationStatus === 'UNDER_REVIEW'
      ).length,
      verifiedActive: active.filter((r) => r.verificationStatus === 'VERIFIED').length,
      dispatched: active.filter((r) => r.assistanceStatus === 'DISPATCHED').length,
      blockedCorridors: corridors.filter(
        (c) =>
          c.status === 'LANDSLIDE_BLOCKED' ||
          c.status === 'SUBMERGED' ||
          c.status === 'CLOSED'
      ).length,
    };
  }, [reports, corridors]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === DEMO_PIN) {
      setAuthenticated(true);
      setPinError('');
      try {
        sessionStorage.setItem(AUTH_SESSION_KEY, '1');
      } catch {
        // ignore
      }
      addToast({ type: 'success', title: 'Signed in to Coordinator Desk (Demo)' });
    } else {
      setPinError(`Incorrect Demo PIN. Use ${DEMO_PIN} for prototype evaluation.`);
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setPinInput('');
    try {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      // ignore
    }
  };

  // Demo PIN Login Screen
  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex items-center justify-between gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <DemoDataNoticeBadge />
          </div>

          <h2 className="mt-4 font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.coordinatorPage.accessTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t.coordinatorPage.accessSub}
          </p>

          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
            Prototype Demo PIN: <span className="font-mono font-bold">{DEMO_PIN}</span> (local demonstration session only)
          </div>

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="coord-name"
                className="block text-sm font-medium text-slate-900 dark:text-slate-100"
              >
                Coordinator Label
              </label>
              <input
                id="coord-name"
                type="text"
                value={coordinatorName}
                onChange={(e) => setCoordinatorName(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="coord-pin"
                className="block text-sm font-medium text-slate-900 dark:text-slate-100"
              >
                Enter Demo PIN
              </label>
              <input
                id="coord-pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="4-digit PIN"
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 font-mono text-base tracking-widest text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              {pinError && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{pinError}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="submit"
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span>{t.coordinatorPage.unlockBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => setPinInput(DEMO_PIN)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {t.coordinatorPage.fillDemoPin}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Desk Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t.coordinatorPage.title}
            </h2>
            <DemoDataNoticeBadge />
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Signed in as <span className="font-medium text-slate-900 dark:text-slate-100">{coordinatorName}</span> · Verification and assistance dispatch statuses are managed independently.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.coordinatorPage.resetDemo}</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.coordinatorPage.lockDesk}</span>
          </button>
        </div>
      </div>

      {/* Coordinator Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.coordinatorPage.pendingReview}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-amber-600 tabular-nums dark:text-amber-400">
            {deskStats.pendingReview}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.coordinatorPage.verifiedIncidents}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
            {deskStats.verifiedActive}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.coordinatorPage.teamsDispatched}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-blue-600 tabular-nums dark:text-blue-400">
            {deskStats.dispatched}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.coordinatorPage.blockedCorridors}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-red-600 tabular-nums dark:text-red-400">
            {deskStats.blockedCorridors}
          </p>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
        {(
          [
            ['inbox', t.coordinatorPage.tabInbox],
            ['corridors', t.coordinatorPage.tabCorridors],
            ['resources', t.coordinatorPage.tabResources],
            ['audit', `${t.coordinatorPage.tabAudit} (${auditLogs.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === key
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: REPORT INBOX & DETAIL PANEL */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <select
              aria-label="Filter inbox by district"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {NORTHEAST_DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id === 'all' ? 'All Districts' : d.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter inbox by report type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'HAZARD' | 'HELP_REQUEST')}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">All Report Types</option>
              <option value="HELP_REQUEST">Urgent Help Requests</option>
              <option value="HAZARD">Hazard Reports</option>
            </select>

            <select
              aria-label="Filter inbox by verification status"
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as 'all' | TrustStatus)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">All Verification Statuses</option>
              <option value="UNVERIFIED">Unverified</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {visibleReports.length === 0 ? (
            <EmptyState
              title="No reports match current filters"
              description="Clear filters to review incoming community reports and help requests."
              actionLabel="Reset Inbox Filters"
              onAction={() => {
                setDistrictFilter('all');
                setTypeFilter('all');
                setVerificationFilter('all');
              }}
            />
          ) : (
            <div className="grid gap-5 lg:grid-cols-12">
              {/* Inbox List */}
              <div className="space-y-2.5 lg:col-span-5">
                {visibleReports.map((rep) => {
                  const selected = selectedReport?.id === rep.id;
                  return (
                    <button
                      key={rep.id}
                      type="button"
                      onClick={() => {
                        setSelectedReportId(rep.id);
                        setMergeTargetId('');
                      }}
                      className={`w-full rounded-xl border p-4 text-left transition-colors ${
                        selected
                          ? 'border-blue-600 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/35'
                          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {rep.mode === 'HELP_REQUEST' ? 'Help Request' : 'Hazard'} · {rep.category}
                        </p>
                        <SeverityBadge severity={rep.severity} />
                      </div>
                      <h3 className="mt-1 font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {rep.locality}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                        {rep.districtName} · <span className="font-mono tabular-nums">{rep.affectedPeopleCount} affected</span>
                      </p>

                      {/* Visually separated Verification vs Assistance status */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <TrustBadge status={rep.verificationStatus} isDemo={rep.isDemo} />
                        <StatusPill kind="assistance" value={rep.assistanceStatus} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Detail Panel */}
              {selectedReport && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7 space-y-5">
                  <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          ID: {selectedReport.id} · {formatTimestamp(selectedReport.createdAt)}
                        </p>
                        <h3 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                          {selectedReport.locality}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {selectedReport.corridorOrBlock} · {selectedReport.districtName}
                        </p>
                      </div>
                      <SeverityBadge severity={selectedReport.severity} />
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {selectedReport.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <span>
                        Reporter: <strong className="text-slate-900 dark:text-slate-200">{selectedReport.reporterName}</strong>
                      </span>
                      <span className="font-mono">Phone: {selectedReport.contactPhone}</span>
                      <span className="font-mono tabular-nums">
                        Affected: {selectedReport.affectedPeopleCount} · Confirmations: {selectedReport.confirmations}
                      </span>
                    </div>
                  </div>

                  {/* Visually Separated Control Blocks: 1) Verification vs 2) Assistance */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>1. Verification Status (Information Trust)</span>
                      </p>
                      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                        {(
                          [
                            ['UNVERIFIED', 'Unverified'],
                            ['UNDER_REVIEW', 'Under Review'],
                            ['VERIFIED', 'Verified'],
                            ['REJECTED', 'Rejected'],
                          ] as const
                        ).map(([val, lbl]) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              void updateReportVerification(selectedReport.id, val, coordinatorName)
                            }
                            className={`min-h-[34px] rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                              selectedReport.verificationStatus === val
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                        <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span>2. Assistance Workflow (Field Response)</span>
                      </p>
                      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                        {(
                          [
                            ['SUBMITTED', 'Submitted'],
                            ['ACCEPTED', 'Accepted'],
                            ['DISPATCHED', 'Dispatched'],
                            ['RESOLVED', 'Resolved'],
                          ] as const
                        ).map(([val, lbl]) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              void updateReportAssistance(selectedReport.id, val, coordinatorName)
                            }
                            className={`min-h-[34px] rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                              selectedReport.assistanceStatus === val
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Volunteer / Team Assignment */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="assign-unit-select"
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100"
                      >
                        <Users className="h-4 w-4 text-slate-400" />
                        <span>Volunteer / Response Unit Assignment</span>
                      </label>
                      <select
                        id="assign-unit-select"
                        value={selectedReport.assignedUnit ?? ''}
                        onChange={(e) =>
                          void assignReportUnit(selectedReport.id, e.target.value, coordinatorName)
                        }
                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="">Unassigned</option>
                        {RESPONSE_UNITS.filter(Boolean).map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Duplicate Report Merging */}
                    <div>
                      <label
                        htmlFor="merge-duplicate-select"
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100"
                      >
                        <GitMerge className="h-4 w-4 text-slate-400" />
                        <span>Merge Duplicate Report Into This</span>
                      </label>
                      <div className="mt-1.5 flex gap-2">
                        <select
                          id="merge-duplicate-select"
                          value={mergeTargetId}
                          onChange={(e) => setMergeTargetId(e.target.value)}
                          className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        >
                          <option value="">
                            {mergeCandidates.length === 0
                              ? 'No other reports in district'
                              : 'Select duplicate report...'}
                          </option>
                          {mergeCandidates.map((cand) => (
                            <option key={cand.id} value={cand.id}>
                              #{cand.id} · {cand.locality} ({cand.category})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!mergeTargetId}
                          onClick={() => setConfirmMergeOpen(true)}
                          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        >
                          Merge
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Internal Notes */}
                  <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                      <ClipboardList className="h-4 w-4 text-slate-400" />
                      <span>Internal Coordinator Notes</span>
                    </h4>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!noteInput.trim()) return;
                        void addReportNote(selectedReport.id, noteInput, coordinatorName);
                        setNoteInput('');
                      }}
                      className="mt-2 flex gap-2"
                    >
                      <input
                        type="text"
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Add verification log, dispatch ETA, or callback result..."
                        aria-label="Internal coordinator note"
                        className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="submit"
                        className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Add Note
                      </button>
                    </form>

                    {selectedReport.internalNotes.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {selectedReport.internalNotes.map((note) => (
                          <li
                            key={note.id}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950/60"
                          >
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {note.text}
                            </p>
                            <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                              {note.author} · {formatTimestamp(note.createdAt)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CORRIDOR MANAGEMENT */}
      {activeTab === 'corridors' && (
        <div className="space-y-3">
          {corridors.map((cor) => {
            const draft = corridorDrafts[cor.id] ?? {
              status: cor.status,
              note: cor.advisoryNote,
              verification: cor.verificationStatus,
            };

            return (
              <div
                key={cor.id}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {cor.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {cor.corridorType} · {cor.districtName}
                    </p>
                  </div>
                  <StatusPill kind="corridor" value={cor.status} />
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-500">
                      Passability
                    </label>
                    <select
                      value={draft.status}
                      onChange={(e) =>
                        setCorridorDrafts((prev) => ({
                          ...prev,
                          [cor.id]: {
                            ...draft,
                            status: e.target.value as CorridorPassability,
                          },
                        }))
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="PASSABLE">PASSABLE</option>
                      <option value="SINGLE_LANE">SINGLE LANE</option>
                      <option value="LANDSLIDE_BLOCKED">LANDSLIDE BLOCKED</option>
                      <option value="SUBMERGED">SUBMERGED</option>
                      <option value="CLOSED">CLOSED</option>
                      <option value="UNKNOWN">UNKNOWN</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-500">
                      Trust Status
                    </label>
                    <select
                      value={draft.verification}
                      onChange={(e) =>
                        setCorridorDrafts((prev) => ({
                          ...prev,
                          [cor.id]: {
                            ...draft,
                            verification: e.target.value as 'VERIFIED' | 'UNVERIFIED',
                          },
                        }))
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="UNVERIFIED">UNVERIFIED</option>
                    </select>
                  </div>

                  <div className="md:col-span-5">
                    <label className="block text-[11px] font-medium text-slate-500">
                      Advisory Note
                    </label>
                    <input
                      type="text"
                      value={draft.note}
                      onChange={(e) =>
                        setCorridorDrafts((prev) => ({
                          ...prev,
                          [cor.id]: { ...draft, note: e.target.value },
                        }))
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>

                  <div className="flex items-end md:col-span-2">
                    <button
                      type="button"
                      onClick={() =>
                        void updateCorridorStatus(
                          cor.id,
                          draft.status,
                          draft.note,
                          draft.verification,
                          coordinatorName
                        )
                      }
                      className="h-9 w-full rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Save Corridor
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: RESOURCE CAPACITY MANAGEMENT */}
      {activeTab === 'resources' && (
        <div className="space-y-3">
          {resources.map((res) => {
            const draft = resourceDrafts[res.id] ?? {
              capacity: res.capacityStatus,
              suppliesText: res.availableSupplies.join(', '),
              verification: res.verificationStatus,
            };

            return (
              <div
                key={res.id}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {res.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {res.category} · {res.districtName}
                    </p>
                  </div>
                  <StatusPill kind="capacity" value={res.capacityStatus} />
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-500">
                      Capacity Status
                    </label>
                    <select
                      value={draft.capacity}
                      onChange={(e) =>
                        setResourceDrafts((prev) => ({
                          ...prev,
                          [res.id]: {
                            ...draft,
                            capacity: e.target.value as CapacityStatus,
                          },
                        }))
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="OPEN_AVAILABLE">OPEN AVAILABLE</option>
                      <option value="NEAR_CAPACITY">NEAR CAPACITY</option>
                      <option value="FULL">FULL</option>
                      <option value="TEMPORARILY_CLOSED">TEMPORARILY CLOSED</option>
                      <option value="UNKNOWN">UNKNOWN</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-500">
                      Verification
                    </label>
                    <select
                      value={draft.verification}
                      onChange={(e) =>
                        setResourceDrafts((prev) => ({
                          ...prev,
                          [res.id]: {
                            ...draft,
                            verification: e.target.value as 'VERIFIED' | 'UNVERIFIED',
                          },
                        }))
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="UNVERIFIED">UNVERIFIED</option>
                    </select>
                  </div>

                  <div className="md:col-span-5">
                    <label className="block text-[11px] font-medium text-slate-500">
                      Available Supplies (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={draft.suppliesText}
                      onChange={(e) =>
                        setResourceDrafts((prev) => ({
                          ...prev,
                          [res.id]: { ...draft, suppliesText: e.target.value },
                        }))
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>

                  <div className="flex items-end md:col-span-2">
                    <button
                      type="button"
                      onClick={() =>
                        void updateResourceCapacity(
                          res.id,
                          draft.capacity,
                          draft.suppliesText
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                          draft.verification,
                          coordinatorName
                        )
                      }
                      className="h-9 w-full rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Update Post
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: AUDIT HISTORY */}
      {activeTab === 'audit' && (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {auditLogs.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No coordinator actions recorded yet"
                description="Verifications, dispatches, corridor edits, and merges will appear here."
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.map((log) => (
                <li key={log.id} className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {log.targetLabel}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{log.summary}</p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {log.actor}
                    </p>
                    <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                      {formatTimestamp(log.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={confirmMergeOpen}
        title="Merge Duplicate Report?"
        description={
          selectedReport && mergeTargetId
            ? `Combine confirmation counts from #${mergeTargetId} into #${selectedReport.id} (${selectedReport.locality}) and archive the duplicate?`
            : ''
        }
        confirmLabel="Confirm Merge"
        destructive={false}
        onCancel={() => setConfirmMergeOpen(false)}
        onConfirm={() => {
          if (selectedReport && mergeTargetId) {
            void mergeReports(selectedReport.id, mergeTargetId, coordinatorName);
            setMergeTargetId('');
          }
          setConfirmMergeOpen(false);
        }}
      />

      <ConfirmationDialog
        open={confirmResetOpen}
        title="Reset Sample Demo Data?"
        description="This restores all sample advisories, corridors, reports, resources, and outbox items back to initial prototype defaults."
        confirmLabel="Reset Data"
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={() => {
          void resetDemoData();
          setConfirmResetOpen(false);
        }}
      />
    </div>
  );
};
