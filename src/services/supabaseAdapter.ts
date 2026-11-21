import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AssistanceStatus,
  AuditLogEntry,
  CapacityStatus,
  CommunityReport,
  CoordinatorNote,
  CorridorPassability,
  DisasterAdvisory,
  EmergencyResource,
  LifelineCorridor,
  NgoAssignment,
  NgoTaskStatus,
  OutboxSubmission,
  TrustStatus,
  VolunteerProfile,
} from '../types';
import { INITIAL_VOLUNTEER_PROFILE } from '../data/sampleData';
import { createClientUuid } from '../utils/formatters';
import {
  AcceptNgoTaskPayload,
  DataAdapter,
  DataSnapshot,
  SubmitReportPayload,
} from './dataAdapter';
import { LocalAdapter } from './localAdapter';
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

const OUTBOX_STORAGE_KEY = 'ne_connect_supabase_outbox_v1';
const SNAPSHOT_CACHE_KEY = 'ne_connect_supabase_cache_v1';
const DEVICE_TOKEN_KEY = 'ne_connect_device_token_v1';

function isMissingSchemaError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: string }).code;
  const msg = ((err as { message?: string }).message ?? '').toLowerCase();
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist')
  );
}

function isMissingRpcError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: string }).code;
  const msg = ((err as { message?: string }).message ?? '').toLowerCase();
  return code === 'PGRST202' || code === '42883' || msg.includes('could not find the function');
}

function isPermissionDeniedError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: string }).code;
  const status = (err as { status?: number }).status;
  const msg = ((err as { message?: string }).message ?? '').toLowerCase();
  return (
    code === '42501' ||
    status === 401 ||
    status === 403 ||
    msg.includes('permission denied') ||
    msg.includes('row-level security')
  );
}

interface AdvisoryRow {
  id: string;
  title: string;
  district_id: string;
  district_name: string;
  severity: DisasterAdvisory['severity'];
  instructions: string;
  issued_at: string;
  expires_at: string;
  source: string;
  verification_status: 'VERIFIED' | 'UNVERIFIED';
  is_demo_data: boolean;
  is_stale: boolean;
}

interface CorridorRow {
  id: string;
  name: string;
  corridor_type: LifelineCorridor['corridorType'];
  district_id: string;
  district_name: string;
  status: CorridorPassability;
  advisory_note: string;
  last_confirmed_at: string;
  verification_status: 'VERIFIED' | 'UNVERIFIED';
  is_demo_data: boolean;
  is_stale: boolean;
  lat: number;
  lng: number;
}

interface ReportRow {
  id: string;
  client_uuid: string;
  mode: CommunityReport['mode'];
  district_id: string;
  district_name: string;
  corridor_or_block: string;
  locality: string;
  coordinates_lat: number | null;
  coordinates_lng: number | null;
  category: CommunityReport['category'];
  severity: CommunityReport['severity'];
  description: string;
  affected_people_count: number;
  vulnerability_tags: CommunityReport['vulnerabilityTags'] | null;
  assistance_needs: CommunityReport['assistanceNeeds'] | null;
  contact_phone: string;
  reporter_name?: string | null;
  reporting_for_others: boolean;
  created_at: string;
  verification_status: TrustStatus;
  assistance_status: AssistanceStatus;
  confirmations: number;
  assigned_unit: string | null;
  internal_notes?: CoordinatorNote[] | null;
  merged_into_id: string | null;
  merged_report_ids: string[] | null;
  is_demo_data: boolean;
  is_stale: boolean;
}

interface ResourceRow {
  id: string;
  name: string;
  category: EmergencyResource['category'];
  district_id: string;
  district_name: string;
  area: string;
  landmark: string;
  contact_phone: string;
  capacity_status: CapacityStatus;
  available_supplies: string[] | null;
  last_confirmed_at: string;
  verification_status: 'VERIFIED' | 'UNVERIFIED';
  is_demo_data: boolean;
  is_stale: boolean;
  lat: number;
  lng: number;
}

interface AuditLogRow {
  id: string;
  timestamp: string;
  actor: string;
  action_type: AuditLogEntry['actionType'];
  target_label: string;
  summary: string;
}

interface NgoAssignmentRow {
  id: string;
  report_id: string;
  volunteer_name: string;
  organization: string;
  capability: NgoAssignment['capability'];
  task_status: NgoTaskStatus;
  note: string;
  accepted_at: string;
  updated_at: string;
  is_demo_data: boolean;
}

interface VolunteerProfileRow {
  id: string;
  name: string;
  organization: string;
  district_id: string;
  capability: VolunteerProfile['capability'];
  availability: VolunteerProfile['availability'];
  team_size: number;
  resource_inventory: string[] | null;
  updated_at: string;
}

function getDeviceToken(): string {
  try {
    const existing = localStorage.getItem(DEVICE_TOKEN_KEY);
    if (existing) return existing;
    const token = createClientUuid();
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
    return token;
  } catch {
    return 'ephemeral-device';
  }
}

function readLocalOutbox(): OutboxSubmission[] {
  try {
    const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OutboxSubmission[];
    return parsed.map((item) => ({
      ...item,
      clientUuid: item.clientUuid || createClientUuid(),
      retryCount: typeof item.retryCount === 'number' ? item.retryCount : 0,
    }));
  } catch {
    return [];
  }
}

function writeLocalOutbox(items: OutboxSubmission[]): void {
  try {
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore quota errors
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

function writeCachedSnapshot(snapshot: DataSnapshot): void {
  try {
    localStorage.setItem(SNAPSHOT_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore quota errors
  }
}

function computeNextRetryIso(retryCount: number): string {
  const delayMs = Math.min(30_000 * Math.pow(2, Math.max(0, retryCount - 1)), 5 * 60_000);
  return new Date(Date.now() + delayMs).toISOString();
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function mapAdvisory(row: AdvisoryRow): DisasterAdvisory {
  return {
    id: row.id,
    title: row.title,
    districtId: row.district_id,
    districtName: row.district_name,
    severity: row.severity,
    instructions: row.instructions,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    source: row.source,
    verificationStatus: row.verification_status,
    isDemo: row.is_demo_data,
    isStale: row.is_stale,
  };
}

function mapCorridor(row: CorridorRow): LifelineCorridor {
  return {
    id: row.id,
    name: row.name,
    corridorType: row.corridor_type,
    districtId: row.district_id,
    districtName: row.district_name,
    status: row.status,
    advisoryNote: row.advisory_note,
    lastConfirmedAt: row.last_confirmed_at,
    verificationStatus: row.verification_status,
    isDemo: row.is_demo_data,
    isStale: row.is_stale,
    lat: row.lat,
    lng: row.lng,
  };
}

function mapReport(row: ReportRow): CommunityReport {
  return {
    id: row.id,
    clientUuid: row.client_uuid,
    mode: row.mode,
    districtId: row.district_id,
    districtName: row.district_name,
    corridorOrBlock: row.corridor_or_block,
    locality: row.locality,
    coordinates:
      row.coordinates_lat != null && row.coordinates_lng != null
        ? { lat: row.coordinates_lat, lng: row.coordinates_lng }
        : null,
    category: row.category,
    severity: row.severity,
    description: row.description,
    affectedPeopleCount: row.affected_people_count,
    vulnerabilityTags: row.vulnerability_tags ?? [],
    assistanceNeeds: row.assistance_needs ?? [],
    contactPhone: row.contact_phone,
    reporterName: row.reporter_name ?? 'Protected / Coordinator Only',
    reportingForOthers: row.reporting_for_others,
    createdAt: row.created_at,
    verificationStatus: row.verification_status,
    assistanceStatus: row.assistance_status,
    confirmations: row.confirmations,
    assignedUnit: row.assigned_unit ?? undefined,
    internalNotes: Array.isArray(row.internal_notes) ? row.internal_notes : [],
    mergedIntoId: row.merged_into_id ?? undefined,
    mergedReportIds: row.merged_report_ids ?? undefined,
    isDemo: row.is_demo_data,
    isStale: row.is_stale,
  };
}

function mapResource(row: ResourceRow): EmergencyResource {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    districtId: row.district_id,
    districtName: row.district_name,
    area: row.area,
    landmark: row.landmark,
    contactPhone: row.contact_phone,
    capacityStatus: row.capacity_status,
    availableSupplies: row.available_supplies ?? [],
    lastConfirmedAt: row.last_confirmed_at,
    verificationStatus: row.verification_status,
    isDemo: row.is_demo_data,
    isStale: row.is_stale,
    lat: row.lat,
    lng: row.lng,
  };
}

function mapAuditLog(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    timestamp: row.timestamp,
    actor: row.actor,
    actionType: row.action_type,
    targetLabel: row.target_label,
    summary: row.summary,
  };
}

function mapNgoAssignment(row: NgoAssignmentRow): NgoAssignment {
  return {
    id: row.id,
    reportId: row.report_id,
    volunteerName: row.volunteer_name,
    organization: row.organization,
    capability: row.capability,
    taskStatus: row.task_status,
    note: row.note ?? '',
    acceptedAt: row.accepted_at,
    updatedAt: row.updated_at,
    isDemo: row.is_demo_data,
  };
}

function mapVolunteerProfile(row: VolunteerProfileRow): VolunteerProfile {
  return {
    id: row.id,
    name: row.name,
    organization: row.organization,
    districtId: row.district_id,
    capability: row.capability,
    availability: row.availability,
    teamSize: row.team_size,
    resourceInventory: Array.isArray(row.resource_inventory) ? row.resource_inventory : [],
    updatedAt: row.updated_at,
  };
}

export class SupabaseAdapter implements DataAdapter {
  private client: SupabaseClient;
  private localFallback = new LocalAdapter();
  private schemaMissing = false;
  private ngoSchemaMissing = false;
  private warnLogged = false;

  constructor(supabaseUrl: string, supabaseAnonKey: string, clientOverride?: SupabaseClient) {
    this.client =
      clientOverride ??
      createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
        },
      });
  }

  isUsingLocalFallback(): boolean {
    return this.schemaMissing;
  }

  private async resolveAuthContext(): Promise<{
    userId: string | null;
    isPartner: boolean;
    isCoordinator: boolean;
  }> {
    try {
      const {
        data: { session },
      } = await this.client.auth.getSession();
      if (!session?.user) {
        return { userId: null, isPartner: false, isCoordinator: false };
      }

      const { data: prof } = await this.client
        .from('organization_profiles')
        .select('role, is_active')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const jwtRole =
        typeof session.user.app_metadata?.role === 'string'
          ? session.user.app_metadata.role.trim().toUpperCase()
          : '';
      const profRow = prof as { role?: string; is_active?: boolean } | null;
      const effectiveRole =
        profRow && profRow.is_active ? profRow.role : jwtRole;

      const isCoordinator =
        effectiveRole === 'COORDINATOR' || effectiveRole === 'ADMIN';
      const isPartner =
        isCoordinator ||
        effectiveRole === 'NGO_MEMBER' ||
        effectiveRole === 'VOLUNTEER';

      return { userId: session.user.id, isPartner, isCoordinator };
    } catch {
      return { userId: null, isPartner: false, isCoordinator: false };
    }
  }

  private checkSchemaMissing(err: unknown): boolean {
    if (!isMissingSchemaError(err)) return false;
    this.schemaMissing = true;
    if (!this.warnLogged) {
      this.warnLogged = true;
      console.warn(
        '[Northeast Connect] Supabase tables are not created yet (run supabase/schema.sql and supabase/seed.sql). Running in local demo mode.'
      );
    }
    return true;
  }

  private checkNgoSchemaMissing(err: unknown): boolean {
    if (!isMissingSchemaError(err)) return false;
    this.ngoSchemaMissing = true;
    return true;
  }

  async loadSnapshot(): Promise<DataSnapshot> {
    if (this.schemaMissing) {
      return this.localFallback.loadSnapshot();
    }

    const deviceToken = getDeviceToken();
    const outbox = readLocalOutbox();

    try {
      const authCtx = await this.resolveAuthContext();
      const reportSource = authCtx.isCoordinator ? 'reports' : 'reports_public';

      const [advRes, corRes, repRes, resRes] = await Promise.all([
        this.client.from('advisories').select('*').order('issued_at', { ascending: false }),
        this.client.from('corridors').select('*').order('last_confirmed_at', { ascending: false }),
        this.client.from(reportSource).select('*').order('created_at', { ascending: false }),
        this.client.from('resources').select('*').order('name', { ascending: true }),
      ]);

      if (advRes.error) throw advRes.error;
      if (corRes.error) throw corRes.error;
      if (resRes.error) throw resRes.error;

      let reportRows: ReportRow[] = [];
      if (repRes.error) {
        if (reportSource === 'reports' && isPermissionDeniedError(repRes.error)) {
          const fallbackRep = await this.client
            .from('reports_public')
            .select('*')
            .order('created_at', { ascending: false });
          if (fallbackRep.error) throw fallbackRep.error;
          reportRows = (fallbackRep.data ?? []) as ReportRow[];
        } else {
          throw repRes.error;
        }
      } else {
        reportRows = (repRes.data ?? []) as ReportRow[];
      }

      // Audit logs: coordinator-only under hardened RLS
      let auditLogs: AuditLogEntry[] = [];
      if (authCtx.isCoordinator) {
        const logRes = await this.client
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50);
        if (logRes.error) {
          if (!isPermissionDeniedError(logRes.error) && !isMissingSchemaError(logRes.error)) {
            throw logRes.error;
          }
        } else {
          auditLogs = ((logRes.data ?? []) as AuditLogRow[]).map(mapAuditLog);
        }
      }

      // Confirmations: use security-definer RPC scoped strictly to deviceToken
      let confirmedReportIds: string[] = [];
      const confRpc = await this.client.rpc('get_confirmed_report_ids', {
        p_device_token: deviceToken,
      });
      if (confRpc.error) {
        if (isMissingRpcError(confRpc.error)) {
          const confRes = await this.client
            .from('confirmations')
            .select('report_id')
            .eq('device_token', deviceToken);
          if (!confRes.error) {
            confirmedReportIds = ((confRes.data ?? []) as { report_id: string }[]).map(
              (c) => c.report_id
            );
          }
        } else if (!isPermissionDeniedError(confRpc.error)) {
          throw confRpc.error;
        }
      } else if (Array.isArray(confRpc.data)) {
        confirmedReportIds = confRpc.data as string[];
      }

      let ngoAssignments: NgoAssignment[] = [];
      let volunteerProfile: VolunteerProfile = { ...INITIAL_VOLUNTEER_PROFILE };

      if (this.ngoSchemaMissing) {
        const localSnap = await this.localFallback.loadSnapshot();
        ngoAssignments = localSnap.ngoAssignments ?? [];
        volunteerProfile = localSnap.volunteerProfile ?? volunteerProfile;
      } else if (authCtx.isPartner) {
        const ownProfileId = authCtx.userId
          ? `vol-${authCtx.userId.slice(0, 16)}`
          : 'default-ngo-team';
        const [ngoRes, profRes] = await Promise.all([
          this.client.from('ngo_assignments').select('*').order('accepted_at', { ascending: false }),
          this.client
            .from('volunteer_profiles')
            .select('*')
            .in('id', [ownProfileId, 'default-ngo-team'])
            .limit(2),
        ]);

        if (
          (ngoRes.error && this.checkNgoSchemaMissing(ngoRes.error)) ||
          (profRes.error && this.checkNgoSchemaMissing(profRes.error))
        ) {
          const localSnap = await this.localFallback.loadSnapshot();
          ngoAssignments = localSnap.ngoAssignments ?? [];
          volunteerProfile = localSnap.volunteerProfile ?? volunteerProfile;
        } else {
          if (ngoRes.error && !isPermissionDeniedError(ngoRes.error)) throw ngoRes.error;
          if (profRes.error && !isPermissionDeniedError(profRes.error)) throw profRes.error;
          ngoAssignments = ((ngoRes.data ?? []) as NgoAssignmentRow[]).map(mapNgoAssignment);
          const profileRows = (profRes.data ?? []) as VolunteerProfileRow[];
          const preferredProfile =
            profileRows.find((p) => p.id === ownProfileId) ?? profileRows[0];
          if (preferredProfile) {
            volunteerProfile = mapVolunteerProfile(preferredProfile);
          }
        }
      }

      const snapshot: DataSnapshot = {
        advisories: (advRes.data as AdvisoryRow[]).map(mapAdvisory),
        corridors: (corRes.data as CorridorRow[]).map(mapCorridor),
        reports: reportRows.map(mapReport),
        resources: (resRes.data as ResourceRow[]).map(mapResource),
        outbox,
        auditLogs,
        confirmedReportIds,
        ngoAssignments,
        volunteerProfile,
        lastSyncedAt: new Date().toISOString(),
      };

      writeCachedSnapshot(snapshot);
      return snapshot;
    } catch (err) {
      if (this.checkSchemaMissing(err)) {
        return this.localFallback.loadSnapshot();
      }
      const cached = readCachedSnapshot();
      if (cached) {
        return { ...cached, outbox };
      }
      throw err;
    }
  }

  async resetDemoData(): Promise<DataSnapshot> {
    if (this.schemaMissing) {
      return this.localFallback.resetDemoData();
    }
    writeLocalOutbox([]);
    return this.loadSnapshot();
  }

  private async upsertReportRow(
    clientUuid: string,
    reportData: OutboxSubmission['reportData'],
    existingReportId?: string,
    createdAt?: string
  ): Promise<CommunityReport> {
    const validated = validateReportPayload(reportData);
    const id = existingReportId ?? generateId('rep');
    const submittedAt = createdAt ?? validated.createdAt ?? new Date().toISOString();

    // Primary hardened path: security-definer RPC performs ON CONFLICT (client_uuid) DO NOTHING
    // and returns the masked `reports_public` row without giving anon SELECT/UPDATE on base `reports`.
    const rpcRes = await this.client.rpc('submit_public_report', {
      p_id: id,
      p_client_uuid: clientUuid,
      p_mode: validated.mode,
      p_district_id: validated.districtId,
      p_district_name: validated.districtName,
      p_corridor_or_block: validated.corridorOrBlock,
      p_locality: validated.locality,
      p_coordinates_lat: validated.coordinates?.lat ?? null,
      p_coordinates_lng: validated.coordinates?.lng ?? null,
      p_category: validated.category,
      p_severity: validated.severity,
      p_description: validated.description,
      p_affected_people_count: validated.affectedPeopleCount,
      p_vulnerability_tags: validated.vulnerabilityTags,
      p_assistance_needs: validated.assistanceNeeds,
      p_contact_phone: validated.contactPhone,
      p_reporter_name: validated.reporterName,
      p_reporting_for_others: validated.reportingForOthers,
      p_created_at: submittedAt,
    });

    if (!rpcRes.error && rpcRes.data) {
      const rpcRow = Array.isArray(rpcRes.data) ? rpcRes.data[0] : rpcRes.data;
      if (rpcRow) {
        return mapReport(rpcRow as ReportRow);
      }
    }

    if (rpcRes.error && !isMissingRpcError(rpcRes.error)) {
      throw rpcRes.error;
    }

    // Fallback when RPC is not installed yet: direct INSERT (no .select() since anon has no base SELECT)
    const row = {
      id,
      client_uuid: clientUuid,
      mode: validated.mode,
      district_id: validated.districtId,
      district_name: validated.districtName,
      corridor_or_block: validated.corridorOrBlock,
      locality: validated.locality,
      coordinates_lat: validated.coordinates?.lat ?? null,
      coordinates_lng: validated.coordinates?.lng ?? null,
      category: validated.category,
      severity: validated.severity,
      description: validated.description,
      affected_people_count: validated.affectedPeopleCount,
      vulnerability_tags: validated.vulnerabilityTags,
      assistance_needs: validated.assistanceNeeds,
      contact_phone: validated.contactPhone,
      reporter_name: validated.reporterName,
      reporting_for_others: validated.reportingForOthers,
      created_at: submittedAt,
      verification_status: 'UNVERIFIED' as const,
      assistance_status: 'SUBMITTED' as const,
      confirmations: 1,
      assigned_unit: null,
      internal_notes: [] as CoordinatorNote[],
      merged_into_id: null,
      merged_report_ids: [] as string[],
      is_demo_data: false,
      is_stale: false,
      updated_at: new Date().toISOString(),
    };

    const { error: insertErr } = await this.client.from('reports').insert(row);
    if (insertErr && (insertErr as { code?: string }).code !== '23505') {
      throw insertErr;
    }

    const { data: pubRow } = await this.client
      .from('reports_public')
      .select('*')
      .eq('client_uuid', clientUuid)
      .maybeSingle();

    if (pubRow) {
      return mapReport(pubRow as ReportRow);
    }

    return mapReport({
      ...row,
      contact_phone:
        validated.contactPhone.length > 5
          ? `${validated.contactPhone.slice(0, -5)}XXXXX`
          : 'XXXXX',
    });
  }

  async submitReport(payload: SubmitReportPayload): Promise<{
    outboxItem: OutboxSubmission;
    syncedReport?: CommunityReport;
  }> {
    const validatedReportData = validateReportPayload(payload.reportData);
    const normalizedPayload: SubmitReportPayload = {
      ...payload,
      reportData: validatedReportData,
    };

    if (this.schemaMissing) {
      return this.localFallback.submitReport(normalizedPayload);
    }

    const now = new Date().toISOString();
    const outbox = readLocalOutbox();

    const existingIdx = normalizedPayload.editingOutboxId
      ? outbox.findIndex((i) => i.id === normalizedPayload.editingOutboxId)
      : normalizedPayload.clientUuid
      ? outbox.findIndex((i) => i.clientUuid === normalizedPayload.clientUuid)
      : -1;

    const existing = existingIdx !== -1 ? outbox[existingIdx] : null;
    const clientUuid = existing?.clientUuid ?? normalizedPayload.clientUuid ?? createClientUuid();
    const outboxId = existing?.id ?? generateId('out');
    const createdAt = existing?.createdAt ?? now;

    if (!normalizedPayload.isOnline) {
      const pendingItem: OutboxSubmission = {
        id: outboxId,
        clientUuid,
        reportData: validatedReportData,
        syncStatus: 'PENDING',
        retryCount: existing?.retryCount ?? 0,
        createdAt,
        lastAttemptAt: now,
        syncedReportId: existing?.syncedReportId,
      };
      const nextOutbox = [
        pendingItem,
        ...outbox.filter((o) => o.id !== outboxId && o.clientUuid !== clientUuid),
      ];
      writeLocalOutbox(nextOutbox);
      return { outboxItem: pendingItem };
    }

    try {
      const syncedReport = await this.upsertReportRow(
        clientUuid,
        validatedReportData,
        existing?.syncedReportId,
        createdAt
      );
      const syncedItem: OutboxSubmission = {
        id: outboxId,
        clientUuid,
        reportData: validatedReportData,
        syncStatus: 'SYNCED',
        retryCount: 0,
        createdAt,
        lastAttemptAt: now,
        syncedReportId: syncedReport.id,
      };
      const nextOutbox = [
        syncedItem,
        ...outbox.filter((o) => o.id !== outboxId && o.clientUuid !== clientUuid),
      ];
      writeLocalOutbox(nextOutbox);
      return { outboxItem: syncedItem, syncedReport };
    } catch (err) {
      if (err instanceof ValidationError) throw err;
      if (this.checkSchemaMissing(err)) {
        return this.localFallback.submitReport(normalizedPayload);
      }
      const retryCount = (existing?.retryCount ?? 0) + 1;
      const failedItem: OutboxSubmission = {
        id: outboxId,
        clientUuid,
        reportData: validatedReportData,
        syncStatus: 'FAILED',
        retryCount,
        nextRetryAt: computeNextRetryIso(retryCount),
        createdAt,
        lastAttemptAt: now,
        errorMessage:
          err instanceof Error
            ? `Could not reach server (${err.message}). Saved on device for retry.`
            : 'Could not reach server. Saved on device for retry.',
      };
      const nextOutbox = [
        failedItem,
        ...outbox.filter((o) => o.id !== outboxId && o.clientUuid !== clientUuid),
      ];
      writeLocalOutbox(nextOutbox);
      return { outboxItem: failedItem };
    }
  }

  async retryOutboxItem(
    outboxId: string,
    isOnline: boolean
  ): Promise<{ outboxItem: OutboxSubmission; syncedReport?: CommunityReport }> {
    if (this.schemaMissing) {
      return this.localFallback.retryOutboxItem(outboxId, isOnline);
    }

    const outbox = readLocalOutbox();
    const idx = outbox.findIndex((i) => i.id === outboxId);
    if (idx === -1) {
      throw new Error('Outbox entry not found');
    }

    const now = new Date().toISOString();
    const current = outbox[idx];
    const clientUuid = current.clientUuid || createClientUuid();

    if (!isOnline) {
      const retryCount = (current.retryCount ?? 0) + 1;
      const failedItem: OutboxSubmission = {
        ...current,
        clientUuid,
        syncStatus: 'FAILED',
        retryCount,
        nextRetryAt: computeNextRetryIso(retryCount),
        lastAttemptAt: now,
        errorMessage: 'Device is offline. Saved locally until connectivity returns.',
      };
      outbox[idx] = failedItem;
      writeLocalOutbox(outbox);
      return { outboxItem: failedItem };
    }

    try {
      const syncedReport = await this.upsertReportRow(
        clientUuid,
        current.reportData,
        current.syncedReportId,
        current.createdAt
      );
      const syncedItem: OutboxSubmission = {
        ...current,
        clientUuid,
        syncStatus: 'SYNCED',
        retryCount: 0,
        nextRetryAt: undefined,
        lastAttemptAt: now,
        errorMessage: undefined,
        syncedReportId: syncedReport.id,
      };
      outbox[idx] = syncedItem;
      writeLocalOutbox(outbox);
      return { outboxItem: syncedItem, syncedReport };
    } catch (err) {
      if (this.checkSchemaMissing(err)) {
        return this.localFallback.retryOutboxItem(outboxId, isOnline);
      }
      const retryCount = (current.retryCount ?? 0) + 1;
      const failedItem: OutboxSubmission = {
        ...current,
        clientUuid,
        syncStatus: 'FAILED',
        retryCount,
        nextRetryAt: computeNextRetryIso(retryCount),
        lastAttemptAt: now,
        errorMessage:
          err instanceof Error
            ? `Sync failed (${err.message}). Will retry automatically.`
            : 'Sync failed. Will retry automatically.',
      };
      outbox[idx] = failedItem;
      writeLocalOutbox(outbox);
      return { outboxItem: failedItem };
    }
  }

  async deleteOutboxItem(outboxId: string): Promise<void> {
    const validId = validateEntityId(outboxId, 'outbox entry ID');
    if (this.schemaMissing) {
      return this.localFallback.deleteOutboxItem(validId);
    }
    const next = readLocalOutbox().filter((i) => i.id !== validId);
    writeLocalOutbox(next);
  }

  async toggleConfirmReport(reportId: string): Promise<{
    report: CommunityReport;
    confirmed: boolean;
  }> {
    const validId = validateEntityId(reportId, 'report ID');
    if (this.schemaMissing) {
      return this.localFallback.toggleConfirmReport(validId);
    }

    try {
      const deviceToken = getDeviceToken();
      const authCtx = await this.resolveAuthContext();
      const readSource = authCtx.isCoordinator ? 'reports' : 'reports_public';

      const { data: rpcConfirmed, error: rpcErr } = await this.client.rpc(
        'toggle_report_confirmation',
        {
          p_report_id: validId,
          p_device_token: deviceToken,
        }
      );

      let confirmed: boolean;
      if (rpcErr) {
        if (!isMissingRpcError(rpcErr)) {
          throw rpcErr;
        }
        const { data: existing, error: findErr } = await this.client
          .from('confirmations')
          .select('id')
          .eq('report_id', validId)
          .eq('device_token', deviceToken)
          .maybeSingle();

        if (findErr) throw findErr;

        if (existing) {
          const { error: delErr } = await this.client
            .from('confirmations')
            .delete()
            .eq('id', (existing as { id: string }).id);
          if (delErr) throw delErr;
          confirmed = false;
        } else {
          const { error: insErr } = await this.client
            .from('confirmations')
            .insert({ report_id: validId, device_token: deviceToken });
          if (insErr && (insErr as { code?: string }).code !== '23505') {
            throw insErr;
          }
          confirmed = true;
        }
      } else {
        confirmed = Boolean(rpcConfirmed);
      }

      const { data: updatedRow, error: repErr } = await this.client
        .from(readSource)
        .select('*')
        .eq('id', validId)
        .single();

      if (repErr) throw repErr;
      return { report: mapReport(updatedRow as ReportRow), confirmed };
    } catch (err) {
      if (err instanceof ValidationError) throw err;
      if (this.checkSchemaMissing(err)) {
        return this.localFallback.toggleConfirmReport(validId);
      }
      throw err;
    }
  }

  private async appendAuditLog(
    actionType: AuditLogEntry['actionType'],
    actor: string,
    targetLabel: string,
    summary: string
  ): Promise<void> {
    const validActor = validateActorName(actor);
    const { error } = await this.client.from('audit_logs').insert({
      id: generateId('log'),
      timestamp: new Date().toISOString(),
      actor: validActor,
      action_type: actionType,
      target_label: targetLabel,
      summary,
      is_demo_data: false,
    });
    if (error && !isMissingSchemaError(error)) {
      throw error;
    }
  }

  async updateReportVerification(
    reportId: string,
    status: TrustStatus,
    actor: string
  ): Promise<CommunityReport> {
    const validId = validateEntityId(reportId, 'report ID');
    const validStatus = validateTrustStatus(status);
    const validActor = validateActorName(actor);

    if (this.schemaMissing) {
      return this.localFallback.updateReportVerification(validId, validStatus, validActor);
    }
    const { data: current, error: fetchErr } = await this.client
      .from('reports')
      .select('verification_status, locality')
      .eq('id', validId)
      .single();
    if (fetchErr) {
      if (this.checkSchemaMissing(fetchErr)) {
        return this.localFallback.updateReportVerification(validId, validStatus, validActor);
      }
      throw fetchErr;
    }

    const prev = (current as { verification_status: TrustStatus; locality: string }).verification_status;
    const locality = (current as { verification_status: TrustStatus; locality: string }).locality;

    const { data, error } = await this.client
      .from('reports')
      .update({ verification_status: validStatus, updated_at: new Date().toISOString() })
      .eq('id', validId)
      .select('*')
      .single();
    if (error) throw error;

    await this.appendAuditLog(
      'VERIFY_REPORT',
      validActor,
      `Report #${validId} (${locality})`,
      `Changed verification status from ${prev} to ${validStatus}.`
    );
    return mapReport(data as ReportRow);
  }

  async updateReportAssistance(
    reportId: string,
    status: AssistanceStatus,
    actor: string
  ): Promise<CommunityReport> {
    const validId = validateEntityId(reportId, 'report ID');
    const validStatus = validateAssistanceStatus(status);
    const validActor = validateActorName(actor);

    if (this.schemaMissing) {
      return this.localFallback.updateReportAssistance(validId, validStatus, validActor);
    }
    const { data: current, error: fetchErr } = await this.client
      .from('reports')
      .select('assistance_status, locality')
      .eq('id', validId)
      .single();
    if (fetchErr) {
      if (this.checkSchemaMissing(fetchErr)) {
        return this.localFallback.updateReportAssistance(validId, validStatus, validActor);
      }
      throw fetchErr;
    }

    const prev = (current as { assistance_status: AssistanceStatus; locality: string }).assistance_status;
    const locality = (current as { assistance_status: AssistanceStatus; locality: string }).locality;

    const { data, error } = await this.client
      .from('reports')
      .update({ assistance_status: validStatus, updated_at: new Date().toISOString() })
      .eq('id', validId)
      .select('*')
      .single();
    if (error) throw error;

    await this.appendAuditLog(
      'ASSISTANCE_UPDATE',
      validActor,
      `Report #${validId} (${locality})`,
      `Updated assistance workflow from ${prev} to ${validStatus}.`
    );
    return mapReport(data as ReportRow);
  }

  async assignReportUnit(
    reportId: string,
    unit: string,
    actor: string
  ): Promise<CommunityReport> {
    const validId = validateEntityId(reportId, 'report ID');
    const validActor = validateActorName(actor);
    const trimmedUnit = typeof unit === 'string' ? unit.trim().slice(0, 120) : '';

    if (this.schemaMissing) {
      return this.localFallback.assignReportUnit(validId, trimmedUnit, validActor);
    }
    const { data, error } = await this.client
      .from('reports')
      .update({ assigned_unit: trimmedUnit || null, updated_at: new Date().toISOString() })
      .eq('id', validId)
      .select('*')
      .single();
    if (error) {
      if (this.checkSchemaMissing(error)) {
        return this.localFallback.assignReportUnit(validId, trimmedUnit, validActor);
      }
      throw error;
    }

    const mapped = mapReport(data as ReportRow);
    await this.appendAuditLog(
      'ASSIGN_UNIT',
      validActor,
      `Report #${validId} (${mapped.locality})`,
      trimmedUnit ? `Assigned response team: ${trimmedUnit}.` : 'Cleared assigned response team.'
    );
    return mapped;
  }

  async addReportNote(
    reportId: string,
    text: string,
    actor: string
  ): Promise<CommunityReport> {
    const validId = validateEntityId(reportId, 'report ID');
    const validNote = validateNoteText(text);
    const validActor = validateActorName(actor);

    if (this.schemaMissing) {
      return this.localFallback.addReportNote(validId, validNote, validActor);
    }
    const { data: current, error: fetchErr } = await this.client
      .from('reports')
      .select('internal_notes')
      .eq('id', validId)
      .single();
    if (fetchErr) {
      if (this.checkSchemaMissing(fetchErr)) {
        return this.localFallback.addReportNote(validId, validNote, validActor);
      }
      throw fetchErr;
    }

    const existingNotes = Array.isArray((current as { internal_notes: CoordinatorNote[] }).internal_notes)
      ? (current as { internal_notes: CoordinatorNote[] }).internal_notes
      : [];

    const note: CoordinatorNote = {
      id: generateId('note'),
      author: validActor,
      text: validNote,
      createdAt: new Date().toISOString(),
    };

    const { data, error } = await this.client
      .from('reports')
      .update({
        internal_notes: [note, ...existingNotes],
        updated_at: note.createdAt,
      })
      .eq('id', validId)
      .select('*')
      .single();
    if (error) throw error;

    await this.appendAuditLog(
      'ADD_NOTE',
      validActor,
      `Report #${validId}`,
      `Added internal note: "${note.text.slice(0, 70)}${note.text.length > 70 ? '...' : ''}"`
    );
    return mapReport(data as ReportRow);
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

    if (this.schemaMissing) {
      return this.localFallback.mergeReports(validPrimaryId, validDuplicateId, validActor);
    }
    const { data: rows, error: fetchErr } = await this.client
      .from('reports')
      .select('*')
      .in('id', [validPrimaryId, validDuplicateId]);
    if (fetchErr) {
      if (this.checkSchemaMissing(fetchErr)) {
        return this.localFallback.mergeReports(validPrimaryId, validDuplicateId, validActor);
      }
      throw fetchErr;
    }

    const primaryRow = (rows as ReportRow[]).find((r) => r.id === validPrimaryId);
    const duplicateRow = (rows as ReportRow[]).find((r) => r.id === validDuplicateId);
    if (!primaryRow || !duplicateRow) throw new Error('Reports to merge not found');

    const now = new Date().toISOString();
    const pNotes = Array.isArray(primaryRow.internal_notes) ? primaryRow.internal_notes : [];
    const dNotes = Array.isArray(duplicateRow.internal_notes) ? duplicateRow.internal_notes : [];

    const { data: updatedPrimary, error: pErr } = await this.client
      .from('reports')
      .update({
        confirmations: primaryRow.confirmations + duplicateRow.confirmations,
        merged_report_ids: [...(primaryRow.merged_report_ids ?? []), duplicateRow.id],
        internal_notes: [
          {
            id: generateId('note'),
            author: validActor,
            text: `Merged duplicate report #${duplicateRow.id} (${duplicateRow.locality}) — combined +${duplicateRow.confirmations} confirmations.`,
            createdAt: now,
          },
          ...pNotes,
        ],
        updated_at: now,
      })
      .eq('id', validPrimaryId)
      .select('*')
      .single();
    if (pErr) throw pErr;

    const { data: updatedDup, error: dErr } = await this.client
      .from('reports')
      .update({
        merged_into_id: primaryRow.id,
        verification_status: 'REJECTED',
        internal_notes: [
          {
            id: generateId('note'),
            author: validActor,
            text: `Marked as duplicate and merged into #${primaryRow.id}.`,
            createdAt: now,
          },
          ...dNotes,
        ],
        updated_at: now,
      })
      .eq('id', validDuplicateId)
      .select('*')
      .single();
    if (dErr) throw dErr;

    await this.appendAuditLog(
      'MERGE_REPORT',
      validActor,
      `Report #${primaryRow.id} ⇐ #${duplicateRow.id}`,
      `Merged duplicate report from ${duplicateRow.locality} into primary incident.`
    );

    return {
      primary: mapReport(updatedPrimary as ReportRow),
      duplicate: mapReport(updatedDup as ReportRow),
    };
  }

  async deleteReport(reportId: string, actor: string): Promise<void> {
    const validId = validateEntityId(reportId, 'report ID');
    const validActor = validateActorName(actor);

    if (this.schemaMissing) {
      return this.localFallback.deleteReport(validId, validActor);
    }

    const { data: deleted, error } = await this.client
      .from('reports')
      .delete()
      .eq('id', validId)
      .select('id, locality, mode')
      .single();

    if (error) {
      if (this.checkSchemaMissing(error)) {
        return this.localFallback.deleteReport(validId, validActor);
      }
      if ((error as { code?: string }).code === 'PGRST116') {
        throw new Error('Report not found');
      }
      throw error;
    }

    const target = deleted as { id: string; locality: string; mode: CommunityReport['mode'] };
    await this.appendAuditLog(
      'DELETE_REPORT',
      validActor,
      `Report #${validId} (${target.locality})`,
      `Removed ${target.mode === 'HELP_REQUEST' ? 'help request' : 'hazard report'} from board.`
    );
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

    if (this.schemaMissing) {
      return this.localFallback.updateCorridorStatus(
        validId,
        validated.status,
        validated.advisoryNote,
        validated.verificationStatus,
        validActor
      );
    }
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from('corridors')
      .update({
        status: validated.status,
        advisory_note: validated.advisoryNote,
        verification_status: validated.verificationStatus,
        last_confirmed_at: now,
        is_stale: false,
        updated_at: now,
      })
      .eq('id', validId)
      .select('*')
      .single();
    if (error) {
      if (this.checkSchemaMissing(error)) {
        return this.localFallback.updateCorridorStatus(
          validId,
          validated.status,
          validated.advisoryNote,
          validated.verificationStatus,
          validActor
        );
      }
      throw error;
    }

    const updated = mapCorridor(data as CorridorRow);
    await this.appendAuditLog(
      'UPDATE_CORRIDOR',
      validActor,
      updated.name,
      `Set passability to ${validated.status.replace('_', ' ')} (${validated.verificationStatus}).`
    );
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

    if (this.schemaMissing) {
      return this.localFallback.updateResourceCapacity(
        validId,
        validated.capacityStatus,
        validated.availableSupplies,
        validated.verificationStatus,
        validActor
      );
    }
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from('resources')
      .update({
        capacity_status: validated.capacityStatus,
        available_supplies: validated.availableSupplies,
        verification_status: validated.verificationStatus,
        last_confirmed_at: now,
        is_stale: false,
        updated_at: now,
      })
      .eq('id', validId)
      .select('*')
      .single();
    if (error) {
      if (this.checkSchemaMissing(error)) {
        return this.localFallback.updateResourceCapacity(
          validId,
          validated.capacityStatus,
          validated.availableSupplies,
          validated.verificationStatus,
          validActor
        );
      }
      throw error;
    }

    const updated = mapResource(data as ResourceRow);
    await this.appendAuditLog(
      'UPDATE_RESOURCE',
      validActor,
      updated.name,
      `Set capacity to ${validated.capacityStatus.replace('_', ' ')} (${validated.verificationStatus}).`
    );
    return updated;
  }

  async acceptNgoTask(payload: AcceptNgoTaskPayload): Promise<NgoAssignment> {
    const validated = validateNgoAssignmentInput(payload);
    if (this.schemaMissing || this.ngoSchemaMissing) {
      return this.localFallback.acceptNgoTask(validated);
    }

    try {
      const authCtx = await this.resolveAuthContext();
      if (!authCtx.userId || !authCtx.isPartner) {
        throw new Error('Sign in with an authorized NGO, Volunteer, or Coordinator account to accept tasks.');
      }

      const { data: existingRows, error: dupErr } = await this.client
        .from('ngo_assignments')
        .select('id, organization, task_status')
        .eq('report_id', validated.reportId)
        .neq('task_status', 'RELIEF_DELIVERED');

      if (dupErr) {
        if (this.checkNgoSchemaMissing(dupErr)) {
          return this.localFallback.acceptNgoTask(validated);
        }
        throw dupErr;
      }

      const duplicate = ((existingRows ?? []) as { organization: string }[]).some(
        (r) => r.organization.toLowerCase() === validated.organization.toLowerCase()
      );
      if (duplicate) {
        throw new ValidationError(
          'Your organization already has an active assignment for this request.'
        );
      }

      const now = new Date().toISOString();
      const { data, error } = await this.client
        .from('ngo_assignments')
        .insert({
          id: generateId('ngo'),
          report_id: validated.reportId,
          volunteer_name: validated.volunteerName,
          organization: validated.organization,
          capability: validated.capability,
          task_status: 'PLEDGED',
          note: validated.note,
          accepted_at: now,
          updated_at: now,
          is_demo_data: false,
          owner_user_id: authCtx.userId,
        })
        .select('*')
        .single();

      if (error) {
        if (this.checkNgoSchemaMissing(error)) {
          return this.localFallback.acceptNgoTask(validated);
        }
        throw error;
      }
      return mapNgoAssignment(data as NgoAssignmentRow);
    } catch (err) {
      if (err instanceof ValidationError) throw err;
      if (this.checkNgoSchemaMissing(err)) {
        return this.localFallback.acceptNgoTask(validated);
      }
      throw err;
    }
  }

  async updateNgoTaskStatus(
    assignmentId: string,
    taskStatus: NgoTaskStatus,
    note?: string
  ): Promise<NgoAssignment> {
    const validId = validateEntityId(assignmentId, 'assignment ID');
    const validStatus = validateNgoTaskStatus(taskStatus);
    const trimmedNote = typeof note === 'string' ? note.trim().slice(0, 500) : undefined;

    if (this.schemaMissing || this.ngoSchemaMissing) {
      return this.localFallback.updateNgoTaskStatus(validId, validStatus, trimmedNote);
    }

    const patch: Record<string, unknown> = {
      task_status: validStatus,
      updated_at: new Date().toISOString(),
    };
    if (trimmedNote !== undefined) {
      patch.note = trimmedNote;
    }

    const { data, error } = await this.client
      .from('ngo_assignments')
      .update(patch)
      .eq('id', validId)
      .select('*')
      .single();

    if (error) {
      if (this.checkNgoSchemaMissing(error)) {
        return this.localFallback.updateNgoTaskStatus(validId, validStatus, trimmedNote);
      }
      if ((error as { code?: string }).code === 'PGRST116') {
        throw new Error('NGO assignment not found');
      }
      throw error;
    }
    return mapNgoAssignment(data as NgoAssignmentRow);
  }

  async releaseNgoTask(assignmentId: string): Promise<void> {
    const validId = validateEntityId(assignmentId, 'assignment ID');

    if (this.schemaMissing || this.ngoSchemaMissing) {
      return this.localFallback.releaseNgoTask(validId);
    }

    const { data, error } = await this.client
      .from('ngo_assignments')
      .delete()
      .eq('id', validId)
      .select('id')
      .maybeSingle();

    if (error) {
      if (this.checkNgoSchemaMissing(error)) {
        return this.localFallback.releaseNgoTask(validId);
      }
      throw error;
    }
    if (!data) {
      throw new Error('NGO assignment not found');
    }
  }

  async saveVolunteerProfile(
    profile: Omit<VolunteerProfile, 'updatedAt'>
  ): Promise<VolunteerProfile> {
    const validated = validateVolunteerProfileInput(profile);

    if (this.schemaMissing || this.ngoSchemaMissing) {
      return this.localFallback.saveVolunteerProfile(validated);
    }

    const authCtx = await this.resolveAuthContext();
    if (!authCtx.userId || !authCtx.isPartner) {
      throw new Error('Sign in with an authorized NGO, Volunteer, or Coordinator account to update team availability.');
    }

    const scopedProfileId =
      validated.id === 'default-ngo-team'
        ? `vol-${authCtx.userId.slice(0, 16)}`
        : validated.id;

    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from('volunteer_profiles')
      .upsert(
        {
          id: scopedProfileId,
          name: validated.name,
          organization: validated.organization,
          district_id: validated.districtId,
          capability: validated.capability,
          availability: validated.availability,
          team_size: validated.teamSize,
          resource_inventory: validated.resourceInventory,
          updated_at: now,
          owner_user_id: authCtx.userId,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (error) {
      if (this.checkNgoSchemaMissing(error)) {
        return this.localFallback.saveVolunteerProfile(validated);
      }
      throw error;
    }
    return mapVolunteerProfile(data as VolunteerProfileRow);
  }

  async recordSyncTimestamp(): Promise<string> {
    if (this.schemaMissing) {
      return this.localFallback.recordSyncTimestamp();
    }
    return new Date().toISOString();
  }

  subscribeToChanges(onChange: () => void): () => void {
    if (this.schemaMissing) {
      return () => {};
    }

    const safeOnChange = () => {
      if (!this.schemaMissing) {
        onChange();
      }
    };

    const channel = this.client
      .channel('ne_connect_live_board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, safeOnChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'corridors' }, safeOnChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, safeOnChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'advisories' }, safeOnChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ngo_assignments' }, safeOnChange)
      .subscribe();

    // 15s polling fallback in case Realtime is disabled on a table or throttled
    const pollId = window.setInterval(safeOnChange, 15_000);

    return () => {
      window.clearInterval(pollId);
      void this.client.removeChannel(channel);
    };
  }
}

export function createSupabaseAdapter(
  supabaseUrl: string,
  supabaseAnonKey: string,
  clientOverride?: SupabaseClient
): DataAdapter {
  return new SupabaseAdapter(supabaseUrl, supabaseAnonKey, clientOverride);
}

