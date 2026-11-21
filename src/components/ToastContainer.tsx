import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NE_EASE } from './MotionPrimitives';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  const iconMap = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
  };

  const colorMap = {
    info: 'border-blue-200 bg-white text-slate-900 dark:border-blue-500/35 dark:bg-[#101b2e] dark:text-[#e6edf7]',
    success:
      'border-emerald-200 bg-white text-slate-900 dark:border-emerald-500/35 dark:bg-[#101b2e] dark:text-[#e6edf7]',
    warning:
      'border-amber-200 bg-white text-slate-900 dark:border-amber-500/35 dark:bg-[#101b2e] dark:text-[#e6edf7]',
    error:
      'border-red-200 bg-white text-slate-900 dark:border-red-500/35 dark:bg-[#101b2e] dark:text-[#e6edf7]',
  };

  const iconColorMap = {
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
  };

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-20 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 md:bottom-5"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: NE_EASE }}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg ${colorMap[toast.type]}`}
            >
              <Icon
                className={`mt-0.5 h-5 w-5 shrink-0 ${iconColorMap[toast.type]}`}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-[#9cb0cc]">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="ne-btn-press -mr-1.5 -mt-1.5 inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-[#9cb0cc] dark:hover:bg-[#172742] dark:hover:text-[#e6edf7]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
