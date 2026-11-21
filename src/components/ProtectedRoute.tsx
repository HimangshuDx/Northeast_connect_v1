import React from 'react';
import { ArrowLeft, Lock, LogIn, ShieldAlert, ShieldX } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getRoleDisplayLabel } from '../services/authService';
import { UserRole } from '../types';
import { AnimatedReveal } from './MotionPrimitives';
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
      <AnimatedReveal className="mx-auto max-w-xl py-8">
        <div className="rounded-2xl border border-red-300/80 ne-surface p-6 dark:border-red-500/35 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-200/80 dark:bg-red-950/70 dark:text-red-300 dark:ring-red-500/30">
            <ShieldX className="h-6 w-6" aria-hidden="true" />
          </div>

          <h2 className="mt-4 font-display text-xl font-bold text-slate-900 dark:text-[#e6edf7]">
            Access Denied — Insufficient Clearance
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[#b7c6dc]">
            <strong>{featureLabel}</strong> requires{' '}
            <code className="font-mono font-semibold">COORDINATOR</code> or{' '}
            <code className="font-mono font-semibold">ADMIN</code> authorization. Your current account (
            <strong>{authSession.email}</strong> · {getRoleDisplayLabel(authSession.role)}) does not have permission to view or modify official coordinator controls.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {canAccessNgo && (
              <Link
                to="/ngo"
                className="ne-btn-press inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <span>Open Relief Operations</span>
              </Link>
            )}

            <Link
              to="/board"
              className="ne-btn-press inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#c2cfe2] bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Situation Board</span>
            </Link>

            <button
              type="button"
              onClick={() => void signOutOrganization()}
              className="text-xs font-semibold text-slate-600 hover:underline dark:text-[#9cb0cc]"
            >
              Sign Out &amp; Switch Account
            </button>
          </div>
        </div>
      </AnimatedReveal>
    );
  }

  // Case 2: Unauthenticated Citizen Guest visiting a protected Response Partner route
  return (
    <AnimatedReveal className="mx-auto max-w-xl py-8">
      <div className="rounded-2xl border ne-surface p-6 sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200/80 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </div>

        <h2 className="mt-4 font-display text-xl font-bold text-slate-900 dark:text-[#e6edf7]">
          Response Partner Sign-In Required
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[#b7c6dc]">
          <strong>{featureLabel}</strong> is restricted to authorized response organizations and disaster coordination personnel.
        </p>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border ne-surface-subtle p-3.5 text-xs text-slate-600 dark:text-[#b7c6dc]">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span>
            Citizens do not need an account to view alerts, find shelters, or submit urgent help requests.
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to={loginUrl}
            className="ne-btn-press inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span>Organization Login</span>
          </Link>

          <Link
            to="/board"
            className="ne-btn-press inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#c2cfe2] bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Continue as Citizen</span>
          </Link>
        </div>
      </div>
    </AnimatedReveal>
  );
};
