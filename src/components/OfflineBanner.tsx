import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { WifiOff, Inbox, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NE_EASE } from './MotionPrimitives';

export const OfflineBanner: React.FC = () => {
  const { isOnline, realOnline, simulatedOffline, setSimulatedOffline, outbox, setIsOutboxOpen, t } =
    useApp();

  const isActualOffline = !realOnline;

  const pendingCount = outbox.filter(
    (item) => item.syncStatus === 'PENDING' || item.syncStatus === 'FAILED'
  ).length;

  return (
    <AnimatePresence initial={false}>
      {!isOnline && (
        <motion.div
          key="offline-banner"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: NE_EASE }}
          role="status"
          aria-live="polite"
          className="rounded-xl border border-amber-300/90 bg-amber-50 px-4 py-3 text-amber-950 shadow-xs dark:border-amber-500/35 dark:bg-[#1e1a14] dark:text-amber-100"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <WifiOff
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300"
                aria-hidden="true"
              />
              <div className="text-sm">
                <p className="font-semibold">
                  {isActualOffline ? t.offlineBanner.actualTitle : t.offlineBanner.simulatedTitle}
                </p>
                <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-200/85">
                  {t.offlineBanner.subtitle}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsOutboxOpen(true)}
                className="ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-amber-400/80 bg-white px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-950/60 dark:text-amber-100 dark:hover:bg-amber-900/70 whitespace-nowrap shrink-0"
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
                  className="ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{t.offlineBanner.goOnline}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
