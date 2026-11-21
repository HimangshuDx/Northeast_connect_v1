import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  HandHeart,
  Layers,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  ThumbsUp,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { EmptyState } from '../components/EmptyState';
import { NE_EASE, SegmentedTabs, ViewCrossfade } from '../components/MotionPrimitives';
import { OfflineBanner } from '../components/OfflineBanner';
import { ResourceCard } from '../components/ResourceCard';
import { SeverityBadge } from '../components/SeverityBadge';
import { SkeletonCard } from '../components/SkeletonCard';
import { StatusPill } from '../components/StatusPill';
import { DemoDataNoticeBadge, TrustBadge } from '../components/TrustBadge';
import { useApp } from '../context/AppContext';
import { NORTHEAST_DISTRICTS } from '../data/sampleData';
import {
  AssistanceNeed,
  CommunityReport,
  IncidentCategory,
  NgoAssignment,
  NgoCapability,
  NgoTaskStatus,
  VolunteerAvailability,
} from '../types';
import { formatRelativeAge, formatTimestamp } from '../utils/formatters';

const InteractiveMap = lazy(() =>
  import('../components/InteractiveMap').then((m) => ({ default: m.InteractiveMap }))
);

type NgoTab = 'feed' | 'assignments' | 'team' | 'resources';
type VerificationScope = 'verified_review' | 'verified_only' | 'all_open';

const CAPABILITIES: NgoCapability[] = [
  'Boat Rescue',
  'Medical Aid',
  'Food & Water Distribution',
  'Shelter & Evacuation',
  'Road & Debris Support',
];

const CATEGORIES: IncidentCategory[] = [
  'Flooding',
  'Landslide',
  'Road Blockage',
  'Bridge Damage',
  'Stranded Persons',
  'Medical Emergency',
  'Power / Telecom Outage',
];

const ASSISTANCE_NEEDS: AssistanceNeed[] = ['Rescue', 'Medical', 'Food / Water', 'Shelter'];

const TASK_STAGES: { status: NgoTaskStatus; label: string }[] = [
  { status: 'PLEDGED', label: 'Pledged' },
  { status: 'EN_ROUTE', label: 'En Route' },
  { status: 'ON_SITE', label: 'On Site' },
  { status: 'RELIEF_DELIVERED', label: 'Relief Delivered' },
];

const AVAILABILITY_OPTIONS: {
  value: VolunteerAvailability;
  label: string;
  activeClass: string;
}[] = [
  {
    value: 'AVAILABLE',
    label: 'Available for Dispatch',
    activeClass:
      'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500/70 dark:bg-emerald-500/14 dark:text-emerald-200',
  },
  {
    value: 'BUSY',
    label: 'Deployed / Busy',
    activeClass:
      'border-amber-600 bg-amber-50 text-amber-900 dark:border-amber-500/70 dark:bg-amber-500/14 dark:text-amber-200',
  },
  {
    value: 'OFFLINE',
    label: 'Standby / Offline',
    activeClass:
      'border-slate-600 bg-slate-100 text-slate-900 dark:border-[#4b6796] dark:bg-[#1e3152] dark:text-[#eef2f7]',
  },
];

function computePriorityScore(report: CommunityReport): number {
  const sevWeight: Record<CommunityReport['severity'], number> = {
    CRITICAL: 1000,
    HIGH: 500,
    MODERATE: 200,
    LOW: 50,
  };
  return (
    sevWeight[report.severity] +
    report.vulnerabilityTags.length * 45 +
    Math.min(report.affectedPeopleCount, 200) * 2 +
    Math.min(report.confirmations, 50) * 5 +
    (report.verificationStatus === 'VERIFIED' ? 80 : 0)
  );
}

function getTaskStatusStyle(status: NgoTaskStatus): string {
  switch (status) {
    case 'PLEDGED':
      return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/35 dark:bg-blue-500/14 dark:text-blue-300';
    case 'EN_ROUTE':
      return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/35 dark:bg-amber-500/14 dark:text-amber-300';
    case 'ON_SITE':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-500/14 dark:text-emerald-300';
    case 'RELIEF_DELIVERED':
      return 'border-slate-200 bg-slate-100 text-slate-700 dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#b7c6dc]';
  }
}

export const NgoOperationsPage: React.FC = () => {
  const {
    selectedDistrictId,
    setSelectedDistrictId,
    reports,
    corridors,
    resources,
    ngoAssignments,
    volunteerProfile,
    acceptNgoTask,
    updateNgoTaskStatus,
    releaseNgoTask,
    saveVolunteerProfile,
    isLoading,
    authSession,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<NgoTab>('feed');
  const [verificationScope, setVerificationScope] = useState<VerificationScope>('verified_review');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [needFilter, setNeedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceSearch, setResourceSearch] = useState('');

  // Task Pledge Modal state
  const [pledgeTargetReport, setPledgeTargetReport] = useState<CommunityReport | null>(null);
  const [pledgeVolunteerName, setPledgeVolunteerName] = useState(volunteerProfile.name);
  const [pledgeOrganization, setPledgeOrganization] = useState(volunteerProfile.organization);
  const [pledgeCapability, setPledgeCapability] = useState<NgoCapability>(
    volunteerProfile.capability
  );
  const [pledgeNote, setPledgeNote] = useState('');
  const [isPledging, setIsPledging] = useState(false);

  // Assignment Note edits & release confirmation
  const [assignmentNotes, setAssignmentNotes] = useState<Record<string, string>>({});
  const [releaseCandidate, setReleaseCandidate] = useState<NgoAssignment | null>(null);

  // Volunteer Profile & Inventory form state
  const [profName, setProfName] = useState(volunteerProfile.name);
  const [profOrg, setProfOrg] = useState(volunteerProfile.organization);
  const [profDistrict, setProfDistrict] = useState(volunteerProfile.districtId);
  const [profCapability, setProfCapability] = useState<NgoCapability>(volunteerProfile.capability);
  const [profAvailability, setProfAvailability] = useState<VolunteerAvailability>(
    volunteerProfile.availability
  );
  const [profTeamSize, setProfTeamSize] = useState(String(volunteerProfile.teamSize));
  const [profInventoryText, setProfInventoryText] = useState(
    volunteerProfile.resourceInventory.join(', ')
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    setProfName(volunteerProfile.name);
    setProfOrg(volunteerProfile.organization);
    setProfDistrict(volunteerProfile.districtId);
    setProfCapability(volunteerProfile.capability);
    setProfAvailability(volunteerProfile.availability);
    setProfTeamSize(String(volunteerProfile.teamSize));
    setProfInventoryText(volunteerProfile.resourceInventory.join(', '));
    setPledgeVolunteerName(volunteerProfile.name);
    setPledgeOrganization(volunteerProfile.organization);
    setPledgeCapability(volunteerProfile.capability);
  }, [volunteerProfile]);

  const districtCorridors = useMemo(
    () =>
      selectedDistrictId === 'all'
        ? corridors
        : corridors.filter((c) => c.districtId === selectedDistrictId),
    [corridors, selectedDistrictId]
  );

  const districtResources = useMemo(
    () =>
      selectedDistrictId === 'all'
        ? resources
        : resources.filter((r) => r.districtId === selectedDistrictId),
    [resources, selectedDistrictId]
  );

  const openRequestsBase = useMemo(() => {
    return reports.filter(
      (r) =>
        r.mode === 'HELP_REQUEST' &&
        !r.mergedIntoId &&
        r.verificationStatus !== 'REJECTED' &&
        r.assistanceStatus !== 'RESOLVED' &&
        (selectedDistrictId === 'all' || r.districtId === selectedDistrictId)
    );
  }, [reports, selectedDistrictId]);

  const prioritizedRequests = useMemo(() => {
    const filtered = openRequestsBase.filter((r) => {
      if (verificationScope === 'verified_only' && r.verificationStatus !== 'VERIFIED') {
        return false;
      }
      if (
        verificationScope === 'verified_review' &&
        r.verificationStatus !== 'VERIFIED' &&
        r.verificationStatus !== 'UNDER_REVIEW'
      ) {
        return false;
      }
      if (categoryFilter !== 'all' && r.category !== categoryFilter) {
        return false;
      }
      if (
        needFilter !== 'all' &&
        !r.assistanceNeeds.includes(needFilter as AssistanceNeed)
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.locality.toLowerCase().includes(q) ||
          r.corridorOrBlock.toLowerCase().includes(q) ||
          r.districtName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...filtered].sort((a, b) => computePriorityScore(b) - computePriorityScore(a));
  }, [openRequestsBase, verificationScope, categoryFilter, needFilter, searchQuery]);

  const filteredResources = useMemo(() => {
    if (!resourceSearch.trim()) return districtResources;
    const q = resourceSearch.toLowerCase();
    return districtResources.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q) ||
        r.landmark.toLowerCase().includes(q) ||
        r.availableSupplies.some((s) => s.toLowerCase().includes(q))
    );
  }, [districtResources, resourceSearch]);

  const metrics = useMemo(() => {
    const verifiedOpen = openRequestsBase.filter(
      (r) => r.verificationStatus === 'VERIFIED'
    ).length;
    const criticalOpen = openRequestsBase.filter((r) => r.severity === 'CRITICAL').length;
    const activePledges = ngoAssignments.filter(
      (a) => a.taskStatus !== 'RELIEF_DELIVERED'
    ).length;
    const deliveredCount = ngoAssignments.filter(
      (a) => a.taskStatus === 'RELIEF_DELIVERED'
    ).length;

    return {
      verifiedOpen,
      criticalOpen,
      activePledges,
      deliveredCount,
    };
  }, [openRequestsBase, ngoAssignments]);

  const openPledgeDialog = (report: CommunityReport) => {
    setPledgeTargetReport(report);
    setPledgeVolunteerName(volunteerProfile.name);
    setPledgeOrganization(volunteerProfile.organization);
    setPledgeCapability(volunteerProfile.capability);
    setPledgeNote('');
  };

  const handleConfirmPledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pledgeTargetReport) return;
    setIsPledging(true);
    try {
      const ok = await acceptNgoTask({
        reportId: pledgeTargetReport.id,
        volunteerName: pledgeVolunteerName,
        organization: pledgeOrganization,
        capability: pledgeCapability,
        note: pledgeNote,
      });
      if (ok) {
        setPledgeTargetReport(null);
      }
    } finally {
      setIsPledging(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const parsedInventory = profInventoryText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await saveVolunteerProfile({
        id: volunteerProfile.id || 'default-ngo-team',
        name: profName,
        organization: profOrg,
        districtId: profDistrict,
        capability: profCapability,
        availability: profAvailability,
        teamSize: Math.max(1, Math.round(Number(profTeamSize)) || 1),
        resourceInventory: parsedInventory,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const availabilityBadgeStyle =
    volunteerProfile.availability === 'AVAILABLE'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-500/14 dark:text-emerald-300'
      : volunteerProfile.availability === 'BUSY'
      ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/35 dark:bg-amber-500/14 dark:text-amber-300'
      : 'border-slate-300 bg-slate-100 text-slate-700 dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#b7c6dc]';

  const workspaceTabs = [
    { key: 'feed', label: `Assistance Feed (${prioritizedRequests.length})`, icon: ClipboardList },
    { key: 'assignments', label: `My Assignments (${ngoAssignments.length})`, icon: Truck },
    { key: 'team', label: 'Team Availability & Inventory', icon: Users },
    { key: 'resources', label: `Regional Resources (${districtResources.length})`, icon: Building2 },
  ] as const;

  const verificationTabs = [
    { key: 'verified_review', label: 'Verified & Review' },
    { key: 'verified_only', label: 'Verified Only' },
    { key: 'all_open', label: 'All Open (incl. Unverified)' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <HandHeart className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.experience.ngoMode}</span>
            </span>
            <span className="text-slate-300 dark:text-[#2d456b]">·</span>
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${availabilityBadgeStyle}`}
            >
              {volunteerProfile.availability === 'AVAILABLE'
                ? 'Team Available'
                : volunteerProfile.availability === 'BUSY'
                ? 'Team Deployed'
                : 'Team Offline'}
            </span>
            {authSession.isDemo && (
              <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
                DEMO MODE
              </span>
            )}
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#102341] dark:text-[#eef2f7]">
            Relief Operations Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#9cb0cc]">
            {authSession.organizationName || volunteerProfile.organization} · Partner:{' '}
            {authSession.isAuthenticated ? authSession.fullName : volunteerProfile.name} ·{' '}
            <span className="font-mono tabular-nums">{volunteerProfile.teamSize}</span> volunteers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="md:hidden w-full sm:w-auto">
            <label htmlFor="ngo-mobile-district" className="sr-only">
              Filter District
            </label>
            <select
              id="ngo-mobile-district"
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

      {/* Explicit Honesty Notice */}
      <div
        role="region"
        aria-label="NGO coordination scope notice"
        className="flex items-start gap-3 rounded-xl border border-amber-300/90 bg-amber-50 px-4 py-3 text-xs text-amber-950 dark:border-amber-500/35 dark:bg-[#1e1a14] dark:text-amber-100"
      >
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300"
          aria-hidden="true"
        />
        <p className="leading-relaxed">
          <span className="font-semibold">Volunteer Coordination Scope:</span> Pledging an NGO task records your team&apos;s relief commitment and progress on the operations board. It does <span className="font-semibold">not</span> trigger or confirm official 112 / SDRF / NDRF government rescue dispatch, and personal caller phone numbers remain masked for privacy.
        </p>
      </div>

      <OfflineBanner />

      {/* 4 Operations KPIs */}
      <section aria-label="Operations Metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="ne-surface ne-card-hover rounded-xl border p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-[#9cb0cc]">
            <span>Verified Open Requests</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-slate-900 dark:text-[#eef2f7]">
            {metrics.verifiedOpen}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-[#8295b3]">
            Coordinator-verified urgent citizen needs
          </p>
        </div>

        <div className="ne-surface ne-card-hover rounded-xl border p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-[#9cb0cc]">
            <span>Critical Priority Needs</span>
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-slate-900 dark:text-[#eef2f7]">
            {metrics.criticalOpen}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-[#8295b3]">
            Highest life-safety severity in current view
          </p>
        </div>

        <div className="ne-surface ne-card-hover rounded-xl border p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-[#9cb0cc]">
            <span>Active NGO Pledges</span>
            <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-slate-900 dark:text-[#eef2f7]">
            {metrics.activePledges}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-[#8295b3]">
            Pledged, en route, or on site
          </p>
        </div>

        <div className="ne-surface ne-card-hover rounded-xl border p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-[#9cb0cc]">
            <span>Relief Delivered</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-slate-900 dark:text-[#eef2f7]">
            {metrics.deliveredCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-[#8295b3]">
            Volunteer operations marked completed
          </p>
        </div>
      </section>

      {/* Workspace Tabs */}
      <SegmentedTabs
        items={workspaceTabs}
        value={activeTab}
        onChange={setActiveTab}
        layoutId="ngo-workspace-tabs"
        tone="emerald"
        size="md"
        ariaLabel="Relief operations sections"
      />

      <ViewCrossfade viewKey={activeTab}>
        {/* TAB 1: VERIFIED ASSISTANCE FEED + INTERACTIVE MAP */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="ne-surface rounded-xl border p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <SegmentedTabs
                  items={verificationTabs}
                  value={verificationScope}
                  onChange={setVerificationScope}
                  layoutId="ngo-verification-scope"
                  ariaLabel="Filter by verification status"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-[#8295b3]"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search locality, highway..."
                      aria-label="Search assistance requests"
                      className="ne-input h-9 w-48 rounded-lg border pl-8 pr-3 text-xs"
                    />
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    aria-label="Filter by emergency type"
                    className="ne-input h-9 rounded-lg border px-2.5 text-xs font-medium"
                  >
                    <option value="all">All Emergency Types</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <select
                    value={needFilter}
                    onChange={(e) => setNeedFilter(e.target.value)}
                    aria-label="Filter by assistance need"
                    className="ne-input h-9 rounded-lg border px-2.5 text-xs font-medium"
                  >
                    <option value="all">All Relief Needs</option>
                    {ASSISTANCE_NEEDS.map((need) => (
                      <option key={need} value={need}>
                        {need}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Priority-Based Assistance Cards */}
            {isLoading ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : prioritizedRequests.length === 0 ? (
              <EmptyState
                title="No matching assistance requests"
                description="Try expanding your verification scope, district selector, or clearing emergency-type filters."
                actionLabel="Show All Open Requests"
                onAction={() => {
                  setVerificationScope('all_open');
                  setCategoryFilter('all');
                  setNeedFilter('all');
                  setSearchQuery('');
                }}
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {prioritizedRequests.map((rep) => {
                  const reportPledges = ngoAssignments.filter((a) => a.reportId === rep.id);
                  const activeOrgPledge = reportPledges.find(
                    (a) =>
                      a.organization.toLowerCase() === volunteerProfile.organization.toLowerCase() &&
                      a.taskStatus !== 'RELIEF_DELIVERED'
                  );

                  return (
                    <article
                      key={rep.id}
                      className="ne-surface ne-card-hover flex flex-col justify-between rounded-xl border p-5"
                    >
                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-500 dark:text-[#8295b3]">
                              {rep.category}
                              <span aria-hidden="true"> · </span>
                              <span>{rep.districtName}</span>
                              <span aria-hidden="true"> · </span>
                              <span className="font-mono tabular-nums">
                                {rep.affectedPeopleCount} affected
                              </span>
                              {rep.vulnerabilityTags.length > 0 && (
                                <>
                                  <span aria-hidden="true"> · </span>
                                  <span className="font-semibold text-amber-700 dark:text-amber-300">
                                    {rep.vulnerabilityTags.join(', ')}
                                  </span>
                                </>
                              )}
                            </p>
                            <h3 className="mt-1 font-display text-base font-semibold text-slate-900 dark:text-[#eef2f7]">
                              {rep.locality}
                            </h3>
                          </div>
                          <SeverityBadge severity={rep.severity} />
                        </div>

                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#9cb0cc]">
                          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{rep.corridorOrBlock}</span>
                          {rep.coordinates && (
                            <span className="font-mono tabular-nums">
                              ({rep.coordinates.lat.toFixed(3)}, {rep.coordinates.lng.toFixed(3)})
                            </span>
                          )}
                        </p>

                        <p className="mt-2.5 text-sm leading-relaxed text-slate-700 dark:text-[#b7c6dc]">
                          {rep.description}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-[#9cb0cc]">
                          <span className="font-medium text-slate-800 dark:text-[#e6edf7]">
                            Needs: {rep.assistanceNeeds.join(', ')}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                            <ThumbsUp className="h-3 w-3" aria-hidden="true" />
                            {rep.confirmations} confirmed
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Contact: {rep.contactPhone}</span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3 border-t border-[#dce4f0] pt-3.5 dark:border-[#1f3250]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <TrustBadge
                            status={rep.verificationStatus}
                            isDemo={rep.isDemo}
                            isStale={rep.isStale}
                          />
                          <div className="flex items-center gap-2">
                            <StatusPill kind="assistance" value={rep.assistanceStatus} />
                            <span
                              className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums dark:text-[#8295b3]"
                              title={formatTimestamp(rep.createdAt)}
                            >
                              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              <span>{formatRelativeAge(rep.createdAt)}</span>
                            </span>
                          </div>
                        </div>

                        {reportPledges.length > 0 && (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50/75 px-3 py-2 text-xs text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                            {reportPledges.map((pledge) => (
                              <div
                                key={pledge.id}
                                className="flex flex-wrap items-center justify-between gap-1"
                              >
                                <span>
                                  <span className="font-semibold">{pledge.organization}</span> ·{' '}
                                  {pledge.capability}
                                </span>
                                <span className="font-mono text-[11px] font-semibold">
                                  {pledge.taskStatus.replace('_', ' ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {rep.assignedUnit ? (
                            <span className="text-xs text-slate-500 dark:text-[#8295b3]">
                              Official unit: {rep.assignedUnit}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 dark:text-[#8295b3]">
                              No official unit assigned yet
                            </span>
                          )}

                          {activeOrgPledge ? (
                            <button
                              type="button"
                              onClick={() => setActiveTab('assignments')}
                              className="ne-btn-press inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-200 whitespace-nowrap shrink-0"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              <span>Active Pledge · Manage Progress</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openPledgeDialog(rep)}
                              className="ne-btn-press inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 whitespace-nowrap shrink-0"
                            >
                              <HandHeart className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              <span>Pledge Team Response</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Embedded Interactive Disaster Map */}
            <Suspense fallback={<SkeletonCard lines={4} />}>
              <InteractiveMap
                corridors={districtCorridors}
                reports={prioritizedRequests}
                resources={districtResources}
              />
            </Suspense>
          </div>
        )}

        {/* TAB 2: MY ASSIGNMENTS & OPERATION PROGRESS TRACKING */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {ngoAssignments.length === 0 ? (
              <EmptyState
                title="No active NGO task pledges yet"
                description="Browse the verified Assistance Feed and pledge your volunteer team to an open citizen request."
                actionLabel="Browse Assistance Feed"
                onAction={() => setActiveTab('feed')}
              />
            ) : (
              <div className="grid gap-4">
                {ngoAssignments.map((assignment) => {
                  const linkedReport = reports.find((r) => r.id === assignment.reportId);
                  const draftNote =
                    assignmentNotes[assignment.id] !== undefined
                      ? assignmentNotes[assignment.id]
                      : assignment.note;

                  return (
                    <article
                      key={assignment.id}
                      className="ne-surface rounded-xl border p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-[#8295b3]">
                            <span className="font-semibold text-slate-900 dark:text-[#eef2f7]">
                              {assignment.organization}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>Lead: {assignment.volunteerName}</span>
                            <span aria-hidden="true">·</span>
                            <span>{assignment.capability}</span>
                            {assignment.isDemo && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-medium text-amber-700 dark:text-amber-300">
                                  Sample Demo Pledge
                                </span>
                              </>
                            )}
                          </div>
                          <h3 className="mt-1 font-display text-base font-semibold text-slate-900 dark:text-[#eef2f7]">
                            {linkedReport
                              ? `${linkedReport.locality} (${linkedReport.districtName}) — ${linkedReport.category}`
                              : `Request #${assignment.reportId}`}
                          </h3>
                          {linkedReport && (
                            <p className="mt-1 text-sm text-slate-600 dark:text-[#b7c6dc]">
                              {linkedReport.description}
                            </p>
                          )}
                        </div>

                        <span
                          className={`inline-flex shrink-0 items-center rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${getTaskStatusStyle(
                            assignment.taskStatus
                          )}`}
                        >
                          {assignment.taskStatus.replace('_', ' ')}
                        </span>
                      </div>

                      {/* 4-Stage Operation Progress Stepper */}
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8295b3]">
                          Operation Progress Tracking
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {TASK_STAGES.map((stage) => {
                            const active = assignment.taskStatus === stage.status;
                            return (
                              <button
                                key={stage.status}
                                type="button"
                                onClick={() =>
                                  void updateNgoTaskStatus(
                                    assignment.id,
                                    stage.status,
                                    draftNote
                                  )
                                }
                                className={`ne-btn-press min-h-[40px] rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                                  active
                                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                                    : 'border-[#dce4f0] bg-[#f8fafd] text-slate-700 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#142239] dark:text-[#d5e0f0] dark:hover:bg-[#1e3152]'
                                }`}
                              >
                                {stage.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Field Note & Release Action */}
                      <div className="mt-4 flex flex-col gap-3 border-t border-[#dce4f0] pt-4 dark:border-[#1f3250] sm:flex-row sm:items-center">
                        <input
                          type="text"
                          value={draftNote}
                          onChange={(e) =>
                            setAssignmentNotes((prev) => ({
                              ...prev,
                              [assignment.id]: e.target.value,
                            }))
                          }
                          placeholder="Update field status note (e.g., boat launched, 12 kits handed over)..."
                          aria-label="Field operation note"
                          className="ne-input h-10 flex-1 rounded-lg border px-3 text-xs"
                        />

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              void updateNgoTaskStatus(
                                assignment.id,
                                assignment.taskStatus,
                                draftNote
                              )
                            }
                            className="ne-btn-press min-h-[40px] rounded-lg border border-[#c2cfe2] bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152] whitespace-nowrap"
                          >
                            Save Note
                          </button>

                          <button
                            type="button"
                            onClick={() => setReleaseCandidate(assignment)}
                            className="ne-btn-press min-h-[40px] rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-500/35 dark:bg-red-500/12 dark:text-red-300 dark:hover:bg-red-500/20 whitespace-nowrap"
                          >
                            Release Task
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VOLUNTEER AVAILABILITY & FIELD RESOURCE INVENTORY */}
        {activeTab === 'team' && (
          <div className="grid gap-6 lg:grid-cols-12">
            <form
              onSubmit={(e) => void handleSaveProfile(e)}
              className="ne-surface lg:col-span-7 space-y-5 rounded-xl border p-6"
            >
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-[#eef2f7]">
                  Volunteer Availability &amp; Team Roster
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#8295b3]">
                  Keep your response team&apos;s availability, coverage district, and field supplies updated.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="prof-name"
                    className="block text-xs font-semibold text-slate-800 dark:text-[#d5e0f0]"
                  >
                    Lead Volunteer Name
                  </label>
                  <input
                    id="prof-name"
                    type="text"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className="ne-input mt-1.5 h-10 w-full rounded-lg border px-3 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="prof-org"
                    className="block text-xs font-semibold text-slate-800 dark:text-[#d5e0f0]"
                  >
                    NGO / Relief Organization
                  </label>
                  <input
                    id="prof-org"
                    type="text"
                    value={profOrg}
                    onChange={(e) => setProfOrg(e.target.value)}
                    className="ne-input mt-1.5 h-10 w-full rounded-lg border px-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="prof-district"
                    className="block text-xs font-semibold text-slate-800 dark:text-[#d5e0f0]"
                  >
                    Primary Coverage District
                  </label>
                  <select
                    id="prof-district"
                    value={profDistrict}
                    onChange={(e) => setProfDistrict(e.target.value)}
                    className="ne-input mt-1.5 h-10 w-full rounded-lg border px-3 text-xs font-medium"
                  >
                    {NORTHEAST_DISTRICTS.map((dist) => (
                      <option key={dist.id} value={dist.id}>
                        {dist.id === 'all' ? 'All NE Districts' : `${dist.name}, ${dist.state}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="prof-capability"
                    className="block text-xs font-semibold text-slate-800 dark:text-[#d5e0f0]"
                  >
                    Primary Capability
                  </label>
                  <select
                    id="prof-capability"
                    value={profCapability}
                    onChange={(e) => setProfCapability(e.target.value as NgoCapability)}
                    className="ne-input mt-1.5 h-10 w-full rounded-lg border px-3 text-xs font-medium"
                  >
                    {CAPABILITIES.map((cap) => (
                      <option key={cap} value={cap}>
                        {cap}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="prof-size"
                    className="block text-xs font-semibold text-slate-800 dark:text-[#d5e0f0]"
                  >
                    Active Volunteers
                  </label>
                  <input
                    id="prof-size"
                    type="number"
                    min={1}
                    max={500}
                    value={profTeamSize}
                    onChange={(e) => setProfTeamSize(e.target.value)}
                    className="ne-input mt-1.5 h-10 w-full rounded-lg border px-3 font-mono text-sm tabular-nums"
                  />
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-800 dark:text-[#d5e0f0]">
                  Current Availability Status
                </span>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setProfAvailability(opt.value)}
                      className={`ne-btn-press min-h-[40px] rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                        profAvailability === opt.value
                          ? opt.activeClass
                          : 'border-[#dce4f0] bg-[#f8fafd] text-slate-700 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#142239] dark:text-[#d5e0f0]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="prof-inventory"
                  className="block text-xs font-semibold text-slate-800 dark:text-[#d5e0f0]"
                >
                  Field Resource Inventory (comma-separated supplies &amp; gear)
                </label>
                <textarea
                  id="prof-inventory"
                  rows={3}
                  value={profInventoryText}
                  onChange={(e) => setProfInventoryText(e.target.value)}
                  placeholder="Inflatable Raft (2), Dry Ration Kits (40), First Aid Trauma Packs (12), Solar Lanterns (20)"
                  className="ne-input mt-1.5 w-full rounded-lg border p-3 text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-[#8295b3]">
                  Last saved: {formatRelativeAge(volunteerProfile.updatedAt)}
                </span>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="ne-btn-press inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60"
                >
                  <span>{isSavingProfile ? 'Saving...' : 'Save Availability & Inventory'}</span>
                </button>
              </div>
            </form>

            {/* Live Inventory Summary Panel */}
            <div className="lg:col-span-5 space-y-4">
              <div className="ne-surface rounded-xl border p-5">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-[#eef2f7]">
                    Team Field Inventory Snapshot
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-[#8295b3]">
                  Equipment and relief supplies carried by {volunteerProfile.organization}.
                </p>

                {volunteerProfile.resourceInventory.length === 0 ? (
                  <p className="mt-4 text-xs text-slate-500 dark:text-[#8295b3]">
                    No field supplies listed yet. Add items on the left to track readiness.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-[#dce4f0] dark:divide-[#1f3250]">
                    {volunteerProfile.resourceInventory.map((item, idx) => (
                      <li
                        key={`${item}-${idx}`}
                        className="flex items-center gap-2.5 py-2.5 text-sm text-slate-800 dark:text-[#e6edf7]"
                      >
                        <Layers
                          className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REGIONAL RESOURCE INVENTORY */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-[#eef2f7]">
                  Regional Relief Camps, Medical &amp; Supply Posts
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#8295b3]">
                  Check open capacity before transporting evacuees or routing supply convoys.
                </p>
              </div>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-[#8295b3]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  placeholder="Search camp or supplies..."
                  aria-label="Search regional resources"
                  className="ne-input h-9 w-56 rounded-lg border pl-8 pr-3 text-xs"
                />
              </div>
            </div>

            {filteredResources.length === 0 ? (
              <EmptyState
                title="No matching resource centers"
                description="Clear search or change district filter to inspect regional supply points."
                actionLabel="Clear Search"
                onAction={() => setResourceSearch('')}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredResources.map((res) => (
                  <ResourceCard key={res.id} resource={res} />
                ))}
              </div>
            )}
          </div>
        )}
      </ViewCrossfade>

      {/* Pledge Confirmation Modal */}
      <AnimatePresence>
        {pledgeTargetReport && (
          <motion.div
            key="pledge-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: NE_EASE }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pledge-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPledgeTargetReport(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 4 }}
              transition={{ duration: 0.18, ease: NE_EASE }}
              className="ne-surface-elevated w-full max-w-lg rounded-2xl border p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    NGO Task Pledge
                  </p>
                  <h3
                    id="pledge-modal-title"
                    className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-[#eef2f7]"
                  >
                    Pledge Response for {pledgeTargetReport.locality}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-[#8295b3]">
                    {pledgeTargetReport.category} · {pledgeTargetReport.severity} ·{' '}
                    {pledgeTargetReport.affectedPeopleCount} affected
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPledgeTargetReport(null)}
                  aria-label="Close modal"
                  className="ne-btn-press rounded-lg p-1.5 text-slate-500 hover:bg-[#edf2f8] dark:text-[#8295b3] dark:hover:bg-[#1e3152]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={(e) => void handleConfirmPledge(e)} className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="pledge-org"
                      className="block text-xs font-semibold text-slate-800 dark:text-[#d5e0f0]"
                    >
                      NGO / Volunteer Group
                    </label>
                    <input
                      id="pledge-org"
                      type="text"
                      required
                      value={pledgeOrganization}
                      onChange={(e) => setPledgeOrganization(e.target.value)}
                      className="ne-input mt-1 h-10 w-full rounded-lg border px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pledge-lead"
                      className="block text-xs font-semibold text-slate-800 dark:text-[#d5e0f0]"
                    >
                      Lead Volunteer Name
                    </label>
                    <input
                      id="pledge-lead"
                      type="text"
                      required
                      value={pledgeVolunteerName}
                      onChange={(e) => setPledgeVolunteerName(e.target.value)}
                      className="ne-input mt-1 h-10 w-full rounded-lg border px-3 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="pledge-cap"
                    className="block text-xs font-semibold text-slate-800 dark:text-[#d5e0f0]"
                  >
                    Response Capability
                  </label>
                  <select
                    id="pledge-cap"
                    value={pledgeCapability}
                    onChange={(e) => setPledgeCapability(e.target.value as NgoCapability)}
                    className="ne-input mt-1 h-10 w-full rounded-lg border px-3 text-sm"
                  >
                    {CAPABILITIES.map((cap) => (
                      <option key={cap} value={cap}>
                        {cap}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="pledge-note"
                    className="block text-xs font-semibold text-slate-800 dark:text-[#d5e0f0]"
                  >
                    Operational Plan / ETA Note (Optional)
                  </label>
                  <textarea
                    id="pledge-note"
                    rows={2}
                    value={pledgeNote}
                    onChange={(e) => setPledgeNote(e.target.value)}
                    placeholder="e.g., Carrying 20 dry ration packs and drinking water; ETA 45 mins via south approach."
                    className="ne-input mt-1 w-full rounded-lg border p-3 text-sm"
                  />
                </div>

                <div className="rounded-lg border border-amber-200/90 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-200">
                  Confirming this pledge records volunteer coordination only and does not replace official 112/SDRF rescue dispatch.
                </div>

                <div className="flex justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setPledgeTargetReport(null)}
                    className="ne-btn-press min-h-[40px] rounded-lg border border-[#c2cfe2] bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPledging}
                    className="ne-btn-press min-h-[40px] rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {isPledging ? 'Recording Pledge...' : 'Confirm NGO Pledge'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Release Assignment Confirmation */}
      <ConfirmationDialog
        open={Boolean(releaseCandidate)}
        title="Release NGO Assignment?"
        description="This removes your team's pledge from My Assignments so another volunteer group can respond."
        confirmLabel="Release Assignment"
        destructive
        onCancel={() => setReleaseCandidate(null)}
        onConfirm={() => {
          if (releaseCandidate) {
            void releaseNgoTask(releaseCandidate.id);
          }
          setReleaseCandidate(null);
        }}
      />
    </div>
  );
};
