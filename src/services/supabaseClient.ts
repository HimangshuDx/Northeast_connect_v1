import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Public client-side Supabase configuration.
 * Reads ONLY the public URL and publishable anon key from Vite env vars.
 * Never place or reference any service_role key or private database secret in frontend code.
 */
const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

function isValidHttpUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const supabaseUrl = rawUrl;
export const supabaseAnonKey = rawAnonKey;

export const supabaseConfigError: string | null =
  rawUrl && !isValidHttpUrl(rawUrl)
    ? 'VITE_SUPABASE_URL must be a valid http(s) URL.'
    : (rawUrl && !rawAnonKey) || (!rawUrl && rawAnonKey)
    ? 'Both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set together.'
    : null;

export const isSupabaseConfigured = Boolean(
  !supabaseConfigError && isValidHttpUrl(rawUrl) && rawAnonKey
);

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!cachedClient) {
    cachedClient = createClient(rawUrl, rawAnonKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  return cachedClient;
}
