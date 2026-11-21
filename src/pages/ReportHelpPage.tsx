import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Crosshair,
  FileWarning,
  HeartHandshake,
  Inbox,
  LifeBuoy,
  Loader2,
  MessageSquareShare,
  ThumbsUp,
  WifiOff,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EmergencyStrip } from '../components/EmergencyStrip';
import { AnimatedReveal, ViewCrossfade } from '../components/MotionPrimitives';
import { OfflineBanner } from '../components/OfflineBanner';
import { useApp } from '../context/AppContext';
import { NORTHEAST_DISTRICTS } from '../data/sampleData';
import {
  AssistanceNeed,
  IncidentCategory,
  IncidentSeverity,
  OutboxSubmission,
  ReportMode,
  VulnerabilityTag,
} from '../types';
import { buildSmsShareUrl, createClientUuid } from '../utils/formatters';

type EntryFlowMode = 'sos' | 'help' | 'hazard';

const CATEGORIES: IncidentCategory[] = [
  'Flooding',
  'Landslide',
  'Road Blockage',
  'Bridge Damage',
  'Stranded Persons',
  'Medical Emergency',
  'Power / Telecom Outage',
];

const SOS_CATEGORIES: IncidentCategory[] = [
  'Stranded Persons',
  'Medical Emergency',
  'Flooding',
  'Landslide',
];

const SEVERITIES: { value: IncidentSeverity; label: string; hint: string }[] = [
  { value: 'LOW', label: 'Low', hint: 'Minor inconvenience, passable' },
  { value: 'MODERATE', label: 'Moderate', hint: 'Partial blockage or localized impact' },
  { value: 'HIGH', label: 'High', hint: 'Urgent assistance needed soon' },
  { value: 'CRITICAL', label: 'Critical', hint: 'Life-safety risk or complete isolation' },
];

const VULNERABILITIES: VulnerabilityTag[] = [
  'Elderly',
  'Infants',
  'Pregnant',
  'Medical Need',
  'Disabled',
];

const ASSISTANCE_NEEDS: AssistanceNeed[] = ['Rescue', 'Medical', 'Food / Water', 'Shelter'];

export const ReportHelpPage: React.FC = () => {
  const {
    selectedDistrictId,
    isOnline,
    reports,
    confirmedReportIds,
    toggleConfirmReport,
    submitReport,
    outbox,
    editingOutboxItem,
    setEditingOutboxItem,
    setIsOutboxOpen,
    addToast,
    t,
  } = useApp();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialFlowMode: EntryFlowMode =
    searchParams.get('mode') === 'hazard'
      ? 'hazard'
      : searchParams.get('mode') === 'help'
      ? 'help'
      : 'sos';

  const [flowMode, setFlowMode] = useState<EntryFlowMode>(initialFlowMode);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<ReportMode>(
    initialFlowMode === 'hazard' ? 'HAZARD' : 'HELP_REQUEST'
  );
  const [districtId, setDistrictId] = useState<string>(
    selectedDistrictId !== 'all' ? selectedDistrictId : 'kamrup-metro'
  );
  const [corridorOrBlock, setCorridorOrBlock] = useState('');
  const [locality, setLocality] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'captured' | 'error'>('idle');
  const [reportingForOthers, setReportingForOthers] = useState(false);

  const [category, setCategory] = useState<IncidentCategory>(
    initialFlowMode === 'hazard' ? 'Landslide' : 'Stranded Persons'
  );
  const [severity, setSeverity] = useState<IncidentSeverity>(
    initialFlowMode === 'hazard' ? 'MODERATE' : initialFlowMode === 'sos' ? 'CRITICAL' : 'HIGH'
  );
  const [description, setDescription] = useState('');
  const [affectedPeopleCount, setAffectedPeopleCount] = useState<string>(
    initialFlowMode === 'sos' ? '2' : '4'
  );
  const [vulnerabilityTags, setVulnerabilityTags] = useState<VulnerabilityTag[]>([]);
  const [assistanceNeeds, setAssistanceNeeds] = useState<AssistanceNeed[]>(
    initialFlowMode === 'hazard' ? [] : ['Rescue']
  );

  const [contactPhone, setContactPhone] = useState('');
  const [reporterName, setReporterName] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOutboxItem, setSubmittedOutboxItem] = useState<OutboxSubmission | null>(null);
  const [draftClientUuid, setDraftClientUuid] = useState<string>(() => createClientUuid());

  // Hydrate when editing from My Outbox
  useEffect(() => {
    const editId = searchParams.get('edit');
    const target =
      editingOutboxItem ?? (editId ? outbox.find((item) => item.id === editId) ?? null : null);
    if (target) {
      const d = target.reportData;
      setMode(d.mode);
      setFlowMode(d.mode === 'HAZARD' ? 'hazard' : 'help');
      setDistrictId(d.districtId);
      setCorridorOrBlock(d.corridorOrBlock);
      setLocality(d.locality);
      setCoordinates(d.coordinates ?? null);
      setReportingForOthers(d.reportingForOthers);
      setCategory(d.category);
      setSeverity(d.severity);
      setDescription(d.description);
      setAffectedPeopleCount(String(d.affectedPeopleCount));
      setVulnerabilityTags(d.vulnerabilityTags);
      setAssistanceNeeds(d.assistanceNeeds);
      setContactPhone(d.contactPhone);
      setReporterName(d.reporterName);
      setStep(1);
    }
  }, [editingOutboxItem, outbox, searchParams]);

  // Update mode when query changes cleanly if not editing
  useEffect(() => {
    if (searchParams.get('edit')) return;
    const paramMode = searchParams.get('mode');
    if (paramMode === 'hazard') {
      setFlowMode('hazard');
      setMode('HAZARD');
    } else if (paramMode === 'help') {
      setFlowMode('help');
      setMode('HELP_REQUEST');
    } else if (paramMode === 'sos') {
      setFlowMode('sos');
      setMode('HELP_REQUEST');
      setSeverity('CRITICAL');
      setAssistanceNeeds((prev) => (prev.length === 0 ? ['Rescue'] : prev));
    }
  }, [searchParams]);

  const handleSelectFlowMode = (next: EntryFlowMode) => {
    setErrors({});
    setSubmitError(null);
    setFlowMode(next);
    if (next === 'hazard') {
      setMode('HAZARD');
      if (category === 'Stranded Persons') setCategory('Landslide');
    } else if (next === 'help') {
      setMode('HELP_REQUEST');
      if (assistanceNeeds.length === 0) setAssistanceNeeds(['Rescue']);
    } else {
      setMode('HELP_REQUEST');
      setSeverity('CRITICAL');
      if (assistanceNeeds.length === 0) setAssistanceNeeds(['Rescue']);
      if (!SOS_CATEGORIES.includes(category)) setCategory('Stranded Persons');
    }
  };

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      addToast({
        type: 'warning',
        title: 'GPS unavailable in this browser',
        description: 'Please enter a clear landmark or highway kilometer marker instead.',
      });
      return;
    }
    setGpsStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        });
        setGpsStatus('captured');
        addToast({ type: 'success', title: 'GPS coordinates attached' });
      },
      () => {
        setGpsStatus('error');
        addToast({
          type: 'warning',
          title: 'Could not read GPS location',
          description: 'Location permission denied or unavailable. Landmark text is sufficient.',
        });
      },
      { timeout: 6000 }
    );
  };

  const toggleVulnerability = (tag: VulnerabilityTag) => {
    setVulnerabilityTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleAssistanceNeed = (need: AssistanceNeed) => {
    setAssistanceNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const validateStep = (targetStep: 1 | 2 | 3): boolean => {
    const nextErrors: Record<string, string> = {};

    if (targetStep === 1) {
      if (!districtId || districtId === 'all') {
        nextErrors.districtId = 'Please choose a specific district.';
      }
      const trimmedCorridor = corridorOrBlock.trim();
      if (trimmedCorridor.length < 2 || trimmedCorridor.length > 160) {
        nextErrors.corridorOrBlock = 'Enter a block, ward, or highway corridor name (2–160 characters).';
      }
      const trimmedLocality = locality.trim();
      if (trimmedLocality.length < 2 || trimmedLocality.length > 200) {
        nextErrors.locality = 'Enter a specific locality, village, or landmark (2–200 characters).';
      }
    }

    if (targetStep === 2) {
      const trimmedDesc = description.trim();
      if (trimmedDesc.length < 12 || trimmedDesc.length > 2000) {
        nextErrors.description =
          'Please provide a situation description between 12 and 2,000 characters.';
      }
      const parsedCount = Number(affectedPeopleCount);
      if (!Number.isInteger(parsedCount) || parsedCount < 1 || parsedCount > 100000) {
        nextErrors.affectedPeopleCount = 'Enter a whole number between 1 and 100,000 affected people.';
      }
      if (mode === 'HELP_REQUEST' && assistanceNeeds.length === 0) {
        nextErrors.assistanceNeeds = 'Select at least one type of assistance needed.';
      }
    }

    if (targetStep === 3) {
      const trimmedPhone = contactPhone.trim();
      const digits = trimmedPhone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15 || trimmedPhone.length > 25) {
        nextErrors.contactPhone = 'Enter a valid 10–15 digit mobile or helpline callback number.';
      }
      const trimmedName = reporterName.trim();
      if (trimmedName.length < 2 || trimmedName.length > 100) {
        nextErrors.reporterName = 'Enter your name or a brief label (2–100 characters).';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateQuickSos = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!districtId || districtId === 'all') {
      nextErrors.districtId = 'Please choose a specific district.';
    }
    const trimmedLocality = locality.trim();
    if (trimmedLocality.length < 2 || trimmedLocality.length > 200) {
      nextErrors.locality = 'Enter your locality, village, or nearest landmark (2–200 characters).';
    }
    const parsedCount = Number(affectedPeopleCount);
    if (!Number.isInteger(parsedCount) || parsedCount < 1 || parsedCount > 100000) {
      nextErrors.affectedPeopleCount = 'Enter number of people needing help (1–100,000).';
    }
    if (assistanceNeeds.length === 0) {
      nextErrors.assistanceNeeds = 'Select at least one urgent need.';
    }
    const trimmedPhone = contactPhone.trim();
    const digits = trimmedPhone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15 || trimmedPhone.length > 25) {
      nextErrors.contactPhone = 'Enter a valid 10–15 digit phone number so teams can reach you.';
    }
    const trimmedName = reporterName.trim();
    if (trimmedName.length === 1 || trimmedName.length > 100) {
      nextErrors.reporterName = 'Enter 2–100 characters or leave blank to use Citizen SOS.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    setSubmitError(null);
    if (validateStep(step)) {
      setStep((s) => (s === 1 ? 2 : 3));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const isSos = flowMode === 'sos';
    if (isSos) {
      if (!validateQuickSos()) return;
    } else {
      if (!validateStep(1)) {
        setStep(1);
        return;
      }
      if (!validateStep(2)) {
        setStep(2);
        return;
      }
      if (!validateStep(3)) {
        return;
      }
    }

    const district = NORTHEAST_DISTRICTS.find((d) => d.id === districtId);
    const trimmedLocality = locality.trim();
    const effectiveCount = Math.max(1, Math.round(Number(affectedPeopleCount)) || 1);
    const effectiveCorridor = isSos
      ? corridorOrBlock.trim() || trimmedLocality.slice(0, 160)
      : corridorOrBlock.trim();
    const rawDesc = description.trim();
    const effectiveDescription =
      isSos && rawDesc.length < 12
        ? `${rawDesc ? `${rawDesc} — ` : ''}Quick SOS: ${assistanceNeeds.join(', ')} needed near ${trimmedLocality} (${effectiveCount} affected).`
        : rawDesc;
    const effectiveReporter = isSos
      ? reporterName.trim() || 'Citizen SOS'
      : reporterName.trim();

    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      const result = await submitReport({
        editingOutboxId: editingOutboxItem?.id ?? searchParams.get('edit') ?? undefined,
        clientUuid: editingOutboxItem?.clientUuid ?? draftClientUuid,
        reportData: {
          mode: isSos ? 'HELP_REQUEST' : mode,
          districtId,
          districtName: district ? district.name : districtId,
          corridorOrBlock: effectiveCorridor,
          locality: trimmedLocality,
          coordinates,
          category,
          severity,
          description: effectiveDescription,
          affectedPeopleCount: effectiveCount,
          vulnerabilityTags,
          assistanceNeeds,
          contactPhone: contactPhone.trim(),
          reporterName: effectiveReporter,
          reportingForOthers,
          createdAt: new Date().toISOString(),
        },
      });
      setEditingOutboxItem(null);
      setSubmittedOutboxItem(result.outboxItem);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Unable to submit report. Please verify your entries and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedOutboxItem(null);
    setEditingOutboxItem(null);
    setSubmitError(null);
    setStep(1);
    setCorridorOrBlock('');
    setLocality('');
    setDescription('');
    setCoordinates(null);
    setGpsStatus('idle');
    setVulnerabilityTags([]);
    setErrors({});
    setDraftClientUuid(createClientUuid());
    navigate('/report?mode=sos', { replace: true });
  };

  const selectedDistrictName =
    NORTHEAST_DISTRICTS.find((d) => d.id === districtId)?.name ?? 'Select district';

  const possibleDuplicates = useMemo(() => {
    const queryText = `${locality} ${corridorOrBlock}`.trim().toLowerCase();
    if (queryText.length < 3) return [];
    const tokens = queryText
      .split(/[\s,.\-–/]+/)
      .map((tok) => tok.trim())
      .filter((tok) => tok.length >= 3);
    if (tokens.length === 0) return [];

    const threeHoursMs = 3 * 60 * 60 * 1000;
    const nowMs = Date.now();

    return reports.filter((rep) => {
      if (rep.mergedIntoId) return false;
      if (rep.districtId !== districtId || rep.category !== category) return false;
      const createdMs = new Date(rep.createdAt).getTime();
      if (Number.isNaN(createdMs) || Math.abs(nowMs - createdMs) > threeHoursMs) return false;
      const haystack = `${rep.locality} ${rep.corridorOrBlock} ${rep.description}`.toLowerCase();
      return tokens.some((tok) => haystack.includes(tok));
    });
  }, [reports, districtId, category, locality, corridorOrBlock]);

  const duplicateHintCard =
    possibleDuplicates.length > 0 ? (
      <div
        role="region"
        aria-label="Possible duplicate reports"
        className="rounded-xl border border-amber-300/90 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/35 dark:bg-[#1e1a14] dark:text-amber-100"
      >
        <div className="flex items-start gap-2.5">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div>
              <p className="text-sm font-semibold">
                Similar {category} report already active nearby (last 3 hours)
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200/85">
                If this is the same incident, tap +1 Confirm instead of creating a duplicate—or continue submitting if your location or need is distinct.
              </p>
            </div>
            <ul className="space-y-2">
              {possibleDuplicates.slice(0, 3).map((dup) => {
                const isConfirmed = confirmedReportIds.includes(dup.id);
                return (
                  <li
                    key={dup.id}
                    className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-white/95 p-3 text-xs dark:border-[#2d456b] dark:bg-[#101b2e] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-[#eef2f7]">
                        {dup.locality} · {dup.corridorOrBlock}
                      </p>
                      <p className="mt-0.5 text-slate-600 dark:text-[#9cb0cc] line-clamp-2">
                        {dup.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void toggleConfirmReport(dup.id)}
                      aria-pressed={isConfirmed}
                      className={`ne-btn-press inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                        isConfirmed
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-amber-400 bg-amber-100 text-amber-950 hover:bg-amber-200 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100'
                      }`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        {isConfirmed
                          ? `Confirmed (${dup.confirmations})`
                          : `+1 Confirm existing report (${dup.confirmations})`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    ) : null;

  // Confirmation Screen
  if (submittedOutboxItem) {
    const savedOffline = submittedOutboxItem.syncStatus !== 'SYNCED';
    return (
      <AnimatedReveal className="mx-auto max-w-2xl space-y-6">
        <EmergencyStrip />

        <div className="ne-surface rounded-2xl border p-6 sm:p-8">
          {savedOffline ? (
            <div className="rounded-xl border border-amber-300/90 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/35 dark:bg-[#1e1a14] dark:text-amber-100">
              <div className="flex items-start gap-3">
                <WifiOff className="mt-0.5 h-6 w-6 shrink-0 text-amber-700 dark:text-amber-300" />
                <div>
                  <h2 className="font-display text-lg font-bold">
                    {t.reportPage.savedOfflineHeadline}
                  </h2>
                  <p className="mt-1 text-sm text-amber-900 dark:text-amber-200/90">
                    {t.reportPage.savedOfflineSub}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200/90 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-500/12 dark:text-emerald-100">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h2 className="font-display text-lg font-bold">
                    {t.reportPage.submittedOnlineHeadline}
                  </h2>
                  <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-200/90">
                    Marked as Unverified until reviewed by a Coordinator. Reference ID:{' '}
                    <span className="font-mono font-semibold">
                      {submittedOutboxItem.syncedReportId ?? submittedOutboxItem.id}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2 border-t border-[#dce4f0] pt-5 text-sm dark:border-[#1f3250]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8295b3]">
              Submitted Summary
            </p>
            <p className="font-semibold text-slate-900 dark:text-[#eef2f7]">
              {submittedOutboxItem.reportData.mode === 'HELP_REQUEST'
                ? t.reportPage.modeHelp
                : t.reportPage.modeHazard}{' '}
              — {submittedOutboxItem.reportData.category} ({submittedOutboxItem.reportData.severity})
            </p>
            <p className="text-slate-700 dark:text-[#b7c6dc]">
              {submittedOutboxItem.reportData.locality},{' '}
              {submittedOutboxItem.reportData.corridorOrBlock} ·{' '}
              {submittedOutboxItem.reportData.districtName}
            </p>
            <p className="text-slate-600 dark:text-[#9cb0cc]">
              {submittedOutboxItem.reportData.description}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsOutboxOpen(true)}
              className="ne-btn-press inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Inbox className="h-4 w-4" aria-hidden="true" />
              <span>{t.reportPage.openOutbox}</span>
            </button>

            <a
              href={buildSmsShareUrl(submittedOutboxItem)}
              onClick={() =>
                addToast({
                  type: 'info',
                  title: 'Opening SMS composer',
                  description: 'Opens your SMS app. We cannot confirm delivery.',
                })
              }
              className="ne-btn-press inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#c2cfe2] bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
            >
              <MessageSquareShare className="h-4 w-4" aria-hidden="true" />
              <span>{t.reportPage.shareSms}</span>
            </a>

            <Link
              to="/board"
              className="ne-btn-press inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#c2cfe2] bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
            >
              <span>{t.reportPage.returnBoard}</span>
            </Link>

            <button
              type="button"
              onClick={resetForm}
              className="ml-auto text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {t.reportPage.submitAnother}
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500 dark:text-[#8295b3]">
            {t.reportPage.smsNotice}
          </p>
        </div>
      </AnimatedReveal>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <EmergencyStrip />
      <OfflineBanner />

      <div className="ne-surface rounded-2xl border p-5 sm:p-7">
        {/* Entry Mode Selector: Quick SOS | Detailed Help | Report Hazard */}
        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold text-[#102341] dark:text-[#eef2f7]">
            {editingOutboxItem ? t.reportPage.editingHeading : t.reportPage.heading}
          </h2>
          <p className="text-sm text-slate-600 dark:text-[#9cb0cc]">
            {t.reportPage.subtext}
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => handleSelectFlowMode('sos')}
              className={`ne-btn-press flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                flowMode === 'sos'
                  ? 'border-red-600 bg-red-50/85 dark:border-red-500/70 dark:bg-red-500/14'
                  : 'border-[#dce4f0] bg-[#f8fafd] hover:border-[#c2cfe2] dark:border-[#1f3250] dark:bg-[#142239] dark:hover:border-[#2d456b]'
              }`}
            >
              <LifeBuoy
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  flowMode === 'sos'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-400 dark:text-[#8295b3]'
                }`}
                aria-hidden="true"
              />
              <div>
                <p className="font-display text-sm font-semibold text-slate-900 dark:text-[#eef2f7]">
                  {t.experience.quickSos}
                </p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-[#9cb0cc]">
                  Fast single-screen urgent help request with optional GPS &amp; SMS.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectFlowMode('help')}
              className={`ne-btn-press flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                flowMode === 'help'
                  ? 'border-blue-600 bg-blue-50/80 dark:border-blue-500/70 dark:bg-blue-500/14'
                  : 'border-[#dce4f0] bg-[#f8fafd] hover:border-[#c2cfe2] dark:border-[#1f3250] dark:bg-[#142239] dark:hover:border-[#2d456b]'
              }`}
            >
              <HeartHandshake
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  flowMode === 'help'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-[#8295b3]'
                }`}
                aria-hidden="true"
              />
              <div>
                <p className="font-display text-sm font-semibold text-slate-900 dark:text-[#eef2f7]">
                  {t.experience.detailedReport}
                </p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-[#9cb0cc]">
                  {t.reportPage.modeHelpSub}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectFlowMode('hazard')}
              className={`ne-btn-press flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                flowMode === 'hazard'
                  ? 'border-amber-600 bg-amber-50/80 dark:border-amber-500/70 dark:bg-amber-500/14'
                  : 'border-[#dce4f0] bg-[#f8fafd] hover:border-[#c2cfe2] dark:border-[#1f3250] dark:bg-[#142239] dark:hover:border-[#2d456b]'
              }`}
            >
              <FileWarning
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  flowMode === 'hazard'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-400 dark:text-[#8295b3]'
                }`}
                aria-hidden="true"
              />
              <div>
                <p className="font-display text-sm font-semibold text-slate-900 dark:text-[#eef2f7]">
                  {t.reportPage.modeHazard}
                </p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-[#9cb0cc]">
                  {t.reportPage.modeHazardSub}
                </p>
              </div>
            </button>
          </div>
        </div>

        <ViewCrossfade viewKey={flowMode === 'sos' ? 'sos' : 'detailed'}>
          {flowMode === 'sos' ? (
            <form
              onSubmit={(e) => void handleSubmit(e)}
              className="mt-6 space-y-5 border-t border-[#dce4f0] pt-5 dark:border-[#1f3250]"
              noValidate
            >
              {duplicateHintCard}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="sos-district"
                    className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]"
                  >
                    {t.reportPage.district} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="sos-district"
                    value={districtId}
                    onChange={(e) => setDistrictId(e.target.value)}
                    className="ne-input mt-1.5 h-11 w-full rounded-lg border px-3 text-sm"
                  >
                    {NORTHEAST_DISTRICTS.filter((d) => d.id !== 'all').map((dist) => (
                      <option key={dist.id} value={dist.id}>
                        {dist.name}, {dist.state}
                      </option>
                    ))}
                  </select>
                  {errors.districtId && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.districtId}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="sos-locality"
                    className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]"
                  >
                    {t.reportPage.locality} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sos-locality"
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g., Ward 4 Temple Gate or NH-27 Km 44"
                    className="ne-input mt-1.5 h-11 w-full rounded-lg border px-3.5 text-sm"
                  />
                  {errors.locality && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.locality}</p>
                  )}
                </div>
              </div>

              {/* Optional GPS One-Tap Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border ne-surface-subtle px-4 py-3">
                <div className="text-xs">
                  <p className="font-semibold text-slate-900 dark:text-[#eef2f7]">
                    {t.reportPage.optionalGps}
                  </p>
                  <p className="text-slate-500 dark:text-[#8295b3]">
                    {coordinates
                      ? `GPS Attached: ${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`
                      : 'Tap to attach GPS coordinates if available.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCaptureGps}
                  disabled={gpsStatus === 'locating'}
                  className="ne-btn-press inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[#c2cfe2] bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
                >
                  {gpsStatus === 'locating' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Crosshair className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                  <span>{coordinates ? t.reportPage.refreshGps : t.reportPage.useCurrentGps}</span>
                </button>
              </div>

              {/* Assistance Needed + People Count + Urgency */}
              <div>
                <span className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]">
                  {t.reportPage.assistanceNeeded} <span className="text-red-500">*</span>
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ASSISTANCE_NEEDS.map((need) => {
                    const active = assistanceNeeds.includes(need);
                    return (
                      <button
                        key={need}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleAssistanceNeed(need)}
                        className={`ne-btn-press min-h-[44px] rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                          active
                            ? 'border-red-600 bg-red-600 text-white shadow-xs'
                            : 'border-[#c2cfe2] bg-white text-slate-700 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#142239] dark:text-[#d5e0f0] dark:hover:bg-[#1e3152]'
                        }`}
                      >
                        {need}
                      </button>
                    );
                  })}
                </div>
                {errors.assistanceNeeds && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.assistanceNeeds}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="sos-category"
                    className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]"
                  >
                    {t.reportPage.category}
                  </label>
                  <select
                    id="sos-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                    className="ne-input mt-1.5 h-11 w-full rounded-lg border px-3 text-sm"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sos-affected"
                    className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]"
                  >
                    {t.reportPage.affectedCount} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sos-affected"
                    type="number"
                    min={1}
                    max={5000}
                    value={affectedPeopleCount}
                    onChange={(e) => setAffectedPeopleCount(e.target.value)}
                    className="ne-input mt-1.5 h-11 w-full rounded-lg border px-3.5 font-mono text-sm tabular-nums"
                  />
                  {errors.affectedPeopleCount && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.affectedPeopleCount}
                    </p>
                  )}
                </div>

                <div>
                  <span className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]">
                    {t.reportPage.severityLevel}
                  </span>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    {(['CRITICAL', 'HIGH'] as IncidentSeverity[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSeverity(lvl)}
                        className={`ne-btn-press h-11 rounded-lg border text-xs font-semibold transition-colors ${
                          severity === lvl
                            ? lvl === 'CRITICAL'
                              ? 'border-red-600 bg-red-600 text-white'
                              : 'border-amber-600 bg-amber-600 text-white'
                            : 'border-[#c2cfe2] bg-white text-slate-700 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#142239] dark:text-[#d5e0f0]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="sos-phone"
                    className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]"
                  >
                    {t.reportPage.contactPhone} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sos-phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98640 XXXXX"
                    className="ne-input mt-1.5 h-11 w-full rounded-lg border px-3.5 font-mono text-sm"
                  />
                  {errors.contactPhone && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.contactPhone}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="sos-name"
                    className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]"
                  >
                    {t.reportPage.reporterName} (Optional)
                  </label>
                  <input
                    id="sos-name"
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Defaults to Citizen SOS if blank"
                    className="ne-input mt-1.5 h-11 w-full rounded-lg border px-3.5 text-sm"
                  />
                  {errors.reporterName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.reporterName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="sos-note"
                  className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]"
                >
                  Optional Note (water depth, roof access, elderly/medical details)
                </label>
                <input
                  id="sos-note"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., 4 ft water inside house, 1 elderly person needs oxygen/boat"
                  className="ne-input mt-1.5 h-11 w-full rounded-lg border px-3.5 text-sm"
                />
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:border-red-500/35 dark:bg-red-500/12 dark:text-red-200"
                >
                  {submitError}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500 dark:text-[#8295b3]">
                  {isOnline
                    ? 'Posts immediately to Situation Board & NGO Relief Operations.'
                    : t.reportPage.savedOfflineHeadline}
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ne-btn-press inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-red-700 disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isOnline ? 'Sending SOS...' : 'Saving on Device...'}</span>
                    </>
                  ) : (
                    <span>
                      {isOnline ? 'Send Quick SOS Request' : t.reportPage.saveOfflineOutbox}
                    </span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div>
              {/* 3-STEP DETAILED WORKFLOW (HELP REQUEST OR HAZARD REPORT) */}
              <div className="mt-6 grid grid-cols-3 gap-2 border-y border-[#dce4f0] py-3 dark:border-[#1f3250]">
                {(
                  [
                    [1, t.reportPage.step1],
                    [2, t.reportPage.step2],
                    [3, t.reportPage.step3],
                  ] as const
                ).map(([num, label]) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (num < step || validateStep(step)) setStep(num);
                    }}
                    className={`ne-btn-press rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      step === num
                        ? 'bg-blue-600 text-white shadow-xs'
                        : step > num
                        ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-500/14 dark:text-emerald-300 dark:ring-emerald-500/30'
                        : 'bg-[#edf2f8] text-slate-600 dark:bg-[#142239] dark:text-[#8295b3]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-5" noValidate>
                <ViewCrossfade viewKey={`step-${step}`}>
                  {step === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="report-district"
                          className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]"
                        >
                          {t.reportPage.district} <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="report-district"
                          value={districtId}
                          onChange={(e) => setDistrictId(e.target.value)}
                          className="ne-input mt-1.5 h-11 w-full rounded-lg border px-3 text-sm"
                        >
                          {NORTHEAST_DISTRICTS.filter((d) => d.id !== 'all').map((dist) => (
                            <option key={dist.id} value={dist.id}>
                              {dist.name}, {dist.state}
                            </option>
                          ))}
                        </select>
                        {errors.districtId && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {errors.districtId}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="report-corridor"
                          className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]"
                        >
                          {t.reportPage.blockCorridor} <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="report-corridor"
                          type="text"
                          value={corridorOrBlock}
                          onChange={(e) => setCorridorOrBlock(e.target.value)}
                          placeholder="e.g., NH-27 Lumding–Haflong or Anil Nagar Ward"
                          className="ne-input mt-1.5 h-11 w-full rounded-lg border px-3.5 text-sm"
                        />
                        {errors.corridorOrBlock && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {errors.corridorOrBlock}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="report-locality"
                          className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]"
                        >
                          {t.reportPage.locality} <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="report-locality"
                          type="text"
                          value={locality}
                          onChange={(e) => setLocality(e.target.value)}
                          placeholder="e.g., Km 44 near Jatinga Viewpoint or Lane 4 Temple Gate"
                          className="ne-input mt-1.5 h-11 w-full rounded-lg border px-3.5 text-sm"
                        />
                        {errors.locality && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {errors.locality}
                          </p>
                        )}
                      </div>

                      {/* Optional GPS Capture */}
                      <div className="rounded-xl border ne-surface-subtle p-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-[#eef2f7]">
                              {t.reportPage.optionalGps}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-[#8295b3]">
                              {coordinates
                                ? `Attached: ${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`
                                : 'Helps responders locate exact spots on rural roads.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleCaptureGps}
                            disabled={gpsStatus === 'locating'}
                            className="ne-btn-press inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[#c2cfe2] bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
                          >
                            {gpsStatus === 'locating' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Crosshair className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            )}
                            <span>
                              {coordinates ? t.reportPage.refreshGps : t.reportPage.useCurrentGps}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Reporting for others toggle */}
                      <label className="flex min-h-[44px] cursor-pointer items-center justify-between rounded-xl border border-[#dce4f0] px-4 py-3 dark:border-[#1f3250]">
                        <div>
                          <span className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]">
                            {t.reportPage.reportingForOthers}
                          </span>
                          <span className="block text-xs text-slate-500 dark:text-[#8295b3]">
                            {t.reportPage.reportingForOthersSub}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={reportingForOthers}
                          onChange={(e) => setReportingForOthers(e.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleNext}
                          className="ne-btn-press inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          <span>{t.reportPage.nextStep2}</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-5">
                      {duplicateHintCard}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="report-category"
                            className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]"
                          >
                            {t.reportPage.category}
                          </label>
                          <select
                            id="report-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                            className="ne-input mt-1.5 h-11 w-full rounded-lg border px-3 text-sm"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="report-affected"
                            className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]"
                          >
                            {t.reportPage.affectedCount} <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="report-affected"
                            type="number"
                            min={1}
                            max={5000}
                            value={affectedPeopleCount}
                            onChange={(e) => setAffectedPeopleCount(e.target.value)}
                            className="ne-input mt-1.5 h-11 w-full rounded-lg border px-3.5 font-mono text-sm tabular-nums"
                          />
                          {errors.affectedPeopleCount && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                              {errors.affectedPeopleCount}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Severity */}
                      <div>
                        <span className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]">
                          {t.reportPage.severityLevel}
                        </span>
                        <div className="mt-2 grid gap-2 sm:grid-cols-4">
                          {SEVERITIES.map((sev) => (
                            <button
                              key={sev.value}
                              type="button"
                              onClick={() => setSeverity(sev.value)}
                              className={`ne-btn-press rounded-lg border p-2.5 text-left transition-colors ${
                                severity === sev.value
                                  ? 'border-blue-600 bg-blue-50 dark:border-blue-500/70 dark:bg-blue-500/15'
                                  : 'border-[#dce4f0] hover:border-[#c2cfe2] dark:border-[#1f3250] dark:bg-[#142239] dark:hover:border-[#2d456b]'
                              }`}
                            >
                              <span className="block text-xs font-semibold text-slate-900 dark:text-[#eef2f7]">
                                {sev.label}
                              </span>
                              <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-[#8295b3]">
                                {sev.hint}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label
                          htmlFor="report-description"
                          className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]"
                        >
                          {t.reportPage.description} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="report-description"
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe water depth, blockage size, road access for boats/ambulances, or immediate dangers..."
                          className="ne-input mt-1.5 w-full rounded-lg border p-3 text-sm"
                        />
                        {errors.description && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {errors.description}
                          </p>
                        )}
                      </div>

                      {/* Vulnerability Tags */}
                      <div>
                        <span className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]">
                          {t.reportPage.vulnerabilityTags}
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {VULNERABILITIES.map((tag) => {
                            const active = vulnerabilityTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                aria-pressed={active}
                                onClick={() => toggleVulnerability(tag)}
                                className={`ne-btn-press min-h-[38px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                                  active
                                    ? 'border-amber-600 bg-amber-50 text-amber-900 dark:border-amber-500/60 dark:bg-amber-500/15 dark:text-amber-200'
                                    : 'border-[#c2cfe2] bg-white text-slate-700 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#142239] dark:text-[#d5e0f0]'
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Assistance Needs */}
                      <div>
                        <span className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]">
                          {t.reportPage.assistanceNeeded}{' '}
                          {mode === 'HELP_REQUEST' && <span className="text-red-500">*</span>}
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {ASSISTANCE_NEEDS.map((need) => {
                            const active = assistanceNeeds.includes(need);
                            return (
                              <button
                                key={need}
                                type="button"
                                aria-pressed={active}
                                onClick={() => toggleAssistanceNeed(need)}
                                className={`ne-btn-press min-h-[38px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                                  active
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-[#c2cfe2] bg-white text-slate-700 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:bg-[#142239] dark:text-[#d5e0f0]'
                                }`}
                              >
                                {need}
                              </button>
                            );
                          })}
                        </div>
                        {errors.assistanceNeeds && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {errors.assistanceNeeds}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="ne-btn-press inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#c2cfe2] px-4 py-2 text-sm font-medium text-slate-700 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          <span>{t.reportPage.back}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleNext}
                          className="ne-btn-press inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          <span>{t.reportPage.nextStep3}</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-5">
                      {duplicateHintCard}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="report-phone"
                            className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]"
                          >
                            {t.reportPage.contactPhone} <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="report-phone"
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="+91 98640 XXXXX"
                            className="ne-input mt-1.5 h-11 w-full rounded-lg border px-3.5 font-mono text-sm"
                          />
                          {errors.contactPhone && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                              {errors.contactPhone}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="report-name"
                            className="block text-sm font-medium text-slate-900 dark:text-[#eef2f7]"
                          >
                            {t.reportPage.reporterName} <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="report-name"
                            type="text"
                            value={reporterName}
                            onChange={(e) => setReporterName(e.target.value)}
                            placeholder="e.g., Anita Sharma or Ward 12 Volunteer"
                            className="ne-input mt-1.5 h-11 w-full rounded-lg border px-3.5 text-sm"
                          />
                          {errors.reporterName && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                              {errors.reporterName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Review Summary */}
                      <div className="rounded-xl border ne-surface-subtle p-4 text-sm">
                        <p className="font-display text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8295b3]">
                          {t.reportPage.reviewTitle}
                        </p>
                        <div className="mt-2 grid gap-1.5 text-xs text-slate-700 dark:text-[#b7c6dc]">
                          <p>
                            <span className="font-semibold">Type:</span>{' '}
                            {mode === 'HELP_REQUEST'
                              ? t.reportPage.modeHelp
                              : t.reportPage.modeHazard}{' '}
                            ({category} · {severity})
                          </p>
                          <p>
                            <span className="font-semibold">Location:</span> {locality},{' '}
                            {corridorOrBlock} ({selectedDistrictName})
                          </p>
                          <p>
                            <span className="font-semibold">Affected:</span> {affectedPeopleCount}{' '}
                            people
                            {vulnerabilityTags.length > 0
                              ? ` · Priority tags: ${vulnerabilityTags.join(', ')}`
                              : ''}
                          </p>
                          {assistanceNeeds.length > 0 && (
                            <p>
                              <span className="font-semibold">Needs:</span>{' '}
                              {assistanceNeeds.join(', ')}
                            </p>
                          )}
                        </div>

                        {!isOnline && (
                          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-200">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>{t.reportPage.savedOfflineHeadline}</span>
                          </p>
                        )}
                      </div>

                      {submitError && (
                        <div
                          role="alert"
                          className="rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:border-red-500/35 dark:bg-red-500/12 dark:text-red-200"
                        >
                          {submitError}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="ne-btn-press inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#c2cfe2] px-4 py-2 text-sm font-medium text-slate-700 hover:bg-[#edf2f8] dark:border-[#2d456b] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          <span>{t.reportPage.back}</span>
                        </button>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={`ne-btn-press inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-xs disabled:opacity-60 ${
                            mode === 'HELP_REQUEST'
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>{isOnline ? 'Submitting...' : 'Saving on Device...'}</span>
                            </>
                          ) : (
                            <span>
                              {isOnline
                                ? mode === 'HELP_REQUEST'
                                  ? t.reportPage.submitHelp
                                  : t.reportPage.submitHazard
                                : t.reportPage.saveOfflineOutbox}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </ViewCrossfade>
              </form>
            </div>
          )}
        </ViewCrossfade>
      </div>
    </div>
  );
};
