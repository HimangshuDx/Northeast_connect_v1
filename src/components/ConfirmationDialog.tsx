import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { NE_EASE } from './MotionPrimitives';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm-dialog-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: NE_EASE }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCancel();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.18, ease: NE_EASE }}
            className="w-full max-w-md rounded-2xl border ne-surface-elevated p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    destructive
                      ? 'bg-red-50 text-red-600 ring-1 ring-red-200/70 dark:bg-red-950/70 dark:text-red-400 dark:ring-red-500/30'
                      : 'bg-blue-50 text-blue-600 ring-1 ring-blue-200/70 dark:bg-blue-950/70 dark:text-blue-400 dark:ring-blue-500/30'
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3
                    id="confirm-dialog-title"
                    className="font-display text-base font-semibold text-slate-900 dark:text-[#e6edf7]"
                  >
                    {title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-[#9cb0cc]">
                    {description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCancel}
                aria-label="Close dialog"
                className="ne-btn-press rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-[#8295b3] dark:hover:bg-[#1c2d49] dark:hover:text-[#e6edf7]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                className="ne-btn-press min-h-[40px] rounded-lg border border-[#c2cfe2] bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`ne-btn-press min-h-[40px] rounded-lg px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  destructive
                    ? 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-500'
                    : 'bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-500'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
