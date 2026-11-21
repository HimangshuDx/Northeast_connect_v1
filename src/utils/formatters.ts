import { OutboxSubmission } from '../types';

export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function formatRelativeAge(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    if (diffMs < 60_000) return 'Just now';
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return 'Unknown time';
  }
}

export function formatSyncAge(isoString: string): string {
  try {
    const diffMs = Math.max(0, Date.now() - new Date(isoString).getTime());
    if (diffMs < 60_000) return 'just now';
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} d ago`;
  } catch {
    return 'unknown';
  }
}

export function createClientUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ne-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isItemStale(isoString: string, explicitStale?: boolean, expiresAt?: string): boolean {
  if (explicitStale) return true;
  if (expiresAt) {
    const exp = new Date(expiresAt).getTime();
    if (!Number.isNaN(exp) && exp < Date.now()) return true;
  }
  const ageHours = (Date.now() - new Date(isoString).getTime()) / 3_600_000;
  return ageHours > 18;
}

export function buildSmsShareUrl(submission: OutboxSubmission): string {
  const { reportData } = submission;
  const typeLabel = reportData.mode === 'HELP_REQUEST' ? 'URGENT HELP' : 'HAZARD REPORT';
  const lines = [
    `[Northeast Connect - ${typeLabel}]`,
    `District: ${reportData.districtName}`,
    `Location: ${reportData.corridorOrBlock}, ${reportData.locality}`,
    `Category: ${reportData.category} (${reportData.severity})`,
    `People affected: ${reportData.affectedPeopleCount}`,
    reportData.vulnerabilityTags.length > 0
      ? `Vulnerabilities: ${reportData.vulnerabilityTags.join(', ')}`
      : null,
    reportData.assistanceNeeds.length > 0
      ? `Needs: ${reportData.assistanceNeeds.join(', ')}`
      : null,
    reportData.coordinates
      ? `GPS: ${reportData.coordinates.lat.toFixed(4)}, ${reportData.coordinates.lng.toFixed(4)}`
      : null,
    `Contact: ${reportData.reporterName} (${reportData.contactPhone})`,
    `Note: ${reportData.description.slice(0, 140)}`,
  ]
    .filter(Boolean)
    .join('\n');

  return `sms:?body=${encodeURIComponent(lines)}`;
}
