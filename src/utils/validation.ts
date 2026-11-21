import {
  AssistanceNeed,
  AssistanceStatus,
  CapacityStatus,
  CorridorPassability,
  IncidentCategory,
  IncidentSeverity,
  NgoCapability,
  NgoTaskStatus,
  OutboxSubmission,
  ReportMode,
  TrustStatus,
  VolunteerAvailability,
  VolunteerProfile,
  VulnerabilityTag,
} from '../types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const VALID_MODES: ReadonlySet<ReportMode> = new Set(['HAZARD', 'HELP_REQUEST']);
const VALID_SEVERITIES: ReadonlySet<IncidentSeverity> = new Set([
  'LOW',
  'MODERATE',
  'HIGH',
  'CRITICAL',
]);
const VALID_CATEGORIES: ReadonlySet<IncidentCategory> = new Set([
  'Flooding',
  'Landslide',
  'Road Blockage',
  'Bridge Damage',
  'Stranded Persons',
  'Medical Emergency',
  'Power / Telecom Outage',
]);
const VALID_VULNERABILITIES: ReadonlySet<VulnerabilityTag> = new Set([
  'Elderly',
  'Infants',
  'Pregnant',
  'Medical Need',
  'Disabled',
]);
const VALID_NEEDS: ReadonlySet<AssistanceNeed> = new Set([
  'Rescue',
  'Medical',
  'Food / Water',
  'Shelter',
]);
const VALID_TRUST_STATUSES: ReadonlySet<TrustStatus> = new Set([
  'VERIFIED',
  'UNVERIFIED',
  'UNDER_REVIEW',
  'REJECTED',
]);
const VALID_ASSISTANCE_STATUSES: ReadonlySet<AssistanceStatus> = new Set([
  'SUBMITTED',
  'ACCEPTED',
  'DISPATCHED',
  'RESOLVED',
]);
const VALID_CORRIDOR_STATUSES: ReadonlySet<CorridorPassability> = new Set([
  'PASSABLE',
  'SINGLE_LANE',
  'LANDSLIDE_BLOCKED',
  'SUBMERGED',
  'CLOSED',
  'UNKNOWN',
]);
const VALID_CAPACITY_STATUSES: ReadonlySet<CapacityStatus> = new Set([
  'OPEN_AVAILABLE',
  'NEAR_CAPACITY',
  'FULL',
  'TEMPORARILY_CLOSED',
  'UNKNOWN',
]);
const VALID_NGO_TASK_STATUSES: ReadonlySet<NgoTaskStatus> = new Set([
  'PLEDGED',
  'EN_ROUTE',
  'ON_SITE',
  'RELIEF_DELIVERED',
]);
const VALID_VOLUNTEER_AVAILABILITIES: ReadonlySet<VolunteerAvailability> = new Set([
  'AVAILABLE',
  'BUSY',
  'OFFLINE',
]);
const VALID_NGO_CAPABILITIES: ReadonlySet<NgoCapability> = new Set([
  'Boat Rescue',
  'Medical Aid',
  'Food & Water Distribution',
  'Shelter & Evacuation',
  'Road & Debris Support',
]);

const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

export function validateEntityId(id: string, label = 'Record ID'): string {
  const trimmed = typeof id === 'string' ? id.trim() : '';
  if (!SAFE_ID_REGEX.test(trimmed)) {
    throw new ValidationError(`Invalid ${label}.`);
  }
  return trimmed;
}

export function validateActorName(actor: string): string {
  const trimmed = typeof actor === 'string' ? actor.trim() : '';
  if (trimmed.length < 2 || trimmed.length > 80) {
    throw new ValidationError('Coordinator label must be between 2 and 80 characters.');
  }
  return trimmed;
}

export function validateNoteText(text: string): string {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (trimmed.length < 2) {
    throw new ValidationError('Coordinator note must be at least 2 characters.');
  }
  if (trimmed.length > 1000) {
    throw new ValidationError('Coordinator note must be 1,000 characters or fewer.');
  }
  return trimmed;
}

export function validateReportPayload(
  data: OutboxSubmission['reportData']
): OutboxSubmission['reportData'] {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Report payload is required.');
  }
  if (!VALID_MODES.has(data.mode)) {
    throw new ValidationError('Invalid report mode.');
  }
  const districtId = validateEntityId(data.districtId, 'district');
  if (districtId === 'all') {
    throw new ValidationError('Please select a specific district.');
  }
  const districtName = (data.districtName ?? '').trim();
  if (districtName.length < 2 || districtName.length > 100) {
    throw new ValidationError('District name is required.');
  }

  const corridorOrBlock = (data.corridorOrBlock ?? '').trim();
  if (corridorOrBlock.length < 2 || corridorOrBlock.length > 160) {
    throw new ValidationError('Block, ward, or highway corridor must be 2–160 characters.');
  }

  const locality = (data.locality ?? '').trim();
  if (locality.length < 2 || locality.length > 200) {
    throw new ValidationError('Locality or landmark must be 2–200 characters.');
  }

  if (!VALID_CATEGORIES.has(data.category)) {
    throw new ValidationError('Invalid incident category.');
  }
  if (!VALID_SEVERITIES.has(data.severity)) {
    throw new ValidationError('Invalid severity level.');
  }

  const description = (data.description ?? '').trim();
  if (description.length < 12 || description.length > 2000) {
    throw new ValidationError('Situation description must be 12–2,000 characters.');
  }

  const affectedPeopleCount = Number(data.affectedPeopleCount);
  if (
    !Number.isInteger(affectedPeopleCount) ||
    affectedPeopleCount < 1 ||
    affectedPeopleCount > 500
  ) {
    throw new ValidationError('Affected people count must be a whole number between 1 and 500.');
  }

  const contactPhone = (data.contactPhone ?? '').trim();
  const phoneDigits = contactPhone.replace(/\D/g, '');
  if (
    phoneDigits.length < 10 ||
    phoneDigits.length > 15 ||
    contactPhone.length > 25 ||
    !/^[+0-9() -]{10,25}$/.test(contactPhone)
  ) {
    throw new ValidationError('Enter a valid 10–15 digit contact phone number.');
  }

  const reporterName = (data.reporterName ?? '').trim();
  if (reporterName.length < 2 || reporterName.length > 100) {
    throw new ValidationError('Reporter name must be 2–100 characters.');
  }

  let coordinates: { lat: number; lng: number } | null = null;
  if (data.coordinates != null) {
    const lat = Number(data.coordinates.lat);
    const lng = Number(data.coordinates.lng);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw new ValidationError('GPS coordinates must be valid latitude/longitude values.');
    }
    coordinates = { lat, lng };
  }

  const vulnerabilityTags = Array.isArray(data.vulnerabilityTags)
    ? data.vulnerabilityTags.filter((tag) => VALID_VULNERABILITIES.has(tag))
    : [];
  const assistanceNeeds = Array.isArray(data.assistanceNeeds)
    ? data.assistanceNeeds.filter((need) => VALID_NEEDS.has(need))
    : [];

  if (data.mode === 'HELP_REQUEST' && assistanceNeeds.length === 0) {
    throw new ValidationError('Select at least one type of assistance needed.');
  }

  return {
    ...data,
    districtId,
    districtName,
    corridorOrBlock,
    locality,
    coordinates,
    description,
    affectedPeopleCount,
    vulnerabilityTags,
    assistanceNeeds,
    contactPhone,
    reporterName,
    reportingForOthers: Boolean(data.reportingForOthers),
  };
}

export function validateTrustStatus(status: TrustStatus): TrustStatus {
  if (!VALID_TRUST_STATUSES.has(status)) {
    throw new ValidationError('Invalid verification status.');
  }
  return status;
}

export function validateAssistanceStatus(status: AssistanceStatus): AssistanceStatus {
  if (!VALID_ASSISTANCE_STATUSES.has(status)) {
    throw new ValidationError('Invalid assistance status.');
  }
  return status;
}

export function validateCorridorUpdate(
  status: CorridorPassability,
  advisoryNote: string,
  verificationStatus: 'VERIFIED' | 'UNVERIFIED'
): {
  status: CorridorPassability;
  advisoryNote: string;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED';
} {
  if (!VALID_CORRIDOR_STATUSES.has(status)) {
    throw new ValidationError('Invalid corridor passability status.');
  }
  if (verificationStatus !== 'VERIFIED' && verificationStatus !== 'UNVERIFIED') {
    throw new ValidationError('Verification status must be VERIFIED or UNVERIFIED.');
  }
  const trimmedNote = typeof advisoryNote === 'string' ? advisoryNote.trim() : '';
  if (trimmedNote.length < 3 || trimmedNote.length > 500) {
    throw new ValidationError('Corridor advisory note must be 3–500 characters.');
  }
  return { status, advisoryNote: trimmedNote, verificationStatus };
}

export function validateResourceUpdate(
  capacityStatus: CapacityStatus,
  availableSupplies: string[],
  verificationStatus: 'VERIFIED' | 'UNVERIFIED'
): {
  capacityStatus: CapacityStatus;
  availableSupplies: string[];
  verificationStatus: 'VERIFIED' | 'UNVERIFIED';
} {
  if (!VALID_CAPACITY_STATUSES.has(capacityStatus)) {
    throw new ValidationError('Invalid resource capacity status.');
  }
  if (verificationStatus !== 'VERIFIED' && verificationStatus !== 'UNVERIFIED') {
    throw new ValidationError('Verification status must be VERIFIED or UNVERIFIED.');
  }
  if (!Array.isArray(availableSupplies)) {
    throw new ValidationError('Available supplies must be a list.');
  }
  const cleanedSupplies = availableSupplies
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 20);

  if (cleanedSupplies.some((item) => item.length > 80)) {
    throw new ValidationError('Each supply item must be 80 characters or fewer.');
  }

  return {
    capacityStatus,
    availableSupplies: cleanedSupplies,
    verificationStatus,
  };
}

export function validateNgoTaskStatus(status: NgoTaskStatus): NgoTaskStatus {
  if (!VALID_NGO_TASK_STATUSES.has(status)) {
    throw new ValidationError('Invalid NGO operation status.');
  }
  return status;
}

export function validateNgoAssignmentInput(input: {
  reportId: string;
  volunteerName: string;
  organization: string;
  capability: NgoCapability;
  note?: string;
}): {
  reportId: string;
  volunteerName: string;
  organization: string;
  capability: NgoCapability;
  note: string;
} {
  const reportId = validateEntityId(input.reportId, 'report ID');
  const volunteerName = typeof input.volunteerName === 'string' ? input.volunteerName.trim() : '';
  if (volunteerName.length < 2 || volunteerName.length > 80) {
    throw new ValidationError('Volunteer or lead name must be 2–80 characters.');
  }
  const organization = typeof input.organization === 'string' ? input.organization.trim() : '';
  if (organization.length < 2 || organization.length > 100) {
    throw new ValidationError('NGO or group name must be 2–100 characters.');
  }
  if (!VALID_NGO_CAPABILITIES.has(input.capability)) {
    throw new ValidationError('Invalid volunteer capability selected.');
  }
  const note = typeof input.note === 'string' ? input.note.trim() : '';
  if (note.length > 500) {
    throw new ValidationError('Assignment note must be 500 characters or fewer.');
  }
  return { reportId, volunteerName, organization, capability: input.capability, note };
}

export function validateVolunteerProfileInput(
  profile: Omit<VolunteerProfile, 'updatedAt'>
): Omit<VolunteerProfile, 'updatedAt'> {
  const id = validateEntityId(profile.id, 'volunteer profile ID');
  const name = typeof profile.name === 'string' ? profile.name.trim() : '';
  if (name.length < 2 || name.length > 80) {
    throw new ValidationError('Volunteer name must be 2–80 characters.');
  }
  const organization = typeof profile.organization === 'string' ? profile.organization.trim() : '';
  if (organization.length < 2 || organization.length > 100) {
    throw new ValidationError('Organization or team name must be 2–100 characters.');
  }
  const districtId = validateEntityId(profile.districtId, 'coverage district');
  if (!VALID_NGO_CAPABILITIES.has(profile.capability)) {
    throw new ValidationError('Invalid team capability.');
  }
  if (!VALID_VOLUNTEER_AVAILABILITIES.has(profile.availability)) {
    throw new ValidationError('Invalid availability status.');
  }
  const teamSize = Number(profile.teamSize);
  if (!Number.isInteger(teamSize) || teamSize < 1 || teamSize > 500) {
    throw new ValidationError('Team size must be a whole number between 1 and 500.');
  }
  if (!Array.isArray(profile.resourceInventory)) {
    throw new ValidationError('Resource inventory must be a list.');
  }
  const resourceInventory = profile.resourceInventory
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 25);

  if (resourceInventory.some((item) => item.length > 80)) {
    throw new ValidationError('Each inventory item must be 80 characters or fewer.');
  }

  return {
    id,
    name,
    organization,
    districtId,
    capability: profile.capability,
    availability: profile.availability,
    teamSize,
    resourceInventory,
  };
}

