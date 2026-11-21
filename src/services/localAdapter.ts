import {
  INITIAL_ADVISORIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_CORRIDORS,
  INITIAL_NGO_ASSIGNMENTS,
  INITIAL_REPORTS,
  INITIAL_RESOURCES,
  INITIAL_OUTBOX,
  INITIAL_VOLUNTEER_PROFILE,
} from '../data/sampleData';
import {
  AssistanceStatus,
  AuditLogEntry,
  CapacityStatus,
  CommunityReport,
  CorridorPassability,
  EmergencyResource,
  LifelineCorridor,
  NgoAssignment,
  NgoTaskStatus,
  OutboxSubmission,
  TrustStatus,
  VolunteerProfile,
} from '../types';
import { AcceptNgoTaskPayload, DataAdapter, DataSnapshot, SubmitReportPayload } from './dataAdapter';
import { createClientUuid } from '../utils/formatters';
import {
  validateActorName,
  validateAssistanceStatus,
  validateCorridorUpdate,
  validateEntityId,
  validateNgoAssignmentInput,
  validateNgoTaskStatus,
  validateNoteText,
  validateReportPayload,
  validateResourceUpdate,
  validateTrustStatus,
  validateVolunteerProfileInput,
  ValidationError,
} from '../utils/validation';

const STORAGE_KEY = 'ne_connect_local_state_v1';
let memoryState: DataSnapshot | null = null;

function normalizeOutbox(items: OutboxSubmission[]): OutboxSubmission[] {
  return items.map((item) => ({
    ...item,
    clientUuid: item.clientUuid || `legacy-${item.id}`,
    retryCount: typeof item.retryCount === 'number' ? item.retryCount : 0,
  }));
}

function createInitialSnapshot(): DataSnapshot {
  return {
    advisories: structuredClone(INITIAL_ADVISORIES),
    corridors: structuredClone(INITIAL_CORRIDORS),
    reports: structuredClone(INITIAL_REPORTS),
    resources: structuredClone(INITIAL_RESOURCES),
    outbox: normalizeOutbox(structuredClone(INITIAL_OUTBOX)),
    auditLogs: structuredClone(INITIAL_AUDIT_LOGS),
    confirmedReportIds: [],
    ngoAssignments: structuredClone(INITIAL_NGO_ASSIGNMENTS),
    volunteerProfile: structuredClone(INITIAL_VOLUNTEER_PROFILE),
    lastSyncedAt: new Date().toISOString(),
  };
}

function readState(): DataSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      if (memoryState) return structuredClone(memoryState);
      const initial = createInitialSnapshot();
      memoryState = structuredClone(initial);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      } catch {
        // Ignore storage errors; memoryState holds the state
      }
      return initial;
    }
    const parsed = JSON.parse(raw) as DataSnapshot;
    const hydrated: DataSnapshot = {
      advisories: parsed.advisories ?? structuredClone(INITIAL_ADVISORIES),
      corridors: parsed.corridors ?? structuredClone(INITIAL_CORRIDORS),
      reports: parsed.reports ?? structuredClone(INITIAL_REPORTS),
      resources: parsed.resources ?? structuredClone(INITIAL_RESOURCES),
      outbox: normalizeOutbox(parsed.outbox ?? structuredClone(INITIAL_OUTBOX)),
      auditLogs: parsed.auditLogs ?? structuredClone(INITIAL_AUDIT_LOGS),
      confirmedReportIds: Array.isArray(parsed.confirmedReportIds)
        ? parsed.confirmedReportIds
        : [],
      ngoAssignments: Array.isArray(parsed.ngoAssignments)
        ? parsed.ngoAssignments
        : structuredClone(INITIAL_NGO_ASSIGNMENTS),
      volunteerProfile: parsed.volunteerProfile ?? structuredClone(INITIAL_VOLUNTEER_PROFILE),
      lastSyncedAt: parsed.lastSyncedAt ?? new Date().toISOString(),
    };
    memoryState = structuredClone(hydrated);
    return hydrated;
  } catch {
    if (memoryState) return structuredClone(memoryState);
    const initial = createInitialSnapshot();
    memoryState = structuredClone(initial);
    return initial;
  }
}

function writeState(snapshot: DataSnapshot): void {
  memoryState = structuredClone(snapshot);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota or iframe security issues; memoryState retains state
  }
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function computeNextRetryIso(retryCount: number): string {
  const delayMs = Math.min(30_000 * Math.pow(2, Math.max(0, retryCount - 1)), 5 * 60_000);
  return new Date(Date.now() + delayMs).toISOString();
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
    const validatedReportData = validateReportPayload(payload.reportData);
    const state = readState();
    const now = new Date().toISOString();

    if (payload.editingOutboxId) {
      const idx = state.outbox.findIndex((item) => item.id === payload.editingOutboxId);
      if (idx !== -1) {
        const existing = state.outbox[idx];
        const clientUuid = existing.clientUuid || createClientUuid();
        const updatedItem: OutboxSubmission = {
          ...existing,
          clientUuid,
          reportData: validatedReportData,
          syncStatus: payload.isOnline ? 'SYNCED' : 'PENDING',
          retryCount: payload.isOnline ? 0 : existing.retryCount,
          nextRetryAt: undefined,
          lastAttemptAt: now,
          errorMessage: undefined,
        };

        let syncedReport: CommunityReport | undefined;
        if (payload.isOnline) {
          const existingReport = state.reports.find(
            (r) => r.id === existing.syncedReportId || r.clientUuid === clientUuid
          );
          syncedReport = {
            id: existingReport?.id ?? existing.syncedReportId ?? generateId('rep'),
            clientUuid,
            ...validatedReportData,
            createdAt: existing.createdAt,
            verificationStatus: existingReport?.verificationStatus ?? 'UNVERIFIED',
            assistanceStatus: existingReport?.assistanceStatus ?? 'SUBMITTED',
            confirmations: existingReport?.confirmations ?? 1,
            internalNotes: existingReport?.internalNotes ?? [],
            isDemo: false,
            isStale: false,
          };
          updatedItem.syncedReportId = syncedReport.id;
          state.reports = [
            syncedReport,
            ...state.reports.filter((r) => r.id !== syncedReport!.id && r.clientUuid !== clientUuid),
          ];
          state.lastSyncedAt = now;
        }

        state.outbox[idx] = updatedItem;
        writeState(state);
        return { outboxItem: updatedItem, syncedReport };
      }
    }

    const clientUuid = payload.clientUuid || createClientUuid();
    const existingOutboxIdx = state.outbox.findIndex((item) => item.clientUuid === clientUuid);
    const outboxId = existingOutboxIdx !== -1 ? state.outbox[existingOutboxIdx].id : generateId('out');

    if (payload.isOnline) {
      const existingReport = state.reports.find((r) => r.clientUuid === clientUuid);
      const reportId = existingReport?.id ?? generateId('rep');
      const syncedReport: CommunityReport = {
        id: reportId,
        clientUuid,
        ...validatedReportData,
        createdAt: existingReport?.createdAt ?? now,
        verificationStatus: existingReport?.verificationStatus ?? 'UNVERIFIED',
        assistanceStatus: existingReport?.assistanceStatus ?? 'SUBMITTED',
        confirmations: existingReport?.confirmations ?? 1,
        internalNotes: existingReport?.internalNotes ?? [],
        isDemo: false,
        isStale: false,
      };
      const outboxItem: OutboxSubmission = {
        id: outboxId,
        clientUuid,
        reportData: validatedReportData,
        syncStatus: 'SYNCED',
        retryCount: 0,
        createdAt: existingReport?.createdAt ?? now,
        lastAttemptAt: now,
        syncedReportId: reportId,
      };
      state.reports = [
        syncedReport,
        ...state.reports.filter((r) => r.id !== reportId && r.clientUuid !== clientUuid),
      ];
      state.outbox = [
        outboxItem,
        ...state.outbox.filter((o) => o.id !== outboxId && o.clientUuid !== clientUuid),
      ];
      state.lastSyncedAt = now;
      writeState(state);
      return { outboxItem, syncedReport };
    }

    const pendingItem: OutboxSubmission = {
      id: outboxId,
      clientUuid,
      reportData: validatedReportData,
      syncStatus: 'PENDING',
      retryCount: 0,
      createdAt: now,
    };
    state.outbox = [
      pendingItem,
      ...state.outbox.filter((o) => o.id !== outboxId && o.clientUuid !== clientUuid),
    ];
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
    const clientUuid = current.clientUuid || `legacy-${current.id}`;

    if (!isOnline) {
      const nextRetryCount = (current.retryCount ?? 0) + 1;
      const failedItem: OutboxSubmission = {
        ...current,
        clientUuid,
        syncStatus: 'FAILED',
        retryCount: nextRetryCount,
        nextRetryAt: computeNextRetryIso(nextRetryCount),
        lastAttemptAt: now,
        errorMessage: 'Device is offline. Saved locally until connectivity returns.',
      };
      state.outbox[idx] = failedItem;
      writeState(state);
      return { outboxItem: failedItem };
    }

    const existingReport = state.reports.find(
      (r) => r.id === current.syncedReportId || r.clientUuid === clientUuid
    );
    const reportId = existingReport?.id ?? current.syncedReportId ?? generateId('rep');
    const syncedReport: CommunityReport = {
      id: reportId,
      clientUuid,
      ...current.reportData,
      createdAt: existingReport?.createdAt ?? current.createdAt,
      verificationStatus: existingReport?.verificationStatus ?? 'UNVERIFIED',
      assistanceStatus: existingReport?.assistanceStatus ?? 'SUBMITTED',
      confirmations: existingReport?.confirmations ?? 1,
      internalNotes: existingReport?.internalNotes ?? [],
      isDemo: false,
      isStale: false,
    };
    const syncedItem: OutboxSubmission = {
      ...current,
      clientUuid,
      syncStatus: 'SYNCED',
      retryCount: 0,
      nextRetryAt: undefined,
      lastAttemptAt: now,
      errorMessage: undefined,
      syncedReportId: reportId,
    };
    state.outbox[idx] = syncedItem;
    state.reports = [
      syncedReport,
      ...state.reports.filter((r) => r.id !== reportId && r.clientUuid !== clientUuid),
    ];
    state.lastSyncedAt = now;
    writeState(state);
    return { outboxItem: syncedItem, syncedReport };
  }

  async deleteOutboxItem(outboxId: string): Promise<void> {
    const validId = validateEntityId(outboxId, 'outbox entry ID');
    const state = readState();
    state.outbox = state.outbox.filter((item) => item.id !== validId);
    writeState(state);
  }

  async toggleConfirmReport(reportId: string): Promise<{
    report: CommunityReport;
    confirmed: boolean;
  }> {
    const validId = validateEntityId(reportId, 'report ID');
    const state = readState();
    const idx = state.reports.findIndex((r) => r.id === validId);
    if (idx === -1) {
      throw new Error('Report not found');
    }
    const alreadyConfirmed = state.confirmedReportIds.includes(validId);
    const updatedReport: CommunityReport = {
      ...state.reports[idx],
      confirmations: alreadyConfirmed
        ? Math.max(0, state.reports[idx].confirmations - 1)
        : state.reports[idx].confirmations + 1,
    };
    state.reports[idx] = updatedReport;
    state.confirmedReportIds = alreadyConfirmed
      ? state.confirmedReportIds.filter((id) => id !== validId)
      : [...state.confirmedReportIds, validId];
    writeState(state);
    return { report: updatedReport, confirmed: !alreadyConfirmed };
  }

  async updateReportVerification(
    reportId: string,
    status: TrustStatus,
    actor: string
  ): Promise<CommunityReport> {
    const validId = validateEntityId(reportId, 'report ID');
    const validStatus = validateTrustStatus(status);
    const validActor = validateActorName(actor);
    const state = readState();
    const idx = state.reports.findIndex((r) => r.id === validId);
    if (idx === -1) throw new Error('Report not found');
    const prev = state.reports[idx].verificationStatus;
    const updated = { ...state.reports[idx], verificationStatus: validStatus };
    state.reports[idx] = updated;
    state.auditLogs = [
      {
        id: generateId('log'),
        timestamp: new Date().toISOString(),
        actor: validActor,
        actionType: 'VERIFY_REPORT',
        targetLabel: `Report #${validId} (${updated.locality})`,
        summary: `Changed verification status from ${prev} to ${validStatus}.`,
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
    const validId = validateEntityId(reportId, 'report ID');
    const validStatus = validateAssistanceStatus(status);
    const validActor = validateActorName(actor);
    const state = readState();
    const idx = state.reports.findIndex((r) => r.id === validId);
    if (idx === -1) throw new Error('Report not found');
    const prev = state.reports[idx].assistanceStatus;
    const updated = { ...state.reports[idx], assistanceStatus: validStatus };
    state.reports[idx] = updated;
    state.auditLogs = [
      {
        id: generateId('log'),
        timestamp: new Date().toISOString(),
        actor: validActor,
        actionType: 'ASSISTANCE_UPDATE',
        targetLabel: `Report #${validId} (${updated.locality})`,
        summary: `Updated assistance workflow from ${prev} to ${validStatus}.`,
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
    const validId = validateEntityId(reportId, 'report ID');
    const validActor = validateActorName(actor);
    const trimmedUnit = typeof unit === 'string' ? unit.trim().slice(0, 120) : '';
    const state = readState();
    const idx = state.reports.findIndex((r) => r.id === validId);
    if (idx === -1) throw new Error('Report not found');
    const updated = { ...state.reports[idx], assignedUnit: trimmedUnit || undefined };
    state.reports[idx] = updated;
    state.auditLogs = [
      {
        id: generateId('log'),
        timestamp: new Date().toISOString(),
        actor: validActor,
        actionType: 'ASSIGN_UNIT',
        targetLabel: `Report #${validId} (${updated.locality})`,
        summary: trimmedUnit
          ? `Assigned response team: ${trimmedUnit}.`
          : 'Cleared assigned response team.',
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
    const validId = validateEntityId(reportId, 'report ID');
    const validNote = validateNoteText(text);
    const validActor = validateActorName(actor);
    const state = readState();
    const idx = state.reports.findIndex((r) => r.id === validId);
    if (idx === -1) throw new Error('Report not found');
    const note = {
      id: generateId('note'),
      author: validActor,
      text: validNote,
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
        actor: validActor,
        actionType: 'ADD_NOTE',
        targetLabel: `Report #${validId}`,
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
    const validPrimaryId = validateEntityId(primaryId, 'primary report ID');
    const validDuplicateId = validateEntityId(duplicateId, 'duplicate report ID');
    if (validPrimaryId === validDuplicateId) {
      throw new ValidationError('Cannot merge a report into itself.');
    }
    const validActor = validateActorName(actor);

    const state = readState();
    const pIdx = state.reports.findIndex((r) => r.id === validPrimaryId);
    const dIdx = state.reports.findIndex((r) => r.id === validDuplicateId);
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
          author: validActor,
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
          author: validActor,
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
        actor: validActor,
        actionType: 'MERGE_REPORT',
        targetLabel: `Report #${primary.id} ⇐ #${duplicate.id}`,
        summary: `Merged duplicate report from ${duplicate.locality} into primary incident.`,
      },
      ...state.auditLogs,
    ];
    writeState(state);
    return { primary: updatedPrimary, duplicate: updatedDuplicate };
  }

  async deleteReport(reportId: string, actor: string): Promise<void> {
    const validId = validateEntityId(reportId, 'report ID');
    const validActor = validateActorName(actor);
    const state = readState();
    const target = state.reports.find((r) => r.id === validId);
    if (!target) {
      throw new Error('Report not found');
    }
    state.reports = state.reports.filter((r) => r.id !== validId);
    state.confirmedReportIds = state.confirmedReportIds.filter((id) => id !== validId);
    state.auditLogs = [
      {
        id: generateId('log'),
        timestamp: new Date().toISOString(),
        actor: validActor,
        actionType: 'DELETE_REPORT',
        targetLabel: `Report #${validId} (${target.locality})`,
        summary: `Removed ${target.mode === 'HELP_REQUEST' ? 'help request' : 'hazard report'} from board.`,
      },
      ...state.auditLogs,
    ];
    writeState(state);
  }

  async updateCorridorStatus(
    corridorId: string,
    status: CorridorPassability,
    advisoryNote: string,
    verificationStatus: 'VERIFIED' | 'UNVERIFIED',
    actor: string
  ): Promise<LifelineCorridor> {
    const validId = validateEntityId(corridorId, 'corridor ID');
    const validActor = validateActorName(actor);
    const validated = validateCorridorUpdate(status, advisoryNote, verificationStatus);
    const state = readState();
    const idx = state.corridors.findIndex((c) => c.id === validId);
    if (idx === -1) throw new Error('Corridor not found');
    const now = new Date().toISOString();
    const updated: LifelineCorridor = {
      ...state.corridors[idx],
      status: validated.status,
      advisoryNote: validated.advisoryNote,
      verificationStatus: validated.verificationStatus,
      lastConfirmedAt: now,
      isStale: false,
    };
    state.corridors[idx] = updated;
    state.auditLogs = [
      {
        id: generateId('log'),
        timestamp: now,
        actor: validActor,
        actionType: 'UPDATE_CORRIDOR',
        targetLabel: updated.name,
        summary: `Set passability to ${validated.status.replace('_', ' ')} (${validated.verificationStatus}).`,
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
    const validId = validateEntityId(resourceId, 'resource ID');
    const validActor = validateActorName(actor);
    const validated = validateResourceUpdate(
      capacityStatus,
      availableSupplies,
      verificationStatus
    );
    const state = readState();
    const idx = state.resources.findIndex((r) => r.id === validId);
    if (idx === -1) throw new Error('Resource not found');
    const now = new Date().toISOString();
    const updated: EmergencyResource = {
      ...state.resources[idx],
      capacityStatus: validated.capacityStatus,
      availableSupplies: validated.availableSupplies,
      verificationStatus: validated.verificationStatus,
      lastConfirmedAt: now,
      isStale: false,
    };
    state.resources[idx] = updated;
    state.auditLogs = [
      {
        id: generateId('log'),
        timestamp: now,
        actor: validActor,
        actionType: 'UPDATE_RESOURCE',
        targetLabel: updated.name,
        summary: `Set capacity to ${validated.capacityStatus.replace('_', ' ')} (${validated.verificationStatus}).`,
      },
      ...state.auditLogs,
    ];
    writeState(state);
    return updated;
  }

  async acceptNgoTask(payload: AcceptNgoTaskPayload): Promise<NgoAssignment> {
    const validated = validateNgoAssignmentInput(payload);
    const state = readState();
    const targetReport = state.reports.find((r) => r.id === validated.reportId);
    if (!targetReport) {
      throw new Error('Assistance request not found');
    }

    const existingList = state.ngoAssignments ?? [];
    const now = new Date().toISOString();
    const duplicate = existingList.find(
      (a) =>
        a.reportId === validated.reportId &&
        a.organization.toLowerCase() === validated.organization.toLowerCase() &&
        a.taskStatus !== 'RELIEF_DELIVERED'
    );
    if (duplicate) {
      throw new ValidationError('Your organization already has an active assignment for this request.');
    }

    const created: NgoAssignment = {
      id: generateId('ngo'),
      reportId: validated.reportId,
      volunteerName: validated.volunteerName,
      organization: validated.organization,
      capability: validated.capability,
      taskStatus: 'PLEDGED',
      note: validated.note,
      acceptedAt: now,
      updatedAt: now,
      isDemo: false,
    };

    state.ngoAssignments = [created, ...existingList];
    writeState(state);
    return created;
  }

  async updateNgoTaskStatus(
    assignmentId: string,
    taskStatus: NgoTaskStatus,
    note?: string
  ): Promise<NgoAssignment> {
    const validId = validateEntityId(assignmentId, 'assignment ID');
    const validStatus = validateNgoTaskStatus(taskStatus);
    const trimmedNote = typeof note === 'string' ? note.trim().slice(0, 500) : undefined;

    const state = readState();
    const list = state.ngoAssignments ?? [];
    const idx = list.findIndex((a) => a.id === validId);
    if (idx === -1) {
      throw new Error('NGO assignment not found');
    }

    const updated: NgoAssignment = {
      ...list[idx],
      taskStatus: validStatus,
      note: trimmedNote !== undefined ? trimmedNote : list[idx].note,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    state.ngoAssignments = list;
    writeState(state);
    return updated;
  }

  async releaseNgoTask(assignmentId: string): Promise<void> {
    const validId = validateEntityId(assignmentId, 'assignment ID');
    const state = readState();
    const list = state.ngoAssignments ?? [];
    if (!list.some((a) => a.id === validId)) {
      throw new Error('NGO assignment not found');
    }
    state.ngoAssignments = list.filter((a) => a.id !== validId);
    writeState(state);
  }

  async saveVolunteerProfile(
    profile: Omit<VolunteerProfile, 'updatedAt'>
  ): Promise<VolunteerProfile> {
    const validated = validateVolunteerProfileInput(profile);
    const state = readState();
    const saved: VolunteerProfile = {
      ...validated,
      updatedAt: new Date().toISOString(),
    };
    state.volunteerProfile = saved;
    writeState(state);
    return saved;
  }

  async recordSyncTimestamp(): Promise<string> {
    const state = readState();
    const now = new Date().toISOString();
    state.lastSyncedAt = now;
    writeState(state);
    return now;
  }
}
