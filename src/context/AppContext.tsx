import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppTranslations, TRANSLATIONS } from '../data/translations';
import { dataService } from '../services/dataService';
import { SubmitReportPayload } from '../services/dataAdapter';
import {
  AssistanceStatus,
  AuditLogEntry,
  CapacityStatus,
  CommunityReport,
  CorridorPassability,
  DisasterAdvisory,
  EmergencyResource,
  LanguageCode,
  LifelineCorridor,
  OutboxSubmission,
  ThemeMode,
  ToastMessage,
  TrustStatus,
} from '../types';

interface AppContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: AppTranslations;
  selectedDistrictId: string;
  setSelectedDistrictId: (id: string) => void;
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
  deleteOutboxItem: (outboxId: string) => Promise<void>;
  toggleConfirmReport: (reportId: string) => Promise<void>;
  updateReportVerification: (reportId: string, status: TrustStatus, actor: string) => Promise<void>;
  updateReportAssistance: (reportId: string, status: AssistanceStatus, actor: string) => Promise<void>;
  assignReportUnit: (reportId: string, unit: string, actor: string) => Promise<void>;
  addReportNote: (reportId: string, text: string, actor: string) => Promise<void>;
  mergeReports: (primaryId: string, duplicateId: string, actor: string) => Promise<void>;
  updateCorridorStatus: (
    corridorId: string,
    status: CorridorPassability,
    advisoryNote: string,
    verificationStatus: 'VERIFIED' | 'UNVERIFIED',
    actor: string
  ) => Promise<void>;
  updateResourceCapacity: (
    resourceId: string,
    capacityStatus: CapacityStatus,
    availableSupplies: string[],
    verificationStatus: 'VERIFIED' | 'UNVERIFIED',
    actor: string
  ) => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'ne_connect_theme';
const LANG_STORAGE_KEY = 'ne_connect_lang';

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

  const t = useMemo(() => TRANSLATIONS[language], [language]);

  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('all');
  const [browserOnline, setBrowserOnline] = useState<boolean>(
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

  const [isOutboxOpen, setIsOutboxOpen] = useState<boolean>(false);
  const [editingOutboxItem, setEditingOutboxItem] = useState<OutboxSubmission | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isOnline = browserOnline && !simulatedOffline;

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
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);
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

  const applySnapshot = useCallback(
    (snap: Awaited<ReturnType<typeof dataService.loadSnapshot>>) => {
      setAdvisories(snap.advisories);
      setCorridors(snap.corridors);
      setReports(snap.reports);
      setResources(snap.resources);
      setOutbox(snap.outbox);
      setAuditLogs(snap.auditLogs);
      setConfirmedReportIds(snap.confirmedReportIds);
      setLastSyncedAt(snap.lastSyncedAt);
    },
    []
  );

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const snap = await dataService.loadSnapshot();
      if (isOnline) {
        snap.lastSyncedAt = await dataService.recordSyncTimestamp();
      }
      applySnapshot(snap);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load cached emergency records.');
    } finally {
      setIsLoading(false);
    }
  }, [applySnapshot, isOnline]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const resetDemoData = useCallback(async () => {
    const snap = await dataService.resetDemoData();
    applySnapshot(snap);
    addToast({
      type: 'info',
      title: 'Sample demo data restored',
      description: 'All reports, corridors, resources, and outbox entries reset to defaults.',
    });
  }, [addToast, applySnapshot]);

  const submitReport = useCallback(
    async (payload: Omit<SubmitReportPayload, 'isOnline'>) => {
      const result = await dataService.submitReport({ ...payload, isOnline });
      const snap = await dataService.loadSnapshot();
      applySnapshot(snap);
      if (isOnline) {
        addToast({
          type: 'success',
          title: 'Report submitted to Situation Board',
          description: 'Recorded in local prototype feed and marked synced in My Outbox.',
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Saved on your device. Not yet sent.',
          description: 'Stored safely in My Outbox. You can retry when online or share via SMS.',
        });
      }
      return result;
    },
    [addToast, applySnapshot, isOnline]
  );

  const retryOutboxItem = useCallback(
    async (outboxId: string) => {
      setOutbox((prev) =>
        prev.map((item) => (item.id === outboxId ? { ...item, syncStatus: 'SYNCING' } : item))
      );
      await new Promise((r) => setTimeout(r, 320));
      const result = await dataService.retryOutboxItem(outboxId, isOnline);
      const snap = await dataService.loadSnapshot();
      applySnapshot(snap);
      if (result.outboxItem.syncStatus === 'SYNCED') {
        addToast({
          type: 'success',
          title: 'Outbox item synced',
          description: 'Submission added to the local Situation Board.',
        });
      } else {
        addToast({
          type: 'error',
          title: 'Sync failed — Device offline',
          description: 'Item remains saved on your device. Use Share via SMS if urgent.',
        });
      }
    },
    [addToast, applySnapshot, isOnline]
  );

  const syncPendingOutbox = useCallback(async () => {
    if (!isOnline) {
      addToast({
        type: 'warning',
        title: 'Cannot sync while offline',
        description: 'Reconnect or disable simulated offline mode to sync queued reports.',
      });
      return;
    }
    const queue = outbox.filter((item) => item.syncStatus === 'PENDING' || item.syncStatus === 'FAILED');
    if (queue.length === 0) {
      const ts = await dataService.recordSyncTimestamp();
      setLastSyncedAt(ts);
      addToast({ type: 'info', title: 'Everything up to date', description: 'No pending outbox items.' });
      return;
    }
    for (const item of queue) {
      await dataService.retryOutboxItem(item.id, true);
    }
    const snap = await dataService.loadSnapshot();
    applySnapshot(snap);
    addToast({
      type: 'success',
      title: `Synced ${queue.length} queued ${queue.length === 1 ? 'report' : 'reports'}`,
      description: 'Outbox items are now visible on the Situation Board.',
    });
  }, [addToast, applySnapshot, isOnline, outbox]);

  const deleteOutboxItem = useCallback(
    async (outboxId: string) => {
      await dataService.deleteOutboxItem(outboxId);
      const snap = await dataService.loadSnapshot();
      applySnapshot(snap);
      addToast({ type: 'info', title: 'Outbox entry deleted' });
    },
    [addToast, applySnapshot]
  );

  const toggleConfirmReport = useCallback(
    async (reportId: string) => {
      const { confirmed } = await dataService.toggleConfirmReport(reportId);
      const snap = await dataService.loadSnapshot();
      applySnapshot(snap);
      addToast({
        type: 'success',
        title: confirmed ? 'Confirmation added (+1)' : 'Confirmation removed',
      });
    },
    [addToast, applySnapshot]
  );

  const updateReportVerification = useCallback(
    async (reportId: string, status: TrustStatus, actor: string) => {
      await dataService.updateReportVerification(reportId, status, actor);
      const snap = await dataService.loadSnapshot();
      applySnapshot(snap);
      addToast({ type: 'success', title: `Verification set to ${status.replace('_', ' ')}` });
    },
    [addToast, applySnapshot]
  );

  const updateReportAssistance = useCallback(
    async (reportId: string, status: AssistanceStatus, actor: string) => {
      await dataService.updateReportAssistance(reportId, status, actor);
      const snap = await dataService.loadSnapshot();
      applySnapshot(snap);
      addToast({ type: 'success', title: `Assistance status updated to ${status}` });
    },
    [addToast, applySnapshot]
  );

  const assignReportUnit = useCallback(
    async (reportId: string, unit: string, actor: string) => {
      await dataService.assignReportUnit(reportId, unit, actor);
      const snap = await dataService.loadSnapshot();
      applySnapshot(snap);
      addToast({
        type: 'success',
        title: unit ? `Assigned ${unit}` : 'Response unit unassigned',
      });
    },
    [addToast, applySnapshot]
  );

  const addReportNote = useCallback(
    async (reportId: string, text: string, actor: string) => {
      await dataService.addReportNote(reportId, text, actor);
      const snap = await dataService.loadSnapshot();
      applySnapshot(snap);
      addToast({ type: 'success', title: 'Internal coordinator note saved' });
    },
    [addToast, applySnapshot]
  );

  const mergeReports = useCallback(
    async (primaryId: string, duplicateId: string, actor: string) => {
      await dataService.mergeReports(primaryId, duplicateId, actor);
      const snap = await dataService.loadSnapshot();
      applySnapshot(snap);
      addToast({
        type: 'success',
        title: 'Duplicate report merged',
        description: 'Confirmations combined and logged in audit history.',
      });
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
    ) => {
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
    ) => {
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
    },
    [addToast, applySnapshot]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      theme,
      toggleTheme,
      language,
      setLanguage,
      t,
      selectedDistrictId,
      setSelectedDistrictId,
      browserOnline,
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
      updateCorridorStatus,
      updateResourceCapacity,
    }),
    [
      theme,
      toggleTheme,
      language,
      setLanguage,
      t,
      selectedDistrictId,
      browserOnline,
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
      updateCorridorStatus,
      updateResourceCapacity,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
