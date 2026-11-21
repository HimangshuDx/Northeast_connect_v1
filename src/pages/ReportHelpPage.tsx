import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Crosshair,
  FileWarning,
  HeartHandshake,
  Inbox,
  Loader2,
  MessageSquareShare,
  WifiOff,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EmergencyStrip } from '../components/EmergencyStrip';
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
import { buildSmsShareUrl } from '../utils/formatters';

const CATEGORIES: IncidentCategory[] = [
  'Flooding',
  'Landslide',
  'Road Blockage',
  'Bridge Damage',
  'Stranded Persons',
  'Medical Emergency',
  'Power / Telecom Outage',
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

  const initialMode: ReportMode =
    searchParams.get('mode') === 'hazard' ? 'HAZARD' : 'HELP_REQUEST';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<ReportMode>(initialMode);
  const [districtId, setDistrictId] = useState<string>(
    selectedDistrictId !== 'all' ? selectedDistrictId : 'kamrup-metro'
  );
  const [corridorOrBlock, setCorridorOrBlock] = useState('');
  const [locality, setLocality] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'captured' | 'error'>('idle');
  const [reportingForOthers, setReportingForOthers] = useState(false);

  const [category, setCategory] = useState<IncidentCategory>(
    initialMode === 'HAZARD' ? 'Landslide' : 'Stranded Persons'
  );
  const [severity, setSeverity] = useState<IncidentSeverity>(
    initialMode === 'HELP_REQUEST' ? 'HIGH' : 'MODERATE'
  );
  const [description, setDescription] = useState('');
  const [affectedPeopleCount, setAffectedPeopleCount] = useState<string>('4');
  const [vulnerabilityTags, setVulnerabilityTags] = useState<VulnerabilityTag[]>([]);
  const [assistanceNeeds, setAssistanceNeeds] = useState<AssistanceNeed[]>(
    initialMode === 'HELP_REQUEST' ? ['Rescue'] : []
  );

  const [contactPhone, setContactPhone] = useState('');
  const [reporterName, setReporterName] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOutboxItem, setSubmittedOutboxItem] = useState<OutboxSubmission | null>(null);

  // Hydrate when editing from My Outbox
  useEffect(() => {
    const editId = searchParams.get('edit');
    const target =
      editingOutboxItem ?? (editId ? outbox.find((item) => item.id === editId) ?? null : null);
    if (target) {
      const d = target.reportData;
      setMode(d.mode);
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
      setMode('HAZARD');
    } else if (paramMode === 'help') {
      setMode('HELP_REQUEST');
    }
  }, [searchParams]);

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
      if (!corridorOrBlock.trim()) {
        nextErrors.corridorOrBlock = 'Enter a block, ward, or highway corridor name.';
      }
      if (!locality.trim()) {
        nextErrors.locality = 'Enter a specific locality, village, or landmark.';
      }
    }

    if (targetStep === 2) {
      if (description.trim().length < 12) {
        nextErrors.description =
          'Please provide at least a short description (12+ characters) of the situation.';
      }
      const parsedCount = Number(affectedPeopleCount);
      if (Number.isNaN(parsedCount) || parsedCount < 1) {
        nextErrors.affectedPeopleCount = 'Enter at least 1 affected person.';
      }
      if (mode === 'HELP_REQUEST' && assistanceNeeds.length === 0) {
        nextErrors.assistanceNeeds = 'Select at least one type of assistance needed.';
      }
    }

    if (targetStep === 3) {
      const digits = contactPhone.replace(/\D/g, '');
      if (digits.length < 10) {
        nextErrors.contactPhone = 'Enter a valid 10-digit mobile or helpline callback number.';
      }
      if (!reporterName.trim()) {
        nextErrors.reporterName = 'Enter your name or a brief label (e.g., Ward Volunteer).';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => (s === 1 ? 2 : 3));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    const district = NORTHEAST_DISTRICTS.find((d) => d.id === districtId);
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 350));
      const result = await submitReport({
        editingOutboxId: editingOutboxItem?.id ?? searchParams.get('edit') ?? undefined,
        reportData: {
          mode,
          districtId,
          districtName: district ? district.name : districtId,
          corridorOrBlock: corridorOrBlock.trim(),
          locality: locality.trim(),
          coordinates,
          category,
          severity,
          description: description.trim(),
          affectedPeopleCount: Math.max(1, Number(affectedPeopleCount) || 1),
          vulnerabilityTags,
          assistanceNeeds,
          contactPhone: contactPhone.trim(),
          reporterName: reporterName.trim(),
          reportingForOthers,
          createdAt: new Date().toISOString(),
        },
      });
      setEditingOutboxItem(null);
      setSubmittedOutboxItem(result.outboxItem);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedOutboxItem(null);
    setEditingOutboxItem(null);
    setStep(1);
    setCorridorOrBlock('');
    setLocality('');
    setDescription('');
    setCoordinates(null);
    setGpsStatus('idle');
    setVulnerabilityTags([]);
    setErrors({});
    navigate('/report', { replace: true });
  };

  const selectedDistrictName =
    NORTHEAST_DISTRICTS.find((d) => d.id === districtId)?.name ?? 'Select district';

  // Confirmation Screen
  if (submittedOutboxItem) {
    const savedOffline = submittedOutboxItem.syncStatus !== 'SYNCED';
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <EmergencyStrip />

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          {savedOffline ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-700/80 dark:bg-amber-950/60 dark:text-amber-100">
              <div className="flex items-start gap-3">
                <WifiOff className="mt-0.5 h-6 w-6 shrink-0 text-amber-700 dark:text-amber-300" />
                <div>
                  <h2 className="font-display text-lg font-bold">
                    {t.reportPage.savedOfflineHeadline}
                  </h2>
                  <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">
                    {t.reportPage.savedOfflineSub}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-800/70 dark:bg-emerald-950/50 dark:text-emerald-100">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h2 className="font-display text-lg font-bold">
                    {t.reportPage.submittedOnlineHeadline}
                  </h2>
                  <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-200">
                    Marked as Unverified until reviewed by a Coordinator. Reference ID:{' '}
                    <span className="font-mono font-semibold">
                      {submittedOutboxItem.syncedReportId ?? submittedOutboxItem.id}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2 border-t border-slate-200 pt-5 text-sm dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Submitted Summary
            </p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {submittedOutboxItem.reportData.mode === 'HELP_REQUEST'
                ? t.reportPage.modeHelp
                : t.reportPage.modeHazard}{' '}
              — {submittedOutboxItem.reportData.category} ({submittedOutboxItem.reportData.severity})
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              {submittedOutboxItem.reportData.locality}, {submittedOutboxItem.reportData.corridorOrBlock} ·{' '}
              {submittedOutboxItem.reportData.districtName}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              {submittedOutboxItem.reportData.description}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsOutboxOpen(true)}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
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
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <MessageSquareShare className="h-4 w-4" aria-hidden="true" />
              <span>{t.reportPage.shareSms}</span>
            </a>

            <Link
              to="/"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
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

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {t.reportPage.smsNotice}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <EmergencyStrip />
      <OfflineBanner />

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        {/* Mode Selector */}
        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            {editingOutboxItem ? t.reportPage.editingHeading : t.reportPage.heading}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t.reportPage.subtext}
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode('HAZARD')}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                mode === 'HAZARD'
                  ? 'border-blue-600 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/40'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
              }`}
            >
              <FileWarning
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  mode === 'HAZARD' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                }`}
                aria-hidden="true"
              />
              <div>
                <p className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.reportPage.modeHazard}
                </p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  {t.reportPage.modeHazardSub}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('HELP_REQUEST')}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                mode === 'HELP_REQUEST'
                  ? 'border-red-600 bg-red-50/70 dark:border-red-500 dark:bg-red-950/40'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
              }`}
            >
              <HeartHandshake
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  mode === 'HELP_REQUEST' ? 'text-red-600 dark:text-red-400' : 'text-slate-400'
                }`}
                aria-hidden="true"
              />
              <div>
                <p className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.reportPage.modeHelp}
                </p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  {t.reportPage.modeHelpSub}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mt-6 grid grid-cols-3 gap-2 border-y border-slate-200 py-3 dark:border-slate-800">
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
              className={`rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                step === num
                  ? 'bg-blue-600 text-white'
                  : step > num
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-5" noValidate>
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="report-district"
                  className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  {t.reportPage.district} <span className="text-red-500">*</span>
                </label>
                <select
                  id="report-district"
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                  htmlFor="report-corridor"
                  className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  {t.reportPage.blockCorridor} <span className="text-red-500">*</span>
                </label>
                <input
                  id="report-corridor"
                  type="text"
                  value={corridorOrBlock}
                  onChange={(e) => setCorridorOrBlock(e.target.value)}
                  placeholder="e.g., NH-27 Lumding–Haflong or Anil Nagar Ward"
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                  className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  {t.reportPage.locality} <span className="text-red-500">*</span>
                </label>
                <input
                  id="report-locality"
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g., Km 44 near Jatinga Viewpoint or Lane 4 Temple Gate"
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                {errors.locality && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.locality}</p>
                )}
              </div>

              {/* Optional GPS Capture */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {t.reportPage.optionalGps}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {coordinates
                        ? `Attached: ${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`
                        : 'Helps responders locate exact spots on rural roads.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptureGps}
                    disabled={gpsStatus === 'locating'}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    {gpsStatus === 'locating' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Crosshair className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                    <span>{coordinates ? t.reportPage.refreshGps : t.reportPage.useCurrentGps}</span>
                  </button>
                </div>
              </div>

              {/* Reporting for others toggle */}
              <label className="flex min-h-[44px] cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
                <div>
                  <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                    {t.reportPage.reportingForOthers}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
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
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <span>{t.reportPage.nextStep2}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="report-category"
                    className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    {t.reportPage.category}
                  </label>
                  <select
                    id="report-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                    className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                    className="block text-sm font-medium text-slate-900 dark:text-slate-100"
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
                    className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 font-mono text-sm tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  {t.reportPage.severityLevel}
                </span>
                <div className="mt-2 grid gap-2 sm:grid-cols-4">
                  {SEVERITIES.map((sev) => (
                    <button
                      key={sev.value}
                      type="button"
                      onClick={() => setSeverity(sev.value)}
                      className={`rounded-lg border p-2.5 text-left transition-colors ${
                        severity === sev.value
                          ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/50'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                      }`}
                    >
                      <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {sev.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
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
                  className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  {t.reportPage.description} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="report-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe water depth, blockage size, road access for boats/ambulances, or immediate dangers..."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.description}</p>
                )}
              </div>

              {/* Vulnerability Tags */}
              <div>
                <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
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
                        className={`min-h-[38px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? 'border-amber-600 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-200'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
                <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
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
                        className={`min-h-[38px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t.reportPage.back}</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <span>{t.reportPage.nextStep3}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="report-phone"
                    className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    {t.reportPage.contactPhone} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="report-phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98640 XXXXX"
                    className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                    className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    {t.reportPage.reporterName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="report-name"
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="e.g., Anita Sharma or Ward 12 Volunteer"
                    className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  {errors.reporterName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.reporterName}
                    </p>
                  )}
                </div>
              </div>

              {/* Review Summary */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-800/50">
                <p className="font-display text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t.reportPage.reviewTitle}
                </p>
                <div className="mt-2 grid gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <p>
                    <span className="font-semibold">Type:</span>{' '}
                    {mode === 'HELP_REQUEST' ? t.reportPage.modeHelp : t.reportPage.modeHazard} ({category} ·{' '}
                    {severity})
                  </p>
                  <p>
                    <span className="font-semibold">Location:</span> {locality}, {corridorOrBlock} (
                    {selectedDistrictName})
                  </p>
                  <p>
                    <span className="font-semibold">Affected:</span> {affectedPeopleCount} people
                    {vulnerabilityTags.length > 0
                      ? ` · Priority tags: ${vulnerabilityTags.join(', ')}`
                      : ''}
                  </p>
                  {assistanceNeeds.length > 0 && (
                    <p>
                      <span className="font-semibold">Needs:</span> {assistanceNeeds.join(', ')}
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

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t.reportPage.back}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
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
        </form>
      </div>
    </div>
  );
};
