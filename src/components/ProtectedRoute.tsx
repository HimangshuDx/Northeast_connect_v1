import React from 'react';
import { ArrowLeft, Lock, LogIn, ShieldAlert, ShieldX } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getRoleDisplayLabel } from '../services/authService';
import { UserRole } from '../types';
import { SkeletonCard } from './SkeletonCard';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  featureLabel: string;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  featureLabel,
  children,
}) => {
  const { authSession, authLoading, signOutOrganization, canAccessNgo } = useApp();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  if (allowedRoles.includes(authSession.role)) {
    return <>{children}</>;
  }

  const loginUrl = `/login?redirect=${encodeURIComponent(location.pathname)}`;

  // Case 1: Authenticated partner (e.g., NGO_MEMBER or VOLUNTEER) attempting Coordinator/Admin route
  if (authSession.isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl py-8">
        <div className="rounded-2xl border border-red-300 bg-white p-6 shadow-sm dark:border-red-900/70 dark:bg-slate-900 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-700 dark:bg-red-950/70 dark:text-red-400">
            <ShieldX className="h-6 w-6" aria-hidden="true" />
          </div>

          <h2 className="mt-4 font-display text-xl font-bold text-slate-900 dark:text-white">
            Access Denied — Insufficient Clearance
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <strong>{featureLabel}</strong> requires{' '}
            <code className="font-mono font-semibold">COORDINATOR</code> or{' '}
            <code className="font-mono font-semibold">ADMIN</code> authorization. Your current account (
            <strong>{authSession.email}</strong> · {getRoleDisplayLabel(authSession.role)}) does not have permission to view or modify official coordinator controls.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {canAccessNgo && (
              <Link
                to="/ngo"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <span>Open Relief Operations</span>
              </Link>
            )}

            <Link
              to="/board"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Situation Board</span>
            </Link>

            <button
              type="button"
              onClick={() => void signOutOrganization()}
              className="text-xs font-semibold text-slate-600 hover:underline dark:text-slate-400"
            >
              Sign Out &amp; Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Unauthenticated Citizen Guest visiting a protected Response Partner route
  return (
    <div className="mx-auto max-w-xl py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </div>

        <h2 className="mt-4 font-display text-xl font-bold text-slate-900 dark:text-white">
          Response Partner Sign-In Required
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <strong>{featureLabel}</strong> is restricted to authorized response organizations and disaster coordination personnel.
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span>
            Citizens do not need an account to view alerts, find shelters, or submit urgent help requests.
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to={loginUrl}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span>Organization Login</span>
          </Link>

          <Link
            to="/board"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Continue as Citizen</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
