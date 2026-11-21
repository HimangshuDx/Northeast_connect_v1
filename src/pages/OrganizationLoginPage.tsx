import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Moon,
  PhoneCall,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LANGUAGE_LABELS } from '../data/safetyGuides';
import {
  canAccessCoordinatorDesk,
  DEMO_ACCOUNTS,
  getRoleDisplayLabel,
  isValidEmail,
} from '../services/authService';
import { LanguageCode } from '../types';

const BACKDROP_IMAGE_PATH = '/src/assets/images/ne_india_topo_backdrop_1795248200820.jpg';

export const OrganizationLoginPage: React.FC = () => {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    t,
    authSession,
    supabaseConfigured,
    signInOrganization,
    signInDemoRole,
    requestPasswordRecovery,
    signOutOrganization,
  } = useApp();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedRedirect = searchParams.get('redirect');
  const resetCallback = searchParams.get('reset') === '1';

  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recoverySentTo, setRecoverySentTo] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setErrorMsg(null);
  }, [view]);

  const resolveDestination = (role: typeof authSession.role): string => {
    if (requestedRedirect === '/coordinator') {
      return canAccessCoordinatorDesk(role) ? '/coordinator' : '/ngo';
    }
    if (requestedRedirect === '/ngo') {
      return '/ngo';
    }
    return canAccessCoordinatorDesk(role) ? '/coordinator' : '/ngo';
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setErrorMsg('Enter a valid organization email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Enter your password (at least 6 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const session = await signInOrganization(trimmedEmail, password, rememberMe);
      navigate(resolveDestination(session.role), { replace: true });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to sign in. Please verify your credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLaunch = async (demoEmail: string) => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const session = await signInDemoRole(demoEmail, rememberMe);
      navigate(resolveDestination(session.role), { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to activate demo account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRecoverySentTo(null);

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setErrorMsg('Enter the organization email address registered with your account.');
      return;
    }

    setSubmitting(true);
    try {
      await requestPasswordRecovery(trimmedEmail);
      setRecoverySentTo(trimmedEmail);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not send recovery email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* Subtle Regional Topographic Backdrop Band */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[320px] overflow-hidden bg-slate-950"
      >
        {!imageFailed && (
          <img
            src={BACKDROP_IMAGE_PATH}
            alt="Northeast India river valley and topographic contour texture"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover object-center opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/85 to-slate-100 dark:to-slate-950" />
      </div>

      {/* Top Portal Bar */}
      <header className="relative z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur-sm text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-slate-900/80 px-2.5 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{t.portal.backToRoles}</span>
              <span className="sm:hidden">Roles</span>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <Compass className="h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
              <span className="truncate font-display text-sm font-bold text-white">
                {t.brandName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:112"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700 whitespace-nowrap"
            >
              <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{t.portal.safetyBanner}</span>
              <span className="sm:hidden font-mono">112</span>
            </a>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              aria-label="Select application language"
              className="h-9 rounded-lg border border-white/15 bg-slate-900/80 px-2 text-xs font-medium text-white"
            >
              {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                <option key={code} value={code} className="bg-slate-900 text-white">
                  {LANGUAGE_LABELS[code].short}
                </option>
              ))}
            </select>

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

      {/* Main Portal Split Layout */}
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left Context & Governance Column */}
          <div className="space-y-5 lg:col-span-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-6 text-white shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-300">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Authorized Access Only</span>
              </div>

              <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl text-balance">
                {t.portal.loginHeading}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {t.portal.loginSubtext}
              </p>

              <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-950/40 p-3.5 text-xs text-amber-100">
                <p className="font-semibold text-amber-200">{t.portal.restrictedNotice}</p>
                <p className="mt-1 leading-relaxed text-amber-100/90">
                  Public self-registration is disabled. Accounts and roles are provisioned and verified by authorized disaster response administrators.
                </p>
              </div>

              <div className="mt-5 space-y-2.5 border-t border-slate-800 pt-4 text-xs text-slate-300">
                <p className="font-semibold uppercase tracking-wider text-slate-400">
                  Role Access Scope
                </p>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>
                    <strong className="text-white">NGO Member / Volunteer:</strong> Relief Operations Dashboard, verified help request feed, volunteer roster, and inventory.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                  <span>
                    <strong className="text-white">Coordinator / Admin:</strong> Coordinator Desk triage, report verification, corridor updates, and audit logs.
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-800 pt-4">
                <Link
                  to="/board"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-blue-200 hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Looking for Citizen Alerts or Quick SOS? Continue as Citizen →</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Authentication Card + Clearly Separated Demo Mode */}
          <div className="space-y-6 lg:col-span-7">
            {/* Active Session Notice if already signed in */}
            {authSession.isAuthenticated && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100">
                <div>
                  <p className="font-semibold">
                    Currently signed in as {authSession.fullName} ({getRoleDisplayLabel(authSession.role)})
                  </p>
                  <p className="text-xs opacity-80">
                    {authSession.organizationName} {authSession.isDemo ? '· DEMO MODE' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(resolveDestination(authSession.role))}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void signOutOrganization()}
                    className="inline-flex h-9 items-center rounded-lg border border-emerald-400/60 px-3 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Main Sign-In / Password Recovery Form Card */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              {resetCallback && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    Password recovery session detected. Complete your reset via the link sent by Supabase Auth, then sign in below.
                  </span>
                </div>
              )}

              {!supabaseConfigured && (
                <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Live Supabase Authentication is not configured in this build
                  </p>
                  <p className="mt-1">
                    Set <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
                    <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> to enable live Supabase organization accounts, or use the clearly labeled{' '}
                    <strong>DEMO MODE</strong> accounts below.
                  </p>
                </div>
              )}

              {view === 'login' ? (
                <form onSubmit={(e) => void handleSignInSubmit(e)} noValidate className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                      Organization Sign In
                    </h2>
                    <span className="font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {supabaseConfigured ? 'Supabase Auth Ready' : 'Local Evaluation Mode'}
                    </span>
                  </div>

                  {errorMsg && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="org-email"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                    >
                      Organization Email
                    </label>
                    <div className="relative mt-1.5">
                      <Mail
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        id="org-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="responder@organization.org"
                        className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="org-password"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                    >
                      Password
                    </label>
                    <div className="relative mt-1.5">
                      <KeyRound
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        id="org-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                      />
                      <span>Remember me on this trusted device</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{submitting ? 'Verifying Credentials...' : 'Sign In'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={(e) => void handleRecoverySubmit(e)} noValidate className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                      Reset Organization Password
                    </h2>
                    <button
                      type="button"
                      onClick={() => setView('login')}
                      className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
                    >
                      Back to Sign In
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Enter your registered organization email. If Supabase Auth is configured, a password recovery link will be emailed to you.
                  </p>

                  {errorMsg && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {recoverySentTo && (
                    <div className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        Recovery request submitted for <strong>{recoverySentTo}</strong>. Check your inbox for the reset link.
                      </span>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="recovery-email"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                    >
                      Organization Email
                    </label>
                    <div className="relative mt-1.5">
                      <Mail
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        id="recovery-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="responder@organization.org"
                        className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    <span>Send Recovery Link</span>
                  </button>
                </form>
              )}
            </section>

            {/* Clearly Separated Hackathon Demo Mode Section */}
            <section
              aria-label="Hackathon Demo Mode Accounts"
              className="rounded-2xl border border-amber-300 bg-amber-50/70 p-5 dark:border-amber-800/80 dark:bg-amber-950/25"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-200 px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-950 dark:bg-amber-900 dark:text-amber-100">
                    DEMO MODE
                  </span>
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                    Hackathon Role Evaluation Accounts
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-amber-900 dark:text-amber-200">
                  Separated from live Supabase Auth
                </span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                Use these clearly marked sample demo identities to evaluate role-based access control without creating real accounts. Live deployments use Supabase Auth +{' '}
                <code className="font-mono">public.organization_profiles</code> (see{' '}
                <code className="font-mono">docs/AUTH_SETUP.md</code>).
              </p>

              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleDemoLaunch(acc.email)}
                    className="flex flex-col justify-between rounded-xl border border-amber-300/90 bg-white p-3 text-left transition-colors hover:border-blue-500 hover:bg-blue-50/40 dark:border-amber-800/70 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-slate-800"
                  >
                    <div>
                      <span className="font-mono text-[11px] font-bold uppercase text-blue-700 dark:text-blue-400">
                        {acc.role}
                      </span>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-900 dark:text-white">
                        {acc.fullName}
                      </p>
                      <p className="truncate font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {acc.email}
                      </p>
                      <p className="mt-1.5 text-[11px] leading-snug text-slate-600 dark:text-slate-300">
                        {acc.description}
                      </p>
                    </div>
                    <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                      <span>Launch Demo</span>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
