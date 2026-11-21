import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

const CHUNK_RELOAD_GUARD_KEY = 'ne_connect_chunk_reload_v1';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected application error.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#09111f] px-4 text-center text-[#eef2f7]">
          <div className="max-w-md rounded-2xl border border-[#1f3250] bg-[#101b2e] p-6 shadow-xl">
            <h1 className="font-display text-lg font-bold">Northeast Connect needed to recover</h1>
            <p className="mt-2 text-sm text-[#9cb0cc]">
              A new update or offline cache hiccup interrupted this screen. Reloading restores the latest version without losing your saved Outbox items.
            </p>
            <p className="mt-2 font-mono text-xs text-slate-400">{this.state.message}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="min-h-[44px] rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Reload App
              </button>
              <a
                href="tel:112"
                className="inline-flex min-h-[44px] items-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Call 112
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

if (typeof window !== 'undefined') {
  // Recover cleanly once if a deploy invalidates a lazy-loaded JS chunk hash
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    try {
      const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY) === '1';
      if (!alreadyReloaded) {
        sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, '1');
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  });

  if ('serviceWorker' in navigator) {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        // Periodically check for updated service workers so deploys propagate cleanly
        window.setInterval(() => {
          if (navigator.onLine) {
            void registration.update();
          }
        }, 60 * 60 * 1000);
      },
      onRegisterError(error) {
        console.warn('[Northeast Connect] Service worker registration skipped:', error);
      },
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
