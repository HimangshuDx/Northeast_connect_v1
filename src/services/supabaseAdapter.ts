import { DataAdapter } from './dataAdapter';

/**
 * Architectural placeholder adapter showing clean drop-in compatibility for a
 * future Supabase backend without coupling UI components to database calls.
 */
export function createSupabaseAdapterPlaceholder(): DataAdapter {
  const notConfigured = () => {
    throw new Error(
      'SupabaseAdapter is not configured in this prototype. Using LocalAdapter.'
    );
  };

  return {
    loadSnapshot: notConfigured,
    resetDemoData: notConfigured,
    submitReport: notConfigured,
    retryOutboxItem: notConfigured,
    deleteOutboxItem: notConfigured,
    toggleConfirmReport: notConfigured,
    updateReportVerification: notConfigured,
    updateReportAssistance: notConfigured,
    assignReportUnit: notConfigured,
    addReportNote: notConfigured,
    mergeReports: notConfigured,
    updateCorridorStatus: notConfigured,
    updateResourceCapacity: notConfigured,
    recordSyncTimestamp: notConfigured,
  };
}
