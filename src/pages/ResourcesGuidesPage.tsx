import React, { useMemo, useState } from 'react';
import {
  Activity,
  CheckSquare,
  Globe,
  Mountain,
  PhoneCall,
  Search,
  Waves,
} from 'lucide-react';
import { EmergencyStrip } from '../components/EmergencyStrip';
import { EmptyState } from '../components/EmptyState';
import { OfflineBanner } from '../components/OfflineBanner';
import { ResourceCard } from '../components/ResourceCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { DemoDataNoticeBadge } from '../components/TrustBadge';
import { useApp } from '../context/AppContext';
import { EMERGENCY_HELPLINES } from '../data/sampleData';
import { LANGUAGE_LABELS, SAFETY_GUIDES } from '../data/safetyGuides';
import { LanguageCode, ResourceCategory } from '../types';

export const ResourcesGuidesPage: React.FC = () => {
  const { resources, selectedDistrictId, isLoading, language, setLanguage, t } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<'All' | ResourceCategory>('All');
  const [resourceSearch, setResourceSearch] = useState('');
  const [activeGuideId, setActiveGuideId] = useState<'flood' | 'landslide' | 'earthquake'>('flood');

  const categoryTabs: { key: 'All' | ResourceCategory; label: string }[] = [
    { key: 'All', label: t.resourcesPage.allCategories },
    { key: 'Relief Camps', label: t.resourcesPage.reliefCamps },
    { key: 'Medical Posts', label: t.resourcesPage.medicalPosts },
    { key: 'Water / Ration Points', label: t.resourcesPage.waterRation },
    { key: 'Boat Rescue Points', label: t.resourcesPage.boatRescue },
  ];

  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      if (selectedDistrictId !== 'all' && res.districtId !== selectedDistrictId) return false;
      if (categoryFilter !== 'All' && res.category !== categoryFilter) return false;
      if (resourceSearch.trim()) {
        const q = resourceSearch.toLowerCase();
        return (
          res.name.toLowerCase().includes(q) ||
          res.area.toLowerCase().includes(q) ||
          res.landmark.toLowerCase().includes(q) ||
          res.availableSupplies.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [resources, selectedDistrictId, categoryFilter, resourceSearch]);

  const activeGuide =
    SAFETY_GUIDES.find((g) => g.id === activeGuideId) ?? SAFETY_GUIDES[0];

  const guideIconMap = {
    Waves,
    Mountain,
    Activity,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t.resourcesPage.heading}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t.resourcesPage.subtext}
          </p>
        </div>
        <DemoDataNoticeBadge />
      </div>

      <EmergencyStrip />
      <OfflineBanner />

      {/* Resource Directory */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t.resourcesPage.directoryTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.resourcesPage.directorySub}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                placeholder={t.resourcesPage.searchPlaceholder}
                aria-label="Search emergency resources"
                className="h-9 w-56 rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
          {categoryTabs.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategoryFilter(cat.key)}
              className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                categoryFilter === cat.key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredResources.length === 0 ? (
          <EmptyState
            title="No resources match your filters"
            description="Try selecting All categories or switching the district selector to All Districts."
            actionLabel="Show All Categories"
            onAction={() => {
              setCategoryFilter('All');
              setResourceSearch('');
            }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((res) => (
              <ResourceCard key={res.id} resource={res} />
            ))}
          </div>
        )}
      </section>

      {/* Emergency Helpline Cards */}
      <section className="space-y-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t.resourcesPage.helplinesTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.resourcesPage.helplinesSub}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EMERGENCY_HELPLINES.map((line) => (
            <div
              key={line.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {line.coverage}
                </p>
                <h4 className="mt-0.5 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  {line.name}
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {line.description}
                </p>
              </div>

              <a
                href={`tel:${line.number.replace(/[^+\d]/g, '')}`}
                className="mt-4 inline-flex min-h-[40px] items-center justify-between rounded-lg border border-blue-200 bg-blue-50/80 px-3.5 py-2 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-100 dark:border-blue-800/70 dark:bg-blue-950/50 dark:text-blue-200 dark:hover:bg-blue-900/60"
              >
                <span className="inline-flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {t.resourcesPage.callLabel} {line.number}
                  </span>
                </span>
                <span className="font-mono text-xs tabular-nums">tel:{line.number}</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Safety Guides Section with Language Switcher */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t.resourcesPage.guidesTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.resourcesPage.guidesSub}
            </p>
          </div>

          {/* Language Selector (synced with AppContext) */}
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <div
              role="group"
              aria-label="Safety guide language"
              className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
            >
              {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLanguage(code)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    language === code
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {LANGUAGE_LABELS[code].native}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {SAFETY_GUIDES.map((guide) => {
            const Icon = guideIconMap[guide.iconName];
            const active = guide.id === activeGuideId;
            return (
              <button
                key={guide.id}
                type="button"
                onClick={() => setActiveGuideId(guide.id)}
                className={`inline-flex min-h-[42px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{guide.title[language]}</span>
              </button>
            );
          })}
        </div>

        {/* Active Guide Content */}
        <div className="mt-5">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {activeGuide.summary[language]}
          </p>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            {(['before', 'during', 'after'] as const).map((phaseKey) => {
              const phase = activeGuide.phases[phaseKey];
              const badgeStyles =
                phaseKey === 'before'
                  ? 'text-blue-700 dark:text-blue-300'
                  : phaseKey === 'during'
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-emerald-700 dark:text-emerald-300';

              return (
                <div
                  key={phaseKey}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/50"
                >
                  <h4 className={`font-display text-sm font-bold ${badgeStyles}`}>
                    {phase.heading[language]}
                  </h4>
                  <ul className="mt-3 space-y-2.5">
                    {phase.items[language].map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                      >
                        <CheckSquare
                          className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
