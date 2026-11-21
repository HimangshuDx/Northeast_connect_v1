import React from 'react';
import { PhoneCall, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const EmergencyStrip: React.FC = () => {
  const { addToast, t } = useApp();

  const handleCallClick = () => {
    addToast({
      type: 'info',
      title: 'Dialing 112 National Emergency',
      description: 'If your device lacks calling support, dial 112 from any mobile phone.',
    });
  };

  return (
    <div
      role="region"
      aria-label="Emergency 112 hotline"
      className="rounded-xl border border-red-700/20 bg-red-700 px-4 py-3 text-white shadow-sm dark:border-red-500/35 dark:bg-gradient-to-r dark:from-[#26121b] dark:via-[#22121a] dark:to-[#181524] dark:text-[#eef2f7]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 dark:bg-red-500/20 dark:text-red-300 dark:ring-red-500/30">
            <AlertCircle className="h-5 w-5 text-white dark:text-red-300" aria-hidden="true" />
          </div>
          <div>
            <p className="font-display text-sm font-bold tracking-tight sm:text-base">
              {t.emergencyStrip.headline}
            </p>
            <p className="text-xs text-red-100 dark:text-red-200/85">
              {t.emergencyStrip.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href="tel:112"
            onClick={handleCallClick}
            className="ne-btn-press inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-xs hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white whitespace-nowrap shrink-0 dark:bg-red-600 dark:text-white dark:hover:bg-red-500"
          >
            <PhoneCall className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t.emergencyStrip.call112Now}</span>
          </a>
          <Link
            to="/report?mode=sos"
            className="ne-btn-press inline-flex min-h-[40px] items-center justify-center rounded-lg border border-white/30 bg-red-800/70 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white whitespace-nowrap shrink-0 dark:border-red-400/30 dark:bg-red-950/70 dark:text-red-100 dark:hover:bg-red-900/80"
          >
            {t.emergencyStrip.requestUrgentHelp}
          </Link>
        </div>
      </div>
    </div>
  );
};
