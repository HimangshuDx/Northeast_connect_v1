import React, { useState } from 'react';
import {
  Activity,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  FilePlus2,
  Globe,
  Inbox,
  Moon,
  RefreshCw,
  Shield,
  Sun,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LANGUAGE_LABELS } from '../data/safetyGuides';
import { NORTHEAST_DISTRICTS } from '../data/sampleData';
import { LanguageCode } from '../types';
import { formatTimestamp } from '../utils/formatters';
import { OutboxDrawer } from './OutboxDrawer';
import { ToastContainer } from './ToastContainer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    t,
    selectedDistrictId,
    setSelectedDistrictId,
    isOnline,
    simulatedOffline,
    setSimulatedOffline,
    lastSyncedAt,
    refreshData,
    outbox,
    setIsOutboxOpen,
  } = useApp();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/', label: t.nav.situationBoard, shortLabel: t.nav.shortBoard, icon: Activity },
    { to: '/report', label: t.nav.reportHelp, shortLabel: t.nav.shortReport, icon: FilePlus2 },
    { to: '/resources', label: t.nav.resourcesGuides, shortLabel: t.nav.shortResources, icon: BookOpen },
    { to: '/coordinator', label: t.nav.coordinatorDesk, shortLabel: t.nav.shortCoordinator, icon: Shield },
  ];

  const queuedCount = outbox.filter(
    (item) => item.syncStatus === 'PENDING' || item.syncStatus === 'FAILED'
  ).length;

  const currentNav =
    navItems.find((n) =>
      n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)
    ) ?? navItems[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        {/* Desktop Collapsible Sidebar */}
        <aside
          aria-label="Primary navigation"
          className={`hidden md:flex md:flex-col md:sticky md:top-0 md:h-screen md:shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-[width] duration-200 ${
            sidebarCollapsed ? 'md:w-[74px]' : 'md:w-[256px]'
          }`}
        >
          {/* Brand Block */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
            <Link
              to="/"
              className="flex items-center gap-2.5 overflow-hidden focus-visible:outline-2 focus-visible:outline-blue-500 rounded-md"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Compass className="h-5 w-5" aria-hidden="true" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <span className="block truncate font-display text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {t.brandName}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {t.tagline}
                  </span>
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Primary Nav Links */}
          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex min-h-[42px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                    } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}

            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsOutboxOpen(true)}
                title={sidebarCollapsed ? t.nav.myOutbox : undefined}
                className={`flex min-h-[42px] w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 whitespace-nowrap ${
                  sidebarCollapsed ? 'justify-center px-2' : 'justify-between'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Inbox className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!sidebarCollapsed && <span>{t.nav.myOutbox}</span>}
                </span>
                {!sidebarCollapsed && (
                  <span
                    className={`font-mono text-xs tabular-nums rounded px-1.5 py-0.5 ${
                      queuedCount > 0
                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {queuedCount}
                  </span>
                )}
              </button>
            </div>
          </nav>

          {/* Bottom Sidebar Controls */}
          <div className="space-y-2 border-t border-slate-200 p-3 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSimulatedOffline(!simulatedOffline)}
              title="Toggle offline mode to test local device storage and Outbox queuing"
              className={`flex min-h-[38px] w-full items-center gap-2.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                !isOnline
                  ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/70 dark:bg-amber-950/60 dark:text-amber-200'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
            >
              {isOnline ? (
                <Wifi className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              ) : (
                <WifiOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              )}
              {!sidebarCollapsed && (
                <span className="truncate">
                  {simulatedOffline ? t.controls.offlineTestOn : t.controls.simulateOffline}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className={`flex min-h-[38px] w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap ${
                sidebarCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
              )}
              {!sidebarCollapsed && (
                <span>{theme === 'dark' ? t.controls.switchToLight : t.controls.switchToDark}</span>
              )}
            </button>
          </div>
        </aside>

        {/* Main Viewport Column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Workspace Bar */}
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95">
            {/* Mobile Compact Header (<= 52px) */}
            <div className="flex h-13 items-center justify-between gap-2 px-3 sm:px-4 md:hidden">
              <Link to="/" className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
                  <Compass className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="truncate font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t.brandName}
                </span>
              </Link>

              <div className="flex items-center gap-1.5 shrink-0">
                <label htmlFor="mobile-lang-select" className="sr-only">
                  {t.controls.languageLabel}
                </label>
                <select
                  id="mobile-lang-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                  aria-label="Select application language"
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                    <option key={code} value={code}>
                      {LANGUAGE_LABELS[code].short} · {LANGUAGE_LABELS[code].native}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setIsOutboxOpen(true)}
                  aria-label="Open My Outbox"
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  <Inbox className="h-3.5 w-3.5" />
                  <span className="font-mono tabular-nums">{queuedCount}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle color theme"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Desktop Header Row */}
            <div className="hidden md:flex items-center justify-between gap-4 px-6 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="truncate font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  {currentNav.label}
                </h1>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {/* Language Switcher */}
                <div className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 dark:border-slate-700 dark:bg-slate-800">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <label htmlFor="desktop-lang-select" className="sr-only">
                    {t.controls.languageLabel}
                  </label>
                  <select
                    id="desktop-lang-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                    aria-label="Select application language"
                    className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none dark:text-slate-100"
                  >
                    {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                      <option key={code} value={code} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                        {LANGUAGE_LABELS[code].native} ({LANGUAGE_LABELS[code].label})
                      </option>
                    ))}
                  </select>
                </div>

                <label htmlFor="desktop-district-select" className="sr-only">
                  Select District
                </label>
                <select
                  id="desktop-district-select"
                  value={selectedDistrictId}
                  onChange={(e) => setSelectedDistrictId(e.target.value)}
                  className="h-9 max-w-[190px] rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {NORTHEAST_DISTRICTS.map((dist) => (
                    <option key={dist.id} value={dist.id}>
                      {dist.id === 'all' ? t.controls.allNeDistricts : `${dist.name}, ${dist.state}`}
                    </option>
                  ))}
                </select>

                <div
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium whitespace-nowrap shrink-0 ${
                    isOnline
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/80 dark:bg-amber-950/60 dark:text-amber-200'
                  }`}
                >
                  {isOnline ? (
                    <Wifi className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span>{isOnline ? t.controls.online : t.controls.offline}</span>
                </div>

                <button
                  type="button"
                  onClick={() => void refreshData()}
                  title="Refresh cached local snapshot"
                  className="hidden lg:inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="font-mono tabular-nums">
                    {t.controls.syncedPrefix} {formatTimestamp(lastSyncedAt)}
                  </span>
                </button>

                <Link
                  to="/report?mode=help"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 whitespace-nowrap shrink-0"
                >
                  <FilePlus2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{t.controls.requestHelp}</span>
                </Link>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-5 pb-24 sm:px-6 md:py-6 md:pb-10">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation (compact <= 56px) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95 md:hidden"
      >
        <div className="grid grid-cols-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate max-w-full">{item.shortLabel}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <OutboxDrawer />
      <ToastContainer />
    </div>
  );
};
