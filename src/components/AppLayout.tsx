import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  FilePlus2,
  Globe,
  HandHeart,
  Home,
  Inbox,
  LifeBuoy,
  Lock,
  LogIn,
  LogOut,
  Moon,
  RefreshCw,
  Shield,
  Sun,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LANGUAGE_LABELS } from '../data/safetyGuides';
import { NORTHEAST_DISTRICTS } from '../data/sampleData';
import { getRoleDisplayLabel } from '../services/authService';
import { ExperienceMode, LanguageCode } from '../types';
import { formatSyncAge, formatTimestamp } from '../utils/formatters';
import { PageTransition } from './MotionPrimitives';
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
    experienceMode,
    setExperienceMode,
    t,
    selectedDistrictId,
    setSelectedDistrictId,
    isOnline,
    realOnline,
    simulatedOffline,
    setSimulatedOffline,
    lastSyncedAt,
    refreshData,
    outbox,
    setIsOutboxOpen,
    authSession,
    canAccessNgo,
    canAccessCoordinator,
    signOutOrganization,
  } = useApp();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [, setSyncTick] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const id = window.setInterval(() => setSyncTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/ngo')) {
      if (experienceMode !== 'ngo') setExperienceMode('ngo');
    } else if (
      location.pathname.startsWith('/board') ||
      location.pathname.startsWith('/citizen') ||
      location.pathname.startsWith('/report')
    ) {
      if (experienceMode !== 'citizen') setExperienceMode('citizen');
    }
  }, [location.pathname, experienceMode, setExperienceMode]);

  const handleSwitchExperience = (mode: ExperienceMode) => {
    setExperienceMode(mode);
    if (mode === 'ngo') {
      navigate(canAccessNgo ? '/ngo' : '/login?redirect=/ngo');
    } else {
      navigate('/board');
    }
  };

  const citizenNavItems = [
    { to: '/board', label: t.nav.situationBoard, shortLabel: t.nav.shortBoard, icon: Activity },
    { to: '/report?mode=sos', matchPath: '/report', label: t.nav.reportHelp, shortLabel: t.nav.shortReport, icon: FilePlus2 },
    { to: '/resources', label: t.nav.resourcesGuides, shortLabel: t.nav.shortResources, icon: BookOpen },
  ];

  const ngoNavItem = {
    to: '/ngo',
    label: t.experience.reliefOps,
    shortLabel: t.experience.shortReliefOps,
    icon: HandHeart,
  };

  const adminNavItem = {
    to: '/coordinator',
    label: t.nav.coordinatorDesk,
    shortLabel: t.nav.shortCoordinator,
    icon: Shield,
  };

  const queuedCount = outbox.filter(
    (item) => item.syncStatus === 'PENDING' || item.syncStatus === 'FAILED'
  ).length;

  const isCoordinatorRoute = location.pathname.startsWith('/coordinator');
  const isNgoRoute = location.pathname.startsWith('/ngo');

  const pageTitle = isCoordinatorRoute
    ? t.nav.coordinatorDesk
    : isNgoRoute
    ? t.experience.reliefOps
    : location.pathname.startsWith('/report')
    ? t.nav.reportHelp
    : location.pathname.startsWith('/resources')
    ? t.nav.resourcesGuides
    : t.nav.situationBoard;

  const modeContextLabel = isCoordinatorRoute
    ? t.experience.adminSeparator
    : experienceMode === 'ngo' || isNgoRoute
    ? t.experience.ngoMode
    : t.experience.citizenMode;

  const mobileNavItems =
    experienceMode === 'ngo'
      ? [
          { to: '/ngo', matchPath: '/ngo', label: t.experience.shortReliefOps, icon: HandHeart, end: false },
          { to: '/board', matchPath: '/board', label: t.nav.shortBoard, icon: Activity, end: false },
          { to: '/resources', matchPath: '/resources', label: t.nav.shortResources, icon: BookOpen, end: false },
          { to: '/report?mode=sos', matchPath: '/report', label: t.nav.shortReport, icon: LifeBuoy, end: false },
        ]
      : [
          { to: '/board', matchPath: '/board', label: t.nav.shortBoard, icon: Activity, end: false },
          { to: '/report?mode=sos', matchPath: '/report', label: t.nav.shortReport, icon: FilePlus2, end: false },
          { to: '/resources', matchPath: '/resources', label: t.nav.shortResources, icon: BookOpen, end: false },
          { to: '/ngo', matchPath: '/ngo', label: t.experience.shortReliefOps, icon: HandHeart, end: false },
        ];

  return (
    <div className="min-h-screen ne-canvas">
      <div className="flex min-h-screen">
        {/* Desktop Collapsible Sidebar */}
        <aside
          aria-label="Primary navigation"
          className={`hidden md:flex md:flex-col md:sticky md:top-0 md:h-screen md:shrink-0 border-r border-[#dce4f0] bg-white dark:border-[#1f3250] dark:bg-[#0d1728] transition-[width] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            sidebarCollapsed ? 'md:w-[74px]' : 'md:w-[264px]'
          }`}
        >
          {/* Brand Block */}
          <div
            className={`flex border-b border-[#dce4f0] dark:border-[#1f3250] ${
              sidebarCollapsed
                ? 'flex-col items-center gap-2 px-2 py-3.5'
                : 'items-center justify-between gap-2 px-4 py-4'
            }`}
          >
            <Link
              to="/board"
              title={sidebarCollapsed ? t.brandName : undefined}
              className={`flex items-center overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-blue-500 ${
                sidebarCollapsed ? 'justify-center' : 'min-w-0 gap-2.5'
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#102341] text-white shadow-xs dark:bg-blue-600">
                <Compass className="h-5 w-5" aria-hidden="true" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <span className="block truncate font-display text-sm font-bold tracking-tight text-slate-900 dark:text-[#e6edf7]">
                    {t.brandName}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500 dark:text-[#8295b3]">
                    {t.tagline}
                  </span>
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`ne-btn-press inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-[#edf2f8] hover:text-slate-900 dark:text-[#8295b3] dark:hover:bg-[#172742] dark:hover:text-[#e6edf7] ${
                sidebarCollapsed ? 'h-7 w-9' : 'shrink-0 p-1.5'
              }`}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Dual Audience Mode Switcher */}
          {!sidebarCollapsed ? (
            <div className="border-b border-[#dce4f0] p-3 dark:border-[#1f3250]">
              <div
                role="group"
                aria-label="Experience mode"
                className="grid grid-cols-2 gap-1.5 rounded-xl border border-[#dce4f0] bg-[#edf2f8] p-1 dark:border-[#1f3250] dark:bg-[#09111f]"
              >
                <button
                  type="button"
                  onClick={() => handleSwitchExperience('citizen')}
                  className={`ne-btn-press flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    experienceMode === 'citizen' && !isCoordinatorRoute
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white/75 dark:text-[#b7c6dc] dark:hover:bg-[#172742]'
                  }`}
                >
                  <LifeBuoy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Need Help</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchExperience('ngo')}
                  className={`ne-btn-press flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    experienceMode === 'ngo' && !isCoordinatorRoute
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white/75 dark:text-[#b7c6dc] dark:hover:bg-[#172742]'
                  }`}
                >
                  <HandHeart className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Want to Help</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 border-b border-[#dce4f0] p-2 dark:border-[#1f3250]">
              <button
                type="button"
                onClick={() => handleSwitchExperience('citizen')}
                title={t.experience.citizenMode}
                className={`ne-btn-press flex h-9 w-9 items-center justify-center rounded-lg ${
                  experienceMode === 'citizen' && !isCoordinatorRoute
                    ? 'bg-red-600 text-white'
                    : 'text-slate-600 hover:bg-[#edf2f8] dark:text-[#8295b3] dark:hover:bg-[#172742]'
                }`}
              >
                <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleSwitchExperience('ngo')}
                title={t.experience.ngoMode}
                className={`ne-btn-press flex h-9 w-9 items-center justify-center rounded-lg ${
                  experienceMode === 'ngo' && !isCoordinatorRoute
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-[#edf2f8] dark:text-[#8295b3] dark:hover:bg-[#172742]'
                }`}
              >
                <HandHeart className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Primary Nav Links */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {!sidebarCollapsed && (
              <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#7e91b0]">
                {t.experience.citizenMode}
              </p>
            )}
            {citizenNavItems.map((item) => {
              const Icon = item.icon;
              const isManualActive = item.matchPath
                ? location.pathname.startsWith(item.matchPath)
                : item.to === '/board'
                ? location.pathname === '/board' || location.pathname === '/citizen'
                : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={() =>
                    `ne-btn-press flex min-h-[40px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      isManualActive
                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/80 dark:bg-blue-500/14 dark:text-blue-300 dark:ring-blue-500/25'
                        : 'text-slate-700 hover:bg-[#edf2f8] hover:text-slate-900 dark:text-[#b7c6dc] dark:hover:bg-[#172742] dark:hover:text-[#e6edf7]'
                    } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}

            <div className="mt-3 border-t border-[#dce4f0] pt-3 dark:border-[#1f3250]">
              {!sidebarCollapsed && (
                <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#7e91b0]">
                  {t.experience.ngoMode}
                </p>
              )}
              <NavLink
                to={ngoNavItem.to}
                title={sidebarCollapsed ? ngoNavItem.label : undefined}
                className={({ isActive }) =>
                  `ne-btn-press flex min-h-[40px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-500/14 dark:text-emerald-300 dark:ring-emerald-500/25'
                      : 'text-slate-700 hover:bg-[#edf2f8] hover:text-slate-900 dark:text-[#b7c6dc] dark:hover:bg-[#172742] dark:hover:text-[#e6edf7]'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <HandHeart className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!sidebarCollapsed && <span className="truncate">{ngoNavItem.label}</span>}
              </NavLink>
            </div>

            <div className="mt-3 border-t border-[#dce4f0] pt-3 dark:border-[#1f3250]">
              {!sidebarCollapsed && (
                <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#7e91b0]">
                  {t.experience.adminSeparator}
                </p>
              )}
              <NavLink
                to={adminNavItem.to}
                title={
                  sidebarCollapsed
                    ? adminNavItem.label
                    : !canAccessCoordinator
                    ? 'Restricted to Coordinator / Admin accounts'
                    : undefined
                }
                className={({ isActive }) =>
                  `ne-btn-press flex min-h-[40px] items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/80 dark:bg-blue-500/14 dark:text-blue-300 dark:ring-blue-500/25'
                      : 'text-slate-700 hover:bg-[#edf2f8] hover:text-slate-900 dark:text-[#b7c6dc] dark:hover:bg-[#172742] dark:hover:text-[#e6edf7]'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!sidebarCollapsed && <span className="truncate">{adminNavItem.label}</span>}
                </span>
                {!sidebarCollapsed && !canAccessCoordinator && (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-[#7e91b0]" aria-hidden="true" />
                )}
              </NavLink>

              <button
                type="button"
                onClick={() => setIsOutboxOpen(true)}
                title={sidebarCollapsed ? t.nav.myOutbox : undefined}
                className={`ne-btn-press mt-1 flex min-h-[40px] w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-[#edf2f8] hover:text-slate-900 dark:text-[#b7c6dc] dark:hover:bg-[#172742] dark:hover:text-[#e6edf7] whitespace-nowrap ${
                  sidebarCollapsed ? 'justify-center px-2' : 'justify-between'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Inbox className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!sidebarCollapsed && <span>{t.nav.myOutbox}</span>}
                </span>
                {!sidebarCollapsed && (
                  <span
                    className={`font-mono text-xs tabular-nums rounded-md px-1.5 py-0.5 ${
                      queuedCount > 0
                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/18 dark:text-amber-200'
                        : 'bg-[#edf2f8] text-slate-600 dark:bg-[#172742] dark:text-[#8295b3]'
                    }`}
                  >
                    {queuedCount}
                  </span>
                )}
              </button>
            </div>
          </nav>

          {/* Bottom Sidebar Controls & Role Session */}
          <div className="space-y-2 border-t border-[#dce4f0] p-3 dark:border-[#1f3250]">
            {!sidebarCollapsed && (
              <div className="rounded-xl border ne-surface-subtle p-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-slate-900 dark:text-[#e6edf7]">
                    {authSession.isAuthenticated ? authSession.fullName : 'Citizen Guest'}
                  </span>
                  {authSession.isDemo && (
                    <span className="shrink-0 rounded bg-amber-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-950 dark:bg-amber-500/20 dark:text-amber-200">
                      DEMO
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-[#8295b3]">
                  {getRoleDisplayLabel(authSession.role)}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#dce4f0] pt-2 dark:border-[#1f3250]">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 dark:text-[#b7c6dc] dark:hover:text-white"
                  >
                    <Home className="h-3 w-3" aria-hidden="true" />
                    <span>Role Home</span>
                  </Link>
                  {authSession.isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => void signOutOrganization()}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 hover:underline dark:text-red-400"
                    >
                      <LogOut className="h-3 w-3" aria-hidden="true" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline dark:text-blue-400"
                    >
                      <LogIn className="h-3 w-3" aria-hidden="true" />
                      <span>Partner Login</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSimulatedOffline(!simulatedOffline)}
              title="Toggle offline mode to test local device storage and Outbox queuing"
              className={`ne-btn-press flex min-h-[38px] w-full items-center gap-2.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                !isOnline
                  ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-200'
                  : 'border-[#dce4f0] bg-[#f8fafd] text-slate-700 hover:bg-[#edf2f8] dark:border-[#1f3250] dark:bg-[#142239] dark:text-[#b7c6dc] dark:hover:bg-[#1e3152]'
              } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
            >
              {isOnline ? (
                <Wifi className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              ) : (
                <WifiOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              )}
              {!sidebarCollapsed && (
                <span className="truncate">
                  {!realOnline
                    ? t.offlineBanner.actualTitle
                    : simulatedOffline
                    ? t.controls.offlineTestOn
                    : t.controls.simulateOffline}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className={`ne-btn-press flex min-h-[38px] w-full items-center gap-2.5 rounded-lg border border-[#dce4f0] bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-[#edf2f8] dark:border-[#1f3250] dark:bg-[#142239] dark:text-[#e6edf7] dark:hover:bg-[#1e3152] whitespace-nowrap ${
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
          <header className="sticky top-0 z-20 border-b border-[#dce4f0] bg-white/92 backdrop-blur-sm dark:border-[#1f3250] dark:bg-[#0d1728]/92">
            {/* Mobile Compact Header (<= 52px) */}
            <div className="flex h-13 items-center justify-between gap-2 px-3 sm:px-4 md:hidden">
              <Link to="/board" className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#102341] text-white dark:bg-blue-600">
                  <Compass className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="truncate font-display text-sm font-bold text-slate-900 dark:text-[#e6edf7]">
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
                  className="ne-input h-9 rounded-lg border px-2 text-xs font-medium"
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
                  className="ne-btn-press inline-flex h-9 items-center gap-1 rounded-lg border border-[#c2cfe2] bg-white px-2 text-xs font-medium text-slate-700 dark:border-[#2d456b] dark:bg-[#142239] dark:text-[#e6edf7]"
                >
                  <Inbox className="h-3.5 w-3.5" />
                  <span className="font-mono tabular-nums">{queuedCount}</span>
                </button>

                <Link
                  to="/coordinator"
                  aria-label={t.nav.coordinatorDesk}
                  title={t.nav.coordinatorDesk}
                  className={`ne-btn-press inline-flex h-9 w-9 items-center justify-center rounded-lg border ${
                    isCoordinatorRoute
                      ? 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300'
                      : 'border-[#c2cfe2] bg-white text-slate-700 dark:border-[#2d456b] dark:bg-[#142239] dark:text-[#e6edf7]'
                  }`}
                >
                  <Shield className="h-4 w-4" aria-hidden="true" />
                </Link>

                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle color theme"
                  className="ne-btn-press inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#c2cfe2] bg-white text-slate-700 dark:border-[#2d456b] dark:bg-[#142239] dark:text-[#e6edf7]"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Desktop Header Row */}
            <div className="hidden md:flex items-center justify-between gap-4 px-6 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`text-xs font-semibold uppercase tracking-wider whitespace-nowrap shrink-0 ${
                    isCoordinatorRoute
                      ? 'text-blue-700 dark:text-blue-300'
                      : isNgoRoute || experienceMode === 'ngo'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {modeContextLabel}
                </span>
                <span className="text-slate-300 dark:text-[#2d456b]">/</span>
                <h1 className="truncate font-display text-base font-semibold text-slate-900 dark:text-[#e6edf7]">
                  {pageTitle}
                </h1>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {/* Language Switcher */}
                <div className="ne-input inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <label htmlFor="desktop-lang-select" className="sr-only">
                    {t.controls.languageLabel}
                  </label>
                  <select
                    id="desktop-lang-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                    aria-label="Select application language"
                    className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none dark:text-[#e6edf7]"
                  >
                    {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                      <option key={code} value={code} className="bg-white text-slate-900 dark:bg-[#101b2e] dark:text-[#e6edf7]">
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
                  className="ne-input h-9 max-w-[190px] rounded-lg border px-2.5 text-xs font-medium"
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
                      ? 'border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-300'
                      : 'border-amber-300/90 bg-amber-50 text-amber-900 dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-200'
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
                  title={`Refresh cached snapshot (${formatTimestamp(lastSyncedAt)})`}
                  className="ne-btn-press hidden lg:inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dce4f0] bg-[#f8fafd] px-2.5 text-xs text-slate-600 hover:bg-[#edf2f8] dark:border-[#1f3250] dark:bg-[#142239] dark:text-[#b7c6dc] dark:hover:bg-[#1e3152] whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="font-mono tabular-nums">
                    {t.controls.syncedPrefix} {formatSyncAge(lastSyncedAt)}
                  </span>
                </button>

                {isNgoRoute ? (
                  <Link
                    to="/report?mode=sos"
                    className="ne-btn-press inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-500/35 dark:bg-red-500/14 dark:text-red-300 dark:hover:bg-red-500/20 whitespace-nowrap shrink-0"
                  >
                    <LifeBuoy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{t.controls.requestHelp}</span>
                  </Link>
                ) : (
                  <Link
                    to="/report?mode=sos"
                    className="ne-btn-press inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-red-700 whitespace-nowrap shrink-0"
                  >
                    <FilePlus2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{t.controls.requestHelp}</span>
                  </Link>
                )}
              </div>
            </div>
          </header>

          {/* Main Content with Smooth Route Transition */}
          <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-5 pb-24 sm:px-6 md:py-6 md:pb-10">
            <PageTransition routeKey={location.pathname}>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation (compact <= 56px, 4 items max) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#dce4f0] bg-white/95 backdrop-blur-sm dark:border-[#1f3250] dark:bg-[#0d1728]/95 md:hidden"
      >
        <div className="grid grid-cols-4">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.matchPath === '/board'
                ? location.pathname === '/board' || location.pathname === '/citizen'
                : location.pathname.startsWith(item.matchPath);
            const activeColor = item.to.startsWith('/ngo')
              ? 'text-emerald-600 dark:text-emerald-400'
              : item.to.startsWith('/report')
              ? 'text-red-600 dark:text-red-400'
              : 'text-blue-600 dark:text-blue-400';
            const indicatorBg = item.to.startsWith('/ngo')
              ? 'bg-emerald-600 dark:bg-emerald-400'
              : item.to.startsWith('/report')
              ? 'bg-red-600 dark:bg-red-400'
              : 'bg-blue-600 dark:bg-blue-400';

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={`relative flex h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors ${
                  active
                    ? activeColor
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#8295b3] dark:hover:text-[#e6edf7]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-nav-indicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    className={`absolute top-0 h-0.5 w-10 rounded-b-full ${indicatorBg}`}
                    aria-hidden="true"
                  />
                )}
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate max-w-full">{item.label}</span>
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
