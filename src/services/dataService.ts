import { DataAdapter } from './dataAdapter';
import { LocalAdapter } from './localAdapter';

/**
 * Central dataService entrypoint used by application state hooks.
 * Swap LocalAdapter for SupabaseAdapter here without changing UI components.
 */
export const dataService: DataAdapter = new LocalAdapter();
