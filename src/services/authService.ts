import { AuthSessionState, OrganizationProfile, UserRole } from '../types';
import {
  EPHEMERAL_TAB_SESSION_KEY,
  getSupabaseClient,
  isSupabaseConfigured,
  REMEMBER_ME_MODE_KEY,
  supabaseConfigError,
} from './supabaseClient';

const DEMO_AUTH_KEY = 'ne_connect_demo_auth_v1';
const COORD_AUTH_KEY = 'ne_connect_coord_auth';

export interface DemoAccountSpec {
  email: string;
  fullName: string;
  organizationName: string;
  role: 'NGO_MEMBER' | 'VOLUNTEER' | 'COORDINATOR';
  districtId: string;
  description: string;
}

export const DEMO_ACCOUNTS: DemoAccountSpec[] = [
  {
    email: 'demo.ngo@northeastconnect.demo',
    fullName: 'Ananya Das',
    organizationName: 'Brahmaputra River Relief Collective',
    role: 'NGO_MEMBER',
    districtId: 'kamrup-metro',
    description: 'Accesses Relief Operations Dashboard; blocked from Coordinator Desk.',
  },
  {
    email: 'demo.volunteer@northeastconnect.demo',
    fullName: 'Rohan Deb',
    organizationName: 'Barak Valley Rapid Volunteers',
    role: 'VOLUNTEER',
    districtId: 'cachar',
    description: 'Accesses Relief Operations & team availability; blocked from Coordinator Desk.',
  },
  {
    email: 'demo.coordinator@northeastconnect.demo',
    fullName: 'Duty Coordinator (Demo)',
    organizationName: 'ASDMA District Control Room (Demo)',
    role: 'COORDINATOR',
    districtId: 'kamrup-metro',
    description: 'Full access to Coordinator Desk verification & Relief Operations.',
  },
];

export const GUEST_CITIZEN_SESSION: AuthSessionState = {
  userId: null,
  email: null,
  fullName: 'Citizen Guest',
  organizationName: null,
  role: 'CITIZEN',
  districtId: null,
  mode: 'guest',
  isDemo: false,
  isAuthenticated: false,
};

const VALID_ORG_ROLES: ReadonlySet<OrganizationProfile['role']> = new Set([
  'NGO_MEMBER',
  'VOLUNTEER',
  'COORDINATOR',
  'ADMIN',
]);

export function canAccessNgoOperations(role: UserRole): boolean {
  return (
    role === 'NGO_MEMBER' ||
    role === 'VOLUNTEER' ||
    role === 'COORDINATOR' ||
    role === 'ADMIN'
  );
}

export function canAccessCoordinatorDesk(role: UserRole): boolean {
  return role === 'COORDINATOR' || role === 'ADMIN';
}

export function getRoleDisplayLabel(role: UserRole): string {
  switch (role) {
    case 'NGO_MEMBER':
      return 'NGO Partner';
    case 'VOLUNTEER':
      return 'Registered Volunteer';
    case 'COORDINATOR':
      return 'Disaster Coordinator';
    case 'ADMIN':
      return 'System Admin';
    default:
      return 'Citizen Guest';
  }
}

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

function syncCoordinatorSessionFlag(role: UserRole): void {
  try {
    if (canAccessCoordinatorDesk(role)) {
      sessionStorage.setItem(COORD_AUTH_KEY, '1');
    } else {
      sessionStorage.removeItem(COORD_AUTH_KEY);
    }
  } catch {
    // Ignore storage unavailability
  }
}

function clearDemoAuthStorage(): void {
  try {
    sessionStorage.removeItem(DEMO_AUTH_KEY);
    localStorage.removeItem(DEMO_AUTH_KEY);
  } catch {
    // Ignore storage unavailability
  }
}

function readDemoSession(): AuthSessionState | null {
  try {
    const raw =
      sessionStorage.getItem(DEMO_AUTH_KEY) ?? localStorage.getItem(DEMO_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: string };
    const matched = DEMO_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === (parsed.email ?? '').toLowerCase()
    );
    if (!matched) {
      clearDemoAuthStorage();
      return null;
    }
    return {
      userId: `demo-${matched.role.toLowerCase()}`,
      email: matched.email,
      fullName: matched.fullName,
      organizationName: matched.organizationName,
      role: matched.role,
      districtId: matched.districtId,
      mode: 'demo',
      isDemo: true,
      isAuthenticated: true,
    };
  } catch {
    return null;
  }
}

interface OrgProfileRow {
  user_id: string;
  email: string;
  full_name: string;
  organization_name: string;
  role: OrganizationProfile['role'];
  district_id: string | null;
  is_active: boolean;
}

function extractAppMetadataRole(user: {
  app_metadata?: Record<string, unknown>;
}): OrganizationProfile['role'] | null {
  const rawRole =
    typeof user.app_metadata?.role === 'string'
      ? user.app_metadata.role.trim().toUpperCase()
      : '';
  if (VALID_ORG_ROLES.has(rawRole as OrganizationProfile['role'])) {
    return rawRole as OrganizationProfile['role'];
  }
  return null;
}

async function fetchOrganizationProfile(user: {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): Promise<OrganizationProfile | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('organization_profiles')
    .select('user_id, email, full_name, organization_name, role, district_id, is_active')
    .eq('user_id', user.id)
    .maybeSingle();

  if (data) {
    const row = data as OrgProfileRow;
    if (!row.is_active || !VALID_ORG_ROLES.has(row.role)) {
      return null;
    }
    return {
      userId: row.user_id,
      email: row.email,
      fullName: row.full_name,
      organizationName: row.organization_name,
      role: row.role,
      districtId: row.district_id,
      isActive: row.is_active,
    };
  }

  // Fallback: trust server-assigned JWT app_metadata.role (never user_metadata)
  const jwtRole = extractAppMetadataRole(user);
  if (jwtRole) {
    const fullName =
      typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
        ? user.user_metadata.full_name.trim()
        : (user.email?.split('@')[0] ?? 'Authorized Responder');
    const orgName =
      typeof user.app_metadata?.organization_name === 'string' &&
      user.app_metadata.organization_name.trim()
        ? user.app_metadata.organization_name.trim()
        : 'Northeast Connect Control Room';
    return {
      userId: user.id,
      email: user.email ?? '',
      fullName,
      organizationName: orgName,
      role: jwtRole,
      districtId:
        typeof user.app_metadata?.district_id === 'string'
          ? user.app_metadata.district_id
          : null,
      isActive: true,
    };
  }

  if (error) {
    throw new Error(
      `Could not verify organization role from database (${error.message}).`
    );
  }
  return null;
}

export async function getCurrentAuthSession(): Promise<AuthSessionState> {
  const client = getSupabaseClient();

  if (client && isSupabaseConfigured) {
    // In live Supabase mode, never allow browser-local demo sessionStorage bypass
    clearDemoAuthStorage();
    try {
      const {
        data: { session },
      } = await client.auth.getSession();

      if (session?.user) {
        let rememberPreference = 'persist';
        let tabActive = false;
        try {
          rememberPreference = localStorage.getItem(REMEMBER_ME_MODE_KEY) ?? 'persist';
          tabActive = sessionStorage.getItem(EPHEMERAL_TAB_SESSION_KEY) === '1';
        } catch {
          // ignore
        }

        if (rememberPreference === 'session' && !tabActive) {
          await client.auth.signOut();
          syncCoordinatorSessionFlag('CITIZEN');
          return GUEST_CITIZEN_SESSION;
        }

        const profile = await fetchOrganizationProfile(session.user);
        if (!profile) {
          await client.auth.signOut();
          syncCoordinatorSessionFlag('CITIZEN');
          return GUEST_CITIZEN_SESSION;
        }
        syncCoordinatorSessionFlag(profile.role);
        return {
          userId: profile.userId,
          email: profile.email,
          fullName: profile.fullName,
          organizationName: profile.organizationName,
          role: profile.role,
          districtId: profile.districtId,
          mode: 'supabase',
          isDemo: false,
          isAuthenticated: true,
        };
      }
    } catch {
      // Fall back to unauthenticated citizen guest session on network/schema error
    }

    syncCoordinatorSessionFlag('CITIZEN');
    return GUEST_CITIZEN_SESSION;
  }

  // Zero-config LocalAdapter mode: demo accounts work locally and are clearly marked DEMO ONLY
  const demoSession = readDemoSession();
  if (demoSession) {
    syncCoordinatorSessionFlag(demoSession.role);
    return demoSession;
  }

  syncCoordinatorSessionFlag('CITIZEN');
  return GUEST_CITIZEN_SESSION;
}

export async function signInWithSupabase(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<AuthSessionState> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!isValidEmail(trimmedEmail)) {
    throw new Error('Enter a valid organization email address.');
  }
  if (!password || password.length < 6) {
    throw new Error('Enter your password (minimum 6 characters).');
  }

  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) {
    throw new Error(
      supabaseConfigError ??
        'Supabase Authentication is not configured in this environment. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or use the clearly labeled Demo Only accounts below.'
    );
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Invalid organization email or password.');
  }

  try {
    localStorage.setItem(REMEMBER_ME_MODE_KEY, rememberMe ? 'persist' : 'session');
    sessionStorage.setItem(EPHEMERAL_TAB_SESSION_KEY, '1');
  } catch {
    // ignore
  }

  const profile = await fetchOrganizationProfile(data.user);
  if (!profile) {
    await client.auth.signOut();
    syncCoordinatorSessionFlag('CITIZEN');
    throw new Error(
      'Your account signed in, but no active organization role exists in public.organization_profiles or JWT app_metadata.role. Ask an administrator to assign your role.'
    );
  }

  clearDemoAuthStorage();
  syncCoordinatorSessionFlag(profile.role);

  return {
    userId: profile.userId,
    email: profile.email,
    fullName: profile.fullName,
    organizationName: profile.organizationName,
    role: profile.role,
    districtId: profile.districtId,
    mode: 'supabase',
    isDemo: false,
    isAuthenticated: true,
  };
}

export async function signInWithDemoAccount(
  demoEmail: string,
  rememberMe = false
): Promise<AuthSessionState> {
  if (isSupabaseConfigured) {
    throw new Error(
      'Demo accounts are disabled when live Supabase is connected. Sign in with a real Supabase Auth organization account.'
    );
  }

  const matched = DEMO_ACCOUNTS.find(
    (acc) => acc.email.toLowerCase() === demoEmail.trim().toLowerCase()
  );
  if (!matched) {
    throw new Error('Selected demo account is not recognized.');
  }

  clearDemoAuthStorage();
  const payload = JSON.stringify({ email: matched.email });
  try {
    sessionStorage.setItem(DEMO_AUTH_KEY, payload);
    if (rememberMe) {
      localStorage.setItem(DEMO_AUTH_KEY, payload);
    }
  } catch {
    // ignore
  }

  syncCoordinatorSessionFlag(matched.role);

  return {
    userId: `demo-${matched.role.toLowerCase()}`,
    email: matched.email,
    fullName: matched.fullName,
    organizationName: matched.organizationName,
    role: matched.role,
    districtId: matched.districtId,
    mode: 'demo',
    isDemo: true,
    isAuthenticated: true,
  };
}

export async function requestPasswordRecovery(email: string): Promise<void> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!isValidEmail(trimmedEmail)) {
    throw new Error('Enter a valid organization email address to receive a recovery link.');
  }

  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured) {
    throw new Error(
      'Password recovery emails require configured Supabase Auth (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY). Demo accounts do not use email recovery.'
    );
  }

  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/login?reset=1` : undefined;
  const { error } = await client.auth.resetPasswordForEmail(trimmedEmail, {
    redirectTo,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signOutAuth(): Promise<AuthSessionState> {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured) {
    try {
      await client.auth.signOut();
    } catch {
      // ignore
    }
  }
  clearDemoAuthStorage();
  try {
    localStorage.removeItem(REMEMBER_ME_MODE_KEY);
    sessionStorage.removeItem(EPHEMERAL_TAB_SESSION_KEY);
  } catch {
    // ignore
  }
  syncCoordinatorSessionFlag('CITIZEN');
  return GUEST_CITIZEN_SESSION;
}
