import React from 'react';
import { WifiOff, Inbox, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline, realOnline, simulatedOffline, setSimulatedOffline, outbox, setIsOutboxOpen, t } =
    useApp();

  if (isOnline) return null;

  const isActualOffline = !realOnline;

  const pendingCount = outbox.filter(
    (item) => item.syncStatus === 'PENDING' || item.syncStatus === 'FAILED'
  ).length;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-700/70 dark:bg-amber-950/60 dark:text-amber-100"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold">
              {isActualOffline ? t.offlineBanner.actualTitle : t.offlineBanner.simulatedTitle}
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-200/90 mt-0.5">
              {t.offlineBanner.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsOutboxOpen(true)}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-950 transition-colors hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-900/70 dark:text-amber-50 dark:hover:bg-amber-900 whitespace-nowrap shrink-0"
          >
            <Inbox className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {t.nav.myOutbox} ({pendingCount} {t.offlineBanner.queuedSuffix})
            </span>
          </button>

          {!isActualOffline && simulatedOffline && (
            <button
              type="button"
              onClick={() => setSimulatedOffline(false)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-900 dark:bg-amber-600 dark:hover:bg-amber-500 whitespace-nowrap shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{t.offlineBanner.goOnline}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
