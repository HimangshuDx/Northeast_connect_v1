export type ThemeMode = 'dark' | 'light';

export type LanguageCode = 'en' | 'as' | 'hi' | 'bn';

export type TrustStatus = 'VERIFIED' | 'UNVERIFIED' | 'UNDER_REVIEW' | 'REJECTED';

export type AdvisorySeverity = 'CRITICAL' | 'WARNING' | 'WATCH';

export type CorridorPassability =
  | 'PASSABLE'
  | 'SINGLE_LANE'
  | 'LANDSLIDE_BLOCKED'
  | 'SUBMERGED'
  | 'CLOSED'
  | 'UNKNOWN';

export type AssistanceStatus = 'SUBMITTED' | 'ACCEPTED' | 'DISPATCHED' | 'RESOLVED';

export type ReportMode = 'HAZARD' | 'HELP_REQUEST';

export type IncidentSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type IncidentCategory =
  | 'Flooding'
  | 'Landslide'
  | 'Road Blockage'
  | 'Bridge Damage'
  | 'Stranded Persons'
  | 'Medical Emergency'
  | 'Power / Telecom Outage';

export type VulnerabilityTag =
  | 'Elderly'
  | 'Infants'
  | 'Pregnant'
  | 'Medical Need'
  | 'Disabled';

export type AssistanceNeed = 'Rescue' | 'Medical' | 'Food / Water' | 'Shelter';

export type ResourceCategory =
  | 'Relief Camps'
  | 'Medical Posts'
  | 'Water / Ration Points'
  | 'Boat Rescue Points';

export type CapacityStatus =
  | 'OPEN_AVAILABLE'
  | 'NEAR_CAPACITY'
  | 'FULL'
  | 'TEMPORARILY_CLOSED'
  | 'UNKNOWN';

export type OutboxSyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface DistrictOption {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
}

export interface DisasterAdvisory {
  id: string;
  title: string;
  districtId: string;
  districtName: string;
  severity: AdvisorySeverity;
  instructions: string;
  issuedAt: string;
  expiresAt: string;
  source: string;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED';
  isDemo: boolean;
  isStale?: boolean;
}

export interface LifelineCorridor {
  id: string;
  name: string;
  corridorType: 'Highway' | 'Road' | 'Bridge' | 'Ferry';
  districtId: string;
  districtName: string;
  status: CorridorPassability;
  advisoryNote: string;
  lastConfirmedAt: string;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED';
  isDemo: boolean;
  isStale?: boolean;
  lat: number;
  lng: number;
}

export interface CoordinatorNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface CommunityReport {
  id: string;
  clientUuid?: string;
  mode: ReportMode;
  districtId: string;
  districtName: string;
  corridorOrBlock: string;
  locality: string;
  coordinates?: { lat: number; lng: number } | null;
  category: IncidentCategory;
  severity: IncidentSeverity;
  description: string;
  affectedPeopleCount: number;
  vulnerabilityTags: VulnerabilityTag[];
  assistanceNeeds: AssistanceNeed[];
  contactPhone: string;
  reporterName: string;
  reportingForOthers: boolean;
  createdAt: string;
  verificationStatus: TrustStatus;
  assistanceStatus: AssistanceStatus;
  confirmations: number;
  assignedUnit?: string;
  internalNotes: CoordinatorNote[];
  mergedIntoId?: string;
  mergedReportIds?: string[];
  isDemo: boolean;
  isStale?: boolean;
}

export interface EmergencyResource {
  id: string;
  name: string;
  category: ResourceCategory;
  districtId: string;
  districtName: string;
  area: string;
  landmark: string;
  contactPhone: string;
  capacityStatus: CapacityStatus;
  availableSupplies: string[];
  lastConfirmedAt: string;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED';
  isDemo: boolean;
  isStale?: boolean;
  lat: number;
  lng: number;
}

export interface OutboxSubmission {
  id: string;
  clientUuid: string;
  reportData: Omit<
    CommunityReport,
    'id' | 'clientUuid' | 'verificationStatus' | 'assistanceStatus' | 'confirmations' | 'internalNotes' | 'isDemo'
  >;
  syncStatus: OutboxSyncStatus;
  retryCount: number;
  nextRetryAt?: string;
  createdAt: string;
  lastAttemptAt?: string;
  errorMessage?: string;
  syncedReportId?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actionType:
    | 'VERIFY_REPORT'
    | 'ASSISTANCE_UPDATE'
    | 'ASSIGN_UNIT'
    | 'ADD_NOTE'
    | 'MERGE_REPORT'
    | 'DELETE_REPORT'
    | 'UPDATE_CORRIDOR'
    | 'UPDATE_RESOURCE';
  targetLabel: string;
  summary: string;
}

export interface EmergencyHelpline {
  id: string;
  name: string;
  number: string;
  coverage: string;
  description: string;
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
}

export type ExperienceMode = 'citizen' | 'ngo';

export type NgoTaskStatus = 'PLEDGED' | 'EN_ROUTE' | 'ON_SITE' | 'RELIEF_DELIVERED';

export type VolunteerAvailability = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export type NgoCapability =
  | 'Boat Rescue'
  | 'Medical Aid'
  | 'Food & Water Distribution'
  | 'Shelter & Evacuation'
  | 'Road & Debris Support';

export interface NgoAssignment {
  id: string;
  reportId: string;
  volunteerName: string;
  organization: string;
  capability: NgoCapability;
  taskStatus: NgoTaskStatus;
  note: string;
  acceptedAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface VolunteerProfile {
  id: string;
  name: string;
  organization: string;
  districtId: string;
  capability: NgoCapability;
  availability: VolunteerAvailability;
  teamSize: number;
  resourceInventory: string[];
  updatedAt: string;
}

