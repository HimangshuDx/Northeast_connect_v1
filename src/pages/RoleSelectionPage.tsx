import React, { useState } from 'react';
import { motion } from 'motion/react';
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
import { NE_EASE } from '../components/MotionPrimitives';
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
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#f1f5f9] text-slate-900 dark:bg-[#09111f] dark:text-[#e6edf7]">
      {/* Full-Width Dark Navy Hero Backdrop with Subtle Landscape, Topographic Lines & Smooth Transition */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px] sm:h-[540px] overflow-hidden bg-[#0a1a35] dark:bg-[#071124]"
      >
        {!imageFailed && (
          <img
            src={BACKDROP_IMAGE_PATH}
            alt="Topographic river valley and hill landscape of Northeast India"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="h-[82%] w-full object-cover object-center opacity-22 saturate-75 dark:opacity-20"
          />
        )}

        {/* Subtle SVG Cartographic / Topographic Map Contour Lines */}
        <svg
          className="absolute inset-0 h-[85%] w-full opacity-35 dark:opacity-25"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1200 460"
        >
          <path
            d="M-40 280 C 170 205, 330 325, 570 245 C 790 175, 975 275, 1240 185"
            fill="none"
            stroke="rgba(147, 197, 253, 0.34)"
            strokeWidth="1.1"
          />
          <path
            d="M-40 330 C 200 255, 370 365, 610 290 C 835 220, 1010 320, 1240 235"
            fill="none"
            stroke="rgba(125, 211, 252, 0.24)"
            strokeWidth="0.9"
          />
          <path
            d="M-40 215 C 165 155, 355 250, 595 180 C 815 115, 995 205, 1240 130"
            fill="none"
            stroke="rgba(191, 219, 254, 0.22)"
            strokeWidth="0.8"
          />
          <path
            d="M-40 150 C 210 105, 420 185, 670 120 C 885 65, 1055 140, 1240 85"
            fill="none"
            stroke="rgba(147, 197, 253, 0.16)"
            strokeWidth="0.8"
          />
        </svg>

        {/* Deep Navy Atmospheric Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#08162d]/72 via-[#0d2244]/82 via-50% to-[#f1f5f9] dark:from-[#060f1f]/75 dark:via-[#0b1b36]/84 dark:via-50% dark:to-[#09111f]" />
        {/* Smooth Lower Feather Blend into Off-White / Midnight Canvas */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent via-[#f1f5f9]/78 to-[#f1f5f9] dark:via-[#09111f]/78 dark:to-[#09111f]" />
      </div>

      {/* Top Public-Sector Header Bar */}
      <header className="relative z-10 border-b border-white/10 bg-[#08162d]/85 text-white backdrop-blur-md dark:border-[#1c2e4a] dark:bg-[#071122]/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/15 text-sky-300">
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

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <a
              href="tel:112"
              className="ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-red-700 whitespace-nowrap"
            >
              <PhoneCall className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{t.portal.safetyBanner}</span>
              <span className="sm:hidden font-mono">112</span>
            </a>

            <div className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 text-white transition-colors hover:bg-white/15">
              <Globe className="h-3.5 w-3.5 shrink-0 text-sky-300" aria-hidden="true" />
              <label htmlFor="portal-lang-select" className="sr-only">
                {t.controls.languageLabel}
              </label>
              <select
                id="portal-lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                aria-label="Select application language"
                className="max-w-[74px] sm:max-w-none bg-transparent text-xs font-medium text-white focus:outline-none"
              >
                {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                  <option
                    key={code}
                    value={code}
                    className="bg-white text-slate-900 dark:bg-[#101b2e] dark:text-[#e6edf7]"
                  >
                    {LANGUAGE_LABELS[code].native}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="ne-btn-press inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/15 bg-white/10 text-slate-100 transition-colors hover:bg-white/15"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-300" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4 text-slate-100" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Role Selection Container */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-10 sm:px-6 sm:py-12">
        {/* Centered Hero Header Section (immediately visible, not gated behind opacity animation) */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: NE_EASE }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300 sm:text-xs">
            NORTHEAST INDIA DISASTER COORDINATION PORTAL
          </p>
          <h1 className="mt-2.5 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl text-balance">
            {t.brandName}
          </h1>
          <p className="mt-3 text-base font-medium text-slate-100 sm:text-lg">
            {t.tagline}
          </p>
          <p className="mt-1.5 text-sm text-slate-200 sm:text-base">
            Real-time flood &amp; landslide alerts, safe shelters, and offline-ready emergency help for Northeast India.
          </p>
        </motion.div>

        {/* Active Partner Session Banner (shown only if already signed in) */}
        {authSession.isAuthenticated && (
          <div className="mx-auto mt-6 flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#0f2547]/90 px-4 py-3 text-white shadow-sm backdrop-blur-sm dark:border-[#2d456b] dark:bg-[#101e36]/95">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <ShieldCheck
                className="h-4 w-4 shrink-0 text-emerald-400"
                aria-hidden="true"
              />
              <span>
                Signed in as <strong>{authSession.fullName}</strong> (
                {getRoleDisplayLabel(authSession.role)})
              </span>
              {authSession.isDemo && (
                <span className="rounded bg-amber-400/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-200">
                  DEMO MODE
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePartnerAccess}
                className="ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <span>
                  {canAccessCoordinator ? 'Open Coordinator Desk' : 'Open Relief Operations'}
                </span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => void signOutOrganization()}
                className="ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-medium text-white hover:bg-white/15"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Two Equally Sized Side-by-Side Access Cards */}
        <section
          aria-label="Choose your access mode"
          className="mt-8 grid grid-cols-1 items-stretch gap-6 sm:mt-10 lg:grid-cols-2"
        >
          {/* LEFT CARD — CITIZEN ACCESS */}
          <article className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.10),0_2px_6px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-150 hover:border-slate-300 hover:shadow-[0_16px_36px_-10px_rgba(15,23,42,0.14)] dark:border-[#1f3250] dark:bg-[#101b2e] dark:shadow-[0_14px_34px_-8px_rgba(2,6,23,0.65)] dark:hover:border-[#2d456b] sm:p-8">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/80 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30">
                  <LifeBuoy className="h-6 w-6" aria-hidden="true" />
                </div>
                <span className="text-right text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  PUBLIC ACCESS · NO ACCOUNT REQUIRED
                </span>
              </div>

              <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-[#eef2f7]">
                {t.portal.citizenTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[#b7c6dc]">
                {t.portal.citizenDescription}
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-slate-200/80 pt-5 dark:border-[#1f3250]">
                {CITIZEN_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-[#d5e0f0]"
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
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <Link
                  to="/report?mode=sos"
                  onClick={() => setExperienceMode('citizen')}
                  className="ne-btn-press flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-xs hover:bg-red-700"
                >
                  <span>Request help</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>

                <button
                  type="button"
                  onClick={handleContinueAsCitizen}
                  className="ne-btn-press flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-xs hover:bg-blue-700"
                >
                  <span>View situation</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <Link
                  to="/resources"
                  onClick={() => setExperienceMode('citizen')}
                  className="inline-flex min-h-[44px] items-center font-medium text-slate-700 hover:underline dark:text-[#b7c6dc]"
                >
                  Shelters, Relief Camps &amp; 112 Helplines →
                </Link>
              </div>
            </div>
          </article>

          {/* RIGHT CARD — RESPONSE PARTNER */}
          <article className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.10),0_2px_6px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-150 hover:border-slate-300 hover:shadow-[0_16px_36px_-10px_rgba(15,23,42,0.14)] dark:border-[#1f3250] dark:bg-[#101b2e] dark:shadow-[0_14px_34px_-8px_rgba(2,6,23,0.65)] dark:hover:border-[#2d456b] sm:p-8">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0f2547] text-white ring-1 ring-[#1a3968] dark:bg-[#172742] dark:text-blue-300 dark:ring-[#2d456b]">
                  <Building2 className="h-6 w-6" aria-hidden="true" />
                </div>
                <span className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-blue-300">
                  AUTHORIZED PERSONNEL · ROLE VERIFIED
                </span>
              </div>

              <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-[#eef2f7]">
                {t.portal.partnerTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[#b7c6dc]">
                {t.portal.partnerDescription}
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-slate-200/80 pt-5 dark:border-[#1f3250]">
                {PARTNER_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-[#d5e0f0]"
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

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={handlePartnerAccess}
                className="ne-btn-press flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0f2547] px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#163461] dark:bg-[#1a2f52] dark:ring-1 dark:ring-[#2d456b] dark:hover:bg-[#223b66]"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>
                  {authSession.isAuthenticated && canAccessNgo
                    ? 'Enter Authorized Workspace'
                    : t.portal.partnerCta}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <p className="pt-0.5 text-xs leading-relaxed text-slate-600 dark:text-[#9cb0cc]">
                {t.portal.restrictedNotice} NGO &amp; Volunteer roles access Relief Operations; Coordinator Desk requires Coordinator clearance.
              </p>
            </div>
          </article>
        </section>

        {/* Persistent Safety Notice & Honest Scope Disclosure */}
        <section
          aria-label="Emergency notice and platform scope"
          className="mt-8 rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 text-xs text-slate-700 shadow-xs dark:border-[#1f3250] dark:bg-[#101b2e] dark:text-[#b7c6dc] sm:px-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
              <span>
                <a
                  href="tel:112"
                  className="inline-flex min-h-[44px] items-center font-bold text-red-700 underline underline-offset-2 hover:text-red-800 dark:text-red-400"
                >
                  {t.portal.safetyBanner}
                </a>{' '}
                {t.portal.scopeNote}
              </span>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-slate-600 dark:text-[#9cb0cc]">
              Offline-ready · Outbox &amp; SMS fallback
            </span>
          </div>
        </section>
      </main>
    </div>
  );
};
