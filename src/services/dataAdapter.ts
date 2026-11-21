import {
  AssistanceStatus,
  AuditLogEntry,
  CapacityStatus,
  CommunityReport,
  CorridorPassability,
  DisasterAdvisory,
  EmergencyResource,
  LifelineCorridor,
  NgoAssignment,
  NgoCapability,
  NgoTaskStatus,
  OutboxSubmission,
  TrustStatus,
  VolunteerProfile,
} from '../types';

export interface DataSnapshot {
  advisories: DisasterAdvisory[];
  corridors: LifelineCorridor[];
  reports: CommunityReport[];
  resources: EmergencyResource[];
  outbox: OutboxSubmission[];
  auditLogs: AuditLogEntry[];
  confirmedReportIds: string[];
  ngoAssignments?: NgoAssignment[];
  volunteerProfile?: VolunteerProfile;
  lastSyncedAt: string;
}

export interface SubmitReportPayload {
  reportData: OutboxSubmission['reportData'];
  isOnline: boolean;
  editingOutboxId?: string;
  clientUuid?: string;
}

export interface AcceptNgoTaskPayload {
  reportId: string;
  volunteerName: string;
  organization: string;
  capability: NgoCapability;
  note?: string;
}

export interface DataAdapter {
  loadSnapshot(): Promise<DataSnapshot>;
  resetDemoData(): Promise<DataSnapshot>;
  submitReport(payload: SubmitReportPayload): Promise<{
    outboxItem: OutboxSubmission;
    syncedReport?: CommunityReport;
  }>;
  retryOutboxItem(outboxId: string, isOnline: boolean): Promise<{
    outboxItem: OutboxSubmission;
    syncedReport?: CommunityReport;
  }>;
  deleteOutboxItem(outboxId: string): Promise<void>;
  toggleConfirmReport(reportId: string): Promise<{
    report: CommunityReport;
    confirmed: boolean;
  }>;
  updateReportVerification(
    reportId: string,
    status: TrustStatus,
    actor: string
  ): Promise<CommunityReport>;
  updateReportAssistance(
    reportId: string,
    status: AssistanceStatus,
    actor: string
  ): Promise<CommunityReport>;
  assignReportUnit(
    reportId: string,
    unit: string,
    actor: string
  ): Promise<CommunityReport>;
  addReportNote(
    reportId: string,
    text: string,
    actor: string
  ): Promise<CommunityReport>;
  mergeReports(
    primaryId: string,
    duplicateId: string,
    actor: string
  ): Promise<{ primary: CommunityReport; duplicate: CommunityReport }>;
  deleteReport(reportId: string, actor: string): Promise<void>;
  updateCorridorStatus(
    corridorId: string,
    status: CorridorPassability,
    advisoryNote: string,
    verificationStatus: 'VERIFIED' | 'UNVERIFIED',
    actor: string
  ): Promise<LifelineCorridor>;
  updateResourceCapacity(
    resourceId: string,
    capacityStatus: CapacityStatus,
    availableSupplies: string[],
    verificationStatus: 'VERIFIED' | 'UNVERIFIED',
    actor: string
  ): Promise<EmergencyResource>;
  acceptNgoTask(payload: AcceptNgoTaskPayload): Promise<NgoAssignment>;
  updateNgoTaskStatus(
    assignmentId: string,
    taskStatus: NgoTaskStatus,
    note?: string
  ): Promise<NgoAssignment>;
  releaseNgoTask(assignmentId: string): Promise<void>;
  saveVolunteerProfile(
    profile: Omit<VolunteerProfile, 'updatedAt'>
  ): Promise<VolunteerProfile>;
  recordSyncTimestamp(): Promise<string>;
  subscribeToChanges?(onChange: () => void): () => void;
}

