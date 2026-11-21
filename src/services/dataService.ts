import { DataAdapter } from './dataAdapter';
import { LocalAdapter } from './localAdapter';
import { createSupabaseAdapter } from './supabaseAdapter';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseConfigError,
  supabaseUrl,
} from './supabaseClient';

export { isSupabaseConfigured, supabaseConfigError };

if (supabaseConfigError) {
  console.warn(`[Northeast Connect] ${supabaseConfigError} Falling back to local demo storage.`);
}

/**
 * Central dataService entrypoint used by application state hooks.
 * Uses SupabaseAdapter when both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are valid;
 * otherwise defaults to zero-config LocalAdapter (localStorage demo mode).
 */
export const dataService: DataAdapter = isSupabaseConfigured
  ? createSupabaseAdapter(supabaseUrl, supabaseAnonKey, getSupabaseClient() ?? undefined)
  : new LocalAdapter();

