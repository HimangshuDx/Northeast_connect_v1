import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  GitMerge,
  Loader2,
  LogOut,
  RotateCcw,
  Trash2,
  Truck,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { EmptyState } from '../components/EmptyState';
import { SegmentedTabs, ViewCrossfade } from '../components/MotionPrimitives';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusPill } from '../components/StatusPill';
import { DemoDataNoticeBadge, TrustBadge } from '../components/TrustBadge';
import { useApp } from '../context/AppContext';
import { NORTHEAST_DISTRICTS } from '../data/sampleData';
import { getRoleDisplayLabel } from '../services/authService';
import {
  AssistanceStatus,
  CapacityStatus,
  CorridorPassability,
  TrustStatus,
} from '../types';
import { formatTimestamp } from '../utils/formatters';

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
    deleteReport,
    updateCorridorStatus,
    updateResourceCapacity,
    resetDemoData,
    authSession,
    signOutOrganization,
    t,
  } = useApp();

  const navigate = useNavigate();
  const coordinatorName = authSession.fullName || 'Duty Coordinator';

  const [activeTab, setActiveTab] = useState<DeskTab>('inbox');

  // Inbox filters
  const [districtFilter, setDistrictFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'HAZARD' | 'HELP_REQUEST'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | TrustStatus>('all');

  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [noteInput, setNoteInput] = useState('');
  const [noteError, setNoteError] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [confirmMergeOpen, setConfirmMergeOpen] = useState(false);
  const [confirmDeleteReportOpen, setConfirmDeleteReportOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [corridorErrors, setCorridorErrors] = useState<Record<string, string>>({});
  const [resourceErrors, setResourceErrors] = useState<Record<string, string>>({});

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

  const handleLogout = async () => {
    await signOutOrganization();
    navigate('/login?redirect=/coordinator', { replace: true });
  };

  const deskTabItems = [
    { key: 'inbox', label: t.coordinatorPage.tabInbox },
    { key: 'corridors', label: t.coordinatorPage.tabCorridors },
    { key: 'resources', label: t.coordinatorPage.tabResources },
    { key: 'audit', label: `${t.coordinatorPage.tabAudit} (${auditLogs.length})` },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Desk Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#102341] dark:text-[#eef2f7]">
              {t.coordinatorPage.title}
            </h2>
            {authSession.isDemo && (
              <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
                DEMO MODE
              </span>
            )}
            <DemoDataNoticeBadge />
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#9cb0cc]">
            Signed in as{' '}
            <span className="font-medium text-slate-900 dark:text-[#eef2f7]">
              {coordinatorName}
            </span>{' '}
            ({getRoleDisplayLabel(authSession.role)}) · Verification and assistance dispatch statuses are managed independently.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="ne-btn-press inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#c2cfe2] bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#142239] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.coordinatorPage.resetDemo}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="ne-btn-press inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#c2cfe2] bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#142239] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Coordinator Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="ne-surface ne-card-hover rounded-xl border p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-[#9cb0cc]">
            {t.coordinatorPage.pendingReview}
          </p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-amber-600 tabular-nums dark:text-amber-400">
            {deskStats.pendingReview}
          </p>
        </div>
        <div className="ne-surface ne-card-hover rounded-xl border p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-[#9cb0cc]">
            {t.coordinatorPage.verifiedIncidents}
          </p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
            {deskStats.verifiedActive}
          </p>
        </div>
        <div className="ne-surface ne-card-hover rounded-xl border p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-[#9cb0cc]">
            {t.coordinatorPage.teamsDispatched}
          </p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-blue-600 tabular-nums dark:text-blue-400">
            {deskStats.dispatched}
          </p>
        </div>
        <div className="ne-surface ne-card-hover rounded-xl border p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-[#9cb0cc]">
            {t.coordinatorPage.blockedCorridors}
          </p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-red-600 tabular-nums dark:text-red-400">
            {deskStats.blockedCorridors}
          </p>
        </div>
      </div>

      {/* Workspace Tabs */}
      <SegmentedTabs
        items={deskTabItems}
        value={activeTab}
        onChange={setActiveTab}
        layoutId="coordinator-desk-tabs"
        tone="blue"
        size="md"
        ariaLabel="Coordinator desk sections"
      />

      <ViewCrossfade viewKey={activeTab}>
        {/* TAB 1: REPORT INBOX & DETAIL PANEL */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="ne-surface flex flex-wrap items-center gap-3 rounded-xl border p-4">
              <select
                aria-label="Filter inbox by district"
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="ne-input h-9 rounded-lg border px-3 text-xs font-medium"
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
                className="ne-input h-9 rounded-lg border px-3 text-xs font-medium"
              >
                <option value="all">All Report Types</option>
                <option value="HELP_REQUEST">Urgent Help Requests</option>
                <option value="HAZARD">Hazard Reports</option>
              </select>

              <select
                aria-label="Filter inbox by verification status"
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value as 'all' | TrustStatus)}
                className="ne-input h-9 rounded-lg border px-3 text-xs font-medium"
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
                          setNoteError('');
                        }}
                        className={`ne-btn-press w-full rounded-xl border p-4 text-left transition-colors ${
                          selected
                            ? 'border-blue-600 bg-blue-50/75 shadow-xs dark:border-blue-500/70 dark:bg-blue-500/12'
                            : 'ne-surface hover:border-[#c2cfe2] dark:hover:border-[#2d456b]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-slate-500 dark:text-[#8295b3]">
                            {rep.mode === 'HELP_REQUEST' ? 'Help Request' : 'Hazard'} · {rep.category}
                          </p>
                          <SeverityBadge severity={rep.severity} />
                        </div>
                        <h3 className="mt-1 font-display text-sm font-semibold text-slate-900 dark:text-[#eef2f7]">
                          {rep.locality}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-[#9cb0cc]">
                          {rep.districtName} ·{' '}
                          <span className="font-mono tabular-nums">
                            {rep.affectedPeopleCount} affected
                          </span>
                        </p>

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
                  <ViewCrossfade
                    viewKey={selectedReport.id}
                    className="ne-surface space-y-5 rounded-xl border p-5 lg:col-span-7"
                  >
                    <div className="border-b border-[#dce4f0] pb-4 dark:border-[#1f3250]">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-xs text-slate-500 dark:text-[#8295b3]">
                            ID: {selectedReport.id} · {formatTimestamp(selectedReport.createdAt)}
                          </p>
                          <h3 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-[#eef2f7]">
                            {selectedReport.locality}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-[#9cb0cc]">
                            {selectedReport.corridorOrBlock} · {selectedReport.districtName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={selectedReport.severity} />
                          <button
                            type="button"
                            disabled={busyAction !== null}
                            onClick={() => setConfirmDeleteReportOpen(true)}
                            className="ne-btn-press inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-500/35 dark:bg-red-500/12 dark:text-red-300 dark:hover:bg-red-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-[#b7c6dc]">
                        {selectedReport.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-[#9cb0cc]">
                        <span>
                          Reporter:{' '}
                          <strong className="text-slate-900 dark:text-[#eef2f7]">
                            {selectedReport.reporterName}
                          </strong>
                        </span>
                        <span className="font-mono">Phone: {selectedReport.contactPhone}</span>
                        <span className="font-mono tabular-nums">
                          Affected: {selectedReport.affectedPeopleCount} · Confirmations:{' '}
                          {selectedReport.confirmations}
                        </span>
                      </div>
                    </div>

                    {/* Visually Separated Control Blocks: 1) Verification vs 2) Assistance */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border ne-surface-subtle p-3.5">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-[#eef2f7]">
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
                              disabled={busyAction !== null}
                              onClick={async () => {
                                setBusyAction(`verify-${val}`);
                                try {
                                  await updateReportVerification(
                                    selectedReport.id,
                                    val,
                                    coordinatorName
                                  );
                                } finally {
                                  setBusyAction(null);
                                }
                              }}
                              className={`ne-btn-press min-h-[34px] rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
                                selectedReport.verificationStatus === val
                                  ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                                  : 'border-[#c2cfe2] bg-white text-slate-700 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#101b2e] dark:text-[#d5e0f0] dark:hover:bg-[#1e3152]'
                              }`}
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border ne-surface-subtle p-3.5">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-[#eef2f7]">
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
                              disabled={busyAction !== null}
                              onClick={async () => {
                                setBusyAction(`assist-${val}`);
                                try {
                                  await updateReportAssistance(
                                    selectedReport.id,
                                    val,
                                    coordinatorName
                                  );
                                } finally {
                                  setBusyAction(null);
                                }
                              }}
                              className={`ne-btn-press min-h-[34px] rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
                                selectedReport.assistanceStatus === val
                                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                                  : 'border-[#c2cfe2] bg-white text-slate-700 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#101b2e] dark:text-[#d5e0f0] dark:hover:bg-[#1e3152]'
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
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-[#eef2f7]"
                        >
                          <Users className="h-4 w-4 text-slate-400 dark:text-[#8295b3]" />
                          <span>Volunteer / Response Unit Assignment</span>
                        </label>
                        <select
                          id="assign-unit-select"
                          disabled={busyAction !== null}
                          value={selectedReport.assignedUnit ?? ''}
                          onChange={async (e) => {
                            setBusyAction('assign');
                            try {
                              await assignReportUnit(
                                selectedReport.id,
                                e.target.value,
                                coordinatorName
                              );
                            } finally {
                              setBusyAction(null);
                            }
                          }}
                          className="ne-input mt-1.5 h-10 w-full rounded-lg border px-3 text-xs font-medium disabled:opacity-60"
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
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-[#eef2f7]"
                        >
                          <GitMerge className="h-4 w-4 text-slate-400 dark:text-[#8295b3]" />
                          <span>Merge Duplicate Report Into This</span>
                        </label>
                        <div className="mt-1.5 flex gap-2">
                          <select
                            id="merge-duplicate-select"
                            disabled={busyAction !== null}
                            value={mergeTargetId}
                            onChange={(e) => setMergeTargetId(e.target.value)}
                            className="ne-input h-10 min-w-0 flex-1 rounded-lg border px-2.5 text-xs disabled:opacity-60"
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
                            disabled={!mergeTargetId || busyAction !== null}
                            onClick={() => setConfirmMergeOpen(true)}
                            className="ne-btn-press h-10 rounded-lg border border-[#c2cfe2] bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-[#edf2f8] disabled:opacity-40 dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7]"
                          >
                            Merge
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Internal Notes */}
                    <div className="border-t border-[#dce4f0] pt-4 dark:border-[#1f3250]">
                      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-[#eef2f7]">
                        <ClipboardList className="h-4 w-4 text-slate-400 dark:text-[#8295b3]" />
                        <span>Internal Coordinator Notes</span>
                      </h4>

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const trimmed = noteInput.trim();
                          if (trimmed.length < 2) {
                            setNoteError('Note must be at least 2 characters.');
                            return;
                          }
                          if (trimmed.length > 1000) {
                            setNoteError('Note must be 1,000 characters or fewer.');
                            return;
                          }
                          setNoteError('');
                          setBusyAction('note');
                          try {
                            const ok = await addReportNote(
                              selectedReport.id,
                              trimmed,
                              coordinatorName
                            );
                            if (ok) {
                              setNoteInput('');
                            }
                          } finally {
                            setBusyAction(null);
                          }
                        }}
                        className="mt-2 flex gap-2"
                      >
                        <input
                          type="text"
                          value={noteInput}
                          onChange={(e) => {
                            setNoteInput(e.target.value);
                            if (noteError) setNoteError('');
                          }}
                          placeholder="Add verification log, dispatch ETA, or callback result..."
                          aria-label="Internal coordinator note"
                          className="ne-input h-10 flex-1 rounded-lg border px-3 text-xs"
                        />
                        <button
                          type="submit"
                          disabled={busyAction !== null}
                          className="ne-btn-press inline-flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {busyAction === 'note' ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <span>Add Note</span>
                          )}
                        </button>
                      </form>
                      {noteError && (
                        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{noteError}</p>
                      )}

                      {selectedReport.internalNotes.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {selectedReport.internalNotes.map((note) => (
                            <li
                              key={note.id}
                              className="rounded-lg border ne-surface-subtle px-3 py-2 text-xs"
                            >
                              <p className="font-medium text-slate-800 dark:text-[#e6edf7]">
                                {note.text}
                              </p>
                              <p className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-[#8295b3]">
                                {note.author} · {formatTimestamp(note.createdAt)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </ViewCrossfade>
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
                  className="ne-surface rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-[#eef2f7]">
                        {cor.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-[#8295b3]">
                        {cor.corridorType} · {cor.districtName}
                      </p>
                    </div>
                    <StatusPill kind="corridor" value={cor.status} />
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-3">
                      <label
                        htmlFor={`corridor-status-${cor.id}`}
                        className="block text-[11px] font-medium text-slate-500 dark:text-[#8295b3]"
                      >
                        Passability
                      </label>
                      <select
                        id={`corridor-status-${cor.id}`}
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
                        className="ne-input mt-1 min-h-[44px] w-full rounded-lg border px-2.5 text-xs"
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
                      <label
                        htmlFor={`corridor-trust-${cor.id}`}
                        className="block text-[11px] font-medium text-slate-500 dark:text-[#8295b3]"
                      >
                        Trust Status
                      </label>
                      <select
                        id={`corridor-trust-${cor.id}`}
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
                        className="ne-input mt-1 min-h-[44px] w-full rounded-lg border px-2.5 text-xs"
                      >
                        <option value="VERIFIED">VERIFIED</option>
                        <option value="UNVERIFIED">UNVERIFIED</option>
                      </select>
                    </div>

                    <div className="md:col-span-5">
                      <label
                        htmlFor={`corridor-note-${cor.id}`}
                        className="block text-[11px] font-medium text-slate-500 dark:text-[#8295b3]"
                      >
                        Advisory Note
                      </label>
                      <input
                        id={`corridor-note-${cor.id}`}
                        type="text"
                        value={draft.note}
                        onChange={(e) => {
                          setCorridorDrafts((prev) => ({
                            ...prev,
                            [cor.id]: { ...draft, note: e.target.value },
                          }));
                          if (corridorErrors[cor.id]) {
                            setCorridorErrors((prev) => ({ ...prev, [cor.id]: '' }));
                          }
                        }}
                        className="ne-input mt-1 min-h-[44px] w-full rounded-lg border px-3 text-xs"
                      />
                      {corridorErrors[cor.id] && (
                        <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                          {corridorErrors[cor.id]}
                        </p>
                      )}
                    </div>

                    <div className="flex items-end md:col-span-2">
                      <button
                        type="button"
                        disabled={busyAction !== null}
                        onClick={async () => {
                          const trimmedNote = draft.note.trim();
                          if (trimmedNote.length < 3 || trimmedNote.length > 500) {
                            setCorridorErrors((prev) => ({
                              ...prev,
                              [cor.id]: 'Advisory note must be 3–500 characters.',
                            }));
                            return;
                          }
                          setCorridorErrors((prev) => ({ ...prev, [cor.id]: '' }));
                          setBusyAction(`corridor-${cor.id}`);
                          try {
                            await updateCorridorStatus(
                              cor.id,
                              draft.status,
                              trimmedNote,
                              draft.verification,
                              coordinatorName
                            );
                          } finally {
                            setBusyAction(null);
                          }
                        }}
                        className="ne-btn-press inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {busyAction === `corridor-${cor.id}` ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Save Corridor</span>
                        )}
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
                  className="ne-surface rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-[#eef2f7]">
                        {res.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-[#8295b3]">
                        {res.category} · {res.districtName}
                      </p>
                    </div>
                    <StatusPill kind="capacity" value={res.capacityStatus} />
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-3">
                      <label
                        htmlFor={`resource-cap-${res.id}`}
                        className="block text-[11px] font-medium text-slate-500 dark:text-[#8295b3]"
                      >
                        Capacity Status
                      </label>
                      <select
                        id={`resource-cap-${res.id}`}
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
                        className="ne-input mt-1 min-h-[44px] w-full rounded-lg border px-2.5 text-xs"
                      >
                        <option value="OPEN_AVAILABLE">OPEN AVAILABLE</option>
                        <option value="NEAR_CAPACITY">NEAR CAPACITY</option>
                        <option value="FULL">FULL</option>
                        <option value="TEMPORARILY_CLOSED">TEMPORARILY CLOSED</option>
                        <option value="UNKNOWN">UNKNOWN</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor={`resource-trust-${res.id}`}
                        className="block text-[11px] font-medium text-slate-500 dark:text-[#8295b3]"
                      >
                        Verification
                      </label>
                      <select
                        id={`resource-trust-${res.id}`}
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
                        className="ne-input mt-1 min-h-[44px] w-full rounded-lg border px-2.5 text-xs"
                      >
                        <option value="VERIFIED">VERIFIED</option>
                        <option value="UNVERIFIED">UNVERIFIED</option>
                      </select>
                    </div>

                    <div className="md:col-span-5">
                      <label
                        htmlFor={`resource-supplies-${res.id}`}
                        className="block text-[11px] font-medium text-slate-500 dark:text-[#8295b3]"
                      >
                        Available Supplies (comma-separated)
                      </label>
                      <input
                        id={`resource-supplies-${res.id}`}
                        type="text"
                        value={draft.suppliesText}
                        onChange={(e) => {
                          setResourceDrafts((prev) => ({
                            ...prev,
                            [res.id]: { ...draft, suppliesText: e.target.value },
                          }));
                          if (resourceErrors[res.id]) {
                            setResourceErrors((prev) => ({ ...prev, [res.id]: '' }));
                          }
                        }}
                        className="ne-input mt-1 min-h-[44px] w-full rounded-lg border px-3 text-xs"
                      />
                      {resourceErrors[res.id] && (
                        <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                          {resourceErrors[res.id]}
                        </p>
                      )}
                    </div>

                    <div className="flex items-end md:col-span-2">
                      <button
                        type="button"
                        disabled={busyAction !== null}
                        onClick={async () => {
                          const supplies = draft.suppliesText
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);
                          if (supplies.length > 20 || supplies.some((s) => s.length > 80)) {
                            setResourceErrors((prev) => ({
                              ...prev,
                              [res.id]: 'Max 20 items, each 80 characters or fewer.',
                            }));
                            return;
                          }
                          setResourceErrors((prev) => ({ ...prev, [res.id]: '' }));
                          setBusyAction(`resource-${res.id}`);
                          try {
                            await updateResourceCapacity(
                              res.id,
                              draft.capacity,
                              supplies,
                              draft.verification,
                              coordinatorName
                            );
                          } finally {
                            setBusyAction(null);
                          }
                        }}
                        className="ne-btn-press inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {busyAction === `resource-${res.id}` ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Update Post</span>
                        )}
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
          <div className="ne-surface rounded-xl border">
            {auditLogs.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No coordinator actions recorded yet"
                  description="Verifications, dispatches, corridor edits, and merges will appear here."
                />
              </div>
            ) : (
              <ul className="divide-y divide-[#dce4f0] dark:divide-[#1f3250]">
                {auditLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-[#eef2f7]">
                        {log.targetLabel}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-[#9cb0cc]">{log.summary}</p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-xs font-medium text-slate-700 dark:text-[#d5e0f0]">
                        {log.actor}
                      </p>
                      <p className="font-mono text-[11px] text-slate-500 tabular-nums dark:text-[#8295b3]">
                        {formatTimestamp(log.timestamp)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </ViewCrossfade>

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
        onConfirm={async () => {
          if (selectedReport && mergeTargetId) {
            setBusyAction('merge');
            try {
              const ok = await mergeReports(selectedReport.id, mergeTargetId, coordinatorName);
              if (ok) setMergeTargetId('');
            } finally {
              setBusyAction(null);
            }
          }
          setConfirmMergeOpen(false);
        }}
      />

      <ConfirmationDialog
        open={confirmDeleteReportOpen}
        title="Delete Report Permanently?"
        description={
          selectedReport
            ? `Remove report #${selectedReport.id} (${selectedReport.locality}) from the Situation Board and Coordinator Inbox? This action is recorded in the audit log.`
            : ''
        }
        confirmLabel="Delete Report"
        destructive={true}
        onCancel={() => setConfirmDeleteReportOpen(false)}
        onConfirm={async () => {
          if (selectedReport) {
            const targetId = selectedReport.id;
            setBusyAction('delete');
            try {
              const ok = await deleteReport(targetId, coordinatorName);
              if (ok) {
                const nextReport = visibleReports.find((r) => r.id !== targetId);
                setSelectedReportId(nextReport?.id ?? '');
                setMergeTargetId('');
              }
            } finally {
              setBusyAction(null);
            }
          }
          setConfirmDeleteReportOpen(false);
        }}
      />

      <ConfirmationDialog
        open={confirmResetOpen}
        title="Reset Sample Demo Data?"
        description="This restores all sample advisories, corridors, reports, resources, and outbox items back to initial prototype defaults."
        confirmLabel="Reset Data"
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={async () => {
          setBusyAction('reset');
          try {
            await resetDemoData();
          } finally {
            setBusyAction(null);
          }
          setConfirmResetOpen(false);
        }}
      />
    </div>
  );
};
