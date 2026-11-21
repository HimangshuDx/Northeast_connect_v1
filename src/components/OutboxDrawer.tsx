import React, { useEffect, useState } from 'react';
import {
  Edit3,
  Inbox,
  MessageSquareShare,
  RefreshCw,
  Trash2,
  WifiOff,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { OutboxSubmission } from '../types';
import { buildSmsShareUrl, formatTimestamp } from '../utils/formatters';
import { ConfirmationDialog } from './ConfirmationDialog';
import { EmptyState } from './EmptyState';
import { StatusPill } from './StatusPill';

export const OutboxDrawer: React.FC = () => {
  const {
    isOutboxOpen,
    setIsOutboxOpen,
    outbox,
    isOnline,
    retryOutboxItem,
    deleteOutboxItem,
    syncPendingOutbox,
    setEditingOutboxItem,
    addToast,
    t,
  } = useApp();

  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<OutboxSubmission | null>(null);

  useEffect(() => {
    if (!isOutboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleteTarget) {
        setIsOutboxOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOutboxOpen, deleteTarget, setIsOutboxOpen]);

  if (!isOutboxOpen) return null;

  const pendingOrFailed = outbox.filter(
    (item) => item.syncStatus === 'PENDING' || item.syncStatus === 'FAILED'
  );

  const handleEdit = (item: OutboxSubmission) => {
    setEditingOutboxItem(item);
    setIsOutboxOpen(false);
    navigate(`/report?edit=${encodeURIComponent(item.id)}`);
  };

  const handleSmsClick = () => {
    addToast({
      type: 'info',
      title: 'Opening SMS composer',
      description: 'Opens your SMS app. We cannot confirm delivery.',
    });
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.outbox.title}
        className="fixed inset-0 z-40 flex justify-end bg-slate-950/60 backdrop-blur-xs"
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsOutboxOpen(false);
        }}
      >
        <div className="flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Inbox className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  {t.outbox.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {outbox.length} total · {pendingOrFailed.length} {t.offlineBanner.queuedSuffix}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOutboxOpen(false)}
              aria-label="Close My Outbox"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Connectivity & Sync Bar */}
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/70">
            {!isOnline ? (
              <div className="flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">{t.outbox.offlineNotice}</p>
                  <p className="mt-0.5 text-amber-700 dark:text-amber-300/90">
                    {t.outbox.offlineSub}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {t.outbox.onlineSub}
                </p>
                <button
                  type="button"
                  disabled={pendingOrFailed.length === 0}
                  onClick={() => void syncPendingOutbox()}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {t.outbox.syncQueued} ({pendingOrFailed.length})
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Outbox Items */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {outbox.length === 0 ? (
              <EmptyState
                title={t.outbox.emptyTitle}
                description={t.outbox.emptySub}
                actionLabel={t.outbox.createBtn}
                onAction={() => {
                  setIsOutboxOpen(false);
                  navigate('/report');
                }}
              />
            ) : (
              outbox.map((item) => {
                const { reportData } = item;
                const canModify = item.syncStatus !== 'SYNCED' && item.syncStatus !== 'SYNCING';

                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {reportData.mode === 'HELP_REQUEST' ? 'Urgent Help' : 'Hazard Report'}
                          <span aria-hidden="true"> · </span>
                          <span>{reportData.category}</span>
                        </p>
                        <h3 className="mt-0.5 font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {reportData.locality} ({reportData.districtName})
                        </h3>
                      </div>
                      <StatusPill kind="outbox" value={item.syncStatus} />
                    </div>

                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {reportData.description}
                    </p>

                    <p className="mt-2 font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                      Created: {formatTimestamp(item.createdAt)} · {reportData.affectedPeopleCount} affected
                    </p>

                    {item.errorMessage && (
                      <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
                        {item.errorMessage}
                      </p>
                    )}

                    {/* Action Row */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                      {canModify && (
                        <>
                          <button
                            type="button"
                            onClick={() => void retryOutboxItem(item.id)}
                            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap shrink-0"
                          >
                            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{t.outbox.retry}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
                          >
                            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{t.outbox.edit}</span>
                          </button>
                        </>
                      )}

                      <a
                        href={buildSmsShareUrl(item)}
                        onClick={handleSmsClick}
                        title="Opens your SMS app. We cannot confirm delivery."
                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
                      >
                        <MessageSquareShare className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t.outbox.shareSms}</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="ml-auto inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/60 whitespace-nowrap shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t.outbox.deleteBtn}</span>
                      </button>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      {t.reportPage.smsNotice}
                    </p>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete Outbox Entry?"
        description={
          deleteTarget
            ? `Remove "${deleteTarget.reportData.locality}" from your device outbox? Unsent entries cannot be recovered.`
            : ''
        }
        confirmLabel="Delete Entry"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void deleteOutboxItem(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
      />
    </>
  );
};
