import {
  INITIAL_ADVISORIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_CORRIDORS,
  INITIAL_REPORTS,
  INITIAL_RESOURCES,
  INITIAL_OUTBOX,
} from '../data/sampleData';
import {
  AssistanceStatus,
  AuditLogEntry,
  CapacityStatus,
  CommunityReport,
  CorridorPassability,
  EmergencyResource,
  LifelineCorridor,
  OutboxSubmission,
  TrustStatus,
} from '../types';
import { DataAdapter, DataSnapshot, SubmitReportPayload } from './dataAdapter';

const STORAGE_KEY = 'ne_connect_local_state_v1';

function createInitialSnapshot(): DataSnapshot {
  return {
    advisories: structuredClone(INITIAL_ADVISORIES),
    corridors: structuredClone(INITIAL_CORRIDORS),
    reports: structuredClone(INITIAL_REPORTS),
    resources: structuredClone(INITIAL_RESOURCES),
    outbox: structuredClone(INITIAL_OUTBOX),
    auditLogs: structuredClone(INITIAL_AUDIT_LOGS),
    confirmedReportIds: [],
    lastSyncedAt: new Date().toISOString(),
  };
}

function readState(): DataSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialSnapshot();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as DataSnapshot;
    return {
      advisories: parsed.advisories ?? structuredClone(INITIAL_ADVISORIES),
      corridors: parsed.corridors ?? structuredClone(INITIAL_CORRIDORS),
      reports: parsed.reports ?? structuredClone(INITIAL_REPORTS),
      resources: parsed.resources ?? structuredClone(INITIAL_RESOURCES),
      outbox: parsed.outbox ?? structuredClone(INITIAL_OUTBOX),
      auditLogs: parsed.auditLogs ?? structuredClone(INITIAL_AUDIT_LOGS),
      confirmedReportIds: parsed.confirmedReportIds ?? [],
      lastSyncedAt: parsed.lastSyncedAt ?? new Date().toISOString(),
    };
  } catch {
    return createInitialSnapshot();
  }
}

function writeState(snapshot: DataSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota issues in restricted preview environments
  }
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export class LocalAdapter implements DataAdapter {
  async loadSnapshot(): Promise<DataSnapshot> {
    return readState();
  }

  async resetDemoData(): Promise<DataSnapshot> {
    const fresh = createInitialSnapshot();
    writeState(fresh);
    return fresh;
  }

  async submitReport(payload: SubmitReportPayload): Promise<{
    outboxItem: OutboxSubmission;
    syncedReport?: CommunityReport;
  }> {
    const state = readState();
    const now = new Date().toISOString();

    if (payload.editingOutboxId) {
      const idx = state.outbox.findIndex((item) => item.id === payload.editingOutboxId);
      if (idx !== -1) {
        const existing = state.outbox[idx];
        const updatedItem: OutboxSubmission = {
          ...existing,
          reportData: payload.reportData,
          syncStatus: payload.isOnline ? 'SYNCED' : 'PENDING',
          lastAttemptAt: now,
          errorMessage: undefined,
        };

        let syncedReport: CommunityReport | undefined;
        if (payload.isOnline) {
          syncedReport = {
            id: existing.syncedReportId ?? generateId('rep'),
            ...payload.reportData,
            createdAt: existing.createdAt,
            verificationStatus: 'UNVERIFIED',
            assistanceStatus: 'SUBMITTED',
            confirmations: 1,
            internalNotes: [],
            isDemo: false,
            isStale: false,
          };
          updatedItem.syncedReportId = syncedReport.id;
          state.reports = [
            syncedReport,
            ...state.reports.filter((r) => r.id !== syncedReport!.id),
          ];
          state.lastSyncedAt = now;
        }

        state.outbox[idx] = updatedItem;
        writeState(state);
        return { outboxItem: updatedItem, syncedReport };
      }
    }

    const outboxId = generateId('out');
    if (payload.isOnline) {
      const reportId = generateId('rep');
      const syncedReport: CommunityReport = {
        id: reportId,
        ...payload.reportData,
        createdAt: now,
        verificationStatus: 'UNVERIFIED',
        assistanceStatus: 'SUBMITTED',
        confirmations: 1,
        internalNotes: [],
        isDemo: false,
        isStale: false,
      };
      const outboxItem: OutboxSubmission = {
        id: outboxId,
        reportData: payload.reportData,
        syncStatus: 'SYNCED',
        createdAt: now,
        lastAttemptAt: now,
        syncedReportId: reportId,
      };
      state.reports = [syncedReport, ...state.reports];
      state.outbox = [outboxItem, ...state.outbox];
      state.lastSyncedAt = now;
      writeState(state);
      return { outboxItem, syncedReport };
    }

    const pendingItem: OutboxSubmission = {
      id: outboxId,
      reportData: payload.reportData,
      syncStatus: 'PENDING',
      createdAt: now,
    };
    state.outbox = [pendingItem, ...state.outbox];
    writeState(state);
    return { outboxItem: pendingItem };
  }

  async retryOutboxItem(
    outboxId: string,
    isOnline: boolean
  ): Promise<{ outboxItem: OutboxSubmission; syncedReport?: CommunityReport }> {
    const state = readState();
    const idx = state.outbox.findIndex((i) => i.id === outboxId);
    if (idx === -1) {
      throw new Error('Outbox entry not found');
    }

    const now = new Date().toISOString();
    const current = state.outbox[idx];

    if (!isOnline) {
      const failedItem: OutboxSubmission = {
        ...current,
        syncStatus: 'FAILED',
        lastAttemptAt: now,
        errorMessage: 'Device is offline. Saved locally until connectivity returns.',
      };
      state.outbox[idx] = failedItem;
      writeState(state);
      return { outboxItem: failedItem };
    }

    const reportId = current.syncedReportId ?? generateId('rep');
    const syncedReport: CommunityReport = {
      id: reportId,
      ...current.reportData,
      createdAt: current.createdAt,
      verificationStatus: 'UNVERIFIED',
      assistanceStatus: 'SUBMITTED',
      confirmations: 1,
      internalNotes: [],
      isDemo: false,
      isStale: false,
    };
    const syncedItem: OutboxSubmission = {
      ...current,
      syncStatus: 'SYNCED',
      lastAttemptAt: now,
      errorMessage: undefined,
      syncedReportId: reportId,
    };
    state.outbox[idx] = syncedItem;
    state.reports = [syncedReport, ...state.reports.filter((r) => r.id !== reportId)];
    state.lastSyncedAt = now;
    writeState(state);
    return { outboxItem: syncedItem, syncedReport };
  }

  async deleteOutboxItem(outboxId: string): Promise<void> {
    const state = readState();
    state.outbox = state.outbox.filter((item) => item.id !== outboxId);
    writeState(state);
  }

  async toggleConfirmReport(reportId: string): Promise<{
    report: CommunityReport;
    confirmed: boolean;
  }> {
    const state = readState();
    const idx = state.reports.findIndex((r) => r.id === reportId);
    if (idx === -1) {
      throw new Error('Report not found');
    }
    const alreadyConfirmed = state.confirmedReportIds.includes(reportId);
    const updatedReport: CommunityReport = {
      ...state.reports[idx],
      confirmations: alreadyConfirmed
        ? Math.max(0, state.reports[idx].confirmations - 1)
        : state.reports[idx].confirmations + 1,
    };
    state.reports[idx] = updatedReport;
    state.confirmedReportIds = alreadyConfirmed
      ? state.confirmedReportIds.filter((id) => id !== reportId)
      : [...state.confirmedReportIds, reportId];
    writeState(state);
    return { report: updatedReport, confirmed: !alreadyConfirmed };
  }

  async updateReportVerification(
    reportId: string,
    status: TrustStatus,
    actor: string
  ): Promise<CommunityReport> {
    const state = readState();
    const idx = state.reports.findIndex((r) => r.id === reportId);
    if (idx === -1) throw new Error('Report not found');
    const prev = state.reports[idx].verificationStatus;
    const updated = { ...state.reports[idx], verificationStatus: status };
    state.reports[idx] = updated;
    state.auditLogs = [
      {
        id: generateId('log'),
        timestamp: new Date().toISOString(),
        actor,
        actionType: 'VERIFY_REPORT',
        targetLabel: `Report #${reportId} (${updated.locality})`,
        summary: `Changed verification status from ${prev} to ${status}.`,
      },
      ...state.auditLogs,
    ];
    writeState(state);
    return updated;
  }

  async updateReportAssistance(
    reportId: string,
    status: AssistanceStatus,
    actor: string
  ): Promise<CommunityReport> {
    const state = readState();
    const idx = state.reports.findIndex((r) => r.id === reportId);
    if (idx === -1) throw new Error('Report not found');
    const prev = state.reports[idx].assistanceStatus;
    const updated = { ...state.reports[idx], assistanceStatus: status };
    state.reports[idx] = updated;
    state.auditLogs = [
      {
        id: generateId('log'),
        timestamp: new Date().toISOString(),
        actor,
        actionType: 'ASSISTANCE_UPDATE',
        targetLabel: `Report #${reportId} (${updated.locality})`,
        summary: `Updated assistance workflow from ${prev} to ${status}.`,
      },
      ...state.auditLogs,
    ];
    writeState(state);
    return updated;
  }

  async assignReportUnit(
    reportId: string,
    unit: string,
    actor: string
  ): Promise<CommunityReport> {
    const state = readState();
    const idx = state.reports.findIndex((r) => r.id === reportId);
    if (idx === -1) throw new Error('Report not found');
    const updated = { ...state.reports[idx], assignedUnit: unit || undefined };
    state.reports[idx] = updated;
    state.auditLogs = [
      {
        id: generateId('log'),
        timestamp: new Date().toISOString(),
        actor,
        actionType: 'ASSIGN_UNIT',
        targetLabel: `Report #${reportId} (${updated.locality})`,
        summary: unit ? `Assigned response team: ${unit}.` : 'Cleared assigned response team.',
      },
      ...state.auditLogs,
    ];
    writeState(state);
    return updated;
  }

  async addReportNote(
    reportId: string,
    text: string,
    actor: string
  ): Promise<CommunityReport> {
    const state = readState();
    const idx = state.reports.findIndex((r) => r.id === reportId);
    if (idx === -1) throw new Error('Report not found');
    const note = {
      id: generateId('note'),
      author: actor,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...state.reports[idx],
      internalNotes: [note, ...state.reports[idx].internalNotes],
    };
    state.reports[idx] = updated;
    state.auditLogs = [
      {
        id: generateId('log'),
        timestamp: note.createdAt,
        actor,
        actionType: 'ADD_NOTE',
        targetLabel: `Report #${reportId}`,
        summary: `Added internal note: "${note.text.slice(0, 70)}${note.text.length > 70 ? '...' : ''}"`,
      },
      ...state.auditLogs,
    ];
    writeState(state);
    return updated;
  }

  async mergeReports(
    primaryId: string,
    duplicateId: string,
    actor: string
  ): Promise<{ primary: CommunityReport; duplicate: CommunityReport }> {
    const state = readState();
    const pIdx = state.reports.findIndex((r) => r.id === primaryId);
    const dIdx = state.reports.findIndex((r) => r.id === duplicateId);
    if (pIdx === -1 || dIdx === -1) throw new Error('Reports to merge not found');

    const primary = state.reports[pIdx];
    const duplicate = state.reports[dIdx];
    const now = new Date().toISOString();

    const updatedPrimary: CommunityReport = {
      ...primary,
      confirmations: primary.confirmations + duplicate.confirmations,
      mergedReportIds: [...(primary.mergedReportIds ?? []), duplicate.id],
      internalNotes: [
        {
          id: generateId('note'),
          author: actor,
          text: `Merged duplicate report #${duplicate.id} (${duplicate.locality}) — combined +${duplicate.confirmations} confirmations.`,
          createdAt: now,
        },
        ...primary.internalNotes,
      ],
    };

    const updatedDuplicate: CommunityReport = {
      ...duplicate,
      mergedIntoId: primary.id,
      verificationStatus: 'REJECTED',
      internalNotes: [
        {
          id: generateId('note'),
          author: actor,
          text: `Marked as duplicate and merged into #${primary.id}.`,
          createdAt: now,
        },
        ...duplicate.internalNotes,
      ],
    };

    state.reports[pIdx] = updatedPrimary;
    state.reports[dIdx] = updatedDuplicate;
    state.auditLogs = [
      {
        id: generateId('log'),
        timestamp: now,
        actor,
        actionType: 'MERGE_REPORT',
        targetLabel: `Report #${primary.id} ⇐ #${duplicate.id}`,
        summary: `Merged duplicate report from ${duplicate.locality} into primary incident.`,
      },
      ...state.auditLogs,
    ];
    writeState(state);
    return { primary: updatedPrimary, duplicate: updatedDuplicate };
  }

  async updateCorridorStatus(
    corridorId: string,
    status: CorridorPassability,
    advisoryNote: string,
    verificationStatus: 'VERIFIED' | 'UNVERIFIED',
    actor: string
  ): Promise<LifelineCorridor> {
    const state = readState();
    const idx = state.corridors.findIndex((c) => c.id === corridorId);
    if (idx === -1) throw new Error('Corridor not found');
    const now = new Date().toISOString();
    const updated: LifelineCorridor = {
      ...state.corridors[idx],
      status,
      advisoryNote,
      verificationStatus,
      lastConfirmedAt: now,
      isStale: false,
    };
    state.corridors[idx] = updated;
    state.auditLogs = [
      {
        id: generateId('log'),
        timestamp: now,
        actor,
        actionType: 'UPDATE_CORRIDOR',
        targetLabel: updated.name,
        summary: `Set passability to ${status.replace('_', ' ')} (${verificationStatus}).`,
      },
      ...state.auditLogs,
    ];
    writeState(state);
    return updated;
  }

  async updateResourceCapacity(
    resourceId: string,
    capacityStatus: CapacityStatus,
    availableSupplies: string[],
    verificationStatus: 'VERIFIED' | 'UNVERIFIED',
    actor: string
  ): Promise<EmergencyResource> {
    const state = readState();
    const idx = state.resources.findIndex((r) => r.id === resourceId);
    if (idx === -1) throw new Error('Resource not found');
    const now = new Date().toISOString();
    const updated: EmergencyResource = {
      ...state.resources[idx],
      capacityStatus,
      availableSupplies,
      verificationStatus,
      lastConfirmedAt: now,
      isStale: false,
    };
    state.resources[idx] = updated;
    state.auditLogs = [
      {
        id: generateId('log'),
        timestamp: now,
        actor,
        actionType: 'UPDATE_RESOURCE',
        targetLabel: updated.name,
        summary: `Set capacity to ${capacityStatus.replace('_', ' ')} (${verificationStatus}).`,
      },
      ...state.auditLogs,
    ];
    writeState(state);
    return updated;
  }

  async recordSyncTimestamp(): Promise<string> {
    const state = readState();
    const now = new Date().toISOString();
    state.lastSyncedAt = now;
    writeState(state);
    return now;
  }
}
