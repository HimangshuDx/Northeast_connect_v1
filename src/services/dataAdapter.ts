import {
  AssistanceStatus,
  AuditLogEntry,
  CapacityStatus,
  CommunityReport,
  CorridorPassability,
  DisasterAdvisory,
  EmergencyResource,
  LifelineCorridor,
  OutboxSubmission,
  TrustStatus,
} from '../types';

export interface DataSnapshot {
  advisories: DisasterAdvisory[];
  corridors: LifelineCorridor[];
  reports: CommunityReport[];
  resources: EmergencyResource[];
  outbox: OutboxSubmission[];
  auditLogs: AuditLogEntry[];
  confirmedReportIds: string[];
  lastSyncedAt: string;
}

export interface SubmitReportPayload {
  reportData: OutboxSubmission['reportData'];
  isOnline: boolean;
  editingOutboxId?: string;
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
  recordSyncTimestamp(): Promise<string>;
}
