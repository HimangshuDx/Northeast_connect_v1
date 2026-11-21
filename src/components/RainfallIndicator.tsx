import React, { useEffect, useState } from 'react';
import { CloudDrizzle, CloudLightning, CloudRain, Info, WifiOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NORTHEAST_DISTRICTS } from '../data/districts';
import { formatSyncAge } from '../utils/formatters';
import { SkeletonCard } from './SkeletonCard';

interface DailyRain {
  date: string;
  mm: number;
}

interface CachedRainfall {
  districtId: string;
  districtName: string;
  fetchedAt: string;
  days: DailyRain[];
}

const CACHE_PREFIX = 'ne_connect_rainfall_cache_v1_';

function classifyRainfall(mm: number): {
  level: 'Low' | 'Medium' | 'High';
  label: string;
  classes: string;
  Icon: React.FC<{ className?: string; 'aria-hidden'?: boolean }>;
} {
  if (mm > 80) {
    return {
      level: 'High',
      label: 'High (>80 mm)',
      classes:
        'border-red-200 bg-red-50 text-red-900 dark:border-red-800/70 dark:bg-red-950/50 dark:text-red-200',
      Icon: CloudLightning,
    };
  }
  if (mm >= 30) {
    return {
      level: 'Medium',
      label: 'Medium (30–80 mm)',
      classes:
        'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-200',
      Icon: CloudRain,
    };
  }
  return {
    level: 'Low',
    label: 'Low (<30 mm)',
    classes:
      'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/70 dark:bg-emerald-950/50 dark:text-emerald-200',
    Icon: CloudDrizzle,
  };
}

function formatDayLabel(dateIso: string, idx: number): string {
  if (idx === 0) return 'Today';
  if (idx === 1) return 'Tomorrow';
  try {
    return new Date(`${dateIso}T00:00:00`).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return dateIso;
  }
}

export const RainfallIndicator: React.FC = () => {
  const { selectedDistrictId, isOnline } = useApp();
  const district =
    NORTHEAST_DISTRICTS.find((d) => d.id === selectedDistrictId) ?? NORTHEAST_DISTRICTS[0];
  const displayDistrict =
    district.id === 'all' ? 'Guwahati Regional Center (All NE)' : district.name;

  const [data, setData] = useState<CachedRainfall | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [usingCacheFallback, setUsingCacheFallback] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `${CACHE_PREFIX}${district.id}`;

    const loadCached = (): CachedRainfall | null => {
      try {
        const raw = localStorage.getItem(cacheKey);
        return raw ? (JSON.parse(raw) as CachedRainfall) : null;
      } catch {
        return null;
      }
    };

    const run = async () => {
      setLoading(true);
      setUsingCacheFallback(false);

      if (!isOnline) {
        const cached = loadCached();
        if (!cancelled) {
          setData(cached);
          setUsingCacheFallback(true);
          setLoading(false);
        }
        return;
      }

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${district.lat}&longitude=${district.lng}&daily=precipitation_sum&forecast_days=3&timezone=auto`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = (await resp.json()) as {
          daily?: { time?: string[]; precipitation_sum?: (number | null)[] };
        };
        const times = json.daily?.time ?? [];
        const sums = json.daily?.precipitation_sum ?? [];
        const days: DailyRain[] = times.slice(0, 3).map((date, idx) => ({
          date,
          mm: Math.round((Number(sums[idx] ?? 0) || 0) * 10) / 10,
        }));
        const fresh: CachedRainfall = {
          districtId: district.id,
          districtName: displayDistrict,
          fetchedAt: new Date().toISOString(),
          days,
        };
        try {
          localStorage.setItem(cacheKey, JSON.stringify(fresh));
        } catch {
          // ignore quota
        }
        if (!cancelled) {
          setData(fresh);
          setUsingCacheFallback(false);
          setLoading(false);
        }
      } catch {
        const cached = loadCached();
        if (!cancelled) {
          setData(cached);
          setUsingCacheFallback(true);
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [district.id, district.lat, district.lng, displayDistrict, isOnline]);

  if (loading) {
    return <SkeletonCard lines={2} />;
  }

  return (
    <section
      aria-label="District Rainfall Indicator"
      className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            3-Day Rainfall Indicator — {displayDistrict}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Rainfall indicator from Open-Meteo. Not an official forecast.</span>
          </p>
        </div>

        {usingCacheFallback && data && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-200">
            <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Cached {formatSyncAge(data.fetchedAt)}</span>
          </span>
        )}
      </div>

      {!data || data.days.length === 0 ? (
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
          Offline or rainfall feed unavailable, and no cached rainfall reading exists for this district yet.
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {data.days.map((day, idx) => {
            const cls = classifyRainfall(day.mm);
            const Icon = cls.Icon;
            return (
              <div
                key={day.date}
                className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 ${cls.classes}`}
              >
                <div>
                  <p className="text-xs font-medium opacity-85">{formatDayLabel(day.date, idx)}</p>
                  <p className="mt-0.5 font-mono text-base font-bold tabular-nums">
                    {day.mm.toFixed(1)} mm
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden={true} />
                  <span>{cls.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
