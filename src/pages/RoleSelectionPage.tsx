import React, { useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  Globe,
  LifeBuoy,
  LogOut,
  Moon,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LANGUAGE_LABELS } from '../data/safetyGuides';
import { getRoleDisplayLabel } from '../services/authService';
import { LanguageCode } from '../types';

const BACKDROP_IMAGE_PATH = '/src/assets/images/ne_india_topo_backdrop_1795248200820.jpg';

const CITIZEN_FEATURES = [
  'Request Emergency Help.',
  'Report a Disaster.',
  'Access Safety Information.',
  'Find Shelters & Resources.',
  'View Local Disaster Alerts.',
];

const PARTNER_FEATURES = [
  'Access Relief Operations Dashboard.',
  'View Verified Assistance Requests.',
  'Coordinate Relief Operations.',
  'Manage Volunteers and Resources.',
  'Track Assistance Assignments.',
];

export const RoleSelectionPage: React.FC = () => {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    t,
    setExperienceMode,
    authSession,
    canAccessCoordinator,
    canAccessNgo,
    signOutOrganization,
  } = useApp();

  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);

  const handleContinueAsCitizen = () => {
    setExperienceMode('citizen');
    navigate('/board');
  };

  const handlePartnerAccess = () => {
    if (authSession.isAuthenticated && canAccessNgo) {
      setExperienceMode('ngo');
      navigate(canAccessCoordinator ? '/coordinator' : '/ngo');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* Atmospheric Northeast India Regional Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[440px] sm:h-[470px] overflow-hidden bg-slate-950"
      >
        {!imageFailed && (
          <img
            src={BACKDROP_IMAGE_PATH}
            alt="Topographic river valley and hill landscape of Northeast India"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover object-center opacity-50 dark:opacity-45"
          />
        )}
        {/* SVG Topographic Fallback & Cartographic Grid */}
        <svg
          className="absolute inset-0 h-full w-full opacity-25"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1200 480"
        >
          <path
            d="M-40 310 C 180 230, 320 350, 560 270 C 780 190, 960 290, 1240 200"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="1.2"
          />
          <path
            d="M-40 355 C 210 280, 380 390, 620 310 C 840 240, 1020 340, 1240 250"
            fill="none"
            stroke="#93c5fd"
            strokeWidth="0.9"
          />
          <path
            d="M-40 255 C 160 190, 340 285, 590 215 C 820 150, 990 235, 1240 155"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.8"
          />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/80 to-slate-100 dark:to-slate-950" />
      </div>

      {/* Top Public-Sector Header Bar */}
      <header className="relative z-10 border-b border-white/10 bg-slate-950/60 backdrop-blur-sm text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm ring-1 ring-white/20">
              <Compass className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="block truncate font-display text-base font-bold tracking-tight text-white">
                {t.brandName}
              </span>
              <span className="block truncate text-[11px] text-slate-300">
                {t.tagline}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:112"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-red-700 whitespace-nowrap"
            >
              <PhoneCall className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{t.portal.safetyBanner}</span>
              <span className="sm:hidden font-mono">112</span>
            </a>

            <div className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-slate-900/80 px-2.5 text-white">
              <Globe className="h-3.5 w-3.5 shrink-0 text-blue-400" aria-hidden="true" />
              <label htmlFor="portal-lang-select" className="sr-only">
                {t.controls.languageLabel}
              </label>
              <select
                id="portal-lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                aria-label="Select application language"
                className="bg-transparent text-xs font-medium text-white focus:outline-none"
              >
                {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                  <option key={code} value={code} className="bg-slate-900 text-white">
                    {LANGUAGE_LABELS[code].native}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-slate-900/80 text-slate-200 hover:bg-slate-800"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Role Selection Container */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero Branding Block */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">
            Northeast India Disaster Coordination Portal
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl text-balance">
            {t.brandName}
          </h1>
          <p className="mt-3 text-base font-semibold text-blue-100 sm:text-lg">
            {t.tagline}
          </p>
          <p className="mt-1.5 text-sm text-slate-200 sm:text-base">
            {t.portal.subtitle}
          </p>
        </div>

        {/* Active Partner Session Banner (only shown if already authenticated) */}
        {authSession.isAuthenticated && (
          <div className="mx-auto mt-6 flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-400/40 bg-slate-900/90 px-4 py-3 text-white shadow-md backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>
                Signed in as <strong>{authSession.fullName}</strong> (
                {getRoleDisplayLabel(authSession.role)})
              </span>
              {authSession.isDemo && (
                <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-200 ring-1 ring-amber-400/40">
                  DEMO MODE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePartnerAccess}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <span>
                  {canAccessCoordinator ? 'Open Coordinator Desk' : 'Open Relief Operations'}
                </span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => void signOutOrganization()}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/20 px-2.5 text-xs font-medium text-slate-200 hover:bg-white/10"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Two Large, Visually Distinct Access Cards */}
        <section
          aria-label="Choose your access mode"
          className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          {/* OPTION A: CITIZEN / PUBLIC ACCESS */}
          <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:ring-blue-800">
                  <LifeBuoy className="h-6 w-6" aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Public Access · No Account Required
                </span>
              </div>

              <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t.portal.citizenTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t.portal.citizenDescription}
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-slate-200 pt-5 dark:border-slate-800">
                {CITIZEN_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200"
                  >
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 space-y-2.5">
              <button
                type="button"
                onClick={handleContinueAsCitizen}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <span>{t.portal.citizenCta}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <div className="flex items-center justify-between gap-3 pt-1 text-xs">
                <Link
                  to="/report?mode=sos"
                  onClick={() => setExperienceMode('citizen')}
                  className="font-semibold text-red-700 hover:underline dark:text-red-400"
                >
                  Quick SOS / Request Urgent Help →
                </Link>
                <Link
                  to="/resources"
                  onClick={() => setExperienceMode('citizen')}
                  className="font-medium text-slate-600 hover:underline dark:text-slate-400"
                >
                  Shelters &amp; 112 Helplines
                </Link>
              </div>
            </div>
          </article>

          {/* OPTION B: NGO / RESPONSE ORGANIZATION */}
          <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white ring-1 ring-slate-700 dark:bg-slate-800 dark:text-blue-300 dark:ring-slate-700">
                  <Building2 className="h-6 w-6" aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Authorized Personnel · Role Verified
                </span>
              </div>

              <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t.portal.partnerTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t.portal.partnerDescription}
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-slate-200 pt-5 dark:border-slate-800">
                {PARTNER_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200"
                  >
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 space-y-2.5">
              <button
                type="button"
                onClick={handlePartnerAccess}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-800 dark:ring-1 dark:ring-slate-700 dark:hover:bg-slate-700"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>
                  {authSession.isAuthenticated && canAccessNgo
                    ? 'Enter Authorized Workspace'
                    : t.portal.partnerCta}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <p className="pt-1 text-xs text-slate-500 dark:text-slate-400">
                {t.portal.restrictedNotice} NGO &amp; Volunteer roles access Relief Operations; Coordinator Desk requires Coordinator clearance.
              </p>
            </div>
          </article>
        </section>

        {/* Persistent Safety Notice & Honest Scope Disclosure */}
        <section
          aria-label="Emergency notice and platform scope"
          className="mt-8 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-xs text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:px-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
              <span>
                <a
                  href="tel:112"
                  className="font-bold text-red-700 underline underline-offset-2 hover:text-red-800 dark:text-red-400"
                >
                  {t.portal.safetyBanner}
                </a>{' '}
                {t.portal.scopeNote}
              </span>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-slate-500 dark:text-slate-400">
              Offline-ready · Outbox &amp; SMS fallback
            </span>
          </div>
        </section>
      </main>
    </div>
  );
};
