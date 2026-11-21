import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { INITIAL_VOLUNTEER_PROFILE } from '../data/sampleData';
import { AppTranslations, TRANSLATIONS } from '../data/translations';
import {
  AcceptNgoTaskPayload,
  DataSnapshot,
  SubmitReportPayload,
} from '../services/dataAdapter';
import { dataService } from '../services/dataService';
import {
  AssistanceStatus,
  AuditLogEntry,
  CapacityStatus,
  CommunityReport,
  CorridorPassability,
  DisasterAdvisory,
  EmergencyResource,
  ExperienceMode,
  LanguageCode,
  LifelineCorridor,
  NgoAssignment,
  NgoTaskStatus,
  OutboxSubmission,
  ThemeMode,
  ToastMessage,
  TrustStatus,
  VolunteerProfile,
} from '../types';

interface AppContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  experienceMode: ExperienceMode;
  setExperienceMode: (mode: ExperienceMode) => void;
  t: AppTranslations;
  selectedDistrictId: string;
  setSelectedDistrictId: (id: string) => void;
  realOnline: boolean;
  browserOnline: boolean;
  simulatedOffline: boolean;
  setSimulatedOffline: (offline: boolean) => void;
  isOnline: boolean;
  isLoading: boolean;
  loadError: string | null;
  lastSyncedAt: string;
  advisories: DisasterAdvisory[];
  corridors: LifelineCorridor[];
  reports: CommunityReport[];
  resources: EmergencyResource[];
  outbox: OutboxSubmission[];
  auditLogs: AuditLogEntry[];
  confirmedReportIds: string[];
  ngoAssignments: NgoAssignment[];
  volunteerProfile: VolunteerProfile;
  isOutboxOpen: boolean;
  setIsOutboxOpen: (open: boolean) => void;
  editingOutboxItem: OutboxSubmission | null;
  setEditingOutboxItem: (item: OutboxSubmission | null) => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  refreshData: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  syncPendingOutbox: () => Promise<void>;
  submitReport: (payload: Omit<SubmitReportPayload, 'isOnline'>) => Promise<{
    outboxItem: OutboxSubmission;
    syncedReport?: CommunityReport;
  }>;
  retryOutboxItem: (outboxId: string) => Promise<void>;
  deleteOutboxItem: (outboxId: string) => Promise<boolean>;
  toggleConfirmReport: (reportId: string) => Promise<void>;
  updateReportVerification: (reportId: string, status: TrustStatus, actor: string) => Promise<boolean>;
  updateReportAssistance: (reportId: string, status: AssistanceStatus, actor: string) => Promise<boolean>;
  assignReportUnit: (reportId: string, unit: string, actor: string) => Promise<boolean>;
  addReportNote: (reportId: string, text: string, actor: string) => Promise<boolean>;
  mergeReports: (primaryId: string, duplicateId: string, actor: string) => Promise<boolean>;
  deleteReport: (reportId: string, actor: string) => Promise<boolean>;
  updateCorridorStatus: (
    corridorId: string,
    status: CorridorPassability,
    advisoryNote: string,
    verificationStatus: 'VERIFIED' | 'UNVERIFIED',
    actor: string
  ) => Promise<boolean>;
  updateResourceCapacity: (
    resourceId: string,
    capacityStatus: CapacityStatus,
    availableSupplies: string[],
    verificationStatus: 'VERIFIED' | 'UNVERIFIED',
    actor: string
  ) => Promise<boolean>;
  acceptNgoTask: (payload: AcceptNgoTaskPayload) => Promise<boolean>;
  updateNgoTaskStatus: (
    assignmentId: string,
    taskStatus: NgoTaskStatus,
    note?: string
  ) => Promise<boolean>;
  releaseNgoTask: (assignmentId: string) => Promise<boolean>;
  saveVolunteerProfile: (profile: Omit<VolunteerProfile, 'updatedAt'>) => Promise<boolean>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'ne_connect_theme';
const LANG_STORAGE_KEY = 'ne_connect_lang';
const EXPERIENCE_STORAGE_KEY = 'ne_connect_experience_mode';
const SNAPSHOT_CACHE_KEY = 'ne_connect_snapshot_cache_v1';

function saveCachedSnapshot(snapshot: DataSnapshot): void {
  try {
    localStorage.setItem(SNAPSHOT_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota issues
  }
}

function readCachedSnapshot(): DataSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DataSnapshot;
  } catch {
    return null;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === 'en' || saved === 'as' || saved === 'hi' || saved === 'bn') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const [experienceMode, setExperienceModeState] = useState<ExperienceMode>(() => {
    try {
      const saved = localStorage.getItem(EXPERIENCE_STORAGE_KEY);
      if (saved === 'citizen' || saved === 'ngo') return saved;
    } catch {
      // ignore
    }
    return 'citizen';
  });

  const setExperienceMode = useCallback((mode: ExperienceMode) => {
    setExperienceModeState(mode);
    try {
      localStorage.setItem(EXPERIENCE_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, []);

  const t = useMemo(() => TRANSLATIONS[language], [language]);

  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('all');
  const [realOnline, setRealOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(new Date().toISOString());

  const [advisories, setAdvisories] = useState<DisasterAdvisory[]>([]);
  const [corridors, setCorridors] = useState<LifelineCorridor[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [outbox, setOutbox] = useState<OutboxSubmission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [confirmedReportIds, setConfirmedReportIds] = useState<string[]>([]);
  const [ngoAssignments, setNgoAssignments] = useState<NgoAssignment[]>([]);
  const [volunteerProfile, setVolunteerProfile] = useState<VolunteerProfile>({
    ...INITIAL_VOLUNTEER_PROFILE,
  });

  const [isOutboxOpen, setIsOutboxOpen] = useState<boolean>(false);
  const [editingOutboxItem, setEditingOutboxItem] = useState<OutboxSubmission | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isOnline = realOnline && !simulatedOffline;
  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;
  const outboxRef = useRef(outbox);
  outboxRef.current = outbox;
  const confirmedReportIdsRef = useRef(confirmedReportIds);
  confirmedReportIdsRef.current = confirmedReportIds;
  const confirmingIdsRef = useRef<Set<string>>(new Set());
  const isSyncingRef = useRef(false);
  const prevEffectiveOnlineRef = useRef<boolean>(isOnline);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    const handleOnline = () => setRealOnline(true);
    const handleOffline = () => setRealOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      setTimeout(() => {
        dismissToast(id);
      }, 4500);
    },
    [dismissToast]
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const applySnapshot = useCallback((snap: DataSnapshot) => {
    setAdvisories(snap.advisories);
    setCorridors(snap.corridors);
    setReports(snap.reports);
    setResources(snap.resources);
    setOutbox(snap.outbox);
    setAuditLogs(snap.auditLogs);
    setConfirmedReportIds(snap.confirmedReportIds);
    setNgoAssignments(Array.isArray(snap.ngoAssignments) ? snap.ngoAssignments : []);
    if (snap.volunteerProfile) {
      setVolunteerProfile(snap.volunteerProfile);
    }
    setLastSyncedAt(snap.lastSyncedAt);
    saveCachedSnapshot(snap);
  }, []);

  const refreshData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsLoading(true);
      }
      setLoadError(null);
      try {
        const snap = await dataService.loadSnapshot();
        if (isOnlineRef.current) {
          snap.lastSyncedAt = await dataService.recordSyncTimestamp();
        }
        applySnapshot(snap);
      } catch (err) {
        const cached = readCachedSnapshot();
        if (cached) {
          applySnapshot(cached);
        } else if (!options?.silent) {
          setLoadError(
            err instanceof Error ? err.message : 'Failed to load cached emergency records.'
          );
        }
      } finally {
        if (!options?.silent) {
          setIsLoading(false);
        }
      }
    },
    [applySnapshot]
  );

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!isOnline || !dataService.subscribeToChanges) return;
    return dataService.subscribeToChanges(() => {
      if (isOnlineRef.current) {
        void refreshData({ silent: true });
      }
    });
  }, [isOnline, refreshData]);

  const resetDemoData = useCallback(async () => {
    try {
      const snap = await dataService.resetDemoData();
      applySnapshot(snap);
      addToast({
        type: 'info',
        title: 'Sample demo data restored',
        description: 'All reports, corridors, resources, and outbox entries reset to defaults.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not reset demo data',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  }, [addToast, applySnapshot]);

  const submitReport = useCallback(
    async (payload: Omit<SubmitReportPayload, 'isOnline'>) => {
      try {
        const result = await dataService.submitReport({ ...payload, isOnline });
        const snap = await dataService.loadSnapshot();
        applySnapshot(snap);
        if (result.outboxItem.syncStatus === 'SYNCED') {
          addToast({
            type: 'success',
            title: 'Report submitted to Situation Board',
            description: 'Recorded and marked synced in My Outbox.',
          });
        } else {
          addToast({
            type: 'warning',
            title: 'Saved on your device. Not yet sent.',
            description: 'Stored safely in My Outbox. Will retry when online or share via SMS.',
          });
        }
        return result;
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Could not submit report',
          description: err instanceof Error ? err.message : 'Please check your entries and try again.',
        });
        throw err;
      }
    },
    [addToast, applySnapshot, isOnline]
  );

  const retryOutboxItem = useCallback(
    async (outboxId: string) => {
      setOutbox((prev) =>
        prev.map((item) => (item.id === outboxId ? { ...item, syncStatus: 'SYNCING' } : item))
      );
      try {
        await new Promise((r) => setTimeout(r, 320));
        const result = await dataService.retryOutboxItem(outboxId, isOnline);
        const snap = await dataService.loadSnapshot();
        applySnapshot(snap);
        if (result.outboxItem.syncStatus === 'SYNCED') {
          addToast({
            type: 'success',
            title: 'Outbox item synced',
            description: 'Submission added to the Situation Board.',
          });
        } else {
          addToast({
            type: 'error',
            title: 'Sync failed — saved on your device',
            description: 'Item remains queued in My Outbox. Use Share via SMS if urgent.',
          });
        }
      } catch (err) {
        try {
          const snap = await dataService.loadSnapshot();
          applySnapshot(snap);
        } catch {
          // ignore snapshot reload error
        }
        addToast({
          type: 'error',
          title: 'Could not retry outbox entry',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    },
    [addToast, applySnapshot, isOnline]
  );

  const runQueueSync = useCallback(
    async (options?: { respectBackoff?: boolean; silentIfEmpty?: boolean }) => {
      if (isSyncingRef.current) return;
      if (!isOnlineRef.current) {
        if (!options?.silentIfEmpty) {
          addToast({
            type: 'warning',
            title: 'Cannot sync while offline',
            description: 'Reconnect or turn off simulated offline mode to sync queued reports.',
          });
        }
        return;
      }

      const nowMs = Date.now();
      const allQueued = outboxRef.current.filter(
        (item) => item.syncStatus === 'PENDING' || item.syncStatus === 'FAILED'
      );

      if (allQueued.length === 0) {
        if (!options?.silentIfEmpty) {
          const ts = await dataService.recordSyncTimestamp();
          setLastSyncedAt(ts);
          addToast({
            type: 'info',
            title: 'Everything up to date',
            description: 'No pending outbox items.',
          });
        }
        return;
      }

      const dueItems = options?.respectBackoff
        ? allQueued.filter((item) => {
            if (!item.nextRetryAt) return true;
            const nextMs = new Date(item.nextRetryAt).getTime();
            return Number.isNaN(nextMs) || nextMs <= nowMs;
          })
        : allQueued;

      if (dueItems.length === 0) return;

      isSyncingRef.current = true;
      let syncedCount = 0;
      try {
        for (const item of dueItems) {
          try {
            const res = await dataService.retryOutboxItem(item.id, true);
            if (res.outboxItem.syncStatus === 'SYNCED') {
              syncedCount += 1;
            }
          } catch {
            // Keep remaining queue intact on transient failure
          }
        }
        const snap = await dataService.loadSnapshot();
        applySnapshot(snap);
        if (syncedCount > 0) {
          addToast({
            type: 'success',
            title: `Synced ${syncedCount} queued ${syncedCount === 1 ? 'report' : 'reports'}`,
            description: 'Outbox items are now visible on the Situation Board.',
          });
        }
      } finally {
        isSyncingRef.current = false;
      }
    },
    [addToast, applySnapshot]
  );

  const syncPendingOutbox = useCallback(async () => {
    await runQueueSync({ respectBackoff: false, silentIfEmpty: false });
  }, [runQueueSync]);

  // Auto-sync when connectivity returns (real online event or turning off simulated offline)
  useEffect(() => {
    const wasOnline = prevEffectiveOnlineRef.current;
    prevEffectiveOnlineRef.current = isOnline;
    if (!wasOnline && isOnline) {
      const hasQueued = outboxRef.current.some(
        (item) => item.syncStatus === 'PENDING' || item.syncStatus === 'FAILED'
      );
      if (hasQueued) {
        void runQueueSync({ respectBackoff: false, silentIfEmpty: true });
      } else {
        void refreshData();
      }
    }
  }, [isOnline, refreshData, runQueueSync]);

  // 30-second retry timer ONLY while queued items exist; stops immediately when queue is empty
  const queuedCount = useMemo(
    () => outbox.filter((item) => item.syncStatus === 'PENDING' || item.syncStatus === 'FAILED').length,
    [outbox]
  );

  useEffect(() => {
    if (queuedCount === 0 || !isOnline) return;
    const intervalId = window.setInterval(() => {
      if (isOnlineRef.current) {
        void runQueueSync({ respectBackoff: true, silentIfEmpty: true });
      }
    }, 30_000);
    return () => window.clearInterval(intervalId);
  }, [queuedCount, isOnline, runQueueSync]);

  const deleteOutboxItem = useCallback(
    async (outboxId: string): Promise<boolean> => {
      try {
        await dataService.deleteOutboxItem(outboxId);
        const snap = await dataService.loadSnapshot();
        applySnapshot(snap);
        addToast({ type: 'info', title: 'Outbox entry deleted' });
        return true;
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Could not delete outbox entry',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
        return false;
      }
    },
    [addToast, applySnapshot]
  );

  const toggleConfirmReport = useCallback(
    async (reportId: string) => {
      if (confirmingIdsRef.current.has(reportId)) return;
      confirmingIdsRef.current.add(reportId);

      const wasConfirmed = confirmedReportIdsRef.current.includes(reportId);
      const nextConfirmedIds = wasConfirmed
        ? confirmedReportIdsRef.current.filter((id) => id !== reportId)
        : [...confirmedReportIdsRef.current, reportId];
      confirmedReportIdsRef.current = nextConfirmedIds;

      setConfirmedReportIds(nextConfirmedIds);
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                confirmations: wasConfirmed
                  ? Math.max(0, r.confirmations - 1)
                  : r.confirmations + 1,
              }
            : r
        )
      );

      try {
        const { report, confirmed } = await dataService.toggleConfirmReport(reportId);
        setConfirmedReportIds((prev) => {
          const exists = prev.includes(reportId);
          const next =
            confirmed && !exists
              ? [...prev, reportId]
              : !confirmed && exists
              ? prev.filter((id) => id !== reportId)
              : prev;
          confirmedReportIdsRef.current = next;
          return next;
        });
        setReports((prev) => prev.map((r) => (r.id === report.id ? report : r)));
        addToast({
          type: 'success',
          title: confirmed ? 'Confirmation added (+1)' : 'Confirmation removed',
        });
      } catch (err) {
        // Revert optimistic update on failure
        setConfirmedReportIds((prev) => {
          const next = wasConfirmed
            ? prev.includes(reportId)
              ? prev
              : [...prev, reportId]
            : prev.filter((id) => id !== reportId);
          confirmedReportIdsRef.current = next;
          return next;
        });
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  confirmations: wasConfirmed
                    ? r.confirmations + 1
                    : Math.max(0, r.confirmations - 1),
                }
              : r
          )
        );
        addToast({
          type: 'error',
          title: 'Could not update confirmation',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      } finally {
        confirmingIdsRef.current.delete(reportId);
      }
    },
    [addToast]
  );

  const updateReportVerification = useCallback(
    async (reportId: string, status: TrustStatus, actor: string): Promise<boolean> => {
      try {
        await dataService.updateReportVerification(reportId, status, actor);
        const snap = await dataService.loadSnapshot();
        applySnapshot(snap);
        addToast({ type: 'success', title: `Verification set to ${status.replace('_', ' ')}` });
        return true;
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Could not update verification',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
        return false;
      }
    },
    [addToast, applySnapshot]
  );

  const updateReportAssistance = useCallback(
    async (reportId: string, status: AssistanceStatus, actor: string): Promise<boolean> => {
      try {
        await dataService.updateReportAssistance(reportId, status, actor);
        const snap = await dataService.loadSnapshot();
        applySnapshot(snap);
        addToast({ type: 'success', title: `Assistance status updated to ${status}` });
        return true;
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Could not update assistance status',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
        return false;
      }
    },
    [addToast, applySnapshot]
  );

  const assignReportUnit = useCallback(
    async (reportId: string, unit: string, actor: string): Promise<boolean> => {
      try {
        await dataService.assignReportUnit(reportId, unit, actor);
        const snap = await dataService.loadSnapshot();
        applySnapshot(snap);
        addToast({
          type: 'success',
          title: unit ? `Assigned ${unit}` : 'Response unit unassigned',
        });
        return true;
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Could not assign response unit',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
        return false;
      }
    },
    [addToast, applySnapshot]
  );

  const addReportNote = useCallback(
    async (reportId: string, text: string, actor: string): Promise<boolean> => {
      try {
        await dataService.addReportNote(reportId, text, actor);
        const snap = await dataService.loadSnapshot();
        applySnapshot(snap);
        addToast({ type: 'success', title: 'Internal coordinator note saved' });
        return true;
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Could not save coordinator note',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
        return false;
      }
    },
    [addToast, applySnapshot]
  );

  const mergeReports = useCallback(
    async (primaryId: string, duplicateId: string, actor: string): Promise<boolean> => {
      try {
        await dataService.mergeReports(primaryId, duplicateId, actor);
        const snap = await dataService.loadSnapshot();
        applySnapshot(snap);
        addToast({
          type: 'success',
          title: 'Duplicate report merged',
          description: 'Confirmations combined and logged in audit history.',
        });
        return true;
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Could not merge reports',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
        return false;
      }
    },
    [addToast, applySnapshot]
  );

  const deleteReport = useCallback(
    async (reportId: string, actor: string): Promise<boolean> => {
      try {
        await dataService.deleteReport(reportId, actor);
        const snap = await dataService.loadSnapshot();
        applySnapshot(snap);
        addToast({
          type: 'info',
          title: 'Report removed from Situation Board',
          description: 'Action recorded in coordinator audit history.',
        });
        return true;
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Could not delete report',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
        return false;
      }
    },
    [addToast, applySnapshot]
  );

  const updateCorridorStatus = useCallback(
    async (
      corridorId: string,
      status: CorridorPassability,
      advisoryNote: string,
      verificationStatus: 'VERIFIED' | 'UNVERIFIED',
      actor: string
    ): Promise<boolean> => {
      try {
        await dataService.updateCorridorStatus(
          corridorId,
          status,
          advisoryNote,
          verificationStatus,
          actor
        );
        const snap = await dataService.loadSnapshot();
        applySnapshot(snap);
        addToast({ type: 'success', title: 'Corridor status updated' });
        return true;
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Could not update corridor status',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
        return false;
      }
    },
    [addToast, applySnapshot]
  );

  const updateResourceCapacity = useCallback(
    async (
      resourceId: string,
      capacityStatus: CapacityStatus,
      availableSupplies: string[],
      verificationStatus: 'VERIFIED' | 'UNVERIFIED',
      actor: string
    ): Promise<boolean> => {
      try {
        await dataService.updateResourceCapacity(
          resourceId,
          capacityStatus,
          availableSupplies,
          verificationStatus,
          actor
        );
        const snap = await dataService.loadSnapshot();
        applySnapshot(snap);
        addToast({ type: 'success', title: 'Resource capacity updated' });
        return true;
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Could not update resource capacity',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
        return false;
      }
    },
    [addToast, applySnapshot]
  );

  const acceptNgoTask = useCallback(
    async (payload: AcceptNgoTaskPayload): Promise<boolean> => {
      try {
        await dataService.acceptNgoTask(payload);
        const snap = await dataService.loadSnapshot();
        applySnapshot(snap);
        addToast({
          type: 'success',
          title: 'NGO task pledge recorded',
          description:
            'Listed in My Assignments. Note: NGO pledges coordinate volunteer relief and do not replace 112/SDRF official dispatch.',
        });
        return true;
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Could not pledge task response',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
        return false;
      }
    },
    [addToast, applySnapshot]
  );

  const updateNgoTaskStatus = useCallback(
    async (
      assignmentId: string,
      taskStatus: NgoTaskStatus,
      note?: string
    ): Promise<boolean> => {
      try {
        await dataService.updateNgoTaskStatus(assignmentId, taskStatus, note);
        const snap = await dataService.loadSnapshot();
        applySnapshot(snap);
        addToast({
          type: 'success',
          title: `Operation progress updated to ${taskStatus.replace('_', ' ')}`,
        });
        return true;
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Could not update operation progress',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
        return false;
      }
    },
    [addToast, applySnapshot]
  );

  const releaseNgoTask = useCallback(
    async (assignmentId: string): Promise<boolean> => {
      try {
        await dataService.releaseNgoTask(assignmentId);
        const snap = await dataService.loadSnapshot();
        applySnapshot(snap);
        addToast({
          type: 'info',
          title: 'Assignment released back to open feed',
        });
        return true;
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Could not release assignment',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
        return false;
      }
    },
    [addToast, applySnapshot]
  );

  const saveVolunteerProfile = useCallback(
    async (profile: Omit<VolunteerProfile, 'updatedAt'>): Promise<boolean> => {
      try {
        const saved = await dataService.saveVolunteerProfile(profile);
        setVolunteerProfile(saved);
        const snap = await dataService.loadSnapshot();
        applySnapshot(snap);
        addToast({
          type: 'success',
          title: 'Volunteer availability & field inventory saved',
        });
        return true;
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Could not save volunteer profile',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
        return false;
      }
    },
    [addToast, applySnapshot]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      theme,
      toggleTheme,
      language,
      setLanguage,
      experienceMode,
      setExperienceMode,
      t,
      selectedDistrictId,
      setSelectedDistrictId,
      realOnline,
      browserOnline: realOnline,
      simulatedOffline,
      setSimulatedOffline,
      isOnline,
      isLoading,
      loadError,
      lastSyncedAt,
      advisories,
      corridors,
      reports,
      resources,
      outbox,
      auditLogs,
      confirmedReportIds,
      ngoAssignments,
      volunteerProfile,
      isOutboxOpen,
      setIsOutboxOpen,
      editingOutboxItem,
      setEditingOutboxItem,
      toasts,
      addToast,
      dismissToast,
      refreshData,
      resetDemoData,
      syncPendingOutbox,
      submitReport,
      retryOutboxItem,
      deleteOutboxItem,
      toggleConfirmReport,
      updateReportVerification,
      updateReportAssistance,
      assignReportUnit,
      addReportNote,
      mergeReports,
      deleteReport,
      updateCorridorStatus,
      updateResourceCapacity,
      acceptNgoTask,
      updateNgoTaskStatus,
      releaseNgoTask,
      saveVolunteerProfile,
    }),
    [
      theme,
      toggleTheme,
      language,
      setLanguage,
      experienceMode,
      setExperienceMode,
      t,
      selectedDistrictId,
      realOnline,
      simulatedOffline,
      isOnline,
      isLoading,
      loadError,
      lastSyncedAt,
      advisories,
      corridors,
      reports,
      resources,
      outbox,
      auditLogs,
      confirmedReportIds,
      ngoAssignments,
      volunteerProfile,
      isOutboxOpen,
      editingOutboxItem,
      toasts,
      addToast,
      dismissToast,
      refreshData,
      resetDemoData,
      syncPendingOutbox,
      submitReport,
      retryOutboxItem,
      deleteOutboxItem,
      toggleConfirmReport,
      updateReportVerification,
      updateReportAssistance,
      assignReportUnit,
      addReportNote,
      mergeReports,
      deleteReport,
      updateCorridorStatus,
      updateResourceCapacity,
      acceptNgoTask,
      updateNgoTaskStatus,
      releaseNgoTask,
      saveVolunteerProfile,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
